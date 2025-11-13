// =============================================
// src/components/Auth/EnhancedLogin.jsx
// Multi-Provider Authentication Component
// =============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEnhancedAuth } from '../../context/Auth/SimpleEnhancedAuth';
import { 
  Mail, 
  Lock, 
  Phone, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle,
  AlertCircle,
  Loader,
  Shield,
  UserPlus
} from 'lucide-react';
import GoogleIcon from '../Icons/GoogleIcon';
import LoadingSpinner from '../Common/LoadingSpinner';

const EnhancedLogin = ({ onClose, defaultMode = 'signin' }) => {
  const { t } = useTranslation();
  const {
    user,
    loading,
    authError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInAnonymouslyAsGuest,
    setupRecaptcha,
    signInWithPhone,
    verifyPhoneCode,
    confirmationResult,
    recaptchaReady,
    resetPassword,
    clearError
  } = useEnhancedAuth();

  const [mode, setMode] = useState(defaultMode); // signin, signup, phone, reset
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState('');
  const [phoneStep, setPhoneStep] = useState('number'); // number, otp

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    phoneNumber: '',
    otp: ''
  });

  // Clear errors when mode changes
  useEffect(() => {
    clearError();
    setSuccess('');
  }, [mode, clearError]);

  // Close modal if user is logged in
  useEffect(() => {
    if (user && !user.isAnonymous) {
      onClose?.();
    }
  }, [user, onClose]);

  // Initialize reCAPTCHA when phone mode is selected
  useEffect(() => {
    if (mode === 'phone' && !recaptchaReady) {
      setupRecaptcha().catch(err => {
        console.error('Failed to setup reCAPTCHA:', err);
      });
    }
  }, [mode, recaptchaReady, setupRecaptcha]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (authError) clearError();
  };

  const validateForm = () => {
    if (mode === 'signup') {
      if (!formData.displayName.trim()) {
        throw new Error('Display name is required');
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
    }
    
    if (mode === 'signin' || mode === 'signup') {
      if (!formData.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      if (!formData.password) {
        throw new Error('Password is required');
      }
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setSuccess('');

    try {
      validateForm();

      if (mode === 'signin') {
        await signInWithEmail(formData.email, formData.password);
        
        // Store auth method in user profile
        const { updateUserProfile } = await import('../../utils/adminSetup');
        const { firebaseAuth } = await import('../../firebase-config');
        if (firebaseAuth.currentUser) {
          await updateUserProfile(firebaseAuth.currentUser.uid, {
            authMethod: 'email',
            authEmail: formData.email
          });
        }
        
        setSuccess('✅ Successfully signed in!');
        setTimeout(() => {
          onClose?.();
        }, 1500);
      } else if (mode === 'signup') {
        await signUpWithEmail(formData.email, formData.password, formData.displayName);
        
        // Store auth method in user profile
        const { updateUserProfile } = await import('../../utils/adminSetup');
        const { firebaseAuth } = await import('../../firebase-config');
        if (firebaseAuth.currentUser) {
          await updateUserProfile(firebaseAuth.currentUser.uid, {
            authMethod: 'email',
            authEmail: formData.email
          });
        }
        
        setSuccess('✅ Account created! Please check your email for verification.');
        setTimeout(() => {
          onClose?.();
        }, 2000);
      }
    } catch (error) {
      console.error('Email auth error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsProcessing(true);
    try {
      await signInWithGoogle();
      
      // Store auth method in user profile
      const { updateUserProfile } = await import('../../utils/adminSetup');
      const { firebaseAuth } = await import('../../firebase-config');
      if (firebaseAuth.currentUser) {
        await updateUserProfile(firebaseAuth.currentUser.uid, {
          authMethod: 'google',
          authEmail: firebaseAuth.currentUser.email
        });
      }
      
      setSuccess('✅ Successfully signed in with Google!');
      setTimeout(() => {
        onClose?.();
      }, 1500);
    } catch (error) {
      console.error('Google auth error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePhoneAuth = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    clearError();

    try {
      if (phoneStep === 'number') {
        // Send OTP using reCAPTCHA Enterprise
        await signInWithPhone(formData.phoneNumber);
        setPhoneStep('otp');
        setSuccess('📱 OTP sent to your phone!');
      } else {
        // Verify OTP
        await verifyPhoneCode(formData.otp);
        
        // Store auth method in user profile
        const { updateUserProfile } = await import('../../utils/adminSetup');
        const { firebaseAuth } = await import('../../firebase-config');
        if (firebaseAuth.currentUser) {
          await updateUserProfile(firebaseAuth.currentUser.uid, {
            authMethod: 'phone',
            authPhone: formData.phoneNumber
          });
        }
        
        setSuccess('✅ Successfully signed in with phone!');
        setTimeout(() => {
          onClose?.();
        }, 1500);
      }
    } catch (error) {
      console.error('Phone auth error:', error);
      setSuccess('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGuestMode = async () => {
    setIsProcessing(true);
    try {
      await signInAnonymouslyAsGuest();
      setSuccess('Signed in as guest!');
    } catch (error) {
      console.error('Guest auth error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (!formData.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      await resetPassword(formData.email);
      setSuccess('Password reset email sent!');
    } catch (error) {
      console.error('Password reset error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderEmailForm = () => (
    <form onSubmit={handleEmailAuth} className="space-y-4">
      {mode === 'signup' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('auth.displayName')}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder={t('auth.enterDisplayName')}
              required
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('auth.email')}
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder={t('auth.enterEmail')}
            required
          />
        </div>
      </div>

      {mode !== 'reset' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('auth.password')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder={t('auth.enterPassword')}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      )}

      {mode === 'signup' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('auth.confirmPassword')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder={t('auth.confirmPassword')}
              required
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors duration-200"
      >
        {isProcessing ? (
          <Loader className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <span>
              {mode === 'signin' && t('auth.signIn')}
              {mode === 'signup' && t('auth.signUp')}
              {mode === 'reset' && t('auth.resetPassword')}
            </span>
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>
    </form>
  );

  const renderPhoneForm = () => (
    <form onSubmit={handlePhoneAuth} className="space-y-4">
      {phoneStep === 'number' ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.phoneNumber')}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 h-5 w-5 flex items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">🇮🇳</span>
              </div>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => {
                  let value = e.target.value;
                  // Auto-format Indian phone numbers
                  if (!value.startsWith('+91') && value.length > 0) {
                    value = '+91' + value.replace(/^\+91/, '').replace(/[^\d]/g, '');
                  }
                  handleInputChange({ target: { name: 'phoneNumber', value } });
                }}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="+91 9876543210"
                maxLength="14"
                required
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter your Indian mobile number with country code
            </p>
          </div>
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-200 flex items-center gap-1">
              {recaptchaReady ? (
                <>🔒 <strong>Secured by reCAPTCHA Enterprise:</strong> Security system ready</>
              ) : (
                <>⏳ <strong>Loading security system...</strong> Please wait</>
              )}
            </p>
          </div>
          <div id="recaptcha-container" className="hidden"></div>
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('auth.otpCode')}
          </label>
          <div className="relative">
            <Shield className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              name="otp"
              value={formData.otp}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-center text-lg tracking-widest"
              placeholder="123456"
              maxLength="6"
              required
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {t('auth.otpSentTo')} {formData.phoneNumber}
          </p>
          <button
            type="button"
            onClick={() => {
              setPhoneStep('number');
              setFormData(prev => ({ ...prev, otp: '' }));
            }}
            className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
          >
            Resend OTP or Change Number
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing || (phoneStep === 'number' && !recaptchaReady)}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
      >
        {isProcessing ? (
          <Loader className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <span>
              {phoneStep === 'number' ? t('auth.sendOTP') : t('auth.verifyOTP')}
            </span>
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>
    </form>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-bg-card-dark rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-border-light dark:border-border-dark">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {mode === 'signin' && t('auth.signInTitle')}
              {mode === 'signup' && t('auth.signUpTitle')}
              {mode === 'phone' && t('auth.phoneSignIn')}
              {mode === 'reset' && t('auth.resetPasswordTitle')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error/Success Messages */}
          {authError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 dark:text-red-400 text-sm">{authError}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-700 dark:text-green-400 text-sm">{success}</span>
            </div>
          )}

          {/* Auth Method Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => {setMode('signin'); setPhoneStep('number');}}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                mode === 'signin' 
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {t('auth.signIn')}
            </button>
            <button
              onClick={() => {setMode('signup'); setPhoneStep('number');}}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                mode === 'signup' 
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {t('auth.signUp')}
            </button>
            <button
              onClick={() => {setMode('phone'); setPhoneStep('number');}}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                mode === 'phone' 
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {t('auth.phone')}
            </button>
          </div>

          {/* Form Content */}
          {mode === 'phone' ? renderPhoneForm() : renderEmailForm()}

          {/* Social Login (only for signin/signup) */}
          {(mode === 'signin' || mode === 'signup') && (
            <>
              <div className="mt-6 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                    {t('auth.orContinueWith')}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleGoogleAuth}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  <GoogleIcon className="h-5 w-5 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {t('auth.continueWithGoogle')}
                  </span>
                </button>

                <button
                  onClick={handleGuestMode}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  <UserPlus className="h-5 w-5 mr-3 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {t('auth.continueAsGuest')}
                  </span>
                </button>
              </div>
            </>
          )}

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            {mode === 'signin' && (
              <button
                onClick={() => setMode('reset')}
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                {t('auth.forgotPassword')}
              </button>
            )}
            {mode === 'reset' && (
              <button
                onClick={() => setMode('signin')}
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                {t('auth.backToSignIn')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLogin;