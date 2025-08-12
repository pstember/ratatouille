import { prisma } from '../database/client'

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  type?: string
  recipeId?: number
}

export class CacheService {
  private defaultTTL = 604800 // 7 days in seconds

  async get(key: string): Promise<any | null> {
    try {
      const cacheEntry = await prisma.cache.findUnique({
        where: { key }
      })

      if (!cacheEntry) {
        return null
      }

      // Check if cache has expired
      if (new Date() > cacheEntry.expiresAt) {
        await this.delete(key)
        return null
      }

      return JSON.parse(cacheEntry.value)
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || this.defaultTTL
      const expiresAt = new Date(Date.now() + ttl * 1000)

      await prisma.cache.upsert({
        where: { key },
        update: {
          value: JSON.stringify(value),
          type: options.type || 'general',
          recipeId: options.recipeId,
          expiresAt
        },
        create: {
          key,
          value: JSON.stringify(value),
          type: options.type || 'general',
          recipeId: options.recipeId,
          expiresAt
        }
      })
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await prisma.cache.delete({
        where: { key }
      })
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  async clearExpired(): Promise<void> {
    try {
      await prisma.cache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })
    } catch (error) {
      console.error('Cache clear expired error:', error)
    }
  }

  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    
    return `${prefix}:${sortedParams}`
  }
}

export const cacheService = new CacheService()
