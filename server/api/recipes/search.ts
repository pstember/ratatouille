import { defineEventHandler, getQuery } from 'h3'
import { DatabaseSearchService } from '~/server/utils/database-search'
import { DatabaseEnrichmentService } from '~/server/utils/database-enrichment'
import { QuotaService } from '~/server/utils/quota-service'
import { CacheService } from '~/server/utils/cache'
import { searchRecipes } from '~/server/utils/spoonacular-recipes'
import { handleSpoonacularError } from '~/server/utils/spoonacular-error-handler'
import type { EnhancedSearchResponse } from '~/types/search'
import type { RecipeSearchParams } from '~/types/recipe'

const databaseSearchService = new DatabaseSearchService()
const enrichmentService = new DatabaseEnrichmentService()
const cacheService = new CacheService()

export default defineEventHandler(async (event): Promise<EnhancedSearchResponse> => {
  const query = getQuery(event)
  const { mode, ...searchParams } = query
  
  const searchMode = mode as 'database' | 'spoonacular' || 'database'
  
  console.log(`🔍 Search API called with mode: ${searchMode}`)
  console.log(`📝 Search params:`, searchParams)
  
  if (searchMode === 'database') {
    console.log(`📊 Performing database search...`)
    return await performDatabaseSearch(searchParams as any)
  } else if (searchMode === 'spoonacular') {
    console.log(`🌐 Performing Spoonacular search...`)
    return await performSpoonacularSearch(searchParams as any)
  }
  
  // Default to database search
  console.log(`📊 Defaulting to database search...`)
  return await performDatabaseSearch(searchParams as any)
})

async function performDatabaseSearch(params: RecipeSearchParams): Promise<EnhancedSearchResponse> {
  try {
    // Check cache first
    const cacheKey = `db_search_${JSON.stringify(params)}`
    const cachedResult = await cacheService.get(cacheKey)
    
    if (cachedResult) {
      return {
        ...cachedResult,
        searchSource: 'database',
        searchMode: 'database',
        databaseResults: {
          count: cachedResult.results.length,
          totalAvailable: cachedResult.totalResults
        }
      }
    }

    // Perform database search
    const dbParams = {
      query: params.query || '',
      offset: parseInt(params.offset as string) || 0,
      limit: parseInt(params.number as string) || 12,
      category: params.category
    }

    const dbResult = await databaseSearchService.searchRecipes(dbParams)
    
    const response: EnhancedSearchResponse = {
      results: dbResult.recipes,
      offset: parseInt(params.offset as string) || 0,
      number: parseInt(params.number as string) || 12,
      totalResults: dbResult.totalCount,
      searchSource: 'database',
      searchMode: 'database',
      databaseResults: {
        count: dbResult.recipes.length,
        totalAvailable: dbResult.totalCount
      }
    }

    // Cache the result
    await cacheService.set(cacheKey, response, 300) // 5 minutes cache

    return response
  } catch (error) {
    console.error('Database search error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Database search failed'
    })
  }
}

async function performSpoonacularSearch(params: RecipeSearchParams): Promise<EnhancedSearchResponse> {
  try {
    // Check quota before proceeding
    const quotaInfo = await QuotaService.checkQuota()
    if (!quotaInfo.hasQuota) {
      throw createError({
        statusCode: 402,
        statusMessage: 'Daily API quota exceeded'
      })
    }

    // Check cache first
    const cacheKey = `spoonacular_search_${JSON.stringify(params)}`
    const cachedResult = await cacheService.get(cacheKey)
    
    if (cachedResult) {
      console.log('⚠️ Using cached result, bypassing database storage')
      return {
        ...cachedResult,
        searchSource: 'spoonacular',
        searchMode: 'spoonacular',
        spoonacularResults: {
          count: cachedResult.results.length,
          enrichedRecipes: 0,
          quotaUsed: 0
        }
      }
    }

    // Call Spoonacular API using our direct REST implementation
    const spoonacularResponse = await searchRecipes({
      query: params.query,
      cuisine: params.cuisine,
      diet: params.diet,
      intolerances: params.intolerances,
      equipment: params.equipment,
      includeIngredients: params.includeIngredients,
      excludeIngredients: params.excludeIngredients,
      type: params.type,
      maxReadyTime: params.maxReadyTime,
      minProtein: params.minProtein,
      maxProtein: params.maxProtein,
      minFat: params.minFat,
      maxFat: params.maxFat,
      minCarbs: params.minCarbs,
      maxCarbs: params.maxCarbs,
      addRecipeInformation: params.addRecipeInformation || true,
      addRecipeNutrition: params.addRecipeNutrition || true,
      fillIngredients: true,
      addRecipeInstructions: params.addRecipeInstructions,
      offset: parseInt(params.offset as string) || 0,
      number: parseInt(params.number as string) || 12
    })

    // Transform and enrich database
    const transformedRecipes = await Promise.all(
      spoonacularResponse.results.map(async (recipe: any) => {
        // Transform nutrition data from Spoonacular format to our format
        let nutritionData = null
        if (recipe.nutrition && recipe.nutrition.nutrients) {
          const nutrition: any = {}
          recipe.nutrition.nutrients.forEach((nutrient: any) => {
            const name = nutrient.name.toLowerCase()
            if (name.includes('calories')) nutrition.calories = nutrient.amount
            else if (name.includes('protein')) nutrition.protein = nutrient.amount
            else if (name.includes('fat')) nutrition.fat = nutrient.amount
            else if (name.includes('carbohydrate')) nutrition.carbs = nutrient.amount
            else if (name.includes('fiber')) nutrition.fiber = nutrient.amount
            else if (name.includes('sugar')) nutrition.sugar = nutrient.amount
            else if (name.includes('sodium')) nutrition.sodium = nutrient.amount
          })
          nutritionData = nutrition
        }

        // Transform recipe to our format for storage
        const recipeForStorage = {
          id: recipe.id,
          title: recipe.title,
          image: recipe.image,
          servings: recipe.servings,
          readyInMinutes: recipe.readyInMinutes,
          cuisine: recipe.cuisines?.[0] || null,
          isNew: false,
          nutrition: nutritionData,
          allergens: [], // Will be populated if available
          ingredients: recipe.extendedIngredients || [],
          summary: recipe.summary,
          instructions: recipe.instructions,
          sourceUrl: recipe.sourceUrl,
          sourceName: recipe.sourceName
        }

        // Store in database for future searches
        try {
          console.log(`🔍 Attempting to store recipe ${recipe.id} in database...`)
          console.log(`📝 Recipe data being passed:`, {
            id: recipeForStorage.id,
            title: recipeForStorage.title,
            hasNutrition: !!recipeForStorage.nutrition,
            nutritionKeys: recipeForStorage.nutrition ? Object.keys(recipeForStorage.nutrition) : []
          })
          const storeResult = await enrichmentService.storeRecipe(recipeForStorage)
          console.log(`✅ Store result for recipe ${recipe.id}:`, storeResult)
        } catch (error) {
          console.error(`❌ Failed to store recipe ${recipe.id}:`, error)
        }
        
        // Return transformed recipe for API response
        return {
          id: recipe.id,
          title: recipe.title,
          image: recipe.image,
          servings: recipe.servings,
          readyInMinutes: recipe.readyInMinutes,
          cuisine: recipe.cuisines?.[0] || null,
          isNew: false,
          nutrition: nutritionData,
          allergens: [], // Will be populated if available
          _source: 'spoonacular' as const
        }
      })
    )

    const enrichedCount = transformedRecipes.length

    const response: EnhancedSearchResponse = {
      results: transformedRecipes,
      offset: parseInt(params.offset as string) || 0,
      number: parseInt(params.number as string) || 12,
      totalResults: spoonacularResponse.totalResults,
      searchSource: 'spoonacular',
      searchMode: 'spoonacular',
      databaseResults: {
        count: 0,
        totalAvailable: 0
      },
      spoonacularResults: {
        count: transformedRecipes.length,
        enrichedRecipes: enrichedCount,
        quotaUsed: 1
      },
      enrichmentStats: {
        newRecipes: enrichedCount,
        updatedRecipes: 0,
        totalEnriched: enrichedCount
      },
      quotaInfo: spoonacularResponse.quotaInfo || quotaInfo
    }

    // Cache the result
    await cacheService.set(cacheKey, response, 3600) // 1 hour cache for API results

    return response
  } catch (error: any) {
    console.error('Spoonacular search error:', error)
    
    // Extract quota information from error if available
    const quotaInfo = error.quotaInfo || null
    
    // Handle Spoonacular-specific errors
    if (error.statusCode === 402) {
      // Update quota monitor with exceeded status
      const exceededQuotaInfo = await QuotaService.updateQuotaExceeded()
      throw createError({
        statusCode: 402,
        statusMessage: 'Daily API quota exceeded',
        data: { quotaInfo: exceededQuotaInfo } // Include updated quota info in error response
      })
    } else if (error.statusCode === 429) {
      throw createError({
        statusCode: 429,
        statusMessage: 'API rate limit exceeded',
        data: { quotaInfo } // Include quota info in error response
      })
    } else {
      throw createError({
        statusCode: 500,
        statusMessage: 'External API search failed',
        data: { quotaInfo } // Include quota info in error response
      })
    }
  }
}
