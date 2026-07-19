// =============================================
// Updated src/components/Bookmarks/SavedPosts.jsx
// =============================================
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useAuth } from '../../context/Auth/AuthContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { getLocalizedText } from '../../utils/textUtils';
import { getEventImage, getEventStartDate, getVenueName } from '../../utils/eventUtils';
import { db } from '../../firebase-config';
import { ref, onValue } from 'firebase/database';
import { Bookmark, Search, Calendar, CalendarDays, Grid, List, MapPin, Newspaper } from 'lucide-react';
import EmptyState from '../Common/EmptyState';

const SavedPosts = ({ onPostClick, onEventClick }) => {
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState(null);
  const [eventBookmarks, setEventBookmarks] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [filterCategory, setFilterCategory] = useState('all');
  const [contentType, setContentType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: postsData } = useRealtimeData('posts', { scope: 'global' });
  const { data: reelsData } = useRealtimeData('reels', { scope: 'global' });
  const { data: carouselsData } = useRealtimeData('carousels', { scope: 'global' });
  const { data: eventsData } = useRealtimeData('events', { scope: 'global' });

  // The user's bookmark index: bookmarks/{uid}/{postId} -> { timestamp, source }
  useEffect(() => {
    if (!user?.uid) {
      setBookmarks({});
      return undefined;
    }
    const bookmarksRef = ref(db, `bookmarks/${user.uid}`);
    const unsubscribe = onValue(bookmarksRef, (snapshot) => {
      setBookmarks(snapshot.val() || {});
    });
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setEventBookmarks({});
      return undefined;
    }
    return onValue(ref(db, `eventBookmarks/${user.uid}`), snapshot => {
      setEventBookmarks(snapshot.val() || {});
    });
  }, [user?.uid]);

  const savedPosts = useMemo(() => {
    if (!bookmarks || !eventBookmarks) return [];
    const collections = { posts: postsData, reels: reelsData, carousels: carouselsData };
    const savedNews = Object.entries(bookmarks)
      .map(([postId, bookmark]) => {
        const source = bookmark?.source || 'posts';
        const post =
          collections[source]?.[postId] ||
          postsData?.[postId] ||
          reelsData?.[postId] ||
          carouselsData?.[postId];
        if (!post) return null; // post was deleted since it was saved
        return {
          id: postId,
          ...post,
          savedAt: bookmark?.timestamp || bookmark?.savedAt || post.publishedAt || post.createdAt,
          savedKind: 'news'
        };
      })
      .filter(Boolean);

    const savedEvents = Object.entries(eventBookmarks)
      .map(([eventId, bookmark]) => {
        const savedEvent = eventsData?.[eventId];
        if (!savedEvent) return null;
        return {
          id: eventId,
          ...savedEvent,
          savedAt: bookmark?.savedAt || bookmark?.timestamp || savedEvent.createdAt,
          savedKind: 'event'
        };
      })
      .filter(Boolean);

    return [...savedNews, ...savedEvents];
  }, [bookmarks, eventBookmarks, postsData, reelsData, carouselsData, eventsData]);

  const filteredAndSortedPosts = savedPosts
    .filter(post => {
      const titleText = getLocalizedText(post.title, currentLanguage);
      const contentText = getLocalizedText(post.content || post.description, currentLanguage);
      const matchesCategory = filterCategory === 'all' || post.category === filterCategory;
      const matchesType = contentType === 'all' || post.savedKind === contentType;
      const matchesSearch = searchQuery === '' ||
        titleText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contentText.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesType && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.savedAt) - new Date(b.savedAt);
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'newest':
        default:
          return new Date(b.savedAt) - new Date(a.savedAt);
      }
    });

  const categories = ['all', ...new Set(savedPosts.map(item => item.category).filter(Boolean))];
  const openSavedItem = (item) => {
    if (item.savedKind === 'event') {
      if (onEventClick) onEventClick(item.id);
      else {
        window.history.pushState({ view: 'event-detail', eventId: item.id }, '', `/events/${encodeURIComponent(item.id)}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      return;
    }
    if (onPostClick) onPostClick(item.id);
    else window.location.href = `/post/${item.id}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-6">
          <div className="flex items-center space-x-3 mb-4">
            <Bookmark className="w-6 h-6 text-primary-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Saved
            </h1>
          </div>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved news and events..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filters and Controls */}
          <div className="mb-4 flex gap-2">
            {[{ id: 'all', label: 'All', icon: Bookmark }, { id: 'news', label: 'News', icon: Newspaper }, { id: 'event', label: 'Events', icon: CalendarDays }].map(item => {
              const Icon = item.icon;
              return <button key={item.id} type="button" onClick={() => setContentType(item.id)} className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition ${contentType === item.id ? 'bg-teal-700 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}><Icon className="h-4 w-4" />{item.label}</button>;
            })}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300"
              >
                {categories.map(category => (
                  <option key={category} value={category} className="capitalize">
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="category">By Category</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {filteredAndSortedPosts.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3' : 'mx-auto max-w-3xl space-y-4'}>
            {filteredAndSortedPosts.map((post) => {
              const image = post.savedKind === 'event' ? getEventImage(post) : post.imageUrl || post.image || post.media?.[0]?.url || post.media?.images?.[0]?.url;
              return (
              <article key={`${post.savedKind}-${post.id}`} className={`overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 ${viewMode === 'list' ? 'flex' : ''}`}>
                {image && <img src={image} alt="" className={viewMode === 'list' ? 'h-28 w-36 flex-shrink-0 object-cover' : 'h-36 w-full object-cover'} />}
                <button type="button" onClick={() => openSavedItem(post)} className="min-w-0 flex-1 p-4 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-600">{post.savedKind === 'event' ? `Event · ${post.category || 'General'}` : post.category || 'News'}</span>
                  <h2 className="mt-1 line-clamp-2 font-semibold leading-snug text-gray-950 dark:text-white">{getLocalizedText(post.title, currentLanguage) || 'Saved story'}</h2>
                  {post.savedKind === 'event' ? (
                    <div className="mt-2 space-y-1 text-sm text-gray-500"><p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{getEventStartDate(post) ? new Date(getEventStartDate(post)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBA'}</p><p className="flex items-center gap-1.5 truncate"><MapPin className="h-3.5 w-3.5 shrink-0" />{getVenueName(post.venue)}</p></div>
                  ) : <p className="mt-2 line-clamp-2 text-sm text-gray-500">{getLocalizedText(post.content, currentLanguage)}</p>}
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Saved on {new Date(post.savedAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Bookmark}
            title={user ? 'Nothing saved here yet' : 'Sign in to see saved items'}
            description={
              !user
                ? 'Log in to save news and events and find them here on any device.'
                : searchQuery
                  ? `No saved posts match "${searchQuery}"`
                  : "Tap the bookmark icon on any news story or event to save it here."
            }
            actionText="Browse News"
            onAction={() => {/* Navigate to home */}}
          />
        )}
      </div>
    </div>
  );
};

export default SavedPosts;
