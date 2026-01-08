/**
 * Service Worker for LokaClean - Background Notifications
 */

const CACHE_NAME = 'lokaclean-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/img/logo.png'
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Only cache GET requests (Cache API doesn't support POST, PATCH, PUT, DELETE)
  const isGetRequest = event.request.method === 'GET';
  const isCacheable = isGetRequest && (
    event.request.url.includes('/img/') ||
    event.request.url.includes('/assets/') ||
    event.request.url.endsWith('.png') ||
    event.request.url.endsWith('.jpg') ||
    event.request.url.endsWith('.jpeg') ||
    event.request.url.endsWith('.svg') ||
    event.request.url.endsWith('.css') ||
    event.request.url.endsWith('.js')
  );

  if (!isCacheable) {
    // For non-cacheable requests (API calls, PATCH, POST, etc.), just fetch normally
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful GET responses for static assets only
        if (response.status === 200 && isCacheable) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails (only for cacheable requests)
        return caches.match(event.request);
      })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'LokaClean';
  const options = {
    body: data.message || 'You have a new notification',
    icon: '/img/Logo LocaClean2.jpg',
    badge: '/img/Logo LocaClean2.jpg',
    tag: data.tag || 'notification',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: data,
    // Modern notification options
    actions: data.url ? [
      {
        action: 'view',
        title: 'View Order',
        icon: '/img/Logo LocaClean2.jpg'
      }
    ] : []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click - opens app or navigates to notification URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const urlToOpen = data.url || '/orders';

  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      // If app is already open, focus it and navigate to the URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // Check if client URL matches our app origin
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen, self.location.origin);
        
        if (clientUrl.origin === targetUrl.origin) {
          // App is open, focus it and navigate
          if ('focus' in client) {
            client.focus();
          }
          // Navigate to the notification URL
          if ('navigate' in client && client.navigate) {
            return client.navigate(urlToOpen);
          }
          // Fallback: send message to client to navigate
          client.postMessage({ type: 'NAVIGATE', url: urlToOpen });
          return;
        }
      }
      
      // App is not open, open new window/tab with the URL
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

