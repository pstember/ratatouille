import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DatabaseSearchService } from '~/server/utils/database-search'
import { prisma } from '~/server/database/client'

// Mock Prisma
vi.mock('~/server/database/client', () => ({
  prisma: {
    recipe: {
      findMany: vi.fn(),
      count: vi.fn()
    }
  }
}))

describe('DatabaseSearchService', () => {
  let service: DatabaseSearchService

  beforeEach(() => {
    service = new DatabaseSearchService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('searchRecipes', () => {
    it('should return popular recipes when no query is provided', async () => {
      const mockRecipes = [
        {
          id: 1,
          title: 'Chicken Pasta',
          image: 'chicken.jpg',
          servings: 4,
          readyInMinutes: 30,
          cuisine: 'italian',
          isNew: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          externalId: 123,
          sourceUrl: 'http://example.com',
          sourceName: 'Example',
          summary: 'Delicious chicken pasta',
          instructions: 'Cook pasta...',
          nutrition: {
            id: 1,
            recipeId: 1,
            calories: 400,
            protein: 25,
            fat: 15,
            carbs: 45,
            fiber: 3,
            sugar: 2,
            sodium: 500,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          ingredients: [],
          allergens: []
        }
      ]

      vi.mocked(prisma.recipe.findMany).mockResolvedValue(mockRecipes)
      vi.mocked(prisma.recipe.count).mockResolvedValue(mockRecipes.length)

      const result = await service.searchRecipes({
        query: '',
        offset: 0,
        limit: 12
      })

      expect(result.recipes).toHaveLength(mockRecipes.length)
      expect(result.totalCount).toBe(mockRecipes.length)
      expect(result.source).toBe('database')
      expect(result.hasMoreResults).toBe(false)
    })

    it('should search by title and return results', async () => {
      const mockRecipes = [
        {
          id: 1,
          title: 'Chicken Pasta',
          image: 'chicken.jpg',
          servings: 4,
          readyInMinutes: 30,
          cuisine: 'italian',
          isNew: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          externalId: 123,
          sourceUrl: 'http://example.com',
          sourceName: 'Example',
          summary: 'Delicious chicken pasta',
          instructions: 'Cook pasta...',
          nutrition: null,
          ingredients: [],
          allergens: []
        }
      ]

      vi.mocked(prisma.recipe.findMany).mockResolvedValue(mockRecipes)
      vi.mocked(prisma.recipe.count).mockResolvedValue(mockRecipes.length)

      const result = await service.searchRecipes({
        query: 'chicken',
        offset: 0,
        limit: 12
      })

      expect(result.recipes).toHaveLength(mockRecipes.length)
      expect(result.totalCount).toBe(mockRecipes.length)
      expect(prisma.recipe.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'chicken' } },
            { summary: { contains: 'chicken' } },
            { ingredients: { some: { name: { contains: 'chicken' } } } }
          ]
        },
        include: {
          ingredients: true,
          nutrition: true,
          allergens: true
        },
        orderBy: [
          { isNew: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: 0,
        take: 12
      })
    })

    it('should handle search errors gracefully', async () => {
      vi.mocked(prisma.recipe.findMany).mockRejectedValue(new Error('Database error'))
      vi.mocked(prisma.recipe.count).mockRejectedValue(new Error('Database error'))

      await expect(service.searchRecipes({
        query: 'chicken',
        offset: 0,
        limit: 12
      })).rejects.toThrow('Database search failed')
    })
  })

  describe('searchByTitle', () => {
    it('should search recipes by title and summary', async () => {
      const mockRecipes = [
        {
          id: 1,
          title: 'Chicken Pasta',
          image: 'chicken.jpg',
          servings: 4,
          readyInMinutes: 30,
          cuisine: 'italian',
          isNew: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          externalId: 123,
          sourceUrl: 'http://example.com',
          sourceName: 'Example',
          summary: 'Delicious chicken pasta',
          instructions: 'Cook pasta...',
          nutrition: null,
          ingredients: [],
          allergens: []
        }
      ]

      vi.mocked(prisma.recipe.findMany).mockResolvedValue(mockRecipes)

      const result = await service.searchByTitle('chicken')

      expect(result).toHaveLength(mockRecipes.length)
      expect(result[0].title).toBe('Chicken Pasta')
    })
  })

  describe('searchByIngredients', () => {
    it('should search recipes by ingredients', async () => {
      const mockRecipes = [
        {
          id: 1,
          title: 'Chicken Pasta',
          image: 'chicken.jpg',
          servings: 4,
          readyInMinutes: 30,
          cuisine: 'italian',
          isNew: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          externalId: 123,
          sourceUrl: 'http://example.com',
          sourceName: 'Example',
          summary: 'Delicious chicken pasta',
          instructions: 'Cook pasta...',
          nutrition: null,
          ingredients: [
            {
              id: 1,
              recipeId: 1,
              name: 'chicken breast',
              amount: 500,
              unit: 'g',
              aisle: 'meat',
              createdAt: new Date()
            }
          ],
          allergens: []
        }
      ]

      vi.mocked(prisma.recipe.findMany).mockResolvedValue(mockRecipes)

      const result = await service.searchByIngredients('chicken')

      expect(result).toHaveLength(mockRecipes.length)
      expect(result[0].title).toBe('Chicken Pasta')
    })
  })

  describe('searchByCuisine', () => {
    it('should search recipes by cuisine', async () => {
      const mockRecipes = [
        {
          id: 1,
          title: 'Chicken Pasta',
          image: 'chicken.jpg',
          servings: 4,
          readyInMinutes: 30,
          cuisine: 'italian',
          isNew: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          externalId: 123,
          sourceUrl: 'http://example.com',
          sourceName: 'Example',
          summary: 'Delicious chicken pasta',
          instructions: 'Cook pasta...',
          nutrition: null,
          ingredients: [],
          allergens: []
        }
      ]

      vi.mocked(prisma.recipe.findMany).mockResolvedValue(mockRecipes)

      const result = await service.searchByCuisine('italian')

      expect(result).toHaveLength(mockRecipes.length)
      expect(result[0].cuisine).toBe('italian')
    })
  })

  describe('getPopularRecipes', () => {
    it('should return popular recipes with pagination', async () => {
      const mockRecipes = [
        {
          id: 1,
          title: 'Chicken Pasta',
          image: 'chicken.jpg',
          servings: 4,
          readyInMinutes: 30,
          cuisine: 'italian',
          isNew: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          externalId: 123,
          sourceUrl: 'http://example.com',
          sourceName: 'Example',
          summary: 'Delicious chicken pasta',
          instructions: 'Cook pasta...',
          nutrition: null,
          ingredients: [],
          allergens: []
        }
      ]

      vi.mocked(prisma.recipe.findMany).mockResolvedValue(mockRecipes)
      vi.mocked(prisma.recipe.count).mockResolvedValue(mockRecipes.length)

      const result = await service.getPopularRecipes(0, 12)

      expect(result.recipes).toHaveLength(mockRecipes.length)
      expect(result.totalCount).toBe(mockRecipes.length)
      expect(result.source).toBe('database')
      expect(result.hasMoreResults).toBe(false)
    })
  })

  describe('assessResultQuality', () => {
    it('should assess sufficient results when 5 or more recipes found', () => {
      const mockRecipes = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        title: `Recipe ${i + 1}`,
        image: `recipe${i + 1}.jpg`,
        servings: 4,
        readyInMinutes: 30,
        cuisine: 'italian',
        isNew: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        externalId: 100 + i,
        sourceUrl: 'http://example.com',
        sourceName: 'Example',
        summary: 'Delicious recipe',
        instructions: 'Cook...',
        nutrition: null,
        ingredients: [],
        allergens: []
      }))

      const assessment = service.assessResultQuality(mockRecipes, 'pasta')

      expect(assessment.isSufficient).toBe(true)
      expect(assessment.reason).toBe('Found 5 recipes in database')
      expect(assessment.suggestedAction).toBe('use_database')
    })

    it('should assess insufficient results when less than 5 recipes found', () => {
      const mockRecipes = [
        {
          id: 1,
          title: 'Chicken Pasta',
          image: 'chicken.jpg',
          servings: 4,
          readyInMinutes: 30,
          cuisine: 'italian',
          isNew: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          externalId: 123,
          sourceUrl: 'http://example.com',
          sourceName: 'Example',
          summary: 'Delicious chicken pasta',
          instructions: 'Cook pasta...',
          nutrition: null,
          ingredients: [],
          allergens: []
        }
      ]

      const assessment = service.assessResultQuality(mockRecipes, 'exotic')

      expect(assessment.isSufficient).toBe(false)
      expect(assessment.reason).toBe('Only found 1 recipes, no exact matches')
      expect(assessment.suggestedAction).toBe('offer_spoonacular')
    })

    it('should assess sufficient results when exact title matches found', () => {
      const mockRecipes = [
        {
          id: 1,
          title: 'Chicken Pasta Recipe',
          image: 'chicken.jpg',
          servings: 4,
          readyInMinutes: 30,
          cuisine: 'italian',
          isNew: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          externalId: 123,
          sourceUrl: 'http://example.com',
          sourceName: 'Example',
          summary: 'Delicious chicken pasta',
          instructions: 'Cook pasta...',
          nutrition: null,
          ingredients: [],
          allergens: []
        }
      ]

      const assessment = service.assessResultQuality(mockRecipes, 'chicken')

      expect(assessment.isSufficient).toBe(true)
      expect(assessment.reason).toBe('Found 1 exact matches in database')
      expect(assessment.suggestedAction).toBe('use_database')
    })

    it('should assess insufficient results when no recipes found', () => {
      const assessment = service.assessResultQuality([], 'nonexistent')

      expect(assessment.isSufficient).toBe(false)
      expect(assessment.reason).toBe('No recipes found in database')
      expect(assessment.suggestedAction).toBe('offer_spoonacular')
    })
  })

  describe('combineAndDeduplicate', () => {
    it('should remove duplicate recipes based on ID', () => {
      const recipes = [
        { id: 1, title: 'Recipe 1' } as any,
        { id: 2, title: 'Recipe 2' } as any,
        { id: 1, title: 'Recipe 1 Duplicate' } as any
      ]

      const result = service['combineAndDeduplicate'](recipes)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(1)
      expect(result[1].id).toBe(2)
    })
  })

  describe('calculateSearchScore', () => {
    it('should calculate score for exact title match', () => {
      const recipe = {
        id: 1,
        title: 'Chicken Pasta',
        summary: 'Delicious chicken pasta',
        cuisine: 'italian',
        isNew: true,
        createdAt: new Date(),
        readyInMinutes: 30,
        ingredients: [
          { name: 'chicken breast' },
          { name: 'pasta' }
        ]
      } as any

      const score = service['calculateSearchScore'](recipe, 'chicken')

      expect(score).toBeGreaterThan(100) // Exact start match should give high score
    })

    it('should calculate score for partial title match', () => {
      const recipe = {
        id: 1,
        title: 'Delicious Chicken Pasta',
        summary: 'A tasty dish',
        cuisine: 'italian',
        isNew: false,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        readyInMinutes: 30,
        ingredients: []
      } as any

      const score = service['calculateSearchScore'](recipe, 'chicken')

      expect(score).toBeGreaterThan(50) // Partial match should give medium score
    })
  })
})
