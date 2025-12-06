// =============================================
// src/components/Layout/DesktopLayout.jsx
// Modern Desktop Layout with Sidebar Navigation
// =============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useTheme } from '../../context/Theme/ThemeContext';
import { useAuth } from '../../context/Auth/AuthContext';
import { useCity } from '../../context/CityContext';
import { 
  Search, 
  Sun, 
  Moon, 
  Globe, 
  User, 
  Settings,
  Bell,
  LogOut,
  Home,
  Newspaper,
  MapPin,
  TrendingUp,
  Briefcase,
  Laptop,
  Film,
  Trophy,
  Microscope,
  Heart,
  Menu,
  X,
  ChevronRight,
  Zap,
  Play,
  Calendar,
  BarChart3
} from 'lucide-react';
import logoImage from '../../assets/images/our-vadodara-logo.png.png';

const DesktopLayout = ({ children, currentView = {}, onNavigate = () => {} }) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { currentCity, setCurrentCity, cities } = useCity();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' }
  ];

  // Navigation items with icons
  const navItems = [
    { 
      key: 'home', 
      label: { en: 'Home', gu: 'હોમ', hi: 'होम' }, 
      icon: Home, 
      view: 'home',
      badge: null
    },
    { 
      key: 'breaking', 
      label: { en: 'Breaking', gu: 'બ્રેકિંગ', hi: 'ब्रेकिंग' }, 
      icon: Zap, 
      view: 'breaking',
      badge: 'live',
      badgeColor: 'bg-red-500'
    },
    { 
      key: 'reels', 
      label: { en: 'Reels', gu: 'રીલ્સ', hi: 'रील्स' }, 
      icon: Play, 
      view: 'reels',
      badge: null
    },
    { 
      key: 'events', 
      label: { en: 'Events', gu: 'ઇવેન્ટ્સ', hi: 'इवेंट्स' }, 
      icon: Calendar, 
      view: 'events',
      badge: null
    },
  ];

  const categoryItems = [
    { key: 'local', label: { en: 'Local', gu: 'સ્થાનિક', hi: 'स्थानीय' }, icon: MapPin, category: 'local' },
    { key: 'india', label: { en: 'India', gu: 'ભારત', hi: 'भारत' }, icon: Newspaper, category: 'india' },
    { key: 'business', label: { en: 'Business', gu: 'વ્યાપાર', hi: 'व्यापार' }, icon: Briefcase, category: 'business' },
    { key: 'technology', label: { en: 'Tech', gu: 'ટેક', hi: 'तकनीक' }, icon: Laptop, category: 'technology' },
    { key: 'entertainment', label: { en: 'Entertainment', gu: 'મનોરંજન', hi: 'मनोरंजन' }, icon: Film, category: 'entertainment' },
    { key: 'sports', label: { en: 'Sports', gu: 'સ્પોર્ટ્સ', hi: 'खेल' }, icon: Trophy, category: 'sports' },
    { key: 'science', label: { en: 'Science', gu: 'વિજ્ઞાન', hi: 'विज्ञान' }, icon: Microscope, category: 'science' },
    { key: 'health', label: { en: 'Health', gu: 'આરોગ્ય', hi: 'स्वास्थ्य' }, icon: Heart, category: 'health' },
  ];

  const handleNavigation = (view, data = null) => {
    window.history.pushState({}, '', view === 'home' ? '/' : `/${view}`);
    onNavigate({ type: view, data });
  };

  const handleNavClick = (item) => {
    if (item.category) {
      handleNavigation('category', { category: item.category });
    } else if (item.view) {
      handleNavigation(item.view);
    }
  };

  const handleLogout = async () => {
    await logout();
    handleNavigation('home');
    setShowUserMenu(false);
  };

  const isActiveNav = (item) => {
    if (item.view && currentView?.type === item.view) return true;
    if (item.category && currentView?.type === 'category' && currentView?.data?.category === item.category) return true;
    return false;
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo & Toggle */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            {!sidebarCollapsed && (
              <div 
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => handleNavigation('home')}
              >
                <img src={logoImage} alt="Logo" className="h-10 w-10 object-contain" />
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Our Vadodara</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">News Platform</span>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <img 
                src={logoImage} 
                alt="Logo" 
                className="h-8 w-8 object-contain mx-auto cursor-pointer"
                onClick={() => handleNavigation('home')}
              />
            )}
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveNav(item);
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="text-sm font-medium flex-1 text-left">{item.label[currentLanguage]}</span>
                        {item.badge && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${item.badgeColor} text-white font-semibold uppercase`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Categories */}
            {!sidebarCollapsed && (
              <>
                <div className="px-4 pt-4 pb-2">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Categories
                  </h3>
                </div>
                <div className="space-y-1 px-2">
                  {categoryItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActiveNav(item);
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleNavClick(item)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{item.label[currentLanguage]}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </nav>

          {/* User Section */}
          {user && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {user.displayName?.[0] || user.email?.[0] || 'U'}
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.displayName || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </div>
                  </div>
                )}
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-50" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute bottom-16 left-4 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
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
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
          <div className="px-6 py-3 flex items-center justify-between gap-4">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>

              {/* City Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowCityMenu(!showCityMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {currentCity?.name || 'Select City'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>

                {showCityMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowCityMenu(false)} />
                    <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 max-h-64 overflow-y-auto">
                      {cities.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => {
                            setCurrentCity(city);
                            setShowCityMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                            currentCity?.id === city.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {city.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => handleNavigation('search')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Language */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>

                {showLanguageMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLanguageMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            changeLanguage(lang.code);
                            setShowLanguageMenu(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                            currentLanguage === lang.code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {lang.nativeName}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {/* Notifications */}
              <button
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                onClick={() => handleNavigation('notifications')}
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Sign In Button (if not logged in) */}
              {!user && (
                <button
                  onClick={() => handleNavigation('login')}
                  className="ml-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DesktopLayout;
