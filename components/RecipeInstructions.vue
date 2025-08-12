<template>
  <div class="recipe-instructions">
    <h3 class="text-lg font-semibold mb-4">Instructions</h3>
    
    <div v-if="analyzedInstructions && analyzedInstructions.length > 0" class="space-y-6">
      <div 
        v-for="instruction in analyzedInstructions" 
        :key="instruction.name"
        class="instruction-section"
      >
        <h4 v-if="analyzedInstructions.length > 1" class="text-md font-medium mb-3">
          {{ instruction.name }}
        </h4>
        
        <ol class="space-y-3">
          <li 
            v-for="step in instruction.steps" 
            :key="step.number"
            class="flex gap-3"
          >
            <span class="step-number">{{ step.number }}</span>
            <span class="step-text">{{ step.step }}</span>
          </li>
        </ol>
      </div>
    </div>
    
    <div v-else-if="instructions" class="instructions-fallback">
      <div class="prose prose-sm max-w-none">
        {{ instructions }}
      </div>
    </div>
    
    <div v-else class="no-instructions">
      <p class="text-gray-500 italic">No instructions available for this recipe.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SpoonacularInstruction } from '~/types/recipe'

interface Props {
  instructions?: string
  analyzedInstructions?: SpoonacularInstruction[]
}

defineProps<Props>()
</script>

<style scoped>
.step-number {
  @apply flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center text-sm font-medium;
}

.step-text {
  @apply flex-1 leading-relaxed;
}

.instruction-section {
  @apply border-l-2 border-gray-200 pl-4;
}

.instructions-fallback {
  @apply bg-gray-50 p-4 rounded-lg;
}
</style>
