import { describe, it, expect } from 'vitest'
import type { RecipeCategory, RecipeFilter, Recipe, RecipeSearchParams } from '~/types/recipe'

describe('Recipe Types', () => {
  describe('RecipeCategory', () => {
    it('can be created with valid data', () => {
      const category: RecipeCategory = {
        id: 'italian',
        name: 'Italian Cuisine',
        filter: { cuisine: 'italian' }
      }

      expect(category.id).toBe('italian')
      expect(category.name).toBe('Italian Cuisine')
      expect(category.filter).toEqual({ cuisine: 'italian' })
    })

    it('can have null filter for "all" category', () => {
      const category: RecipeCategory = {
        id: 'all',
        name: 'All Recipes',
        filter: null
      }

      expect(category.id).toBe('all')
      expect(category.name).toBe('All Recipes')
      expect(category.filter).toBeNull()
    })

    it('supports all category types', () => {
      const categories: RecipeCategory[] = [
        { id: 'all', name: 'All Recipes', filter: null },
        { id: 'quick', name: 'Quick Meals', filter: { maxTime: 20 } },
        { id: 'italian', name: 'Italian', filter: { cuisine: 'italian' } },
        { id: 'french', name: 'French', filter: { cuisine: 'french' } },
        { id: 'desserts', name: 'Desserts', filter: { type: 'dessert' } },
        { id: 'vegetarian', name: 'Vegetarian', filter: { dietary: 'vegetarian' } },
        { id: 'seasonal', name: 'Seasonal', filter: { seasonal: true } }
      ]

      expect(categories).toHaveLength(7)
      categories.forEach(category => {
        expect(category).toHaveProperty('id')
        expect(category).toHaveProperty('name')
        expect(category).toHaveProperty('filter')
      })
    })
  })

  describe('RecipeFilter', () => {
    it('supports time-based filtering', () => {
      const filter: RecipeFilter = {
        maxTime: 20
      }

      expect(filter.maxTime).toBe(20)
      expect(filter.cuisine).toBeUndefined()
      expect(filter.type).toBeUndefined()
      expect(filter.dietary).toBeUndefined()
      expect(filter.seasonal).toBeUndefined()
    })

    it('supports cuisine filtering', () => {
      const filter: RecipeFilter = {
        cuisine: 'italian'
      }

      expect(filter.cuisine).toBe('italian')
      expect(filter.maxTime).toBeUndefined()
    })

    it('supports type filtering', () => {
      const filter: RecipeFilter = {
        type: 'dessert'
      }

      expect(filter.type).toBe('dessert')
      expect(filter.cuisine).toBeUndefined()
    })

    it('supports dietary filtering', () => {
      const filter: RecipeFilter = {
        dietary: 'vegetarian'
      }

      expect(filter.dietary).toBe('vegetarian')
      expect(filter.type).toBeUndefined()
    })

    it('supports seasonal filtering', () => {
      const filter: RecipeFilter = {
        seasonal: true
      }

      expect(filter.seasonal).toBe(true)
      expect(filter.dietary).toBeUndefined()
    })

    it('supports combined filters', () => {
      const filter: RecipeFilter = {
        maxTime: 30,
        cuisine: 'french',
        seasonal: true
      }

      expect(filter.maxTime).toBe(30)
      expect(filter.cuisine).toBe('french')
      expect(filter.seasonal).toBe(true)
    })

    it('can be empty object', () => {
      const filter: RecipeFilter = {}

      expect(filter.maxTime).toBeUndefined()
      expect(filter.cuisine).toBeUndefined()
      expect(filter.type).toBeUndefined()
      expect(filter.dietary).toBeUndefined()
      expect(filter.seasonal).toBeUndefined()
    })
  })

  describe('RecipeSearchParams', () => {
    it('includes category parameter', () => {
      const params: RecipeSearchParams = {
        query: 'pasta',
        category: 'italian',
        offset: 0,
        number: 12
      }

      expect(params.query).toBe('pasta')
      expect(params.category).toBe('italian')
      expect(params.offset).toBe(0)
      expect(params.number).toBe(12)
    })

    it('can have optional category', () => {
      const params: RecipeSearchParams = {
        query: 'chicken'
      }

      expect(params.query).toBe('chicken')
      expect(params.category).toBeUndefined()
    })

    it('supports all optional parameters', () => {
      const params: RecipeSearchParams = {
        query: 'beef',
        category: 'french',
        offset: 10,
        number: 20,
        addRecipeInformation: true,
        addRecipeNutrition: true
      }

      expect(params.query).toBe('beef')
      expect(params.category).toBe('french')
      expect(params.offset).toBe(10)
      expect(params.number).toBe(20)
      expect(params.addRecipeInformation).toBe(true)
      expect(params.addRecipeNutrition).toBe(true)
    })
  })

  describe('Type Compatibility', () => {
    it('RecipeCategory can be used in arrays', () => {
      const categories: RecipeCategory[] = [
        { id: 'quick', name: 'Quick Meals', filter: { maxTime: 20 } }
      ]

      expect(Array.isArray(categories)).toBe(true)
      expect(categories[0].id).toBe('quick')
    })

    it('RecipeFilter can be used in category definitions', () => {
      const filter: RecipeFilter = { cuisine: 'italian' }
      const category: RecipeCategory = {
        id: 'italian',
        name: 'Italian',
        filter
      }

      expect(category.filter).toBe(filter)
      expect(category.filter?.cuisine).toBe('italian')
    })

    it('RecipeSearchParams can include category', () => {
      const searchParams: RecipeSearchParams = {
        category: 'desserts'
      }

      expect(searchParams.category).toBe('desserts')
    })

    it('supports type-safe category filtering', () => {
      const createCategoryFilter = (categoryId: string): RecipeFilter | null => {
        const categoryFilters: Record<string, RecipeFilter> = {
          quick: { maxTime: 20 },
          italian: { cuisine: 'italian' },
          french: { cuisine: 'french' },
          desserts: { type: 'dessert' },
          vegetarian: { dietary: 'vegetarian' },
          seasonal: { seasonal: true }
        }
        
        return categoryFilters[categoryId] || null
      }

      const quickFilter = createCategoryFilter('quick')
      const italianFilter = createCategoryFilter('italian')
      const invalidFilter = createCategoryFilter('invalid')

      expect(quickFilter).toEqual({ maxTime: 20 })
      expect(italianFilter).toEqual({ cuisine: 'italian' })
      expect(invalidFilter).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined values in filters', () => {
      const filter: RecipeFilter = {
        maxTime: undefined,
        cuisine: undefined,
        type: undefined,
        dietary: undefined,
        seasonal: undefined
      }

      expect(filter.maxTime).toBeUndefined()
      expect(filter.cuisine).toBeUndefined()
      expect(filter.type).toBeUndefined()
      expect(filter.dietary).toBeUndefined()
      expect(filter.seasonal).toBeUndefined()
    })

    it('supports zero values in filters', () => {
      const filter: RecipeFilter = {
        maxTime: 0,
        offset: 0,
        number: 0
      }

      expect(filter.maxTime).toBe(0)
    })

    it('handles empty strings in search params', () => {
      const params: RecipeSearchParams = {
        query: '',
        category: ''
      }

      expect(params.query).toBe('')
      expect(params.category).toBe('')
    })
  })
})
