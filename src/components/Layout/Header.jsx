// =============================================
// src/components/Layout/Header.jsx
// =============================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useEnhancedAuth } from '../../context/Auth/SimpleEnhancedAuth';
import { useTheme } from '../../context/Theme/ThemeContext';
import { useLanguage } from '../../context/Language/LanguageContext';
import { LANGUAGES } from '../../utils/constants';
import { Sun, Moon, Globe, Bell, LogIn, LogOut } from 'lucide-react';
import Logo from '../Shared/Logo'; // Import the new Logo component
import PWAInstallButton from '../PWA/PWAInstallButton';

const Header = ({ onNotificationClick, onLoginClick }) => {
  const { t } = useTranslation();
  const { toggleTheme, isDark } = useTheme();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { user, logout, isAnonymous } = useEnhancedAuth();

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-bg-card-dark border-b border-border-light dark:border-border-dark shadow-md">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Logo onClick={() => window.location.reload()} />

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Language Selector */}
            <div className="relative">
              <select
                value={currentLanguage}
                onChange={(e) => changeLanguage(e.target.value)}
                className="appearance-none bg-transparent text-text-dark dark:text-text-light text-sm border border-border-light dark:border-border-dark rounded-lg px-2 py-1 pr-6 focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-white dark:bg-bg-card-dark">
                    {lang.nativeName}
                  </option>
                ))}
              </select>
              <Globe className="absolute right-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
            </div>

            {/* Notifications */}
            <button
              onClick={onNotificationClick}
              className="relative p-2 text-text-dark dark:text-text-light hover:bg-surface-light dark:hover:bg-surface-dark rounded-lg transition-colors duration-200"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-white dark:border-bg-card-dark"></span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-text-dark dark:text-text-light hover:bg-surface-light dark:hover:bg-surface-dark rounded-lg transition-colors duration-200"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Login/Logout Buttons */}
            {user ? (
              <button
                onClick={async () => {
                  try {
                    await logout();
                  } catch (error) {
                    console.error('Logout failed:', error);
                  }
                }}
                className="p-2 text-text-dark dark:text-text-light hover:bg-surface-light dark:hover:bg-surface-dark rounded-lg transition-colors duration-200"
                title={t('logout', 'Logout')}
              >
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={onLoginClick}
                className="p-2 text-text-dark dark:text-text-light hover:bg-surface-light dark:hover:bg-surface-dark rounded-lg transition-colors duration-200"
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