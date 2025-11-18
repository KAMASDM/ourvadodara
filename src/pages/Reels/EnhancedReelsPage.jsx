// =============================================
// src/pages/Reels/EnhancedReelsPage.jsx
// Instagram/TikTok-Style Vertical Reels with Snap Scrolling
// =============================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { ref, update, increment } from 'firebase/database';
import { db } from '../../firebase-config';
import logoImage from '../../assets/images/our-vadodara-logo.png.png';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark,
  Volume2,
  VolumeX,
  MoreVertical,
  Play,
  Pause
} from 'lucide-react';
import { POST_TYPES } from '../../utils/mediaSchema';
import ShareSheet from '../../components/Common/ShareSheet';

const EnhancedReelsPage = ({ onBack, initialReelId = null }) => {
  const { user } = useAuth();
  const { data: reelsData, isLoading } = useRealtimeData('reels');
  
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [likedReels, setLikedReels] = useState(new Set());
  const [savedReels, setSavedReels] = useState(new Set());
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [shareData, setShareData] = useState(null);
  
  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const observerRef = useRef(null);
  const isScrolling = useRef(false);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  
  // Process reels data
  const reels = reelsData 
    ? Object.entries(reelsData)
        .map(([id, reel]) => ({ id, ...reel }))
        .filter(reel => reel.isPublished && reel.type === POST_TYPES.REEL)
        .sort((a, b) => new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0))
    : [];

  // Initialize to specific reel if provided
  useEffect(() => {
    if (!initialReelId || reels.length === 0) return;

    const initialIndex = reels.findIndex(reel => reel.id === initialReelId);
    if (initialIndex >= 0) {
      setCurrentReelIndex(initialIndex);
      setTimeout(() => {
        scrollToReel(initialIndex);
      }, 100);
    }
  }, [initialReelId, reels.length]);

  // Intersection Observer for autoplay management
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
            // Play video when 75% visible
            video.play().catch(() => {});
          } else {
            // Pause when not visible
            video.pause();
          }
        });
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1.0] }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Observe videos
  useEffect(() => {
    Object.values(videoRefs.current).forEach((video) => {
      if (video && observerRef.current) {
        observerRef.current.observe(video);
      }
    });

    return () => {
      Object.values(videoRefs.current).forEach((video) => {
        if (video && observerRef.current) {
          observerRef.current.unobserve(video);
        }
      });
    };
  }, [reels.length]);

  // Scroll to specific reel
  const scrollToReel = useCallback((index) => {
    const container = containerRef.current;
    if (!container) return;

    const targetScroll = index * window.innerHeight;
    container.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  }, []);

  // Handle scroll end to snap to nearest reel
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      isScrolling.current = true;

      scrollTimeout = setTimeout(() => {
        isScrolling.current = false;
        const scrollTop = container.scrollTop;
        const viewportHeight = window.innerHeight;
        const nearestIndex = Math.round(scrollTop / viewportHeight);
        
        if (nearestIndex !== currentReelIndex && nearestIndex >= 0 && nearestIndex < reels.length) {
          setCurrentReelIndex(nearestIndex);
          scrollToReel(nearestIndex);
        }
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [currentReelIndex, reels.length, scrollToReel]);

  // Touch gesture handling for swipe
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
    };

    const handleTouchEnd = (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      const deltaY = touchStartY.current - touchEndY;
      const deltaTime = touchEndTime - touchStartTime.current;
      const velocity = Math.abs(deltaY) / deltaTime;

      // Fast swipe detection (velocity-based)
      if (velocity > 0.5 && Math.abs(deltaY) > 50) {
        if (deltaY > 0 && currentReelIndex < reels.length - 1) {
          // Swipe up - next reel
          setCurrentReelIndex(prev => prev + 1);
          scrollToReel(currentReelIndex + 1);
        } else if (deltaY < 0 && currentReelIndex > 0) {
          // Swipe down - previous reel
          setCurrentReelIndex(prev => prev - 1);
          scrollToReel(currentReelIndex - 1);
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentReelIndex, reels.length, scrollToReel]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp' && currentReelIndex > 0) {
        e.preventDefault();
        setCurrentReelIndex(prev => prev - 1);
        scrollToReel(currentReelIndex - 1);
      } else if (e.key === 'ArrowDown' && currentReelIndex < reels.length - 1) {
        e.preventDefault();
        setCurrentReelIndex(prev => prev + 1);
        scrollToReel(currentReelIndex + 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentReelIndex, reels.length]);

  const togglePlayPause = () => {
    const currentVideo = videoRefs.current[currentReelIndex];
    if (currentVideo) {
      if (currentVideo.paused) {
        currentVideo.play();
      } else {
        currentVideo.pause();
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    Object.values(videoRefs.current).forEach(video => {
      if (video) {
        video.muted = !isMuted;
      }
    });
  };

  const handleLike = async (reel) => {
    if (!user) return;

    const isLiked = likedReels.has(reel.id);
    const newLikes = (reel.likes || 0) + (isLiked ? -1 : 1);

    try {
      const reelRef = ref(db, `reels/${reel.id}`);
      await update(reelRef, {
        likes: newLikes
      });

      setLikedReels(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.delete(reel.id);
        } else {
          newSet.add(reel.id);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Error liking reel:', error);
    }
  };

  const handleSave = (reel) => {
    setSavedReels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reel.id)) {
        newSet.delete(reel.id);
      } else {
        newSet.add(reel.id);
      }
      return newSet;
    });
  };

  const handleShare = (reel) => {
    const shareUrl = `${window.location.origin}/reels/${reel.id}`;
    setShareData({
      title: reel.title?.en || 'Check out this reel',
      text: reel.excerpt?.en || reel.description?.en || '',
      url: shareUrl
    });
    setShareSheetOpen(true);
  };

  const handleComment = (reel) => {
    // Navigate to comments (implement as needed)
    console.log('Open comments for reel:', reel.id);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading Reels...</p>
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center bg-black bg-opacity-50 rounded-full text-white z-10"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <div className="text-white text-center px-4">
          <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No reels available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent p-4">
        <div className="flex items-center justify-between">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center bg-black bg-opacity-30 rounded-full text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-white font-semibold text-lg">Reels</h1>
          <button
            onClick={toggleMute}
            className="w-10 h-10 flex items-center justify-center bg-black bg-opacity-30 rounded-full text-white"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Reels Container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {reels.map((reel, index) => (
          <ReelCard
            key={reel.id}
            reel={reel}
            index={index}
            isActive={index === currentReelIndex}
            isMuted={isMuted}
            isLiked={likedReels.has(reel.id)}
            isSaved={savedReels.has(reel.id)}
            videoRef={(el) => (videoRefs.current[index] = el)}
            onLike={() => handleLike(reel)}
            onComment={() => handleComment(reel)}
            onShare={() => handleShare(reel)}
            onSave={() => handleSave(reel)}
            onPlayPause={togglePlayPause}
          />
        ))}
      </div>

      {/* Share Sheet */}
      <ShareSheet
        isOpen={shareSheetOpen}
        onClose={() => setShareSheetOpen(false)}
        shareData={shareData}
      />
    </div>
  );
};

// Individual Reel Card Component
const ReelCard = ({ 
  reel, 
  index, 
  isActive, 
  isMuted, 
  isLiked, 
  isSaved,
  videoRef,
  onLike,
  onComment,
  onShare,
  onSave,
  onPlayPause
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const brandName = 'Our Vadodara';
  const brandAvatar = logoImage;

  const videoUrl = reel.mediaContent?.items?.[0]?.url || reel.videoUrl || '';
  const thumbnailUrl = reel.mediaContent?.items?.[0]?.thumbnailUrl || reel.thumbnail || '';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoRef]);

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
      // Show play/pause indicator
      setShowPlayButton(true);
      setTimeout(() => setShowPlayButton(false), 500);
    }
  };

  return (
    <div
      className="relative w-full h-full snap-start snap-always flex items-center justify-center bg-black"
      style={{ minHeight: '100vh', maxHeight: '100vh' }}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        className="w-full object-contain"
        style={{ height: 'calc(100vh - 120px)', maxHeight: 'calc(100vh - 120px)' }}
        muted={isMuted}
        loop
        playsInline
        onClick={handleVideoClick}
      />

      {/* Play/Pause Indicator */}
      {showPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 bg-black bg-opacity-50 rounded-full flex items-center justify-center animate-ping-once">
            {isPlaying ? (
              <Pause className="w-10 h-10 text-white" />
            ) : (
              <Play className="w-10 h-10 text-white ml-1" />
            )}
          </div>
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 text-white">
        {/* Author Info */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-10 h-10 rounded-full bg-white p-1">
            <img
              src={brandAvatar}
              alt={brandName}
              className="w-full h-full rounded-full object-contain"
            />
          </div>
          <span className="font-semibold">{brandName}</span>
          {/* <button className="px-4 py-1 bg-primary-red rounded-full text-sm font-medium">
            Follow
          </button> */}
        </div>

        {/* Title/Description */}
        {reel.title?.en && (
          <h3 className="font-semibold text-lg mb-2">{reel.title.en}</h3>
        )}
        {reel.excerpt?.en && (
          <p className="text-sm opacity-90 mb-2 line-clamp-2">{reel.excerpt.en}</p>
        )}

        {/* Hashtags */}
        {reel.tags && reel.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {reel.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="text-sm text-blue-300">#{tag}</span>
            ))}
          </div>
        )}

        {/* Music Info */}
        {reel.reelSettings?.musicTitle && (
          <div className="mt-2 flex items-center space-x-2 text-sm">
            <span>🎵</span>
            <span className="truncate">
              {reel.reelSettings.musicTitle}
              {reel.reelSettings.musicArtist && ` • ${reel.reelSettings.musicArtist}`}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons (Right Side) */}
      <div className="absolute right-4 bottom-20 flex flex-col space-y-6">
        <ActionButton
          icon={Heart}
          label={reel.likes || 0}
          active={isLiked}
          onClick={onLike}
        />
        <ActionButton
          icon={MessageCircle}
          label={reel.comments || 0}
          onClick={onComment}
        />
        <ActionButton
          icon={Share2}
          label="Share"
          onClick={onShare}
        />
        <ActionButton
          icon={Bookmark}
          active={isSaved}
          onClick={onSave}
        />
      </div>
    </div>
  );
};

// Action Button Component
const ActionButton = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center space-y-1"
  >
    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
      active 
        ? 'bg-primary-red text-white' 
        : 'bg-black bg-opacity-40 text-white hover:bg-opacity-60'
    }`}>
      <Icon className={`w-6 h-6 ${active && Icon.displayName === 'Heart' ? 'fill-white' : ''}`} />
    </div>
    {label && (
      <span className="text-white text-xs font-medium">
        {typeof label === 'number' && label > 0 ? (
          label >= 1000 ? `${(label / 1000).toFixed(1)}K` : label
        ) : label}
      </span>
    )}
  </button>
);

export default EnhancedReelsPage;
