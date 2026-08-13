// =============================================
// src/components/PWA/PWAInstallButton.jsx
// Simple PWA Install Button for Navigation
// =============================================
import React, { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';

const PWAInstallButton = ({ expanded = false, showLabel = false }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(() => window.deferredInstallPrompt || null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                            window.navigator.standalone || 
                            document.referrer.includes('android-app://');
      setIsInstalled(isAppInstalled);
      return isAppInstalled;
    };

    if (checkInstalled()) return;

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA Button: beforeinstallprompt event fired');
      e.preventDefault();
      window.deferredInstallPrompt = e;
      setDeferredPrompt(e);
    };

    const handleInstallAvailable = () => {
      if (window.deferredInstallPrompt) setDeferredPrompt(window.deferredInstallPrompt);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA Button: App installed');
      window.deferredInstallPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if we're in a PWA-capable environment
    const isSecureContext = window.isSecureContext || location.hostname === 'localhost';
    if (!isSecureContext) {
      console.log('PWA Button: Not in secure context');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const promptEvent = deferredPrompt || window.deferredInstallPrompt;
    if (!promptEvent) {
      // Show manual instructions for browsers that don't support the API
      alert('To install this app:\n\n• Chrome: Click the install button in the address bar\n• Safari (iOS): Tap Share > Add to Home Screen\n• Firefox: Check browser menu for Install option');
      return;
    }

    try {
      const promptResult = await promptEvent.prompt();
      console.log('PWA Button: Install prompt result:', promptResult);
      
      const choiceResult = await promptEvent.userChoice;
      console.log('PWA Button: User choice:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      
      window.deferredInstallPrompt = null;
      setDeferredPrompt(null);
    } catch (error) {
      console.error('PWA Button: Install error:', error);
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    if (expanded) {
      return (
        <div className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400">
          <Smartphone className="w-5 h-5 mr-2" />
          <span className="font-medium">App Installed ✓</span>
        </div>
      );
    }
    return null;
  }

  // Show install button
  if (expanded) {
    return (
      <button
        onClick={handleInstall}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all shadow-sm"
      >
        <Download className="w-5 h-5" />
        <span>Install Our Vadodara App</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 text-teal-800 shadow-sm transition-colors duration-200 hover:border-teal-300 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200 ${showLabel ? '' : 'w-9 px-0'}`}
      title="Install Our Vadodara App"
      aria-label="Install Our Vadodara App"
    >
      <Download className="w-4 h-4" />
      {showLabel && <span className="text-[11px] font-extrabold">Install</span>}
    </button>
  );
};

export default PWAInstallButton;
