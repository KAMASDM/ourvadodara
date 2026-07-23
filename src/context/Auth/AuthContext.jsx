// =============================================
// src/context/Auth/AuthContext.jsx
// Authentication Context with Real Firebase Authentication
// =============================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  firebaseAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from '../../firebase-config';
import { updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { onValue, ref } from 'firebase/database';
import { db } from '../../firebase-config';
import { getUserProfile, createAdminUser } from '../../utils/adminSetup';
import { checkProfileCompletion, getAuthMethod, getAuthContactInfo } from '../../utils/profileHelpers';
import { requiresEmailVerification } from '../../utils/authVerification';
import { runRegistrationSecurityCheck } from '../../utils/registrationSecurity';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState({ isComplete: true, missingFields: [] });

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        // Email/password accounts created after the verification policy
        // shipped must verify their email before they get an app session.
        // The Firebase session is kept alive (needed to send / poll the
        // verification email), but the app treats them as signed out until
        // they verify and sign in again. Older accounts are grandfathered.
        if (requiresEmailVerification(firebaseUser)) {
          setUser(null);
          setProfileCompletion({ isComplete: true, missingFields: [] });
          setLoading(false);
          return;
        }

        // User is signed in, get their profile with role information
        try {
          let userProfile = await getUserProfile(firebaseUser.uid);
          
          // Determine auth method
          const authMethod = getAuthMethod(firebaseUser);
          const authContactInfo = getAuthContactInfo(firebaseUser, authMethod);
          
          // If no profile exists, create a basic one
          if (!userProfile) {
            const { createUserProfile } = await import('../../utils/adminSetup');
            await createUserProfile(firebaseUser.uid, {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              authMethod,
              authPhone: authContactInfo.phone,
              authEmail: authContactInfo.email
            });
            userProfile = await getUserProfile(firebaseUser.uid);
          }
          
          // Check profile completion
          // Brand accounts are provisioned by an administrator and do not use
          // the consumer profile-completion flow.
          const completionStatus = userProfile?.role === 'brand'
            ? { isComplete: true, missingFields: [] }
            : checkProfileCompletion(userProfile);
          setProfileCompletion(completionStatus);
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            phoneNumber: firebaseUser.phoneNumber,
            displayName: firebaseUser.displayName || userProfile?.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            isAnonymous: firebaseUser.isAnonymous,
            role: userProfile?.role || 'user',
            status: userProfile?.status || 'active',
            brandId: userProfile?.brandId || null,
            permissions: userProfile?.permissions || {},
            authMethod: userProfile?.authMethod || authMethod,
            authPhone: userProfile?.authPhone || authContactInfo.phone,
            authEmail: userProfile?.authEmail || authContactInfo.email,
            profileComplete: completionStatus.isComplete
          });
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Fallback to basic user data
          const authMethod = getAuthMethod(firebaseUser);
          const authContactInfo = getAuthContactInfo(firebaseUser, authMethod);
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            phoneNumber: firebaseUser.phoneNumber,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            isAnonymous: firebaseUser.isAnonymous,
            role: 'user',
            status: 'active',
            permissions: {},
            authMethod,
            authPhone: authContactInfo.phone,
            authEmail: authContactInfo.email,
            profileComplete: false
          });
          setProfileCompletion({ isComplete: false, missingFields: ['Profile information'] });
        }
      } else {
        // User is signed out
        setUser(null);
        setProfileCompletion({ isComplete: true, missingFields: [] });
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Keep permissions and account status live. Disabling a user in the Admin
  // Panel therefore removes the current app session immediately instead of
  // waiting for an ID token to expire.
  useEffect(() => {
    if (!user?.uid) return undefined;
    return onValue(ref(db, `users/${user.uid}`), async snapshot => {
      const profile = snapshot.val();
      if (!profile) return;
      const status = profile.status || 'active';
      if (status === 'inactive' || status === 'suspended') {
        await signOut(firebaseAuth).catch(() => {});
        setUser(null);
        return;
      }
      setUser(current => current ? {
        ...current,
        role: profile.role || 'user',
        status,
        permissions: profile.permissions || {},
        brandId: profile.brandId || null
      } : current);
    });
  }, [user?.uid]);

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
      return { user: result.user };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, displayName) => {
    setLoading(true);
    try {
      const safeEmail = await runRegistrationSecurityCheck(email);
      const result = await createUserWithEmailAndPassword(firebaseAuth, safeEmail, password);
      
      // Update the user's display name if provided
      if (displayName && result.user) {
        await updateProfile(result.user, {
          displayName: displayName
        });
      }
      
      return { user: result.user };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      const result = await signInWithPopup(firebaseAuth, provider);
      
      // Create or update user profile
      if (result.user) {
        const { createUserProfile } = await import('../../utils/adminSetup');
        await createUserProfile(result.user.uid, {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          provider: 'google'
        });
      }
      
      return { user: result.user };
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(firebaseAuth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to create admin user
  const createAdmin = async (email, password, displayName = 'Admin User') => {
    try {
      const result = await signUp(email, password, displayName);
      if (result.user) {
        // Create admin profile in database
        await createAdminUser(result.user.uid, email);
        return result;
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  };

  // Check if current user is admin
  const isAdmin = user?.role === 'admin';
  
  // Function to refresh profile completion status
  const refreshProfileCompletion = async () => {
    if (!user?.uid) return;
    
    try {
      const userProfile = await getUserProfile(user.uid);
      const completionStatus = checkProfileCompletion(userProfile);
      setProfileCompletion(completionStatus);
      
      // Update user object with new completion status
      setUser(prev => ({
        ...prev,
        profileComplete: completionStatus.isComplete
      }));
      
      return completionStatus;
    } catch (error) {
      console.error('Error refreshing profile completion:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    createAdmin,
    isAdmin,
    profileCompletion,
    refreshProfileCompletion
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
