// =============================================
// src/components/Feed/TodaysRoundup.jsx
// Carousel Component for Displaying Daily News Roundup
// =============================================
import React, { useState, useEffect, useRef } from 'react';
import { ref, get, update, increment } from 'firebase/database';
import { db } from '../../firebase-config';
import { getTodayRoundupId, formatDateForTitle, ROUNDUP_STATUS } from '../../utils/roundupSchema';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Share2,
  ExternalLink,
  Newspaper,
  Clock,
  Eye,
  TrendingUp
} from 'lucide-react';

const TodaysRoundup = ({ onClose }) => {
  const [roundup, setRoundup] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const containerRef = useRef(null);
  
  // Safe navigation - try useNavigate, fallback to window.location
  let navigate;
  try {
    navigate = useNavigate();
  } catch (err) {
    navigate = null;
  }

  useEffect(() => {
    loadRoundup();
  }, []);

  const loadRoundup = async () => {
    setLoading(true);
    setError(null);

    try {
      const todayId = getTodayRoundupId();
      const roundupRef = ref(db, `news-roundups/${todayId}`);
      const snapshot = await get(roundupRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Only show published roundups
        if (data.status === ROUNDUP_STATUS.PUBLISHED) {
          setRoundup(data);
          
          // Track view
          await update(roundupRef, {
            'analytics/views': increment(1)
          });
        } else {
          setError('Today\'s roundup is not published yet.');
        }
      } else {
        setError('No roundup available for today.');
      }
    } catch (err) {
      console.error('Error loading roundup:', err);
      setError('Failed to load roundup.');
    } finally {
      setLoading(false);
    }
  };

  // Touch gestures for mobile
  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
      touchEndX.current = e.changedTouches[0].clientX;
      handleSwipe();
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [currentIndex, roundup]);

  const handleSwipe = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swipe left - next
        goToNext();
      } else {
        // Swipe right - previous
        goToPrevious();
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, roundup, onClose]);

  const goToNext = () => {
    if (roundup && currentIndex < roundup.posts.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handlePostClick = async (postId) => {
    // Track click
    try {
      const todayId = getTodayRoundupId();
      const roundupRef = ref(db, `news-roundups/${todayId}`);
      await update(roundupRef, {
        'analytics/clicks': increment(1)
      });
    } catch (err) {
      console.error('Error tracking click:', err);
    }

    // Navigate to post detail
    onClose();
    if (navigate) {
      navigate(`/news/${postId}`);
    } else {
      window.location.href = `/news/${postId}`;
    }
  };

  const handleShare = async () => {
    try {
      const todayId = getTodayRoundupId();
      const roundupRef = ref(db, `news-roundups/${todayId}`);
      await update(roundupRef, {
        'analytics/shares': increment(1)
      });

      if (navigator.share) {
        await navigator.share({
          title: roundup.title,
          text: `Check out today's news roundup!`,
          url: window.location.href
        });
      } else {
        // Fallback - copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading today's roundup...</p>
        </div>
      </div>
    );
  }

  if (error || !roundup) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {error || 'Roundup Not Available'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Check back later for today's news roundup.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentPost = roundup.postDetails[roundup.posts[currentIndex]];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 flex flex-col"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Header */}
      <div className="bg-gradient-to-b from-black/80 to-transparent p-4 absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg flex items-center space-x-2">
              <Newspaper className="w-5 h-5" />
              <span>Today's Roundup</span>
            </h2>
            <p className="text-white/70 text-sm">{formatDateForTitle(new Date(roundup.date))}</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>

            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex space-x-1 mt-4">
          {roundup.posts.map((_, index) => (
            <div
              key={index}
              className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className={`h-full bg-white transition-all duration-300 ${
                  index === currentIndex ? 'w-full' : index < currentIndex ? 'w-full' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Background Image */}
        {currentPost.imageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20"
            style={{ backgroundImage: `url(${currentPost.imageUrl})` }}
          />
        )}

        {/* Post Card */}
        <div className="relative max-w-2xl w-full mx-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
            {/* Image */}
            {currentPost.imageUrl && (
              <div className="relative h-80 bg-gray-900">
                <img
                  src={currentPost.imageUrl}
                  alt={currentPost.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                    {currentPost.category}
                  </span>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              <h3 className="text-2xl font-bold text-white mb-3 line-clamp-2">
                {currentPost.title}
              </h3>

              {currentPost.excerpt && (
                <p className="text-white/80 text-sm mb-4 line-clamp-3">
                  {currentPost.excerpt}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-white/60 text-xs">
                  {currentPost.author?.name && (
                    <span>By {currentPost.author.name}</span>
                  )}
                  {currentPost.publishedAt && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(currentPost.publishedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handlePostClick(currentPost.id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-semibold"
                >
                  <span>Read More</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <button
            onClick={goToPrevious}
            className="absolute left-4 w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {currentIndex < roundup.posts.length - 1 && (
          <button
            onClick={goToNext}
            className="absolute right-4 w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Footer Stats */}
      <div className="bg-gradient-to-t from-black/80 to-transparent p-4 absolute bottom-0 left-0 right-0">
        <div className="flex items-center justify-center space-x-6 text-white/70 text-sm">
          <div className="flex items-center space-x-1">
            <span className="font-bold text-white">{currentIndex + 1}</span>
            <span>/</span>
            <span>{roundup.posts.length}</span>
            <span>posts</span>
          </div>
          <div className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{roundup.analytics?.views || 0} views</span>
          </div>
        </div>

        <p className="text-center text-white/50 text-xs mt-2">
          Swipe or use arrow keys to navigate
        </p>
      </div>
    </div>
  );
};

export default TodaysRoundup;
