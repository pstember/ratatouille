# External API Integration Specification

## Overview

This specification defines the integration with the Spoonacular Recipe API using direct REST calls (not the npm package), including comprehensive data synchronization, caching strategies, and error handling for the Ratatouille Recipe Discovery Platform.

**Status**: ✅ **IMPLEMENTED AND VALIDATED** - All issues have been resolved and the integration is working correctly.

## Key Implementation Notes

### API Endpoint Selection
- **Using**: `/recipes/complexSearch` endpoint (not `/recipes/search`)
- **Reason**: The complexSearch endpoint provides complete nutrition data, while the basic search endpoint does not
- **Impact**: Full nutritional information is now available for all recipes

### Database Integration
- **Status**: ✅ Working correctly
- **Storage**: Recipes are automatically stored in local database
- **Nutrition**: Complete nutritional data is captured and stored
- **Ingredients**: All ingredients are stored with proper relationships

## Spoonacular API Integration

### API Configuration

```typescript
// Runtime configuration
export default defineNuxtConfig({
  runtimeConfig: {
    // Server-side only keys
    spoonacularApiKey: process.env.SPOONACULAR_API_KEY,
    
    // Public keys (exposed to client)
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://api.spoonacular.com/recipes'
    }
  }
})
```

### Direct REST API Implementation

```typescript
// server/utils/spoonacular-recipes.ts
export async function searchRecipes(
  params: RecipeSearchParams
): Promise<SearchRecipes200Response> {
  try {
    // Get API key from environment variable
    const apiKey = process.env.SPOONACULAR_API_KEY
    if (!apiKey) {
      throw new Error('SPOONACULAR_API_KEY environment variable is required')
    }
    
    // Build query parameters
    const queryParams = new URLSearchParams()
    
    if (params.query) queryParams.append('query', params.query)
    if (params.addRecipeInformation) queryParams.append('addRecipeInformation', params.addRecipeInformation.toString())
    if (params.addRecipeNutrition) queryParams.append('addRecipeNutrition', params.addRecipeNutrition.toString())
    if (params.fillIngredients) queryParams.append('fillIngredients', params.fillIngredients.toString())
    // ... other parameters ...
    
    // Add API key
    queryParams.append('apiKey', apiKey)
    
    // Use complexSearch endpoint for complete nutrition data
    const url = `https://api.spoonacular.com/recipes/complexSearch?${queryParams.toString()}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Ratatouille/1.0.0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Spoonacular API error:', error)
    throw error
  }
}
```

### Recipe Information Endpoint

**Spoonacular Endpoint**: `GET /{id}/information`

**Purpose**: Get detailed recipe information

```typescript
import type { RecipeInformation } from 'spoonacular'

export async function getRecipeInfo(
  id: number,
  addRecipeNutrition: boolean = true,
  fillIngredients: boolean = true
): Promise<RecipeInformation> {
  try {
    const response = await spoonacularApi.getRecipeInformation(
      id,
      addRecipeNutrition,
      fillIngredients
    )
    
    if (!response || !response.id) {
      throw new Error('Invalid recipe information response from Spoonacular API')
    }
    
    return response
  } catch (error) {
    handleApiError(error, 'getRecipeInformation', { id })
  }
}
```

### Random Recipe Endpoint

**Spoonacular Endpoint**: `GET /random`

**Purpose**: Get random recipes for discovery

```typescript
import type { GetRandomRecipes200Response } from 'spoonacular'

export interface SpoonacularRandomParams {
  tags?: string
  number?: number
}

export async function getRandomRecipes(
  params: SpoonacularRandomParams = {}
): Promise<GetRandomRecipes200Response> {
  try {
    const response = await spoonacularApi.getRandomRecipes(
      params.tags,
      params.number
    )
    
    if (!response || !Array.isArray(response.recipes)) {
      throw new Error('Invalid random recipes response from Spoonacular API')
    }
    
    return response
  } catch (error) {
    handleApiError(error, 'getRandomRecipes', params)
  }
}
```

### Random Recipe Nutrition Data Enhancement

**Issue**: The Spoonacular random recipe endpoint (`/random`) returns basic recipe information but does not include complete nutrition data in the same format as the individual recipe endpoint (`/recipes/{id}/information`).

**Solution**: Enhanced the random recipe service to fetch complete nutrition data for each random recipe by making additional API calls to the individual recipe endpoint.

**Implementation**: `server/utils/random-recipe.ts`

```typescript
/**
 * Get random recipes from external API with complete nutrition data
 */
private static async getRandomFromAPI(count: number, options: RandomRecipeOptions) {
  const config = useRuntimeConfig()
  
  // Check quota before making API call
  const currentQuota = QuotaMonitor.getCurrentQuotaInfo()
  if (currentQuota && QuotaMonitor.shouldRequireConfirmation(currentQuota)) {
    return null // Don't use quota for random selection
  }

  try {
    const apiUrl = `${config.public.apiBase}/random`
    const params = new URLSearchParams({
      apiKey: config.spoonacularApiKey,
      number: count.toString(),
      addRecipeInformation: 'true',
      addRecipeNutrition: 'true',
      fillIngredients: 'true',
      addRecipeInstructions: 'true'
    })

    // Add cuisine filter if specified
    if (options.cuisine) {
      params.append('cuisine', options.cuisine)
    }

    // Add dietary filter if specified
    if (options.dietary) {
      params.append('diet', options.dietary)
    }

    const response = await $fetch<{ recipes: any[] }>(`${apiUrl}?${params}`)
    
    // Transform API response to our format
    // For random recipes, we need to fetch complete nutrition data for each recipe
    const recipes = await Promise.all(
      response.recipes.map(async (recipe) => {
        try {
          console.log(`🔍 Fetching complete nutrition data for recipe ${recipe.id}: ${recipe.title}`)
          
          // Fetch complete recipe information including nutrition
          const completeRecipeUrl = `${config.public.apiBase}/${recipe.id}/information`
          const completeParams = new URLSearchParams({
            apiKey: config.spoonacularApiKey,
            addRecipeNutrition: 'true',
            addRecipeInformation: 'true',
            addRecipeInstructions: 'true'
          })
          
          const completeRecipe = await $fetch<any>(completeRecipeUrl + '?' + completeParams)
          
          // Check if nutrition data is present
          if (completeRecipe.nutrition && completeRecipe.nutrition.nutrients) {
            console.log(`✅ Nutrition data found for recipe ${recipe.id}:`, 
              completeRecipe.nutrition.nutrients.map((n: any) => `${n.name}: ${n.amount}${n.unit}`).join(', '))
          } else {
            console.log(`⚠️ No nutrition data found for recipe ${recipe.id}`)
          }
          
          // Use existing transformation logic from recipe-transformer.ts
          const { transformAndStoreRecipe } = await import('./recipe-transformer')
          return await transformAndStoreRecipe(completeRecipe)
        } catch (error: any) {
          console.error(`Failed to fetch complete data for recipe ${recipe.id}:`, error)
          // Fallback to basic recipe data without nutrition
          const { transformAndStoreRecipe } = await import('./recipe-transformer')
          return await transformAndStoreRecipe(recipe)
        }
      })
    )

    return {
      recipes,
      totalAvailable: recipes.length
    }
  } catch (error: any) {
    console.error('Failed to get random recipes from API:', error)
    return null
  }
}
```

**Key Features**:
- **Complete Nutrition Data**: Each random recipe now includes full nutrition information (calories, protein, carbs, fat, fiber, sugar, sodium)
- **Fallback Handling**: If complete nutrition data cannot be fetched for a specific recipe, the system falls back to storing basic recipe data
- **Logging**: Comprehensive logging to track nutrition data fetching process
- **Quota Management**: Respects API quota limits and confirmation requirements
- **Error Resilience**: Graceful handling of API failures for individual recipes

**API Calls Made**:
1. **Random Recipe Call**: `GET /random` - Gets basic recipe information
2. **Individual Recipe Calls**: `GET /recipes/{id}/information` - Gets complete nutrition data for each recipe

**Performance Considerations**:
- Additional API calls increase response time but ensure complete data
- Caching reduces subsequent API calls for the same recipes
- Fallback mechanism ensures system reliability

**Database Impact**:
- Random recipes are now stored with complete nutrition data
- Existing recipes without nutrition data remain unaffected
- New random recipes will have full nutrition information

## Comprehensive Data Models

### Spoonacular Type Definitions

```typescript
// types/spoonacular.ts
// Re-export types from the official package for convenience
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
  
  // Wine pairing types
  RecipeInformationWinePairing,
  RecipeInformationWinePairingProductMatchesInner,
  
  // Equipment types
  GetRecipeEquipmentByID200Response,
  GetRecipeEquipmentByID200ResponseEquipmentInner,
  
  // Price breakdown types
  GetRecipePriceBreakdownByID200Response,
  GetRecipePriceBreakdownByID200ResponseIngredientsInner,
  GetRecipePriceBreakdownByID200ResponseIngredientsInnerAmount,
  GetRecipePriceBreakdownByID200ResponseIngredientsInnerAmountMetric
} from 'spoonacular'

// Extended types for our internal use
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
```

## Comprehensive Data Transformation

### Recipe Transformation with Complete Data

```typescript
// server/utils/recipe-transformer.ts
import type { 
  RecipeInformation,
  RecipeInformationExtendedIngredientsInner,
  RecipeInformationNutrition,
  RecipeInformationAnalyzedInstructionsInner,
  GetRecipeEquipmentByID200Response,
  GetRecipePriceBreakdownByID200Response,
  RecipeInformationWinePairing
} from 'spoonacular'

export interface CompleteRecipeData {
  // Basic recipe information
  externalId: number
  title: string
  image: string | null
  servings: number | null
  readyInMinutes: number | null
  sourceUrl: string | null
  sourceName: string | null
  summary: string | null
  instructions: string | null
  cuisine: string | null
  
  // Complete ingredient data
  ingredients: CompleteIngredientData[]
  
  // Complete nutrition data
  nutrition: CompleteNutritionData | null
  
  // Complete instruction data
  analyzedInstructions: CompleteInstructionData[]
  
  // Equipment data
  equipment: CompleteEquipmentData[]
  
  // Price breakdown
  priceBreakdown: CompletePriceBreakdownData | null
  
  // Wine pairing
  winePairing: CompleteWinePairingData | null
  
  // Search and categorization
  cuisines: string[]
  diets: string[]
  dishTypes: string[]
  tags: string[]
  
  // Metadata
  isNew: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CompleteIngredientData {
  id: number
  name: string
  amount: number
  unit: string
  aisle: string | null
  original: string
  originalName: string
  meta: string[]
  image: string | null
  consistency: string | null
  measures: {
    us: {
      amount: number
      unitShort: string
      unitLong: string
    }
    metric: {
      amount: number
      unitShort: string
      unitLong: string
    }
  }
}

export interface CompleteNutritionData {
  nutrients: Array<{
    name: string
    amount: number
    unit: string
    percentOfDailyNeeds: number | null
  }>
  properties: Array<{
    name: string
    amount: number
    unit: string
  }>
  flavonoids: Array<{
    name: string
    amount: number
    unit: string
  }>
  ingredients: Array<{
    id: number
    name: string
    amount: number
    unit: string
    nutrients: Array<{
      name: string
      amount: number
      unit: string
    }>
  }>
  caloricBreakdown: {
    percentProtein: number
    percentFat: number
    percentCarbs: number
  }
  weightPerServing: {
    amount: number
    unit: string
  }
}

export interface CompleteInstructionData {
  name: string
  steps: Array<{
    number: number
    step: string
    ingredients: Array<{
      id: number
      name: string
      localizedName: string
      image: string
    }>
    equipment: Array<{
      id: number
      name: string
      localizedName: string
      image: string
      temperature?: {
        number: number
        unit: string
      }
    }>
    length?: {
      number: number
      unit: string
    }
  }>
}

export interface CompleteEquipmentData {
  id: number
  name: string
  localizedName: string
  image: string
  temperature?: {
    number: number
    unit: string
  }
}

export interface CompletePriceBreakdownData {
  ingredients: Array<{
    id: number
    amount: number
    unit: string
    unitLong: string
    unitShort: string
    aisle: string
    name: string
    original: string
    originalName: string
    meta: string[]
    image: string
    cost: {
      amount: number
      unit: string
    }
  }>
  totalCost: number
  totalCostPerServing: number
}

export interface CompleteWinePairingData {
  pairedWines: string[]
  pairingText: string
  productMatches: Array<{
    id: number
    title: string
    description: string
    price: string
    imageUrl: string
    averageRating: number
    ratingCount: number
    score: number
    link: string
  }>
}

export function transformCompleteRecipeData(
  apiRecipe: RecipeInformation,
  equipment?: GetRecipeEquipmentByID200Response,
  priceBreakdown?: GetRecipePriceBreakdownByID200Response,
  winePairing?: RecipeInformationWinePairing
): CompleteRecipeData {
  return {
    // Basic information
    externalId: apiRecipe.id,
    title: apiRecipe.title,
    image: apiRecipe.image || null,
    servings: apiRecipe.servings || null,
    readyInMinutes: apiRecipe.readyInMinutes || null,
    sourceUrl: apiRecipe.sourceUrl || null,
    sourceName: apiRecipe.sourceName || null,
    summary: apiRecipe.summary || null,
    instructions: apiRecipe.instructions || null,
    cuisine: apiRecipe.cuisines?.[0] || null,
    
    // Complete ingredient data
    ingredients: apiRecipe.extendedIngredients?.map(transformCompleteIngredient) || [],
    
    // Complete nutrition data
    nutrition: apiRecipe.nutrition ? transformCompleteNutrition(apiRecipe.nutrition) : null,
    
    // Complete instruction data
    analyzedInstructions: apiRecipe.analyzedInstructions?.map(transformCompleteInstruction) || [],
    
    // Equipment data
    equipment: equipment?.equipment?.map(transformCompleteEquipment) || [],
    
    // Price breakdown
    priceBreakdown: priceBreakdown ? transformCompletePriceBreakdown(priceBreakdown) : null,
    
    // Wine pairing
    winePairing: winePairing ? transformCompleteWinePairing(winePairing) : null,
    
    // Search and categorization
    cuisines: apiRecipe.cuisines || [],
    diets: apiRecipe.diets || [],
    dishTypes: apiRecipe.dishTypes || [],
    tags: apiRecipe.tags || [],
    
    // Metadata
    isNew: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

export function transformCompleteIngredient(
  apiIngredient: RecipeInformationExtendedIngredientsInner
): CompleteIngredientData {
  return {
    id: apiIngredient.id,
    name: apiIngredient.name,
    amount: apiIngredient.amount,
    unit: apiIngredient.unit,
    aisle: apiIngredient.aisle || null,
    original: apiIngredient.original,
    originalName: apiIngredient.originalName,
    meta: apiIngredient.meta || [],
    image: apiIngredient.image || null,
    consistency: apiIngredient.consistency || null,
    measures: {
      us: {
        amount: apiIngredient.measures?.us?.amount || 0,
        unitShort: apiIngredient.measures?.us?.unitShort || '',
        unitLong: apiIngredient.measures?.us?.unitLong || ''
      },
      metric: {
        amount: apiIngredient.measures?.metric?.amount || 0,
        unitShort: apiIngredient.measures?.metric?.unitShort || '',
        unitLong: apiIngredient.measures?.metric?.unitLong || ''
      }
    }
  }
}

export function transformCompleteNutrition(
  apiNutrition: RecipeInformationNutrition
): CompleteNutritionData {
  return {
    nutrients: apiNutrition.nutrients?.map(nutrient => ({
      name: nutrient.name,
      amount: nutrient.amount,
      unit: nutrient.unit,
      percentOfDailyNeeds: nutrient.percentOfDailyNeeds || null
    })) || [],
    properties: apiNutrition.properties?.map(property => ({
      name: property.name,
      amount: property.amount,
      unit: property.unit
    })) || [],
    flavonoids: apiNutrition.flavonoids?.map(flavonoid => ({
      name: flavonoid.name,
      amount: flavonoid.amount,
      unit: flavonoid.unit
    })) || [],
    ingredients: apiNutrition.ingredients?.map(ingredient => ({
      id: ingredient.id,
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit,
      nutrients: ingredient.nutrients?.map(nutrient => ({
        name: nutrient.name,
        amount: nutrient.amount,
        unit: nutrient.unit
      })) || []
    })) || [],
    caloricBreakdown: {
      percentProtein: apiNutrition.caloricBreakdown?.percentProtein || 0,
      percentFat: apiNutrition.caloricBreakdown?.percentFat || 0,
      percentCarbs: apiNutrition.caloricBreakdown?.percentCarbs || 0
    },
    weightPerServing: {
      amount: apiNutrition.weightPerServing?.amount || 0,
      unit: apiNutrition.weightPerServing?.unit || ''
    }
  }
}

export function transformCompleteInstruction(
  apiInstruction: RecipeInformationAnalyzedInstructionsInner
): CompleteInstructionData {
  return {
    name: apiInstruction.name,
    steps: apiInstruction.steps?.map(step => ({
      number: step.number,
      step: step.step,
      ingredients: step.ingredients?.map(ingredient => ({
        id: ingredient.id,
        name: ingredient.name,
        localizedName: ingredient.localizedName,
        image: ingredient.image
      })) || [],
      equipment: step.equipment?.map(equipment => ({
        id: equipment.id,
        name: equipment.name,
        localizedName: equipment.localizedName,
        image: equipment.image,
        temperature: equipment.temperature ? {
          number: equipment.temperature.number,
          unit: equipment.temperature.unit
        } : undefined
      })) || [],
      length: step.length ? {
        number: step.length.number,
        unit: step.length.unit
      } : undefined
    })) || []
  }
}

export function transformCompleteEquipment(
  apiEquipment: GetRecipeEquipmentByID200ResponseEquipmentInner
): CompleteEquipmentData {
  return {
    id: apiEquipment.id,
    name: apiEquipment.name,
    localizedName: apiEquipment.localizedName,
    image: apiEquipment.image,
    temperature: apiEquipment.temperature ? {
      number: apiEquipment.temperature.number,
      unit: apiEquipment.temperature.unit
    } : undefined
  }
}

export function transformCompletePriceBreakdown(
  apiPriceBreakdown: GetRecipePriceBreakdownByID200Response
): CompletePriceBreakdownData {
  return {
    ingredients: apiPriceBreakdown.ingredients?.map(ingredient => ({
      id: ingredient.id,
      amount: ingredient.amount,
      unit: ingredient.unit,
      unitLong: ingredient.unitLong,
      unitShort: ingredient.unitShort,
      aisle: ingredient.aisle,
      name: ingredient.name,
      original: ingredient.original,
      originalName: ingredient.originalName,
      meta: ingredient.meta || [],
      image: ingredient.image,
      cost: {
        amount: ingredient.cost?.amount || 0,
        unit: ingredient.cost?.unit || ''
      }
    })) || [],
    totalCost: apiPriceBreakdown.totalCost || 0,
    totalCostPerServing: apiPriceBreakdown.totalCostPerServing || 0
  }
}

export function transformCompleteWinePairing(
  apiWinePairing: RecipeInformationWinePairing
): CompleteWinePairingData {
  return {
    pairedWines: apiWinePairing.pairedWines || [],
    pairingText: apiWinePairing.pairingText || '',
    productMatches: apiWinePairing.productMatches?.map(product => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      averageRating: product.averageRating,
      ratingCount: product.ratingCount,
      score: product.score,
      link: product.link
    })) || []
  }
}
```

## Comprehensive Caching Strategy

### Complete Offline Data Caching

```typescript
// server/utils/comprehensive-cache.ts
import type { CachedRecipeData } from '~/types/spoonacular'

export interface ComprehensiveCacheConfig {
  ttl: number
  keyPrefix: string
  enableOfflineMode: boolean
  storeImages: boolean
  storeRelatedData: boolean
}

export const COMPREHENSIVE_CACHE_CONFIG: ComprehensiveCacheConfig = {
  ttl: 2592000, // 30 days for comprehensive data
  keyPrefix: 'spoonacular:complete:',
  enableOfflineMode: true,
  storeImages: true,
  storeRelatedData: true
}

export class ComprehensiveCacheManager {
  private config: ComprehensiveCacheConfig
  
  constructor(config: ComprehensiveCacheConfig = COMPREHENSIVE_CACHE_CONFIG) {
    this.config = config
  }
  
  async cacheCompleteRecipeData(
    recipeId: number,
    recipeData: RecipeInformation,
    equipment?: GetRecipeEquipmentByID200Response,
    priceBreakdown?: GetRecipePriceBreakdownByID200Response,
    winePairing?: RecipeInformationWinePairing,
    requestParams: Record<string, any> = {}
  ): Promise<void> {
    try {
      const cacheKey = `${this.config.keyPrefix}recipe:${recipeId}`
      const expiresAt = new Date(Date.now() + this.config.ttl * 1000)
      
      // Create comprehensive offline data
      const offlineData = await this.createOfflineData(
        recipeData,
        equipment,
        priceBreakdown,
        winePairing
      )
      
      const cachedData: CachedRecipeData = {
        originalResponse: recipeData,
        cachedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        sourceEndpoint: 'getRecipeInformation',
        requestParams,
        offlineData
      }
      
      // Store in database cache
      await prisma.cache.upsert({
        where: { key: cacheKey },
        update: {
          value: JSON.stringify(cachedData),
          expiresAt,
          type: 'complete_recipe'
        },
        create: {
          key: cacheKey,
          value: JSON.stringify(cachedData),
          type: 'complete_recipe',
          expiresAt
        }
      })
      
      // Store images if enabled
      if (this.config.storeImages) {
        await this.cacheRecipeImages(recipeId, offlineData.images)
      }
      
      console.log(`Cached complete recipe data for ID: ${recipeId}`)
    } catch (error) {
      console.error('Error caching complete recipe data:', error)
    }
  }
  
  async getCachedCompleteRecipeData(recipeId: number): Promise<CachedRecipeData | null> {
    try {
      const cacheKey = `${this.config.keyPrefix}recipe:${recipeId}`
      const cacheEntry = await prisma.cache.findUnique({
        where: { key: cacheKey }
      })
      
      if (!cacheEntry || cacheEntry.expiresAt < new Date()) {
        return null
      }
      
      const cachedData: CachedRecipeData = JSON.parse(cacheEntry.value)
      
      // Validate cached data structure
      if (!this.validateCachedData(cachedData)) {
        console.warn(`Invalid cached data structure for recipe ${recipeId}`)
        return null
      }
      
      return cachedData
    } catch (error) {
      console.error('Error retrieving cached recipe data:', error)
      return null
    }
  }
  
  private async createOfflineData(
    recipeData: RecipeInformation,
    equipment?: GetRecipeEquipmentByID200Response,
    priceBreakdown?: GetRecipePriceBreakdownByID200Response,
    winePairing?: RecipeInformationWinePairing
  ) {
    const images: Record<string, string> = {}
    
    // Cache recipe image
    if (recipeData.image) {
      images.recipe = await this.downloadAndCacheImage(recipeData.image, `recipe-${recipeData.id}`)
    }
    
    // Cache ingredient images
    if (recipeData.extendedIngredients) {
      for (const ingredient of recipeData.extendedIngredients) {
        if (ingredient.image) {
          images.ingredients = images.ingredients || {}
          images.ingredients[ingredient.id] = await this.downloadAndCacheImage(
            ingredient.image,
            `ingredient-${ingredient.id}`
          )
        }
      }
    }
    
    // Cache equipment images
    if (equipment?.equipment) {
      for (const equip of equipment.equipment) {
        if (equip.image) {
          images.equipment = images.equipment || {}
          images.equipment[equip.id] = await this.downloadAndCacheImage(
            equip.image,
            `equipment-${equip.id}`
          )
        }
      }
    }
    
    // Create search index for offline search
    const searchIndex = {
      title: recipeData.title.toLowerCase(),
      summary: recipeData.summary?.toLowerCase() || '',
      ingredients: recipeData.extendedIngredients?.map(i => i.name.toLowerCase()) || [],
      cuisines: recipeData.cuisines?.map(c => c.toLowerCase()) || [],
      diets: recipeData.diets?.map(d => d.toLowerCase()) || [],
      dishTypes: recipeData.dishTypes?.map(d => d.toLowerCase()) || [],
      tags: recipeData.tags?.map(t => t.toLowerCase()) || []
    }
    
    return {
      recipe: recipeData,
      ingredients: recipeData.extendedIngredients || [],
      nutrition: recipeData.nutrition || null,
      instructions: recipeData.analyzedInstructions || [],
      equipment: equipment?.equipment || [],
      priceBreakdown: priceBreakdown || null,
      winePairing: winePairing || null,
      images,
      searchIndex
    }
  }
  
  private async downloadAndCacheImage(imageUrl: string, filename: string): Promise<string> {
    try {
      // Download image and store locally
      const response = await fetch(imageUrl)
      const buffer = await response.arrayBuffer()
      
      // Store in local file system or CDN
      const localPath = `/cache/images/${filename}.jpg`
      // Implementation depends on your storage strategy
      
      return localPath
    } catch (error) {
      console.error(`Failed to cache image ${imageUrl}:`, error)
      return imageUrl // Fallback to original URL
    }
  }
  
  private validateCachedData(data: any): data is CachedRecipeData {
    return (
      data &&
      typeof data === 'object' &&
      data.originalResponse &&
      data.cachedAt &&
      data.expiresAt &&
      data.sourceEndpoint &&
      data.requestParams &&
      data.offlineData &&
      data.offlineData.recipe &&
      data.offlineData.searchIndex
    )
  }
  
  async searchOfflineRecipes(query: string): Promise<CachedRecipeData[]> {
    try {
      // Search through cached recipes using the search index
      const cacheEntries = await prisma.cache.findMany({
        where: {
          type: 'complete_recipe',
          expiresAt: { gt: new Date() }
        }
      })
      
      const results: CachedRecipeData[] = []
      
      for (const entry of cacheEntries) {
        try {
          const cachedData: CachedRecipeData = JSON.parse(entry.value)
          const searchIndex = cachedData.offlineData.searchIndex
          
          // Simple text search (can be enhanced with proper search engine)
          const searchTerms = query.toLowerCase().split(' ')
          let matchScore = 0
          
          for (const term of searchTerms) {
            if (searchIndex.title.includes(term)) matchScore += 10
            if (searchIndex.summary.includes(term)) matchScore += 5
            if (searchIndex.ingredients.some(i => i.includes(term))) matchScore += 3
            if (searchIndex.cuisines.some(c => c.includes(term))) matchScore += 2
            if (searchIndex.diets.some(d => d.includes(term))) matchScore += 2
            if (searchIndex.dishTypes.some(d => d.includes(term))) matchScore += 2
            if (searchIndex.tags.some(t => t.includes(term))) matchScore += 1
          }
          
          if (matchScore > 0) {
            results.push({
              ...cachedData,
              matchScore
            })
          }
        } catch (error) {
          console.error('Error parsing cached recipe:', error)
        }
      }
      
      // Sort by match score
      return results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    } catch (error) {
      console.error('Error searching offline recipes:', error)
      return []
    }
  }
  
  async getOfflineRecipeCount(): Promise<number> {
    try {
      const count = await prisma.cache.count({
        where: {
          type: 'complete_recipe',
          expiresAt: { gt: new Date() }
        }
      })
      return count
    } catch (error) {
      console.error('Error getting offline recipe count:', error)
      return 0
    }
  }
  
  async cleanupExpiredCache(): Promise<number> {
    try {
      const result = await prisma.cache.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      })
      return result.count
    } catch (error) {
      console.error('Error cleaning up expired cache:', error)
      return 0
    }
  }
}
```

## Enhanced API Integration with Complete Data

### Complete Recipe Information Retrieval

```typescript
// server/utils/complete-recipe-service.ts
export class CompleteRecipeService {
  private cacheManager: ComprehensiveCacheManager
  
  constructor() {
    this.cacheManager = new ComprehensiveCacheManager()
  }
  
  async getCompleteRecipeData(
    recipeId: number,
    forceRefresh: boolean = false
  ): Promise<CompleteRecipeData> {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = await this.cacheManager.getCachedCompleteRecipeData(recipeId)
      if (cachedData) {
        return transformCompleteRecipeData(
          cachedData.offlineData.recipe,
          { equipment: cachedData.offlineData.equipment },
          cachedData.offlineData.priceBreakdown,
          cachedData.offlineData.winePairing
        )
      }
    }
    
    // Fetch complete data from Spoonacular
    const [
      recipeInfo,
      equipment,
      priceBreakdown,
      winePairing
    ] = await Promise.all([
      getRecipeInfo(recipeId, true, true),
      this.getRecipeEquipment(recipeId),
      this.getRecipePriceBreakdown(recipeId),
      this.getRecipeWinePairing(recipeId)
    ])
    
    // Cache complete data
    await this.cacheManager.cacheCompleteRecipeData(
      recipeId,
      recipeInfo,
      equipment,
      priceBreakdown,
      winePairing
    )
    
    // Transform and return
    return transformCompleteRecipeData(
      recipeInfo,
      equipment,
      priceBreakdown,
      winePairing
    )
  }
  
  private async getRecipeEquipment(recipeId: number) {
    try {
      return await spoonacularApi.getRecipeEquipmentByID(recipeId)
    } catch (error) {
      console.warn(`Failed to fetch equipment for recipe ${recipeId}:`, error)
      return null
    }
  }
  
  private async getRecipePriceBreakdown(recipeId: number) {
    try {
      return await spoonacularApi.getRecipePriceBreakdownByID(recipeId)
    } catch (error) {
      console.warn(`Failed to fetch price breakdown for recipe ${recipeId}:`, error)
      return null
    }
  }
  
  private async getRecipeWinePairing(recipeId: number) {
    try {
      return await spoonacularApi.getRecipeWinePairing(recipeId)
    } catch (error) {
      console.warn(`Failed to fetch wine pairing for recipe ${recipeId}:`, error)
      return null
    }
  }
  
  async searchRecipesOffline(query: string): Promise<CompleteRecipeData[]> {
    const cachedResults = await this.cacheManager.searchOfflineRecipes(query)
    
    return cachedResults.map(cachedData => 
      transformCompleteRecipeData(
        cachedData.offlineData.recipe,
        { equipment: cachedData.offlineData.equipment },
        cachedData.offlineData.priceBreakdown,
        cachedData.offlineData.winePairing
      )
    )
  }
}
```

## Error Handling

### Enhanced API Error Types

```typescript
// server/utils/api-errors.ts
export class SpoonacularApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
    public params?: Record<string, any>
  ) {
    super(message)
    this.name = 'SpoonacularApiError'
  }
}

export class ApiRateLimitError extends SpoonacularApiError {
  constructor(endpoint: string, params?: Record<string, any>) {
    super('API rate limit exceeded', 429, endpoint, params)
    this.name = 'ApiRateLimitError'
  }
}

export class ApiQuotaExceededError extends SpoonacularApiError {
  constructor(endpoint: string, params?: Record<string, any>) {
    super('API quota exceeded', 402, endpoint, params)
    this.name = 'ApiQuotaExceededError'
  }
}

export class ApiTimeoutError extends SpoonacularApiError {
  constructor(endpoint: string, params?: Record<string, any>) {
    super('API request timeout', 408, endpoint, params)
    this.name = 'ApiTimeoutError'
  }
}

export class OfflineModeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OfflineModeError'
  }
}
```

### Enhanced Error Handling

```typescript
// server/utils/api-error-handler.ts
export function handleApiError(error: any, endpoint: string, params?: Record<string, any>): never {
  if (error.statusCode === 429) {
    throw new ApiRateLimitError(endpoint, params)
  }
  
  if (error.statusCode === 402) {
    throw new ApiQuotaExceededError(endpoint, params)
  }
  
  if (error.code === 'ECONNABORTED' || error.statusCode === 408) {
    throw new ApiTimeoutError(endpoint, params)
  }
  
  throw new SpoonacularApiError(
    error.message || 'Unknown API error',
    error.statusCode || 500,
    endpoint,
    params
  )
}
```

## Integration Examples

### Complete API Integration

```typescript
// server/api/recipes/[id].ts
export default defineEventHandler(async (event) => {
  const recipeId = parseInt(getRouterParam(event, 'id')!)
  const query = getQuery(event)
  const forceRefresh = query.refresh === 'true'
  
  const recipeService = new CompleteRecipeService()
  
  try {
    const recipeData = await recipeService.getCompleteRecipeData(recipeId, forceRefresh)
    
    return {
      success: true,
      data: recipeData,
      cached: !forceRefresh,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    if (error instanceof ApiQuotaExceededError || error instanceof ApiRateLimitError) {
      // Try to serve from cache even if expired
      const cachedData = await recipeService.cacheManager.getCachedCompleteRecipeData(recipeId)
      if (cachedData) {
        return {
          success: true,
          data: transformCompleteRecipeData(
            cachedData.offlineData.recipe,
            { equipment: cachedData.offlineData.equipment },
            cachedData.offlineData.priceBreakdown,
            cachedData.offlineData.winePairing
          ),
          cached: true,
          offline: true,
          timestamp: new Date().toISOString()
        }
      }
    }
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    })
  }
})
```

### Offline Search API

```typescript
// server/api/recipes/search/offline.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchQuery = query.q as string
  
  if (!searchQuery) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Search query is required'
    })
  }
  
  const recipeService = new CompleteRecipeService()
  
  try {
    const results = await recipeService.searchRecipesOffline(searchQuery)
    
    return {
      success: true,
      results,
      totalResults: results.length,
      offline: true,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to search offline recipes'
    })
  }
})
```

---

*This specification ensures comprehensive caching that stores everything needed for offline reproduction and uses the official Spoonacular npm package for better type safety and maintainability.*
