import type { AllergenInfo } from './allergen'
import type { NutritionDisplay } from './nutrition'

export interface DatabaseAllergen {
  id: number
  name: string
  severity: string
}

export interface DatabaseIngredient {
  id: number
  name: string
  amount?: number
  unit?: string
  aisle?: string
}

export interface Recipe {
  id: number
  externalId: number
  title: string
  image?: string
  servings?: number
  readyInMinutes?: number
  sourceUrl?: string
  sourceName?: string
  summary?: string
  instructions?: string
  analyzedInstructions?: SpoonacularInstruction[]
  cuisine?: string
  ingredients?: RecipeIngredient[]
  nutrition?: Nutrition
  allergens?: AllergenInfo[]
  isNew: boolean
  createdAt: string
  updatedAt: string
}

export interface RecipeCategory {
  id: string
  name: string
  filter: RecipeFilter | null
}

export interface RecipeFilter {
  maxTime?: number
  cuisine?: CuisineType
  type?: string
  dietary?: string
  seasonal?: boolean
}

export interface RecipeIngredient {
  id: number
  recipeId: number
  name: string
  amount?: number
  unit?: string
  aisle?: string
  createdAt: string
}

export interface Nutrition {
  id: number
  recipeId: number
  calories?: number
  protein?: number
  fat?: number
  carbs?: number
  fiber?: number
  sugar?: number
  sodium?: number
  createdAt: string
  updatedAt: string
}

export interface RecipeSearchResult {
  id: number
  title: string
  image?: string
  servings?: number
  readyInMinutes?: number
  cuisine?: string
  summary?: string
  nutrition?: NutritionDisplay
  allergens?: DatabaseAllergen[]
  ingredients?: DatabaseIngredient[]
  isNew: boolean
}

export interface RecipeSearchParams {
  query?: string
  offset?: number
  number?: number
  addRecipeInformation?: boolean
  addRecipeNutrition?: boolean
  category?: string
}

export interface QuotaInfo {
  quotaUsed: number
  quotaLeft: number
  quotaRequest: number
  quotaLimit: number
  percentageUsed: number
  resetTime: string
  dailyUsage: number
}

export interface RecipeSearchResponse {
  results: RecipeSearchResult[]
  offset: number
  number: number
  totalResults: number
  quotaInfo?: QuotaInfo
  quotaWarning?: any
  requiresQuotaConfirmation?: boolean
}

export interface RandomRecipeResponse {
  recipes: RecipeSearchResult[]
  totalAvailable: number
  source: 'api' | 'database' | 'cache'
  cached: boolean
  quotaInfo?: QuotaInfo
  quotaWarning?: any
  requiresQuotaConfirmation?: boolean
}

export interface SpoonacularRecipe {
  id: number
  title: string
  image?: string
  servings?: number
  readyInMinutes?: number
  sourceUrl?: string
  sourceName?: string
  summary?: string
  instructions?: string
  analyzedInstructions?: SpoonacularInstruction[]
  cuisines?: string[]
  intolerances?: string[]
  extendedIngredients?: SpoonacularIngredient[]
  nutrition?: SpoonacularNutrition
}

export interface SpoonacularInstruction {
  name: string
  steps: {
    number: number
    step: string
    ingredients?: any[]
    equipment?: any[]
  }[]
}

export interface SpoonacularIngredient {
  id: number
  aisle?: string
  amount: number
  unit: string
  name: string
  original: string
  originalName: string
  meta: string[]
  image?: string
}

export interface SpoonacularNutrition {
  nutrients: SpoonacularNutrient[]
}

export interface SpoonacularNutrient {
  name: string
  amount: number
  unit: string
  percentOfDailyNeeds?: number
}

export interface RecipeDetailResponse {
  recipe: Recipe & {
    allergens?: AllergenInfo[]
  }
  cached: boolean
}

// Cuisine types based on Spoonacular API documentation
export type CuisineType = 
  | 'african' | 'american' | 'british' | 'cajun' | 'caribbean' | 'chinese' 
  | 'eastern european' | 'european' | 'french' | 'german' | 'greek' | 'indian' 
  | 'irish' | 'italian' | 'japanese' | 'jewish' | 'korean' | 'latin american' 
  | 'mediterranean' | 'mexican' | 'middle eastern' | 'nordic' | 'southern' 
  | 'spanish' | 'thai' | 'vietnamese'
