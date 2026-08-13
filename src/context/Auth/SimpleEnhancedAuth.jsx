// =============================================
// src/context/Auth/SimpleEnhancedAuth.jsx
// Simplified Enhanced Authentication Context for Testing
// =============================================
import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  linkWithPopup,
  signInWithPhoneNumber,
  signInWithPopup
} from 'firebase/auth';
import { useAuth } from './AuthContext';
import { firebaseAuth } from '../../firebase-config';
import { runAnonymousRegistrationSecurityCheck, runRegistrationSecurityCheck } from '../../utils/registrationSecurity';

const SimpleEnhancedAuthContext = createContext();

const getPasswordResetErrorMessage = (error) => {
  switch (error?.code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many reset attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Unable to connect. Check your internet connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Password reset is temporarily unavailable. Please contact support.';
    default:
      return 'We could not send the password reset email. Please try again.';
  }
};

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
  const clearError = useCallback(() => setAuthError(null), []);

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
      // Invoke the statically loaded provider directly. The old dynamic
      // imports yielded before opening the popup, which consumes the trusted
      // tap gesture on iOS and makes the first attempt appear stuck.
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
      await runAnonymousRegistrationSecurityCheck();
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
      const safeEmail = await runRegistrationSecurityCheck(email);
      const { linkWithCredential, EmailAuthProvider, updateProfile } = await import('firebase/auth');
      const { firebaseAuth } = await import('../../firebase-config');
      
      const credential = EmailAuthProvider.credential(safeEmail, password);
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
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  const setupRecaptcha = async () => {
    // Firebase provisions and manages the reCAPTCHA keys required for Phone
    // Auth. A separate Enterprise script must not gate the OTP button.
    if (!document.getElementById('recaptcha-container')) {
      setRecaptchaReady(false);
      throw new Error('Phone verification is still loading. Please try again.');
    }
    setRecaptchaReady(true);
    return true;
  };

  const clearPhoneRecaptcha = () => {
    if (!window.__ovRecaptchaVerifier) return;
    try {
      window.__ovRecaptchaVerifier.clear();
    } catch (clearError) {
      console.warn('Error clearing phone reCAPTCHA verifier:', clearError);
    }
    window.__ovRecaptchaVerifier = null;
  };

  const signInWithPhone = async (phoneNumber) => {
    setLoading(true);
    setAuthError(null);

    try {
      const digits = String(phoneNumber || '').replace(/\D/g, '');
      const formattedPhone = digits.length === 12 && digits.startsWith('91')
        ? `+${digits}`
        : digits.length === 10
          ? `+91${digits}`
          : '';
      if (!/^\+91[6-9]\d{9}$/.test(formattedPhone)) {
        const invalidPhoneError = new Error('Please enter a valid 10-digit Indian mobile number.');
        invalidPhoneError.code = 'auth/invalid-phone-number';
        throw invalidPhoneError;
      }

      await setupRecaptcha();

      // A RecaptchaVerifier can only be rendered once per element — clear
      // any previous instance or every retry fails with
      // "reCAPTCHA has already been rendered in this element".
      clearPhoneRecaptcha();

      const verifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
        size: 'invisible',
        'expired-callback': clearPhoneRecaptcha
      });
      window.__ovRecaptchaVerifier = verifier;

      // Pre-rendering surfaces domain/configuration failures immediately and
      // avoids losing the initiating tap while the verifier initializes.
      await verifier.render();

      const confirmation = await signInWithPhoneNumber(firebaseAuth, formattedPhone, verifier);
      setConfirmationResult(confirmation);
      clearPhoneRecaptcha();

      console.log('📱 OTP sent successfully');
      return { success: true, confirmationResult: confirmation };
    } catch (error) {
      console.error('Phone sign-in error:', error);

      // A failed attempt leaves the verifier in an unusable state — clear it
      // so the user can retry without reloading the page.
      clearPhoneRecaptcha();

      let errorMessage = 'Failed to send OTP. Please try again.';

      if (error.code === 'auth/invalid-phone-number' || error.code === 'auth/missing-phone-number') {
        errorMessage = 'Please enter a valid 10-digit Indian mobile number.';
      } else if (error.code === 'auth/too-many-requests' || error.code === 'auth/quota-exceeded') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (error.code === 'auth/captcha-check-failed' || error.code === 'auth/missing-recaptcha-token') {
        errorMessage = 'reCAPTCHA verification failed. Please try again.';
      } else if (error.code === 'auth/billing-not-enabled') {
        errorMessage = 'Phone sign-in requires the Firebase Blaze plan (SMS billing). Please enable billing in the Firebase Console.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'Phone sign-in is not authorized for this domain. Please contact support.';
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
      const safeEmail = await runRegistrationSecurityCheck(email);
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const { firebaseAuth } = await import('../../firebase-config');
      
      const result = await createUserWithEmailAndPassword(firebaseAuth, safeEmail, password);
      
      // Update display name if provided
      if (displayName) {
        await updateProfile(result.user, {
          displayName: displayName
        });
      }
      
      console.log('Email sign-up successful:', result.user.uid);
      return result; // Return the full credential
    } catch (error) {
      console.error('Email sign-up error:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Password reset must live in this provider because it is the provider
  // mounted by App.jsx and consumed by EnhancedLogin.
  const resetPassword = async (email) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    setLoading(true);
    setAuthError(null);

    try {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        const invalidEmailError = new Error('Please enter a valid email address.');
        invalidEmailError.code = 'auth/invalid-email';
        throw invalidEmailError;
      }

      const { sendPasswordResetEmail } = await import('firebase/auth');
      const { firebaseAuth } = await import('../../firebase-config');
      await sendPasswordResetEmail(firebaseAuth, normalizedEmail);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      const message = getPasswordResetErrorMessage(error);
      setAuthError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async (phoneNumber) => {
    return signInWithPhone(phoneNumber);
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
    resetPassword,
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
    
    clearError
  };

  return (
    <SimpleEnhancedAuthContext.Provider value={value}>
      {children}
    </SimpleEnhancedAuthContext.Provider>
  );
};
