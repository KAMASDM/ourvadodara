// =============================================
// src/components/Layout/Navigation.jsx
// Modernized bottom tab bar — frosted chrome,
// active pill, safe-area, keyboard accessible.
// =============================================
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Newspaper, User, AlertTriangle, LogIn, Clapperboard } from 'lucide-react';
import { useEnhancedAuth } from '../../context/Auth/SimpleEnhancedAuth';
import { useRealtimeData } from '../../hooks/useRealtimeData';

const Navigation = memo(function Navigation({ activeTab, setActiveTab, onTabChange, hasActiveSOS = false }) {
  const { t } = useTranslation();
  const { user } = useEnhancedAuth();
  const handleChange = onTabChange || setActiveTab;

  const { data: notificationsObject } = useRealtimeData(
    user ? `notifications/${user.uid}` : null
  );

  const unreadCount = notificationsObject
    ? Object.values(notificationsObject).filter(n => !n.isRead).length
    : 0;

  const navItems = [
    { id: 'home',     Icon: Home,          label: t('home', 'Home') },
    { id: 'roundup',  Icon: Newspaper,     label: 'Roundup' },
    { id: 'reels',    Icon: Clapperboard,  label: 'Reels' },
    { id: 'breaking', Icon: AlertTriangle, label: 'Breaking', alert: true },
    user
      ? { id: 'profile', Icon: User,  label: t('profile', 'Profile'), badge: unreadCount }
      : { id: 'profile', Icon: LogIn, label: t('login', 'Login') },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 chrome-blur border-t pb-safe"
      role="navigation"
      aria-label="Primary"
    >
      <div className="max-w-app mx-auto flex h-[64px]">
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
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 ${color} transition-colors duration-150 active:scale-95`}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute top-0 w-8 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-b-[3px]"
                />
              )}
              <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-semibold tracking-[0.02em]">{label}</span>

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
    </nav>
  );
});

export default Navigation;