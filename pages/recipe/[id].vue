<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading State -->
    <div v-if="currentRecipeStore.loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
        <p class="text-gray-600">Loading recipe details...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="currentRecipeStore.error" class="flex items-center justify-center min-h-screen">
      <div class="text-center max-w-md mx-auto px-4">
        <div class="bg-red-50 border border-red-200 rounded-lg p-6">
          <svg class="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 class="text-lg font-medium text-red-800 mb-2">Recipe Not Found</h3>
          <p class="text-red-600 mb-4">{{ currentRecipeStore.error }}</p>
          <NuxtLink to="/" class="btn-primary">
            Back to Search
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Recipe Content -->
    <div v-else-if="currentRecipeStore.hasRecipe" class="py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Back Button -->
        <div class="mb-6">
          <NuxtLink 
            to="/" 
            class="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Search
          </NuxtLink>
        </div>

        <!-- Recipe Header -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div class="md:flex">
            <!-- Recipe Image -->
            <div class="md:w-1/2">
              <div class="aspect-[4/3] md:aspect-square overflow-hidden bg-gray-200">
                <img
                  v-if="currentRecipeStore.recipe?.image && !imageError"
                  :src="currentRecipeStore.recipe.image"
                  :alt="currentRecipeStore.recipe.title"
                  class="w-full h-full object-cover"
                  @error="handleImageError"
                  @load="handleImageLoad"
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-gray-100">
                  <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div class="text-center mt-4">
                    <p class="text-lg text-gray-500">{{ currentRecipeStore.recipe?.title }}</p>
                    <p class="text-sm text-gray-400">No image available</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recipe Info -->
            <div class="md:w-1/2 p-6 md:p-8">
              <div class="flex items-start justify-between mb-4">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ currentRecipeStore.recipe?.title }}</h1>
                <span v-if="currentRecipeStore.cached" class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Cached
                </span>
              </div>

              <!-- Quick Info -->
              <div class="flex flex-wrap gap-4 mb-6">
                <div v-if="currentRecipeStore.recipe?.readyInMinutes" class="flex items-center text-gray-600">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ currentRecipeStore.recipe.readyInMinutes }} minutes
                </div>
                <div v-if="currentRecipeStore.recipe?.servings" class="flex items-center text-gray-600">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {{ currentRecipeStore.recipe.servings }} servings
                </div>
              </div>

              <!-- Source Link -->
              <div v-if="currentRecipeStore.recipe?.sourceUrl" class="mb-6">
                <a 
                  :href="currentRecipeStore.recipe.sourceUrl" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Original Recipe
                </a>
              </div>

              <!-- Allergen warnings -->
              <div v-if="currentRecipeStore.recipe?.allergens && currentRecipeStore.recipe.allergens.length > 0" class="mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-3">Allergen Warnings</h3>
                <div class="flex flex-wrap gap-2">
                  <AllergenBadge 
                    v-for="allergen in currentRecipeStore.recipe.allergens" 
                    :key="allergen.type"
                    :allergen="allergen"
                    variant="medium"
                  />
                </div>
              </div>

              <!-- Summary -->
              <div v-if="currentRecipeStore.recipe?.summary" class="prose prose-sm max-w-none">
                <div v-html="currentRecipeStore.recipe.summary"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recipe Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Ingredients -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 class="text-2xl font-bold text-gray-900 mb-6">Ingredients</h2>
              <div v-if="currentRecipeStore.recipe?.ingredients?.length" class="space-y-3">
                <div 
                  v-for="ingredient in currentRecipeStore.recipe.ingredients" 
                  :key="ingredient.id"
                  class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div class="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div class="flex-1">
                    <span class="font-medium text-gray-900">
                      {{ ingredient.amount }} {{ ingredient.unit }} {{ ingredient.name }}
                    </span>
                    <div v-if="ingredient.aisle" class="text-sm text-gray-500 mt-1">
                      Aisle: {{ ingredient.aisle }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-gray-500 text-center py-8">
                No ingredients information available
              </div>
            </div>
          </div>

          <!-- Instructions and Nutrition -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Instructions -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <RecipeInstructions 
                :instructions="currentRecipeStore.recipe?.instructions"
                :analyzed-instructions="currentRecipeStore.recipe?.analyzedInstructions"
              />
            </div>

            <!-- Nutrition Information -->
            <div v-if="currentRecipeStore.recipe?.nutrition" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 class="text-2xl font-bold text-gray-900 mb-6">Nutrition Information</h2>
              <NutritionalInfo 
                :nutrition="currentRecipeStore.recipe.nutrition" 
                :show-details="true"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AllergenBadge from '~/components/AllergenBadge.vue'
import RecipeInstructions from '~/components/RecipeInstructions.vue'

const route = useRoute()
const currentRecipeStore = useCurrentRecipeStore()

// Image error handling
const imageError = ref(false)

function handleImageError() {
  console.warn(`Failed to load image for recipe: ${currentRecipeStore.recipe?.title}`)
  imageError.value = true
}

function handleImageLoad() {
  imageError.value = false
}

// Get recipe ID from route
const recipeId = computed(() => {
  const id = route.params.id as string
  return parseInt(id)
})

// Fetch recipe data
onMounted(async () => {
  if (recipeId.value && !isNaN(recipeId.value)) {
    await currentRecipeStore.fetchRecipe(recipeId.value)
  }
})

// Watch for route changes
watch(() => route.params.id, async (newId) => {
  if (newId && !isNaN(parseInt(newId as string))) {
    currentRecipeStore.clearRecipe()
    imageError.value = false // Reset image error state
    await currentRecipeStore.fetchRecipe(parseInt(newId as string))
  }
})

// Set page title
useHead(() => ({
  title: currentRecipeStore.recipe ? `${currentRecipeStore.recipe.title} - Ratatouille` : 'Recipe - Ratatouille',
  meta: [
    { 
      name: 'description', 
      content: currentRecipeStore.recipe?.summary 
        ? currentRecipeStore.recipe.summary.replace(/<[^>]*>/g, '').substring(0, 160) + '...'
        : 'View recipe details and cooking instructions'
    }
  ]
}))
</script>
