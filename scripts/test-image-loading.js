#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

// Test images to verify
const testImages = [
  '/images/chicken-pasta.svg',
  '/images/beef-stir-fry.svg',
  '/images/salad.svg',
  '/images/margherita-pizza.svg',
  '/images/chicken-salad.svg',
  '/images/chocolate-cookies.svg'
];

async function testImageLoading() {
  console.log('🧪 Testing image loading...');
  
  const results = [];
  
  for (const imagePath of testImages) {
    try {
      const response = await fetch(`${BASE_URL}${imagePath}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log(`✅ ${imagePath} - Status: ${response.status}, Content-Type: ${contentType}`);
        results.push({ path: imagePath, status: response.status, success: true });
      } else {
        console.log(`❌ ${imagePath} - Status: ${response.status}`);
        results.push({ path: imagePath, status: response.status, success: false });
      }
    } catch (error) {
      console.log(`❌ ${imagePath} - Error: ${error.message}`);
      results.push({ path: imagePath, error: error.message, success: false });
    }
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n📊 Summary:');
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('🎉 All images are loading correctly!');
  } else {
    console.log('⚠️  Some images failed to load');
  }
  
  return results;
}

// Test API endpoints
async function testAPIEndpoints() {
  console.log('\n🔍 Testing API endpoints...');
  
  try {
    // Test search endpoint
    const searchResponse = await fetch(`${BASE_URL}/api/recipes?q=chicken`);
    const searchData = await searchResponse.json();
    
    if (searchData.results && searchData.results.length > 0) {
      const imagePath = searchData.results[0].image;
      console.log(`✅ Search API - Recipe image: ${imagePath}`);
      
      // Test if the image path is valid
      if (imagePath && imagePath.startsWith('/images/')) {
        const imageResponse = await fetch(`${BASE_URL}${imagePath}`);
        if (imageResponse.ok) {
          console.log(`✅ Image from API loads correctly: ${imagePath}`);
        } else {
          console.log(`❌ Image from API failed to load: ${imagePath}`);
        }
      }
    }
    
    // Test individual recipe endpoint
    const recipeResponse = await fetch(`${BASE_URL}/api/recipe/128`);
    const recipeData = await recipeResponse.json();
    
    if (recipeData.recipe) {
      const imagePath = recipeData.recipe.image;
      console.log(`✅ Recipe API - Recipe image: ${imagePath}`);
    }
    
  } catch (error) {
    console.error('❌ API test error:', error.message);
  }
}

// Run tests
async function runTests() {
  await testImageLoading();
  await testAPIEndpoints();
}

runTests()
  .then(() => {
    console.log('\n🎉 All tests completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
