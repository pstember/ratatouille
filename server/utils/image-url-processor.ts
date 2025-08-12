/**
 * Utility functions for processing image URLs from Spoonacular API
 */

/**
 * Process an image URL to ensure it's a complete, accessible URL
 * @param imageUrl - The image URL from Spoonacular API
 * @param recipeId - Optional recipe ID for logging
 * @returns Processed image URL or undefined if invalid
 */
export function processImageUrl(imageUrl: string | null | undefined, recipeId?: number): string | undefined {
  if (!imageUrl) {
    return undefined
  }

  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // If it's a local placeholder, return as is
  if (imageUrl.startsWith('/images/')) {
    return imageUrl
  }

  // If it's a relative URL (Spoonacular format), construct the full URL
  if (imageUrl.includes('.jpg') || imageUrl.includes('.png') || imageUrl.includes('.jpeg')) {
    // Remove leading slash if present
    const cleanUrl = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl
    const fullUrl = `https://img.spoonacular.com/recipes/${cleanUrl}`
    
    if (recipeId) {
      console.log(`🖼️ Processed image URL for recipe ${recipeId}: ${imageUrl} → ${fullUrl}`)
    }
    
    return fullUrl
  }

  // Unknown format
  if (recipeId) {
    console.warn(`⚠️ Unknown image URL format for recipe ${recipeId}: ${imageUrl}`)
  }
  
  return undefined
}

/**
 * Process image URLs in a recipe object
 * @param recipe - Recipe object with image property
 * @returns Recipe object with processed image URL
 */
export function processRecipeImageUrl<T extends { image?: string | null }>(recipe: T): T {
  if (recipe.image) {
    return {
      ...recipe,
      image: processImageUrl(recipe.image)
    }
  }
  return recipe
}

/**
 * Process image URLs in an array of recipe objects
 * @param recipes - Array of recipe objects
 * @returns Array of recipe objects with processed image URLs
 */
export function processRecipeImageUrls<T extends { image?: string | null }>(recipes: T[]): T[] {
  return recipes.map(processRecipeImageUrl)
}
