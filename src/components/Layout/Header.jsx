// =============================================
// src/components/Layout/Header.jsx
// =============================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/Auth/AuthContext';
import { useTheme } from '../../context/Theme/ThemeContext';
import { useLanguage } from '../../context/Language/LanguageContext';
import { LANGUAGES } from '../../utils/constants';
import { Sun, Moon, Globe, Bell, User, LogIn } from 'lucide-react';
import Logo from '../Shared/Logo'; // Import the new Logo component

const Header = ({ onNotificationClick, onLoginClick }) => {
  const { t } = useTranslation();
  const { toggleTheme, isDark } = useTheme();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const userMenuRef = React.useRef(null);

  // Close user menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleUserMenuClick = () => {
    if (user) {
      setShowUserMenu(!showUserMenu);
    } else {
      onLoginClick();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-bg-light dark:bg-bg-dark border-b border-border-light dark:border-border-dark shadow-sm">
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
                className="appearance-none bg-transparent text-text-dark dark:text-text-light text-sm border border-border-light dark:border-border-dark rounded-lg px-2 py-1 pr-6 focus:outline-none focus:ring-1 focus:ring-primary-red"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-bg-light dark:bg-bg-dark">
                    {lang.nativeName}
                  </option>
                ))}
              </select>
              <Globe className="absolute right-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
            </div>

            {/* Notifications */}
            <button
              onClick={onNotificationClick}
              className="relative p-2 text-text-dark dark:text-text-light hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent-red rounded-full border-2 border-bg-light dark:border-bg-dark"></span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-text-dark dark:text-text-light hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={handleUserMenuClick}
                className="p-2 text-text-dark dark:text-text-light hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {user ? <User className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              </button>
              
              {/* User Dropdown Menu */}
              {user && showUserMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName || 'User'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await logout();
                        setShowUserMenu(false);
                      } catch (error) {
                        console.error('Logout failed:', error);
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('logout', 'Logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;