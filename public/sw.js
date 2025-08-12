const CACHE_NAME = 'ratatouille-v1'
const OFFLINE_CACHE_NAME = 'ratatouille-offline-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/offline',
        '/api/health',
        // Add other critical resources
      ])
    })
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/recipes/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(OFFLINE_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Serve from cache if offline
          return caches.match(event.request).then((response) => {
            if (response) {
              return response
            }
            // Return offline page for API requests
            return caches.match('/offline')
          })
        })
    )
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request)
      })
    )
  }
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})
