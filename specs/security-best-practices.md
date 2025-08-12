# Security & Best Practices Specification

## Overview

This specification defines the security architecture, best practices, and implementation guidelines for the Ratatouille Recipe Discovery Platform to ensure data protection, secure API communication, and overall application security.

## Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    Application Security                         │
├─────────────────────────────────────────────────────────────────┤
│  • Input Validation & Sanitization                             │
│  • Authentication & Authorization                              │
│  • Session Management                                          │
│  • CSRF Protection                                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Security                               │
├─────────────────────────────────────────────────────────────────┤
│  • API Key Management                                          │
│  • Rate Limiting                                               │
│  • Request Validation                                          │
│  • Error Handling                                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Security                                │
├─────────────────────────────────────────────────────────────────┤
│  • Database Security                                           │
│  • Data Encryption                                             │
│  • Backup Security                                             │
│  • Privacy Protection                                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Infrastructure Security                       │
├─────────────────────────────────────────────────────────────────┤
│  • HTTPS/TLS                                                   │
│  • Security Headers                                            │
│  • Environment Variables                                       │
│  • Deployment Security                                         │
└─────────────────────────────────────────────────────────────────┘
```

## API Key Management

### Spoonacular API Key Security

#### Environment Configuration

```env
# .env file (never commit to version control)
SPOONACULAR_API_KEY=your_actual_api_key_here
DATABASE_URL="file:./dev.db"
CACHE_TTL=604800
```

#### Runtime Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Server-side only keys (not exposed to client)
    spoonacularApiKey: process.env.SPOONACULAR_API_KEY,
    databaseUrl: process.env.DATABASE_URL,
    cacheTtl: process.env.CACHE_TTL || '604800',
    
    // Public keys (exposed to client)
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://api.spoonacular.com/recipes'
    }
  }
})
```

#### API Key Usage

```typescript
// server/api/recipes.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.spoonacularApiKey
  
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'API key not configured'
    })
  }
  
  // Use API key in server-side requests only
  const response = await $fetch(`${config.public.apiBase}/complexSearch`, {
    query: {
      apiKey,
      // ... other parameters
    }
  })
})
```

### Security Best Practices

1. **Never expose API keys to client-side code**
2. **Use environment variables for all sensitive data**
3. **Rotate API keys regularly**
4. **Monitor API usage for unusual patterns**
5. **Implement rate limiting to prevent abuse**

## Input Validation & Sanitization

### Query Parameter Validation

```typescript
// server/api/recipes.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  // Validate and sanitize input parameters
  const validatedParams = {
    query: typeof query.query === 'string' ? query.query.trim() : '',
    cuisine: typeof query.cuisine === 'string' ? query.cuisine.toLowerCase() : '',
    diet: typeof query.diet === 'string' ? query.diet.toLowerCase() : '',
    maxReadyTime: typeof query.maxReadyTime === 'string' ? 
      parseInt(query.maxReadyTime) || undefined : undefined,
    offset: typeof query.offset === 'string' ? 
      Math.max(0, parseInt(query.offset) || 0) : 0,
    number: typeof query.number === 'string' ? 
      Math.min(100, Math.max(1, parseInt(query.number) || 20)) : 20
  }
  
  // Validate cuisine types against allowed values
  const allowedCuisines = [
    'italian', 'french', 'mexican', 'indian', 'chinese', 'japanese',
    'mediterranean', 'american', 'african', 'british', 'cajun',
    'caribbean', 'german', 'greek', 'korean', 'thai', 'vietnamese'
  ]
  
  if (validatedParams.cuisine && !allowedCuisines.includes(validatedParams.cuisine)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid cuisine type'
    })
  }
  
  // Validate dietary restrictions
  const allowedDiets = ['vegetarian', 'vegan', 'gluten-free']
  
  if (validatedParams.diet && !allowedDiets.includes(validatedParams.diet)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid dietary restriction'
    })
  }
})
```

### Database Input Sanitization

```typescript
// server/utils/recipe.ts
export function sanitizeRecipeData(recipe: any) {
  return {
    externalId: parseInt(recipe.id) || 0,
    title: typeof recipe.title === 'string' ? recipe.title.trim() : '',
    image: typeof recipe.image === 'string' ? recipe.image : null,
    servings: typeof recipe.servings === 'number' ? recipe.servings : null,
    readyInMinutes: typeof recipe.readyInMinutes === 'number' ? recipe.readyInMinutes : null,
    sourceUrl: typeof recipe.sourceUrl === 'string' ? recipe.sourceUrl : null,
    sourceName: typeof recipe.sourceName === 'string' ? recipe.sourceName : null,
    summary: typeof recipe.summary === 'string' ? recipe.summary : null,
    instructions: typeof recipe.instructions === 'string' ? recipe.instructions : null,
    cuisine: typeof recipe.cuisine === 'string' ? recipe.cuisine.toLowerCase() : null
  }
}
```

## Error Handling & Information Disclosure

### Secure Error Responses

```typescript
// server/utils/error-handler.ts
export function createSecureError(statusCode: number, message: string) {
  // Don't expose internal details in production
  const isProduction = process.env.NODE_ENV === 'production'
  
  return createError({
    statusCode,
    statusMessage: isProduction ? 'An error occurred' : message,
    data: isProduction ? undefined : { details: message }
  })
}

// Usage in API routes
export default defineEventHandler(async (event) => {
  try {
    // API logic
  } catch (error) {
    console.error('API Error:', error)
    throw createSecureError(500, 'Internal server error')
  }
})
```

### Logging Security

```typescript
// server/utils/logger.ts
export function logSecurityEvent(event: string, details: any) {
  // Log security events without sensitive data
  console.log(`[SECURITY] ${event}:`, {
    timestamp: new Date().toISOString(),
    event,
    // Sanitize details to remove sensitive information
    details: sanitizeLogData(details)
  })
}

function sanitizeLogData(data: any): any {
  const sensitiveFields = ['apiKey', 'password', 'token', 'secret']
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data }
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    })
    return sanitized
  }
  
  return data
}
```

## Database Security

### Connection Security

```typescript
// server/database/client.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### SQL Injection Prevention

- **Use Prisma ORM** for all database queries to prevent SQL injection
- **Parameterized queries** are automatically handled by Prisma
- **Input validation** before database operations
- **Type safety** with TypeScript

```typescript
// Safe database operations with Prisma
export async function findRecipesByCuisine(cuisine: string) {
  // Prisma automatically handles parameterization
  return await prisma.recipe.findMany({
    where: {
      cuisine: cuisine.toLowerCase()
    },
    include: {
      ingredients: true,
      nutrition: true
    }
  })
}
```

## HTTPS & Security Headers

### Nuxt Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // Security headers
  nitro: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }
  },
  
  // HTTPS in production
  devServer: {
    https: process.env.NODE_ENV === 'production'
  }
})
```

### Content Security Policy

```typescript
// Add CSP headers
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' https://api.spoonacular.com",
  "frame-ancestors 'none'"
].join('; ')

// Add to nitro headers
nitro: {
  headers: {
    'Content-Security-Policy': cspDirectives
  }
}
```

## Rate Limiting

### API Rate Limiting Implementation

```typescript
// server/middleware/rate-limit.ts
import { LRUCache } from 'lru-cache'

const rateLimitCache = new LRUCache({
  max: 1000,
  ttl: 1000 * 60 * 15, // 15 minutes
})

export default defineEventHandler(async (event) => {
  const clientIP = getClientIP(event)
  const key = `rate-limit:${clientIP}`
  
  const current = rateLimitCache.get(key) as number || 0
  
  if (current >= 100) { // 100 requests per 15 minutes
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests'
    })
  }
  
  rateLimitCache.set(key, current + 1)
})
```

## Data Privacy & GDPR Compliance

### Data Minimization

- **Only collect necessary data** for recipe functionality
- **No personal information** stored beyond what's required
- **Anonymous usage** - no user accounts or personal data
- **Transient caching** with automatic expiration

### Data Retention

```typescript
// Cache expiration strategy
export const CACHE_TTL = 7 * 24 * 60 * 60 // 7 days in seconds

// Automatic cache cleanup
export async function cleanupExpiredCache() {
  await prisma.cache.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  })
}
```

### Privacy Policy Compliance

- **Clear data usage** documentation
- **No third-party tracking** beyond Spoonacular API
- **Transparent data flow** in application
- **User consent** for any data collection

## Security Monitoring

### Security Event Logging

```typescript
// server/utils/security-monitor.ts
export function monitorSecurityEvents() {
  // Monitor for suspicious patterns
  const suspiciousPatterns = [
    'SQL injection attempts',
    'XSS attempts',
    'Rate limit violations',
    'Invalid API key usage'
  ]
  
  // Log and alert on security events
  suspiciousPatterns.forEach(pattern => {
    logSecurityEvent('SUSPICIOUS_ACTIVITY', { pattern, timestamp: new Date() })
  })
}
```

### API Usage Monitoring

```typescript
// Monitor Spoonacular API usage
export async function monitorAPIUsage() {
  const usage = await getAPIUsage()
  
  if (usage.requests > 1000) { // Daily limit
    logSecurityEvent('API_LIMIT_APPROACHING', { usage })
  }
}
```

## Deployment Security

### Environment Security

1. **Production environment variables** properly configured
2. **Database credentials** secured and rotated
3. **API keys** stored securely
4. **HTTPS enforcement** in production
5. **Security headers** configured

### Container Security (if using Docker)

```dockerfile
# Dockerfile security best practices
FROM node:20-alpine

# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nuxt -u 1001

# Copy application files
COPY --chown=nuxt:nodejs . .

# Install dependencies
RUN npm ci --only=production

# Switch to non-root user
USER nuxt

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

## Security Checklist

### Development

- [ ] API keys never exposed to client-side
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive information
- [ ] Database queries use parameterized statements
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Logging excludes sensitive data

### Production

- [ ] Environment variables properly configured
- [ ] Database access secured
- [ ] API key rotation schedule
- [ ] Monitoring and alerting setup
- [ ] Backup security verified
- [ ] SSL/TLS certificates valid
- [ ] Security patches applied
- [ ] Access controls implemented

## Incident Response

### Security Incident Procedures

1. **Immediate Response**
   - Isolate affected systems
   - Preserve evidence
   - Assess impact

2. **Investigation**
   - Analyze logs
   - Identify root cause
   - Document findings

3. **Remediation**
   - Apply fixes
   - Update security measures
   - Monitor for recurrence

4. **Post-Incident**
   - Review procedures
   - Update documentation
   - Implement lessons learned

## Compliance & Standards

### Standards Compliance

- **OWASP Top 10** security practices
- **GDPR** privacy requirements
- **CSP** content security policy
- **HTTPS** transport security
- **API security** best practices

### Regular Security Reviews

- **Monthly** security assessments
- **Quarterly** penetration testing
- **Annual** security audits
- **Continuous** monitoring

---

*This specification ensures the Ratatouille application maintains high security standards and protects user data throughout the application lifecycle.*
