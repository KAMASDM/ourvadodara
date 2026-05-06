// =============================================
// src/components/Breaking/BreakingNews.jsx
// Breaking news banner + ticker + live feed view.
// Uses live dot, red gradient, autoplays update.
// =============================================
import React, { memo, useEffect, useState } from 'react';
import { Radio, ArrowRight } from 'lucide-react';
import { formatTimeAgo } from '../../utils/helpers';

/**
 * Slim inline banner — for Home feed.
 * Props: items: [{ id, text, publishedAt, onClick }]
 */
export const BreakingTicker = memo(function BreakingTicker({ items = [], onItemClick }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!items.length) return null;
  const cur = items[i];

  return (
    <button
      type="button"
      onClick={() => onItemClick?.(cur)}
      className="group flex items-center gap-3 w-full mx-0 my-2 px-4 py-3 bg-gradient-to-r from-danger-600 to-danger-500 text-white text-left overflow-hidden"
      aria-label="Breaking news"
    >
      <span className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider flex-shrink-0">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        Breaking
      </span>
      <span className="flex-1 min-w-0 text-sm font-semibold truncate animate-fadeIn" key={cur.id}>
        {cur.text}
      </span>
      <ArrowRight className="w-4 h-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
});

/**
 * Full breaking-news page — chronological live feed with sticky header.
 */
export default function BreakingNewsPage({ items = [], onBack, onItemClick }) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-24">
      <header className="sticky top-0 z-30 bg-gradient-to-r from-danger-600 to-danger-500 text-white shadow-lg">
        <div className="px-5 py-4 flex items-center gap-3">
          <button type="button" onClick={onBack} aria-label="Back"
            className="w-9 h-9 rounded-full bg-white/20 backdrop-blur grid place-items-center active:scale-95 transition-transform">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="eyebrow !text-white/90">Live</span>
            </div>
            <h1 className="font-bold text-xl leading-tight">Breaking news</h1>
          </div>
          <Radio className="w-6 h-6 opacity-60" />
        </div>
      </header>

      <ol className="px-4 pt-3 space-y-0" aria-label="Live updates">
        {items.map((it) => <LiveItem key={it.id} it={it} onClick={() => onItemClick?.(it)} />)}
        {!items.length && (
          <li className="py-16 text-center text-neutral-400">
            <Radio className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No breaking news right now.</p>
          </li>
        )}
      </ol>
    </div>
  );
}

const LiveItem = memo(function LiveItem({ it, onClick }) {
  return (
    <li className="relative pl-6 pb-5">
      <span className="absolute left-1 top-2 w-2.5 h-2.5 rounded-full bg-danger-500 ring-4 ring-danger-100 dark:ring-danger-950" />
      <span className="absolute left-2 top-5 bottom-0 w-px bg-neutral-200 dark:bg-neutral-800" />
      <button type="button" onClick={onClick} className="w-full text-left card p-4 hover:-translate-y-0.5 hover:shadow-card-hover transition-all">
        <div className="flex items-center gap-2 text-2xs text-neutral-400 mb-1">
          <time>{formatTimeAgo(new Date(it.publishedAt))}</time>
          {it.location && <><span aria-hidden>·</span><span>{it.location}</span></>}
        </div>
        <h3 className="font-bold text-[15px] leading-snug text-balance">{it.text || it.title}</h3>
        {it.body && <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">{it.body}</p>}
      </button>
    </li>
  );
});
