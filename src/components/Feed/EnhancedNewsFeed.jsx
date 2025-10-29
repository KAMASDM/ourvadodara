// =============================================
// src/components/Feed/EnhancedNewsFeed.jsx
// Enhanced News Feed with Full Media Support
// =============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useAuth } from '../../context/Auth/AuthContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
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
  Verified
} from 'lucide-react';
import MediaRenderer from '../Media/MediaRenderer';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import { POST_TYPES } from '../../utils/mediaSchema';
import { sampleNews } from '../../data/newsData';

const EnhancedNewsFeed = ({ activeCategory, onPostClick, feedType = 'all' }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  
  // Fetch different types of posts
  const { data: postsData, isLoading: postsLoading } = useRealtimeData('posts');
  const { data: storiesData, isLoading: storiesLoading } = useRealtimeData('stories');
  const { data: reelsData, isLoading: reelsLoading } = useRealtimeData('reels');
  const { data: carouselsData, isLoading: carouselsLoading } = useRealtimeData('carousels');

  const [likedPosts, setLikedPosts] = useState(new Set());
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [expandedPosts, setExpandedPosts] = useState(new Set());

  const isLoading = postsLoading || storiesLoading || reelsLoading || carouselsLoading;

  // Combine all posts from different sources
  const getAllPosts = () => {
    let allPosts = [];

    // Standard posts
    if (postsData) {
      const posts = Object.values(postsData).map(post => ({
        ...post,
        type: post.type || POST_TYPES.STANDARD,
        source: 'posts'
      }));
      allPosts = [...allPosts, ...posts];
    }

    // Stories (only non-expired ones for feed)
    if (storiesData && feedType !== 'reels') {
      const stories = Object.values(storiesData)
        .filter(story => new Date(story.expiresAt) > new Date() && story.isActive)
        .map(story => ({
          ...story,
          type: POST_TYPES.STORY,
          source: 'stories'
        }));
      allPosts = [...allPosts, ...stories];
    }

    // Reels
    if (reelsData) {
      const reels = Object.values(reelsData)
        .filter(reel => reel.isPublished)
        .map(reel => ({
          ...reel,
          type: POST_TYPES.REEL,
          source: 'reels'
        }));
      allPosts = [...allPosts, ...reels];
    }

    // Carousels
    if (carouselsData) {
      const carousels = Object.values(carouselsData)
        .filter(carousel => carousel.isPublished)
        .map(carousel => ({
          ...carousel,
          type: POST_TYPES.CAROUSEL,
          source: 'carousels'
        }));
      allPosts = [...allPosts, ...carousels];
    }

    // Fallback to sample data if no real data
    if (allPosts.length === 0) {
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

  // Filter posts based on category and feed type
  const getFilteredPosts = () => {
    let posts = getAllPosts();

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
  };

  const filteredPosts = getFilteredPosts();

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
    console.log('Liked post:', postId);
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
    console.log('Saved post:', postId);
  };

  const handleShare = async (post) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title[currentLanguage] || post.title.en,
          text: post.excerpt?.[currentLanguage] || post.content?.[currentLanguage],
          url: window.location.origin + `/news/${post.id}`
        });
      } catch (error) {
        console.log('Sharing cancelled');
      }
    } else {
      // Fallback to copy link
      const url = window.location.origin + `/news/${post.id}`;
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
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
    console.log('Media interaction:', type, data);
    // Handle media-specific interactions (video play, carousel navigation, etc.)
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (filteredPosts.length === 0) {
    return <EmptyState type="no-content" />;
  }

  // Render different layouts based on feed type
  if (feedType === 'reels') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {filteredPosts.map((post, index) => (
          <ReelCard 
            key={post.id ? `reel-${post.id}` : `reel-post-${index}-${Date.now()}`} 
            post={post} 
            onLike={() => handleLike(post.id)}
            onSave={() => handleSave(post.id)}
            onShare={() => handleShare(post)}
            isLiked={likedPosts.has(post.id)}
            isSaved={savedPosts.has(post.id)}
            currentLanguage={currentLanguage}
          />
        ))}
      </div>
    );
  }

  // Standard feed layout
  return (
    <div className="space-y-0">
      {filteredPosts.map((post, index) => (
        <PostCard 
          key={post.id ? `${post.source || 'unknown'}-${post.id}` : `post-${index}-${Date.now()}`}
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
      ))}
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
  const title = post.title?.[currentLanguage] || post.title?.en || 'Untitled';
  const content = post.content?.[currentLanguage] || post.content?.en || '';
  const excerpt = post.excerpt?.[currentLanguage] || post.excerpt?.en || '';
  
  const displayContent = isExpanded ? content : (excerpt || content?.substring(0, 150) + '...');
  const shouldShowReadMore = content.length > 150;

  return (
    <article className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      {/* Post Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-white p-1 shadow-sm flex items-center justify-center">
              <img
                src={post.author?.avatar || logoImage}
                alt={post.author?.name}
                className="w-full h-full rounded-full object-contain"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {post.author?.name || 'Our Vadodara Team'}
                </h3>
                {post.author?.verified && (
                  <Verified className="w-4 h-4 text-blue-500" />
                )}
                {post.type !== POST_TYPES.STANDARD && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    post.type === POST_TYPES.STORY ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                    post.type === POST_TYPES.REEL ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' :
                    post.type === POST_TYPES.CAROUSEL ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  }`}>
                    {post.type.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(post.publishedAt || post.createdAt)}</span>
                {post.location && (
                  <>
                    <MapPin className="w-3 h-3" />
                    <span>{post.location}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-2">
        {/* Title */}
        {title && (
          <h2 
            className="text-lg font-bold text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            onClick={() => onPostClick(post.id)}
          >
            {title}
          </h2>
        )}

        {/* Breaking/Featured badges */}
        <div className="flex items-center space-x-2 mb-2">
          {post.isBreaking && (
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
              BREAKING
            </span>
          )}
          {post.isFeatured && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
              FEATURED
            </span>
          )}
          {post.isUrgent && (
            <span className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded">
              URGENT
            </span>
          )}
        </div>

        {/* Content */}
        {displayContent && (
          <div className="text-gray-700 dark:text-gray-300 mb-3">
            <p className="leading-relaxed">{displayContent}</p>
            {shouldShowReadMore && (
              <button
                onClick={onToggleExpanded}
                className="text-blue-600 dark:text-blue-400 text-sm font-medium mt-1 hover:underline"
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Media Content */}
      {post.mediaContent && post.mediaContent.items && post.mediaContent.items.length > 0 && (
        <div className="mb-4">
          <MediaRenderer
            post={post}
            className="w-full"
            showControls={post.type === POST_TYPES.REEL}
            onInteraction={onMediaInteraction}
          />
        </div>
      )}

      {/* Category & Tags */}
      {(post.category || (post.tags && post.tags.length > 0)) && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {post.category && (
              <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                {post.category}
              </span>
            )}
            {post.tags && post.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Post Stats */}
      <div className="px-4 pb-2">
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          {post.analytics?.views && (
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{formatNumber(post.analytics.views)}</span>
            </div>
          )}
          {post.analytics?.likes && (
            <span>{formatNumber(post.analytics.likes)} likes</span>
          )}
          {post.analytics?.comments && (
            <span>{formatNumber(post.analytics.comments)} comments</span>
          )}
          {post.analytics?.shares && (
            <span>{formatNumber(post.analytics.shares)} shares</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={onLike}
              className={`flex items-center space-x-2 transition-colors ${
                isLiked 
                  ? 'text-red-500' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">Like</span>
            </button>
            
            <button
              onClick={() => onPostClick(post.id)}
              className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Comment</span>
            </button>
            
            <button
              onClick={onShare}
              className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-green-500 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>
          
          <button
            onClick={onSave}
            className={`p-2 rounded-full transition-colors ${
              isSaved 
                ? 'text-blue-500' 
                : 'text-gray-500 dark:text-gray-400 hover:text-blue-500'
            }`}
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
                  src={post.author?.avatar || logoImage}
                  alt={post.author?.name}
                  className="w-full h-full rounded-full object-contain"
                />
              </div>
              <span>{post.author?.name}</span>
            </div>
            
            {post.analytics?.views && (
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>{formatNumber(post.analytics.views)}</span>
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