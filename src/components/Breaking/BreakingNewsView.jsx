import React, { useEffect, useState } from 'react';
import { AlertTriangle, Calendar, ChevronRight, Clock, MapPin, Radio, Share2, Zap } from 'lucide-react';
import { onValue, ref } from 'firebase/database';
import { formatDistanceToNow } from 'date-fns';
import { db } from '../../firebase-config';
import { useLanguage } from '../../context/Language/LanguageContext';
import { getLocalizedText } from '../../utils/textUtils';
import ShareSheet from '../Common/ShareSheet';

const priorityStyles = {
  urgent: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-800',
  critical: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-800',
  high: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800',
  medium: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-800',
  normal: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-800',
  low: 'bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:ring-teal-800'
};

const normalizePriority = priority => {
  if (priority === 'critical') return 'urgent';
  if (priority === 'normal') return 'medium';
  return priority || 'medium';
};

const getMedia = news => {
  if (Array.isArray(news.media) && news.media.length) return news.media;
  if (news.media && typeof news.media === 'object') return Object.values(news.media);
  return news.mediaUrl ? [{ url: news.mediaUrl }] : [];
};

const BreakingNewsView = () => {
  const { currentLanguage } = useLanguage();
  const [breakingNews, setBreakingNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [shareData, setShareData] = useState(null);

  useEffect(() => onValue(ref(db, 'breakingNews'), snapshot => {
    const now = Date.now();
    const priorityOrder = { urgent: 4, critical: 4, high: 3, medium: 2, normal: 2, low: 1 };
    const items = Object.entries(snapshot.val() || {})
      .map(([id, news]) => ({ id, ...news }))
      .filter(news => news.isActive && (!news.expiresAt || new Date(news.expiresAt).getTime() > now))
      .sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
        || new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    setBreakingNews(items);
    setLoading(false);
  }), []);

  const getText = content => getLocalizedText(content, currentLanguage);
  const filteredNews = selectedPriority === 'all'
    ? breakingNews
    : breakingNews.filter(news => normalizePriority(news.priority) === selectedPriority);

  const openDetail = news => {
    window.history.pushState({ view: 'breaking-detail', newsId: news.id }, '', `/breaking/${encodeURIComponent(news.id)}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (loading) return (
    <div className="grid min-h-[55vh] place-items-center">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen pb-24 dark:text-white">
      <div className="mx-auto max-w-4xl px-3 pb-6 pt-2 sm:px-5 sm:pt-4">
        <section className="liquid-panel rounded-[1.75rem] border border-white/70 p-4 dark:border-white/10 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-800">
              <Zap className="h-5 w-5" fill="currentColor" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="eyebrow text-rose-600 dark:text-rose-300">Live newsroom</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800">
                  <Radio className="h-3 w-3" /> Live
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Breaking News</h1>
              <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">Important updates from Vadodara, as they happen.</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {['all', 'urgent', 'high', 'medium', 'low'].map(priority => (
              <button
                key={priority}
                type="button"
                onClick={() => setSelectedPriority(priority)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold capitalize transition ${selectedPriority === priority
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                  : 'bg-white/70 text-slate-600 ring-1 ring-slate-200 hover:bg-white dark:bg-slate-900/70 dark:text-slate-300 dark:ring-slate-700'}`}
              >
                {priority === 'all' ? 'All updates' : priority}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-3 space-y-3 sm:mt-4">
          {filteredNews.length === 0 ? (
            <div className="liquid-panel rounded-[1.75rem] px-6 py-14 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/50"><AlertTriangle className="h-7 w-7" /></div>
              <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">No breaking news right now</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">New newsroom alerts will appear here.</p>
            </div>
          ) : filteredNews.map(news => {
            const title = getText(news.title) || getText(news.headline);
            const content = getText(news.content) || getText(news.summary);
            const media = getMedia(news);
            const firstMedia = media[0];
            const mediaUrl = typeof firstMedia === 'string' ? firstMedia : firstMedia?.url;
            const isVideo = firstMedia?.type === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(mediaUrl || '');
            const priority = normalizePriority(news.priority);

            return (
              <article
                key={news.id}
                role="link"
                tabIndex={0}
                onClick={() => openDetail(news)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openDetail(news);
                  }
                }}
                aria-label={`Read breaking news: ${title}`}
                className="liquid-panel group cursor-pointer overflow-hidden rounded-[1.75rem] border border-white/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-teal-600 dark:border-white/10"
              >
                {mediaUrl && (isVideo
                  ? <video src={mediaUrl} muted playsInline className="h-44 w-full bg-slate-900 object-cover sm:h-56" />
                  : <img src={mediaUrl} alt="" className="h-44 w-full bg-slate-100 object-cover sm:h-56 dark:bg-slate-900" />)}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ring-1 ${priorityStyles[news.priority] || priorityStyles[priority]}`}>
                      <Zap className="h-3 w-3" /> {priority}
                    </span>
                    {news.category && <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{news.category}</span>}
                    <span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      {news.createdAt && !Number.isNaN(new Date(news.createdAt).getTime()) ? `${formatDistanceToNow(new Date(news.createdAt))} ago` : 'Just now'}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-extrabold leading-snug text-slate-950 group-hover:text-teal-800 dark:text-white dark:group-hover:text-teal-300 sm:text-xl">{title}</h2>
                  {content && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{content.replace(/<[^>]*>/g, '')}</p>}
                  <div className="mt-4 flex items-center gap-3 border-t border-slate-200/70 pt-3 text-xs text-slate-500 dark:border-slate-700/70 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(news.createdAt || Date.now()).toLocaleDateString('en-IN')}</span>
                    {news.location && <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{news.location}</span></span>}
                    <button
                      type="button"
                      onClick={event => {
                        event.stopPropagation();
                        setShareData({ title, text: content?.replace(/<[^>]*>/g, '').slice(0, 160), url: `${window.location.origin}/breaking/${encodeURIComponent(news.id)}` });
                      }}
                      className="ml-auto rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-700 dark:hover:bg-slate-800"
                      aria-label="Share news"
                    ><Share2 className="h-4 w-4" /></button>
                    <span className="inline-flex items-center gap-1 font-bold text-teal-700 dark:text-teal-300">Read <ChevronRight className="h-4 w-4" /></span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <ShareSheet isOpen={Boolean(shareData)} onClose={() => setShareData(null)} shareData={shareData} />
    </div>
  );
};

export default BreakingNewsView;
