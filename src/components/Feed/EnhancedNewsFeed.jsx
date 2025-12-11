// =============================================
// src/components/Feed/EnhancedNewsFeed.jsx
// Enhanced News Feed with Full Media Support + Infinite Scroll
// =============================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useAuth } from '../../context/Auth/AuthContext';
import { useCity } from '../../context/CityContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useDoubleTap } from '../../hooks/useDoubleTap';
import logoImage from '../../assets/images/our-vadodara-logo.png.png';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreVertical,
  Eye,
  Clock,
  MapPin,
  Loader2
} from 'lucide-react';
import MediaRenderer from '../Media/MediaRenderer';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import HeartAnimation from '../Common/HeartAnimation';
import ShareSheet from '../Common/ShareSheet';
import { FeedSkeleton, ReelsGridSkeleton } from '../Common/SkeletonLoader';
import { POST_TYPES } from '../../utils/mediaSchema';
import { sampleNews } from '../../data/newsData';

const EnhancedNewsFeed = ({ activeCategory, onPostClick, feedType = 'all' }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const { currentCity } = useCity();
  
  // Fetch different types of posts
  const { data: postsData, isLoading: postsLoading } = useRealtimeData('posts');
  const { data: storiesData, isLoading: storiesLoading } = useRealtimeData('stories');
  const { data: reelsData, isLoading: reelsLoading } = useRealtimeData('reels');
  const { data: carouselsData, isLoading: carouselsLoading } = useRealtimeData('carousels');

  const [likedPosts, setLikedPosts] = useState(new Set());
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [expandedPosts, setExpandedPosts] = useState(new Set());
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [shareData, setShareData] = useState(null);

  const isLoading = postsLoading || storiesLoading || reelsLoading || carouselsLoading;

  // Combine all posts from different sources
  const getAllPosts = () => {
    let allPosts = [];

    // Standard posts
    if (postsData && Object.keys(postsData).length > 0) {
      const posts = Object.entries(postsData).map(([id, post]) => ({
        id,
        ...post,
        type: post.type || POST_TYPES.STANDARD,
        source: 'posts'
      })).filter(post => (post.status || 'published') !== 'draft');
      
      allPosts = [...allPosts, ...posts];
    }

    // Stories (only non-expired ones for feed)
    if (storiesData && Object.keys(storiesData).length > 0 && feedType !== 'reels') {
      const stories = Object.entries(storiesData)
        .map(([id, story]) => ({ id, ...story }))
        .filter(story => new Date(story.expiresAt) > new Date() && story.isActive)
        .map(story => ({
          ...story,
          type: POST_TYPES.STORY,
          source: 'stories'
        }));
      allPosts = [...allPosts, ...stories];
    }

    // Reels
    if (reelsData && Object.keys(reelsData).length > 0) {
      const reels = Object.entries(reelsData)
        .map(([id, reel]) => ({ id, ...reel }))
        .filter(reel => reel.isPublished)
        .map(reel => ({
          ...reel,
          type: POST_TYPES.REEL,
          source: 'reels'
        }));
      allPosts = [...allPosts, ...reels];
    }

    // Carousels
    if (carouselsData && Object.keys(carouselsData).length > 0) {
      const carousels = Object.entries(carouselsData)
        .map(([id, carousel]) => ({ id, ...carousel }))
        .filter(carousel => carousel.isPublished)
        .map(carousel => ({
          ...carousel,
          type: POST_TYPES.CAROUSEL,
          source: 'carousels'
        }));
      allPosts = [...allPosts, ...carousels];
    }

    // Only show sample data if we're still loading or explicitly have no data at all
    if (allPosts.length === 0 && !postsLoading && !storiesLoading && !reelsLoading && !carouselsLoading) {
      allPosts = sampleNews.map(post => ({
        ...post,
        type: POST_TYPES.STANDARD,
        source: 'sample',
        mediaContent: post.image ? {
          type: 'single_image',
          items: [{
            id: '1',
            type: 'image',
            url: post.image,
            caption: { en: post.title.en, hi: post.title.hi, gu: post.title.gu }
          }]
        } : null
      }));
    }

    // Convert legacy posts to new format
    allPosts = allPosts.map(post => {
      // Handle legacy image field
      if (!post.mediaContent && post.image) {
        return {
          ...post,
          mediaContent: {
            type: 'single_image',
            items: [{
              id: 'legacy_' + post.id,
              type: 'image',
              url: post.image,
              caption: { en: post.title?.en || post.title, hi: post.title?.hi || '', gu: post.title?.gu || '' }
            }]
          }
        };
      }
      
      // Handle legacy media array
      if (!post.mediaContent && post.media && Array.isArray(post.media)) {
        return {
          ...post,
          mediaContent: {
            type: post.media.length > 1 ? 'carousel' : 'single_image',
            items: post.media.map((media, index) => ({
              id: 'media_' + post.id + '_' + index,
              type: media.type || (media.url && media.url.includes('video') ? 'video' : 'image'),
              url: media.url,
              caption: media.caption || { en: '', hi: '', gu: '' }
            }))
          }
        };
      }
      
      return post;
    });

    return allPosts;
  };

  // Filter posts based on category and feed type using useMemo for performance
  const filteredPosts = useMemo(() => {
    let posts = getAllPosts();

    // Filter by city
    if (currentCity && currentCity.id) {
      posts = posts.filter(post => {
        // Check if post has cities array and includes current city
        if (post.cities && Array.isArray(post.cities)) {
          return post.cities.includes(currentCity.id);
        }
        // Show posts without city data (backward compatibility)
        return true;
      });
    }

    // Filter by feed type
    if (feedType === 'reels') {
      posts = posts.filter(post => post.type === POST_TYPES.REEL);
    } else if (feedType === 'stories') {
      posts = posts.filter(post => post.type === POST_TYPES.STORY);
    }

    // Filter by category
    if (activeCategory && activeCategory !== 'all') {
      posts = posts.filter(post => post.category === activeCategory);
    }

    // Sort by date (most recent first)
    return posts.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt);
      const dateB = new Date(b.publishedAt || b.createdAt);
      return dateB - dateA;
    });
  }, [postsData, storiesData, reelsData, carouselsData, activeCategory, feedType, currentCity]);

  // Apply infinite scroll pagination
  const { items: paginatedPosts, hasMore, isFetching, sentinelRef } = useInfiniteScroll(
    filteredPosts,
    { pageSize: 20, threshold: 500 }
  );

  // Handle post interactions
  const handleLike = async (postId) => {
    setLikedPosts(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(postId)) {
        newLiked.delete(postId);
      } else {
        newLiked.add(postId);
      }
      return newLiked;
    });

    // TODO: Update Firebase with like status
  };

  const handleSave = async (postId) => {
    setSavedPosts(prev => {
      const newSaved = new Set(prev);
      if (newSaved.has(postId)) {
        newSaved.delete(postId);
      } else {
        newSaved.add(postId);
      }
      return newSaved;
    });

    // TODO: Update Firebase with saved status
  };

  const handleShare = async (post) => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    const shareTitle = post.title[currentLanguage] || post.title.en;
    const shareText = post.excerpt?.[currentLanguage] || post.content?.[currentLanguage];

    setShareData({
      title: shareTitle,
      text: shareText,
      url: shareUrl
    });
    setShareSheetOpen(true);
  };

  const toggleExpanded = (postId) => {
    setExpandedPosts(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(postId)) {
        newExpanded.delete(postId);
      } else {
        newExpanded.add(postId);
      }
      return newExpanded;
    });
  };

  const handleMediaInteraction = (type, data) => {
    // Handle media-specific interactions (video play, carousel navigation, etc.)
  };

  if (isLoading) {
    return feedType === 'reels' ? (
      <ReelsGridSkeleton count={6} />
    ) : (
      <FeedSkeleton count={5} />
    );
  }

  if (filteredPosts.length === 0) {
    return <EmptyState type="no-content" />;
  }

  // Render different layouts based on feed type
  if (feedType === 'reels') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {paginatedPosts.map((post, index) => (
          <ReelCard 
            key={post.id || `reel-post-${index}`} 
            post={post} 
            onLike={() => handleLike(post.id)}
            onSave={() => handleSave(post.id)}
            onShare={() => handleShare(post)}
            isLiked={likedPosts.has(post.id)}
            isSaved={savedPosts.has(post.id)}
            currentLanguage={currentLanguage}
          />
        ))}
        {/* Infinite scroll sentinel */}
        {hasMore && (
          <div ref={sentinelRef} className="col-span-full flex items-center justify-center py-8">
            {isFetching && <Loader2 className="w-6 h-6 animate-spin text-blue-600" />}
          </div>
        )}
      </div>
    );
  }

  // Standard feed layout
  return (
    <div className="flex flex-col gap-6 px-3 pb-8 sm:px-4">
      {paginatedPosts.map((post, index) => {
        return (
          <PostCard 
            key={post.id || `post-${index}`}
            post={post} 
            onPostClick={onPostClick}
            onLike={() => handleLike(post.id)}
            onSave={() => handleSave(post.id)}
            onShare={() => handleShare(post)}
            onMediaInteraction={handleMediaInteraction}
            isLiked={likedPosts.has(post.id)}
            isSaved={savedPosts.has(post.id)}
            isExpanded={expandedPosts.has(post.id)}
            onToggleExpanded={() => toggleExpanded(post.id)}
            currentLanguage={currentLanguage}
          />
        );
      })}
      
      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="flex items-center justify-center py-8">
          {isFetching && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading more posts...</p>
            </div>
          )}
        </div>
      )}
      
      {!hasMore && paginatedPosts.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">You've reached the end! 🎉</p>
        </div>
      )}
      
      {/* Share Sheet */}
      <ShareSheet
        isOpen={shareSheetOpen}
        onClose={() => setShareSheetOpen(false)}
        shareData={shareData}
      />
    </div>
  );
};

// Enhanced Post Card Component
const PostCard = ({ 
  post, 
  onPostClick, 
  onLike, 
  onSave, 
  onShare, 
  onMediaInteraction,
  isLiked, 
  isSaved, 
  isExpanded,
  onToggleExpanded,
  currentLanguage 
}) => {
  // Strip HTML tags helper function
  const stripHtmlTags = (html) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const title = post.title?.[currentLanguage] || post.title?.en || 'Untitled';
  const rawContent = post.content?.[currentLanguage] || post.content?.en || '';
  const rawExcerpt = post.excerpt?.[currentLanguage] || post.excerpt?.en || '';
  
  // Strip HTML from content and excerpt
  const content = stripHtmlTags(rawContent);
  const excerpt = stripHtmlTags(rawExcerpt);
  
  // Handle both new mediaContent structure and legacy media array
  let mediaItems = [];
  if (post.mediaContent?.items) {
    mediaItems = Array.isArray(post.mediaContent.items)
      ? post.mediaContent.items
      : Object.values(post.mediaContent.items || {});
  } else if (post.media) {
    // Legacy media array for standard posts
    mediaItems = Array.isArray(post.media)
      ? post.media
      : Object.values(post.media || {});
  }
  
  const hasMedia = mediaItems.length > 0;
  const isCarouselPost = mediaItems.length > 1;
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselTotal, setCarouselTotal] = useState(mediaItems.length);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });
  const viewCount = post.analytics?.views ?? post.views ?? 0;
  const likeCount = post.analytics?.likes ?? post.likes ?? 0;
  const commentCount = post.analytics?.comments ?? post.comments ?? 0;
  const shareCount = post.analytics?.shares ?? post.shares ?? 0;
  const showStats = viewCount !== null || likeCount > 0 || commentCount > 0 || shareCount > 0;

  // Double-tap to like handler
  const handleDoubleTap = useDoubleTap((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX || (event.touches?.[0]?.clientX ?? rect.left + rect.width / 2);
    const y = event.clientY || (event.touches?.[0]?.clientY ?? rect.top + rect.height / 2);
    
    setHeartPosition({ x, y });
    setShowHeartAnimation(true);
    
    // Trigger like if not already liked
    if (!isLiked) {
      onLike();
      
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  });

  useEffect(() => {
    setCarouselIndex(0);
    setCarouselTotal(mediaItems.length);
  }, [post.id]);

  const handleCarouselChange = useCallback((index, total) => {
    const nextIndex = Number.isFinite(index) ? index : 0;
    const nextTotal = Number.isFinite(total) ? total : mediaItems.length;

    setCarouselIndex(prev => (prev === nextIndex ? prev : nextIndex));
    setCarouselTotal(prevTotal => (prevTotal === nextTotal ? prevTotal : nextTotal));
  }, [mediaItems.length]);
  
  const displayContent = isExpanded ? content : (excerpt || content?.substring(0, 150) + '...');
  const shouldShowReadMore = content.length > 150;
  const isClickable = post.source === 'posts';
  const titleClasses = `text-xl font-semibold text-warmBrown-900 dark:text-white tracking-tight transition-colors ${
    isClickable ? 'cursor-pointer hover:text-warmBrown-600 dark:hover:text-blue-400' : 'cursor-default'
  }`;
  const authorName = 'Our Vadodara';
  const authorAvatar = logoImage;

  return (
    <article className="group relative overflow-hidden border-y-2 border-warmBrown-200 dark:border-gray-700/60 bg-gradient-to-b from-ivory-50 via-ivory-100 to-ivory-200 dark:from-gray-900/95 dark:via-gray-900 dark:to-gray-950 shadow-sm hover:shadow-md dark:shadow-black/40 transition-all duration-300 mb-0">
      {/* Heart animation overlay */}
      <HeartAnimation
        show={showHeartAnimation}
        position={heartPosition}
        onComplete={() => setShowHeartAnimation(false)}
      />
      
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_top_left,rgba(168,146,111,0.15),transparent_55%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.3),transparent_55%)]"></div>

      {/* Post Header */}
      <div className="relative px-4 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-warmBrown-200 to-ivory-100 dark:from-blue-500/20 dark:to-transparent flex items-center justify-center shadow-inner">
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="w-10 h-10 rounded-full border-2 border-warmBrown-300 dark:border-gray-800 shadow-md object-contain bg-white p-1"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-ivory-50 dark:border-gray-900 bg-emerald-500 shadow-sm"></span>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-warmBrown-900 dark:text-white text-sm sm:text-base">
                  {authorName}
                </h3>
                {post.type !== POST_TYPES.STANDARD && (
                  <span className={`text-[11px] tracking-wide uppercase px-2 py-0.5 rounded-full font-semibold border ${
                    post.type === POST_TYPES.STORY ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-700' :
                    post.type === POST_TYPES.REEL ? 'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-900/50 dark:text-pink-200 dark:border-pink-700' :
                    post.type === POST_TYPES.CAROUSEL ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800/70 dark:text-gray-200'
                  }`}>
                    {post.type.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(post.publishedAt || post.createdAt)}
                </span>
                {post.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {post.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-transparent bg-gray-100/80 text-gray-500 transition-colors hover:border-gray-200 hover:text-gray-700 dark:bg-gray-800/70 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-200">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="relative px-4 pt-4">
        {title && (
          <h2 
            className={titleClasses}
            onClick={isClickable ? () => onPostClick(post.id) : undefined}
          >
            {title}
          </h2>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {post.isBreaking && (
            <span className="bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded-full shadow-sm animate-pulse border border-red-700">
              BREAKING
            </span>
          )}
          {post.isFeatured && (
            <span className="bg-blue-600/90 text-white text-[11px] font-semibold px-2 py-1 rounded-full shadow-sm border border-blue-700">
              FEATURED
            </span>
          )}
          {post.isUrgent && (
            <span className="bg-orange-500 text-white text-[11px] font-semibold px-2 py-1 rounded-full shadow-sm border border-orange-600">
              URGENT
            </span>
          )}
        </div>

        {displayContent && (
          <div className="mt-3 text-sm leading-relaxed text-warmBrown-800 dark:text-gray-300">
            <p>{displayContent}</p>
            {shouldShowReadMore && (
              <button
                onClick={onToggleExpanded}
                className="mt-2 inline-flex items-center text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline"
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Media Content */}
      {hasMedia && (
        <div className="relative mt-5">
          <div 
            className="overflow-hidden bg-black dark:bg-gray-900 cursor-pointer select-none"
            onClick={handleDoubleTap}
            onTouchStart={handleDoubleTap}
          >
            <MediaRenderer
              post={post}
              className="w-full"
              showControls={post.type === POST_TYPES.REEL}
              onInteraction={onMediaInteraction}
              showCarouselDots={!isCarouselPost}
              onCarouselChange={handleCarouselChange}
              externalCarouselIndex={carouselIndex}
            />
          </div>

          {isCarouselPost && carouselTotal > 1 && (
            <div className="mt-3 flex justify-center space-x-2 px-4">
              {Array.from({ length: carouselTotal }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                      setCarouselIndex(prev => (prev === index ? prev : index));
                  }}
                  type="button"
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === carouselIndex
                      ? 'bg-black dark:bg-white scale-125 shadow-md shadow-black/40 dark:shadow-white/40'
                      : 'bg-black/20 hover:bg-black/40 dark:bg-white/40 dark:hover:bg-white/60'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category, Tags & Stats */}
      {(post.category || (post.tags && post.tags.length > 0) || showStats) && (
        <div className="relative mt-5 px-4">
          <div className="flex flex-wrap items-center gap-2">
            {post.category && (
              <span className="rounded-full bg-ivory-200 text-warmBrown-800 border border-warmBrown-300 px-3 py-1 text-xs font-medium dark:bg-gray-800/70 dark:text-gray-200 dark:border-gray-700">
                {post.category}
              </span>
            )}
            {post.tags && post.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="rounded-full bg-warmBrown-100 text-warmBrown-700 border border-warmBrown-200 px-3 py-1 text-xs font-medium dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-700">
                #{tag}
              </span>
            ))}
          </div>

          {showStats && (
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-warmBrown-600 dark:text-gray-400">
              {viewCount !== null && (
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {formatNumber(Math.max(0, viewCount))} views
                </span>
              )}
              {likeCount > 0 && (
                <span>{formatNumber(likeCount)} likes</span>
              )}
              {commentCount > 0 && (
                <span>{formatNumber(commentCount)} comments</span>
              )}
              {shareCount > 0 && (
                <span>{formatNumber(shareCount)} shares</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="relative mt-6 border-t border-warmBrown-200 dark:border-gray-800 bg-ivory-50/70 dark:bg-gray-900/60 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={onLike}
              className={`flex items-center gap-2 rounded-full px-3 py-2 transition-colors ${
                isLiked 
                  ? 'bg-red-500/10 text-red-500 dark:bg-red-500/20' 
                  : 'text-warmBrown-700 dark:text-gray-300 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">Like</span>
            </button>

            <button
              onClick={isClickable ? () => onPostClick(post.id) : undefined}
              className={`flex items-center gap-2 rounded-full px-3 py-2 transition-colors ${
                isClickable
                  ? 'text-warmBrown-700 dark:text-gray-300 hover:text-warmBrown-500 hover:bg-warmBrown-100 dark:hover:bg-blue-500/20'
                  : 'text-warmBrown-400 dark:text-gray-500 cursor-not-allowed opacity-60'
              }`}
              disabled={!isClickable}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Comment</span>
            </button>

            <button
              onClick={onShare}
              className="flex items-center gap-2 rounded-full px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium">Share</span>
            </button>
          </div>

          <button
            onClick={onSave}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              isSaved 
                ? 'bg-blue-500/15 text-blue-500 dark:bg-blue-500/20' 
                : 'text-gray-600 dark:text-gray-300 hover:text-blue-500 hover:bg-blue-500/10 dark:hover:bg-blue-500/20'
            }`}
            aria-label="Save post"
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  );
};

// Reel Card Component (for reel grid view)
const ReelCard = ({ post, onLike, onSave, onShare, isLiked, isSaved, currentLanguage }) => {
  const title = post.title?.[currentLanguage] || post.title?.en || 'Untitled';
  const authorName = 'Our Vadodara';
  const viewCount = post.analytics?.views ?? post.views ?? 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Reel Video */}
      <div className="relative aspect-[9/16]">
        <MediaRenderer
          post={post}
          className="w-full h-full"
          showControls={true}
        />
        
        {/* Overlay info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
            {title}
          </h3>
          
          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full bg-white p-0.5 flex items-center justify-center">
                <img
                  src={logoImage}
                  alt={authorName}
                  className="w-full h-full rounded-full object-contain bg-white"
                />
              </div>
              <span>{authorName}</span>
            </div>
            
            {viewCount !== null && (
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>{formatNumber(Math.max(0, viewCount))}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onLike}
            className={`transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          
          <button
            onClick={onShare}
            className="text-gray-500 hover:text-blue-500 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        
        <button
          onClick={onSave}
          className={`transition-colors ${
            isSaved ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
          }`}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
};

// Utility functions
const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now - time) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return time.toLocaleDateString();
};

const formatNumber = (num) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export default EnhancedNewsFeed;