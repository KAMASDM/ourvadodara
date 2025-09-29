
// =============================================
// src/hooks/useRealtimeData.js
// A reusable hook to listen to Firebase Realtime DB
// =============================================
import { useState, useEffect } from 'react';
import { ref, onValue } from '../firebase-config';
import { db } from '../firebase-config';

export const useRealtimeData = (path) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!path) {
      setIsLoading(false);
      return;
    }
    
    const dbRef = ref(db, path);
    
    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.val());
      } else {
        setData(null); // Handle case where data doesn't exist
      }
      setIsLoading(false);
    }, (err) => {
      setError(err);
      setIsLoading(false);
      console.error(`Error fetching data from ${path}:`, err);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [path]);

  return { data, isLoading, error };
};
