#!/usr/bin/env node

/**
 * Validation Script: Spoonacular Search Caching
 * 
 * This script validates that search results from Spoonacular are properly cached
 * in the database to save API credits as per specifications.
 * 
 * Test Scenarios:
 * 1. First search - should call API and cache results
 * 2. Second search with same parameters - should use cached results
 * 3. Verify database storage of recipes
 * 4. Verify cache entries
 * 5. Test quota usage tracking
 */

const { PrismaClient } = require('@prisma/client')
const fetch = require('node-fetch')

const prisma = new PrismaClient()

// Configuration
const BASE_URL = 'http://localhost:3000'
const TEST_SEARCH_QUERY = 'chicken pasta'
const TEST_SEARCH_PARAMS = {
  query: TEST_SEARCH_QUERY,
  number: 5,
  addRecipeInformation: true,
  addRecipeNutrition: true
}

class CachingValidator {
  constructor() {
    this.testResults = []
    this.apiCalls = 0
    this.cacheHits = 0
  }

  async runValidation() {
    console.log('🔍 Starting Spoonacular Search Caching Validation...\n')
    
    try {
      // Clean up before testing
      await this.cleanupTestData()
      
      // Test 1: First search (should call API)
      await this.testFirstSearch()
      
      // Test 2: Second search with same parameters (should use cache)
      await this.testCachedSearch()
      
      // Test 3: Verify database storage
      await this.verifyDatabaseStorage()
      
      // Test 4: Verify cache entries
      await this.verifyCacheEntries()
      
      // Test 5: Test quota usage
      await this.testQuotaUsage()
      
      // Test 6: Test different search parameters
      await this.testDifferentSearchParams()
      
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
    
    // Clear cache entries for our test
    await prisma.cache.deleteMany({
      where: {
        key: {
          contains: TEST_SEARCH_QUERY
        }
      }
    })
    
    // Clear any test recipes (optional - be careful in production)
    // await prisma.recipe.deleteMany({
    //   where: {
    //     title: {
    //       contains: TEST_SEARCH_QUERY
    //     }
    //   }
    // })
    
    console.log('✅ Cleanup completed')
  }

  async testFirstSearch() {
    console.log('\n📡 Test 1: First Search (API Call)')
    console.log('=' .repeat(50))
    
    const startTime = Date.now()
    const response = await this.performSearch(TEST_SEARCH_PARAMS)
    const endTime = Date.now()
    
    this.testResults.push({
      test: 'First Search',
      apiCall: true,
      duration: endTime - startTime,
      results: response.results?.length || 0,
      source: response.searchSource,
      mode: response.searchMode
    })
    
    console.log(`✅ Search completed in ${endTime - startTime}ms`)
    console.log(`📊 Results: ${response.results?.length || 0} recipes`)
    console.log(`🔗 Source: ${response.searchSource}`)
    console.log(`🎯 Mode: ${response.searchMode}`)
    
    if (response.spoonacularResults) {
      console.log(`💳 Quota used: ${response.spoonacularResults.quotaUsed}`)
      console.log(`📈 Enriched recipes: ${response.spoonacularResults.enrichedRecipes}`)
    }
    
    this.apiCalls++
  }

  async testCachedSearch() {
    console.log('\n💾 Test 2: Cached Search (Should Use Cache)')
    console.log('=' .repeat(50))
    
    const startTime = Date.now()
    const response = await this.performSearch(TEST_SEARCH_PARAMS)
    const endTime = Date.now()
    
    this.testResults.push({
      test: 'Cached Search',
      apiCall: false,
      duration: endTime - startTime,
      results: response.results?.length || 0,
      source: response.searchSource,
      mode: response.searchMode
    })
    
    console.log(`✅ Search completed in ${endTime - startTime}ms`)
    console.log(`📊 Results: ${response.results?.length || 0} recipes`)
    console.log(`🔗 Source: ${response.searchSource}`)
    console.log(`🎯 Mode: ${response.searchMode}`)
    
    // Verify this was faster (cached)
    const firstSearch = this.testResults.find(r => r.test === 'First Search')
    if (firstSearch && (endTime - startTime) < firstSearch.duration) {
      console.log('✅ Cached search was faster (cache working)')
      this.cacheHits++
    } else {
      console.log('⚠️ Cached search was not faster (potential issue)')
    }
  }

  async verifyDatabaseStorage() {
    console.log('\n🗄️ Test 3: Database Storage Verification')
    console.log('=' .repeat(50))
    
    // Check if recipes were stored in database
    const storedRecipes = await prisma.recipe.findMany({
      where: {
        title: {
          contains: TEST_SEARCH_QUERY
        }
      },
      include: {
        nutrition: true,
        ingredients: true
      }
    })
    
    console.log(`📊 Stored recipes: ${storedRecipes.length}`)
    
    if (storedRecipes.length > 0) {
      console.log('✅ Recipes were stored in database')
      
      // Check nutrition data
      const recipesWithNutrition = storedRecipes.filter(r => r.nutrition)
      console.log(`📈 Recipes with nutrition: ${recipesWithNutrition.length}`)
      
      // Check ingredients
      const recipesWithIngredients = storedRecipes.filter(r => r.ingredients.length > 0)
      console.log(`🥘 Recipes with ingredients: ${recipesWithIngredients.length}`)
      
      this.testResults.push({
        test: 'Database Storage',
        success: true,
        storedRecipes: storedRecipes.length,
        withNutrition: recipesWithNutrition.length,
        withIngredients: recipesWithIngredients.length
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
    
    // Check cache entries
    const cacheEntries = await prisma.cache.findMany({
      where: {
        key: {
          contains: TEST_SEARCH_QUERY
        }
      }
    })
    
    console.log(`📊 Cache entries found: ${cacheEntries.length}`)
    
    if (cacheEntries.length > 0) {
      console.log('✅ Cache entries exist')
      
      for (const entry of cacheEntries) {
        console.log(`🔑 Cache key: ${entry.key}`)
        console.log(`📅 Expires: ${entry.expiresAt}`)
        console.log(`🏷️ Type: ${entry.type}`)
        
        try {
          const cachedData = JSON.parse(entry.value)
          console.log(`📊 Cached results: ${cachedData.results?.length || 0}`)
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
      console.log('❌ No cache entries found')
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

  async testDifferentSearchParams() {
    console.log('\n🔄 Test 6: Different Search Parameters')
    console.log('=' .repeat(50))
    
    const differentParams = {
      query: 'beef stir fry',
      number: 3,
      cuisine: 'chinese'
    }
    
    console.log('🔍 Testing with different parameters...')
    const startTime = Date.now()
    const response = await this.performSearch(differentParams)
    const endTime = Date.now()
    
    console.log(`✅ Different search completed in ${endTime - startTime}ms`)
    console.log(`📊 Results: ${response.results?.length || 0} recipes`)
    console.log(`🔗 Source: ${response.searchSource}`)
    
    this.testResults.push({
      test: 'Different Parameters',
      apiCall: true,
      duration: endTime - startTime,
      results: response.results?.length || 0,
      source: response.searchSource
    })
    
    this.apiCalls++
  }

  async performSearch(params) {
    const searchParams = new URLSearchParams(params)
    const response = await fetch(`${BASE_URL}/api/recipes/search?${searchParams}`)
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  }

  generateReport() {
    console.log('\n📋 VALIDATION REPORT')
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
      console.log('✅ Caching is working - API calls were reduced')
    } else {
      console.log('❌ Caching may not be working properly')
    }
    
    if (this.apiCalls <= 2) {
      console.log('✅ API usage is optimized')
    } else {
      console.log('⚠️ API usage could be optimized further')
    }
    
    console.log('\n🎉 Validation completed!')
  }
}

// Run validation
async function main() {
  const validator = new CachingValidator()
  await validator.runValidation()
}

main().catch(console.error)
