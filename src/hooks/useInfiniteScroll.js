// =============================================
// src/hooks/useInfiniteScroll.js
// Enhanced Infinite Scroll with Pagination
// =============================================
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * Enhanced infinite scroll hook with pagination support
 * @param {Array} allItems - Complete list of items
 * @param {Object} options - Configuration options
 * @param {number} options.pageSize - Items per page (default: 20)
 * @param {number} options.threshold - Distance from bottom to trigger load (default: 300px)
 * @returns {Object} - Paginated items and loading state
 */
export const useInfiniteScroll = (allItems = [], options = {}) => {
  const { pageSize = 20, threshold = 300, resetKey = 'default' } = options;
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const observerRef = useRef(null);
  const [sentinelNode, setSentinelNode] = useState(null);
  const sentinelRef = useCallback(node => setSentinelNode(node), []);

  // Reset only when the active feed/filter changes. Realtime updates (likes,
  // views, comments) must not throw away mounted pages and rebuild the feed.
  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(allItems.length / pageSize));
    setPage(currentPage => Math.min(currentPage, maxPage));
  }, [allItems.length, pageSize]);

  const displayedItems = useMemo(
    () => allItems.slice(0, page * pageSize),
    [allItems, page, pageSize]
  );
  const hasMore = displayedItems.length < allItems.length;

  // Load more items
  const loadMore = useCallback(() => {
    if (isFetching || !hasMore) return;

    setIsFetching(true);
    requestAnimationFrame(() => {
      setPage(currentPage => currentPage + 1);
      setIsFetching(false);
    });
  }, [hasMore, isFetching]);

  // Intersection Observer for better performance
  useEffect(() => {
    if (!sentinelNode || !hasMore) return undefined;

    const options = {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && hasMore && !isFetching) {
          loadMore();
        }
      });
    }, options);

    observerRef.current.observe(sentinelNode);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isFetching, loadMore, sentinelNode, threshold]);

  // Mobile Safari/Chrome can miss an observer transition when fixed headers,
  // bottom navigation, or the browser toolbar resize the visual viewport. A
  // passive bottom-distance check makes pagination resilient to that case.
  useEffect(() => {
    if (!hasMore) return undefined;

    let frame = null;
    const checkDistanceFromBottom = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const documentHeight = Math.max(
          document.documentElement.scrollHeight,
          document.body?.scrollHeight || 0
        );
        const viewportBottom = window.scrollY + window.innerHeight;
        if (documentHeight - viewportBottom <= Math.max(threshold, 400)) loadMore();
      });
    };

    window.addEventListener('scroll', checkDistanceFromBottom, { passive: true });
    window.addEventListener('resize', checkDistanceFromBottom, { passive: true });
    window.visualViewport?.addEventListener('resize', checkDistanceFromBottom, { passive: true });
    checkDistanceFromBottom();

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', checkDistanceFromBottom);
      window.removeEventListener('resize', checkDistanceFromBottom);
      window.visualViewport?.removeEventListener('resize', checkDistanceFromBottom);
    };
  }, [hasMore, loadMore, threshold]);

  return {
    items: displayedItems,
    hasMore,
    isFetching,
    loadMore,
    sentinelRef,
    totalCount: allItems.length,
    displayedCount: displayedItems.length
  };
};
