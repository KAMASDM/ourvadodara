// =============================================
// src/hooks/useViewTracking.js
// Hook for tracking post views
// =============================================
import { useEffect, useRef } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase-config';

const useViewTracking = (postId, postType = 'posts') => {
  const hasTrackedView = useRef(false);
  const trackedPostId = useRef(null);

  useEffect(() => {
    if (trackedPostId.current !== postId) {
      hasTrackedView.current = false;
      trackedPostId.current = postId;
    }
    // Only track view once per page visit
    if (!postId || hasTrackedView.current) return;

    const trackView = async () => {
      try {
        const storageKey = 'ovViewerId';
        let viewerId = localStorage.getItem(storageKey);
        if (!viewerId) {
          viewerId = globalThis.crypto?.randomUUID?.() || `viewer-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          localStorage.setItem(storageKey, viewerId);
        }
        await httpsCallable(functions, 'trackContentView')({ contentId: postId, contentType: postType, viewerId });

        hasTrackedView.current = true;
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
