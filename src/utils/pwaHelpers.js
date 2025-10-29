// =============================================
// src/utils/pwaHelpers.js
// =============================================
let deferredPrompt;

export const initPWA = () => {
  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt();
  });

  // Listen for app installation
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed successfully');
    deferredPrompt = null;
  });
};

export const showInstallPrompt = () => {
  const installBanner = document.createElement('div');
  installBanner.id = 'install-banner';
  installBanner.className = 'fixed bottom-20 left-4 right-4 bg-primary-500 text-white p-4 rounded-lg shadow-lg z-40 flex items-center justify-between';
  installBanner.innerHTML = `
    <div>
      <p class="font-semibold">Install Our Vadodara</p>
      <p class="text-sm opacity-90">Get quick access to news</p>
    </div>
    <div class="flex space-x-2">
      <button id="install-yes" class="bg-white text-primary-500 px-3 py-1 rounded font-medium">Install</button>
      <button id="install-no" class="text-white opacity-75">×</button>
    </div>
  `;

  document.body.appendChild(installBanner);

  document.getElementById('install-yes').addEventListener('click', installPWA);
  document.getElementById('install-no').addEventListener('click', hideInstallPrompt);

  // Auto-hide after 10 seconds
  setTimeout(hideInstallPrompt, 10000);
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
  const banner = document.getElementById('install-banner');
  if (banner) {
    banner.remove();
  }
};

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered: ', registration);
      
      // Check for updates immediately
      registration.update();
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
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
  // Remove any existing update banners
  const existingBanner = document.getElementById('update-banner');
  if (existingBanner) {
    existingBanner.remove();
  }

  const updateBanner = document.createElement('div');
  updateBanner.id = 'update-banner';
  updateBanner.className = 'fixed top-0 left-0 right-0 bg-blue-600 text-white p-4 text-center z-50 shadow-lg animate-slideDown';
  updateBanner.innerHTML = `
    <div class="flex items-center justify-center space-x-4">
      <div class="flex-1">
        <p class="text-sm font-medium">🚀 New version available!</p>
        <p class="text-xs opacity-90">Update now for the latest features and improvements</p>
      </div>
      <button id="update-now" class="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors">
        Update Now
      </button>
      <button id="update-later" class="text-white opacity-75 hover:opacity-100 text-xl">×</button>
    </div>
  `;
  
  document.body.appendChild(updateBanner);

  // Handle update now button
  document.getElementById('update-now').addEventListener('click', async () => {
    updateBanner.remove();
    
    // Show loading indicator
    const loadingBanner = document.createElement('div');
    loadingBanner.className = 'fixed top-0 left-0 right-0 bg-green-600 text-white p-3 text-center z-50';
    loadingBanner.innerHTML = `
      <p class="text-sm">📦 Updating to latest version...</p>
    `;
    document.body.appendChild(loadingBanner);
    
    try {
      // Force update to latest version
      if (registration && registration.waiting) {
        // Skip intermediate versions and activate latest
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Listen for controlling worker change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      } else {
        // Fallback: Clear all caches and reload
        await clearAllCaches();
        window.location.reload();
      }
    } catch (error) {
      console.error('Update failed:', error);
      // Fallback: just reload
      window.location.reload();
    }
  });

  // Handle close button
  document.getElementById('update-later').addEventListener('click', () => {
    updateBanner.remove();
  });
};

// Helper function to clear all caches
const clearAllCaches = async () => {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
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