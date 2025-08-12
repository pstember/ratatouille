// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  // Modules
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxt/icon'
  ],
  
  // Source map configuration - disable completely
  sourcemap: false,
  
  // Vite configuration
  vite: {
    build: {
      sourcemap: false
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
    sourceMap: false
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
