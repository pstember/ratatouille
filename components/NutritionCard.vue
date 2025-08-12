<template>
  <div class="bg-white rounded-lg p-4 border border-gray-200">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-gray-700">{{ label }}</span>
      <div 
        :class="[
          'w-8 h-8 rounded-full flex items-center justify-center',
          {
            'bg-red-100': color === 'red',
            'bg-blue-100': color === 'blue',
            'bg-green-100': color === 'green',
            'bg-yellow-100': color === 'yellow',
            'bg-purple-100': color === 'purple',
            'bg-orange-100': color === 'orange',
            'bg-gray-100': color === 'gray'
          }
        ]"
      >
        <span 
          :class="[
            'text-xs font-bold',
            {
              'text-red-600': color === 'red',
              'text-blue-600': color === 'blue',
              'text-green-600': color === 'green',
              'text-yellow-600': color === 'yellow',
              'text-purple-600': color === 'purple',
              'text-orange-600': color === 'orange',
              'text-gray-600': color === 'gray'
            }
          ]"
        >
          {{ formatNutritionValue(value, unit) }}
        </span>
      </div>
    </div>
    
    <!-- Daily value percentage -->
    <div v-if="dailyValue" class="space-y-1">
      <div class="flex justify-between text-xs text-gray-500">
        <span>Daily Value</span>
        <span>{{ calculateDailyValuePercentage(value, dailyValue) }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-1.5">
        <div 
          :class="[
            'h-1.5 rounded-full',
            {
              'bg-red-500': color === 'red',
              'bg-blue-500': color === 'blue',
              'bg-green-500': color === 'green',
              'bg-yellow-500': color === 'yellow',
              'bg-purple-500': color === 'purple',
              'bg-orange-500': color === 'orange',
              'bg-gray-500': color === 'gray'
            }
          ]"
          :style="{ width: `${Math.min(calculateDailyValuePercentage(value, dailyValue), 100)}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { calculateDailyValuePercentage, formatNutritionValue } from '~/types/nutrition'

interface Props {
  value: number
  unit: string
  color: 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'gray'
  label: string
  dailyValue?: number
}

defineProps<Props>()
</script>
