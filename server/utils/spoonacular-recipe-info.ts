import { SpoonacularClient } from './spoonacular-client'
import { handleSpoonacularError } from './spoonacular-error-handler'

export async function getRecipeInformation(
  id: number,
  addRecipeNutrition: boolean = true,
  fillIngredients: boolean = true
): Promise<any> {
  try {
    console.log(`Calling Spoonacular recipe information API for recipe ${id}`)
    
    const response = await SpoonacularClient.getRecipeInformation(id, addRecipeNutrition, fillIngredients)
    
    console.log(`Spoonacular recipe information API response received for recipe ${id}:`, response.data ? 'success' : 'null')
    
    if (!response.data || !response.data.id) {
      throw new Error('Invalid recipe information response from Spoonacular API')
    }
    
    return response.data
  } catch (error) {
    handleSpoonacularError(error, 'getRecipeInformation', { id })
  }
}

export async function getRecipeEquipment(
  id: number
): Promise<any | null> {
  try {
    console.log(`Calling Spoonacular recipe equipment API for recipe ${id}`)
    
    const response = await SpoonacularClient.getRecipeEquipment(id)
    
    console.log(`Spoonacular recipe equipment API response received for recipe ${id}:`, response.data ? 'success' : 'null')
    
    return response.data
  } catch (error) {
    console.warn(`Failed to fetch equipment for recipe ${id}:`, error)
    return null
  }
}

export async function getRecipePriceBreakdown(
  id: number
): Promise<any | null> {
  try {
    console.log(`Calling Spoonacular recipe price breakdown API for recipe ${id}`)
    
    const response = await SpoonacularClient.getRecipePriceBreakdown(id)
    
    console.log(`Spoonacular recipe price breakdown API response received for recipe ${id}:`, response.data ? 'success' : 'null')
    
    return response.data
  } catch (error) {
    console.warn(`Failed to fetch price breakdown for recipe ${id}:`, error)
    return null
  }
}

export async function getRecipeWinePairing(
  id: number
): Promise<any | null> {
  try {
    console.log(`Calling Spoonacular recipe wine pairing API for recipe ${id}`)
    
    const response = await SpoonacularClient.getRecipeWinePairing(id)
    
    console.log(`Spoonacular recipe wine pairing API response received for recipe ${id}:`, response.data ? 'success' : 'null')
    
    return response.data
  } catch (error) {
    console.warn(`Failed to fetch wine pairing for recipe ${id}:`, error)
    return null
  }
}
