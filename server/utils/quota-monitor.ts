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

export class QuotaMonitor {
  private static readonly QUOTA_WARNING_THRESHOLD = 85 // 85% threshold
  private static readonly FREE_PLAN_LIMIT = 150 // Free plan daily limit
  
  // Track daily quota usage in memory/database
  private static dailyQuotaUsage: Map<string, number> = new Map()
  private static lastResetDate: string = ''
  private static currentQuotaInfo: QuotaInfo | null = null
  
  static getCurrentDateKey(): string {
    return new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  }
  
  static resetDailyQuotaIfNeeded(): void {
    const currentDate = this.getCurrentDateKey()
    
    if (this.lastResetDate !== currentDate) {
      // New day, reset quota tracking
      this.dailyQuotaUsage.clear()
      this.lastResetDate = currentDate
      this.currentQuotaInfo = null // Reset cached quota info
      console.log(`Daily quota reset for ${currentDate}`)
    }
  }
  
  static updateDailyQuotaUsage(pointsUsed: number): void {
    this.resetDailyQuotaIfNeeded()
    
    const currentDate = this.getCurrentDateKey()
    const currentUsage = this.dailyQuotaUsage.get(currentDate) || 0
    this.dailyQuotaUsage.set(currentDate, currentUsage + pointsUsed)
  }
  
  static getDailyQuotaUsage(): number {
    this.resetDailyQuotaIfNeeded()
    const currentDate = this.getCurrentDateKey()
    return this.dailyQuotaUsage.get(currentDate) || 0
  }
  
  // Check if we have quota available
  static async checkQuota(): Promise<QuotaInfo> {
    this.resetDailyQuotaIfNeeded()
    
    const dailyUsage = this.getDailyQuotaUsage()
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
  
  // Extract quota info from any Spoonacular API response
  static extractQuotaFromResponse(response: any): QuotaInfo | null {
    if (!response || !response.headers) return null
    
    const quotaUsed = parseInt(response.headers['x-api-quota-used'] || '0')
    const quotaLeft = parseInt(response.headers['x-api-quota-left'] || '0')
    const quotaRequest = parseInt(response.headers['x-api-quota-request'] || '0')
    
    if (quotaUsed === 0 && quotaLeft === 0 && quotaRequest === 0) {
      return null // No quota info available
    }
    
    const quotaLimit = this.FREE_PLAN_LIMIT
    const percentageUsed = (quotaUsed / quotaLimit) * 100
    
    // Update our daily tracking
    this.updateDailyQuotaUsage(quotaRequest)
    
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
      dailyUsage: this.getDailyQuotaUsage(),
      hasQuota: quotaLeft > 0
    }
    
    // Cache the current quota info
    this.currentQuotaInfo = quotaInfo
    
    return quotaInfo
  }
  
  // Get cached quota info (from last API response)
  static getCurrentQuotaInfo(): QuotaInfo | null {
    this.resetDailyQuotaIfNeeded()
    return this.currentQuotaInfo
  }
  
  // Update quota info when quota is exceeded
  static updateQuotaExceeded(): QuotaInfo {
    this.resetDailyQuotaIfNeeded()
    
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
      dailyUsage: this.getDailyQuotaUsage(),
      hasQuota: false
    }
    
    // Cache the quota exceeded info
    this.currentQuotaInfo = quotaInfo
    
    return quotaInfo
  }
  
  static shouldRequireConfirmation(quotaInfo: QuotaInfo): boolean {
    return quotaInfo.percentageUsed >= this.QUOTA_WARNING_THRESHOLD
  }
  
  static getQuotaWarningMessage(quotaInfo: QuotaInfo): string {
    const remainingRequests = Math.floor(quotaInfo.quotaLeft)
    const hoursUntilReset = this.getHoursUntilReset(quotaInfo.resetTime)
    
    return `You have used ${quotaInfo.percentageUsed.toFixed(1)}% of your daily API quota (${remainingRequests} requests remaining). Your quota resets in ${hoursUntilReset} hours. Do you want to continue?`
  }
  
  private static getHoursUntilReset(resetTime: string): number {
    const now = new Date()
    const reset = new Date(resetTime)
    const diffMs = reset.getTime() - now.getTime()
    return Math.ceil(diffMs / (1000 * 60 * 60))
  }
}
