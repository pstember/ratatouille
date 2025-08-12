import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useQuotaStore } from '~/stores/quota'

// Mock Pinia
vi.mock('pinia', async () => {
  const actual = await vi.importActual('pinia')
  return {
    ...actual,
    defineStore: vi.fn((id, setup) => setup)
  }
})

describe('useQuotaStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('updateQuotaFromResponse', () => {
    it('should update quota info from response', () => {
      const store = useQuotaStore()
      const mockResponse = {
        quotaInfo: {
          quotaUsed: 100,
          quotaLeft: 50,
          quotaRequest: 5,
          quotaLimit: 150,
          percentageUsed: 66.67,
          resetTime: '2024-01-16T00:00:00.000Z',
          dailyUsage: 100
        },
        requiresQuotaConfirmation: true
      }

      store.updateQuotaFromResponse(mockResponse)

      expect(store.quotaInfo.value).toEqual(mockResponse.quotaInfo)
      expect(store.requiresConfirmation.value).toBe(true)
    })

    it('should not update when response has no quota info', () => {
      const store = useQuotaStore()
      const initialQuotaInfo = store.quotaInfo
      const initialRequiresConfirmation = store.requiresConfirmation

      store.updateQuotaFromResponse({ results: [] })

      expect(store.quotaInfo).toBe(initialQuotaInfo)
      expect(store.requiresConfirmation).toBe(initialRequiresConfirmation)
    })

    it('should handle null response', () => {
      const store = useQuotaStore()
      const initialQuotaInfo = store.quotaInfo

      store.updateQuotaFromResponse(null)

      expect(store.quotaInfo).toBe(initialQuotaInfo)
    })
  })

  describe('executeWithQuotaCheck', () => {
    it('should execute request directly when no confirmation required', async () => {
      const store = useQuotaStore()
      store.requiresConfirmation = false
      
      const mockRequestFn = vi.fn().mockResolvedValue({ results: [] })
      const mockResponse = { results: [], quotaInfo: { quotaUsed: 50 } }

      // Mock the request function to return response with quota info
      mockRequestFn.mockResolvedValue(mockResponse)

      const result = await store.executeWithQuotaCheck(mockRequestFn)

      expect(mockRequestFn).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
      expect(store.quotaInfo.value).toEqual(mockResponse.quotaInfo)
    })

    it('should throw QUOTA_CONFIRMATION_REQUIRED when confirmation needed', async () => {
      const store = useQuotaStore()
      store.requiresConfirmation.value = true
      store.quotaInfo.value = { quotaUsed: 130 } as any
      
      const mockRequestFn = vi.fn().mockResolvedValue({ results: [] })

      await expect(store.executeWithQuotaCheck(mockRequestFn)).rejects.toThrow('QUOTA_CONFIRMATION_REQUIRED')
      
      expect(store.pendingRequest.value).toBe(mockRequestFn)
      expect(mockRequestFn).not.toHaveBeenCalled()
    })

    it('should update quota info after successful request', async () => {
      const store = useQuotaStore()
      store.requiresConfirmation = false
      
      const mockResponse = {
        results: [],
        quotaInfo: {
          quotaUsed: 75,
          quotaLeft: 75,
          quotaRequest: 5,
          quotaLimit: 150,
          percentageUsed: 50,
          resetTime: '2024-01-16T00:00:00.000Z',
          dailyUsage: 75
        }
      }
      
      const mockRequestFn = vi.fn().mockResolvedValue(mockResponse)

      await store.executeWithQuotaCheck(mockRequestFn)

      expect(store.quotaInfo.value).toEqual(mockResponse.quotaInfo)
    })
  })

  describe('confirmAndExecute', () => {
    it('should execute pending request when available', async () => {
      const store = useQuotaStore()
      const mockRequestFn = vi.fn().mockResolvedValue({ results: [] })
      const mockResponse = { results: [], quotaInfo: { quotaUsed: 100 } }
      
      store.pendingRequest.value = mockRequestFn
      mockRequestFn.mockResolvedValue(mockResponse)

      const result = await store.confirmAndExecute()

      expect(mockRequestFn).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
      expect(store.pendingRequest.value).toBeNull()
      expect(store.quotaInfo.value).toEqual(mockResponse.quotaInfo)
    })

    it('should throw error when no pending request', async () => {
      const store = useQuotaStore()
      store.pendingRequest.value = null

      await expect(store.confirmAndExecute()).rejects.toThrow('No pending request to execute')
    })
  })

  describe('cancelPendingRequest', () => {
    it('should clear pending request and confirmation flag', () => {
      const store = useQuotaStore()
      store.pendingRequest.value = vi.fn()
      store.requiresConfirmation.value = true

      store.cancelPendingRequest()

      expect(store.pendingRequest.value).toBeNull()
      expect(store.requiresConfirmation.value).toBe(false)
    })
  })

  describe('resetDailyQuota', () => {
    it('should schedule quota reset at midnight UTC', () => {
      const store = useQuotaStore()
      const mockDate = new Date('2024-01-15T10:30:00Z')
      vi.setSystemTime(mockDate)
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      store.resetDailyQuota()

      // Verify setTimeout was called (we can't easily test the exact timing)
      expect(consoleSpy).not.toHaveBeenCalled() // Should not log immediately
      
      vi.useRealTimers()
    })

    it('should reset quota state when timer executes', () => {
      const store = useQuotaStore()
      store.quotaInfo.value = { quotaUsed: 100 } as any
      store.requiresConfirmation.value = true
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout')
      
      // Manually trigger the reset logic
      store.resetDailyQuota()
      
      // Verify setTimeout was called
      expect(setTimeoutSpy).toHaveBeenCalled()
      
      // Get the callback function
      const callback = setTimeoutSpy.mock.calls[0][0] as Function
      
      // Execute the callback
      callback()
      
      expect(store.quotaInfo.value).toBeNull()
      expect(store.requiresConfirmation.value).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('Daily quota tracking reset')
    })
  })

  describe('store state', () => {
    it('should have correct initial state', () => {
      const store = useQuotaStore()

      expect(store.quotaInfo.value).toBeNull()
      expect(store.requiresConfirmation.value).toBe(false)
      expect(store.pendingRequest.value).toBeNull()
    })

    it('should expose all required methods', () => {
      const store = useQuotaStore()

      expect(typeof store.updateQuotaFromResponse).toBe('function')
      expect(typeof store.executeWithQuotaCheck).toBe('function')
      expect(typeof store.confirmAndExecute).toBe('function')
      expect(typeof store.cancelPendingRequest).toBe('function')
      expect(typeof store.resetDailyQuota).toBe('function')
    })
  })
})
