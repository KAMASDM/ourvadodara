// =============================================
// src/components/Layout/Header.jsx
// Modernized header — frosted chrome, logo tile,
// location/weather inline, search, lang, notif.
// =============================================
import React, { memo, useCallback } from 'react';
import { Search, Bell, Globe, MapPin } from 'lucide-react';
import Logo from '../Shared/Logo';

const Header = memo(function Header({
  onSearchClick,
  onLangClick,
  onNotifClick,
  unreadCount = 0,
  weather, // { temp: 32, desc: 'Sunny' }
  city = 'Vadodara',
}) {
  const bellBadge = unreadCount > 9 ? '9+' : unreadCount > 0 ? String(unreadCount) : null;

  const handleKey = useCallback((e, fn) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn?.(); }
  }, []);

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 chrome-blur border-b h-header pt-safe"
      role="banner"
    >
      <div className="max-w-app mx-auto h-full px-4 flex items-center gap-2.5">
        <Logo size="sm" />
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold leading-tight truncate">Our Vadodara</h1>
          <div className="flex items-center gap-1 text-2xs text-neutral-500 dark:text-neutral-400 font-medium">
            <MapPin className="w-3 h-3" strokeWidth={2.2} />
            <span className="truncate">{city}</span>
            {weather?.temp != null && (
              <>
                <span aria-hidden>·</span>
                <span className="truncate">{weather.temp}° {weather.desc}</span>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          className="btn-icon"
          aria-label="Search"
          onClick={onSearchClick}
          onKeyDown={(e) => handleKey(e, onSearchClick)}
        >
          <Search className="w-5 h-5" strokeWidth={2} />
        </button>
        <button
          type="button"
          className="btn-icon"
          aria-label="Language"
          onClick={onLangClick}
          onKeyDown={(e) => handleKey(e, onLangClick)}
        >
          <Globe className="w-5 h-5" strokeWidth={2} />
        </button>
        <button
          type="button"
          className="btn-icon"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
          onClick={onNotifClick}
          onKeyDown={(e) => handleKey(e, onNotifClick)}
        >
          <Bell className="w-5 h-5" strokeWidth={2} />
          {bellBadge && (
            <span
              className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-danger-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900"
              aria-hidden
            >
              {bellBadge}
            </span>
          )}
        </button>
      </div>
    </header>
  );
});

export default Header;
