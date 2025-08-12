import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SpoonacularRecipeService } from '~/server/services/spoonacular-recipe-service'
import { ComprehensiveCacheManager } from '~/server/utils/comprehensive-cache-manager'
import { SpoonacularQuotaExceededError } from '~/server/utils/spoonacular-error-handler'

// Mock the cache manager
vi.mock('~/server/utils/comprehensive-cache-manager')
const MockCacheManager = vi.mocked(ComprehensiveCacheManager)

// Mock the Spoonacular API utilities
vi.mock('~/server/utils/spoonacular-recipe-info', () => ({
  getRecipeInformation: vi.fn(),
  getRecipeEquipment: vi.fn(),
  getRecipePriceBreakdown: vi.fn(),
  getRecipeWinePairing: vi.fn()
}))

vi.mock('~/server/utils/spoonacular-recipes', () => ({
  searchRecipes: vi.fn()
}))

vi.mock('~/server/utils/spoonacular-random', () => ({
  getRandomRecipes: vi.fn()
}))

describe('SpoonacularRecipeService', () => {
  let service: SpoonacularRecipeService
  let mockCacheManager: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockCacheManager = {
      getCachedCompleteRecipeData: vi.fn(),
      cacheCompleteRecipeData: vi.fn(),
      searchOfflineRecipes: vi.fn(),
      getOfflineRecipeCount: vi.fn(),
      getOfflineStorageSize: vi.fn()
    }
    
    MockCacheManager.mockImplementation(() => mockCacheManager)
    service = new SpoonacularRecipeService()
  })

  describe('getCompleteRecipe', () => {
    it('should return cached data when available', async () => {
      const mockCachedData = {
        offlineData: {
          recipe: { id: 123, title: 'Test Recipe' },
          equipment: [],
          priceBreakdown: null,
          winePairing: null
        }
      }
      
      mockCacheManager.getCachedCompleteRecipeData.mockResolvedValue(mockCachedData)
      
      const result = await service.getCompleteRecipe(123)
      
      expect(result.cached).toBe(true)
      expect(result.offline).toBe(false)
      expect(result.source).toBe('cache')
      expect(mockCacheManager.getCachedCompleteRecipeData).toHaveBeenCalledWith(123)
    })

    it('should fetch from API when cache is empty', async () => {
      const { getRecipeInformation, getRecipeEquipment, getRecipePriceBreakdown, getRecipeWinePairing } = await import('~/server/utils/spoonacular-recipe-info')
      
      mockCacheManager.getCachedCompleteRecipeData.mockResolvedValue(null)
      
      const mockRecipe = { id: 123, title: 'Test Recipe' }
      const mockEquipment = { equipment: [] }
      const mockPriceBreakdown = null
      const mockWinePairing = null
      
      vi.mocked(getRecipeInformation).mockResolvedValue(mockRecipe)
      vi.mocked(getRecipeEquipment).mockResolvedValue(mockEquipment)
      vi.mocked(getRecipePriceBreakdown).mockResolvedValue(mockPriceBreakdown)
      vi.mocked(getRecipeWinePairing).mockResolvedValue(mockWinePairing)
      
      const result = await service.getCompleteRecipe(123)
      
      expect(result.cached).toBe(false)
      expect(result.offline).toBe(false)
      expect(result.source).toBe('spoonacular')
      expect(mockCacheManager.cacheCompleteRecipeData).toHaveBeenCalledWith(
        123,
        mockRecipe,
        mockEquipment,
        mockPriceBreakdown,
        mockWinePairing
      )
    })

    it('should serve from cache when API fails', async () => {
      const { getRecipeInformation } = await import('~/server/utils/spoonacular-recipe-info')
      
      mockCacheManager.getCachedCompleteRecipeData
        .mockResolvedValueOnce(null) // First call (no cache)
        .mockResolvedValueOnce({ // Second call (fallback cache)
          offlineData: {
            recipe: { id: 123, title: 'Test Recipe' },
            equipment: [],
            priceBreakdown: null,
            winePairing: null
          }
        })
      
      vi.mocked(getRecipeInformation).mockRejectedValue(new Error('API Error'))
      
      const result = await service.getCompleteRecipe(123)
      
      expect(result.cached).toBe(true)
      expect(result.offline).toBe(true)
      expect(result.source).toBe('cache')
    })

    it('should force refresh when requested', async () => {
      const { getRecipeInformation, getRecipeEquipment, getRecipePriceBreakdown, getRecipeWinePairing } = await import('~/server/utils/spoonacular-recipe-info')
      
      const mockCachedData = {
        offlineData: {
          recipe: { id: 123, title: 'Cached Recipe' },
          equipment: [],
          priceBreakdown: null,
          winePairing: null
        }
      }
      
      mockCacheManager.getCachedCompleteRecipeData.mockResolvedValue(mockCachedData)
      
      const mockRecipe = { id: 123, title: 'Fresh Recipe' }
      const mockEquipment = { equipment: [] }
      const mockPriceBreakdown = null
      const mockWinePairing = null
      
      vi.mocked(getRecipeInformation).mockResolvedValue(mockRecipe)
      vi.mocked(getRecipeEquipment).mockResolvedValue(mockEquipment)
      vi.mocked(getRecipePriceBreakdown).mockResolvedValue(mockPriceBreakdown)
      vi.mocked(getRecipeWinePairing).mockResolvedValue(mockWinePairing)
      
      const result = await service.getCompleteRecipe(123, true)
      
      expect(result.cached).toBe(false)
      expect(result.source).toBe('spoonacular')
      expect(mockCacheManager.cacheCompleteRecipeData).toHaveBeenCalled()
    })
  })

  describe('searchRecipesOffline', () => {
    it('should search through cached recipes', async () => {
      const mockCachedResults = [
        {
          offlineData: {
            recipe: { id: 123, title: 'Test Recipe' },
            equipment: [],
            priceBreakdown: null,
            winePairing: null
          }
        }
      ]
      
      mockCacheManager.searchOfflineRecipes.mockResolvedValue(mockCachedResults)
      
      const results = await service.searchRecipesOffline('test')
      
      expect(results).toHaveLength(1)
      expect(mockCacheManager.searchOfflineRecipes).toHaveBeenCalledWith('test')
    })
  })

  describe('offline metrics', () => {
    it('should get offline recipe count', async () => {
      mockCacheManager.getOfflineRecipeCount.mockResolvedValue(42)
      
      const count = await service.getOfflineRecipeCount()
      
      expect(count).toBe(42)
      expect(mockCacheManager.getOfflineRecipeCount).toHaveBeenCalled()
    })

    it('should get offline storage size', async () => {
      mockCacheManager.getOfflineStorageSize.mockResolvedValue(1024)
      
      const size = await service.getOfflineStorageSize()
      
      expect(size).toBe(1024)
      expect(mockCacheManager.getOfflineStorageSize).toHaveBeenCalled()
    })
  })
})
