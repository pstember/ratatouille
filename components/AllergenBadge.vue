<template>
  <div class="allergen-badge" :class="badgeClass">
    <Icon :name="allergen.icon" class="w-4 h-4" />
    <span class="text-sm font-medium">{{ allergen.displayName }}</span>
  </div>
</template>

<script setup lang="ts">
import type { AllergenInfo } from '~/types/allergen'

interface Props {
  allergen: AllergenInfo
  variant?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'medium'
})

const badgeClass = {
  'allergen-badge': true,
  [`allergen-badge--${props.variant}`]: true,
  [`allergen-badge--${props.allergen.severity}`]: true
}
</script>

<style scoped>
.allergen-badge {
  @apply inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium;
}

.allergen-badge--small {
  @apply px-1.5 py-0.5 text-xs;
}

.allergen-badge--medium {
  @apply px-2 py-1 text-sm;
}

.allergen-badge--large {
  @apply px-3 py-1.5 text-base;
}

.allergen-badge--warning {
  @apply bg-yellow-100 text-yellow-800 border border-yellow-200;
}

.allergen-badge--critical {
  @apply bg-red-100 text-red-800 border border-red-200;
}
</style>
