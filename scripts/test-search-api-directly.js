import fetch from 'node-fetch'

async function testSearchApiDirectly() {
  console.log('🔍 Testing search API directly...\n')

  try {
    const url = 'http://localhost:3000/api/recipes/search?mode=spoonacular&query=chicken&number=1&addRecipeNutrition=true&addRecipeInformation=true&_nocache=1'
    
    console.log('📡 Making request to:', url)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText)
      return
    }

    const data = await response.json()
    
    console.log('✅ API Response received!')
    console.log('📊 Response structure:')
    console.log('- Results count:', data.results?.length || 0)
    console.log('- Total results:', data.totalResults)
    console.log('- Search source:', data.searchSource)
    console.log('- Search mode:', data.searchMode)
    console.log('- Enriched recipes:', data.enrichmentStats?.newRecipes || 0)
    
    if (data.results && data.results.length > 0) {
      const recipe = data.results[0]
      console.log('\n🍳 First recipe:')
      console.log('- ID:', recipe.id)
      console.log('- Title:', recipe.title)
      console.log('- Has nutrition:', !!recipe.nutrition)
      console.log('- Nutrition data:', recipe.nutrition)
      console.log('- Source:', recipe._source)
    }
    
    // Check if there are any error messages in the response
    if (data.error) {
      console.log('\n❌ Error in response:', data.error)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testSearchApiDirectly()
