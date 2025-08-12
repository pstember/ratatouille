import { describe, it, expect, beforeEach, vi } from 'vitest'
import { processIntolerances, storeRecipeAllergens, getRecipeAllergens, recipeContainsAllergens } from '~/server/utils/allergen'
import type { AllergenType } from '~/types/allergen'

// Mock Prisma client
vi.mock('~/server/database/client', () => ({
  prisma: {
    recipeAllergen: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn()
    }
  }
}))

describe('Allergen Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('processIntolerances', () => {
    it('converts Spoonacular intolerances to allergen types', () => {
      const intolerances = ['gluten', 'dairy', 'egg']
      const result = processIntolerances(intolerances)
      
      expect(result).toEqual(['gluten', 'dairy', 'eggs'])
    })

    it('handles empty intolerances array', () => {
      const result = processIntolerances([])
      expect(result).toEqual([])
    })

    it('handles undefined intolerances', () => {
      const result = processIntolerances(undefined)
      expect(result).toEqual([])
    })

    it('filters out unknown intolerances', () => {
      const intolerances = ['gluten', 'unknown', 'dairy']
      const result = processIntolerances(intolerances)
      
      expect(result).toEqual(['gluten', 'dairy'])
    })

    it('handles case insensitive mapping', () => {
      const intolerances = ['GLUTEN', 'Dairy', 'EGG']
      const result = processIntolerances(intolerances)
      
      expect(result).toEqual(['gluten', 'dairy', 'eggs'])
    })
  })

  describe('storeRecipeAllergens', () => {
    it('stores allergens for a recipe', async () => {
      const { prisma } = await import('~/server/database/client')
      const mockDeleteMany = vi.mocked(prisma.recipeAllergen.deleteMany)
      const mockCreateMany = vi.mocked(prisma.recipeAllergen.createMany)
      
      const allergens: AllergenType[] = ['gluten', 'dairy']
      
      await storeRecipeAllergens(1, allergens)
      
      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: { recipeId: 1 }
      })
      
      expect(mockCreateMany).toHaveBeenCalledWith({
        data: [
          { recipeId: 1, allergen: 'gluten', severity: 'warning' },
          { recipeId: 1, allergen: 'dairy', severity: 'warning' }
        ]
      })
    })

    it('does nothing when no allergens provided', async () => {
      const { prisma } = await import('~/server/database/client')
      const mockDeleteMany = vi.mocked(prisma.recipeAllergen.deleteMany)
      const mockCreateMany = vi.mocked(prisma.recipeAllergen.createMany)
      
      await storeRecipeAllergens(1, [])
      
      expect(mockDeleteMany).not.toHaveBeenCalled()
      expect(mockCreateMany).not.toHaveBeenCalled()
    })
  })

  describe('getRecipeAllergens', () => {
    it('retrieves allergens for a recipe', async () => {
      const { prisma } = await import('~/server/database/client')
      const mockFindMany = vi.mocked(prisma.recipeAllergen.findMany)
      
      mockFindMany.mockResolvedValue([
        { allergen: 'gluten' },
        { allergen: 'dairy' }
      ])
      
      const result = await getRecipeAllergens(1)
      
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { recipeId: 1 },
        select: { allergen: true }
      })
      
      expect(result).toEqual(['gluten', 'dairy'])
    })
  })

  describe('recipeContainsAllergens', () => {
    it('returns true when recipe contains specified allergens', async () => {
      const { prisma } = await import('~/server/database/client')
      const mockFindMany = vi.mocked(prisma.recipeAllergen.findMany)
      
      mockFindMany.mockResolvedValue([
        { allergen: 'gluten' }
      ])
      
      const result = await recipeContainsAllergens(1, ['gluten', 'dairy'])
      
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          recipeId: 1,
          allergen: { in: ['gluten', 'dairy'] }
        }
      })
      
      expect(result).toBe(true)
    })

    it('returns false when recipe does not contain specified allergens', async () => {
      const { prisma } = await import('~/server/database/client')
      const mockFindMany = vi.mocked(prisma.recipeAllergen.findMany)
      
      mockFindMany.mockResolvedValue([])
      
      const result = await recipeContainsAllergens(1, ['gluten', 'dairy'])
      
      expect(result).toBe(false)
    })

    it('returns false when no allergens specified', async () => {
      const result = await recipeContainsAllergens(1, [])
      expect(result).toBe(false)
    })
  })
})
