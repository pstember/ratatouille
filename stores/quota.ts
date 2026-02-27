import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { QuotaInfo } from '~/types/recipe'

export const useQuotaStore = defineStore('quota', () => {
  const quotaInfo = ref<QuotaInfo | null>(null)
  const requiresConfirmation = ref(false)
  const pendingRequest = ref<(() => Promise<any>) | null>(null)
  
  // Update quota info from any API response
  function updateQuotaFromResponse(response: any) {
    if (response && response.quotaInfo) {
      quotaInfo.value = response.quotaInfo
      requiresConfirmation.value = response.requiresQuotaConfirmation || false
    }
  }
  
  // Execute request and extract quota info from response
  async function executeWithQuotaCheck<T>(requestFn: () => Promise<T>): Promise<T> {
    // Check if we need confirmation before making the request
    if (requiresConfirmation.value && quotaInfo.value) {
      // Store the pending request
      pendingRequest.value = requestFn
      // Return a special response that triggers the confirmation modal
      throw new Error('QUOTA_CONFIRMATION_REQUIRED')
    }
    
    // Execute the request and extract quota info from response
    const response = await requestFn()
    updateQuotaFromResponse(response)
    
    return response
  }
  
  async function confirmAndExecute(): Promise<any> {
    if (!pendingRequest.value) {
      throw new Error('No pending request to execute')
    }
    
    const requestFn = pendingRequest.value
    pendingRequest.value = null
    
    // Add confirmation flag to the request
    const response = await requestFn()
    updateQuotaFromResponse(response)
    
    return response
  }
  
  function cancelPendingRequest() {
    pendingRequest.value = null
    requiresConfirmation.value = false
  }
  
  // Load initial quota information
  async function loadQuotaInfo() {
    try {
      const response = await $fetch('/api/quota')
      if (response && response.quotaInfo) {
        quotaInfo.value = response.quotaInfo
        requiresConfirmation.value = false
      }
    } catch (error) {
      // Don't throw error, just log it - quota info is not critical for app functionality
    }
  }
  
  // Reset quota tracking at midnight UTC
  function resetDailyQuota() {
    const now = new Date()
    const utcMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    utcMidnight.setUTCHours(0, 0, 0, 0)
    
    const timeUntilReset = utcMidnight.getTime() - now.getTime()
    
    // Schedule reset at midnight UTC
    setTimeout(() => {
      quotaInfo.value = null
      requiresConfirmation.value = false
    }, timeUntilReset)
  }
  
  return {
    quotaInfo,
    requiresConfirmation,
    pendingRequest,
    updateQuotaFromResponse,
    executeWithQuotaCheck,
    confirmAndExecute,
    cancelPendingRequest,
    loadQuotaInfo,
    resetDailyQuota
  }
})
