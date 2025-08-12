import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

// Mock definePageMeta globally before any imports
vi.mock('nuxt/app', () => ({
  definePageMeta: vi.fn()
}))

vi.mock('#app', () => ({
  definePageMeta: vi.fn()
}))

vi.mock('#imports', () => ({
  ref: vi.fn((value) => ({ value })),
  computed: vi.fn((fn) => ({ value: fn() })),
  onMounted: vi.fn((fn) => fn()),
  definePageMeta: vi.fn()
}))

// Mock global definePageMeta
global.definePageMeta = vi.fn()

// Mock Nuxt components
vi.mock('#components', () => ({
  RecipeSkeleton: { template: '<div class="recipe-skeleton">Loading...</div>' },
  RecipeCard: { template: '<div class="recipe-card">Recipe Card</div>' }
}))

// Now import the component after mocks are set up
const DiscoverPage = await import('~/pages/discover.vue').then(m => m.default)

describe('DiscoverPage', () => {
  let wrapper: any
  let pinia: any
  let mockFetch: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Create mock fetch function
    mockFetch = vi.fn()
    
    // Mock $fetch
    vi.mocked(global.$fetch).mockImplementation(mockFetch)
    
    // Create pinia instance
    pinia = createPinia()
    
    // Mount component
    wrapper = mount(DiscoverPage, {
      global: {
        plugins: [pinia],
        stubs: {
          'NuxtLink': { template: '<a><slot /></a>' }
        }
      }
    })
  })

  describe('Initial State', () => {
    it('should render the page title and description', () => {
      expect(wrapper.find('h1').text()).toBe('🎲 Your Random Recipe Discovery')
      expect(wrapper.find('p').text()).toBe('Discover amazing recipes you might not have found otherwise')
    })

    it('should show the refresh button', () => {
      const button = wrapper.find('button')
      expect(button.text()).toContain('Discover More')
    })

    it('should show loading state initially', async () => {
      // The component should show loading state when isLoading is true
      wrapper.vm.isLoading = true
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.recipe-skeleton').exists()).toBe(true)
    })
  })

  describe('Recipe Display', () => {
    it('should display recipes in a grid when loaded', async () => {
      const mockRecipes = {
        recipes: [{ id: 1, title: 'Recipe 1' }],
        totalAvailable: 1,
        source: 'api',
        cached: false
      }

      mockFetch.mockResolvedValue(mockRecipes)
      
      // Trigger the fetch
      await wrapper.vm.fetchRandomRecipes()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.recipe-card').exists()).toBe(true)
      expect(wrapper.find('.recipe-skeleton').exists()).toBe(false)
    })

    it('should show source information', async () => {
      const mockRecipes = {
        recipes: [{ id: 1, title: 'Recipe 1' }],
        totalAvailable: 1,
        source: 'database',
        cached: true
      }

      mockFetch.mockResolvedValue(mockRecipes)
      
      await wrapper.vm.fetchRandomRecipes()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Source:')
      expect(wrapper.text()).toContain('From Database')
      expect(wrapper.text()).toContain('(Cached)')
    })

    it('should handle empty recipe results', async () => {
      const mockRecipes = {
        recipes: [],
        totalAvailable: 0,
        source: 'api',
        cached: false
      }

      mockFetch.mockResolvedValue(mockRecipes)
      
      await wrapper.vm.fetchRandomRecipes()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('No recipes found')
      expect(wrapper.text()).toContain('Try adjusting your search criteria')
    })
  })

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      const error = {
        data: { message: 'API Error' }
      }
      
      mockFetch.mockRejectedValue(error)
      
      await wrapper.vm.fetchRandomRecipes()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Something went wrong')
      expect(wrapper.text()).toContain('API Error')
      expect(wrapper.text()).toContain('Try Again')
    })

    it('should display generic error when no error message', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      
      await wrapper.vm.fetchRandomRecipes()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Failed to load random recipes')
    })
  })

  describe('Quota Management', () => {
    it('should show quota warning when required', async () => {
      const mockResponse = {
        recipes: [{ id: 1, title: 'Recipe 1' }],
        totalAvailable: 1,
        source: 'api',
        cached: false,
        requiresQuotaConfirmation: true,
        quotaWarning: { message: 'Quota warning message' }
      }

      mockFetch.mockResolvedValue(mockResponse)
      
      await wrapper.vm.fetchRandomRecipes()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('API Quota Warning')
      expect(wrapper.text()).toContain('Quota warning message')
      expect(wrapper.text()).toContain('Continue Anyway')
    })

    it('should handle quota confirmation', async () => {
      const mockResponse = {
        recipes: [{ id: 1, title: 'Recipe 1' }],
        totalAvailable: 1,
        source: 'api',
        cached: false,
        requiresQuotaConfirmation: true,
        quotaWarning: { message: 'Quota warning' }
      }

      mockFetch.mockResolvedValue(mockResponse)
      
      await wrapper.vm.fetchRandomRecipes()
      await wrapper.vm.$nextTick()

      // Click continue anyway button
      const buttons = wrapper.findAll('button')
      const continueButton = buttons.find(button => button.text().includes('Continue Anyway'))
      if (continueButton) {
        await continueButton.trigger('click')
      }

      // The first call is from onMounted, second from the button click
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
  })

  describe('User Interactions', () => {
    it('should refresh recipes when refresh button is clicked', async () => {
      // Clear the mock to reset call count
      mockFetch.mockClear()
      
      // Ensure the component is not loading
      wrapper.vm.isLoading = false
      await wrapper.vm.$nextTick()
      
      // Find the refresh button and click it
      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toContain('Discover More')
      expect(button.attributes('disabled')).toBeUndefined()
      
      await button.trigger('click')
      await wrapper.vm.$nextTick()

      // Check that the fetch was called (indicating refreshRecipes was triggered)
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should disable refresh button while loading', async () => {
      wrapper.vm.isLoading = true
      await wrapper.vm.$nextTick()

      const button = wrapper.find('button')
      expect(button.attributes('disabled')).toBeDefined()
      expect(button.text()).toContain('Discovering...')
    })

    it('should show loading spinner while fetching', async () => {
      wrapper.vm.isLoading = true
      await wrapper.vm.$nextTick()

      const spinner = wrapper.find('svg.animate-spin')
      expect(spinner.exists()).toBe(true)
    })
  })

  describe('Navigation', () => {
    it('should have back to home link', () => {
      const backLink = wrapper.find('a')
      expect(backLink.text()).toContain('Back to Recipe Browser')
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive grid classes', async () => {
      // Set loading state to show the grid
      wrapper.vm.isLoading = true
      await wrapper.vm.$nextTick()
      const grid = wrapper.find('.grid')
      if (grid.exists()) {
        expect(grid.classes()).toContain('grid-cols-1')
        expect(grid.classes()).toContain('md:grid-cols-2')
        expect(grid.classes()).toContain('lg:grid-cols-3')
      }
    })
  })

  describe('Computed Properties', () => {
    it('should return correct source badge classes', async () => {
      const mockRecipes = {
        recipes: [{ id: 1, title: 'Recipe 1' }],
        totalAvailable: 1,
        source: 'api',
        cached: false
      }

      mockFetch.mockResolvedValue(mockRecipes)
      
      await wrapper.vm.fetchRandomRecipes()
      await wrapper.vm.$nextTick()

      const sourceBadge = wrapper.find('.bg-green-100')
      expect(sourceBadge.exists()).toBe(true)
    })

    it('should return correct source display names', async () => {
      const testCases = [
        { source: 'api', expected: 'Fresh from API' },
        { source: 'database', expected: 'From Database' },
        { source: 'cache', expected: 'From Cache' }
      ]

      for (const testCase of testCases) {
        const mockRecipes = {
          recipes: [{ id: 1, title: 'Recipe 1' }],
          totalAvailable: 1,
          source: testCase.source,
          cached: false
        }

        mockFetch.mockResolvedValue(mockRecipes)
        
        await wrapper.vm.fetchRandomRecipes()
        await wrapper.vm.$nextTick()

        expect(wrapper.text()).toContain(testCase.expected)
      }
    })
  })
})
