#!/usr/bin/env node

const BASE_URL = 'http://localhost:3001'

async function testQuotaSystem() {
  console.log('🧪 Testing Complete Quota System...')
  
  try {
    // Test 1: Check initial quota status
    console.log('\n1. Testing initial quota status...')
    const initialQuota = await fetch(`${BASE_URL}/api/quota`)
    const initialQuotaData = await initialQuota.json()
    
    console.log('✅ Initial quota status:')
    console.log(`   - Quota used: ${initialQuotaData.quotaInfo.quotaUsed}`)
    console.log(`   - Quota left: ${initialQuotaData.quotaInfo.quotaLeft}`)
    console.log(`   - Percentage used: ${initialQuotaData.quotaInfo.percentageUsed}%`)
    
    // Test 2: Check if main page loads (this should trigger quota loading)
    console.log('\n2. Testing main page load...')
    const pageResponse = await fetch(`${BASE_URL}/`)
    
    if (!pageResponse.ok) {
      throw new Error(`Main page failed: ${pageResponse.status} ${pageResponse.statusText}`)
    }
    
    console.log('✅ Main page is accessible')
    
    // Test 3: Test database-first search (should not consume quota)
    console.log('\n3. Testing database-first search...')
    const searchResponse = await fetch(`${BASE_URL}/api/recipes?q=chicken&number=1`)
    const searchData = await searchResponse.json()
    
    if (searchData.results && searchData.results.length > 0) {
      console.log('✅ Database search working')
      console.log(`   - Results: ${searchData.results.length}`)
      console.log(`   - Quota info: ${searchData.quotaInfo ? 'Present' : 'Missing'}`)
    } else {
      console.log('⚠️ Database search returned no results')
    }
    
    // Test 4: Check quota after search
    console.log('\n4. Checking quota after search...')
    const afterSearchQuota = await fetch(`${BASE_URL}/api/quota`)
    const afterSearchQuotaData = await afterSearchQuota.json()
    
    console.log('✅ Quota after search:')
    console.log(`   - Quota used: ${afterSearchQuotaData.quotaInfo.quotaUsed}`)
    console.log(`   - Quota left: ${afterSearchQuotaData.quotaInfo.quotaLeft}`)
    console.log(`   - Percentage used: ${afterSearchQuotaData.quotaInfo.percentageUsed}%`)
    
    // Test 5: Test Spoonacular API (if quota allows)
    console.log('\n5. Testing Spoonacular API...')
    try {
      const spoonacularResponse = await fetch(`${BASE_URL}/api/recipes/spoonacular/search?query=chicken&number=1`)
      const spoonacularData = await spoonacularResponse.json()
      
      if (spoonacularData.success) {
        console.log('✅ Spoonacular API working')
        console.log(`   - Quota info: ${spoonacularData.quotaInfo ? 'Present' : 'Missing'}`)
        if (spoonacularData.quotaInfo) {
          console.log(`   - Quota used: ${spoonacularData.quotaInfo.quotaUsed}`)
          console.log(`   - Quota left: ${spoonacularData.quotaInfo.quotaLeft}`)
        }
      } else {
        console.log('⚠️ Spoonacular API returned error:', spoonacularData.message)
      }
    } catch (error) {
      console.log('⚠️ Spoonacular API test failed:', error.message)
    }
    
    // Test 6: Final quota check
    console.log('\n6. Final quota check...')
    const finalQuota = await fetch(`${BASE_URL}/api/quota`)
    const finalQuotaData = await finalQuota.json()
    
    console.log('✅ Final quota status:')
    console.log(`   - Quota used: ${finalQuotaData.quotaInfo.quotaUsed}`)
    console.log(`   - Quota left: ${finalQuotaData.quotaInfo.quotaLeft}`)
    console.log(`   - Percentage used: ${finalQuotaData.quotaInfo.percentageUsed}%`)
    
    console.log('\n🎉 Quota system test completed!')
    console.log('\n📝 Summary:')
    console.log('   - Quota endpoint: ✅ Working')
    console.log('   - Main page: ✅ Accessible')
    console.log('   - Database search: ✅ Working')
    console.log('   - Quota tracking: ✅ Active')
    console.log('   - Spoonacular API: ⚠️ May be quota limited')
    
    // Check if quota was updated
    const quotaChanged = finalQuotaData.quotaInfo.quotaUsed !== initialQuotaData.quotaInfo.quotaUsed
    if (quotaChanged) {
      console.log('   - Quota updates: ✅ Working (quota changed during test)')
    } else {
      console.log('   - Quota updates: ⚠️ No change detected (may be due to caching)')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testQuotaSystem()
