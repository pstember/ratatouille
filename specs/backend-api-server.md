# Backend API & Server Specification

## Overview

This specification defines the server-side architecture, API endpoints, middleware, and utilities for the Ratatouille Recipe Discovery Platform using Nuxt 3's Nitro server.

## Server Architecture

### Nitro Server Structure

```
server/
├── api/                    # API route handlers
│   ├── recipes.ts         # Recipe search endpoint
│   ├── recipes/
│   │   ├── new.ts         # New recipes endpoint
│   │   └── [id].ts        # Individual recipe endpoint
│   └── recipe/
│       └── [id].ts        # Recipe detail endpoint
├── database/              # Database configuration
│   └── client.ts          # Prisma client setup
├── plugins/               # Server plugins
│   └── prisma.ts          # Prisma plugin
└── utils/                 # Server utilities
    ├── cache.ts           # Caching utilities
    └── recipe.ts          # Recipe processing utilities
```

### Request Flow

```
Client Request → Nitro Middleware → API Route → Business Logic → Database → Response
```

## API Endpoints

### Core System Endpoints

#### Health Check
- **Endpoint**: `GET /api/health`
- **Purpose**: Server health monitoring
- **Response**: Server status, uptime, and timestamp

#### Quota Information
- **Endpoint**: `GET /api/quota`
- **Purpose**: Get current API quota information without consuming quota
- **Response**: Current quota usage, limits, and reset time
- **Features**:
  - Returns quota information from QuotaService (database-backed)
  - Does not make external API calls
  - Provides real-time quota status with database persistence
  - Used for initial quota loading on app startup
  - Tracks Spoonacular API points (150 daily limit)
  - Shared quota pool across all users

### Recipe Search API

**Endpoint**: `GET /api/recipes`

**Purpose**: Search and filter recipes with pagination

**Query Parameters**:
```typescript
interface RecipeSearchQuery {
  q?: string              // Search query
  offset?: number         // Pagination offset (default: 0)
  number?: number         // Number of results (default: 20, max: 100)
  cuisine?: string        // Cuisine filter
  diet?: string          // Dietary restriction
  maxReadyTime?: number   // Maximum cooking time
  type?: string          // Recipe type (main course, dessert, etc.)
  addRecipeInformation?: boolean  // Include detailed info
  addRecipeNutrition?: boolean    // Include nutrition data
}
```

**Response Format**:
```typescript
interface RecipeSearchResponse {
  results: RecipeSearchResult[]
  offset: number
  number: number
  totalResults: number
  cached: boolean
}
```

**Implementation**:
```typescript
// server/api/recipes.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const config = useRuntimeConfig()
  
  try {
    // Validate query parameters
    const searchParams = validateSearchParams(query)
    
    // Check cache first
    const cacheKey = generateCacheKey(searchParams)
    const cachedResult = await getCachedResult(cacheKey)
    
    if (cachedResult) {
      return {
        ...cachedResult,
        cached: true
      }
    }
    
    // Fetch from external API
    const apiResult = await fetchFromSpoonacular(searchParams, config)
    
    // Store in cache
    await cacheResult(cacheKey, apiResult)
    
    // Store recipes in database
    await storeRecipesInDatabase(apiResult.results)
    
    return {
      ...apiResult,
      cached: false
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch recipes'
    })
  }
})
```

### New Recipes API

**Endpoint**: `GET /api/recipes/new`

**Purpose**: Get recently added recipes

**Query Parameters**:
```typescript
interface NewRecipesQuery {
  limit?: number          // Number of recipes (default: 10)
  offset?: number         // Pagination offset (default: 0)
}
```

**Response Format**:
```typescript
interface NewRecipesResponse {
  recipes: Recipe[]
  total: number
}
```

**Implementation**:
```typescript
// server/api/recipes/new.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = parseInt(query.limit as string) || 10
  const offset = parseInt(query.offset as string) || 0
  
  try {
    const recipes = await prisma.recipe.findMany({
      where: {
        isNew: true
      },
      include: {
        nutrition: true,
        ingredients: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })
    
    const total = await prisma.recipe.count({
      where: { isNew: true }
    })
    
    return {
      recipes,
      total
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch new recipes'
    })
  }
})
```

### Recipe Detail API

**Endpoint**: `GET /api/recipe/[id]`

**Purpose**: Get detailed recipe information

**Path Parameters**:
```typescript
interface RecipeDetailParams {
  id: string              // Recipe ID
}
```

**Response Format**:
```typescript
interface RecipeDetailResponse {
  recipe: Recipe
  cached: boolean
}
```

**Implementation**:
```typescript
// server/api/recipe/[id].ts
export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const config = useRuntimeConfig()
  
  try {
    // Check database first
    let recipe = await prisma.recipe.findUnique({
      where: { externalId: parseInt(id) },
      include: {
        nutrition: true,
        ingredients: true
      }
    })
    
    if (recipe) {
      // Mark as viewed (not new)
      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { isNew: false }
      })
      
      return {
        recipe,
        cached: true
      }
    }
    
    // Fetch from external API
    const apiRecipe = await fetchRecipeFromSpoonacular(id, config)
    
    // Store in database
    recipe = await storeRecipeInDatabase(apiRecipe)
    
    return {
      recipe,
      cached: false
    }
  } catch (error) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Recipe not found'
    })
  }
})
```

## Database Integration

### Prisma Client Setup

```typescript
// server/database/client.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Prisma Plugin

```typescript
// server/plugins/prisma.ts
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('close', async () => {
    await prisma.$disconnect()
  })
})
```

## Caching System

### Cache Utilities

```typescript
// server/utils/cache.ts
interface CacheEntry {
  key: string
  value: string
  type: 'recipe' | 'search' | 'nutrition'
  recipeId?: number
  expiresAt: Date
}

export async function getCachedResult(key: string): Promise<any | null> {
  try {
    const cacheEntry = await prisma.cache.findUnique({
      where: { key }
    })
    
    if (!cacheEntry || cacheEntry.expiresAt < new Date()) {
      return null
    }
    
    return JSON.parse(cacheEntry.value)
  } catch (error) {
    console.error('Cache read error:', error)
    return null
  }
}

export async function cacheResult(key: string, value: any, ttl: number = 604800): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttl * 1000)
    
    await prisma.cache.upsert({
      where: { key },
      update: {
        value: JSON.stringify(value),
        expiresAt
      },
      create: {
        key,
        value: JSON.stringify(value),
        type: 'search',
        expiresAt
      }
    })
  } catch (error) {
    console.error('Cache write error:', error)
  }
}

export async function generateCacheKey(params: any): Promise<string> {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key]
      return result
    }, {} as any)
  
  return `search:${JSON.stringify(sortedParams)}`
}
```

## External API Integration

### Spoonacular API Client

```typescript
// server/utils/recipe.ts
interface SpoonacularConfig {
  apiKey: string
  baseUrl: string
}

export async function fetchFromSpoonacular(
  params: RecipeSearchParams,
  config: SpoonacularConfig
): Promise<SpoonacularSearchResponse> {
  const searchParams = new URLSearchParams({
    apiKey: config.apiKey,
    ...params
  })
  
  const response = await $fetch(`${config.baseUrl}/complexSearch?${searchParams}`)
  
  if (!response || !response.results) {
    throw new Error('Invalid API response')
  }
  
  return response
}

export async function fetchRecipeFromSpoonacular(
  id: string,
  config: SpoonacularConfig
): Promise<SpoonacularRecipe> {
  const searchParams = new URLSearchParams({
    apiKey: config.apiKey
  })
  
  const response = await $fetch(`${config.baseUrl}/${id}/information?${searchParams}`)
  
  if (!response || !response.id) {
    throw new Error('Recipe not found')
  }
  
  return response
}
```

### Data Transformation

```typescript
// server/utils/recipe.ts
export function transformSpoonacularRecipe(apiRecipe: SpoonacularRecipe): Recipe {
  return {
    externalId: apiRecipe.id,
    title: apiRecipe.title,
    image: apiRecipe.image,
    servings: apiRecipe.servings,
    readyInMinutes: apiRecipe.readyInMinutes,
    sourceUrl: apiRecipe.sourceUrl,
    sourceName: apiRecipe.sourceName,
    summary: apiRecipe.summary,
    instructions: apiRecipe.instructions,
    cuisine: apiRecipe.cuisines?.[0] || null,
    isNew: true,
    ingredients: apiRecipe.extendedIngredients?.map(transformIngredient) || [],
    nutrition: apiRecipe.nutrition ? transformNutrition(apiRecipe.nutrition) : null
  }
}

export function transformIngredient(apiIngredient: SpoonacularIngredient): RecipeIngredient {
  return {
    name: apiIngredient.name,
    amount: apiIngredient.amount,
    unit: apiIngredient.unit,
    aisle: apiIngredient.aisle
  }
}

export function transformNutrition(apiNutrition: SpoonacularNutrition): Nutrition {
  const nutrients = apiNutrition.nutrients.reduce((acc, nutrient) => {
    acc[nutrient.name.toLowerCase()] = nutrient.amount
    return acc
  }, {} as any)
  
  return {
    calories: nutrients.calories,
    protein: nutrients.protein,
    fat: nutrients.fat,
    carbs: nutrients.carbohydrates,
    fiber: nutrients.fiber,
    sugar: nutrients.sugar,
    sodium: nutrients.sodium
  }
}
```

## Error Handling

### Global Error Handler

```typescript
// server/middleware/error.ts
export default defineEventHandler((event) => {
  event.node.res.on('error', (error) => {
    console.error('Server error:', error)
  })
})
```

### API Error Responses

```typescript
// Standard error response format
interface ApiError {
  statusCode: number
  statusMessage: string
  message?: string
  details?: any
}

// Error creation utility
function createApiError(statusCode: number, message: string, details?: any): ApiError {
  return {
    statusCode,
    statusMessage: message,
    details
  }
}
```

### API Rate Limit Error Handling

**Purpose**: Handle Spoonacular API rate limit errors gracefully and provide user-friendly feedback

**Rate Limit Detection**:
```typescript
// server/utils/api-error-handler.ts
export class ApiErrorHandler {
  static isRateLimitError(error: any): boolean {
    return error.statusCode === 429 || 
           error.message?.includes('rate limit') ||
           error.message?.includes('quota exceeded') ||
           error.message?.includes('too many requests')
  }

  static isQuotaExceededError(error: any): boolean {
    return error.statusCode === 402 || 
           error.message?.includes('quota exceeded') ||
           error.message?.includes('daily limit')
  }

  static createRateLimitResponse(): ApiError {
    return {
      statusCode: 429,
      statusMessage: 'Rate Limit Exceeded',
      message: 'API rate limit reached. Please try again later or check your daily quota.',
      details: {
        errorType: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 60 // Default retry time in seconds
      }
    }
  }

  static createQuotaExceededResponse(): ApiError {
    return {
      statusCode: 402,
      statusMessage: 'Daily Quota Exceeded',
      message: 'Daily API quota has been reached. Please try again tomorrow.',
      details: {
        errorType: 'QUOTA_EXCEEDED',
        resetTime: 'midnight UTC'
      }
    }
  }
}
```

**API Endpoint Error Handling**:
```typescript
// server/api/recipes.ts
export default defineEventHandler(async (event) => {
  try {
    // ... existing API logic ...
    
    const response = await $fetch<SpoonacularSearchResponse>(
      `${apiUrl}?${params}`
    )
    
    // ... process response ...
    
  } catch (error) {
    console.error('Recipe search error:', error)
    
    // Handle rate limit errors specifically
    if (ApiErrorHandler.isRateLimitError(error)) {
      const fallbackData = await getCachedRecipes()
      throw createError({
        statusCode: 429,
        statusMessage: 'Rate Limit Exceeded',
        data: {
          errorType: 'RATE_LIMIT_EXCEEDED',
          message: 'API rate limit reached. Please try again later.',
          retryAfter: error.headers?.['retry-after'] || 60,
          fallbackData // Return cached data if available
        }
      })
    }
    
    if (ApiErrorHandler.isQuotaExceededError(error)) {
      const fallbackData = await getCachedRecipes()
      throw createError({
        statusCode: 402,
        statusMessage: 'Daily Quota Exceeded',
        data: {
          errorType: 'QUOTA_EXCEEDED',
          message: 'Daily API quota has been reached. Please try again tomorrow.',
          fallbackData // Return cached data if available
        }
      })
    }
    
    // Generic error handling
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to search recipes',
      data: {
        errorType: 'GENERIC_ERROR',
        message: 'An unexpected error occurred. Please try again.'
      }
    })
  }
})
```

**Caching Fallback Strategy**:
```typescript
// server/utils/cache-fallback.ts
export async function getCachedRecipes(limit: number = 20): Promise<RecipeSearchResult[]> {
  try {
    // Return recently cached recipes as fallback
    const cachedRecipes = await prisma.recipe.findMany({
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: { nutrition: true }
    })
    
    return cachedRecipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      servings: recipe.servings,
      readyInMinutes: recipe.readyInMinutes,
      cuisine: recipe.cuisine,
      nutrition: recipe.nutrition,
      isNew: recipe.isNew,
      cached: true // Indicate this is cached data
    }))
  } catch (error) {
    console.error('Cache fallback error:', error)
    return []
  }
}
```

### API Quota Monitoring & User Confirmation

**Purpose**: Monitor Spoonacular API quota usage and require user confirmation when 85% of daily quota is consumed

**Quota Information Endpoint**:
```typescript
// server/api/quota.ts
export default defineEventHandler(async () => {
  try {
    const quotaInfo = await QuotaMonitor.checkQuota()
    
    return {
      quotaInfo,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error fetching quota info:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch quota information'
    })
  }
})
```

**Endpoint**: `GET /api/quota`
**Response**: Returns current quota information including usage, limits, and reset time
**Purpose**: Provides initial quota data for frontend components without requiring API calls

**Quota Monitoring Service**:

```typescript
// server/utils/quota-service.ts
export interface QuotaInfo {
  quotaUsed: number
  quotaLeft: number
  quotaRequest: number
  quotaLimit: number
  percentageUsed: number
  resetTime: string // UTC midnight
  dailyUsage: number // Our tracked daily usage
  hasQuota: boolean
}

export class QuotaService {
  private static readonly QUOTA_WARNING_THRESHOLD = 85 // 85% threshold
  private static readonly FREE_PLAN_LIMIT = 150 // Free plan daily limit (Spoonacular points)
  private static currentQuotaInfo: QuotaInfo | null = null
  
  // Database-backed quota tracking methods
  static async getDailyQuotaUsage(): Promise<number>
  static async updateDailyQuotaUsage(pointsUsed: number): Promise<void>
  static async checkQuota(): Promise<QuotaInfo>
  static async extractQuotaFromResponse(response: any): Promise<QuotaInfo | null>
  static async updateQuotaExceeded(): Promise<QuotaInfo>
  static async cleanupOldRecords(): Promise<void>
  
  static shouldRequireConfirmation(quotaInfo: QuotaInfo): boolean {
    return quotaInfo.percentageUsed >= this.QUOTA_WARNING_THRESHOLD
  }
  
  static getQuotaWarningMessage(quotaInfo: QuotaInfo): string {
    const remainingPoints = Math.floor(quotaInfo.quotaLeft)
    const hoursUntilReset = this.getHoursUntilReset(quotaInfo.resetTime)
    
    return `You have used ${quotaInfo.percentageUsed.toFixed(1)}% of your daily API quota (${remainingPoints} points remaining). Your quota resets in ${hoursUntilReset} hours. Do you want to continue?`
  }
  
  private static getHoursUntilReset(resetTime: string): number {
    const now = new Date()
    const reset = new Date(resetTime)
    const diffMs = reset.getTime() - now.getTime()
    return Math.ceil(diffMs / (1000 * 60 * 60))
  }
}
```

**Enhanced API Error Handler**:
```typescript
// server/utils/api-error-handler.ts
export class ApiErrorHandler {
  static isRateLimitError(error: any): boolean {
    return error.statusCode === 429 || 
           error.message?.includes('rate limit') ||
           error.message?.includes('quota exceeded') ||
           error.message?.includes('too many requests')
  }

  static isQuotaExceededError(error: any): boolean {
    return error.statusCode === 402 || 
           error.message?.includes('quota exceeded') ||
           error.message?.includes('daily limit')
  }

  static createQuotaWarningResponse(quotaInfo: QuotaInfo): ApiError {
    return {
      statusCode: 200, // Success but with warning
      statusMessage: 'Quota Warning',
      message: QuotaService.getQuotaWarningMessage(quotaInfo),
      details: {
        errorType: 'QUOTA_WARNING',
        quotaInfo,
        requiresConfirmation: true
      }
    }
  }

  static createRateLimitResponse(): ApiError {
    return {
      statusCode: 429,
      statusMessage: 'Rate Limit Exceeded',
      message: 'API rate limit reached. Please try again later or check your daily quota.',
      details: {
        errorType: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 60 // Default retry time in seconds
      }
    }
  }

  static createQuotaExceededResponse(): ApiError {
    return {
      statusCode: 402,
      statusMessage: 'Daily Quota Exceeded',
      message: 'Daily API quota has been reached. Please try again tomorrow.',
      details: {
        errorType: 'QUOTA_EXCEEDED',
        resetTime: 'midnight UTC'
      }
    }
  }
}
```

**Smart Quota-Aware API Endpoint**:
```typescript
// server/api/recipes.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  const confirmedQuotaUsage = query.confirmedQuotaUsage === 'true'
  
  try {
    // Check current quota status from cached info
const currentQuotaInfo = QuotaService.getCurrentQuotaInfo()

// If we have quota info and it's above threshold, check confirmation
if (currentQuotaInfo && QuotaService.shouldRequireConfirmation(currentQuotaInfo) && !confirmedQuotaUsage) {
      return {
        results: [],
        offset: 0,
        number: 0,
        totalResults: 0,
        quotaWarning: ApiErrorHandler.createQuotaWarningResponse(currentQuotaInfo),
        requiresQuotaConfirmation: true,
        quotaInfo: currentQuotaInfo
      }
    }
    
    // Make the actual API call
    const response = await $fetch<SpoonacularSearchResponse>(
      `${apiUrl}?${params}`
    )
    
    // Extract quota info from the response (no additional API call needed)
    const quotaInfo = QuotaMonitor.extractQuotaFromResponse(response)
    
    // Check if quota warning is needed after this request
    if (quotaInfo && QuotaMonitor.shouldRequireConfirmation(quotaInfo) && !confirmedQuotaUsage) {
      return {
        ...response,
        quotaWarning: ApiErrorHandler.createQuotaWarningResponse(quotaInfo),
        requiresQuotaConfirmation: true,
        quotaInfo
      }
    }
    
    // Return response with quota info
    return {
      ...response,
      quotaInfo
    }
    
  } catch (error) {
    console.error('Recipe search error:', error)
    
    // Handle rate limit errors specifically
    if (ApiErrorHandler.isRateLimitError(error)) {
      const fallbackData = await getCachedRecipes()
      throw createError({
        statusCode: 429,
        statusMessage: 'Rate Limit Exceeded',
        data: {
          errorType: 'RATE_LIMIT_EXCEEDED',
          message: 'API rate limit reached. Please try again later.',
          retryAfter: error.headers?.['retry-after'] || 60,
          fallbackData // Return cached data if available
        }
      })
    }
    
    if (ApiErrorHandler.isQuotaExceededError(error)) {
      const fallbackData = await getCachedRecipes()
      throw createError({
        statusCode: 402,
        statusMessage: 'Daily Quota Exceeded',
        data: {
          errorType: 'QUOTA_EXCEEDED',
          message: 'Daily API quota has been reached. Please try again tomorrow.',
          fallbackData // Return cached data if available
        }
      })
    }
    
    // Generic error handling
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to search recipes',
      data: {
        errorType: 'GENERIC_ERROR',
        message: 'An unexpected error occurred. Please try again.'
      }
    })
  }
})
```

**Smart Quota Tracking from API Responses**:
```typescript
// server/utils/quota-monitor.ts
export class QuotaMonitor {
  private static readonly QUOTA_WARNING_THRESHOLD = 85 // 85% threshold
  private static readonly FREE_PLAN_LIMIT = 150 // Free plan daily limit
  
  // Track daily quota usage in memory/database
  private static dailyQuotaUsage: Map<string, number> = new Map()
  private static lastResetDate: string = ''
  private static currentQuotaInfo: QuotaInfo | null = null
  
  static getCurrentDateKey(): string {
    return new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  }
  
  static resetDailyQuotaIfNeeded(): void {
    const currentDate = this.getCurrentDateKey()
    
    if (this.lastResetDate !== currentDate) {
      // New day, reset quota tracking
      this.dailyQuotaUsage.clear()
      this.lastResetDate = currentDate
      this.currentQuotaInfo = null // Reset cached quota info
      console.log(`Daily quota reset for ${currentDate}`)
    }
  }
  
  static updateDailyQuotaUsage(pointsUsed: number): void {
    this.resetDailyQuotaIfNeeded()
    
    const currentDate = this.getCurrentDateKey()
    const currentUsage = this.dailyQuotaUsage.get(currentDate) || 0
    this.dailyQuotaUsage.set(currentDate, currentUsage + pointsUsed)
  }
  
  static getDailyQuotaUsage(): number {
    this.resetDailyQuotaIfNeeded()
    const currentDate = this.getCurrentDateKey()
    return this.dailyQuotaUsage.get(currentDate) || 0
  }
  
  // Extract quota info from any Spoonacular API response
  static extractQuotaFromResponse(response: any): QuotaInfo | null {
    if (!response || !response.headers) return null
    
    const quotaUsed = parseInt(response.headers['x-api-quota-used'] || '0')
    const quotaLeft = parseInt(response.headers['x-api-quota-left'] || '0')
    const quotaRequest = parseInt(response.headers['x-api-quota-request'] || '0')
    
    if (quotaUsed === 0 && quotaLeft === 0 && quotaRequest === 0) {
      return null // No quota info available
    }
    
    const quotaLimit = this.FREE_PLAN_LIMIT
    const percentageUsed = (quotaUsed / quotaLimit) * 100
    
    // Update our daily tracking
    this.updateDailyQuotaUsage(quotaRequest)
    
    // Calculate reset time (next midnight UTC)
    const now = new Date()
    const resetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    resetTime.setUTCHours(0, 0, 0, 0)
    
    const quotaInfo: QuotaInfo = {
      quotaUsed,
      quotaLeft,
      quotaRequest,
      quotaLimit,
      percentageUsed,
      resetTime: resetTime.toISOString(),
      dailyUsage: this.getDailyQuotaUsage()
    }
    
    // Cache the current quota info
    this.currentQuotaInfo = quotaInfo
    
    return quotaInfo
  }
  
  // Get cached quota info (from last API response)
  static getCurrentQuotaInfo(): QuotaInfo | null {
    this.resetDailyQuotaIfNeeded()
    return this.currentQuotaInfo
  }
  
  static shouldRequireConfirmation(quotaInfo: QuotaInfo): boolean {
    return quotaInfo.percentageUsed >= this.QUOTA_WARNING_THRESHOLD
  }
  
  static getQuotaWarningMessage(quotaInfo: QuotaInfo): string {
    const remainingRequests = Math.floor(quotaInfo.quotaLeft)
    const hoursUntilReset = this.getHoursUntilReset(quotaInfo.resetTime)
    
    return `You have used ${quotaInfo.percentageUsed.toFixed(1)}% of your daily API quota (${remainingRequests} requests remaining). Your quota resets in ${hoursUntilReset} hours. Do you want to continue?`
  }
  
  private static getHoursUntilReset(resetTime: string): number {
    const now = new Date()
    const reset = new Date(resetTime)
    const diffMs = reset.getTime() - now.getTime()
    return Math.ceil(diffMs / (1000 * 60 * 60))
  }
}
```

## Request Validation

### Parameter Validation

```typescript
// server/utils/validation.ts
export function validateSearchParams(query: any): RecipeSearchParams {
  const params: RecipeSearchParams = {}
  
  if (query.q && typeof query.q === 'string') {
    params.query = query.q.trim()
  }
  
  if (query.offset) {
    const offset = parseInt(query.offset as string)
    if (!isNaN(offset) && offset >= 0) {
      params.offset = offset
    }
  }
  
  if (query.number) {
    const number = parseInt(query.number as string)
    if (!isNaN(number) && number > 0 && number <= 100) {
      params.number = number
    }
  }
  
  if (query.cuisine && typeof query.cuisine === 'string') {
    params.cuisine = query.cuisine.toLowerCase()
  }
  
  if (query.diet && typeof query.diet === 'string') {
    params.diet = query.diet.toLowerCase()
  }
  
  if (query.maxReadyTime) {
    const maxTime = parseInt(query.maxReadyTime as string)
    if (!isNaN(maxTime) && maxTime > 0) {
      params.maxReadyTime = maxTime
    }
  }
  
  return params
}
```

## Middleware

### Request Logging

```typescript
// server/middleware/logging.ts
export default defineEventHandler((event) => {
  const start = Date.now()
  
  event.node.res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${event.method} ${event.path} - ${event.node.res.statusCode} - ${duration}ms`)
  })
})
```

### Rate Limiting

```typescript
// server/middleware/rate-limit.ts
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export default defineEventHandler((event) => {
  const clientIP = getClientIP(event)
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxRequests = 100
  
  const clientData = rateLimitMap.get(clientIP)
  
  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + windowMs })
  } else if (clientData.count >= maxRequests) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests'
    })
  } else {
    clientData.count++
  }
})
```

## Performance Optimization

### Database Query Optimization

```typescript
// Optimized recipe queries
export async function getRecipesWithOptimizations(params: RecipeSearchParams) {
  return prisma.recipe.findMany({
    where: buildWhereClause(params),
    include: {
      nutrition: {
        select: {
          calories: true,
          protein: true,
          fat: true,
          carbs: true
        }
      },
      ingredients: {
        select: {
          name: true,
          amount: true,
          unit: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: params.number || 20,
    skip: params.offset || 0
  })
}
```

### Response Compression

```typescript
// Nitro automatically handles compression
// Configure in nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    compressPublicAssets: true,
    minify: true
  }
})
```

## Security Considerations

### Input Sanitization

```typescript
// Sanitize user inputs
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 100)    // Limit length
}
```

### API Key Protection

```typescript
// Environment-based configuration
const config = useRuntimeConfig()

if (!config.spoonacularApiKey) {
  throw new Error('SPOONACULAR_API_KEY is required')
}
```

## Monitoring & Logging

### Request Monitoring

```typescript
// Performance monitoring
export default defineEventHandler((event) => {
  const start = performance.now()
  
  event.node.res.on('finish', () => {
    const duration = performance.now() - start
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${event.method} ${event.path} - ${duration.toFixed(2)}ms`)
    }
    
    // Metrics collection
    collectMetrics({
      path: event.path,
      method: event.method,
      statusCode: event.node.res.statusCode,
      duration
    })
  })
})
```

### Database Monitoring

```typescript
// Database query monitoring
prisma.$use(async (params, next) => {
  const start = performance.now()
  const result = await next(params)
  const duration = performance.now() - start
  
  if (duration > 100) {
    console.warn(`Slow query: ${params.model}.${params.action} - ${duration.toFixed(2)}ms`)
  }
  
  return result
})
```

---

*This specification should be updated when new API endpoints are added or existing ones are modified.*
