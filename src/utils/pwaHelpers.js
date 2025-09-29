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
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateAvailable();
          }
        });
      });
    } catch (error) {
      console.log('SW registration failed: ', error);
    }
  }
};

export const showUpdateAvailable = () => {
  const updateBanner = document.createElement('div');
  updateBanner.className = 'fixed top-0 left-0 right-0 bg-blue-500 text-white p-3 text-center z-50';
  updateBanner.innerHTML = `
    <p class="text-sm">
      A new version is available! 
      <button onclick="window.location.reload()" class="underline ml-2">Update now</button>
    </p>
  `;
  document.body.appendChild(updateBanner);
};

export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
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