import type { CachedRecipeData } from '~/types/spoonacular-types'
import type {
  RecipeInformation,
  GetRecipeEquipmentByID200Response,
  GetRecipePriceBreakdownByID200Response,
  RecipeInformationWinePairing
} from 'spoonacular'

export interface ComprehensiveCacheConfig {
  ttl: number
  keyPrefix: string
  enableOfflineMode: boolean
  storeImages: boolean
  storeRelatedData: boolean
  maxOfflineSize: number // MB
  compressionEnabled: boolean
  dataIntegrityChecks: boolean
}

export const COMPREHENSIVE_CACHE_CONFIG: ComprehensiveCacheConfig = {
  ttl: 2592000, // 30 days for comprehensive data
  keyPrefix: 'spoonacular:complete:',
  enableOfflineMode: true,
  storeImages: true,
  storeRelatedData: true,
  maxOfflineSize: 500, // 500MB max offline storage
  compressionEnabled: true,
  dataIntegrityChecks: true
}

export class ComprehensiveCacheManager {
  private memoryCache = new Map<string, { value: any; expires: number }>()
  private config: ComprehensiveCacheConfig

  constructor(config: ComprehensiveCacheConfig = COMPREHENSIVE_CACHE_CONFIG) {
    this.config = config
  }

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryResult = this.getFromMemory(key)
    if (memoryResult) return memoryResult

    // Check database cache
    const dbResult = await this.getFromDatabase(key)
    if (dbResult) {
      this.setInMemory(key, dbResult, 300)
      return dbResult
    }

    // Check offline cache
    if (this.config.enableOfflineMode) {
      const offlineResult = await this.getFromOfflineCache(key)
      if (offlineResult) {
        this.setInMemory(key, offlineResult, 300)
        return offlineResult
      }
    }

    return null
  }

  async set<T>(key: string, value: T, ttl: number = 604800): Promise<void> {
    // Set in all cache layers
    this.setInMemory(key, value, Math.min(ttl, 300))

    await this.setInDatabase(key, value, ttl)

    // Store in offline cache if enabled
    if (this.config.enableOfflineMode) {
      await this.setInOfflineCache(key, value, ttl)
    }
  }

  async cacheCompleteRecipeData(
    recipeId: number,
    recipeData: RecipeInformation,
    equipment?: GetRecipeEquipmentByID200Response,
    priceBreakdown?: GetRecipePriceBreakdownByID200Response,
    winePairing?: RecipeInformationWinePairing,
    requestParams: Record<string, any> = {}
  ): Promise<void> {
    try {
      const cacheKey = `${this.config.keyPrefix}recipe:${recipeId}`
      const expiresAt = new Date(Date.now() + this.config.ttl * 1000)

      // Create comprehensive offline data
      const offlineData = await this.createOfflineData(
        recipeData,
        equipment,
        priceBreakdown,
        winePairing
      )

      const cachedData: CachedRecipeData = {
        originalResponse: recipeData,
        cachedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        sourceEndpoint: 'getRecipeInformation',
        requestParams,
        offlineData
      }

      // Compress data if enabled
      const dataToStore = this.config.compressionEnabled
        ? await this.compressData(cachedData)
        : JSON.stringify(cachedData)

      // Store in database cache
      await this.setInDatabaseWithSize(cacheKey, dataToStore, expiresAt)

      // Store images if enabled
      if (this.config.storeImages) {
        await this.cacheRecipeImages(recipeId, offlineData.images)
      }

      // Update offline storage metrics
      await this.updateOfflineMetrics()

      console.log(`Cached complete recipe data for ID: ${recipeId}`)
    } catch (error) {
      console.error('Error caching complete recipe data:', error)
    }
  }

  async getCachedCompleteRecipeData(recipeId: number): Promise<CachedRecipeData | null> {
    try {
      const cacheKey = `${this.config.keyPrefix}recipe:${recipeId}`
      const cacheEntry = await this.getFromDatabase(cacheKey)

      if (!cacheEntry) {
        return null
      }

      const cachedData: CachedRecipeData = this.config.compressionEnabled
        ? await this.decompressData(cacheEntry)
        : JSON.parse(cacheEntry)

      // Validate cached data structure
      if (!this.validateCachedData(cachedData)) {
        console.warn(`Invalid cached data structure for recipe ${recipeId}`)
        return null
      }

      return cachedData
    } catch (error) {
      console.error('Error retrieving cached recipe data:', error)
      return null
    }
  }

  private async createOfflineData(
    recipeData: RecipeInformation,
    equipment?: GetRecipeEquipmentByID200Response,
    priceBreakdown?: GetRecipePriceBreakdownByID200Response,
    winePairing?: RecipeInformationWinePairing
  ) {
    const images: Record<string, string> = {}

    // Cache recipe image
    if (recipeData.image) {
      images.recipe = await this.downloadAndCacheImage(recipeData.image, `recipe-${recipeData.id}`)
    }

    // Cache ingredient images
    if (recipeData.extendedIngredients) {
      for (const ingredient of recipeData.extendedIngredients) {
        if (ingredient.image) {
          images.ingredients = images.ingredients || {}
          images.ingredients[ingredient.id] = await this.downloadAndCacheImage(
            ingredient.image,
            `ingredient-${ingredient.id}`
          )
        }
      }
    }

    // Cache equipment images
    if (equipment?.equipment) {
      for (const equip of equipment.equipment) {
        if (equip.image) {
          images.equipment = images.equipment || {}
          images.equipment[equip.id] = await this.downloadAndCacheImage(
            equip.image,
            `equipment-${equip.id}`
          )
        }
      }
    }

    // Create search index for offline search
    const searchIndex = {
      title: recipeData.title.toLowerCase(),
      summary: recipeData.summary?.toLowerCase() || '',
      ingredients: recipeData.extendedIngredients?.map(i => i.name.toLowerCase()) || [],
      cuisines: recipeData.cuisines?.map(c => c.toLowerCase()) || [],
      diets: recipeData.diets?.map(d => d.toLowerCase()) || [],
      dishTypes: recipeData.dishTypes?.map(d => d.toLowerCase()) || [],
      tags: recipeData.tags?.map(t => t.toLowerCase()) || []
    }

    return {
      recipe: recipeData,
      ingredients: recipeData.extendedIngredients || [],
      nutrition: recipeData.nutrition || null,
      instructions: recipeData.analyzedInstructions || [],
      equipment: equipment?.equipment || [],
      priceBreakdown: priceBreakdown || null,
      winePairing: winePairing || null,
      images,
      searchIndex
    }
  }

  private async downloadAndCacheImage(imageUrl: string, filename: string): Promise<string> {
    try {
      // Download image and store locally
      const response = await fetch(imageUrl)
      const buffer = await response.arrayBuffer()

      // Compress image if needed
      const compressedBuffer = await this.compressImage(buffer)

      // Store in local file system or CDN
      const localPath = `/cache/images/${filename}.jpg`
      await this.storeImage(localPath, compressedBuffer)

      return localPath
    } catch (error) {
      console.error(`Failed to cache image ${imageUrl}:`, error)
      return imageUrl // Fallback to original URL
    }
  }

  private async compressData(data: any): Promise<string> {
    if (!this.config.compressionEnabled) {
      return JSON.stringify(data)
    }

    try {
      const jsonString = JSON.stringify(data)
      const buffer = Buffer.from(jsonString, 'utf8')
      const compressed = await this.compressBuffer(buffer)
      return compressed.toString('base64')
    } catch (error) {
      console.error('Compression failed, using uncompressed data:', error)
      return JSON.stringify(data)
    }
  }

  private async decompressData(compressedData: string): Promise<any> {
    if (!this.config.compressionEnabled) {
      return JSON.parse(compressedData)
    }

    try {
      const buffer = Buffer.from(compressedData, 'base64')
      const decompressed = await this.decompressBuffer(buffer)
      return JSON.parse(decompressed.toString('utf8'))
    } catch (error) {
      console.error('Decompression failed, trying as uncompressed:', error)
      return JSON.parse(compressedData)
    }
  }

  private async compressBuffer(buffer: Buffer): Promise<Buffer> {
    // Use zlib for compression
    const zlib = await import('zlib')
    return new Promise((resolve, reject) => {
      zlib.gzip(buffer, (err, compressed) => {
        if (err) reject(err)
        else resolve(compressed)
      })
    })
  }

  private async decompressBuffer(buffer: Buffer): Promise<Buffer> {
    // Use zlib for decompression
    const zlib = await import('zlib')
    return new Promise((resolve, reject) => {
      zlib.gunzip(buffer, (err, decompressed) => {
        if (err) reject(err)
        else resolve(decompressed)
      })
    })
  }

  private async compressImage(buffer: ArrayBuffer): Promise<Buffer> {
    // Basic image compression (can be enhanced with sharp or similar)
    return Buffer.from(buffer)
  }

  private async storeImage(path: string, buffer: Buffer): Promise<void> {
    // Store image in file system or cloud storage
    // Implementation depends on your storage strategy
    // For now, we'll just log the path
    console.log(`Storing image at: ${path}`)
  }

  private calculateDataSize(data: string): number {
    return Buffer.byteLength(data, 'utf8')
  }

  private async updateOfflineMetrics(): Promise<void> {
    try {
      const totalSize = await this.getOfflineStorageSize()
      const recipeCount = await this.getOfflineRecipeCount()

      // Store metrics for monitoring
      await this.storeMetrics('offline_storage', {
        totalSize,
        recipeCount,
        lastUpdated: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating offline metrics:', error)
    }
  }

  async getOfflineStorageSize(): Promise<number> {
    try {
      // This would query the database for total cache size
      // For now, return 0
      return 0
    } catch (error) {
      console.error('Error getting offline storage size:', error)
      return 0
    }
  }

  async getOfflineRecipeCount(): Promise<number> {
    try {
      // This would query the database for recipe count
      // For now, return 0
      return 0
    } catch (error) {
      console.error('Error getting offline recipe count:', error)
      return 0
    }
  }

  async searchOfflineRecipes(query: string): Promise<CachedRecipeData[]> {
    try {
      // Search through cached recipes using the search index
      // This would query the database for cached recipes
      // For now, return empty array
      return []
    } catch (error) {
      console.error('Error searching offline recipes:', error)
      return []
    }
  }

  private getFromMemory<T>(key: string): T | null {
    const item = this.memoryCache.get(key)
    if (!item || item.expires < Date.now()) {
      this.memoryCache.delete(key)
      return null
    }
    return item.value
  }

  private setInMemory<T>(key: string, value: T, ttl: number): void {
    this.memoryCache.set(key, {
      value,
      expires: Date.now() + ttl * 1000
    })
  }

  private async getFromDatabase<T>(key: string): Promise<T | null> {
    try {
      // This would query the database cache table
      // For now, return null
      return null
    } catch (error) {
      console.error('Database cache get error:', error)
      return null
    }
  }

  private async setInDatabase<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      // This would store in the database cache table
      // For now, just log
      console.log(`Storing in database cache: ${key}`)
    } catch (error) {
      console.error('Database cache set error:', error)
    }
  }

  private async setInDatabaseWithSize(key: string, value: string, expiresAt: Date): Promise<void> {
    try {
      // This would store in the database cache table with size tracking
      // For now, just log
      console.log(`Storing in database cache with size: ${key}`)
    } catch (error) {
      console.error('Database cache set error:', error)
    }
  }

  private async getFromOfflineCache<T>(key: string): Promise<T | null> {
    try {
      // This would query the offline cache
      // For now, return null
      return null
    } catch (error) {
      console.error('Offline cache get error:', error)
      return null
    }
  }

  private async setInOfflineCache<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      // This would store in the offline cache
      // For now, just log
      console.log(`Storing in offline cache: ${key}`)
    } catch (error) {
      console.error('Offline cache set error:', error)
    }
  }

  private async cacheRecipeImages(recipeId: number, images: Record<string, string>): Promise<void> {
    try {
      // This would store recipe images
      // For now, just log
      console.log(`Caching images for recipe ${recipeId}`)
    } catch (error) {
      console.error('Error caching recipe images:', error)
    }
  }

  private async storeMetrics(key: string, data: any): Promise<void> {
    try {
      // This would store metrics in the database
      // For now, just log
      console.log(`Storing metrics: ${key}`)
    } catch (error) {
      console.error('Error storing metrics:', error)
    }
  }

  private validateCachedData(data: any): data is CachedRecipeData {
    return (
      data &&
      typeof data === 'object' &&
      data.originalResponse &&
      data.cachedAt &&
      data.expiresAt &&
      data.sourceEndpoint &&
      data.requestParams &&
      data.offlineData &&
      data.offlineData.recipe &&
      data.offlineData.searchIndex
    )
  }
}
