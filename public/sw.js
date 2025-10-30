// =============================================
// Additional Service Worker Registration (public/sw.js)
// =============================================
// This content should be added to public/sw.js

const CACHE_NAME = 'our-vadodara-v3';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.png',
  '/logo.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-180x180.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  // Force immediate activation for direct updates
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip anything that is not a simple GET or comes from browser extensions
  if (request.method !== 'GET' || request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Allow cross-origin requests (e.g. Firebase Storage) to fall back to the network
  const isSameOrigin = request.url.startsWith(self.location.origin);
  if (!isSameOrigin) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).catch((error) => {
          console.log('Fetch failed for:', request.url, error);
          // Return a basic offline response for navigation requests
          if (request.destination === 'document') {
            return caches.match('/');
          }
          throw error;
        });
      }
    )
  );
});

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification('Our Vadodara', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// Handle activate event for immediate control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Clean up old caches
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      // Take immediate control of all clients
      return self.clients.claim();
    })
  );
});

// Handle skip waiting message from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});