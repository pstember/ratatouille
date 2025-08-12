import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SearchBar from '~/components/SearchBar.vue'

// Mock the recipes store
const mockSetSearchMode = vi.fn()
const mockDebouncedSearch = vi.fn()
const mockSearchWithCurrentMode = vi.fn()
const mockLoadPopularRecipes = vi.fn()

vi.mock('~/stores/recipes', () => ({
  useRecipesStore: () => ({
    setSearchMode: mockSetSearchMode,
    debouncedSearch: mockDebouncedSearch,
    searchWithCurrentMode: mockSearchWithCurrentMode,
    loadPopularRecipes: mockLoadPopularRecipes
  })
}))

describe('SearchBar Toggle Switch', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should render toggle switch with database and spoonacular options', () => {
    const wrapper = mount(SearchBar)
    
    // Check that both toggle buttons exist
    expect(wrapper.text()).toContain('Database')
    expect(wrapper.text()).toContain('Spoonacular')
    
    // Check that database is selected by default
    const databaseButton = wrapper.findAll('button').find(btn => btn.text().includes('Database'))
    const spoonacularButton = wrapper.findAll('button').find(btn => btn.text().includes('Spoonacular'))
    
    expect(databaseButton).toBeTruthy()
    expect(spoonacularButton).toBeTruthy()
  })

  it('should call setSearchMode when database button is clicked', async () => {
    const wrapper = mount(SearchBar)
    
    const databaseButton = wrapper.findAll('button').find(btn => btn.text().includes('Database'))
    expect(databaseButton).toBeTruthy()
    await databaseButton!.trigger('click')
    
    expect(mockSetSearchMode).toHaveBeenCalledWith('database')
  })

  it('should call setSearchMode when spoonacular button is clicked', async () => {
    const wrapper = mount(SearchBar)
    
    const spoonacularButton = wrapper.findAll('button').find(btn => btn.text().includes('Spoonacular'))
    expect(spoonacularButton).toBeTruthy()
    await spoonacularButton!.trigger('click')
    
    expect(mockSetSearchMode).toHaveBeenCalledWith('spoonacular')
  })

  it('should update placeholder text based on search mode', async () => {
    const wrapper = mount(SearchBar)
    
    const input = wrapper.find('input[type="text"]')
    
    // Default should be database mode
    expect(input.attributes('placeholder')).toContain('Search local recipes')
    
    // Switch to spoonacular mode
    const spoonacularButton = wrapper.findAll('button').find(btn => btn.text().includes('Spoonacular'))
    expect(spoonacularButton).toBeTruthy()
    await spoonacularButton!.trigger('click')
    
    // Wait for next tick to allow reactive updates
    await wrapper.vm.$nextTick()
    
    expect(input.attributes('placeholder')).toContain('Search external recipes')
  })

  it('should call searchWithCurrentMode when enter is pressed', async () => {
    const wrapper = mount(SearchBar)
    
    const input = wrapper.find('input[type="text"]')
    await input.setValue('chicken')
    await input.trigger('keydown.enter')
    
    expect(mockSearchWithCurrentMode).toHaveBeenCalledWith({
      query: 'chicken',
      offset: 0
    })
  })

  it('should call debouncedSearch with correct mode when input changes', async () => {
    const wrapper = mount(SearchBar)
    
    const input = wrapper.find('input[type="text"]')
    await input.setValue('pasta')
    
    // Wait for debounced search to be called
    await new Promise(resolve => setTimeout(resolve, 350))
    
    expect(mockDebouncedSearch).toHaveBeenCalledWith('pasta', 'database')
  })
})
