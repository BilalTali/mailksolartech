/// <reference lib="webworker" />
declare let self: ServiceWorkerGlobalScope;

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const payload = event.data.json();
        
        event.waitUntil(
            self.registration.showNotification(payload.title || 'New Notification', {
                body: payload.body || '',
                icon: payload.icon || '/pwa-icons/icon-192.png',
                badge: '/favicon.svg',
                data: payload.data || {},
                vibrate: [200, 100, 200]
            } as any)
        );
    } catch (e) {
        console.error('Push payload parse error', e);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((windowClients) => {
            // Focus if open
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url && client.url.includes(url) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Or open new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(url);
            }
        })
    );
});
