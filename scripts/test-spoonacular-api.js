import Spoonacular from 'spoonacular'

// Test the Spoonacular API directly
async function testSpoonacularAPI() {
  try {
    console.log('Testing Spoonacular API...')
    
    // Initialize the API client
    const defaultClient = Spoonacular.ApiClient.instance
    defaultClient.authentications['apiKeyScheme'].apiKey = 'ea71661e2f4f444286cdf28cd88bb478'
    defaultClient.basePath = 'https://api.spoonacular.com'
    
    // Create API instance
    const recipesApi = new Spoonacular.RecipesApi()
    
    console.log('Calling searchRecipes...')
    
    // Call the search method
    const response = await recipesApi.searchRecipes(
      'chicken', // query
      undefined, // cuisine
      undefined, // diet
      undefined, // intolerances
      undefined, // equipment
      undefined, // includeIngredients
      undefined, // excludeIngredients
      undefined, // type
      undefined, // maxReadyTime
      undefined, // minProtein
      undefined, // maxProtein
      undefined, // minFat
      undefined, // maxFat
      undefined, // minCarbs
      undefined, // maxCarbs
      true, // addRecipeInformation
      true, // addRecipeNutrition
      true, // fillIngredients
      undefined, // addRecipeInstructions
      0, // offset
      1 // number
    )
    
    console.log('Response received:', response)
    console.log('Results count:', response.results?.length || 0)
    
  } catch (error) {
    console.error('Error testing Spoonacular API:', error)
    console.error('Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      stack: error.stack
    })
  }
}

testSpoonacularAPI()
