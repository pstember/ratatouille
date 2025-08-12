# Build & Deployment Specification

## Overview

This specification defines the build process, deployment strategies, environment configuration, and infrastructure setup for the Ratatouille Recipe Discovery Platform.

## Build Configuration

### Nuxt Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // Build configuration
  build: {
    transpile: ['@prisma/client']
  },
  
  // Source map configuration - disable for production
  sourcemap: false,
  
  // Vite configuration
  vite: {
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'prisma': ['@prisma/client'],
            'vendor': ['vue', 'pinia']
          }
        }
      }
    },
    esbuild: {
      sourcemap: false
    },
    define: {
      __VUE_PROD_DEVTOOLS__: false
    }
  },
  
  // Nitro configuration for server-side
  nitro: {
    experimental: {
      wasm: true
    },
    sourceMap: false,
    compressPublicAssets: true,
    minify: true
  },
  
  // Experimental features
  experimental: {
    inlineSSRStyles: false
  },
  
  // Runtime config for environment variables
  runtimeConfig: {
    // Server-side only keys
    spoonacularApiKey: process.env.SPOONACULAR_API_KEY,
    databaseUrl: process.env.DATABASE_URL,
    cacheTtl: process.env.CACHE_TTL || '604800',
    
    // Public keys (exposed to client)
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://api.spoonacular.com/recipes'
    }
  },
  
  // App configuration
  app: {
    head: {
      title: 'Ratatouille - Recipe Discovery Platform',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Discover and explore culinary recipes with Ratatouille - your modern recipe discovery platform.' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  }
})
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "useDefineForClassFields": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "~/*": ["./*"],
      "~~/*": ["./*"],
      "@@/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "**/*.vue",
    ".nuxt/nuxt.d.ts"
  ],
  "exclude": [
    "node_modules",
    ".nuxt",
    ".output",
    "dist"
  ]
}
```

### Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} satisfies Config
```

## Environment Configuration

### Environment Variables

```bash
# .env.example
# API Configuration
NUXT_PUBLIC_API_BASE=https://api.spoonacular.com/recipes
SPOONACULAR_API_KEY=your_actual_api_key_here

# Database Configuration
DATABASE_URL="file:./dev.db"

# Cache Configuration
CACHE_TTL=604800

# Build Configuration
NODE_ENV=development
NITRO_HOST=0.0.0.0
NITRO_PORT=3000

# Production Configuration
# DATABASE_URL="postgresql://user:password@localhost:5432/ratatouille"
# NODE_ENV=production
```

### Environment-Specific Configurations

```typescript
// config/environments.ts
export const environments = {
  development: {
    databaseUrl: 'file:./dev.db',
    cacheTtl: 604800,
    logLevel: 'debug',
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001']
    }
  },
  
  staging: {
    databaseUrl: process.env.DATABASE_URL,
    cacheTtl: 604800,
    logLevel: 'info',
    cors: {
      origin: ['https://staging.ratatouille.com']
    }
  },
  
  production: {
    databaseUrl: process.env.DATABASE_URL,
    cacheTtl: 604800,
    logLevel: 'warn',
    cors: {
      origin: ['https://ratatouille.com', 'https://www.ratatouille.com']
    }
  }
}

export function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development'
  return environments[env as keyof typeof environments]
}
```

## Build Process

### Build Scripts

```json
// package.json
{
  "scripts": {
    "build": "nuxt build",
    "build:analyze": "nuxt build --analyze",
    "build:staging": "NODE_ENV=staging nuxt build",
    "build:production": "NODE_ENV=production nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

### Build Pipeline

```yaml
# .github/workflows/build.yml
name: Build and Deploy

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Generate Prisma client
      run: npm run db:generate
    
    - name: Run database migrations
      run: npm run db:migrate
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
    
    - name: Build application
      run: npm run build
      env:
        NODE_ENV: production
        SPOONACULAR_API_KEY: ${{ secrets.SPOONACULAR_API_KEY }}
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-files
        path: .output/
```

## Deployment Strategies

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxtjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .output
RUN chown nuxtjs:nodejs .output

# Copy built application
COPY --from=builder --chown=nuxtjs:nodejs /app/.output ./.output
COPY --from=builder --chown=nuxtjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nuxtjs:nodejs /app/package.json ./package.json

USER nuxtjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", ".output/server/index.mjs"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/ratatouille
      - SPOONACULAR_API_KEY=${SPOONACULAR_API_KEY}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=ratatouille
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  postgres_data:
```

### Vercel Deployment

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "nuxt.config.ts",
      "use": "@nuxtjs/vercel-builder"
    }
  ],
  "env": {
    "SPOONACULAR_API_KEY": "@spoonacular-api-key",
    "DATABASE_URL": "@database-url"
  },
  "functions": {
    "server/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Netlify Deployment

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".output/public"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[functions]
  directory = ".output/server"
```

## Infrastructure Setup

### Database Setup

```bash
# Database initialization script
#!/bin/bash

# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE ratatouille;
CREATE USER ratatouille_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ratatouille TO ratatouille_user;
\q
EOF

# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/ratatouille
server {
    listen 80;
    server_name ratatouille.com www.ratatouille.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ratatouille.com www.ratatouille.com;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/ratatouille.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ratatouille.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Static files
    location /_nuxt/ {
        alias /var/www/ratatouille/.output/public/_nuxt/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'ratatouille',
      script: '.output/server/index.mjs',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    }
  ]
}
```

## Monitoring & Logging

### Application Monitoring

```typescript
// server/plugins/monitoring.ts
export default defineNitroPlugin((nitroApp) => {
  // Request logging
  nitroApp.hooks.hook('request', (event) => {
    const start = Date.now()
    
    event.node.res.on('finish', () => {
      const duration = Date.now() - start
      console.log(`${event.method} ${event.path} - ${event.node.res.statusCode} - ${duration}ms`)
      
      // Log slow requests
      if (duration > 1000) {
        console.warn(`Slow request: ${event.method} ${event.path} - ${duration}ms`)
      }
    })
  })
  
  // Error handling
  nitroApp.hooks.hook('error', (error, event) => {
    console.error(`Error in ${event.method} ${event.path}:`, error)
  })
})
```

### Health Check Endpoint

```typescript
// server/api/health.ts
export default defineEventHandler(async (event) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Check external API
    const config = useRuntimeConfig()
    if (!config.spoonacularApiKey) {
      throw new Error('Spoonacular API key not configured')
    }
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV
    }
  } catch (error) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Service unhealthy',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    })
  }
})
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20.x'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Generate Prisma client
      run: npm run db:generate
    
    - name: Run database migrations
      run: npm run db:migrate
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
    
    - name: Build application
      run: npm run build
      env:
        NODE_ENV: production
        SPOONACULAR_API_KEY: ${{ secrets.SPOONACULAR_API_KEY }}
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/ratatouille
          git pull origin main
          npm ci
          npm run db:generate
          npm run build
          pm2 restart ratatouille
```

## Performance Optimization

### Bundle Analysis

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // Bundle analyzer
  build: {
    analyze: process.env.ANALYZE === 'true'
  },
  
  // Vite optimization
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'prisma': ['@prisma/client'],
            'vendor': ['vue', 'pinia'],
            'ui': ['@headlessui/vue', '@heroicons/vue']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['vue', 'pinia', '@prisma/client']
    }
  }
})
```

### Caching Strategy

```typescript
// server/middleware/cache.ts
export default defineEventHandler((event) => {
  // Cache static assets
  if (event.path.startsWith('/_nuxt/')) {
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  }
  
  // Cache API responses
  if (event.path.startsWith('/api/')) {
    setHeader(event, 'Cache-Control', 'public, max-age=300')
  }
})
```

---

*This specification should be updated when build or deployment processes change.*
