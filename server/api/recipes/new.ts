import { getNewRecipes } from '../../utils/recipe'
import type { RecipeSearchResponse } from '~/types/recipe'

export default defineEventHandler(async (event): Promise<RecipeSearchResponse> => {
  const query = getQuery(event)
  
  const limit = parseInt(query.limit as string) || 12
  const offset = parseInt(query.offset as string) || 0

  try {
    const recipes = await getNewRecipes(limit + offset)
    
    // Apply pagination
    const paginatedRecipes = recipes.slice(offset, offset + limit)
    
    const result: RecipeSearchResponse = {
      results: paginatedRecipes.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        servings: recipe.servings,
        readyInMinutes: recipe.readyInMinutes,
        cuisine: recipe.cuisine,
        nutrition: recipe.nutrition,
        isNew: recipe.isNew
      })),
      offset,
      number: paginatedRecipes.length,
      totalResults: recipes.length
    }

    return result
  } catch (error) {
    console.error('Error fetching new recipes:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch new recipes'
    })
  }
})
