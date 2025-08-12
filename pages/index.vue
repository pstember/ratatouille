<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Quota Confirmation Modal -->
    <QuotaConfirmationModal
      :show="showQuotaModal"
      :quota-info="quotaInfo"
      @confirm="handleQuotaConfirm"
      @cancel="handleQuotaCancel"
    />
    
    <!-- API Error Message -->
    <ApiErrorMessage
      v-if="error && errorType"
      :error-type="errorType"
      :message="error"
      :retry-after="retryAfter"
      :fallback-data="fallbackData"
      @retry="retrySearch"
      @go-home="goHome"
    />
    <!-- Hero Section -->
    <section class="bg-gradient-to-br from-orange-50 to-red-50 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Discover Amazing Recipes
          </h1>
          <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Explore thousands of delicious recipes from around the world. Find your next favorite dish with our powerful search.
          </p>
          
          <!-- Search Bar and Quota Gauge -->
          <div class="flex flex-col sm:flex-row items-center gap-6 max-w-3xl mx-auto">
            <SearchBar class="flex-1" />
            <div class="flex-shrink-0">
              <QuotaGauge :quota-info="quotaInfo" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Recipe Results Section -->
    <section class="py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Category Header -->
        <div v-if="selectedCategory && selectedCategory.id !== 'all'" class="mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">
                {{ selectedCategory.name }}
              </h2>
              <p class="text-gray-600 mt-1">
                {{ getCategoryDescription(selectedCategory) }}
              </p>
            </div>
            <button 
              @click="clearCategory"
              class="text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors duration-200"
            >
              View All Recipes
            </button>
          </div>
        </div>

        <!-- New Recipes Section (only show when no category is selected) -->
        <div v-if="(!selectedCategory || selectedCategory.id === 'all') && (newRecipes.length > 0 || newRecipesLoading)" class="mb-12">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-900 flex items-center">
              <span class="bg-green-500 text-white text-sm font-semibold px-2 py-1 rounded-full mr-3 animate-pulse">NEW</span>
              Recently Added Recipes
            </h2>
            <button 
              v-if="newRecipes.length > 0"
              @click="viewAllNewRecipes"
              class="text-green-600 hover:text-green-700 font-medium text-sm transition-colors duration-200"
            >
              View All New
            </button>
          </div>
          
          <!-- Loading state for new recipes -->
          <div v-if="newRecipesLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <RecipeSkeleton 
              v-for="i in 4" 
              :key="`new-skeleton-${i}`" 
            />
          </div>
          
          <!-- New recipes grid -->
          <div v-else-if="newRecipes.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <RecipeCard 
              v-for="recipe in newRecipes.slice(0, 4)" 
              :key="recipe.id" 
              :recipe="recipe" 
            />
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="recipesStore.loading && recipesStore.recipes.length === 0" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-4"></div>
          <p class="text-gray-600">
            {{ selectedCategory ? `Searching for ${selectedCategory.name.toLowerCase()}...` : 'Searching for delicious recipes...' }}
          </p>
        </div>

        <!-- Error State -->
        <div v-else-if="recipesStore.error && !error" class="text-center py-12">
          <div class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <svg class="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 class="text-lg font-medium text-red-800 mb-2">Oops! Something went wrong</h3>
            <p class="text-red-600 mb-4">{{ recipesStore.error }}</p>
            <button @click="retrySearch" class="btn-primary">
              Try Again
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="recipesStore.isEmpty" class="text-center py-12">
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-800 mb-2">No recipes found</h3>
            <p class="text-gray-600 mb-4">
              {{ getEmptyStateMessage() }}
            </p>
            <button v-if="recipesStore.searchQuery || selectedCategory" @click="clearAll" class="btn-secondary">
              Clear Filters
            </button>
          </div>
        </div>

        <!-- Results -->
        <div v-else>
          <!-- Simple Recipe Display -->
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Search Results</h2>
            <p class="text-gray-600 mb-4">
              Found {{ recipesStore.recipes.length }} recipe(s)
            </p>
          </div>

          <!-- Recipe Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <RecipeCard 
              v-for="recipe in recipesStore.recipes" 
              :key="recipe.id" 
              :recipe="recipe" 
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { RecipeCategory } from '~/types/recipe'

const recipesStore = useRecipesStore()
const quotaStore = useQuotaStore()

// Get quota store state
const { 
  quotaInfo, 
  requiresConfirmation 
} = storeToRefs(quotaStore)

// Get recipes store state
const { 
  error, 
  errorType, 
  retryAfter, 
  fallbackData 
} = storeToRefs(recipesStore)

const showQuotaModal = computed(() => requiresConfirmation.value && quotaInfo.value !== null)

// Get selectedCategory from layout slot
const { selectedCategory } = defineProps<{
  selectedCategory?: RecipeCategory | null
}>()

// New recipes state
const newRecipes = ref([])
const newRecipesLoading = ref(false)

// Watch for category changes from layout
watch(() => selectedCategory, (newCategory) => {
  if (newCategory && newCategory.id !== 'all') {
    // Update store category and load recipes for the selected category
    recipesStore.setCategory(newCategory.id)
    recipesStore.searchRecipes({ 
      query: '', 
      offset: 0,
      category: newCategory.id 
    })
  } else if (newCategory?.id === 'all') {
    clearCategory()
  }
})

// Load popular recipes on mount
onMounted(async () => {
  // Initialize daily quota reset and load quota info
  quotaStore.resetDailyQuota()
  await quotaStore.loadQuotaInfo()
  
  if (recipesStore.recipes.length === 0) {
    recipesStore.loadPopularRecipes()
  }
  
  // Load new recipes
  await loadNewRecipes()
})

async function loadNewRecipes() {
  try {
    newRecipesLoading.value = true
    const response = await $fetch('/api/recipes/new', {
      query: { limit: 8 }
    })
    newRecipes.value = response.results
  } catch (error) {
    console.error('Error loading new recipes:', error)
  } finally {
    newRecipesLoading.value = false
  }
}

function viewAllNewRecipes() {
  // Navigate to a new recipes page or show all new recipes
  // For now, we'll just load more new recipes
  loadNewRecipes()
}

async function handleQuotaConfirm() {
  await recipesStore.confirmQuotaAndSearch()
}

function handleQuotaCancel() {
  quotaStore.cancelPendingRequest()
}

function retrySearch() {
  recipesStore.retrySearch()
}

function goHome() {
  navigateTo('/')
}

function clearSearch() {
  recipesStore.clearResults()
  recipesStore.loadPopularRecipes()
}

async function handleSpoonacularSearch() {
  await recipesStore.searchSpoonacularWithConsent({
    query: recipesStore.searchQuery,
    offset: 0,
    category: recipesStore.selectedCategory
  })
}

function loadMore() {
  recipesStore.loadMoreRecipes()
}

function clearCategory() {
  recipesStore.clearResults()
  recipesStore.loadPopularRecipes()
}

function clearAll() {
  recipesStore.clearResults()
  recipesStore.loadPopularRecipes()
}

function getCategoryDescription(category: RecipeCategory): string {
  const descriptions: Record<string, string> = {
    quick: 'Delicious meals ready in 20 minutes or less',
    italian: 'Authentic Italian cuisine and flavors',
    french: 'Classic French culinary traditions',
    mexican: 'Spicy and flavorful Mexican dishes',
    indian: 'Rich and aromatic Indian cuisine',
    chinese: 'Traditional Chinese cooking techniques',
    japanese: 'Elegant and refined Japanese dishes',
    mediterranean: 'Fresh and healthy Mediterranean fare',
    american: 'Classic American comfort food',
    desserts: 'Sweet treats and delightful desserts',
    vegetarian: 'Plant-based and vegetarian dishes',
    vegan: '100% plant-based vegan cuisine',
    'gluten-free': 'Delicious gluten-free alternatives'
  }
  return descriptions[category.id] || ''
}

function getResultsHeader(): string {
  if (selectedCategory) {
    return selectedCategory.name
  }
  if (recipesStore.searchQuery) {
    return `Search Results for "${recipesStore.searchQuery}"`
  }
  return 'Popular Recipes'
}

function getEmptyStateMessage(): string {
  if (selectedCategory) {
    return `No ${selectedCategory.name.toLowerCase()} found. Try a different category or search term.`
  }
  if (recipesStore.searchQuery) {
    return `No recipes found for "${recipesStore.searchQuery}". Try a different search term.`
  }
  return 'Start searching for recipes to discover delicious dishes!'
}

// Set page title
useHead({
  title: 'Ratatouille - Recipe Discovery Platform',
  meta: [
    { name: 'description', content: 'Discover and explore culinary recipes with Ratatouille - your modern recipe discovery platform.' }
  ]
})
</script>
