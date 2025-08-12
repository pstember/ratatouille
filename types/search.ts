import type { RecipeSearchResult, RecipeSearchResponse } from './recipe'
import type { QuotaInfo } from './quota'

export interface DatabaseSearchParams {
  query: string
  offset: number
  limit: number
  category?: string
  filters?: {
    cuisine?: string
    maxTime?: number
    dietary?: string
  }
}

export interface DatabaseSearchResult {
  recipes: RecipeSearchResult[]
  totalCount: number
  source: 'database'
  hasMoreResults: boolean
}

export interface SearchChoice {
  databaseResults: RecipeSearchResult[]
  totalDatabaseResults: number
  showSpoonacularOption: boolean
  estimatedApiCost: number
  qualityAssessment: {
    isSufficient: boolean
    reason: string
    suggestedAction: 'use_database' | 'offer_spoonacular' | 'mixed'
  }
}

export interface EnhancedSearchResponse extends RecipeSearchResponse {
  searchSource: 'database' | 'api' | 'spoonacular' | 'mixed'
  searchMode: 'database' | 'spoonacular'
  databaseResults: {
    count: number
    totalAvailable: number
  }
  spoonacularOption?: {
    available: boolean
    estimatedCost: number
    quotaWarning?: boolean
  }
  spoonacularResults?: {
    count: number
    enrichedRecipes: number
    quotaUsed: number
  }
  enrichmentStats?: {
    newRecipes: number
    updatedRecipes: number
    totalEnriched: number
  }
  quotaInfo?: QuotaInfo
  qualityAssessment?: {
    isSufficient: boolean
    reason: string
    suggestedAction: 'use_database' | 'offer_spoonacular' | 'mixed'
  }
}

export interface SearchState {
  databaseResults: RecipeSearchResult[]
  apiResults: RecipeSearchResult[]
  searchSource: 'database' | 'api' | 'spoonacular' | 'mixed'
  showSpoonacularOption: boolean
  estimatedApiCost: number
  enrichmentStats?: {
    newRecipes: number
    updatedRecipes: number
    totalEnriched: number
  }
  quotaInfo?: {
    quotaUsed: number
    hasQuota: boolean
  }
  qualityAssessment?: {
    isSufficient: boolean
    reason: string
    suggestedAction: 'use_database' | 'offer_spoonacular' | 'mixed'
  }
}

export interface SearchSourceIndicator {
  source: 'database' | 'api' | 'spoonacular' | 'mixed'
  label: string
  icon: string
  tooltip: string
}

export interface SpoonacularSearchRequest {
  query: string
  offset: number
  number: number
  category?: string
  confirmedQuotaUsage: boolean
  userConsent: boolean
}
