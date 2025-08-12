import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RandomRecipeService } from '~/server/utils/random-recipe'

// Mock dependencies
vi.mock('~/server/utils/cache', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    generateKey: vi.fn((prefix, params) => `${prefix}_${JSON.stringify(params)}`)
  }
}))

vi.mock('~/server/utils/quota-monitor', () => ({
  QuotaMonitor: {
    getCurrentQuotaInfo: vi.fn(),
    shouldRequireConfirmation: vi.fn(),
    checkQuota: vi.fn()
  }
}))

vi.mock('~/server/database/client', () => ({
  prisma: {
    recipe: {
      count: vi.fn(),
      findMany: vi.fn()
    }
  }
}))

vi.mock('~/server/utils/recipe-transformer', () => ({
  transformRecipe: vi.fn((recipe) => recipe)
}))

describe('RandomRecipeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRandomRecipes', () => {
    it('should return cached results when available', async () => {
      const mockCache = {
        recipes: [{ id: 1, title: 'Cached Recipe' }],
        totalAvailable: 1,
        source: 'cache' as const,
        cached: false
      }

      const { cacheService } = await import('~/server/utils/cache')
      vi.mocked(cacheService.get).mockResolvedValue(mockCache)

      const result = await RandomRecipeService.getRandomRecipes()

      expect(result).toEqual({
        ...mockCache,
        cached: true
      })
    })

    it('should fall back to database when API fails', async () => {
      // Mock cache miss
      const { cacheService } = await import('~/server/utils/cache')
      vi.mocked(cacheService.get).mockResolvedValue(null)
      
      // Mock quota check
      const { QuotaMonitor } = await import('~/server/utils/quota-monitor')
      vi.mocked(QuotaMonitor.getCurrentQuotaInfo).mockReturnValue({
        quotaUsed: 50,
        quotaLeft: 50,
        quotaRequest: 1,
        quotaLimit: 100,
        percentageUsed: 50,
        resetTime: '2024-01-01T00:00:00Z',
        dailyUsage: 50
      })
      vi.mocked(QuotaMonitor.shouldRequireConfirmation).mockReturnValue(false)

      // Mock database response
      const mockDbRecipes = [{
        id: 1,
        externalId: 123,
        title: 'DB Recipe',
        image: null,
        servings: null,
        readyInMinutes: null,
        sourceUrl: null,
        sourceName: null,
        summary: null,
        instructions: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }]
      const { prisma } = await import('~/server/database/client')
      vi.mocked(prisma.recipe.count).mockResolvedValue(1)
      vi.mocked(prisma.recipe.findMany).mockResolvedValue(mockDbRecipes)

      const result = await RandomRecipeService.getRandomRecipes()

      expect(result.source).toBe('database')
      expect(result.recipes).toHaveLength(1)
    })

    it('should respect count parameter limits', async () => {
      const { cacheService } = await import('~/server/utils/cache')
      vi.mocked(cacheService.get).mockResolvedValue(null)
      
      const result = await RandomRecipeService.getRandomRecipes({ count: 20 })

      expect(result.recipes.length).toBeLessThanOrEqual(12) // MAX_COUNT
    })

    it('should use default count when not specified', async () => {
      const { cacheService } = await import('~/server/utils/cache')
      vi.mocked(cacheService.get).mockResolvedValue(null)
      
      const result = await RandomRecipeService.getRandomRecipes()

      expect(result.recipes.length).toBeLessThanOrEqual(6) // DEFAULT_COUNT
    })
  })

  describe('database random selection', () => {
    beforeEach(async () => {
      const { cacheService } = await import('~/server/utils/cache')
      vi.mocked(cacheService.get).mockResolvedValue(null)
      const { QuotaMonitor } = await import('~/server/utils/quota-monitor')
      vi.mocked(QuotaMonitor.getCurrentQuotaInfo).mockReturnValue(null)
    })

    it('should handle empty database gracefully', async () => {
      const { prisma } = await import('~/server/database/client')
      vi.mocked(prisma.recipe.count).mockResolvedValue(0)

      const result = await RandomRecipeService.getRandomRecipes()

      expect(result.recipes).toHaveLength(0)
      expect(result.totalAvailable).toBe(0)
    })

    it('should apply cuisine filters when specified', async () => {
      const { prisma } = await import('~/server/database/client')
      vi.mocked(prisma.recipe.count).mockResolvedValue(10)
      vi.mocked(prisma.recipe.findMany).mockResolvedValue([])

      await RandomRecipeService.getRandomRecipes({ cuisine: 'italian' })

      expect(prisma.recipe.count).toHaveBeenCalledWith({
        where: { cuisine: 'italian' }
      })
    })

    it('should ensure variety when requested and sufficient data available', async () => {
      const { prisma } = await import('~/server/database/client')
      vi.mocked(prisma.recipe.count).mockResolvedValue(20)
      
      // Mock distinct cuisines - these are just mock objects for testing
      const mockCuisineData = [
        { 
          id: 1, 
          externalId: 123, 
          title: 'Italian Recipe', 
          image: null,
          servings: null,
          readyInMinutes: null,
          sourceUrl: null,
          sourceName: null,
          summary: null,
          instructions: null,
          cuisine: 'italian', 
          createdAt: new Date(), 
          updatedAt: new Date() 
        },
        { 
          id: 2, 
          externalId: 456, 
          title: 'French Recipe', 
          image: null,
          servings: null,
          readyInMinutes: null,
          sourceUrl: null,
          sourceName: null,
          summary: null,
          instructions: null,
          cuisine: 'french', 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }
      ]
      vi.mocked(prisma.recipe.findMany)
        .mockResolvedValueOnce(mockCuisineData) // distinct cuisines
        .mockResolvedValue([]) // recipe data

      await RandomRecipeService.getRandomRecipes({ ensureVariety: true })

      // Should call findMany multiple times for variety
      expect(prisma.recipe.findMany).toHaveBeenCalledTimes(3)
    })
  })

  describe('shuffle algorithm', () => {
    it('should shuffle array without losing elements', () => {
      const original = [1, 2, 3, 4, 5]
      const shuffled = RandomRecipeService['shuffleArray'](original)

      expect(shuffled).toHaveLength(original.length)
      expect(shuffled.sort()).toEqual(original.sort())
    })

    it('should handle empty arrays', () => {
      const result = RandomRecipeService['shuffleArray']([])
      expect(result).toEqual([])
    })

    it('should handle single element arrays', () => {
      const result = RandomRecipeService['shuffleArray']([1])
      expect(result).toEqual([1])
    })
  })

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const { cacheService } = await import('~/server/utils/cache')
      vi.mocked(cacheService.get).mockResolvedValue(null)
      const { QuotaMonitor } = await import('~/server/utils/quota-monitor')
      vi.mocked(QuotaMonitor.getCurrentQuotaInfo).mockReturnValue(null)

      // Mock database to work
      const { prisma } = await import('~/server/database/client')
      vi.mocked(prisma.recipe.count).mockResolvedValue(5)
      vi.mocked(prisma.recipe.findMany).mockResolvedValue([])

      const result = await RandomRecipeService.getRandomRecipes()

      // Should fall back to database
      expect(result.source).toBe('database')
    })
  })
})
