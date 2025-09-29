// =============================================
// src/hooks/useInfiniteScroll.js
// =============================================
import { useState, useEffect, useCallback } from 'react';

export const useInfiniteScroll = (fetchMore, hasMore = true) => {
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!isFetching || !hasMore) return;

    const fetchData = async () => {
      await fetchMore();
      setIsFetching(false);
    };

    fetchData();
  }, [isFetching, fetchMore, hasMore]);

  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop !== 
      document.documentElement.offsetHeight || 
      isFetching
    ) {
      return;
    }
    setIsFetching(true);
  }, [isFetching]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return [isFetching, setIsFetching];
};
