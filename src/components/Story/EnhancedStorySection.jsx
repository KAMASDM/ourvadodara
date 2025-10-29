// =============================================
// src/components/Story/EnhancedStorySection.jsx
// Enhanced Story Section with Stories and Reels
// =============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useAuth } from '../../context/Auth/AuthContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import logoImage from '../../assets/images/our-vadodara-logo.png.png';
import { Plus, Play, Clock, Eye } from 'lucide-react';
import MediaRenderer from '../Media/MediaRenderer';
import { POST_TYPES } from '../../utils/mediaSchema';

const EnhancedStorySection = ({ onCreateStory, onViewStory }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const [selectedStory, setSelectedStory] = useState(null);
  const [showViewer, setShowViewer] = useState(false);

  // Fetch stories and reels
  const { data: storiesData } = useRealtimeData('stories');
  const { data: reelsData } = useRealtimeData('reels');

  // Process stories data
  const stories = storiesData ? Object.values(storiesData).filter(story => {
    // Filter out expired stories
    return new Date(story.expiresAt) > new Date() && story.isActive;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];

  // Process reels data
  const reels = reelsData ? Object.values(reelsData).filter(reel => 
    reel.isPublished
  ).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 5) : [];

  // Combine stories and reels for the horizontal scroll
  const allStories = [
    // Add Story button (for admin users)
    ...(user?.role === 'admin' ? [{
      id: 'add-story',
      type: 'add-button',
      title: { en: 'Add Story', hi: 'स्टोरी जोड़ें', gu: 'સ્ટોરી ઉમેરો' },
      thumbnail: null,
      isAddButton: true
    }] : []),
    
    // Active stories
    ...stories.slice(0, 10).map(story => ({
      ...story,
      type: POST_TYPES.STORY,
      thumbnail: story.mediaContent?.items?.[0]?.thumbnailUrl || 
                story.mediaContent?.items?.[0]?.url || 
                story.image || 
                '/default-story.png',
      hasNewContent: true
    })),
    
    // Recent reels (shown as story-like items)
    ...reels.slice(0, 3).map(reel => ({
      ...reel,
      type: POST_TYPES.REEL,
      thumbnail: reel.mediaContent?.thumbnailUrl || 
                reel.mediaContent?.items?.[0]?.thumbnailUrl ||
                reel.mediaContent?.items?.[0]?.url ||
                '/default-story.png',
      isReel: true
    }))
  ];

  const handleStoryClick = (storyItem) => {
    if (storyItem.isAddButton) {
      onCreateStory?.();
      return;
    }
    
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
            {reels.length > 3 && (
              <button
                onClick={() => onViewStory?.({ type: 'reels-grid' })}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t('view_all_reels', 'View All Reels')}
              </button>
            )}
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
          allStories={allStories.filter(s => !s.isAddButton)}
          onClose={closeViewer}
          currentLanguage={currentLanguage}
        />
      )}
    </>
  );
};

// Individual Story Card Component
const StoryCard = ({ story, onClick, currentLanguage }) => {
  const isAddButton = story.isAddButton;
  const isReel = story.isReel;
  const title = story.title?.[currentLanguage] || story.title?.en || 'Untitled';

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 cursor-pointer group"
    >
      <div className="relative">
        {/* Story Ring */}
        <div className={`w-16 h-16 rounded-full p-[2px] ${
          isAddButton 
            ? 'bg-gray-300 dark:bg-gray-600' 
            : isReel
            ? 'bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500'
            : story.hasNewContent
            ? 'bg-gradient-to-tr from-purple-500 via-pink-500 to-red-500'
            : 'bg-gray-300 dark:bg-gray-600'
        }`}>
          <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-800">
            {isAddButton ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                <Plus className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
            ) : (
              <>
                <img
                  src={story.thumbnail || story.author?.avatar || '/default-story.png'}
                  alt={title}
                  className="w-full h-full object-cover"
                />
                {/* Reel/Video indicator */}
                {(isReel || story.mediaContent?.items?.[0]?.type === 'video') && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <Play className="w-3 h-3 text-white ml-0.5" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Story indicators */}
        {!isAddButton && (
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
        )}
      </div>

      {/* Story Title */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-700 dark:text-gray-300 truncate w-16 leading-tight">
          {isAddButton ? title : (story.author?.name || title)}
        </p>
        
        {/* View count for reels */}
        {isReel && story.analytics?.views && (
          <div className="flex items-center justify-center mt-1 text-xs text-gray-500 dark:text-gray-400">
            <Eye className="w-2.5 h-2.5 mr-1" />
            <span>{formatViews(story.analytics.views)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Story Viewer Modal
const StoryViewer = ({ story, allStories, onClose, currentLanguage }) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(
    allStories.findIndex(s => s.id === story.id)
  );
  const [progress, setProgress] = useState(0);
  
  const currentStory = allStories[currentStoryIndex];

  useEffect(() => {
    if (!currentStory || currentStory.type !== POST_TYPES.STORY) return;

    const duration = (currentStory.storySettings?.duration || 15) * 1000;
    const startTime = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / duration) * 100, 100);
      setProgress(progressPercent);

      if (progressPercent >= 100) {
        // Auto advance to next story
        if (currentStoryIndex < allStories.length - 1) {
          setCurrentStoryIndex(prev => prev + 1);
          setProgress(0);
        } else {
          onClose();
        }
      }
    };

    const interval = setInterval(updateProgress, 100);
    return () => clearInterval(interval);
  }, [currentStoryIndex, currentStory, allStories.length, onClose]);

  const nextStory = () => {
    if (currentStoryIndex < allStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
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
              className={`h-full bg-white transition-all duration-100 ${
                index < currentStoryIndex ? 'w-full' : 
                index === currentStoryIndex ? `w-[${progress}%]` : 'w-0'
              }`}
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
          showControls={currentStory.type === POST_TYPES.REEL}
        />

        {/* Navigation areas */}
        <button
          onClick={prevStory}
          className="absolute left-0 top-20 bottom-20 w-1/3 bg-transparent"
          disabled={currentStoryIndex === 0}
        />
        
        <button
          onClick={nextStory}
          className="absolute right-0 top-20 bottom-20 w-1/3 bg-transparent"
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
          
          {currentStory.type === POST_TYPES.REEL && (
            <div className="text-xs bg-pink-600 px-2 py-1 rounded-full">
              REEL
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Utility functions
const formatViews = (views) => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
};

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