// =============================================
// src/pages/Search/SearchPage.jsx
// Global news search with date and category filters.
// =============================================
import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { Search, Calendar, Tag, X, Newspaper, Clapperboard } from 'lucide-react';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { POST_TYPES } from '../../utils/mediaSchema';
import { getLocalizedText } from '../../utils/textUtils';

const categories = [
  'all',
  'local',
  'india',
  'business',
  'technology',
  'entertainment',
  'sports',
  'science',
  'health',
  'weather',
  'world'
];

const normalizeDate = (post) => new Date(post.publishedAt || post.createdAt || post.updatedAt || 0);

const SearchPage = ({ onPostClick, onShowReels = () => {}, embedded = false }) => {
  const { currentLanguage } = useLanguage();
  const { data: postsData, isLoading: postsLoading } = useRealtimeData('posts', { scope: 'global' });
  const { data: reelsData, isLoading: reelsLoading } = useRealtimeData('reels', { scope: 'global' });
  const { data: carouselsData, isLoading: carouselsLoading } = useRealtimeData('carousels', { scope: 'global' });

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const isLoading = postsLoading || reelsLoading || carouselsLoading;

  const allNews = useMemo(() => {
    const collect = (data, source, typeFallback) => (
      Object.entries(data || {})
        .map(([id, item]) => ({
          id,
          ...item,
          source,
          type: item.type || typeFallback
        }))
        .filter((item) => (item.status || 'published') !== 'draft' && item.isPublished !== false)
    );

    return [
      ...collect(postsData, 'posts', POST_TYPES.STANDARD),
      ...collect(reelsData, 'reels', POST_TYPES.REEL),
      ...collect(carouselsData, 'carousels', POST_TYPES.CAROUSEL)
    ].sort((a, b) => normalizeDate(b) - normalizeDate(a));
  }, [postsData, reelsData, carouselsData]);

  const filteredNews = useMemo(() => {
    const words = query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    return allNews.filter((post) => {
      const postDate = normalizeDate(post);
      const postCategory = (post.category || '').toLowerCase();
      const title = getLocalizedText(post.title, currentLanguage);
      const content = getLocalizedText(post.content, currentLanguage);
      const excerpt = getLocalizedText(post.excerpt, currentLanguage);
      const description = getLocalizedText(post.description, currentLanguage);
      const haystack = [
        title,
        content,
        excerpt,
        description,
        postCategory,
        post.location,
        post.author?.name,
        post.author,
        ...(post.tags || []),
        ...(post.hashtags || [])
      ].filter(Boolean).join(' ').toLowerCase();

      if (category !== 'all' && postCategory !== category) return false;
      if (from && postDate < from) return false;
      if (to && postDate > to) return false;
      if (words.length && !words.every((word) => haystack.includes(word))) return false;

      return true;
    });
  }, [allNews, category, currentLanguage, dateFrom, dateTo, query]);

  const hasActiveFilters = query || category !== 'all' || dateFrom || dateTo;

  const clearFilters = () => {
    setQuery('');
    setCategory('all');
    setDateFrom('');
    setDateTo('');
  };

  const openItem = (post) => {
    if (post.type === POST_TYPES.REEL || post.source === 'reels') {
      onShowReels(post.id);
    } else {
      onPostClick(post.id);
    }
  };

  return (
    <div className={embedded ? 'pb-6' : 'min-h-screen pb-24'}>
      <div className={embedded
        ? 'sticky top-0 z-30 px-2 pt-2'
        : 'sticky top-[calc(56px+env(safe-area-inset-top)+4px)] z-30 px-2 pt-1'
      }>
        <div className="liquid-panel rounded-[1.35rem] p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search any news with a few words"
              className="w-full rounded-2xl border border-white/70 bg-white/75 py-3 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:ring-2 focus:ring-teal-500/30"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="liquid-chip min-w-0 justify-between text-xs font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                From
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="min-w-0 bg-transparent text-right outline-none"
              />
            </label>
            <label className="liquid-chip min-w-0 justify-between text-xs font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                To
              </span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="min-w-0 bg-transparent text-right outline-none"
              />
            </label>
          </div>

          <div className="horizontal-scroll mt-3 flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`flex-shrink-0 rounded-full px-3.5 py-2 text-xs font-bold capitalize transition ${
                  category === item
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/15'
                    : 'bg-white/60 text-slate-600 ring-1 ring-white/70'
                }`}
              >
                {item === 'all' ? 'All categories' : item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-2 pt-3">
        <div className="mb-3 flex items-center justify-between px-1">
          <div>
            <h1 className="text-lg font-bold text-slate-950">Search News</h1>
            <p className="text-xs text-slate-500">
              {isLoading ? 'Loading news...' : `${filteredNews.length} result${filteredNews.length === 1 ? '' : 's'}`}
            </p>
          </div>
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className="liquid-chip text-xs font-semibold text-slate-600">
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="py-16">
            <LoadingSpinner />
          </div>
        ) : filteredNews.length ? (
          <div className="space-y-3">
            {filteredNews.map((post) => {
              const isReel = post.type === POST_TYPES.REEL || post.source === 'reels';
              const title = getLocalizedText(post.title, currentLanguage) || 'Untitled';
              const excerpt = getLocalizedText(post.excerpt, currentLanguage) || getLocalizedText(post.description, currentLanguage) || getLocalizedText(post.content, currentLanguage);
              return (
                <button
                  key={`${post.source}-${post.id}`}
                  type="button"
                  onClick={() => openItem(post)}
                  className="liquid-card w-full rounded-[1.35rem] p-4 text-left transition active:scale-[0.99]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                      {isReel ? <Clapperboard className="h-5 w-5" /> : <Newspaper className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="liquid-chip !px-2 !py-0.5 text-[10px] font-bold uppercase text-teal-700">
                          <Tag className="h-3 w-3" />
                          {post.category || post.source}
                        </span>
                        <span className="text-xs text-slate-500">
                          {normalizeDate(post).toLocaleDateString()}
                        </span>
                      </div>
                      <h2 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-slate-950">
                        {title}
                      </h2>
                      {excerpt && (
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
                          {excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="liquid-card rounded-[1.35rem] p-8 text-center">
            <Search className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="mt-3 text-base font-bold text-slate-950">No matching news</h2>
            <p className="mt-1 text-sm text-slate-500">Try fewer words, another category, or a wider date range.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
