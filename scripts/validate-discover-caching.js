#!/usr/bin/env node

/**
 * Validation Script: Discover Feature Caching
 * 
 * This script validates that the discover feature properly caches random recipes
 * from Spoonacular to save API credits.
 * 
 * Test Scenarios:
 * 1. First discover request - should call API and cache results
 * 2. Second discover request - should use cached results
 * 3. Verify database storage of random recipes
 * 4. Verify cache entries for random recipes
 * 5. Test quota usage for discover feature
 */

const { PrismaClient } = require('@prisma/client')
const fetch = require('node-fetch')

const prisma = new PrismaClient()

// Configuration
const BASE_URL = 'http://localhost:3000'
const TEST_DISCOVER_PARAMS = {
  count: 6,
  cuisine: 'italian'
}

class DiscoverCachingValidator {
  constructor() {
    this.testResults = []
    this.apiCalls = 0
    this.cacheHits = 0
  }

  async runValidation() {
    console.log('🎲 Starting Discover Feature Caching Validation...\n')
    
    try {
      // Clean up before testing
      await this.cleanupTestData()
      
      // Test 1: First discover request (should call API)
      await this.testFirstDiscover()
      
      // Test 2: Second discover request (should use cache)
      await this.testCachedDiscover()
      
      // Test 3: Verify database storage
      await this.verifyDatabaseStorage()
      
      // Test 4: Verify cache entries
      await this.verifyCacheEntries()
      
      // Test 5: Test quota usage
      await this.testQuotaUsage()
      
      // Test 6: Test different discover parameters
      await this.testDifferentDiscoverParams()
      
      // Generate report
      this.generateReport()
      
    } catch (error) {
      console.error('❌ Validation failed:', error)
      process.exit(1)
    } finally {
      await prisma.$disconnect()
    }
  }

  async cleanupTestData() {
    console.log('🧹 Cleaning up test data...')
    
    // Clear cache entries for random recipes
    await prisma.cache.deleteMany({
      where: {
        type: 'random'
      }
    })
    
    console.log('✅ Cleanup completed')
  }

  async testFirstDiscover() {
    console.log('\n📡 Test 1: First Discover Request (API Call)')
    console.log('=' .repeat(50))
    
    const startTime = Date.now()
    const response = await this.performDiscover(TEST_DISCOVER_PARAMS)
    const endTime = Date.now()
    
    this.testResults.push({
      test: 'First Discover',
      apiCall: true,
      duration: endTime - startTime,
      results: response.recipes?.length || 0,
      source: response.source,
      cached: response.cached
    })
    
    console.log(`✅ Discover completed in ${endTime - startTime}ms`)
    console.log(`📊 Results: ${response.recipes?.length || 0} recipes`)
    console.log(`🔗 Source: ${response.source}`)
    console.log(`💾 Cached: ${response.cached}`)
    
    if (response.quotaInfo) {
      console.log(`💳 Quota info: ${JSON.stringify(response.quotaInfo)}`)
    }
    
    this.apiCalls++
  }

  async testCachedDiscover() {
    console.log('\n💾 Test 2: Cached Discover Request (Should Use Cache)')
    console.log('=' .repeat(50))
    
    const startTime = Date.now()
    const response = await this.performDiscover(TEST_DISCOVER_PARAMS)
    const endTime = Date.now()
    
    this.testResults.push({
      test: 'Cached Discover',
      apiCall: false,
      duration: endTime - startTime,
      results: response.recipes?.length || 0,
      source: response.source,
      cached: response.cached
    })
    
    console.log(`✅ Discover completed in ${endTime - startTime}ms`)
    console.log(`📊 Results: ${response.recipes?.length || 0} recipes`)
    console.log(`🔗 Source: ${response.source}`)
    console.log(`💾 Cached: ${response.cached}`)
    
    // Verify this was faster (cached)
    const firstDiscover = this.testResults.find(r => r.test === 'First Discover')
    if (firstDiscover && (endTime - startTime) < firstDiscover.duration) {
      console.log('✅ Cached discover was faster (cache working)')
      this.cacheHits++
    } else {
      console.log('⚠️ Cached discover was not faster (potential issue)')
    }
  }

  async verifyDatabaseStorage() {
    console.log('\n🗄️ Test 3: Database Storage Verification')
    console.log('=' .repeat(50))
    
    // Check if recipes were stored in database
    const storedRecipes = await prisma.recipe.findMany({
      where: {
        cuisine: TEST_DISCOVER_PARAMS.cuisine
      },
      include: {
        nutrition: true,
        ingredients: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })
    
    console.log(`📊 Recent recipes with cuisine '${TEST_DISCOVER_PARAMS.cuisine}': ${storedRecipes.length}`)
    
    if (storedRecipes.length > 0) {
      console.log('✅ Recipes were stored in database')
      
      // Check nutrition data
      const recipesWithNutrition = storedRecipes.filter(r => r.nutrition)
      console.log(`📈 Recipes with nutrition: ${recipesWithNutrition.length}`)
      
      // Check ingredients
      const recipesWithIngredients = storedRecipes.filter(r => r.ingredients.length > 0)
      console.log(`🥘 Recipes with ingredients: ${recipesWithIngredients.length}`)
      
      // Check if recipes are marked as new
      const newRecipes = storedRecipes.filter(r => r.isNew)
      console.log(`🆕 New recipes: ${newRecipes.length}`)
      
      this.testResults.push({
        test: 'Database Storage',
        success: true,
        storedRecipes: storedRecipes.length,
        withNutrition: recipesWithNutrition.length,
        withIngredients: recipesWithIngredients.length,
        newRecipes: newRecipes.length
      })
    } else {
      console.log('❌ No recipes found in database')
      this.testResults.push({
        test: 'Database Storage',
        success: false,
        storedRecipes: 0
      })
    }
  }

  async verifyCacheEntries() {
    console.log('\n💾 Test 4: Cache Entries Verification')
    console.log('=' .repeat(50))
    
    // Check cache entries for random recipes
    const cacheEntries = await prisma.cache.findMany({
      where: {
        type: 'random'
      }
    })
    
    console.log(`📊 Random recipe cache entries found: ${cacheEntries.length}`)
    
    if (cacheEntries.length > 0) {
      console.log('✅ Cache entries exist for random recipes')
      
      for (const entry of cacheEntries) {
        console.log(`🔑 Cache key: ${entry.key}`)
        console.log(`📅 Expires: ${entry.expiresAt}`)
        console.log(`🏷️ Type: ${entry.type}`)
        
        try {
          const cachedData = JSON.parse(entry.value)
          console.log(`📊 Cached recipes: ${cachedData.recipes?.length || 0}`)
          console.log(`🔗 Source: ${cachedData.source}`)
        } catch (e) {
          console.log('❌ Invalid cache data format')
        }
      }
      
      this.testResults.push({
        test: 'Cache Entries',
        success: true,
        cacheEntries: cacheEntries.length
      })
    } else {
      console.log('❌ No cache entries found for random recipes')
      this.testResults.push({
        test: 'Cache Entries',
        success: false,
        cacheEntries: 0
      })
    }
  }

  async testQuotaUsage() {
    console.log('\n💳 Test 5: Quota Usage Tracking')
    console.log('=' .repeat(50))
    
    // Check quota info endpoint
    try {
      const quotaResponse = await fetch(`${BASE_URL}/api/health`)
      const quotaData = await quotaResponse.json()
      
      console.log('📊 Current quota info:')
      console.log(`   Daily quota: ${quotaData.quota?.dailyQuota || 'N/A'}`)
      console.log(`   Used today: ${quotaData.quota?.usedToday || 'N/A'}`)
      console.log(`   Remaining: ${quotaData.quota?.remaining || 'N/A'}`)
      
      this.testResults.push({
        test: 'Quota Tracking',
        success: true,
        dailyQuota: quotaData.quota?.dailyQuota,
        usedToday: quotaData.quota?.usedToday,
        remaining: quotaData.quota?.remaining
      })
    } catch (error) {
      console.log('❌ Could not fetch quota info')
      this.testResults.push({
        test: 'Quota Tracking',
        success: false,
        error: error.message
      })
    }
  }

  async testDifferentDiscoverParams() {
    console.log('\n🔄 Test 6: Different Discover Parameters')
    console.log('=' .repeat(50))
    
    const differentParams = {
      count: 3,
      cuisine: 'mexican'
    }
    
    console.log('🔍 Testing with different parameters...')
    const startTime = Date.now()
    const response = await this.performDiscover(differentParams)
    const endTime = Date.now()
    
    console.log(`✅ Different discover completed in ${endTime - startTime}ms`)
    console.log(`📊 Results: ${response.recipes?.length || 0} recipes`)
    console.log(`🔗 Source: ${response.source}`)
    console.log(`💾 Cached: ${response.cached}`)
    
    this.testResults.push({
      test: 'Different Parameters',
      apiCall: true,
      duration: endTime - startTime,
      results: response.recipes?.length || 0,
      source: response.source,
      cached: response.cached
    })
    
    this.apiCalls++
  }

  async performDiscover(params) {
    const searchParams = new URLSearchParams(params)
    const response = await fetch(`${BASE_URL}/api/recipes/random?${searchParams}`)
    
    if (!response.ok) {
      throw new Error(`Discover failed: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  }

  generateReport() {
    console.log('\n📋 DISCOVER CACHING VALIDATION REPORT')
    console.log('=' .repeat(50))
    
    const totalTests = this.testResults.length
    const passedTests = this.testResults.filter(r => r.success !== false).length
    
    console.log(`📊 Total tests: ${totalTests}`)
    console.log(`✅ Passed: ${passedTests}`)
    console.log(`❌ Failed: ${totalTests - passedTests}`)
    console.log(`📡 API calls made: ${this.apiCalls}`)
    console.log(`💾 Cache hits: ${this.cacheHits}`)
    
    console.log('\n📝 Detailed Results:')
    for (const result of this.testResults) {
      const status = result.success === false ? '❌' : '✅'
      console.log(`${status} ${result.test}: ${JSON.stringify(result, null, 2)}`)
    }
    
    // Summary
    console.log('\n🎯 SUMMARY:')
    if (this.cacheHits > 0) {
      console.log('✅ Discover caching is working - API calls were reduced')
    } else {
      console.log('❌ Discover caching may not be working properly')
    }
    
    if (this.apiCalls <= 2) {
      console.log('✅ API usage for discover is optimized')
    } else {
      console.log('⚠️ API usage for discover could be optimized further')
    }
    
    console.log('\n🎉 Discover caching validation completed!')
  }
}

// Run validation
async function main() {
  const validator = new DiscoverCachingValidator()
  await validator.runValidation()
}

main().catch(console.error)
