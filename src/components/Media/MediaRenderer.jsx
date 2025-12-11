// =============================================
// src/components/Media/MediaRenderer.jsx
// Universal Media Renderer for All Post Types
// =============================================
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import logoImage from '../../assets/images/our-vadodara-logo.png.png';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Share2,
  Heart,
  MessageCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye
} from 'lucide-react';
import { MEDIA_TYPES, POST_TYPES } from '../../utils/mediaSchema';
import InstagramCarousel from './InstagramCarousel';

const MediaRenderer = ({ 
  post, 
  className = '', 
  autoplay = false, 
  showControls = true,
  showActionButtons = true,
  showReelInfo = true,
  onInteraction = null,
  showCarouselDots = true,
  onCarouselChange = null,
  externalCarouselIndex = null
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const carouselChangeRef = useRef(onCarouselChange);
  const lastCarouselSnapshot = useRef({ index: null, total: null });

  const { type, mediaContent, media } = post;
  const brandName = 'Our Vadodara';
  const brandAvatar = logoImage;
  const { items: rawItems = [], settings = {} } = mediaContent || {};

  const normalizeAspectRatio = (value, fallback = '1/1') => {
    const target = value || fallback;
    if (typeof target === 'number') return String(target);
    if (typeof target !== 'string') return fallback;

    if (target.includes(':')) {
      const [width, height] = target.split(':').map(part => part.trim());
      if (width && height) {
        return `${width}/${height}`;
      }
    }

    return target;
  };

  const items = useMemo(() => (
    Array.isArray(rawItems)
      ? rawItems
      : Object.values(rawItems || {})
  ), [rawItems]);

  const legacyMedia = useMemo(() => (
    Array.isArray(media)
      ? media
      : Object.values(media || {})
  ), [media]);

  const sortMediaItems = useCallback((list) => list
    .filter(Boolean)
    .map((item, index) => ({
      item,
      order: item?.order ?? item?.sortOrder ?? item?.position ?? index
    }))
    .sort((a, b) => a.order - b.order)
    .map(entry => entry.item), []);

  const resolveMediaUrl = useCallback((item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;

    const {
      url,
      downloadURL,
      downloadUrl,
      fileUrl,
      fileURL,
      imageUrl,
      mediaUrl,
      src,
      previewUrl,
      secureUrl,
      path
    } = item;

    const candidate = url || downloadURL || downloadUrl || fileUrl || fileURL || imageUrl || mediaUrl || src || previewUrl || secureUrl;
    if (candidate) {
      return candidate;
    }

    if (path && /^https?:\/\//.test(path)) {
      return path;
    }

    return '';
  }, []);

  useEffect(() => {
    carouselChangeRef.current = onCarouselChange;
  }, [onCarouselChange]);

  // Handle legacy posts with media array but no mediaContent
  const effectiveItems = useMemo(() => {
    const source = items.length > 0 ? items : legacyMedia;
    return sortMediaItems(source);
  }, [items, legacyMedia, sortMediaItems]);

  const validSlides = useMemo(() => (
    effectiveItems.filter(item => resolveMediaUrl(item))
  ), [effectiveItems, resolveMediaUrl]);
  const validSlidesCount = validSlides.length;
  const hasMultipleItems = effectiveItems.length > 1;

  useEffect(() => {
    if (currentIndex > effectiveItems.length - 1) {
      setCurrentIndex(0);
    }
  }, [effectiveItems.length, currentIndex]);

  useEffect(() => {
    const totalSlides = validSlidesCount;

    if (totalSlides === 0) {
      if (currentIndex !== 0) {
        setCurrentIndex(0);
      }
      const snapshot = lastCarouselSnapshot.current;
      if (snapshot.index !== 0 || snapshot.total !== 0) {
        lastCarouselSnapshot.current = { index: 0, total: 0 };
        carouselChangeRef.current?.(0, 0);
      }
      return;
    }

    const safeIndex = Math.max(0, Math.min(currentIndex, totalSlides - 1));
    if (safeIndex !== currentIndex) {
      setCurrentIndex(safeIndex);
      return;
    }

    const snapshot = lastCarouselSnapshot.current;
    if (snapshot.index !== safeIndex || snapshot.total !== totalSlides) {
      lastCarouselSnapshot.current = { index: safeIndex, total: totalSlides };
      carouselChangeRef.current?.(safeIndex, totalSlides);
    }
  }, [currentIndex, validSlidesCount]);

  useEffect(() => {
    if (typeof externalCarouselIndex !== 'number' || validSlidesCount <= 1) {
      return;
    }

    const clampedIndex = Math.max(0, Math.min(externalCarouselIndex, validSlidesCount - 1));
    if (clampedIndex !== currentIndex) {
      setCurrentIndex(clampedIndex);
    }
  }, [externalCarouselIndex, validSlidesCount, currentIndex]);

  // If no media items, return placeholder
  if (!effectiveItems || effectiveItems.length === 0) {
    return (
      <div className={`bg-gray-200 dark:bg-gray-700 aspect-video flex items-center justify-center rounded-lg ${className}`}>
        <span className="text-gray-500 dark:text-gray-400">No media available</span>
      </div>
    );
  }

  // Handle video playback
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const updateProgress = () => {
        if (video.duration) {
          const progress = (video.currentTime / video.duration) * 100;
          setProgress(progress);
          setCurrentTime(video.currentTime);
          setDuration(video.duration);
        }
      };

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => {
        setIsPlaying(false);
        if (settings.loop || type === POST_TYPES.REEL) {
          video.currentTime = 0;
          video.play();
        }
      };

      video.addEventListener('timeupdate', updateProgress);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handleEnded);

      if (autoplay && (type === POST_TYPES.REEL || type === POST_TYPES.STORY)) {
        video.play().catch(() => {
          // Autoplay failed - this is expected browser behavior
          // User interaction is required to start playback
        });
      }

      return () => {
        video.removeEventListener('timeupdate', updateProgress);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentIndex, autoplay, settings.loop, type]);

  // Handle story progression
  useEffect(() => {
    if (type === POST_TYPES.STORY && items.length > 1) {
      const timer = setTimeout(() => {
        if (currentIndex < items.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else if (settings.loop) {
          setCurrentIndex(0);
        }
      }, (settings.duration || 15) * 1000);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, type, items.length, settings.duration, settings.loop]);

  // Handle global drag events for progress bar scrubbing
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMove = (e) => {
      e.preventDefault();
      handleProgressDrag(e);
    };

    const handleGlobalEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleGlobalMove);
    document.addEventListener('mouseup', handleGlobalEnd);
    document.addEventListener('touchmove', handleGlobalMove, { passive: false });
    document.addEventListener('touchend', handleGlobalEnd);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
      document.removeEventListener('touchmove', handleGlobalMove);
      document.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [isDragging]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleProgressClick = (e) => {
    if (videoRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      videoRef.current.currentTime = percentage * videoRef.current.duration;
    }
  };

  const handleProgressDragStart = (e) => {
    setIsDragging(true);
    updateProgressFromEvent(e);
  };

  const handleProgressDrag = (e) => {
    if (isDragging) {
      updateProgressFromEvent(e);
    }
  };

  const handleProgressDragEnd = () => {
    setIsDragging(false);
  };

  const updateProgressFromEvent = (e) => {
    if (videoRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clientX = e.type.includes('touch') ? e.touches[0]?.clientX : e.clientX;
      const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = clickX / rect.width;
      videoRef.current.currentTime = percentage * videoRef.current.duration;
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const nextSlide = () => {
    const total = effectiveItems.length;
    if (total === 0) return;
    if (currentIndex < total - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (settings.infinite) {
      setCurrentIndex(0);
    }
  };

  const prevSlide = () => {
    const total = effectiveItems.length;
    if (total === 0) return;
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (settings.infinite) {
      setCurrentIndex(total - 1);
    }
  };

  const handleInteraction = (type, data = {}) => {
    onInteraction?.(type, { ...data, postId: post.id, mediaIndex: currentIndex });
  };

  // Handle legacy image field as fallback
  if ((!effectiveItems || effectiveItems.length === 0) && post.image) {
    return (
      <div className={`relative rounded-lg overflow-hidden ${className}`}>
  <div className="relative w-full" style={{ aspectRatio: normalizeAspectRatio(settings.aspectRatio, '16/9') }}>
          <img
            src={post.image}
            alt={post.title?.en || post.title || 'News image'}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  if (!effectiveItems || effectiveItems.length === 0) {
    return null; // Don't render anything if no media
  }

  const currentItem = effectiveItems[currentIndex] || effectiveItems[0];
  const currentItemSource = resolveMediaUrl(currentItem);
  const inferredMime = typeof currentItem === 'object' ? currentItem?.mimeType || currentItem?.metadata?.format : '';
  const isVideo = (typeof currentItem === 'object' && currentItem.type === 'video')
    || (inferredMime && inferredMime.startsWith('video/'))
    || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(currentItemSource || '');

  // Story Renderer
  if (type === POST_TYPES.STORY) {
    return (
      <div 
        className={`relative bg-black rounded-lg overflow-hidden ${className}`}
        style={{ backgroundColor: post.storySettings?.backgroundColor || '#000000' }}
        onMouseEnter={() => setShowProgress(true)}
        onMouseLeave={() => setShowProgress(false)}
      >
        {/* Progress Bars for Multiple Stories */}
        {items.length > 1 && showProgress && (
          <div className="absolute top-4 left-4 right-4 flex space-x-2 z-30">
            {items.map((_, index) => (
              <div key={index} className="flex-1 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-white transition-all duration-300 ${
                    index < currentIndex ? 'w-full' : 
                    index === currentIndex ? 'w-1/2' : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Story Content */}
        <div className="relative w-full" style={{ aspectRatio: '9/16', maxHeight: '100vh' }}>
          {isVideo ? (
            <video
              ref={videoRef}
              src={currentItemSource}
              className="w-full h-full object-contain bg-black"
              muted={isMuted}
              loop={settings.loop}
              playsInline
              onClick={togglePlayPause}
            />
          ) : (
            <img
              src={currentItemSource}
              alt={currentItem.caption?.en || ''}
              className="w-full h-full object-contain bg-black"
            />
          )}

          {/* Story Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
          
          {/* Story Text */}
          {post.title?.en && (
            <div 
              className="absolute bottom-6 left-4 right-4 text-white"
              style={{ color: post.storySettings?.textColor || '#ffffff' }}
            >
              <h3 className="text-lg font-semibold mb-2">{post.title.en}</h3>
              {post.content?.en && (
                <p className="text-sm opacity-90">{post.content.en}</p>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          {items.length > 1 && (
            <>
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white bg-black bg-opacity-30 rounded-full hover:bg-opacity-50 transition-colors"
                disabled={currentIndex === 0 && !settings.infinite}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setCurrentIndex(prev => prev < items.length - 1 ? prev + 1 : settings.infinite ? 0 : prev)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white bg-black bg-opacity-30 rounded-full hover:bg-opacity-50 transition-colors"
                disabled={currentIndex === items.length - 1 && !settings.infinite}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Video Controls */}
          {isVideo && showControls && (
            <>
              {/* Progress Bar for Video Stories */}
              <div className="absolute bottom-16 left-4 right-4">
                <div className="flex justify-between text-white text-xs mb-1 px-1">
                  <span className="font-medium">{formatTime(currentTime)}</span>
                  <span className="opacity-70">{formatTime(duration)}</span>
                </div>
                
                <div 
                  ref={progressRef}
                  className="relative h-1 bg-white bg-opacity-30 rounded-full cursor-pointer group"
                  onClick={handleProgressClick}
                  onMouseDown={handleProgressDragStart}
                  onMouseMove={handleProgressDrag}
                  onMouseUp={handleProgressDragEnd}
                  onMouseLeave={handleProgressDragEnd}
                  onTouchStart={handleProgressDragStart}
                  onTouchMove={handleProgressDrag}
                  onTouchEnd={handleProgressDragEnd}
                >
                  <div 
                    className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                  
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    style={{ left: `calc(${progress}% - 6px)` }}
                  />
                </div>
              </div>
              
              {/* Control Buttons */}
              <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                <button
                  onClick={togglePlayPause}
                  className="w-8 h-8 flex items-center justify-center text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 flex items-center justify-center text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Reel Renderer
  if (type === POST_TYPES.REEL) {
    // Auto-play logic for reels
    useEffect(() => {
      if (!videoRef.current) return;

      const video = videoRef.current;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              video.play().catch((err) => {
                console.log('Reel auto-play prevented:', err.message);
                setIsPlaying(false);
              });
            } else {
              video.pause();
              setIsPlaying(false);
            }
          });
        },
        { threshold: [0, 0.5, 1.0] }
      );

      observer.observe(video);
      return () => observer.disconnect();
    }, [videoRef.current]);

    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${className}`} style={{ aspectRatio: '9/16', maxHeight: '100vh' }}>
        {/* Video */}
        <video
          ref={videoRef}
          src={currentItemSource}
          className="w-full h-full object-contain"
          muted
          loop
          playsInline
          poster={currentItem.thumbnailUrl}
        />

        {/* Reel Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />

        {/* Custom Play/Pause Button Overlay */}
        <div
          onClick={togglePlayPause}
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
          style={{ pointerEvents: 'auto' }}
        >
          <div className={`bg-black bg-opacity-60 rounded-full p-4 transform transition-all duration-200 border-2 border-white ${
            isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
          }`}>
            {isPlaying ? (
              <Pause className="w-10 h-10 text-white" strokeWidth={2.5} />
            ) : (
              <Play className="w-10 h-10 text-white" strokeWidth={2.5} fill="white" />
            )}
          </div>
        </div>

        {/* Progress Bar - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 bg-opacity-70 z-20">
          <div
            className="h-full bg-red-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Reel Info */}
        {showReelInfo && (
          <div className="absolute bottom-4 left-4 right-16 text-white">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-white p-1 flex items-center justify-center">
                <img
                  src={brandAvatar}
                  alt={brandName}
                  className="w-full h-full rounded-full object-contain"
                />
              </div>
              <span className="font-semibold">{post.author?.name || brandName}</span>
            </div>
            
            {post.title?.en && (
              <h3 className="font-medium mb-1">{post.title.en}</h3>
            )}
            
            {post.description?.en && (
              <p className="text-sm opacity-90 line-clamp-2">{post.description.en}</p>
            )}
            
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {post.hashtags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="text-blue-300 text-sm">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {showActionButtons && (
          <div className="absolute bottom-4 right-4 flex flex-col space-y-4">
          <button
            onClick={() => handleInteraction('like')}
            className="w-12 h-12 flex items-center justify-center text-white bg-black bg-opacity-30 rounded-full hover:bg-opacity-50 transition-colors"
          >
            <Heart className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => handleInteraction('comment')}
            className="w-12 h-12 flex items-center justify-center text-white bg-black bg-opacity-30 rounded-full hover:bg-opacity-50 transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => handleInteraction('share')}
            className="w-12 h-12 flex items-center justify-center text-white bg-black bg-opacity-30 rounded-full hover:bg-opacity-50 transition-colors"
          >
            <Share2 className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => handleInteraction('save')}
            className="w-12 h-12 flex items-center justify-center text-white bg-black bg-opacity-30 rounded-full hover:bg-opacity-50 transition-colors"
          >
            <Bookmark className="w-6 h-6" />
          </button>
          
          <button
            onClick={toggleMute}
            className="w-12 h-12 flex items-center justify-center text-white bg-black bg-opacity-30 rounded-full hover:bg-opacity-50 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          </div>
        )}

        {/* Music Attribution */}
        {post.reelSettings?.musicTitle && (
          <div className="absolute top-4 left-4 right-4 flex items-center text-white text-sm">
            <div className="flex items-center bg-black bg-opacity-30 rounded-full px-3 py-1">
              <span className="mr-2">🎵</span>
              <span className="truncate">{post.reelSettings.musicTitle}</span>
              {post.reelSettings.musicArtist && (
                <span className="ml-1 opacity-75">• {post.reelSettings.musicArtist}</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Carousel Renderer - handle multiple images as carousel
  const isCarousel = type === POST_TYPES.CAROUSEL || 
                     mediaContent?.type === MEDIA_TYPES.CAROUSEL || 
                     mediaContent?.type === 'carousel' ||
                     hasMultipleItems;
  
  if (isCarousel && effectiveItems.length > 1) {
    const carouselItems = effectiveItems
      .map((item, index) => {
        const source = resolveMediaUrl(item);
        if (!source) {
          return null;
        }

        if (typeof item === 'string') {
          return {
            url: source,
            alt: `Slide ${index + 1}`,
            caption: null,
            raw: item
          };
        }

        const fallbackAlt = item.alt || item.altText?.en || item.caption?.en || `Slide ${index + 1}`;
        const localizedCaption = typeof item.caption === 'object'
          ? item.caption?.en || item.caption?.default || fallbackAlt
          : item.caption || fallbackAlt;

        return {
          url: source,
          alt: fallbackAlt,
          caption: localizedCaption,
          raw: item
        };
      })
      .filter(Boolean);

    if (carouselItems.length === 0) {
      return (
        <div className={`bg-gray-200 dark:bg-gray-700 aspect-video flex items-center justify-center rounded-lg ${className}`}>
          <span className="text-gray-500 dark:text-gray-400">No media available</span>
        </div>
      );
    }

    const totalSlides = carouselItems.length;
    const activeCarouselItem = carouselItems[Math.min(currentIndex, totalSlides - 1)];

    return (
      <div className={className}>
        <InstagramCarousel 
          className="w-full"
          images={carouselItems}
          aspectRatio={normalizeAspectRatio(settings.aspectRatio, '1/1')}
          showDots={showCarouselDots && settings.showDots !== false}
          enableSwipe={true}
          autoPlay={post.carouselSettings?.autoPlay || settings.autoPlay || false}
          autoPlayInterval={post.carouselSettings?.interval || settings.interval || 3000}
          externalCurrentIndex={currentIndex}
          viewCount={post.analytics?.views ?? post.views ?? null}
          onImageChange={(index) => {
            setCurrentIndex(index);
            if (onInteraction) {
              onInteraction('carousel_change', { index });
            }
            onCarouselChange?.(index, totalSlides);
          }}
        />
        
        {/* Caption overlay for current image */}
        {activeCarouselItem?.caption && settings.showCaptions && (
          <div className="mt-2 px-2">
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              {activeCarouselItem.caption}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Auto-play logic for single video (standard posts)
  useEffect(() => {
    if (!isVideo || !videoRef.current || type === POST_TYPES.REEL || type === POST_TYPES.STORY) {
      return; // Only for standard post videos
    }

    const video = videoRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            video.play().catch((err) => {
              console.log('Auto-play prevented:', err.message);
              setIsPlaying(false);
            });
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: [0, 0.5, 1.0] }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [isVideo, type, videoRef.current]);

  // Single Image/Video Renderer
  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <div className="relative w-full" style={{ aspectRatio: normalizeAspectRatio(settings.aspectRatio, '16/9') }}>
        {!isVideo ? (
          <img
            src={currentItemSource || logoImage}
            alt={currentItem.caption?.en || ''}
            className="w-full h-full object-cover"
          />
        ) : currentItemSource ? (
          <>
            <video
              ref={videoRef}
              src={currentItemSource}
              className="w-full h-full object-cover bg-black"
              muted
              playsInline
              poster={currentItem.thumbnailUrl}
              loop={settings.loop}
            />
            
            {/* Custom Play/Pause Button Overlay */}
            {showControls && (
              <div
                onClick={togglePlayPause}
                className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
                style={{ pointerEvents: 'auto' }}
              >
                <div className={`bg-black bg-opacity-60 rounded-full p-4 transform transition-all duration-200 ${
                  isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
                }`}>
                  {isPlaying ? (
                    <Pause className="w-10 h-10 text-white" strokeWidth={2.5} />
                  ) : (
                    <Play className="w-10 h-10 text-white" strokeWidth={2.5} fill="white" />
                  )}
                </div>
              </div>
            )}
            
            {/* Progress Bar - Fixed at bottom */}
            {showControls && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 bg-opacity-70 z-20">
                <div
                  className="h-full bg-red-500 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            Media unavailable
          </div>
        )}

        {/* Caption */}
        {currentItem.caption?.en && settings.showCaptions && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4">
            <p className="text-white text-sm">{currentItem.caption.en}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaRenderer;