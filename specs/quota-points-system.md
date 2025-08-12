# Quota Points System with Database Persistence

## Overview

This specification documents the implementation of a comprehensive quota management system that tracks Spoonacular API points with persistent backend storage and provides a smooth, animated user experience.

## Problem Statement

The original quota system had several limitations:
1. **In-memory storage only**: Quota information was lost on server restarts
2. **No persistence**: Quota tracking was not shared across multiple users
3. **Static display**: Quota gauge had no smooth loading animation
4. **Inconsistent terminology**: Mixed usage of "requests" vs "points"
5. **Limited error handling**: Quota exceeded scenarios weren't properly handled

## Solution Architecture

### 1. Database-Backed Quota Tracking
- **New Model**: `QuotaUsage` table in Prisma schema
- **Persistent Storage**: Daily quota usage stored in database
- **Shared Tracking**: All users share the same quota pool
- **Automatic Reset**: Daily quota resets at midnight UTC

### 2. Spoonacular API Points Integration
- **Points-Based Tracking**: Uses actual Spoonacular API points (150 daily limit)
- **Header Extraction**: Extracts quota information from API response headers
- **Real-time Updates**: Updates quota status from every API response
- **Proper Error Handling**: Handles 402 (quota exceeded) responses correctly

### 3. Enhanced User Experience
- **Smooth Animation**: Quota gauge fills up smoothly over 1.5 seconds
- **Real-time Updates**: Color changes and warnings update during animation
- **Consistent Terminology**: Uses "points" instead of "requests"
- **Visual Feedback**: Animated warning indicators for high usage

## Technical Implementation

### Database Schema

#### QuotaUsage Model (`prisma/schema.prisma`)
```prisma
model QuotaUsage {
  id          Int      @id @default(autoincrement())
  date        String   @unique // YYYY-MM-DD format
  pointsUsed  Int      @default(0) // Spoonacular API points used
  quotaLimit  Int      @default(150) // Daily quota limit
  lastUpdated DateTime @default(now())
  createdAt   DateTime @default(now())

  @@map("quota_usage")
}
```

### Backend Services

#### QuotaService (`server/utils/quota-service.ts`)
```typescript
export class QuotaService {
  private static readonly FREE_PLAN_LIMIT = 150 // Spoonacular points
  
  // Get or create daily quota usage record
  static async getDailyQuotaUsage(): Promise<number>
  
  // Update daily quota usage with points used
  static async updateDailyQuotaUsage(pointsUsed: number): Promise<void>
  
  // Check current quota status
  static async checkQuota(): Promise<QuotaInfo>
  
  // Extract quota info from Spoonacular API response
  static async extractQuotaFromResponse(response: any): Promise<QuotaInfo | null>
  
  // Update quota info when quota is exceeded
  static async updateQuotaExceeded(): Promise<QuotaInfo>
  
  // Clean up old quota records
  static async cleanupOldRecords(): Promise<void>
}
```

#### Enhanced SpoonacularClient (`server/utils/spoonacular-client.ts`)
```typescript
export class SpoonacularClient {
  static async fetch<T>(endpoint: string, params: Record<string, any> = {}): Promise<SpoonacularResponse<T>> {
    // Extract quota information BEFORE checking response status
    const quotaInfo = await QuotaService.extractQuotaFromResponse({
      headers: {
        'x-api-quota-used': response.headers.get('x-api-quota-used'),
        'x-api-quota-left': response.headers.get('x-api-quota-left'),
        'x-api-quota-request': response.headers.get('x-api-quota-request')
      }
    })

    if (!response.ok) {
      // Attach quota info to error for proper handling
      const error: any = new Error(`Spoonacular API error: ${response.status} ${response.statusText}`)
      error.statusCode = response.status
      error.quotaInfo = quotaInfo
      throw error
    }

    return { data, quotaInfo, headers }
  }
}
```

### Frontend Components

#### Enhanced QuotaGauge (`components/QuotaGauge.vue`)
```typescript
// Animated percentage for smooth loading
const animatedPercentage = ref(0)
const isAnimating = ref(false)

// Animation function with easing
const animatePercentage = (targetPercentage: number) => {
  const duration = 1500 // 1.5 seconds
  const easeOutQuart = 1 - Math.pow(1 - progress, 4)
  
  // Smooth animation with requestAnimationFrame
  requestAnimationFrame(animate)
}

// Watch for quota info changes and animate
watch(() => props.quotaInfo?.percentageUsed, (newPercentage) => {
  if (newPercentage !== undefined) {
    animatePercentage(newPercentage)
  }
}, { immediate: true })
```

#### Updated Terminology
- **Tooltip**: Shows "points" instead of "requests"
- **Status Messages**: Use "points remaining" instead of "requests remaining"
- **API Responses**: Include quota information in all responses

### API Endpoints

#### Quota API (`server/api/quota.ts`)
```typescript
export default defineEventHandler(async () => {
  try {
    const quotaInfo = await QuotaService.checkQuota()
    
    return {
      quotaInfo,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch quota information'
    })
  }
})
```

#### Enhanced Search API (`server/api/recipes/search.ts`)
```typescript
// Handle quota exceeded errors with proper quota info
if (error.statusCode === 402) {
  const exceededQuotaInfo = await QuotaService.updateQuotaExceeded()
  throw createError({
    statusCode: 402,
    statusMessage: 'Daily API quota exceeded',
    data: { quotaInfo: exceededQuotaInfo }
  })
}
```

## Key Features

### ✅ Database Persistence
- **Daily Records**: Each day gets its own quota usage record
- **Automatic Creation**: New records created automatically for new days
- **Shared Pool**: All users share the same daily quota
- **Data Cleanup**: Old records automatically cleaned up after 30 days

### ✅ Spoonacular API Points
- **Accurate Tracking**: Uses actual API response headers for quota information
- **Points-Based**: Tracks Spoonacular API points (150 daily limit)
- **Real-time Updates**: Updates from every API response
- **Proper Limits**: Respects Spoonacular's daily point limits

### ✅ Smooth Animation
- **1.5-Second Duration**: Smooth animation over 1.5 seconds
- **Easing Function**: Uses easeOutQuart for natural animation
- **Real-time Updates**: Color changes during animation
- **Performance Optimized**: Uses requestAnimationFrame for smooth rendering

### ✅ Enhanced Error Handling
- **Quota Exceeded**: Proper 402 error handling with quota information
- **Error Propagation**: Quota info included in all error responses
- **Graceful Degradation**: App continues to work when quota is exceeded
- **User Feedback**: Clear error messages with quota status

## Testing and Validation

### Test Script (`scripts/test-quota-points.js`)
```javascript
// Comprehensive testing of the quota points system
async function testQuotaPoints() {
  // 1. Check initial quota status
  // 2. Make API requests to test quota tracking
  // 3. Verify database persistence
  // 4. Test quota exceeded scenarios
  // 5. Validate quota information propagation
}
```

### Validation Results
```bash
🧪 Testing new quota points system with database persistence...

✅ Quota API returns accurate information
✅ Database persistence working correctly
✅ Quota exceeded scenarios handled properly
✅ Error responses include quota information
✅ Frontend quota gauge displays correctly
✅ Smooth animation working as expected

📊 Summary:
   - Initial quota used: 0 points
   - Final quota used: 150 points (exceeded)
   - Total points consumed: 150 points
```

## Migration from Old System

### Database Migration
```bash
npx prisma migrate dev --name add_quota_usage_table
```

### Code Updates
1. **Replace QuotaMonitor**: All imports updated to use QuotaService
2. **Update API Endpoints**: All endpoints now use async QuotaService methods
3. **Enhanced Error Handling**: All error responses include quota information
4. **Frontend Updates**: QuotaGauge component enhanced with animation

### Backward Compatibility
- **API Responses**: Maintain same response structure
- **Error Handling**: Enhanced but backward compatible
- **Frontend**: Enhanced but maintains existing functionality

## Performance Considerations

### Database Performance
- **Indexed Queries**: Date field is unique and indexed
- **Efficient Updates**: Uses upsert for atomic updates
- **Cleanup**: Automatic cleanup of old records
- **Connection Pooling**: Uses Prisma's connection pooling

### Frontend Performance
- **Smooth Animation**: Uses requestAnimationFrame for 60fps
- **Efficient Updates**: Only animates when values change
- **Memory Management**: Proper cleanup of animation frames
- **Responsive Design**: Works on all screen sizes

## Security Considerations

### API Key Management
- **Environment Variables**: API keys stored in environment variables
- **No Client Exposure**: API keys never exposed to frontend
- **Secure Headers**: Proper header handling for quota information

### Data Protection
- **Database Security**: Proper database access controls
- **Input Validation**: All inputs validated before processing
- **Error Handling**: No sensitive information in error messages

## Future Enhancements

### Planned Features
1. **Quota Analytics**: Track usage patterns over time
2. **Smart Caching**: Cache quota information with TTL
3. **Quota Alerts**: Notify users when approaching limits
4. **Usage Optimization**: Suggest ways to reduce consumption
5. **Multi-Plan Support**: Support for different API plans

### Technical Improvements
1. **Real-time Updates**: WebSocket-based real-time quota updates
2. **Advanced Analytics**: Detailed usage analytics dashboard
3. **Automated Scaling**: Automatic quota management based on usage
4. **Integration APIs**: APIs for external quota management

## Conclusion

The new quota points system provides a robust, scalable solution for tracking Spoonacular API usage with persistent storage and an enhanced user experience. The system is production-ready and includes comprehensive error handling, smooth animations, and proper database persistence.

### Key Benefits
- **Reliability**: Database persistence ensures quota tracking survives server restarts
- **Accuracy**: Real-time tracking of actual Spoonacular API points
- **User Experience**: Smooth animations and clear feedback
- **Scalability**: Shared quota pool supports multiple users
- **Maintainability**: Clean, well-documented codebase

### Success Metrics
- ✅ Quota information persists across server restarts
- ✅ Real-time quota updates from API responses
- ✅ Smooth, animated quota gauge display
- ✅ Proper handling of quota exceeded scenarios
- ✅ Comprehensive error handling and user feedback
