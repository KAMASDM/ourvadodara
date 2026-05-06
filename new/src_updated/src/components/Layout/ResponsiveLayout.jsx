// =============================================
// src/components/Layout/ResponsiveLayout.jsx
// Adaptive layout wrapper — mobile default, desktop
// shell ≥1024px, skip desktop for auth/admin views.
// =============================================
import React, { useState, useEffect, useMemo, Suspense } from 'react';

const DesktopLayout = React.lazy(() => import('./DesktopLayout'));

const MOBILE_ONLY = new Set([
  'admin', 'login', 'signup', 'admin-upgrade', 'firebase-setup', 'qr-scanner',
]);

export default function ResponsiveLayout({
  children, currentView = {}, onNavigate, isDesktop: isDesktopProp,
}) {
  const [localIsDesktop, setLocalIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  const isDesktop = isDesktopProp !== undefined ? isDesktopProp : localIsDesktop;

  useEffect(() => {
    if (isDesktopProp !== undefined) return;
    const mql = window.matchMedia('(min-width: 1024px)');
    const onChange = (e) => setLocalIsDesktop(e.matches);
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, [isDesktopProp]);

  const isMobileOnlyView = useMemo(
    () => MOBILE_ONLY.has(currentView?.type),
    [currentView?.type]
  );

  if (isDesktop && !isMobileOnlyView) {
    return (
      <Suspense fallback={<div className="app-shell flex items-center justify-center"><div className="skeleton w-64 h-10" /></div>}>
        <DesktopLayout currentView={currentView} onNavigate={onNavigate}>
          {children}
        </DesktopLayout>
      </Suspense>
    );
  }

  return <>{children}</>;
}
