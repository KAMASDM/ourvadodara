// =============================================
// src/components/Layout/Header.jsx
// With Real-time Notification Badge
// =============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/Auth/AuthContext';
import { useEnhancedAuth } from '../../context/Auth/SimpleEnhancedAuth';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useCity } from '../../context/CityContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { LANGUAGES } from '../../utils/constants';
import { Globe, Bell, LogIn, MapPin, AlertCircle, Settings, X, Download, Flame } from 'lucide-react';
import Logo from '../Shared/Logo';
import PWAInstallButton from '../PWA/PWAInstallButton';
import ReadingStreak from '../Gamification/ReadingStreak';

const Header = ({ onNotificationClick, onLoginClick, onProfileClick }) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { currentCity, setCurrentCity, cities } = useCity();
  const { user } = useEnhancedAuth();
  const { profileCompletion } = useAuth();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Get unread notifications count
  const { data: notificationsObject } = useRealtimeData(
    user ? `notifications/${user.uid}` : null
  );

  const unreadCount = notificationsObject
    ? Object.values(notificationsObject).filter(n => !n.isRead).length
    : 0;
    
  const showIncompleteProfileBadge = user && !user.isAnonymous && !user.profileComplete && profileCompletion && !profileCompletion.isComplete;

  return (
    <>
      <header className="sticky top-0 z-50 bg-ivory-50/95 dark:bg-gray-950/80 backdrop-blur-xl border-b border-warmBrown-200 dark:border-gray-800/70 shadow-ivory overflow-x-hidden">
        <div className="max-w-md mx-auto px-4 py-3 overflow-x-hidden">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex-shrink-0">
              <Logo onClick={() => window.location.reload()} />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Settings/Menu Button */}
              <button
                onClick={() => setShowSettingsMenu(true)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-transparent bg-ivory-100 text-warmBrown-900 shadow-sm transition-colors duration-200 hover:border-warmBrown-300 hover:text-warmBrown-700 dark:bg-gray-900/70 dark:text-text-light dark:hover:border-gray-700"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Notifications */}
              <button
                onClick={onNotificationClick}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-transparent bg-ivory-100 text-warmBrown-900 shadow-sm transition-colors duration-200 hover:border-warmBrown-300 hover:text-warmBrown-700 dark:bg-gray-900/70 dark:text-text-light dark:hover:border-gray-700"
                aria-label={t('notifications', 'Notifications')}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-md">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 animate-ping opacity-75"></span>
                  </>
                )}
              </button>

              {/* Login or Profile Warning */}
              {!user ? (
                <button
                  onClick={onLoginClick}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent bg-ivory-100 text-warmBrown-900 shadow-sm transition-colors duration-200 hover:border-warmBrown-300 hover:text-warmBrown-700 dark:bg-gray-900/70 dark:text-text-light dark:hover:border-gray-700"
                  title={t('login', 'Login')}
                >
                  <LogIn className="w-4 h-4" />
                </button>
              ) : (
                showIncompleteProfileBadge && (
                  <button
                    onClick={onProfileClick}
                    className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 shadow-sm transition-colors duration-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
                    title="Complete your profile"
                  >
                    <AlertCircle className="w-4 h-4" />
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

      {/* Settings Menu Overlay */}
      {showSettingsMenu && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center sm:justify-center"
          onClick={() => setShowSettingsMenu(false)}
        >
          <div 
            className="bg-white dark:bg-gray-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl transform transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Settings
              </h3>
              <button
                onClick={() => setShowSettingsMenu(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Menu Content */}
            <div className="p-4 space-y-4">
              {/* City Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📍 City
                </label>
                <div className="relative">
                  <select
                    value={currentCity.id}
                    onChange={(e) => {
                      const newCity = cities.find((city) => city.id === e.target.value);
                      if (newCity) {
                        setCurrentCity(newCity);
                      }
                    }}
                    className="w-full appearance-none bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-base border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                  <MapPin className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🌐 Language
                </label>
                <div className="relative">
                  <select
                    value={currentLanguage}
                    onChange={(e) => changeLanguage(e.target.value)}
                    className="w-full appearance-none bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-base border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.nativeName}
                      </option>
                    ))}
                  </select>
                  <Globe className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Reading Streak */}
              {user && !user.isAnonymous && (
                <div className="pt-2">
                  <ReadingStreak compact={true} />
                </div>
              )}

              {/* PWA Install */}
              <div className="pt-2">
                <PWAInstallButton expanded={true} />
              </div>
            </div>

            {/* Close Button */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setShowSettingsMenu(false)}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;