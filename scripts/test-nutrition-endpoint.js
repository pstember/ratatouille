import { config } from 'dotenv'

// Load environment variables
config()

async function testNutritionEndpoint() {
  try {
    console.log('🔍 Testing different nutrition endpoints...')
    
    const apiKey = process.env.SPOONACULAR_API_KEY
    if (!apiKey) {
      console.error('❌ SPOONACULAR_API_KEY not found in environment variables')
      return
    }
    
    const recipeId = 660670 // The specific recipe we're testing
    
    // Test 1: Basic recipe information without nutrition
    console.log('\n📡 Test 1: Basic recipe information...')
    const basicUrl = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}`
    const basicResponse = await fetch(basicUrl)
    const basicData = await basicResponse.json()
    console.log(`✅ Basic response - Has nutrition: ${basicData.nutrition ? '✅' : '❌'}`)
    
    // Test 2: Recipe information with nutrition parameter
    console.log('\n📡 Test 2: Recipe information with addRecipeNutrition=true...')
    const nutritionUrl = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}&addRecipeNutrition=true`
    const nutritionResponse = await fetch(nutritionUrl)
    const nutritionData = await nutritionResponse.json()
    console.log(`✅ Nutrition response - Has nutrition: ${nutritionData.nutrition ? '✅' : '❌'}`)
    
    // Test 3: Try the nutrition endpoint directly
    console.log('\n📡 Test 3: Direct nutrition endpoint...')
    const directNutritionUrl = `https://api.spoonacular.com/recipes/${recipeId}/nutritionWidget.json?apiKey=${apiKey}`
    try {
      const directNutritionResponse = await fetch(directNutritionUrl)
      const directNutritionData = await directNutritionResponse.json()
      console.log('✅ Direct nutrition endpoint response:')
      console.log(JSON.stringify(directNutritionData, null, 2))
    } catch (error) {
      console.log('❌ Direct nutrition endpoint failed:', error.message)
    }
    
    // Test 4: Try with different parameters
    console.log('\n📡 Test 4: Recipe information with all parameters...')
    const allParamsUrl = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}&addRecipeNutrition=true&addRecipeInformation=true&addRecipeInstructions=true&fillIngredients=true`
    const allParamsResponse = await fetch(allParamsUrl)
    const allParamsData = await allParamsResponse.json()
    console.log(`✅ All params response - Has nutrition: ${allParamsData.nutrition ? '✅' : '❌'}`)
    
    if (allParamsData.nutrition) {
      console.log('📈 Nutrition data found:')
      console.log(JSON.stringify(allParamsData.nutrition, null, 2))
    }
    
    // Test 5: Check API quota and plan
    console.log('\n📡 Test 5: Checking API quota...')
    const quotaUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${apiKey}&query=pasta&number=1`
    const quotaResponse = await fetch(quotaUrl)
    const quotaData = await quotaResponse.json()
    
    console.log('✅ Quota test response headers:')
    console.log('Content-Type:', quotaResponse.headers.get('content-type'))
    console.log('X-API-Quota-Used:', quotaResponse.headers.get('x-api-quota-used'))
    console.log('X-API-Quota-Left:', quotaResponse.headers.get('x-api-quota-left'))
    
    // Test 6: Try a different recipe that might have nutrition data
    console.log('\n📡 Test 6: Testing a popular recipe...')
    const popularUrl = `https://api.spoonacular.com/recipes/716429/information?apiKey=${apiKey}&addRecipeNutrition=true`
    const popularResponse = await fetch(popularUrl)
    const popularData = await popularResponse.json()
    console.log(`✅ Popular recipe response - Has nutrition: ${popularData.nutrition ? '✅' : '❌'}`)
    
    if (popularData.nutrition) {
      console.log('📈 Popular recipe nutrition data:')
      console.log(JSON.stringify(popularData.nutrition, null, 2))
    }
    
  } catch (error) {
    console.error('❌ Error testing nutrition endpoints:', error)
  }
}

testNutritionEndpoint()
