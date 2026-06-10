// Development placeholder.
// Production builds replace dist/firebase-messaging-sw.js from environment
// variables via scripts/write-firebase-messaging-sw.cjs.

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification?.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
