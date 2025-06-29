const CACHE_NAME = 'receipt-app-v1';
const RUNTIME = 'runtime';

const PRECACHE_URLS = [
  '/',
  '/add',
  '/receipts',
  '/login',
  '/_next/static/css/app/layout.css',
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  const currentCaches = [CACHE_NAME, RUNTIME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return caches.open(RUNTIME).then((cache) => {
          return fetch(event.request).then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              // Don't cache API requests or auth requests
              if (!event.request.url.includes('/api/') && 
                  !event.request.url.includes('/auth/')) {
                cache.put(event.request, response.clone());
              }
            }
            return response;
          }).catch(() => {
            // Return offline page or cached content
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
        });
      })
    );
  }
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement offline data sync logic here
  console.log('Performing background sync...');
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'receipt-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: '보기',
        icon: '/icon-192x192.png'
      },
      {
        action: 'dismiss',
        title: '닫기'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('영수증 앱', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});