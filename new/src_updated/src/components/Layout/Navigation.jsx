// =============================================
// src/components/Layout/Navigation.jsx
// Modernized bottom tab bar — 5 tabs, active pill,
// icon-only on small, keyboard accessible, safe-area.
// =============================================
import React, { memo } from 'react';
import { Home, Newspaper, PlayCircle, AlertTriangle, User } from 'lucide-react';

const TABS = [
  { id: 'home',     label: 'Home',     Icon: Home },
  { id: 'roundup',  label: 'Roundup',  Icon: Newspaper },
  { id: 'reels',    label: 'Reels',    Icon: PlayCircle },
  { id: 'breaking', label: 'Breaking', Icon: AlertTriangle, alert: true },
  { id: 'profile',  label: 'Profile',  Icon: User },
];

const Navigation = memo(function Navigation({ activeTab = 'home', onTabChange }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 chrome-blur border-t pb-safe"
      role="navigation"
      aria-label="Primary"
    >
      <div className="max-w-app mx-auto flex h-tabbar">
        {TABS.map(({ id, label, Icon, alert }) => {
          const active = activeTab === id;
          const color = active
            ? 'text-primary-600 dark:text-primary-400'
            : alert
              ? 'text-accent-500'
              : 'text-neutral-500 dark:text-neutral-400';
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange?.(id)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 ${color} transition-colors duration-150 active:scale-95`}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute top-0 w-8 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-b-[3px]"
                />
              )}
              <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-semibold tracking-[0.02em]">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});

export default Navigation;
