<template>
  <div class="recipe-card group" @click="navigateToRecipe">
    <!-- Recipe Image -->
    <div class="relative aspect-[4/3] overflow-hidden bg-gray-200">
      <img
        v-if="recipe.image && !imageError"
        :src="recipe.image"
        :alt="recipe.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
        @error="handleImageError"
        @load="handleImageLoad"
      />
      <div v-else class="w-full h-full flex items-center justify-center bg-gray-100">
        <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
        </svg>
        <div class="text-center mt-2">
          <p class="text-sm text-gray-500">{{ recipe.title }}</p>
        </div>
      </div>
      
      <!-- New badge -->
      <NewBadge v-if="recipe.isNew" />
      
      <!-- Quick info overlay -->
      <div class="absolute top-2 right-2 flex space-x-1">
        <span v-if="recipe.readyInMinutes !== undefined" class="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-full">
          {{ recipe.readyInMinutes }}m
        </span>
        <span v-if="recipe.servings !== undefined" class="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-full">
          {{ recipe.servings }} servings
        </span>
      </div>
    </div>

    <!-- Recipe Content -->
    <div class="p-4">
      <!-- Title with Cuisine Badge -->
      <div class="flex items-start gap-2 mb-2">
        <h3 class="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors duration-200 flex-1">
          {{ recipe.title }}
        </h3>
        <CuisineBadge v-if="recipe.cuisine" :cuisine="recipe.cuisine" />
      </div>

      <!-- Source info -->
      <div v-if="recipe.sourceName" class="text-sm text-gray-500 mb-3">
        <span>From {{ recipe.sourceName }}</span>
      </div>

      <!-- Allergen warnings -->
      <div v-if="recipe.allergens && recipe.allergens.length > 0" class="mb-3">
        <div class="flex flex-wrap gap-1">
          <AllergenBadge 
            v-for="allergen in recipe.allergens" 
            :key="allergen.type"
            :allergen="allergen"
            variant="small"
          />
        </div>
      </div>

      <!-- Nutritional highlights -->
      <div v-if="recipe.nutrition" class="mb-3">
        <NutritionalInfo :nutrition="recipe.nutrition" :compact="true" />
      </div>

      <!-- Action button -->
      <div class="flex justify-between items-center">
        <button class="text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors duration-200">
          View Recipe
        </button>
        <svg class="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { RecipeSearchResult } from '~/types/recipe'
import CuisineBadge from './CuisineBadge.vue'
import AllergenBadge from './AllergenBadge.vue'

interface Props {
  recipe: RecipeSearchResult
}

const props = defineProps<Props>()

// Image error handling
const imageError = ref(false)

function handleImageError() {
  console.warn(`Failed to load image for recipe: ${props.recipe.title}`)
  imageError.value = true
}

function handleImageLoad() {
  imageError.value = false
}

function navigateToRecipe() {
  navigateTo(`/recipe/${props.recipe.id}`)
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
