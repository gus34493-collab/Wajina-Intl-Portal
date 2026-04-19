const VERSION = '1.5.0';
const CACHE_NAME = `wajina-sms-cache-v${VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/portal.html',
  '/css/onion-core.css',
  '/reduced-motion.css',
  '/js/auth-guard.js',
  '/js/dom-utils.js',
  '/images/Logo.png',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/images/campus-building.jpg',
  '/hr-dashboard.html',
  '/hod-dashboard.html',
  '/academic-admin-dashboard.html',
  '/head-teacher-dashboard.html',
  '/principal-dashboard.html',
  '/director-dashboard.html',
  '/bursar-primary-dashboard.html',
  '/bursar-secondary-dashboard.html',
  '/version.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Silent Fail wrapper: fetch and cache each asset independently
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(error => {
              console.warn(`[Wajina SW] Failed to cache ${url} during install. Silent fail enabled.`, error);
            });
          })
        );
      })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Ignore API calls and non-http schemes for caching
  if (event.request.url.includes('/api/')) return;
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);
  const isNetworkFirst = url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.includes('version.json');

  if (isNetworkFirst) {
    // Network-First for HTML files and versioning
    event.respondWith(
      fetch(event.request).then(response => {
        if(!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        return response;
      }).catch(() => caches.match(event.request))
    );
  } else {
    // Cache-First, Network-Fallback for static assets (js, css, images)
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) return response;
          return fetch(event.request).then(networkResponse => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            return networkResponse;
          });
        }).catch(() => {
          // Final fallback: try network if cache and then both fail
          return fetch(event.request);
        })
    );
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Wajina SW] Purging old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ── PWA Push Notification Logic ──────────────────────────────────────────────
self.addEventListener('push', event => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: data.icon || '/images/icon-192.png',
            badge: data.badge || '/images/icon-192.png',
            vibrate: [100, 50, 100],
            data: { url: data.url || '/' },
            actions: [
                { action: 'open', title: 'Open Portal' }
            ]
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
