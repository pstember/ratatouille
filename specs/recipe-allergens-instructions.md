# Recipe Allergens & Instructions Specification

**Version:** 1.0  
**Status:** Draft  
**Created:** 2024-12-19  
**Last Updated:** 2024-12-19

## Purpose & User Problem

Currently, the Ratatouille application lacks critical information that users need to safely and successfully cook recipes:

1. **Missing Allergen Information**: Users cannot identify if recipes contain allergens they need to avoid (gluten, dairy, nuts, etc.), which is a serious safety concern
2. **Missing Recipe Instructions**: Users cannot see cooking instructions, making it impossible to actually prepare the recipes
3. **No Allergen Filtering**: Users cannot search for recipes that exclude specific allergens
4. **Poor User Experience**: The current recipe cards show ingredients and nutrition but lack the essential cooking guidance

This feature will address these critical gaps by integrating allergen data and recipe instructions from the Spoonacular API.

## Success Criteria

### Functional Requirements
- [ ] Display allergen information with clear warning badges on recipe cards
- [ ] Show complete recipe instructions with step-by-step cooking guidance
- [ ] Allow users to filter recipes by allergen exclusions
- [ ] Store allergen and instruction data in the database for offline access
- [ ] Update API endpoints to fetch and return allergen/instruction data
- [ ] Implement allergen warning system with visual indicators

### Technical Requirements
- [ ] Extend database schema to store allergens and instructions
- [ ] Update Spoonacular API integration to fetch complete recipe data
- [ ] Implement proper caching for allergen and instruction data
- [ ] Ensure responsive design for instruction display on mobile devices
- [ ] Maintain performance with additional data payload

### User Experience Requirements
- [ ] Clear, prominent allergen warnings that are immediately visible
- [ ] Well-formatted, easy-to-follow recipe instructions
- [ ] Intuitive allergen filtering in search interface
- [ ] Accessible design for users with dietary restrictions
- [ ] Mobile-friendly instruction layout

## Scope & Constraints

### In Scope
- Allergen detection and display for common allergens (gluten, dairy, eggs, nuts, shellfish, etc.)
- Complete recipe instructions with step-by-step guidance
- Allergen filtering in search functionality
- Database schema updates to store new data
- API integration updates to fetch complete recipe information
- UI components for allergen warnings and instruction display
- Caching strategy for new data types

### Out of Scope
- Allergen substitution suggestions
- Nutritional analysis of allergen-free alternatives
- User allergen preference profiles (future feature)
- Recipe modification for allergen-free versions
- Allergen cross-contamination warnings

### Constraints
- Spoonacular API rate limits and quota usage
- Database storage considerations for instruction text
- Mobile screen real estate for displaying instructions
- API response size and caching implications

## Technical Implementation

### Architecture

The implementation will extend the existing architecture:

```
Frontend (Vue/Nuxt)
├── RecipeCard.vue (add allergen badges)
├── RecipeDetail.vue (add instruction display)
├── SearchBar.vue (add allergen filters)
└── AllergenBadge.vue (new component)

Backend (Nuxt Server)
├── API endpoints (extend with allergen/instruction data)
├── Database schema (add allergen/instruction fields)
├── Spoonacular integration (fetch complete recipe data)
└── Caching layer (cache new data types)

Database (Prisma)
├── Recipe model (add allergens, instructions fields)
└── Migrations (update schema)
```

### Data Models

The database schema has been updated to include allergen and instruction support. See [Database Schema & Models Specification](./database-schema-models.md) for complete details.

#### Key Changes:
- **Recipe Model**: Added `allergens` relationship and enhanced `instructions` field
- **RecipeAllergen Model**: New model for storing allergen information
- **Relationships**: One-to-many relationship between Recipe and RecipeAllergen

#### Allergen Types

```typescript
// types/allergen.ts
export type AllergenType = 
  | 'gluten'
  | 'dairy'
  | 'eggs'
  | 'nuts'
  | 'peanuts'
  | 'shellfish'
  | 'fish'
  | 'soy'
  | 'wheat'
  | 'sulfites'
  | 'sesame'
  | 'celery'
  | 'mustard'
  | 'lupin'
  | 'molluscs'

export interface AllergenInfo {
  type: AllergenType
  severity: 'warning' | 'critical'
  displayName: string
  icon: string
  color: string
}
```

### API Design

#### Updated Recipe Endpoints

```typescript
// server/api/recipes.ts
export interface RecipeResponse {
  id: number
  externalId: number
  title: string
  image?: string
  servings?: number
  readyInMinutes?: number
  sourceUrl?: string
  sourceName?: string
  summary?: string
  instructions?: string // NEW
  cuisine?: string
  isNew: boolean
  ingredients: RecipeIngredient[]
  nutrition?: NutritionInfo
  allergens: AllergenInfo[] // NEW
  createdAt: string
  updatedAt: string
}

// server/api/recipes/[id].ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  // Fetch recipe with allergens and instructions
  const recipe = await getRecipeWithDetails(parseInt(id))
  
  return {
    ...recipe,
    allergens: await getRecipeAllergens(recipe.id),
    instructions: recipe.instructions
  }
})
```

#### Spoonacular Integration Updates

```typescript
// server/utils/spoonacular-client.ts
export interface SpoonacularRecipeDetail {
  id: number
  title: string
  image?: string
  servings?: number
  readyInMinutes?: number
  sourceUrl?: string
  sourceName?: string
  summary?: string
  instructions?: string // NEW
  analyzedInstructions?: SpoonacularInstruction[] // NEW
  cuisines?: string[]
  intolerances?: string[] // NEW: Spoonacular provides this
  // ... other fields
}

export interface SpoonacularInstruction {
  name: string
  steps: {
    number: number
    step: string
    ingredients?: any[]
    equipment?: any[]
  }[]
}

// Enhanced recipe fetching
export async function getRecipeDetails(
  recipeId: number,
  config: SpoonacularConfig
): Promise<SpoonacularRecipeDetail> {
  const url = `${config.baseUrl}/${recipeId}/information`
  const params = new URLSearchParams({
    apiKey: config.apiKey,
    includeNutrition: 'true',
    addRecipeInformation: 'true',
    fillIngredients: 'true'
  })
  
  const response = await fetch(`${url}?${params}`)
  return response.json()
}
```

### UI/UX Design

#### Allergen Badge Component

```vue
<!-- components/AllergenBadge.vue -->
<template>
  <div class="allergen-badge" :class="badgeClass">
    <Icon :name="allergen.icon" class="w-4 h-4" />
    <span class="text-sm font-medium">{{ allergen.displayName }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  allergen: AllergenInfo
  variant?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'medium'
})

const badgeClass = computed(() => ({
  'allergen-badge': true,
  [`allergen-badge--${props.variant}`]: true,
  [`allergen-badge--${props.allergen.severity}`]: true
}))
</script>

<style scoped>
.allergen-badge {
  @apply inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium;
}

.allergen-badge--warning {
  @apply bg-yellow-100 text-yellow-800 border border-yellow-200;
}

.allergen-badge--critical {
  @apply bg-red-100 text-red-800 border border-red-200;
}
</style>
```

#### Recipe Instructions Component

```vue
<!-- components/RecipeInstructions.vue -->
<template>
  <div class="recipe-instructions">
    <h3 class="text-lg font-semibold mb-4">Instructions</h3>
    
    <div v-if="analyzedInstructions.length > 0" class="space-y-6">
      <div 
        v-for="instruction in analyzedInstructions" 
        :key="instruction.name"
        class="instruction-section"
      >
        <h4 v-if="analyzedInstructions.length > 1" class="text-md font-medium mb-3">
          {{ instruction.name }}
        </h4>
        
        <ol class="space-y-3">
          <li 
            v-for="step in instruction.steps" 
            :key="step.number"
            class="flex gap-3"
          >
            <span class="step-number">{{ step.number }}</span>
            <span class="step-text">{{ step.step }}</span>
          </li>
        </ol>
      </div>
    </div>
    
    <div v-else-if="instructions" class="instructions-fallback">
      <div class="prose prose-sm max-w-none">
        {{ instructions }}
      </div>
    </div>
    
    <div v-else class="no-instructions">
      <p class="text-gray-500 italic">No instructions available for this recipe.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  instructions?: string
  analyzedInstructions?: SpoonacularInstruction[]
}

defineProps<Props>()
</script>

<style scoped>
.step-number {
  @apply flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center text-sm font-medium;
}

.step-text {
  @apply flex-1 leading-relaxed;
}
</style>
```

#### Updated Recipe Card

```vue
<!-- components/RecipeCard.vue (updated) -->
<template>
  <div class="recipe-card">
    <!-- Existing image and title -->
    
    <!-- NEW: Allergen warnings -->
    <div v-if="recipe.allergens.length > 0" class="allergen-warnings">
      <div class="flex flex-wrap gap-1">
        <AllergenBadge 
          v-for="allergen in recipe.allergens" 
          :key="allergen.type"
          :allergen="allergen"
          variant="small"
        />
      </div>
    </div>
    
    <!-- Existing nutrition and other info -->
  </div>
</template>
```

#### Search Filter Updates

```vue
<!-- components/SearchBar.vue (updated) -->
<template>
  <div class="search-container">
    <!-- Existing search input -->
    
    <!-- NEW: Allergen filters -->
    <div class="allergen-filters">
      <label class="text-sm font-medium text-gray-700">Exclude Allergens:</label>
      <div class="flex flex-wrap gap-2 mt-1">
        <button
          v-for="allergen in availableAllergens"
          :key="allergen.type"
          @click="toggleAllergenFilter(allergen.type)"
          :class="allergenFilterClass(allergen.type)"
        >
          {{ allergen.displayName }}
        </button>
      </div>
    </div>
  </div>
</template>
```

## Testing Strategy

### Unit Tests
- [ ] AllergenBadge component rendering and styling
- [ ] RecipeInstructions component with various data formats
- [ ] Allergen filtering logic in search functionality
- [ ] Database model validation for allergens and instructions
- [ ] API response parsing for new fields

### Integration Tests
- [ ] Spoonacular API integration with allergen/instruction data
- [ ] Database operations for storing and retrieving allergen data
- [ ] Search functionality with allergen filters
- [ ] Caching behavior for new data types

### E2E Tests
- [ ] Complete user flow: search → filter by allergens → view recipe with instructions
- [ ] Allergen warning visibility on recipe cards
- [ ] Instruction display on recipe detail pages
- [ ] Mobile responsiveness of instruction display

## Implementation Plan

### Phase 1: Database & API Foundation
1. Create database migration for allergen and instruction fields
2. Update Prisma schema and generate client
3. Extend Spoonacular API integration to fetch complete recipe data
4. Update API endpoints to return allergen and instruction data

### Phase 2: Core Components
1. Create AllergenBadge component
2. Create RecipeInstructions component
3. Update RecipeCard to display allergen warnings
4. Update RecipeDetail page to show instructions

### Phase 3: Search & Filtering
1. Add allergen filtering to search functionality
2. Update SearchBar component with allergen filter UI
3. Implement allergen exclusion logic in API

### Phase 4: Testing & Polish
1. Write comprehensive tests for new functionality
2. Optimize performance and caching
3. Ensure mobile responsiveness
4. Final UI/UX refinements

## Dependencies

- Spoonacular API endpoints: `/recipes/{id}/information` with `addRecipeInformation=true`
- Database migration tools (Prisma)
- Existing component architecture
- Current caching infrastructure

## Risk Assessment

### High Risk
- **API Rate Limits**: Fetching complete recipe data may increase API usage
- **Data Size**: Instructions can be large, affecting caching and performance

### Medium Risk
- **UI Complexity**: Adding allergen warnings may clutter recipe cards
- **Mobile Layout**: Instructions need careful mobile design

### Low Risk
- **Database Changes**: Standard schema updates
- **Component Development**: Standard Vue component patterns

## Success Metrics

- [ ] 100% of recipes display allergen information when available
- [ ] 100% of recipes display cooking instructions
- [ ] Allergen filtering reduces search results appropriately
- [ ] Mobile instruction display receives positive user feedback
- [ ] No performance degradation with additional data
