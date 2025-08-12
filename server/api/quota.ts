import { QuotaService } from '../utils/quota-service'

export default defineEventHandler(async () => {
  try {
    const quotaInfo = await QuotaService.checkQuota()
    
    return {
      quotaInfo,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error fetching quota info:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch quota information'
    })
  }
})
