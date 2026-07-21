import React from 'react';
import { ArrowDown, Eye, Play, Sparkles } from 'lucide-react';
import logoImage from '../../assets/images/our-vadodara-logo.png.png';
import { getLocalizedText } from '../../utils/textUtils';

const resolveThumbnail = (reel) => {
  const mediaItems = Array.isArray(reel.mediaContent?.items)
    ? reel.mediaContent.items
    : Object.values(reel.mediaContent?.items || {});
  const primaryItem = mediaItems.find(item => item?.thumbnailUrl || item?.previewUrl) || mediaItems[0] || {};

  return (
    primaryItem.thumbnailUrl ||
    primaryItem.previewUrl ||
    reel.mediaContent?.thumbnailUrl ||
    reel.thumbnail ||
    reel.coverImage ||
    ''
  );
};

const formatViews = (views = 0) => {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return String(views);
};

const SuggestedReelsPanel = ({ reels, onSelect, onContinue }) => (
  <section
    className="relative flex h-full min-h-full snap-start snap-always items-center overflow-hidden bg-[#080a0e] text-white"
    aria-label="Suggested reels"
  >
    <div className="pointer-events-none absolute -left-28 top-1/4 h-72 w-72 rounded-full bg-fuchsia-600/15 blur-3xl" />
    <div className="pointer-events-none absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl" />

    <div className="relative mx-auto w-full max-w-6xl px-4 pb-8 pt-24 sm:px-7 lg:px-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-200">
            <Sparkles className="h-3.5 w-3.5" />
            Picked for you
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Suggested reels</h2>
          <p className="mt-1 text-sm text-white/55">Swipe sideways to explore more</p>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="hidden shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/15 sm:inline-flex"
        >
          Continue
          <ArrowDown className="h-4 w-4" />
        </button>
      </div>

      <div
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
        style={{ touchAction: 'pan-x' }}
      >
        {reels.map((reel) => {
          const thumbnail = resolveThumbnail(reel);
          const title = getLocalizedText(reel.title, 'en') || 'Our Vadodara Reel';
          const authorName = reel.author?.name || 'Our Vadodara';

          return (
            <button
              key={reel.id}
              type="button"
              onClick={() => onSelect(reel.id)}
              className="group w-[44vw] min-w-[148px] max-w-[190px] shrink-0 snap-start text-left sm:w-52 sm:max-w-none lg:w-56"
              aria-label={`Watch ${title}`}
            >
              <div className="relative aspect-[9/14] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] shadow-xl shadow-black/25 transition duration-300 group-hover:-translate-y-1 group-hover:border-white/25">
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-fuchsia-700 via-violet-700 to-blue-700" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/90" />
                <span className="absolute right-2.5 top-2.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/45 backdrop-blur-sm">
                  <Play className="ml-0.5 h-4 w-4 fill-white" />
                </span>
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">{title}</p>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-white/70">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <img
                        src={reel.author?.avatar || logoImage}
                        alt=""
                        className="h-5 w-5 shrink-0 rounded-full border border-white/30 object-cover"
                      />
                      <span className="truncate">{authorName}</span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {formatViews(reel.analytics?.views)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mx-auto mt-3 flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold transition active:scale-95 sm:hidden"
      >
        Continue watching
        <ArrowDown className="h-4 w-4" />
      </button>
    </div>
  </section>
);

export default SuggestedReelsPanel;
