// =============================================
// src/components/PWA/InstallPrompt.jsx
// Install and update cards for the PWA experience.
// =============================================
import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, RefreshCw, CheckCircle2 } from 'lucide-react';
import logoImage from '../../assets/images/our-vadodara-logo.png.png';

const isStandalone = () => (
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true ||
  document.referrer.includes('android-app://')
);

const clearAllCaches = async () => {
  if (!('caches' in window)) return;
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
};

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [updateRegistration, setUpdateRegistration] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iosDevice);

    if (isStandalone()) return;

    const dismissedAt = Number(localStorage.getItem('pwa-install-dismissed-at') || 0);
    const dismissedRecently = dismissedAt && Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000;
    const isSecureContext = window.isSecureContext || location.hostname === 'localhost';

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      window.deferredInstallPrompt = event;
      setDeferredPrompt(event);
      if (!dismissedRecently) setShowInstallPrompt(true);
    };

    const handleInstallAvailable = () => {
      if (window.deferredInstallPrompt) setDeferredPrompt(window.deferredInstallPrompt);
      if (!dismissedRecently && isSecureContext) setShowInstallPrompt(true);
    };

    // The index.html script may have captured the event before this mounted.
    if (window.deferredInstallPrompt) {
      setDeferredPrompt(window.deferredInstallPrompt);
      if (!dismissedRecently) setShowInstallPrompt(true);
    }

    const handleUpdateAvailable = (event) => {
      setUpdateRegistration(event.detail?.registration || null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-update-available', handleUpdateAvailable);

    let iosTimer;
    if (iosDevice && isSecureContext && !dismissedRecently) {
      iosTimer = setTimeout(() => setShowInstallPrompt(true), 2500);
    }

    return () => {
      clearTimeout(iosTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  const handleInstall = async () => {
    const promptEvent = deferredPrompt || window.deferredInstallPrompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice;
    window.deferredInstallPrompt = null;
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const dismissInstall = () => {
    localStorage.setItem('pwa-install-dismissed-at', String(Date.now()));
    setShowInstallPrompt(false);
  };

  const updateApp = async () => {
    setIsUpdating(true);
    try {
      if (updateRegistration?.waiting) {
        updateRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
      } else {
        await clearAllCaches();
        window.location.reload();
      }
    } catch (error) {
      console.error('PWA update failed:', error);
      window.location.reload();
    }
  };

  if (!showInstallPrompt && !updateRegistration) return null;

  const isUpdate = Boolean(updateRegistration);

  return (
    <div className="fixed inset-x-0 bottom-[calc(82px+env(safe-area-inset-bottom))] z-[70] px-3 sm:bottom-5">
      <div className="liquid-panel mx-auto max-w-md rounded-[1.5rem] border border-white/70 p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/75 shadow-inner">
            <img src={logoImage} alt="Our Vadodara" className="h-9 w-9 object-contain" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-950">
                  {isUpdate ? 'Update Our Vadodara' : 'Install Our Vadodara'}
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                  {isUpdate
                    ? 'A fresh version is ready with the latest fixes and improvements.'
                    : 'Get faster access, full-screen reading, and a phone-ready city news experience.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => (isUpdate ? setUpdateRegistration(null) : dismissInstall())}
                className="rounded-full p-1 text-slate-400 transition hover:bg-white/60 hover:text-slate-700"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isUpdate ? (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={updateApp}
                  disabled={isUpdating}
                  className="btn-primary flex-1 !py-2.5 !text-sm"
                >
                  {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {isUpdating ? 'Updating' : 'Update now'}
                </button>
              </div>
            ) : isIOS ? (
              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 rounded-2xl bg-white/55 px-3 py-2">
                  <Share className="h-4 w-4 text-teal-700" />
                  <span>Tap Safari Share.</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-white/55 px-3 py-2">
                  <PlusSquare className="h-4 w-4 text-teal-700" />
                  <span>Choose Add to Home Screen, then tap Add.</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleInstall}
                  disabled={!deferredPrompt}
                  className="btn-primary flex-1 !py-2.5 !text-sm"
                >
                  <Download className="h-4 w-4" />
                  Install app
                </button>
                <button
                  type="button"
                  onClick={dismissInstall}
                  className="liquid-action rounded-full px-4 text-sm font-semibold text-slate-600"
                >
                  Later
                </button>
              </div>
            )}

            {!isUpdate && (
              <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-slate-500">
                <Smartphone className="h-3.5 w-3.5" />
                <span>Designed for Android and iPhone home screens.</span>
                <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-600" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
