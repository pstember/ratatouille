# Spoonacular NPM Package Integration Specification

## Overview

This specification defines the integration requirements and implementation details for using the official Spoonacular npm package in the Ratatouille Recipe Discovery Platform, ensuring type safety, comprehensive data handling, and seamless integration with our existing architecture.

## Package Requirements

### Installation

```bash
npm install spoonacular
```

### Package Information

- **Package Name**: `spoonacular`
- **Version**: `2.0.2`
- **License**: Spoonacular API Terms
- **Source**: [npmjs.com/package/spoonacular](https://www.npmjs.com/package/spoonacular)
- **TypeScript Support**: Full type definitions included

## Integration Architecture

### Package Structure

```typescript
// Import structure from the official package
import Spoonacular from 'spoonacular'

// Available classes and types
import type {
  // Core API classes
  DefaultApi,
  IngredientsApi,
  MealPlanningApi,
  MenuItemsApi,
  MiscApi,
  ProductsApi,
  RecipesApi,
  WineApi,
  
  // Response types
  RecipeInformation,
  SearchRecipes200Response,
  GetRandomRecipes200Response,
  GetRecipeEquipmentByID200Response,
  GetRecipePriceBreakdownByID200Response,
  RecipeInformationWinePairing,
  
  // Request types
  SearchRecipesRequest,
  GetRandomRecipesRequest,
  
  // Utility types
  ApiClient,
  Configuration
} from 'spoonacular'
```

### Client Configuration

```typescript
// server/utils/spoonacular-client.ts
import Spoonacular from 'spoonacular'
import type { 
  DefaultApi,
  Configuration,
  ApiClient 
} from 'spoonacular'

export interface SpoonacularClientConfig {
  apiKey: string
  timeout: number
  retries: number
  basePath?: string
  userAgent?: string
}

export const SPOONACULAR_CONFIG: SpoonacularClientConfig = {
  apiKey: process.env.SPOONACULAR_API_KEY!,
  timeout: 10000, // 10 seconds
  retries: 3,
  basePath: 'https://api.spoonacular.com',
  userAgent: 'Ratatouille/1.0.0'
}

// Initialize the API client
const defaultClient: ApiClient = Spoonacular.ApiClient.instance

// Configure authentication
defaultClient.authentications['apiKeyScheme'].apiKey = SPOONACULAR_CONFIG.apiKey

// Configure base path
defaultClient.basePath = SPOONACULAR_CONFIG.basePath

// Create API instances
export const spoonacularApi = new Spoonacular.DefaultApi()
export const ingredientsApi = new Spoonacular.IngredientsApi()
export const recipesApi = new Spoonacular.RecipesApi()
export const wineApi = new Spoonacular.WineApi()

// Validate configuration
export function validateSpoonacularConfig(): void {
  if (!SPOONACULAR_CONFIG.apiKey) {
    throw new Error('SPOONACULAR_API_KEY environment variable is required')
  }
  
  if (!SPOONACULAR_CONFIG.apiKey.startsWith('spoonacular_')) {
    console.warn('Spoonacular API key should start with "spoonacular_"')
  }
}
```

## API Endpoint Integration

### Recipe Search Integration

```typescript
// server/utils/spoonacular-recipes.ts
import type {
  SearchRecipes200Response,
  SearchRecipes200ResponseResultsInner,
  SearchRecipesRequest
} from 'spoonacular'

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

export async function searchRecipes(
  params: RecipeSearchParams
): Promise<SearchRecipes200Response> {
  try {
    const response = await spoonacularApi.searchRecipes(
      params.query,
      params.cuisine,
      params.diet,
      params.intolerances,
      params.equipment,
      params.includeIngredients,
      params.excludeIngredients,
      params.type,
      params.maxReadyTime,
      params.minProtein,
      params.maxProtein,
      params.minFat,
      params.maxFat,
      params.minCarbs,
      params.maxCarbs,
      params.addRecipeInformation,
      params.addRecipeNutrition,
      params.fillIngredients,
      params.addRecipeInstructions,
      params.offset,
      params.number
    )
    
    if (!response || !Array.isArray(response.results)) {
      throw new Error('Invalid search response from Spoonacular API')
    }
    
    return response
  } catch (error) {
    handleSpoonacularError(error, 'searchRecipes', params)
  }
}
```

### Recipe Information Integration

```typescript
// server/utils/spoonacular-recipe-info.ts
import type {
  RecipeInformation,
  GetRecipeEquipmentByID200Response,
  GetRecipePriceBreakdownByID200Response,
  RecipeInformationWinePairing
} from 'spoonacular'

export async function getRecipeInformation(
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
    handleSpoonacularError(error, 'getRecipeInformation', { id })
  }
}

export async function getRecipeEquipment(
  id: number
): Promise<GetRecipeEquipmentByID200Response | null> {
  try {
    return await spoonacularApi.getRecipeEquipmentByID(id)
  } catch (error) {
    console.warn(`Failed to fetch equipment for recipe ${id}:`, error)
    return null
  }
}

export async function getRecipePriceBreakdown(
  id: number
): Promise<GetRecipePriceBreakdownByID200Response | null> {
  try {
    return await spoonacularApi.getRecipePriceBreakdownByID(id)
  } catch (error) {
    console.warn(`Failed to fetch price breakdown for recipe ${id}:`, error)
    return null
  }
}

export async function getRecipeWinePairing(
  id: number
): Promise<RecipeInformationWinePairing | null> {
  try {
    return await wineApi.getWinePairing(id)
  } catch (error) {
    console.warn(`Failed to fetch wine pairing for recipe ${id}:`, error)
    return null
  }
}
```

### Random Recipes Integration

```typescript
// server/utils/spoonacular-random.ts
import type {
  GetRandomRecipes200Response,
  GetRandomRecipesRequest
} from 'spoonacular'

export interface RandomRecipeParams {
  tags?: string
  number?: number
}

export async function getRandomRecipes(
  params: RandomRecipeParams = {}
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
    handleSpoonacularError(error, 'getRandomRecipes', params)
  }
}
```

### Ingredient Search Integration

```typescript
// server/utils/spoonacular-ingredients.ts
import type {
  IngredientSearch200Response,
  IngredientSearch200ResponseResultsInner,
  AutocompleteIngredientSearch200ResponseInner
} from 'spoonacular'

export interface IngredientSearchParams {
  query: string
  addChildren?: boolean
  minProteinPercent?: number
  maxProteinPercent?: number
  minFatPercent?: number
  maxFatPercent?: number
  minCarbsPercent?: number
  maxCarbsPercent?: number
  metaInformation?: boolean
  intolerances?: string
  sort?: string
  sortDirection?: string
  offset?: number
  number?: number
}

export async function searchIngredients(
  params: IngredientSearchParams
): Promise<IngredientSearch200Response> {
  try {
    const response = await ingredientsApi.ingredientSearch(
      params.query,
      params.addChildren,
      params.minProteinPercent,
      params.maxProteinPercent,
      params.minFatPercent,
      params.maxFatPercent,
      params.minCarbsPercent,
      params.maxCarbsPercent,
      params.metaInformation,
      params.intolerances,
      params.sort,
      params.sortDirection,
      params.offset,
      params.number
    )
    
    if (!response || !Array.isArray(response.results)) {
      throw new Error('Invalid ingredient search response from Spoonacular API')
    }
    
    return response
  } catch (error) {
    handleSpoonacularError(error, 'ingredientSearch', params)
  }
}

export async function autocompleteIngredientSearch(
  query: string,
  number: number = 10,
  metaInformation: boolean = false,
  intolerances?: string
): Promise<AutocompleteIngredientSearch200ResponseInner[]> {
  try {
    const response = await ingredientsApi.autocompleteIngredientSearch(
      query,
      number,
      metaInformation,
      intolerances
    )
    
    if (!Array.isArray(response)) {
      throw new Error('Invalid autocomplete response from Spoonacular API')
    }
    
    return response
  } catch (error) {
    handleSpoonacularError(error, 'autocompleteIngredientSearch', { query })
  }
}
```

## Type Safety and Data Mapping

### Type Definitions

```typescript
// types/spoonacular-types.ts
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
```

### Data Transformation

```typescript
// server/utils/spoonacular-transformer.ts
import type {
  RecipeInformation,
  RecipeInformationExtendedIngredientsInner,
  RecipeInformationNutrition,
  RecipeInformationAnalyzedInstructionsInner,
  GetRecipeEquipmentByID200Response,
  GetRecipePriceBreakdownByID200Response,
  RecipeInformationWinePairing
} from 'spoonacular'

export interface TransformedRecipeData {
  // Basic information
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
  
  // Complete data
  ingredients: TransformedIngredientData[]
  nutrition: TransformedNutritionData | null
  analyzedInstructions: TransformedInstructionData[]
  equipment: TransformedEquipmentData[]
  priceBreakdown: TransformedPriceBreakdownData | null
  winePairing: TransformedWinePairingData | null
  
  // Metadata
  cuisines: string[]
  diets: string[]
  dishTypes: string[]
  tags: string[]
}

export interface TransformedIngredientData {
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

export interface TransformedNutritionData {
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

export interface TransformedInstructionData {
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

export interface TransformedEquipmentData {
  id: number
  name: string
  localizedName: string
  image: string
  temperature?: {
    number: number
    unit: string
  }
}

export interface TransformedPriceBreakdownData {
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

export interface TransformedWinePairingData {
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

export function transformSpoonacularRecipe(
  apiRecipe: RecipeInformation,
  equipment?: GetRecipeEquipmentByID200Response,
  priceBreakdown?: GetRecipePriceBreakdownByID200Response,
  winePairing?: RecipeInformationWinePairing
): TransformedRecipeData {
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
    
    // Complete data
    ingredients: apiRecipe.extendedIngredients?.map(transformIngredient) || [],
    nutrition: apiRecipe.nutrition ? transformNutrition(apiRecipe.nutrition) : null,
    analyzedInstructions: apiRecipe.analyzedInstructions?.map(transformInstruction) || [],
    equipment: equipment?.equipment?.map(transformEquipment) || [],
    priceBreakdown: priceBreakdown ? transformPriceBreakdown(priceBreakdown) : null,
    winePairing: winePairing ? transformWinePairing(winePairing) : null,
    
    // Metadata
    cuisines: apiRecipe.cuisines || [],
    diets: apiRecipe.diets || [],
    dishTypes: apiRecipe.dishTypes || [],
    tags: apiRecipe.tags || []
  }
}

export function transformIngredient(
  apiIngredient: RecipeInformationExtendedIngredientsInner
): TransformedIngredientData {
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

export function transformNutrition(
  apiNutrition: RecipeInformationNutrition
): TransformedNutritionData {
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

export function transformInstruction(
  apiInstruction: RecipeInformationAnalyzedInstructionsInner
): TransformedInstructionData {
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

export function transformEquipment(
  apiEquipment: GetRecipeEquipmentByID200ResponseEquipmentInner
): TransformedEquipmentData {
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

export function transformPriceBreakdown(
  apiPriceBreakdown: GetRecipePriceBreakdownByID200Response
): TransformedPriceBreakdownData {
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

export function transformWinePairing(
  apiWinePairing: RecipeInformationWinePairing
): TransformedWinePairingData {
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

## Error Handling

### Spoonacular-Specific Error Handling

```typescript
// server/utils/spoonacular-error-handler.ts
import type { SpoonacularError } from '~/types/spoonacular-types'

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

export class SpoonacularRateLimitError extends SpoonacularApiError {
  constructor(endpoint: string, params?: Record<string, any>) {
    super('API rate limit exceeded', 429, endpoint, params)
    this.name = 'SpoonacularRateLimitError'
  }
}

export class SpoonacularQuotaExceededError extends SpoonacularApiError {
  constructor(endpoint: string, params?: Record<string, any>) {
    super('API quota exceeded', 402, endpoint, params)
    this.name = 'SpoonacularQuotaExceededError'
  }
}

export class SpoonacularTimeoutError extends SpoonacularApiError {
  constructor(endpoint: string, params?: Record<string, any>) {
    super('API request timeout', 408, endpoint, params)
    this.name = 'SpoonacularTimeoutError'
  }
}

export function handleSpoonacularError(
  error: any,
  endpoint: string,
  params?: Record<string, any>
): never {
  // Handle specific Spoonacular error codes
  if (error.statusCode === 429) {
    throw new SpoonacularRateLimitError(endpoint, params)
  }
  
  if (error.statusCode === 402) {
    throw new SpoonacularQuotaExceededError(endpoint, params)
  }
  
  if (error.code === 'ECONNABORTED' || error.statusCode === 408) {
    throw new SpoonacularTimeoutError(endpoint, params)
  }
  
  // Handle network errors
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    throw new SpoonacularApiError(
      'Network error - unable to connect to Spoonacular API',
      error.statusCode || 500,
      endpoint,
      params
    )
  }
  
  // Handle validation errors
  if (error.statusCode === 400) {
    throw new SpoonacularApiError(
      `Invalid request parameters: ${error.message}`,
      400,
      endpoint,
      params
    )
  }
  
  // Handle authentication errors
  if (error.statusCode === 401) {
    throw new SpoonacularApiError(
      'Invalid API key or authentication failed',
      401,
      endpoint,
      params
    )
  }
  
  // Generic error handling
  throw new SpoonacularApiError(
    error.message || 'Unknown Spoonacular API error',
    error.statusCode || 500,
    endpoint,
    params
  )
}

export function isRetryableError(error: SpoonacularApiError): boolean {
  return (
    error.statusCode === 429 || // Rate limit
    error.statusCode === 408 || // Timeout
    error.statusCode >= 500 || // Server errors
    error instanceof SpoonacularTimeoutError
  )
}
```

## Rate Limiting and Quota Management

### Quota Monitoring

```typescript
// server/utils/spoonacular-quota-monitor.ts
export interface SpoonacularQuota {
  requestsUsed: number
  requestsRemaining: number
  resetTime: string
}

export class SpoonacularQuotaMonitor {
  private quota: SpoonacularQuota | null = null
  private lastUpdate: Date | null = null
  
  async getQuota(): Promise<SpoonacularQuota | null> {
    // Check if we have recent quota info
    if (this.quota && this.lastUpdate && 
        Date.now() - this.lastUpdate.getTime() < 60000) { // 1 minute cache
      return this.quota
    }
    
    try {
      // Make a lightweight request to get quota info
      const response = await spoonacularApi.getRandomRecipes('', 1)
      
      // Extract quota info from response headers
      // Note: This depends on how the npm package handles headers
      this.quota = {
        requestsUsed: 0, // Would need to parse from headers
        requestsRemaining: 0, // Would need to parse from headers
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Estimate
      }
      
      this.lastUpdate = new Date()
      return this.quota
    } catch (error) {
      console.warn('Failed to get quota information:', error)
      return null
    }
  }
  
  async checkQuotaBeforeRequest(): Promise<boolean> {
    const quota = await this.getQuota()
    
    if (!quota) {
      return true // Allow request if we can't check quota
    }
    
    return quota.requestsRemaining > 0
  }
  
  async recordRequest(): Promise<void> {
    if (this.quota) {
      this.quota.requestsUsed++
      this.quota.requestsRemaining = Math.max(0, this.quota.requestsRemaining - 1)
    }
  }
}
```

## Integration Examples

### Complete Recipe Service

```typescript
// server/services/spoonacular-recipe-service.ts
import type {
  TransformedRecipeData,
  SpoonacularApiResponse
} from '~/types/spoonacular-types'
import {
  getRecipeInformation,
  getRecipeEquipment,
  getRecipePriceBreakdown,
  getRecipeWinePairing,
  transformSpoonacularRecipe
} from '~/utils/spoonacular-transformer'
import { ComprehensiveCacheManager } from '~/utils/comprehensive-cache-manager'

export class SpoonacularRecipeService {
  private cacheManager: ComprehensiveCacheManager
  private quotaMonitor: SpoonacularQuotaMonitor
  
  constructor() {
    this.cacheManager = new ComprehensiveCacheManager()
    this.quotaMonitor = new SpoonacularQuotaMonitor()
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
    
    // Check quota before making API request
    const canMakeRequest = await this.quotaMonitor.checkQuotaBeforeRequest()
    if (!canMakeRequest) {
      throw new SpoonacularQuotaExceededError('getCompleteRecipe', { recipeId })
    }
    
    try {
      // Fetch complete data from Spoonacular
      const [
        recipeInfo,
        equipment,
        priceBreakdown,
        winePairing
      ] = await Promise.all([
        getRecipeInformation(recipeId, true, true),
        getRecipeEquipment(recipeId),
        getRecipePriceBreakdown(recipeId),
        getRecipeWinePairing(recipeId)
      ])
      
      // Record the request
      await this.quotaMonitor.recordRequest()
      
      // Transform the data
      const transformedData = transformSpoonacularRecipe(
        recipeInfo,
        equipment,
        priceBreakdown,
        winePairing
      )
      
      // Cache the complete data
      await this.cacheManager.cacheCompleteRecipeData(
        recipeId,
        transformedData,
        {
          equipment,
          priceBreakdown,
          winePairing
        }
      )
      
      return {
        data: transformedData,
        cached: false,
        offline: false,
        timestamp: new Date().toISOString(),
        source: 'spoonacular'
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
    // Check quota before making API request
    const canMakeRequest = await this.quotaMonitor.checkQuotaBeforeRequest()
    if (!canMakeRequest) {
      throw new SpoonacularQuotaExceededError('searchRecipes', params)
    }
    
    try {
      const response = await searchRecipes(params)
      
      // Record the request
      await this.quotaMonitor.recordRequest()
      
      return {
        data: response,
        cached: false,
        offline: false,
        timestamp: new Date().toISOString(),
        source: 'spoonacular'
      }
    } catch (error) {
      throw error
    }
  }
  
  async getRandomRecipes(
    params: RandomRecipeParams = {}
  ): Promise<SpoonacularApiResponse<GetRandomRecipes200Response>> {
    // Check quota before making API request
    const canMakeRequest = await this.quotaMonitor.checkQuotaBeforeRequest()
    if (!canMakeRequest) {
      throw new SpoonacularQuotaExceededError('getRandomRecipes', params)
    }
    
    try {
      const response = await getRandomRecipes(params)
      
      // Record the request
      await this.quotaMonitor.recordRequest()
      
      return {
        data: response,
        cached: false,
        offline: false,
        timestamp: new Date().toISOString(),
        source: 'spoonacular'
      }
    } catch (error) {
      throw error
    }
  }
}
```

## API Route Integration

### Recipe API Routes

```typescript
// server/api/recipes/spoonacular/[id].ts
export default defineEventHandler(async (event) => {
  const recipeId = parseInt(getRouterParam(event, 'id')!)
  const query = getQuery(event)
  const forceRefresh = query.refresh === 'true'
  
  const recipeService = new SpoonacularRecipeService()
  
  try {
    const result = await recipeService.getCompleteRecipe(recipeId, forceRefresh)
    
    return {
      success: true,
      ...result
    }
  } catch (error) {
    if (error instanceof SpoonacularQuotaExceededError) {
      throw createError({
        statusCode: 402,
        statusMessage: 'API quota exceeded. Please try again later.'
      })
    }
    
    if (error instanceof SpoonacularRateLimitError) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Rate limit exceeded. Please try again later.'
      })
    }
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    })
  }
})
```

### Search API Routes

```typescript
// server/api/recipes/spoonacular/search.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const recipeService = new SpoonacularRecipeService()
  
  try {
    const result = await recipeService.searchRecipes(query as RecipeSearchParams)
    
    return {
      success: true,
      ...result
    }
  } catch (error) {
    if (error instanceof SpoonacularQuotaExceededError) {
      throw createError({
        statusCode: 402,
        statusMessage: 'API quota exceeded. Please try again later.'
      })
    }
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message
    })
  }
})
```

## Testing

### Unit Tests for Spoonacular Integration

```typescript
// tests/unit/services/spoonacular-recipe-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SpoonacularRecipeService } from '~/server/services/spoonacular-recipe-service'
import { getRecipeInformation } from '~/server/utils/spoonacular-recipe-info'

// Mock the Spoonacular API
vi.mock('~/server/utils/spoonacular-recipe-info')
vi.mock('~/server/utils/comprehensive-cache-manager')

describe('SpoonacularRecipeService', () => {
  let service: SpoonacularRecipeService
  
  beforeEach(() => {
    service = new SpoonacularRecipeService()
  })
  
  describe('getCompleteRecipe', () => {
    it('should fetch and transform recipe data from Spoonacular API', async () => {
      const mockRecipeData = {
        id: 123,
        title: 'Test Recipe',
        image: 'test-image.jpg',
        servings: 4,
        readyInMinutes: 30,
        extendedIngredients: [],
        nutrition: null,
        analyzedInstructions: [],
        cuisines: ['Italian'],
        diets: [],
        dishTypes: [],
        tags: []
      }
      
      vi.mocked(getRecipeInformation).mockResolvedValue(mockRecipeData)
      
      const result = await service.getCompleteRecipe(123)
      
      expect(result.data.externalId).toBe(123)
      expect(result.data.title).toBe('Test Recipe')
      expect(result.cached).toBe(false)
      expect(result.source).toBe('spoonacular')
    })
    
    it('should return cached data when available', async () => {
      // Mock cache to return data
      const mockCachedData = {
        offlineData: {
          recipe: {
            id: 123,
            title: 'Cached Recipe',
            // ... other fields
          }
        }
      }
      
      // Mock cache manager
      vi.mocked(service['cacheManager'].getCachedCompleteRecipeData)
        .mockResolvedValue(mockCachedData)
      
      const result = await service.getCompleteRecipe(123)
      
      expect(result.cached).toBe(true)
      expect(result.source).toBe('cache')
    })
    
    it('should throw quota exceeded error when quota is exceeded', async () => {
      // Mock quota monitor to return false
      vi.mocked(service['quotaMonitor'].checkQuotaBeforeRequest)
        .mockResolvedValue(false)
      
      await expect(service.getCompleteRecipe(123))
        .rejects
        .toThrow('API quota exceeded')
    })
  })
})
```

## Migration Strategy

### From Custom API Implementation

```typescript
// Migration guide for existing custom API implementation
export class SpoonacularMigrationService {
  async migrateFromCustomAPI() {
    // 1. Install the npm package
    // npm install spoonacular
    
    // 2. Update imports
    // Replace custom API calls with npm package calls
    
    // 3. Update type definitions
    // Use types from the npm package instead of custom types
    
    // 4. Update error handling
    // Use Spoonacular-specific error classes
    
    // 5. Update caching
    // Ensure cache keys are compatible with new data structure
    
    // 6. Update tests
    // Mock the npm package instead of custom API calls
  }
}
```

---

*This specification ensures proper integration with the official Spoonacular npm package, providing type safety, comprehensive error handling, and seamless integration with our existing architecture while maintaining offline capability and performance optimization.*
