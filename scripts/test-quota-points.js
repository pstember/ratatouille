#!/usr/bin/env node

/**
 * Test script to verify the new quota points system with database persistence
 * This script tests the QuotaService with database storage
 */

import fetch from 'node-fetch'

async function testQuotaPoints() {
  console.log('🧪 Testing new quota points system with database persistence...\n')
  
  try {
    // First, check current quota status
    console.log('1. Checking current quota status...')
    const quotaResponse = await fetch('http://localhost:3003/api/quota')
    const quotaData = await quotaResponse.json()
    console.log('Current quota info:', {
      quotaUsed: quotaData.quotaInfo?.quotaUsed,
      quotaLeft: quotaData.quotaInfo?.quotaLeft,
      percentageUsed: quotaData.quotaInfo?.percentageUsed,
      hasQuota: quotaData.quotaInfo?.hasQuota,
      dailyUsage: quotaData.quotaInfo?.dailyUsage
    })
    
    // Make a search request to test quota tracking
    console.log('\n2. Making a search request to test quota tracking...')
    try {
      const searchResponse = await fetch('http://localhost:3003/api/recipes/search?query=pasta&number=5')
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        console.log('Search successful!')
        console.log('Quota info from response:', {
          quotaUsed: searchData.quotaInfo?.quotaUsed,
          quotaLeft: searchData.quotaInfo?.quotaLeft,
          quotaRequest: searchData.quotaInfo?.quotaRequest
        })
      } else {
        const errorData = await searchResponse.json()
        console.log('Search failed with status:', searchResponse.status)
        console.log('Error data:', errorData)
        
        if (searchResponse.status === 402) {
          console.log('✅ Quota exceeded error detected!')
          console.log('Quota info from error:', errorData.data?.quotaInfo)
        }
      }
    } catch (error) {
      console.log('Request failed:', error.message)
    }
    
    // Check quota status again to see if it was updated
    console.log('\n3. Checking quota status after request...')
    const quotaResponse2 = await fetch('http://localhost:3003/api/quota')
    const quotaData2 = await quotaResponse2.json()
    console.log('Updated quota info:', {
      quotaUsed: quotaData2.quotaInfo?.quotaUsed,
      quotaLeft: quotaData2.quotaInfo?.quotaLeft,
      percentageUsed: quotaData2.quotaInfo?.percentageUsed,
      hasQuota: quotaData2.quotaInfo?.hasQuota,
      dailyUsage: quotaData2.quotaInfo?.dailyUsage
    })
    
    // Test database persistence by making another request
    console.log('\n4. Testing database persistence with another request...')
    try {
      const searchResponse2 = await fetch('http://localhost:3003/api/recipes/search?query=chicken&number=3')
      if (searchResponse2.ok) {
        const searchData2 = await searchResponse2.json()
        console.log('Second search successful!')
        console.log('Updated quota info:', {
          quotaUsed: searchData2.quotaInfo?.quotaUsed,
          quotaLeft: searchData2.quotaInfo?.quotaLeft,
          quotaRequest: searchData2.quotaInfo?.quotaRequest
        })
      }
    } catch (error) {
      console.log('Second request failed:', error.message)
    }
    
    // Final quota check
    console.log('\n5. Final quota status check...')
    const quotaResponse3 = await fetch('http://localhost:3003/api/quota')
    const quotaData3 = await quotaResponse3.json()
    console.log('Final quota info:', {
      quotaUsed: quotaData3.quotaInfo?.quotaUsed,
      quotaLeft: quotaData3.quotaInfo?.quotaLeft,
      percentageUsed: quotaData3.quotaInfo?.percentageUsed,
      hasQuota: quotaData3.quotaInfo?.hasQuota,
      dailyUsage: quotaData3.quotaInfo?.dailyUsage
    })
    
    console.log('\n✅ Quota points system test completed!')
    console.log('📊 Summary:')
    console.log(`   - Initial quota used: ${quotaData.quotaInfo?.quotaUsed || 0} points`)
    console.log(`   - Final quota used: ${quotaData3.quotaInfo?.quotaUsed || 0} points`)
    console.log(`   - Total points consumed: ${(quotaData3.quotaInfo?.quotaUsed || 0) - (quotaData.quotaInfo?.quotaUsed || 0)} points`)
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testQuotaPoints()
