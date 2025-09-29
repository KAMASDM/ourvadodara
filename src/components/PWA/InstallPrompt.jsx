// =============================================
// src/components/PWA/InstallPrompt.jsx
// PWA Install App Button Component
// =============================================
import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const InstallPrompt = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Check if app is already installed
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                          window.navigator.standalone || 
                          document.referrer.includes('android-app://');

    if (isAppInstalled) {
      return; // Don't show install prompt if already installed
    }

    // Check if user has previously dismissed the prompt
    const hasPromptBeenDismissed = localStorage.getItem('pwa-install-dismissed');
    if (hasPromptBeenDismissed) {
      return;
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show manual instruction prompt
    if (isIOSDevice && !isAppInstalled) {
      // Delay showing iOS prompt
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 5000);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) return;

    if (deferredPrompt) {
      // Android/Chrome installation
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    
    // Auto-show again after 7 days
    setTimeout(() => {
      localStorage.removeItem('pwa-install-dismissed');
    }, 7 * 24 * 60 * 60 * 1000);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 max-w-sm mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Install Our Vadodara
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Get the full app experience
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              To install this app on your iPhone:
            </p>
            <ol className="text-xs text-gray-500 dark:text-gray-400 space-y-1 ml-3">
              <li>1. Tap the Share button <span className="font-mono">⎋</span></li>
              <li>2. Scroll down and tap "Add to Home Screen"</li>
              <li>3. Tap "Add" in the top right corner</li>
            </ol>
          </div>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Install App</span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
            >
              Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;