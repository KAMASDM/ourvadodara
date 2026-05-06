// =============================================
// src/pages/Profile/ProfilePage.jsx
// Profile — avatar, streak flame, saved posts,
// reactions history, preferences, sign out.
// =============================================
import React, { memo, useState, useMemo } from 'react';
import { Bookmark, Heart, Clock, Settings, LogOut, Bell, Moon, Globe, ChevronRight, Flame } from 'lucide-react';
import { useLanguage } from '../../context/Language/LanguageContext';
import PremiumNewsCard from '../../components/Feed/PremiumNewsCard';

const TABS = [
  { id: 'saved',   label: 'Saved',     icon: Bookmark },
  { id: 'reacted', label: 'Reactions', icon: Heart    },
  { id: 'history', label: 'History',   icon: Clock    },
];

export default function ProfilePage({
  user,
  savedPosts = [],
  reactedPosts = [],
  historyPosts = [],
  streakDays = 0,
  onPostClick,
  onSignOut,
  onOpenSettings,
  darkMode = false,
  onToggleDark,
  notificationsOn = true,
  onToggleNotifications,
}) {
  const { currentLanguage, setLanguage } = useLanguage();
  const [tab, setTab] = useState('saved');

  const counts = useMemo(() => ({
    saved: savedPosts.length,
    reacted: reactedPosts.length,
    history: historyPosts.length,
  }), [savedPosts, reactedPosts, historyPosts]);

  const activeList =
    tab === 'saved'   ? savedPosts   :
    tab === 'reacted' ? reactedPosts :
                        historyPosts;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-24">
      {/* Hero / identity */}
      <section className="relative px-5 pt-10 pb-6 bg-gradient-to-b from-primary-50 to-transparent dark:from-primary-950/40">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.displayName || 'U')}`}
              alt=""
              className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-neutral-900 shadow-md"
            />
            {streakDays > 0 && (
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-accent-400 to-danger-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-0.5">
                <Flame className="w-3 h-3 animate-flame" /><span className="tabular-nums">{streakDays}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{user?.displayName || 'Vadodara reader'}</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">{user?.email || user?.phoneNumber || 'Guest'}</p>
          </div>
          <button type="button" onClick={onOpenSettings} aria-label="Settings" className="btn-icon">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {streakDays > 0 && (
          <div className="card-ivory mt-5 px-4 py-3 flex items-center gap-3">
            <Flame className="w-8 h-8 text-danger-500 animate-flame" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{streakDays}-day reading streak</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Come back tomorrow to keep it going.</p>
            </div>
          </div>
        )}
      </section>

      {/* Tabs */}
      <nav className="flex gap-1 px-4 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-20 chrome-blur" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 py-3 px-2 text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5
              ${tab === id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
          >
            <Icon className="w-4 h-4" /> {label}
            <span className="text-2xs tabular-nums text-neutral-400">{counts[id]}</span>
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <section className="px-4 py-4">
        {activeList.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="grid gap-3">
            {activeList.map((p) => (
              <PremiumNewsCard key={p.id} post={p} variant="compact" onPostClick={onPostClick} />
            ))}
          </div>
        )}
      </section>

      {/* Preferences */}
      <section aria-label="Preferences" className="mx-4 card divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
        <PrefRow icon={<Moon className="w-5 h-5" />} label="Dark mode" toggle={darkMode} onToggle={onToggleDark} />
        <PrefRow icon={<Bell className="w-5 h-5" />} label="Notifications" toggle={notificationsOn} onToggle={onToggleNotifications} />
        <PrefLangRow current={currentLanguage} onChange={setLanguage} />
      </section>

      <div className="px-4 mt-4">
        <button type="button" onClick={onSignOut} className="btn w-full py-3 text-danger-600 bg-danger-50 hover:bg-danger-100 dark:bg-danger-950 dark:hover:bg-danger-900 border border-danger-200 dark:border-danger-900">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

const EmptyState = memo(function EmptyState({ tab }) {
  const msg = {
    saved:   { icon: Bookmark, text: "You haven't saved any stories yet." },
    reacted: { icon: Heart,    text: 'No reactions yet — tap a reaction on any story.' },
    history: { icon: Clock,    text: 'Your reading history will appear here.' },
  }[tab];
  const Icon = msg.icon;
  return (
    <div className="py-16 text-center text-neutral-400">
      <Icon className="w-12 h-12 mx-auto mb-3 opacity-40" />
      <p className="text-sm">{msg.text}</p>
    </div>
  );
});

const PrefRow = memo(function PrefRow({ icon, label, toggle, onToggle }) {
  return (
    <button type="button" onClick={onToggle} className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors text-left">
      <span className="text-neutral-500">{icon}</span>
      <span className="flex-1 font-medium text-sm">{label}</span>
      <span role="switch" aria-checked={toggle}
        className={`w-11 h-6 rounded-full relative transition-colors ${toggle ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${toggle ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
});

const PrefLangRow = memo(function PrefLangRow({ current, onChange }) {
  return (
    <div className="px-4 py-3.5 flex items-center gap-3">
      <span className="text-neutral-500"><Globe className="w-5 h-5" /></span>
      <span className="flex-1 font-medium text-sm">Language</span>
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-full p-0.5">
        {[['en','EN'],['hi','हिं'],['gu','ગુ']].map(([code, lbl]) => (
          <button key={code} type="button" onClick={() => onChange?.(code)}
            className={`px-2.5 py-1 rounded-full text-2xs font-bold transition-colors
              ${current === code ? 'bg-white dark:bg-neutral-950 text-primary-600 shadow-sm' : 'text-neutral-500'}`}>
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
});
