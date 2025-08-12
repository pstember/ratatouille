import { prisma } from '../../database/client'
import { cacheService } from '../../utils/cache'
import { markRecipeAsViewed } from '../../utils/recipe'
import { processIntolerances, storeRecipeAllergens, getRecipeAllergens } from '../../utils/allergen'
import { getAllergenInfo } from '~/types/allergen'
import { SpoonacularClient } from '../../utils/spoonacular-client'
import { handleSpoonacularError } from '../../utils/spoonacular-error-handler'
import { processImageUrl } from '../../utils/image-url-processor'
import type { RecipeDetailResponse, SpoonacularRecipe } from '~/types/recipe'

// Use the utility function from image-url-processor instead

export default defineEventHandler(async (event): Promise<RecipeDetailResponse> => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Recipe ID is required'
    })
  }

  const recipeId = parseInt(id)
  if (isNaN(recipeId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid recipe ID'
    })
  }

  // Generate cache key
  const cacheKey = cacheService.generateKey('recipe_detail', { id: recipeId })
  
  // Try to get from cache first
  const cachedRecipe = await cacheService.get(cacheKey)
  if (cachedRecipe) {
    // Mark as viewed if it was new
    if (cachedRecipe.isNew) {
      await markRecipeAsViewed(recipeId)
    }
    return { recipe: cachedRecipe, cached: true }
  }

  try {
    // Try to get from database first
    let recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: true,
        nutrition: true,
        allergens: true
      }
    })

    if (recipe) {
      // Mark as viewed if it was new
      if (recipe.isNew) {
        await markRecipeAsViewed(recipeId)
        recipe.isNew = false
      }

      // Get allergen information
      const allergens = await getRecipeAllergens(recipe.id)
      console.log('Recipe ID:', recipe.id, 'Allergens from DB:', allergens)
      const allergenInfos = allergens.map(allergen => getAllergenInfo(allergen))
      console.log('Allergen infos:', allergenInfos)
      
      // Cache the recipe with allergens and analyzed instructions
      const recipeWithAllergens = { 
        ...recipe, 
        allergens: allergenInfos,
        analyzedInstructions: recipe.analyzedInstructions || null
      }
      await cacheService.set(cacheKey, recipeWithAllergens, { 
        type: 'recipe', 
        recipeId: recipe.id 
      })
      
      return { recipe: recipeWithAllergens, cached: false }
    }

    // If not in database, fetch from API using the new client
    const spoonacularRecipeResponse = await SpoonacularClient.getRecipeInformation(
      recipeId,
      true, // addRecipeNutrition
      true  // fillIngredients
    )
    
    const spoonacularRecipe = spoonacularRecipeResponse.data

    // Transform and store the recipe
    recipe = await transformAndStoreRecipe(spoonacularRecipe)

    // Cache the recipe
    await cacheService.set(cacheKey, recipe, { 
      type: 'recipe', 
      recipeId: recipe.id 
    })

    return { recipe, cached: false }
  } catch (error) {
    console.error('Recipe detail error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch recipe details'
    })
  }
})

async function transformAndStoreRecipe(spoonacularRecipe: SpoonacularRecipe) {
  const config = useRuntimeConfig()
  
  // Check if recipe already exists by external ID
  let recipe = await prisma.recipe.findUnique({
    where: { externalId: spoonacularRecipe.id },
    include: {
      ingredients: true,
      nutrition: true,
      allergens: true
    }
  })

  // Get cuisine from API response
  const cuisine = spoonacularRecipe.cuisines?.[0] || null

  // Check if nutrition data is missing and try to fetch it from the direct nutrition endpoint
  if (!spoonacularRecipe.nutrition || !spoonacularRecipe.nutrition.nutrients) {
    console.log(`⚠️ No nutrition data in main response for recipe ${spoonacularRecipe.id}, trying direct nutrition endpoint...`)
    
    try {
      const nutritionUrl = `${config.public.apiBase}/${spoonacularRecipe.id}/nutritionWidget.json`
      const nutritionParams = new URLSearchParams({
        apiKey: config.spoonacularApiKey
      })
      
      const nutritionData = await $fetch<any>(nutritionUrl + '?' + nutritionParams)
      
      if (nutritionData) {
        console.log(`✅ Nutrition data found from direct endpoint for recipe ${spoonacularRecipe.id}`)
        
        // Transform the nutrition data to match our expected format
        const transformedNutrition = {
          nutrients: [
            { name: "Calories", amount: nutritionData.calories, unit: "kcal" },
            { name: "Protein", amount: nutritionData.protein, unit: "g" },
            { name: "Fat", amount: nutritionData.fat, unit: "g" },
            { name: "Carbohydrates", amount: nutritionData.carbs, unit: "g" },
            { name: "Fiber", amount: nutritionData.fiber, unit: "g" },
            { name: "Sugar", amount: nutritionData.sugar, unit: "g" },
            { name: "Sodium", amount: nutritionData.sodium, unit: "mg" }
          ]
        }
        
        // Add the nutrition data to the recipe
        spoonacularRecipe.nutrition = transformedNutrition
      }
    } catch (nutritionError: any) {
      console.error(`Failed to fetch nutrition data from direct endpoint for recipe ${spoonacularRecipe.id}:`, nutritionError.message)
    }
  }

  if (!recipe) {
    // Create new recipe
    recipe = await prisma.recipe.create({
      data: {
        externalId: spoonacularRecipe.id,
        title: spoonacularRecipe.title,
        image: processImageUrl(spoonacularRecipe.image, spoonacularRecipe.id),
        servings: spoonacularRecipe.servings,
        readyInMinutes: spoonacularRecipe.readyInMinutes,
        sourceUrl: spoonacularRecipe.sourceUrl,
        sourceName: spoonacularRecipe.sourceName,
        summary: spoonacularRecipe.summary,
        instructions: spoonacularRecipe.instructions,
        cuisine: cuisine, // Store cuisine if available
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
      include: {
        ingredients: true,
        nutrition: true
      }
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
    ...recipe, 
    allergens: allergenInfos,
    analyzedInstructions: recipe.analyzedInstructions || null
  }
}

function transformNutrition(spoonacularNutrition?: SpoonacularNutrition) {
  if (!spoonacularNutrition?.nutrients) return {}

  const nutrition: Record<string, number> = {}
  
  spoonacularNutrition.nutrients.forEach(nutrient => {
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
