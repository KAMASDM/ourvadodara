// =============================================
// src/context/CityContext.jsx
// Multi-City Support Context - Loads from Firebase
// =============================================
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase-config';

const CityContext = createContext();

// Fallback cities (used while loading from Firebase)
const DEFAULT_CITIES = [
  { id: 'vadodara', name: 'Vadodara', logoUrl: '' },
  { id: 'surat', name: 'Surat', logoUrl: '' },
  { id: 'rajkot', name: 'Rajkot', logoUrl: '' }
];

export const CityProvider = ({ children }) => {
  const [cities, setCities] = useState(DEFAULT_CITIES);
  const [loading, setLoading] = useState(true);
  
  const [currentCity, setCurrentCity] = useState(() => {
    try {
      const storedCity = localStorage.getItem('appCity');
      if (storedCity) {
        const parsed = JSON.parse(storedCity);
        return DEFAULT_CITIES.find(c => c.id === parsed.id) || DEFAULT_CITIES[0];
      }
    } catch (e) {
      // Fallback to default city
    }
    return DEFAULT_CITIES[0];
  });

  // Load cities from Firebase
  useEffect(() => {
    const citiesRef = ref(db, 'cities-config');
    const unsubscribe = onValue(citiesRef, (snapshot) => {
      if (snapshot.exists()) {
        const citiesData = snapshot.val();
        const citiesArray = Object.entries(citiesData).map(([id, data]) => ({
          id,
          name: data.name,
          nameGu: data.nameGu,
          nameHi: data.nameHi,
          logoUrl: data.logoUrl || '',
          description: data.description
        }));
        
        setCities(citiesArray.sort((a, b) => a.name.localeCompare(b.name)));
        
        // Update current city if it exists in loaded cities
        setCurrentCity(prev => {
          const found = citiesArray.find(c => c.id === prev.id);
          return found || citiesArray[0];
        });
      } else {
        // Use default cities if none in Firebase
        setCities(DEFAULT_CITIES);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('appCity', JSON.stringify(currentCity));
    } catch (e) {
      // Storage not available
    }
  }, [currentCity]);

  const value = useMemo(() => ({
    currentCity,
    setCurrentCity,
    cities,
    loading
  }), [currentCity, cities, loading]);

  return (
    <CityContext.Provider value={value}>
      {children}
    </CityContext.Provider>
  );
};

export const useCity = () => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
};

// Backward compatibility export
export const CITIES = DEFAULT_CITIES;
