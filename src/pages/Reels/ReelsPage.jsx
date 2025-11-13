// =============================================
// src/pages/Reels/ReelsPage.jsx
// Dedicated Reels Page with TikTok/Instagram-like Experience
// =============================================
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
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
  const [likedReels, setLikedReels] = useState(new Set());
  const [savedReels, setSavedReels] = useState(new Set());
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState(false);
  const [showHints, setShowHints] = useState(true);
  
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  // Process reels data
  const reels = reelsData 
    ? Object.entries(reelsData)
        .map(([id, reel]) => ({ id, ...reel }))
        .filter(reel => reel.isPublished && reel.type === POST_TYPES.REEL)
        .sort((a, b) => new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0))
    : [];

  const currentReel = reels[currentReelIndex];

  // Load user's likes and saves
  useEffect(() => {
    if (!user) return;

    const loadUserInteractions = async () => {
      try {
        // Load likes
        const likesRef = ref(db, `likes`);
        const likesSnapshot = await get(likesRef);
        if (likesSnapshot.exists()) {
          const likesData = likesSnapshot.val();
          const userLikes = new Set();
          Object.entries(likesData).forEach(([postId, likes]) => {
            if (likes[user.uid]) {
              userLikes.add(postId);
            }
          });
          setLikedReels(userLikes);
        }

        // Load bookmarks
        const bookmarksRef = ref(db, `bookmarks/${user.uid}`);
        const bookmarksSnapshot = await get(bookmarksRef);
        if (bookmarksSnapshot.exists()) {
          const bookmarksData = bookmarksSnapshot.val();
          const userSaves = new Set(Object.keys(bookmarksData));
          setSavedReels(userSaves);
        }
      } catch (error) {
        console.error('Error loading user interactions:', error);
      }
    };

    loadUserInteractions();
  }, [user]);

  // Control video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(err => console.log('Play failed:', err));
    } else {
      video.pause();
    }
  }, [isPlaying, currentReelIndex]);

  // Control video mute
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted]);

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
    }, 4000);
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
  }, [currentReelIndex]);

  const goToNext = () => {
    if (currentReelIndex < reels.length - 1) {
      setCurrentReelIndex(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentReelIndex > 0) {
      setCurrentReelIndex(prev => prev - 1);
    }
  };

  const handleSwipe = () => {
    const swipeDistance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swipe up - next reel
        goToNext();
      } else {
        // Swipe down - previous reel
        goToPrevious();
      }
    }
  };

  // Touch gestures for mobile
  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      e.preventDefault(); // Prevent scrolling
    };

    const handleTouchEnd = (e) => {
      touchEndY.current = e.changedTouches[0].clientY;
      handleSwipe();
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: false });

      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [currentReelIndex, reels.length]);

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
    setShowPlayPauseIcon(true);
    setTimeout(() => setShowPlayPauseIcon(false), 500);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

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
      } else {
        // Fallback to copy link
        const url = window.location.origin + `/reel/${reel.id}`;
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        
        await update(ref(db, `reels/${reel.id}/analytics`), {
          shares: increment(1)
        });
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

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/60 via-black/30 to-transparent p-4">
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
        
        {/* Navigation Hints */}
        {showHints && (
          <div className="mt-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 animate-fade-in">
            <div className="text-white text-xs space-y-1">
              <div className="flex items-center space-x-2">
                <ChevronUp className="w-4 h-4" />
                <span>Swipe down or ↑ for previous</span>
              </div>
              <div className="flex items-center space-x-2">
                <ChevronDown className="w-4 h-4" />
                <span>Swipe up or ↓ for next</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono">Space</span>
                <span>or tap to play/pause</span>
              </div>
            </div>
            <button 
              onClick={() => setShowHints(false)}
              className="mt-2 text-xs text-gray-300 hover:text-white underline"
            >
              Got it!
            </button>
          </div>
        )}
      </div>

      {/* Current Reel */}
      {currentReel && (
        <div className="relative w-full h-full">
          {/* Reel Video */}
          <video
            ref={videoRef}
            src={currentReel.mediaContent?.items?.[0]?.url || currentReel.videoUrl}
            poster={currentReel.mediaContent?.items?.[0]?.thumbnailUrl || currentReel.thumbnail}
            className="w-full h-full object-cover cursor-pointer"
            loop
            playsInline
            muted={isMuted}
            onClick={togglePlay}
          />

          {/* Bottom Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none" />

          {/* Like Animation */}
          {showLikeAnimation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <Heart className="w-24 h-24 text-white fill-current animate-heart-burst" />
            </div>
          )}

          {/* Play/Pause Indicator */}
          {showPlayPauseIcon && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center animate-ping-once">
                {isPlaying ? (
                  <Play className="w-10 h-10 text-white ml-1" />
                ) : (
                  <Pause className="w-10 h-10 text-white" />
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
          <div className="absolute bottom-20 left-4 right-20 text-white z-20">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-white p-1 flex items-center justify-center">
                <img
                  src={currentReel.author?.avatar || logoImage}
                  alt={currentReel.author?.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="font-bold text-base drop-shadow-lg">
                {currentReel.author?.name || 'Our Vadodara'}
              </span>
              {currentReel.author?.verified && (
                <span className="text-blue-400">✓</span>
              )}
            </div>
            
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
          <div className="absolute bottom-24 right-4 flex flex-col space-y-5 z-20">
            {/* Navigation Arrows */}
            <div className="flex flex-col space-y-2 mb-4">
              {/* Previous Reel */}
              {currentReelIndex > 0 && (
                <button
                  onClick={goToPrevious}
                  className="w-11 h-11 flex items-center justify-center bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-all animate-bounce-slow"
                  title="Previous reel (or swipe down)"
                >
                  <ChevronUp className="w-6 h-6" />
                </button>
              )}
              
              {/* Reel Counter */}
              <div className="flex items-center justify-center">
                <div className="bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                  {currentReelIndex + 1}/{reels.length}
                </div>
              </div>
              
              {/* Next Reel */}
              {currentReelIndex < reels.length - 1 && (
                <button
                  onClick={goToNext}
                  className="w-11 h-11 flex items-center justify-center bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-all animate-bounce-slow"
                  title="Next reel (or swipe up)"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Like Button */}
            <button
              onClick={() => handleLike(currentReel.id)}
              className="flex flex-col items-center space-y-1"
            >
              <div className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${
                likedReels.has(currentReel.id)
                  ? 'bg-primary-red text-white scale-110'
                  : 'bg-gray-900/40 backdrop-blur-sm text-white hover:bg-gray-900/60'
              }`}>
                <Heart className={`w-6 h-6 ${likedReels.has(currentReel.id) ? 'fill-current' : ''}`} />
              </div>
              {currentReel.analytics?.likes > 0 && (
                <span className="text-white text-xs font-semibold drop-shadow-lg">
                  {formatNumber(currentReel.analytics.likes)}
                </span>
              )}
            </button>

            {/* Comment Button */}
            <button
              onClick={() => setShowComments(true)}
              className="flex flex-col items-center space-y-1"
            >
              <div className="w-11 h-11 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm text-white rounded-full hover:bg-gray-900/60 transition-all">
                <MessageCircle className="w-6 h-6" />
              </div>
              {currentReel.analytics?.comments > 0 && (
                <span className="text-white text-xs font-semibold drop-shadow-lg">
                  {formatNumber(currentReel.analytics.comments)}
                </span>
              )}
            </button>

            {/* Share Button */}
            <button
              onClick={() => handleShare(currentReel)}
              className="flex flex-col items-center space-y-1"
            >
              <div className="w-11 h-11 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm text-white rounded-full hover:bg-gray-900/60 transition-all">
                <Share2 className="w-6 h-6" />
              </div>
              {currentReel.analytics?.shares > 0 && (
                <span className="text-white text-xs font-semibold drop-shadow-lg">
                  {formatNumber(currentReel.analytics.shares)}
                </span>
              )}
            </button>

            {/* Save Button */}
            <button
              onClick={() => handleSave(currentReel.id)}
              className="flex flex-col items-center"
            >
              <div className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${
                savedReels.has(currentReel.id)
                  ? 'bg-yellow-500 text-white scale-110'
                  : 'bg-gray-900/40 backdrop-blur-sm text-white hover:bg-gray-900/60'
              }`}>
                <Bookmark className={`w-6 h-6 ${savedReels.has(currentReel.id) ? 'fill-current' : ''}`} />
              </div>
            </button>

            {/* Author Avatar with Follow */}
            <div className="flex flex-col items-center mt-2">
              <div className="relative">
                <button className="w-11 h-11 rounded-full border-2 border-white bg-white p-0.5 flex items-center justify-center">
                  <img
                    src={currentReel.author?.avatar || logoImage}
                    alt={currentReel.author?.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </button>
                <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-5 h-5 bg-primary-red rounded-full flex items-center justify-center border-2 border-black">
                  <Plus className="w-3 h-3 text-white" />
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