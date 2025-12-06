// =============================================
// src/components/Feed/DesktopNewsFeed.jsx
// Google News-style Desktop Feed Layout
// =============================================
import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { 
  Clock, 
  Bookmark, 
  Share2,
  BookmarkCheck,
  Eye,
  ImageOff,
  Play
} from 'lucide-react';
import { POST_TYPES } from '../../utils/mediaSchema';
import { formatTimeAgo } from '../../utils/helpers';
import ShareSheet from '../Common/ShareSheet';

// Media component with error handling for both images and videos
const PostMedia = ({ src, alt, className, fallback = true, post }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!src || error) {
    return fallback ? (
      <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-800`}>
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
          <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-800`}>
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
              <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
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
        <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-800`}>
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
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [shareData, setShareData] = useState(null);

  // Fetch data
  const { data: postsData, loading: postsLoading } = useRealtimeData('posts');
  const { data: carouselsData } = useRealtimeData('carousels');
  const { data: reelsData } = useRealtimeData('reels');

  // Combine and filter posts
  const allPosts = useMemo(() => {
    let posts = [];

    if (postsData) {
      posts = Object.entries(postsData).map(([id, post]) => ({
        id,
        ...post,
        type: POST_TYPES.STANDARD,
        source: 'posts'
      })).filter(post => post.status !== 'draft');
    }

    if (carouselsData && feedType === 'all') {
      const carousels = Object.entries(carouselsData).map(([id, carousel]) => ({
        id,
        ...carousel,
        type: POST_TYPES.CAROUSEL,
        source: 'carousels'
      }));
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

    // Sort by timestamp
    posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return posts;
  }, [postsData, carouselsData, reelsData, category, feedType]);

  // Use simple pagination instead of infinite scroll hook
  const [displayCount, setDisplayCount] = useState(15);
  const displayedItems = allPosts.slice(0, displayCount);
  const hasMore = displayCount < allPosts.length;
  
  const loadMore = () => {
    setDisplayCount(prev => prev + 15);
  };

  const handlePostClick = (postId) => {
    if (onPostClick) {
      onPostClick(postId);
    }
  };

  const handleSave = (postId, e) => {
    e.stopPropagation();
    setSavedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleShare = (post, e) => {
    e.stopPropagation();
    setShareData({
      title: post.title?.[currentLanguage] || post.title?.en || '',
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
    // Try description first, then fall back to content
    let text = post.description?.[currentLanguage] || 
               post.description?.en || 
               post.description?.gu ||
               post.description?.hi ||
               post.content?.[currentLanguage] || 
               post.content?.en || 
               post.content?.gu ||
               post.content?.hi ||
               '';
    
    // If description/content is an object but we haven't extracted a string yet
    if (typeof text === 'object' && text !== null) {
      text = text[currentLanguage] || text.en || text.gu || text.hi || '';
    }
    
    // Ensure we have a string
    const textStr = typeof text === 'string' ? text : '';
    
    // Strip HTML tags
    const stripped = textStr.replace(/<[^>]*>/g, '');
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
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">No posts available</p>
      </div>
    );
  }

  // Split posts for layout
  const featuredPost = displayedItems[0];
  const sidePosts = displayedItems.slice(1, 3);
  const gridPosts = displayedItems.slice(3);

  return (
    <div className="w-full bg-gray-50 dark:bg-gray-950">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} News` : 'Latest News'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated with the latest news and stories
          </p>
        </div>

        {/* Featured Story Section */}
        {featuredPost && (
          <section className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
              {/* Main Featured Post */}
            <div 
              onClick={() => handlePostClick(featuredPost.id)}
              className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 dark:hover:shadow-2xl group border border-gray-200 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900"
            >
              {getPostImage(featuredPost) && (
                <div className="relative overflow-hidden h-[480px]">
                  <PostMedia 
                    src={getPostImage(featuredPost)} 
                    alt={getPostTitle(featuredPost)}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    post={featuredPost}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                  {featuredPost.category && (
                    <div className="absolute top-5 left-5 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-bold rounded-full shadow-xl backdrop-blur-sm">
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
              <div className="p-6 border-t border-gray-100 dark:border-gray-800">
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
                      className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all duration-200"
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
                      className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all duration-200"
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
                onClick={() => handlePostClick(post.id)}
                className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-xl dark:hover:shadow-2xl group border border-gray-200 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900"
              >
                {getPostImage(post) && (
                  <div className="relative overflow-hidden h-[160px]">
                    <PostMedia 
                      src={getPostImage(post)} 
                      alt={getPostTitle(post)}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      post={post}
                    />
                    {post.category && (
                      <div className="absolute top-3 left-3 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full shadow-lg">
                        {post.category}
                      </div>
                    )}
                  </div>
                )}
                <div className="p-5">
                  <h3 className="text-base font-bold leading-snug mb-3 text-gray-900 dark:text-white line-clamp-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
              onClick={() => handlePostClick(post.id)}
              className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:hover:shadow-2xl group border border-gray-200 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900"
            >
              {getPostImage(post) && (
                <div className="relative overflow-hidden h-[200px]">
                  <PostMedia 
                    src={getPostImage(post)} 
                    alt={getPostTitle(post)}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    post={post}
                  />
                  {post.category && (
                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm">
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
                <h3 className="text-base font-bold leading-tight mb-3 text-gray-900 dark:text-white line-clamp-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors min-h-[3.6rem]">
                  {getPostTitle(post)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                  {getPostDescription(post)}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTimeAgo(post.timestamp)}</span>
                  </div>
                  {post.views && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{post.views}</span>
                    </div>
                  )}
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
              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
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
