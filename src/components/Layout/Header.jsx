// =============================================
// src/components/Layout/Header.jsx
// =============================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useEnhancedAuth } from '../../context/Auth/SimpleEnhancedAuth';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useCity } from '../../context/CityContext';
import { LANGUAGES } from '../../utils/constants';
import { Globe, Bell, LogIn, MapPin } from 'lucide-react';
import Logo from '../Shared/Logo';
import PWAInstallButton from '../PWA/PWAInstallButton';

const Header = ({ onNotificationClick, onLoginClick }) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { currentCity, setCurrentCity, cities } = useCity();
  const { user } = useEnhancedAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/80 backdrop-blur-xl border-b border-white/60 dark:border-gray-800/70 shadow-[0_10px_30px_-15px_rgba(15,23,42,0.45)]">
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
                className="appearance-none bg-white/70 dark:bg-gray-900/70 text-text-dark dark:text-text-light text-sm border border-white/70 dark:border-gray-700 rounded-xl px-3 py-2 pr-7 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
                aria-label="Select city"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id} className="bg-white dark:bg-bg-card-dark">
                    {city.name}
                  </option>
                ))}
              </select>
              <MapPin className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500" />
            </div>

            <div className="relative">
              <select
                value={currentLanguage}
                onChange={(e) => changeLanguage(e.target.value)}
                className="appearance-none bg-white/70 dark:bg-gray-900/70 text-text-dark dark:text-text-light text-sm border border-white/70 dark:border-gray-700 rounded-xl px-3 py-2 pr-7 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
                aria-label="Select language"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-white dark:bg-bg-card-dark">
                    {lang.nativeName}
                  </option>
                ))}
              </select>
              <Globe className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500" />
            </div>

            <button
              onClick={onNotificationClick}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-white/60 text-text-dark shadow-sm transition-colors duration-200 hover:border-white hover:text-accent dark:bg-gray-900/70 dark:text-text-light dark:hover:border-gray-700"
              aria-label={t('notifications', 'Notifications')}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-accent dark:border-gray-900"></span>
            </button>

            <PWAInstallButton />

            {!user && (
              <button
                onClick={onLoginClick}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-white/60 text-text-dark shadow-sm transition-colors duration-200 hover:border-white hover:text-accent dark:bg-gray-900/70 dark:text-text-light dark:hover:border-gray-700"
                title={t('login', 'Login')}
              >
                <LogIn className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;