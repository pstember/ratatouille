import { describe, it, expect } from 'vitest'
import { ApiErrorHandler } from '~/server/utils/api-error-handler'

describe('ApiErrorHandler', () => {
  describe('isRateLimitError', () => {
    it('should detect 429 status code as rate limit error', () => {
      const error = { statusCode: 429 }
      const result = ApiErrorHandler.isRateLimitError(error)
      expect(result).toBe(true)
    })

    it('should detect rate limit error from message', () => {
      const error = { message: 'rate limit exceeded' }
      const result = ApiErrorHandler.isRateLimitError(error)
      expect(result).toBe(true)
    })

    it('should detect quota exceeded error from message', () => {
      const error = { message: 'quota exceeded' }
      const result = ApiErrorHandler.isRateLimitError(error)
      expect(result).toBe(true)
    })

    it('should detect too many requests error from message', () => {
      const error = { message: 'too many requests' }
      const result = ApiErrorHandler.isRateLimitError(error)
      expect(result).toBe(true)
    })

    it('should return false for non-rate limit errors', () => {
      const error = { statusCode: 500, message: 'internal server error' }
      const result = ApiErrorHandler.isRateLimitError(error)
      expect(result).toBe(false)
    })
  })

  describe('isQuotaExceededError', () => {
    it('should detect 402 status code as quota exceeded error', () => {
      const error = { statusCode: 402 }
      const result = ApiErrorHandler.isQuotaExceededError(error)
      expect(result).toBe(true)
    })

    it('should detect quota exceeded error from message', () => {
      const error = { message: 'quota exceeded' }
      const result = ApiErrorHandler.isQuotaExceededError(error)
      expect(result).toBe(true)
    })

    it('should detect daily limit error from message', () => {
      const error = { message: 'daily limit' }
      const result = ApiErrorHandler.isQuotaExceededError(error)
      expect(result).toBe(true)
    })

    it('should return false for non-quota exceeded errors', () => {
      const error = { statusCode: 500, message: 'internal server error' }
      const result = ApiErrorHandler.isQuotaExceededError(error)
      expect(result).toBe(false)
    })
  })

  describe('createQuotaWarningResponse', () => {
    it('should create quota warning response with correct structure', () => {
      const quotaInfo = {
        quotaUsed: 130,
        quotaLeft: 20,
        quotaRequest: 5,
        quotaLimit: 150,
        percentageUsed: 86.67,
        resetTime: '2024-01-16T00:00:00.000Z',
        dailyUsage: 130
      }

      const result = ApiErrorHandler.createQuotaWarningResponse(quotaInfo)

      expect(result).toEqual({
        statusCode: 200,
        statusMessage: 'Quota Warning',
        message: expect.stringContaining('86.7%'),
        details: {
          errorType: 'QUOTA_WARNING',
          quotaInfo,
          requiresConfirmation: true
        }
      })
    })

    it('should include quota information in warning message', () => {
      const quotaInfo = {
        quotaUsed: 140,
        quotaLeft: 10,
        quotaRequest: 5,
        quotaLimit: 150,
        percentageUsed: 93.33,
        resetTime: '2024-01-16T00:00:00.000Z',
        dailyUsage: 140
      }

      const result = ApiErrorHandler.createQuotaWarningResponse(quotaInfo)

      expect(result.message).toContain('93.3%')
      expect(result.message).toContain('10 requests remaining')
      expect(result.message).toContain('Do you want to continue?')
    })
  })

  describe('createRateLimitResponse', () => {
    it('should create rate limit response with correct structure', () => {
      const result = ApiErrorHandler.createRateLimitResponse()

      expect(result).toEqual({
        statusCode: 429,
        statusMessage: 'Rate Limit Exceeded',
        message: 'API rate limit reached. Please try again later or check your daily quota.',
        details: {
          errorType: 'RATE_LIMIT_EXCEEDED',
          retryAfter: 60
        }
      })
    })
  })

  describe('createQuotaExceededResponse', () => {
    it('should create quota exceeded response with correct structure', () => {
      const result = ApiErrorHandler.createQuotaExceededResponse()

      expect(result).toEqual({
        statusCode: 402,
        statusMessage: 'Daily Quota Exceeded',
        message: 'Daily API quota has been reached. Please try again tomorrow.',
        details: {
          errorType: 'QUOTA_EXCEEDED',
          resetTime: 'midnight UTC'
        }
      })
    })
  })
})
