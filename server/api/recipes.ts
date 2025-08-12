import { prisma } from '../database/client'
import { cacheService } from '../utils/cache'
import { processIntolerances, storeRecipeAllergens, getRecipeAllergens } from '../utils/allergen'
import { getAllergenInfo } from '~/types/allergen'
import { QuotaService } from '../utils/quota-service'
import { ApiErrorHandler } from '../utils/api-error-handler'
import { getCachedRecipes } from '../utils/cache-fallback'
import { transformAndStoreRecipe, transformDatabaseRecipes } from '../utils/recipe-transformer'
import { databaseSearchService } from '../utils/database-search'

// Debug import
console.log('🔧 Database search service imported:', !!databaseSearchService)
import type { RecipeSearchParams, RecipeSearchResponse, SpoonacularRecipe, RecipeFilter } from '~/types/recipe'
import type { EnhancedSearchResponse, DatabaseSearchParams } from '~/types/search'

export default defineEventHandler(async (event): Promise<EnhancedSearchResponse> => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  const confirmedQuotaUsage = query.confirmedQuotaUsage === 'true'
  const userConsent = query.userConsent === 'true'
  
  const searchParams: RecipeSearchParams = {
    query: (query.q || query.query) as string,
    offset: parseInt(query.offset as string) || 0,
    number: parseInt(query.number as string) || 12,
    addRecipeInformation: true,
    addRecipeNutrition: true,
    category: query.category as string
  }

  // Generate cache key for enhanced search
  const cacheKey = cacheService.generateKey('enhanced_recipe_search', {
    ...searchParams,
    category: searchParams.category || 'all',
    userConsent: userConsent.toString()
  })
  
  // Try to get from cache first
  const cachedResults = await cacheService.get(cacheKey)
  if (cachedResults) {
    return cachedResults
  }

  try {
    console.log('🔍 Starting database-first search with params:', searchParams)
    
    // Phase 1: Database Search First
    const databaseParams: DatabaseSearchParams = {
      query: searchParams.query || '',
      offset: searchParams.offset,
      limit: searchParams.number,
      category: searchParams.category,
      filters: searchParams.category ? getCategoryFilters(searchParams.category) : undefined
    }

    console.log('📊 Database search params:', databaseParams)
    
    let databaseResult
    try {
      databaseResult = await databaseSearchService.searchRecipes(databaseParams)
      console.log('📊 Database search result:', {
        count: databaseResult.recipes.length,
        totalCount: databaseResult.totalCount,
        source: databaseResult.source
      })
    } catch (error) {
      console.error('❌ Database search error:', error)
      throw error
    }
    
    const transformedDatabaseResults = transformDatabaseRecipes(databaseResult.recipes)
    console.log('🔄 Transformed database results count:', transformedDatabaseResults.length)
    
    // Phase 2: Assess Result Quality
    const qualityAssessment = databaseSearchService.assessResultQuality(
      databaseResult.recipes, 
      searchParams.query || ''
    )

    // Phase 3: Determine Search Strategy
    const shouldUseDatabaseOnly = qualityAssessment.isSufficient && !userConsent
    const shouldOfferSpoonacular = !qualityAssessment.isSufficient || userConsent

    // If database results are sufficient and no user consent for API, return database results
    if (shouldUseDatabaseOnly) {
      const result: EnhancedSearchResponse = {
        results: transformedDatabaseResults,
        offset: searchParams.offset,
        number: searchParams.number,
        totalResults: databaseResult.totalCount,
        searchSource: 'database',
        databaseResults: {
          count: transformedDatabaseResults.length,
          totalAvailable: databaseResult.totalCount
        },
        qualityAssessment
      }

      // Cache the database results
      await cacheService.set(cacheKey, result, { type: 'database_search' })
      return result
    }

    // Phase 4: Check Quota and User Consent for Spoonacular
    const currentQuotaInfo = QuotaService.getCurrentQuotaInfo()
    
    // If we have quota info and it's above threshold, check confirmation
    if (currentQuotaInfo && QuotaService.shouldRequireConfirmation(currentQuotaInfo) && !confirmedQuotaUsage) {
      return {
        results: transformedDatabaseResults,
        offset: searchParams.offset,
        number: searchParams.number,
        totalResults: databaseResult.totalCount,
        searchSource: 'database',
        databaseResults: {
          count: transformedDatabaseResults.length,
          totalAvailable: databaseResult.totalCount
        },
        spoonacularOption: {
          available: true,
          estimatedCost: 1,
          quotaWarning: true
        },
        qualityAssessment,
        quotaWarning: ApiErrorHandler.createQuotaWarningResponse(currentQuotaInfo),
        requiresQuotaConfirmation: true,
        quotaInfo: currentQuotaInfo
      }
    }

    // Phase 5: Perform Spoonacular Search if User Consented
    if (userConsent && confirmedQuotaUsage) {
      const apiResult = await performSpoonacularSearch(searchParams, config)
      
      // Combine results if we have both database and API results
      const combinedResults = [...transformedDatabaseResults, ...apiResult.results]
      const totalResults = databaseResult.totalCount + apiResult.totalResults
      
      const result: EnhancedSearchResponse = {
        results: combinedResults,
        offset: searchParams.offset,
        number: searchParams.number,
        totalResults,
        searchSource: combinedResults.length > 0 ? 'mixed' : 'api',
        databaseResults: {
          count: transformedDatabaseResults.length,
          totalAvailable: databaseResult.totalCount
        },
        quotaInfo: apiResult.quotaInfo,
        qualityAssessment
      }

      // Cache the combined results
      await cacheService.set(cacheKey, result, { type: 'mixed_search' })
      return result
    }

    // Phase 6: Return Database Results with Spoonacular Option
    const result: EnhancedSearchResponse = {
      results: transformedDatabaseResults,
      offset: searchParams.offset,
      number: searchParams.number,
      totalResults: databaseResult.totalCount,
      searchSource: 'database',
      databaseResults: {
        count: transformedDatabaseResults.length,
        totalAvailable: databaseResult.totalCount
      },
      spoonacularOption: {
        available: true,
        estimatedCost: 1,
        quotaWarning: currentQuotaInfo ? QuotaService.shouldRequireConfirmation(currentQuotaInfo) : false
      },
      qualityAssessment
    }

    // Cache the database results with option
    await cacheService.set(cacheKey, result, { type: 'database_search_with_option' })
    return result
  } catch (error) {
    console.error('Recipe search error:', error)
    
    // Handle rate limit errors specifically
    if (ApiErrorHandler.isRateLimitError(error)) {
      const fallbackData = await getCachedRecipes()
      const transformedFallback = transformDatabaseRecipes(fallbackData)
      
      throw createError({
        statusCode: 429,
        statusMessage: 'Rate Limit Exceeded',
        data: {
          errorType: 'RATE_LIMIT_EXCEEDED',
          message: 'API rate limit reached. Please try again later.',
          retryAfter: error.headers?.['retry-after'] || 60,
          fallbackData: transformedFallback, // Return cached data if available
          searchSource: 'database',
          databaseResults: {
            count: transformedFallback.length,
            totalAvailable: transformedFallback.length
          }
        }
      })
    }
    
    if (ApiErrorHandler.isQuotaExceededError(error)) {
      const fallbackData = await getCachedRecipes()
      const transformedFallback = transformDatabaseRecipes(fallbackData)
      
      // Update quota monitor with exceeded status
      const exceededQuotaInfo = await QuotaService.updateQuotaExceeded()
      
      throw createError({
        statusCode: 402,
        statusMessage: 'Daily Quota Exceeded',
        data: {
          errorType: 'QUOTA_EXCEEDED',
          message: 'Daily API quota has been reached. Please try again tomorrow.',
          fallbackData: transformedFallback, // Return cached data if available
          searchSource: 'database',
          databaseResults: {
            count: transformedFallback.length,
            totalAvailable: transformedFallback.length
          },
          quotaInfo: exceededQuotaInfo
        }
      })
    }
    
    // Generic error handling
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to search recipes',
      data: {
        errorType: 'GENERIC_ERROR',
        message: 'An unexpected error occurred. Please try again.'
      }
    })
  }
})

async function getPopularRecipes(params: RecipeSearchParams): Promise<EnhancedSearchResponse> {
  const cacheKey = cacheService.generateKey('popular_recipes', params)
  
  // Try cache first
  const cached = await cacheService.get(cacheKey)
  if (cached) {
    return cached
  }

  // Get from database using the database search service
  const databaseResult = await databaseSearchService.getPopularRecipes(params.offset, params.number)
  const transformedResults = transformDatabaseRecipes(databaseResult.recipes)

  const result: EnhancedSearchResponse = {
    results: transformedResults,
    offset: params.offset,
    number: params.number,
    totalResults: databaseResult.totalCount,
    searchSource: 'database',
    databaseResults: {
      count: transformedResults.length,
      totalAvailable: databaseResult.totalCount
    }
  }

  // Cache popular recipes
  await cacheService.set(cacheKey, result, { type: 'popular' })

  return result
}

/**
 * Get category filters for database search
 */
function getCategoryFilters(category: string) {
  const { getCategoryFilter } = require('../utils/recipe-transformer')
  const filter = getCategoryFilter(category)
  
  if (!filter) return undefined
  
  return {
    cuisine: filter.cuisine,
    maxTime: filter.maxTime,
    dietary: filter.dietary
  }
}

/**
 * Perform Spoonacular API search
 */
async function performSpoonacularSearch(searchParams: RecipeSearchParams, config: any): Promise<RecipeSearchResponse> {
  const apiUrl = `${config.public.apiBase}/complexSearch`
  const params = new URLSearchParams({
    apiKey: config.spoonacularApiKey,
    offset: searchParams.offset.toString(),
    number: searchParams.number.toString(),
    addRecipeInformation: 'true',
    addRecipeNutrition: 'true',
    fillIngredients: 'true',
    addRecipeInstructions: 'true'
  })

  // Add query if provided
  if (searchParams.query) {
    params.append('query', searchParams.query)
  }

  // Add category-specific filters
  if (searchParams.category) {
    const { getCategoryFilter } = await import('../utils/recipe-transformer')
    const filter = getCategoryFilter(searchParams.category)
    if (filter) {
      if (filter.maxTime) {
        params.append('maxReadyTime', filter.maxTime.toString())
      }
      if (filter.cuisine) {
        params.append('cuisine', filter.cuisine)
      }
      if (filter.type) {
        params.append('type', filter.type)
      }
      if (filter.dietary) {
        params.append('diet', filter.dietary)
      }
    }
  }

  const response = await $fetch<{ results: SpoonacularRecipe[], offset: number, number: number, totalResults: number }>(
    `${apiUrl}?${params}`
  )

  // Extract quota info from the response
      const quotaInfo = await QuotaService.extractQuotaFromResponse(response)

  // Transform and store results
  const transformedResults = await Promise.all(
    response.results.map(async (recipe) => {
      return await transformAndStoreRecipe(recipe, searchParams.category)
    })
  )

  return {
    results: transformedResults,
    offset: response.offset,
    number: response.number,
    totalResults: response.totalResults,
    quotaInfo
  }
}

// transformAndStoreRecipe function is now imported from ../utils/recipe-transformer

// Helper functions are now imported from ../utils/recipe-transformer
