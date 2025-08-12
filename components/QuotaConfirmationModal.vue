<template>
  <div v-if="show" class="quota-modal-overlay" @click="handleOverlayClick">
    <div class="quota-modal" @click.stop>
      <div class="quota-modal-header">
        <div class="quota-icon">
          <Icon name="alert-triangle" class="w-8 h-8 text-yellow-500" />
        </div>
        <h2 class="quota-title">API Quota Warning</h2>
      </div>
      
      <div class="quota-content">
        <div v-if="quotaInfo" class="quota-progress">
          <div class="quota-progress-bar">
            <div 
              class="quota-progress-fill" 
              :class="progressBarClass"
              :style="{ width: `${quotaInfo.percentageUsed}%` }"
            ></div>
          </div>
          <div class="quota-stats">
            <span class="quota-used">{{ quotaInfo.quotaUsed }} / {{ quotaInfo.quotaLimit }} used</span>
            <span class="quota-percentage">{{ quotaInfo.percentageUsed.toFixed(1) }}%</span>
          </div>
        </div>
        
        <div v-if="quotaInfo" class="quota-details">
          <div class="quota-item">
            <Icon name="clock" class="w-4 h-4" />
            <span>Remaining requests: <strong>{{ quotaInfo.quotaLeft }}</strong></span>
          </div>
          <div class="quota-item">
            <Icon name="refresh" class="w-4 h-4" />
            <span>Resets in: <strong>{{ formatResetTime }}</strong></span>
          </div>
          <div class="quota-item">
            <Icon name="info" class="w-4 h-4" />
            <span>This request will use: <strong>{{ quotaInfo.quotaRequest }} points</strong></span>
          </div>
        </div>
        
        <div v-else class="quota-details">
          <div class="quota-item">
            <Icon name="info" class="w-4 h-4" />
            <span>Quota information not available</span>
          </div>
        </div>
        
        <div class="quota-warning">
          <p class="warning-text">
            You're approaching your daily API limit. Continuing will use additional quota points.
          </p>
        </div>
      </div>
      
      <div class="quota-actions">
        <button 
          @click="handleCancel"
          class="cancel-button"
        >
          Cancel
        </button>
        <button 
          @click="handleConfirm"
          class="confirm-button"
        >
          Continue Anyway
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface QuotaInfo {
  quotaUsed: number
  quotaLeft: number
  quotaRequest: number
  quotaLimit: number
  percentageUsed: number
  resetTime: string
  dailyUsage: number
}

interface Props {
  show: boolean
  quotaInfo: QuotaInfo | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const progressBarClass = computed(() => {
  if (!props.quotaInfo) return 'bg-gray-500'
  if (props.quotaInfo.percentageUsed >= 95) return 'bg-red-500'
  if (props.quotaInfo.percentageUsed >= 85) return 'bg-yellow-500'
  return 'bg-blue-500'
})

const formatResetTime = computed(() => {
  if (!props.quotaInfo) return 'Unknown'
  const resetTime = new Date(props.quotaInfo.resetTime)
  const now = new Date()
  const diffMs = resetTime.getTime() - now.getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
})

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}

const handleOverlayClick = () => {
  emit('cancel')
}
</script>

<style scoped>
.quota-modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.quota-modal {
  @apply bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6;
}

.quota-modal-header {
  @apply flex items-center gap-3 mb-6;
}

.quota-title {
  @apply text-xl font-semibold text-gray-900;
}

.quota-progress {
  @apply mb-6;
}

.quota-progress-bar {
  @apply w-full bg-gray-200 rounded-full h-3 mb-2;
}

.quota-progress-fill {
  @apply h-3 rounded-full transition-all duration-300;
}

.quota-stats {
  @apply flex justify-between text-sm text-gray-600;
}

.quota-details {
  @apply space-y-3 mb-6;
}

.quota-item {
  @apply flex items-center gap-2 text-sm text-gray-700;
}

.quota-warning {
  @apply bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6;
}

.warning-text {
  @apply text-sm text-yellow-800;
}

.quota-actions {
  @apply flex gap-3 justify-end;
}

.cancel-button {
  @apply px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors;
}

.confirm-button {
  @apply px-4 py-2 bg-yellow-500 text-white hover:bg-yellow-600 rounded-md transition-colors;
}
</style>
