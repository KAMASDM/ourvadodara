// =============================================
// src/pages/NewsDetail/NewsDetailPage.jsx
// Modernized article detail — hero, sticky actions,
// 12-reaction tray, progress bar, related rail.
// =============================================
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ArrowLeft, Bookmark, Share2, MapPin, Clock, Eye, CheckCircle2, TextQuote } from 'lucide-react';
import { useLanguage } from '../../context/Language/LanguageContext';
import { formatTimeAgo, formatNumber } from '../../utils/helpers';
import PremiumNewsCard from '../../components/Feed/PremiumNewsCard';

const REACTIONS = [
  { emoji: '👍', label: 'Like' }, { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Fire' }, { emoji: '😂', label: 'Funny' },
  { emoji: '😮', label: 'Wow' }, { emoji: '😢', label: 'Sad' },
  { emoji: '🙌', label: 'Bravo' }, { emoji: '👏', label: 'Clap' },
  { emoji: '💯', label: '100' }, { emoji: '🤔', label: 'Hmm' },
  { emoji: '🚨', label: 'Alert' }, { emoji: '🙏', label: 'Respect' },
];

function useReadProgress(ref) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current; if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const total = height - window.innerHeight;
      const read = Math.min(Math.max(-top, 0), total);
      setPct(total > 0 ? (read / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [ref]);
  return pct;
}

export default function NewsDetailPage({ post, onBack, onSave, onShare, isSaved, related = [], onRelatedClick }) {
  const { currentLanguage } = useLanguage();
  const rootRef = useRef(null);
  const progress = useReadProgress(rootRef);
  const [myReaction, setMyReaction] = useState(null);
  const [fontBump, setFontBump] = useState(0);

  const n = useMemo(() => ({
    title:    post.title?.[currentLanguage]   || post.title?.en   || '',
    body:     post.body?.[currentLanguage]    || post.body?.en    || post.content?.[currentLanguage] || post.content?.en || '',
    excerpt:  post.excerpt?.[currentLanguage] || post.excerpt?.en || '',
    image:    post.mediaContent?.items?.[0]?.url || post.image,
    author:   typeof post.author === 'object' ? post.author?.name : post.author || 'Our Vadodara',
    verified: post.isVerified || post.source === 'official',
    time:     new Date(post.publishedAt || post.createdAt || Date.now()),
    views:    post.analytics?.views ?? post.views ?? 0,
    location: post.location || 'Vadodara',
    category: post.category || 'news',
    readTime: post.readTime || Math.max(3, Math.ceil((post.body?.en?.length || 800) / 1000)),
  }), [post, currentLanguage]);

  const paragraphs = useMemo(
    () => (n.body || n.excerpt).split(/\n\n+/).filter(Boolean),
    [n.body, n.excerpt],
  );

  const pickReaction = useCallback((r) => setMyReaction((cur) => cur === r ? null : r), []);

  return (
    <article ref={rootRef} className="min-h-screen bg-white dark:bg-neutral-950 pb-24">
      {/* Sticky top bar with progress */}
      <header className="sticky top-0 z-30 chrome-blur border-b">
        <div className="flex items-center gap-2 px-3 h-12 max-w-2xl mx-auto">
          <button type="button" onClick={onBack} className="btn-icon -ml-1" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="eyebrow truncate">{n.category}</span>
          <div className="ml-auto flex items-center gap-1">
            <button type="button" onClick={() => setFontBump(f => (f + 1) % 3)} className="btn-icon !w-9 !h-9" aria-label="Text size">
              <TextQuote className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => onSave?.(post.id)} className={`btn-icon !w-9 !h-9 ${isSaved ? 'text-primary-600' : ''}`} aria-label="Save">
              <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
            </button>
            <button type="button" onClick={() => onShare?.(post)} className="btn-icon !w-9 !h-9" aria-label="Share">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="h-0.5 bg-neutral-100 dark:bg-neutral-800">
          <div className="h-full bg-primary-600 transition-[width] duration-150 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* Hero image */}
      {n.image && (
        <div className="relative aspect-[16/10] sm:aspect-[21/9] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          <img src={n.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="pill-category">{n.category}</span>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="max-w-2xl mx-auto px-5 sm:px-6 pt-6">
        <h1
          className={`font-bold leading-[1.15] tracking-tight text-balance
                      ${fontBump === 0 ? 'text-[28px] sm:text-[34px]' : ''}
                      ${fontBump === 1 ? 'text-[32px] sm:text-[38px]' : ''}
                      ${fontBump === 2 ? 'text-[36px] sm:text-[44px]' : ''}`}
        >
          {n.title}
        </h1>

        {/* Byline */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-4 pb-5 border-b border-neutral-200 dark:border-neutral-800">
          <span className="inline-flex items-center gap-2 font-semibold text-sm">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-bold">
              {n.author[0]}
            </span>
            {n.author}
            {n.verified && <CheckCircle2 className="w-4 h-4 text-primary-500" aria-label="Verified" />}
          </span>
          <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
            <time>{formatTimeAgo(n.time)}</time>
            <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{n.readTime} min</span>
            <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{formatNumber(n.views)}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{n.location}</span>
          </div>
        </div>

        {/* Body paragraphs */}
        <div
          className={`prose-article mt-5 space-y-4
                      ${fontBump === 0 ? 'text-[17px]' : ''}
                      ${fontBump === 1 ? 'text-[19px]' : ''}
                      ${fontBump === 2 ? 'text-[21px]' : ''}
                      leading-[1.72] text-neutral-800 dark:text-neutral-200`}
        >
          {paragraphs.length ? paragraphs.map((p, i) => <p key={i}>{p}</p>)
                             : <p className="text-neutral-500">No content.</p>}
        </div>

        {/* Reaction tray */}
        <section aria-label="Reactions" className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <div className="eyebrow mb-3">Reactions</div>
          <div className="grid grid-cols-6 gap-1.5">
            {REACTIONS.map((r) => {
              const active = myReaction === r.emoji;
              return (
                <button
                  key={r.emoji}
                  type="button"
                  onClick={() => pickReaction(r.emoji)}
                  aria-pressed={active}
                  aria-label={r.label}
                  className={`group aspect-square rounded-xl border transition-all
                              ${active
                                ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/40 scale-105'
                                : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900'}`}
                >
                  <span className={`block text-2xl transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{r.emoji}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section aria-label="Related stories" className="mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <div className="eyebrow mb-3">More from {n.category}</div>
            <div className="grid gap-3">
              {related.slice(0, 4).map((r) => (
                <PremiumNewsCard key={r.id} post={r} variant="compact" onPostClick={onRelatedClick} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
