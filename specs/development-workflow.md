# Development Workflow Specification

## Overview

This specification defines the development workflow, coding standards, and quality assurance procedures for the Ratatouille Recipe Discovery Platform. It ensures consistent, high-quality development practices across the project.

## Development Process

### Workflow Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Requirements  │───►│   Specification │───►│  Implementation │
│   Gathering     │    │   Creation      │    │   & Testing     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │    │   Spec Review   │    │   Code Review   │
│   & Feedback    │    │   & Approval    │    │   & QA          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Phase 1: Requirements Gathering

**CRITICAL**: Always start by asking:
> "Should I create a Spec for this task first?"

#### Requirements Collection Process

1. **Identify the Problem**
   - What user problem are we solving?
   - What is the current pain point?
   - What is the desired outcome?

2. **Define Success Criteria**
   - How will we measure success?
   - What are the acceptance criteria?
   - What is the definition of done?

3. **Scope Definition**
   - What is included in this feature?
   - What is explicitly out of scope?
   - What are the constraints and limitations?

4. **Technical Considerations**
   - What technologies will be used?
   - What are the performance requirements?
   - What are the security considerations?

### Phase 2: Specification Creation

#### Spec File Structure

Create specifications in `.cursor/scopes/FeatureName.md`:

```markdown
# Feature Name Specification

## Overview
Brief description of the feature and its purpose.

## Problem Statement
What problem does this feature solve?

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Requirements

### Functional Requirements
- Requirement 1
- Requirement 2

### Non-Functional Requirements
- Performance: Response time < 2 seconds
- Security: Input validation required
- Accessibility: WCAG 2.1 AA compliance

## Technical Design

### Architecture
- Component structure
- Data flow
- API endpoints

### Implementation Details
- Key algorithms
- Data structures
- External dependencies

## Testing Strategy
- Unit tests
- Integration tests
- E2E tests

## Out of Scope
- What we're not implementing
- Future considerations

## Dependencies
- External APIs
- Database changes
- Third-party libraries
```

#### Spec Review Process

1. **Draft Specification**
   - Create initial spec based on requirements
   - Include all necessary technical details
   - Define clear acceptance criteria

2. **User Review**
   - Present spec to user for review
   - Ask: "Does this capture your intent? Any changes needed?"
   - Iterate based on feedback

3. **Final Approval**
   - Get explicit user approval
   - End with: "Spec looks good? Type 'GO!' when ready to implement"

### Phase 3: Implementation

#### Pre-Implementation Checklist

- [ ] Specification approved by user
- [ ] Technical approach validated
- [ ] Dependencies identified
- [ ] Testing strategy defined
- [ ] Code review process established

#### Implementation Guidelines

1. **Follow the Specification**
   - Reference the spec throughout implementation
   - Don't deviate without user approval
   - Update spec if scope changes (with user permission)

2. **Code Quality Standards**
   - Follow TypeScript best practices
   - Use consistent naming conventions
   - Write self-documenting code
   - Include comprehensive comments

3. **Testing Requirements**
   - Write unit tests for all new code
   - Ensure adequate test coverage
   - Include integration tests where appropriate
   - Test error conditions and edge cases

## Coding Standards

### TypeScript Standards

#### Type Safety

```typescript
// ✅ Good: Strict typing
interface Recipe {
  id: number
  title: string
  cuisine?: string
  isNew: boolean
}

function getRecipe(id: number): Promise<Recipe | null> {
  // Implementation
}

// ❌ Bad: Any types
function getRecipe(id: any): any {
  // Implementation
}
```

#### Error Handling

```typescript
// ✅ Good: Proper error handling
export async function fetchRecipe(id: number): Promise<Recipe> {
  try {
    const response = await $fetch(`/api/recipe/${id}`)
    return response as Recipe
  } catch (error) {
    if (error.statusCode === 404) {
      throw new Error(`Recipe ${id} not found`)
    }
    throw new Error('Failed to fetch recipe')
  }
}

// ❌ Bad: No error handling
export async function fetchRecipe(id: number) {
  return await $fetch(`/api/recipe/${id}`)
}
```

### Vue Component Standards

#### Component Structure

```vue
<template>
  <!-- Template content -->
</template>

<script setup lang="ts">
// Imports
import { ref, computed } from 'vue'
import type { Recipe } from '~/types/recipe'

// Props
interface Props {
  recipe: Recipe
  showNutrition?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showNutrition: false
})

// Emits
const emit = defineEmits<{
  select: [recipe: Recipe]
  favorite: [recipe: Recipe]
}>()

// Reactive data
const isLoading = ref(false)

// Computed properties
const formattedTitle = computed(() => {
  return props.recipe.title.charAt(0).toUpperCase() + 
         props.recipe.title.slice(1)
})

// Methods
const handleSelect = () => {
  emit('select', props.recipe)
}
</script>

<style scoped>
/* Component-specific styles */
</style>
```

#### Naming Conventions

- **Components**: PascalCase (e.g., `RecipeCard.vue`)
- **Files**: kebab-case (e.g., `recipe-card.vue`)
- **Props**: camelCase (e.g., `recipeTitle`)
- **Events**: camelCase (e.g., `recipeSelected`)
- **CSS Classes**: kebab-case (e.g., `recipe-card`)

### State Management Standards

#### Pinia Store Structure

```typescript
// stores/recipes.ts
import { defineStore } from 'pinia'
import type { Recipe, RecipeFilters } from '~/types/recipe'

export const useRecipesStore = defineStore('recipes', () => {
  // State
  const recipes = ref<Recipe[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<RecipeFilters>({
    query: '',
    cuisine: '',
    diet: '',
    maxReadyTime: undefined
  })

  // Getters
  const filteredRecipes = computed(() => {
    // Filtering logic
    return recipes.value
  })

  const hasRecipes = computed(() => recipes.value.length > 0)

  // Actions
  const fetchRecipes = async (searchFilters?: RecipeFilters) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await $fetch('/api/recipes', {
        query: searchFilters || filters.value
      })
      recipes.value = response.recipes
    } catch (err) {
      error.value = 'Failed to fetch recipes'
      console.error('Recipe fetch error:', err)
    } finally {
      isLoading.value = false
    }
  }

  const updateFilters = (newFilters: Partial<RecipeFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  return {
    // State
    recipes: readonly(recipes),
    isLoading: readonly(isLoading),
    error: readonly(error),
    filters: readonly(filters),
    
    // Getters
    filteredRecipes,
    hasRecipes,
    
    // Actions
    fetchRecipes,
    updateFilters
  }
})
```

## Testing Standards

### Unit Testing

#### Test Structure

```typescript
// tests/unit/components/RecipeCard.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RecipeCard from '~/components/RecipeCard.vue'
import type { Recipe } from '~/types/recipe'

describe('RecipeCard', () => {
  const mockRecipe: Recipe = {
    id: 1,
    externalId: 12345,
    title: 'Test Recipe',
    cuisine: 'italian',
    isNew: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  it('renders recipe title correctly', () => {
    const wrapper = mount(RecipeCard, {
      props: { recipe: mockRecipe }
    })
    
    expect(wrapper.text()).toContain('Test Recipe')
  })

  it('emits select event when clicked', async () => {
    const wrapper = mount(RecipeCard, {
      props: { recipe: mockRecipe }
    })
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')?.[0]).toEqual([mockRecipe])
  })

  it('shows new badge for new recipes', () => {
    const wrapper = mount(RecipeCard, {
      props: { recipe: mockRecipe }
    })
    
    expect(wrapper.find('[data-testid="new-badge"]').exists()).toBe(true)
  })
})
```

#### Testing Guidelines

1. **Test Coverage Requirements**
   - Minimum 80% code coverage
   - 100% coverage for critical business logic
   - Test all public methods and computed properties

2. **Test Naming**
   - Use descriptive test names
   - Follow pattern: "should [expected behavior] when [condition]"
   - Group related tests with describe blocks

3. **Mocking Strategy**
   - Mock external dependencies
   - Use factory functions for test data
   - Avoid testing implementation details

### Integration Testing

#### API Testing

```typescript
// tests/integration/api/recipes.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { $fetch } from 'ofetch'

const server = setupServer(
  rest.get('/api/recipes', (req, res, ctx) => {
    return res(
      ctx.json({
        recipes: [
          {
            id: 1,
            title: 'Test Recipe',
            cuisine: 'italian'
          }
        ],
        totalResults: 1
      })
    )
  })
)

describe('Recipes API', () => {
  beforeAll(() => server.listen())
  afterAll(() => server.close())

  it('returns recipes with filters', async () => {
    const response = await $fetch('/api/recipes', {
      query: { cuisine: 'italian' }
    })
    
    expect(response.recipes).toHaveLength(1)
    expect(response.recipes[0].cuisine).toBe('italian')
  })
})
```

## Code Review Process

### Review Checklist

#### Functionality
- [ ] Code implements the specification correctly
- [ ] All acceptance criteria are met
- [ ] Error handling is appropriate
- [ ] Edge cases are handled

#### Code Quality
- [ ] Code follows project standards
- [ ] TypeScript types are properly defined
- [ ] No console.log statements in production code
- [ ] Code is self-documenting

#### Testing
- [ ] Unit tests are included
- [ ] Tests cover all new functionality
- [ ] Test coverage meets requirements
- [ ] Integration tests are added where needed

#### Performance
- [ ] No performance regressions
- [ ] Database queries are optimized
- [ ] Caching is implemented where appropriate
- [ ] Bundle size impact is minimal

#### Security
- [ ] Input validation is implemented
- [ ] No sensitive data is exposed
- [ ] API keys are properly secured
- [ ] Error messages don't leak information

### Review Process

1. **Self-Review**
   - Review your own code before submitting
   - Run all tests locally
   - Check for linting errors

2. **Peer Review**
   - Submit pull request with clear description
   - Reference the specification
   - Include testing instructions

3. **Review Feedback**
   - Address all review comments
   - Update code as needed
   - Re-run tests after changes

4. **Approval**
   - Get approval from at least one reviewer
   - Ensure all checks pass
   - Merge only after approval

## Quality Assurance

### Automated Checks

#### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{js,ts,vue}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

#### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm run test:coverage
    
    - name: Build application
      run: npm run build
```

### Manual QA Process

#### Testing Checklist

- [ ] Feature works as specified
- [ ] UI is responsive on all devices
- [ ] Accessibility requirements are met
- [ ] Performance is acceptable
- [ ] Error states are handled gracefully
- [ ] No console errors in browser
- [ ] Cross-browser compatibility verified

#### User Acceptance Testing

1. **Test with Real Data**
   - Use actual Spoonacular API responses
   - Test with various recipe types
   - Verify filtering works correctly

2. **Edge Case Testing**
   - Empty search results
   - Network errors
   - Invalid API responses
   - Large datasets

3. **User Experience Testing**
   - Navigation flow
   - Loading states
   - Error messages
   - Performance perception

## Documentation Standards

### Code Documentation

#### JSDoc Comments

```typescript
/**
 * Fetches recipes from the Spoonacular API with optional filtering
 * @param filters - Search and filter parameters
 * @param options - Request options including caching preferences
 * @returns Promise resolving to recipe search results
 * @throws {Error} When API request fails or returns invalid data
 * 
 * @example
 * ```typescript
 * const results = await fetchRecipes({
 *   query: 'pasta',
 *   cuisine: 'italian',
 *   maxReadyTime: 30
 * })
 * ```
 */
export async function fetchRecipes(
  filters: RecipeFilters,
  options: RequestOptions = {}
): Promise<RecipeSearchResults> {
  // Implementation
}
```

#### README Updates

- Update README.md for new features
- Include setup instructions
- Document API changes
- Add troubleshooting section

### Specification Updates

- Keep specifications current
- Update when requirements change
- Version control all specifications
- Maintain change log

## Development Environment

### Required Tools

- **Node.js**: 20.19.0 or higher
- **npm**: Latest stable version
- **Git**: For version control
- **VS Code**: Recommended IDE with extensions
- **Docker**: For containerized development (optional)

### IDE Configuration

#### VS Code Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "Vue.volar",
    "Vue.vscode-typescript-vue-plugin",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

#### Workspace Settings

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.includeLanguages": {
    "vue": "html"
  }
}
```

## Continuous Improvement

### Process Evaluation

#### Regular Reviews

- **Weekly**: Review development velocity
- **Monthly**: Assess code quality metrics
- **Quarterly**: Evaluate process effectiveness

#### Metrics Tracking

- **Code Coverage**: Maintain >80%
- **Bug Rate**: Track post-release bugs
- **Development Time**: Monitor feature delivery
- **User Satisfaction**: Gather feedback

### Process Updates

- **Adapt to Team Growth**: Scale processes appropriately
- **Incorporate Feedback**: Update based on team input
- **Stay Current**: Follow industry best practices
- **Document Changes**: Keep specifications updated

---

*This specification ensures consistent, high-quality development practices and maintains the integrity of the Ratatouille application throughout its lifecycle.*
