import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { CacheService } from '~/server/utils/cache'

// Mock Prisma using vi.hoisted to avoid initialization issues
const mockPrisma = vi.hoisted(() => ({
  cache: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn()
  }
}))

vi.mock('~/server/database/client', () => ({
  prisma: mockPrisma
}))

describe('CacheService', () => {
  let cacheService: CacheService

  beforeEach(() => {
    vi.clearAllMocks()
    cacheService = new CacheService()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('get method', () => {
    it('returns cached value when valid and not expired', async () => {
      const mockCacheEntry = {
        key: 'test:key',
        value: JSON.stringify({ data: 'test' }),
        expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
      }

      mockPrisma.cache.findUnique.mockResolvedValue(mockCacheEntry)

      const result = await cacheService.get('test:key')

      expect(result).toEqual({ data: 'test' })
      expect(mockPrisma.cache.findUnique).toHaveBeenCalledWith({
        where: { key: 'test:key' }
      })
    })

    it('returns null when cache entry does not exist', async () => {
      mockPrisma.cache.findUnique.mockResolvedValue(null)

      const result = await cacheService.get('nonexistent:key')

      expect(result).toBeNull()
    })

    it('returns null and deletes expired cache entry', async () => {
      const expiredCacheEntry = {
        key: 'test:key',
        value: JSON.stringify({ data: 'test' }),
        expiresAt: new Date(Date.now() - 3600000) // 1 hour ago
      }

      mockPrisma.cache.findUnique.mockResolvedValue(expiredCacheEntry)
      mockPrisma.cache.delete.mockResolvedValue(undefined)

      const result = await cacheService.get('test:key')

      expect(result).toBeNull()
      expect(mockPrisma.cache.delete).toHaveBeenCalledWith({
        where: { key: 'test:key' }
      })
    })

    it('returns null when cache get fails', async () => {
      mockPrisma.cache.findUnique.mockRejectedValue(new Error('Database error'))

      const result = await cacheService.get('test:key')

      expect(result).toBeNull()
    })

    it('handles invalid JSON in cache value', async () => {
      const invalidCacheEntry = {
        key: 'test:key',
        value: 'invalid json',
        expiresAt: new Date(Date.now() + 3600000)
      }

      mockPrisma.cache.findUnique.mockResolvedValue(invalidCacheEntry)

      const result = await cacheService.get('test:key')

      expect(result).toBeNull()
    })
  })

  describe('set method', () => {
    it('creates new cache entry when key does not exist', async () => {
      const testData = { data: 'test value' }
      mockPrisma.cache.upsert.mockResolvedValue(undefined)

      await cacheService.set('new:key', testData)

      expect(mockPrisma.cache.upsert).toHaveBeenCalledWith({
        where: { key: 'new:key' },
        update: {
          value: JSON.stringify(testData),
          type: 'general',
          recipeId: undefined,
          expiresAt: expect.any(Date)
        },
        create: {
          key: 'new:key',
          value: JSON.stringify(testData),
          type: 'general',
          recipeId: undefined,
          expiresAt: expect.any(Date)
        }
      })
    })

    it('updates existing cache entry when key exists', async () => {
      const updatedData = { data: 'updated value' }
      mockPrisma.cache.upsert.mockResolvedValue(undefined)

      await cacheService.set('existing:key', updatedData)

      expect(mockPrisma.cache.upsert).toHaveBeenCalledWith({
        where: { key: 'existing:key' },
        update: {
          value: JSON.stringify(updatedData),
          type: 'general',
          recipeId: undefined,
          expiresAt: expect.any(Date)
        },
        create: {
          key: 'existing:key',
          value: JSON.stringify(updatedData),
          type: 'general',
          recipeId: undefined,
          expiresAt: expect.any(Date)
        }
      })
    })

    it('uses custom TTL when provided', async () => {
      const testData = { data: 'test' }
      const customTTL = 3600 // 1 hour
      mockPrisma.cache.upsert.mockResolvedValue(undefined)

      await cacheService.set('test:key', testData, { ttl: customTTL })

      const upsertCall = mockPrisma.cache.upsert.mock.calls[0]?.[0]
      expect(upsertCall).toBeDefined()
      const expectedExpiresAt = new Date(Date.now() + customTTL * 1000)
      
      // Allow for small time difference due to execution time
      expect(upsertCall!.update.expiresAt.getTime()).toBeCloseTo(expectedExpiresAt.getTime(), -2)
      expect(upsertCall!.create.expiresAt.getTime()).toBeCloseTo(expectedExpiresAt.getTime(), -2)
    })

    it('uses default TTL when not provided', async () => {
      const testData = { data: 'test' }
      mockPrisma.cache.upsert.mockResolvedValue(undefined)

      await cacheService.set('test:key', testData)

      const upsertCall = mockPrisma.cache.upsert.mock.calls[0]?.[0]
      expect(upsertCall).toBeDefined()
      const expectedExpiresAt = new Date(Date.now() + 604800 * 1000) // 7 days
      
      // Allow for small time difference due to execution time
      expect(upsertCall!.update.expiresAt.getTime()).toBeCloseTo(expectedExpiresAt.getTime(), -2)
      expect(upsertCall!.create.expiresAt.getTime()).toBeCloseTo(expectedExpiresAt.getTime(), -2)
    })

    it('sets custom cache type when provided', async () => {
      const testData = { data: 'test' }
      mockPrisma.cache.upsert.mockResolvedValue(undefined)

      await cacheService.set('test:key', testData, { type: 'recipe' })

      expect(mockPrisma.cache.upsert).toHaveBeenCalledWith({
        where: { key: 'test:key' },
        update: {
          value: JSON.stringify(testData),
          type: 'recipe',
          recipeId: undefined,
          expiresAt: expect.any(Date)
        },
        create: {
          key: 'test:key',
          value: JSON.stringify(testData),
          type: 'recipe',
          recipeId: undefined,
          expiresAt: expect.any(Date)
        }
      })
    })

    it('sets recipe ID when provided', async () => {
      const testData = { data: 'test' }
      const recipeId = 123
      mockPrisma.cache.upsert.mockResolvedValue(undefined)

      await cacheService.set('test:key', testData, { recipeId })

      expect(mockPrisma.cache.upsert).toHaveBeenCalledWith({
        where: { key: 'test:key' },
        update: {
          value: JSON.stringify(testData),
          type: 'general',
          recipeId: 123,
          expiresAt: expect.any(Date)
        },
        create: {
          key: 'test:key',
          value: JSON.stringify(testData),
          type: 'general',
          recipeId: 123,
          expiresAt: expect.any(Date)
        }
      })
    })

    it('handles complex data structures', async () => {
      const complexData = {
        recipes: [
          { id: 1, title: 'Recipe 1', ingredients: ['ingredient 1', 'ingredient 2'] },
          { id: 2, title: 'Recipe 2', nutrition: { calories: 300, protein: 15 } }
        ],
        metadata: {
          total: 2,
          timestamp: new Date().toISOString()
        }
      }
      mockPrisma.cache.upsert.mockResolvedValue(undefined)

      await cacheService.set('complex:key', complexData)

      expect(mockPrisma.cache.upsert).toHaveBeenCalledWith({
        where: { key: 'complex:key' },
        update: {
          value: JSON.stringify(complexData),
          type: 'general',
          recipeId: undefined,
          expiresAt: expect.any(Date)
        },
        create: {
          key: 'complex:key',
          value: JSON.stringify(complexData),
          type: 'general',
          recipeId: undefined,
          expiresAt: expect.any(Date)
        }
      })
    })

    it('handles cache set failure gracefully', async () => {
      const testData = { data: 'test' }
      mockPrisma.cache.upsert.mockRejectedValue(new Error('Database error'))

      // Should not throw error
      await expect(cacheService.set('test:key', testData)).resolves.toBeUndefined()
    })
  })

  describe('delete method', () => {
    it('deletes cache entry successfully', async () => {
      mockPrisma.cache.delete.mockResolvedValue(undefined)

      await cacheService.delete('test:key')

      expect(mockPrisma.cache.delete).toHaveBeenCalledWith({
        where: { key: 'test:key' }
      })
    })

    it('handles delete failure gracefully', async () => {
      mockPrisma.cache.delete.mockRejectedValue(new Error('Database error'))

      // Should not throw error
      await expect(cacheService.delete('test:key')).resolves.toBeUndefined()
    })
  })

  describe('clearExpired method', () => {
    it('deletes all expired cache entries', async () => {
      mockPrisma.cache.deleteMany.mockResolvedValue({ count: 5 })

      await cacheService.clearExpired()

      expect(mockPrisma.cache.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date)
          }
        }
      })
    })

    it('handles clear expired failure gracefully', async () => {
      mockPrisma.cache.deleteMany.mockRejectedValue(new Error('Database error'))

      // Should not throw error
      await expect(cacheService.clearExpired()).resolves.toBeUndefined()
    })
  })

  describe('generateKey method', () => {
    it('generates key with prefix only', () => {
      const key = cacheService.generateKey('test', {})
      expect(key).toBe('test:')
    })

    it('generates key with single parameter', () => {
      const key = cacheService.generateKey('recipe', { id: 123 })
      expect(key).toBe('recipe:id:123')
    })

    it('generates key with multiple parameters in sorted order', () => {
      const key = cacheService.generateKey('search', { 
        query: 'chicken', 
        offset: 0, 
        number: 12 
      })
      expect(key).toBe('search:number:12|offset:0|query:chicken')
    })

    it('handles parameters with special characters', () => {
      const key = cacheService.generateKey('search', { 
        query: 'chicken & pasta', 
        cuisine: 'italian' 
      })
      expect(key).toBe('search:cuisine:italian|query:chicken & pasta')
    })

    it('handles numeric parameters', () => {
      const key = cacheService.generateKey('pagination', { 
        page: 1, 
        limit: 20, 
        offset: 0 
      })
      expect(key).toBe('pagination:limit:20|offset:0|page:1')
    })

    it('handles boolean parameters', () => {
      const key = cacheService.generateKey('filter', { 
        vegetarian: true, 
        glutenFree: false 
      })
      expect(key).toBe('filter:glutenFree:false|vegetarian:true')
    })

    it('handles null and undefined parameters', () => {
      const key = cacheService.generateKey('test', { 
        param1: null, 
        param2: undefined, 
        param3: 'value' 
      })
      expect(key).toBe('test:param1:null|param2:undefined|param3:value')
    })

    it('handles nested objects in parameters', () => {
      const key = cacheService.generateKey('complex', { 
        filters: { type: 'main', difficulty: 'easy' },
        sort: 'name' 
      })
      expect(key).toBe('complex:filters:[object Object]|sort:name')
    })
  })

  describe('Edge Cases', () => {
    it('handles very long keys', () => {
      const longKey = 'a'.repeat(1000)
      const key = cacheService.generateKey(longKey, { param: 'value' })
      expect(key.length).toBeGreaterThan(1000)
    })

    it('handles empty string parameters', () => {
      const key = cacheService.generateKey('test', { 
        empty: '', 
        param: 'value' 
      })
      expect(key).toBe('test:empty:|param:value')
    })

    it('handles zero values', () => {
      const key = cacheService.generateKey('test', { 
        count: 0, 
        offset: 0 
      })
      expect(key).toBe('test:count:0|offset:0')
    })

    it('handles negative values', () => {
      const key = cacheService.generateKey('test', { 
        offset: -1, 
        limit: 10 
      })
      expect(key).toBe('test:limit:10|offset:-1')
    })

    it('handles floating point numbers', () => {
      const key = cacheService.generateKey('test', { 
        rating: 4.5, 
        price: 19.99 
      })
      expect(key).toBe('test:price:19.99|rating:4.5')
    })
  })

  describe('Integration Scenarios', () => {
    it('handles complete cache lifecycle', async () => {
      const testData = { data: 'test value' }
      
      // Set cache
      mockPrisma.cache.upsert.mockResolvedValue(undefined)
      await cacheService.set('lifecycle:key', testData)
      expect(mockPrisma.cache.upsert).toHaveBeenCalled()

      // Get cache
      const mockCacheEntry = {
        key: 'lifecycle:key',
        value: JSON.stringify(testData),
        expiresAt: new Date(Date.now() + 3600000)
      }
      mockPrisma.cache.findUnique.mockResolvedValue(mockCacheEntry)
      const retrieved = await cacheService.get('lifecycle:key')
      expect(retrieved).toEqual(testData)

      // Delete cache
      mockPrisma.cache.delete.mockResolvedValue(undefined)
      await cacheService.delete('lifecycle:key')
      expect(mockPrisma.cache.delete).toHaveBeenCalled()
    })

    it('handles cache with custom options', async () => {
      const recipeData = { id: 123, title: 'Test Recipe' }
      const options = { 
        ttl: 1800, // 30 minutes
        type: 'recipe', 
        recipeId: 123 
      }
      
      mockPrisma.cache.upsert.mockResolvedValue(undefined)
      await cacheService.set('recipe:123', recipeData, options)

      const upsertCall = mockPrisma.cache.upsert.mock.calls[0]?.[0]
      expect(upsertCall).toBeDefined()
      expect(upsertCall!.update.type).toBe('recipe')
      expect(upsertCall!.update.recipeId).toBe(123)
      
      const expectedExpiresAt = new Date(Date.now() + 1800 * 1000)
      expect(upsertCall!.update.expiresAt.getTime()).toBeCloseTo(expectedExpiresAt.getTime(), -2)
    })
  })
})
