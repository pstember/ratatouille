import type {
  TransformedRecipeData,
  SpoonacularApiResponse,
  SearchRecipes200Response,
  GetRandomRecipes200Response
} from '~/types/spoonacular-types'
import {
  getRecipeInformation,
  getRecipeEquipment,
  getRecipePriceBreakdown,
  getRecipeWinePairing
} from '~/server/utils/spoonacular-recipe-info'
import { searchRecipes, type RecipeSearchParams } from '~/server/utils/spoonacular-recipes'
import { getRandomRecipes, type RandomRecipeParams } from '~/server/utils/spoonacular-random'
import { transformSpoonacularRecipe } from '~/server/utils/spoonacular-transformer'
import { ComprehensiveCacheManager } from '~/server/utils/comprehensive-cache-manager'
import { 
  SpoonacularQuotaExceededError,
  SpoonacularRateLimitError 
} from '~/server/utils/spoonacular-error-handler'

export class SpoonacularRecipeService {
  private cacheManager: ComprehensiveCacheManager
  
  constructor() {
    this.cacheManager = new ComprehensiveCacheManager()
  }
  
  async getCompleteRecipe(
    recipeId: number,
    forceRefresh: boolean = false
  ): Promise<SpoonacularApiResponse<TransformedRecipeData>> {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = await this.cacheManager.getCachedCompleteRecipeData(recipeId)
      if (cachedData) {
        return {
          data: transformSpoonacularRecipe(
            cachedData.offlineData.recipe,
            { equipment: cachedData.offlineData.equipment },
            cachedData.offlineData.priceBreakdown,
            cachedData.offlineData.winePairing
          ),
          cached: true,
          offline: false,
          timestamp: new Date().toISOString(),
          source: 'cache'
        }
      }
    }
    
    try {
      // Fetch complete data from Spoonacular using the new client
      const [
        recipeInfoResponse,
        equipmentResponse,
        priceBreakdownResponse,
        winePairingResponse
      ] = await Promise.all([
        getRecipeInformation(recipeId, true, true),
        getRecipeEquipment(recipeId),
        getRecipePriceBreakdown(recipeId),
        getRecipeWinePairing(recipeId)
      ])
      
      // Extract quota information from the first response (they should all have similar quota info)
      const quotaInfo = recipeInfoResponse?.quotaInfo || equipmentResponse?.quotaInfo || priceBreakdownResponse?.quotaInfo || winePairingResponse?.quotaInfo
      
      // Transform the data
      const transformedData = transformSpoonacularRecipe(
        recipeInfoResponse,
        equipmentResponse,
        priceBreakdownResponse,
        winePairingResponse
      )
      
      // Cache the complete data
      await this.cacheManager.cacheCompleteRecipeData(
        recipeId,
        recipeInfoResponse,
        equipmentResponse,
        priceBreakdownResponse,
        winePairingResponse
      )
      
      return {
        data: transformedData,
        cached: false,
        offline: false,
        timestamp: new Date().toISOString(),
        source: 'spoonacular',
        quotaInfo
      }
    } catch (error) {
      // If API fails, try to serve from cache even if expired
      const cachedData = await this.cacheManager.getCachedCompleteRecipeData(recipeId)
      if (cachedData) {
        return {
          data: transformSpoonacularRecipe(
            cachedData.offlineData.recipe,
            { equipment: cachedData.offlineData.equipment },
            cachedData.offlineData.priceBreakdown,
            cachedData.offlineData.winePairing
          ),
          cached: true,
          offline: true,
          timestamp: new Date().toISOString(),
          source: 'cache'
        }
      }
      
      throw error
    }
  }
  
  async searchRecipes(
    params: RecipeSearchParams
  ): Promise<SpoonacularApiResponse<SearchRecipes200Response>> {
    try {
      const response = await searchRecipes(params)
      
      return {
        data: response.data,
        cached: false,
        offline: false,
        timestamp: new Date().toISOString(),
        source: 'spoonacular',
        quotaInfo: response.quotaInfo
      }
    } catch (error) {
      throw error
    }
  }
  
  async getRandomRecipes(
    params: RandomRecipeParams = {}
  ): Promise<SpoonacularApiResponse<GetRandomRecipes200Response>> {
    try {
      const response = await getRandomRecipes(params)
      
      return {
        data: response.data,
        cached: false,
        offline: false,
        timestamp: new Date().toISOString(),
        source: 'spoonacular',
        quotaInfo: response.quotaInfo
      }
    } catch (error) {
      throw error
    }
  }
  
  async searchRecipesOffline(query: string): Promise<TransformedRecipeData[]> {
    const cachedResults = await this.cacheManager.searchOfflineRecipes(query)
    
    return cachedResults.map(cachedData => 
      transformSpoonacularRecipe(
        cachedData.offlineData.recipe,
        { equipment: cachedData.offlineData.equipment },
        cachedData.offlineData.priceBreakdown,
        cachedData.offlineData.winePairing
      )
    )
  }
  
  async getOfflineRecipeCount(): Promise<number> {
    return await this.cacheManager.getOfflineRecipeCount()
  }
  
  async getOfflineStorageSize(): Promise<number> {
    return await this.cacheManager.getOfflineStorageSize()
  }
}
