// Mock useDebounceFn first (before any imports)
const mockDebounceFn = vi.hoisted(() => vi.fn())
vi.mock('@vueuse/core', () => ({
  useDebounceFn: mockDebounceFn
}))

// Mock $fetch
const mockFetch = vi.hoisted(() => vi.fn())

// Mock global $fetch
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      apiBase: 'http://localhost:3000/api'
    }
  }),
  useNuxtApp: () => ({
    $fetch: mockFetch,
    $prisma: vi.fn()
  })
}))

// Also mock $fetch in #imports for good measure
vi.mock('#imports', () => ({
  $fetch: mockFetch,
  useFetch: vi.fn(),
  useAsyncData: vi.fn(),
  navigateTo: vi.fn(),
  useRoute: vi.fn(() => ({
    params: {},
    query: {},
    path: '/'
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  }))
}))

// Mock the quota store
vi.mock('~/stores/quota', () => ({
  useQuotaStore: vi.fn(() => ({
    quotaInfo: ref(null),
    requiresConfirmation: ref(false),
    pendingRequest: ref(null),
    updateQuotaFromResponse: vi.fn(),
    executeWithQuotaCheck: vi.fn((requestFn) => requestFn()),
    confirmAndExecute: vi.fn(),
    cancelPendingRequest: vi.fn(),
    resetDailyQuota: vi.fn()
  }))
}))

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ref, computed } from 'vue'
import { useRecipesStore } from '~/stores/recipes'
import { mockSearchResponse, mockRecipe } from '~/tests/setup/test-utils'

describe('Recipes Store', () => {
  let pinia: any
  let store: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    
    // Reset mocks
    vi.clearAllMocks()
    mockFetch.mockClear()
    mockDebounceFn.mockClear()
    
    // Mock debounced function
    mockDebounceFn.mockReturnValue(vi.fn())
    
    // Set up global $fetch mock
    // @ts-ignore - Mocking global $fetch
    global.$fetch = mockFetch
    
    // Create store after mocking
    store = useRecipesStore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('initializes with correct default values', () => {
      expect(store.recipes).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
      expect(store.searchQuery).toBe('')
      expect(store.selectedCategory).toBe(undefined)
      expect(store.totalResults).toBe(0)
      expect(store.currentPage).toBe(0)
      expect(store.itemsPerPage).toBe(12)
    })

    it('initializes computed properties correctly', () => {
      expect(store.hasMoreResults).toBe(false)
      expect(store.isEmpty).toBe(true)
    })
  })

  describe('Computed Properties', () => {
    it('hasMoreResults returns true when there are more results', () => {
      store.recipes = [mockRecipe]
      store.totalResults = 5
      
      expect(store.hasMoreResults).toBe(true)
    })

    it('hasMoreResults returns false when all results are loaded', () => {
      store.recipes = [mockRecipe, mockRecipe, mockRecipe]
      store.totalResults = 3
      
      expect(store.hasMoreResults).toBe(false)
    })

    it('isEmpty returns true when no recipes and not loading', () => {
      store.recipes = []
      store.loading = false
      
      expect(store.isEmpty).toBe(true)
    })

    it('isEmpty returns false when recipes exist', () => {
      store.recipes = [mockRecipe]
      store.loading = false
      
      expect(store.isEmpty).toBe(false)
    })

    it('isEmpty returns false when loading', () => {
      store.recipes = []
      store.loading = true
      
      expect(store.isEmpty).toBe(false)
    })
  })

  describe('searchRecipes Action', () => {
    it('successfully searches recipes with query', async () => {
      mockFetch.mockResolvedValue(mockSearchResponse)
      
      await store.searchRecipes({ query: 'chicken' })
      
      expect(store.loading).toBe(false)
      expect(store.recipes).toEqual(mockSearchResponse.results)
      expect(store.totalResults).toBe(mockSearchResponse.totalResults)
      expect(store.searchQuery).toBe('chicken')
    })

    it('successfully searches recipes with category', async () => {
      mockFetch.mockResolvedValue(mockSearchResponse)
      
      await store.searchRecipes({ category: 'italian' })
      
      expect(store.loading).toBe(false)
      expect(store.recipes).toEqual(mockSearchResponse.results)
      expect(store.totalResults).toBe(mockSearchResponse.totalResults)
      expect(store.selectedCategory).toBe('italian')
    })

    it('successfully searches recipes with query and category', async () => {
      mockFetch.mockResolvedValue(mockSearchResponse)
      
      await store.searchRecipes({ query: 'pasta', category: 'italian' })
      
      expect(store.loading).toBe(false)
      expect(store.recipes).toEqual(mockSearchResponse.results)
      expect(store.searchQuery).toBe('pasta')
      expect(store.selectedCategory).toBe('italian')
    })

    it('successfully searches recipes without query (uses existing)', async () => {
      store.searchQuery = 'pasta'
      mockFetch.mockResolvedValue(mockSearchResponse)
      
      await store.searchRecipes()
      
      expect(store.searchQuery).toBe('pasta')
      expect(mockFetch).toHaveBeenCalledWith('/api/recipes', {
        query: {
          query: 'pasta',
          offset: 0,
          number: 12,
          addRecipeInformation: true,
          addRecipeNutrition: true,
          category: undefined,
          confirmedQuotaUsage: 'true'
        }
      })
    })

    it('handles pagination correctly', async () => {
      mockFetch.mockResolvedValue(mockSearchResponse)
      
      // First page
      await store.searchRecipes({ query: 'chicken', offset: 0 })
      expect(store.recipes).toHaveLength(1)
      
      // Second page
      await store.searchRecipes({ query: 'chicken', offset: 1 })
      expect(store.recipes).toHaveLength(2)
    })

    it('handles pagination with category', async () => {
      // Mock different responses for each call
      const firstResponse = { ...mockSearchResponse, results: [mockRecipe] }
      const secondResponse = { 
        ...mockSearchResponse, 
        results: [{ ...mockRecipe, id: 2, title: 'Second Recipe' }],
        offset: 1 
      }
      
      mockFetch
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse)
      
      // First page with category
      await store.searchRecipes({ category: 'quick', offset: 0 })
      expect(store.recipes).toHaveLength(1)
      expect(store.selectedCategory).toBe('quick')
      
      // Second page with same category (should append for pagination)
      await store.searchRecipes({ category: 'quick', offset: 1 })
      expect(store.recipes).toHaveLength(2) // Should append for pagination
      expect(store.selectedCategory).toBe('quick')
      expect(store.recipes[0].id).toBe(1)
      expect(store.recipes[1].id).toBe(2)
    })

    it('sets loading state correctly', async () => {
      mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockSearchResponse), 100)))
      
      const searchPromise = store.searchRecipes({ query: 'chicken' })
      expect(store.loading).toBe(true)
      
      await searchPromise
      expect(store.loading).toBe(false)
    })

    it('handles API errors gracefully', async () => {
      const errorMessage = 'API Error'
      mockFetch.mockRejectedValue(new Error(errorMessage))
      
      await store.searchRecipes({ query: 'chicken' })
      
      expect(store.error).toBe('An unexpected error occurred. Please try again.')
      expect(store.loading).toBe(false)
      expect(store.recipes).toEqual([])
    })

    it('handles non-Error objects in catch block', async () => {
      mockFetch.mockRejectedValue('String error')
      
      await store.searchRecipes({ query: 'chicken' })
      
      expect(store.error).toBe('An unexpected error occurred. Please try again.')
      expect(store.loading).toBe(false)
    })

    it('uses default parameters when not provided', async () => {
      mockFetch.mockResolvedValue(mockSearchResponse)
      
      await store.searchRecipes()
      
      expect(mockFetch).toHaveBeenCalledWith('/api/recipes', {
        query: {
          query: '',
          offset: 0,
          number: 12,
          addRecipeInformation: true,
          addRecipeNutrition: true,
          category: undefined,
          confirmedQuotaUsage: 'true'
        }
      })
    })

    it('includes category in API call when provided', async () => {
      mockFetch.mockResolvedValue(mockSearchResponse)
      
      await store.searchRecipes({ category: 'vegetarian' })
      
      expect(mockFetch).toHaveBeenCalledWith('/api/recipes', {
        query: {
          query: '',
          offset: 0,
          number: 12,
          addRecipeInformation: true,
          addRecipeNutrition: true,
          category: 'vegetarian',
          confirmedQuotaUsage: 'true'
        }
      })
    })
  })

  describe('loadMoreRecipes Action', () => {
    it('loads more recipes when available', async () => {
      const mockResponse = {
        results: [{ id: 2, title: 'Recipe 2' }],
        totalResults: 2,
        searchSource: 'database',
        databaseResults: { count: 1, totalAvailable: 2 },
        apiResults: [],
        showSpoonacularOption: false,
        estimatedApiCost: 0
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      store.recipes = [{ id: 1, title: 'Recipe 1' }]
      store.totalResults = 2

      await store.loadMoreRecipes()
      
      expect(mockFetch).toHaveBeenCalledWith('/api/recipes/search', {
        query: {
          addRecipeInformation: true,
          addRecipeNutrition: true,
          category: undefined,
          mode: 'database',
          number: 12,
          offset: 1,
          query: '',
        },
      })
    })

    it('loads more recipes with category when available', async () => {
      const mockResponse = {
        results: [{ id: 2, title: 'Recipe 2' }],
        totalResults: 2,
        searchSource: 'database',
        databaseResults: { count: 1, totalAvailable: 2 },
        apiResults: [],
        showSpoonacularOption: false,
        estimatedApiCost: 0
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      store.recipes = [{ id: 1, title: 'Recipe 1' }]
      store.totalResults = 2
      store.selectedCategory = 'french'

      await store.loadMoreRecipes()
      
      expect(mockFetch).toHaveBeenCalledWith('/api/recipes/search', {
        query: {
          addRecipeInformation: true,
          addRecipeNutrition: true,
          category: 'french',
          mode: 'database',
          number: 12,
          offset: 1,
          query: '',
        },
      })
    })

    it('does not load more when already loading', async () => {
      store.loading = true
      mockFetch.mockResolvedValue(mockSearchResponse)
      
      await store.loadMoreRecipes()
      
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('does not load more when no more results', async () => {
      store.recipes = [mockRecipe, mockRecipe, mockRecipe]
      store.totalResults = 3
      mockFetch.mockResolvedValue(mockSearchResponse)
      
      await store.loadMoreRecipes()
      
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('loadPopularRecipes Action', () => {
    it('successfully loads popular recipes', async () => {
      mockFetch.mockResolvedValue(mockSearchResponse)
      
      await store.loadPopularRecipes()
      
      expect(store.loading).toBe(false)
      expect(store.recipes).toEqual(mockSearchResponse.results)
      expect(store.totalResults).toBe(mockSearchResponse.totalResults)
      expect(store.selectedCategory).toBe(undefined)
    })

    it('handles errors when loading popular recipes', async () => {
      const errorMessage = 'Popular recipes error'
      mockFetch.mockRejectedValue(new Error(errorMessage))
      
      await store.loadPopularRecipes()
      
      expect(store.error).toBe('Popular recipes error')
      expect(store.loading).toBe(false)
    })

    it('calls API with correct parameters', async () => {
      mockFetch.mockResolvedValue(mockSearchResponse)
      
      await store.loadPopularRecipes()
      
      expect(mockFetch).toHaveBeenCalledWith('/api/recipes', {
        query: {
          number: 12,
          confirmedQuotaUsage: 'true'
        }
      })
    })

    it('resets category when loading popular recipes', async () => {
      store.selectedCategory = 'italian'
      mockFetch.mockResolvedValue(mockSearchResponse)
      
      await store.loadPopularRecipes()
      
      expect(store.selectedCategory).toBe(undefined)
    })
  })

  describe('clearResults Action', () => {
    it('clears all results and resets state', () => {
      store.recipes = [mockRecipe]
      store.totalResults = 5
      store.currentPage = 2
      store.error = 'Some error'
      store.selectedCategory = 'desserts'
      
      store.clearResults()
      
      expect(store.recipes).toEqual([])
      expect(store.totalResults).toBe(0)
      expect(store.currentPage).toBe(0)
      expect(store.error).toBe(null)
      expect(store.selectedCategory).toBe(undefined)
    })
  })

  describe('setSearchQuery Action', () => {
    it('sets search query correctly', () => {
      store.setSearchQuery('new query')
      expect(store.searchQuery).toBe('new query')
    })

    it('overwrites existing search query', () => {
      store.searchQuery = 'old query'
      store.setSearchQuery('new query')
      expect(store.searchQuery).toBe('new query')
    })
  })

  describe('setCategory Action', () => {
    it('sets category correctly', () => {
      store.setCategory('quick')
      expect(store.selectedCategory).toBe('quick')
    })

    it('overwrites existing category', () => {
      store.selectedCategory = 'italian'
      store.setCategory('french')
      expect(store.selectedCategory).toBe('french')
    })

    it('can clear category with undefined', () => {
      store.selectedCategory = 'desserts'
      store.setCategory(undefined)
      expect(store.selectedCategory).toBe(undefined)
    })

    it('can clear category with null', () => {
      store.selectedCategory = 'vegetarian'
      store.setCategory(null as any)
      expect(store.selectedCategory).toBe(undefined)
    })
  })

  describe('debouncedSearch', () => {
    it('initializes debounced search function', () => {
      expect(mockDebounceFn).toHaveBeenCalledWith(expect.any(Function), 300)
    })
  })

  describe('State Mutations', () => {
    it('can directly modify recipes array', () => {
      store.recipes.push(mockRecipe)
      expect(store.recipes).toHaveLength(1)
      expect(store.recipes[0]).toEqual(mockRecipe)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty search response', async () => {
      const emptyResponse = { results: [], totalResults: 0, offset: 0, number: 0 }
      mockFetch.mockResolvedValue(emptyResponse)
      
      await store.searchRecipes({ query: 'nonexistent' })
      
      expect(store.recipes).toEqual([])
      expect(store.totalResults).toBe(0)
      expect(store.isEmpty).toBe(true)
    })

    it('handles very large total results', async () => {
      const largeResponse = { ...mockSearchResponse, totalResults: 1000 }
      mockFetch.mockResolvedValue(largeResponse)
      
      await store.searchRecipes({ query: 'chicken' })
      
      expect(store.hasMoreResults).toBe(true)
    })

    it('handles negative offset gracefully', async () => {
      mockFetch.mockResolvedValue(mockSearchResponse)
      
      await store.searchRecipes({ offset: -1 })
      
      expect(mockFetch).toHaveBeenCalledWith('/api/recipes', {
        query: {
          query: '',
          offset: 0,
          number: 12,
          addRecipeInformation: true,
          addRecipeNutrition: true,
          category: undefined,
          confirmedQuotaUsage: 'true'
        }
      })
    })
  })

  describe('API Integration', () => {
    it('includes required API parameters', async () => {
      mockFetch.mockResolvedValue(mockSearchResponse)
      
      await store.searchRecipes({ query: 'chicken' })
      
      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs).toBeDefined()
      const queryParams = callArgs![1].query
      
      expect(queryParams.addRecipeInformation).toBe(true)
      expect(queryParams.addRecipeNutrition).toBe(true)
    })

    it('handles API timeout scenarios', async () => {
      mockFetch.mockRejectedValue(new Error('Timeout'))
      
      await store.searchRecipes({ query: 'chicken' })
      
      expect(store.error).toBe('An unexpected error occurred. Please try again.')
      expect(store.loading).toBe(false)
    })
  })
})
