#!/usr/bin/env node

/**
 * Test script to verify quota monitoring updates correctly
 * This script simulates a quota exceeded scenario and checks if the quota info updates
 */

const fetch = require('node-fetch')

async function testQuotaUpdate() {
  console.log('🧪 Testing quota monitoring system...\n')
  
  try {
    // First, check current quota status
    console.log('1. Checking current quota status...')
    const quotaResponse = await fetch('http://localhost:3000/api/quota')
    const quotaData = await quotaResponse.json()
    console.log('Current quota info:', {
      quotaUsed: quotaData.quotaInfo?.quotaUsed,
      quotaLeft: quotaData.quotaInfo?.quotaLeft,
      percentageUsed: quotaData.quotaInfo?.percentageUsed,
      hasQuota: quotaData.quotaInfo?.hasQuota
    })
    
    // Try to make a request that might trigger quota exceeded
    console.log('\n2. Making a request that might trigger quota exceeded...')
    try {
      const searchResponse = await fetch('http://localhost:3000/api/recipes/search?query=test&number=100')
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        console.log('Search successful, quota used:', searchData.quotaInfo?.quotaUsed)
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
    
    // Check quota status again
    console.log('\n3. Checking quota status after request...')
    const quotaResponse2 = await fetch('http://localhost:3000/api/quota')
    const quotaData2 = await quotaResponse2.json()
    console.log('Updated quota info:', {
      quotaUsed: quotaData2.quotaInfo?.quotaUsed,
      quotaLeft: quotaData2.quotaInfo?.quotaLeft,
      percentageUsed: quotaData2.quotaInfo?.percentageUsed,
      hasQuota: quotaData2.quotaInfo?.hasQuota
    })
    
    console.log('\n✅ Test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testQuotaUpdate()
