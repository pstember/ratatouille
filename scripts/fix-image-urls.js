import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixImageUrls() {
  try {
    console.log('🔧 Starting image URL fix...')
    
    // Get all recipes with relative image URLs
    const recipes = await prisma.recipe.findMany({
      where: {
        image: {
          not: null,
          not: {
            startsWith: 'http'
          },
          not: {
            startsWith: '/images/'
          }
        }
      },
      select: {
        id: true,
        title: true,
        image: true
      }
    })
    
    console.log(`📊 Found ${recipes.length} recipes with relative image URLs`)
    
    let fixedCount = 0
    
    for (const recipe of recipes) {
      const oldImageUrl = recipe.image
      let newImageUrl = oldImageUrl
      
      // Convert relative URLs to full Spoonacular URLs
      if (oldImageUrl && !oldImageUrl.startsWith('http') && !oldImageUrl.startsWith('/images/')) {
        if (oldImageUrl.includes('.jpg') || oldImageUrl.includes('.png')) {
          newImageUrl = `https://img.spoonacular.com/recipes/${oldImageUrl}`
          
          // Update the database
          await prisma.recipe.update({
            where: { id: recipe.id },
            data: { image: newImageUrl }
          })
          
          console.log(`✅ Fixed recipe ${recipe.id} (${recipe.title}):`)
          console.log(`   Old: ${oldImageUrl}`)
          console.log(`   New: ${newImageUrl}`)
          
          fixedCount++
        } else {
          console.log(`⚠️  Unknown image format for recipe ${recipe.id}: ${oldImageUrl}`)
        }
      }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} image URLs out of ${recipes.length} recipes`)
    
  } catch (error) {
    console.error('❌ Error fixing image URLs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixImageUrls()
