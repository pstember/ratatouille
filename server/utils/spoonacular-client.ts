import { QuotaService } from './quota-service'

export interface SpoonacularResponse<T> {
  data: T
  quotaInfo?: any
  headers?: any
}

export class SpoonacularClient {
  private static readonly BASE_URL = 'https://api.spoonacular.com'
  private static readonly API_KEY = process.env.SPOONACULAR_API_KEY

  static async fetch<T>(endpoint: string, params: Record<string, any> = {}): Promise<SpoonacularResponse<T>> {
    if (!this.API_KEY) {
      throw new Error('SPOONACULAR_API_KEY environment variable is required')
    }

    // Add API key to params
    const queryParams = new URLSearchParams({
      apiKey: this.API_KEY,
      ...params
    })

    const url = `${this.BASE_URL}${endpoint}?${queryParams.toString()}`
    
    console.log(`Making Spoonacular API request to: ${endpoint}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Ratatouille/1.0.0'
      }
    })

    // Extract quota information from response headers BEFORE checking if response is ok
    // This ensures we capture quota info even from error responses
    const quotaInfo = await QuotaService.extractQuotaFromResponse({
      headers: {
        'x-api-quota-used': response.headers.get('x-api-quota-used'),
        'x-api-quota-left': response.headers.get('x-api-quota-left'),
        'x-api-quota-request': response.headers.get('x-api-quota-request')
      }
    })

    console.log(`Spoonacular API response received for ${endpoint}:`, {
      status: response.status,
      quotaUsed: quotaInfo?.quotaUsed,
      quotaLeft: quotaInfo?.quotaLeft
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Spoonacular API error response:', response.status, errorText)
      
      // Create error with quota information attached
      const error: any = new Error(`Spoonacular API error: ${response.status} ${response.statusText}`)
      error.statusCode = response.status
      error.quotaInfo = quotaInfo // Attach quota info to error
      throw error
    }

    const data = await response.json()

    return {
      data,
      quotaInfo,
      headers: Object.fromEntries(response.headers.entries())
    }
  }

  static async searchRecipes(params: Record<string, any> = {}): Promise<SpoonacularResponse<any>> {
    return this.fetch('/recipes/complexSearch', params)
  }

  static async getRandomRecipes(params: Record<string, any> = {}): Promise<SpoonacularResponse<any>> {
    return this.fetch('/recipes/random', params)
  }

  static async getRecipeInformation(id: number, includeNutrition: boolean = true, addRecipeInformation: boolean = true): Promise<SpoonacularResponse<any>> {
    return this.fetch(`/recipes/${id}/information`, {
      includeNutrition: includeNutrition.toString(),
      addRecipeInformation: addRecipeInformation.toString()
    })
  }

  static async getRecipeEquipment(id: number): Promise<SpoonacularResponse<any>> {
    return this.fetch(`/recipes/${id}/equipmentWidget.json`)
  }

  static async getRecipePriceBreakdown(id: number): Promise<SpoonacularResponse<any>> {
    return this.fetch(`/recipes/${id}/priceBreakdownWidget.json`)
  }

  static async getRecipeWinePairing(id: number): Promise<SpoonacularResponse<any>> {
    return this.fetch(`/recipes/${id}/winePairing`)
  }
}
