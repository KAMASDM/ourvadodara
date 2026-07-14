// =============================================
// src/components/Feed/DesktopNewsFeed.jsx
// Google News-style Desktop Feed Layout
// =============================================
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useAuth } from '../../context/Auth/AuthContext';
import { useCity } from '../../context/CityContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { db } from '../../firebase-config';
import { ref, set, remove, onValue } from 'firebase/database';
import { 
  Clock, 
  Bookmark, 
  Share2,
  BookmarkCheck,
  Eye,
  ImageOff,
  Play,
  Megaphone
} from 'lucide-react';
import { POST_TYPES } from '../../utils/mediaSchema';
import { formatTimeAgo } from '../../utils/helpers';
import ShareSheet from '../Common/ShareSheet';
import { getLocalizedText } from '../../utils/textUtils';
import InstagramCarousel from '../Media/InstagramCarousel';

// Media component with error handling for both images and videos
const PostMedia = ({ src, alt, className, fallback = true, post }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!src || error) {
    return fallback ? (
      <div className={`${className} flex items-center justify-center bg-white/40 dark:bg-white/10`}>
        <ImageOff className="w-12 h-12 text-gray-400" />
      </div>
    ) : null;
  }

  // Check if it's a video based on URL or post type
  const isVideo = src.includes('.mp4') || 
                  src.includes('.webm') || 
                  src.includes('.mov') ||
                  src.includes('video') ||
                  post?.type === 'video' ||
                  post?.type === 'reel' ||
                  post?.mediaContent?.type === 'video';

  if (isVideo) {
    const videoRef = React.useRef(null);
    const [isPlaying, setIsPlaying] = React.useState(false);

    const handleMouseEnter = () => {
      if (videoRef.current) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    };

    const handleMouseLeave = () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    };

    return (
      <>
        {loading && (
          <div className={`${className} flex items-center justify-center bg-white/40 dark:bg-white/10`}>
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <div 
          className="relative w-full h-full"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <video
            ref={videoRef}
            src={src}
            className={`${className} ${loading ? 'opacity-0 absolute' : 'opacity-100'} transition-opacity duration-300`}
            onLoadedData={() => setLoading(false)}
            onError={() => {
              setError(true);
              setLoading(false);
            }}
            muted
            playsInline
            loop
            preload="metadata"
            poster={post?.mediaContent?.items?.[0]?.thumbnail || post?.thumbnail}
          />
          {!isPlaying && !loading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-white/20 border border-white/30 backdrop-blur-xl flex items-center justify-center shadow-2xl">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      {loading && (
        <div className={`${className} flex items-center justify-center bg-white/40 dark:bg-white/10`}>
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loading ? 'opacity-0 absolute' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
    </>
  );
};

const DesktopNewsFeed = ({ feedType = 'all', category = null, onPostClick }) => {
  const { currentLanguage } = useLanguage();
  const { currentCity } = useCity();
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [shareData, setShareData] = useState(null);

  // Same persistence as the mobile feed: saved state lives in the user's
  // bookmarks so it survives reloads and matches across devices.
  useEffect(() => {
    if (!user?.uid) {
      setSavedPosts(new Set());
      return undefined;
    }
    const bookmarksRef = ref(db, `bookmarks/${user.uid}`);
    const unsubscribe = onValue(bookmarksRef, (snapshot) => {
      setSavedPosts(new Set(Object.keys(snapshot.val() || {})));
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch data - posts and carousels; reels stay on their dedicated page
  const { data: postsData, loading: postsLoading } = useRealtimeData('posts', { scope: 'global' });
  const { data: carouselsData } = useRealtimeData('carousels', { scope: 'global' });
  const { data: reelsData } = useRealtimeData(null); // Disabled for performance

  // Combine and filter posts
  const allPosts = useMemo(() => {
    let posts = [];

    if (postsData) {
      posts = Object.entries(postsData).map(([id, post]) => ({
        id,
        ...post,
        type: POST_TYPES.STANDARD,
        source: 'posts'
      })).filter(post => post.status !== 'draft' && post.status !== 'scheduled');
    }

    if (carouselsData && feedType === 'all') {
      const carousels = Object.entries(carouselsData)
        .map(([id, carousel]) => ({
          id,
          ...carousel,
          type: POST_TYPES.CAROUSEL,
          source: 'carousels'
        }))
        .filter(carousel => carousel.isPublished);
      posts = [...posts, ...carousels];
    }

    if (reelsData && feedType === 'all') {
      const reels = Object.entries(reelsData).map(([id, reel]) => ({
        id,
        ...reel,
        type: POST_TYPES.REEL,
        source: 'reels'
      }));
      posts = [...posts, ...reels];
    }

    // Filter by category if specified
    if (category && category !== 'all') {
      posts = posts.filter(post => post.category === category);
    }

    // Filter by selected city
    if (currentCity && currentCity.id) {
      posts = posts.filter(post => {
        // If post has cities array, check if current city is included
        if (post.cities && Array.isArray(post.cities)) {
          return post.cities.includes(currentCity.id);
        }
        // If post has no cities field, show it (backward compatibility)
        return true;
      });
    }

    // Sort by publish time (numeric timestamp or ISO publishedAt/createdAt)
    const postTime = (p) =>
      p.timestamp || new Date(p.publishedAt || p.createdAt || 0).getTime() || 0;
    posts.sort((a, b) => postTime(b) - postTime(a));

    return posts;
  }, [postsData, carouselsData, reelsData, category, feedType, currentCity]);

  // Use simple pagination instead of infinite scroll hook
  const [displayCount, setDisplayCount] = useState(15);
  const displayedItems = allPosts.slice(0, displayCount);
  const hasMore = displayCount < allPosts.length;
  
  const loadMore = () => {
    setDisplayCount(prev => prev + 15);
  };

  const handlePostClick = (post) => {
    // Only standard posts have a detail page; carousels/reels are inline media
    if (onPostClick && post.source === 'posts') {
      onPostClick(post.id);
    }
  };

  const getCarouselItems = (post) => {
    let items = [];
    if (post.mediaContent?.items) {
      items = Array.isArray(post.mediaContent.items)
        ? post.mediaContent.items
        : Object.values(post.mediaContent.items || {});
    } else if (post.media) {
      items = Array.isArray(post.media) ? post.media : Object.values(post.media || {});
    } else if (post.images) {
      items = Array.isArray(post.images) ? post.images : Object.values(post.images || {});
    }
    return items;
  };

  const isCarouselPost = (post) =>
    post.source === 'carousels' || getCarouselItems(post).length > 1;

  const handleAdvertiseClick = () => {
    window.history.pushState({ view: 'advertise' }, '', '/advertise');
    window.dispatchEvent(new Event('popstate'));
  };

  const handleSave = async (postId, e) => {
    e.stopPropagation();

    // Match the mobile app: saving requires an account.
    if (!user) {
      document.dispatchEvent(new CustomEvent('showGuestPrompt'));
      return;
    }

    const wasSaved = savedPosts.has(postId);
    setSavedPosts(prev => {
      const newSet = new Set(prev);
      if (wasSaved) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });

    try {
      const bookmarkRef = ref(db, `bookmarks/${user.uid}/${postId}`);
      if (wasSaved) {
        await remove(bookmarkRef);
      } else {
        await set(bookmarkRef, {
          timestamp: Date.now(),
          type: 'post',
          source: 'posts'
        });
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
      setSavedPosts(prev => {
        const newSet = new Set(prev);
        if (wasSaved) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
    }
  };

  const handleShare = (post, e) => {
    e.stopPropagation();
    setShareData({
      title: getLocalizedText(post.title, currentLanguage),
      url: `${window.location.origin}/post/${post.id}`
    });
    setShareSheetOpen(true);
  };

  const getPostImage = (post) => {
    if (post.mediaContent?.items?.[0]?.url) {
      return post.mediaContent.items[0].url;
    }
    if (post.media?.[0]?.url) {
      return post.media[0].url;
    }
    if (post.images?.[0]) {
      return post.images[0];
    }
    return null;
  };

  const getPostTitle = (post) => {
    if (!post.title) return 'Untitled';
    
    // If title is a string, return it
    if (typeof post.title === 'string') return post.title;
    
    // If title is an object, get the current language or fallback
    if (typeof post.title === 'object') {
      return post.title[currentLanguage] || 
             post.title.en || 
             post.title.gu || 
             post.title.hi || 
             'Untitled';
    }
    
    return 'Untitled';
  };

  const getPostDescription = (post) => {
    const stripped = getLocalizedText(post.description, currentLanguage) || getLocalizedText(post.content, currentLanguage);
    return stripped.slice(0, 150) + (stripped.length > 150 ? '...' : '');
  };

  if (postsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!displayedItems || displayedItems.length === 0) {
    return (
      <div className="liquid-card text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">No posts available</p>
      </div>
    );
  }

  // Split posts for layout — hero slots need a cover image + detail page,
  // so they only take standard posts; carousels render inline in the grid.
  const standardItems = displayedItems.filter(post => post.source === 'posts');
  const featuredPost = standardItems[0];
  const sidePosts = standardItems.slice(1, 3);
  const heroIds = new Set([featuredPost, ...sidePosts].filter(Boolean).map(post => post.id));
  const gridPosts = displayedItems.filter(post => !heroIds.has(post.id));

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[1600px] px-0 py-4">
        {/* Header Section */}
        <div className="liquid-panel rounded-3xl px-6 py-5 mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-950 dark:text-white mb-2">
                {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} News` : 'Latest News'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Stay updated with the latest news and stories
              </p>
            </div>
            <button
              type="button"
              onClick={handleAdvertiseClick}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 active:scale-95"
            >
              <Megaphone className="h-4 w-4" />
              Contact us to advertise on Our Vadodara
            </button>
          </div>
        </div>

        {/* Featured Story Section */}
        {featuredPost && (
          <section className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
              {/* Main Featured Post */}
            <div
              onClick={() => handlePostClick(featuredPost)}
              className="liquid-card overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 group"
            >
              {getPostImage(featuredPost) && (
                <div className="relative overflow-hidden rounded-t-3xl h-[480px]">
                  <PostMedia 
                    src={getPostImage(featuredPost)} 
                    alt={getPostTitle(featuredPost)}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    post={featuredPost}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                  {featuredPost.category && (
                    <div className="absolute top-5 left-5 liquid-chip !bg-blue-600/80 text-white text-sm font-bold shadow-xl">
                      {featuredPost.category}
                    </div>
                  )}
                  {featuredPost.isBreaking && (
                    <div className="absolute top-5 right-5 px-3 py-1.5 bg-red-600 text-white text-sm font-bold rounded-full shadow-xl animate-pulse flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                      BREAKING
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h2 className="text-3xl font-bold leading-tight text-white mb-3 drop-shadow-lg">
                      {getPostTitle(featuredPost)}
                    </h2>
                    {getPostDescription(featuredPost) && (
                      <p className="text-base text-white/90 line-clamp-2 leading-relaxed drop-shadow-md">
                        {getPostDescription(featuredPost)}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div className="p-6 border-t border-white/50 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{formatTimeAgo(featuredPost.timestamp)}</span>
                    </div>
                    {featuredPost.views && (
                      <>
                        <span className="text-gray-300 dark:text-gray-700">•</span>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Eye className="w-4 h-4" />
                          <span className="font-medium">{featuredPost.views}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleSave(featuredPost.id, e)}
                      className="liquid-action p-2.5 rounded-full transition-all duration-200"
                      title="Save"
                    >
                      {savedPosts.has(featuredPost.id) ? (
                        <BookmarkCheck className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Bookmark className="w-5 h-5 text-gray-500 hover:text-blue-600" />
                      )}
                    </button>
                    <button
                      onClick={(e) => handleShare(featuredPost, e)}
                      className="liquid-action p-2.5 rounded-full transition-all duration-200"
                      title="Share"
                    >
                      <Share2 className="w-5 h-5 text-gray-500 hover:text-blue-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          {/* Side Featured Posts */}
          <div className="flex flex-col gap-5">
            {sidePosts.map((post) => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post)}
                className="liquid-card overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 group"
              >
                {getPostImage(post) && (
                  <div className="relative overflow-hidden rounded-t-3xl h-[160px]">
                    <PostMedia 
                      src={getPostImage(post)} 
                      alt={getPostTitle(post)}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      post={post}
                    />
                    {post.category && (
                      <div className="absolute top-3 left-3 liquid-chip !bg-blue-600/80 text-white text-xs font-semibold">
                        {post.category}
                      </div>
                    )}
                  </div>
                )}
                <div className="p-5">
                  <h3 className="text-base font-bold leading-snug mb-3 text-slate-950 dark:text-white line-clamp-3 group-hover:text-blue-700 dark:group-hover:text-sky-300 transition-colors">
                    {getPostTitle(post)}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTimeAgo(post.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
          </section>
        )}

        {/* News Grid - Modern 4-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-12">
          {gridPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => handlePostClick(post)}
              className={`liquid-card overflow-hidden transition-all duration-300 hover:-translate-y-1 group ${
                post.source === 'posts' ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {isCarouselPost(post) ? (
                <div
                  className="relative overflow-hidden rounded-t-3xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <InstagramCarousel
                    images={getCarouselItems(post)}
                    className="w-full"
                    aspectRatio="1/1"
                    showDots={true}
                    enableSwipe={true}
                    enableKeyboard={false}
                  />
                  {post.category && (
                    <div className="absolute top-3 left-3 z-10 liquid-chip !bg-blue-600/80 text-white text-xs font-bold">
                      {post.category}
                    </div>
                  )}
                </div>
              ) : getPostImage(post) && (
                <div className="relative overflow-hidden rounded-t-3xl h-[200px]">
                  <PostMedia
                    src={getPostImage(post)}
                    alt={getPostTitle(post)}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    post={post}
                  />
                  {post.category && (
                    <div className="absolute top-3 left-3 liquid-chip !bg-blue-600/80 text-white text-xs font-bold">
                      {post.category}
                    </div>
                  )}
                  {post.isBreaking && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                      LIVE
                    </div>
                  )}
                </div>
              )}
              <div className="p-5">
                <h3 className="text-base font-bold leading-tight mb-3 text-slate-950 dark:text-white line-clamp-3 group-hover:text-blue-700 dark:group-hover:text-sky-300 transition-colors min-h-[3.6rem]">
                  {getPostTitle(post)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                  {getPostDescription(post)}
                </p>
                <div className="flex items-center gap-4 pt-3 border-t border-white/50 dark:border-white/10">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{post.views || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{post.shares || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="text-center mt-12 mb-8">
            <button
              onClick={loadMore}
              className="btn-primary px-8 py-3.5 text-white rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Load More Stories
            </button>
          </div>
        )}
        
        {/* Share Sheet */}
        {shareSheetOpen && shareData && (
          <ShareSheet
            isOpen={shareSheetOpen}
            onClose={() => setShareSheetOpen(false)}
            title={shareData.title}
            url={shareData.url}
          />
        )}
      </div>
    </div>
  );
};

export default DesktopNewsFeed;
