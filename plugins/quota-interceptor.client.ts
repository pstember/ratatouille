export default defineNuxtPlugin(() => {
  const quotaStore = useQuotaStore()

  // Intercept all API responses to update quota information
  const originalFetch = globalThis.fetch
  globalThis.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    const response = await originalFetch(input, init)
    
    // Clone the response so we can read it multiple times
    const clonedResponse = response.clone()
    
    try {
      // Check if this is a JSON response
      const contentType = clonedResponse.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await clonedResponse.json()
        
        // Update quota information if present in the response (success or error)
        if (data && data.quotaInfo) {
          quotaStore.updateQuotaFromResponse(data)
        }
        
        // Also check for quota info in error responses
        if (data && data.data && data.data.quotaInfo) {
          quotaStore.updateQuotaFromResponse({ quotaInfo: data.data.quotaInfo })
        }
      }
    } catch (error) {
      // Ignore errors when trying to parse response
    }
    
    return response
  }

  // Also intercept $fetch calls
  const original$fetch = globalThis.$fetch
  if (original$fetch) {
    globalThis.$fetch = async function<T = unknown>(input: string | Request | URL, options?: RequestInit): Promise<T> {
      try {
        const response = await original$fetch<T>(input, options)

        // Update quota information if present in the response
        if (response && response.quotaInfo) {
          quotaStore.updateQuotaFromResponse(response)
        }

        return response
      } catch (error: unknown) {
        // Handle error responses and extract quota information
        const err = error as { data?: { quotaInfo?: unknown } }
        if (err.data && err.data.quotaInfo) {
          quotaStore.updateQuotaFromResponse({ quotaInfo: err.data.quotaInfo })
        }

        // Re-throw the error
        throw error
      }
    }
  }
})
