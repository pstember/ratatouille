<template>
  <div v-if="!isOnline" class="offline-indicator">
    <div class="offline-banner">
      <div class="offline-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
        </svg>
      </div>
      <div class="offline-content">
        <h3 class="offline-title">You're offline</h3>
        <p class="offline-message">
          Some features may be limited. You can still browse cached recipes.
        </p>
      </div>
      <div class="offline-actions">
        <button 
          @click="retryConnection" 
          :disabled="isRetrying"
          class="retry-button"
        >
          <span v-if="isRetrying">Retrying...</span>
          <span v-else>Retry</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useOffline } from '~/composables/useOffline'

const { isOnline, checkConnectivity } = useOffline()
const isRetrying = ref(false)

const retryConnection = async () => {
  isRetrying.value = true
  
  try {
    const isConnected = await checkConnectivity()
    if (isConnected) {
      console.log('Connection restored')
    } else {
      console.log('Still offline')
    }
  } catch (error) {
    console.error('Connection check failed:', error)
  } finally {
    isRetrying.value = false
  }
}
</script>

<style scoped>
.offline-indicator {
  @apply fixed top-0 left-0 right-0 z-50;
}

.offline-banner {
  @apply bg-yellow-50 border-b border-yellow-200 px-4 py-3 flex items-center gap-3;
}

.offline-icon {
  @apply text-yellow-600 flex-shrink-0;
}

.offline-content {
  @apply flex-1;
}

.offline-title {
  @apply text-sm font-medium text-yellow-800;
}

.offline-message {
  @apply text-sm text-yellow-700 mt-1;
}

.offline-actions {
  @apply flex-shrink-0;
}

.retry-button {
  @apply px-3 py-1 text-sm font-medium text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
