const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testRandomNutrition() {
  try {
    console.log('🔍 Testing random recipe nutrition data...')
    
    // Get a few recent recipes that were likely fetched via random endpoint
    const recentRecipes = await prisma.recipe.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        nutrition: true
      }
    })
    
    console.log(`📊 Checking ${recentRecipes.length} recent recipes:`)
    
    let withNutrition = 0
    let withoutNutrition = 0
    
    recentRecipes.forEach((recipe, index) => {
      console.log(`\n${index + 1}. ${recipe.title}`)
      console.log(`   External ID: ${recipe.externalId}`)
      console.log(`   Created: ${recipe.createdAt}`)
      console.log(`   Has nutrition: ${recipe.nutrition ? '✅' : '❌'}`)
      
      if (recipe.nutrition) {
        withNutrition++
        console.log(`   Calories: ${recipe.nutrition.calories}`)
        console.log(`   Protein: ${recipe.nutrition.protein}`)
        console.log(`   Carbs: ${recipe.nutrition.carbs}`)
        console.log(`   Fat: ${recipe.nutrition.fat}`)
      } else {
        withoutNutrition++
      }
    })
    
    console.log(`\n📈 Summary:`)
    console.log(`   Recipes with nutrition: ${withNutrition}`)
    console.log(`   Recipes without nutrition: ${withoutNutrition}`)
    console.log(`   Percentage with nutrition: ${((withNutrition / recentRecipes.length) * 100).toFixed(1)}%`)
    
    // Check if there's a pattern in external IDs
    const externalIds = recentRecipes.map(r => r.externalId)
    console.log(`\n🔢 External IDs: ${externalIds.join(', ')}`)
    
    // Check if recipes without nutrition have different external ID patterns
    const recipesWithoutNutrition = recentRecipes.filter(r => !r.nutrition)
    const recipesWithNutrition = recentRecipes.filter(r => r.nutrition)
    
    if (recipesWithoutNutrition.length > 0) {
      console.log(`\n❌ Recipes without nutrition:`)
      recipesWithoutNutrition.forEach(recipe => {
        console.log(`   - ${recipe.title} (ID: ${recipe.externalId})`)
      })
    }
    
    if (recipesWithNutrition.length > 0) {
      console.log(`\n✅ Recipes with nutrition:`)
      recipesWithNutrition.forEach(recipe => {
        console.log(`   - ${recipe.title} (ID: ${recipe.externalId})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error testing random nutrition:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testRandomNutrition()
