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
