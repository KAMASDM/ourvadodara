// =============================================
// src/hooks/useReadTime.js
// Hook for tracking read time analytics
// =============================================
import { useState, useEffect, useRef } from 'react';
import { ref, update, get } from 'firebase/database';
import { db } from '../firebase-config';

const useReadTime = (postId, isVisible = true) => {
  const [readTime, setReadTime] = useState(0);
  const startTimeRef = useRef(null);
  const accumulatedTimeRef = useRef(0);
  const isActiveRef = useRef(false);

  useEffect(() => {
    if (isVisible && postId) {
      // Start timing when post becomes visible
      startTimeRef.current = Date.now();
      isActiveRef.current = true;
    } else {
      // Stop timing when post becomes invisible
      if (startTimeRef.current && isActiveRef.current) {
        const sessionTime = Date.now() - startTimeRef.current;
        accumulatedTimeRef.current += sessionTime;
        setReadTime(Math.floor(accumulatedTimeRef.current / 1000)); // Convert to seconds
        isActiveRef.current = false;
      }
    }

    return () => {
      // Save read time when component unmounts
      if (accumulatedTimeRef.current > 0 && postId) {
        saveReadTime();
      }
    };
  }, [isVisible, postId]);

  // Track page visibility to pause/resume timing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActiveRef.current) {
        // Page became hidden, pause timing
        if (startTimeRef.current) {
          const sessionTime = Date.now() - startTimeRef.current;
          accumulatedTimeRef.current += sessionTime;
          startTimeRef.current = null;
        }
      } else if (!document.hidden && isVisible && postId) {
        // Page became visible again, resume timing
        startTimeRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isVisible, postId]);

  const saveReadTime = async () => {
    if (!postId || accumulatedTimeRef.current < 1000) return; // Only save if read for at least 1 second
    
    try {
      const postRef = ref(db, `posts/${postId}/analytics`);
      const readTimeSeconds = Math.floor(accumulatedTimeRef.current / 1000);
      
      // Get current analytics data first (for calculating averages)
      const currentAnalytics = await get(postRef);
      const analytics = currentAnalytics.val() || {};
      
      const currentTotalReadTime = analytics.totalReadTime || 0;
      const currentReadSessions = analytics.readSessions || 0;
      const newReadSessions = currentReadSessions + 1;
      const newTotalReadTime = currentTotalReadTime + readTimeSeconds;
      const avgReadTime = Math.floor(newTotalReadTime / newReadSessions);

      await update(postRef, {
        totalReadTime: newTotalReadTime,
        readSessions: newReadSessions,
        avgReadTime: avgReadTime,
        lastReadAt: new Date().toISOString()
      });

      // Reset accumulated time
      accumulatedTimeRef.current = 0;
    } catch (error) {
      console.error('Error saving read time:', error);
    }
  };

  const manualSave = () => {
    if (startTimeRef.current && isActiveRef.current) {
      const sessionTime = Date.now() - startTimeRef.current;
      accumulatedTimeRef.current += sessionTime;
      startTimeRef.current = Date.now(); // Reset start time for continued reading
    }
    saveReadTime();
  };

  return {
    readTime,
    saveReadTime: manualSave
  };
};

export default useReadTime;