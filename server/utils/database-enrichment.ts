import { prisma } from '../database/client'
import type { RecipeSearchResult } from '~/types/recipe'

export class DatabaseEnrichmentService {
  async enrichFromSpoonacular(recipes: RecipeSearchResult[]): Promise<number> {
    let enrichedCount = 0
    
    for (const recipe of recipes) {
      try {
        const wasStored = await this.storeRecipe(recipe)
        if (wasStored) {
          enrichedCount++
        }
      } catch (error) {
        console.error(`Failed to enrich recipe ${recipe.id}:`, error)
      }
    }
    
    return enrichedCount
  }
  
  async storeRecipe(recipe: any): Promise<boolean> {
    try {
      console.log(`🔍 storeRecipe called for recipe ${recipe.id}`)
      console.log(`📝 Recipe data:`, {
        id: recipe.id,
        title: recipe.title,
        hasNutrition: !!recipe.nutrition,
        hasIngredients: !!(recipe.ingredients && recipe.ingredients.length > 0)
      })
      
      // Check if recipe already exists
      const existingRecipe = await prisma.recipe.findFirst({
        where: {
          OR: [
            { id: recipe.id },
            { externalId: recipe.id }
          ]
        }
      })
      
      console.log(`🔍 Existing recipe check:`, existingRecipe ? `Found ID ${existingRecipe.id}` : 'Not found')
      
      if (existingRecipe) {
        // Update existing recipe
        console.log(`📝 Updating existing recipe ${existingRecipe.id}`)
        return await this.updateExistingRecipe(recipe)
      } else {
        // Create new recipe
        console.log(`📝 Creating new recipe with externalId ${recipe.id}`)
        const createdRecipe = await prisma.recipe.create({
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
            originalSource: 'spoonacular',
            sourceUrl: recipe.sourceUrl,
            sourceName: recipe.sourceName,
            summary: recipe.summary,
            instructions: recipe.instructions
          }
        })
        
        console.log(`✅ Recipe created successfully with database ID: ${createdRecipe.id}`)
        
        // Store ingredients if available
        if (recipe.ingredients && recipe.ingredients.length > 0) {
          console.log(`🥘 Storing ${recipe.ingredients.length} ingredients...`)
          await this.storeIngredients(createdRecipe.id, recipe.ingredients)
        }
        
        // Store nutrition if available
        if (recipe.nutrition) {
          console.log(`🥗 Storing nutrition data...`)
          await this.storeNutrition(createdRecipe.id, recipe.nutrition)
        }
        
        console.log(`✅ Recipe ${recipe.id} fully stored`)
        return true
      }
    } catch (error) {
      console.error(`❌ Failed to store recipe ${recipe.id}:`, error)
      console.error(`❌ Error details:`, {
        message: error.message,
        code: error.code,
        stack: error.stack
      })
      return false
    }
  }
  
  async updateExistingRecipe(recipe: any): Promise<boolean> {
    try {
      const updatedRecipe = await prisma.recipe.updateMany({
        where: {
          OR: [
            { id: recipe.id },
            { externalId: recipe.id }
          ]
        },
        data: {
          title: recipe.title,
          image: recipe.image,
          servings: recipe.servings,
          readyInMinutes: recipe.readyInMinutes,
          cuisine: recipe.cuisine,
          enrichedFromSpoonacular: true,
          enrichmentDate: new Date(),
          sourceUrl: recipe.sourceUrl,
          sourceName: recipe.sourceName,
          summary: recipe.summary,
          instructions: recipe.instructions
        }
      })
      
      // Get the actual database recipe ID
      const existingRecipe = await prisma.recipe.findFirst({
        where: {
          OR: [
            { id: recipe.id },
            { externalId: recipe.id }
          ]
        }
      })
      
      if (existingRecipe) {
        // Update ingredients if available
        if (recipe.ingredients && recipe.ingredients.length > 0) {
          await this.storeIngredients(existingRecipe.id, recipe.ingredients)
        }
        
        // Update nutrition if available
        if (recipe.nutrition) {
          await this.storeNutrition(existingRecipe.id, recipe.nutrition)
        }
      }
      
      return true
    } catch (error) {
      console.error(`Failed to update recipe ${recipe.id}:`, error)
      return false
    }
  }
  
  async storeIngredients(recipeId: number, ingredients: any[]): Promise<void> {
    try {
      // First, delete existing ingredients for this recipe
      await prisma.recipeIngredient.deleteMany({
        where: {
          recipeId: recipeId
        }
      })
      
      // Then insert new ingredients
      for (const ingredient of ingredients) {
        await prisma.recipeIngredient.create({
          data: {
            recipeId: recipeId,
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            aisle: ingredient.aisle
          }
        })
      }
    } catch (error) {
      console.error(`Failed to store ingredients for recipe ${recipeId}:`, error)
    }
  }
  
  async storeNutrition(recipeId: number, nutrition: any): Promise<void> {
    try {
      console.log(`🥗 Storing nutrition for recipe ${recipeId}:`, nutrition)
      
      // Delete existing nutrition data
      await prisma.nutrition.deleteMany({
        where: {
          recipeId: recipeId
        }
      })
      
      // Insert new nutrition data
      const nutritionRecord = await prisma.nutrition.create({
        data: {
          recipeId: recipeId,
          calories: nutrition.calories,
          protein: nutrition.protein,
          fat: nutrition.fat,
          carbs: nutrition.carbs,
          fiber: nutrition.fiber,
          sugar: nutrition.sugar,
          sodium: nutrition.sodium
        }
      })
      
      console.log(`✅ Nutrition stored successfully:`, nutritionRecord.id)
    } catch (error) {
      console.error(`❌ Failed to store nutrition for recipe ${recipeId}:`, error)
      console.error(`❌ Nutrition data:`, nutrition)
    }
  }
  
  async getEnrichmentStats(): Promise<{
    totalEnriched: number
    newRecipes: number
    updatedRecipes: number
    lastEnrichment: Date | null
  }> {
    try {
      const totalEnriched = await prisma.recipe.count({
        where: {
          enrichedFromSpoonacular: true
        }
      })
      
      const lastEnrichment = await prisma.recipe.findFirst({
        where: {
          enrichedFromSpoonacular: true
        },
        orderBy: {
          enrichmentDate: 'desc'
        },
        select: {
          enrichmentDate: true
        }
      })
      
      // This is a simplified version - in a real implementation,
      // you might want to track new vs updated recipes separately
      return {
        totalEnriched,
        newRecipes: totalEnriched, // Simplified
        updatedRecipes: 0, // Simplified
        lastEnrichment: lastEnrichment?.enrichmentDate || null
      }
    } catch (error) {
      console.error('Failed to get enrichment stats:', error)
      return {
        totalEnriched: 0,
        newRecipes: 0,
        updatedRecipes: 0,
        lastEnrichment: null
      }
    }
  }
}
