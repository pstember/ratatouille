import fetch from 'node-fetch'

async function testSpoonacularEndpoints() {
  console.log('🔍 Testing different Spoonacular API endpoints...\n')

  const apiKey = process.env.SPOONACULAR_API_KEY
  if (!apiKey) {
    console.error('❌ SPOONACULAR_API_KEY not found in environment')
    return
  }

  const baseUrl = 'https://api.spoonacular.com'
  const recipeId = 633088 // Jamaican Curry Chicken from previous test

  const endpoints = [
    {
      name: 'Search endpoint (current)',
      url: `${baseUrl}/recipes/search?query=chicken&number=1&addRecipeInformation=true&addRecipeNutrition=true&apiKey=${apiKey}`
    },
    {
      name: 'Complex search endpoint',
      url: `${baseUrl}/recipes/complexSearch?query=chicken&number=1&addRecipeInformation=true&addRecipeNutrition=true&apiKey=${apiKey}`
    },
    {
      name: 'Recipe information endpoint',
      url: `${baseUrl}/recipes/${recipeId}/information?apiKey=${apiKey}`
    },
    {
      name: 'Recipe information with nutrition',
      url: `${baseUrl}/recipes/${recipeId}/information?includeNutrition=true&apiKey=${apiKey}`
    }
  ]

  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: ${endpoint.name}`)
    console.log(`URL: ${endpoint.url}`)
    
    try {
      const response = await fetch(endpoint.url)
      
      if (!response.ok) {
        console.log(`❌ Failed: ${response.status} ${response.statusText}`)
        continue
      }

      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        const recipe = data.results[0]
        console.log(`✅ Success! Recipe: ${recipe.title}`)
        console.log(`- Has nutrition: ${!!recipe.nutrition}`)
        console.log(`- Keys: ${Object.keys(recipe).join(', ')}`)
        
        if (recipe.nutrition) {
          console.log(`- Nutrition keys: ${Object.keys(recipe.nutrition).join(', ')}`)
        }
      } else if (data.id) {
        // Single recipe response
        console.log(`✅ Success! Recipe: ${data.title}`)
        console.log(`- Has nutrition: ${!!data.nutrition}`)
        console.log(`- Keys: ${Object.keys(data).join(', ')}`)
        
        if (data.nutrition) {
          console.log(`- Nutrition keys: ${Object.keys(data.nutrition).join(', ')}`)
          if (data.nutrition.nutrients) {
            console.log(`- Nutrients count: ${data.nutrition.nutrients.length}`)
            console.log(`- First nutrients: ${data.nutrition.nutrients.slice(0, 3).map(n => n.name).join(', ')}`)
          }
        }
      } else {
        console.log(`❌ Unexpected response structure`)
        console.log(`- Response keys: ${Object.keys(data).join(', ')}`)
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
  }
}

testSpoonacularEndpoints()
