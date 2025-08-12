import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugDatabaseStorage() {
  console.log('🔍 Debugging database storage...\n')

  try {
    // Test database connection
    console.log('📊 Testing database connection...')
    const recipeCount = await prisma.recipe.count()
    console.log(`✅ Database connected. Current recipe count: ${recipeCount}`)

    // Test creating a recipe manually
    console.log('\n🧪 Testing manual recipe creation...')
    const testRecipe = {
      externalId: 999999, // Use integer instead of string
      title: 'Test Recipe',
      image: 'test-image.jpg',
      servings: 4,
      readyInMinutes: 30,
      cuisine: 'test',
      isNew: false,
      enrichedFromSpoonacular: true,
      enrichmentDate: new Date(),
      originalSource: 'test'
    }

    try {
      const createdRecipe = await prisma.recipe.create({
        data: testRecipe
      })
      console.log('✅ Manual recipe creation successful:', createdRecipe.id)
      
      // Clean up
      await prisma.recipe.delete({
        where: { id: createdRecipe.id }
      })
      console.log('✅ Test recipe cleaned up')
    } catch (error) {
      console.error('❌ Manual recipe creation failed:', error)
    }

    // Test nutrition creation
    console.log('\n🥗 Testing nutrition creation...')
    try {
      const testNutrition = {
        recipeId: 1, // This might fail if recipe doesn't exist
        calories: 500,
        protein: 25,
        fat: 20,
        carbs: 30,
        fiber: 5,
        sugar: 10,
        sodium: 500
      }
      
      // First check if recipe exists
      const existingRecipe = await prisma.recipe.findFirst()
      if (existingRecipe) {
        testNutrition.recipeId = existingRecipe.id
        
        const createdNutrition = await prisma.nutrition.create({
          data: testNutrition
        })
        console.log('✅ Nutrition creation successful:', createdNutrition.id)
        
        // Clean up
        await prisma.nutrition.delete({
          where: { id: createdNutrition.id }
        })
        console.log('✅ Test nutrition cleaned up')
      } else {
        console.log('⚠️ No existing recipe found for nutrition test')
      }
    } catch (error) {
      console.error('❌ Nutrition creation failed:', error)
    }

    // Test the enrichment service manually
    console.log('\n🔧 Testing enrichment service manually...')
    
    const testRecipeForStorage = {
      id: 888888,
      title: 'Test Enrichment Recipe',
      image: 'test-enrichment.jpg',
      servings: 2,
      readyInMinutes: 20,
      cuisine: 'test',
      isNew: false,
      nutrition: {
        calories: 300,
        protein: 15,
        fat: 10,
        carbs: 25,
        fiber: 3,
        sugar: 5,
        sodium: 300
      },
      allergens: [],
      ingredients: [
        { name: 'Test Ingredient', amount: 1, unit: 'cup', aisle: 'test' }
      ],
      summary: 'Test recipe summary',
      instructions: 'Test instructions',
      sourceUrl: 'https://test.com',
      sourceName: 'Test Source'
    }

    try {
      // Check if recipe already exists
      const existingRecipe = await prisma.recipe.findFirst({
        where: {
          OR: [
            { id: testRecipeForStorage.id },
            { externalId: testRecipeForStorage.id }
          ]
        }
      })
      
      if (existingRecipe) {
        console.log('⚠️ Recipe already exists, updating...')
        await prisma.recipe.updateMany({
          where: {
            OR: [
              { id: testRecipeForStorage.id },
              { externalId: testRecipeForStorage.id }
            ]
          },
          data: {
            title: testRecipeForStorage.title,
            image: testRecipeForStorage.image,
            servings: testRecipeForStorage.servings,
            readyInMinutes: testRecipeForStorage.readyInMinutes,
            cuisine: testRecipeForStorage.cuisine,
            enrichedFromSpoonacular: true,
            enrichmentDate: new Date(),
            sourceUrl: testRecipeForStorage.sourceUrl,
            sourceName: testRecipeForStorage.sourceName,
            summary: testRecipeForStorage.summary,
            instructions: testRecipeForStorage.instructions
          }
        })
        console.log('✅ Recipe updated')
      } else {
        console.log('📝 Creating new recipe...')
        await prisma.recipe.create({
          data: {
            externalId: testRecipeForStorage.id,
            title: testRecipeForStorage.title,
            image: testRecipeForStorage.image,
            servings: testRecipeForStorage.servings,
            readyInMinutes: testRecipeForStorage.readyInMinutes,
            cuisine: testRecipeForStorage.cuisine,
            isNew: false,
            enrichedFromSpoonacular: true,
            enrichmentDate: new Date(),
            originalSource: 'spoonacular',
            sourceUrl: testRecipeForStorage.sourceUrl,
            sourceName: testRecipeForStorage.sourceName,
            summary: testRecipeForStorage.summary,
            instructions: testRecipeForStorage.instructions
          }
        })
        console.log('✅ Recipe created')
      }
      
      // Check if it was actually stored
      const storedRecipe = await prisma.recipe.findFirst({
        where: { externalId: testRecipeForStorage.id }
      })
      
      if (storedRecipe) {
        console.log('✅ Recipe was stored in database:', storedRecipe.id)
        
        // Store nutrition
        if (testRecipeForStorage.nutrition) {
          await prisma.nutrition.deleteMany({
            where: { recipeId: storedRecipe.id }
          })
          
          await prisma.nutrition.create({
            data: {
              recipeId: storedRecipe.id,
              calories: testRecipeForStorage.nutrition.calories,
              protein: testRecipeForStorage.nutrition.protein,
              fat: testRecipeForStorage.nutrition.fat,
              carbs: testRecipeForStorage.nutrition.carbs,
              fiber: testRecipeForStorage.nutrition.fiber,
              sugar: testRecipeForStorage.nutrition.sugar,
              sodium: testRecipeForStorage.nutrition.sodium
            }
          })
          console.log('✅ Nutrition stored')
        }
        
        // Store ingredients
        if (testRecipeForStorage.ingredients && testRecipeForStorage.ingredients.length > 0) {
          await prisma.recipeIngredient.deleteMany({
            where: { recipeId: storedRecipe.id }
          })
          
          for (const ingredient of testRecipeForStorage.ingredients) {
            await prisma.recipeIngredient.create({
              data: {
                recipeId: storedRecipe.id,
                name: ingredient.name,
                amount: ingredient.amount,
                unit: ingredient.unit,
                aisle: ingredient.aisle
              }
            })
          }
          console.log('✅ Ingredients stored')
        }
        
        // Check final state
        const nutrition = await prisma.nutrition.findFirst({
          where: { recipeId: storedRecipe.id }
        })
        console.log('✅ Final nutrition check:', !!nutrition)
        
        const ingredients = await prisma.recipeIngredient.findMany({
          where: { recipeId: storedRecipe.id }
        })
        console.log('✅ Final ingredients check:', ingredients.length)
        
        // Clean up
        await prisma.recipe.delete({
          where: { id: storedRecipe.id }
        })
        console.log('✅ Test enrichment recipe cleaned up')
      } else {
        console.log('❌ Recipe was not stored in database')
      }
    } catch (error) {
      console.error('❌ Manual enrichment test failed:', error)
    }

  } catch (error) {
    console.error('❌ Database debug failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugDatabaseStorage()
