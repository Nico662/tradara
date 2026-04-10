self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? '⚡ Tradara', {
      body:  data.body ?? 'Daily challenge is ready!',
      icon:  '/icon-192.png',
      badge: '/icon-192.png',
      data:  { url: data.url ?? 'https://tradara.dev' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url ?? 'https://tradara.dev')
  );
});