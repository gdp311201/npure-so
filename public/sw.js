/* ============================================================
   NPURE SO — Service Worker (PWA Offline Support) — v3
   ============================================================
   Strategy:
   - HTML Documents (navigation): Network-First, fallback to cache
   - Static Assets with hashed URLs (_next/static/*): Cache-First
   - Other Static Assets (images, icons): Cache-First
   - Supabase API requests: Network-First, fallback to cache
   - All storage operations wrapped in try/catch (graceful degradation)
   ============================================================ */

const CACHE_VERSION = 'npure-so-v3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// App shell — critical files for offline use
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/icon-apple-touch.png',
];

// ============================================================
// Helper: safe cache operations (wrapped in try/catch)
// Prevents "Access to storage is not allowed" from breaking SW
// ============================================================
async function safeCacheOpen(name) {
  try {
    return await caches.open(name);
  } catch (err) {
    console.warn('[SW] Cache storage not available:', err.message);
    return null;
  }
}

async function safeCacheAdd(cache, url) {
  try {
    await cache.add(url);
  } catch (err) {
    console.warn(`[SW] Failed to cache ${url}:`, err.message);
  }
}

async function safeCachePut(cache, request, response) {
  try {
    await cache.put(request, response);
  } catch (err) {
    console.warn('[SW] Failed to cache response:', err.message);
  }
}

async function safeCacheMatch(request) {
  try {
    return await caches.match(request);
  } catch (err) {
    console.warn('[SW] Cache match failed:', err.message);
    return null;
  }
}

async function safeCacheDelete(key) {
  try {
    return await caches.delete(key);
  } catch (err) {
    console.warn(`[SW] Failed to delete cache ${key}:`, err.message);
    return false;
  }
}

async function safeCacheKeys() {
  try {
    return await caches.keys();
  } catch (err) {
    console.warn('[SW] Cache keys failed:', err.message);
    return [];
  }
}

// ============================================================
// Install: pre-cache app shell (with error handling)
// ============================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await safeCacheOpen(STATIC_CACHE);
      if (cache) {
        // Cache app shell URLs in parallel (each wrapped in safeCacheAdd)
        await Promise.all(APP_SHELL.map((url) => safeCacheAdd(cache, url)));
      }
      // Force activation even if caching fails
      try {
        await self.skipWaiting();
      } catch (err) {
        console.warn('[SW] skipWaiting failed:', err.message);
      }
    })()
  );
});

// ============================================================
// Activate: clean up old caches + claim clients
// ============================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await safeCacheKeys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('npure-so-') && !key.startsWith(CACHE_VERSION))
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return safeCacheDelete(key);
          })
      );
      try {
        await self.clients.claim();
      } catch (err) {
        console.warn('[SW] clients.claim failed:', err.message);
      }
    })()
  );
});

// ============================================================
// Fetch strategy
// ============================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST/DELETE/etc bypass SW entirely)
  if (request.method !== 'GET') return;

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') return;

  // Supabase API: Network-First (always try fresh data)
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            safeCacheOpen(RUNTIME_CACHE).then((cache) => {
              if (cache) safeCachePut(cache, request, clone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cached = await safeCacheMatch(request);
          return cached || Response.error();
        })
    );
    return;
  }

  // Same-origin requests
  if (url.origin === self.location.origin) {
    // === HTML Documents (navigation) — Network-First ===
    if (request.mode === 'navigate' ||
        (request.headers.get('accept') || '').includes('text/html')) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              safeCacheOpen(RUNTIME_CACHE).then((cache) => {
                if (cache) safeCachePut(cache, request, clone);
              });
            }
            return response;
          })
          .catch(async () => {
            const cached = await safeCacheMatch(request);
            return cached || Response.error();
          })
      );
      return;
    }

    // === Static Assets — Cache-First ===
    event.respondWith(
      (async () => {
        const cached = await safeCacheMatch(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok && response.type === 'basic') {
            const clone = response.clone();
            safeCacheOpen(RUNTIME_CACHE).then((cache) => {
              if (cache) safeCachePut(cache, request, clone);
            });
          }
          return response;
        } catch (err) {
          console.warn('[SW] Fetch failed for', request.url, err.message);
          return Response.error();
        }
      })()
    );
    return;
  }

  // Cross-origin: Stale-While-Revalidate
  event.respondWith(
    (async () => {
      const cached = await safeCacheMatch(request);
      try {
        const response = await fetch(request);
        if (response.ok) {
          const clone = response.clone();
          safeCacheOpen(RUNTIME_CACHE).then((cache) => {
            if (cache) safeCachePut(cache, request, clone);
          });
        }
        return response;
      } catch (err) {
        return cached || Response.error();
      }
    })()
  );
});

// ============================================================
// Background Sync (Android Chrome only)
// ============================================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-transactions') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SYNC_PENDING_TRANSACTIONS' }));
      })
    );
  }
});

// ============================================================
// Push notifications (for future Phase 2)
// ============================================================
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'NPURE SO', {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: data.url ? { url: data.url } : {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
