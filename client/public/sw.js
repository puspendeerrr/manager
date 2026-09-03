// Sonam PWA Service Worker — Web Push Notifications & Offline Shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle Web Push Notification Delivery in Background
self.addEventListener('push', (event) => {
  let payload = {
    title: '🔔 Sonam Reminder',
    body: 'You have a due task!',
    data: { url: '/tasks' },
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    tag: payload.data?.taskId ? `task-${payload.data.taskId}` : 'sonam-reminder',
    renotify: true,
    data: payload.data || { url: '/tasks' },
    actions: [
      { action: 'done', title: 'Done' },
      { action: 'snooze_10m', title: 'Snooze 10m' },
    ],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/tasks';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('/tasks') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
