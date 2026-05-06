// =============================================
// src/pages/Roundup/RoundupPage.jsx
// Daily editorial digest — numbered story list,
// date header, "listen" CTA, share digest.
// =============================================
import React, { memo, useMemo } from 'react';
import { Share2, Headphones, ChevronRight, Sunrise } from 'lucide-react';
import { useLanguage } from '../../context/Language/LanguageContext';
import { formatNumber } from '../../utils/helpers';

const fmtDate = (d) => d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

export default function RoundupPage({ stories = [], date = new Date(), onStoryClick, onShare, onListen }) {
  const { currentLanguage } = useLanguage();
  const headline = useMemo(() =>
    stories.reduce((acc, s) => (s.analytics?.views ?? s.views ?? 0) > (acc?.analytics?.views ?? acc?.views ?? 0) ? s : acc, stories[0])
  , [stories]);

  if (!stories.length) return null;

  const title = (s) => s.title?.[currentLanguage] || s.title?.en || '';
  const excerpt = (s) => s.excerpt?.[currentLanguage] || s.excerpt?.en || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-ivory-50 via-white to-white dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950 pb-24">
      {/* Editorial header */}
      <header className="px-5 pt-8 pb-6 bg-ivory-dots">
        <div className="flex items-center gap-2 eyebrow text-primary-700 dark:text-primary-400">
          <Sunrise className="w-4 h-4" /> Today's roundup
        </div>
        <h1 className="mt-2 text-[32px] sm:text-4xl font-bold leading-[1.05] tracking-tight text-balance">
          {fmtDate(date)}
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          The {stories.length} stories from Vadodara you need this morning, in the time it takes to drink your chai.
        </p>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onListen} className="btn-primary px-4 py-2.5 text-sm">
            <Headphones className="w-4 h-4" /> Listen · 8 min
          </button>
          <button type="button" onClick={onShare} className="btn-secondary px-4 py-2.5 text-sm">
            <Share2 className="w-4 h-4" /> Share digest
          </button>
        </div>
      </header>

      {/* Headline */}
      {headline && (
        <section onClick={() => onStoryClick?.(headline)}
          className="mx-4 mb-6 card-interactive overflow-hidden">
          {headline.image || headline.mediaContent?.items?.[0]?.url ? (
            <div className="relative aspect-[16/9]">
              <img src={headline.image || headline.mediaContent.items[0].url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <span className="pill-category mb-2 inline-flex">Top story</span>
                <h2 className="text-xl font-bold text-white leading-tight line-clamp-2 text-balance">{title(headline)}</h2>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <span className="eyebrow text-primary-600">Top story</span>
              <h2 className="mt-1 text-xl font-bold leading-tight text-balance">{title(headline)}</h2>
              <p className="mt-1.5 text-sm text-neutral-500 line-clamp-2">{excerpt(headline)}</p>
            </div>
          )}
        </section>
      )}

      {/* Numbered list */}
      <ol className="px-4 space-y-0 divide-y divide-neutral-200 dark:divide-neutral-800 border-t border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        {stories.map((s, i) => (
          <RoundupItem key={s.id} n={i + 1} story={s} title={title(s)} excerpt={excerpt(s)} onClick={() => onStoryClick?.(s)} />
        ))}
      </ol>

      <footer className="px-5 pt-8 pb-4 text-center">
        <p className="text-xs text-neutral-400">That's the roundup. See you tomorrow, Vadodara.</p>
      </footer>
    </div>
  );
}

const RoundupItem = memo(function RoundupItem({ n, story, title, excerpt, onClick }) {
  const views = story.analytics?.views ?? story.views ?? 0;
  return (
    <li>
      <button type="button" onClick={onClick} className="w-full text-left py-4 flex gap-4 group">
        <span className="text-2xl font-bold tabular-nums text-primary-600 dark:text-primary-400 leading-none min-w-[2ch]">
          {String(n).padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[15px] leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors text-balance">{title}</h3>
          {excerpt && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{excerpt}</p>}
          <div className="mt-1.5 flex items-center gap-2 text-2xs text-neutral-400">
            <span className="uppercase tracking-wider font-semibold">{story.category || 'news'}</span>
            <span aria-hidden>·</span>
            <span>{formatNumber(views)} reads</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-neutral-300 self-center group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </button>
    </li>
  );
});
