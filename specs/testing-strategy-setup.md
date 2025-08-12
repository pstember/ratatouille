# Testing Strategy & Setup Specification

## Overview

This specification defines the testing strategy, framework configuration, test structure, and quality assurance processes for the Ratatouille Recipe Discovery Platform.

## Testing Framework

### Technology Stack

- **Test Runner**: Vitest 3.2.4
- **Component Testing**: Vue Test Utils 2.4.6
- **Mocking**: MSW (Mock Service Worker) 2.10.4
- **Coverage**: @vitest/coverage-v8
- **UI Testing**: @vitest/ui
- **Environment**: jsdom

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup/test-utils.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'coverage/',
        '.nuxt/',
        '.output/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        'prisma/migrations/'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 85,
          statements: 85
        }
      }
    },
    globals: true,
    environmentOptions: {
      jsdom: {
        resources: 'usable'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '~': resolve(__dirname, './'),
      '~~': resolve(__dirname, './'),
      '@@': resolve(__dirname, './')
    }
  }
})
```

## Critical Testing Learnings

### Vue 3 Import Requirements

**CRITICAL**: Always import Vue 3 composables explicitly in `<script setup>` blocks. This is the most common cause of test failures.

```typescript
// ✅ CORRECT - Always import what you use
import { ref, computed, reactive, watch, onMounted } from 'vue'

// ❌ WRONG - Don't rely on auto-imports in script setup
// Missing imports will cause "ref is not defined" errors
```

**Common Import Patterns:**
```typescript
// For reactive state
import { ref, reactive } from 'vue'

// For computed properties
import { computed } from 'vue'

// For lifecycle hooks
import { onMounted, onUnmounted, onUpdated } from 'vue'

// For watchers
import { watch, watchEffect } from 'vue'

// For Pinia stores
import { defineStore } from 'pinia'

// For Vue composables
import { useRouter, useRoute } from 'vue-router'
```

### Test Setup Best Practices

#### 1. Proper Mock Setup
```typescript
// tests/setup/test-utils.ts
import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// Mock definePageMeta globally before any imports
vi.mock('nuxt/app', () => ({
  definePageMeta: vi.fn()
}))

vi.mock('#app', () => ({
  definePageMeta: vi.fn()
}))

vi.mock('#imports', () => ({
  ref: vi.fn((value) => ({ value })),
  computed: vi.fn((fn) => ({ value: fn() })),
  onMounted: vi.fn((fn) => fn()),
  definePageMeta: vi.fn()
}))

// Mock global definePageMeta
global.definePageMeta = vi.fn()

// Mock Nuxt components
vi.mock('#components', () => ({
  RecipeSkeleton: { template: '<div class="recipe-skeleton">Loading...</div>' },
  RecipeCard: { template: '<div class="recipe-card">Recipe Card</div>' }
}))
```

#### 2. Async Test Functions
Always use `async/await` for test functions that involve component updates or API calls:

```typescript
// ✅ CORRECT
it('should update component state', async () => {
  wrapper.vm.isLoading = true
  await wrapper.vm.$nextTick()
  expect(wrapper.find('.loading').exists()).toBe(true)
})

// ❌ WRONG
it('should update component state', () => {
  wrapper.vm.isLoading = true
  wrapper.vm.$nextTick() // Missing await
  expect(wrapper.find('.loading').exists()).toBe(true)
})
```

#### 3. Element Selection Best Practices
```typescript
// ✅ CORRECT - Use findAll and find for element selection
const buttons = wrapper.findAll('button')
const button = buttons.find(button => button.text().includes('Discover More'))
if (button) {
  await button.trigger('click')
}

// ❌ WRONG - Don't use filter on single elements
const button = wrapper.find('button').filter(button => button.text().includes('Discover More'))
```

#### 4. Mock Clearing
Always clear mocks between tests to prevent interference:

```typescript
beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockClear()
})
```

### Common Test Patterns

#### Component State Testing
```typescript
it('should show loading state initially', async () => {
  // Set component state
  wrapper.vm.isLoading = true
  await wrapper.vm.$nextTick()
  
  // Test the result
  expect(wrapper.find('.recipe-skeleton').exists()).toBe(true)
})
```

#### Button Click Testing
```typescript
it('should trigger action when button is clicked', async () => {
  // Clear mocks to reset call count
  mockFetch.mockClear()
  
  // Ensure component is in correct state
  wrapper.vm.isLoading = false
  await wrapper.vm.$nextTick()
  
  // Find and click button
  const button = wrapper.find('button')
  expect(button.exists()).toBe(true)
  expect(button.attributes('disabled')).toBeUndefined()
  
  await button.trigger('click')
  await wrapper.vm.$nextTick()
  
  // Verify the expected behavior
  expect(mockFetch).toHaveBeenCalled()
})
```

#### Error Handling Testing
```typescript
it('should handle API errors gracefully', async () => {
  const error = { data: { message: 'API Error' } }
  mockFetch.mockRejectedValue(error)
  
  await wrapper.vm.fetchData()
  await wrapper.vm.$nextTick()
  
  expect(wrapper.text()).toContain('Something went wrong')
  expect(wrapper.text()).toContain('API Error')
})
```

### Test Structure

### Directory Organization

```
tests/
├── setup/
│   └── test-utils.ts          # Test utilities and setup
├── unit/
│   ├── components/            # Component unit tests
│   ├── stores/               # Store unit tests
│   ├── composables/          # Composable unit tests
│   ├── utils/                # Utility function tests
│   └── types/                # Type definition tests
├── integration/
│   ├── api/                  # API integration tests
│   ├── database/             # Database integration tests
│   └── stores/               # Store integration tests
├── e2e/                      # End-to-end tests
├── fixtures/                 # Test data and mocks
│   ├── api-responses/        # API response mocks
│   ├── database/             # Database fixtures
│   └── recipes.json          # Recipe test data
└── coverage/                 # Coverage reports
```

### Test File Naming Convention

- Unit tests: `*.test.ts` or `*.spec.ts`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`
- Component tests: `ComponentName.test.ts`

## Test Setup

### Test Utilities

```typescript
// tests/setup/test-utils.ts
import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// Global test configuration
config.global.stubs = {
  'NuxtLink': true,
  'NuxtImg': true
}

// Mock Nuxt composables
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      apiBase: 'http://localhost:3000/api'
    }
  }),
  useNuxtApp: () => ({
    $fetch: vi.fn()
  })
}))

// Mock $fetch globally
global.$fetch = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.sessionStorage = sessionStorageMock

// Test utilities
export function createMockRecipe(overrides = {}): Recipe {
  return {
    id: 1,
    externalId: 12345,
    title: 'Test Recipe',
    image: 'https://example.com/image.jpg',
    servings: 4,
    readyInMinutes: 30,
    sourceUrl: 'https://example.com/recipe',
    sourceName: 'Test Source',
    summary: 'A delicious test recipe',
    instructions: '1. Mix ingredients\n2. Cook\n3. Serve',
    cuisine: 'italian',
    isNew: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ingredients: [],
    nutrition: null,
    ...overrides
  }
}

export function createMockNutrition(overrides = {}): Nutrition {
  return {
    id: 1,
    recipeId: 1,
    calories: 300,
    protein: 15,
    fat: 10,
    carbs: 45,
    fiber: 5,
    sugar: 10,
    sodium: 500,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides
  }
}

export function createMockIngredient(overrides = {}): RecipeIngredient {
  return {
    id: 1,
    recipeId: 1,
    name: 'Test Ingredient',
    amount: 1,
    unit: 'cup',
    aisle: 'Produce',
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides
  }
}

// Mock API responses
export const mockApiResponses = {
  recipes: {
    results: [createMockRecipe()],
    offset: 0,
    number: 20,
    totalResults: 1
  },
  recipe: createMockRecipe(),
  nutrition: createMockNutrition()
}

// Test environment setup
export function setupTestEnvironment() {
  // Reset all mocks
  vi.clearAllMocks()
  
  // Setup default API mocks
  global.$fetch = vi.fn().mockResolvedValue(mockApiResponses.recipes)
  
  // Clear localStorage
  localStorageMock.clear()
  
  // Reset DOM
  document.body.innerHTML = ''
}
```

## Unit Testing

### Component Testing

```typescript
// tests/unit/components/RecipeCard.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import RecipeCard from '~/components/RecipeCard.vue'
import { createMockRecipe } from '~/tests/setup/test-utils'

describe('RecipeCard', () => {
  let mockRecipe: Recipe

  beforeEach(() => {
    mockRecipe = createMockRecipe()
  })

  it('renders recipe title', () => {
    const wrapper = mount(RecipeCard, {
      props: {
        recipe: mockRecipe
      }
    })

    expect(wrapper.text()).toContain('Test Recipe')
  })

  it('displays recipe image', () => {
    const wrapper = mount(RecipeCard, {
      props: {
        recipe: mockRecipe
      }
    })

    const img = wrapper.find('img')
    expect(img.attributes('src')).toBe('https://example.com/image.jpg')
    expect(img.attributes('alt')).toBe('Test Recipe')
  })

  it('shows cooking time and servings', () => {
    const wrapper = mount(RecipeCard, {
      props: {
        recipe: mockRecipe
      }
    })

    expect(wrapper.text()).toContain('30 min')
    expect(wrapper.text()).toContain('4 servings')
  })

  it('displays cuisine badge when cuisine is provided', () => {
    const wrapper = mount(RecipeCard, {
      props: {
        recipe: mockRecipe
      }
    })

    const cuisineBadge = wrapper.findComponent({ name: 'CuisineBadge' })
    expect(cuisineBadge.exists()).toBe(true)
    expect(cuisineBadge.props('cuisine')).toBe('italian')
  })

  it('shows new badge when recipe is new', () => {
    const wrapper = mount(RecipeCard, {
      props: {
        recipe: { ...mockRecipe, isNew: true }
      }
    })

    const newBadge = wrapper.findComponent({ name: 'NewBadge' })
    expect(newBadge.exists()).toBe(true)
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(RecipeCard, {
      props: {
        recipe: mockRecipe
      }
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('applies hover effects', () => {
    const wrapper = mount(RecipeCard, {
      props: {
        recipe: mockRecipe
      }
    })

    expect(wrapper.classes()).toContain('hover:shadow-lg')
  })
})
```

### Store Testing

```typescript
// tests/unit/stores/recipes.test.ts
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useRecipesStore } from '~/stores/recipes'
import { createMockRecipe } from '~/tests/setup/test-utils'

describe('Recipes Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with default state', () => {
    const store = useRecipesStore()

    expect(store.recipes).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.searchQuery).toBe('')
  })

  it('fetches recipes successfully', async () => {
    const store = useRecipesStore()
    const mockRecipes = [createMockRecipe()]

    global.$fetch = vi.fn().mockResolvedValue({
      results: mockRecipes,
      totalResults: 1,
      offset: 0,
      number: 20
    })

    await store.fetchRecipes()

    expect(store.recipes).toEqual(mockRecipes)
    expect(store.totalResults).toBe(1)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('handles fetch errors', async () => {
    const store = useRecipesStore()
    const errorMessage = 'Failed to fetch recipes'

    global.$fetch = vi.fn().mockRejectedValue(new Error(errorMessage))

    await store.fetchRecipes()

    expect(store.error).toBe(errorMessage)
    expect(store.recipes).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('filters recipes by cuisine', async () => {
    const store = useRecipesStore()

    global.$fetch = vi.fn().mockResolvedValue({
      results: [],
      totalResults: 0,
      offset: 0,
      number: 20
    })

    await store.filterByCuisine('italian')

    expect(store.selectedCuisine).toBe('italian')
    expect(global.$fetch).toHaveBeenCalledWith('/api/recipes', {
      params: expect.objectContaining({
        cuisine: 'italian'
      })
    })
  })

  it('clears filters', async () => {
    const store = useRecipesStore()

    // Set some filters
    store.searchQuery = 'pasta'
    store.selectedCuisine = 'italian'

    global.$fetch = vi.fn().mockResolvedValue({
      results: [],
      totalResults: 0,
      offset: 0,
      number: 20
    })

    await store.clearFilters()

    expect(store.searchQuery).toBe('')
    expect(store.selectedCuisine).toBeNull()
  })

  it('loads more recipes', async () => {
    const store = useRecipesStore()
    const initialRecipes = [createMockRecipe({ id: 1 })]
    const moreRecipes = [createMockRecipe({ id: 2 })]

    store.recipes = initialRecipes
    store.currentPage = 1
    store.totalPages = 2

    global.$fetch = vi.fn().mockResolvedValue({
      results: moreRecipes,
      totalResults: 2,
      offset: 20,
      number: 20
    })

    await store.loadMoreRecipes()

    expect(store.recipes).toHaveLength(2)
    expect(store.currentPage).toBe(2)
  })
})
```

### Composable Testing

```typescript
// tests/unit/composables/useSearch.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSearch } from '~/composables/useSearch'

describe('useSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const { searchQuery, searchHistory, suggestions } = useSearch()

    expect(searchQuery.value).toBe('')
    expect(searchHistory.value).toEqual([])
    expect(suggestions.value).toEqual([])
  })

  it('performs search and updates query', async () => {
    const { searchQuery, performSearch } = useSearch()

    const result = await performSearch('pasta')

    expect(result).toBe('pasta')
    expect(searchQuery.value).toBe('pasta')
  })

  it('adds search to history', async () => {
    const { searchHistory, performSearch } = useSearch()

    await performSearch('pasta')
    await performSearch('pizza')

    expect(searchHistory.value).toEqual(['pizza', 'pasta'])
  })

  it('limits search history to 10 items', async () => {
    const { searchHistory, performSearch } = useSearch()

    // Add 12 searches
    for (let i = 1; i <= 12; i++) {
      await performSearch(`search${i}`)
    }

    expect(searchHistory.value).toHaveLength(10)
    expect(searchHistory.value[0]).toBe('search12')
    expect(searchHistory.value[9]).toBe('search3')
  })

  it('clears search', () => {
    const { searchQuery, suggestions, clearSearch } = useSearch()

    searchQuery.value = 'pasta'
    suggestions.value = ['pasta', 'pizza']

    clearSearch()

    expect(searchQuery.value).toBe('')
    expect(suggestions.value).toEqual([])
  })

  it('selects suggestion', () => {
    const { searchQuery, suggestions, selectSuggestion } = useSearch()

    suggestions.value = ['pasta', 'pizza']

    selectSuggestion('pasta')

    expect(searchQuery.value).toBe('pasta')
    expect(suggestions.value).toEqual([])
  })
})
```

## Integration Testing

### API Integration Tests

```typescript
// tests/integration/api/recipes.test.ts
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { createMockRecipe } from '~/tests/setup/test-utils'

const server = setupServer(
  rest.get('/api/recipes', (req, res, ctx) => {
    const query = req.url.searchParams.get('q')
    
    if (query === 'pasta') {
      return res(
        ctx.json({
          results: [createMockRecipe({ title: 'Pasta Recipe' })],
          totalResults: 1,
          offset: 0,
          number: 20
        })
      )
    }
    
    return res(
      ctx.json({
        results: [],
        totalResults: 0,
        offset: 0,
        number: 20
      })
    )
  }),
  
  rest.get('/api/recipe/:id', (req, res, ctx) => {
    const { id } = req.params
    
    return res(
      ctx.json({
        recipe: createMockRecipe({ externalId: parseInt(id as string) }),
        cached: false
      })
    )
  })
)

describe('API Integration', () => {
  beforeAll(() => server.listen())
  afterAll(() => server.close())
  beforeEach(() => server.resetHandlers())

  it('fetches recipes from API', async () => {
    const response = await $fetch('/api/recipes', {
      params: { q: 'pasta' }
    })

    expect(response.results).toHaveLength(1)
    expect(response.results[0].title).toBe('Pasta Recipe')
    expect(response.totalResults).toBe(1)
  })

  it('fetches individual recipe', async () => {
    const response = await $fetch('/api/recipe/12345')

    expect(response.recipe.externalId).toBe(12345)
    expect(response.cached).toBe(false)
  })

  it('handles API errors gracefully', async () => {
    server.use(
      rest.get('/api/recipes', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }))
      })
    )

    await expect($fetch('/api/recipes')).rejects.toThrow()
  })
})
```

### Database Integration Tests

```typescript
// tests/integration/database/recipes.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { createMockRecipe, createMockNutrition } from '~/tests/setup/test-utils'

const prisma = new PrismaClient()

describe('Database Integration', () => {
  beforeEach(async () => {
    // Clean database before each test
    await prisma.cache.deleteMany()
    await prisma.nutrition.deleteMany()
    await prisma.recipeIngredient.deleteMany()
    await prisma.recipe.deleteMany()
  })

  afterEach(async () => {
    // Clean database after each test
    await prisma.cache.deleteMany()
    await prisma.nutrition.deleteMany()
    await prisma.recipeIngredient.deleteMany()
    await prisma.recipe.deleteMany()
  })

  it('creates recipe with ingredients and nutrition', async () => {
    const mockRecipe = createMockRecipe()
    const mockNutrition = createMockNutrition()

    const recipe = await prisma.recipe.create({
      data: {
        externalId: mockRecipe.externalId,
        title: mockRecipe.title,
        image: mockRecipe.image,
        servings: mockRecipe.servings,
        readyInMinutes: mockRecipe.readyInMinutes,
        sourceUrl: mockRecipe.sourceUrl,
        sourceName: mockRecipe.sourceName,
        summary: mockRecipe.summary,
        instructions: mockRecipe.instructions,
        cuisine: mockRecipe.cuisine,
        ingredients: {
          create: [
            {
              name: 'Test Ingredient',
              amount: 1,
              unit: 'cup',
              aisle: 'Produce'
            }
          ]
        },
        nutrition: {
          create: {
            calories: mockNutrition.calories,
            protein: mockNutrition.protein,
            fat: mockNutrition.fat,
            carbs: mockNutrition.carbs,
            fiber: mockNutrition.fiber,
            sugar: mockNutrition.sugar,
            sodium: mockNutrition.sodium
          }
        }
      },
      include: {
        ingredients: true,
        nutrition: true
      }
    })

    expect(recipe.title).toBe(mockRecipe.title)
    expect(recipe.ingredients).toHaveLength(1)
    expect(recipe.nutrition).toBeTruthy()
    expect(recipe.nutrition!.calories).toBe(mockNutrition.calories)
  })

  it('finds recipe by external ID', async () => {
    const mockRecipe = createMockRecipe()

    await prisma.recipe.create({
      data: {
        externalId: mockRecipe.externalId,
        title: mockRecipe.title,
        image: mockRecipe.image,
        servings: mockRecipe.servings,
        readyInMinutes: mockRecipe.readyInMinutes,
        sourceUrl: mockRecipe.sourceUrl,
        sourceName: mockRecipe.sourceName,
        summary: mockRecipe.summary,
        instructions: mockRecipe.instructions,
        cuisine: mockRecipe.cuisine
      }
    })

    const foundRecipe = await prisma.recipe.findUnique({
      where: { externalId: mockRecipe.externalId }
    })

    expect(foundRecipe).toBeTruthy()
    expect(foundRecipe!.title).toBe(mockRecipe.title)
  })

  it('filters recipes by cuisine', async () => {
    const italianRecipe = createMockRecipe({ cuisine: 'italian' })
    const frenchRecipe = createMockRecipe({ cuisine: 'french', externalId: 12346 })

    await prisma.recipe.createMany({
      data: [
        {
          externalId: italianRecipe.externalId,
          title: italianRecipe.title,
          cuisine: italianRecipe.cuisine
        },
        {
          externalId: frenchRecipe.externalId,
          title: frenchRecipe.title,
          cuisine: frenchRecipe.cuisine
        }
      ]
    })

    const italianRecipes = await prisma.recipe.findMany({
      where: { cuisine: 'italian' }
    })

    expect(italianRecipes).toHaveLength(1)
    expect(italianRecipes[0].cuisine).toBe('italian')
  })
})
```

## E2E Testing

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### E2E Test Example

```typescript
// tests/e2e/recipe-search.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Recipe Search', () => {
  test('should search for recipes', async ({ page }) => {
    await page.goto('/')
    
    // Type in search box
    await page.fill('[data-testid="search-input"]', 'pasta')
    
    // Wait for search results
    await page.waitForSelector('[data-testid="recipe-card"]')
    
    // Verify results
    const recipeCards = await page.locator('[data-testid="recipe-card"]').count()
    expect(recipeCards).toBeGreaterThan(0)
  })

  test('should filter by cuisine', async ({ page }) => {
    await page.goto('/')
    
    // Click on Italian cuisine filter
    await page.click('[data-testid="cuisine-filter-italian"]')
    
    // Wait for filtered results
    await page.waitForSelector('[data-testid="recipe-card"]')
    
    // Verify all recipes have Italian cuisine badge
    const cuisineBadges = await page.locator('[data-testid="cuisine-badge"]').all()
    for (const badge of cuisineBadges) {
      await expect(badge).toContainText('Italian')
    }
  })

  test('should navigate to recipe detail', async ({ page }) => {
    await page.goto('/')
    
    // Click on first recipe card
    await page.click('[data-testid="recipe-card"]:first-child')
    
    // Verify navigation to recipe detail page
    await expect(page).toHaveURL(/\/recipe\/\d+/)
    
    // Verify recipe title is displayed
    await expect(page.locator('[data-testid="recipe-title"]')).toBeVisible()
  })

  test('should display nutritional information', async ({ page }) => {
    await page.goto('/recipe/12345')
    
    // Wait for nutrition section
    await page.waitForSelector('[data-testid="nutrition-section"]')
    
    // Verify nutrition data is displayed
    await expect(page.locator('[data-testid="calories"]')).toBeVisible()
    await expect(page.locator('[data-testid="protein"]')).toBeVisible()
    await expect(page.locator('[data-testid="fat"]')).toBeVisible()
    await expect(page.locator('[data-testid="carbs"]')).toBeVisible()
  })
})
```

## Test Data Management

### Fixtures

```typescript
// tests/fixtures/recipes.json
{
  "recipes": [
    {
      "id": 1,
      "externalId": 12345,
      "title": "Classic Spaghetti Carbonara",
      "image": "https://example.com/carbonara.jpg",
      "servings": 4,
      "readyInMinutes": 25,
      "sourceUrl": "https://example.com/carbonara",
      "sourceName": "Italian Recipes",
      "summary": "A classic Roman pasta dish with eggs, cheese, and pancetta",
      "instructions": "1. Cook pasta\n2. Fry pancetta\n3. Mix with eggs and cheese",
      "cuisine": "italian",
      "isNew": true,
      "ingredients": [
        {
          "name": "Spaghetti",
          "amount": 400,
          "unit": "g",
          "aisle": "Pasta"
        },
        {
          "name": "Pancetta",
          "amount": 150,
          "unit": "g",
          "aisle": "Meat"
        }
      ],
      "nutrition": {
        "calories": 450,
        "protein": 18,
        "fat": 22,
        "carbs": 45,
        "fiber": 3,
        "sugar": 2,
        "sodium": 800
      }
    }
  ]
}
```

### Test Data Utilities

```typescript
// tests/utils/test-data.ts
import recipesData from '../fixtures/recipes.json'

export function loadTestRecipes(): Recipe[] {
  return recipesData.recipes
}

export function createTestRecipe(overrides: Partial<Recipe> = {}): Recipe {
  const baseRecipe = recipesData.recipes[0]
  return { ...baseRecipe, ...overrides }
}

export function createTestRecipeList(count: number): Recipe[] {
  return Array.from({ length: count }, (_, index) => 
    createTestRecipe({ 
      id: index + 1, 
      externalId: 12345 + index,
      title: `Test Recipe ${index + 1}` 
    })
  )
}
```

## Performance Testing

### Component Performance Tests

```typescript
// tests/performance/components.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RecipeCard from '~/components/RecipeCard.vue'
import { createTestRecipeList } from '~/tests/utils/test-data'

describe('Component Performance', () => {
  it('renders large list of recipe cards efficiently', () => {
    const recipes = createTestRecipeList(100)
    const startTime = performance.now()

    const wrapper = mount({
      template: `
        <div>
          <RecipeCard 
            v-for="recipe in recipes" 
            :key="recipe.id" 
            :recipe="recipe" 
          />
        </div>
      `,
      components: { RecipeCard },
      data() {
        return { recipes }
      }
    })

    const endTime = performance.now()
    const renderTime = endTime - startTime

    expect(renderTime).toBeLessThan(1000) // Should render in under 1 second
    expect(wrapper.findAllComponents(RecipeCard)).toHaveLength(100)
  })
})
```

## Coverage Requirements

### Coverage Thresholds

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 85,
          statements: 85
        },
        './components/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        './stores/': {
          branches: 85,
          functions: 85,
          lines: 90,
          statements: 90
        }
      }
    }
  }
})
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run database migrations
      run: npx prisma migrate deploy
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Generate coverage report
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella

  e2e:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20.x'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright browsers
      run: npx playwright install --with-deps
    
    - name: Run E2E tests
      run: npm run test:e2e
```

## Test Scripts

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest unit",
    "test:integration": "vitest integration",
    "test:e2e": "playwright test",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:watch": "vitest --watch",
    "test:run": "vitest run"
  }
}
```

## Troubleshooting Common Test Issues

### 1. "ref is not defined" Errors
**Problem**: Vue 3 composables not imported in script setup blocks
**Solution**: Always import Vue composables explicitly:
```typescript
import { ref, computed, onMounted } from 'vue'
```

### 2. Test Selector Issues
**Problem**: Malformed selectors or missing elements
**Solution**: Use proper element selection patterns:
```typescript
// ✅ Correct
const buttons = wrapper.findAll('button')
const button = buttons.find(button => button.text().includes('Discover More'))

// ❌ Wrong
const button = wrapper.find('button').filter(button => button.text().includes('Discover More'))
```

### 3. Async Test Failures
**Problem**: Missing async/await in test functions
**Solution**: Always use async for tests with component updates:
```typescript
// ✅ Correct
it('should update state', async () => {
  wrapper.vm.isLoading = true
  await wrapper.vm.$nextTick()
  expect(wrapper.find('.loading').exists()).toBe(true)
})
```

### 4. Mock Interference
**Problem**: Mocks not cleared between tests
**Solution**: Clear mocks in beforeEach:
```typescript
beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockClear()
})
```

### 5. Component State Testing
**Problem**: Testing component state without proper setup
**Solution**: Set component state and wait for updates:
```typescript
it('should show loading state', async () => {
  wrapper.vm.isLoading = true
  await wrapper.vm.$nextTick()
  expect(wrapper.find('.recipe-skeleton').exists()).toBe(true)
})
```

---

*This specification should be updated when new testing patterns are added or existing test strategies change.*
