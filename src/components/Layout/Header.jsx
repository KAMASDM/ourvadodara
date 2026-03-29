// =============================================
// src/components/Layout/Header.jsx
// =============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/Auth/AuthContext';
import { useEnhancedAuth } from '../../context/Auth/SimpleEnhancedAuth';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useCity } from '../../context/CityContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { LANGUAGES } from '../../utils/constants';
import { Globe, Bell, LogIn, MapPin, AlertCircle, Settings, X, ChevronDown } from 'lucide-react';
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

  const { data: notificationsObject } = useRealtimeData(
    user ? `notifications/${user.uid}` : null
  );

  const unreadCount = notificationsObject
    ? Object.values(notificationsObject).filter(n => !n.isRead).length
    : 0;

  const showIncompleteProfileBadge =
    user && !user.isAnonymous && !user.profileComplete &&
    profileCompletion && !profileCompletion.isComplete;

  return (
    <>
      {/* ── Header bar ─────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between gap-2">

          {/* Left — Logo + city pill */}
          <div className="flex items-center gap-2 min-w-0">
            <Logo onClick={() => window.location.reload()} />

            {/* City selector pill */}
            <button
              onClick={() => setShowSettingsMenu(true)}
              className="flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors truncate max-w-[110px]"
            >
              <MapPin className="w-3 h-3 flex-shrink-0 text-accent" />
              <span className="truncate">{currentCity?.name || 'City'}</span>
              <ChevronDown className="w-3 h-3 flex-shrink-0" />
            </button>
          </div>

          {/* Right — action icons */}
          <div className="flex items-center gap-1">
            {/* Language toggle */}
            <button
              onClick={() => setShowSettingsMenu(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Language"
            >
              <Globe className="w-[18px] h-[18px]" />
            </button>

            {/* Notifications */}
            <button
              onClick={onNotificationClick}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label={t('notifications', 'Notifications')}
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-[7px] w-[7px] items-center justify-center rounded-full bg-accent ring-2 ring-white dark:ring-neutral-950" />
              )}
            </button>

            {/* Login / profile warning */}
            {!user ? (
              <button
                onClick={onLoginClick}
                className="flex h-9 items-center gap-1.5 rounded-full bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                title={t('login', 'Login')}
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">{t('login', 'Login')}</span>
              </button>
            ) : (
              showIncompleteProfileBadge && (
                <button
                  onClick={onProfileClick}
                  className="relative flex h-9 w-9 items-center justify-center rounded-full text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                  title="Complete your profile"
                >
                  <AlertCircle className="w-[18px] h-[18px]" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* ── Settings bottom sheet ───────────────────────────── */}
      {showSettingsMenu && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] flex items-end"
          onClick={() => setShowSettingsMenu(false)}
        >
          <div
            className="w-full bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Settings</h3>
              <button
                onClick={() => setShowSettingsMenu(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* City */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                  City
                </label>
                <div className="relative">
                  <select
                    value={currentCity.id}
                    onChange={(e) => {
                      const newCity = cities.find((city) => city.id === e.target.value);
                      if (newCity) setCurrentCity(newCity);
                    }}
                    className="w-full appearance-none bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                  <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                  Language
                </label>
                <div className="relative">
                  <select
                    value={currentLanguage}
                    onChange={(e) => changeLanguage(e.target.value)}
                    className="w-full appearance-none bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>{lang.nativeName}</option>
                    ))}
                  </select>
                  <Globe className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                </div>
              </div>

              {user && !user.isAnonymous && (
                <div className="pt-1">
                  <ReadingStreak compact={true} />
                </div>
              )}

              <PWAInstallButton expanded={true} />
            </div>

            <div className="px-5 pb-8 pt-1">
              <button
                onClick={() => setShowSettingsMenu(false)}
                className="w-full py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
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