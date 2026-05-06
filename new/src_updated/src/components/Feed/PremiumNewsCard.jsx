// =============================================
// src/components/Feed/PremiumNewsCard.jsx
// Modernized news card — split into variants via composition,
// memoized, lazy images, skeleton fallback, cleaner ARIA.
// =============================================
import React, { memo, useState, useCallback } from 'react';
import {
  Clock, Eye, MessageCircle, Share2, Bookmark, MapPin,
  CheckCircle2, Play, Images,
} from 'lucide-react';
import { useLanguage } from '../../context/Language/LanguageContext';
import EmojiReactions from '../Common/EmojiReactions';
import { formatTimeAgo, formatNumber } from '../../utils/helpers';

/* ── helpers ─────────────────────────────────────────────── */
const useNormalizedPost = (post) => {
  const { currentLanguage } = useLanguage();
  const title   = post.title?.[currentLanguage]   || post.title?.en   || 'Untitled';
  const excerpt = post.excerpt?.[currentLanguage] || post.excerpt?.en || '';
  const media   = post.mediaContent?.items || (Array.isArray(post.media) ? post.media : []);
  const image   = media[0]?.url || media[0]?.src || post.image;
  const hasMulti= media.length > 1;
  const hasVideo= media.some(m => m.type === 'video' || m.url?.includes('.mp4'));
  const views   = post.analytics?.views    ?? post.views    ?? 0;
  const comments= post.analytics?.comments ?? post.comments ?? 0;
  const author  = typeof post.author === 'object' ? (post.author?.name || 'Unknown') : (post.author || 'Our Vadodara');
  const location= post.location || post.city || 'Vadodara';
  const verified= post.isVerified || post.source === 'official';
  const trending= post.isTrending || views > 10000;
  const readTime= post.readTime || Math.max(1, Math.ceil((excerpt?.length || 0) / 200));
  const publishedAt = new Date(post.publishedAt || post.createdAt || Date.now());
  const isLive  = post.isLive || post.live;
  return { title, excerpt, image, hasMulti, hasVideo, views, comments, author, location, verified, trending, readTime, publishedAt, isLive, category: post.category || 'news' };
};

/* ── building blocks ─────────────────────────────────────── */
const Media = memo(function Media({ image, hasMulti, hasVideo, isLive, trending, category, className = '' }) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-neutral-100 dark:bg-neutral-800 ${className}`}>
      {!err && image ? (
        <>
          {!loaded && <div className="absolute inset-0 skeleton" />}
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setErr(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </>
      ) : (
        <div className="absolute inset-0 grid place-items-center text-neutral-400">
          <Images className="w-8 h-8" />
        </div>
      )}

      <div className="absolute top-2.5 left-2.5 flex gap-1.5">
        <span className="pill-category">{category}</span>
        {isLive && <span className="pill-live"><span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />Live</span>}
        {trending && !isLive && <span className="pill-trending">↗ Trending</span>}
      </div>

      {hasMulti && (
        <div className="absolute top-2.5 right-2.5 bg-black/60 text-white rounded-full px-2 py-1 flex items-center gap-1 text-2xs font-semibold backdrop-blur-sm">
          <Images className="w-3 h-3" />
        </div>
      )}
      {hasVideo && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm grid place-items-center">
            <Play className="w-6 h-6 text-white fill-white translate-x-0.5" />
          </div>
        </div>
      )}
    </div>
  );
});

const AuthorRow = memo(function AuthorRow({ author, verified, time, compact }) {
  return (
    <div className={`flex items-center gap-2 ${compact ? 'text-2xs' : 'text-xs'} text-neutral-500 dark:text-neutral-400 mb-1.5`}>
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-[10px] font-bold">
        {author[0]}
      </span>
      <span className="font-semibold text-neutral-700 dark:text-neutral-200 truncate">{author}</span>
      {verified && <CheckCircle2 className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" aria-label="Verified" />}
      <span aria-hidden>·</span>
      <time>{time}</time>
    </div>
  );
});

const MetaRow = memo(function MetaRow({ location, views, comments, readTime, isSaved, onSave, onShare, postId, onReact, isLiked, onLike }) {
  const stop = (e) => e.stopPropagation();
  return (
    <div className="flex items-center gap-3 text-2xs text-neutral-400 dark:text-neutral-500 mt-2.5 pt-2.5 border-t border-neutral-100 dark:border-neutral-800">
      <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{location}</span>
      <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(views)}</span>
      <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" />{formatNumber(comments)}</span>
      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{readTime}m</span>
      <div className="ml-auto flex items-center gap-0.5" onClick={stop}>
        {onReact && <EmojiReactions postId={postId} isLiked={isLiked} onLike={onLike} size="sm" />}
        <button type="button" onClick={(e) => { stop(e); onSave?.(); }} aria-label={isSaved ? 'Unsave' : 'Save'} aria-pressed={isSaved}
          className={`btn-icon !w-8 !h-8 ${isSaved ? 'text-primary-600' : ''}`}>
          <Bookmark className="w-4 h-4" strokeWidth={2} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
        <button type="button" onClick={(e) => { stop(e); onShare?.(); }} aria-label="Share" className="btn-icon !w-8 !h-8">
          <Share2 className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
});

/* ── variants ────────────────────────────────────────────── */
function DefaultCard({ n, post, onClick, isLiked, isSaved, onLike, onSave, onShare }) {
  return (
    <article onClick={onClick} className="card-interactive overflow-hidden animate-fadeIn content-vis">
      <Media image={n.image} hasMulti={n.hasMulti} hasVideo={n.hasVideo} isLive={n.isLive} trending={n.trending} category={n.category} className="aspect-[16/9]" />
      <div className="p-3.5">
        <AuthorRow author={n.author} verified={n.verified} time={formatTimeAgo(n.publishedAt)} />
        <h3 className="text-base font-bold leading-snug line-clamp-2 mb-1">{n.title}</h3>
        {n.excerpt && <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2">{n.excerpt}</p>}
        <MetaRow location={n.location} views={n.views} comments={n.comments} readTime={n.readTime}
          isSaved={isSaved} onSave={onSave} onShare={onShare} onReact postId={post.id} isLiked={isLiked} onLike={onLike} />
      </div>
    </article>
  );
}

function FeaturedCard({ n, post, onClick, isSaved, onSave, onShare }) {
  return (
    <article onClick={onClick} className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-lg cursor-pointer group animate-fadeIn">
      <Media image={n.image} hasMulti={n.hasMulti} hasVideo={n.hasVideo} isLive={n.isLive} trending={n.trending} category={n.category} className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <h2 className="text-xl sm:text-2xl font-bold leading-tight mb-2 line-clamp-3">{n.title}</h2>
        {n.excerpt && <p className="text-sm opacity-85 line-clamp-2 mb-3">{n.excerpt}</p>}
        <div className="flex items-center gap-3 text-2xs opacity-90">
          <span className="font-semibold">{n.author}</span>
          <span aria-hidden>·</span>
          <span>{formatTimeAgo(n.publishedAt)}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(n.views)}</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); onSave?.(); }} aria-label={isSaved ? 'Unsave' : 'Save'}
            className="ml-auto btn-icon !w-8 !h-8 !text-white hover:!bg-white/20">
            <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </article>
  );
}

function CompactCard({ n, post, onClick, isSaved, onSave }) {
  return (
    <article onClick={onClick} className="flex gap-3 py-3 border-b border-neutral-100 dark:border-neutral-800 cursor-pointer group">
      <div className="flex-1 min-w-0">
        <span className="eyebrow" style={{ color: 'var(--color-primary)' }}>{n.category}</span>
        <h3 className="text-[15px] font-bold leading-snug line-clamp-2 my-1 group-hover:text-primary-600 transition-colors">{n.title}</h3>
        <div className="flex items-center gap-2 text-2xs text-neutral-400">
          <span>{n.author}</span><span aria-hidden>·</span><time>{formatTimeAgo(n.publishedAt)}</time>
          <span aria-hidden>·</span><span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(n.views)}</span>
        </div>
      </div>
      {n.image && (
        <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          <img src={n.image} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
        </div>
      )}
    </article>
  );
}

/* ── export ──────────────────────────────────────────────── */
const PremiumNewsCard = memo(function PremiumNewsCard({
  post, onPostClick, isLiked, isSaved, onLike, onSave, onShare, variant = 'default',
}) {
  const n = useNormalizedPost(post);
  const handleClick = useCallback(() => onPostClick?.(post), [onPostClick, post]);
  const handleSave  = useCallback(() => onSave?.(post.id), [onSave, post.id]);
  const handleShare = useCallback(() => onShare?.(post), [onShare, post]);
  const handleLike  = useCallback(() => onLike?.(post.id), [onLike, post.id]);

  const Variant = variant === 'hero' || variant === 'featured' ? FeaturedCard
                : variant === 'compact' ? CompactCard
                : DefaultCard;

  return (
    <Variant
      n={n}
      post={post}
      onClick={handleClick}
      isLiked={isLiked}
      isSaved={isSaved}
      onLike={handleLike}
      onSave={handleSave}
      onShare={handleShare}
    />
  );
}, (a, b) =>
  a.post?.id === b.post?.id &&
  a.isLiked === b.isLiked &&
  a.isSaved === b.isSaved &&
  a.variant === b.variant &&
  a.post?.analytics?.views === b.post?.analytics?.views &&
  a.post?.analytics?.comments === b.post?.analytics?.comments
);

export default PremiumNewsCard;
