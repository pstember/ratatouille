import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useQuotaStore } from './quota'
import type { RecipeSearchResult, RecipeSearchParams, RecipeSearchResponse } from '~/types/recipe'
import type { EnhancedSearchResponse, SearchState } from '~/types/search'

export const useRecipesStore = defineStore('recipes', () => {
  // State
  const recipes = ref<RecipeSearchResult[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const errorType = ref<'RATE_LIMIT_EXCEEDED' | 'QUOTA_EXCEEDED' | 'GENERIC_ERROR' | null>(null)
  const retryAfter = ref<number | null>(null)
  const fallbackData = ref<RecipeSearchResult[]>([])
  const searchQuery = ref('')
  const selectedCategory = ref<string | undefined>(undefined)
  const totalResults = ref(0)
  const currentPage = ref(0)
  const itemsPerPage = ref(12)
  const searchMode = ref<'database' | 'spoonacular'>('database')
  
  // Enhanced search state
  const searchState = ref<SearchState>({
    databaseResults: [],
    apiResults: [],
    searchSource: 'database',
    showSpoonacularOption: false,
    estimatedApiCost: 0
  })
  
  const quotaStore = useQuotaStore()

  // Computed
  const hasMoreResults = computed(() => {
    return recipes.value.length < totalResults.value
  })

  const isEmpty = computed(() => {
    return !loading.value && recipes.value.length === 0
  })

  // Actions
  async function searchRecipes(params: RecipeSearchParams = {}) {
    loading.value = true
    error.value = null
    errorType.value = null
    retryAfter.value = null
    fallbackData.value = []

    try {
      const searchParams: RecipeSearchParams = {
        query: params.query || searchQuery.value,
        offset: params.offset !== undefined ? Math.max(0, params.offset) : 0,
        number: params.number || itemsPerPage.value,
        addRecipeInformation: true,
        addRecipeNutrition: true,
        category: params.category || selectedCategory.value
      }

      const response = await quotaStore.executeWithQuotaCheck(async () => {
        return await $fetch<EnhancedSearchResponse>('/api/recipes', {
          query: {
            ...searchParams,
            confirmedQuotaUsage: 'true'
          }
        })
      })

      // Update search state
      searchState.value = {
        databaseResults: response.databaseResults?.count ? response.results.filter(r => r._source === 'database') : [],
        apiResults: response.results.filter(r => !r._source || r._source === 'api'),
        searchSource: response.searchSource || 'database',
        showSpoonacularOption: !!response.spoonacularOption?.available,
        estimatedApiCost: response.spoonacularOption?.estimatedCost || 0,
        enrichmentStats: response.enrichmentStats,
        quotaInfo: response.quotaInfo,
        qualityAssessment: response.qualityAssessment
      }

      if (params.offset === 0 || !params.offset) {
        // New search - replace results
        recipes.value = response.results
        currentPage.value = 0
      } else {
        // Pagination - append results
        recipes.value.push(...response.results)
      }

      totalResults.value = response.totalResults
      searchQuery.value = searchParams.query || ''
      
      // Update selected category if provided
      if (params.category !== undefined) {
        selectedCategory.value = params.category
      }
    } catch (err: any) {
      
      if (err.message === 'QUOTA_CONFIRMATION_REQUIRED') {
        // This will be handled by the UI to show the confirmation modal
        return
      }
      
      // Handle API errors
      if (err.statusCode === 429) {
        errorType.value = 'RATE_LIMIT_EXCEEDED'
        error.value = err.data?.message || 'API rate limit reached. Please try again later.'
        retryAfter.value = err.data?.retryAfter || 60
        fallbackData.value = err.data?.fallbackData || []
        
        // Update search state for fallback data
        if (fallbackData.value.length > 0) {
          searchState.value.searchSource = err.data?.searchSource || 'database'
          searchState.value.databaseResults = fallbackData.value
          recipes.value = fallbackData.value
          totalResults.value = fallbackData.value.length
        }
      } else if (err.statusCode === 402) {
        errorType.value = 'QUOTA_EXCEEDED'
        error.value = err.data?.message || 'Daily API quota has been reached. Please try again tomorrow.'
        fallbackData.value = err.data?.fallbackData || []
        
        // Update search state for fallback data
        if (fallbackData.value.length > 0) {
          searchState.value.searchSource = err.data?.searchSource || 'database'
          searchState.value.databaseResults = fallbackData.value
          recipes.value = fallbackData.value
          totalResults.value = fallbackData.value.length
        }
      } else {
        errorType.value = 'GENERIC_ERROR'
        error.value = err.data?.message || 'An unexpected error occurred. Please try again.'
      }
    } finally {
      loading.value = false
    }
  }

  // Set search mode
  function setSearchMode(mode: 'database' | 'spoonacular') {
    searchMode.value = mode
  }

  // Search with current mode
  async function searchWithCurrentMode(params: RecipeSearchParams = {}) {
    if (searchMode.value === 'database') {
      return await searchDatabase(params)
    } else {
      return await searchSpoonacular(params)
    }
  }

  // Database-only search
  async function searchDatabase(params: RecipeSearchParams = {}) {
    loading.value = true
    error.value = null
    errorType.value = null

    try {
      const searchParams: RecipeSearchParams = {
        query: params.query || searchQuery.value,
        offset: params.offset !== undefined ? Math.max(0, params.offset) : 0,
        number: params.number || itemsPerPage.value,
        addRecipeInformation: true,
        addRecipeNutrition: true,
        category: params.category || selectedCategory.value
      }

      const response = await $fetch<EnhancedSearchResponse>('/api/recipes/search', {
        query: {
          ...searchParams,
          mode: 'database'
        }
      })

      // Update search state
      searchState.value = {
        databaseResults: response.results,
        apiResults: [],
        searchSource: 'database',
        showSpoonacularOption: false,
        estimatedApiCost: 0,
        enrichmentStats: response.enrichmentStats,
        quotaInfo: response.quotaInfo,
        qualityAssessment: response.qualityAssessment
      }

      if (params.offset === 0 || !params.offset) {
        recipes.value = response.results
        currentPage.value = 0
      } else {
        recipes.value.push(...response.results)
      }

      totalResults.value = response.totalResults
      searchQuery.value = searchParams.query || ''
      
      if (params.category !== undefined) {
        selectedCategory.value = params.category
      }
    } catch (err: any) {
      errorType.value = 'GENERIC_ERROR'
      error.value = err.data?.message || 'Database search failed. Please try again.'
    } finally {
      loading.value = false
    }
  }

  // Spoonacular search with enrichment
  async function searchSpoonacular(params: RecipeSearchParams = {}) {
    loading.value = true
    error.value = null
    errorType.value = null

    try {
      const searchParams: RecipeSearchParams = {
        query: params.query || searchQuery.value,
        offset: params.offset !== undefined ? Math.max(0, params.offset) : 0,
        number: params.number || itemsPerPage.value,
        addRecipeInformation: true,
        addRecipeNutrition: true,
        category: params.category || selectedCategory.value
      }

      const response = await quotaStore.executeWithQuotaCheck(async () => {
        return await $fetch<EnhancedSearchResponse>('/api/recipes/search', {
          query: {
            ...searchParams,
            mode: 'spoonacular',
            confirmedQuotaUsage: 'true',
            userConsent: 'true'
          }
        })
      })

      // Update search state for API results
      searchState.value = {
        ...searchState.value,
        apiResults: response.results,
        searchSource: 'spoonacular',
        showSpoonacularOption: false
      }

      if (params.offset === 0 || !params.offset) {
        recipes.value = response.results
        currentPage.value = 0
      } else {
        recipes.value.push(...response.results)
      }

      totalResults.value = response.totalResults
      searchQuery.value = searchParams.query || ''
      
    } catch (err: any) {
      
      if (err.statusCode === 429) {
        errorType.value = 'RATE_LIMIT_EXCEEDED'
        error.value = err.data?.message || 'API rate limit reached. Please try again later.'
        retryAfter.value = err.data?.retryAfter || 60
      } else if (err.statusCode === 402) {
        errorType.value = 'QUOTA_EXCEEDED'
        error.value = err.data?.message || 'Daily API quota has been reached. Please try again tomorrow.'
      } else {
        errorType.value = 'GENERIC_ERROR'
        error.value = err.data?.message || 'An unexpected error occurred. Please try again.'
      }
    } finally {
      loading.value = false
    }
  }

  async function confirmQuotaAndSearch() {
    try {
      const response = await quotaStore.confirmAndExecute()
      recipes.value = response.results
      totalResults.value = response.totalResults
    } catch (error) {
    }
  }

  async function searchSpoonacularWithConsent(params: RecipeSearchParams = {}) {
    loading.value = true
    error.value = null
    errorType.value = null

    try {
      const searchParams: RecipeSearchParams = {
        query: params.query || searchQuery.value,
        offset: params.offset !== undefined ? Math.max(0, params.offset) : 0,
        number: params.number || itemsPerPage.value,
        addRecipeInformation: true,
        addRecipeNutrition: true,
        category: params.category || selectedCategory.value
      }

      const response = await quotaStore.executeWithQuotaCheck(async () => {
        return await $fetch<EnhancedSearchResponse>('/api/recipes/spoonacular', {
          query: {
            ...searchParams,
            confirmedQuotaUsage: 'true',
            userConsent: 'true'
          }
        })
      })

      // Update search state for API results
      searchState.value = {
        ...searchState.value,
        apiResults: response.results,
        searchSource: 'api',
        showSpoonacularOption: false
      }

      // Combine with existing database results if any
      const combinedResults = [...searchState.value.databaseResults, ...response.results]
      
      if (params.offset === 0 || !params.offset) {
        // New search - replace results
        recipes.value = combinedResults
        currentPage.value = 0
      } else {
        // Pagination - append results
        recipes.value.push(...response.results)
      }

      totalResults.value = response.totalResults + searchState.value.databaseResults.length
      searchQuery.value = searchParams.query || ''
      
    } catch (err: any) {
      
      if (err.statusCode === 429) {
        errorType.value = 'RATE_LIMIT_EXCEEDED'
        error.value = err.data?.message || 'API rate limit reached. Please try again later.'
        retryAfter.value = err.data?.retryAfter || 60
      } else if (err.statusCode === 402) {
        errorType.value = 'QUOTA_EXCEEDED'
        error.value = err.data?.message || 'Daily API quota has been reached. Please try again tomorrow.'
      } else {
        errorType.value = 'GENERIC_ERROR'
        error.value = err.data?.message || 'An unexpected error occurred. Please try again.'
      }
    } finally {
      loading.value = false
    }
  }

  const retrySearch = () => {
    if (retryAfter.value && retryAfter.value > 0) {
      // Wait for retry time
      setTimeout(() => {
        searchWithCurrentMode({
          query: searchQuery.value,
          offset: 0,
          number: itemsPerPage.value,
          category: selectedCategory.value
        })
      }, retryAfter.value * 1000)
    } else {
      // Immediate retry
      searchWithCurrentMode({
        query: searchQuery.value,
        offset: 0,
        number: itemsPerPage.value,
        category: selectedCategory.value
      })
    }
  }

  async function loadMoreRecipes() {
    if (loading.value || !hasMoreResults.value) return

    const nextOffset = recipes.value.length
    await searchWithCurrentMode({
      query: searchQuery.value,
      offset: nextOffset,
      number: itemsPerPage.value,
      category: selectedCategory.value
    })
  }

  async function loadPopularRecipes() {
    loading.value = true
    error.value = null

    try {
      const response = await quotaStore.executeWithQuotaCheck(async () => {
        return await $fetch<RecipeSearchResponse>('/api/recipes', {
          query: {
            number: itemsPerPage.value,
            confirmedQuotaUsage: 'true'
          }
        })
      })

      recipes.value = response.results
      totalResults.value = response.totalResults
      searchQuery.value = ''
      selectedCategory.value = undefined
      currentPage.value = 0
    } catch (err: any) {
      if (err.message === 'QUOTA_CONFIRMATION_REQUIRED') {
        return
      }
      error.value = err instanceof Error ? err.message : 'Failed to load popular recipes'
    } finally {
      loading.value = false
    }
  }

  function clearResults() {
    recipes.value = []
    totalResults.value = 0
    currentPage.value = 0
    error.value = null
    selectedCategory.value = undefined
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  function setCategory(category: string | undefined | null) {
    selectedCategory.value = category === null ? undefined : category
  }

  // Debounced search function
  const debouncedSearch = useDebounceFn((query: string, mode?: 'database' | 'spoonacular') => {
    if (query.trim()) {
      const searchModeToUse = mode || searchMode.value
      if (searchModeToUse === 'database') {
        searchDatabase({ query: query.trim(), offset: 0 })
      } else {
        searchSpoonacular({ query: query.trim(), offset: 0 })
      }
    } else {
      loadPopularRecipes()
    }
  }, 300)

  return {
    // State
    recipes,
    loading,
    error,
    errorType,
    retryAfter,
    fallbackData,
    searchQuery,
    selectedCategory,
    totalResults,
    currentPage,
    itemsPerPage,
    searchState,
    searchMode,

    // Computed
    hasMoreResults,
    isEmpty,

    // Actions
    searchRecipes,
    searchWithCurrentMode,
    searchDatabase,
    searchSpoonacular,
    searchSpoonacularWithConsent,
    confirmQuotaAndSearch,
    setSearchMode,
    retrySearch,
    loadMoreRecipes,
    loadPopularRecipes,
    clearResults,
    setSearchQuery,
    setCategory,
    debouncedSearch
  }
})
