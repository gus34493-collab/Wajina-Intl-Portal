const CACHE_NAME = 'wajina-portal-v2';
const OFFLINE_URL = '/portal';

// Assets to precache for offline support
const PRECACHE_URLS = [
  '/portal',
  '/images/Logo.png',
  '/manifest.json',
];

// Install: precache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first with cache fallback
self.addEventListener('fetch', event => {
  const { request } = event;

  // Skip non-GET and API requests
  if (request.method !== 'GET') return;
  if (request.url.includes('/api/')) return;

  // For navigation requests, try network first, fall back to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // For assets: stale-while-revalidate
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      const fetchPromise = fetch(request).then(networkResponse => {
        // Update cache in background
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Push notifications (restored from legacy sw.js)
self.addEventListener('push', event => {
  try {
    const data = event.data ? event.data.json() : {};
    const options = {
      body: data.body || 'New update from Wajina Portal',
      icon: '/images/Logo.png',
      badge: '/images/Logo.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/portal',
      },
      actions: [
        { action: 'open', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Wajina Portal', options)
    );
  } catch (err) {
    console.error('[Wajina SW] Push handling error:', err);
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
