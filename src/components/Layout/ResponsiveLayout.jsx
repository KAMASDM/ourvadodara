// =============================================
// src/components/Layout/ResponsiveLayout.jsx
// Adaptive Layout - Desktop vs Mobile
// =============================================
import React, { useState, useEffect } from 'react';
import DesktopLayout from './DesktopLayout';

const ResponsiveLayout = ({ children, currentView = {}, onNavigate, isDesktop: isDesktopProp }) => {
  // Use prop if provided, otherwise use local state
  const [localIsDesktop, setLocalIsDesktop] = useState(window.innerWidth >= 1024);
  const isDesktop = isDesktopProp !== undefined ? isDesktopProp : localIsDesktop;

  useEffect(() => {
    if (isDesktopProp === undefined) {
      const handleResize = () => {
        setLocalIsDesktop(window.innerWidth >= 1024);
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isDesktopProp]);

  // Routes that should always use mobile layout (admin, login, etc.)
  const mobileOnlyViews = ['admin', 'login', 'signup', 'admin-upgrade', 'firebase-setup', 'qr-scanner'];
  const isMobileOnlyView = mobileOnlyViews.includes(currentView?.type);

  // Use desktop layout for desktop screens, unless it's a mobile-only view
  if (isDesktop && !isMobileOnlyView) {
    return <DesktopLayout currentView={currentView} onNavigate={onNavigate}>{children}</DesktopLayout>;
  }

  // Use mobile layout (current default layout)
  return <>{children}</>;
};

export default ResponsiveLayout;
