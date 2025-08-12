<template>
  <div class="api-error-message" :class="errorTypeClass">
    <div class="error-icon">
      <Icon :name="errorIcon" class="w-6 h-6" />
    </div>
    
    <div class="error-content">
      <h3 class="error-title">{{ errorTitle }}</h3>
      <p class="error-message">{{ errorMessage }}</p>
      
      <div v-if="retryAfter" class="retry-info">
        <p class="retry-text">
          You can try again in {{ formatRetryTime(retryAfter) }}
        </p>
        <div class="retry-progress">
          <div 
            class="retry-progress-bar" 
            :style="{ width: `${retryProgress}%` }"
          ></div>
        </div>
      </div>
      
      <div v-if="fallbackData && fallbackData.length > 0" class="fallback-info">
        <p class="fallback-text">
          Showing {{ fallbackData.length }} cached recipes
        </p>
      </div>
      
      <div class="error-actions">
        <button 
          v-if="retryAfter && retryAfter <= 300"
          @click="retryRequest"
          :disabled="isRetrying"
          class="retry-button"
        >
          <Icon name="refresh" class="w-4 h-4" />
          {{ isRetrying ? 'Retrying...' : 'Try Again' }}
        </button>
        
        <button 
          @click="goHome"
          class="home-button"
        >
          <Icon name="home" class="w-4 h-4" />
          Go Home
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  errorType: 'RATE_LIMIT_EXCEEDED' | 'QUOTA_EXCEEDED' | 'GENERIC_ERROR'
  message: string
  retryAfter?: number
  fallbackData?: any[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  retry: []
  goHome: []
}>()

const isRetrying = ref(false)

const errorTypeClass = computed(() => ({
  'api-error-message': true,
  [`api-error-message--${props.errorType.toLowerCase()}`]: true
}))

const errorIcon = computed(() => {
  switch (props.errorType) {
    case 'RATE_LIMIT_EXCEEDED':
      return 'clock'
    case 'QUOTA_EXCEEDED':
      return 'calendar'
    default:
      return 'alert-triangle'
  }
})

const errorTitle = computed(() => {
  switch (props.errorType) {
    case 'RATE_LIMIT_EXCEEDED':
      return 'Rate Limit Reached'
    case 'QUOTA_EXCEEDED':
      return 'Daily Quota Exceeded'
    default:
      return 'Something Went Wrong'
  }
})

const errorMessage = computed(() => props.message)

const retryProgress = computed(() => {
  if (!props.retryAfter) return 0
  const elapsed = Date.now() - startTime.value
  const progress = (elapsed / (props.retryAfter * 1000)) * 100
  return Math.min(progress, 100)
})

const startTime = ref(Date.now())

const formatRetryTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds} seconds`
  const minutes = Math.ceil(seconds / 60)
  return `${minutes} minute${minutes > 1 ? 's' : ''}`
}

const retryRequest = async () => {
  isRetrying.value = true
  emit('retry')
  // Reset retry state after a delay
  setTimeout(() => {
    isRetrying.value = false
  }, 2000)
}

const goHome = () => {
  emit('goHome')
}
</script>

<style scoped>
.api-error-message {
  @apply bg-white rounded-lg border p-6 max-w-md mx-auto text-center;
}

.api-error-message--rate_limit_exceeded {
  @apply border-yellow-200 bg-yellow-50;
}

.api-error-message--quota_exceeded {
  @apply border-red-200 bg-red-50;
}

.api-error-message--generic_error {
  @apply border-gray-200 bg-gray-50;
}

.error-icon {
  @apply mx-auto mb-4;
}

.error-title {
  @apply text-lg font-semibold mb-2;
}

.error-message {
  @apply text-gray-600 mb-4;
}

.retry-info {
  @apply mb-4;
}

.retry-text {
  @apply text-sm text-gray-500 mb-2;
}

.retry-progress {
  @apply w-full bg-gray-200 rounded-full h-2;
}

.retry-progress-bar {
  @apply bg-blue-500 h-2 rounded-full transition-all duration-1000;
}

.fallback-info {
  @apply mb-4 p-3 bg-blue-50 rounded-md;
}

.fallback-text {
  @apply text-sm text-blue-700;
}

.error-actions {
  @apply flex gap-3 justify-center;
}

.retry-button, .home-button {
  @apply px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors;
}

.retry-button {
  @apply bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50;
}

.home-button {
  @apply bg-gray-500 text-white hover:bg-gray-600;
}
</style>
