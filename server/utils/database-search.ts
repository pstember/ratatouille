import { prisma } from '~/server/database/client'
import { processImageUrl } from './image-url-processor'
import type { DatabaseSearchParams, DatabaseSearchResult } from '~/types/search'
import type { RecipeSearchResult } from '~/types/recipe'

export class DatabaseSearchService {
  async searchRecipes(params: DatabaseSearchParams): Promise<DatabaseSearchResult> {
    const { query, offset, limit, category, filters } = params
    
    try {
      let whereClause: any = {}
      
      // Add search query conditions
      if (query && query.trim()) {
        const searchQuery = query.trim()
        whereClause.OR = [
          {
            title: {
              contains: searchQuery
            }
          },
          {
            summary: {
              contains: searchQuery
            }
          },
          {
            ingredients: {
              some: {
                name: {
                  contains: searchQuery
                }
              }
            }
          }
        ]
      }
      
      // Add category filter
      if (category) {
        whereClause.category = category
      }
      
      // Add cuisine filter
      if (filters?.cuisine) {
        whereClause.cuisine = filters.cuisine
      }
      
      // Add time filter
      if (filters?.maxTime) {
        whereClause.readyInMinutes = {
          lte: filters.maxTime
        }
      }
      
      // Get total count
      const totalCount = await prisma.recipe.count({
        where: whereClause
      })
      
      // Get recipes with pagination
      const recipes = await prisma.recipe.findMany({
        where: whereClause,
        include: {
          ingredients: true,
          nutrition: true,
          allergens: true
        },
        orderBy: [
          {
            isNew: 'desc'
          },
          {
            createdAt: 'desc'
          }
        ],
        skip: offset,
        take: limit
      })
      
      // Transform to RecipeSearchResult format
      const transformedRecipes: RecipeSearchResult[] = recipes.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        image: processImageUrl(recipe.image, recipe.id),
        servings: recipe.servings || undefined,
        readyInMinutes: recipe.readyInMinutes || undefined,
        cuisine: recipe.cuisine || undefined,
        summary: recipe.summary || undefined,
        isNew: recipe.isNew,
        nutrition: recipe.nutrition ? {
          calories: recipe.nutrition.calories || undefined,
          protein: recipe.nutrition.protein || undefined,
          carbs: recipe.nutrition.carbs || undefined,
          fat: recipe.nutrition.fat || undefined,
          fiber: recipe.nutrition.fiber || undefined,
          sugar: recipe.nutrition.sugar || undefined
        } : undefined,
        allergens: recipe.allergens.map(allergen => ({
          id: allergen.id,
          name: allergen.allergen,
          severity: allergen.severity
        })),
        ingredients: recipe.ingredients.map(ingredient => ({
          id: ingredient.id,
          name: ingredient.name,
          amount: ingredient.amount || undefined,
          unit: ingredient.unit || undefined,
          aisle: ingredient.aisle || undefined
        })),
        _source: 'database' as const
      }))
      
      return {
        recipes: transformedRecipes,
        totalCount,
        source: 'database',
        hasMoreResults: offset + limit < totalCount
      }
    } catch (error) {
      console.error('Database search error:', error)
      throw new Error('Database search failed')
    }
  }
  
  async searchByTitle(query: string): Promise<RecipeSearchResult[]> {
    const recipes = await prisma.recipe.findMany({
      where: {
        title: {
          contains: query
        }
      },
      include: {
        ingredients: true,
        nutrition: true,
        allergens: true
      },
      orderBy: [
        {
          isNew: 'desc'
        },
        {
          createdAt: 'desc'
        }
      ]
    })
    
    return recipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image || undefined,
      servings: recipe.servings || undefined,
      readyInMinutes: recipe.readyInMinutes || undefined,
      cuisine: recipe.cuisine || undefined,
      summary: recipe.summary || undefined,
      isNew: recipe.isNew,
      nutrition: recipe.nutrition ? {
        calories: recipe.nutrition.calories || undefined,
        protein: recipe.nutrition.protein || undefined,
        carbs: recipe.nutrition.carbs || undefined,
        fat: recipe.nutrition.fat || undefined,
        fiber: recipe.nutrition.fiber || undefined,
        sugar: recipe.nutrition.sugar || undefined
      } : undefined,
      allergens: recipe.allergens.map(allergen => ({
        id: allergen.id,
        name: allergen.allergen,
        severity: allergen.severity
      })),
      ingredients: recipe.ingredients.map(ingredient => ({
        id: ingredient.id,
        name: ingredient.name,
        amount: ingredient.amount || undefined,
        unit: ingredient.unit || undefined,
        aisle: ingredient.aisle || undefined
      })),
      _source: 'database' as const
    }))
  }
  
  async searchByIngredients(query: string): Promise<RecipeSearchResult[]> {
    const recipes = await prisma.recipe.findMany({
      where: {
        ingredients: {
          some: {
            name: {
              contains: query
            }
          }
        }
      },
      include: {
        ingredients: true,
        nutrition: true,
        allergens: true
      },
      orderBy: [
        {
          isNew: 'desc'
        },
        {
          createdAt: 'desc'
        }
      ]
    })
    
    return recipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image || undefined,
      servings: recipe.servings || undefined,
      readyInMinutes: recipe.readyInMinutes || undefined,
      cuisine: recipe.cuisine || undefined,
      summary: recipe.summary || undefined,
      isNew: recipe.isNew,
      nutrition: recipe.nutrition ? {
        calories: recipe.nutrition.calories || undefined,
        protein: recipe.nutrition.protein || undefined,
        carbs: recipe.nutrition.carbs || undefined,
        fat: recipe.nutrition.fat || undefined,
        fiber: recipe.nutrition.fiber || undefined,
        sugar: recipe.nutrition.sugar || undefined
      } : undefined,
      allergens: recipe.allergens.map(allergen => ({
        id: allergen.id,
        name: allergen.allergen,
        severity: allergen.severity
      })),
      ingredients: recipe.ingredients.map(ingredient => ({
        id: ingredient.id,
        name: ingredient.name,
        amount: ingredient.amount || undefined,
        unit: ingredient.unit || undefined,
        aisle: ingredient.aisle || undefined
      })),
      _source: 'database' as const
    }))
  }
  
  async searchByCuisine(cuisine: string): Promise<RecipeSearchResult[]> {
    const recipes = await prisma.recipe.findMany({
      where: {
        cuisine: {
          contains: cuisine
        }
      },
      include: {
        ingredients: true,
        nutrition: true,
        allergens: true
      },
      orderBy: [
        {
          isNew: 'desc'
        },
        {
          createdAt: 'desc'
        }
      ]
    })
    
    return recipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image || undefined,
      servings: recipe.servings || undefined,
      readyInMinutes: recipe.readyInMinutes || undefined,
      cuisine: recipe.cuisine || undefined,
      summary: recipe.summary || undefined,
      isNew: recipe.isNew,
      nutrition: recipe.nutrition ? {
        calories: recipe.nutrition.calories || undefined,
        protein: recipe.nutrition.protein || undefined,
        carbs: recipe.nutrition.carbs || undefined,
        fat: recipe.nutrition.fat || undefined,
        fiber: recipe.nutrition.fiber || undefined,
        sugar: recipe.nutrition.sugar || undefined
      } : undefined,
      allergens: recipe.allergens.map(allergen => ({
        id: allergen.id,
        name: allergen.allergen,
        severity: allergen.severity
      })),
      ingredients: recipe.ingredients.map(ingredient => ({
        id: ingredient.id,
        name: ingredient.name,
        amount: ingredient.amount || undefined,
        unit: ingredient.unit || undefined,
        aisle: ingredient.aisle || undefined
      })),
      _source: 'database' as const
    }))
  }
  
  async getPopularRecipes(offset: number = 0, limit: number = 12): Promise<DatabaseSearchResult> {
    const recipes = await prisma.recipe.findMany({
      include: {
        ingredients: true,
        nutrition: true,
        allergens: true
      },
      orderBy: [
        {
          isNew: 'desc'
        },
        {
          createdAt: 'desc'
        }
      ],
      skip: offset,
      take: limit
    })
    
    const totalCount = await prisma.recipe.count()
    
    const transformedRecipes: RecipeSearchResult[] = recipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image || undefined,
      servings: recipe.servings || undefined,
      readyInMinutes: recipe.readyInMinutes || undefined,
      cuisine: recipe.cuisine || undefined,
      summary: recipe.summary || undefined,
      isNew: recipe.isNew,
      nutrition: recipe.nutrition ? {
        calories: recipe.nutrition.calories || undefined,
        protein: recipe.nutrition.protein || undefined,
        carbs: recipe.nutrition.carbs || undefined,
        fat: recipe.nutrition.fat || undefined,
        fiber: recipe.nutrition.fiber || undefined,
        sugar: recipe.nutrition.sugar || undefined
      } : undefined,
      allergens: recipe.allergens.map(allergen => ({
        id: allergen.id,
        name: allergen.allergen,
        severity: allergen.severity
      })),
      ingredients: recipe.ingredients.map(ingredient => ({
        id: ingredient.id,
        name: ingredient.name,
        amount: ingredient.amount || undefined,
        unit: ingredient.unit || undefined,
        aisle: ingredient.aisle || undefined
      })),
      _source: 'database' as const
    }))
    
    return {
      recipes: transformedRecipes,
      totalCount,
      source: 'database',
      hasMoreResults: offset + limit < totalCount
    }
  }
  
  async enrichDatabase(recipes: RecipeSearchResult[]): Promise<number> {
    let enrichedCount = 0
    
    for (const recipe of recipes) {
      try {
        // Check if recipe already exists
        const existingRecipe = await prisma.recipe.findFirst({
          where: {
            OR: [
              { id: recipe.id },
              { externalId: recipe.id }
            ]
          }
        })
        
        if (!existingRecipe) {
          // Create new recipe
          await prisma.recipe.create({
            data: {
              externalId: recipe.id,
              title: recipe.title,
              image: recipe.image,
              servings: recipe.servings,
              readyInMinutes: recipe.readyInMinutes,
              cuisine: recipe.cuisine,
              isNew: false,
              enrichedFromSpoonacular: true,
              enrichmentDate: new Date(),
              originalSource: 'spoonacular'
            }
          })
          enrichedCount++
        }
      } catch (error) {
        console.error(`Failed to enrich recipe ${recipe.id}:`, error)
      }
    }
    
    return enrichedCount
  }

  assessResultQuality(recipes: RecipeSearchResult[], query: string): {
    isSufficient: boolean
    reason: string
    suggestedAction: 'use_database' | 'offer_spoonacular'
  } {
    if (recipes.length === 0) {
      return {
        isSufficient: false,
        reason: 'No recipes found in database',
        suggestedAction: 'offer_spoonacular'
      }
    }

    // Check for exact title matches
    const exactMatches = recipes.filter(recipe => 
      recipe.title.toLowerCase().includes(query.toLowerCase())
    )

    if (exactMatches.length > 0) {
      return {
        isSufficient: true,
        reason: `Found ${exactMatches.length} exact matches in database`,
        suggestedAction: 'use_database'
      }
    }

    // Check if we have sufficient results (5 or more)
    if (recipes.length >= 5) {
      return {
        isSufficient: true,
        reason: `Found ${recipes.length} recipes in database`,
        suggestedAction: 'use_database'
      }
    }

    // Insufficient results
    return {
      isSufficient: false,
      reason: `Only found ${recipes.length} recipes, no exact matches`,
      suggestedAction: 'offer_spoonacular'
    }
  }

  combineAndDeduplicate(recipes: RecipeSearchResult[]): RecipeSearchResult[] {
    const seen = new Set<number>()
    return recipes.filter(recipe => {
      if (seen.has(recipe.id)) {
        return false
      }
      seen.add(recipe.id)
      return true
    })
  }

  calculateSearchScore(recipe: RecipeSearchResult, query: string): number {
    const queryLower = query.toLowerCase()
    const titleLower = recipe.title.toLowerCase()
    const summaryLower = recipe.summary?.toLowerCase() || ''
    
    let score = 0
    
    // Exact title match gets highest score
    if (titleLower === queryLower) {
      score += 200
    }
    // Title starts with query
    else if (titleLower.startsWith(queryLower)) {
      score += 150
    }
    // Title contains query
    else if (titleLower.includes(queryLower)) {
      score += 100
    }
    
    // Summary contains query
    if (summaryLower.includes(queryLower)) {
      score += 50
    }
    
    // Ingredient matches
    if (recipe.ingredients) {
      const ingredientMatches = recipe.ingredients.filter(ingredient =>
        ingredient.name.toLowerCase().includes(queryLower)
      ).length
      score += ingredientMatches * 25
    }
    
    // Recency bonus (newer recipes get higher scores)
    if (recipe.isNew) {
      score += 30
    }
    
    // Cuisine relevance (if query matches cuisine)
    if (recipe.cuisine && recipe.cuisine.toLowerCase().includes(queryLower)) {
      score += 20
    }
    
    return score
  }
}

// Create and export a default instance
export const databaseSearchService = new DatabaseSearchService()
