<template>
  <div class="quota-gauge">
    <!-- Show placeholder when quota info is not available -->
    <div 
      v-if="!quotaInfo" 
      class="gauge-placeholder"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
      @focus="showTooltip = true"
      @blur="showTooltip = false"
    >
      <svg 
        class="gauge-svg gauge-svg--md" 
        viewBox="0 0 100 100"
        role="img"
        aria-label="API quota loading"
      >
        <!-- Background circle -->
        <circle
          cx="50"
          cy="50"
          r="40"
          class="gauge-background"
          fill="none"
          stroke-width="8"
        />
        
        <!-- Loading indicator -->
        <circle
          cx="50"
          cy="50"
          r="40"
          class="gauge-loading"
          fill="none"
          stroke-width="8"
          stroke-linecap="round"
          stroke-dasharray="251.2"
          stroke-dashoffset="188.4"
          transform="rotate(-90 50 50)"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 50 50;360 50 50"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        
        <!-- Center text -->
        <text
          x="50"
          y="50"
          class="gauge-percentage text-gray-400"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="10"
          font-weight="bold"
        >
          API
        </text>
      </svg>
      
      <!-- Placeholder tooltip -->
      <div 
        v-if="showTooltip && !quotaInfo"
        class="quota-tooltip tooltip-position-bottom"
      >
        <div class="tooltip-content">
          <div class="tooltip-header">
            <span class="tooltip-title">API Quota</span>
            <span class="tooltip-status text-gray-500">Loading...</span>
          </div>
          <div class="tooltip-details">
            <div class="tooltip-item">
              <span class="tooltip-label">Status:</span>
              <span class="tooltip-value">Initializing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Show actual gauge when quota info is available -->
    <div v-else>
    <!-- Tooltip trigger -->
    <div 
      class="gauge-container"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
      @focus="showTooltip = true"
      @blur="showTooltip = false"
    >
      <!-- SVG Gauge -->
      <svg 
        class="gauge-svg" 
        :class="gaugeSizeClass"
        viewBox="0 0 100 100"
        role="img"
        :aria-label="`API quota usage: ${quotaInfo.percentageUsed.toFixed(1)}%`"
      >
        <!-- Background circle -->
        <circle
          cx="50"
          cy="50"
          r="40"
          class="gauge-background"
          fill="none"
          stroke-width="8"
        />
        
        <!-- Progress circle -->
        <circle
          cx="50"
          cy="50"
          r="40"
          class="gauge-progress"
          :class="progressColorClass"
          fill="none"
          stroke-width="8"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="strokeDashoffset"
          transform="rotate(-90 50 50)"
        />
        
        <!-- Center text -->
        <text
          x="50"
          y="45"
          class="gauge-percentage"
          :class="percentageColorClass"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="12"
          font-weight="bold"
        >
          {{ Math.round(animatedPercentage) }}%
        </text>
        
        <!-- Used/Total text -->
        <text
          x="50"
          y="60"
          class="gauge-numbers"
          :class="numbersColorClass"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="8"
        >
          {{ quotaInfo.quotaUsed }}/{{ quotaInfo.quotaLimit }}
        </text>
      </svg>
      
      <!-- Warning indicator for high usage -->
      <div 
        v-if="animatedPercentage >= 70"
        class="warning-indicator"
        :class="warningColorClass"
      >
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>
    
    <!-- Tooltip -->
    <div 
      v-if="showTooltip"
      class="quota-tooltip"
      :class="tooltipPositionClass"
    >
      <div class="tooltip-content">
        <div class="tooltip-header">
          <span class="tooltip-title">API Quota Usage</span>
          <span class="tooltip-status" :class="statusColorClass">
            {{ quotaStatus }}
          </span>
        </div>
        
        <div class="tooltip-details">
          <div class="tooltip-item">
            <span class="tooltip-label">Used:</span>
            <span class="tooltip-value">{{ quotaInfo.quotaUsed }} points</span>
          </div>
          <div class="tooltip-item">
            <span class="tooltip-label">Remaining:</span>
            <span class="tooltip-value">{{ quotaInfo.quotaLeft }} points</span>
          </div>
          <div class="tooltip-item">
            <span class="tooltip-label">Daily Limit:</span>
            <span class="tooltip-value">{{ quotaInfo.quotaLimit }} points</span>
          </div>
          <div class="tooltip-item">
            <span class="tooltip-label">Resets:</span>
            <span class="tooltip-value">{{ formatResetTime }}</span>
          </div>
        </div>
        
        <div v-if="animatedPercentage >= 70" class="tooltip-warning">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span class="warning-text">{{ warningMessage }}</span>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { QuotaInfo } from '~/types/recipe'

interface Props {
  quotaInfo: QuotaInfo | null
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  disableAnimation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showTooltip: true,
  disableAnimation: false
})

const showTooltip = ref(false)

// Animated percentage for smooth loading
const animatedPercentage = ref(0)
const isAnimating = ref(false)

// Gauge calculations
const circumference = 2 * Math.PI * 40 // r=40
const strokeDashoffset = computed(() => {
  if (!props.quotaInfo) return circumference
  return circumference - (animatedPercentage.value / 100) * circumference
})

// Animation function
const animatePercentage = (targetPercentage: number) => {
  if (props.disableAnimation) {
    animatedPercentage.value = targetPercentage
    return
  }
  
  if (isAnimating.value) return
  
  isAnimating.value = true
  const startPercentage = animatedPercentage.value
  const duration = 1500 // 1.5 seconds
  const startTime = performance.now()
  
  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Easing function for smooth animation
    const easeOutQuart = 1 - Math.pow(1 - progress, 4)
    
    animatedPercentage.value = startPercentage + (targetPercentage - startPercentage) * easeOutQuart
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      animatedPercentage.value = targetPercentage
      isAnimating.value = false
    }
  }
  
  requestAnimationFrame(animate)
}

// Watch for quota info changes and animate
watch(() => props.quotaInfo?.percentageUsed, (newPercentage) => {
  if (newPercentage !== undefined) {
    animatePercentage(newPercentage)
  }
}, { immediate: true })

// Initialize animation on mount
onMounted(() => {
  if (props.quotaInfo?.percentageUsed !== undefined) {
    animatePercentage(props.quotaInfo.percentageUsed)
  }
})

// Size classes
const gaugeSizeClass = computed(() => ({
  'gauge-svg--sm': props.size === 'sm',
  'gauge-svg--md': props.size === 'md',
  'gauge-svg--lg': props.size === 'lg'
}))

// Color classes based on animated usage percentage
const progressColorClass = computed(() => {
  if (!props.quotaInfo) return 'text-gray-300'
  
  if (animatedPercentage.value >= 90) return 'text-red-500'
  if (animatedPercentage.value >= 70) return 'text-yellow-500'
  return 'text-green-500'
})

const percentageColorClass = computed(() => {
  if (!props.quotaInfo) return 'text-gray-600'
  
  if (animatedPercentage.value >= 90) return 'text-red-600'
  if (animatedPercentage.value >= 70) return 'text-yellow-600'
  return 'text-green-600'
})

const numbersColorClass = computed(() => {
  if (!props.quotaInfo) return 'text-gray-500'
  
  if (animatedPercentage.value >= 90) return 'text-red-500'
  if (animatedPercentage.value >= 70) return 'text-yellow-500'
  return 'text-gray-500'
})

const warningColorClass = computed(() => {
  if (!props.quotaInfo) return 'text-gray-400'
  
  if (animatedPercentage.value >= 90) return 'text-red-500'
  return 'text-yellow-500'
})

const statusColorClass = computed(() => {
  if (!props.quotaInfo) return 'text-gray-500'
  
  if (animatedPercentage.value >= 90) return 'text-red-600'
  if (animatedPercentage.value >= 70) return 'text-yellow-600'
  return 'text-green-600'
})

// Status and warning messages
const quotaStatus = computed(() => {
  if (!props.quotaInfo) return 'Unknown'
  
  if (animatedPercentage.value >= 90) return 'Critical'
  if (animatedPercentage.value >= 70) return 'Warning'
  return 'Good'
})

const warningMessage = computed(() => {
  if (!props.quotaInfo) return ''
  
  if (animatedPercentage.value >= 90) {
    return 'Critical usage level. Consider waiting until quota resets.'
  }
  if (animatedPercentage.value >= 70) {
    return 'High usage level. Monitor your remaining requests.'
  }
  return ''
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

// Tooltip positioning
const tooltipPositionClass = computed(() => {
  // Default to bottom positioning, can be customized based on viewport
  return 'tooltip-position-bottom'
})
</script>

<style scoped>
.quota-gauge {
  @apply relative inline-block;
}

.gauge-container {
  @apply relative cursor-help;
}

.gauge-svg {
  @apply transition-all duration-300;
}

.gauge-svg--sm {
  @apply w-8 h-8;
}

.gauge-svg--md {
  @apply w-10 h-10;
}

.gauge-svg--lg {
  @apply w-12 h-12;
}

.gauge-background {
  @apply stroke-gray-200;
}

.gauge-progress {
  @apply transition-all duration-500 ease-out;
}

.gauge-loading {
  @apply stroke-orange-400;
}

.gauge-percentage {
  @apply font-bold;
}

.gauge-numbers {
  @apply font-medium;
}

.warning-indicator {
  @apply absolute -top-1 -right-1 animate-pulse;
}

.quota-tooltip {
  @apply absolute z-50;
}

.tooltip-position-bottom {
  @apply top-full left-1/2 transform -translate-x-1/2 mt-2;
}

.tooltip-content {
  @apply bg-gray-900 text-white rounded-lg p-3 shadow-lg max-w-xs;
}

.tooltip-header {
  @apply flex items-center justify-between mb-2;
}

.tooltip-title {
  @apply text-sm font-medium;
}

.tooltip-status {
  @apply text-xs font-semibold px-2 py-1 rounded-full;
}

.tooltip-details {
  @apply space-y-1 mb-2;
}

.tooltip-item {
  @apply flex justify-between text-xs;
}

.tooltip-label {
  @apply text-gray-300;
}

.tooltip-value {
  @apply font-medium;
}

.tooltip-warning {
  @apply flex items-center gap-2 p-2 bg-yellow-900 bg-opacity-50 rounded text-yellow-200 text-xs;
}

.warning-text {
  @apply font-medium;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .gauge-svg--md {
    @apply w-8 h-8;
  }
  
  .gauge-svg--sm {
    @apply w-6 h-6;
  }
  
  .quota-tooltip {
    @apply hidden;
  }
}
</style>
