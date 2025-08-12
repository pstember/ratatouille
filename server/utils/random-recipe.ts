import { prisma } from '../database/client'
import { cacheService } from './cache'
import { QuotaMonitor } from './quota-monitor'
import { SpoonacularClient } from './spoonacular-client'
import { handleSpoonacularError } from './spoonacular-error-handler'
import { processImageUrl } from './image-url-processor'
import type { RecipeSearchResult, RecipeFilter } from '~/types/recipe'

export interface RandomRecipeOptions {
  count?: number
  cuisine?: string
  dietary?: string
  ensureVariety?: boolean
}

export interface RandomRecipeResult {
  recipes: RecipeSearchResult[]
  totalAvailable: number
  source: 'api' | 'database' | 'cache'
  cached: boolean
}

export class RandomRecipeService {
  private static readonly DEFAULT_COUNT = 6
  private static readonly MAX_COUNT = 12
  private static readonly CACHE_TTL = 300 // 5 minutes for random results

  /**
   * Get random recipes with fallback strategy
   */
  static async getRandomRecipes(options: RandomRecipeOptions = {}): Promise<RandomRecipeResult> {
    const count = Math.min(options.count || this.DEFAULT_COUNT, this.MAX_COUNT)
    
    // Generate cache key
    const cacheKey = cacheService.generateKey('random_recipes', {
      count,
      cuisine: options.cuisine,
      dietary: options.dietary,
      ensureVariety: options.ensureVariety
    })

    // Try cache first
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      return { ...cached, cached: true }
    }

    // Try external API first if quota allows
    try {
      const apiResult = await this.getRandomFromAPI(count, options)
      if (apiResult) {
              const result = {
        recipes: apiResult.recipes.map((recipe: RecipeSearchResult) => ({
          ...recipe,
          image: recipe.image ? processImageUrl(recipe.image, recipe.id) : undefined
        })),
        totalAvailable: apiResult.totalAvailable,
        source: 'api' as const,
        cached: false
      }
        
        // Cache the result
        await cacheService.set(cacheKey, result, { 
          type: 'random',
          ttl: this.CACHE_TTL 
        })
        
        return result
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.log('API random selection failed, falling back to database:', errorMessage)
    }

    // Fallback to database random selection
    const dbResult = await this.getRandomFromDatabase(count, options)
    
    const result = {
      recipes: dbResult.recipes.map((recipe: RecipeSearchResult) => ({
        ...recipe,
        image: recipe.image ? processImageUrl(recipe.image, recipe.id) : undefined
      })),
      totalAvailable: dbResult.totalAvailable,
      source: 'database' as const,
      cached: false
    }

    // Cache the database result
    await cacheService.set(cacheKey, result, { 
      type: 'random',
      ttl: this.CACHE_TTL 
    })

    return result
  }

  /**
   * Get random recipes from external API
   */
  private static async getRandomFromAPI(count: number, options: RandomRecipeOptions) {
    const config = useRuntimeConfig()
    
    // Check quota before making API call
    const currentQuota = QuotaMonitor.getCurrentQuotaInfo()
    if (currentQuota && QuotaMonitor.shouldRequireConfirmation(currentQuota)) {
      return null // Don't use quota for random selection
    }

    try {
      // Use the new Spoonacular client for random recipes
      const response = await SpoonacularClient.getRandomRecipes({
        tags: options.cuisine || options.dietary,
        number: count
      })
      
      // Transform API response to our format
      // For random recipes, we need to fetch complete nutrition data for each recipe
      const recipes = await Promise.all(
        response.data.recipes.map(async (recipe: any) => {
          try {
            console.log(`🔍 Fetching complete nutrition data for recipe ${recipe.id}: ${recipe.title}`)
            
            // Fetch complete recipe information including nutrition using the new client
            const completeRecipeResponse = await SpoonacularClient.getRecipeInformation(
              recipe.id,
              true, // addRecipeNutrition
              true  // fillIngredients
            )
            
            const completeRecipe = completeRecipeResponse.data
            
            // Check if nutrition data is present in the main response
            if (completeRecipe.nutrition && completeRecipe.nutrition.nutrients) {
              console.log(`✅ Nutrition data found in main response for recipe ${recipe.id}:`, 
                completeRecipe.nutrition.nutrients.map((n: any) => `${n.name}: ${n.amount}${n.unit}`).join(', '))
            } else {
              console.log(`⚠️ No nutrition data in main response for recipe ${recipe.id}, trying direct nutrition endpoint...`)
              
              // Try the direct nutrition endpoint
              try {
                const nutritionUrl = `${config.public.apiBase}/${recipe.id}/nutritionWidget.json`
                const nutritionParams = new URLSearchParams({
                  apiKey: config.spoonacularApiKey
                })
                
                const nutritionData = await $fetch<any>(nutritionUrl + '?' + nutritionParams)
                
                if (nutritionData) {
                  console.log(`✅ Nutrition data found from direct endpoint for recipe ${recipe.id}`)
                  
                  // Transform the nutrition data to match our expected format
                  const transformedNutrition = {
                    nutrients: [
                      { name: "Calories", amount: nutritionData.calories, unit: "kcal" },
                      { name: "Protein", amount: nutritionData.protein, unit: "g" },
                      { name: "Fat", amount: nutritionData.fat, unit: "g" },
                      { name: "Carbohydrates", amount: nutritionData.carbs, unit: "g" },
                      { name: "Fiber", amount: nutritionData.fiber, unit: "g" },
                      { name: "Sugar", amount: nutritionData.sugar, unit: "g" },
                      { name: "Sodium", amount: nutritionData.sodium, unit: "mg" }
                    ]
                  }
                  
                  // Add the nutrition data to the complete recipe
                  completeRecipe.nutrition = transformedNutrition
                }
              } catch (nutritionError: any) {
                console.error(`Failed to fetch nutrition data from direct endpoint for recipe ${recipe.id}:`, nutritionError.message)
              }
            }
            
            // Use existing transformation logic from recipe-transformer.ts
            const { transformAndStoreRecipe } = await import('./recipe-transformer')
            return await transformAndStoreRecipe(completeRecipe)
          } catch (error: any) {
            console.error(`Failed to fetch complete data for recipe ${recipe.id}:`, error)
            // Fallback to basic recipe data without nutrition
            const { transformAndStoreRecipe } = await import('./recipe-transformer')
            return await transformAndStoreRecipe(recipe)
          }
        })
      )

      return {
        recipes,
        totalAvailable: recipes.length
      }
    } catch (error: unknown) {
      console.error('Failed to get random recipes from API:', error)
      return null
    }
  }

  /**
   * Get random recipes from database with variety optimization
   */
  private static async getRandomFromDatabase(count: number, options: RandomRecipeOptions) {
    const whereClause: any = {}
    
    // Add cuisine filter
    if (options.cuisine) {
      whereClause.cuisine = options.cuisine
    }

    // Add dietary filters (this would need to be implemented based on your schema)
    if (options.dietary) {
      // Implementation depends on how dietary info is stored
      // For now, we'll skip dietary filtering in database
    }

    // Get total count for variety calculation
    const totalCount = await prisma.recipe.count({ where: whereClause })
    
    if (totalCount === 0) {
      return { recipes: [], totalAvailable: 0 }
    }

    let recipes: RecipeSearchResult[]
    
    if (options.ensureVariety && totalCount > count * 2) {
      // Ensure variety by selecting from different cuisines
      recipes = await this.getVariedRandomRecipes(count, whereClause, totalCount)
    } else {
      // Simple random selection
      recipes = await this.getSimpleRandomRecipes(count, whereClause, totalCount)
    }

    return {
      recipes,
      totalAvailable: totalCount
    }
  }

  /**
   * Get random recipes ensuring variety across cuisines
   */
  private static async getVariedRandomRecipes(count: number, whereClause: any, totalCount: number) {
    // Get distinct cuisines
    const cuisines = await prisma.recipe.findMany({
      where: whereClause,
      select: { cuisine: true },
      distinct: ['cuisine']
    })

    const recipes: RecipeSearchResult[] = []
    const recipesPerCuisine = Math.ceil(count / cuisines.length)

    for (const cuisine of cuisines) {
      if (recipes.length >= count) break
      
      const cuisineRecipes = await prisma.recipe.findMany({
        where: { ...whereClause, cuisine: cuisine.cuisine },
        take: recipesPerCuisine,
        skip: Math.floor(Math.random() * Math.max(1, totalCount / cuisines.length)),
        include: { nutrition: true },
        orderBy: { id: 'asc' } // Consistent ordering for random skip
      })

      recipes.push(...cuisineRecipes.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        image: recipe.image || undefined,
        servings: recipe.servings || undefined,
        readyInMinutes: recipe.readyInMinutes || undefined,
        cuisine: recipe.cuisine || undefined,
        nutrition: recipe.nutrition ? {
          calories: recipe.nutrition.calories || undefined,
          protein: recipe.nutrition.protein || undefined,
          carbs: recipe.nutrition.carbs || undefined,
          fat: recipe.nutrition.fat || undefined,
          fiber: recipe.nutrition.fiber || undefined,
          sugar: recipe.nutrition.sugar || undefined,
          sodium: recipe.nutrition.sodium || undefined
        } : undefined,
        isNew: recipe.isNew || false
      })))
    }

    // Shuffle and limit to requested count
    return this.shuffleArray(recipes).slice(0, count)
  }

  /**
   * Get simple random recipes using database random function
   */
  private static async getSimpleRandomRecipes(count: number, whereClause: any, totalCount: number) {
    // Use database random function for better performance
    const recipes = await prisma.recipe.findMany({
      where: whereClause,
      take: count,
      skip: Math.floor(Math.random() * Math.max(1, totalCount - count)),
      include: { nutrition: true },
      orderBy: { id: 'asc' }
    })

    return recipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image || undefined,
      servings: recipe.servings || undefined,
      readyInMinutes: recipe.readyInMinutes || undefined,
      cuisine: recipe.cuisine || undefined,
      nutrition: recipe.nutrition ? {
        calories: recipe.nutrition.calories || undefined,
        protein: recipe.nutrition.protein || undefined,
        carbs: recipe.nutrition.carbs || undefined,
        fat: recipe.nutrition.fat || undefined,
        fiber: recipe.nutrition.fiber || undefined,
        sugar: recipe.nutrition.sugar || undefined,
        sodium: recipe.nutrition.sodium || undefined
      } : undefined,
      isNew: recipe.isNew || false
    }))
  }

  /**
   * Fisher-Yates shuffle algorithm for array randomization
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}
