// Test the search endpoint directly
async function testSearchEndpoint() {
  try {
    console.log('Testing search endpoint...')
    
    const response = await fetch('http://localhost:3000/api/recipes/search?query=chicken&offset=0&number=1&addRecipeInformation=true&addRecipeNutrition=true&mode=spoonacular&confirmedQuotaUsage=true&userConsent=true')
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const data = await response.text()
    console.log('Response body:', data)
    
  } catch (error) {
    console.error('Error testing search endpoint:', error)
  }
}

testSearchEndpoint()
