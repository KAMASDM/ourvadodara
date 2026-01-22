// =============================================
// src/components/Layout/Navigation.jsx
// With Notification Badge Support
// =============================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Newspaper, User, AlertTriangle, LogIn } from 'lucide-react';
import { useEnhancedAuth } from '../../context/Auth/SimpleEnhancedAuth';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import logoImage from '../../assets/images/our-vadodara-logo.png.png';

const Navigation = ({ activeTab, setActiveTab, hasActiveSOS = false }) => {
  const { t } = useTranslation();
  const { user } = useEnhancedAuth();

  // Get unread notifications count
  const { data: notificationsObject } = useRealtimeData(
    user ? `notifications/${user.uid}` : null
  );

  const unreadCount = notificationsObject
    ? Object.values(notificationsObject).filter(n => !n.isRead).length
    : 0;

  const leftNavItems = [
    { id: 'home', icon: Home, label: t('home') },
    { id: 'roundup', icon: Newspaper, label: 'Roundup' },
  ];

  const rightNavItems = [
    { id: 'breaking', icon: AlertTriangle, label: 'Breaking' },
    user
      ? { id: 'profile', icon: User, label: t('profile', 'Profile') }
      : { id: 'profile', icon: LogIn, label: t('login', 'Login') }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-gray-950/85 border-t border-white/70 dark:border-gray-800/70 shadow-[0_-10px_30px_-20px_rgba(15,23,42,0.6)] overflow-x-hidden">
      <div className="max-w-md mx-auto overflow-x-hidden">
        <div className="flex items-center justify-between px-4 py-3 min-w-0">
          {/* Left Navigation Items */}
          <div className="flex gap-2 flex-shrink-0">
            {leftNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-all duration-200 ${
                    isActive
                      ? 'text-accent bg-accent/15 dark:bg-accent/20 shadow-inner'
                      : 'text-gray-600 dark:text-gray-400 hover:text-text-dark dark:hover:text-text-light hover:bg-gray-100/80 dark:hover:bg-gray-800/80'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'animate-pulse' : ''}`} />
                  <span className="text-[10px] font-medium uppercase tracking-wide">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Center Logo */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setActiveTab('home')}
              className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent/90 to-orange-500 text-white shadow-lg shadow-orange-500/40 transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="absolute inset-1 rounded-full bg-white dark:bg-white p-1">
                <img
                  src={logoImage}
                  alt="Our Vadodara"
                  className="h-full w-full rounded-full object-contain"
                />
              </div>
              {hasActiveSOS && (
                <>
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-ping" aria-hidden="true"></span>
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-600"></span>
                </>
              )}
            </button>
          </div>

          {/* Right Navigation Items */}
          <div className="flex gap-2 flex-shrink-0">
            {rightNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const showBadge = item.id === 'profile' && user && unreadCount > 0;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-all duration-200 ${
                    isActive
                      ? 'text-accent bg-accent/15 dark:bg-accent/20 shadow-inner'
                      : 'text-gray-600 dark:text-gray-400 hover:text-text-dark dark:hover:text-text-light hover:bg-gray-100/80 dark:hover:bg-gray-800/80'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${item.id === 'breaking' ? 'animate-pulse text-accent' : ''}`} />
                  <span className="text-[10px] font-medium uppercase tracking-wide">{item.label}</span>
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;