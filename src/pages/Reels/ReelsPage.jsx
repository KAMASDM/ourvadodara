// =============================================
// src/pages/Reels/ReelsPage.jsx
// Dedicated Reels Page with TikTok/Instagram-like Experience
// =============================================
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import useViewTracking from '../../hooks/useViewTracking';
import { ref, update, increment, get, onValue } from 'firebase/database';
import { db } from '../../firebase-config';
import logoImage from '../../assets/images/our-vadodara-logo.png.png';
import ThreadedCommentSection from '../../components/Comments/ThreadedCommentSection';
import { useProfileCompletionGuard, ProfileCompletionModal } from '../../components/Common/ProfileCompletionGuard';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark,
  Volume2,
  VolumeX,
  MoreVertical,
  User,
  Plus,
  Play,
  Pause,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { POST_TYPES } from '../../utils/mediaSchema';

const ReelsPage = ({ onBack, initialReelId = null }) => {
  const { user } = useAuth();
  const { data: reelsData, isLoading } = useRealtimeData('reels');
  const { checkProfileComplete, showModal, closeModal, profileCompletion } = useProfileCompletionGuard();
  
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [likedReels, setLikedReels] = useState(new Set());
  const [savedReels, setSavedReels] = useState(new Set());
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  
  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const touchStartX = useRef(0);
  const progressInterval = useRef(null);
  const preloadedVideos = useRef(new Set());
  const isNavigating = useRef(false);

  // Process reels data - memoized for performance
  const reels = useMemo(() => {
    if (!reelsData) return [];
    return Object.entries(reelsData)
      .map(([id, reel]) => ({ id, ...reel }))
      .filter(reel => reel.isPublished && reel.type === POST_TYPES.REEL)
      .sort((a, b) => new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0));
  }, [reelsData]);

  const currentReel = reels[currentReelIndex];
  const prevReel = currentReelIndex > 0 ? reels[currentReelIndex - 1] : null;
  const nextReel = currentReelIndex < reels.length - 1 ? reels[currentReelIndex + 1] : null;

  // Track view for current reel
  useViewTracking(currentReel?.id, 'reels');

  // Preload videos for current and adjacent reels
  useEffect(() => {
    const preloadVideo = (reel) => {
      if (!reel || preloadedVideos.current.has(reel.id)) return;
      
      const videoUrl = reel.mediaContent?.items?.[0]?.url || reel.videoUrl;
      if (!videoUrl) return;

      const video = document.createElement('video');
      video.preload = 'auto';
      video.src = videoUrl;
      video.muted = true;
      
      // Store reference
      if (!videoRefs.current[reel.id]) {
        videoRefs.current[reel.id] = video;
      }
      
      preloadedVideos.current.add(reel.id);
    };

    // Preload current, previous, and next videos
    if (currentReel) preloadVideo(currentReel);
    if (prevReel) preloadVideo(prevReel);
    if (nextReel) preloadVideo(nextReel);

    // Cleanup old video refs (keep only nearby reels)
    const keepIds = new Set([
      currentReel?.id,
      prevReel?.id,
      nextReel?.id
    ].filter(Boolean));

    Object.keys(videoRefs.current).forEach(id => {
      if (!keepIds.has(id)) {
        const video = videoRefs.current[id];
        if (video) {
          video.pause();
          video.src = '';
          video.load();
        }
        delete videoRefs.current[id];
        preloadedVideos.current.delete(id);
      }
    });
  }, [currentReel, prevReel, nextReel]);

  // Load user's likes and saves - optimized with lazy loading
  useEffect(() => {
    if (!user || !reels.length) return;

    const loadUserInteractions = async () => {
      try {
        const reelIds = reels.map(r => r.id);
        
        // Load only likes for current reels
        const likesPromises = reelIds.map(async (id) => {
          const likeRef = ref(db, `likes/${id}/${user.uid}`);
          const snapshot = await get(likeRef);
          return { id, liked: snapshot.exists() };
        });

        const likesResults = await Promise.all(likesPromises);
        const userLikes = new Set(likesResults.filter(r => r.liked).map(r => r.id));
        setLikedReels(userLikes);

        // Load bookmarks
        const bookmarksRef = ref(db, `bookmarks/${user.uid}`);
        const bookmarksSnapshot = await get(bookmarksRef);
        if (bookmarksSnapshot.exists()) {
          const bookmarksData = bookmarksSnapshot.val();
          const userSaves = new Set(
            Object.keys(bookmarksData).filter(id => reelIds.includes(id))
          );
          setSavedReels(userSaves);
        }
      } catch (error) {
        console.error('Error loading user interactions:', error);
      }
    };

    loadUserInteractions();
  }, [user, reels]);

  // Control video playback - optimized with buffer check
  useEffect(() => {
    const video = videoRefs.current[currentReel?.id];
    if (!video) return;

    const playVideo = async () => {
      try {
        // Check if video has buffered enough
        if (video.readyState >= 3) { // HAVE_FUTURE_DATA
          await video.play();
        } else {
          // Wait for enough data to be buffered
          const handleCanPlay = async () => {
            try {
              await video.play();
            } catch (err) {
              console.log('Play failed:', err);
            }
          };
          video.addEventListener('canplay', handleCanPlay, { once: true });
          
          // Timeout fallback
          setTimeout(async () => {
            video.removeEventListener('canplay', handleCanPlay);
            try {
              await video.play();
            } catch (err) {
              console.log('Play failed:', err);
            }
          }, 500);
        }
      } catch (err) {
        console.log('Play failed:', err);
      }
    };

    if (isPlaying) {
      playVideo();
    } else {
      video.pause();
    }
  }, [isPlaying, currentReelIndex, currentReel]);

  // Track video progress - optimized with RAF
  useEffect(() => {
    const video = videoRefs.current[currentReel?.id];
    if (!video) return;

    let rafId;
    
    const updateProgress = () => {
      if (video.duration) {
        const currentProgress = (video.currentTime / video.duration) * 100;
        const bufferedProgress = video.buffered.length > 0 
          ? (video.buffered.end(0) / video.duration) * 100 
          : 0;
        
        setProgress(currentProgress);
        setBuffered(bufferedProgress);
      }
      rafId = requestAnimationFrame(updateProgress);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setProgress(0);
    };

    const handleEnded = () => {
      // Auto-advance to next reel when current one ends
      if (currentReelIndex < reels.length - 1) {
        goToNext();
      } else {
        setProgress(100);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    
    rafId = requestAnimationFrame(updateProgress);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentReelIndex, reels.length, currentReel]);

  // Control video mute
  useEffect(() => {
    const video = videoRefs.current[currentReel?.id];
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted, currentReel]);

  useEffect(() => {
    if (!initialReelId || reels.length === 0) {
      return;
    }

    const initialIndex = reels.findIndex(reel => reel.id === initialReelId);
    if (initialIndex >= 0) {
      setCurrentReelIndex(initialIndex);
    }
  }, [initialReelId, reels]);

  // Hide hints after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHints(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowDown':
          e.preventDefault();
          goToNext();
          break;
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, togglePlay, toggleMute]);

  const goToNext = useCallback(() => {
    if (currentReelIndex < reels.length - 1 && !isNavigating.current) {
      isNavigating.current = true;
      
      // Pause current video immediately
      const currentVideo = videoRefs.current[currentReel?.id];
      if (currentVideo) currentVideo.pause();
      
      setCurrentReelIndex(prev => prev + 1);
      setIsPlaying(true);
      
      // Reset navigation lock after a short delay
      requestAnimationFrame(() => {
        isNavigating.current = false;
      });
    }
  }, [currentReelIndex, reels.length, currentReel]);

  const goToPrevious = useCallback(() => {
    if (currentReelIndex > 0 && !isNavigating.current) {
      isNavigating.current = true;
      
      // Pause current video immediately
      const currentVideo = videoRefs.current[currentReel?.id];
      if (currentVideo) currentVideo.pause();
      
      setCurrentReelIndex(prev => prev - 1);
      setIsPlaying(true);
      
      // Reset navigation lock after a short delay
      requestAnimationFrame(() => {
        isNavigating.current = false;
      });
    }
  }, [currentReelIndex, currentReel]);



  // Enhanced touch gestures for mobile - optimized
  useEffect(() => {
    let isScrolling = false;
    let scrollTimeout;

    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      isScrolling = false;
    };

    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const diffY = Math.abs(currentY - touchStartY.current);
      const diffX = Math.abs(currentX - touchStartX.current);
      
      // Only prevent default if it's a clear vertical swipe
      if (diffY > diffX && diffY > 20) {
        e.preventDefault();
        isScrolling = true;
      }
    };

    const handleTouchEnd = (e) => {
      if (!isScrolling) return;
      
      touchEndY.current = e.changedTouches[0].clientY;
      const swipeDistance = touchStartY.current - touchEndY.current;
      const minSwipeDistance = 50;

      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          // Swipe up - next reel
          goToNext();
        } else if (swipeDistance < 0) {
          // Swipe down - previous reel
          goToPrevious();
        }
      }
      
      isScrolling = false;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [goToNext, goToPrevious]);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
    setShowPlayPauseIcon(true);
    setTimeout(() => setShowPlayPauseIcon(false), 500);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const handleLike = async (reelId) => {
    if (!user) {
      alert('Please sign in to like reels');
      return;
    }
    
    // Check if profile is complete
    if (!checkProfileComplete()) {
      return; // Modal will be shown automatically
    }

    const isLiked = likedReels.has(reelId);
    
    // Show animation only when liking (not unliking)
    if (!isLiked) {
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 1000);
    }
    
    // Optimistic update
    setLikedReels(prev => {
      const newLiked = new Set(prev);
      if (isLiked) {
        newLiked.delete(reelId);
      } else {
        newLiked.add(reelId);
      }
      return newLiked;
    });
    
    try {
      // Update Firebase
      const updates = {};
      updates[`likes/${reelId}/${user.uid}`] = isLiked ? null : true;
      updates[`reels/${reelId}/analytics/likes`] = increment(isLiked ? -1 : 1);
      
      await update(ref(db), updates);
    } catch (error) {
      console.error('Error updating like:', error);
      // Revert on error
      setLikedReels(prev => {
        const newLiked = new Set(prev);
        if (isLiked) {
          newLiked.add(reelId);
        } else {
          newLiked.delete(reelId);
        }
        return newLiked;
      });
    }
  };

  const handleSave = async (reelId) => {
    if (!user) {
      alert('Please sign in to save reels');
      return;
    }
    
    // Check if profile is complete
    if (!checkProfileComplete()) {
      return; // Modal will be shown automatically
    }

    const isSaved = savedReels.has(reelId);
    
    // Optimistic update
    setSavedReels(prev => {
      const newSaved = new Set(prev);
      if (isSaved) {
        newSaved.delete(reelId);
      } else {
        newSaved.add(reelId);
      }
      return newSaved;
    });
    
    try {
      // Update Firebase
      const bookmarkRef = ref(db, `bookmarks/${user.uid}/${reelId}`);
      await update(bookmarkRef, isSaved ? null : {
        timestamp: Date.now(),
        type: 'reel'
      });
    } catch (error) {
      console.error('Error updating bookmark:', error);
      // Revert on error
      setSavedReels(prev => {
        const newSaved = new Set(prev);
        if (isSaved) {
          newSaved.add(reelId);
        } else {
          newSaved.delete(reelId);
        }
        return newSaved;
      });
    }
  };

  const handleShare = async (reel) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: reel.title?.en || 'Check out this reel!',
          text: reel.description?.en,
          url: window.location.origin + `/reel/${reel.id}`
        });
        
        // Only increment share count if share was successful
        await update(ref(db, `reels/${reel.id}/analytics`), {
          shares: increment(1)
        });
        
        // Track user's total shares
        if (user?.uid) {
          await update(ref(db, `users/${user.uid}`), {
            totalShares: increment(1)
          });
        }
      } else {
        // Fallback to copy link
        const url = window.location.origin + `/reel/${reel.id}`;
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        
        await update(ref(db, `reels/${reel.id}/analytics`), {
          shares: increment(1)
        });
        
        // Track user's total shares
        if (user?.uid) {
          await update(ref(db, `users/${user.uid}`), {
            totalShares: increment(1)
          });
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleComment = () => {
    if (!user) {
      alert('Please sign in to comment');
      return;
    }
    
    // Check if profile is complete
    if (!checkProfileComplete()) {
      return; // Modal will be shown automatically
    }
    
    setShowComments(true);
  };

  const handleFollow = (userId) => {
    // TODO: Implement follow functionality
    console.log('Follow user:', userId);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading Reels...</div>
      </div>
    );
  }

  if (!reels || reels.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">No Reels Available</h2>
          <p className="text-gray-400 mb-6">Be the first to create a reel!</p>
          {user?.role === 'admin' && (
            <button
              onClick={() => console.log('Create reel')}
              className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-full flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Reel</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Detect if we're on desktop
  const isDesktop = window.innerWidth >= 1024;

  return (
    <div 
      ref={containerRef}
      className={`reel-container ${isDesktop ? 'relative w-full h-screen' : 'fixed inset-0'} bg-black overflow-hidden select-none`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Progress Bar - Subtle Modern Design with Buffer Indicator */}
      <div className="absolute top-0 left-0 right-0 z-[60] h-1 bg-white/10">
        {/* Buffered progress */}
        <div 
          className="absolute h-full bg-white/30 reel-progress"
          style={{ width: `${buffered}%` }}
        />
        {/* Current progress */}
        <div 
          className="absolute h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 reel-progress shadow-lg"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="absolute top-1.5 left-0 right-0 z-50 bg-gradient-to-b from-black/60 via-black/30 to-transparent p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-sm text-white rounded-full hover:bg-black/60 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <h1 className="text-white font-bold text-lg tracking-wide">Reels</h1>
          
          <button 
            onClick={toggleMute}
            className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-sm text-white rounded-full hover:bg-black/60 transition-all"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Navigation Hints - Compact */}
        {showHints && (
          <div className="mt-3 bg-black/60 backdrop-blur-md rounded-full px-4 py-2 animate-fade-in">
            <div className="text-white text-xs text-center">
              {isDesktop ? (
                <span>↑↓ Navigate • Space = Play/Pause</span>
              ) : (
                <span>Swipe ↑↓ • Tap to pause</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Current Reel */}
      {currentReel && (
        <div className={`relative ${isDesktop ? 'flex items-center justify-center h-full' : 'w-full h-full'}`}>
          {/* Reel Video Container */}
          <div className={`relative ${isDesktop ? 'w-full max-w-md h-full' : 'w-full h-full'}`}>
            {/* Reel Video */}
            <video
              ref={(el) => {
                if (el && currentReel) {
                  videoRefs.current[currentReel.id] = el;
                }
              }}
              key={currentReel.id}
              data-reel="true"
              src={currentReel.mediaContent?.items?.[0]?.url || currentReel.videoUrl}
              poster={currentReel.mediaContent?.items?.[0]?.thumbnailUrl || currentReel.thumbnail}
              className={`w-full h-full ${isDesktop ? 'object-contain' : 'object-cover'} cursor-pointer reel-video-transition`}
              loop
              playsInline
              preload="auto"
              muted={isMuted}
              onClick={togglePlay}
            />

          {/* Bottom Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none reel-overlay" />

          {/* Like Animation */}
          {showLikeAnimation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <Heart className="w-24 h-24 text-white fill-current animate-heart-burst" />
            </div>
          )}

          {/* Play/Pause Indicator */}
          {showPlayPauseIcon && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <div className="w-20 h-20 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center animate-scale-fade">
                {isPlaying ? (
                  <Play className="w-10 h-10 text-white fill-white ml-1" />
                ) : (
                  <Pause className="w-10 h-10 text-white fill-white" />
                )}
              </div>
            </div>
          )}

          {/* Tap areas for navigation */}
          <div className="absolute inset-0 flex z-10">
            {/* Center tap area to toggle play/pause */}
            <button
              className="flex-1 bg-transparent"
              onClick={togglePlay}
            />
          </div>

          {/* Author Info & Content */}
          <div className="absolute bottom-20 left-4 right-20 text-white z-20 reel-content">
            {/* Title & Description */}
            {currentReel.title?.en && (
              <h2 className="font-semibold text-base mb-1 drop-shadow-lg line-clamp-2">
                {currentReel.title.en}
              </h2>
            )}
            
            {currentReel.description?.en && (
              <p className="text-sm opacity-95 leading-relaxed mb-2 drop-shadow-lg line-clamp-2">
                {currentReel.description.en}
              </p>
            )}
            
            {/* Hashtags */}
            {currentReel.hashtags && currentReel.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {currentReel.hashtags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="text-sm text-blue-300 font-medium drop-shadow-lg">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Music Info */}
            {currentReel.reelSettings?.musicTitle && (
              <div className="flex items-center space-x-1.5 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit">
                <span className="text-sm">🎵</span>
                <span className="text-xs font-medium truncate max-w-[200px]">
                  {currentReel.reelSettings.musicTitle}
                  {currentReel.reelSettings.musicArtist && 
                    ` • ${currentReel.reelSettings.musicArtist}`
                  }
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons - Right Side */}
          <div className="absolute bottom-24 right-4 flex flex-col space-y-4 z-20">
            {/* Like Button - Primary */}
            <button
              onClick={() => handleLike(currentReel.id)}
              className="flex flex-col items-center space-y-1 reel-action-button"
            >
              <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
                likedReels.has(currentReel.id)
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-900/50 backdrop-blur-sm text-white hover:bg-gray-900/70'
              }`}>
                <Heart className={`w-6 h-6 ${likedReels.has(currentReel.id) ? 'fill-current' : ''}`} />
              </div>
              {currentReel.analytics?.likes > 0 && (
                <span className="text-white text-xs font-semibold drop-shadow-lg">
                  {formatNumber(currentReel.analytics.likes)}
                </span>
              )}
            </button>

            {/* Comment Button - Primary */}
            <button
              onClick={() => setShowComments(true)}
              className="flex flex-col items-center space-y-1 reel-action-button"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm text-white rounded-full hover:bg-gray-900/70 transition-all">
                <MessageCircle className="w-6 h-6" />
              </div>
              {currentReel.analytics?.comments > 0 && (
                <span className="text-white text-xs font-semibold drop-shadow-lg">
                  {formatNumber(currentReel.analytics.comments)}
                </span>
              )}
            </button>

            {/* More Menu - Secondary Actions */}
            <div className="relative flex flex-col items-center">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="flex flex-col items-center space-y-1 reel-action-button"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm text-white rounded-full hover:bg-gray-900/70 transition-all">
                  <MoreVertical className="w-6 h-6" />
                </div>
              </button>

              {/* Actions Menu */}
              {showActionsMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setShowActionsMenu(false)}
                  />
                  <div className="absolute right-full mr-3 bottom-0 w-48 bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-2 z-40 overflow-hidden">
                    <button
                      onClick={() => {
                        handleShare(currentReel);
                        setShowActionsMenu(false);
                      }}
                      className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-white/10 transition-colors text-left"
                    >
                      <Share2 className="w-5 h-5 text-white" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">Share</div>
                        {currentReel.analytics?.shares > 0 && (
                          <div className="text-xs text-white/60">{formatNumber(currentReel.analytics.shares)} shares</div>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        handleSave(currentReel.id);
                        setShowActionsMenu(false);
                      }}
                      className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-white/10 transition-colors text-left"
                    >
                      <Bookmark className={`w-5 h-5 ${savedReels.has(currentReel.id) ? 'fill-current text-yellow-400' : 'text-white'}`} />
                      <div className="text-sm font-medium text-white">
                        {savedReels.has(currentReel.id) ? 'Saved' : 'Save'}
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Author Avatar */}
            <div className="flex flex-col items-center mt-2">
              <div className="relative">
                <button className="w-11 h-11 rounded-full border-2 border-white bg-white p-0.5 flex items-center justify-center">
                  <img
                    src={currentReel.author?.avatar || logoImage}
                    alt={currentReel.author?.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showComments && (
        <CommentsModal
          reel={currentReel}
          onClose={() => setShowComments(false)}
        />
      )}
      
      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showModal}
        onClose={closeModal}
        missingFields={profileCompletion?.missingFields || []}
      />
    </div>
  );
};

// Comments Modal Component
const CommentsModal = ({ reel, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-end" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Comments
            </h3>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <span className="text-2xl leading-none">×</span>
            </button>
          </div>
        </div>
        
        {/* ThreadedCommentSection - includes comments list and input */}
        <div className="flex-1 overflow-hidden pb-20">
          <ThreadedCommentSection postId={reel.id} />
        </div>
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

export default ReelsPage;