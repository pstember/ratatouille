import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testSearchCaching() {
  console.log('🔍 Testing search caching and database storage...\n')

  try {
    // Check current database state
    console.log('📊 Current database state:')
    const recipeCount = await prisma.recipe.count()
    console.log(`- Total recipes in database: ${recipeCount}`)
    
    const enrichedRecipes = await prisma.recipe.count({
      where: { enrichedFromSpoonacular: true }
    })
    console.log(`- Recipes enriched from Spoonacular: ${enrichedRecipes}`)
    
    const nutritionCount = await prisma.nutrition.count()
    console.log(`- Recipes with nutrition data: ${nutritionCount}`)
    
    const ingredientsCount = await prisma.recipeIngredient.count()
    console.log(`- Total ingredients stored: ${ingredientsCount}`)

    // Check recent recipes
    console.log('\n📋 Recent recipes:')
    const recentRecipes = await prisma.recipe.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        nutrition: true,
        ingredients: true
      }
    })
    
    recentRecipes.forEach((recipe, index) => {
      console.log(`${index + 1}. ${recipe.title}`)
      console.log(`   - ID: ${recipe.id}, External ID: ${recipe.externalId}`)
      console.log(`   - Enriched: ${recipe.enrichedFromSpoonacular}`)
      console.log(`   - Has nutrition: ${!!recipe.nutrition}`)
      console.log(`   - Ingredients: ${recipe.ingredients.length}`)
      console.log(`   - Created: ${recipe.createdAt}`)
      console.log('')
    })

    // Test a Spoonacular search
    console.log('🔍 Testing Spoonacular search...')
    const searchResponse = await fetch('http://localhost:3000/api/recipes/search?mode=spoonacular&query=chicken&number=3&addRecipeNutrition=true&addRecipeInformation=true&fillIngredients=true', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      console.log('✅ Search successful!')
      console.log(`- Results: ${searchData.results.length}`)
      console.log(`- Total results: ${searchData.totalResults}`)
      console.log(`- Search source: ${searchData.searchSource}`)
      console.log(`- Enriched recipes: ${searchData.enrichmentStats?.newRecipes || 0}`)
      
      // Check if recipes were stored
      console.log('\n📊 Database state after search:')
      const newRecipeCount = await prisma.recipe.count()
      console.log(`- Total recipes: ${newRecipeCount} (was ${recipeCount})`)
      
      const newEnrichedCount = await prisma.recipe.count({
        where: { enrichedFromSpoonacular: true }
      })
      console.log(`- Enriched recipes: ${newEnrichedCount} (was ${enrichedRecipes})`)
      
      const newNutritionCount = await prisma.nutrition.count()
      console.log(`- Nutrition records: ${newNutritionCount} (was ${nutritionCount})`)
      
      // Check the actual recipes returned
      console.log('\n🍳 Recipes from search:')
      searchData.results.forEach((recipe, index) => {
        console.log(`${index + 1}. ${recipe.title}`)
        console.log(`   - ID: ${recipe.id}`)
        console.log(`   - Has nutrition: ${!!recipe.nutrition}`)
        console.log(`   - Nutrition data:`, recipe.nutrition ? {
          calories: recipe.nutrition.calories,
          protein: recipe.nutrition.protein,
          fat: recipe.nutrition.fat,
          carbs: recipe.nutrition.carbs
        } : 'None')
        console.log('')
      })
      
    } else {
      console.log('❌ Search failed:', searchResponse.status, searchResponse.statusText)
      const errorText = await searchResponse.text()
      console.log('Error details:', errorText)
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSearchCaching()
