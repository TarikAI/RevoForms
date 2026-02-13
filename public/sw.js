/**
 * RevoForms Service Worker
 * Provides offline support and form caching
 */

const CACHE_NAME = 'revoforms-v1'
const STATIC_CACHE = 'revoforms-static-v1'
const DYNAMIC_CACHE = 'revoforms-dynamic-v1'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// API routes to cache with network-first strategy
const NETWORK_FIRST_ROUTES = [
  '/api/forms',
  '/api/projects',
]

// Cache-first routes (forms data)
const CACHE_FIRST_ROUTES = [
  '/api/forms/',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - handle routing strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip Chrome extensions
  if (url.protocol === 'chrome-extension:') return

  // API routes - Network First strategy
  if (url.pathname.startsWith('/api/')) {
    if (NETWORK_FIRST_ROUTES.some(route => url.pathname.startsWith(route))) {
      event.respondWith(networkFirst(request))
      return
    }
    if (CACHE_FIRST_ROUTES.some(route => url.pathname.startsWith(route))) {
      event.respondWith(cacheFirst(request))
      return
    }
    return
  }

  // Static assets - Cache First strategy
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/images/'))) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Navigation requests - Network First, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request).catch(() => caches.match('/offline')))
    return
  }

  // Default - Network First
  event.respondWith(networkFirst(request))
})

// Network First strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// Cache First strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    // Return a custom offline response for specific resources
    return new Response('Offline', { status: 503 })
  }
}

// Message handling for form submissions (background sync)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'FORM_SUBMISSION') {
    // Store form submission for background sync
    storeFormSubmission(event.data.payload)
  }
})

// Store form submission for later sync
function storeFormSubmission(submission) {
  return self.registration.sync.register('form-submission-sync').then(() => {
    // Store submission data in IndexedDB
    return idbKeyval.set('pending-submission', submission)
  })
}

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'form-submission-sync') {
    event.waitUntil(syncFormSubmission())
  }
})

// Sync form submission when back online
async function syncFormSubmission() {
  try {
    const submission = await idbKeyval.get('pending-submission')
    if (!submission) return

    const response = await fetch('/api/forms/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    })

    if (response.ok) {
      await idbKeyval.del('pending-submission')
      // Notify clients of successful sync
      const clients = await self.clients.matchAll()
      clients.forEach(client => {
        client.postMessage({ type: 'FORM_SYNC_SUCCESS' })
      })
    }
  } catch (error) {
    console.error('Failed to sync form submission:', error)
  }
}

// Push notification support (optional)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New form submission received',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  }

  event.waitUntil(
    self.registration.showNotification('RevoForms', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow('/')
  )
})
