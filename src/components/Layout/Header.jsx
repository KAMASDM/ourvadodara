// =============================================
// src/components/Layout/Header.jsx
// Modernized header — frosted chrome, logo tile,
// city pill, language, notifications, auth button.
// =============================================
import React, { memo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/Auth/AuthContext';
import { useEnhancedAuth } from '../../context/Auth/SimpleEnhancedAuth';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useCity } from '../../context/CityContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { LANGUAGES } from '../../utils/constants';
import { Globe, Bell, LogIn, MapPin, AlertCircle, X, ChevronDown } from 'lucide-react';
import Logo from '../Shared/Logo';
import PWAInstallButton from '../PWA/PWAInstallButton';
import ReadingStreak from '../Gamification/ReadingStreak';

const Header = memo(function Header({ onNotificationClick, onNotifClick, onLoginClick, onProfileClick }) {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { currentCity, setCurrentCity, cities } = useCity();
  const { user } = useEnhancedAuth();
  const { profileCompletion } = useAuth();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const handleNotifClick = onNotifClick || onNotificationClick;

  const { data: notificationsObject } = useRealtimeData(
    user ? `notifications/${user.uid}` : null
  );

  const unreadCount = notificationsObject
    ? Object.values(notificationsObject).filter(n => !n.isRead).length
    : 0;

  const bellBadge = unreadCount > 9 ? '9+' : unreadCount > 0 ? String(unreadCount) : null;

  const showIncompleteProfileBadge =
    user && !user.isAnonymous && !user.profileComplete &&
    profileCompletion && !profileCompletion.isComplete;

  const closeSheet = useCallback(() => setShowSettingsMenu(false), []);

  return (
    <>
      {/* ── Header bar ─────────────────────────────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-50 chrome-blur border-b pt-safe"
        style={{ height: 'calc(56px + env(safe-area-inset-top))' }}
        role="banner"
      >
        <div className="max-w-app mx-auto h-[56px] px-4 flex items-center gap-2">

          {/* Left — Logo + city pill */}
          <Logo size="sm" onClick={() => window.location.reload()} />

          <button
            type="button"
            onClick={() => setShowSettingsMenu(true)}
            className="flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors truncate max-w-[110px]"
            aria-label="Select city"
          >
            <MapPin className="w-3 h-3 flex-shrink-0 text-accent-500" />
            <span className="truncate">{currentCity?.name || 'City'}</span>
            <ChevronDown className="w-3 h-3 flex-shrink-0" />
          </button>

          <div className="flex-1" />

          {/* Right — action icons */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setShowSettingsMenu(true)}
              className="btn-icon"
              aria-label="Language"
            >
              <Globe className="w-5 h-5" strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={handleNotifClick}
              className="btn-icon"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            >
              <Bell className="w-5 h-5" strokeWidth={2} />
              {bellBadge ? (
                <span
                  className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-danger-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900"
                  aria-hidden
                >
                  {bellBadge}
                </span>
              ) : unreadCount > 0 ? (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full ring-2 ring-white dark:ring-neutral-900" aria-hidden />
              ) : null}
            </button>

            {!user ? (
              <button
                type="button"
                onClick={onLoginClick}
                className="btn btn-primary !px-3 !py-2 !text-sm ml-1"
                title={t('login', 'Login')}
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">{t('login', 'Login')}</span>
              </button>
            ) : showIncompleteProfileBadge ? (
              <button
                type="button"
                onClick={onProfileClick}
                className="btn-icon text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                title="Complete your profile"
              >
                <AlertCircle className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400 animate-ping" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* ── Settings bottom sheet ───────────────────────────── */}
      {showSettingsMenu && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] flex items-end"
          onClick={closeSheet}
        >
          <div
            className="w-full bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-base font-semibold">Settings</h3>
              <button type="button" onClick={closeSheet} className="btn-icon !w-8 !h-8" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="eyebrow mb-2 block">City</label>
                <div className="relative">
                  <select
                    value={currentCity?.id}
                    onChange={(e) => {
                      const newCity = cities.find((city) => city.id === e.target.value);
                      if (newCity) setCurrentCity(newCity);
                    }}
                    className="input-field appearance-none pr-10"
                  >
                    {cities?.map((city) => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                  <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                </div>
              </div>

              <div>
                <label className="eyebrow mb-2 block">Language</label>
                <div className="relative">
                  <select
                    value={currentLanguage}
                    onChange={(e) => changeLanguage(e.target.value)}
                    className="input-field appearance-none pr-10"
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
                type="button"
                onClick={closeSheet}
                className="btn-primary w-full py-3"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default Header;