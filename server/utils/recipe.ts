import { prisma } from '../database/client'

/**
 * Mark a recipe as not new (viewed)
 * This is useful when a user views a recipe detail page
 */
export async function markRecipeAsViewed(recipeId: number): Promise<void> {
  try {
    await prisma.recipe.update({
      where: { id: recipeId },
      data: { isNew: false }
    })
  } catch (error) {
    console.error('Error marking recipe as viewed:', error)
  }
}

/**
 * Get recipes that are marked as new
 */
export async function getNewRecipes(limit: number = 10): Promise<any[]> {
  try {
    return await prisma.recipe.findMany({
      where: { isNew: true },
      take: limit,
      include: {
        nutrition: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  } catch (error) {
    console.error('Error getting new recipes:', error)
    return []
  }
}

/**
 * Clear all "new" flags from recipes
 * This can be useful for maintenance or after a certain time period
 */
export async function clearAllNewFlags(): Promise<void> {
  try {
    await prisma.recipe.updateMany({
      where: { isNew: true },
      data: { isNew: false }
    })
  } catch (error) {
    console.error('Error clearing new flags:', error)
  }
}
