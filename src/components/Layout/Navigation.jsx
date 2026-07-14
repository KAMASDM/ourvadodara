// =============================================
// src/components/Layout/Navigation.jsx
// Modernized bottom tab bar — frosted chrome,
// active pill, safe-area, keyboard accessible.
// =============================================
import React, { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Newspaper, User, AlertTriangle, Clapperboard } from 'lucide-react';
import { useEnhancedAuth } from '../../context/Auth/SimpleEnhancedAuth';
import { useRealtimeData } from '../../hooks/useRealtimeData';

const Navigation = memo(function Navigation({ activeTab, setActiveTab, onTabChange, hasActiveSOS = false }) {
  const { t } = useTranslation();
  const { user } = useEnhancedAuth();
  const handleChange = onTabChange || setActiveTab;
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const hiddenRef = useRef(false);
  const tickingRef = useRef(false);

  const { data: notificationsObject } = useRealtimeData(
    user ? `notifications/${user.uid}` : null
  );

  const unreadCount = notificationsObject
    ? Object.values(notificationsObject).filter(n => !n.isRead).length
    : 0;

  useEffect(() => {
    const setHiddenIfChanged = (nextHidden) => {
      if (hiddenRef.current === nextHidden) return;
      hiddenRef.current = nextHidden;
      setIsHidden(nextHidden);
    };

    const showNav = () => setHiddenIfChanged(false);

    const handleScroll = () => {
      if (tickingRef.current) return;

      tickingRef.current = true;
      requestAnimationFrame(() => {
        const currentY = Math.max(window.scrollY, 0);
        const delta = currentY - lastScrollY.current;
        const nearTop = currentY < 48;
        const nearBottom = window.innerHeight + currentY >= document.documentElement.scrollHeight - 96;

        if (nearTop || nearBottom || delta < -8) {
          setHiddenIfChanged(false);
        } else if (delta > 10 && currentY > 120) {
          setHiddenIfChanged(true);
        }

        lastScrollY.current = currentY;
        tickingRef.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', showNav, { passive: true });
    window.addEventListener('focusin', showNav);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', showNav);
      window.removeEventListener('focusin', showNav);
    };
  }, []);

  const navItems = [
    { id: 'home',     Icon: Home,          label: t('home', 'Home') },
    { id: 'roundup',  Icon: Newspaper,     label: 'Roundup' },
    { id: 'reels',    Icon: Clapperboard,  label: 'Reels' },
    { id: 'breaking', Icon: AlertTriangle, label: 'Breaking', alert: true },
    // Logged-out users see the same Profile tab; tapping it opens the login
    // modal (handled in App.handleTabChange). The header owns the Login CTA,
    // so the label here must not duplicate it.
    { id: 'profile', Icon: User, label: t('profile', 'Profile'), badge: user ? unreadCount : 0 },
  ];

  return (
    <nav
      className={`fixed bottom-0 inset-x-0 z-50 pb-safe transition-all duration-300 ease-out ${
        isHidden ? 'translate-y-[calc(100%+1rem)] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
      role="navigation"
      aria-label="Primary"
      onMouseEnter={() => setIsHidden(false)}
      onFocusCapture={() => setIsHidden(false)}
    >
      <div className="max-w-app mx-auto mb-2 px-2">
        <div className="liquid-glass relative flex h-[64px] rounded-3xl border border-white/60 dark:border-white/10">
        {navItems.map(({ id, Icon, label, alert, badge }) => {
          const active = activeTab === id;
          const color = active
            ? 'text-primary-600 dark:text-primary-400'
            : alert
              ? 'text-accent-500'
              : 'text-neutral-500 dark:text-neutral-400';

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleChange?.(id)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 ${color} transition-all duration-200 active:scale-95`}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-1 top-1 bottom-1 rounded-[1.35rem] bg-white/75 dark:bg-white/10 shadow-inner ring-1 ring-white/60"
                />
              )}
              <Icon className="relative z-10 w-[22px] h-[22px]" strokeWidth={active ? 2.5 : 2} />
              <span className="relative z-10 text-[10px] font-semibold tracking-[0.02em]">{label}</span>

              {/* Notification badge */}
              {badge > 0 && (
                <span className="absolute top-2 right-[calc(50%-14px)] h-4 w-4 flex items-center justify-center rounded-full bg-danger-500 text-[9px] font-bold text-white">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}

              {/* SOS pulse indicator */}
              {id === 'home' && hasActiveSOS && (
                <span className="absolute top-2 right-[calc(50%-14px)] h-2 w-2 rounded-full bg-danger-500 animate-ping" aria-hidden />
              )}
            </button>
          );
        })}
        </div>
      </div>
    </nav>
  );
});

export default Navigation;
