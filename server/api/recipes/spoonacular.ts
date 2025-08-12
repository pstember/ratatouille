import { cacheService } from '../../utils/cache'
import { QuotaMonitor } from '../../utils/quota-monitor'
import { ApiErrorHandler } from '../../utils/api-error-handler'
import { transformAndStoreRecipe } from '../../utils/recipe-transformer'
import type { RecipeSearchParams, RecipeSearchResponse, SpoonacularRecipe } from '~/types/recipe'
import type { EnhancedSearchResponse } from '~/types/search'

export default defineEventHandler(async (event): Promise<EnhancedSearchResponse> => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  const confirmedQuotaUsage = query.confirmedQuotaUsage === 'true'
  const userConsent = query.userConsent === 'true'
  
  if (!userConsent) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User consent required for Spoonacular search'
    })
  }
  
  const searchParams: RecipeSearchParams = {
    query: (query.q || query.query) as string,
    offset: parseInt(query.offset as string) || 0,
    number: parseInt(query.number as string) || 12,
    addRecipeInformation: true,
    addRecipeNutrition: true,
    category: query.category as string
  }

  // Generate cache key for Spoonacular search
  const cacheKey = cacheService.generateKey('spoonacular_search', {
    ...searchParams,
    category: searchParams.category || 'all'
  })
  
  // Try to get from cache first
  const cachedResults = await cacheService.get(cacheKey)
  if (cachedResults) {
    return cachedResults
  }

  try {
    // Check quota status
    const currentQuotaInfo = QuotaMonitor.getCurrentQuotaInfo()
    
    if (currentQuotaInfo && QuotaMonitor.shouldRequireConfirmation(currentQuotaInfo) && !confirmedQuotaUsage) {
      return {
        results: [],
        offset: 0,
        number: 0,
        totalResults: 0,
        searchSource: 'api',
        databaseResults: {
          count: 0,
          totalAvailable: 0
        },
        quotaWarning: ApiErrorHandler.createQuotaWarningResponse(currentQuotaInfo),
        requiresQuotaConfirmation: true,
        quotaInfo: currentQuotaInfo
      }
    }

    // Perform Spoonacular API search
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
      const { getCategoryFilter } = await import('../../utils/recipe-transformer')
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
    const quotaInfo = QuotaMonitor.extractQuotaFromResponse(response)
    
    // Check if quota warning is needed after this request
    if (quotaInfo && QuotaMonitor.shouldRequireConfirmation(quotaInfo) && !confirmedQuotaUsage) {
      return {
        results: [],
        offset: 0,
        number: 0,
        totalResults: 0,
        searchSource: 'api',
        databaseResults: {
          count: 0,
          totalAvailable: 0
        },
        quotaWarning: ApiErrorHandler.createQuotaWarningResponse(quotaInfo),
        requiresQuotaConfirmation: true,
        quotaInfo
      }
    }

    // Transform and store results
    const transformedResults = await Promise.all(
      response.results.map(async (recipe) => {
        return await transformAndStoreRecipe(recipe, searchParams.category)
      })
    )

    const result: EnhancedSearchResponse = {
      results: transformedResults,
      offset: response.offset,
      number: response.number,
      totalResults: response.totalResults,
      searchSource: 'api',
      databaseResults: {
        count: 0,
        totalAvailable: 0
      },
      quotaInfo
    }

    // Cache the results
    await cacheService.set(cacheKey, result, { type: 'spoonacular_search' })

    return result
  } catch (error) {
    console.error('Spoonacular search error:', error)
    
    // Handle rate limit errors specifically
    if (ApiErrorHandler.isRateLimitError(error)) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Rate Limit Exceeded',
        data: {
          errorType: 'RATE_LIMIT_EXCEEDED',
          message: 'API rate limit reached. Please try again later.',
          retryAfter: error.headers?.['retry-after'] || 60,
          searchSource: 'api',
          databaseResults: {
            count: 0,
            totalAvailable: 0
          }
        }
      })
    }
    
    if (ApiErrorHandler.isQuotaExceededError(error)) {
      throw createError({
        statusCode: 402,
        statusMessage: 'Daily Quota Exceeded',
        data: {
          errorType: 'QUOTA_EXCEEDED',
          message: 'Daily API quota has been reached. Please try again tomorrow.',
          searchSource: 'api',
          databaseResults: {
            count: 0,
            totalAvailable: 0
          }
        }
      })
    }
    
    // Generic error handling
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to search Spoonacular API',
      data: {
        errorType: 'GENERIC_ERROR',
        message: 'An unexpected error occurred while searching external API. Please try again.',
        searchSource: 'api',
        databaseResults: {
          count: 0,
          totalAvailable: 0
        }
      }
    })
  }
})
