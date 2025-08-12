import fetch from 'node-fetch'

async function testComplexSearch() {
  console.log('🔍 Testing complexSearch endpoint directly...\n')

  const apiKey = process.env.SPOONACULAR_API_KEY
  if (!apiKey) {
    console.error('❌ SPOONACULAR_API_KEY not found in environment')
    return
  }

  try {
    const url = `https://api.spoonacular.com/recipes/complexSearch?query=chicken&number=1&addRecipeInformation=true&addRecipeNutrition=true&fillIngredients=true&apiKey=${apiKey}`
    
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
      
      // Test our nutrition transformation
      console.log('\n🔄 Testing nutrition transformation:')
      let nutritionData = null
      if (recipe.nutrition && recipe.nutrition.nutrients) {
        const nutrition = {}
        recipe.nutrition.nutrients.forEach((nutrient) => {
          const name = nutrient.name.toLowerCase()
          if (name.includes('calories')) nutrition.calories = nutrient.amount
          else if (name.includes('protein')) nutrition.protein = nutrient.amount
          else if (name.includes('fat')) nutrition.fat = nutrient.amount
          else if (name.includes('carbohydrate')) nutrition.carbs = nutrient.amount
          else if (name.includes('fiber')) nutrition.fiber = nutrient.amount
          else if (name.includes('sugar')) nutrition.sugar = nutrient.amount
          else if (name.includes('sodium')) nutrition.sodium = nutrient.amount
        })
        nutritionData = nutrition
        console.log('✅ Transformed nutrition data:', nutritionData)
      }
      
    } else {
      console.log('❌ No results found in response')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testComplexSearch()
