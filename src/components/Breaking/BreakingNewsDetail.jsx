import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Share2, Zap } from 'lucide-react';
import { onValue, ref } from 'firebase/database';
import { db } from '../../firebase-config';
import { useLanguage } from '../../context/Language/LanguageContext';
import { getLocalizedText } from '../../utils/textUtils';
import ShareSheet from '../Common/ShareSheet';

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

  if (loading) return <div className="min-h-screen grid place-items-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-red-200 border-t-red-600" /></div>;
  if (!item) return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-6 dark:bg-gray-950">
      <div className="text-center"><h1 className="text-2xl font-bold dark:text-white">Breaking news not found</h1><button onClick={onBack} className="mt-5 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white">Back to Breaking News</button></div>
    </div>
  );

  const navigateTo = (nextItem) => nextItem && onNavigate(nextItem.id);
  return (
    <article className="min-h-screen bg-gray-50 pb-24 dark:bg-gray-950">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <button onClick={onBack} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"><ArrowLeft className="h-5 w-5" /> Breaking News</button>
          <button onClick={() => setShareOpen(true)} className="rounded-full p-2 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800" aria-label="Share breaking news"><Share2 className="h-5 w-5" /></button>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-bold uppercase text-white"><Zap className="h-4 w-4" /> {item.priority || 'Breaking'} update</div>
        <h1 className="text-3xl font-black leading-tight text-gray-950 sm:text-5xl dark:text-white">{title}</h1>
        <div className="mt-5 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(item.createdAt || Date.now()).toLocaleDateString()}</span>
          <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {item.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{item.location}</span>}
        </div>
        {media.length > 0 && <div className="mt-8 grid gap-3 sm:grid-cols-2">{media.map((entry, mediaIndex) => {
          const url = typeof entry === 'string' ? entry : entry.url;
          const isVideo = entry?.type === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(url || '');
          return isVideo
            ? <video key={mediaIndex} src={url} controls className="max-h-[70vh] w-full rounded-3xl bg-black object-contain sm:col-span-2" />
            : <img key={mediaIndex} src={url} alt={`${title} ${mediaIndex + 1}`} className="max-h-[70vh] w-full rounded-3xl bg-gray-100 object-contain dark:bg-gray-900" />;
        })}</div>}
        <div className="prose prose-lg mt-8 max-w-none whitespace-pre-line text-gray-700 dark:prose-invert dark:text-gray-200" dangerouslySetInnerHTML={{ __html: content }} />
        {item.externalLink && <a href={item.externalLink} target="_blank" rel="noreferrer" className="mt-8 inline-flex rounded-xl bg-red-600 px-5 py-3 font-semibold text-white">Open source</a>}
        <nav className="mt-12 grid grid-cols-2 gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
          <button disabled={!items[index - 1]} onClick={() => navigateTo(items[index - 1])} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 font-semibold disabled:opacity-40 dark:border-gray-700 dark:text-white"><ChevronLeft className="h-5 w-5" /> Newer</button>
          <button disabled={!items[index + 1]} onClick={() => navigateTo(items[index + 1])} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 font-semibold disabled:opacity-40 dark:border-gray-700 dark:text-white">Older <ChevronRight className="h-5 w-5" /></button>
        </nav>
      </div>
      <ShareSheet isOpen={shareOpen} onClose={() => setShareOpen(false)} shareData={{ title, text: content.replace(/<[^>]*>/g, '').slice(0, 160), url: `${window.location.origin}/breaking/${encodeURIComponent(newsId)}` }} />
    </article>
  );
};

export default BreakingNewsDetail;
