// =============================================
// src/components/Reels/ReelsRail.jsx
// Horizontal Reels Preview Section for Home Page
// =============================================
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Eye } from 'lucide-react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { POST_TYPES } from '../../utils/mediaSchema';

const ReelsRail = ({ onSelectReel }) => {
  const { t } = useTranslation();
  const { data: reelsData, isLoading } = useRealtimeData('reels');

  const reels = useMemo(() => {
    if (!reelsData) return [];

    return Object.entries(reelsData)
      .map(([id, reel]) => ({ id, ...reel }))
      .filter(reel => reel?.isPublished !== false && (reel.type === POST_TYPES.REEL || !reel.type))
      .sort((a, b) => new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0))
      .slice(0, 12);
  }, [reelsData]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl px-4 py-6 shadow-sm">
        <div className="h-6 w-32 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (!reels || reels.length === 0) {
    return null;
  }

  const resolveThumbnail = (reel) => {
    const mediaItems = Array.isArray(reel.mediaContent?.items)
      ? reel.mediaContent.items
      : Object.values(reel.mediaContent?.items || {});

    const primaryItem = mediaItems.find(item => item.thumbnailUrl) || mediaItems[0] || {};

    return (
      primaryItem.thumbnailUrl ||
      primaryItem.previewUrl ||
      primaryItem.url ||
      reel.mediaContent?.thumbnailUrl ||
      reel.coverImage ||
      '/default-story.png'
    );
  };

  const formatViews = (views) => {
    if (!views) return null;
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
    return `${views}`;
  };

  const handleSelect = (reelId) => {
    onSelectReel?.(reelId);
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {t('reels_section_title', 'Reels For You')}
        </h2>
        <button
          type="button"
          onClick={() => handleSelect(reels[0]?.id)}
          className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 hover:text-blue-500"
        >
          {t('view_all', 'View All')}
        </button>
      </div>

      <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-1">
        {reels.map((reel) => {
          const thumbnail = resolveThumbnail(reel);
          const viewsLabel = formatViews(reel.analytics?.views);
          const title = reel.title?.en || reel.title?.default || t('reel_default_title', 'Our Vadodara Reel');

          return (
            <button
              key={reel.id}
              type="button"
              onClick={() => handleSelect(reel.id)}
              className="flex-shrink-0 w-28 sm:w-32"
            >
              <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-gray-200 dark:bg-gray-800 shadow-md">
                <img
                  src={thumbnail}
                  alt={title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />

                <div className="absolute inset-0 flex flex-col justify-between p-2">
                  <div className="flex items-center justify-between">
                    {viewsLabel && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">
                        <Eye className="h-3 w-3" />
                        {viewsLabel}
                      </span>
                    )}
                    <span className="inline-flex items-center justify-center rounded-full bg-black/60 p-1.5">
                      <Play className="h-3 w-3 text-white" />
                    </span>
                  </div>

                  <div className="text-left text-[11px] font-medium text-white/90 line-clamp-2">
                    {title}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ReelsRail;
