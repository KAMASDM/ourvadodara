// =============================================
// src/components/Common/ProfileCompletionGuard.jsx
// Guard Component to Check Profile Completion Before Actions
// =============================================
import React, { useState } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { AlertCircle, User, X } from 'lucide-react';

/**
 * Hook to check if action requires profile completion
 * @returns {function} checkProfileComplete - function that returns true if profile is complete, shows modal if not
 */
export const useProfileCompletionGuard = () => {
  const { user, profileCompletion } = useAuth();
  const [showModal, setShowModal] = useState(false);
  
  const checkProfileComplete = (actionName = 'perform this action') => {
    // Allow if user doesn't exist (will be handled by login check)
    if (!user) return true;
    
    // Allow anonymous users (they don't need profile)
    if (user.isAnonymous) return true;
    
    // Check if profile is complete
    if (user.profileComplete) return true;
    
    // Profile incomplete - show modal
    setShowModal(true);
    return false;
  };
  
  const closeModal = () => setShowModal(false);
  
  return {
    checkProfileComplete,
    showModal,
    closeModal,
    profileCompletion
  };
};

/**
 * Modal component to show when profile is incomplete
 */
export const ProfileCompletionModal = ({ isOpen, onClose, missingFields = [] }) => {
  if (!isOpen) return null;
  
  const handleGoToProfile = () => {
    onClose();
    // Dispatch custom event to navigate to profile
    document.dispatchEvent(new CustomEvent('navigateToProfile'));
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Complete Your Profile First
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Please complete your profile to access all features of the app
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Required Information:
              </h4>
              <ul className="space-y-2">
                {missingFields.length > 0 ? (
                  missingFields.map((field, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      {field}
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      Full Name
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      Date of Birth
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      Gender
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      Contact Information (Phone or Email)
                    </li>
                  </>
                )}
              </ul>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                💡 <strong>Why is this needed?</strong> Completing your profile helps us provide personalized content and enables you to interact with the community.
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={handleGoToProfile}
            className="flex-1 px-4 py-2.5 bg-primary-red text-white rounded-lg hover:bg-secondary-red font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            Complete Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionModal;
