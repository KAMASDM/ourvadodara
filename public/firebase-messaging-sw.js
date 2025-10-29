// =============================================
// public/firebase-messaging-sw.js
// Firebase Cloud Messaging Service Worker
// =============================================

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase config for service worker
const firebaseConfig = {
  apiKey: "AIzaSyAJX8v5zV5zV5zV5zV5zV5zV5zV5zV5zV5",
  authDomain: "ourvadodara-a4002.firebaseapp.com",
  projectId: "ourvadodara-a4002",
  storageBucket: "ourvadodara-a4002.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Get Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const { notification, data } = payload;

  const notificationTitle = notification?.title || 'Our Vadodara';
  const notificationOptions = {
    body: notification?.body || 'New update available',
    icon: notification?.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: data?.tag || 'our-vadodara-notification',
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: data?.url || '/',
      postId: data?.postId,
      type: data?.type,
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss.png'
      }
    ]
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { url, postId, type } = event.notification.data;

  let targetUrl = '/';

  if (event.action === 'view') {
    if (postId) {
      targetUrl = `/?post=${postId}`;
    } else if (url) {
      targetUrl = url;
    }
  } else if (event.action === 'dismiss') {
    return; // Just close the notification
  } else {
    // Default click action
    if (postId) {
      targetUrl = `/?post=${postId}`;
    } else if (url) {
      targetUrl = url;
    }
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: targetUrl,
            data: event.notification.data
          });
          return;
        }
      }

      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.data);
  
  // Track notification close analytics
  // You can send this data to your analytics service
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed');
  
  // Handle subscription refresh
  event.waitUntil(
    // Re-subscribe with new token
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'YOUR_VAPID_KEY'
    }).then((subscription) => {
      console.log('New subscription:', subscription);
      // Send new subscription to your server
    })
  );
});