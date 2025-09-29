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
import { updateProfile } from 'firebase/auth';
import { getUserProfile, createAdminUser, createUserProfile } from '../../utils/adminSetup';

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

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, get their profile with role information
        try {
          let userProfile = await getUserProfile(firebaseUser.uid);
          
          // If no profile exists, create a basic one
          if (!userProfile) {
            const { createUserProfile } = await import('../../utils/adminSetup');
            await createUserProfile(firebaseUser.uid, {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName
            });
            userProfile = await getUserProfile(firebaseUser.uid);
          }
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || userProfile?.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            role: userProfile?.role || 'user',
            permissions: userProfile?.permissions || {}
          });
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Fallback to basic user data
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            role: 'user',
            permissions: {}
          });
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

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
      const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      
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

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    createAdmin,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};