// =============================================
// src/components/Layout/Navigation.jsx
// =============================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Newspaper, User, AlertTriangle, LogIn, Clapperboard } from 'lucide-react';
import { useEnhancedAuth } from '../../context/Auth/SimpleEnhancedAuth';
import { useRealtimeData } from '../../hooks/useRealtimeData';

const Navigation = ({ activeTab, setActiveTab, hasActiveSOS = false }) => {
  const { t } = useTranslation();
  const { user } = useEnhancedAuth();

  const { data: notificationsObject } = useRealtimeData(
    user ? `notifications/${user.uid}` : null
  );

  const unreadCount = notificationsObject
    ? Object.values(notificationsObject).filter(n => !n.isRead).length
    : 0;

  const navItems = [
    { id: 'home',     icon: Home,         iconFilled: Home,         label: t('home') },
    { id: 'roundup',  icon: Newspaper,    iconFilled: Newspaper,    label: 'Roundup' },
    { id: 'reels',    icon: Clapperboard, iconFilled: Clapperboard, label: 'Reels' },
    { id: 'breaking', icon: AlertTriangle, iconFilled: AlertTriangle, label: 'Breaking' },
    user
      ? { id: 'profile', icon: User, iconFilled: User, label: t('profile', 'Profile'), badge: unreadCount }
      : { id: 'profile', icon: LogIn, iconFilled: LogIn, label: t('login', 'Login') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800">
      <div className="max-w-md mx-auto">
        <div className="flex items-stretch h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isBreaking = item.id === 'breaking';

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors duration-150"
              >
                {/* Active indicator pill above icon */}
                <span
                  className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-b-full transition-all duration-200 ${
                    isActive ? 'bg-primary-600' : 'bg-transparent'
                  }`}
                />

                {/* Icon */}
                <span className={`transition-colors duration-150 ${
                  isActive
                    ? 'text-primary-600'
                    : isBreaking
                    ? 'text-accent'
                    : 'text-neutral-400 dark:text-neutral-500'
                }`}>
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </span>

                {/* Label */}
                <span className={`text-[10px] font-medium tracking-wide transition-colors duration-150 ${
                  isActive
                    ? 'text-primary-600'
                    : isBreaking
                    ? 'text-accent'
                    : 'text-neutral-400 dark:text-neutral-500'
                }`}>
                  {item.label}
                </span>

                {/* Notification badge */}
                {item.badge > 0 && (
                  <span className="absolute top-2 right-[calc(50%-14px)] h-4 w-4 flex items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}

                {/* SOS indicator */}
                {item.id === 'home' && hasActiveSOS && (
                  <span className="absolute top-2 right-[calc(50%-14px)] h-2 w-2 rounded-full bg-danger animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;