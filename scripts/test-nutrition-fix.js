import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testNutritionFix() {
  try {
    console.log('🔍 Testing nutrition data fix...')
    
    // Get recipes created in the last hour (to test the fix)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const recentRecipes = await prisma.recipe.findMany({
      where: {
        createdAt: {
          gte: oneHourAgo
        }
      },
      include: {
        nutrition: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })
    
    console.log(`📊 Found ${recentRecipes.length} recipes created in the last hour:`)
    
    let withNutrition = 0
    let withoutNutrition = 0
    let withValues = 0
    
    recentRecipes.forEach((recipe, index) => {
      console.log(`\n${index + 1}. ${recipe.title}`)
      console.log(`   External ID: ${recipe.externalId}`)
      console.log(`   Created: ${recipe.createdAt}`)
      console.log(`   Has nutrition record: ${recipe.nutrition ? '✅' : '❌'}`)
      
      if (recipe.nutrition) {
        withNutrition++
        
        // Check if nutrition values are not null
        const hasValues = recipe.nutrition.calories !== null || 
                         recipe.nutrition.protein !== null || 
                         recipe.nutrition.carbs !== null || 
                         recipe.nutrition.fat !== null
        
        if (hasValues) {
          withValues++
          console.log(`   ✅ Has nutrition values:`)
          console.log(`      Calories: ${recipe.nutrition.calories || 'N/A'}`)
          console.log(`      Protein: ${recipe.nutrition.protein || 'N/A'}g`)
          console.log(`      Carbs: ${recipe.nutrition.carbs || 'N/A'}g`)
          console.log(`      Fat: ${recipe.nutrition.fat || 'N/A'}g`)
          console.log(`      Fiber: ${recipe.nutrition.fiber || 'N/A'}g`)
          console.log(`      Sugar: ${recipe.nutrition.sugar || 'N/A'}g`)
          console.log(`      Sodium: ${recipe.nutrition.sodium || 'N/A'}mg`)
        } else {
          console.log(`   ❌ Nutrition record exists but all values are null`)
        }
      } else {
        withoutNutrition++
      }
    })
    
    console.log(`\n📈 Summary:`)
    console.log(`   Recipes with nutrition record: ${withNutrition}`)
    console.log(`   Recipes with actual nutrition values: ${withValues}`)
    console.log(`   Recipes without nutrition: ${withoutNutrition}`)
    
    if (withValues > 0) {
      console.log(`\n✅ SUCCESS: Nutrition data fix is working!`)
      console.log(`   Recent recipes now have actual nutrition values.`)
    } else if (recentRecipes.length === 0) {
      console.log(`\n⚠️ No recent recipes found. Try fetching some random recipes first.`)
    } else {
      console.log(`\n❌ ISSUE: Recent recipes still don't have nutrition values.`)
      console.log(`   The fix may not be working as expected.`)
    }
    
    // Test the specific recipe that was mentioned
    console.log(`\n🔍 Testing specific recipe 141...`)
    const recipe141 = await prisma.recipe.findUnique({
      where: { id: 141 },
      include: { nutrition: true }
    })
    
    if (recipe141) {
      console.log(`📋 Recipe 141: ${recipe141.title}`)
      console.log(`   Has nutrition record: ${recipe141.nutrition ? '✅' : '❌'}`)
      
      if (recipe141.nutrition) {
        const hasValues = recipe141.nutrition.calories !== null || 
                         recipe141.nutrition.protein !== null || 
                         recipe141.nutrition.carbs !== null || 
                         recipe141.nutrition.fat !== null
        
        if (hasValues) {
          console.log(`   ✅ Has nutrition values:`)
          console.log(`      Calories: ${recipe141.nutrition.calories || 'N/A'}`)
          console.log(`      Protein: ${recipe141.nutrition.protein || 'N/A'}g`)
          console.log(`      Carbs: ${recipe141.nutrition.carbs || 'N/A'}g`)
          console.log(`      Fat: ${recipe141.nutrition.fat || 'N/A'}g`)
        } else {
          console.log(`   ❌ Nutrition record exists but all values are null`)
          console.log(`   💡 This recipe was created before the fix. Try refreshing it.`)
        }
      }
    } else {
      console.log(`❌ Recipe 141 not found`)
    }
    
  } catch (error) {
    console.error('❌ Error testing nutrition fix:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testNutritionFix()
