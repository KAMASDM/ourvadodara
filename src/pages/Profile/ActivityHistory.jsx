import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  CalendarCheck,
  ChevronRight,
  Eye,
  Heart,
  History,
  MessageCircle,
  Search,
  Share2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/Auth/AuthContext';
import { useLanguage } from '../../context/Language/LanguageContext';
import useActivityHistory, { formatActivityTime } from '../../hooks/useActivityHistory';

const FILTERS = [
  { id: 'all', label: 'All activity' },
  { id: 'engagement', label: 'Likes & shares' },
  { id: 'saved', label: 'Saved' },
  { id: 'comments', label: 'Comments' },
  { id: 'events', label: 'Events' },
  { id: 'reading', label: 'Reading' }
];

const activityPresentation = type => {
  switch (type) {
    case 'like': return { label: 'Liked', icon: Heart, color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300' };
    case 'share': return { label: 'Shared', icon: Share2, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300' };
    case 'comment': return { label: 'Commented', icon: MessageCircle, color: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300' };
    case 'read': return { label: 'Read', icon: Eye, color: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300' };
    case 'registration': return { label: 'Registered', icon: CalendarCheck, color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300' };
    case 'reaction': return { label: 'Reacted', icon: Sparkles, color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300' };
    default: return { label: 'Saved', icon: Bookmark, color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300' };
  }
};

const navigateTo = path => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const ActivityHistory = ({ onPostClick, onEventClick }) => {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const { activities, isLoading } = useActivityHistory(user?.uid, currentLanguage);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(30);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return activities.filter(item => (filter === 'all' || item.group === filter)
      && (!search || `${item.title} ${item.detail} ${item.category}`.toLowerCase().includes(search)));
  }, [activities, filter, query]);

  const openActivity = item => {
    if (item.targetType === 'event') {
      if (onEventClick) onEventClick(item.targetId);
      else navigateTo(`/events/${encodeURIComponent(item.targetId)}`);
    } else if (onPostClick) onPostClick(item.targetId);
    else navigateTo(`/post/${encodeURIComponent(item.targetId)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-3 py-4 sm:px-5 sm:py-7">
        <header className="flex items-center gap-3 px-1">
          <button type="button" onClick={() => navigateTo('/profile')} className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-white dark:ring-slate-800" aria-label="Back to profile"><ArrowLeft className="h-5 w-5" /></button>
          <div><p className="text-xs font-black uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">Your account</p><h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Activity history</h1></div>
        </header>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search your activity" className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:ring-teal-950" />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{FILTERS.map(item => <button key={item.id} type="button" onClick={() => { setFilter(item.id); setVisibleCount(30); }} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-extrabold transition ${filter === item.id ? 'bg-teal-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800'}`}>{item.label}</button>)}</div>

        <div className="mt-4 flex items-center justify-between px-1"><p className="text-sm font-bold text-slate-500 dark:text-slate-400">{filtered.length} {filtered.length === 1 ? 'activity' : 'activities'}</p></div>

        {isLoading ? (
          <div className="mt-4 space-y-3">{[0, 1, 2, 3].map(item => <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="mt-4 rounded-[1.75rem] bg-white px-6 py-14 text-center ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"><History className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-4 text-lg font-black text-slate-950 dark:text-white">No activity found</h2><p className="mt-1 text-sm text-slate-500">Your real interactions will appear here as you use the app.</p></div>
        ) : (
          <div className="mt-4 space-y-3">
            {filtered.slice(0, visibleCount).map(item => {
              const presentation = activityPresentation(item.type);
              const Icon = presentation.icon;
              return <button key={item.id} type="button" onClick={() => openActivity(item)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 text-left transition hover:border-teal-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-800">
                {item.image ? <img src={item.image} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl object-cover" /> : <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${presentation.color}`}><Icon className="h-5 w-5" /></span>}
                <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className={`inline-flex items-center gap-1 text-xs font-black ${presentation.color.split(' ').filter(value => value.startsWith('text-')).join(' ')}`}><Icon className="h-3.5 w-3.5" />{presentation.label}</span><span className="text-xs text-slate-400">{formatActivityTime(item.timestamp)}</span></span><span className="mt-1 block truncate font-extrabold text-slate-950 dark:text-white">{item.title}</span>{item.detail && <span className="mt-0.5 block truncate text-sm text-slate-500 dark:text-slate-400">{item.detail}</span>}</span>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
              </button>;
            })}
            {visibleCount < filtered.length && <button type="button" onClick={() => setVisibleCount(count => count + 30)} className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-black text-teal-700 dark:border-slate-800 dark:bg-slate-900 dark:text-teal-300">Show more activity</button>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityHistory;
