import { prisma } from '../database/client'
import type { AllergenType } from '~/types/allergen'

/**
 * Process intolerances from Spoonacular API and convert to allergens
 */
export function processIntolerances(intolerances?: string[]): AllergenType[] {
  if (!intolerances || intolerances.length === 0) {
    return []
  }

  const allergenMap: Record<string, AllergenType> = {
    'gluten': 'gluten',
    'dairy': 'dairy',
    'egg': 'eggs',
    'tree nut': 'nuts',
    'peanut': 'peanuts',
    'shellfish': 'shellfish',
    'fish': 'fish',
    'soy': 'soy',
    'wheat': 'wheat',
    'sulfite': 'sulfites',
    'sesame': 'sesame',
    'celery': 'celery',
    'mustard': 'mustard',
    'lupin': 'lupin',
    'mollusc': 'molluscs'
  }

  return intolerances
    .map(intolerance => allergenMap[intolerance.toLowerCase()])
    .filter(Boolean) as AllergenType[]
}

/**
 * Store allergens for a recipe
 */
export async function storeRecipeAllergens(recipeId: number, allergens: AllergenType[]): Promise<void> {
  if (allergens.length === 0) {
    return
  }

  // Delete existing allergens for this recipe
  await prisma.recipeAllergen.deleteMany({
    where: { recipeId }
  })

  // Insert new allergens
  await prisma.recipeAllergen.createMany({
    data: allergens.map(allergen => ({
      recipeId,
      allergen,
      severity: getSeverityForAllergen(allergen)
    }))
  })
}

/**
 * Get allergens for a recipe
 */
export async function getRecipeAllergens(recipeId: number): Promise<AllergenType[]> {
  const allergens = await prisma.recipeAllergen.findMany({
    where: { recipeId },
    select: { allergen: true }
  })

  return allergens.map(a => a.allergen as AllergenType)
}

/**
 * Determine severity for an allergen
 */
function getSeverityForAllergen(allergen: AllergenType): 'warning' | 'critical' {
  const criticalAllergens: AllergenType[] = [
    'eggs', 'nuts', 'peanuts', 'shellfish', 'fish', 'sesame', 'molluscs'
  ]

  return criticalAllergens.includes(allergen) ? 'critical' : 'warning'
}

/**
 * Check if recipe contains specific allergens
 */
export async function recipeContainsAllergens(recipeId: number, allergens: AllergenType[]): Promise<boolean> {
  if (allergens.length === 0) {
    return false
  }

  const recipeAllergens = await prisma.recipeAllergen.findMany({
    where: {
      recipeId,
      allergen: { in: allergens }
    }
  })

  return recipeAllergens.length > 0
}
