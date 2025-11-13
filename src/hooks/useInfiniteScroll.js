// =============================================
// src/hooks/useInfiniteScroll.js
// Enhanced Infinite Scroll with Pagination
// =============================================
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Enhanced infinite scroll hook with pagination support
 * @param {Array} allItems - Complete list of items
 * @param {Object} options - Configuration options
 * @param {number} options.pageSize - Items per page (default: 20)
 * @param {number} options.threshold - Distance from bottom to trigger load (default: 300px)
 * @returns {Object} - Paginated items and loading state
 */
export const useInfiniteScroll = (allItems = [], options = {}) => {
  const { pageSize = 20, threshold = 300 } = options;
  const [displayedItems, setDisplayedItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  // Initialize displayed items
  useEffect(() => {
    if (allItems.length === 0) {
      setDisplayedItems([]);
      setPage(1);
      setHasMore(false);
      return;
    }

    const initialItems = allItems.slice(0, pageSize);
    setDisplayedItems(initialItems);
    setPage(1);
    setHasMore(allItems.length > pageSize);
  }, [allItems, pageSize]);

  // Load more items
  const loadMore = useCallback(() => {
    if (isFetching || !hasMore) return;

    setIsFetching(true);
    
    // Simulate async loading for smooth UX
    setTimeout(() => {
      const nextPage = page + 1;
      const startIndex = 0;
      const endIndex = nextPage * pageSize;
      const nextItems = allItems.slice(startIndex, endIndex);
      
      setDisplayedItems(nextItems);
      setPage(nextPage);
      setHasMore(endIndex < allItems.length);
      setIsFetching(false);
    }, 300);
  }, [allItems, page, pageSize, hasMore, isFetching]);

  // Intersection Observer for better performance
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

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

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isFetching, loadMore, threshold]);

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
