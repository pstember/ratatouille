#!/usr/bin/env node

const BASE_URL = 'http://localhost:3000'

async function testQuotaLoader() {
  console.log('🧪 Testing Quota Loader...')
  
  try {
    // Test 1: Check if quota endpoint is accessible
    console.log('\n1. Testing quota endpoint...')
    const quotaResponse = await fetch(`${BASE_URL}/api/quota`)
    
    if (!quotaResponse.ok) {
      throw new Error(`Quota endpoint failed: ${quotaResponse.status} ${quotaResponse.statusText}`)
    }
    
    const quotaData = await quotaResponse.json()
    console.log('✅ Quota endpoint is working')
    console.log(`   - Quota used: ${quotaData.quotaInfo.quotaUsed}`)
    console.log(`   - Quota left: ${quotaData.quotaInfo.quotaLeft}`)
    console.log(`   - Percentage used: ${quotaData.quotaInfo.percentageUsed}%`)
    
    // Test 2: Check if the main page loads (this would trigger quota loading)
    console.log('\n2. Testing main page load...')
    const pageResponse = await fetch(`${BASE_URL}/`)
    
    if (!pageResponse.ok) {
      throw new Error(`Main page failed: ${pageResponse.status} ${pageResponse.statusText}`)
    }
    
    console.log('✅ Main page is accessible')
    
    // Test 3: Check if health endpoint works
    console.log('\n3. Testing health endpoint...')
    const healthResponse = await fetch(`${BASE_URL}/api/health`)
    
    if (!healthResponse.ok) {
      throw new Error(`Health endpoint failed: ${healthResponse.status} ${healthResponse.statusText}`)
    }
    
    const healthData = await healthResponse.json()
    console.log('✅ Health endpoint is working')
    console.log(`   - Status: ${healthData.status}`)
    console.log(`   - Uptime: ${healthData.uptime}s`)
    
    console.log('\n🎉 All tests passed! The quota loader should be working correctly.')
    console.log('\n📝 Summary:')
    console.log('   - Quota endpoint: ✅ Working')
    console.log('   - Main page: ✅ Accessible')
    console.log('   - Health endpoint: ✅ Working')
    console.log('   - Quota data: ✅ Available')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testQuotaLoader()