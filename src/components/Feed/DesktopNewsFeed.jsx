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
  BookmarkCheck
} from 'lucide-react';
import { POST_TYPES } from '../../utils/mediaSchema';
import { formatTimeAgo } from '../../utils/helpers';
import ShareSheet from '../Common/ShareSheet';

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

    console.log('DesktopNewsFeed: Total posts:', posts.length);
    return posts;
  }, [postsData, carouselsData, reelsData, category, feedType]);

  // Use simple pagination instead of infinite scroll hook
  const [displayCount, setDisplayCount] = useState(12);
  const displayedItems = allPosts.slice(0, displayCount);
  const hasMore = displayCount < allPosts.length;
  
  const loadMore = () => {
    setDisplayCount(prev => prev + 12);
  };

  console.log('DesktopNewsFeed: Displayed items:', displayedItems?.length);

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
    return post.title?.[currentLanguage] || post.title?.en || post.title || 'Untitled';
  };

  const getPostDescription = (post) => {
    const desc = post.description?.[currentLanguage] || post.description?.en || post.description || '';
    // Strip HTML tags
    const stripped = desc.replace(/<[^>]*>/g, '');
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
    <div className="max-w-[1280px] mx-auto px-6 py-6">
      {/* Top Stories Section */}
      <section className="mb-12">
        <h2 className="text-base font-medium mb-4 text-gray-900 dark:text-white">Top stories</h2>
        
        {/* Featured Grid */}
        <div className="grid grid-cols-[2fr_1fr] gap-4 mb-8">
          {/* Main Featured Post */}
          {featuredPost && (
            <div 
              onClick={() => handlePostClick(featuredPost.id)}
              className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden cursor-pointer transition-shadow hover:shadow-[0_1px_6px_rgba(32,33,36,0.28)] dark:hover:shadow-[0_1px_6px_rgba(0,0,0,0.4)]"
            >
              {getPostImage(featuredPost) && (
                <img 
                  src={getPostImage(featuredPost)} 
                  alt={getPostTitle(featuredPost)}
                  className="w-full h-[400px] object-cover"
                />
              )}
              <div className="p-4">
                <h2 className="text-2xl font-normal leading-snug mb-2 text-gray-900 dark:text-white">
                  {getPostTitle(featuredPost)}
                </h2>
                {getPostDescription(featuredPost) && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {getPostDescription(featuredPost)}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Our Vadodara</span>
                  <span>•</span>
                  <span className="text-gray-400 dark:text-gray-500">
                    {formatTimeAgo(featuredPost.timestamp)}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={(e) => handleSave(featuredPost.id, e)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                      {savedPosts.has(featuredPost.id) ? (
                        <BookmarkCheck className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => handleShare(featuredPost, e)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Side Featured Posts */}
          <div className="flex flex-col gap-4">
            {sidePosts.map((post) => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden cursor-pointer transition-shadow hover:shadow-[0_1px_6px_rgba(32,33,36,0.28)] dark:hover:shadow-[0_1px_6px_rgba(0,0,0,0.4)]"
              >
                {getPostImage(post) && (
                  <img 
                    src={getPostImage(post)} 
                    alt={getPostTitle(post)}
                    className="w-full h-[180px] object-cover"
                  />
                )}
                <div className="p-3">
                  <h3 className="text-base font-normal leading-snug mb-2 text-gray-900 dark:text-white line-clamp-3">
                    {getPostTitle(post)}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Our Vadodara</span>
                    <span>•</span>
                    <span className="text-gray-400 dark:text-gray-500">
                      {formatTimeAgo(post.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {gridPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => handlePostClick(post.id)}
              className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden cursor-pointer transition-shadow hover:shadow-[0_1px_6px_rgba(32,33,36,0.28)] dark:hover:shadow-[0_1px_6px_rgba(0,0,0,0.4)]"
            >
              {getPostImage(post) && (
                <img 
                  src={getPostImage(post)} 
                  alt={getPostTitle(post)}
                  className="w-full h-[160px] object-cover"
                />
              )}
              <div className="p-3">
                <h3 className="text-base font-normal leading-snug mb-2 text-gray-900 dark:text-white line-clamp-2">
                  {getPostTitle(post)}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span className="font-medium">Our Vadodara</span>
                  <span>•</span>
                  <span className="text-gray-400 dark:text-gray-500">
                    {formatTimeAgo(post.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </section>

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
  );
};

export default DesktopNewsFeed;
