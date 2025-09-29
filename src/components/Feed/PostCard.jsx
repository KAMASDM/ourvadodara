// =============================================
// Updated src/components/Feed/PostCard.jsx (Make clickable)
// =============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/Language/LanguageContext';
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal } from 'lucide-react';
import { ref, update } from 'firebase/database';
import { db } from '../../firebase-config';
import { formatTime } from '../../utils/helpers';
import logoImage from '../../assets/images/our-vadodara-logo.png.png';

const PostCard = ({ post, onPostClick }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation(); // Prevent triggering post click
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    
    // Update likes count in Firebase
    try {
      const postRef = ref(db, `posts/${post.id}`);
      const currentLikes = post.likes || 0;
      await update(postRef, {
        likes: newLikedState ? currentLikes + 1 : Math.max(0, currentLikes - 1),
        lastInteraction: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating likes:', error);
      // Revert the state if Firebase update fails
      setIsLiked(!newLikedState);
    }
  };

  const handleSave = (e) => {
    e.stopPropagation(); // Prevent triggering post click
    setIsSaved(!isSaved);
  };

  const handleShare = async (e) => {
    e.stopPropagation(); // Prevent triggering post click
    
    // Update shares count in Firebase
    try {
      const postRef = ref(db, `posts/${post.id}`);
      const currentShares = post.shares || 0;
      await update(postRef, {
        shares: currentShares + 1,
        lastInteraction: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating shares:', error);
    }
    
    // Handle native sharing
    if (navigator.share) {
      const contentText = getContentForLanguage();
      navigator.share({
        title: getTitleForLanguage(),
        text: contentText.substring(0, 100) + '...',
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      const shareText = `${getTitleForLanguage()}\n${window.location.href}`;
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Link copied to clipboard!');
      }).catch(() => {
        alert('Unable to copy link');
      });
    }
  };

  const handlePostClick = async () => {
    // Update view count in Firebase
    try {
      const postRef = ref(db, `posts/${post.id}`);
      const currentViews = post.views || 0;
      await update(postRef, {
        views: currentViews + 1,
        lastViewed: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating views:', error);
    }
    
    if (onPostClick) {
      onPostClick(post.id);
    }
  };

  // Handle both string content and multi-language object content
  const getContentForLanguage = () => {
    if (!post.content) return '';
    
    // If content is a string, return it directly
    if (typeof post.content === 'string') {
      return post.content;
    }
    
    // If content is an object, try to get the current language or fallback
    if (typeof post.content === 'object') {
      return post.content[currentLanguage] || 
             post.content['gu'] || 
             post.content['en'] || 
             Object.values(post.content)[0] || '';
    }
    
    return '';
  };

  // Handle both string title and multi-language object title
  const getTitleForLanguage = () => {
    if (!post.title) return '';
    
    // If title is a string, return it directly
    if (typeof post.title === 'string') {
      return post.title;
    }
    
    // If title is an object, try to get the current language or fallback
    if (typeof post.title === 'object') {
      return post.title[currentLanguage] || 
             post.title['gu'] || 
             post.title['en'] || 
             Object.values(post.title)[0] || '';
    }
    
    return '';
  };

  const contentText = getContentForLanguage();
  const titleText = getTitleForLanguage();
  const contentPreview = contentText.substring(0, 150);
  const needsReadMore = contentText.length > 150;

  return (
    <article className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-white shadow-sm border border-gray-200">
            <img 
              src={logoImage} 
              alt="Our Vadodara" 
              className="w-full h-full object-contain p-1"
            />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {post.author}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              {formatTime(post.publishedAt)}
            </p>
          </div>
        </div>
        <button 
          onClick={(e) => e.stopPropagation()}
          className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Clickable Content Area */}
      <div onClick={handlePostClick} className="cursor-pointer">
        {/* Breaking News Badge */}
        {post.isBreaking && (
          <div className="px-4 pb-2">
            <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
              🚨 BREAKING
            </span>
          </div>
        )}

        {/* Content */}
        <div className="px-4 pb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {titleText}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {showFullContent ? contentText : contentPreview}
            {needsReadMore && !showFullContent && '...'}
          </p>
          {needsReadMore && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFullContent(!showFullContent);
              }}
              className="text-primary-500 text-sm font-medium mt-1 hover:underline"
            >
              {showFullContent ? 'Show less' : t('readMore')}
            </button>
          )}
        </div>

        {/* Media - Images and Videos */}
        {post.media && post.media.length > 0 && (
          <div className="px-4 pb-2">
            {post.media.filter(media => media.type === 'image').slice(0, 1).map((media, index) => (
              <div key={index} className="mb-2">
                <img
                  src={media.url}
                  alt={titleText}
                  className="w-full h-64 object-cover rounded-lg"
                  onLoad={() => console.log('Image loaded successfully:', media.url)}
                  onError={(e) => {
                    console.error('Image failed to load:', media.url);
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            ))}
            {post.media.filter(media => media.type === 'video').slice(0, 1).map((media, index) => (
              <div key={index} className="mb-2">
                <video
                  src={media.url}
                  controls
                  className="w-full h-64 object-cover rounded-lg"
                  onLoadedData={() => console.log('Video loaded successfully:', media.url)}
                  onError={(e) => {
                    console.error('Video failed to load:', media.url);
                    e.target.style.display = 'none';
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ))}
          </div>
        )}
        
        {/* Legacy image support for backward compatibility */}
        {!post.media && post.image && (
          <div className="px-4 pb-2">
            <img
              src={post.image}
              alt={titleText}
              className="w-full h-64 object-cover rounded-lg"
              onLoad={() => console.log('Legacy image loaded successfully:', post.image)}
              onError={(e) => {
                console.error('Legacy image failed to load:', post.image);
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked
                  ? 'text-red-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{post.likes + (isLiked ? 1 : 0)}</span>
            </button>
            
            <button 
              onClick={handlePostClick}
              className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{post.comments}</span>
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors"
            >
              <Share className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={handleSave}
            className={`transition-colors ${
              isSaved
                ? 'text-yellow-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-yellow-500'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default PostCard;