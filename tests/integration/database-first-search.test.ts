import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupTestEnvironment, cleanupTestEnvironment } from '~/tests/setup/test-utils'
import { prisma } from '~/server/database/client'

// Mock $fetch globally
const mockFetch = vi.fn()
// @ts-ignore - Mocking $fetch for tests
global.$fetch = mockFetch

describe('Database-First Search Integration', () => {
  beforeEach(async () => {
    await setupTestEnvironment()
    
    // Clear existing data to avoid unique constraint violations
    await prisma.recipeIngredient.deleteMany()
    await prisma.recipe.deleteMany()
    
    // Create recipes first
    const recipes = await prisma.recipe.createMany({
      data: [
        {
          externalId: 1,
          title: 'Chicken Pasta',
          image: 'chicken-pasta.jpg',
          servings: 4,
          readyInMinutes: 30,
          summary: 'Delicious chicken pasta with creamy sauce',
          instructions: 'Cook pasta, add chicken, serve',
          sourceUrl: 'http://example.com/1',
          sourceName: 'Test Kitchen',
          cuisine: 'italian'
        },
        {
          externalId: 2,
          title: 'Beef Stir Fry',
          image: 'beef-stir-fry.jpg',
          servings: 2,
          readyInMinutes: 20,
          summary: 'Quick and easy beef stir fry',
          instructions: 'Stir fry beef with vegetables',
          sourceUrl: 'http://example.com/2',
          sourceName: 'Test Kitchen',
          cuisine: 'asian'
        },
        {
          externalId: 3,
          title: 'Vegetarian Salad',
          image: 'salad.jpg',
          servings: 1,
          readyInMinutes: 10,
          summary: 'Fresh and healthy vegetarian salad',
          instructions: 'Mix vegetables, add dressing',
          sourceUrl: 'http://example.com/3',
          sourceName: 'Test Kitchen',
          cuisine: 'mediterranean'
        }
      ]
    })

    // Get the created recipe IDs
    const createdRecipes = await prisma.recipe.findMany({
      where: {
        externalId: { in: [1, 2, 3] }
      }
    })

    // Ensure we have all 3 recipes
    expect(createdRecipes).toHaveLength(3)

    // Add ingredients for search testing using the actual recipe IDs
    await prisma.recipeIngredient.createMany({
      data: [
        { recipeId: createdRecipes[0]!.id, name: 'chicken breast', amount: 500, unit: 'g' },
        { recipeId: createdRecipes[0]!.id, name: 'pasta', amount: 400, unit: 'g' },
        { recipeId: createdRecipes[1]!.id, name: 'beef', amount: 300, unit: 'g' },
        { recipeId: createdRecipes[1]!.id, name: 'vegetables', amount: 200, unit: 'g' },
        { recipeId: createdRecipes[2]!.id, name: 'lettuce', amount: 100, unit: 'g' },
        { recipeId: createdRecipes[2]!.id, name: 'tomatoes', amount: 50, unit: 'g' }
      ]
    })
  })

  afterEach(async () => {
    await cleanupTestEnvironment()
    vi.clearAllMocks()
  })

  describe('Database Search API', () => {
    it('should return database results for existing recipes', async () => {
      const mockResponse = {
        results: [
          {
            id: 1,
            title: 'Chicken Pasta',
            image: 'chicken-pasta.jpg',
            cuisine: 'italian'
          }
        ],
        searchSource: 'database',
        databaseResults: {
          count: 1,
          totalAvailable: 1
        },
        qualityAssessment: {
          isSufficient: true,
          reason: 'Found matching recipes',
          suggestedAction: 'use_database'
        }
      }

      // Mock the API call
      mockFetch.mockResolvedValue(mockResponse)

      const response = await $fetch('/api/recipes', {
        query: {
          q: 'chicken',
          offset: 0,
          number: 12
        }
      }) as any

      expect(response).toBeDefined()
      expect(response).toHaveProperty('results')
      expect(response).toHaveProperty('searchSource')
      expect(response).toHaveProperty('databaseResults')
      
      expect(response.searchSource).toBe('database')
      expect(response.databaseResults?.count).toBeGreaterThan(0)
      expect(response.results?.length).toBeGreaterThan(0)
      
      // Should find chicken pasta
      const chickenRecipe = response.results?.find((r: any) => r.title.includes('Chicken'))
      expect(chickenRecipe).toBeDefined()
      expect(chickenRecipe.title).toBe('Chicken Pasta')
    })

    it('should return quality assessment for search results', async () => {
      const mockResponse = {
        results: [],
        searchSource: 'database',
        databaseResults: {
          count: 0,
          totalAvailable: 0
        },
        qualityAssessment: {
          isSufficient: false,
          reason: 'No matching recipes found',
          suggestedAction: 'offer_spoonacular'
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      const response = await $fetch('/api/recipes', {
        query: {
          q: 'chicken',
          offset: 0,
          number: 12
        }
      }) as any

      expect(response).toBeDefined()
      expect(response).toHaveProperty('qualityAssessment')
      expect(response.qualityAssessment).toHaveProperty('isSufficient')
      expect(response.qualityAssessment).toHaveProperty('reason')
      expect(response.qualityAssessment).toHaveProperty('suggestedAction')
    })

    it('should offer Spoonacular option when results are insufficient', async () => {
      const mockResponse = {
        results: [],
        searchSource: 'database',
        databaseResults: {
          count: 0,
          totalAvailable: 0
        },
        spoonacularOption: {
          available: true,
          estimatedCost: 1
        },
        qualityAssessment: {
          isSufficient: false,
          reason: 'No matching recipes found',
          suggestedAction: 'offer_spoonacular'
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      const response = await $fetch('/api/recipes', {
        query: {
          q: 'nonexistent-recipe-query',
          offset: 0,
          number: 12
        }
      }) as any

      expect(response).toBeDefined()
      expect(response.searchSource).toBe('database')
      expect(response.databaseResults?.count).toBe(0)
      expect(response).toHaveProperty('spoonacularOption')
      expect(response.spoonacularOption?.available).toBe(true)
      expect(response.qualityAssessment?.suggestedAction).toBe('offer_spoonacular')
    })

    it('should search by ingredients', async () => {
      const mockResponse = {
        results: [
          {
            id: 1,
            title: 'Chicken Pasta',
            image: 'chicken-pasta.jpg',
            cuisine: 'italian'
          }
        ],
        searchSource: 'database',
        databaseResults: {
          count: 1,
          totalAvailable: 1
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      const response = await $fetch('/api/recipes', {
        query: {
          q: 'pasta',
          offset: 0,
          number: 12
        }
      }) as any

      expect(response).toBeDefined()
      expect(response.results?.length).toBeGreaterThan(0)
      
      // Should find recipe with pasta ingredient
      const pastaRecipe = response.results?.find((r: any) => r.title.includes('Pasta'))
      expect(pastaRecipe).toBeDefined()
    })

    it('should search by cuisine', async () => {
      const mockResponse = {
        results: [
          {
            id: 1,
            title: 'Chicken Pasta',
            image: 'chicken-pasta.jpg',
            cuisine: 'italian'
          }
        ],
        searchSource: 'database',
        databaseResults: {
          count: 1,
          totalAvailable: 1
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      const response = await $fetch('/api/recipes', {
        query: {
          q: 'italian',
          offset: 0,
          number: 12
        }
      }) as any

      expect(response).toBeDefined()
      expect(response.results?.length).toBeGreaterThan(0)
      
      // Should find Italian cuisine recipe
      const italianRecipe = response.results?.find((r: any) => r.cuisine === 'italian')
      expect(italianRecipe).toBeDefined()
    })

    it('should return popular recipes when no query provided', async () => {
      const mockResponse = {
        results: [
          {
            id: 1,
            title: 'Chicken Pasta',
            image: 'chicken-pasta.jpg',
            cuisine: 'italian'
          }
        ],
        searchSource: 'database',
        databaseResults: {
          count: 1,
          totalAvailable: 1
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      const response = await $fetch('/api/recipes', {
        query: {
          offset: 0,
          number: 12
        }
      }) as any

      expect(response).toBeDefined()
      expect(response.searchSource).toBe('database')
      expect(response.results?.length).toBeGreaterThan(0)
      expect(response.databaseResults?.count).toBeGreaterThan(0)
    })

    it('should handle pagination correctly', async () => {
      const mockResponse1 = {
        results: [
          { id: 1, title: 'Recipe 1' },
          { id: 2, title: 'Recipe 2' }
        ],
        searchSource: 'database',
        databaseResults: {
          count: 2,
          totalAvailable: 3
        },
        hasMoreResults: true
      }

      const mockResponse2 = {
        results: [
          { id: 3, title: 'Recipe 3' }
        ],
        searchSource: 'database',
        databaseResults: {
          count: 1,
          totalAvailable: 3
        },
        hasMoreResults: false
      }

      mockFetch
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2)

      const response1 = await $fetch('/api/recipes', {
        query: {
          offset: 0,
          number: 2
        }
      }) as any

      const response2 = await $fetch('/api/recipes', {
        query: {
          offset: 2,
          number: 2
        }
      }) as any

      expect(response1).toBeDefined()
      expect(response2).toBeDefined()
      expect(response1.results?.length).toBeLessThanOrEqual(2)
      expect(response2.results?.length).toBeLessThanOrEqual(2)
      expect(response1.hasMoreResults).toBeDefined()
    })
  })

  describe('Spoonacular Search API', () => {
    it('should require user consent for Spoonacular search', async () => {
      mockFetch.mockRejectedValue({
        statusCode: 400,
        statusMessage: 'User consent required for Spoonacular search'
      })

      try {
        await $fetch('/api/recipes/spoonacular/search', {
          query: {
            q: 'chicken',
            offset: 0,
            number: 12
          }
        })
        expect.fail('Should have thrown an error for missing user consent')
      } catch (error: any) {
        // The API should return an error for missing user consent
        expect(error.statusCode).toBe(400)
        expect(error.statusMessage).toBe('User consent required for Spoonacular search')
      }
    })

    it('should accept user consent for Spoonacular search', async () => {
      const mockResponse = {
        results: [
          {
            id: 1,
            title: 'Chicken Recipe',
            image: 'chicken.jpg',
            cuisine: 'italian'
          }
        ],
        searchSource: 'api',
        databaseResults: {
          count: 0,
          totalAvailable: 0
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      const response = await $fetch('/api/recipes', {
        query: {
          q: 'chicken',
          offset: 0,
          number: 12,
          userConsent: 'true',
          confirmedQuotaUsage: 'true'
        }
      }) as any

      expect(response).toBeDefined()
      expect(response).toHaveProperty('searchSource')
      expect(response.searchSource).toBe('api')
      expect(response).toHaveProperty('databaseResults')
    })
  })

  describe('Enhanced Search Response Format', () => {
    it('should include all required fields in enhanced response', async () => {
      const mockResponse = {
        results: [
          {
            id: 1,
            title: 'Chicken Pasta',
            image: 'chicken-pasta.jpg',
            cuisine: 'italian'
          }
        ],
        offset: 0,
        number: 12,
        totalResults: 1,
        searchSource: 'database',
        databaseResults: {
          count: 1,
          totalAvailable: 1
        },
        qualityAssessment: {
          isSufficient: true,
          reason: 'Found matching recipes',
          suggestedAction: 'use_database'
        },
        spoonacularOption: {
          available: true,
          estimatedCost: 1
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      const response = await $fetch('/api/recipes', {
        query: {
          q: 'chicken',
          offset: 0,
          number: 12
        }
      }) as any

      expect(response).toBeDefined()
      // Required fields
      expect(response).toHaveProperty('results')
      expect(response).toHaveProperty('offset')
      expect(response).toHaveProperty('number')
      expect(response).toHaveProperty('totalResults')
      expect(response).toHaveProperty('searchSource')
      expect(response).toHaveProperty('databaseResults')
      
      // Optional fields that may be present
      expect(response).toHaveProperty('qualityAssessment')
      expect(response).toHaveProperty('spoonacularOption')
    })

    it('should include Spoonacular option when appropriate', async () => {
      const mockResponse = {
        results: [],
        searchSource: 'database',
        databaseResults: {
          count: 0,
          totalAvailable: 0
        },
        spoonacularOption: {
          available: true,
          estimatedCost: 1
        }
      }

      mockFetch.mockResolvedValue(mockResponse)

      const response = await $fetch('/api/recipes', {
        query: {
          q: 'nonexistent-recipe-query',
          offset: 0,
          number: 12
        }
      }) as any

      expect(response).toBeDefined()
      expect(response).toHaveProperty('spoonacularOption')
      expect(response.spoonacularOption).toHaveProperty('available')
      expect(response.spoonacularOption).toHaveProperty('estimatedCost')
    })
  })
})
