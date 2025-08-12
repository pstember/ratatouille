import { getServerSession } from '#auth'
import { PrismaClient } from '@prisma/client'
import type { RecipeSearchResult } from '~/types/recipe'

const prisma = new PrismaClient()

interface RecipeFilters {
  categories?: string[]
  cuisines?: string[]
  maxCookingTime?: number
  dietary?: string[]
  excludeAllergens?: string[]
  includeIngredients?: string[]
  sortBy?: 'title' | 'cookingTime' | 'newest' | 'oldest' | 'servings'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface BrowseResponse {
  recipes: RecipeSearchResult[]
  totalCount: number
  totalPages: number
  currentPage: number
  appliedFilters: RecipeFilters
  availableFilters: {
    cuisines: string[]
    categories: string[]
    allergens: string[]
    commonIngredients: string[]
    dietaryOptions: string[]
  }
}

export default defineEventHandler(async (event): Promise<BrowseResponse> => {
  try {
    const query = getQuery(event)
    
    // Parse and validate filters
    const filters: RecipeFilters = {
      categories: query.categories ? String(query.categories).split(',') : undefined,
      cuisines: query.cuisines ? String(query.cuisines).split(',') : undefined,
      maxCookingTime: query.maxCookingTime ? parseInt(String(query.maxCookingTime)) : undefined,
      dietary: query.dietary ? String(query.dietary).split(',') : undefined,
      excludeAllergens: query.excludeAllergens ? String(query.excludeAllergens).split(',') : undefined,
      includeIngredients: query.includeIngredients ? String(query.includeIngredients).split(',') : undefined,
      sortBy: query.sortBy as any || 'title',
      sortOrder: query.sortOrder as any || 'asc',
      page: query.page ? parseInt(String(query.page)) : 1,
      limit: query.limit ? parseInt(String(query.limit)) : 12
    }

    // Build where clause
    const where: any = {
      AND: []
    }

    // Category filter - using cuisine as category since category field doesn't exist
    if (filters.categories && filters.categories.length > 0) {
      where.AND.push({
        OR: filters.categories.map(category => ({
          cuisine: {
            contains: category
          }
        }))
      })
    }

    // Cuisine filter
    if (filters.cuisines && filters.cuisines.length > 0) {
      where.AND.push({
        OR: filters.cuisines.map(cuisine => ({
          cuisine: {
            contains: cuisine
          }
        }))
      })
    }

    // Cooking time filter
    if (filters.maxCookingTime) {
      where.AND.push({
        readyInMinutes: {
          lte: filters.maxCookingTime
        }
      })
    }

    // Dietary filter - not implemented yet as fields don't exist in schema
    // TODO: Add dietary fields to schema or implement alternative filtering
    if (filters.dietary && filters.dietary.length > 0) {
      console.log('Dietary filtering not implemented yet')
    }

    // Allergen exclusion filter
    if (filters.excludeAllergens && filters.excludeAllergens.length > 0) {
      where.AND.push({
        NOT: {
          allergens: {
            some: {
              allergen: {
                in: filters.excludeAllergens
              }
            }
          }
        }
      })
    }

    // Ingredient inclusion filter
    if (filters.includeIngredients && filters.includeIngredients.length > 0) {
      const ingredientConditions = filters.includeIngredients.map(ingredient => ({
        OR: [
          {
            title: {
              contains: ingredient
            }
          },
          {
            instructions: {
              contains: ingredient
            }
          }
        ]
      }))
      
      where.AND.push({
        AND: ingredientConditions
      })
    }

    // Build order by clause
    let orderBy: any = {}
    switch (filters.sortBy) {
      case 'title':
        orderBy.title = filters.sortOrder
        break
      case 'cookingTime':
        orderBy.readyInMinutes = filters.sortOrder
        break
      case 'newest':
        orderBy.createdAt = 'desc'
        break
      case 'oldest':
        orderBy.createdAt = 'asc'
        break
      case 'servings':
        orderBy.servings = filters.sortOrder
        break
      default:
        orderBy.title = 'asc'
    }

    // Calculate pagination
    const skip = (filters.page - 1) * filters.limit

    // Get total count
    const totalCount = await prisma.recipe.count({ where })

    // Get recipes with pagination
    const recipes = await prisma.recipe.findMany({
      where,
      orderBy,
      skip,
      take: filters.limit,
      include: {
        allergens: true,
        nutrition: true
      }
    })

    // Transform recipes to match RecipeSearchResult interface
    const transformedRecipes: RecipeSearchResult[] = recipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.readyInMinutes,
      servings: recipe.servings,
      cuisine: recipe.cuisine,
      category: undefined, // Category field doesn't exist in schema
      isNew: recipe.isNew,
      sourceName: recipe.sourceName,
      allergens: recipe.allergens.map(allergen => ({
        type: allergen.allergen,
        severity: allergen.severity
      })),
      nutrition: recipe.nutrition ? {
        calories: recipe.nutrition.calories,
        protein: recipe.nutrition.protein,
        carbohydrates: recipe.nutrition.carbs,
        fat: recipe.nutrition.fat,
        fiber: recipe.nutrition.fiber,
        sugar: recipe.nutrition.sugar,
        sodium: recipe.nutrition.sodium
      } : undefined
    }))

    // Get available filters
    const availableFilters = await getAvailableFilters()

    return {
      recipes: transformedRecipes,
      totalCount,
      totalPages: Math.ceil(totalCount / filters.limit),
      currentPage: filters.page,
      appliedFilters: filters,
      availableFilters
    }

  } catch (error) {
    console.error('Browse recipes error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to browse recipes'
    })
  }
})

async function getAvailableFilters() {
  try {
    // Get unique cuisines
    const cuisines = await prisma.recipe.findMany({
      select: { cuisine: true },
      where: { cuisine: { not: null } },
      distinct: ['cuisine']
    })

    // Get unique categories (using cuisine as category for now)
    const categories = await prisma.recipe.findMany({
      select: { cuisine: true },
      where: { cuisine: { not: null } },
      distinct: ['cuisine']
    })

    // Get unique allergens
    const allergens = await prisma.recipeAllergen.findMany({
      select: { allergen: true },
      distinct: ['allergen']
    })

    // Common ingredients (this would need to be enhanced with actual ingredient extraction)
    const commonIngredients = [
      'chicken', 'beef', 'pork', 'fish', 'shrimp', 'salmon',
      'tomato', 'onion', 'garlic', 'olive oil', 'butter',
      'rice', 'pasta', 'bread', 'cheese', 'milk', 'eggs',
      'potato', 'carrot', 'broccoli', 'spinach', 'lettuce',
      'lemon', 'lime', 'basil', 'oregano', 'thyme', 'rosemary'
    ]

    // Dietary options
    const dietaryOptions = [
      'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo'
    ]

    return {
      cuisines: cuisines.map(c => c.cuisine).filter(Boolean),
      categories: categories.map(c => c.cuisine).filter(Boolean),
      allergens: allergens.map(a => a.allergen),
      commonIngredients,
      dietaryOptions
    }
  } catch (error) {
    console.error('Error getting available filters:', error)
    return {
      cuisines: [],
      categories: [],
      allergens: [],
      commonIngredients: [],
      dietaryOptions: []
    }
  }
}
