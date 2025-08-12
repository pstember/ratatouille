import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Mock definePageMeta globally before any imports
vi.mock('nuxt/app', () => ({
  definePageMeta: vi.fn()
}))

vi.mock('#app', () => ({
  definePageMeta: vi.fn()
}))

// Mock useRoute with proper query object
const mockRoute = {
  query: {
    q: '',
    category: '',
    cuisine: '',
    maxCookingTime: '',
    dietary: '',
    excludeAllergens: '',
    includeIngredients: '',
    sortBy: '',
    sortOrder: '',
    page: '1'
  }
}

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => mockRoute)
}))

// Mock useRoute to return the mock route object
const mockUseRoute = vi.fn(() => mockRoute)

vi.mock('#imports', () => ({
  ref: vi.fn((value) => ({ value })),
  computed: vi.fn((fn) => ({ value: fn() })),
  onMounted: vi.fn((fn) => fn()),
  watch: vi.fn(),
  definePageMeta: vi.fn(),
  $fetch: vi.fn(),
  useRoute: mockUseRoute,
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn()
  }))
}))

// Mock global definePageMeta
// @ts-ignore - Mocking definePageMeta for tests
global.definePageMeta = vi.fn()

// Mock Nuxt components
vi.mock('#components', () => ({
  RecipeSkeleton: { template: '<div class="recipe-skeleton">Loading...</div>' },
  RecipeCard: { template: '<div class="recipe-card">Recipe Card</div>' }
}))

// Now import the component after mocks are set up
const BrowsePage = await import('~/pages/browse.vue').then(m => m.default)

// Mock window.history
Object.defineProperty(window, 'history', {
  value: {
    replaceState: vi.fn()
  },
  writable: true
})

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/browse'
  },
  writable: true
})

describe('BrowsePage', () => {
  let wrapper: any
  let pinia: any
  let mockFetch: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset the mock to return the proper route object
    mockUseRoute.mockReturnValue(mockRoute)
    
    // Create mock fetch function
    mockFetch = vi.fn()
    
    // Mock $fetch
    vi.mocked(global.$fetch).mockImplementation(mockFetch)
    
    // Create pinia instance and set it as active
    pinia = createPinia()
    setActivePinia(pinia)
    
    // Mount component
    wrapper = mount(BrowsePage, {
      global: {
        plugins: [pinia],
        stubs: {
          'NuxtLink': { template: '<a><slot /></a>' }
        }
      }
    })
  })

  describe('Basic Functionality', () => {
    it('should render the page structure correctly', () => {
      // Test that the basic page structure is rendered
      expect(wrapper.find('h1').text()).toBe('🔍 Browse Recipes')
      expect(wrapper.find('h2').text()).toBe('Filters')
      expect(wrapper.find('.bg-gray-100.rounded-lg').exists()).toBe(true)
    })

    it('should have proper page layout', () => {
      // Test that the page has the expected layout elements
      expect(wrapper.find('.min-h-screen').exists()).toBe(true)
      expect(wrapper.find('.bg-white').exists()).toBe(true)
      expect(wrapper.find('.max-w-7xl').exists()).toBe(true)
    })
  })
})
