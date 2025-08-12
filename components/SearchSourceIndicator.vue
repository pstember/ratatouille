<template>
  <div v-if="shouldRender" class="search-source-indicator">
    <!-- Database Results -->
    <div v-if="searchState.searchSource === 'database' || searchState.searchSource === 'mixed'" class="database-results">
      <div class="source-header">
        <div class="source-badge database">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
          </svg>
          From Your Database
        </div>
        <div class="result-count">
          {{ searchState.databaseResults.length }} {{ searchState.databaseResults.length === 1 ? 'recipe' : 'recipes' }}
        </div>
      </div>

      <!-- Quality Assessment -->
      <div v-if="searchState.qualityAssessment" class="quality-info">
        <div :class="['quality-badge', searchState.qualityAssessment.isSufficient ? 'sufficient' : 'insufficient']">
          <svg v-if="searchState.qualityAssessment.isSufficient" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          {{ searchState.qualityAssessment.reason }}
        </div>
      </div>
    </div>

    <!-- API Results -->
    <div v-if="searchState.searchSource === 'api' || searchState.searchSource === 'spoonacular' || searchState.searchSource === 'mixed'" class="api-results">
      <div class="source-header">
        <div class="source-badge api">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
          </svg>
          From External API
        </div>
        <div class="result-count">
          {{ searchState.apiResults.length }} {{ searchState.apiResults.length === 1 ? 'recipe' : 'recipes' }}
        </div>
      </div>

      <!-- Enrichment Info -->
      <div v-if="searchState.enrichmentStats" class="flex items-center space-x-1 text-xs text-green-600">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        <span>{{ searchState.enrichmentStats.newRecipes }} enriched</span>
      </div>

      <!-- Quota Info -->
      <div v-if="searchState.quotaInfo" class="flex items-center space-x-1 text-xs text-orange-600">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <span>{{ searchState.quotaInfo.quotaUsed }} quota used</span>
      </div>
    </div>

    <!-- Spoonacular Option -->
    <div v-if="searchState.showSpoonacularOption" class="spoonacular-option">
      <div class="option-card">
        <div class="option-header">
          <h3 class="text-lg font-semibold text-gray-900">Search More Recipes</h3>
          <div class="cost-info">
            <span class="cost-badge">{{ searchState.estimatedApiCost }} credit</span>
          </div>
        </div>
        <p class="option-description">
          Search thousands more recipes from our external database
        </p>
        <div class="option-actions">
          <button 
            :class="['btn-primary', { 'opacity-50 cursor-not-allowed': loading }]"
            :disabled="loading"
            @click="$emit('searchSpoonacular')"
          >
            <span v-if="loading">Searching...</span>
            <span v-else>Search External Recipes</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SearchState } from '~/types/search'

interface Props {
  searchState: SearchState
  loading?: boolean
}

const props = defineProps<Props>()

defineEmits<{
  searchSpoonacular: []
}>()

const shouldRender = computed(() => {
  return props.searchState.searchSource !== 'database' || 
         props.searchState.showSpoonacularOption ||
         props.searchState.databaseResults.length > 0 ||
         props.searchState.apiResults.length > 0
})
</script>

<style scoped>
.search-source-indicator {
  @apply space-y-4 mb-6;
}

.source-header {
  @apply flex items-center justify-between mb-2;
}

.source-badge {
  @apply inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium;
}

.source-badge.database {
  @apply bg-blue-100 text-blue-800;
}

.source-badge.api {
  @apply bg-orange-100 text-orange-800;
}

.result-count {
  @apply text-sm text-gray-600;
}

.quality-info {
  @apply mb-3;
}

.quality-badge {
  @apply inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm;
}

.quality-badge.sufficient {
  @apply bg-green-100 text-green-800;
}

.quality-badge.insufficient {
  @apply bg-yellow-100 text-yellow-800;
}

.spoonacular-option {
  @apply mt-4;
}

.option-card {
  @apply bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4;
}

.option-header {
  @apply flex items-center justify-between mb-2;
}

.cost-info {
  @apply flex items-center;
}

.cost-badge {
  @apply inline-flex items-center px-2 py-1 bg-orange-200 text-orange-800 text-xs font-medium rounded-full;
}

.option-description {
  @apply text-sm text-gray-600 mb-3;
}

.option-actions {
  @apply flex justify-end;
}

.btn-primary {
  @apply inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200;
}

.database-results, .api-results {
  @apply bg-white border border-gray-200 rounded-lg p-4;
}
</style>
