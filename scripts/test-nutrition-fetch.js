const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testNutritionData() {
  try {
    console.log('🔍 Checking nutrition data in database...')
    
    // Check how many recipes have nutrition data
    const totalRecipes = await prisma.recipe.count()
    const recipesWithNutrition = await prisma.recipe.count({
      where: {
        nutrition: {
          isNot: null
        }
      }
    })
    
    console.log(`📊 Total recipes: ${totalRecipes}`)
    console.log(`📊 Recipes with nutrition: ${recipesWithNutrition}`)
    console.log(`📊 Percentage with nutrition: ${((recipesWithNutrition / totalRecipes) * 100).toFixed(1)}%`)
    
    // Get a sample recipe with nutrition data
    const sampleRecipe = await prisma.recipe.findFirst({
      where: {
        nutrition: {
          isNot: null
        }
      },
      include: {
        nutrition: true
      }
    })
    
    if (sampleRecipe) {
      console.log('\n✅ Sample recipe with nutrition:')
      console.log(`Title: ${sampleRecipe.title}`)
      console.log(`Nutrition:`, JSON.stringify(sampleRecipe.nutrition, null, 2))
    } else {
      console.log('\n❌ No recipes found with nutrition data')
    }
    
    // Get a sample recipe without nutrition data
    const sampleRecipeWithoutNutrition = await prisma.recipe.findFirst({
      where: {
        nutrition: null
      },
      include: {
        nutrition: true
      }
    })
    
    if (sampleRecipeWithoutNutrition) {
      console.log('\n❌ Sample recipe without nutrition:')
      console.log(`Title: ${sampleRecipeWithoutNutrition.title}`)
      console.log(`External ID: ${sampleRecipeWithoutNutrition.externalId}`)
      console.log(`Created: ${sampleRecipeWithoutNutrition.createdAt}`)
    }
    
    // Check the most recent recipes
    const recentRecipes = await prisma.recipe.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      include: {
        nutrition: true
      }
    })
    
    console.log('\n📅 Most recent 5 recipes:')
    recentRecipes.forEach((recipe, index) => {
      console.log(`${index + 1}. ${recipe.title}`)
      console.log(`   External ID: ${recipe.externalId}`)
      console.log(`   Has nutrition: ${recipe.nutrition ? '✅' : '❌'}`)
      if (recipe.nutrition) {
        console.log(`   Calories: ${recipe.nutrition.calories}`)
        console.log(`   Protein: ${recipe.nutrition.protein}`)
        console.log(`   Carbs: ${recipe.nutrition.carbs}`)
        console.log(`   Fat: ${recipe.nutrition.fat}`)
      }
    })
    
  } catch (error) {
    console.error('❌ Error testing nutrition data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testNutritionData()
