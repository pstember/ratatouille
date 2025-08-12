import { SpoonacularClient } from './spoonacular-client'
import { handleSpoonacularError } from './spoonacular-error-handler'

export interface RandomRecipeParams {
  tags?: string
  number?: number
  limitLicense?: boolean
}

export async function getRandomRecipes(
  params: RandomRecipeParams = {}
): Promise<any> {
  try {
    console.log('Calling Spoonacular random recipes API with params:', JSON.stringify(params, null, 2))
    
    // Build query parameters
    const queryParams: Record<string, any> = {}
    
    if (params.tags) queryParams.tags = params.tags
    if (params.number) queryParams.number = params.number.toString()
    if (params.limitLicense) queryParams.limitLicense = params.limitLicense.toString()
    
    const response = await SpoonacularClient.getRandomRecipes(queryParams)
    
    console.log('Spoonacular random recipes API response received:', response.data ? 'success' : 'null')
    
    if (!response.data || !Array.isArray(response.data.recipes)) {
      throw new Error('Invalid random recipes response from Spoonacular API')
    }
    
    return response.data
  } catch (error) {
    handleSpoonacularError(error, 'getRandomRecipes', params)
  }
}
