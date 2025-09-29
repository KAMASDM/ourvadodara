// =============================================
// src/components/PWA/PWAInstallButton.jsx
// Simple PWA Install Button for Navigation
// =============================================
import React, { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';

const PWAInstallButton = () => {
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
    return (
      <div className="flex items-center text-green-600 text-sm">
        <Smartphone className="w-4 h-4 mr-1" />
        <span className="hidden sm:inline">App Installed</span>
      </div>
    );
  }

  // Show install button
  return (
    <button
      onClick={handleInstall}
      className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
      title="Install Our Vadodara App"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Install App</span>
    </button>
  );
};

export default PWAInstallButton;