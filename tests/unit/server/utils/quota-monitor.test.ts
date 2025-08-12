import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QuotaMonitor } from '~/server/utils/quota-monitor'

describe('QuotaMonitor', () => {
  beforeEach(() => {
    // Reset the static properties before each test
    // We need to mock the actual static properties, not just the getters
    vi.spyOn(QuotaMonitor as any, 'dailyQuotaUsage', 'get').mockReturnValue(new Map())
    vi.spyOn(QuotaMonitor as any, 'lastResetDate', 'get').mockReturnValue('')
    vi.spyOn(QuotaMonitor as any, 'currentQuotaInfo', 'get').mockReturnValue(null)
    
    // Mock the setters as well
    vi.spyOn(QuotaMonitor as any, 'lastResetDate', 'set').mockImplementation(() => {})
    vi.spyOn(QuotaMonitor as any, 'currentQuotaInfo', 'set').mockImplementation(() => {})
  })

  describe('getCurrentDateKey', () => {
    it('should return current date in YYYY-MM-DD format', () => {
      const mockDate = new Date('2024-01-15T10:30:00Z')
      vi.setSystemTime(mockDate)
      
      const result = QuotaMonitor.getCurrentDateKey()
      
      expect(result).toBe('2024-01-15')
      vi.useRealTimers()
    })
  })

  describe('resetDailyQuotaIfNeeded', () => {
    it('should reset quota tracking when date changes', () => {
      const mockDate = new Date('2024-01-15T10:30:00Z')
      vi.setSystemTime(mockDate)
      
      // Mock the static properties
      const mockDailyQuotaUsage = new Map([['2024-01-14', 50]])
      const mockLastResetDate = '2024-01-14'
      
      vi.spyOn(QuotaMonitor as any, 'dailyQuotaUsage', 'get').mockReturnValue(mockDailyQuotaUsage)
      vi.spyOn(QuotaMonitor as any, 'lastResetDate', 'get').mockReturnValue(mockLastResetDate)
      
      const clearSpy = vi.spyOn(mockDailyQuotaUsage, 'clear')
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      QuotaMonitor.resetDailyQuotaIfNeeded()
      
      expect(clearSpy).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('Daily quota reset for 2024-01-15')
      vi.useRealTimers()
    })

    it('should not reset quota tracking when date is the same', () => {
      const mockDate = new Date('2024-01-15T10:30:00Z')
      vi.setSystemTime(mockDate)
      
      const mockDailyQuotaUsage = new Map([['2024-01-15', 50]])
      const mockLastResetDate = '2024-01-15'
      
      vi.spyOn(QuotaMonitor as any, 'dailyQuotaUsage', 'get').mockReturnValue(mockDailyQuotaUsage)
      vi.spyOn(QuotaMonitor as any, 'lastResetDate', 'get').mockReturnValue(mockLastResetDate)
      
      const clearSpy = vi.spyOn(mockDailyQuotaUsage, 'clear')
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      QuotaMonitor.resetDailyQuotaIfNeeded()
      
      expect(clearSpy).not.toHaveBeenCalled()
      expect(consoleSpy).not.toHaveBeenCalled()
      vi.useRealTimers()
    })
  })

  describe('updateDailyQuotaUsage', () => {
    it('should update daily quota usage correctly', () => {
      const mockDate = new Date('2024-01-15T10:30:00Z')
      vi.setSystemTime(mockDate)
      
      const mockDailyQuotaUsage = new Map()
      vi.spyOn(QuotaMonitor as any, 'dailyQuotaUsage', 'get').mockReturnValue(mockDailyQuotaUsage)
      vi.spyOn(QuotaMonitor as any, 'lastResetDate', 'get').mockReturnValue('')
      
      QuotaMonitor.updateDailyQuotaUsage(10)
      
      expect(mockDailyQuotaUsage.get('2024-01-15')).toBe(10)
      vi.useRealTimers()
    })

    it('should accumulate quota usage for the same day', () => {
      const mockDate = new Date('2024-01-15T10:30:00Z')
      vi.setSystemTime(mockDate)
      
      const mockDailyQuotaUsage = new Map([['2024-01-15', 20]])
      vi.spyOn(QuotaMonitor as any, 'dailyQuotaUsage', 'get').mockReturnValue(mockDailyQuotaUsage)
      vi.spyOn(QuotaMonitor as any, 'lastResetDate', 'get').mockReturnValue('2024-01-15')
      
      QuotaMonitor.updateDailyQuotaUsage(15)
      
      expect(mockDailyQuotaUsage.get('2024-01-15')).toBe(35)
      vi.useRealTimers()
    })
  })

  describe('getDailyQuotaUsage', () => {
    it('should return current day quota usage', () => {
      const mockDate = new Date('2024-01-15T10:30:00Z')
      vi.setSystemTime(mockDate)
      
      const mockDailyQuotaUsage = new Map([['2024-01-15', 25]])
      vi.spyOn(QuotaMonitor as any, 'dailyQuotaUsage', 'get').mockReturnValue(mockDailyQuotaUsage)
      vi.spyOn(QuotaMonitor as any, 'lastResetDate', 'get').mockReturnValue('2024-01-15')
      
      const result = QuotaMonitor.getDailyQuotaUsage()
      
      expect(result).toBe(25)
      vi.useRealTimers()
    })

    it('should return 0 when no quota usage for current day', () => {
      const mockDate = new Date('2024-01-15T10:30:00Z')
      vi.setSystemTime(mockDate)
      
      const mockDailyQuotaUsage = new Map()
      vi.spyOn(QuotaMonitor as any, 'dailyQuotaUsage', 'get').mockReturnValue(mockDailyQuotaUsage)
      vi.spyOn(QuotaMonitor as any, 'lastResetDate', 'get').mockReturnValue('')
      
      const result = QuotaMonitor.getDailyQuotaUsage()
      
      expect(result).toBe(0)
      vi.useRealTimers()
    })
  })

  describe('extractQuotaFromResponse', () => {
    it('should extract quota info from valid response', () => {
      const mockResponse = {
        headers: {
          'x-api-quota-used': '100',
          'x-api-quota-left': '50',
          'x-api-quota-request': '5'
        }
      }
      
      const mockDate = new Date('2024-01-15T10:30:00Z')
      vi.setSystemTime(mockDate)
      
      const mockDailyQuotaUsage = new Map()
      vi.spyOn(QuotaMonitor as any, 'dailyQuotaUsage', 'get').mockReturnValue(mockDailyQuotaUsage)
      vi.spyOn(QuotaMonitor as any, 'lastResetDate', 'get').mockReturnValue('')
      
      const result = QuotaMonitor.extractQuotaFromResponse(mockResponse)
      
      expect(result).toEqual({
        quotaUsed: 100,
        quotaLeft: 50,
        quotaRequest: 5,
        quotaLimit: 150,
        percentageUsed: 66.66666666666666,
        resetTime: '2024-01-16T00:00:00.000Z',
        dailyUsage: 0, // Mocked daily usage returns 0
        hasQuota: true
      })
      vi.useRealTimers()
    })

    it('should return null for response without quota headers', () => {
      const mockResponse = {
        headers: {}
      }
      
      const result = QuotaMonitor.extractQuotaFromResponse(mockResponse)
      
      expect(result).toBeNull()
    })

    it('should return null for response with zero quota values', () => {
      const mockResponse = {
        headers: {
          'x-api-quota-used': '0',
          'x-api-quota-left': '0',
          'x-api-quota-request': '0'
        }
      }
      
      const result = QuotaMonitor.extractQuotaFromResponse(mockResponse)
      
      expect(result).toBeNull()
    })

    it('should return null for invalid response', () => {
      const result = QuotaMonitor.extractQuotaFromResponse(null)
      
      expect(result).toBeNull()
    })
  })

  describe('shouldRequireConfirmation', () => {
    it('should return true when quota usage is at or above 85%', () => {
      const quotaInfo = {
        quotaUsed: 130,
        quotaLeft: 20,
        quotaRequest: 5,
        quotaLimit: 150,
        percentageUsed: 86.67,
        resetTime: '2024-01-16T00:00:00.000Z',
        dailyUsage: 130
      }
      
      const result = QuotaMonitor.shouldRequireConfirmation(quotaInfo)
      
      expect(result).toBe(true)
    })

    it('should return false when quota usage is below 85%', () => {
      const quotaInfo = {
        quotaUsed: 100,
        quotaLeft: 50,
        quotaRequest: 5,
        quotaLimit: 150,
        percentageUsed: 66.67,
        resetTime: '2024-01-16T00:00:00.000Z',
        dailyUsage: 100
      }
      
      const result = QuotaMonitor.shouldRequireConfirmation(quotaInfo)
      
      expect(result).toBe(false)
    })
  })

  describe('getQuotaWarningMessage', () => {
    it('should return formatted warning message', () => {
      const quotaInfo = {
        quotaUsed: 130,
        quotaLeft: 20,
        quotaRequest: 5,
        quotaLimit: 150,
        percentageUsed: 86.67,
        resetTime: '2024-01-16T00:00:00.000Z',
        dailyUsage: 130
      }
      
      const mockDate = new Date('2024-01-15T10:30:00Z')
      vi.setSystemTime(mockDate)
      
      const result = QuotaMonitor.getQuotaWarningMessage(quotaInfo)
      
      expect(result).toContain('86.7%')
      expect(result).toContain('20 requests remaining')
      expect(result).toContain('hours') // Just check for "hours" since the exact number may vary
      expect(result).toContain('Do you want to continue?')
      vi.useRealTimers()
    })
  })
})
