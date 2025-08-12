import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCachedRecipes } from '~/server/utils/cache-fallback'

// Mock Prisma
vi.mock('~/server/database/client', () => ({
  prisma: {
    recipe: {
      findMany: vi.fn()
    }
  }
}))

describe('getCachedRecipes', () => {
  let mockPrisma: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockPrisma = await import('~/server/database/client')
  })

  it('should return cached recipes with correct structure', async () => {
    const mockRecipes = [
      {
        id: 1,
        title: 'Test Recipe 1',
        image: 'test1.jpg',
        servings: 4,
        readyInMinutes: 30,
        cuisine: 'italian',
        isNew: true,
        nutrition: {
          calories: 300,
          protein: 15,
          fat: 10,
          carbs: 40
        }
      },
      {
        id: 2,
        title: 'Test Recipe 2',
        image: 'test2.jpg',
        servings: 2,
        readyInMinutes: 20,
        cuisine: 'french',
        isNew: false,
        nutrition: {
          calories: 250,
          protein: 12,
          fat: 8,
          carbs: 35
        }
      }
    ]

    mockPrisma.prisma.recipe.findMany.mockResolvedValue(mockRecipes)

    const result = await getCachedRecipes(10)

    expect(mockPrisma.prisma.recipe.findMany).toHaveBeenCalledWith({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: { nutrition: true }
    })

    expect(result).toEqual([
      {
        id: 1,
        title: 'Test Recipe 1',
        image: 'test1.jpg',
        servings: 4,
        readyInMinutes: 30,
        cuisine: 'italian',
        nutrition: {
          calories: 300,
          protein: 15,
          fat: 10,
          carbs: 40
        },
        isNew: true,
        cached: true
      },
      {
        id: 2,
        title: 'Test Recipe 2',
        image: 'test2.jpg',
        servings: 2,
        readyInMinutes: 20,
        cuisine: 'french',
        nutrition: {
          calories: 250,
          protein: 12,
          fat: 8,
          carbs: 35
        },
        isNew: false,
        cached: true
      }
    ])
  })

  it('should use default limit of 20 when no limit provided', async () => {
    const mockRecipes = []
    mockPrisma.prisma.recipe.findMany.mockResolvedValue(mockRecipes)

    await getCachedRecipes()

    expect(mockPrisma.prisma.recipe.findMany).toHaveBeenCalledWith({
      take: 20,
      orderBy: { updatedAt: 'desc' },
      include: { nutrition: true }
    })
  })

  it('should handle recipes without nutrition data', async () => {
    const mockRecipes = [
      {
        id: 1,
        title: 'Test Recipe',
        image: 'test.jpg',
        servings: 4,
        readyInMinutes: 30,
        cuisine: 'italian',
        isNew: true,
        nutrition: null
      }
    ]

    mockPrisma.prisma.recipe.findMany.mockResolvedValue(mockRecipes)

    const result = await getCachedRecipes(5)

    expect(result).toEqual([
      {
        id: 1,
        title: 'Test Recipe',
        image: 'test.jpg',
        servings: 4,
        readyInMinutes: 30,
        cuisine: 'italian',
        nutrition: null,
        isNew: true,
        cached: true
      }
    ])
  })

  it('should handle database errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockPrisma.prisma.recipe.findMany.mockRejectedValue(new Error('Database error'))

    const result = await getCachedRecipes(10)

    expect(consoleSpy).toHaveBeenCalledWith('Cache fallback error:', expect.any(Error))
    expect(result).toEqual([])
  })

  it('should return empty array when no cached recipes found', async () => {
    mockPrisma.prisma.recipe.findMany.mockResolvedValue([])

    const result = await getCachedRecipes(5)

    expect(result).toEqual([])
  })

  it('should handle recipes with partial data', async () => {
    const mockRecipes = [
      {
        id: 1,
        title: 'Test Recipe',
        image: null,
        servings: null,
        readyInMinutes: null,
        cuisine: null,
        isNew: false,
        nutrition: {
          calories: 300,
          protein: null,
          fat: null,
          carbs: null
        }
      }
    ]

    mockPrisma.prisma.recipe.findMany.mockResolvedValue(mockRecipes)

    const result = await getCachedRecipes(5)

    expect(result).toEqual([
      {
        id: 1,
        title: 'Test Recipe',
        image: null,
        servings: null,
        readyInMinutes: null,
        cuisine: null,
        nutrition: {
          calories: 300,
          protein: null,
          fat: null,
          carbs: null
        },
        isNew: false,
        cached: true
      }
    ])
  })
})
