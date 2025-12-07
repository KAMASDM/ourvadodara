// =============================================
// src/components/Profile/ContactVerificationModal.jsx
// Phone OTP and Email Verification for Profile
// =============================================
import React, { useState, useEffect } from 'react';
import { RecaptchaVerifier, PhoneAuthProvider, linkWithCredential, sendEmailVerification } from 'firebase/auth';
import { firebaseAuth } from '../../firebase-config';
import { Mail, Phone, Loader, CheckCircle, AlertCircle } from 'lucide-react';

const ContactVerificationModal = ({ 
  type, // 'phone' or 'email'
  value, // phone number or email
  user,
  onClose, 
  onVerified 
}) => {
  const [step, setStep] = useState(type === 'phone' ? 'send-otp' : 'send-email');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);

  // Initialize reCAPTCHA for phone verification
  useEffect(() => {
    if (type === 'phone' && !recaptchaVerifier) {
      try {
        const verifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container-profile', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA verified');
          },
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please try again.');
          }
        });
        setRecaptchaVerifier(verifier);
      } catch (err) {
        console.error('reCAPTCHA setup error:', err);
        setError('Failed to initialize verification. Please refresh the page.');
      }
    }

    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
    };
  }, [type]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendPhoneOTP = async () => {
    if (!recaptchaVerifier || !value) return;

    setIsProcessing(true);
    setError('');

    try {
      const phoneProvider = new PhoneAuthProvider(firebaseAuth);
      const verificationId = await phoneProvider.verifyPhoneNumber(value, recaptchaVerifier);
      
      setVerificationId(verificationId);
      setStep('verify-otp');
      setResendCooldown(60);
    } catch (err) {
      console.error('Phone OTP error:', err);
      if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format.');
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyPhoneOTP = async () => {
    if (!verificationId || !otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      
      // Link the phone number to the existing account
      await linkWithCredential(user, credential);
      
      // Success
      onVerified(value);
    } catch (err) {
      console.error('OTP verification error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please try again.');
      } else if (err.code === 'auth/credential-already-in-use') {
        setError('This phone number is already registered with another account. Please use a different number.');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('This phone number is already registered with another account. Please use a different number or sign in with that account.');
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendEmailVerification = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // For email, we need to use updateEmail first, then send verification
      const { updateEmail } = await import('firebase/auth');
      await updateEmail(user, value);
      await sendEmailVerification(user);
      
      setStep('check-email');
      setResendCooldown(60);
    } catch (err) {
      console.error('Email verification error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use by another account.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('Please sign out and sign in again before changing your email.');
      } else {
        setError('Failed to send verification email. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckEmailVerification = async () => {
    setIsProcessing(true);
    setError('');

    try {
      await user.reload();
      
      if (user.emailVerified) {
        onVerified(value);
      } else {
        setError('Email not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (err) {
      console.error('Email check error:', err);
      setError('Failed to check verification status.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    
    if (type === 'phone') {
      setStep('send-otp');
      handleSendPhoneOTP();
    } else {
      handleSendEmailVerification();
    }
  };

  return (
    <>
      <div id="recaptcha-container-profile"></div>
      
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              {type === 'phone' ? (
                <Phone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              ) : (
                <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verify {type === 'phone' ? 'Phone Number' : 'Email'}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {type === 'phone' ? value : value}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Phone OTP Flow */}
          {type === 'phone' && step === 'send-otp' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                Click below to receive a verification code via SMS
              </p>
              
              <button
                onClick={handleSendPhoneOTP}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <span>Send OTP</span>
                )}
              </button>
            </div>
          )}

          {type === 'phone' && step === 'verify-otp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleVerifyPhoneOTP}
                disabled={isProcessing || otp.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify OTP</span>
                )}
              </button>

              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>
          )}

          {/* Email Verification Flow */}
          {type === 'email' && step === 'send-email' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                We'll send a verification link to this email address
              </p>
              
              <button
                onClick={handleSendEmailVerification}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Verification Email</span>
                )}
              </button>
            </div>
          )}

          {type === 'email' && step === 'check-email' && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  ✉️ Check your inbox and click the verification link
                </p>
              </div>

              <button
                onClick={handleCheckEmailVerification}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>I've Verified</span>
                  </>
                )}
              </button>

              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
              </button>
            </div>
          )}

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="w-full mt-4 py-3 px-4 rounded-lg font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default ContactVerificationModal;
