// =============================================
// src/components/Layout/DesktopLayout.jsx
// Google News-style Desktop Layout with Horizontal Navigation
// =============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useTheme } from '../../context/Theme/ThemeContext';
import { useAuth } from '../../context/Auth/AuthContext';
import { 
  Search, 
  Sun, 
  Moon, 
  Globe, 
  User, 
  Settings,
  Bell,
  LogOut,
  ChevronDown
} from 'lucide-react';
import logoImage from '../../assets/images/our-vadodara-logo.png.png';
import { categoryData } from '../../data/categories';

const DesktopLayout = ({ children, currentView = {}, onNavigate = () => {} }) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' }
  ];

  // Navigation items with categories
  const navCategories = [
    { key: 'foryou', label: { en: 'For you', gu: 'તમારા માટે', hi: 'आपके लिए' }, view: 'home' },
    { key: 'headlines', label: { en: 'Headlines', gu: 'હેડલાઇન્સ', hi: 'हेडलाइंस' }, view: 'headlines' },
    { key: 'local', label: { en: 'Local', gu: 'સ્થાનિક', hi: 'स्थानीय' }, category: 'local' },
    { key: 'india', label: { en: 'India', gu: 'ભારત', hi: 'भारत' }, category: 'india' },
    { key: 'world', label: { en: 'World', gu: 'વિશ્વ', hi: 'विश्व' }, category: 'world' },
    { key: 'business', label: { en: 'Business', gu: 'વ્યાપાર', hi: 'व्यापार' }, category: 'business' },
    { key: 'technology', label: { en: 'Technology', gu: 'ટેકનોલોજી', hi: 'तकनीक' }, category: 'technology' },
    { key: 'entertainment', label: { en: 'Entertainment', gu: 'મનોરંજન', hi: 'मनोरंजन' }, category: 'entertainment' },
    { key: 'sports', label: { en: 'Sports', gu: 'રમતગમત', hi: 'खेल' }, category: 'sports' },
    { key: 'science', label: { en: 'Science', gu: 'વિજ્ઞાન', hi: 'विज्ञान' }, category: 'science' },
    { key: 'health', label: { en: 'Health', gu: 'આરોગ્ય', hi: 'स्वास्थ्य' }, category: 'health' },
  ];

  const handleNavigation = (view, data = null) => {
    window.history.pushState({}, '', view === 'home' ? '/' : `/${view}`);
    onNavigate({ type: view, data });
  };

  const handleNavClick = (item) => {
    if (item.category) {
      handleNavigation('category', { category: item.category });
    } else {
      handleNavigation(item.view);
    }
  };

  const handleLogout = async () => {
    await logout();
    handleNavigation('home');
  };

  const isActiveNav = (item) => {
    if (item.view === 'home' && currentView?.type === 'home') return true;
    if (item.view === 'headlines' && currentView?.type === 'headlines') return true;
    if (item.category && currentView?.type === 'category' && currentView?.data?.category === item.category) return true;
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Top Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="px-6 py-3 flex items-center gap-8">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer flex-shrink-0"
            onClick={() => handleNavigation('home')}
          >
            <img src={logoImage} alt="Our Vadodara" className="h-8 w-8 object-contain" />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-normal text-gray-700 dark:text-gray-300">Our Vadodara</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">News</span>
            </div>
          </div>

          {/* Horizontal Navigation */}
          <nav className="flex gap-6 flex-1 overflow-x-auto scrollbar-hide">
            {navCategories.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item)}
                className={`text-sm px-3 py-2 rounded whitespace-nowrap transition-colors ${
                  isActiveNav(item)
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {item.label[currentLanguage]}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Search */}
            <button
              onClick={() => handleNavigation('search')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <Globe className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>

              {showLanguageMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowLanguageMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          changeLanguage(lang.code);
                          setShowLanguageMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          currentLanguage === lang.code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {lang.nativeName}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Notifications */}
            <button
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              onClick={() => handleNavigation('notifications')}
            >
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {user.displayName?.[0] || user.email?.[0] || 'U'}
                  </div>
                </button>

                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="font-medium text-gray-900 dark:text-white text-sm">{user.displayName || 'User'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                      <button
                        onClick={() => { handleNavigation('profile'); setShowUserMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={() => { handleNavigation('settings'); setShowUserMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={() => { handleLogout(); setShowUserMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleNavigation('login')}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-full font-medium transition-colors"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default DesktopLayout;
