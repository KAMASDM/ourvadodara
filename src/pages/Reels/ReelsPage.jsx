// =============================================
// src/pages/Reels/ReelsPage.jsx
// Dedicated Reels Page with TikTok/Instagram-like Experience
// =============================================
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import useViewTracking from '../../hooks/useViewTracking';
import { ref, update, increment, get, push, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase-config';
import logoImage from '../../assets/images/our-vadodara-logo.png.png';
import ThreadedCommentSection from '../../components/Comments/ThreadedCommentSection';
import SuggestedReelsPanel from '../../components/Reels/SuggestedReelsPanel';
import { ReelsOfferPanel, ReelsPollPanel, ReelsWeatherPanel } from '../../components/Reels/ReelsDiscoveryPanels';
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
  Download,
  GitFork,
  Upload,
  X
} from 'lucide-react';
import { POST_TYPES } from '../../utils/mediaSchema';
import { getLocalizedText } from '../../utils/textUtils';

const getReelVideoUrl = reel => {
  const items = reel?.mediaContent?.items;
  const firstItem = Array.isArray(items) ? items[0] : Object.values(items || {})[0];
  return firstItem?.url || reel?.videoUrl || '';
};

const countVisibleComments = collection => Object.values(collection || {}).reduce((total, comment) => {
  if (!comment || comment.rejected === true || !(comment.text || comment.content)) return total;
  return total + 1 + countVisibleComments(comment.replies);
}, 0);

const ExpandableReelDescription = ({ text, reelId }) => {
  const paragraphRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const descriptionId = `reel-description-${String(reelId).replace(/[^a-zA-Z0-9_-]/g, '')}`;

  useEffect(() => {
    setIsExpanded(false);
  }, [reelId, text]);

  useEffect(() => {
    const paragraph = paragraphRef.current;
    if (!paragraph) return undefined;

    const measureOverflow = () => {
      if (!isExpanded) {
        setIsTruncated(paragraph.scrollHeight > paragraph.clientHeight + 1);
      }
    };

    const frame = requestAnimationFrame(measureOverflow);
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(measureOverflow)
      : null;
    observer?.observe(paragraph);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [isExpanded, text]);

  const stopReelGesture = event => event.stopPropagation();

  return (
    <div
      className="pointer-events-auto mb-2"
      onClick={stopReelGesture}
      onDoubleClick={stopReelGesture}
      onTouchStart={stopReelGesture}
      onTouchMove={stopReelGesture}
      onTouchEnd={stopReelGesture}
    >
      <p
        ref={paragraphRef}
        id={descriptionId}
        className={`whitespace-pre-line break-words text-sm leading-relaxed opacity-95 drop-shadow-lg ${
          isExpanded
            ? 'max-h-[min(38vh,18rem)] overflow-y-auto overscroll-contain pr-1'
            : 'line-clamp-2'
        }`}
        style={isExpanded ? { touchAction: 'pan-y' } : undefined}
        onWheel={stopReelGesture}
      >
        {text}
      </p>

      {(isTruncated || isExpanded) && (
        <button
          type="button"
          className="mt-1 rounded-md px-1 py-0.5 text-sm font-semibold text-white underline decoration-white/50 underline-offset-2 hover:decoration-white focus-visible:outline-white"
          aria-expanded={isExpanded}
          aria-controls={descriptionId}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsExpanded(previous => !previous);
          }}
        >
          {isExpanded ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  );
};

const ReelsPage = ({ onBack, initialReelId = null }) => {
  const { user } = useAuth();
  const { data: reelsData, isLoading } = useRealtimeData('reels', { scope: 'global' });
  const { checkProfileComplete, showModal, closeModal, profileCompletion } = useProfileCompletionGuard();
  
  const [currentFeedIndex, setCurrentFeedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [duetReel, setDuetReel] = useState(null);
  const [likedReels, setLikedReels] = useState(new Set());
  const [savedReels, setSavedReels] = useState(new Set());
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );
  
  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const scrollFrameRef = useRef(null);
  const soundUnlockedAtRef = useRef(0);
  const soundPreferenceSetRef = useRef(false);
  const touchResumeRef = useRef(false);
  const suppressTouchClickRef = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleViewportChange = event => setIsDesktop(event.matches);
    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener?.('change', handleViewportChange);
    return () => mediaQuery.removeEventListener?.('change', handleViewportChange);
  }, []);

  // Process reels data - memoized for performance
  const reels = useMemo(() => {
    if (!reelsData) return [];
    return Object.entries(reelsData)
      .map(([id, reel]) => ({ id, ...reel }))
      .filter(reel => reel.isPublished && reel.type === POST_TYPES.REEL)
      .sort((a, b) => new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0));
  }, [reelsData]);

  // Discovery breaks rotate between local offers, a community poll, tomorrow's
  // weather, and suggested reels without interrupting consecutive videos too often.
  const feedItems = useMemo(() => {
    if (reels.length < 5) return reels.map(reel => ({ type: 'reel', reel }));

    const items = [];
    const groupSizes = [3, 2, 3, 3];
    const panelTypes = ['offers', 'poll', 'weather', 'suggestions'];
    let cursor = 0;
    let groupIndex = 0;

    while (cursor < reels.length) {
      const groupSize = groupSizes[groupIndex % groupSizes.length];
      const group = reels.slice(cursor, cursor + groupSize);
      group.forEach(reel => items.push({ type: 'reel', reel }));
      cursor += group.length;

      if (cursor < reels.length) {
        const panelType = panelTypes[groupIndex % panelTypes.length];
        if (panelType === 'suggestions') {
          const groupCategories = new Set(group.map(reel => reel.category).filter(Boolean));
          const suggestions = reels.slice(cursor).map(reel => ({ reel, score: (groupCategories.has(reel.category) ? 1_000_000 : 0) + Number(reel.analytics?.views || 0) * 3 + Number(reel.analytics?.likes || 0) * 10 })).sort((a, b) => b.score - a.score).map(item => item.reel).slice(0, 8);
          items.push({ type: panelType, id: `${panelType}-${groupIndex}`, reels: suggestions });
        } else {
          items.push({ type: panelType, id: `${panelType}-${groupIndex}` });
        }
      }

      groupIndex += 1;
    }

    return items;
  }, [reels]);

  const currentFeedItem = feedItems[currentFeedIndex];
  const currentReel = currentFeedItem?.type === 'reel' ? currentFeedItem.reel : null;
  const { data: currentCommentsData } = useRealtimeData(currentReel?.id ? `comments/${currentReel.id}` : null);
  const currentCommentCount = currentCommentsData
    ? countVisibleComments(currentCommentsData)
    : Number(currentReel?.analytics?.comments ?? currentReel?.comments ?? 0);
  const commentsAllowed = currentReel?.commentsEnabled !== false && currentReel?.reelSettings?.allowComments !== false;
  const downloadAllowed = currentReel?.reelSettings?.allowDownload === true;
  const duetAllowed = currentReel?.reelSettings?.allowDuet === true;

  useEffect(() => {
    if (!commentsAllowed) setShowComments(false);
  }, [commentsAllowed, currentReel?.id]);

  // Track view for current reel
  useViewTracking(currentReel?.id, 'reels');

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

  // Keep exactly one reel playing. A canplay listener retries automatically
  // when a newly visible video is still arriving over a mobile connection.
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([reelId, reelVideo]) => {
      if (reelId !== currentReel?.id && reelVideo) reelVideo.pause();
    });

    const video = videoRefs.current[currentReel?.id];
    if (!video) {
      setIsBuffering(false);
      return;
    }
    let cancelled = false;

    const playVideo = async () => {
      if (cancelled || !isPlaying) return;
      try {
        video.muted = isMuted;
        await video.play();
      } catch (err) {
        // Browsers can reject sound autoplay until the first touch. The touch
        // handlers below retry play directly inside that user gesture.
        if (err?.name !== 'NotAllowedError') console.log('Play failed:', err);
      }
    };

    if (isPlaying) {
      playVideo();
    } else {
      video.pause();
    }
    video.addEventListener('canplay', playVideo);
    return () => {
      cancelled = true;
      video.removeEventListener('canplay', playVideo);
    };
  }, [isPlaying, isMuted, currentFeedIndex, currentReel]);

  // Track video progress - optimized with RAF
  useEffect(() => {
    const video = videoRefs.current[currentReel?.id];
    if (!video) {
      setProgress(0);
      setBuffered(0);
      return;
    }

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

    setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0);
    rafId = requestAnimationFrame(updateProgress);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [currentFeedIndex, reels.length, currentReel]);

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

    const initialIndex = feedItems.findIndex(item => item.type === 'reel' && item.reel.id === initialReelId);
    if (initialIndex >= 0) {
      setCurrentFeedIndex(initialIndex);
      requestAnimationFrame(() => {
        const container = containerRef.current;
        if (container) container.scrollTop = initialIndex * container.clientHeight;
      });
    }
  }, [initialReelId, feedItems, reels.length]);

  // Hide hints after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHints(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const scrollToFeedItem = useCallback((index, behavior = 'smooth') => {
    const targetIndex = Math.max(0, Math.min(index, feedItems.length - 1));
    const container = containerRef.current;
    const currentVideo = videoRefs.current[currentReel?.id];
    if (currentVideo) currentVideo.pause();
    setIsPlaying(true);
    if (container) {
      container.scrollTo({ top: targetIndex * container.clientHeight, behavior });
    } else {
      setCurrentFeedIndex(targetIndex);
    }
  }, [currentReel?.id, feedItems.length]);

  const openSuggestedReel = useCallback((reelId) => {
    const targetIndex = feedItems.findIndex(item => item.type === 'reel' && item.reel.id === reelId);
    if (targetIndex >= 0) scrollToFeedItem(targetIndex);
  }, [feedItems, scrollToFeedItem]);

  const goToNext = useCallback(() => {
    if (currentFeedIndex < feedItems.length - 1) scrollToFeedItem(currentFeedIndex + 1);
  }, [currentFeedIndex, feedItems.length, scrollToFeedItem]);

  const goToPrevious = useCallback(() => {
    if (currentFeedIndex > 0) scrollToFeedItem(currentFeedIndex - 1);
  }, [currentFeedIndex, scrollToFeedItem]);

  const handleReelScroll = useCallback(() => {
    if (scrollFrameRef.current) return;
    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      const container = containerRef.current;
      if (!container?.clientHeight) return;
      const nextIndex = Math.max(0, Math.min(feedItems.length - 1, Math.round(container.scrollTop / container.clientHeight)));
      setCurrentFeedIndex(previousIndex => {
        if (previousIndex === nextIndex) return previousIndex;
        setIsPlaying(true);
        setShowActionsMenu(false);
        setShowComments(false);
        return nextIndex;
      });
    });
  }, [feedItems.length]);

  useEffect(() => () => {
    if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
  }, []);

  const togglePlay = useCallback(() => {
    if (performance.now() - soundUnlockedAtRef.current < 700) return;
    setIsPlaying(prev => !prev);
    setShowPlayPauseIcon(true);
    setTimeout(() => setShowPlayPauseIcon(false), 500);
  }, []);

  const handleReelPressStart = useCallback((event) => {
    if (event.pointerType !== 'touch') return;
    touchResumeRef.current = isPlaying;
    suppressTouchClickRef.current = true;
    if (isPlaying) setIsPlaying(false);
  }, [isPlaying]);

  const handleReelPressEnd = useCallback((event) => {
    if (event.pointerType !== 'touch') return;
    if (touchResumeRef.current) setIsPlaying(true);
    touchResumeRef.current = false;
    window.setTimeout(() => {
      suppressTouchClickRef.current = false;
    }, 350);
  }, []);

  const handleReelClick = useCallback(() => {
    if (suppressTouchClickRef.current) return;
    togglePlay();
  }, [togglePlay]);

  const toggleMute = useCallback(() => {
    soundPreferenceSetRef.current = true;
    setIsMuted(prev => !prev);
  }, []);

  // Mobile browsers prohibit audible autoplay before a user gesture. Treat
  // the swipe itself as that gesture, so users never have to tap just to make
  // the next reel start with sound.
  const activateVisibleReelFromGesture = useCallback(() => {
    const container = containerRef.current;
    const visibleIndex = container?.clientHeight
      ? Math.max(0, Math.min(feedItems.length - 1, Math.round(container.scrollTop / container.clientHeight)))
      : currentFeedIndex;
    const visibleItem = feedItems[visibleIndex];
    const visibleReel = visibleItem?.type === 'reel' ? visibleItem.reel : null;
    const video = videoRefs.current[visibleReel?.id];

    const shouldEnableSound = !soundPreferenceSetRef.current;
    if (shouldEnableSound && isMuted) soundUnlockedAtRef.current = performance.now();
    if (shouldEnableSound) setIsMuted(false);
    setIsPlaying(true);
    if (video) {
      video.muted = shouldEnableSound ? false : isMuted;
      video.play().catch(error => {
        if (error?.name !== 'AbortError') console.log('Gesture playback failed:', error);
      });
    }
  }, [currentFeedIndex, feedItems, isMuted]);

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
      updates[`users/${user.uid}/likes/${reelId}`] = isLiked ? null : Date.now();
      updates[`users/${user.uid}/totalLikes`] = increment(isLiked ? -1 : 1);
      
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
          title: getLocalizedText(reel.title, 'en') || 'Check out this reel!',
          text: getLocalizedText(reel.description || reel.excerpt, 'en'),
          url: window.location.origin + `/reel/${reel.id}`
        });
        
        // Only increment share count if share was successful
        await update(ref(db, `reels/${reel.id}/analytics`), {
          shares: increment(1)
        });
        
        // Track user's total shares
        if (user?.uid) {
          await update(ref(db, `users/${user.uid}`), {
            totalShares: increment(1),
            [`shares/${reel.id}`]: Date.now()
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
            totalShares: increment(1),
            [`shares/${reel.id}`]: Date.now()
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
    if (!commentsAllowed) return;
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

  const handleDownload = async reel => {
    const url = getReelVideoUrl(reel);
    if (!url || reel?.reelSettings?.allowDownload !== true) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `our-vadodara-reel-${reel.id}.mp4`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading reel:', error);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDuet = reel => {
    if (!user) {
      alert('Please sign in to create a duet');
      return;
    }
    if (!checkProfileComplete() || reel?.reelSettings?.allowDuet !== true) return;
    setShowActionsMenu(false);
    setDuetReel(reel);
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
      className={`reel-container ${isDesktop ? 'relative w-full h-screen' : 'fixed inset-0'} bg-black overflow-hidden select-none`}
    >
      {/* Progress Bar - Subtle Modern Design with Buffer Indicator */}
      {currentReel && <div className="absolute top-0 left-0 right-0 z-[60] h-1 bg-white/10">
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
      </div>}

      {/* Native scrolling reel track. Keeping every video in a full-height
          snap panel creates the physical slide transition users expect from
          Instagram instead of replacing the current video in place. */}
      <div
        ref={containerRef}
        onScroll={handleReelScroll}
        onTouchEnd={activateVisibleReelFromGesture}
        className="absolute inset-0 overflow-y-auto overscroll-y-contain snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
      >
        {feedItems.map((item, index) => {
          const onContinue = () => scrollToFeedItem(index + 1);
          if (item.type === 'suggestions') return <SuggestedReelsPanel key={item.id} reels={item.reels} onSelect={openSuggestedReel} onContinue={onContinue} />;
          if (item.type === 'offers') return <ReelsOfferPanel key={item.id} onContinue={onContinue} />;
          if (item.type === 'poll') return <ReelsPollPanel key={item.id} onContinue={onContinue} />;
          if (item.type === 'weather') return <ReelsWeatherPanel key={item.id} onContinue={onContinue} />;
          return (
          <section
            key={item.reel.id}
            className="relative flex h-full min-h-full snap-start snap-always items-center justify-center bg-black"
            aria-label={`Reel ${reels.findIndex(reel => reel.id === item.reel.id) + 1} of ${reels.length}`}
          >
            <div className={`relative h-full w-full ${isDesktop ? 'max-w-md' : ''}`}>
              <div className={`h-full w-full ${item.reel.duetSourceVideoUrl ? 'grid grid-cols-2 gap-0.5' : ''}`}>
              {item.reel.duetSourceVideoUrl && (
                <video src={item.reel.duetSourceVideoUrl} className="h-full w-full object-contain" loop playsInline muted autoPlay={index === currentFeedIndex} aria-label="Original reel" />
              )}
              <video
                ref={element => {
                  if (element) videoRefs.current[item.reel.id] = element;
                  else delete videoRefs.current[item.reel.id];
                }}
                data-reel="true"
                src={getReelVideoUrl(item.reel)}
                poster={item.reel.mediaContent?.items?.[0]?.thumbnailUrl || item.reel.thumbnail}
                className="h-full w-full object-contain"
                loop
                playsInline
                preload={index === currentFeedIndex || index === currentFeedIndex + 1 ? 'auto' : 'none'}
                fetchPriority={index === currentFeedIndex ? 'high' : 'auto'}
                muted={isMuted}
                controlsList={item.reel.reelSettings?.allowDownload === true ? undefined : 'nodownload'}
                onLoadStart={() => index === currentFeedIndex && setIsBuffering(true)}
                onWaiting={() => index === currentFeedIndex && setIsBuffering(true)}
                onCanPlay={() => index === currentFeedIndex && setIsBuffering(false)}
                onPlaying={() => index === currentFeedIndex && setIsBuffering(false)}
              />
              </div>
              <button
                type="button"
                className="absolute inset-0 z-10 cursor-pointer bg-transparent"
                style={{ touchAction: 'pan-y' }}
                onPointerDown={handleReelPressStart}
                onPointerUp={handleReelPressEnd}
                onPointerCancel={handleReelPressEnd}
                onClick={handleReelClick}
                aria-label={isPlaying && index === currentFeedIndex ? 'Pause reel' : 'Play reel'}
              />
            </div>
          </section>
          );
        })}
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
                <span>{isMuted ? 'Swipe to browse • Sound starts automatically' : 'Swipe ↑↓ • Tap to pause'}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Current Reel */}
      {currentReel && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {/* Reel Video Container */}
          <div className={`relative ${isDesktop ? 'w-full max-w-md h-full' : 'w-full h-full'}`}>
          {/* Bottom Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none reel-overlay" />

          {/* Like Animation */}
          {showLikeAnimation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <Heart className="w-24 h-24 text-white fill-current animate-heart-burst" />
            </div>
          )}

          {isBuffering && isPlaying && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/35 border-t-white drop-shadow-lg" />
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

          {/* Author Info & Content */}
          <div className="absolute bottom-20 left-4 right-20 text-white z-20 reel-content">
            {/* Title & Description */}
            {getLocalizedText(currentReel.title, 'en') && (
              <h2 className="font-semibold text-base mb-1 drop-shadow-lg line-clamp-2">
                {getLocalizedText(currentReel.title, 'en')}
              </h2>
            )}
            
            {getLocalizedText(currentReel.description || currentReel.excerpt, 'en') && (
              <ExpandableReelDescription
                key={currentReel.id}
                reelId={currentReel.id}
                text={getLocalizedText(currentReel.description || currentReel.excerpt, 'en')}
              />
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
          <div className="pointer-events-auto absolute bottom-24 right-4 z-20 flex flex-col space-y-4">
            {/* Like Button - Primary */}
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleLike(currentReel.id);
              }}
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
            {commentsAllowed && <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleComment();
              }}
              className="flex flex-col items-center space-y-1 reel-action-button"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm text-white rounded-full hover:bg-gray-900/70 transition-all">
                <MessageCircle className="w-6 h-6" />
              </div>
              {currentCommentCount > 0 && (
                <span className="text-white text-xs font-semibold drop-shadow-lg">
                  {formatNumber(currentCommentCount)}
                </span>
              )}
            </button>}

            {/* More Menu - Secondary Actions */}
            <div className="relative flex flex-col items-center">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setShowActionsMenu(!showActionsMenu);
                }}
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
                    onClick={(event) => {
                      event.stopPropagation();
                      setShowActionsMenu(false);
                    }}
                  />
                  <div className="absolute right-full mr-3 bottom-0 w-48 bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-2 z-40 overflow-hidden">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
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
                    {downloadAllowed && <button
                      type="button"
                      onClick={(event) => { event.preventDefault(); event.stopPropagation(); handleDownload(currentReel); setShowActionsMenu(false); }}
                      className="flex w-full items-center space-x-3 px-4 py-3 text-left text-white transition-colors hover:bg-white/10"
                    >
                      <Download className="h-5 w-5" /><span className="text-sm font-medium">Download</span>
                    </button>}
                    {duetAllowed && <button
                      type="button"
                      onClick={(event) => { event.preventDefault(); event.stopPropagation(); handleDuet(currentReel); }}
                      className="flex w-full items-center space-x-3 px-4 py-3 text-left text-white transition-colors hover:bg-white/10"
                    >
                      <GitFork className="h-5 w-5" /><span className="text-sm font-medium">Create duet</span>
                    </button>}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
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
      {duetReel && <DuetModal reel={duetReel} user={user} onClose={() => setDuetReel(null)} />}
      
      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showModal}
        onClose={closeModal}
        missingFields={profileCompletion?.missingFields || []}
      />
    </div>
  );
};

const DuetModal = ({ reel, user, onClose }) => {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const publishDuet = async event => {
    event.preventDefault();
    if (!file || !user?.uid || saving) return;
    setSaving(true);
    setError('');
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const fileRef = storageRef(storage, `reels/${user.uid}/${Date.now()}-duet-${safeName}`);
      const snapshot = await uploadBytes(fileRef, file, { contentType: file.type || 'video/mp4' });
      const videoUrl = await getDownloadURL(snapshot.ref);
      const reelRef = push(ref(db, 'reels'));
      const now = new Date().toISOString();
      const originalTitle = getLocalizedText(reel.title, 'en') || 'Original reel';
      await set(reelRef, {
        id: reelRef.key,
        type: POST_TYPES.REEL,
        title: { en: caption.trim() || `Duet with ${originalTitle}`, hi: '', gu: '' },
        description: { en: caption.trim(), hi: '', gu: '' },
        videoUrl,
        duetOf: reel.id,
        duetSourceVideoUrl: getReelVideoUrl(reel),
        author: { uid: user.uid, name: user.displayName || 'Our Vadodara user', avatar: user.photoURL || '' },
        authorId: user.uid,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
        publishedAt: now,
        commentsEnabled: true,
        mediaContent: { type: 'video', items: [{ id: `duet-${Date.now()}`, type: 'video', url: videoUrl, filename: file.name }] },
        reelSettings: { allowDownload: true, allowDuet: true, allowComments: true },
        analytics: { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 }
      });
      onClose();
    } catch (publishError) {
      console.error('Error publishing duet:', publishError);
      setError('Unable to publish the duet. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <form onSubmit={publishDuet} onClick={event => event.stopPropagation()} className="w-full max-w-lg rounded-3xl bg-white p-5 text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-white">
        <div className="flex items-center justify-between gap-3"><div><h3 className="text-xl font-black">Create a duet</h3><p className="text-sm text-slate-500">Record or choose your side of the Reel.</p></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-800" aria-label="Close duet creator"><X className="h-5 w-5" /></button></div>
        <label className="mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-700"><Upload className="h-8 w-8 text-pink-600" /><span className="mt-2 font-bold">{file ? file.name : 'Record or choose a video'}</span><span className="mt-1 text-xs text-slate-500">MP4, MOV, or WebM up to 100 MB</span><input type="file" accept="video/*" capture="user" onChange={event => setFile(event.target.files?.[0] || null)} className="sr-only" /></label>
        <label className="mt-4 block text-sm font-bold">Caption<input value={caption} onChange={event => setCaption(event.target.value)} maxLength={240} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950" placeholder="Add a caption (optional)" /></label>
        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
        <button type="submit" disabled={!file || saving} className="mt-5 w-full rounded-xl bg-pink-600 px-4 py-3 font-black text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Publishing duet…' : 'Publish duet'}</button>
      </form>
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
          <ThreadedCommentSection postId={reel.id} contentPath="reels" commentsEnabled={reel.commentsEnabled !== false && reel.reelSettings?.allowComments !== false} />
        </div>
      </div>
    </div>
  );
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
