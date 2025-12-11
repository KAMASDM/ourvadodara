// =============================================
// Updated src/components/Feed/PostCard.jsx (Make clickable)
// =============================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useAuth } from '../../context/Auth/AuthContext';
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Play, Pause } from 'lucide-react';
import { ref, update } from 'firebase/database';
import { db } from '../../firebase-config';
import { formatTime } from '../../utils/helpers';
import logoImage from '../../assets/images/our-vadodara-logo.png.png';

const PostCard = ({ post, onPostClick }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const cardRef = useRef(null);

  const normalizeMediaCollection = (collection) => {
    if (!collection) return [];
    if (Array.isArray(collection)) {
      return collection.filter(Boolean);
    }
    if (typeof collection === 'object') {
      return Object.entries(collection)
        .sort((entryA, entryB) => {
          const [, valueA] = entryA;
          const [, valueB] = entryB;
          const orderA = typeof valueA?.order === 'number' ? valueA.order : parseInt(entryA[0], 10) || 0;
          const orderB = typeof valueB?.order === 'number' ? valueB.order : parseInt(entryB[0], 10) || 0;
          return orderA - orderB;
        })
        .map(([, value]) => value)
        .filter(Boolean);
    }
    return [];
  };

  const getSafeMediaUrl = (mediaItem) => {
    if (!mediaItem || typeof mediaItem !== 'object') return '';
    const candidates = [
      mediaItem.url,
      mediaItem.downloadURL,
      mediaItem.downloadUrl,
      mediaItem.fileUrl,
      mediaItem.fileURL,
      mediaItem.src,
      mediaItem.secureUrl,
      mediaItem.mediaUrl,
      mediaItem.previewUrl,
      mediaItem.thumbnailUrl
    ];
    return candidates.find(Boolean) || '';
  };

  const getUrlFromMediaItem = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return getSafeMediaUrl(item);
  };

  const isVideoCandidate = (item, urlOverride) => {
    if (!item && !urlOverride) return false;
    const url = urlOverride || getUrlFromMediaItem(item);
    const typeLabel = typeof item === 'object' ? (item?.type || '').toLowerCase() : '';
    const mimeType = typeof item === 'object' ? (item?.mimeType || '').toLowerCase() : '';
    const isVideoByMime = mimeType.startsWith('video/');
    const isVideoByType = typeLabel.includes('video') || typeLabel.includes('reel');
    const isVideoByExtension = /(\.mp4|\.webm|\.mov|\.m4v)$/i.test(url || '');
    return isVideoByMime || isVideoByType || isVideoByExtension;
  };

  const legacyMediaItems = normalizeMediaCollection(post.media);
  const structuredMediaItems = normalizeMediaCollection(post.mediaContent?.items);
  const mergedMediaItems = [...legacyMediaItems, ...structuredMediaItems];

  const preferredImageItem = mergedMediaItems.find((item) => {
    const url = getUrlFromMediaItem(item);
    if (!url) return false;
    return !isVideoCandidate(item, url);
  });

  const selectedMediaItem = preferredImageItem || mergedMediaItems.find((item) => getUrlFromMediaItem(item)) || null;
  
  // Comprehensive fallback chain for media URL  
  let fallbackImageUrl = post.image || post.imageUrl || post.thumbnailUrl || post.coverImage || post.featuredImage;
  
  // If media is an array and has items, try to get URL from first item
  if (!fallbackImageUrl && Array.isArray(post.media) && post.media.length > 0) {
    const firstMedia = post.media[0];
    if (typeof firstMedia === 'string') {
      fallbackImageUrl = firstMedia;
    } else if (typeof firstMedia === 'object' && firstMedia) {
      fallbackImageUrl = getSafeMediaUrl(firstMedia);
    }
  }
  
  // If mediaContent exists, try to get from there
  if (!fallbackImageUrl && post.mediaContent?.items && post.mediaContent.items.length > 0) {
    const firstItem = post.mediaContent.items[0];
    if (typeof firstItem === 'object' && firstItem) {
      fallbackImageUrl = getSafeMediaUrl(firstItem);
    }
  }
  
  const mediaUrl = getUrlFromMediaItem(selectedMediaItem) || fallbackImageUrl || '';
  const isVideoMedia = selectedMediaItem ? isVideoCandidate(selectedMediaItem, mediaUrl) : /(\.\.mp4|\.webm|\.mov|\.m4v)$/i.test(mediaUrl || '');

  // Auto-play/pause video based on visibility
  useEffect(() => {
    if (!isVideoMedia || !videoRef.current) return;

    const video = videoRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Video is more than 50% visible
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            video.play().catch(() => {
              // Auto-play prevented, user needs to interact first
              setIsPlaying(false);
            });
          } else {
            // Video is less than 50% visible or not visible
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: [0, 0.5, 1.0] }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [isVideoMedia]);

  // Track video progress
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isVideoMedia]);

  useEffect(() => {
    setMediaError(false);
  }, [mediaUrl]);

  const toggleVideoPlayback = useCallback((e) => {
    e.stopPropagation();
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, []);

  const handleLike = async (e) => {
    e.stopPropagation(); // Prevent triggering post click
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    
    // Update likes count in Firebase
    try {
      const postRef = ref(db, `posts/${post.id}`);
      const likesRef = ref(db, `likes/${post.id}/${user?.uid}`);
      const currentLikes = post.likes || 0;
      
      const updates = {
        [`posts/${post.id}/likes`]: newLikedState ? currentLikes + 1 : Math.max(0, currentLikes - 1),
        [`posts/${post.id}/lastInteraction`]: new Date().toISOString(),
        [`likes/${post.id}/${user?.uid}`]: newLikedState ? true : null
      };
      
      // Update user's total likes count
      if (user?.uid) {
        updates[`users/${user.uid}/totalLikes`] = newLikedState ? (user.totalLikes || 0) + 1 : Math.max(0, (user.totalLikes || 1) - 1);
      }
      
      await update(ref(db), updates);
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
      
      // Track user's total shares if logged in
      if (user?.uid) {
        const userRef = ref(db, `users/${user.uid}`);
        await update(userRef, {
          totalShares: (user.totalShares || 0) + 1
        });
      }
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

  // Strip HTML tags from content
  const stripHtmlTags = (html) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Handle both string content and multi-language object content
  const getContentForLanguage = () => {
    try {
      if (!post.content) return '';
      
      let content = '';
      // If content is a string, return it directly
      if (typeof post.content === 'string') {
        content = post.content;
      }
      
      // If content is an object, try to get the current language or fallback
      else if (typeof post.content === 'object') {
        content = post.content[currentLanguage] || 
               post.content['gu'] || 
               post.content['en'] || 
               Object.values(post.content)[0] || '';
      }
      
      // Strip HTML tags from rich text editor content
      return stripHtmlTags(content);
    } catch (error) {
      console.error('Error in getContentForLanguage:', error, post.id);
      return '';
    }
  };

  // Handle both string title and multi-language object title
  const getTitleForLanguage = () => {
    try {
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
    } catch (error) {
      console.error('Error in getTitleForLanguage:', error, post.id);
      return '';
    }
  };

  const contentText = getContentForLanguage();
  const titleText = getTitleForLanguage();
  // Strip HTML from preview as well
  const contentPreview = contentText.substring(0, 150);
  const needsReadMore = contentText.length > 150;

  return (
    <article ref={cardRef} className="bg-ivory-50 dark:bg-bg-card-dark border-y border-warmBrown-200 dark:border-border-dark shadow-sm hover:shadow-md transition-all duration-200 mb-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 pb-2">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-white dark:bg-white shadow-sm border border-warmBrown-200 dark:border-border-dark p-1 flex items-center justify-center">
            <img 
              src={logoImage} 
              alt="Our Vadodara" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <p className="font-semibold text-warmBrown-900 dark:text-text-light text-sm">
              {typeof post.author === 'object' ? (post.author?.name || post.author?.email) : (post.author || post.authorName || 'Our Vadodara')}
            </p>
            <p className="text-warmBrown-600 dark:text-gray-400 text-xs">
              {formatTime(post.publishedAt)}
            </p>
          </div>
        </div>
        <button 
          onClick={(e) => e.stopPropagation()}
          className="p-1 text-warmBrown-600 dark:text-gray-400 hover:bg-ivory-200 dark:hover:bg-surface-dark rounded-full transition-colors duration-200"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Clickable Content Area */}
      <div onClick={handlePostClick} className="cursor-pointer">
        {/* Breaking News Badge */}
        {post.isBreaking && (
          <div className="px-4 pb-2">
            <span className="bg-accent text-white px-2 py-1 rounded text-xs font-bold animate-pulse shadow-lg">
              🚨 BREAKING
            </span>
          </div>
        )}

        {/* Content */}
        <div className="px-4 pb-2">
          <h2 className="text-lg font-semibold text-warmBrown-900 dark:text-text-light mb-2">
            {titleText}
          </h2>
          <p className="text-warmBrown-700 dark:text-gray-300 text-sm leading-relaxed">
            {showFullContent ? contentText : contentPreview}
            {needsReadMore && !showFullContent && '...'}
          </p>
          {needsReadMore && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFullContent(!showFullContent);
              }}
              className="text-warmBrown-500 text-sm font-medium mt-1 hover:underline"
            >
              {showFullContent ? 'Show less' : t('readMore')}
            </button>
          )}
        </div>

        {/* Media - Images and Videos */}
        {mediaUrl && !mediaError && (
          <div className="pb-2">
            <div className="mb-2 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
              {isVideoMedia ? (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <video
                    ref={videoRef}
                    src={mediaUrl}
                    poster={selectedMediaItem?.thumbnailUrl || ''}
                    preload="metadata"
                    playsInline
                    className="w-full h-auto max-h-[500px] object-contain bg-gray-900"
                    onError={() => {
                      console.error('Video failed to load:', mediaUrl);
                      setMediaError(true);
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Custom Play/Pause Button Overlay */}
                  <button
                    onClick={toggleVideoPlayback}
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 group"
                    aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  >
                    <div className={`bg-black bg-opacity-60 rounded-full p-4 transform transition-all duration-200 ${
                      isPlaying ? 'opacity-0 group-hover:opacity-100 scale-90' : 'opacity-100 scale-100'
                    }`}>
                      {isPlaying ? (
                        <Pause className="w-8 h-8 text-white" />
                      ) : (
                        <Play className="w-8 h-8 text-white ml-1" />
                      )}
                    </div>
                  </button>
                  
                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 bg-opacity-50">
                    <div
                      className="h-full bg-red-500 transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <img
                  src={mediaUrl}
                  alt={titleText}
                  className="w-full h-auto max-h-[500px] object-contain"
                  loading="lazy"
                  onError={() => {
                    console.error('PostCard image failed:', mediaUrl);
                    setMediaError(true);
                  }}
                />
              )}
            </div>
          </div>
        )}

        {mediaError && (
          <div className="px-4 pb-2">
            <div className="w-full h-48 rounded-xl bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
              {t('imageUnavailable', 'Image preview unavailable')}
            </div>
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
                className="text-xs bg-ivory-200 dark:bg-gray-800 text-warmBrown-700 dark:text-gray-300 px-2 py-1 rounded-full border border-warmBrown-300 dark:border-gray-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-3 py-3">
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