// =============================================
// src/components/Auth/EmailVerificationModal.jsx
// Email Verification Modal with Real-time Tracking
// =============================================
import React, { useState, useEffect } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { Mail, CheckCircle, Loader, RefreshCw } from 'lucide-react';

const EmailVerificationModal = ({ user, onClose, onVerified }) => {
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, verified

  // Check verification status every 3 seconds
  useEffect(() => {
    if (!user) return;

    const checkInterval = setInterval(async () => {
      setIsCheckingVerification(true);
      try {
        await user.reload();
        if (user.emailVerified) {
          setVerificationStatus('verified');
          clearInterval(checkInterval);
          
          // Show success message for 2 seconds then redirect
          setTimeout(() => {
            if (onVerified) {
              onVerified();
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking verification:', error);
      } finally {
        setIsCheckingVerification(false);
      }
    }, 3000);

    return () => clearInterval(checkInterval);
  }, [user, onVerified]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !user) return;

    setIsResending(true);
    try {
      await sendEmailVerification(user);
      setResendCooldown(60); // 60 second cooldown
      alert('✅ Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Error resending verification:', error);
      if (error.code === 'auth/too-many-requests') {
        alert('⚠️ Too many requests. Please wait a few minutes before trying again.');
      } else {
        alert('❌ Failed to send verification email. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  if (verificationStatus === 'verified') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Email Verified! 🎉
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Thank you for verifying your email. You can now access all features!
          </p>
          
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Loader className="w-4 h-4 animate-spin" />
            <span>Redirecting to login...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Verify Your Email
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            We've sent a verification link to:
          </p>
          <p className="text-blue-600 dark:text-blue-400 font-semibold mt-1">
            {user?.email}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            📧 <strong>Check your inbox</strong> and click the verification link.
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            🔍 Don't see it? Check your <strong>spam folder</strong>.
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {isCheckingVerification ? (
              <span className="flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin text-blue-600" />
                <span>Checking verification status...</span>
              </span>
            ) : (
              <span>✨ This page will auto-update when you verify.</span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleResendEmail}
            disabled={isResending || resendCooldown > 0}
            className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-semibold transition-all ${
              resendCooldown > 0
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isResending ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : resendCooldown > 0 ? (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>Resend in {resendCooldown}s</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>Resend Verification Email</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-lg font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            I'll Verify Later
          </button>
        </div>

        {/* Helper Text */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
          💡 Tip: Keep this window open while you check your email
        </p>
      </div>
    </div>
  );
};

export default EmailVerificationModal;
