import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SearchSourceIndicator from '~/components/SearchSourceIndicator.vue'
import type { SearchState } from '~/types/search'

describe('SearchSourceIndicator', () => {
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  const createSearchState = (overrides: Partial<SearchState> = {}): SearchState => ({
    databaseResults: [],
    apiResults: [],
    searchSource: 'database',
    showSpoonacularOption: false,
    estimatedApiCost: 0,
    ...overrides
  })

  describe('Database Results Display', () => {
    it('should display database results when search source is database', () => {
      const searchState = createSearchState({
        searchSource: 'database',
        databaseResults: [{ id: 1, title: 'Test Recipe' } as any]
      })

      const wrapper = mount(SearchSourceIndicator, {
        props: { searchState }
      })

      expect(wrapper.text()).toContain('From Your Database')
      expect(wrapper.text()).toContain('1 recipe')
    })

    it('should display quality assessment when available', () => {
      const searchState = createSearchState({
        searchSource: 'database',
        databaseResults: [{ id: 1, title: 'Test Recipe' } as any],
        qualityAssessment: {
          isSufficient: true,
          reason: 'Found 5 recipes in database',
          suggestedAction: 'use_database'
        }
      })

      const wrapper = mount(SearchSourceIndicator, {
        props: { searchState }
      })

      expect(wrapper.text()).toContain('Found 5 recipes in database')
      expect(wrapper.find('.quality-badge.sufficient').exists()).toBe(true)
    })

    it('should display insufficient quality assessment', () => {
      const searchState = createSearchState({
        searchSource: 'database',
        databaseResults: [{ id: 1, title: 'Test Recipe' } as any],
        qualityAssessment: {
          isSufficient: false,
          reason: 'Only found 1 recipe',
          suggestedAction: 'offer_spoonacular'
        }
      })

      const wrapper = mount(SearchSourceIndicator, {
        props: { searchState }
      })

      expect(wrapper.text()).toContain('Only found 1 recipe')
      expect(wrapper.find('.quality-badge.insufficient').exists()).toBe(true)
    })
  })

  describe('Spoonacular Option', () => {
    it('should display Spoonacular option when showSpoonacularOption is true', () => {
      const searchState = createSearchState({
        showSpoonacularOption: true,
        estimatedApiCost: 1
      })

      const wrapper = mount(SearchSourceIndicator, {
        props: { searchState }
      })

      expect(wrapper.text()).toContain('Search More Recipes')
      expect(wrapper.text()).toContain('1 credit')
      expect(wrapper.text()).toContain('Search thousands more recipes')
    })

    it('should emit searchSpoonacular event when button is clicked', async () => {
      const searchState = createSearchState({
        showSpoonacularOption: true,
        estimatedApiCost: 1
      })

      const wrapper = mount(SearchSourceIndicator, {
        props: { searchState }
      })

      const button = wrapper.find('.btn-primary')
      await button.trigger('click')

      expect(wrapper.emitted('searchSpoonacular')).toBeTruthy()
    })

    it('should disable button when loading', () => {
      const searchState = createSearchState({
        showSpoonacularOption: true,
        estimatedApiCost: 1
      })

      const wrapper = mount(SearchSourceIndicator, {
        props: { searchState, loading: true }
      })

      const button = wrapper.find('.btn-primary')
      expect(button.attributes('disabled')).toBeDefined()
      expect(wrapper.text()).toContain('Searching...')
    })
  })

  describe('API Results Display', () => {
    it('should display API results when search source is api', () => {
      const searchState = createSearchState({
        searchSource: 'api',
        apiResults: [{ id: 1, title: 'API Recipe' } as any]
      })

      const wrapper = mount(SearchSourceIndicator, {
        props: { searchState }
      })

      expect(wrapper.text()).toContain('From External API')
      expect(wrapper.text()).toContain('1 recipe')
    })

    it('should display mixed results when search source is mixed', () => {
      const searchState = createSearchState({
        searchSource: 'mixed',
        databaseResults: [{ id: 1, title: 'DB Recipe' } as any],
        apiResults: [{ id: 2, title: 'API Recipe' } as any]
      })

      const wrapper = mount(SearchSourceIndicator, {
        props: { searchState }
      })

      expect(wrapper.text()).toContain('From Your Database')
      expect(wrapper.text()).toContain('From External API')
      expect(wrapper.text()).toContain('1 recipe') // Database
      expect(wrapper.text()).toContain('1 recipe') // API
    })
  })

  describe('Conditional Rendering', () => {
    it('should not render when search source is database and no Spoonacular option', () => {
      const searchState = createSearchState({
        searchSource: 'database',
        showSpoonacularOption: false
      })

      const wrapper = mount(SearchSourceIndicator, {
        props: { searchState }
      })

      // Should not render the main indicator when only database results and no option
      expect(wrapper.find('.database-results').exists()).toBe(false)
      expect(wrapper.find('.spoonacular-option').exists()).toBe(false)
      expect(wrapper.find('.api-results').exists()).toBe(false)
    })

    it('should render when search source is not database', () => {
      const searchState = createSearchState({
        searchSource: 'api'
      })

      const wrapper = mount(SearchSourceIndicator, {
        props: { searchState }
      })

      expect(wrapper.find('.api-results').exists()).toBe(true)
    })

    it('should render when Spoonacular option is available', () => {
      const searchState = createSearchState({
        searchSource: 'database',
        showSpoonacularOption: true
      })

      const wrapper = mount(SearchSourceIndicator, {
        props: { searchState }
      })

      expect(wrapper.find('.spoonacular-option').exists()).toBe(true)
    })
  })

  describe('Element Structure', () => {
    it('should have database badge element', () => {
      const searchState = createSearchState({
        searchSource: 'database',
        databaseResults: [{ id: 1, title: 'Test Recipe' } as any]
      })

      const wrapper = mount(SearchSourceIndicator, {
        props: { searchState }
      })

      const badge = wrapper.find('.source-badge.database')
      expect(badge.exists()).toBe(true)
    })

    it('should have API badge element', () => {
      const searchState = createSearchState({
        searchSource: 'api',
        apiResults: [{ id: 1, title: 'Test Recipe' } as any]
      })

      const wrapper = mount(SearchSourceIndicator, {
        props: { searchState }
      })

      const badge = wrapper.find('.source-badge.api')
      expect(badge.exists()).toBe(true)
    })

    it('should have primary button element', () => {
      const searchState = createSearchState({
        showSpoonacularOption: true,
        estimatedApiCost: 1
      })

      const wrapper = mount(SearchSourceIndicator, {
        props: { searchState }
      })

      const button = wrapper.find('.btn-primary')
      expect(button.exists()).toBe(true)
    })
  })
})
