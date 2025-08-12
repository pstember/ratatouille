<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <NuxtLink to="/" class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-lg">R</span>
            </div>
            <span class="text-xl font-bold text-gray-900">Ratatouille</span>
          </NuxtLink>
        </div>

        <!-- Spacer for layout balance -->
        <div class="flex-1"></div>

        <!-- Navigation -->
        <nav class="hidden md:flex space-x-8">
          <NuxtLink 
            to="/browse" 
            class="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            active-class="text-orange-600 bg-orange-50"
          >
            Browse Recipes
          </NuxtLink>
          
          <!-- Discover Recipe Button -->
          <NuxtLink 
            to="/discover" 
            class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium rounded-md shadow-md hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200"
          >
            🎲 Discover Recipe
          </NuxtLink>
        </nav>

        <!-- Mobile menu button -->
        <div class="md:hidden">
          <button 
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="text-gray-700 hover:text-orange-600 p-2 rounded-md"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                v-if="!mobileMenuOpen"
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path 
                v-else
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Category Navigation -->
      <div class="border-t border-gray-100">
        <nav class="category-nav">
          <button
            v-for="category in categories"
            :key="category.id"
            @click="selectCategory(category.id)"
            :class="[
              'category-button',
              selectedCategory === category.id
                ? 'category-button-active'
                : 'category-button-inactive'
            ]"
          >
            {{ category.name }}
          </button>
        </nav>
      </div>

      <!-- Mobile menu -->
      <div v-if="mobileMenuOpen" class="md:hidden">
        <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
          <NuxtLink 
            to="/browse" 
            class="text-gray-700 hover:text-orange-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
            active-class="text-orange-600 bg-orange-50"
            @click="mobileMenuOpen = false"
          >
            Browse Recipes
          </NuxtLink>
          
          <!-- Mobile Discover Recipe Button -->
          <NuxtLink 
            to="/discover" 
            class="inline-flex items-center px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-base font-medium rounded-md shadow-md hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200"
            @click="mobileMenuOpen = false"
          >
            🎲 Discover Recipe
          </NuxtLink>
          

          
          <!-- Mobile category menu -->
          <div class="pt-2 space-y-1">
            <div class="text-xs font-medium text-gray-500 px-3 py-1">Categories</div>
            <button
              v-for="category in categories"
              :key="category.id"
              @click="selectCategory(category.id); mobileMenuOpen = false"
              :class="[
                'block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200',
                selectedCategory === category.id
                  ? 'text-orange-600 bg-orange-50'
                  : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
              ]"
            >
              {{ category.name }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { RecipeCategory } from '~/types/recipe'

const mobileMenuOpen = ref(false)
const selectedCategory = ref('all')





const categories: RecipeCategory[] = [
  { id: 'all', name: 'All Recipes', filter: null },
  { id: 'quick', name: 'Quick Meals', filter: { maxTime: 20 } },
  { id: 'italian', name: 'Italian', filter: { cuisine: 'italian' } },
  { id: 'french', name: 'French', filter: { cuisine: 'french' } },
  { id: 'mexican', name: 'Mexican', filter: { cuisine: 'mexican' } },
  { id: 'indian', name: 'Indian', filter: { cuisine: 'indian' } },
  { id: 'chinese', name: 'Chinese', filter: { cuisine: 'chinese' } },
  { id: 'japanese', name: 'Japanese', filter: { cuisine: 'japanese' } },
  { id: 'mediterranean', name: 'Mediterranean', filter: { cuisine: 'mediterranean' } },
  { id: 'american', name: 'American', filter: { cuisine: 'american' } },
  { id: 'desserts', name: 'Desserts', filter: { type: 'dessert' } },
  { id: 'vegetarian', name: 'Vegetarian', filter: { dietary: 'vegetarian' } },
  { id: 'vegan', name: 'Vegan', filter: { dietary: 'vegan' } },
  { id: 'gluten-free', name: 'Gluten Free', filter: { dietary: 'gluten-free' } }
]

const emit = defineEmits<{
  'category-selected': [category: RecipeCategory]
}>()

function selectCategory(categoryId: string) {
  selectedCategory.value = categoryId
  const category = categories.find(c => c.id === categoryId)
  if (category) {
    emit('category-selected', category)
  }
}
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.category-nav {
  @apply flex space-x-1 overflow-x-auto py-2 px-4;
}

.category-button {
  @apply px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors duration-200;
}

.category-button-active {
  @apply bg-orange-100 text-orange-700;
}

.category-button-inactive {
  @apply text-gray-600 hover:text-orange-600 hover:bg-orange-50;
}
</style>
