// Re-export all types from the official package
export type {
  // Core recipe types
  RecipeInformation,
  SearchRecipes200Response,
  SearchRecipes200ResponseResultsInner,
  GetRandomRecipes200Response,
  
  // Ingredient types
  RecipeInformationExtendedIngredientsInner,
  RecipeInformationExtendedIngredientsInnerMeasures,
  RecipeInformationExtendedIngredientsInnerMeasuresMetric,
  
  // Nutrition types
  RecipeInformationNutrition,
  RecipeInformationNutritionNutrientsInner,
  RecipeInformationNutritionPropertiesInner,
  RecipeInformationNutritionFlavonoidsInner,
  RecipeInformationNutritionIngredientInner,
  RecipeInformationNutritionCaloricBreakdown,
  RecipeInformationNutritionWeightPerServing,
  
  // Instruction types
  RecipeInformationAnalyzedInstructionsInner,
  RecipeInformationAnalyzedInstructionsInnerStepsInner,
  RecipeInformationAnalyzedInstructionsInnerStepsInnerIngredientsInner,
  RecipeInformationAnalyzedInstructionsInnerStepsInnerEquipmentInner,
  RecipeInformationAnalyzedInstructionsInnerStepsInnerLength,
  
  // Equipment types
  GetRecipeEquipmentByID200Response,
  GetRecipeEquipmentByID200ResponseEquipmentInner,
  
  // Price breakdown types
  GetRecipePriceBreakdownByID200Response,
  GetRecipePriceBreakdownByID200ResponseIngredientsInner,
  GetRecipePriceBreakdownByID200ResponseIngredientsInnerAmount,
  GetRecipePriceBreakdownByID200ResponseIngredientsInnerAmountMetric,
  
  // Wine pairing types
  RecipeInformationWinePairing,
  RecipeInformationWinePairingProductMatchesInner,
  
  // Ingredient types
  IngredientSearch200Response,
  IngredientSearch200ResponseResultsInner,
  AutocompleteIngredientSearch200ResponseInner,
  
  // API client types
  DefaultApi,
  IngredientsApi,
  RecipesApi,
  WineApi,
  ApiClient,
  Configuration
} from 'spoonacular'

// Extended types for our internal use
export interface SpoonacularApiResponse<T> {
  data: T
  cached: boolean
  offline: boolean
  timestamp: string
  source: 'spoonacular' | 'cache' | 'database'
}

export interface SpoonacularError {
  message: string
  statusCode: number
  endpoint: string
  params?: Record<string, any>
  retryable: boolean
}

// Cached recipe data structure for comprehensive offline storage
export interface CachedRecipeData {
  // Original Spoonacular response
  originalResponse: RecipeInformation
  
  // Cached timestamp
  cachedAt: string
  
  // Cache expiration
  expiresAt: string
  
  // API endpoint used
  sourceEndpoint: string
  
  // Request parameters
  requestParams: Record<string, any>
  
  // Complete offline reproduction data
  offlineData: {
    // Full recipe information
    recipe: RecipeInformation
    
    // All related data for offline use
    ingredients: RecipeInformationExtendedIngredientsInner[]
    nutrition: RecipeInformationNutrition | null
    instructions: RecipeInformationAnalyzedInstructionsInner[]
    equipment: GetRecipeEquipmentByID200ResponseEquipmentInner[]
    priceBreakdown: GetRecipePriceBreakdownByID200Response | null
    winePairing: RecipeInformationWinePairing | null
    
    // Images and media
    images: {
      recipe: string | null
      ingredients: Record<number, string>
      equipment: Record<number, string>
    }
    
    // Metadata for offline search
    searchIndex: {
      title: string
      summary: string
      ingredients: string[]
      cuisines: string[]
      diets: string[]
      dishTypes: string[]
      tags: string[]
    }
  }
}
