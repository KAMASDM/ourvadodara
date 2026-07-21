// =============================================
// src/components/Layout/DesktopLayout.jsx
// Desktop Layout with Top Navigation
// =============================================
import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useAuth } from '../../context/Auth/AuthContext';
import { useCity } from '../../context/CityContext';
import SearchPage from '../../pages/Search/SearchPage';
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
  Briefcase,
  Laptop,
  Film,
  Trophy,
  Microscope,
  Heart,
  ChevronDown,
  Zap,
  Play,
  Calendar,
  Bookmark,
  X,
  Gift
} from 'lucide-react';
import logoImage from '../../assets/images/our-vadodara-logo.png.png';

const DesktopLayout = ({ children, currentView = {}, onNavigate = () => {} }) => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const { currentCity, setCurrentCity, cities } = useCity();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [headerBottom, setHeaderBottom] = useState(80);
  const headerRef = useRef(null);

  // The desktop header is content-sized, so a hard-coded popup offset can put
  // menus on top of it at shorter desktop resolutions, non-default zoom
  // levels, or with wider translated labels. Keep every detached popup below
  // the header's actual rendered edge instead.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;

    const updateHeaderBottom = () => {
      setHeaderBottom(Math.ceil(header.getBoundingClientRect().bottom));
    };

    updateHeaderBottom();
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateHeaderBottom)
      : null;
    observer?.observe(header);
    window.addEventListener('resize', updateHeaderBottom);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateHeaderBottom);
    };
  }, []);

  const popupTop = headerBottom + 8;

  const languages = [
    { code: 'en', nativeName: 'English' },
    { code: 'gu', nativeName: 'ગુજરાતી' },
    { code: 'hi', nativeName: 'हिंदी' }
  ];

  const navItems = [
    { key: 'home', label: { en: 'Home', gu: 'હોમ', hi: 'होम' }, icon: Home, view: 'home' },
    { key: 'breaking', label: { en: 'Breaking', gu: 'બ્રેકિંગ', hi: 'ब्रेकिंग' }, icon: Zap, view: 'breaking', badge: 'Live' },
    { key: 'reels', label: { en: 'Reels', gu: 'રીલ્સ', hi: 'रील्स' }, icon: Play, view: 'reels' },
    { key: 'events', label: { en: 'Events', gu: 'ઇવેન્ટ્સ', hi: 'इवेंट्स' }, icon: Calendar, view: 'events' }
    ,{ key: 'offers', label: { en: 'Offers', gu: 'ઓફર્સ', hi: 'ऑफ़र' }, icon: Gift, view: 'offers' }
  ];

  const categoryItems = [
    { key: 'local', label: { en: 'Local', gu: 'સ્થાનિક', hi: 'स्थानीय' }, icon: MapPin, category: 'local' },
    { key: 'india', label: { en: 'India', gu: 'ભારત', hi: 'भारत' }, icon: Newspaper, category: 'india' },
    { key: 'business', label: { en: 'Business', gu: 'વ્યાપાર', hi: 'व्यापार' }, icon: Briefcase, category: 'business' },
    { key: 'technology', label: { en: 'Tech', gu: 'ટેક', hi: 'तकनीक' }, icon: Laptop, category: 'technology' },
    { key: 'entertainment', label: { en: 'Entertainment', gu: 'મનોરંજન', hi: 'मनोरंजन' }, icon: Film, category: 'entertainment' },
    { key: 'sports', label: { en: 'Sports', gu: 'સ્પોર્ટ્સ', hi: 'खेल' }, icon: Trophy, category: 'sports' },
    { key: 'science', label: { en: 'Science', gu: 'વિજ્ઞાન', hi: 'विज्ञान' }, icon: Microscope, category: 'science' },
    { key: 'health', label: { en: 'Health', gu: 'આરોગ્ય', hi: 'स्वास्थ्य' }, icon: Heart, category: 'health' }
  ];

  const getPath = (view, data = null) => {
    if (view === 'home') return '/';
    if (view === 'category' && data?.category) return `/category/${data.category}`;
    if (view === 'notifications-settings') return '/notifications-settings';
    return `/${view}`;
  };

  const handleNavigation = (view, data = null) => {
    window.history.pushState({}, '', getPath(view, data));
    setShowUserMenu(false);
    setShowLanguageMenu(false);
    setShowCityMenu(false);
    setShowCategoryMenu(false);
    onNavigate({ type: view, data });
  };

  const toggleMenu = (menu) => {
    setShowUserMenu(menu === 'user' ? !showUserMenu : false);
    setShowLanguageMenu(menu === 'language' ? !showLanguageMenu : false);
    setShowCityMenu(menu === 'city' ? !showCityMenu : false);
    setShowCategoryMenu(menu === 'category' ? !showCategoryMenu : false);
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

  const activeCategory = categoryItems.find((item) => isActiveNav(item));
  const ActiveCategoryIcon = activeCategory?.icon || Newspaper;

  return (
    <div className="h-screen overflow-clip liquid-app-bg">
      <div className="flex h-screen min-w-0 flex-col">
        <header ref={headerRef} className="sticky top-0 z-50 px-4 pt-3">
          <div className="liquid-panel relative z-50 rounded-3xl px-4 py-3" style={{ overflow: 'visible' }}>
            <div className="flex min-w-0 items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => handleNavigation('home')}
                className="flex min-w-fit items-center gap-3 rounded-2xl px-2 py-1.5 text-left transition hover:bg-white/45 dark:hover:bg-white/10"
              >
                <img src={logoImage} alt="Our Vadodara" className="h-10 w-10 object-contain" />
                <div className="hidden xl:flex flex-col">
                  <span className="text-base font-bold text-slate-950 dark:text-white">Our Vadodara</span>
                  <span className="text-xs font-medium text-teal-700 dark:text-teal-300">Live city desk</span>
                </div>
              </button>

              <nav className="flex min-w-0 flex-1 flex-nowrap items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveNav(item);

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleNavigation(item.view)}
                      className={`inline-flex min-w-fit items-center justify-center gap-2 rounded-full px-2.5 py-2 text-sm font-semibold transition xl:px-3 ${
                        isActive
                          ? 'bg-white/75 text-blue-700 shadow-sm dark:bg-white/10 dark:text-sky-300'
                          : 'text-slate-700 hover:bg-white/45 dark:text-slate-300 dark:hover:bg-white/10'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden xl:inline">{item.label[currentLanguage]}</span>
                      {item.badge && (
                        <span className="hidden rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-white xl:inline">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="min-w-fit">
                  <button
                    type="button"
                    onClick={() => toggleMenu('category')}
                    className={`inline-flex w-10 items-center justify-center gap-2 rounded-full px-2.5 py-2 text-sm font-semibold transition xl:w-36 xl:px-3 ${
                      activeCategory
                        ? 'bg-white/75 text-blue-700 shadow-sm dark:bg-white/10 dark:text-sky-300'
                        : 'text-slate-700 hover:bg-white/45 dark:text-slate-300 dark:hover:bg-white/10'
                    }`}
                  >
                    <ActiveCategoryIcon className="h-4 w-4" />
                    <span className="hidden truncate xl:inline">{activeCategory ? activeCategory.label[currentLanguage] : 'Categories'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </nav>

              <div className="flex min-w-fit items-center gap-2">
                <div className="relative hidden lg:block">
                  <button
                    type="button"
                    onClick={() => toggleMenu('city')}
                    className="liquid-chip flex items-center gap-2 px-3 py-1.5 transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <span className="max-w-28 truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                      {currentCity?.name || 'Select City'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </button>

                  {showCityMenu && (
                    <>
                      {/* liquid-panel is intentionally NOT used here: its
                          position/overflow rules override .absolute and made
                          this dropdown expand the header in normal flow. */}
                      <div className="absolute right-0 top-full z-50 mt-6 max-h-64 w-48 overflow-y-auto rounded-2xl border border-white/70 bg-white/90 py-1 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/90">
                        {cities.map((city) => (
                          <button
                            key={city.id}
                            type="button"
                            onClick={() => {
                              setCurrentCity(city);
                              setShowCityMenu(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/50 dark:hover:bg-white/10 ${
                              currentCity?.id === city.id ? 'font-semibold text-blue-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {city.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowLanguageMenu(false);
                    setShowCityMenu(false);
                    setShowCategoryMenu(false);
                    setShowSearchOverlay(true);
                  }}
                  className="liquid-action rounded-2xl p-2 transition-colors"
                  title="Search"
                >
                  <Search className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleMenu('language')}
                    className="liquid-action rounded-2xl p-2 transition-colors"
                    title="Language"
                  >
                    <Globe className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </button>

                  {showLanguageMenu && (
                    <>
                      <div className="absolute right-0 top-full z-50 mt-6 w-40 rounded-2xl border border-white/70 bg-white/90 py-1 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/90">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              changeLanguage(lang.code);
                              setShowLanguageMenu(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-white/50 dark:hover:bg-white/10 ${
                              currentLanguage === lang.code ? 'font-medium text-blue-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {lang.nativeName}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  className="liquid-action relative rounded-2xl p-2 transition-colors"
                  onClick={() => handleNavigation('notifications-settings')}
                  title="Notifications"
                >
                  <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"></span>
                </button>

                {user ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleMenu('user')}
                      className="liquid-action flex items-center gap-2 rounded-2xl p-1.5 pr-3 transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
                        {user.displayName?.[0] || user.email?.[0] || 'U'}
                      </div>
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleNavigation('login')}
                    className="btn-primary !px-4 !py-2 !text-sm"
                  >
                    Sign in
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Click-away backdrops for the city/language dropdowns. They live
              outside the liquid-panel because its backdrop-filter turns it
              into the containing block for fixed descendants, which confined
              the old backdrops to the header area. The panel carries z-50 so
              it and its dropdowns stay above these z-40 backdrops. */}
          {showCityMenu && (
            <div className="fixed inset-0 z-40" onClick={() => setShowCityMenu(false)} />
          )}
          {showLanguageMenu && (
            <div className="fixed inset-0 z-40" onClick={() => setShowLanguageMenu(false)} />
          )}

          {showCategoryMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowCategoryMenu(false)} />
              <div
                className="fixed left-1/2 z-[60] grid w-72 -translate-x-1/2 grid-cols-2 gap-1 rounded-2xl border border-white/70 bg-white/85 p-2 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/85"
                style={{ top: popupTop }}
              >
                {categoryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveNav(item);

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleNavigation('category', { category: item.category })}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                        isActive
                          ? 'bg-blue-600 font-semibold text-white shadow-sm'
                          : 'text-slate-700 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-white/10'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label[currentLanguage]}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div
                className="fixed right-4 z-[60] w-60 rounded-2xl border border-white/70 bg-white/85 py-2 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/85"
                style={{ top: popupTop }}
              >
                <button
                  type="button"
                  onClick={() => handleNavigation('profile')}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigation('saved')}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  <Bookmark className="h-4 w-4" />
                  <span>Saved posts</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigation('settings')}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                <hr className="my-1 border-slate-200/70 dark:border-white/10" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-white/70 dark:text-red-400 dark:hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-6 pt-3">
          {children}
        </main>
      </div>

      {/* Search overlay — floats above the current page instead of replacing it */}
      {showSearchOverlay && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center px-4 pb-4"
          style={{ paddingTop: popupTop }}
        >
          <div
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setShowSearchOverlay(false)}
          />
          <div
            className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl shadow-slate-900/20 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/95"
            style={{ maxHeight: `calc(100vh - ${popupTop + 16}px)` }}
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-3 dark:border-white/10">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Search news</h2>
              <button
                type="button"
                onClick={() => setShowSearchOverlay(false)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SearchPage
                embedded
                onPostClick={(postId) => {
                  setShowSearchOverlay(false);
                  window.history.pushState({ view: 'news-detail', newsId: postId }, '', `/post/${postId}`);
                  onNavigate({ type: 'news-detail', data: { newsId: postId } });
                }}
                onShowReels={(reelId) => {
                  setShowSearchOverlay(false);
                  onNavigate({ type: 'reels', data: { reelId } });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesktopLayout;
