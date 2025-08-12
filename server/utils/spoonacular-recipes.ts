import type {
  SearchRecipes200Response,
  SearchRecipes200ResponseResultsInner
} from '~/types/spoonacular-types'
import { handleSpoonacularError } from './spoonacular-error-handler'

export interface RecipeSearchParams {
  query?: string
  cuisine?: string
  diet?: string
  intolerances?: string
  equipment?: string
  includeIngredients?: string
  excludeIngredients?: string
  type?: string
  maxReadyTime?: number
  minProtein?: number
  maxProtein?: number
  minFat?: number
  maxFat?: number
  minCarbs?: number
  maxCarbs?: number
  addRecipeInformation?: boolean
  addRecipeNutrition?: boolean
  fillIngredients?: boolean
  addRecipeInstructions?: boolean
  offset?: number
  number?: number
}

import { SpoonacularClient } from './spoonacular-client'

export async function searchRecipes(
  params: RecipeSearchParams
): Promise<SearchRecipes200Response & { quotaInfo?: any }> {
  try {
    console.log('Calling Spoonacular API with params:', JSON.stringify(params, null, 2))
    
    // Build query parameters
    const queryParams: Record<string, any> = {}
    
    if (params.query) queryParams.query = params.query
    if (params.cuisine) queryParams.cuisine = params.cuisine
    if (params.diet) queryParams.diet = params.diet
    if (params.intolerances) queryParams.intolerances = params.intolerances
    if (params.equipment) queryParams.equipment = params.equipment
    if (params.includeIngredients) queryParams.includeIngredients = params.includeIngredients
    if (params.excludeIngredients) queryParams.excludeIngredients = params.excludeIngredients
    if (params.type) queryParams.type = params.type
    if (params.maxReadyTime) queryParams.maxReadyTime = params.maxReadyTime.toString()
    if (params.minProtein) queryParams.minProtein = params.minProtein.toString()
    if (params.maxProtein) queryParams.maxProtein = params.maxProtein.toString()
    if (params.minFat) queryParams.minFat = params.minFat.toString()
    if (params.maxFat) queryParams.maxFat = params.maxFat.toString()
    if (params.minCarbs) queryParams.minCarbs = params.minCarbs.toString()
    if (params.maxCarbs) queryParams.maxCarbs = params.maxCarbs.toString()
    if (params.addRecipeInformation) queryParams.addRecipeInformation = params.addRecipeInformation.toString()
    if (params.addRecipeNutrition) queryParams.addRecipeNutrition = params.addRecipeNutrition.toString()
    if (params.fillIngredients) queryParams.fillIngredients = params.fillIngredients.toString()
    if (params.addRecipeInstructions) queryParams.addRecipeInstructions = params.addRecipeInstructions.toString()
    if (params.offset !== undefined) queryParams.offset = params.offset.toString()
    if (params.number) queryParams.number = params.number.toString()
    
    const response = await SpoonacularClient.searchRecipes(queryParams)
    
    console.log('Spoonacular API response received:', response.data ? 'success' : 'null')
    
    if (!response.data || !Array.isArray(response.data.results)) {
      throw new Error('Invalid search response from Spoonacular API')
    }
    
    return {
      ...response.data,
      quotaInfo: response.quotaInfo
    }
  } catch (error) {
    console.error('Spoonacular API error:', error)
    handleSpoonacularError(error, 'searchRecipes', params)
  }
}
