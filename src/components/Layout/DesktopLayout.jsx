// =============================================
// src/components/Layout/DesktopLayout.jsx
// Modern Desktop Layout with Sidebar Navigation
// =============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useAuth } from '../../context/Auth/AuthContext';
import { useCity } from '../../context/CityContext';
import { 
  Search, 
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
    <div className="h-screen overflow-hidden flex liquid-app-bg">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen liquid-glass border-r border-white/60 dark:border-white/10 z-40 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo & Toggle */}
          <div className="p-4 border-b border-white/50 dark:border-white/10 flex items-center justify-between">
            {!sidebarCollapsed && (
              <div 
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => handleNavigation('home')}
              >
                <img src={logoImage} alt="Logo" className="h-10 w-10 object-contain" />
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-950 dark:text-white">Our Vadodara</span>
                  <span className="text-xs text-teal-700 dark:text-teal-300">Live city desk</span>
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                      isActive
                        ? 'bg-white/70 dark:bg-white/10 text-blue-700 dark:text-sky-300 shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white/45 dark:hover:bg-white/10'
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
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl transition-all ${
                          isActive
                            ? 'bg-white/70 dark:bg-white/10 text-blue-700 dark:text-sky-300 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-white/45 dark:hover:bg-white/10'
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
            <div className="p-3 border-t border-white/50 dark:border-white/10">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full liquid-action flex items-center gap-3 p-2 rounded-2xl transition-colors relative"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {user.displayName?.[0] || user.email?.[0] || 'U'}
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 text-left overflow-hidden">
                  <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
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
                    <div className="absolute bottom-16 left-4 w-56 liquid-panel rounded-2xl py-2 z-50">
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
      <div className={`flex-1 flex h-screen min-w-0 flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 px-5 pt-4">
          <div className="liquid-panel rounded-3xl px-4 py-3 flex items-center justify-between gap-4">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="liquid-action p-2 rounded-2xl transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>

              {/* City Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowCityMenu(!showCityMenu)}
                  className="liquid-chip flex items-center gap-2 px-3 py-1.5 transition-colors"
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
                    <div className="absolute left-0 top-full mt-2 w-48 liquid-panel rounded-2xl py-1 z-50 max-h-64 overflow-y-auto">
                      {cities.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => {
                            setCurrentCity(city);
                            setShowCityMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-white/50 dark:hover:bg-white/10 transition-colors ${
                            currentCity?.id === city.id ? 'text-blue-700 dark:text-sky-300 font-semibold' : 'text-gray-700 dark:text-gray-300'
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
                className="liquid-action p-2 rounded-2xl transition-colors"
              >
                <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Language */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="liquid-action p-2 rounded-2xl transition-colors"
                >
                  <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>

                {showLanguageMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLanguageMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-40 liquid-panel rounded-2xl py-1 z-50">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            changeLanguage(lang.code);
                            setShowLanguageMenu(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-white/50 dark:hover:bg-white/10 transition-colors ${
                            currentLanguage === lang.code ? 'text-blue-700 dark:text-sky-300 font-medium' : 'text-gray-700 dark:text-gray-300'
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
                className="liquid-action relative p-2 rounded-2xl transition-colors"
                onClick={() => handleNavigation('notifications')}
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Sign In Button (if not logged in) */}
              {!user && (
                <button
                  onClick={() => handleNavigation('login')}
                  className="ml-2 btn-primary !px-4 !py-2 !text-sm"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-5 pb-6 pt-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DesktopLayout;
