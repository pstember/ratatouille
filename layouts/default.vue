<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <TheHeader @category-selected="handleCategorySelected" />
    
    <!-- Main Content -->
    <main class="flex-1">
      <slot :selectedCategory="selectedCategory" />
    </main>
    
    <!-- Footer -->
    <TheFooter />
  </div>
</template>

<script setup lang="ts">
import type { RecipeCategory } from '~/types/recipe'

const selectedCategory = ref<RecipeCategory | null>(null)

function handleCategorySelected(category: RecipeCategory) {
  selectedCategory.value = category
}
</script>
