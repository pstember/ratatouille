<template>
  <div class="nutritional-info">
    <!-- Compact view for cards -->
    <div v-if="compact" class="flex flex-wrap gap-2">
      <NutritionBadge 
        v-if="nutrition.calories" 
        :value="nutrition.calories" 
        unit="cal" 
        color="red" 
        label="Calories"
      />
      <NutritionBadge 
        v-if="nutrition.protein" 
        :value="nutrition.protein" 
        unit="g" 
        color="blue" 
        label="Protein"
      />
      <NutritionBadge 
        v-if="nutrition.carbs" 
        :value="nutrition.carbs" 
        unit="g" 
        color="green" 
        label="Carbs"
      />
      <NutritionBadge 
        v-if="nutrition.fat" 
        :value="nutrition.fat" 
        unit="g" 
        color="yellow" 
        label="Fat"
      />
    </div>

    <!-- Detailed view for recipe pages -->
    <div v-else class="space-y-4">
      <!-- Main nutrition grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NutritionCard 
          v-if="nutrition.calories" 
          :value="nutrition.calories" 
          unit="calories" 
          color="red" 
          label="Calories"
          :daily-value="DAILY_VALUES.calories"
        />
        <NutritionCard 
          v-if="nutrition.protein" 
          :value="nutrition.protein" 
          unit="g" 
          color="blue" 
          label="Protein"
          :daily-value="DAILY_VALUES.protein"
        />
        <NutritionCard 
          v-if="nutrition.carbs" 
          :value="nutrition.carbs" 
          unit="g" 
          color="green" 
          label="Carbohydrates"
          :daily-value="DAILY_VALUES.carbs"
        />
        <NutritionCard 
          v-if="nutrition.fat" 
          :value="nutrition.fat" 
          unit="g" 
          color="yellow" 
          label="Fat"
          :daily-value="DAILY_VALUES.fat"
        />
      </div>

      <!-- Additional nutrition info -->
      <div v-if="showDetails" class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <NutritionCard 
          v-if="nutrition.fiber" 
          :value="nutrition.fiber" 
          unit="g" 
          color="purple" 
          label="Fiber"
          :daily-value="DAILY_VALUES.fiber"
        />
        <NutritionCard 
          v-if="nutrition.sugar" 
          :value="nutrition.sugar" 
          unit="g" 
          color="orange" 
          label="Sugar"
          :daily-value="DAILY_VALUES.sugar"
        />
        <NutritionCard 
          v-if="nutrition.sodium" 
          :value="nutrition.sodium" 
          unit="mg" 
          color="gray" 
          label="Sodium"
          :daily-value="DAILY_VALUES.sodium"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NutritionDisplay } from '~/types/nutrition'
import { DAILY_VALUES } from '~/types/nutrition'

interface Props {
  nutrition: NutritionDisplay
  compact?: boolean
  showDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  showDetails: false
})
</script>
