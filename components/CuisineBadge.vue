<template>
  <span 
    v-if="cuisine"
    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
    :class="cuisineColorClasses"
  >
    {{ formatCuisineName(cuisine) }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CuisineType } from '~/types/recipe'

interface Props {
  cuisine: string
}

const props = defineProps<Props>()

// Cuisine-specific color mapping
const cuisineColors: Record<string, string> = {
  'italian': 'bg-red-100 text-red-800 border border-red-200',
  'french': 'bg-blue-100 text-blue-800 border border-blue-200',
  'mexican': 'bg-green-100 text-green-800 border border-green-200',
  'indian': 'bg-orange-100 text-orange-800 border border-orange-200',
  'chinese': 'bg-red-100 text-red-800 border border-red-200',
  'japanese': 'bg-red-100 text-red-800 border border-red-200',
  'mediterranean': 'bg-blue-100 text-blue-800 border border-blue-200',
  'american': 'bg-blue-100 text-blue-800 border border-blue-200',
  'african': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'british': 'bg-blue-100 text-blue-800 border border-blue-200',
  'cajun': 'bg-red-100 text-red-800 border border-red-200',
  'caribbean': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'eastern european': 'bg-purple-100 text-purple-800 border border-purple-200',
  'european': 'bg-blue-100 text-blue-800 border border-blue-200',
  'german': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'greek': 'bg-blue-100 text-blue-800 border border-blue-200',
  'irish': 'bg-green-100 text-green-800 border border-green-200',
  'jewish': 'bg-blue-100 text-blue-800 border border-blue-200',
  'korean': 'bg-red-100 text-red-800 border border-red-200',
  'latin american': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'middle eastern': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'nordic': 'bg-blue-100 text-blue-800 border border-blue-200',
  'southern': 'bg-red-100 text-red-800 border border-red-200',
  'spanish': 'bg-red-100 text-red-800 border border-red-200',
  'thai': 'bg-blue-100 text-blue-800 border border-blue-200',
  'vietnamese': 'bg-red-100 text-red-800 border border-red-200'
}

// Get cuisine-specific color classes
const cuisineColorClasses = computed(() => {
  const cuisineKey = props.cuisine.toLowerCase() as CuisineType
  return cuisineColors[cuisineKey] || 'bg-gray-100 text-gray-800 border border-gray-200'
})

// Format cuisine name for display (capitalize first letter)
function formatCuisineName(cuisine: string): string {
  return cuisine.charAt(0).toUpperCase() + cuisine.slice(1)
}
</script>
