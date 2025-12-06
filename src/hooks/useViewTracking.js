// =============================================
// src/hooks/useViewTracking.js
// Hook for tracking post views
// =============================================
import { useEffect, useRef } from 'react';
import { ref, update, increment } from 'firebase/database';
import { db } from '../firebase-config';

const useViewTracking = (postId, postType = 'posts') => {
  const hasTrackedView = useRef(false);

  useEffect(() => {
    // Only track view once per page visit
    if (!postId || hasTrackedView.current) return;

    const trackView = async () => {
      try {
        const analyticsRef = ref(db, `${postType}/${postId}/analytics`);
        
        await update(analyticsRef, {
          views: increment(1),
          lastViewedAt: new Date().toISOString()
        });

        hasTrackedView.current = true;
        console.log(`View tracked for ${postType}/${postId}`);
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    };

    // Track view after a short delay to ensure it's a real view
    const timer = setTimeout(() => {
      trackView();
    }, 2000); // 2 second delay

    return () => {
      clearTimeout(timer);
    };
  }, [postId, postType]);

  return null;
};

export default useViewTracking;
