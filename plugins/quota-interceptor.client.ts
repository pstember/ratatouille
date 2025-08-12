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
      console.debug('Could not parse response for quota info:', error)
    }
    
    return response
  }

  // Also intercept $fetch calls
  const original$fetch = globalThis.$fetch
  if (original$fetch) {
    globalThis.$fetch = async function(input: any, options?: any) {
      try {
        const response = await original$fetch(input, options)
        
        // Update quota information if present in the response
        if (response && response.quotaInfo) {
          quotaStore.updateQuotaFromResponse(response)
        }
        
        return response
      } catch (error: any) {
        // Handle error responses and extract quota information
        if (error.data && error.data.quotaInfo) {
          quotaStore.updateQuotaFromResponse({ quotaInfo: error.data.quotaInfo })
        }
        
        // Re-throw the error
        throw error
      }
    }
  }
})
