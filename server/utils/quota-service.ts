import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface QuotaInfo {
  quotaUsed: number
  quotaLeft: number
  quotaRequest: number
  quotaLimit: number
  percentageUsed: number
  resetTime: string // UTC midnight
  dailyUsage: number // Our tracked daily usage
  hasQuota: boolean
}

export class QuotaService {
  private static readonly QUOTA_WARNING_THRESHOLD = 85 // 85% threshold
  private static readonly FREE_PLAN_LIMIT = 150 // Free plan daily limit (Spoonacular points)
  private static currentQuotaInfo: QuotaInfo | null = null
  
  static getCurrentDateKey(): string {
    return new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  }
  
  /**
   * Get or create daily quota usage record
   */
  static async getDailyQuotaUsage(): Promise<number> {
    const currentDate = this.getCurrentDateKey()
    
    try {
      const quotaRecord = await prisma.quotaUsage.findUnique({
        where: { date: currentDate }
      })
      
      if (quotaRecord) {
        return quotaRecord.pointsUsed
      }
      
      // Create new record for today
      await prisma.quotaUsage.create({
        data: {
          date: currentDate,
          pointsUsed: 0,
          quotaLimit: this.FREE_PLAN_LIMIT
        }
      })
      
      return 0
    } catch (error) {
      console.error('Error getting daily quota usage:', error)
      return 0
    }
  }
  
  /**
   * Update daily quota usage with points used
   */
  static async updateDailyQuotaUsage(pointsUsed: number): Promise<void> {
    const currentDate = this.getCurrentDateKey()
    
    try {
      await prisma.quotaUsage.upsert({
        where: { date: currentDate },
        update: {
          pointsUsed: {
            increment: pointsUsed
          },
          lastUpdated: new Date()
        },
        create: {
          date: currentDate,
          pointsUsed: pointsUsed,
          quotaLimit: this.FREE_PLAN_LIMIT
        }
      })
      
      // Clear cached quota info since it's now outdated
      this.currentQuotaInfo = null
      
      console.log(`Updated daily quota usage: +${pointsUsed} points for ${currentDate}`)
    } catch (error) {
      console.error('Error updating daily quota usage:', error)
    }
  }
  
  /**
   * Check current quota status
   */
  static async checkQuota(): Promise<QuotaInfo> {
    const dailyUsage = await this.getDailyQuotaUsage()
    const quotaLimit = this.FREE_PLAN_LIMIT
    const quotaLeft = Math.max(0, quotaLimit - dailyUsage)
    const percentageUsed = (dailyUsage / quotaLimit) * 100
    
    // Calculate reset time (next midnight UTC)
    const now = new Date()
    const resetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    resetTime.setUTCHours(0, 0, 0, 0)
    
    // If we have cached quota info from a recent API response, use that
    if (this.currentQuotaInfo) {
      return this.currentQuotaInfo
    }
    
    const quotaInfo: QuotaInfo = {
      quotaUsed: dailyUsage,
      quotaLeft,
      quotaRequest: 1, // Default request cost
      quotaLimit,
      percentageUsed,
      resetTime: resetTime.toISOString(),
      dailyUsage,
      hasQuota: quotaLeft > 0
    }
    
    return quotaInfo
  }
  
  /**
   * Extract quota info from Spoonacular API response and update database
   */
  static async extractQuotaFromResponse(response: any): Promise<QuotaInfo | null> {
    if (!response || !response.headers) return null
    
    const quotaUsed = parseInt(response.headers['x-api-quota-used'] || '0')
    const quotaLeft = parseInt(response.headers['x-api-quota-left'] || '0')
    const quotaRequest = parseInt(response.headers['x-api-quota-request'] || '0')
    
    if (quotaUsed === 0 && quotaLeft === 0 && quotaRequest === 0) {
      return null // No quota info available
    }
    
    const quotaLimit = this.FREE_PLAN_LIMIT
    const percentageUsed = (quotaUsed / quotaLimit) * 100
    
    // Update our daily tracking in database
    await this.updateDailyQuotaUsage(quotaRequest)
    
    // Calculate reset time (next midnight UTC)
    const now = new Date()
    const resetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    resetTime.setUTCHours(0, 0, 0, 0)
    
    const quotaInfo: QuotaInfo = {
      quotaUsed,
      quotaLeft,
      quotaRequest,
      quotaLimit,
      percentageUsed,
      resetTime: resetTime.toISOString(),
      dailyUsage: await this.getDailyQuotaUsage(),
      hasQuota: quotaLeft > 0
    }
    
    // Cache the current quota info
    this.currentQuotaInfo = quotaInfo
    
    return quotaInfo
  }
  
  /**
   * Get cached quota info (from last API response)
   */
  static getCurrentQuotaInfo(): QuotaInfo | null {
    return this.currentQuotaInfo
  }
  
  /**
   * Update quota info when quota is exceeded
   */
  static async updateQuotaExceeded(): Promise<QuotaInfo> {
    const quotaLimit = this.FREE_PLAN_LIMIT
    const quotaUsed = quotaLimit // When exceeded, all quota is used
    const quotaLeft = 0
    const percentageUsed = 100
    
    // Calculate reset time (next midnight UTC)
    const now = new Date()
    const resetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    resetTime.setUTCHours(0, 0, 0, 0)
    
    const quotaInfo: QuotaInfo = {
      quotaUsed,
      quotaLeft,
      quotaRequest: 1,
      quotaLimit,
      percentageUsed,
      resetTime: resetTime.toISOString(),
      dailyUsage: await this.getDailyQuotaUsage(),
      hasQuota: false
    }
    
    // Cache the quota exceeded info
    this.currentQuotaInfo = quotaInfo
    
    return quotaInfo
  }
  
  /**
   * Check if quota confirmation is required
   */
  static shouldRequireConfirmation(quotaInfo: QuotaInfo): boolean {
    return quotaInfo.percentageUsed >= this.QUOTA_WARNING_THRESHOLD
  }
  
  /**
   * Get quota warning message
   */
  static getQuotaWarningMessage(quotaInfo: QuotaInfo): string {
    const remainingPoints = Math.floor(quotaInfo.quotaLeft)
    const hoursUntilReset = this.getHoursUntilReset(quotaInfo.resetTime)
    
    return `You have used ${quotaInfo.percentageUsed.toFixed(1)}% of your daily API quota (${remainingPoints} points remaining). Your quota resets in ${hoursUntilReset} hours. Do you want to continue?`
  }
  
  /**
   * Clean up old quota records (keep last 30 days)
   */
  static async cleanupOldRecords(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0]
      
      await prisma.quotaUsage.deleteMany({
        where: {
          date: {
            lt: cutoffDate
          }
        }
      })
      
      console.log('Cleaned up old quota records')
    } catch (error) {
      console.error('Error cleaning up old quota records:', error)
    }
  }
  
  private static getHoursUntilReset(resetTime: string): number {
    const now = new Date()
    const reset = new Date(resetTime)
    const diffMs = reset.getTime() - now.getTime()
    return Math.ceil(diffMs / (1000 * 60 * 60))
  }
}
