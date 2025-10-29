// =============================================
// src/context/Auth/SimpleEnhancedAuth.jsx
// Simplified Enhanced Authentication Context for Testing
// =============================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SimpleEnhancedAuthContext = createContext();

export const useEnhancedAuth = () => {
  const context = useContext(SimpleEnhancedAuthContext);
  if (!context) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider');
  }
  return context;
};

export const EnhancedAuthProvider = ({ children }) => {
  // For now, just pass through the regular auth
  const regularAuth = useAuth();
  
  // Add some enhanced features
  const [authError, setAuthError] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if current user is anonymous
  useEffect(() => {
    if (regularAuth?.user) {
      setIsAnonymous(regularAuth.user.isAnonymous || false);
    }
  }, [regularAuth?.user]);

  // Enhanced sign-in with Google
  const signInWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const { firebaseAuth } = await import('../../firebase-config');
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(firebaseAuth, provider);
      const user = result.user;
      
      console.log('Google sign-in successful:', user.uid);
      return { user, success: true };
    } catch (error) {
      console.error('Google sign-in error:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Anonymous sign-in implementation
  const signInAnonymouslyAsGuest = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const { signInAnonymously } = await import('firebase/auth');
      const { firebaseAuth } = await import('../../firebase-config');
      
      const result = await signInAnonymously(firebaseAuth);
      const user = result.user;
      
      console.log('Anonymous sign-in successful:', user.uid);
      return { user, success: true };
    } catch (error) {
      console.error('Anonymous sign-in error:', error);
      
      // If anonymous auth is not enabled, show setup guide
      if (error.code === 'auth/admin-restricted-operation') {
        const message = 'Anonymous authentication is not enabled. Please check Firebase setup.';
        setAuthError(message);
        
        // Trigger Firebase setup guide
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('showFirebaseSetup'));
        }, 1000);
        
        throw new Error(message);
      }
      
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Link anonymous account with email/password
  const linkAnonymousWithEmail = async (email, password, displayName) => {
    if (!regularAuth?.user?.isAnonymous) {
      throw new Error('User is not anonymous or not logged in');
    }

    setLoading(true);
    setAuthError(null);
    try {
      const { linkWithCredential, EmailAuthProvider, updateProfile } = await import('firebase/auth');
      const { firebaseAuth } = await import('../../firebase-config');
      
      const credential = EmailAuthProvider.credential(email, password);
      const result = await linkWithCredential(firebaseAuth.currentUser, credential);
      
      // Update display name if provided
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      console.log('Account linked successfully:', result.user.uid);
      return { user: result.user, success: true };
    } catch (error) {
      console.error('Link account error:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Link anonymous account with Google
  const linkAnonymousWithGoogle = async () => {
    if (!regularAuth?.user?.isAnonymous) {
      throw new Error('User is not anonymous or not logged in');
    }

    setLoading(true);
    setAuthError(null);
    try {
      const { linkWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const { firebaseAuth } = await import('../../firebase-config');
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await linkWithPopup(firebaseAuth.currentUser, provider);
      
      console.log('Google account linked successfully:', result.user.uid);
      return { user: result.user, success: true };
    } catch (error) {
      console.error('Google link error:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Phone authentication functions
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  const setupRecaptcha = async () => {
    try {
      // Wait for reCAPTCHA Enterprise to be ready
      return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.grecaptcha) {
          reject(new Error('reCAPTCHA Enterprise not loaded'));
          return;
        }

        window.grecaptcha.enterprise.ready(async () => {
          try {
            console.log('🔒 reCAPTCHA Enterprise ready');
            setRecaptchaReady(true);
            resolve(window.grecaptcha.enterprise);
          } catch (error) {
            console.error('reCAPTCHA Enterprise setup error:', error);
            setRecaptchaReady(false);
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('reCAPTCHA setup error:', error);
      setAuthError('Failed to setup phone verification. Please try again.');
      throw error;
    }
  };

  const signInWithPhone = async (phoneNumber) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      // Get reCAPTCHA Enterprise token
      const grecaptcha = await setupRecaptcha();
      const recaptchaToken = await grecaptcha.execute('6LeXXPsrAAAAAJEpQ2J-1TPTTmNvE5G8U1GSWsVQ', {
        action: 'PHONE_LOGIN'
      });
      
      console.log('🔒 reCAPTCHA token generated for phone auth');
      
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth');
      const { firebaseAuth } = await import('../../firebase-config');
      
      // Create a RecaptchaVerifier for Firebase using the Enterprise token
      const verifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA Enterprise callback triggered');
        }
      });
      
      // Format phone number (ensure it starts with country code)
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        // Assume Indian number if no country code
        formattedPhone = '+91' + formattedPhone.replace(/^0/, '');
      }
      
      const confirmation = await signInWithPhoneNumber(firebaseAuth, formattedPhone, verifier);
      setConfirmationResult(confirmation);
      
      console.log('📱 OTP sent successfully');
      return { success: true, confirmationResult: confirmation };
    } catch (error) {
      console.error('Phone sign-in error:', error);
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Please use format: +91XXXXXXXXXX';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'reCAPTCHA verification failed. Please try again.';
      } else if (error.code === 'auth/invalid-app-credential') {
        errorMessage = 'Phone authentication is not properly configured. Please check Firebase setup.';
        
        // Trigger Firebase setup guide after a short delay
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('showFirebaseSetup'));
        }, 1000);
      } else if (error.code === 'auth/app-not-authorized') {
        errorMessage = 'Phone authentication is not enabled for this app. Please enable it in Firebase Console.';
        
        // Trigger Firebase setup guide
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('showFirebaseSetup'));
        }, 1000);
      }
      
      // For development/demo purposes, if phone auth is not configured, 
      // provide a way to simulate the flow
      if (error.code === 'auth/invalid-app-credential' || error.code === 'auth/app-not-authorized') {
        console.log('📱 Phone authentication not configured - showing setup guide');
        setAuthError('Phone authentication requires Firebase configuration. Please check the setup guide.');
      } else {
        setAuthError(errorMessage);
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneCode = async (code) => {
    if (!confirmationResult) {
      throw new Error('No verification in progress. Please request OTP first.');
    }
    
    setLoading(true);
    setAuthError(null);
    
    try {
      const result = await confirmationResult.confirm(code);
      const user = result.user;
      
      console.log('Phone verification successful:', user.uid);
      setConfirmationResult(null);
      
      return { user, success: true };
    } catch (error) {
      console.error('Phone verification error:', error);
      
      let errorMessage = 'Invalid verification code. Please try again.';
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP. Please check and try again.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'OTP has expired. Please request a new one.';
      }
      
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced email authentication methods
  const signInWithEmail = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { firebaseAuth } = await import('../../firebase-config');
      
      const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
      console.log('Email sign-in successful:', result.user.uid);
      return { user: result.user, success: true };
    } catch (error) {
      console.error('Email sign-in error:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email, password, displayName) => {
    setLoading(true);
    setAuthError(null);
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const { firebaseAuth } = await import('../../firebase-config');
      
      const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      
      // Update display name if provided
      if (displayName) {
        await updateProfile(result.user, {
          displayName: displayName
        });
      }
      
      console.log('Email sign-up successful:', result.user.uid);
      return { user: result.user, success: true };
    } catch (error) {
      console.error('Email sign-up error:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async (phoneNumber) => {
    if (recaptchaVerifier) {
      return await signInWithPhone(phoneNumber, recaptchaVerifier);
    } else {
      throw new Error('Please setup reCAPTCHA first');
    }
  };

  const value = {
    ...regularAuth,
    authError,
    isAnonymous,
    loading: loading || regularAuth?.loading,
    
    // Enhanced methods
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAnonymouslyAsGuest,
    linkAnonymousWithEmail,
    linkAnonymousWithGoogle,
    
    // Phone authentication implementation
    setupRecaptcha,
    signInWithPhone,
    verifyPhoneCode,
    resendOTP,
    confirmationResult,
    recaptchaReady,
    
    // Role checks
    isAdmin: regularAuth?.user?.role === 'admin',
    isEditor: regularAuth?.user?.role === 'editor' || regularAuth?.user?.role === 'admin',
    isModerator: regularAuth?.user?.role === 'moderator' || regularAuth?.user?.role === 'editor' || regularAuth?.user?.role === 'admin',
    
    clearError: () => setAuthError(null)
  };

  return (
    <SimpleEnhancedAuthContext.Provider value={value}>
      {children}
    </SimpleEnhancedAuthContext.Provider>
  );
};