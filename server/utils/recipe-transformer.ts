import { prisma } from '../database/client'
import { processIntolerances, storeRecipeAllergens, getRecipeAllergens } from './allergen'
import { getAllergenInfo } from '~/types/allergen'
import { processImageUrl } from './image-url-processor'
import type { SpoonacularRecipe, RecipeSearchResult } from '~/types/recipe'

/**
 * Transform and store a Spoonacular recipe
 */
export async function transformAndStoreRecipe(spoonacularRecipe: SpoonacularRecipe, searchCategory?: string): Promise<RecipeSearchResult> {
  // Check if recipe already exists
  let recipe = await prisma.recipe.findUnique({
    where: { externalId: spoonacularRecipe.id },
    include: { nutrition: true }
  })

  // Determine cuisine from API response, search category, or recipe analysis
  let cuisine = spoonacularRecipe.cuisines?.[0] || null
  if (!cuisine && searchCategory) {
    const categoryFilter = getCategoryFilter(searchCategory)
    if (categoryFilter?.cuisine) {
      cuisine = categoryFilter.cuisine
    }
  }
  
  // If still no cuisine, try to infer from recipe title and ingredients
  if (!cuisine) {
    cuisine = inferCuisineFromRecipe(spoonacularRecipe)
  }

  if (!recipe) {
    // Process image URL before storing
    const processedImageUrl = processImageUrl(spoonacularRecipe.image, spoonacularRecipe.id)
    
    // Create new recipe
    recipe = await prisma.recipe.create({
      data: {
        externalId: spoonacularRecipe.id,
        title: spoonacularRecipe.title,
        image: processedImageUrl,
        servings: spoonacularRecipe.servings,
        readyInMinutes: spoonacularRecipe.readyInMinutes,
        sourceUrl: spoonacularRecipe.sourceUrl,
        sourceName: spoonacularRecipe.sourceName,
        summary: spoonacularRecipe.summary,
        instructions: spoonacularRecipe.instructions,
        cuisine: cuisine, // Use determined cuisine
        isNew: true, // Mark as new
        ingredients: {
          create: spoonacularRecipe.extendedIngredients?.map(ingredient => ({
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            aisle: ingredient.aisle
          })) || []
        },
        nutrition: {
          create: transformNutrition(spoonacularRecipe.nutrition)
        }
      },
      include: { nutrition: true }
    })

    // Process and store allergens
    const allergens = processIntolerances(spoonacularRecipe.intolerances)
    await storeRecipeAllergens(recipe.id, allergens)
  } else {
    // Recipe exists, update cuisine if available and mark as not new
    await prisma.recipe.update({
      where: { id: recipe.id },
      data: { 
        isNew: false,
        cuisine: cuisine || recipe.cuisine // Update cuisine if available
      }
    })
    recipe.isNew = false
    recipe.cuisine = cuisine || recipe.cuisine
  }

  // Get allergen information
  const allergens = await getRecipeAllergens(recipe.id)
  const allergenInfos = allergens.map(allergen => getAllergenInfo(allergen))

  return {
    id: recipe.id,
    title: recipe.title,
    image: processImageUrl(recipe.image, recipe.id),
    servings: recipe.servings,
    readyInMinutes: recipe.readyInMinutes,
    cuisine: recipe.cuisine,
    nutrition: recipe.nutrition,
    allergens: allergenInfos,
    instructions: recipe.instructions,
    isNew: recipe.isNew
  }
}

/**
 * Transform database Recipe to RecipeSearchResult format
 */
export function transformDatabaseRecipe(recipe: any): RecipeSearchResult {
  return {
    id: recipe.id,
    title: recipe.title,
    image: processImageUrl(recipe.image, recipe.id),
    servings: recipe.servings,
    readyInMinutes: recipe.readyInMinutes,
    sourceUrl: recipe.sourceUrl,
    sourceName: recipe.sourceName,
    summary: recipe.summary,
    instructions: recipe.instructions,
    cuisine: recipe.cuisine,
    isNew: recipe.isNew || false,
    nutrition: recipe.nutrition ? {
      calories: recipe.nutrition.calories,
      protein: recipe.nutrition.protein,
      fat: recipe.nutrition.fat,
      carbs: recipe.nutrition.carbs,
      fiber: recipe.nutrition.fiber,
      sugar: recipe.nutrition.sugar,
      sodium: recipe.nutrition.sodium
    } : undefined,
    allergens: recipe.allergens ? recipe.allergens.map((a: any) => ({
      allergen: a.allergen,
      severity: a.severity
    })) : [],
    ingredients: recipe.ingredients ? recipe.ingredients.map((i: any) => ({
      name: i.name,
      amount: i.amount,
      unit: i.unit,
      aisle: i.aisle
    })) : [],
    _source: 'database' // Internal flag to track data source
  }
}

/**
 * Transform multiple database recipes
 */
export function transformDatabaseRecipes(recipes: any[]): RecipeSearchResult[] {
  return recipes.map(transformDatabaseRecipe)
}

// Function to infer cuisine from recipe attributes
function inferCuisineFromRecipe(recipe: SpoonacularRecipe): string | null {
  const title = recipe.title.toLowerCase()
  const ingredients = recipe.extendedIngredients?.map(i => i.name.toLowerCase()) || []
  
  // Italian cuisine indicators
  if (title.includes('pasta') || title.includes('bruschetta') || title.includes('linguine') || 
      title.includes('farfalle') || title.includes('penne') || title.includes('tagliatelle') ||
      ingredients.some(i => i.includes('pasta') || i.includes('mozzarella') || i.includes('parmesan'))) {
    return 'italian'
  }
  
  // French cuisine indicators
  if (title.includes('ratatouille') || title.includes('quiche') || title.includes('souffle') ||
      title.includes('coq au vin') || title.includes('beef bourguignon')) {
    return 'french'
  }
  
  // Mexican cuisine indicators
  if (title.includes('enchilada') || title.includes('taco') || title.includes('quesadilla') ||
      title.includes('salsa') || title.includes('guacamole') || title.includes('mole')) {
    return 'mexican'
  }
  
  // Indian cuisine indicators
  if (title.includes('curry') || title.includes('tikka') || title.includes('masala') ||
      title.includes('dal') || title.includes('naan') || ingredients.some(i => i.includes('curry'))) {
    return 'indian'
  }
  
  // Chinese cuisine indicators
  if (title.includes('lo mein') || title.includes('kung pao') || title.includes('szechuan') ||
      title.includes('dim sum') || ingredients.some(i => i.includes('soy sauce'))) {
    return 'chinese'
  }
  
  // Japanese cuisine indicators
  if (title.includes('sushi') || title.includes('ramen') || title.includes('tempura') ||
      title.includes('teriyaki') || title.includes('miso')) {
    return 'japanese'
  }
  
  // Mediterranean cuisine indicators
  if (title.includes('mediterranean') || title.includes('quinoa') || title.includes('olive') ||
      ingredients.some(i => i.includes('olive oil') || i.includes('feta'))) {
    return 'mediterranean'
  }
  
  // American cuisine indicators
  if (title.includes('burger') || title.includes('bbq') || title.includes('mac and cheese') ||
      title.includes('apple pie') || title.includes('brownie')) {
    return 'american'
  }
  
  return null
}

function transformNutrition(spoonacularNutrition?: any) {
  if (!spoonacularNutrition?.nutrients) return {}

  const nutrition: Record<string, number> = {}
  
  spoonacularNutrition.nutrients.forEach((nutrient: any) => {
    const name = nutrient.name.toLowerCase()
    if (name.includes('calories')) nutrition.calories = nutrient.amount
    else if (name.includes('protein')) nutrition.protein = nutrient.amount
    else if (name.includes('fat')) nutrition.fat = nutrient.amount
    else if (name.includes('carbohydrate')) nutrition.carbs = nutrient.amount
    else if (name.includes('fiber')) nutrition.fiber = nutrient.amount
    else if (name.includes('sugar')) nutrition.sugar = nutrient.amount
    else if (name.includes('sodium')) nutrition.sodium = nutrient.amount
  })

  return nutrition
}

function getCategoryFilter(categoryId: string): any {
  const categoryFilters: Record<string, any> = {
    quick: { maxTime: 20 },
    italian: { cuisine: 'italian' },
    french: { cuisine: 'french' },
    mexican: { cuisine: 'mexican' },
    indian: { cuisine: 'indian' },
    chinese: { cuisine: 'chinese' },
    japanese: { cuisine: 'japanese' },
    mediterranean: { cuisine: 'mediterranean' },
    american: { cuisine: 'american' },
    desserts: { type: 'dessert' },
    vegetarian: { dietary: 'vegetarian' },
    vegan: { dietary: 'vegan' },
    'gluten-free': { dietary: 'gluten-free' }
  }
  
  return categoryFilters[categoryId] || null
}
