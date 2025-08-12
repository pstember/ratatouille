<template>
  <div 
    :class="[
      'nutrition-badge inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
      {
        'bg-red-100 text-red-800': color === 'red',
        'bg-blue-100 text-blue-800': color === 'blue',
        'bg-green-100 text-green-800': color === 'green',
        'bg-yellow-100 text-yellow-800': color === 'yellow',
        'bg-purple-100 text-purple-800': color === 'purple',
        'bg-orange-100 text-orange-800': color === 'orange',
        'bg-gray-100 text-gray-800': color === 'gray'
      }
    ]"
  >
    <span class="font-medium">{{ formatNutritionValue(value, unit) }}</span>
    <span class="ml-1 text-xs opacity-75">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { formatNutritionValue } from '~/types/nutrition'

interface Props {
  value: number
  unit: string
  color: 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'gray'
  label: string
}

defineProps<Props>()
</script>
