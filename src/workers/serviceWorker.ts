/// <reference lib="webworker" />

/**
 * =====================================================
 * RETROUVONSLES - Service Worker
 * Handles caching, offline support, and push notifications
 * =====================================================
 */

// Declare self as ServiceWorkerGlobalScope
declare const self: ServiceWorkerGlobalScope;

// Cache versioning
const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  STATIC: `retrouvonsles-static-${CACHE_VERSION}`,
  DYNAMIC: `retrouvonsles-dynamic-${CACHE_VERSION}`,
  IMAGES: `retrouvonsles-images-${CACHE_VERSION}`,
  API: `retrouvonsles-api-${CACHE_VERSION}`,
};

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/robots.txt',
  '/assets/icons/logo-192x192.png',
  '/assets/icons/logo-512x512.png',
];

// API endpoints that should be cached
const CACHEABLE_API_PATTERNS = [
  /\/api\/personnes\//,
  /\/api\/dossiers\//,
  /\/api\/alertes\//,
  /\/api\/localisations\//,
];

// List of all cache names for cleanup
const ALL_CACHES = Object.values(CACHE_NAMES);

/**
 * Install event - cache essential assets
 */
self.addEventListener('install', (event: any) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAMES.STATIC).then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Pre-cache some images
      caches.open(CACHE_NAMES.IMAGES).then((cache) => {
        console.log('[Service Worker] Pre-caching images');
        const imageAssets = [
          '/assets/images/logo.png',
          '/assets/images/logo-white.png',
          '/assets/icons/alert-icon.svg',
          '/assets/icons/location-pin.svg',
        ];
        return cache.addAll(imageAssets).catch(() => {
          console.warn('[Service Worker] Some images failed to cache (not critical)');
        });
      }),
    ])
  );
  
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event: any) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!ALL_CACHES.includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
  );
  
  self.clients.claim();
});

/**
 * Fetch event - implement caching strategy
 */
self.addEventListener('fetch', (event: any) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // API calls - network first with fallback to cache
  if (url.pathname.startsWith('/api/')) {
    // Check if it's a cacheable API pattern
    const isCacheable = CACHEABLE_API_PATTERNS.some((pattern) => pattern.test(url.pathname));
    if (isCacheable) {
      event.respondWith(networkFirstStrategy(request, CACHE_NAMES.API));
    }
    return;
  }

  // HTML documents - network first for freshness
  if (request.destination === 'document') {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.STATIC));
    return;
  }

  // Images - cache first with network fallback
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.IMAGES));
    return;
  }

  // Stylesheets and scripts - cache first
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.STATIC));
    return;
  }

  // Default - cache first for other assets
  event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.DYNAMIC));
});

/**
 * Cache-first strategy: check cache first, fallback to network
 */
async function cacheFirstStrategy(request: Request, cacheName: string): Promise<Response> {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      // Try to update cache in background
      fetch(request).then((response) => {
        if (response.ok && request.method === 'GET') {
          cache.put(request, response);
        }
      }).catch(() => {
        // Network failed, that's ok - we have cache
      });
      return cached;
    }

    // Not in cache, try network
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[Service Worker] Cache-first failed:', error);
    // Return offline response for documents
    if (request.destination === 'document') {
      return new Response('You are offline. Please check your internet connection.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
    return new Response('Offline - Resource unavailable', { status: 503 });
  }
}

/**
 * Network-first strategy: try network first, fallback to cache
 */
async function networkFirstStrategy(request: Request, cacheName: string): Promise<Response> {
  try {
    const response = await fetch(request);
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[Service Worker] Network failed:', error);
    try {
      const cache = await caches.open(cacheName);
      const cached = await cache.match(request);
      if (cached) {
        console.log('[Service Worker] Serving from cache:', request.url);
        return cached;
      }
    } catch (cacheError) {
      console.error('[Service Worker] Cache access failed:', cacheError);
    }
    
    // Return offline response
    if (request.destination === 'document') {
      return new Response('You are offline. Some features may not be available.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
    return new Response('Network error - offline', { status: 503 });
  }
}

/**
 * Push notification event
 */
self.addEventListener('push', (event: any) => {
  let notificationData = {
    title: 'RETROUVONSLES',
    body: 'Vous avez une nouvelle notification',
    icon: '/assets/icons/logo-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    tag: 'retrouvonsles-notification',
  };

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title,
      notificationData
    )
  );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window' } as any)
      .then((clients: any) => {
        // Check if window is already open
        for (let i = 0; i < clients.length; i++) {
          if (clients[i].url === '/' && 'focus' in clients[i]) {
            return clients[i].focus();
          }
        }
        // If not, open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
        return undefined;
      })
  );
});

/**
 * Notification close event
 */
self.addEventListener('notificationclose', (event: any) => {
  console.log('[Service Worker] Notification closed:', event.notification);
});

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', (event: any) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(clearCache(data?.cacheName));
      break;

    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(data?.urls, data?.cacheName));
      break;

    case 'GET_CACHE_SIZE':
      event.waitUntil(getCacheSize());
      break;

    default:
      console.log('[Service Worker] Unknown message type:', type);
  }
});

/**
 * Clear cache utility
 */
async function clearCache(cacheName?: string): Promise<void> {
  const targetCache = cacheName || CACHE_NAMES.DYNAMIC;
  console.log('[Service Worker] Clearing cache:', targetCache);
  await caches.delete(targetCache);
}

/**
 * Cache URLs utility
 */
async function cacheUrls(urls: string[], cacheName?: string): Promise<void> {
  const cache = await caches.open(cacheName || CACHE_NAMES.DYNAMIC);
  console.log('[Service Worker] Caching URLs:', urls);
  await cache.addAll(urls);
}

/**
 * Get cache size utility
 */
async function getCacheSize(): Promise<void> {
  if (!('estimate' in navigator.storage)) {
    console.log('[Service Worker] Storage API not available');
    return;
  }

  const estimate = await navigator.storage.estimate();
  console.log('[Service Worker] Cache size:', {
    usage: estimate.usage,
    quota: estimate.quota,
    percentage: ((estimate.usage || 0) / (estimate.quota || 1)) * 100,
  });
}

export {};
