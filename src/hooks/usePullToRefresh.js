// =============================================
// src/hooks/usePullToRefresh.js
// Pull-to-Refresh Hook for Mobile Experiences
// =============================================
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Pull-to-refresh hook with native-like feel
 * @param {Function} onRefresh - Async function to call on refresh
 * @param {Object} options - Configuration options
 * @returns {Object} - Refresh state and container ref
 */
export const usePullToRefresh = (onRefresh, options = {}) => {
  const {
    threshold = 80,
    maxPullDistance = 120,
    resistance = 2.5,
    enabled = true
  } = options;

  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const canPull = useRef(false);

  const handleTouchStart = useCallback((e) => {
    if (!enabled || refreshing) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    // More strict check: only enable if very close to top (within 3px)
    canPull.current = scrollTop <= 3;

    if (canPull.current) {
      touchStartY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  }, [enabled, refreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current || !canPull.current || refreshing) return;

    const touchY = e.touches[0].clientY;
    const distance = touchY - touchStartY.current;

    // Only engage pull-to-refresh if pulling down at least 15px
    if (distance > 15) {
      // Prevent default scroll behavior when clearly pulling down
      e.preventDefault();
      
      // Apply resistance for natural feel
      const resistedDistance = Math.min(
        distance / resistance,
        maxPullDistance
      );
      
      setPullDistance(resistedDistance);
    } else if (distance > 0 && distance <= 15) {
      // Small movement - allow normal scrolling
      isDragging.current = false;
      canPull.current = false;
    }
  }, [refreshing, resistance, maxPullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current || refreshing) {
      isDragging.current = false;
      return;
    }

    isDragging.current = false;

    if (pullDistance >= threshold) {
      setRefreshing(true);
      setPullDistance(threshold);

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, onRefresh, refreshing]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;

  return {
    containerRef,
    refreshing,
    pullDistance,
    progress,
    rotation,
    isThresholdReached: pullDistance >= threshold
  };
};
