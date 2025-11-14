// =============================================
// src/components/Layout/Header.jsx
// With Real-time Notification Badge
// =============================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/Auth/AuthContext';
import { useEnhancedAuth } from '../../context/Auth/SimpleEnhancedAuth';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useCity } from '../../context/CityContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { LANGUAGES } from '../../utils/constants';
import { Globe, Bell, LogIn, MapPin, AlertCircle } from 'lucide-react';
import Logo from '../Shared/Logo';
import PWAInstallButton from '../PWA/PWAInstallButton';

const Header = ({ onNotificationClick, onLoginClick, onProfileClick }) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { currentCity, setCurrentCity, cities } = useCity();
  const { user } = useEnhancedAuth();
  const { profileCompletion } = useAuth();

  // Get unread notifications count
  const { data: notificationsObject } = useRealtimeData(
    user ? `notifications/${user.uid}` : null
  );

  const unreadCount = notificationsObject
    ? Object.values(notificationsObject).filter(n => !n.isRead).length
    : 0;
    
  const showIncompleteProfileBadge = user && !user.isAnonymous && !user.profileComplete && profileCompletion && !profileCompletion.isComplete;

  return (
    <header className="sticky top-0 z-50 bg-ivory-50/95 dark:bg-gray-950/80 backdrop-blur-xl border-b border-warmBrown-200 dark:border-gray-800/70 shadow-ivory">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Logo onClick={() => window.location.reload()} />

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={currentCity.id}
                onChange={(e) => {
                  const newCity = cities.find((city) => city.id === e.target.value);
                  if (newCity) {
                    setCurrentCity(newCity);
                  }
                }}
                className="appearance-none bg-ivory-100 dark:bg-gray-900/70 text-warmBrown-900 dark:text-text-light text-sm border border-warmBrown-200 dark:border-gray-700 rounded-xl px-3 py-2 pr-7 shadow-sm focus:outline-none focus:ring-2 focus:ring-warmBrown-400"
                aria-label="Select city"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id} className="bg-white dark:bg-bg-card-dark">
                    {city.name}
                  </option>
                ))}
              </select>
              <MapPin className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-warmBrown-600" />
            </div>

            <div className="relative">
              <select
                value={currentLanguage}
                onChange={(e) => changeLanguage(e.target.value)}
                className="appearance-none bg-ivory-100 dark:bg-gray-900/70 text-warmBrown-900 dark:text-text-light text-sm border border-warmBrown-200 dark:border-gray-700 rounded-xl px-3 py-2 pr-7 shadow-sm focus:outline-none focus:ring-2 focus:ring-warmBrown-400"
                aria-label="Select language"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-white dark:bg-bg-card-dark">
                    {lang.nativeName}
                  </option>
                ))}
              </select>
              <Globe className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-warmBrown-600" />
            </div>

            <button
              onClick={onNotificationClick}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-ivory-100 text-warmBrown-900 shadow-sm transition-colors duration-200 hover:border-warmBrown-300 hover:text-warmBrown-700 dark:bg-gray-900/70 dark:text-text-light dark:hover:border-gray-700"
              aria-label={t('notifications', 'Notifications')}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-md">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 animate-ping opacity-75"></span>
                </>
              )}
            </button>

            <PWAInstallButton />

            {!user ? (
              <button
                onClick={onLoginClick}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-ivory-100 text-warmBrown-900 shadow-sm transition-colors duration-200 hover:border-warmBrown-300 hover:text-warmBrown-700 dark:bg-gray-900/70 dark:text-text-light dark:hover:border-gray-700"
                title={t('login', 'Login')}
              >
                <LogIn className="w-5 h-5" />
              </button>
            ) : (
              showIncompleteProfileBadge && (
                <button
                  onClick={onProfileClick}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 shadow-sm transition-colors duration-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
                  title="Complete your profile"
                >
                  <AlertCircle className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;