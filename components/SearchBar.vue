<template>
  <div class="w-full">
    <div class="flex items-center space-x-3">
      <!-- Toggle Switch -->
      <div class="flex items-center bg-gray-100 rounded-lg p-1 shadow-sm">
        <button
          @click="setSearchMode('database')"
          :class="[
            'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
            searchMode === 'database'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          ]"
          :title="searchMode === 'database' ? 'Currently searching local database' : 'Switch to local database search'"
        >
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
          </svg>
          Database
        </button>
        <button
          @click="setSearchMode('spoonacular')"
          :class="[
            'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
            searchMode === 'spoonacular'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          ]"
          :title="searchMode === 'spoonacular' ? 'Currently searching external recipes' : 'Switch to external recipe search'"
        >
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
          </svg>
          Spoonacular
        </button>
      </div>

      <!-- Search input -->
      <div class="flex-1 relative">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <input
            v-model="searchInput"
            type="text"
            :placeholder="searchMode === 'database' ? 'Search local recipes...' : 'Search external recipes...'"
            class="block w-full pl-10 pr-12 py-4 border border-gray-300 rounded-xl bg-white shadow-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 transition-all duration-200"
            @input="handleSearch"
            @keydown.enter="handleEnter"
          />
          
          <!-- Clear button -->
          <button
            v-if="searchInput"
            @click="clearSearch"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Search suggestions (optional) -->
        <div v-if="showSuggestions && suggestions.length > 0" class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <ul class="py-1">
            <li
              v-for="suggestion in suggestions"
              :key="suggestion"
              @click="selectSuggestion(suggestion)"
              class="px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-700 transition-colors duration-150"
            >
              {{ suggestion }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRecipesStore } from '~/stores/recipes'

const recipesStore = useRecipesStore()

const searchInput = ref('')
const showSuggestions = ref(false)
const searchMode = ref<'database' | 'spoonacular'>('database')

// Popular search suggestions
const suggestions = computed(() => {
  const popularSearches = [
    'chicken',
    'pasta',
    'vegetarian',
    'quick dinner',
    'dessert',
    'breakfast',
    'salad',
    'soup'
  ]
  
  if (!searchInput.value) return popularSearches
  
  return popularSearches.filter(suggestion => 
    suggestion.toLowerCase().includes(searchInput.value.toLowerCase())
  )
})

// Set search mode
function setSearchMode(mode: 'database' | 'spoonacular') {
  searchMode.value = mode
  recipesStore.setSearchMode(mode)
  
  // If there's a current search query, re-search with new mode
  if (searchInput.value.trim()) {
    handleSearch()
  }
}

// Handle search input
function handleSearch() {
  showSuggestions.value = true
  recipesStore.debouncedSearch(searchInput.value, searchMode.value)
}

// Handle enter key
function handleEnter() {
  showSuggestions.value = false
  if (searchInput.value.trim()) {
    recipesStore.searchWithCurrentMode({ 
      query: searchInput.value.trim(), 
      offset: 0 
    })
  }
}

// Clear search
function clearSearch() {
  searchInput.value = ''
  showSuggestions.value = false
  recipesStore.loadPopularRecipes()
}

// Select suggestion
function selectSuggestion(suggestion: string) {
  searchInput.value = suggestion
  showSuggestions.value = false
  recipesStore.searchWithCurrentMode({ 
    query: suggestion, 
    offset: 0 
  })
}

// Close suggestions when clicking outside
onMounted(() => {
  document.addEventListener('click', (event) => {
    const target = event.target as Element
    if (!target.closest('.relative')) {
      showSuggestions.value = false
    }
  })
})

// Initialize with popular recipes and default search mode
onMounted(() => {
  recipesStore.setSearchMode('database')
  recipesStore.loadPopularRecipes()
})
</script>
