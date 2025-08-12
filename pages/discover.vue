<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header Section -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              🎲 Your Random Recipe Discovery
            </h1>
            <p class="mt-2 text-gray-600">
              Discover amazing recipes you might not have found otherwise
            </p>
          </div>
          
          <!-- Refresh Button -->
          <button
            @click="refreshRecipes"
            :disabled="isLoading"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <svg 
              v-if="!isLoading" 
              class="w-4 h-4 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <svg 
              v-else 
              class="w-4 h-4 mr-2 animate-spin" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? 'Discovering...' : 'Discover More' }}
          </button>
        </div>
        
        <!-- Source Info -->
        <div v-if="recipeData" class="mt-4 flex items-center text-sm text-gray-500">
          <span class="mr-2">Source:</span>
          <span 
            :class="[
              'px-2 py-1 rounded-full text-xs font-medium',
              sourceBadgeClasses
            ]"
          >
            {{ sourceDisplayName }}
          </span>
          <span v-if="recipeData.cached" class="ml-2 text-blue-600">
            (Cached)
          </span>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            @click="refreshRecipes"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Try Again
          </button>
        </div>
      </div>

      <!-- Quota Warning -->
      <div v-else-if="quotaWarning" class="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">
              API Quota Warning
            </h3>
            <div class="mt-2 text-sm text-yellow-700">
              <p>{{ quotaWarning.message }}</p>
            </div>
            <div class="mt-4">
              <button
                @click="confirmQuotaUsage"
                class="bg-yellow-50 px-2 py-1.5 rounded-md text-xs font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Recipe Grid -->
      <div v-else-if="recipeData?.recipes?.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RecipeCard
          v-for="recipe in recipeData.recipes"
          :key="recipe.id"
          :recipe="recipe"
          class="transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <div class="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No recipes found</h3>
        <p class="mt-1 text-sm text-gray-500">
          Try adjusting your search criteria or discover more recipes.
        </p>
        <div class="mt-6">
          <button
            @click="refreshRecipes"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Discover Recipes
          </button>
        </div>
      </div>

      <!-- Back to Home -->
      <div class="mt-12 text-center">
        <NuxtLink
          to="/"
          class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Recipe Browser
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { RandomRecipeResponse } from '~/types/recipe'

// Page metadata
definePageMeta({
  title: 'Discover Random Recipes',
  description: 'Discover amazing random recipes with our "I feel lucky" feature'
})

// Reactive state
const isLoading = ref(false)
const error = ref<string | null>(null)
const recipeData = ref<RandomRecipeResponse | null>(null)
const quotaWarning = ref<any>(null)

// Computed properties
const sourceBadgeClasses = computed(() => {
  if (!recipeData.value) return ''
  
  switch (recipeData.value.source) {
    case 'api':
      return 'bg-green-100 text-green-800'
    case 'database':
      return 'bg-blue-100 text-blue-800'
    case 'cache':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
})

const sourceDisplayName = computed(() => {
  if (!recipeData.value) return ''
  
  switch (recipeData.value.source) {
    case 'api':
      return 'Fresh from API'
    case 'database':
      return 'From Database'
    case 'cache':
      return 'From Cache'
    default:
      return 'Unknown'
  }
})

// Methods
async function fetchRandomRecipes(confirmedQuota = false) {
  isLoading.value = true
  error.value = null
  quotaWarning.value = null
  
  try {
    const params = new URLSearchParams()
    if (confirmedQuota) {
      params.append('confirmedQuotaUsage', 'true')
    }
    
    const response = await $fetch<RandomRecipeResponse>(`/api/recipes/random?${params}`)
    
    if (response && response.requiresQuotaConfirmation) {
      quotaWarning.value = response.quotaWarning
      recipeData.value = response
    } else if (response) {
      recipeData.value = response
    }
  } catch (err: any) {
    console.error('Failed to fetch random recipes:', err)
    error.value = err.data?.message || 'Failed to load random recipes. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function refreshRecipes() {
  await fetchRandomRecipes()
}

async function confirmQuotaUsage() {
  await fetchRandomRecipes(true)
}

// Fetch recipes on page load
onMounted(() => {
  fetchRandomRecipes()
})
</script>

<style scoped>
/* Custom animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}
</style>
