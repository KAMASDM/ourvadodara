// =============================================
// src/pages/Reels/ReelsPage.jsx
// Dedicated Reels Page with TikTok/Instagram-like Experience
// =============================================
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
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
  User,
  Plus
} from 'lucide-react';
import MediaRenderer from '../../components/Media/MediaRenderer';
import { POST_TYPES } from '../../utils/mediaSchema';

const ReelsPage = ({ onBack, initialReelId = null }) => {
  const { user } = useAuth();
  const { data: reelsData, isLoading } = useRealtimeData('reels');
  
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [likedReels, setLikedReels] = useState(new Set());
  const [savedReels, setSavedReels] = useState(new Set());
  
  const containerRef = useRef(null);
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

  useEffect(() => {
    if (!initialReelId || reels.length === 0) {
      return;
    }

    const initialIndex = reels.findIndex(reel => reel.id === initialReelId);
    if (initialIndex >= 0) {
      setCurrentReelIndex(initialIndex);
    }
  }, [initialReelId, reels]);

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
  }, []);

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

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleLike = (reelId) => {
    setLikedReels(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(reelId)) {
        newLiked.delete(reelId);
      } else {
        newLiked.add(reelId);
      }
      return newLiked;
    });
    
    // TODO: Update Firebase
    console.log('Liked reel:', reelId);
  };

  const handleSave = (reelId) => {
    setSavedReels(prev => {
      const newSaved = new Set(prev);
      if (newSaved.has(reelId)) {
        newSaved.delete(reelId);
      } else {
        newSaved.add(reelId);
      }
      return newSaved;
    });
    
    // TODO: Update Firebase
    console.log('Saved reel:', reelId);
  };

  const handleShare = async (reel) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: reel.title?.en || 'Check out this reel!',
          text: reel.description?.en,
          url: window.location.origin + `/reel/${reel.id}`
        });
      } catch (error) {
        console.log('Sharing cancelled');
      }
    } else {
      // Fallback to copy link
      const url = window.location.origin + `/reel/${reel.id}`;
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
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
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="text-white font-semibold">
          Reels
        </div>
        
        <button className="w-10 h-10 flex items-center justify-center bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Reel Progress Indicator */}
      {reels.length > 1 && (
        <div className="absolute top-16 left-4 right-4 z-40">
          <div className="flex space-x-1">
            {reels.map((_, index) => (
              <div key={index} className="flex-1 h-0.5 bg-white bg-opacity-30 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-white transition-all duration-300 ${
                    index === currentReelIndex ? 'w-full' : index < currentReelIndex ? 'w-full' : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Reel */}
      {currentReel && (
        <div className="relative w-full h-full">
          {/* Reel Video */}
          <MediaRenderer
            post={currentReel}
            className="w-full h-full"
            autoplay={isPlaying}
            showControls={false}
          />

          {/* Tap areas for navigation */}
          <div className="absolute inset-0 flex">
            {/* Previous area */}
            <button
              className="flex-1 bg-transparent"
              onClick={goToPrevious}
              disabled={currentReelIndex === 0}
            />
            
            {/* Next area */}
            <button
              className="flex-1 bg-transparent"
              onClick={goToNext}
              disabled={currentReelIndex === reels.length - 1}
            />
          </div>

          {/* Author Info */}
          <div className="absolute bottom-24 left-4 right-20 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-white p-1 border-2 border-white flex items-center justify-center">
                <img
                  src={currentReel.author?.avatar || logoImage}
                  alt={currentReel.author?.name}
                  className="w-full h-full rounded-full object-contain"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-lg">{currentReel.author?.name}</h3>
                  {currentReel.author?.verified && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">✓</span>
                    </div>
                  )}
                </div>
                <p className="text-sm opacity-75">
                  {formatTimeAgo(currentReel.publishedAt)}
                </p>
              </div>
              
              {currentReel.author?.uid !== user?.uid && (
                <button
                  onClick={() => handleFollow(currentReel.author.uid)}
                  className="bg-white text-black px-4 py-1 rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  Follow
                </button>
              )}
            </div>
            
            {/* Title & Description */}
            {currentReel.title?.en && (
              <h2 className="font-bold text-xl mb-2">{currentReel.title.en}</h2>
            )}
            
            {currentReel.description?.en && (
              <p className="text-base opacity-90 leading-relaxed mb-3">
                {currentReel.description.en}
              </p>
            )}
            
            {/* Hashtags */}
            {currentReel.hashtags && currentReel.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {currentReel.hashtags.slice(0, 5).map((tag, index) => (
                  <span key={index} className="text-blue-300 font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Music Info */}
            {currentReel.reelSettings?.musicTitle && (
              <div className="flex items-center bg-black bg-opacity-30 rounded-full px-3 py-1 w-fit">
                <span className="mr-2">🎵</span>
                <span className="text-sm truncate max-w-48">
                  {currentReel.reelSettings.musicTitle}
                  {currentReel.reelSettings.musicArtist && 
                    ` • ${currentReel.reelSettings.musicArtist}`
                  }
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute bottom-24 right-4 flex flex-col space-y-6">
            {/* Like Button */}
            <div className="text-center">
              <button
                onClick={() => handleLike(currentReel.id)}
                className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${
                  likedReels.has(currentReel.id)
                    ? 'bg-red-500 text-white'
                    : 'bg-black bg-opacity-30 text-white hover:bg-opacity-50'
                }`}
              >
                <Heart className={`w-6 h-6 ${likedReels.has(currentReel.id) ? 'fill-current' : ''}`} />
              </button>
              {currentReel.analytics?.likes > 0 && (
                <p className="text-white text-xs mt-1 font-medium">
                  {formatNumber(currentReel.analytics.likes)}
                </p>
              )}
            </div>

            {/* Comment Button */}
            <div className="text-center">
              <button
                onClick={() => setShowComments(true)}
                className="w-12 h-12 flex items-center justify-center bg-black bg-opacity-30 text-white rounded-full hover:bg-opacity-50 transition-colors"
              >
                <MessageCircle className="w-6 h-6" />
              </button>
              {currentReel.analytics?.comments > 0 && (
                <p className="text-white text-xs mt-1 font-medium">
                  {formatNumber(currentReel.analytics.comments)}
                </p>
              )}
            </div>

            {/* Share Button */}
            <div className="text-center">
              <button
                onClick={() => handleShare(currentReel)}
                className="w-12 h-12 flex items-center justify-center bg-black bg-opacity-30 text-white rounded-full hover:bg-opacity-50 transition-colors"
              >
                <Share2 className="w-6 h-6" />
              </button>
              {currentReel.analytics?.shares > 0 && (
                <p className="text-white text-xs mt-1 font-medium">
                  {formatNumber(currentReel.analytics.shares)}
                </p>
              )}
            </div>

            {/* Save Button */}
            <div className="text-center">
              <button
                onClick={() => handleSave(currentReel.id)}
                className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${
                  savedReels.has(currentReel.id)
                    ? 'bg-yellow-500 text-white'
                    : 'bg-black bg-opacity-30 text-white hover:bg-opacity-50'
                }`}
              >
                <Bookmark className={`w-6 h-6 ${savedReels.has(currentReel.id) ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Mute/Unmute Button */}
            <div className="text-center">
              <button
                onClick={toggleMute}
                className="w-12 h-12 flex items-center justify-center bg-black bg-opacity-30 text-white rounded-full hover:bg-opacity-50 transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            {/* User Avatar (for quick profile access) */}
            <div className="text-center">
              <button className="w-12 h-12 rounded-full border-2 border-white bg-white hover:border-pink-500 transition-colors p-1 flex items-center justify-center">
                <img
                  src={currentReel.author?.avatar || logoImage}
                  alt={currentReel.author?.name}
                  className="w-full h-full rounded-full object-contain"
                />
              </button>
            </div>
          </div>

          {/* Navigation Hints */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center">
            <div className="flex items-center space-x-6 text-xs opacity-60">
              <span>↑ Previous</span>
              <span>Tap to pause</span>
              <span>↓ Next</span>
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
    </div>
  );
};

// Comments Modal Component
const CommentsModal = ({ reel, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-end">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl w-full max-h-[70vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Comments
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-96">
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No comments yet. Be the first to comment!
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-white dark:bg-white p-1 flex items-center justify-center">
              <img
                src={logoImage}
                alt="Your avatar"
                className="w-full h-full rounded-full object-contain"
              />
            </div>
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="text-blue-500 font-semibold">Post</button>
          </div>
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