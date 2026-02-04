// @ts-nocheck
/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Helper to set app badge (if supported)
function setAppBadge(count?: number) {
  if ('setAppBadge' in self.navigator) {
    try {
      if (count !== undefined) {
        (self.navigator as any).setAppBadge(count);
      } else {
        (self.navigator as any).setAppBadge(); // Shows a dot or default
      }
    } catch (e) {
      console.error('Failed to set app badge', e);
    }
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'LokaClean';
  const options = {
    body: data.message || 'You have a new notification',
    icon: '/img/Logo_LokaClean.jpg',
    badge: '/img/Logo_LokaClean.jpg',
    tag: data.tag || 'notification',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: data,
    // Modern notification options
    actions: data.url ? [
      {
        action: 'view',
        title: 'View Order',
        icon: '/img/Logo_LokaClean.jpg'
      }
    ] : []
  };

  // Try to set app badge (count or dot)
  // Since we don't track total unread count in SW, we just set a "flag" (dot/1)
  setAppBadge(1);

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
