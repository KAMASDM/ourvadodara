// =============================================
// src/components/Story/EnhancedStorySection.jsx
// Enhanced Story Section (Stories Rail)
// =============================================
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import logoImage from '../../assets/images/our-vadodara-logo.png.png';
import { Play, Clock, Heart, MessageCircle, Eye } from 'lucide-react';
import MediaRenderer from '../Media/MediaRenderer';
import { POST_TYPES } from '../../utils/mediaSchema';
import { StoriesRailSkeleton } from '../Common/SkeletonLoader';

const formatCompactNumber = (value = 0) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
};

const EnhancedStorySection = ({ onViewStory, onLikeStory = () => {}, onCommentStory = () => {} }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [selectedStory, setSelectedStory] = useState(null);
  const [showViewer, setShowViewer] = useState(false);

  // Fetch stories and reels
  const { data: storiesData } = useRealtimeData('stories');

  // Process stories data with memoization to keep stable references between renders
  const stories = useMemo(() => {
    if (!storiesData) return [];

    return Object.values(storiesData)
      .filter(story => new Date(story.expiresAt) > new Date() && story.isActive)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [storiesData]);

  const allStories = useMemo(() => (
    stories.slice(0, 12).map(story => ({
      ...story,
      type: POST_TYPES.STORY,
      thumbnail: story.mediaContent?.items?.[0]?.thumbnailUrl || 
                story.mediaContent?.items?.[0]?.url || 
                story.image || 
                '/default-story.png',
      hasNewContent: true
    }))
  ), [stories]);

  const handleStoryClick = (storyItem) => {
    setSelectedStory(storyItem);
    setShowViewer(true);
    onViewStory?.(storyItem);
  };

  const closeViewer = () => {
    setShowViewer(false);
    setSelectedStory(null);
  };

  if (allStories.length === 0) {
    return null; // Don't render if no stories
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('stories', 'Stories')}
            </h2>
          </div>
          
          <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-1">
            {allStories.map((story) => (
              <StoryCard 
                key={story.id} 
                story={story} 
                onClick={() => handleStoryClick(story)}
                currentLanguage={currentLanguage}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Story/Reel Viewer Modal */}
      {showViewer && selectedStory && (
        <StoryViewer 
          story={selectedStory} 
          allStories={allStories}
          onClose={closeViewer}
          currentLanguage={currentLanguage}
          onLike={onLikeStory}
          onComment={onCommentStory}
        />
      )}
    </>
  );
};

// Individual Story Card Component
const StoryCard = ({ story, onClick, currentLanguage }) => {
  const title = story.title?.[currentLanguage] || story.title?.en || 'Untitled';
  const hasVideo = story.mediaContent?.items?.some(item => item.type === 'video');
  const viewCount = story.analytics?.views ?? story.views ?? 0;

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 cursor-pointer group"
    >
      <div className="relative">
        {/* Story Ring */}
        <div className={`w-16 h-16 rounded-full p-[2px] ${
          story.hasNewContent
            ? 'bg-gradient-to-tr from-purple-500 via-pink-500 to-red-500'
            : 'bg-gray-300 dark:bg-gray-600'
        }`}>
          <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-800">
            <>
              <img
                src={story.thumbnail || story.author?.avatar || '/default-story.png'}
                alt={title}
                className="w-full h-full object-cover"
              />
              {/* Reel/Video indicator */}
              {hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <Play className="w-3 h-3 text-white ml-0.5" />
                  </div>
                </div>
              )}
            </>
          </div>
        </div>

  {viewCount !== null && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center gap-1 rounded-full bg-black/65 px-2 py-[2px] text-[10px] font-medium text-white shadow-sm">
            <Eye className="w-3 h-3" />
            {formatCompactNumber(viewCount)}
          </div>
        )}

        {/* Story indicators */}
        <>
          {/* Multiple items indicator */}
          {story.mediaContent?.items?.length > 1 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">
                {story.mediaContent.items.length}
              </span>
            </div>
          )}
          
          {/* Story expiry indicator */}
          {story.type === POST_TYPES.STORY && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
              <Clock className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </>
      </div>

      {/* Story Title */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-700 dark:text-gray-300 truncate w-16 leading-tight">
          {story.author?.name || title}
        </p>
        
        {/* View count for reels */}
      </div>
    </div>
  );
};

// Story Viewer Modal
const StoryViewer = ({ story, allStories, onClose, currentLanguage, onLike, onComment }) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(
    allStories.findIndex(s => s.id === story.id)
  );
  const [progress, setProgress] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState(0);
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const minSwipeDistance = 50;
  
  const currentStory = allStories[currentStoryIndex];
  const currentStoryId = currentStory?.id;
  const currentStoryDuration = ((currentStory?.storySettings?.duration) || 15) * 1000;
  const isStoryType = currentStory?.type === POST_TYPES.STORY;
  const viewCount = currentStory?.analytics?.views ?? currentStory?.views ?? 0;

  useEffect(() => {
    if (!currentStory || !isStoryType || isPaused) return;

    const startTime = Date.now() - accumulatedTime;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / currentStoryDuration) * 100, 100);
      setProgress(progressPercent);

      if (progressPercent >= 100) {
        // Auto advance to next story
        if (currentStoryIndex < allStories.length - 1) {
          setCurrentStoryIndex(prev => prev + 1);
          setProgress(0);
          setAccumulatedTime(0);
        } else {
          onClose();
        }
      }
    };

    const interval = setInterval(updateProgress, 100);
    return () => clearInterval(interval);
  }, [currentStoryIndex, currentStoryId, currentStoryDuration, isStoryType, allStories.length, onClose, isPaused, accumulatedTime]);

  const pauseTimer = () => {
    if (!isPaused) {
      setIsPaused(true);
      setPauseStartTime(Date.now());
      // Store accumulated time when pausing
      setAccumulatedTime((progress / 100) * currentStoryDuration);
    }
  };

  const resumeTimer = () => {
    if (isPaused) {
      setIsPaused(false);
    }
  };

  const nextStory = () => {
    if (currentStoryIndex < allStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
      setAccumulatedTime(0);
      setIsPaused(false);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
      setAccumulatedTime(0);
      setIsPaused(false);
    }
  };

  const handleTouchStart = (event) => {
    setTouchStartX(event.touches[0].clientX);
    pauseTimer();
  };

  const handleTouchMove = (event) => {
    if (touchStartX === null) return;
    const currentX = event.touches[0].clientX;
    const delta = touchStartX - currentX;

    if (delta > minSwipeDistance) {
      setTouchStartX(null);
      resumeTimer();
      nextStory();
    } else if (delta < -minSwipeDistance) {
      setTouchStartX(null);
      resumeTimer();
      prevStory();
    }
  };

  const handleTouchEnd = () => {
    setTouchStartX(null);
    resumeTimer();
  };

  const handleMouseDown = () => {
    pauseTimer();
  };

  const handleMouseUp = () => {
    resumeTimer();
  };

  if (!currentStory) return null;

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-black bg-opacity-50 text-white rounded-full z-60 hover:bg-opacity-70 transition-colors"
      >
        ×
      </button>

      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-16 flex space-x-1 z-60">
        {allStories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-[width] duration-100"
              style={{ width: index === currentStoryIndex ? `${progress}%` : index < currentStoryIndex ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Story content */}
      <div className="w-full max-w-sm h-full relative">
        <MediaRenderer
          post={currentStory}
          className="w-full h-full"
          autoplay={true}
          showControls={false}
        />

        {/* Navigation areas */}
        <button
          onClick={prevStory}
          className="absolute left-0 top-20 bottom-20 w-1/3 bg-transparent cursor-pointer"
          disabled={currentStoryIndex === 0}
        />
        
        <button
          onClick={nextStory}
          className="absolute right-0 top-20 bottom-20 w-1/3 bg-transparent cursor-pointer"
        />

        {/* Author info */}
        <div className="absolute top-16 left-4 right-4 flex items-center text-white">
          <div className="w-8 h-8 rounded-full bg-white p-1 mr-3 flex items-center justify-center">
            <img
              src={currentStory.author?.avatar || logoImage}
              alt={currentStory.author?.name}
              className="w-full h-full rounded-full object-contain"
            />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{currentStory.author?.name}</p>
            <p className="text-xs opacity-75">
              {formatTimeAgo(currentStory.createdAt || currentStory.publishedAt)}
            </p>
          </div>
          
        </div>

        {/* Interaction buttons */}
        <div className="absolute bottom-16 left-0 right-0 flex items-center justify-around text-white px-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium">
            <Eye className="w-4 h-4" />
            {formatCompactNumber(viewCount)} views
          </div>
          <button
            type="button"
            onClick={() => onLike(currentStory)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium hover:bg-white/20 transition-colors"
            aria-label="Like story"
          >
            <Heart className="w-4 h-4" />
            {formatCompactNumber(currentStory.analytics?.likes ?? currentStory.likes ?? 0)}
          </button>
          <button
            type="button"
            onClick={() => onComment(currentStory)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium hover:bg-white/20 transition-colors"
            aria-label="Comment on story"
          >
            <MessageCircle className="w-4 h-4" />
            {formatCompactNumber(currentStory.analytics?.comments ?? currentStory.comments ?? 0)}
          </button>
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
  return `${diffInDays}d ago`;
};

export default EnhancedStorySection;