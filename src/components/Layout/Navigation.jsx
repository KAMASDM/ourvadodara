// =============================================
// src/components/Layout/Navigation.jsx
// Modernized bottom tab bar — frosted chrome,
// active pill, safe-area, keyboard accessible.
// =============================================
import React, { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Compass, Home, User, Clapperboard } from 'lucide-react';

const Navigation = memo(function Navigation({ activeTab, setActiveTab, onTabChange, hasActiveSOS = false }) {
  const { t } = useTranslation();
  const handleChange = onTabChange || setActiveTab;
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const hiddenRef = useRef(false);
  const tickingRef = useRef(false);

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
    { id: 'reels',    Icon: Clapperboard,  label: t('reels', 'Reels') },
    { id: 'explore',  Icon: Compass,       label: t('explore.title', 'Explore'), featured: true },
    { id: 'events',   Icon: CalendarDays,  label: t('events', 'Events') },
    // Logged-out users see the same Profile tab; App opens sign-in when tapped.
    { id: 'profile', Icon: User, label: t('profile', 'Profile') },
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
        <div className="liquid-glass relative flex h-[64px] rounded-3xl !border-teal-700/35 shadow-[0_12px_38px_rgba(15,118,110,0.16)] dark:!border-teal-400/30 dark:shadow-[0_12px_38px_rgba(20,184,166,0.10)]">
        {navItems.map(({ id, Icon, label, featured }) => {
          const active = activeTab === id;
          const color = active
            ? 'text-teal-700 dark:text-teal-300'
            : featured
              ? 'text-teal-600 dark:text-teal-300'
              : 'text-neutral-500 dark:text-neutral-400';

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleChange?.(id)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={`relative min-w-0 flex-1 flex flex-col items-center justify-center gap-0.5 ${color} transition-all duration-200 active:scale-95`}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-1 top-1 bottom-1 rounded-[1.35rem] border border-teal-600/55 bg-gradient-to-b from-teal-50/95 to-white/80 shadow-[0_3px_12px_rgba(15,118,110,0.14)] ring-1 ring-teal-600/10 dark:border-teal-400/50 dark:from-teal-950/70 dark:to-slate-900/70 dark:ring-teal-300/10"
                />
              )}
              {featured && !active && <span className="absolute top-1.5 z-0 h-8 w-8 rounded-full bg-teal-50 ring-1 ring-teal-100 dark:bg-teal-950/50 dark:ring-teal-800" aria-hidden />}
              {React.createElement(Icon, { className: 'relative z-10 h-[22px] w-[22px]', strokeWidth: active ? 2.5 : 2 })}
              <span className="relative z-10 max-w-full truncate px-0.5 text-[10px] font-semibold tracking-[0.02em]">{label}</span>

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
