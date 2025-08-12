import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugNutritionTransform() {
  try {
    console.log('🔍 Debugging nutrition transformation...')
    
    // Get a recipe that was recently created
    const recipe = await prisma.recipe.findFirst({
      where: {
        nutrition: {
          isNot: null
        }
      },
      include: {
        nutrition: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    if (!recipe) {
      console.log('❌ No recipes with nutrition data found')
      return
    }
    
    console.log(`\n📋 Recipe: ${recipe.title} (ID: ${recipe.id}, External ID: ${recipe.externalId})`)
    console.log(`📊 Current Nutrition Data:`)
    console.log(JSON.stringify(recipe.nutrition, null, 2))
    
    // Let's test the transformNutrition function with a mock API response
    console.log(`\n🧪 Testing transformNutrition function...`)
    
    // Mock Spoonacular nutrition response (based on actual API structure)
    const mockSpoonacularNutrition = {
      nutrients: [
        { name: "Calories", amount: 450, unit: "kcal" },
        { name: "Protein", amount: 25, unit: "g" },
        { name: "Fat", amount: 18, unit: "g" },
        { name: "Carbohydrates", amount: 35, unit: "g" },
        { name: "Fiber", amount: 5, unit: "g" },
        { name: "Sugar", amount: 12, unit: "g" },
        { name: "Sodium", amount: 800, unit: "mg" }
      ],
      properties: [],
      flavonoids: [],
      ingredients: [],
      caloricBreakdown: {
        percentProtein: 22,
        percentFat: 36,
        percentCarbs: 42
      },
      weightPerServing: {
        amount: 250,
        unit: "g"
      }
    }
    
    console.log(`\n📥 Mock API Response:`)
    console.log(JSON.stringify(mockSpoonacularNutrition, null, 2))
    
    // Test the transform function
    const transformed = transformNutrition(mockSpoonacularNutrition)
    console.log(`\n📤 Transformed Result:`)
    console.log(JSON.stringify(transformed, null, 2))
    
  } catch (error) {
    console.error('❌ Error debugging nutrition transform:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Copy the transformNutrition function from the codebase
function transformNutrition(spoonacularNutrition) {
  if (!spoonacularNutrition?.nutrients) return {}

  const nutrition = {}
  
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

debugNutritionTransform()
