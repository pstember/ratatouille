import { defineEventHandler } from 'h3'
import { prisma } from '../database/client'

export default defineEventHandler(async () => {
  try {
    console.log('🔍 Testing database connection from server...')
    
    // Test database connection
    const recipeCount = await prisma.recipe.count()
    console.log(`✅ Database connected. Recipe count: ${recipeCount}`)
    
    // Test creating a recipe
    const testRecipe = await prisma.recipe.create({
      data: {
        externalId: 999999,
        title: 'Server Test Recipe',
        image: 'test.jpg',
        servings: 1,
        readyInMinutes: 5,
        cuisine: 'test',
        isNew: false,
        enrichedFromSpoonacular: true,
        enrichmentDate: new Date(),
        originalSource: 'test'
      }
    })
    
    console.log(`✅ Test recipe created: ${testRecipe.id}`)
    
    // Clean up
    await prisma.recipe.delete({
      where: { id: testRecipe.id }
    })
    
    console.log('✅ Test recipe cleaned up')
    
    return {
      success: true,
      message: 'Database connection working',
      recipeCount,
      testCreated: true
    }
  } catch (error) {
    console.error('❌ Database test failed:', error)
    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
})
