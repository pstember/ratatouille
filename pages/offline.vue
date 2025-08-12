<template>
  <div class="offline-page">
    <div class="offline-container">
      <div class="offline-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
        </svg>
      </div>
      
      <h1 class="offline-title">You're offline</h1>
      
      <p class="offline-description">
        It looks like you've lost your internet connection. Don't worry - you can still browse cached recipes and use offline features.
      </p>
      
      <div class="offline-actions">
        <button 
          @click="retryConnection" 
          :disabled="isRetrying"
          class="retry-button"
        >
          <span v-if="isRetrying">Retrying...</span>
          <span v-else>Try Again</span>
        </button>
        
        <NuxtLink to="/" class="home-button">
          Go Home
        </NuxtLink>
      </div>
      
      <div class="offline-tips">
        <h3 class="tips-title">While you're offline:</h3>
        <ul class="tips-list">
          <li>Browse previously viewed recipes</li>
          <li>Search through cached content</li>
          <li>View recipe details and instructions</li>
          <li>Check your saved favorites</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useOffline } from '~/composables/useOffline'

const { checkConnectivity } = useOffline()
const isRetrying = ref(false)

const retryConnection = async () => {
  isRetrying.value = true
  
  try {
    const isConnected = await checkConnectivity()
    if (isConnected) {
      // Redirect to home page when connection is restored
      await navigateTo('/')
    } else {
      console.log('Still offline')
    }
  } catch (error) {
    console.error('Connection check failed:', error)
  } finally {
    isRetrying.value = false
  }
}

// Set page title
useHead({
  title: 'Offline - Ratatouille'
})
</script>

<style scoped>
.offline-page {
  @apply min-h-screen bg-gray-50 flex items-center justify-center px-4;
}

.offline-container {
  @apply max-w-md w-full text-center;
}

.offline-icon {
  @apply text-gray-400 mb-6;
}

.offline-title {
  @apply text-2xl font-bold text-gray-900 mb-4;
}

.offline-description {
  @apply text-gray-600 mb-8 leading-relaxed;
}

.offline-actions {
  @apply flex flex-col sm:flex-row gap-4 justify-center mb-8;
}

.retry-button {
  @apply px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

.home-button {
  @apply px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors;
}

.offline-tips {
  @apply text-left bg-white p-6 rounded-lg shadow-sm border border-gray-200;
}

.tips-title {
  @apply text-lg font-semibold text-gray-900 mb-3;
}

.tips-list {
  @apply space-y-2 text-gray-600;
}

.tips-list li {
  @apply flex items-start;
}

.tips-list li::before {
  content: "•";
  @apply text-blue-500 font-bold mr-2 mt-0.5;
}
</style>
