import fetch from 'node-fetch'

async function debugSpoonacularResponse() {
  console.log('🔍 Debugging Spoonacular API response...\n')

  try {
    // Get API key from environment
    const apiKey = process.env.SPOONACULAR_API_KEY
    if (!apiKey) {
      console.error('❌ SPOONACULAR_API_KEY not found in environment')
      return
    }

    // Make a test request
    const url = `https://api.spoonacular.com/recipes/search?query=chicken&number=1&addRecipeInformation=true&addRecipeNutrition=true&fillIngredients=true&apiKey=${apiKey}`
    
    console.log('📡 Making request to:', url)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText)
      return
    }

    const data = await response.json()
    
    console.log('✅ API Response received!')
    console.log('📊 Response structure:')
    console.log('- Total results:', data.totalResults)
    console.log('- Results array length:', data.results?.length || 0)
    
    if (data.results && data.results.length > 0) {
      const recipe = data.results[0]
      console.log('\n🍳 First recipe structure:')
      console.log('- ID:', recipe.id)
      console.log('- Title:', recipe.title)
      console.log('- Image:', recipe.image)
      console.log('- Servings:', recipe.servings)
      console.log('- Ready in minutes:', recipe.readyInMinutes)
      console.log('- Cuisines:', recipe.cuisines)
      console.log('- Has nutrition:', !!recipe.nutrition)
      
      if (recipe.nutrition) {
        console.log('\n🥗 Nutrition data structure:')
        console.log('- Type:', typeof recipe.nutrition)
        console.log('- Keys:', Object.keys(recipe.nutrition))
        
        if (recipe.nutrition.nutrients) {
          console.log('- Nutrients array length:', recipe.nutrition.nutrients.length)
          console.log('- First few nutrients:')
          recipe.nutrition.nutrients.slice(0, 5).forEach((nutrient, index) => {
            console.log(`  ${index + 1}. ${nutrient.name}: ${nutrient.amount} ${nutrient.unit}`)
          })
        }
      } else {
        console.log('\n❌ No nutrition data found!')
      }
      
      console.log('\n📝 Recipe keys:')
      console.log(Object.keys(recipe))
      
    } else {
      console.log('❌ No results found in response')
    }

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugSpoonacularResponse()
