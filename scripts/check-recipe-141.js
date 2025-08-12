import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkRecipe141() {
  try {
    console.log('🔍 Checking recipe with ID 141...')
    
    const recipe = await prisma.recipe.findUnique({
      where: { id: 141 },
      include: {
        nutrition: true,
        ingredients: true
      }
    })
    
    if (!recipe) {
      console.log('❌ Recipe with ID 141 not found')
      return
    }
    
    console.log(`\n📋 Recipe Details:`)
    console.log(`   ID: ${recipe.id}`)
    console.log(`   External ID: ${recipe.externalId}`)
    console.log(`   Title: ${recipe.title}`)
    console.log(`   Created: ${recipe.createdAt}`)
    console.log(`   Has nutrition record: ${recipe.nutrition ? '✅' : '❌'}`)
    
    if (recipe.nutrition) {
      console.log(`\n📊 Nutrition Data:`)
      console.log(`   Calories: ${recipe.nutrition.calories}`)
      console.log(`   Protein: ${recipe.nutrition.protein}`)
      console.log(`   Carbs: ${recipe.nutrition.carbs}`)
      console.log(`   Fat: ${recipe.nutrition.fat}`)
      console.log(`   Fiber: ${recipe.nutrition.fiber}`)
      console.log(`   Sugar: ${recipe.nutrition.sugar}`)
      console.log(`   Sodium: ${recipe.nutrition.sodium}`)
      
      // Check if all values are null
      const allNull = Object.values(recipe.nutrition).every(value => 
        value === null || value === undefined || value === 0
      )
      
      if (allNull) {
        console.log(`\n⚠️ WARNING: All nutrition values are null/empty!`)
        console.log(`   This suggests the nutrition data extraction is not working properly.`)
      }
    }
    
    console.log(`\n🥘 Ingredients (${recipe.ingredients.length}):`)
    recipe.ingredients.forEach((ingredient, index) => {
      console.log(`   ${index + 1}. ${ingredient.name}${ingredient.amount ? ` - ${ingredient.amount} ${ingredient.unit || ''}` : ''}`)
    })
    
  } catch (error) {
    console.error('❌ Error checking recipe 141:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRecipe141()
