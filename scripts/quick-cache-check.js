#!/usr/bin/env node

/**
 * Quick Cache Implementation Check
 * 
 * This script quickly validates that the caching infrastructure is in place
 * and working correctly.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCachingImplementation() {
  console.log('🔍 Quick Cache Implementation Check\n')
  
  try {
    // Check 1: Cache table exists and has data
    console.log('1. Checking Cache table...')
    const cacheCount = await prisma.cache.count()
    console.log(`   📊 Cache entries: ${cacheCount}`)
    
    if (cacheCount > 0) {
      const recentCache = await prisma.cache.findFirst({
        orderBy: { createdAt: 'desc' }
      })
      console.log(`   🔑 Recent cache key: ${recentCache.key}`)
      console.log(`   🏷️ Type: ${recentCache.type}`)
      console.log(`   📅 Expires: ${recentCache.expiresAt}`)
    }
    
    // Check 2: Recipe table has data
    console.log('\n2. Checking Recipe table...')
    const recipeCount = await prisma.recipe.count()
    console.log(`   📊 Total recipes: ${recipeCount}`)
    
    if (recipeCount > 0) {
      const recentRecipe = await prisma.recipe.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { nutrition: true, ingredients: true }
      })
      console.log(`   🍽️ Recent recipe: ${recentRecipe.title}`)
      console.log(`   🆕 Is new: ${recentRecipe.isNew}`)
      console.log(`   📈 Has nutrition: ${!!recentRecipe.nutrition}`)
      console.log(`   🥘 Has ingredients: ${recentRecipe.ingredients.length}`)
    }
    
    // Check 3: Cache types distribution
    console.log('\n3. Checking cache types...')
    const cacheTypes = await prisma.cache.groupBy({
      by: ['type'],
      _count: { type: true }
    })
    
    for (const type of cacheTypes) {
      console.log(`   ${type.type}: ${type._count.type} entries`)
    }
    
    // Check 4: Database enrichment status
    console.log('\n4. Checking database enrichment...')
    const enrichedRecipes = await prisma.recipe.count({
      where: { enrichedFromSpoonacular: true }
    })
    console.log(`   📊 Enriched recipes: ${enrichedRecipes}`)
    
    // Check 5: Recent activity
    console.log('\n5. Checking recent activity...')
    const recentActivity = await prisma.recipe.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        title: true,
        createdAt: true,
        isNew: true,
        enrichedFromSpoonacular: true
      }
    })
    
    console.log('   📅 Recent recipes:')
    for (const recipe of recentActivity) {
      const status = recipe.isNew ? '🆕' : '📝'
      const enriched = recipe.enrichedFromSpoonacular ? '💾' : '🗄️'
      console.log(`   ${status}${enriched} ${recipe.title} (${recipe.createdAt.toLocaleDateString()})`)
    }
    
    // Summary
    console.log('\n📋 SUMMARY:')
    console.log(`✅ Cache infrastructure: ${cacheCount > 0 ? 'Active' : 'No data'}`)
    console.log(`✅ Recipe storage: ${recipeCount > 0 ? 'Active' : 'No data'}`)
    console.log(`✅ Database enrichment: ${enrichedRecipes > 0 ? 'Active' : 'No data'}`)
    
    if (cacheCount > 0 && recipeCount > 0) {
      console.log('\n🎉 Caching implementation appears to be working!')
      console.log('💡 Run the full validation scripts to test API credit savings.')
    } else {
      console.log('\n⚠️ Caching infrastructure exists but no data found.')
      console.log('💡 Try making some API calls to populate the cache.')
    }
    
  } catch (error) {
    console.error('❌ Error checking caching implementation:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCachingImplementation()
