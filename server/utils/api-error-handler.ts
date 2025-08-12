import type { QuotaInfo } from './quota-monitor'

export interface ApiError {
  statusCode: number
  statusMessage: string
  message?: string
  details?: any
}

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
      message: `You have used ${quotaInfo.percentageUsed.toFixed(1)}% of your daily API quota (${quotaInfo.quotaLeft} requests remaining). Your quota resets in ${this.getHoursUntilReset(quotaInfo.resetTime)} hours. Do you want to continue?`,
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

  private static getHoursUntilReset(resetTime: string): number {
    const now = new Date()
    const reset = new Date(resetTime)
    const diffMs = reset.getTime() - now.getTime()
    return Math.ceil(diffMs / (1000 * 60 * 60))
  }
}
