// =============================================
// src/components/PWA/PWAInstallButton.jsx
// Simple PWA Install Button for Navigation
// =============================================
import React, { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';

const PWAInstallButton = ({ expanded = false }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
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
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA Button: App installed');
      setCanInstall(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if we're in a PWA-capable environment
    const isSecureContext = window.isSecureContext || location.hostname === 'localhost';
    if (!isSecureContext) {
      console.log('PWA Button: Not in secure context');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Show manual instructions for browsers that don't support the API
      alert('To install this app:\n\n• Chrome: Click the install button in the address bar\n• Safari (iOS): Tap Share > Add to Home Screen\n• Firefox: Check browser menu for Install option');
      return;
    }

    try {
      const promptResult = await deferredPrompt.prompt();
      console.log('PWA Button: Install prompt result:', promptResult);
      
      const choiceResult = await deferredPrompt.userChoice;
      console.log('PWA Button: User choice:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setCanInstall(false);
      }
      
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
      onClick={handleInstall}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent bg-ivory-100 text-warmBrown-900 shadow-sm transition-colors duration-200 hover:border-warmBrown-300 hover:text-warmBrown-700 dark:bg-gray-900/70 dark:text-text-light dark:hover:border-gray-700"
      title="Install Our Vadodara App"
    >
      <Download className="w-4 h-4" />
    </button>
  );
};

export default PWAInstallButton;