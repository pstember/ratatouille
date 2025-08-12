# Recipe Caching System

This document explains how the recipe caching system works in Ratatouille to minimize API calls to Spoonacular.

## Overview

The application uses a hybrid approach:
- **External API**: Spoonacular for recipe discovery and search
- **Local Database**: SQLite/PostgreSQL for caching and data persistence
- **Smart Caching**: Recipes are cached locally to avoid repeated API calls

## How It Works

### 1. Recipe Fetching Flow

```
User Search → Check Local Cache → If Not Found → Fetch from Spoonacular → Store Locally → Return Result
```

### 2. New Recipe Detection

- **New recipes** (first time fetched from API) are marked with `isNew: true`
- **Existing recipes** (already in database) are marked with `isNew: false`
- The "NEW" badge is automatically displayed on newly fetched recipes
- After viewing a recipe detail page, the "new" status is automatically removed

### 3. Caching Strategy

- **Search Results**: Cached for 7 days with search query as key
- **Individual Recipes**: Cached for 7 days with recipe ID as key
- **Popular Recipes**: Cached for 7 days
- **New Recipes**: Automatically tracked via `isNew` field

## Database Schema

### Recipe Table
```sql
model Recipe {
  id          Int      @id @default(autoincrement())
  externalId  Int      @unique // Spoonacular recipe ID
  title       String
  image       String?
  servings    Int?
  readyInMinutes Int?
  sourceUrl   String?
  sourceName  String?
  summary     String?
  instructions String?
  isNew       Boolean  @default(true) // NEW: Track newly fetched recipes
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  ingredients RecipeIngredient[]
  nutrition   Nutrition?
  cache       Cache[]
}
```

### Cache Table
```sql
model Cache {
  id        Int      @id @default(autoincrement())
  key       String   @unique
  value     String   // JSON string of cached data
  type      String   // 'recipe', 'search', 'nutrition'
  recipeId  Int?     // Optional reference to recipe
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

## API Endpoints

### Recipe Search
- **GET** `/api/recipes?q={query}` - Search recipes with caching
- **GET** `/api/recipes/new` - Get newly added recipes

### Recipe Detail
- **GET** `/api/recipe/{id}` - Get recipe details with caching

## Benefits

1. **Reduced API Calls**: Minimizes Spoonacular API usage
2. **Faster Response Times**: Cached results load instantly
3. **Offline Capability**: Cached recipes work without internet
4. **Cost Savings**: Reduces API quota consumption
5. **User Experience**: "NEW" badges help users discover fresh content

## Configuration

### Environment Variables
```env
# Cache TTL (Time To Live) - 7 days default
CACHE_TTL=604800

# Database connection
DATABASE_URL="file:./dev.db"  # SQLite for development
```

### Cache TTL
- **Default**: 7 days (604,800 seconds)
- **Configurable**: Via `CACHE_TTL` environment variable
- **Automatic Cleanup**: Expired cache entries are automatically removed

## Maintenance

### Cache Cleanup
The system automatically:
- Removes expired cache entries
- Updates recipe "new" status after viewing
- Maintains database consistency

### Manual Operations
```typescript
// Mark recipe as viewed (not new)
await markRecipeAsViewed(recipeId)

// Get all new recipes
const newRecipes = await getNewRecipes(10)

// Clear all "new" flags (maintenance)
await clearAllNewFlags()
```

## Monitoring

### Cache Performance
- Check cache hit/miss rates in server logs
- Monitor database size and growth
- Track API call frequency

### Recipe Freshness
- New recipes are automatically marked
- "NEW" badges provide visual feedback
- Automatic status updates maintain accuracy

## Future Enhancements

1. **Smart Cache Invalidation**: Based on recipe popularity
2. **Background Sync**: Periodic updates of popular recipes
3. **User Preferences**: Personalized caching strategies
4. **Analytics**: Cache performance metrics
5. **A/B Testing**: Different caching strategies
