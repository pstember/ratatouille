# State Management & Stores Specification

## Overview

This specification defines the state management architecture, Pinia stores, composables, and data flow patterns for the Ratatouille Recipe Discovery Platform.

## State Management Architecture

### Pinia Store Structure

```
stores/
├── recipes.ts           # Recipe search and listing state
├── currentRecipe.ts     # Individual recipe detail state
└── composables/         # Reusable state logic
    ├── useSearch.ts     # Search functionality
    ├── useFilters.ts    # Filter management
    └── usePagination.ts # Pagination logic
```

### State Flow Diagram

```
User Action → Store Action → API Call → State Update → UI Re-render
     ↑                                                      ↓
     └─────────────── Reactive State ←──────────────────────┘
```

## Store Specifications

### Quota Store

**File**: `stores/quota.ts`

**Purpose**: Manages API quota information and quota-aware API calls

**Key Features**:
- Initial quota loading on app startup
- Real-time quota updates from API responses
- Quota confirmation dialogs for high usage
- Automatic quota tracking and monitoring

**State**:
```typescript
const quotaInfo = ref<QuotaInfo | null>(null)
const requiresConfirmation = ref(false)
const pendingRequest = ref<(() => Promise<any>) | null>(null)
```

**Actions**:
```typescript
// Load initial quota information
async function loadQuotaInfo() {
  try {
    const response = await $fetch('/api/quota')
    if (response && response.quotaInfo) {
      quotaInfo.value = response.quotaInfo
      requiresConfirmation.value = false
    }
  } catch (error) {
    console.error('Failed to load quota info:', error)
  }
}

// Update quota info from any API response
function updateQuotaFromResponse(response: any) {
  if (response && response.quotaInfo) {
    quotaInfo.value = response.quotaInfo
    requiresConfirmation.value = response.requiresQuotaConfirmation || false
    console.log('Updated quota info from API response:', response.quotaInfo)
  }
}

// Execute API call with quota checking
async function executeWithQuotaCheck<T>(apiCall: () => Promise<T>): Promise<T> {
  // Check current quota
  const currentQuota = await checkQuota()
  
  if (currentQuota && shouldRequireConfirmation(currentQuota)) {
    // Show confirmation dialog
    requiresConfirmation.value = true
    pendingRequest.value = apiCall
    
    // Wait for user confirmation
    return new Promise((resolve, reject) => {
      // Handle confirmation/cancellation
    })
  }
  
  // Execute API call directly
  return await apiCall()
}
```

**Integration**:
- Used by all stores for quota-aware API calls
- Integrated with client-side interceptor for automatic updates
- Provides quota information to QuotaGauge component

### Recipes Store

**Purpose**: Manage recipe search, filtering, and listing state

```typescript
// stores/recipes.ts
export const useRecipesStore = defineStore('recipes', () => {
  // State
  const recipes = ref<Recipe[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalResults = ref(0)
  const currentPage = ref(1)
  const itemsPerPage = ref(20)
  
  // Search and filter state
  const searchQuery = ref('')
  const selectedCuisine = ref<string | null>(null)
  const selectedDiet = ref<string | null>(null)
  const maxReadyTime = ref<number | null>(null)
  const recipeType = ref<string | null>(null)
  
  // Computed properties
  const hasResults = computed(() => recipes.value.length > 0)
  const totalPages = computed(() => Math.ceil(totalResults.value / itemsPerPage.value)
  const offset = computed(() => (currentPage.value - 1) * itemsPerPage.value)
  
  // Search parameters
  const searchParams = computed(() => ({
    query: searchQuery.value,
    offset: offset.value,
    number: itemsPerPage.value,
    cuisine: selectedCuisine.value,
    diet: selectedDiet.value,
    maxReadyTime: maxReadyTime.value,
    type: recipeType.value,
    addRecipeInformation: true,
    addRecipeNutrition: true
  }))
  
  // Actions
  const fetchRecipes = async (params?: Partial<RecipeSearchParams>) => {
    loading.value = true
    error.value = null
    
    try {
      const searchParams = params || searchParams.value
      const response = await $fetch<RecipeSearchResponse>('/api/recipes', {
        params: searchParams
      })
      
      recipes.value = response.results
      totalResults.value = response.totalResults
      currentPage.value = 1
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch recipes'
      recipes.value = []
    } finally {
      loading.value = false
    }
  }
  
  const searchRecipes = async (query: string) => {
    searchQuery.value = query
    await fetchRecipes()
  }
  
  const filterByCuisine = async (cuisine: string | null) => {
    selectedCuisine.value = cuisine
    await fetchRecipes()
  }
  
  const filterByDiet = async (diet: string | null) => {
    selectedDiet.value = diet
    await fetchRecipes()
  }
  
  const filterByTime = async (maxTime: number | null) => {
    maxReadyTime.value = maxTime
    await fetchRecipes()
  }
  
  const filterByType = async (type: string | null) => {
    recipeType.value = type
    await fetchRecipes()
  }
  
  const loadMoreRecipes = async () => {
    if (loading.value || currentPage.value >= totalPages.value) return
    
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<RecipeSearchResponse>('/api/recipes', {
        params: {
          ...searchParams.value,
          offset: offset.value + itemsPerPage.value
        }
      })
      
      recipes.value.push(...response.results)
      currentPage.value++
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load more recipes'
    } finally {
      loading.value = false
    }
  }
  
  const clearFilters = async () => {
    searchQuery.value = ''
    selectedCuisine.value = null
    selectedDiet.value = null
    maxReadyTime.value = null
    recipeType.value = null
    await fetchRecipes()
  }
  
  const resetState = () => {
    recipes.value = []
    loading.value = false
    error.value = null
    totalResults.value = 0
    currentPage.value = 1
    searchQuery.value = ''
    selectedCuisine.value = null
    selectedDiet.value = null
    maxReadyTime.value = null
    recipeType.value = null
  }
  
  return {
    // State
    recipes: readonly(recipes),
    loading: readonly(loading),
    error: readonly(error),
    totalResults: readonly(totalResults),
    currentPage: readonly(currentPage),
    itemsPerPage: readonly(itemsPerPage),
    searchQuery: readonly(searchQuery),
    selectedCuisine: readonly(selectedCuisine),
    selectedDiet: readonly(selectedDiet),
    maxReadyTime: readonly(maxReadyTime),
    recipeType: readonly(recipeType),
    
    // Computed
    hasResults,
    totalPages,
    offset,
    searchParams,
    
    // Actions
    fetchRecipes,
    searchRecipes,
    filterByCuisine,
    filterByDiet,
    filterByTime,
    filterByType,
    loadMoreRecipes,
    clearFilters,
    resetState
  }
})
```

### Current Recipe Store

**Purpose**: Manage individual recipe detail state

```typescript
// stores/currentRecipe.ts
export const useCurrentRecipeStore = defineStore('currentRecipe', () => {
  // State
  const recipe = ref<Recipe | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const cached = ref(false)
  
  // Computed properties
  const hasRecipe = computed(() => recipe.value !== null)
  const recipeId = computed(() => recipe.value?.externalId)
  const isNew = computed(() => recipe.value?.isNew ?? false)
  
  // Actions
  const fetchRecipe = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<RecipeDetailResponse>(`/api/recipe/${id}`)
      recipe.value = response.recipe
      cached.value = response.cached
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch recipe'
      recipe.value = null
    } finally {
      loading.value = false
    }
  }
  
  const markAsViewed = async () => {
    if (!recipe.value) return
    
    try {
      await $fetch(`/api/recipe/${recipe.value.externalId}/view`, {
        method: 'POST'
      })
      recipe.value.isNew = false
    } catch (err) {
      console.error('Failed to mark recipe as viewed:', err)
    }
  }
  
  const resetState = () => {
    recipe.value = null
    loading.value = false
    error.value = null
    cached.value = false
  }
  
  return {
    // State
    recipe: readonly(recipe),
    loading: readonly(loading),
    error: readonly(error),
    cached: readonly(cached),
    
    // Computed
    hasRecipe,
    recipeId,
    isNew,
    
    // Actions
    fetchRecipe,
    markAsViewed,
    resetState
  }
})
```

### Quota Store

**Purpose**: Manage API quota information, monitoring, and user confirmation

```typescript
// stores/quota.ts
export const useQuotaStore = defineStore('quota', () => {
  const quotaInfo = ref<QuotaInfo | null>(null)
  const requiresConfirmation = ref(false)
  const pendingRequest = ref<(() => Promise<any>) | null>(null)
  
  // Load initial quota information
  async function loadQuotaInfo() {
    try {
      const response = await $fetch('/api/quota')
      if (response && response.quotaInfo) {
        quotaInfo.value = response.quotaInfo
        requiresConfirmation.value = false
      }
    } catch (error) {
      console.error('Failed to load quota info:', error)
      // Don't throw error, just log it - quota info is not critical for app functionality
    }
  }
  
  // Update quota info from any API response
  function updateQuotaFromResponse(response: any) {
    if (response && response.quotaInfo) {
      quotaInfo.value = response.quotaInfo
      requiresConfirmation.value = response.requiresQuotaConfirmation || false
    }
  }
  
  // Execute request and extract quota info from response
  async function executeWithQuotaCheck<T>(requestFn: () => Promise<T>): Promise<T> {
    // Check if we need confirmation before making the request
    if (requiresConfirmation.value && quotaInfo.value) {
      // Store the pending request
      pendingRequest.value = requestFn
      // Return a special response that triggers the confirmation modal
      throw new Error('QUOTA_CONFIRMATION_REQUIRED')
    }
    
    // Execute the request and extract quota info from response
    const response = await requestFn()
    updateQuotaFromResponse(response)
    
    return response
  }
  
  async function confirmAndExecute(): Promise<any> {
    if (!pendingRequest.value) {
      throw new Error('No pending request to execute')
    }
    
    const requestFn = pendingRequest.value
    pendingRequest.value = null
    
    // Add confirmation flag to the request
    const response = await requestFn()
    updateQuotaFromResponse(response)
    
    return response
  }
  
  function cancelPendingRequest() {
    pendingRequest.value = null
    requiresConfirmation.value = false
  }
  
  // Reset quota tracking at midnight UTC
  function resetDailyQuota() {
    const now = new Date()
    const utcMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    utcMidnight.setUTCHours(0, 0, 0, 0)
    
    const timeUntilReset = utcMidnight.getTime() - now.getTime()
    
    // Schedule reset at midnight UTC
    setTimeout(() => {
      quotaInfo.value = null
      requiresConfirmation.value = false
      console.log('Daily quota tracking reset')
    }, timeUntilReset)
  }
  
  return {
    quotaInfo,
    requiresConfirmation,
    pendingRequest,
    updateQuotaFromResponse,
    executeWithQuotaCheck,
    confirmAndExecute,
    cancelPendingRequest,
    loadQuotaInfo,
    resetDailyQuota
  }
})
```

**Key Features**:
- **Initial Loading**: `loadQuotaInfo()` fetches quota data on app startup
- **Real-time Updates**: `updateQuotaFromResponse()` updates quota from API responses
- **Confirmation System**: `executeWithQuotaCheck()` handles quota confirmation requirements
- **Daily Reset**: `resetDailyQuota()` automatically resets quota tracking at midnight UTC
- **Error Handling**: Graceful fallback if quota loading fails

## Composable Specifications

### Search Composable

**Purpose**: Reusable search functionality

```typescript
// composables/useSearch.ts
export function useSearch() {
  const searchQuery = ref('')
  const searchHistory = ref<string[]>([])
  const suggestions = ref<string[]>([])
  
  // Debounced search
  const debouncedSearch = useDebounceFn(async (query: string) => {
    if (!query.trim()) {
      suggestions.value = []
      return
    }
    
    try {
      // Get search suggestions from API
      const response = await $fetch<string[]>('/api/search/suggestions', {
        params: { q: query }
      })
      suggestions.value = response
    } catch (err) {
      console.error('Failed to get search suggestions:', err)
      suggestions.value = []
    }
  }, 300)
  
  const performSearch = async (query: string) => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return
    
    // Add to search history
    if (!searchHistory.value.includes(trimmedQuery)) {
      searchHistory.value.unshift(trimmedQuery)
      searchHistory.value = searchHistory.value.slice(0, 10) // Keep last 10
    }
    
    searchQuery.value = trimmedQuery
    suggestions.value = []
    
    // Emit search event
    return trimmedQuery
  }
  
  const clearSearch = () => {
    searchQuery.value = ''
    suggestions.value = []
  }
  
  const selectSuggestion = (suggestion: string) => {
    searchQuery.value = suggestion
    suggestions.value = []
  }
  
  return {
    searchQuery: readonly(searchQuery),
    searchHistory: readonly(searchHistory),
    suggestions: readonly(suggestions),
    performSearch,
    clearSearch,
    selectSuggestion,
    debouncedSearch
  }
}
```

### Filters Composable

**Purpose**: Reusable filter management

```typescript
// composables/useFilters.ts
export interface FilterOption {
  id: string
  label: string
  value: string
  count?: number
}

export function useFilters() {
  const activeFilters = ref<Map<string, string>>(new Map())
  const availableFilters = ref<Map<string, FilterOption[]>>(new Map())
  
  // Cuisine filters
  const cuisineFilters = computed(() => [
    { id: 'italian', label: 'Italian', value: 'italian' },
    { id: 'french', label: 'French', value: 'french' },
    { id: 'mexican', label: 'Mexican', value: 'mexican' },
    { id: 'indian', label: 'Indian', value: 'indian' },
    { id: 'chinese', label: 'Chinese', value: 'chinese' },
    { id: 'japanese', label: 'Japanese', value: 'japanese' },
    { id: 'mediterranean', label: 'Mediterranean', value: 'mediterranean' },
    { id: 'american', label: 'American', value: 'american' }
  ])
  
  // Dietary filters
  const dietaryFilters = computed(() => [
    { id: 'vegetarian', label: 'Vegetarian', value: 'vegetarian' },
    { id: 'vegan', label: 'Vegan', value: 'vegan' },
    { id: 'gluten-free', label: 'Gluten-Free', value: 'gluten-free' }
  ])
  
  // Time filters
  const timeFilters = computed(() => [
    { id: 'quick', label: 'Quick Meals (≤20 min)', value: '20' },
    { id: 'medium', label: 'Medium (21-45 min)', value: '45' },
    { id: 'long', label: 'Long (>45 min)', value: '60' }
  ])
  
  const setFilter = (category: string, value: string | null) => {
    if (value === null) {
      activeFilters.value.delete(category)
    } else {
      activeFilters.value.set(category, value)
    }
  }
  
  const getFilter = (category: string): string | null => {
    return activeFilters.value.get(category) || null
  }
  
  const clearFilter = (category: string) => {
    activeFilters.value.delete(category)
  }
  
  const clearAllFilters = () => {
    activeFilters.value.clear()
  }
  
  const hasActiveFilters = computed(() => activeFilters.value.size > 0)
  
  const activeFilterCount = computed(() => activeFilters.value.size)
  
  return {
    activeFilters: readonly(activeFilters),
    availableFilters: readonly(availableFilters),
    cuisineFilters,
    dietaryFilters,
    timeFilters,
    setFilter,
    getFilter,
    clearFilter,
    clearAllFilters,
    hasActiveFilters,
    activeFilterCount
  }
}
```

### Pagination Composable

**Purpose**: Reusable pagination logic

```typescript
// composables/usePagination.ts
export interface PaginationState {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export function usePagination(initialItemsPerPage: number = 20) {
  const currentPage = ref(1)
  const totalPages = ref(1)
  const totalItems = ref(0)
  const itemsPerPage = ref(initialItemsPerPage)
  
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPrevPage = computed(() => currentPage.value > 1)
  
  const offset = computed(() => (currentPage.value - 1) * itemsPerPage.value)
  
  const setTotalItems = (total: number) => {
    totalItems.value = total
    totalPages.value = Math.ceil(total / itemsPerPage.value)
  }
  
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }
  
  const nextPage = () => {
    if (hasNextPage.value) {
      currentPage.value++
    }
  }
  
  const prevPage = () => {
    if (hasPrevPage.value) {
      currentPage.value--
    }
  }
  
  const goToFirstPage = () => {
    currentPage.value = 1
  }
  
  const goToLastPage = () => {
    currentPage.value = totalPages.value
  }
  
  const resetPagination = () => {
    currentPage.value = 1
    totalPages.value = 1
    totalItems.value = 0
  }
  
  return {
    currentPage: readonly(currentPage),
    totalPages: readonly(totalPages),
    totalItems: readonly(totalItems),
    itemsPerPage: readonly(itemsPerPage),
    hasNextPage,
    hasPrevPage,
    offset,
    setTotalItems,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    resetPagination
  }
}
```

## State Persistence

### Local Storage Integration

```typescript
// composables/usePersistedState.ts
export function usePersistedState<T>(key: string, defaultValue: T) {
  const state = ref<T>(defaultValue)
  
  // Load from localStorage on mount
  onMounted(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        state.value = JSON.parse(stored)
      }
    } catch (err) {
      console.error(`Failed to load persisted state for ${key}:`, err)
    }
  })
  
  // Watch for changes and save to localStorage
  watch(state, (newValue) => {
    try {
      localStorage.setItem(key, JSON.stringify(newValue))
    } catch (err) {
      console.error(`Failed to save persisted state for ${key}:`, err)
    }
  }, { deep: true })
  
  return state
}
```

### Store Persistence

```typescript
// stores/recipes.ts (with persistence)
export const useRecipesStore = defineStore('recipes', () => {
  // Persist search query and filters
  const searchQuery = usePersistedState('recipes-search-query', '')
  const selectedCuisine = usePersistedState('recipes-selected-cuisine', null)
  const selectedDiet = usePersistedState('recipes-selected-diet', null)
  
  // ... rest of store implementation
})
```

## Error Handling

### Store Error Management

```typescript
// composables/useErrorHandler.ts
export function useErrorHandler() {
  const errors = ref<Map<string, string>>(new Map())
  
  const setError = (key: string, message: string) => {
    errors.value.set(key, message)
  }
  
  const clearError = (key: string) => {
    errors.value.delete(key)
  }
  
  const clearAllErrors = () => {
    errors.value.clear()
  }
  
  const hasError = (key: string) => errors.value.has(key)
  
  const getError = (key: string) => errors.value.get(key)
  
  return {
    errors: readonly(errors),
    setError,
    clearError,
    clearAllErrors,
    hasError,
    getError
  }
}
```

## Testing Strategy

### Store Testing

```typescript
// tests/stores/recipes.test.ts
import { setActivePinia, createPinia } from 'pinia'
import { useRecipesStore } from '~/stores/recipes'

describe('Recipes Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('should initialize with default state', () => {
    const store = useRecipesStore()
    
    expect(store.recipes).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.searchQuery).toBe('')
  })
  
  it('should update search query', async () => {
    const store = useRecipesStore()
    
    await store.searchRecipes('pasta')
    
    expect(store.searchQuery).toBe('pasta')
  })
  
  it('should handle search errors', async () => {
    const store = useRecipesStore()
    
    // Mock failed API call
    vi.spyOn(global, '$fetch').mockRejectedValue(new Error('API Error'))
    
    await store.searchRecipes('pasta')
    
    expect(store.error).toBe('API Error')
    expect(store.recipes).toEqual([])
  })
})
```

## Performance Optimization

### Store Optimization

```typescript
// Optimized store with selective reactivity
export const useRecipesStore = defineStore('recipes', () => {
  // Use shallowRef for large arrays
  const recipes = shallowRef<Recipe[]>([])
  
  // Use computed for expensive calculations
  const filteredRecipes = computed(() => {
    return recipes.value.filter(recipe => {
      // Complex filtering logic
      return true
    })
  })
  
  // Debounce expensive operations
  const debouncedSearch = useDebounceFn(async (query: string) => {
    // Search implementation
  }, 300)
  
  return {
    recipes: readonly(recipes),
    filteredRecipes,
    debouncedSearch
  }
})
```

---

*This specification should be updated when new stores are added or existing state management patterns change.*
