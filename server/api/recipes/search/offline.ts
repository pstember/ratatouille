import { SpoonacularRecipeService } from '~/server/services/spoonacular-recipe-service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchQuery = query.q as string
  
  if (!searchQuery) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Search query is required'
    })
  }
  
  const recipeService = new SpoonacularRecipeService()
  
  try {
    const results = await recipeService.searchRecipesOffline(searchQuery)
    
    return {
      success: true,
      results,
      totalResults: results.length,
      offline: true,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to search offline recipes'
    })
  }
})
