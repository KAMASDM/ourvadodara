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
  const [showMenu, setShowMenu] = useState(false);
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
  const isVideoMedia = selectedMediaItem ? isVideoCandidate(selectedMediaItem, mediaUrl) : /(\.mp4|\.webm|\.mov|\.m4v)$/i.test(mediaUrl || '');

  // Auto-play/pause video based on visibility
  useEffect(() => {
    if (!isVideoMedia || !videoRef.current) return;

    const video = videoRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Video is more than 50% visible
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            video.play().catch((err) => {
              // Auto-play prevented, user needs to interact first
              console.log('Auto-play prevented:', err.message);
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

    // Observe the video element directly
    observer.observe(video);

    return () => {
      observer.disconnect();
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
    <article
      ref={cardRef}
      className="bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 transition-colors duration-150"
    >
      {/* ── Post header ───────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-white border border-neutral-200 dark:border-neutral-700 p-1 flex items-center justify-center flex-shrink-0">
            <img
              src={logoImage}
              alt="Our Vadodara"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
              {typeof post.author === 'object'
                ? (post.author?.name || post.author?.email)
                : (post.author || post.authorName || 'Our Vadodara')}
            </p>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
              {formatTime(post.publishedAt)}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => e.stopPropagation()}
          className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* ── Clickable body ────────────────────────── */}
      <div onClick={handlePostClick} className="cursor-pointer">

        {/* Breaking badge */}
        {post.isBreaking && (
          <div className="px-4 pb-1.5">
            <span className="inline-flex items-center gap-1 rounded-sm bg-danger px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
              🚨 Breaking
            </span>
          </div>
        )}

        {/* Media — full-bleed, 16:9 */}
        {mediaUrl && !mediaError && (
          <div className="mb-2">
            {isVideoMedia ? (
              <div className="relative w-full aspect-video bg-neutral-900">
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  poster={selectedMediaItem?.thumbnailUrl || ''}
                  preload="metadata"
                  playsInline
                  loop
                  muted
                  className="w-full h-full object-cover"
                  onError={() => setMediaError(true)}
                />
                {/* Play/pause overlay */}
                <div
                  onClick={toggleVideoPlayback}
                  className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
                >
                  <div className={`rounded-full bg-black/50 p-3 backdrop-blur-sm transition-opacity duration-200 ${
                    isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
                  }`}>
                    {isPlaying
                      ? <Pause className="w-7 h-7 text-white" strokeWidth={2.5} />
                      : <Play className="w-7 h-7 text-white" strokeWidth={2.5} fill="white" />
                    }
                  </div>
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/30">
                  <div
                    className="h-full bg-accent transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <img
                src={mediaUrl}
                alt={titleText}
                className="w-full aspect-video object-cover"
                loading="lazy"
                onError={() => setMediaError(true)}
              />
            )}
          </div>
        )}

        {mediaError && (
          <div className="mx-4 mb-2 h-40 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 text-sm">
            {t('imageUnavailable', 'Image unavailable')}
          </div>
        )}

        {/* Category chip */}
        {post.category && (
          <div className="px-4 pb-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400">
              {post.category}
            </span>
          </div>
        )}

        {/* Title */}
        <div className="px-4 pb-1">
          <h2 className="text-[16px] font-bold leading-snug text-neutral-900 dark:text-neutral-50 line-clamp-3">
            {titleText}
          </h2>
        </div>

        {/* Summary / content preview */}
        {contentPreview && (
          <div className="px-4 pb-2">
            <p className="text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400 line-clamp-2">
              {showFullContent ? contentText : contentPreview}
              {needsReadMore && !showFullContent && '…'}
            </p>
            {needsReadMore && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullContent(!showFullContent);
                }}
                className="text-primary-600 dark:text-primary-400 text-[12px] font-medium mt-0.5 hover:underline"
              >
                {showFullContent ? 'Show less' : t('readMore')}
              </button>
            )}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1">
            {post.tags.slice(0, 4).map((tag, i) => (
              <span
                key={i}
                className="text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-full px-2 py-0.5"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Action bar ────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-5">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-transform active:scale-90 ${
              isLiked ? 'text-red-500' : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            <Heart className={`w-[19px] h-[19px] ${isLiked ? 'fill-current' : ''}`} strokeWidth={isLiked ? 0 : 1.8} />
            {(post.likes || 0) + (isLiked ? 1 : 0) > 0 && (
              <span className="text-[12px] font-medium">{(post.likes || 0) + (isLiked ? 1 : 0)}</span>
            )}
          </button>

          {/* Comment */}
          <button
            onClick={handlePostClick}
            className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500 transition-transform active:scale-90"
          >
            <MessageCircle className="w-[19px] h-[19px]" strokeWidth={1.8} />
            {post.comments > 0 && (
              <span className="text-[12px] font-medium">{post.comments}</span>
            )}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center text-neutral-400 dark:text-neutral-500 transition-transform active:scale-90"
          >
            <Share className="w-[19px] h-[19px]" strokeWidth={1.8} />
          </button>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className={`flex items-center transition-transform active:scale-90 ${
            isSaved ? 'text-primary-600' : 'text-neutral-400 dark:text-neutral-500'
          }`}
        >
          <Bookmark className={`w-[19px] h-[19px] ${isSaved ? 'fill-current' : ''}`} strokeWidth={isSaved ? 0 : 1.8} />
        </button>
      </div>
    </article>
  );
};

export default PostCard;