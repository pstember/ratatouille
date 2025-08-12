<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header Section -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              🔍 Browse Recipes
            </h1>
            <p class="mt-2 text-gray-600">
              Explore our complete recipe collection with advanced filtering
            </p>
          </div>
          
          <!-- View Toggle -->
          <div class="flex items-center space-x-4">
            <div class="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                @click="viewMode = 'grid'"
                :class="[
                  'px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200',
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                @click="viewMode = 'list'"
                :class="[
                  'px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200',
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Results Summary -->
        <div v-if="recipes.length > 0 || isLoading" class="mt-4 flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">
              {{ totalCount }} recipe{{ totalCount !== 1 ? 's' : '' }} found
            </span>
            <span v-if="hasActiveFilters" class="text-sm text-orange-600">
              (filtered)
            </span>
          </div>
          
          <!-- Sort Options -->
          <div class="flex items-center space-x-2">
            <label class="text-sm text-gray-600">Sort by:</label>
            <select
              v-model="sortBy"
              @change="applyFilters"
              class="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="title">Title</option>
              <option value="cookingTime">Cooking Time</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="servings">Servings</option>
            </select>
            <button
              @click="toggleSortOrder"
              class="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Filter Sidebar -->
        <div class="lg:w-80 flex-shrink-0">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-semibold text-gray-900">Filters</h2>
              <button
                v-if="hasActiveFilters"
                @click="clearAllFilters"
                class="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Clear All
              </button>
            </div>

            <!-- Category Filter -->
            <div class="mb-6">
              <h3 class="text-sm font-medium text-gray-900 mb-3">Categories</h3>
              <div class="space-y-2 max-h-32 overflow-y-auto">
                <label
                  v-for="category in availableFilters.categories"
                  :key="category"
                  class="flex items-center"
                >
                  <input
                    type="checkbox"
                    :value="category"
                    v-model="filters.categories"
                    @change="applyFilters"
                    class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700 capitalize">{{ category }}</span>
                </label>
              </div>
            </div>

            <!-- Cuisine Filter -->
            <div class="mb-6">
              <h3 class="text-sm font-medium text-gray-900 mb-3">Cuisines</h3>
              <div class="space-y-2 max-h-32 overflow-y-auto">
                <label
                  v-for="cuisine in availableFilters.cuisines"
                  :key="cuisine"
                  class="flex items-center"
                >
                  <input
                    type="checkbox"
                    :value="cuisine"
                    v-model="filters.cuisines"
                    @change="applyFilters"
                    class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700 capitalize">{{ cuisine }}</span>
                </label>
              </div>
            </div>

            <!-- Cooking Time Filter -->
            <div class="mb-6">
              <h3 class="text-sm font-medium text-gray-900 mb-3">Cooking Time</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Max: {{ filters.maxCookingTime || 'No limit' }} min</span>
                  <button
                    @click="filters.maxCookingTime = undefined; applyFilters()"
                    v-if="filters.maxCookingTime"
                    class="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </button>
                </div>
                <input
                  type="range"
                  v-model="filters.maxCookingTime"
                  min="15"
                  max="180"
                  step="15"
                  @input="applyFilters"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div class="flex justify-between text-xs text-gray-500">
                  <span>15m</span>
                  <span>60m</span>
                  <span>120m</span>
                  <span>180m</span>
                </div>
              </div>
            </div>

            <!-- Dietary Filter -->
            <div class="mb-6">
              <h3 class="text-sm font-medium text-gray-900 mb-3">Dietary</h3>
              <div class="space-y-2">
                <label
                  v-for="dietary in availableFilters.dietaryOptions"
                  :key="dietary"
                  class="flex items-center"
                >
                  <input
                    type="checkbox"
                    :value="dietary"
                    v-model="filters.dietary"
                    @change="applyFilters"
                    class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700 capitalize">{{ dietary }}</span>
                </label>
              </div>
            </div>

            <!-- Allergen Filter -->
            <div class="mb-6">
              <h3 class="text-sm font-medium text-gray-900 mb-3">Exclude Allergens</h3>
              <div class="space-y-2 max-h-32 overflow-y-auto">
                <label
                  v-for="allergen in availableFilters.allergens"
                  :key="allergen"
                  class="flex items-center"
                >
                  <input
                    type="checkbox"
                    :value="allergen"
                    v-model="filters.excludeAllergens"
                    @change="applyFilters"
                    class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700 capitalize">{{ allergen }}</span>
                </label>
              </div>
            </div>

            <!-- Ingredient Filter -->
            <div class="mb-6">
              <h3 class="text-sm font-medium text-gray-900 mb-3">Include Ingredients</h3>
              <div class="space-y-3">
                <div class="flex">
                  <input
                    v-model="newIngredient"
                    @keyup.enter="addIngredient"
                    placeholder="Add ingredient..."
                    class="flex-1 text-sm border border-gray-300 rounded-l-md px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button
                    @click="addIngredient"
                    class="px-3 py-2 bg-orange-600 text-white text-sm font-medium rounded-r-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    Add
                  </button>
                </div>
                
                <!-- Selected Ingredients -->
                <div v-if="filters.includeIngredients.length > 0" class="space-y-2">
                  <div
                    v-for="ingredient in filters.includeIngredients"
                    :key="ingredient"
                    class="flex items-center justify-between bg-orange-50 px-2 py-1 rounded-md"
                  >
                    <span class="text-sm text-orange-800">{{ ingredient }}</span>
                    <button
                      @click="removeIngredient(ingredient)"
                      class="text-orange-600 hover:text-orange-800"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recipe Results -->
        <div class="flex-1">
          <!-- Loading State -->
          <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RecipeSkeleton v-for="n in 6" :key="n" />
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="text-center py-12">
            <div class="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 class="mt-2 text-sm font-medium text-gray-900">Something went wrong</h3>
            <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
            <div class="mt-6">
              <button
                @click="loadRecipes"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Try Again
              </button>
            </div>
          </div>

          <!-- Recipe Grid/List -->
          <div v-else-if="recipes.length > 0" :class="viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'">
            <RecipeCard
              v-for="recipe in recipes"
              :key="recipe.id"
              :recipe="recipe"
              :class="viewMode === 'grid' ? 'transform transition-all duration-200 hover:scale-105 hover:shadow-lg' : 'flex'"
            />
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-12">
            <div class="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No recipes found</h3>
            <p class="mt-1 text-sm text-gray-500">
              Try adjusting your filters or browse all recipes.
            </p>
            <div class="mt-6">
              <button
                @click="clearAllFilters"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="mt-8 flex items-center justify-center">
            <nav class="flex items-center space-x-2">
              <button
                @click="changePage(currentPage - 1)"
                :disabled="currentPage <= 1"
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <template v-for="page in visiblePages" :key="page">
                <button
                  v-if="page !== '...'"
                  @click="changePage(page)"
                  :class="[
                    'px-3 py-2 text-sm font-medium rounded-md',
                    page === currentPage
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  ]"
                >
                  {{ page }}
                </button>
                <span v-else class="px-3 py-2 text-sm text-gray-500">...</span>
              </template>
              
              <button
                @click="changePage(currentPage + 1)"
                :disabled="currentPage >= totalPages"
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { RecipeSearchResult } from '~/types/recipe'

// Page metadata
definePageMeta({
  title: 'Browse Recipes',
  description: 'Browse and filter our complete recipe collection'
})

// Types
interface RecipeFilters {
  categories?: string[]
  cuisines?: string[]
  maxCookingTime?: number
  dietary?: string[]
  excludeAllergens?: string[]
  includeIngredients?: string[]
  sortBy?: 'title' | 'cookingTime' | 'newest' | 'oldest' | 'servings'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface BrowseResponse {
  recipes: RecipeSearchResult[]
  totalCount: number
  totalPages: number
  currentPage: number
  appliedFilters: RecipeFilters
  availableFilters: {
    cuisines: string[]
    categories: string[]
    allergens: string[]
    commonIngredients: string[]
    dietaryOptions: string[]
  }
}

// Reactive state
const isLoading = ref(false)
const error = ref<string | null>(null)
const recipes = ref<RecipeSearchResult[]>([])
const totalCount = ref(0)
const totalPages = ref(0)
const currentPage = ref(1)
const viewMode = ref<'grid' | 'list'>('grid')
const newIngredient = ref('')

// Filters
const filters = ref<RecipeFilters>({
  categories: [],
  cuisines: [],
  maxCookingTime: undefined,
  dietary: [],
  excludeAllergens: [],
  includeIngredients: [],
  sortBy: 'title',
  sortOrder: 'asc',
  page: 1,
  limit: 12
})

// Available filters (will be populated from API)
const availableFilters = ref({
  cuisines: [],
  categories: [],
  allergens: [],
  commonIngredients: [],
  dietaryOptions: []
})

// Computed properties
const hasActiveFilters = computed(() => {
  return filters.value.categories?.length > 0 ||
         filters.value.cuisines?.length > 0 ||
         filters.value.maxCookingTime ||
         filters.value.dietary?.length > 0 ||
         filters.value.excludeAllergens?.length > 0 ||
         filters.value.includeIngredients?.length > 0
})

const sortBy = computed({
  get: () => filters.value.sortBy || 'title',
  set: (value) => {
    filters.value.sortBy = value
    applyFilters()
  }
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

// Methods
async function loadRecipes() {
  isLoading.value = true
  error.value = null
  
  try {
    const params = new URLSearchParams()
    
    // Add filter parameters
    if (filters.value.categories?.length) {
      params.append('categories', filters.value.categories.join(','))
    }
    if (filters.value.cuisines?.length) {
      params.append('cuisines', filters.value.cuisines.join(','))
    }
    if (filters.value.maxCookingTime) {
      params.append('maxCookingTime', filters.value.maxCookingTime.toString())
    }
    if (filters.value.dietary?.length) {
      params.append('dietary', filters.value.dietary.join(','))
    }
    if (filters.value.excludeAllergens?.length) {
      params.append('excludeAllergens', filters.value.excludeAllergens.join(','))
    }
    if (filters.value.includeIngredients?.length) {
      params.append('includeIngredients', filters.value.includeIngredients.join(','))
    }
    
    // Add sorting and pagination
    params.append('sortBy', filters.value.sortBy || 'title')
    params.append('sortOrder', filters.value.sortOrder || 'asc')
    params.append('page', filters.value.page?.toString() || '1')
    params.append('limit', filters.value.limit?.toString() || '12')
    
    const response = await $fetch<BrowseResponse>(`/api/recipes/browse?${params}`)
    
    recipes.value = response.recipes
    totalCount.value = response.totalCount
    totalPages.value = response.totalPages
    currentPage.value = response.currentPage
    
    // Update available filters if this is the first load
    if (availableFilters.value.cuisines.length === 0) {
      availableFilters.value = response.availableFilters
    }
    
    // Update URL
    updateURL()
    
  } catch (err: any) {
    console.error('Failed to load recipes:', err)
    error.value = err.data?.message || 'Failed to load recipes. Please try again.'
  } finally {
    isLoading.value = false
  }
}

function applyFilters() {
  filters.value.page = 1
  loadRecipes()
}

function clearAllFilters() {
  filters.value = {
    categories: [],
    cuisines: [],
    maxCookingTime: undefined,
    dietary: [],
    excludeAllergens: [],
    includeIngredients: [],
    sortBy: 'title',
    sortOrder: 'asc',
    page: 1,
    limit: 12
  }
  loadRecipes()
}

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    filters.value.page = page
    loadRecipes()
  }
}

function toggleSortOrder() {
  filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc'
  applyFilters()
}

function addIngredient() {
  const ingredient = newIngredient.value.trim().toLowerCase()
  if (ingredient && !filters.value.includeIngredients?.includes(ingredient)) {
    if (!filters.value.includeIngredients) {
      filters.value.includeIngredients = []
    }
    filters.value.includeIngredients.push(ingredient)
    newIngredient.value = ''
    applyFilters()
  }
}

function removeIngredient(ingredient: string) {
  if (filters.value.includeIngredients) {
    const index = filters.value.includeIngredients.indexOf(ingredient)
    if (index > -1) {
      filters.value.includeIngredients.splice(index, 1)
      applyFilters()
    }
  }
}

function updateURL() {
  const query = { ...filters.value }
  // Remove undefined values
  Object.keys(query).forEach(key => {
    if (query[key as keyof RecipeFilters] === undefined) {
      delete query[key as keyof RecipeFilters]
    }
  })
  
  // Update URL without triggering navigation
  const url = new URL(window.location.href)
  Object.keys(query).forEach(key => {
    const value = query[key as keyof RecipeFilters]
    if (Array.isArray(value)) {
      url.searchParams.set(key, value.join(','))
    } else if (value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  })
  
  window.history.replaceState({}, '', url.toString())
}

function loadFromURL() {
  const url = new URL(window.location.href)
  const params = url.searchParams
  
  // Load filters from URL
  if (params.get('categories')) {
    filters.value.categories = params.get('categories')!.split(',')
  }
  if (params.get('cuisines')) {
    filters.value.cuisines = params.get('cuisines')!.split(',')
  }
  if (params.get('maxCookingTime')) {
    filters.value.maxCookingTime = parseInt(params.get('maxCookingTime')!)
  }
  if (params.get('dietary')) {
    filters.value.dietary = params.get('dietary')!.split(',')
  }
  if (params.get('excludeAllergens')) {
    filters.value.excludeAllergens = params.get('excludeAllergens')!.split(',')
  }
  if (params.get('includeIngredients')) {
    filters.value.includeIngredients = params.get('includeIngredients')!.split(',')
  }
  if (params.get('sortBy')) {
    filters.value.sortBy = params.get('sortBy') as any
  }
  if (params.get('sortOrder')) {
    filters.value.sortOrder = params.get('sortOrder') as any
  }
  if (params.get('page')) {
    filters.value.page = parseInt(params.get('page')!)
  }
}

// Load recipes on mount
onMounted(() => {
  loadFromURL()
  loadRecipes()
})

// Watch for route changes
watch(() => useRoute().query, () => {
  loadFromURL()
  loadRecipes()
}, { deep: true })
</script>

<style scoped>
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #ea580c;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #ea580c;
  cursor: pointer;
  border: none;
}
</style>
