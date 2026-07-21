import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Share2, Zap } from 'lucide-react';
import { onValue, ref } from 'firebase/database';
import { db } from '../../firebase-config';
import { useLanguage } from '../../context/Language/LanguageContext';
import { getLocalizedText } from '../../utils/textUtils';
import ShareSheet from '../Common/ShareSheet';
import BreakingNewsGallery from './BreakingNewsGallery';

const BreakingNewsDetail = ({ newsId, onBack, onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => onValue(ref(db, 'breakingNews'), snapshot => {
    const now = Date.now();
    const next = Object.entries(snapshot.val() || {})
      .map(([id, value]) => ({ id, ...value }))
      .filter(item => item.isActive !== false && (!item.expiresAt || new Date(item.expiresAt).getTime() > now))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    setItems(next);
    setLoading(false);
  }), []);

  const index = items.findIndex(item => item.id === newsId);
  const item = index >= 0 ? items[index] : null;
  const title = item ? getLocalizedText(item.title || item.headline, currentLanguage) : '';
  const content = item ? getLocalizedText(item.content || item.summary, currentLanguage) : '';
  const media = useMemo(() => {
    if (!item) return [];
    if (Array.isArray(item.media)) return item.media;
    if (item.media && typeof item.media === 'object') return Object.values(item.media);
    return item.mediaUrl ? [{ url: item.mediaUrl }] : [];
  }, [item]);

  if (loading) return <div className="grid min-h-[55vh] place-items-center"><div className="h-9 w-9 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" /></div>;
  if (!item) return (
    <div className="grid min-h-[60vh] place-items-center p-6">
      <div className="liquid-panel rounded-[1.75rem] p-8 text-center"><h1 className="text-2xl font-bold dark:text-white">Breaking news not found</h1><button onClick={onBack} className="mt-5 rounded-2xl bg-teal-700 px-5 py-3 font-semibold text-white">Back to Breaking News</button></div>
    </div>
  );

  const navigateTo = (nextItem) => nextItem && onNavigate(nextItem.id);
  return (
    <article className="min-h-screen pb-24">
      <header className="sticky top-[calc(56px+env(safe-area-inset-top))] z-30 border-b border-white/60 bg-white/85 px-3 py-2 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85 lg:top-0">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <button onClick={onBack} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"><ArrowLeft className="h-5 w-5" /> Breaking News</button>
          <button onClick={() => setShareOpen(true)} className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800" aria-label="Share breaking news"><Share2 className="h-5 w-5" /></button>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-3 py-4 sm:px-5 sm:py-6">
        <div className="liquid-panel overflow-hidden rounded-[1.75rem] border border-white/70 dark:border-white/10">
          <div className="p-4 sm:p-7">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-800"><Zap className="h-3.5 w-3.5" /> {item.priority || 'Breaking'} update</div>
        <h1 className="text-2xl font-black leading-tight text-slate-950 sm:text-4xl dark:text-white">{title}</h1>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(item.createdAt || Date.now()).toLocaleDateString()}</span>
          <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {item.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{item.location}</span>}
        </div>
          </div>
        <BreakingNewsGallery key={item.id} media={media} title={title} />
        <div className="p-4 sm:p-7">
        <div className="prose prose-lg max-w-none whitespace-pre-line text-slate-700 dark:prose-invert dark:text-slate-200" dangerouslySetInnerHTML={{ __html: content }} />
        {item.externalLink && <a href={item.externalLink} target="_blank" rel="noreferrer" className="mt-7 inline-flex rounded-2xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800">Open source</a>}
        <nav className="mt-10 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
          <button disabled={!items[index - 1]} onClick={() => navigateTo(items[index - 1])} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/60 px-4 py-3 font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900/60 dark:text-white"><ChevronLeft className="h-5 w-5" /> Newer</button>
          <button disabled={!items[index + 1]} onClick={() => navigateTo(items[index + 1])} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/60 px-4 py-3 font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900/60 dark:text-white">Older <ChevronRight className="h-5 w-5" /></button>
        </nav>
        </div>
        </div>
      </div>
      <ShareSheet isOpen={shareOpen} onClose={() => setShareOpen(false)} shareData={{ title, text: content.replace(/<[^>]*>/g, '').slice(0, 160), url: `${window.location.origin}/breaking/${encodeURIComponent(newsId)}` }} />
    </article>
  );
};

export default BreakingNewsDetail;
