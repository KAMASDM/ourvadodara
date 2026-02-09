// =============================================
// src/components/Feed/PremiumNewsCard.jsx
// Premium News Card - Google News + Instagram Hybrid
// Enhanced with more information and better UX
// =============================================
import React, { useState } from 'react';
import { useLanguage } from '../../context/Language/LanguageContext';
import { 
  Clock, 
  Eye, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  TrendingUp,
  User,
  MapPin,
  Calendar,
  Award,
  CheckCircle,
  Play,
  Image as ImageIcon
} from 'lucide-react';
import EmojiReactions from '../Common/EmojiReactions';
import TopicChip from '../Topics/TopicChip';
import InstagramCarousel from '../Media/InstagramCarousel';
import { formatTimeAgo, formatNumber } from '../../utils/helpers';

const PremiumNewsCard = ({
  post,
  onPostClick,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onShare,
  variant = 'default' // 'default', 'hero', 'featured', 'compact', 'story'
}) => {
  const { currentLanguage } = useLanguage();
  const [imageError, setImageError] = useState(false);

  const title = post.title?.[currentLanguage] || post.title?.en || 'Untitled';
  const excerpt = post.excerpt?.[currentLanguage] || post.excerpt?.en || '';
  const category = post.category || 'news';
  
  // Handle media
  let mediaItems = [];
  if (post.mediaContent?.items) {
    mediaItems = post.mediaContent.items;
  } else if (post.media && Array.isArray(post.media)) {
    mediaItems = post.media;
  }
  
  const featuredImage = mediaItems[0]?.url || mediaItems[0]?.src || post.image;
  const hasMultipleImages = mediaItems.length > 1;
  const hasVideo = mediaItems.some(item => item.type === 'video' || item.url?.includes('.mp4'));
  
  // Stats
  const views = post.analytics?.views ?? post.views ?? 0;
  const likes = post.analytics?.likes ?? post.likes ?? 0;
  const comments = post.analytics?.comments ?? post.comments ?? 0;
  const shares = post.analytics?.shares ?? post.shares ?? 0;
  const readTime = post.readTime || Math.ceil((excerpt?.length || 0) / 200);
  
  // Author/Source info
  let author = post.author || 'Our Vadodara';
  let authorName = '';
  if (typeof author === 'object' && author !== null) {
    authorName = author.name || author.email || 'Unknown';
  } else {
    authorName = author;
  }
  const authorAvatar = post.authorAvatar || null;
  const location = post.location || post.city || 'Vadodara';
  const isVerified = post.isVerified || post.source === 'official';
  const isTrending = post.isTrending || views > 10000;
  
  // Publication date
  const publishedAt = post.publishedAt || post.createdAt;
  const publishDate = new Date(publishedAt);
  const isRecent = Date.now() - publishDate.getTime() < 3600000; // Less than 1 hour

  // Helper to render media with indicator
  const renderMediaWithIndicator = (className = '') => (
    <div className="relative">
      {hasMultipleImages ? (
        <InstagramCarousel 
          items={mediaItems}
          className={className}
          imageClassName="w-full h-full object-cover"
        />
      ) : featuredImage && !imageError ? (
        <img
          src={featuredImage}
          alt={title}
          onError={() => setImageError(true)}
          className={className}
        />
      ) : (
        <div className={`bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 ${className}`} />
      )}
      
      {/* Media Type Indicators */}
      {hasMultipleImages && (
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          <span>{mediaItems.length}</span>
        </div>
      )}
      {hasVideo && (
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white p-2 rounded-full">
          <Play className="w-4 h-4" />
        </div>
      )}
    </div>
  );

  // Hero Variant - Large immersive card
  if (variant === 'hero') {
    return (
      <article 
        onClick={() => onPostClick?.(post.id)}
        className="hero-card group cursor-pointer mb-6 overflow-hidden"
      >
        <div className="relative w-full h-full">
          {renderMediaWithIndicator('w-full h-full object-cover')}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          
          {/* Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
            {/* Header - Category & Trending Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-bold uppercase tracking-wide">
                {category}
              </span>
              {isTrending && (
                <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-xs font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Trending
                </span>
              )}
              {isRecent && (
                <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold animate-pulse">
                  LIVE
                </span>
              )}
            </div>
            
            {/* Title */}
            <h2 className="headline-hero text-white mb-3 line-clamp-3 group-hover:underline transition-all font-bold leading-tight">
              {title}
            </h2>
            
            {/* Excerpt */}
            <p className="body-large text-gray-200 mb-4 line-clamp-2 max-w-3xl">
              {excerpt}
            </p>
            
            {/* Author & Meta Info */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {/* Author */}
                <div className="flex items-center gap-2">
                  {authorAvatar ? (
                    <img src={authorAvatar} alt={author} className="w-8 h-8 rounded-full border-2 border-white" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-medium text-sm">{authorName}</span>
                    {isVerified && <CheckCircle className="w-4 h-4 text-blue-400 fill-current" />}
                  </div>
                </div>
                
                {/* Location */}
                <div className="flex items-center gap-1 text-gray-300 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{location}</span>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{formatTimeAgo(publishedAt)}</span>
                </div>
                {views > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>{formatNumber(views)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{readTime} min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Featured Variant - Medium card with rich info
  if (variant === 'featured') {
    return (
      <article className="modern-card mb-6 overflow-hidden group cursor-pointer" onClick={() => onPostClick?.(post.id)}>
        {/* Featured Image */}
        {(featuredImage || hasMultipleImages) && !imageError && (
          <div className="relative aspect-[16/9] overflow-hidden">
            {renderMediaWithIndicator('w-full h-full object-cover transition-transform duration-700 group-hover:scale-110')}
            
            {/* Category Badge on Image */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1.5 bg-purple-600 text-white rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                {category}
              </span>
              {isTrending && (
                <span className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                  <TrendingUp className="w-3 h-3" />
                  Trending
                </span>
              )}
            </div>
            
            {/* Gradient overlay on bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}
        
        {/* Content */}
        <div className="p-5">
          {/* Author & Time */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {authorAvatar ? (
                <img src={authorAvatar} alt={author} className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{typeof author === 'object' && author !== null ? (author.name || author.email || 'Unknown') : author}</span>
                {isVerified && <CheckCircle className="w-4 h-4 text-blue-500 fill-current" />}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimeAgo(publishedAt)}</span>
            </div>
          </div>
          
          {/* Title */}
          <h3 className="headline-large mb-3 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors font-bold leading-tight">
            {title}
          </h3>
          
          {/* Excerpt */}
          <p className="body-medium text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 leading-relaxed">
            {excerpt}
          </p>
          
          {/* Location & Read Time */}
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{readTime} min read</span>
            </div>
          </div>
          
          {/* Topics */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.slice(0, 4).map((tag, idx) => (
                <TopicChip
                  key={idx}
                  topic={tag}
                  size="sm"
                  showFollowButton={false}
                />
              ))}
            </div>
          )}
          
          {/* Engagement Stats & Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {views > 0 && (
                <div className="flex items-center gap-1.5 font-medium">
                  <Eye className="w-4 h-4" />
                  <span>{formatNumber(views)}</span>
                </div>
              )}
              {comments > 0 && (
                <div className="flex items-center gap-1.5 font-medium">
                  <MessageCircle className="w-4 h-4" />
                  <span>{comments}</span>
                </div>
              )}
              {shares > 0 && (
                <div className="flex items-center gap-1.5 font-medium">
                  <Share2 className="w-4 h-4" />
                  <span>{shares}</span>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <EmojiReactions 
                postId={post.id} 
                postType="posts"
                compact={true}
                showCount={false}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare?.();
                }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSave?.();
                }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Bookmark"
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-purple-600 text-purple-600 dark:fill-purple-400 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`} />
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Compact Variant - Horizontal layout
  if (variant === 'compact') {
    return (
      <article 
        onClick={() => onPostClick?.(post.id)}
        className="modern-card mb-8 overflow-hidden cursor-pointer group p-0"
        style={{ maxWidth: 600, margin: '2rem auto' }}
      >
        {/* Large Thumbnail at Top */}
        {(featuredImage || hasMultipleImages) && !imageError && (
          <div className="relative w-full aspect-[16/9] bg-gray-200 dark:bg-gray-800 overflow-hidden">
            {renderMediaWithIndicator('w-full h-full object-cover transition-transform duration-500 group-hover:scale-105')}
          </div>
        )}
        {/* Content */}
        <div className="p-6 flex flex-col">
          {/* Category & Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="label-small text-purple-600 dark:text-purple-400 font-bold uppercase">
              {category}
            </span>
            {isTrending && (
              <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-semibold">
                <TrendingUp className="w-3 h-3" />
                <span>Trending</span>
              </span>
            )}
            {isRecent && (
              <span className="px-2 py-0.5 bg-red-500 text-white rounded text-xs font-bold">
                LIVE
              </span>
            )}
          </div>
          {/* Title */}
          <h3 className="headline-large mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors font-semibold leading-snug">
            {title}
          </h3>
          {/* Excerpt */}
          <p className="body-medium text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
            {excerpt}
          </p>
          {/* Meta Info */}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {/* Author */}
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span className="font-medium">{typeof author === 'object' && author !== null ? (author.name || author.email || 'Unknown') : author}</span>
              {isVerified && <CheckCircle className="w-3 h-3 text-blue-500 fill-current" />}
            </div>
            <span>•</span>
            <span>{formatTimeAgo(publishedAt)}</span>
            {views > 0 && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{formatNumber(views)}</span>
                </div>
              </>
            )}
            {comments > 0 && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>{comments}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </article>
    );
  }

  // Default variant - Balanced card
  return (
    <article 
      onClick={() => onPostClick?.(post.id)}
      className="modern-card mb-5 overflow-hidden cursor-pointer group"
    >
      {/* Image Section */}
      {(featuredImage || hasMultipleImages) && !imageError && (
        <div className="relative aspect-video overflow-hidden">
          {renderMediaWithIndicator('w-full h-full object-cover transition-transform duration-500 group-hover:scale-105')}
        </div>
      )}
      
      {/* Content Section */}
      <div className="p-4">
        {/* Header - Category, Author, Time */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold uppercase">
              {category}
            </span>
            {isTrending && (
              <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-semibold">
                <TrendingUp className="w-3 h-3" />
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(publishedAt)}</span>
        </div>
        
        {/* Title */}
        <h3 className="headline-medium mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors font-semibold">
          {title}
        </h3>
        
        {/* Excerpt */}
        <p className="body-medium text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {excerpt}
        </p>
        
        {/* Author & Location */}
        <div className="flex items-center gap-3 mb-3 text-sm">
          <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
            {authorAvatar ? (
              <img src={authorAvatar} alt={author} className="w-5 h-5 rounded-full" />
            ) : (
              <User className="w-4 h-4" />
            )}
            <span className="font-medium">{author}</span>
            {isVerified && <CheckCircle className="w-4 h-4 text-blue-500 fill-current" />}
          </div>
          
          <span className="text-gray-400">•</span>
          
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <MapPin className="w-3.5 h-3.5" />
            <span>{location}</span>
          </div>
        </div>
        
        {/* Stats & Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            {views > 0 && (
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span className="font-medium">{formatNumber(views)}</span>
              </div>
            )}
            {comments > 0 && (
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" />
                <span className="font-medium">{comments}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{readTime}m</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <EmojiReactions 
              postId={post.id} 
              postType="posts"
              compact={true}
              showCount={false}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare?.();
              }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave?.();
              }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Bookmark"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current text-purple-600 dark:text-purple-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PremiumNewsCard;
