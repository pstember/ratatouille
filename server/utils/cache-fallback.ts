import { prisma } from '../database/client'
import type { RecipeSearchResult } from '~/types/recipe'

export async function getCachedRecipes(limit: number = 20): Promise<RecipeSearchResult[]> {
  try {
    // Return recently cached recipes as fallback
    const cachedRecipes = await prisma.recipe.findMany({
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: { nutrition: true }
    })
    
    return cachedRecipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      servings: recipe.servings,
      readyInMinutes: recipe.readyInMinutes,
      cuisine: recipe.cuisine,
      nutrition: recipe.nutrition,
      isNew: recipe.isNew,
      cached: true // Indicate this is cached data
    }))
  } catch (error) {
    console.error('Cache fallback error:', error)
    return []
  }
}
