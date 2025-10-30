// =============================================
// src/hooks/useRealtimeData.js
// A reusable hook to listen to Firebase Realtime DB
// Now with city-scoped data support
// =============================================
import { useState, useEffect } from 'react';
import { ref, onValue } from '../firebase-config';
import { db } from '../firebase-config';
import { useCity } from '../context/CityContext';

const isDevEnv = typeof import.meta !== 'undefined' && import.meta.env && !!import.meta.env.DEV;

export const useRealtimeData = (collectionName, options = {}) => {
  const { currentCity } = useCity();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('none');

  const {
    scope = 'auto', // 'auto' | 'city' | 'global'
    fallbackToGlobal = true,
    cityId: overrideCityId = null,
    debug = isDevEnv
  } = options;

  useEffect(() => {
    if (!collectionName) {
      setIsLoading(false);
      setSource('none');
      return undefined;
    }

    // Determine paths to listen to
    const hasPathSeparator = collectionName.includes('/');
    let primaryPath = null;
    let fallbackPath = null;
    const resolvedCityId = overrideCityId || currentCity?.id;

    if (scope === 'global' || hasPathSeparator) {
      primaryPath = collectionName;
    } else if (scope === 'city' || scope === 'auto') {
      if (resolvedCityId) {
        primaryPath = `cities/${resolvedCityId}/${collectionName}`;
        if (scope === 'auto' && fallbackToGlobal) {
          fallbackPath = collectionName;
        }
      } else if (scope === 'auto' && fallbackToGlobal) {
        // No city yet, use global until city loads
        fallbackPath = collectionName;
      }
    }

    if (!primaryPath && !fallbackPath) {
      if (debug) {
        console.warn(`useRealtimeData(${collectionName}): No valid path resolved. scope=${scope}`);
      }
      setIsLoading(false);
      setData(null);
      setSource('none');
      return undefined;
    }

    setIsLoading(true);
    let hasPrimaryData = false;
    let isMounted = true;
    setSource('pending');

    const subscriptions = [];

    const subscribe = (path, isFallback = false) => {
      if (!path) return;
      if (debug) {
        console.log(`useRealtimeData: Listening to ${path}${isFallback ? ' (fallback)' : ''}`);
      }
      const dbRef = ref(db, path);
      const unsubscribe = onValue(dbRef, (snapshot) => {
        if (!isMounted) return;

        if (snapshot.exists()) {
          const fetchedData = snapshot.val();
          if (!isFallback) {
            hasPrimaryData = true;
          }
          if (!isFallback || !hasPrimaryData) {
            if (debug) {
              console.log(`useRealtimeData(${collectionName}): ${Object.keys(fetchedData).length} items from ${path}`);
            }
            setData(fetchedData);
            setSource(isFallback ? 'fallback' : 'primary');
          }
        } else if (!isFallback && !fallbackPath) {
          if (debug) {
            console.log(`useRealtimeData(${collectionName}): No data at ${path}`);
          }
          setData(null);
          setSource('empty');
        } else if (isFallback && !hasPrimaryData) {
          setData(null);
          setSource('empty');
        }

        setIsLoading(false);
      }, (err) => {
        if (debug) {
          console.error(`useRealtimeData(${collectionName}): Error listening to ${path}`, err);
        }
        setError(err);
        setIsLoading(false);
        setSource('error');
      });

      subscriptions.push(unsubscribe);
    };

    // Prioritize primary path
    subscribe(primaryPath, false);

    // Fallback listener (global data) only if primary path didn't return data
    if (fallbackPath && fallbackPath !== primaryPath) {
      subscribe(fallbackPath, true);
    }

    return () => {
      isMounted = false;
      subscriptions.forEach(unsub => unsub && unsub());
    };
  }, [collectionName, currentCity?.id, overrideCityId, scope, fallbackToGlobal, debug]);

  return { data, isLoading, error, source };
};
