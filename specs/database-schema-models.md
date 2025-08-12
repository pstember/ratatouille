# Database Schema & Models Specification

## Overview

This specification defines the database schema, data models, relationships, and migration strategy for the Ratatouille Recipe Discovery Platform using Prisma ORM.

## Database Architecture

### Technology Stack

- **ORM**: Prisma 6.13.0
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **Migration Tool**: Prisma Migrate
- **Schema Language**: Prisma Schema Language (PSL)

### Database Structure

```
Database
├── recipes              # Main recipe table
├── recipe_ingredients   # Recipe ingredients
├── nutrition           # Nutritional information
├── cache              # API response caching
└── search             # Search query caching
```

## Schema Definition

### Prisma Schema File

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// Main recipe model
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
  instructions String? // Cooking instructions
  cuisine     String?  // Cuisine type (italian, french, mexican, etc.)
  isNew       Boolean  @default(true) // Track if recipe is newly fetched
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  ingredients RecipeIngredient[]
  nutrition   Nutrition?
  allergens   RecipeAllergen[] // Allergen information
  cache       Cache[]

  @@map("recipes")
}

// Recipe ingredients
model RecipeIngredient {
  id        Int      @id @default(autoincrement())
  recipeId  Int
  name      String
  amount    Float?
  unit      String?
  aisle     String?
  createdAt DateTime @default(now())

  // Relations
  recipe    Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@map("recipe_ingredients")
}

// Nutritional information
model Nutrition {
  id        Int      @id @default(autoincrement())
  recipeId  Int      @unique
  calories  Float?
  protein   Float?
  fat       Float?
  carbs     Float?
  fiber     Float?
  sugar     Float?
  sodium    Float?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  recipe    Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@map("nutrition")
}

// API response caching
model Cache {
  id        Int      @id @default(autoincrement())
  key       String   @unique
  value     String   // JSON string of cached data
  type      String   // 'recipe', 'search', 'nutrition'
  recipeId  Int?     // Optional reference to recipe
  expiresAt DateTime
  createdAt DateTime @default(now())

  // Relations
  recipe    Recipe?  @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@map("cache")
}

// Search query caching
model Search {
  id        Int      @id @default(autoincrement())
  query     String
  results   String   // JSON string of search results
  count     Int
  createdAt DateTime @default(now())

  @@map("search")
}

// Recipe allergens
model RecipeAllergen {
  id        Int      @id @default(autoincrement())
  recipeId  Int
  allergen  String   // Allergen type (gluten, dairy, nuts, etc.)
  severity  String   @default("warning") // "warning", "critical"
  createdAt DateTime @default(now())

  // Relations
  recipe    Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@unique([recipeId, allergen])
  @@map("recipe_allergens")
}
```

## Data Models

### Recipe Model

```typescript
// types/recipe.ts
export interface Recipe {
  id: number
  externalId: number
  title: string
  image?: string
  servings?: number
  readyInMinutes?: number
  sourceUrl?: string
  sourceName?: string
  summary?: string
  instructions?: string
  cuisine?: string
  ingredients?: RecipeIngredient[]
  nutrition?: Nutrition
  allergens?: RecipeAllergen[] // Allergen information
  isNew: boolean
  createdAt: string
  updatedAt: string
}
```

**Fields**:
- `id`: Primary key (auto-increment)
- `externalId`: Unique Spoonacular recipe ID
- `title`: Recipe title
- `image`: Recipe image URL
- `servings`: Number of servings
- `readyInMinutes`: Cooking time in minutes
- `sourceUrl`: Original source URL
- `sourceName`: Source website name
- `summary`: Recipe description
- `instructions`: Cooking instructions
- `cuisine`: Cuisine type
- `allergens`: Allergen information array
- `isNew`: New recipe flag
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### RecipeIngredient Model

```typescript
export interface RecipeIngredient {
  id: number
  recipeId: number
  name: string
  amount?: number
  unit?: string
  aisle?: string
  createdAt: string
}
```

**Fields**:
- `id`: Primary key (auto-increment)
- `recipeId`: Foreign key to Recipe
- `name`: Ingredient name
- `amount`: Ingredient amount
- `unit`: Measurement unit
- `aisle`: Grocery store aisle
- `createdAt`: Creation timestamp

### Nutrition Model

```typescript
export interface Nutrition {
  id: number
  recipeId: number
  calories?: number
  protein?: number
  fat?: number
  carbs?: number
  fiber?: number
  sugar?: number
  sodium?: number
  createdAt: string
  updatedAt: string
}

### RecipeAllergen Model

```typescript
export interface RecipeAllergen {
  id: number
  recipeId: number
  allergen: string // Allergen type (gluten, dairy, nuts, etc.)
  severity: 'warning' | 'critical'
  createdAt: string
}
```

**Fields**:
- `id`: Primary key (auto-increment)
- `recipeId`: Foreign key to Recipe
- `allergen`: Allergen type identifier
- `severity`: Warning level (warning or critical)
- `createdAt`: Creation timestamp
```

**Fields**:
- `id`: Primary key (auto-increment)
- `recipeId`: Foreign key to Recipe (unique)
- `calories`: Caloric content
- `protein`: Protein content (g)
- `fat`: Fat content (g)
- `carbs`: Carbohydrate content (g)
- `fiber`: Fiber content (g)
- `sugar`: Sugar content (g)
- `sodium`: Sodium content (mg)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Cache Model

```typescript
export interface Cache {
  id: number
  key: string
  value: string
  type: 'recipe' | 'search' | 'nutrition'
  recipeId?: number
  expiresAt: string
  createdAt: string
}
```

**Fields**:
- `id`: Primary key (auto-increment)
- `key`: Unique cache key
- `value`: JSON string of cached data
- `type`: Cache type identifier
- `recipeId`: Optional foreign key to Recipe
- `expiresAt`: Cache expiration timestamp
- `createdAt`: Creation timestamp

## Relationships

### One-to-Many Relationships

```prisma
// Recipe → RecipeIngredient (1:N)
model Recipe {
  ingredients RecipeIngredient[]
}

model RecipeIngredient {
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
}

// Recipe → RecipeAllergen (1:N)
model Recipe {
  allergens RecipeAllergen[]
}

model RecipeAllergen {
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
}
```

### One-to-One Relationships

```prisma
// Recipe → Nutrition (1:1)
model Recipe {
  nutrition Nutrition?
}

model Nutrition {
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
}
```

### One-to-Many with Optional Reference

```prisma
// Recipe → Cache (1:N, optional)
model Recipe {
  cache Cache[]
}

model Cache {
  recipe Recipe? @relation(fields: [recipeId], references: [id], onDelete: Cascade)
}
```

## Database Operations

### Prisma Client Setup

```typescript
// server/database/client.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Recipe Operations

```typescript
// Recipe CRUD operations
export class RecipeRepository {
  // Create recipe
  async create(recipeData: CreateRecipeData): Promise<Recipe> {
    return prisma.recipe.create({
      data: {
        externalId: recipeData.externalId,
        title: recipeData.title,
        image: recipeData.image,
        servings: recipeData.servings,
        readyInMinutes: recipeData.readyInMinutes,
        sourceUrl: recipeData.sourceUrl,
        sourceName: recipeData.sourceName,
        summary: recipeData.summary,
        instructions: recipeData.instructions,
        cuisine: recipeData.cuisine,
        ingredients: {
          create: recipeData.ingredients?.map(ingredient => ({
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            aisle: ingredient.aisle
          }))
        },
        nutrition: recipeData.nutrition ? {
          create: {
            calories: recipeData.nutrition.calories,
            protein: recipeData.nutrition.protein,
            fat: recipeData.nutrition.fat,
            carbs: recipeData.nutrition.carbs,
            fiber: recipeData.nutrition.fiber,
            sugar: recipeData.nutrition.sugar,
            sodium: recipeData.nutrition.sodium
          }
        } : undefined
      },
      include: {
        ingredients: true,
        nutrition: true
      }
    })
  }

  // Find recipe by external ID
  async findByExternalId(externalId: number): Promise<Recipe | null> {
    return prisma.recipe.findUnique({
      where: { externalId },
      include: {
        ingredients: true,
        nutrition: true
      }
    })
  }

  // Find recipes with filters
  async findMany(params: RecipeSearchParams): Promise<Recipe[]> {
    return prisma.recipe.findMany({
      where: {
        ...(params.cuisine && { cuisine: params.cuisine }),
        ...(params.maxReadyTime && { readyInMinutes: { lte: params.maxReadyTime } }),
        ...(params.query && {
          OR: [
            { title: { contains: params.query, mode: 'insensitive' } },
            { summary: { contains: params.query, mode: 'insensitive' } }
          ]
        })
      },
      include: {
        ingredients: true,
        nutrition: true
      },
      orderBy: { createdAt: 'desc' },
      take: params.number || 20,
      skip: params.offset || 0
    })
  }

  // Update recipe
  async update(id: number, data: UpdateRecipeData): Promise<Recipe> {
    return prisma.recipe.update({
      where: { id },
      data,
      include: {
        ingredients: true,
        nutrition: true
      }
    })
  }

  // Mark recipe as viewed
  async markAsViewed(id: number): Promise<void> {
    await prisma.recipe.update({
      where: { id },
      data: { isNew: false }
    })
  }

  // Get new recipes
  async getNewRecipes(limit: number = 10): Promise<Recipe[]> {
    return prisma.recipe.findMany({
      where: { isNew: true },
      include: {
        ingredients: true,
        nutrition: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }
}
```

### Cache Operations

```typescript
// Cache operations
export class CacheRepository {
  // Get cached result
  async get(key: string): Promise<any | null> {
    const cacheEntry = await prisma.cache.findUnique({
      where: { key }
    })

    if (!cacheEntry || cacheEntry.expiresAt < new Date()) {
      return null
    }

    return JSON.parse(cacheEntry.value)
  }

  // Set cache entry
  async set(key: string, value: any, ttl: number = 604800): Promise<void> {
    const expiresAt = new Date(Date.now() + ttl * 1000)

    await prisma.cache.upsert({
      where: { key },
      update: {
        value: JSON.stringify(value),
        expiresAt
      },
      create: {
        key,
        value: JSON.stringify(value),
        type: 'search',
        expiresAt
      }
    })
  }

  // Delete expired cache entries
  async cleanup(): Promise<number> {
    const result = await prisma.cache.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    })

    return result.count
  }
}
```

## Migration Strategy

### Migration Files

```sql
-- prisma/migrations/20250811092423_init/migration.sql
-- CreateTable
CREATE TABLE "recipes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "externalId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT,
    "servings" INTEGER,
    "readyInMinutes" INTEGER,
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "summary" TEXT,
    "instructions" TEXT,
    "cuisine" TEXT,
    "isNew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recipeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "amount" REAL,
    "unit" TEXT,
    "aisle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("recipeId") REFERENCES "recipes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "nutrition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recipeId" INTEGER NOT NULL,
    "calories" REAL,
    "protein" REAL,
    "fat" REAL,
    "carbs" REAL,
    "fiber" REAL,
    "sugar" REAL,
    "sodium" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("recipeId") REFERENCES "recipes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cache" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "recipeId" INTEGER,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("recipeId") REFERENCES "recipes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "search" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "query" TEXT NOT NULL,
    "results" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "recipes_externalId_key" ON "recipes"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "nutrition_recipeId_key" ON "nutrition"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "cache_key_key" ON "cache"("key");
```

### Migration Commands

```bash
# Generate migration
npx prisma migrate dev --name add_cuisine_field

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

## Indexing Strategy

### Primary Indexes

```prisma
// Primary keys (automatic)
model Recipe {
  id Int @id @default(autoincrement())
}

model RecipeIngredient {
  id Int @id @default(autoincrement())
}
```

### Unique Indexes

```prisma
// Unique constraints
model Recipe {
  externalId Int @unique // Spoonacular recipe ID
}

model Nutrition {
  recipeId Int @unique // One nutrition per recipe
}

model Cache {
  key String @unique // Cache key uniqueness
}
```

### Performance Indexes

```sql
-- Add performance indexes
CREATE INDEX "recipes_cuisine_idx" ON "recipes"("cuisine");
CREATE INDEX "recipes_is_new_idx" ON "recipes"("isNew");
CREATE INDEX "recipes_created_at_idx" ON "recipes"("createdAt");
CREATE INDEX "cache_expires_at_idx" ON "cache"("expiresAt");
CREATE INDEX "cache_type_idx" ON "cache"("type");
```

## Data Validation

### Schema Validation

```typescript
// Validation utilities
export function validateRecipeData(data: any): CreateRecipeData {
  if (!data.title || typeof data.title !== 'string') {
    throw new Error('Recipe title is required')
  }

  if (!data.externalId || typeof data.externalId !== 'number') {
    throw new Error('External ID is required')
  }

  return {
    externalId: data.externalId,
    title: data.title.trim(),
    image: data.image || null,
    servings: data.servings || null,
    readyInMinutes: data.readyInMinutes || null,
    sourceUrl: data.sourceUrl || null,
    sourceName: data.sourceName || null,
    summary: data.summary || null,
    instructions: data.instructions || null,
    cuisine: data.cuisine || null,
    ingredients: data.ingredients || [],
    nutrition: data.nutrition || null
  }
}
```

### Constraint Validation

```typescript
// Database constraints
export const RECIPE_CONSTRAINTS = {
  title: { maxLength: 255 },
  image: { maxLength: 500 },
  sourceUrl: { maxLength: 500 },
  sourceName: { maxLength: 100 },
  summary: { maxLength: 2000 },
  instructions: { maxLength: 10000 },
  cuisine: { maxLength: 50 }
}

export const INGREDIENT_CONSTRAINTS = {
  name: { maxLength: 100 },
  unit: { maxLength: 20 },
  aisle: { maxLength: 50 }
}
```

## Backup & Recovery

### Database Backup

```bash
# SQLite backup
cp prisma/dev.db prisma/dev.db.backup

# PostgreSQL backup
pg_dump $DATABASE_URL > backup.sql
```

### Data Recovery

```bash
# SQLite restore
cp prisma/dev.db.backup prisma/dev.db

# PostgreSQL restore
psql $DATABASE_URL < backup.sql
```

## Performance Optimization

### Query Optimization

```typescript
// Optimized queries
export async function getRecipesOptimized(params: RecipeSearchParams) {
  return prisma.recipe.findMany({
    where: buildOptimizedWhereClause(params),
    select: {
      id: true,
      externalId: true,
      title: true,
      image: true,
      servings: true,
      readyInMinutes: true,
      cuisine: true,
      isNew: true,
      nutrition: {
        select: {
          calories: true,
          protein: true,
          fat: true,
          carbs: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: params.number || 20,
    skip: params.offset || 0
  })
}
```

### Connection Pooling

```typescript
// PostgreSQL connection pooling
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Connection pool settings
  __internal: {
    engine: {
      connectionLimit: 10,
      pool: {
        min: 2,
        max: 10
      }
    }
  }
})
```

## Monitoring & Maintenance

### Database Health Checks

```typescript
// Health check utility
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}
```

### Cache Cleanup

```typescript
// Scheduled cache cleanup
export async function cleanupExpiredCache(): Promise<number> {
  const result = await prisma.cache.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  })
  
  console.log(`Cleaned up ${result.count} expired cache entries`)
  return result.count
}
```

---

*This specification should be updated when database schema changes or new models are added.*
