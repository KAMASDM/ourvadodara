// =============================================
// Updated src/components/Feed/PostCard.jsx (Make clickable)
// =============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/Language/LanguageContext';
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const PostCard = ({ post, onPostClick }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const handleLike = (e) => {
    e.stopPropagation(); // Prevent triggering post click
    setIsLiked(!isLiked);
  };

  const handleSave = (e) => {
    e.stopPropagation(); // Prevent triggering post click
    setIsSaved(!isSaved);
  };

  const handleShare = (e) => {
    e.stopPropagation(); // Prevent triggering post click
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: contentText.substring(0, 100) + '...',
        url: window.location.href,
      });
    }
  };

  const handlePostClick = () => {
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
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">OV</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {post.author}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              {formatDistanceToNow(post.publishedAt, { addSuffix: true })}
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

        {/* Image */}
        {post.image && (
          <div className="px-4 pb-2">
            <img
              src={post.image}
              alt={titleText}
              className="w-full h-64 object-cover rounded-lg"
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