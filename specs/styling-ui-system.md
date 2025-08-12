# Styling & UI System Specification

## Overview

This specification defines the design system, Tailwind CSS configuration, component styling patterns, and UI architecture for the Ratatouille Recipe Discovery Platform.

## Design System

### Color Palette

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      }
    }
  }
}
```

### Typography

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }]
      }
    }
  }
}
```

### Spacing System

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem'
      }
    }
  }
}
```

### Breakpoints

```typescript
// Responsive breakpoints
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}
```

## Component Styling Patterns

### Base Component Styles

```vue
<!-- Base component styling pattern -->
<template>
  <div class="component-base">
    <slot />
  </div>
</template>

<style scoped>
.component-base {
  @apply bg-white rounded-lg shadow-sm border border-gray-200;
}
</style>
```

### Button Component Styles

```vue
<!-- Button component with variants -->
<template>
  <button
    :class="[
      'btn',
      `btn--${variant}`,
      `btn--${size}`,
      { 'btn--loading': loading }
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="btn__spinner" />
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
}

defineProps<Props>()
defineEmits<{ click: [event: MouseEvent] }>()
</script>

<style scoped>
.btn {
  @apply inline-flex items-center justify-center font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn--primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500;
}

.btn--secondary {
  @apply bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500;
}

.btn--outline {
  @apply border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500;
}

.btn--ghost {
  @apply bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500;
}

.btn--sm {
  @apply px-3 py-1.5 text-sm;
}

.btn--md {
  @apply px-4 py-2 text-base;
}

.btn--lg {
  @apply px-6 py-3 text-lg;
}

.btn--loading {
  @apply cursor-not-allowed opacity-75;
}

.btn__spinner {
  @apply animate-spin -ml-1 mr-2 h-4 w-4;
}
</style>
```

### Card Component Styles

```vue
<!-- Card component -->
<template>
  <div
    :class="[
      'card',
      `card--${variant}`,
      { 'card--hoverable': hoverable }
    ]"
  >
    <div v-if="$slots.header" class="card__header">
      <slot name="header" />
    </div>
    <div class="card__body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'elevated' | 'outlined'
  hoverable?: boolean
}

defineProps<Props>()
</script>

<style scoped>
.card {
  @apply bg-white rounded-lg border border-gray-200 overflow-hidden;
}

.card--elevated {
  @apply shadow-lg border-0;
}

.card--outlined {
  @apply border-2 border-gray-300 shadow-none;
}

.card--hoverable {
  @apply transition-all duration-200 hover:shadow-md hover:-translate-y-1;
}

.card__header {
  @apply px-6 py-4 border-b border-gray-200 bg-gray-50;
}

.card__body {
  @apply px-6 py-4;
}

.card__footer {
  @apply px-6 py-4 border-t border-gray-200 bg-gray-50;
}
</style>
```

## Layout Components

### Container Layout

```vue
<!-- Container component -->
<template>
  <div
    :class="[
      'container',
      `container--${size}`,
      { 'container--centered': centered }
    ]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  centered?: boolean
}

defineProps<Props>()
</script>

<style scoped>
.container {
  @apply mx-auto px-4;
}

.container--sm {
  @apply max-w-3xl;
}

.container--md {
  @apply max-w-4xl;
}

.container--lg {
  @apply max-w-6xl;
}

.container--xl {
  @apply max-w-7xl;
}

.container--centered {
  @apply flex items-center justify-center min-h-screen;
}
</style>
```

### Grid Layout

```vue
<!-- Grid component -->
<template>
  <div
    :class="[
      'grid',
      `grid--cols-${cols}`,
      `grid--gap-${gap}`,
      { 'grid--responsive': responsive }
    ]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  responsive?: boolean
}

defineProps<Props>()
</script>

<style scoped>
.grid {
  @apply grid;
}

.grid--cols-1 {
  @apply grid-cols-1;
}

.grid--cols-2 {
  @apply grid-cols-1 md:grid-cols-2;
}

.grid--cols-3 {
  @apply grid-cols-1 md:grid-cols-2 lg:grid-cols-3;
}

.grid--cols-4 {
  @apply grid-cols-1 md:grid-cols-2 lg:grid-cols-4;
}

.grid--cols-6 {
  @apply grid-cols-2 md:grid-cols-3 lg:grid-cols-6;
}

.grid--cols-12 {
  @apply grid-cols-6 md:grid-cols-8 lg:grid-cols-12;
}

.grid--gap-sm {
  @apply gap-2;
}

.grid--gap-md {
  @apply gap-4;
}

.grid--gap-lg {
  @apply gap-6;
}

.grid--gap-xl {
  @apply gap-8;
}
</style>
```

## Recipe-Specific Components

### Recipe Card Styling

```vue
<!-- RecipeCard component styling -->
<template>
  <article class="recipe-card">
    <div class="recipe-card__image">
      <img
        :src="recipe.image"
        :alt="recipe.title"
        class="recipe-card__img"
        loading="lazy"
      />
      <div class="recipe-card__badges">
        <CuisineBadge :cuisine="recipe.cuisine" />
        <NewBadge v-if="recipe.isNew" />
      </div>
    </div>
    <div class="recipe-card__content">
      <h3 class="recipe-card__title">{{ recipe.title }}</h3>
      <div class="recipe-card__meta">
        <span class="recipe-card__time">
          {{ recipe.readyInMinutes }} min
        </span>
        <span class="recipe-card__servings">
          {{ recipe.servings }} servings
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.recipe-card {
  @apply bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer;
}

.recipe-card__image {
  @apply relative h-48 overflow-hidden;
}

.recipe-card__img {
  @apply w-full h-full object-cover transition-transform duration-200;
}

.recipe-card:hover .recipe-card__img {
  @apply scale-105;
}

.recipe-card__badges {
  @apply absolute top-2 right-2 flex gap-1;
}

.recipe-card__content {
  @apply p-4;
}

.recipe-card__title {
  @apply text-lg font-semibold text-gray-900 mb-2 line-clamp-2;
}

.recipe-card__meta {
  @apply flex items-center justify-between text-sm text-gray-600;
}

.recipe-card__time {
  @apply flex items-center gap-1;
}

.recipe-card__servings {
  @apply flex items-center gap-1;
}
</style>
```

### Search Bar Styling

```vue
<!-- SearchBar component styling -->
<template>
  <div class="search-bar">
    <div class="search-bar__input-wrapper">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search recipes..."
        class="search-bar__input"
        @input="handleSearch"
      />
      <button
        v-if="searchQuery"
        @click="clearSearch"
        class="search-bar__clear"
        aria-label="Clear search"
      >
        <span class="search-bar__clear-icon">×</span>
      </button>
    </div>
    <div v-if="suggestions.length > 0" class="search-bar__suggestions">
      <ul class="search-bar__suggestions-list">
        <li
          v-for="suggestion in suggestions"
          :key="suggestion"
          class="search-bar__suggestion-item"
          @click="selectSuggestion(suggestion)"
        >
          {{ suggestion }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  @apply relative w-full;
}

.search-bar__input-wrapper {
  @apply relative;
}

.search-bar__input {
  @apply w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200;
}

.search-bar__clear {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200;
}

.search-bar__clear-icon {
  @apply text-lg font-bold;
}

.search-bar__suggestions {
  @apply absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10;
}

.search-bar__suggestions-list {
  @apply py-2;
}

.search-bar__suggestion-item {
  @apply px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors duration-200;
}
</style>
```

## Animation System

### CSS Animations

```css
/* animations.css */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Animation utility classes */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.4s ease-out;
}

.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Tailwind Animation Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        }
      }
    }
  }
}
```

## Responsive Design

### Mobile-First Approach

```vue
<!-- Responsive component example -->
<template>
  <div class="responsive-container">
    <div class="responsive-grid">
      <div class="responsive-item">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.responsive-container {
  @apply w-full px-4 mx-auto;
}

.responsive-grid {
  @apply grid gap-4;
  @apply grid-cols-1;
  @apply sm:grid-cols-2;
  @apply md:grid-cols-3;
  @apply lg:grid-cols-4;
  @apply xl:grid-cols-5;
}

.responsive-item {
  @apply w-full;
}
</style>
```

### Breakpoint Utilities

```typescript
// composables/useBreakpoints.ts
export function useBreakpoints() {
  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  }
  
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(false)
  
  const updateBreakpoints = () => {
    const width = window.innerWidth
    
    isMobile.value = width < breakpoints.md
    isTablet.value = width >= breakpoints.md && width < breakpoints.lg
    isDesktop.value = width >= breakpoints.lg
  }
  
  onMounted(() => {
    updateBreakpoints()
    window.addEventListener('resize', updateBreakpoints)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', updateBreakpoints)
  })
  
  return {
    isMobile: readonly(isMobile),
    isTablet: readonly(isTablet),
    isDesktop: readonly(isDesktop)
  }
}
```

## Dark Mode Support

### Dark Mode Configuration

```typescript
// tailwind.config.ts
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        }
      }
    }
  }
}
```

### Dark Mode Toggle

```vue
<!-- Dark mode toggle component -->
<template>
  <button
    @click="toggleDarkMode"
    class="dark-mode-toggle"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
  >
    <span v-if="isDark" class="dark-mode-toggle__icon">☀️</span>
    <span v-else class="dark-mode-toggle__icon">🌙</span>
  </button>
</template>

<script setup lang="ts">
const isDark = ref(false)

const toggleDarkMode = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark')
  localStorage.setItem('darkMode', isDark.value.toString())
}

onMounted(() => {
  const saved = localStorage.getItem('darkMode')
  isDark.value = saved === 'true'
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  }
})
</script>

<style scoped>
.dark-mode-toggle {
  @apply p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200;
}

.dark-mode-toggle__icon {
  @apply text-lg;
}
</style>
```

## Loading States

### Skeleton Loading

```vue
<!-- Skeleton component -->
<template>
  <div class="skeleton" :class="`skeleton--${variant}`">
    <div class="skeleton__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'text' | 'image' | 'card' | 'button'
}

defineProps<Props>()
</script>

<style scoped>
.skeleton {
  @apply animate-pulse bg-gray-200 dark:bg-gray-700;
}

.skeleton--text {
  @apply h-4 rounded;
}

.skeleton--image {
  @apply h-48 rounded-lg;
}

.skeleton--card {
  @apply h-64 rounded-lg;
}

.skeleton--button {
  @apply h-10 rounded-md;
}
</style>
```

### Loading Spinner

```vue
<!-- Loading spinner component -->
<template>
  <div class="loading-spinner" :class="`loading-spinner--${size}`">
    <div class="loading-spinner__circle"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
}

defineProps<Props>()
</script>

<style scoped>
.loading-spinner {
  @apply inline-block;
}

.loading-spinner--sm {
  @apply w-4 h-4;
}

.loading-spinner--md {
  @apply w-6 h-6;
}

.loading-spinner--lg {
  @apply w-8 h-8;
}

.loading-spinner__circle {
  @apply w-full h-full border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin;
}
</style>
```

## Accessibility

### Focus Management

```css
/* focus.css */
.focus-visible {
  @apply outline-none ring-2 ring-primary-500 ring-offset-2;
}

.focus-visible:focus {
  @apply outline-none;
}

/* Skip link for keyboard navigation */
.skip-link {
  @apply sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-md;
}
```

### Screen Reader Support

```vue
<!-- Screen reader friendly component -->
<template>
  <div class="sr-friendly">
    <span class="sr-only">{{ screenReaderText }}</span>
    <div aria-hidden="true">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  screenReaderText: string
}

defineProps<Props>()
</script>
```

## Performance Optimization

### CSS Optimization

```typescript
// tailwind.config.ts
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue'
  ],
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: [
      './components/**/*.{js,vue,ts}',
      './layouts/**/*.vue',
      './pages/**/*.vue'
    ]
  }
}
```

### Critical CSS

```vue
<!-- Critical CSS in app.vue -->
<style>
/* Critical styles for above-the-fold content */
.critical {
  @apply bg-white text-gray-900;
}

.critical-header {
  @apply bg-white shadow-sm border-b border-gray-200;
}

.critical-content {
  @apply container mx-auto px-4 py-8;
}
</style>
```

---

*This specification should be updated when new UI components are added or existing styling patterns change.*
