// =============================================
// src/components/Media/MediaRenderer.jsx
// Universal Media Renderer for All Post Types
// =============================================
import React, { useState, useRef, useEffect } from 'react';
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

const MediaRenderer = ({ 
  post, 
  className = '', 
  autoplay = false, 
  showControls = true,
  onInteraction = null 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const videoRef = useRef(null);
  const progressRef = useRef(null);

  const { type, mediaContent } = post;
  const { items = [], settings = {} } = mediaContent || {};

  // Handle video playback
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const updateProgress = () => {
        if (video.duration) {
          const progress = (video.currentTime / video.duration) * 100;
          setProgress(progress);
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

      if (autoplay && type === POST_TYPES.REEL) {
        video.play().catch(() => {
          // Autoplay failed, likely due to browser policy
          console.log('Autoplay failed');
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

  const nextSlide = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (settings.infinite) {
      setCurrentIndex(0);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (settings.infinite) {
      setCurrentIndex(items.length - 1);
    }
  };

  const handleInteraction = (type, data = {}) => {
    onInteraction?.(type, { ...data, postId: post.id, mediaIndex: currentIndex });
  };

  // Handle legacy image field as fallback
  if ((!items || items.length === 0) && post.image) {
    return (
      <div className={`relative rounded-lg overflow-hidden ${className}`}>
        <div className="relative w-full" style={{ aspectRatio: settings.aspectRatio || '16/9' }}>
          <img
            src={post.image}
            alt={post.title?.en || post.title || 'News image'}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return null; // Don't render anything if no media
  }

  const currentItem = items[currentIndex] || items[0];

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
        <div className="relative w-full h-full">
          {currentItem.type === 'image' ? (
            <img
              src={currentItem.url}
              alt={currentItem.caption?.en || ''}
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              src={currentItem.url}
              className="w-full h-full object-cover"
              muted={isMuted}
              loop={settings.loop}
              playsInline
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
          {currentItem.type === 'video' && showControls && (
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
          )}
        </div>
      </div>
    );
  }

  // Reel Renderer
  if (type === POST_TYPES.REEL) {
    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
        {/* Video */}
        <video
          ref={videoRef}
          src={currentItem.url}
          className="w-full h-full object-cover"
          muted={isMuted}
          loop
          playsInline
          poster={currentItem.thumbnailUrl}
        />

        {/* Reel Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

        {/* Play/Pause Overlay */}
        <button
          onClick={togglePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-transparent"
        >
          {!isPlaying && (
            <div className="w-16 h-16 flex items-center justify-center bg-white bg-opacity-20 rounded-full">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          )}
        </button>

        {/* Progress Bar */}
        <div 
          ref={progressRef}
          className="absolute bottom-20 left-4 right-4 h-1 bg-white bg-opacity-30 rounded-full cursor-pointer"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-white rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Reel Info */}
        <div className="absolute bottom-4 left-4 right-16 text-white">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-white p-1 flex items-center justify-center">
              <img
                src={post.author?.avatar || logoImage}
                alt={post.author?.name}
                className="w-full h-full rounded-full object-contain"
              />
            </div>
            <span className="font-semibold">{post.author?.name}</span>
            {post.author?.verified && (
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white">✓</span>
              </div>
            )}
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

        {/* Action Buttons */}
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

  // Carousel Renderer
  if (type === POST_TYPES.CAROUSEL || mediaContent.type === MEDIA_TYPES.CAROUSEL) {
    return (
      <div className={`relative rounded-lg overflow-hidden ${className}`}>
        {/* Current Media */}
        <div className="relative w-full" style={{ aspectRatio: settings.aspectRatio || '16/9' }}>
          {currentItem.type === 'image' ? (
            <img
              src={currentItem.url}
              alt={currentItem.caption?.en || ''}
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              src={currentItem.url}
              className="w-full h-full object-cover"
              controls={showControls}
              muted={isMuted}
              poster={currentItem.thumbnailUrl}
            />
          )}

          {/* Navigation Arrows */}
          {items.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-lg transition-all"
                disabled={currentIndex === 0 && !settings.infinite}
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-lg transition-all"
                disabled={currentIndex === items.length - 1 && !settings.infinite}
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </>
          )}

          {/* Media Counter */}
          {items.length > 1 && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              {currentIndex + 1} / {items.length}
            </div>
          )}
        </div>

        {/* Dots Indicator */}
        {items.length > 1 && settings.showDots && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
              />
            ))}
          </div>
        )}

        {/* Caption */}
        {currentItem.caption?.en && settings.showCaptions && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4">
            <p className="text-white text-sm">{currentItem.caption.en}</p>
          </div>
        )}
      </div>
    );
  }

  // Single Image/Video Renderer
  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <div className="relative w-full" style={{ aspectRatio: settings.aspectRatio || '16/9' }}>
        {currentItem.type === 'image' ? (
          <img
            src={currentItem.url}
            alt={currentItem.caption?.en || ''}
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            src={currentItem.url}
            className="w-full h-full object-cover"
            controls={showControls}
            muted={isMuted}
            poster={currentItem.thumbnailUrl}
            loop={settings.loop}
          />
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