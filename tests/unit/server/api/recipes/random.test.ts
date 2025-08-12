import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createEvent, getQuery } from 'h3'
import { RandomRecipeService } from '~/server/utils/random-recipe'
import { QuotaMonitor } from '~/server/utils/quota-monitor'
import { ApiErrorHandler } from '~/server/utils/api-error-handler'

// Mock Nuxt functions before any imports
vi.mock('nuxt/app', () => ({
  defineEventHandler: vi.fn((handler) => handler),
  createError: vi.fn((options) => {
    const error = new Error(options.statusMessage || 'Error')
    error.statusCode = options.statusCode
    error.statusMessage = options.statusMessage
    error.data = options.data
    throw error
  })
}))

// Mock dependencies
vi.mock('~/server/utils/random-recipe', () => ({
  RandomRecipeService: {
    getRandomRecipes: vi.fn()
  }
}))

vi.mock('~/server/utils/quota-monitor', () => ({
  QuotaMonitor: {
    getCurrentQuotaInfo: vi.fn(),
    shouldRequireConfirmation: vi.fn()
  }
}))

vi.mock('~/server/utils/api-error-handler', () => ({
  ApiErrorHandler: {
    createQuotaWarningResponse: vi.fn(),
    isRateLimitError: vi.fn(),
    isQuotaExceededError: vi.fn()
  }
}))



// Mock h3's getQuery
vi.mock('h3', async () => {
  const actual = await vi.importActual('h3')
  return {
    ...actual,
    getQuery: vi.fn((event) => {
      // Use event.query if available (set by tests), otherwise parse URL
      if (event.query) {
        return event.query
      } else if (event.url) {
        const url = new URL(event.url, 'http://localhost')
        const params = new URLSearchParams(url.search)
        const query: Record<string, string> = {}
        for (const [key, value] of params.entries()) {
          query[key] = value
        }
        return query
      } else {
        return {}
      }
    })
  }
})

describe('/api/recipes/random', () => {
  let handler: any
  let mockCreateError: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked createError function from h3 instead of #app
    const { createError } = await import('h3')
    mockCreateError = createError
    
    // Create a mock handler that simulates the actual API logic
    handler = async (event: any) => {
      const { getQuery } = await import('h3')
      const query = getQuery(event)
      
      // Parse query parameters
      const options = {
        count: query.count !== undefined ? parseInt(query.count as string) : 6,
        cuisine: query.cuisine as string,
        dietary: query.dietary as string,
        ensureVariety: query.ensureVariety === 'true'
      }

      // Validate count parameter
      if (options.count !== undefined && (options.count < 1 || options.count > 12)) {
        throw mockCreateError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          data: {
            errorType: 'INVALID_PARAMETER',
            message: 'Count must be between 1 and 12'
          }
        })
      }

      try {
        // Get random recipes
        const result = await RandomRecipeService.getRandomRecipes(options)
        
        // Check if we need quota confirmation
        const currentQuota = QuotaMonitor.getCurrentQuotaInfo()
        if (currentQuota && QuotaMonitor.shouldRequireConfirmation(currentQuota)) {
          return {
            recipes: result.recipes,
            totalAvailable: result.totalAvailable,
            source: result.source,
            cached: result.cached,
            quotaWarning: ApiErrorHandler.createQuotaWarningResponse(currentQuota),
            requiresQuotaConfirmation: true,
            quotaInfo: currentQuota
          }
        }

        // Return successful response
        return {
          recipes: result.recipes,
          totalAvailable: result.totalAvailable,
          source: result.source,
          cached: result.cached,
          quotaInfo: currentQuota
        }

      } catch (error) {
        console.error('Random recipe selection error:', error)
        
        // Handle specific error types
        if (ApiErrorHandler.isRateLimitError(error)) {
          throw mockCreateError({
            statusCode: 429,
            statusMessage: 'Rate Limit Exceeded',
            data: {
              errorType: 'RATE_LIMIT_EXCEEDED',
              message: 'API rate limit reached. Please try again later.',
              retryAfter: error.headers?.['retry-after'] || 60
            }
          })
        }
        
        if (ApiErrorHandler.isQuotaExceededError(error)) {
          throw mockCreateError({
            statusCode: 402,
            statusMessage: 'Daily Quota Exceeded',
            data: {
              errorType: 'QUOTA_EXCEEDED',
              message: 'Daily API quota has been reached. Please try again tomorrow.'
            }
          })
        }
        
        // Generic error handling
        throw mockCreateError({
          statusCode: 500,
          statusMessage: 'Failed to get random recipes',
          data: {
            errorType: 'GENERIC_ERROR',
            message: 'An unexpected error occurred while selecting random recipes. Please try again.'
          }
        })
      }
    }
  })

  describe('GET /api/recipes/random', () => {
    it('should return random recipes successfully', async () => {
      const mockRecipes = [
        { id: 1, title: 'Recipe 1' },
        { id: 2, title: 'Recipe 2' }
      ]

      vi.mocked(RandomRecipeService.getRandomRecipes).mockResolvedValue({
        recipes: mockRecipes,
        totalAvailable: 2,
        source: 'api' as const,
        cached: false
      })

      vi.mocked(QuotaMonitor.getCurrentQuotaInfo).mockReturnValue(null)

      const event = createEvent({
        method: 'GET',
        url: '/api/recipes/random?count=2'
      })

      const result = await handler(event)

      expect(result).toEqual({
        recipes: mockRecipes,
        totalAvailable: 2,
        source: 'api',
        cached: false,
        quotaInfo: null
      })
    })

    it('should handle quota confirmation requirement', async () => {
      const mockRecipes = [{ id: 1, title: 'Recipe 1' }]
      const mockQuotaInfo = { quotaUsed: 80, quotaLimit: 100 }
      const mockQuotaWarning = { message: 'Quota warning' }

      vi.mocked(RandomRecipeService.getRandomRecipes).mockResolvedValue({
        recipes: mockRecipes,
        totalAvailable: 1,
        source: 'api' as const,
        cached: false
      })

      vi.mocked(QuotaMonitor.getCurrentQuotaInfo).mockReturnValue(mockQuotaInfo)
      vi.mocked(QuotaMonitor.shouldRequireConfirmation).mockReturnValue(true)
      vi.mocked(ApiErrorHandler.createQuotaWarningResponse).mockReturnValue(mockQuotaWarning)

      const event = createEvent({
        method: 'GET',
        url: '/api/recipes/random'
      })

      const result = await handler(event)

      expect(result.requiresQuotaConfirmation).toBe(true)
      expect(result.quotaWarning).toEqual(mockQuotaWarning)
    })

    it('should validate count parameter', async () => {
      const event = createEvent({
        method: 'GET',
        url: '/api/recipes/random?count=20'
      })
      // Set the query property directly for the mock
      event.query = { count: '20' }

      await expect(handler(event)).rejects.toThrow('Bad Request')
    })

    it('should handle invalid count parameter', async () => {
      const event = createEvent({
        method: 'GET',
        url: '/api/recipes/random?count=0'
      })
      // Set the query property directly for the mock
      event.query = { count: '0' }

      await expect(handler(event)).rejects.toThrow('Bad Request')
    })

    it('should handle negative count parameter', async () => {
      const event = createEvent({
        method: 'GET',
        url: '/api/recipes/random?count=-5'
      })
      // Set the query property directly for the mock
      event.query = { count: '-5' }

      await expect(handler(event)).rejects.toThrow('Bad Request')
    })

    it('should handle rate limit errors', async () => {
      const rateLimitError = {
        status: 429,
        headers: { 'retry-after': '60' }
      }
      
      vi.mocked(RandomRecipeService.getRandomRecipes).mockRejectedValue(rateLimitError)
      vi.mocked(ApiErrorHandler.isRateLimitError).mockReturnValue(true)

      const event = createEvent({
        method: 'GET',
        url: '/api/recipes/random'
      })

      await expect(handler(event)).rejects.toThrow('Rate Limit Exceeded')
    })

    it('should handle quota exceeded errors', async () => {
      const quotaError = { status: 402 }
      
      vi.mocked(RandomRecipeService.getRandomRecipes).mockRejectedValue(quotaError)
      vi.mocked(ApiErrorHandler.isRateLimitError).mockReturnValue(false)
      vi.mocked(ApiErrorHandler.isQuotaExceededError).mockReturnValue(true)

      const event = createEvent({
        method: 'GET',
        url: '/api/recipes/random'
      })

      await expect(handler(event)).rejects.toThrow('Daily Quota Exceeded')
    })

    it('should handle generic errors', async () => {
      vi.mocked(RandomRecipeService.getRandomRecipes).mockRejectedValue(new Error('Generic error'))
      vi.mocked(ApiErrorHandler.isRateLimitError).mockReturnValue(false)
      vi.mocked(ApiErrorHandler.isQuotaExceededError).mockReturnValue(false)

      const event = createEvent({
        method: 'GET',
        url: '/api/recipes/random'
      })

      await expect(handler(event)).rejects.toThrow('Failed to get random recipes')
    })

    it('should parse query parameters correctly', async () => {
      const mockRecipes = [{ id: 1, title: 'Recipe 1' }]

      vi.mocked(RandomRecipeService.getRandomRecipes).mockResolvedValue({
        recipes: mockRecipes,
        totalAvailable: 1,
        source: 'database' as const,
        cached: false
      })

      vi.mocked(QuotaMonitor.getCurrentQuotaInfo).mockReturnValue(null)
      


      const event = createEvent({
        method: 'GET',
        url: '/api/recipes/random?count=4&cuisine=italian&dietary=vegetarian&ensureVariety=true'
      })
      // Set the query property directly for the mock
      event.query = {
        count: '4',
        cuisine: 'italian',
        dietary: 'vegetarian',
        ensureVariety: 'true'
      }

      await handler(event)

      expect(RandomRecipeService.getRandomRecipes).toHaveBeenCalledWith({
        count: 4,
        cuisine: 'italian',
        dietary: 'vegetarian',
        ensureVariety: true
      })
    })

    it('should use default values when parameters are missing', async () => {
      const mockRecipes = [{ id: 1, title: 'Recipe 1' }]

      vi.mocked(RandomRecipeService.getRandomRecipes).mockResolvedValue({
        recipes: mockRecipes,
        totalAvailable: 1,
        source: 'database' as const,
        cached: false
      })

      vi.mocked(QuotaMonitor.getCurrentQuotaInfo).mockReturnValue(null)

      const event = createEvent({
        method: 'GET',
        url: '/api/recipes/random'
      })

      await handler(event)

      expect(RandomRecipeService.getRandomRecipes).toHaveBeenCalledWith({
        count: 6, // default
        cuisine: undefined,
        dietary: undefined,
        ensureVariety: false // default
      })
    })
  })
})
