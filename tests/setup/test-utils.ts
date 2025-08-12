import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { vi } from 'vitest'
import type { Nutrition } from '~/types/nutrition'

// Global test configuration
config.global.stubs = {
  // Stub Nuxt-specific components and composables
  'NuxtLink': true,
  'NuxtPage': true,
  'NuxtLayout': true,
  'ClientOnly': true,
  'NuxtImg': true,
  'NuxtIcon': true,
  'Icon': true,
  // Stub child components with proper class names
  'NutritionBadge': {
    template: '<div class="nutrition-badge">{{ label }}: {{ value }}{{ unit }}</div>',
    props: ['value', 'unit', 'color', 'label']
  },
  'NutritionCard': {
    template: '<div class="nutrition-card">{{ label }}: {{ value }}{{ unit }}</div>',
    props: ['value', 'unit', 'color', 'label', 'dailyValue']
  },
  'NutritionalInfo': {
    template: '<div class="nutritional-info">{{ nutrition.calories }} calories</div>',
    props: ['nutrition', 'compact']
  },
  'NewBadge': {
    template: '<div class="new-badge absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg animate-pulse">NEW</div>'
  },
  'RecipeSkeleton': {
    template: '<div class="recipe-skeleton">Loading...</div>'
  },
  'RecipeCard': {
    template: '<div class="recipe-card">{{ recipe.title }}</div>',
    props: ['recipe']
  }
}

// Mock H3 functions
vi.mock('h3', () => ({
  defineEventHandler: vi.fn((handler) => handler),
  getQuery: vi.fn((event) => event.query || {}),
  getHeader: vi.fn((event, name) => event.headers?.[name]),
  setHeader: vi.fn((event, name, value) => {
    if (!event.headers) event.headers = {}
    event.headers[name] = value
  }),
  sendError: vi.fn((event, error) => {
    event.error = error
    return error
  }),
  createError: vi.fn((status, message) => ({
    statusCode: status,
    statusMessage: message,
    message
  })),
  createEvent: vi.fn((options) => ({
    method: options.method || 'GET',
    url: options.url || '/',
    query: options.url ? new URL(options.url, 'http://localhost').searchParams : {},
    headers: {}
  })),
  createApp: vi.fn(() => ({
    use: vi.fn(),
    listen: vi.fn()
  }))
}))

// Mock Nuxt composables
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      apiBase: 'http://localhost:3000/api'
    }
  }),
  useNuxtApp: () => ({
    $fetch: vi.fn(),
    $prisma: vi.fn()
  }),
  $fetch: vi.fn(),
  definePageMeta: vi.fn()
}))

// Mock Nuxt utilities
vi.mock('#imports', () => ({
  useFetch: vi.fn(),
  useAsyncData: vi.fn(),
  navigateTo: vi.fn(),
  useRoute: vi.fn(() => ({
    params: {},
    query: {},
    path: '/'
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  })),
  definePageMeta: vi.fn()
}))

// Mock global Nuxt functions
vi.mock('nuxt/app', () => ({
  definePageMeta: vi.fn()
}))

// Mock $fetch globally
const globalMockFetch = vi.fn()
// @ts-ignore - Mocking $fetch for tests
global.$fetch = globalMockFetch

// Global test setup
export function setupTestEnvironment() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

// Mock data factories
export const mockRecipe = {
  id: 1,
  title: 'Test Recipe',
  image: 'test-image.jpg',
  readyInMinutes: 30,
  servings: 4,
  summary: 'A delicious test recipe',
  instructions: 'Test instructions',
  ingredients: ['ingredient 1', 'ingredient 2'],
  cuisine: 'italian',
  nutrition: {
    id: 1,
    recipeId: 1,
    calories: 300,
    protein: 15,
    carbs: 45,
    fat: 10,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  } as Nutrition,
  isNew: false
}

export const mockNutrition: Nutrition = {
  id: 1,
  recipeId: 1,
  calories: 300,
  protein: 15,
  carbs: 45,
  fat: 10,
  fiber: 5,
  sugar: 20,
  sodium: 500,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

// Create NutritionDisplay version for component tests
export const mockNutritionDisplay = {
  calories: 300,
  protein: 15,
  carbs: 45,
  fat: 10,
  fiber: 5,
  sugar: 20,
  sodium: 500
}

// Mock API responses
export const mockSearchResponse = {
  results: [mockRecipe],
  totalResults: 1,
  offset: 0,
  number: 1
}

export const mockRecipeDetailResponse = {
  ...mockRecipe,
  extendedIngredients: [
    { id: 1, name: 'ingredient 1', amount: 1, unit: 'cup' },
    { id: 2, name: 'ingredient 2', amount: 2, unit: 'tablespoons' }
  ],
  analyzedInstructions: [
    {
      name: 'Main',
      steps: [
        { number: 1, step: 'Test step 1' },
        { number: 2, step: 'Test step 2' }
      ]
    }
  ]
}

// Utility functions for testing
export function createMockEvent(target: any = {}) {
  return {
    target,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn()
  }
}

export function waitForNextTick() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// Mock fetch for API testing
export function mockFetch(data: any, status = 200) {
  const mockFn = vi.fn(() =>
    Promise.resolve({
      ok: status < 400,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data))
    })
  )
  
  // Add mock methods
  mockFn.mockReset = vi.fn()
  mockFn.mockClear = vi.fn()
  
  global.fetch = mockFn as any
  return mockFn
}

// Clean up after tests
export function cleanupTestEnvironment() {
  vi.clearAllMocks()
  vi.resetAllMocks()
}
