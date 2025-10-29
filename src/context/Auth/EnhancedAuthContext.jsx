// =============================================
// src/context/Auth/EnhancedAuthContext.jsx
// Enhanced Authentication Context with Multiple Providers
// =============================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  firebaseAuth, 
  googleProvider,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInAnonymously,
  linkWithCredential,
  EmailAuthProvider,
  PhoneAuthProvider,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from '../../firebase-config';
import { getUserProfile, createAdminUser, createUserProfile, updateUserProfile } from '../../utils/adminSetup';

const EnhancedAuthContext = createContext();

export const useEnhancedAuth = () => {
  const context = useContext(EnhancedAuthContext);
  if (!context) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider');
  }
  return context;
};

export const EnhancedAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setLoading(true);
      setAuthError(null);

      if (firebaseUser) {
        try {
          // Check if user is anonymous
          const isUserAnonymous = firebaseUser.isAnonymous;
          setIsAnonymous(isUserAnonymous);

          let userProfile = null;
          
          // Only fetch profile for non-anonymous users
          if (!isUserAnonymous) {
            userProfile = await getUserProfile(firebaseUser.uid);
            
            // If no profile exists, create a basic one
            if (!userProfile) {
              await createUserProfile(firebaseUser.uid, {
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                phoneNumber: firebaseUser.phoneNumber,
                isAnonymous: false,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
              });
              userProfile = await getUserProfile(firebaseUser.uid);
            } else {
              // Update last login
              await updateUserProfile(firebaseUser.uid, {
                lastLogin: new Date().toISOString()
              });
            }
          }
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || userProfile?.displayName,
            photoURL: firebaseUser.photoURL,
            phoneNumber: firebaseUser.phoneNumber,
            emailVerified: firebaseUser.emailVerified,
            isAnonymous: isUserAnonymous,
            role: userProfile?.role || 'user',
            permissions: userProfile?.permissions || {},
            providerData: firebaseUser.providerData,
            metadata: {
              creationTime: firebaseUser.metadata.creationTime,
              lastSignInTime: firebaseUser.metadata.lastSignInTime
            }
          });
        } catch (error) {
          console.error('Error loading user profile:', error);
          setAuthError('Failed to load user profile');
          
          // Fallback to basic user data
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            phoneNumber: firebaseUser.phoneNumber,
            emailVerified: firebaseUser.emailVerified,
            isAnonymous: firebaseUser.isAnonymous,
            role: 'user',
            permissions: {},
            providerData: firebaseUser.providerData
          });
        }
      } else {
        // User is signed out
        setUser(null);
        setIsAnonymous(false);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Email/Password Sign In
  const signInWithEmail = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
      return { user: result.user, success: true };
    } catch (error) {
      console.error('Email sign in error:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Email/Password Sign Up
  const signUpWithEmail = async (email, password, displayName) => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      
      // Update the user's display name if provided
      if (displayName && result.user) {
        await updateProfile(result.user, {
          displayName: displayName
        });
      }

      // Send email verification
      await sendEmailVerification(result.user);
      
      return { user: result.user, success: true };
    } catch (error) {
      console.error('Email sign up error:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Google Sign In
  const signInWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      return { user: result.user, success: true };
    } catch (error) {
      console.error('Google sign in error:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Phone Authentication Setup
  const setupRecaptcha = (containerId) => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
          size: 'invisible',
          callback: (response) => {
            console.log('reCAPTCHA solved');
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            window.recaptchaVerifier = null;
          }
        });
      }
      return window.recaptchaVerifier;
    } catch (error) {
      console.error('reCAPTCHA setup error:', error);
      throw error;
    }
  };

  // Send Phone OTP
  const sendPhoneOTP = async (phoneNumber, recaptchaVerifier) => {
    setLoading(true);
    setAuthError(null);
    try {
      const confirmationResult = await signInWithPhoneNumber(
        firebaseAuth, 
        phoneNumber, 
        recaptchaVerifier
      );
      return { confirmationResult, success: true };
    } catch (error) {
      console.error('Phone OTP send error:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Verify Phone OTP
  const verifyPhoneOTP = async (confirmationResult, otp) => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await confirmationResult.confirm(otp);
      return { user: result.user, success: true };
    } catch (error) {
      console.error('Phone OTP verify error:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Anonymous Sign In (Guest Mode)
  const signInAnonymouslyAsGuest = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await signInAnonymously(firebaseAuth);
      return { user: result.user, success: true };
    } catch (error) {
      console.error('Anonymous sign in error:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Link Anonymous Account with Email/Password
  const linkAnonymousWithEmail = async (email, password) => {
    if (!user || !user.isAnonymous) {
      throw new Error('User is not anonymous or not logged in');
    }

    setLoading(true);
    setAuthError(null);
    try {
      const credential = EmailAuthProvider.credential(email, password);
      const result = await linkWithCredential(firebaseAuth.currentUser, credential);
      return { user: result.user, success: true };
    } catch (error) {
      console.error('Link anonymous account error:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Link Anonymous Account with Phone
  const linkAnonymousWithPhone = async (phoneNumber, recaptchaVerifier) => {
    if (!user || !user.isAnonymous) {
      throw new Error('User is not anonymous or not logged in');
    }

    setLoading(true);
    setAuthError(null);
    try {
      const confirmationResult = await signInWithPhoneNumber(
        firebaseAuth, 
        phoneNumber, 
        recaptchaVerifier
      );
      return { confirmationResult, success: true };
    } catch (error) {
      console.error('Link anonymous with phone error:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Password Reset
  const resetPassword = async (email) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      setAuthError(error.message);
      throw error;
    }
  };

  // Sign Out
  const logout = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await signOut(firebaseAuth);
      setUser(null);
      setIsAnonymous(false);
      // Clean up reCAPTCHA verifier
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to create admin user
  const createAdmin = async (email, password, displayName = 'Admin User') => {
    try {
      const result = await signUpWithEmail(email, password, displayName);
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
  const isEditor = user?.role === 'editor' || isAdmin;
  const isModerator = user?.role === 'moderator' || isEditor;

  const value = {
    // User state
    user,
    loading,
    authError,
    isAnonymous,
    
    // Auth methods
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInAnonymouslyAsGuest,
    
    // Phone auth methods
    setupRecaptcha,
    sendPhoneOTP,
    verifyPhoneOTP,
    
    // Account linking
    linkAnonymousWithEmail,
    linkAnonymousWithPhone,
    
    // Utility methods
    resetPassword,
    logout,
    createAdmin,
    
    // Role checks
    isAdmin,
    isEditor,
    isModerator,
    
    // Clear error
    clearError: () => setAuthError(null)
  };

  return (
    <EnhancedAuthContext.Provider value={value}>
      {children}
    </EnhancedAuthContext.Provider>
  );
};