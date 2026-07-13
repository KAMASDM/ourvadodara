// =============================================
// src/utils/pwaHelpers.js
// =============================================
let deferredPrompt;

export const initPWA = () => {
  // Listen for app installation
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed successfully');
    deferredPrompt = null;
  });
};

export const showInstallPrompt = () => {
  window.dispatchEvent(new CustomEvent('pwa-install-available'));
};

export const installPWA = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    deferredPrompt = null;
  }
  hideInstallPrompt();
};

export const hideInstallPrompt = () => {
  deferredPrompt = null;
};

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;

  // The cache-first service worker must never run against the Vite dev
  // server — it serves stale documents/modules and blanks the page. In dev,
  // actively remove any previously installed worker and its caches.
  if (import.meta.env.DEV) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
      }
      if (registrations.length > 0) {
        console.log('Dev mode: unregistered stale service worker(s) and cleared caches');
      }
    } catch (error) {
      console.log('Dev SW cleanup failed:', error);
    }
    return;
  }

  {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered: ', registration);

      if (registration.waiting && navigator.serviceWorker.controller) {
        showUpdateAvailable(registration);
      }
      
      // Check for updates immediately
      await registration.update();

      if (registration.waiting && navigator.serviceWorker.controller) {
        showUpdateAvailable(registration);
      }
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Skip intermediate versions and update directly to latest
            showUpdateAvailable(registration);
          }
        });
      });

      // Also check periodically for updates
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute
      
    } catch (error) {
      console.log('SW registration failed: ', error);
    }
  }
};

export const showUpdateAvailable = (registration) => {
  // Preserve the update if it is discovered before the React prompt mounts.
  window.__ourVadodaraUpdateRegistration = registration;
  window.dispatchEvent(new CustomEvent('pwa-update-available', {
    detail: { registration }
  }));
};

export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const initializePushNotifications = async (userId) => {
  try {
    // Dynamic import to avoid loading FCM if not needed
    const { pushNotificationService } = await import('./pushNotifications.js');
    
    const success = await pushNotificationService.init(userId);
    
    if (success) {
      console.log('Push notifications initialized successfully');
      
      // Listen for notification clicks from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
          // Handle notification click navigation
          const { url } = event.data;
          if (url && url !== window.location.pathname + window.location.search) {
            window.location.href = url;
          }
        }
      });
    }
    
    return success;
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return false;
  }
};

export const showNotification = (title, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options
    });
  }
};
