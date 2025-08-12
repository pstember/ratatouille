#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanDatabase() {
  console.log('🧹 Starting complete database cleanup...')
  
  try {
    // Get counts before deletion for reporting
    const recipeCount = await prisma.recipe.count()
    const ingredientCount = await prisma.recipeIngredient.count()
    const nutritionCount = await prisma.nutrition.count()
    const allergenCount = await prisma.recipeAllergen.count()
    const cacheCount = await prisma.cache.count()
    const searchCount = await prisma.search.count()
    const enrichmentStatsCount = await prisma.enrichmentStats.count()
    
    console.log('📊 Current database state:')
    console.log(`  - Recipes: ${recipeCount}`)
    console.log(`  - Recipe Ingredients: ${ingredientCount}`)
    console.log(`  - Nutrition records: ${nutritionCount}`)
    console.log(`  - Recipe Allergens: ${allergenCount}`)
    console.log(`  - Cache entries: ${cacheCount}`)
    console.log(`  - Search records: ${searchCount}`)
    console.log(`  - Enrichment stats: ${enrichmentStatsCount}`)
    
    const totalRecords = recipeCount + ingredientCount + nutritionCount + 
                        allergenCount + cacheCount + searchCount + enrichmentStatsCount
    
    if (totalRecords === 0) {
      console.log('✅ Database is already completely empty.')
      return
    }
    
    console.log('\n🗑️  Starting complete deletion process...')
    
    // Delete all data from all tables
    const deletedRecipes = await prisma.recipe.deleteMany({})
    const deletedSearches = await prisma.search.deleteMany({})
    const deletedEnrichmentStats = await prisma.enrichmentStats.deleteMany({})
    const deletedCache = await prisma.cache.deleteMany({})
    
    console.log('✅ Complete cleanup completed successfully!')
    console.log(`  - Deleted ${deletedRecipes.count} recipes`)
    console.log(`  - Deleted ${deletedSearches.count} search records`)
    console.log(`  - Deleted ${deletedEnrichmentStats.count} enrichment stats`)
    console.log(`  - Deleted ${deletedCache.count} cache entries`)
    
    // Verify complete cleanup
    const remainingRecipes = await prisma.recipe.count()
    const remainingIngredients = await prisma.recipeIngredient.count()
    const remainingNutrition = await prisma.nutrition.count()
    const remainingAllergens = await prisma.recipeAllergen.count()
    const remainingCache = await prisma.cache.count()
    const remainingSearches = await prisma.search.count()
    const remainingEnrichmentStats = await prisma.enrichmentStats.count()
    
    console.log('\n🔍 Verification:')
    console.log(`  - Remaining recipes: ${remainingRecipes}`)
    console.log(`  - Remaining ingredients: ${remainingIngredients}`)
    console.log(`  - Remaining nutrition: ${remainingNutrition}`)
    console.log(`  - Remaining allergens: ${remainingAllergens}`)
    console.log(`  - Remaining cache: ${remainingCache}`)
    console.log(`  - Remaining searches: ${remainingSearches}`)
    console.log(`  - Remaining enrichment stats: ${remainingEnrichmentStats}`)
    
    const totalRemaining = remainingRecipes + remainingIngredients + remainingNutrition + 
                          remainingAllergens + remainingCache + remainingSearches + remainingEnrichmentStats
    
    if (totalRemaining === 0) {
      console.log('✅ Complete database cleanup verified - ALL data removed!')
    } else {
      console.log(`⚠️  Warning: ${totalRemaining} records still remain in the database.`)
    }
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanDatabase()
  .then(() => {
    console.log('🎉 Database cleanup completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Database cleanup failed:', error)
    process.exit(1)
  })
