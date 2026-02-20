/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

interface BadgeCapableNavigatorLike {
  setAppBadge?(count?: number): Promise<void>;
}

interface ServiceWorkerGlobalScopeWithManifest extends ServiceWorkerGlobalScope {
  __WB_MANIFEST: Array<string | { url: string; revision?: string }>;
}

declare const self: ServiceWorkerGlobalScopeWithManifest;

self.skipWaiting();
self.addEventListener('activate', () => self.clients.claim());

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

function setAppBadge(count?: number): Promise<void> {
  const navigatorWithBadge = (self as unknown as { navigator?: BadgeCapableNavigatorLike }).navigator;

  if (!navigatorWithBadge || typeof navigatorWithBadge.setAppBadge !== 'function') {
    return Promise.resolve();
  }

  try {
    return navigatorWithBadge.setAppBadge(count);
  } catch (error) {
    console.error('Failed to set app badge', error);
    return Promise.resolve();
  }
}

self.addEventListener('push', (event) => {
  const raw = event.data?.json() as
    | {
        title?: string;
        message?: string;
        tag?: string;
        url?: string;
      }
    | undefined;
  const data = raw ?? {};
  const title = data.title || 'LokaClean';
  const options = {
    body: data.message || 'You have a new notification',
    icon: '/img/Logo_LokaClean.jpg',
    badge: '/img/Logo_LokaClean.jpg',
    tag: data.tag || 'notification',
    requireInteraction: false,
    silent: false,
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
  // We include it in waitUntil to ensure the SW stays alive until the badge is set
  const promiseChain = Promise.all([
    self.registration.showNotification(title, options),
    setAppBadge(1)
  ]);

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', (event) => {
  const notificationEvent = event as Event & {
    notification: {
      close(): void;
      data?: {
        url?: string;
      };
    };
    waitUntil(promise: Promise<unknown>): void;
  };

  notificationEvent.notification.close();

  const payload =
    (notificationEvent.notification.data as
      | {
          url?: string;
        }
      | undefined) ?? {};
  const urlToOpen = payload.url || '/';

  notificationEvent.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          client.focus();
          return;
        }
      }
      // If not, open a new window
      if (self.clients.openWindow) {
        void self.clients.openWindow(urlToOpen);
      }
    })
  );
});
