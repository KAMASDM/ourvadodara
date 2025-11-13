// =============================================
// src/utils/profileHelpers.js
// Profile Completion Helper Functions
// =============================================

/**
 * Check if user has completed mandatory profile fields
 * @param {Object} userProfile - User profile object from Firebase
 * @returns {Object} { isComplete: boolean, missingFields: string[] }
 */
export const checkProfileCompletion = (userProfile) => {
  const missingFields = [];
  
  // Required fields in personal section
  const personal = userProfile?.profile?.personal || {};
  if (!personal.fullName || personal.fullName.trim() === '') {
    missingFields.push('Full Name');
  }
  if (!personal.dob || personal.dob.trim() === '') {
    missingFields.push('Date of Birth');
  }
  if (!personal.gender || personal.gender.trim() === '') {
    missingFields.push('Gender');
  }
  
  // Required fields in contact section
  const contact = userProfile?.profile?.contact || {};
  
  // At least one contact method must be filled
  const hasPhone = contact.primaryPhone && contact.primaryPhone.trim() !== '';
  const hasEmail = contact.email && contact.email.trim() !== '';
  
  if (!hasPhone && !hasEmail) {
    missingFields.push('Phone Number or Email');
  }
  
  return {
    isComplete: missingFields.length === 0,
    missingFields
  };
};

/**
 * Get auth method used for sign in
 * @param {Object} firebaseUser - Firebase user object
 * @returns {string} - 'phone' | 'email' | 'google' | 'anonymous'
 */
export const getAuthMethod = (firebaseUser) => {
  if (!firebaseUser) return null;
  
  // Check if anonymous
  if (firebaseUser.isAnonymous) return 'anonymous';
  
  // Check provider data
  const providerData = firebaseUser.providerData || [];
  
  for (const provider of providerData) {
    if (provider.providerId === 'phone') return 'phone';
    if (provider.providerId === 'google.com') return 'google';
    if (provider.providerId === 'password') return 'email';
  }
  
  // Fallback: check if email exists
  if (firebaseUser.email) {
    // If phoneNumber exists, it's phone auth
    if (firebaseUser.phoneNumber) return 'phone';
    return 'email';
  }
  
  if (firebaseUser.phoneNumber) return 'phone';
  
  return 'unknown';
};

/**
 * Get the contact value from auth method
 * @param {Object} firebaseUser - Firebase user object
 * @param {string} authMethod - Auth method used
 * @returns {Object} { phone: string|null, email: string|null }
 */
export const getAuthContactInfo = (firebaseUser, authMethod) => {
  const info = { phone: null, email: null };
  
  if (!firebaseUser) return info;
  
  if (authMethod === 'phone' && firebaseUser.phoneNumber) {
    info.phone = firebaseUser.phoneNumber;
  }
  
  if ((authMethod === 'email' || authMethod === 'google') && firebaseUser.email) {
    info.email = firebaseUser.email;
  }
  
  return info;
};

/**
 * Format profile completion percentage
 * @param {Object} userProfile - User profile object
 * @returns {number} - Percentage (0-100)
 */
export const getProfileCompletionPercentage = (userProfile) => {
  const totalFields = 7; // fullName, dob, gender, phone/email (counted as 1), bloodGroup, city, hometown
  let completedFields = 0;
  
  const personal = userProfile?.profile?.personal || {};
  const contact = userProfile?.profile?.contact || {};
  
  // Mandatory fields (4)
  if (personal.fullName && personal.fullName.trim() !== '') completedFields++;
  if (personal.dob && personal.dob.trim() !== '') completedFields++;
  if (personal.gender && personal.gender.trim() !== '') completedFields++;
  if ((contact.primaryPhone && contact.primaryPhone.trim() !== '') || 
      (contact.email && contact.email.trim() !== '')) completedFields++;
  
  // Optional but recommended fields (3)
  if (personal.bloodGroup && personal.bloodGroup.trim() !== '') completedFields++;
  if (contact.city && contact.city.trim() !== '') completedFields++;
  if (personal.hometown && personal.hometown.trim() !== '') completedFields++;
  
  return Math.round((completedFields / totalFields) * 100);
};
