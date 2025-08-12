import { RandomRecipeService } from '../../utils/random-recipe'
import { QuotaService } from '../../utils/quota-service'
import { ApiErrorHandler } from '../../utils/api-error-handler'
import type { RandomRecipeOptions } from '../../utils/random-recipe'

export default defineEventHandler(async (event): Promise<any> => {
  const query = getQuery(event)
  
  // Parse query parameters
  const options: RandomRecipeOptions = {
    count: parseInt(query.count as string) || 6,
    cuisine: query.cuisine as string,
    dietary: query.dietary as string,
    ensureVariety: query.ensureVariety === 'true'
  }

  // Validate count parameter
  if (options.count && (options.count < 1 || options.count > 12)) {
    throw createError({
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
    const currentQuota = QuotaService.getCurrentQuotaInfo()
    if (currentQuota && QuotaService.shouldRequireConfirmation(currentQuota)) {
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
      throw createError({
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
      // Update quota monitor with exceeded status
      const exceededQuotaInfo = await QuotaService.updateQuotaExceeded()
      throw createError({
        statusCode: 402,
        statusMessage: 'Daily Quota Exceeded',
        data: {
          errorType: 'QUOTA_EXCEEDED',
          message: 'Daily API quota has been reached. Please try again tomorrow.',
          quotaInfo: exceededQuotaInfo
        }
      })
    }
    
    // Generic error handling
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get random recipes',
      data: {
        errorType: 'GENERIC_ERROR',
        message: 'An unexpected error occurred while selecting random recipes. Please try again.'
      }
    })
  }
})
