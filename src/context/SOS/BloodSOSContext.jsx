// =============================================
// src/context/SOS/BloodSOSContext.jsx
// Centralised Blood SOS state management and Firebase sync
// =============================================
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ref, onValue, push, set, update } from 'firebase/database';
import { db } from '../../firebase-config';
import { useCity } from '../CityContext';
import { useEnhancedAuth } from '../Auth/SimpleEnhancedAuth';
import { getUserProfile } from '../../utils/adminSetup';

const BloodSOSContext = createContext(null);

export const useBloodSOS = () => {
  const context = useContext(BloodSOSContext);

  if (!context) {
    throw new Error('useBloodSOS must be used within a BloodSOSProvider');
  }

  return context;
};

const normalizeProfile = (rawProfile) => {
  if (!rawProfile) return { personal: {}, business: {}, job: {}, contact: {} };

  if (rawProfile.profile) {
    return {
      personal: rawProfile.profile.personal || {},
      business: rawProfile.profile.business || {},
      job: rawProfile.profile.job || {},
      contact: rawProfile.profile.contact || {},
      meta: rawProfile
    };
  }

  return {
    personal: rawProfile.personal || {},
    business: rawProfile.business || {},
    job: rawProfile.job || {},
    contact: rawProfile.contact || {},
    meta: rawProfile
  };
};

export const BloodSOSProvider = ({ children }) => {
  const { currentCity } = useCity();
  const { user } = useEnhancedAuth();

  const [activeRequests, setActiveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    let unsubscribe;

    if (!currentCity?.id) {
      setActiveRequests([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    setError(null);

    const cityRef = ref(db, `blood-sos/${currentCity.id}`);
    unsubscribe = onValue(
      cityRef,
      (snapshot) => {
        const data = snapshot.val();
        const parsed = data
          ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
          : [];

        const openRequests = parsed
          .filter((request) => request && request.isFulfilled === false)
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        setActiveRequests(openRequests);
        setError(null);
        setLoading(false);
      },
      (listenerError) => {
        console.error('Blood SOS listener error:', listenerError);
        setError(listenerError.message || 'Unable to load SOS requests.');
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentCity?.id]);

  useEffect(() => {
    let isMounted = true;

    if (!user?.uid) {
      setUserProfile(null);
      return () => {
        isMounted = false;
      };
    }

    const loadProfile = async () => {
      try {
        const profileSnapshot = await getUserProfile(user.uid);
        if (!isMounted) return;
        setUserProfile(normalizeProfile(profileSnapshot));
      } catch (profileError) {
        console.error('Failed to load user profile for SOS:', profileError);
        if (isMounted) {
          setUserProfile(normalizeProfile(null));
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const myActiveRequest = useMemo(() => {
    if (!user?.uid) return null;
    return activeRequests.find((request) => request.createdBy === user.uid) || null;
  }, [activeRequests, user?.uid]);

  const createSOSRequest = useCallback(
    async ({ bloodGroup, location, shareContact, notes }) => {
      if (!user?.uid) {
        throw new Error('You need to be logged in to request an SOS.');
      }

      if (!currentCity?.id) {
        throw new Error('Please select a city before creating an SOS.');
      }

      if (!bloodGroup) {
        throw new Error('Please choose the blood group you need.');
      }

      const normalizedLocation = (location || '').trim();
      const normalizedNotes = (notes || '').trim();

      if (!normalizedLocation) {
        throw new Error('Please provide the hospital or donation location.');
      }

      if (myActiveRequest) {
        throw new Error('You already have an active SOS request. Please mark it as fulfilled before creating a new one.');
      }

      const normalizedProfile = userProfile || normalizeProfile(null);
      const personalInfo = normalizedProfile.personal || {};
      const contactInfo = normalizedProfile.contact || {};
      const metaInfo = normalizedProfile.meta || {};

      const requesterName =
        personalInfo.preferredName ||
        personalInfo.fullName ||
        metaInfo.displayName ||
        user.displayName ||
        user.email ||
        'Community Member';

      const contactDetails = shareContact
        ? {
            name: requesterName,
            phone: contactInfo.primaryPhone || contactInfo.alternatePhone || metaInfo.phone || '',
            email: contactInfo.email || metaInfo.email || user.email || '',
            city: currentCity?.name || '',
            additional: contactInfo.address || ''
          }
        : null;

      const payload = {
        bloodGroup,
        location: normalizedLocation,
        shareContact,
        contactDetails,
        cityId: currentCity.id,
        cityName: currentCity?.name || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.uid,
        createdByName: requesterName,
        notes: normalizedNotes,
        isFulfilled: false,
        status: 'active'
      };

      setIsSubmitting(true);

      try {
        const collectionRef = ref(db, `blood-sos/${currentCity.id}`);
        const newRecordRef = push(collectionRef);
        await set(newRecordRef, payload);

        // Trigger server-side notification workflow if available
        try {
          await fetch('/api/sos/blood', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              requestId: newRecordRef.key,
              ...payload
            })
          });
        } catch (notifyError) {
          console.warn('Blood SOS notification API failed:', notifyError);
        }

        return { id: newRecordRef.key, ...payload };
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentCity?.id, currentCity?.name, myActiveRequest, user?.uid, user?.displayName, userProfile]
  );

  const markRequestFulfilled = useCallback(
    async (requestId) => {
      if (!requestId) {
        throw new Error('Missing SOS request identifier.');
      }

      if (!currentCity?.id) {
        throw new Error('City context unavailable for this SOS request.');
      }

      const requestRef = ref(db, `blood-sos/${currentCity.id}/${requestId}`);

      await update(requestRef, {
        isFulfilled: true,
        status: 'fulfilled',
        fulfilledAt: new Date().toISOString(),
        fulfilledBy: user?.uid || null,
        updatedAt: new Date().toISOString()
      });
    },
    [currentCity?.id, user?.uid]
  );

  const value = useMemo(
    () => ({
      activeRequests,
      hasActiveSOS: activeRequests.length > 0,
      loading,
      error,
      isSubmitting,
      createSOSRequest,
      markRequestFulfilled,
      myActiveRequest,
      currentCity,
      userProfile
    }),
    [activeRequests, createSOSRequest, error, isSubmitting, loading, markRequestFulfilled, myActiveRequest, currentCity, userProfile]
  );

  return <BloodSOSContext.Provider value={value}>{children}</BloodSOSContext.Provider>;
};
