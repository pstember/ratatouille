import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SearchBar from '~/components/SearchBar.vue'
import { setupTestEnvironment, cleanupTestEnvironment } from '~/tests/setup/test-utils'

// Mock the recipes store
const mockRecipesStore = {
  debouncedSearch: vi.fn(),
  searchRecipes: vi.fn(),
  loadPopularRecipes: vi.fn(),
  setSearchMode: vi.fn(),
  searchWithCurrentMode: vi.fn()
}

// Mock the store import
vi.mock('~/stores/recipes', () => ({
  useRecipesStore: () => mockRecipesStore
}))

describe('SearchBar Component', () => {
  let pinia: any

  beforeEach(() => {
    pinia = setupTestEnvironment()
    cleanupTestEnvironment()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial Rendering', () => {
    it('renders search input with correct placeholder', () => {
      const wrapper = mount(SearchBar, {
        global: { plugins: [pinia] }
      })

      const input = wrapper.find('input')
      expect(input.exists()).toBe(true)
      expect(input.attributes('placeholder')).toBe('Search local recipes...')
    })

    it('renders search icon', () => {
      const wrapper = mount(SearchBar, {
        global: { plugins: [pinia] }
      })

      const searchIcon = wrapper.find('svg')
      expect(searchIcon.exists()).toBe(true)
    })

    it('renders search tips', () => {
      const wrapper = mount(SearchBar, {
        global: { plugins: [pinia] }
      })

      // Search tips are not shown by default, only when showSuggestions is true
      expect(wrapper.find('.search-tips').exists()).toBe(false)
    })

    it('does not show clear button initially', () => {
      const wrapper = mount(SearchBar, {
        global: { plugins: [pinia] }
      })

      // The clear button is only shown when searchInput has a value
      const clearButton = wrapper.find('button svg[stroke="currentColor"]')
      expect(clearButton.exists()).toBe(false)
    })
  })

  describe('Search Input Functionality', () => {
    it('updates search input value', async () => {
      const wrapper = mount(SearchBar, {
        global: { plugins: [pinia] }
      })

      const input = wrapper.find('input')
      await input.setValue('chicken')

      expect(input.element.value).toBe('chicken')
    })

    it('calls handleSearch on input', async () => {
      const wrapper = mount(SearchBar, {
        global: { plugins: [pinia] }
      })

      const input = wrapper.find('input')
      await input.setValue('chicken')
      await input.trigger('input')

      expect(mockRecipesStore.debouncedSearch).toHaveBeenCalledWith('chicken', 'database')
    })

    it('shows clear button when input has value', async () => {
      const wrapper = mount(SearchBar, {
        global: { plugins: [pinia] }
      })

      const input = wrapper.find('input')
      await input.setValue('chicken')

      // Wait for next tick to allow reactive updates
      await wrapper.vm.$nextTick()

      // Look for the clear button (X icon)
      const clearButton = wrapper.find('button svg[stroke="currentColor"]')
      expect(clearButton.exists()).toBe(true)
    })
  })

  describe('Clear Search Functionality', () => {
    it('clears input when clear button is clicked', async () => {
      const wrapper = mount(SearchBar, {
        global: { plugins: [pinia] }
      })

      const input = wrapper.find('input')
      await input.setValue('chicken')

      // Wait for next tick to allow reactive updates
      await wrapper.vm.$nextTick()

      // Find the clear button by looking for the button that contains the X icon
      const clearButton = wrapper.findAll('button').find(btn => btn.html().includes('M6 18L18 6M6 6l12 12'))
      expect(clearButton).toBeTruthy()
      await clearButton!.trigger('click')

      // Wait for next tick to allow reactive updates
      await wrapper.vm.$nextTick()

      expect(input.element.value).toBe('')
    })

    it('calls loadPopularRecipes when clearing search', async () => {
      const wrapper = mount(SearchBar, {
        global: { plugins: [pinia] }
      })

      const input = wrapper.find('input')
      await input.setValue('chicken')

      // Wait for next tick to allow reactive updates
      await wrapper.vm.$nextTick()

      const clearButton = wrapper.findAll('button').find(btn => btn.html().includes('M6 18L18 6M6 6l12 12'))
      await clearButton!.trigger('click')

      expect(mockRecipesStore.loadPopularRecipes).toHaveBeenCalled()
    })
  })

  describe('Enter Key Handling', () => {
    it('calls searchWithCurrentMode on enter key with trimmed input', async () => {
      const wrapper = mount(SearchBar, {
        global: { plugins: [pinia] }
      })

      const input = wrapper.find('input')
      await input.setValue('chicken')
      await input.trigger('keydown.enter')

      expect(mockRecipesStore.searchWithCurrentMode).toHaveBeenCalledWith({
        query: 'chicken',
        offset: 0
      })
    })

    it('does not search on enter with empty input', async () => {
      const wrapper = mount(SearchBar, {
        global: { plugins: [pinia] }
      })

      const input = wrapper.find('input')
      await input.trigger('keydown.enter')

      expect(mockRecipesStore.searchWithCurrentMode).not.toHaveBeenCalled()
    })
  })

  describe('Component Lifecycle', () => {
    it('loads popular recipes on mount', () => {
      mount(SearchBar, {
        global: { plugins: [pinia] }
      })

      expect(mockRecipesStore.loadPopularRecipes).toHaveBeenCalled()
    })
  })

  describe('Styling and Accessibility', () => {
    it('applies correct CSS classes', () => {
      const wrapper = mount(SearchBar, {
        global: { plugins: [pinia] }
      })

      expect(wrapper.classes()).toContain('w-full')
    })

    it('has proper input attributes', () => {
      const wrapper = mount(SearchBar, {
        global: { plugins: [pinia] }
      })

      const input = wrapper.find('input')
      expect(input.attributes('type')).toBe('text')
      expect(input.attributes('placeholder')).toBe('Search local recipes...')
    })

    it('applies focus styles', async () => {
      const wrapper = mount(SearchBar, {
        global: { plugins: [pinia] }
      })

      const input = wrapper.find('input')
      await input.trigger('focus')

      // Check if the input has focus classes
      expect(input.classes()).toContain('focus:ring-2')
      expect(input.classes()).toContain('focus:ring-orange-500')
    })
  })

  describe('Edge Cases', () => {
    it('handles very long search input', async () => {
      const wrapper = mount(SearchBar, {
        global: { plugins: [pinia] }
      })

      const longInput = 'a'.repeat(500)
      const input = wrapper.find('input')
      await input.setValue(longInput)

      expect(input.element.value).toBe(longInput)
      expect(mockRecipesStore.debouncedSearch).toHaveBeenCalledWith(longInput, 'database')
    })

    it('handles special characters in search', async () => {
      const wrapper = mount(SearchBar, {
        global: { plugins: [pinia] }
      })

      const specialInput = 'chicken & pasta (quick)'
      const input = wrapper.find('input')
      await input.setValue(specialInput)

      expect(mockRecipesStore.debouncedSearch).toHaveBeenCalledWith(specialInput, 'database')
    })

    it('handles whitespace-only input', async () => {
      const wrapper = mount(SearchBar, {
        global: { plugins: [pinia] }
      })

      const input = wrapper.find('input')
      await input.setValue('   ')
      await input.trigger('keydown.enter')

      expect(mockRecipesStore.searchWithCurrentMode).not.toHaveBeenCalled()
    })
  })
})
