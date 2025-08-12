import { SpoonacularRecipeService } from '~/server/services/spoonacular-recipe-service'
import type { RecipeSearchParams } from '~/server/utils/spoonacular-recipes'
import { 
  SpoonacularQuotaExceededError,
  SpoonacularRateLimitError 
} from '~/server/utils/spoonacular-error-handler'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const recipeService = new SpoonacularRecipeService()
  
  try {
    const result = await recipeService.searchRecipes(query as RecipeSearchParams)
    
    return {
      success: true,
      ...result,
      quotaInfo: result.quotaInfo
    }
  } catch (error) {
    if (error instanceof SpoonacularQuotaExceededError) {
      throw createError({
        statusCode: 402,
        statusMessage: 'API quota exceeded. Please try again later.'
      })
    }
    
    if (error instanceof SpoonacularRateLimitError) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Rate limit exceeded. Please try again later.'
      })
    }
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    })
  }
})
