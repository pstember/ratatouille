# Frontend Components Specification

## Overview

This specification defines the Vue 3 component architecture, component hierarchy, and UI patterns for the Ratatouille Recipe Discovery Platform.

## Component Architecture

### Component Hierarchy

```
App.vue
├── layouts/default.vue
│   ├── TheHeader.vue
│   │   ├── SearchBar.vue
│   │   ├── QuotaGauge.vue
│   │   └── CuisineFilter.vue
│   ├── <NuxtPage />
│   └── TheFooter.vue
├── pages/index.vue
│   ├── RecipeCard.vue
│   ├── RecipeSkeleton.vue
│   └── NoResults.vue
└── pages/recipe/[id].vue
    ├── RecipeDetail.vue
    ├── NutritionalInfo.vue
    ├── CuisineBadge.vue
    └── NewBadge.vue
```

### Component Categories

#### Layout Components
- **App.vue**: Root application component
- **layouts/default.vue**: Default page layout
- **TheHeader.vue**: Site navigation and search
- **TheFooter.vue**: Site footer

#### Page Components
- **pages/index.vue**: Recipe search and listing page
- **pages/recipe/[id].vue**: Individual recipe detail page

#### UI Components
- **RecipeCard.vue**: Recipe preview card
- **RecipeSkeleton.vue**: Loading placeholder
- **SearchBar.vue**: Search input component
- **QuotaGauge.vue**: Round gauge showing API quota usage
- **CuisineBadge.vue**: Cuisine type indicator
- **NewBadge.vue**: New recipe indicator
- **NutritionalInfo.vue**: Nutrition display
- **NutritionBadge.vue**: Nutrition badge
- **NutritionCard.vue**: Nutrition card

## Component Specifications

### App.vue

**Purpose**: Root application component with global configuration

```vue
<template>
  <div id="app">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Global app configuration
useHead({
  title: 'Ratatouille - Recipe Discovery Platform',
  meta: [
    { name: 'description', content: 'Discover and explore culinary recipes' }
  ]
})
</script>
```

**Features**:
- Global meta tags and SEO
- Layout wrapper
- Page routing

### layouts/default.vue

**Purpose**: Default page layout with header and footer

```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <TheHeader />
    <main class="container mx-auto px-4 py-8">
      <slot />
    </main>
    <TheFooter />
  </div>
</template>
```

**Features**:
- Responsive container layout
- Consistent spacing
- Header and footer integration

### TheHeader.vue

**Purpose**: Site navigation with search, quota gauge, and cuisine filters

```vue
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

        <!-- Search and Quota Section -->
        <div class="flex-1 max-w-2xl mx-8 flex items-center gap-4">
          <SearchBar class="flex-1" />
          <QuotaGauge :quota-info="quotaInfo" />
        </div>

        <!-- Navigation -->
        <nav class="hidden md:flex space-x-8">
          <NuxtLink 
            to="/" 
            class="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            active-class="text-orange-600 bg-orange-50"
          >
            Discover Recipes
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
            to="/" 
            class="text-gray-700 hover:text-orange-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
            active-class="text-orange-600 bg-orange-50"
            @click="mobileMenuOpen = false"
          >
            Discover Recipes
          </NuxtLink>
          
          <!-- Mobile quota display -->
          <div v-if="quotaInfo" class="px-3 py-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">API Quota:</span>
              <span :class="quotaTextClass">
                {{ quotaInfo.quotaUsed }}/{{ quotaInfo.quotaLimit }}
              </span>
            </div>
          </div>
          
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
import type { RecipeCategory, QuotaInfo } from '~/types/recipe'

const mobileMenuOpen = ref(false)
const selectedCategory = ref('all')

// Get quota info from store
const quotaStore = useQuotaStore()
const { quotaInfo } = storeToRefs(quotaStore)

const quotaTextClass = computed(() => {
  if (!quotaInfo.value) return 'text-gray-600'
  
  if (quotaInfo.value.percentageUsed >= 90) return 'text-red-600 font-semibold'
  if (quotaInfo.value.percentageUsed >= 70) return 'text-yellow-600 font-semibold'
  return 'text-green-600'
})

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
  categorySelected: [category: RecipeCategory]
}>()

function selectCategory(categoryId: string) {
  selectedCategory.value = categoryId
  const category = categories.find(c => c.id === categoryId)
  if (category) {
    emit('categorySelected', category)
  }
}
</script>
```

**Props**: None
**Events**: 
- `categorySelected`: Emitted when cuisine filter changes

**Features**:
- Responsive design with search and quota gauge
- Search integration
- Cuisine filter navigation
- Brand identity
- Mobile-friendly layout

### SearchBar.vue

**Purpose**: Search input with real-time functionality

```vue
<template>
  <div class="relative">
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Search recipes..."
      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
      @input="handleSearch"
    />
    <button
      v-if="searchQuery"
      @click="clearSearch"
      class="absolute right-3 top-1/2 transform -translate-y-1/2"
    >
      ✕
    </button>
  </div>
</template>

<script setup lang="ts">
const searchQuery = ref('')
const emit = defineEmits<{
  search: [query: string]
  clear: []
}>()

const handleSearch = useDebounceFn(() => {
  emit('search', searchQuery.value)
}, 300)

const clearSearch = () => {
  searchQuery.value = ''
  emit('clear')
}
</script>
```

**Props**: None
**Events**:
- `search`: Emitted with search query
- `clear`: Emitted when search is cleared

**Features**:
- Debounced search input
- Clear button
- Keyboard navigation
- Accessibility support

### QuotaGauge.vue

**Purpose**: Round gauge component displaying API quota usage with visual indicators

**Quota Loading System**:
The QuotaGauge component now includes a complete quota loading system that ensures quota information is available immediately when the application loads.

**Quota Store Integration**:
```typescript
// stores/quota.ts
export const useQuotaStore = defineStore('quota', () => {
  const quotaInfo = ref<QuotaInfo | null>(null)
  const requiresConfirmation = ref(false)
  const pendingRequest = ref<(() => Promise<any>) | null>(null)
  
  // Load initial quota information
  async function loadQuotaInfo() {
    try {
      const response = await $fetch('/api/quota')
      if (response && response.quotaInfo) {
        quotaInfo.value = response.quotaInfo
        requiresConfirmation.value = false
      }
    } catch (error) {
      console.error('Failed to load quota info:', error)
      // Don't throw error, just log it - quota info is not critical for app functionality
    }
  }
  
  return {
    quotaInfo,
    requiresConfirmation,
    pendingRequest,
    updateQuotaFromResponse,
    executeWithQuotaCheck,
    confirmAndExecute,
    cancelPendingRequest,
    loadQuotaInfo,
    resetDailyQuota
  }
})
```

**Page Initialization**:
```typescript
// pages/index.vue
onMounted(async () => {
  // Initialize daily quota reset and load quota info
  quotaStore.resetDailyQuota()
  await quotaStore.loadQuotaInfo()
  
  // ... other initialization code
})
```

**Animation Implementation**:
```typescript
// components/QuotaGauge.vue
// Animated percentage for smooth loading
const animatedPercentage = ref(0)
const isAnimating = ref(false)

// Animation function with easing
const animatePercentage = (targetPercentage: number) => {
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
```

**Features**:
- **Immediate Loading**: Quota information loads when the page initializes
- **Smooth Animation**: 1.5-second animated gauge fill with easing functions
- **Real-time Updates**: Updates quota info from API responses with smooth transitions
- **Visual Indicators**: Color-coded gauge based on usage percentage
- **Animated Warnings**: Smooth warning indicators for high usage levels
- **Consistent Terminology**: Uses "points" instead of "requests" throughout
- **Performance Optimized**: Uses requestAnimationFrame for 60fps animations
- **Graceful Fallback**: Shows loading state if quota data is unavailable
- **Error Handling**: Continues app functionality even if quota loading fails

```vue
<template>
  <div v-if="quotaInfo" class="quota-gauge">
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
          {{ Math.round(quotaInfo.percentageUsed) }}%
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
        v-if="quotaInfo.percentageUsed >= 70"
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
            <span class="tooltip-value">{{ quotaInfo.quotaUsed }} requests</span>
          </div>
          <div class="tooltip-item">
            <span class="tooltip-label">Remaining:</span>
            <span class="tooltip-value">{{ quotaInfo.quotaLeft }} requests</span>
          </div>
          <div class="tooltip-item">
            <span class="tooltip-label">Daily Limit:</span>
            <span class="tooltip-value">{{ quotaInfo.quotaLimit }} requests</span>
          </div>
          <div class="tooltip-item">
            <span class="tooltip-label">Resets:</span>
            <span class="tooltip-value">{{ formatResetTime }}</span>
          </div>
        </div>
        
        <div v-if="quotaInfo.percentageUsed >= 70" class="tooltip-warning">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span class="warning-text">{{ warningMessage }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QuotaInfo } from '~/types/recipe'

interface Props {
  quotaInfo: QuotaInfo | null
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showTooltip: true
})

const showTooltip = ref(false)

// Gauge calculations
const circumference = 2 * Math.PI * 40 // r=40
const strokeDashoffset = computed(() => {
  if (!props.quotaInfo) return circumference
  return circumference - (props.quotaInfo.percentageUsed / 100) * circumference
})

// Size classes
const gaugeSizeClass = computed(() => ({
  'gauge-svg--sm': props.size === 'sm',
  'gauge-svg--md': props.size === 'md',
  'gauge-svg--lg': props.size === 'lg'
}))

// Color classes based on usage percentage
const progressColorClass = computed(() => {
  if (!props.quotaInfo) return 'text-gray-300'
  
  if (props.quotaInfo.percentageUsed >= 90) return 'text-red-500'
  if (props.quotaInfo.percentageUsed >= 70) return 'text-yellow-500'
  return 'text-green-500'
})

const percentageColorClass = computed(() => {
  if (!props.quotaInfo) return 'text-gray-600'
  
  if (props.quotaInfo.percentageUsed >= 90) return 'text-red-600'
  if (props.quotaInfo.percentageUsed >= 70) return 'text-yellow-600'
  return 'text-green-600'
})

const numbersColorClass = computed(() => {
  if (!props.quotaInfo) return 'text-gray-500'
  
  if (props.quotaInfo.percentageUsed >= 90) return 'text-red-500'
  if (props.quotaInfo.percentageUsed >= 70) return 'text-yellow-500'
  return 'text-gray-500'
})

const warningColorClass = computed(() => {
  if (!props.quotaInfo) return 'text-gray-400'
  
  if (props.quotaInfo.percentageUsed >= 90) return 'text-red-500'
  return 'text-yellow-500'
})

const statusColorClass = computed(() => {
  if (!props.quotaInfo) return 'text-gray-500'
  
  if (props.quotaInfo.percentageUsed >= 90) return 'text-red-600'
  if (props.quotaInfo.percentageUsed >= 70) return 'text-yellow-600'
  return 'text-green-600'
})

// Status and warning messages
const quotaStatus = computed(() => {
  if (!props.quotaInfo) return 'Unknown'
  
  if (props.quotaInfo.percentageUsed >= 90) return 'Critical'
  if (props.quotaInfo.percentageUsed >= 70) return 'Warning'
  return 'Good'
})

const warningMessage = computed(() => {
  if (!props.quotaInfo) return ''
  
  if (props.quotaInfo.percentageUsed >= 90) {
    return 'Critical usage level. Consider waiting until quota resets.'
  }
  if (props.quotaInfo.percentageUsed >= 70) {
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
  
  .quota-tooltip {
    @apply hidden;
  }
}
</style>
```

**Props**:
- `quotaInfo`: QuotaInfo object with usage data
- `size`: Gauge size ('sm', 'md', 'lg')
- `showTooltip`: Whether to show tooltip on hover

**Features**:
- Circular progress gauge with smooth animations
- Color-coded usage levels (green/yellow/red)
- Interactive tooltip with detailed information
- Warning indicators for high usage
- Responsive design
- Accessibility support with ARIA labels
- Smooth transitions and animations

### RecipeCard.vue

**Purpose**: Recipe preview card with key information

```vue
<template>
  <article class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
    <div class="relative">
      <img
        :src="recipe.image"
        :alt="recipe.title"
        class="w-full h-48 object-cover"
        loading="lazy"
      />
      <div class="absolute top-2 right-2 flex gap-1">
        <CuisineBadge :cuisine="recipe.cuisine" />
        <NewBadge v-if="recipe.isNew" />
      </div>
    </div>
    <div class="p-4">
      <h3 class="text-lg font-semibold mb-2 line-clamp-2">
        {{ recipe.title }}
      </h3>
      <div class="flex items-center justify-between text-sm text-gray-600">
        <span>Ready in {{ recipe.readyInMinutes }} min</span>
        <span>{{ recipe.servings }} servings</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
interface Props {
  recipe: Recipe
}

defineProps<Props>()
</script>
```

**Props**:
- `recipe`: Recipe object with required properties

**Features**:
- Responsive image display
- Cuisine and new badges
- Hover effects
- Loading optimization

### CuisineBadge.vue

**Purpose**: Visual indicator for cuisine types

```vue
<template>
  <span
    :class="[
      'px-2 py-1 text-xs font-medium rounded-full',
      cuisineColors[cuisine] || 'bg-gray-100 text-gray-800'
    ]"
  >
    {{ formatCuisine(cuisine) }}
  </span>
</template>

<script setup lang="ts">
interface Props {
  cuisine?: string
}

const props = defineProps<Props>()

const cuisineColors = {
  italian: 'bg-green-100 text-green-800',
  french: 'bg-blue-100 text-blue-800',
  mexican: 'bg-red-100 text-red-800',
  indian: 'bg-orange-100 text-orange-800',
  chinese: 'bg-yellow-100 text-yellow-800',
  japanese: 'bg-red-100 text-red-800',
  mediterranean: 'bg-blue-100 text-blue-800',
  american: 'bg-gray-100 text-gray-800'
}

const formatCuisine = (cuisine?: string) => {
  if (!cuisine) return 'Unknown'
  return cuisine.charAt(0).toUpperCase() + cuisine.slice(1)
}
</script>
```

**Props**:
- `cuisine`: Cuisine type string

**Features**:
- Color-coded cuisine types
- Consistent styling
- Fallback handling

### NewBadge.vue

**Purpose**: Indicator for newly added recipes

```vue
<template>
  <span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
    NEW
  </span>
</template>
```

**Props**: None
**Features**:
- Consistent styling with other badges
- High visibility design

### NutritionalInfo.vue

**Purpose**: Comprehensive nutrition display

```vue
<template>
  <div class="bg-white rounded-lg p-6 shadow-sm">
    <h3 class="text-lg font-semibold mb-4">Nutritional Information</h3>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <NutritionBadge
        v-for="(value, key) in nutritionData"
        :key="key"
        :label="formatLabel(key)"
        :value="value"
        :unit="getUnit(key)"
        :color="getNutritionColor(key)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  nutrition: Nutrition
}

const props = defineProps<Props>()

const nutritionData = computed(() => ({
  calories: props.nutrition.calories,
  protein: props.nutrition.protein,
  fat: props.nutrition.fat,
  carbs: props.nutrition.carbs,
  fiber: props.nutrition.fiber,
  sugar: props.nutrition.sugar,
  sodium: props.nutrition.sodium
}))
</script>
```

**Props**:
- `nutrition`: Nutrition object

**Features**:
- Grid layout for nutrition data
- Color-coded nutrition types
- Responsive design

### NutritionBadge.vue

**Purpose**: Individual nutrition value display

```vue
<template>
  <div class="text-center">
    <div class="text-2xl font-bold" :class="colorClasses[color]">
      {{ formatValue(value) }}
    </div>
    <div class="text-sm text-gray-600">{{ unit }}</div>
    <div class="text-xs text-gray-500">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string
  value: number
  unit: string
  color: 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange'
}

const props = defineProps<Props>()

const colorClasses = {
  red: 'text-red-600',
  blue: 'text-blue-600',
  green: 'text-green-600',
  yellow: 'text-yellow-600',
  purple: 'text-purple-600',
  orange: 'text-orange-600'
}

const formatValue = (value: number) => {
  if (value === 0) return '0'
  if (value < 1) return value.toFixed(1)
  return Math.round(value).toString()
}
</script>
```

**Props**:
- `label`: Nutrition label
- `value`: Numeric value
- `unit`: Unit of measurement
- `color`: Color theme

### RecipeSkeleton.vue

**Purpose**: Loading placeholder for recipe cards

```vue
<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
    <div class="h-48 bg-gray-200"></div>
    <div class="p-4">
      <div class="h-4 bg-gray-200 rounded mb-2"></div>
      <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div class="flex justify-between">
        <div class="h-3 bg-gray-200 rounded w-1/3"></div>
        <div class="h-3 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  </div>
</template>
```

**Props**: None
**Features**:
- Pulse animation
- Matches RecipeCard layout
- Consistent spacing

## Component Patterns

### Composition API Pattern

```vue
<script setup lang="ts">
// Auto-imports from Nuxt 3
const { data, pending, error } = await useFetch('/api/recipes')

// Reactive state
const searchQuery = ref('')
const filteredRecipes = computed(() => {
  return data.value?.filter(recipe => 
    recipe.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// Event handlers
const handleSearch = (query: string) => {
  searchQuery.value = query
}
</script>
```

### Props Interface Pattern

```typescript
interface Props {
  recipe: Recipe
  showNutrition?: boolean
  variant?: 'default' | 'compact'
}

const props = withDefaults(defineProps<Props>(), {
  showNutrition: false,
  variant: 'default'
})
```

### Event Emission Pattern

```typescript
const emit = defineEmits<{
  search: [query: string]
  filter: [filter: RecipeFilter]
  select: [recipe: Recipe]
}>()

// Usage
emit('search', searchQuery.value)
```

### Slot Pattern

```vue
<template>
  <div class="card">
    <header class="card-header">
      <slot name="header" />
    </header>
    <div class="card-body">
      <slot />
    </div>
    <footer class="card-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>
```

## Styling Guidelines

### Tailwind CSS Usage

```vue
<template>
  <!-- Utility-first approach -->
  <div class="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
    <h2 class="text-xl font-semibold text-gray-900">Title</h2>
    <button class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
      Action
    </button>
  </div>
</template>
```

### Custom CSS Classes

```vue
<style scoped>
/* Component-specific styles */
.recipe-card {
  @apply bg-white rounded-lg shadow-md overflow-hidden;
}

.recipe-card:hover {
  @apply shadow-lg transition-shadow duration-200;
}

/* Custom animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}
</style>
```

## Accessibility Guidelines

### Semantic HTML

```vue
<template>
  <article class="recipe-card">
    <header>
      <h2 class="recipe-title">{{ recipe.title }}</h2>
    </header>
    <main>
      <img :src="recipe.image" :alt="recipe.title" />
    </main>
    <footer>
      <button @click="viewRecipe" aria-label="View recipe details">
        View Recipe
      </button>
    </footer>
  </article>
</template>
```

### ARIA Attributes

```vue
<template>
  <div role="search" aria-label="Recipe search">
    <input
      type="search"
      aria-describedby="search-help"
      :aria-expanded="showSuggestions"
    />
    <div id="search-help" class="sr-only">
      Search for recipes by name or ingredients
    </div>
  </div>
</template>
```

### Keyboard Navigation

```vue
<script setup lang="ts">
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    handleSearch()
  }
  if (event.key === 'Escape') {
    clearSearch()
  }
}
</script>
```

## Performance Optimization

### Lazy Loading

```vue
<template>
  <img
    :src="recipe.image"
    :alt="recipe.title"
    loading="lazy"
    decoding="async"
  />
</template>
```

### Virtual Scrolling

```vue
<script setup lang="ts">
// For large lists, consider virtual scrolling
const { data: recipes } = await useLazyFetch('/api/recipes')
</script>
```

### Component Memoization

```vue
<script setup lang="ts">
// Memoize expensive computations
const expensiveValue = computed(() => {
  return heavyComputation(props.data)
})
</script>
```

## Testing Strategy

### Unit Testing

```typescript
// RecipeCard.test.ts
import { mount } from '@vue/test-utils'
import RecipeCard from './RecipeCard.vue'

describe('RecipeCard', () => {
  it('displays recipe title', () => {
    const wrapper = mount(RecipeCard, {
      props: {
        recipe: mockRecipe
      }
    })
    
    expect(wrapper.text()).toContain(mockRecipe.title)
  })
})
```

### Component Testing

```typescript
// Integration testing
describe('Recipe Search', () => {
  it('filters recipes based on search query', async () => {
    const wrapper = mount(SearchBar)
    
    await wrapper.find('input').setValue('pasta')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.emitted('search')).toBeTruthy()
  })
})
```

## Error Handling

### API Rate Limit Error Handling

**Purpose**: Display user-friendly messages when Spoonacular API rate limits are exceeded

**Error Message Component**:
```vue
<!-- components/ApiErrorMessage.vue -->
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
      
      <div v-if="fallbackData" class="fallback-info">
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
```

**Error Handling in Stores**:
```typescript
// stores/recipes.ts
export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const errorType = ref<'RATE_LIMIT_EXCEEDED' | 'QUOTA_EXCEEDED' | 'GENERIC_ERROR' | null>(null)
  const retryAfter = ref<number | null>(null)
  const fallbackData = ref<Recipe[]>([])

  async function searchRecipes(params: RecipeSearchParams) {
    loading.value = true
    error.value = null
    errorType.value = null
    retryAfter.value = null
    fallbackData.value = []

    try {
      const response = await $fetch<RecipeSearchResponse>('/api/recipes', {
        query: params
      })

      recipes.value = response.results
      totalResults.value = response.totalResults
      
    } catch (err: any) {
      console.error('Recipe search error:', err)
      
      // Handle API errors
      if (err.statusCode === 429) {
        errorType.value = 'RATE_LIMIT_EXCEEDED'
        error.value = err.data?.message || 'API rate limit reached. Please try again later.'
        retryAfter.value = err.data?.retryAfter || 60
        fallbackData.value = err.data?.fallbackData || []
        
        // Use fallback data if available
        if (fallbackData.value.length > 0) {
          recipes.value = fallbackData.value
          totalResults.value = fallbackData.value.length
        }
      } else if (err.statusCode === 402) {
        errorType.value = 'QUOTA_EXCEEDED'
        error.value = err.data?.message || 'Daily API quota has been reached. Please try again tomorrow.'
        fallbackData.value = err.data?.fallbackData || []
        
        // Use fallback data if available
        if (fallbackData.value.length > 0) {
          recipes.value = fallbackData.value
          totalResults.value = fallbackData.value.length
        }
      } else {
        errorType.value = 'GENERIC_ERROR'
        error.value = err.data?.message || 'An unexpected error occurred. Please try again.'
      }
    } finally {
      loading.value = false
    }
  }

  const retrySearch = () => {
    if (retryAfter.value && retryAfter.value > 0) {
      // Wait for retry time
      setTimeout(() => {
        searchRecipes(lastSearchParams.value)
      }, retryAfter.value * 1000)
    } else {
      // Immediate retry
      searchRecipes(lastSearchParams.value)
    }
  }

  return {
    recipes,
    loading,
    error,
    errorType,
    retryAfter,
    fallbackData,
    searchRecipes,
    retrySearch
  }
})
```

**Error Display in Pages**:
```vue
<!-- pages/index.vue -->
<template>
  <div class="recipe-search-page">
    <SearchBar @search="handleSearch" />
    
    <!-- Error Message -->
    <ApiErrorMessage
      v-if="error && errorType"
      :error-type="errorType"
      :message="error"
      :retry-after="retryAfter"
      :fallback-data="fallbackData"
      @retry="retrySearch"
      @go-home="goHome"
    />
    
    <!-- Loading State -->
    <div v-else-if="loading" class="loading-state">
      <RecipeSkeleton v-for="i in 6" :key="i" />
    </div>
    
    <!-- Results -->
    <div v-else-if="recipes.length > 0" class="recipe-results">
      <RecipeCard 
        v-for="recipe in recipes" 
        :key="recipe.id" 
        :recipe="recipe" 
      />
    </div>
    
    <!-- No Results -->
    <div v-else class="no-results">
      <p>No recipes found. Try adjusting your search.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const recipesStore = useRecipesStore()

const { 
  recipes, 
  loading, 
  error, 
  errorType, 
  retryAfter, 
  fallbackData,
  searchRecipes,
  retrySearch 
} = storeToRefs(recipesStore)

const handleSearch = (params: RecipeSearchParams) => {
  searchRecipes(params)
}

const goHome = () => {
  navigateTo('/')
}
</script>
```

**Global Error Handling**:
```typescript
// plugins/error-handler.ts
export default defineNuxtPlugin(() => {
  const { $fetch } = useNuxtApp()
  
  // Intercept fetch errors globally
  $fetch.create({
    onResponseError({ response }) {
      if (response.status === 429) {
        // Show global rate limit notification
        showNotification({
          type: 'warning',
          title: 'Rate Limit Reached',
          message: 'API rate limit reached. Please try again later.',
          duration: 5000
        })
      } else if (response.status === 402) {
        // Show global quota exceeded notification
        showNotification({
          type: 'error',
          title: 'Daily Quota Exceeded',
          message: 'Daily API quota has been reached. Please try again tomorrow.',
          duration: 10000
        })
      }
    }
  })
})
```

### API Quota Confirmation System

**Purpose**: Display quota warning and require user confirmation when 85% of daily quota is consumed

**Quota Confirmation Modal Component**:
```vue
<!-- components/QuotaConfirmationModal.vue -->
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
        <div class="quota-progress">
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
        
        <div class="quota-details">
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
  quotaInfo: QuotaInfo
}

const props = defineProps<Props>()
const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const progressBarClass = computed(() => {
  if (props.quotaInfo.percentageUsed >= 95) return 'bg-red-500'
  if (props.quotaInfo.percentageUsed >= 85) return 'bg-yellow-500'
  return 'bg-blue-500'
})

const formatResetTime = computed(() => {
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
```

**Smart Quota Management Store**:
```typescript
// stores/quota.ts
export const useQuotaStore = defineStore('quota', () => {
  const quotaInfo = ref<QuotaInfo | null>(null)
  const requiresConfirmation = ref(false)
  const pendingRequest = ref<(() => Promise<any>) | null>(null)
  
  // Update quota info from any API response
  function updateQuotaFromResponse(response: any) {
    if (response && response.quotaInfo) {
      quotaInfo.value = response.quotaInfo
      requiresConfirmation.value = response.requiresQuotaConfirmation || false
    }
  }
  
  // Execute request and extract quota info from response
  async function executeWithQuotaCheck<T>(requestFn: () => Promise<T>): Promise<T> {
    // Check if we need confirmation before making the request
    if (requiresConfirmation.value && quotaInfo.value) {
      // Store the pending request
      pendingRequest.value = requestFn
      // Return a special response that triggers the confirmation modal
      throw new Error('QUOTA_CONFIRMATION_REQUIRED')
    }
    
    // Execute the request and extract quota info from response
    const response = await requestFn()
    updateQuotaFromResponse(response)
    
    return response
  }
  
  async function confirmAndExecute(): Promise<any> {
    if (!pendingRequest.value) {
      throw new Error('No pending request to execute')
    }
    
    const requestFn = pendingRequest.value
    pendingRequest.value = null
    
    // Add confirmation flag to the request
    const response = await requestFn()
    updateQuotaFromResponse(response)
    
    return response
  }
  
  function cancelPendingRequest() {
    pendingRequest.value = null
    requiresConfirmation.value = false
  }
  
  // Reset quota tracking at midnight UTC
  function resetDailyQuota() {
    const now = new Date()
    const utcMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    utcMidnight.setUTCHours(0, 0, 0, 0)
    
    const timeUntilReset = utcMidnight.getTime() - now.getTime()
    
    // Schedule reset at midnight UTC
    setTimeout(() => {
      quotaInfo.value = null
      requiresConfirmation.value = false
      console.log('Daily quota tracking reset')
    }, timeUntilReset)
  }
  
  return {
    quotaInfo,
    requiresConfirmation,
    pendingRequest,
    updateQuotaFromResponse,
    executeWithQuotaCheck,
    confirmAndExecute,
    cancelPendingRequest,
    resetDailyQuota
  }
})
```

**Smart Recipes Store with Quota Integration**:
```typescript
// stores/recipes.ts
export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const errorType = ref<'RATE_LIMIT_EXCEEDED' | 'QUOTA_EXCEEDED' | 'GENERIC_ERROR' | null>(null)
  const retryAfter = ref<number | null>(null)
  const fallbackData = ref<Recipe[]>([])
  
  const quotaStore = useQuotaStore()

  async function searchRecipes(params: RecipeSearchParams) {
    loading.value = true
    error.value = null
    errorType.value = null
    retryAfter.value = null
    fallbackData.value = []

    try {
      const response = await quotaStore.executeWithQuotaCheck(async () => {
        return await $fetch<RecipeSearchResponse>('/api/recipes', {
          query: {
            ...params,
            confirmedQuotaUsage: 'true'
          }
        })
      })

      recipes.value = response.results
      totalResults.value = response.totalResults
      
    } catch (err: any) {
      console.error('Recipe search error:', err)
      
      if (err.message === 'QUOTA_CONFIRMATION_REQUIRED') {
        // This will be handled by the UI to show the confirmation modal
        return
      }
      
      // Handle API errors
      if (err.statusCode === 429) {
        errorType.value = 'RATE_LIMIT_EXCEEDED'
        error.value = err.data?.message || 'API rate limit reached. Please try again later.'
        retryAfter.value = err.data?.retryAfter || 60
        fallbackData.value = err.data?.fallbackData || []
        
        // Use fallback data if available
        if (fallbackData.value.length > 0) {
          recipes.value = fallbackData.value
          totalResults.value = fallbackData.value.length
        }
      } else if (err.statusCode === 402) {
        errorType.value = 'QUOTA_EXCEEDED'
        error.value = err.data?.message || 'Daily API quota has been reached. Please try again tomorrow.'
        fallbackData.value = err.data?.fallbackData || []
        
        // Use fallback data if available
        if (fallbackData.value.length > 0) {
          recipes.value = fallbackData.value
          totalResults.value = fallbackData.value.length
        }
      } else {
        errorType.value = 'GENERIC_ERROR'
        error.value = err.data?.message || 'An unexpected error occurred. Please try again.'
      }
    } finally {
      loading.value = false
    }
  }

  async function confirmQuotaAndSearch() {
    try {
      const response = await quotaStore.confirmAndExecute()
      recipes.value = response.results
      totalResults.value = response.totalResults
    } catch (error) {
      console.error('Failed to execute confirmed request:', error)
    }
  }

  const retrySearch = () => {
    if (retryAfter.value && retryAfter.value > 0) {
      // Wait for retry time
      setTimeout(() => {
        searchRecipes(lastSearchParams.value)
      }, retryAfter.value * 1000)
    } else {
      // Immediate retry
      searchRecipes(lastSearchParams.value)
    }
  }

  // Update quota info from any recipe API response
  function updateQuotaFromRecipeResponse(response: any) {
    quotaStore.updateQuotaFromResponse(response)
  }

  return {
    recipes,
    loading,
    error,
    errorType,
    retryAfter,
    fallbackData,
    searchRecipes,
    confirmQuotaAndSearch,
    retrySearch,
    updateQuotaFromRecipeResponse
  }
})
```

**Updated Page with Quota Confirmation**:
```vue
<!-- pages/index.vue -->
<template>
  <div class="recipe-search-page">
    <SearchBar @search="handleSearch" />
    
    <!-- Quota Confirmation Modal -->
    <QuotaConfirmationModal
      :show="showQuotaModal"
      :quota-info="quotaInfo"
      @confirm="handleQuotaConfirm"
      @cancel="handleQuotaCancel"
    />
    
    <!-- Error Message -->
    <ApiErrorMessage
      v-if="error && errorType"
      :error-type="errorType"
      :message="error"
      :retry-after="retryAfter"
      :fallback-data="fallbackData"
      @retry="retrySearch"
      @go-home="goHome"
    />
    
    <!-- Loading State -->
    <div v-else-if="loading" class="loading-state">
      <RecipeSkeleton v-for="i in 6" :key="i" />
    </div>
    
    <!-- Results -->
    <div v-else-if="recipes.length > 0" class="recipe-results">
      <RecipeCard 
        v-for="recipe in recipes" 
        :key="recipe.id" 
        :recipe="recipe" 
      />
    </div>
    
    <!-- No Results -->
    <div v-else class="no-results">
      <p>No recipes found. Try adjusting your search.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const recipesStore = useRecipesStore()
const quotaStore = useQuotaStore()

const { 
  recipes, 
  loading, 
  error, 
  errorType, 
  retryAfter, 
  fallbackData,
  searchRecipes,
  confirmQuotaAndSearch,
  retrySearch 
} = storeToRefs(recipesStore)

const { quotaInfo, requiresConfirmation } = storeToRefs(quotaStore)

const showQuotaModal = computed(() => requiresConfirmation.value && quotaInfo.value !== null)

const handleSearch = async (params: RecipeSearchParams) => {
  try {
    await searchRecipes(params)
  } catch (error) {
    if (error.message === 'QUOTA_CONFIRMATION_REQUIRED') {
      // Modal will be shown automatically
      return
    }
    // Handle other errors
  }
}

const handleQuotaConfirm = async () => {
  await confirmQuotaAndSearch()
}

const handleQuotaCancel = () => {
  quotaStore.cancelPendingRequest()
}

const goHome = () => {
  navigateTo('/')
}

// Initialize daily quota reset on page load
onMounted(() => {
  quotaStore.resetDailyQuota()
})
</script>
```

**Quota Status Display Component**:
```vue
<!-- components/QuotaStatus.vue -->
<template>
  <div v-if="quotaInfo" class="quota-status">
    <div class="quota-indicator" :class="indicatorClass">
      <Icon name="database" class="w-4 h-4" />
      <span class="quota-text">
        {{ quotaInfo.quotaUsed }}/{{ quotaInfo.quotaLimit }}
      </span>
    </div>
    
    <div v-if="quotaInfo.percentageUsed >= 70" class="quota-warning-badge">
      <Icon name="alert-triangle" class="w-3 h-3" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  quotaInfo: QuotaInfo | null
}

const props = defineProps<Props>()

const indicatorClass = computed(() => {
  if (!props.quotaInfo) return ''
  
  if (props.quotaInfo.percentageUsed >= 90) return 'text-red-600'
  if (props.quotaInfo.percentageUsed >= 70) return 'text-yellow-600'
  return 'text-green-600'
})
</script>

<style scoped>
.quota-status {
  @apply flex items-center gap-2;
}

.quota-indicator {
  @apply flex items-center gap-1 text-sm font-medium;
}

.quota-warning-badge {
  @apply text-yellow-500;
}
</style>
```

---

*This specification should be updated when new components are added or existing components are modified.*
