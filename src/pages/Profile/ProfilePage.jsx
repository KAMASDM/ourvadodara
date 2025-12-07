// =============================================
// src/pages/Profile/ProfilePage.jsx
// =============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/Auth/AuthContext';
import { useTheme } from '../../context/Theme/ThemeContext';
import { useLanguage } from '../../context/Language/LanguageContext';
import { getUserProfile, updateUserProfile } from '../../utils/adminSetup';
import { firebaseAuth, db } from '../../firebase-config';
import { ref, get, onValue } from 'firebase/database';
import BloodSOSButton from '../../components/SOS/BloodSOSButton.jsx';
import ContactVerificationModal from '../../components/Profile/ContactVerificationModal';
import {
  User,
  Settings,
  Bell,
  Moon,
  Sun,
  Globe,
  LogOut,
  Edit3,
  Camera,
  Heart,
  MessageCircle,
  Bookmark,
  Share,
  IdCard,
  Building2,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  Droplet,
  Check,
  X,
  AlertCircle,
  Shield,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

const cloneProfile = (data) => JSON.parse(JSON.stringify(data));

const INITIAL_PROFILE_DATA = {
  personal: {
    fullName: '',
    preferredName: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    maritalStatus: '',
    hometown: ''
  },
  business: {
    businessName: '',
    industry: '',
    gstNumber: '',
    businessWebsite: '',
    businessAddress: ''
  },
  job: {
    currentRole: '',
    organization: '',
    experienceYears: '',
    primarySkills: '',
    workEmail: ''
  },
  contact: {
    primaryPhone: '',
    alternatePhone: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'India'
  }
};

const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, logout, refreshProfileCompletion, profileCompletion } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { currentLanguage, changeLanguage } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(() => cloneProfile(INITIAL_PROFILE_DATA));
  const [draftData, setDraftData] = useState(() => cloneProfile(INITIAL_PROFILE_DATA));
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [showIncompleteAlert, setShowIncompleteAlert] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationType, setVerificationType] = useState(null); // 'phone' or 'email'
  const [verificationValue, setVerificationValue] = useState('');
  const [expandedSection, setExpandedSection] = useState('personal'); // For accordion
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [verificationInfo, setVerificationInfo] = useState('');
  const [userStats, setUserStats] = useState({
    postsLiked: 0,
    postsSaved: 0,
    commentsPosted: 0,
    articlesShared: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const recentActivity = [
    { type: 'like', article: 'Vadodara Smart City Project Update', time: '2 hours ago' },
    { type: 'comment', article: 'Traffic Changes on RC Dutt Road', time: '5 hours ago' },
    { type: 'save', article: 'Cricket Tournament Announcement', time: '1 day ago' },
    { type: 'share', article: 'Local Weather Update', time: '2 days ago' }
  ];

  // Handle mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load user statistics from Firebase
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user?.uid) {
        setLoadingStats(false);
        return;
      }

      setLoadingStats(true);
      try {
        // Get likes count
        const likesRef = ref(db, 'likes');
        const likesSnapshot = await get(likesRef);
        let likesCount = 0;
        if (likesSnapshot.exists()) {
          const likesData = likesSnapshot.val();
          Object.values(likesData).forEach(postLikes => {
            if (postLikes && postLikes[user.uid]) {
              likesCount++;
            }
          });
        }

        // Get bookmarks/saves count
        const bookmarksRef = ref(db, `bookmarks/${user.uid}`);
        const bookmarksSnapshot = await get(bookmarksRef);
        const savesCount = bookmarksSnapshot.exists() ? Object.keys(bookmarksSnapshot.val()).length : 0;

        // Get comments count
        const commentsRef = ref(db, 'comments');
        const commentsSnapshot = await get(commentsRef);
        let commentsCount = 0;
        if (commentsSnapshot.exists()) {
          const commentsData = commentsSnapshot.val();
          Object.values(commentsData).forEach(postComments => {
            if (postComments) {
              Object.values(postComments).forEach(comment => {
                if (comment.authorId === user.uid) {
                  commentsCount++;
                }
              });
            }
          });
        }

        // Get shares count from user profile or interactions
        const userProfileRef = ref(db, `users/${user.uid}`);
        const userProfileSnapshot = await get(userProfileRef);
        const sharesCount = userProfileSnapshot.exists() ? (userProfileSnapshot.val().totalShares || 0) : 0;

        setUserStats({
          postsLiked: likesCount,
          postsSaved: savesCount,
          commentsPosted: commentsCount,
          articlesShared: sharesCount
        });
      } catch (error) {
        console.error('Error loading user stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadUserStats();
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!user?.uid) {
        const reset = cloneProfile(INITIAL_PROFILE_DATA);
        setProfileData(reset);
        setDraftData(cloneProfile(reset));
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      setProfileError(null);

      try {
        const remoteProfile = await getUserProfile(user.uid);

        if (!isMounted) return;

        const baseProfile = cloneProfile(INITIAL_PROFILE_DATA);
        const storedProfile = remoteProfile?.profile;

        if (storedProfile) {
          Object.keys(baseProfile).forEach((sectionKey) => {
            baseProfile[sectionKey] = {
              ...baseProfile[sectionKey],
              ...(storedProfile[sectionKey] || {})
            };
          });
        }

        baseProfile.personal.fullName = baseProfile.personal.fullName || remoteProfile?.displayName || user.displayName || user.email || '';
        baseProfile.contact.email = baseProfile.contact.email || remoteProfile?.email || user.email || '';
        
        // Pre-fill contact info based on auth method
        if (user.authMethod === 'phone' && user.authPhone) {
          baseProfile.contact.primaryPhone = user.authPhone;
        }
        if ((user.authMethod === 'email' || user.authMethod === 'google') && user.authEmail) {
          baseProfile.contact.email = user.authEmail;
        }

        setProfileData(baseProfile);
        setDraftData(cloneProfile(baseProfile));
        
        // Show alert if profile is incomplete
        if (!user.profileComplete) {
          setShowIncompleteAlert(true);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        if (isMounted) {
          setProfileError('Unable to load profile details right now.');
        }
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user?.uid, user?.authMethod, user?.authPhone, user?.authEmail, user?.profileComplete]);

  const handleStartEditing = () => {
    if (loadingProfile || savingProfile) return;
    setProfileError(null);
    setDraftData(cloneProfile(profileData));
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    if (savingProfile) return;
    setDraftData(cloneProfile(profileData));
    setIsEditing(false);
    setProfileError(null);
  };

  const handleSaveProfile = async () => {
    if (!user?.uid || savingProfile) return;
    
    // Validate mandatory fields
    const errors = [];
    if (!draftData.personal.fullName || draftData.personal.fullName.trim() === '') {
      errors.push('Full Name is required');
    }
    if (!draftData.personal.dob || draftData.personal.dob.trim() === '') {
      errors.push('Date of Birth is required');
    }
    if (!draftData.personal.gender || draftData.personal.gender.trim() === '') {
      errors.push('Gender is required');
    }
    
    // At least one contact method required
    const hasPhone = draftData.contact.primaryPhone && draftData.contact.primaryPhone.trim() !== '';
    const hasEmail = draftData.contact.email && draftData.contact.email.trim() !== '';
    if (!hasPhone && !hasEmail) {
      errors.push('Either Phone Number or Email is required');
    }
    
    if (errors.length > 0) {
      setProfileError(errors.join(', '));
      return;
    }

    // Check if user is trying to add/change phone (for email/google users)
    if ((user.authMethod === 'email' || user.authMethod === 'google') && 
        hasPhone && 
        draftData.contact.primaryPhone !== profileData.contact.primaryPhone &&
        !user.phoneVerified) {
      // Show info but allow saving
      setVerificationInfo('Phone number will need verification. You can verify later from your profile.');
    }
    
    // Check if user is trying to add/change email (for phone users)
    if (user.authMethod === 'phone' && 
        hasEmail && 
        draftData.contact.email !== profileData.contact.email &&
        !user.emailVerified) {
      // Show info but allow saving
      setVerificationInfo('Email will need verification. You can verify later from your profile.');
    }

    // Always save the profile data
    await saveProfileData();
  };

  const saveProfileData = async () => {
    setSavingProfile(true);
    setProfileError(null);

    try {
      const payload = cloneProfile(draftData);
      
      // Check if phone/email needs verification for profile completion
      const hasUnverifiedPhone = draftData.contact.primaryPhone && !user.phoneVerified;
      const hasUnverifiedEmail = draftData.contact.email && !user.emailVerified;
      const needsVerification = hasUnverifiedPhone || hasUnverifiedEmail;

      await updateUserProfile(user.uid, {
        profile: payload,
        displayName: payload.personal.fullName || user.displayName || user.email || 'Member',
        email: payload.contact.email || user.email || '',
        phoneVerified: user.phoneVerified || false,
        emailVerified: user.emailVerified || false,
        profileComplete: !needsVerification // Mark incomplete if verification needed
      });

      setProfileData(cloneProfile(payload));
      setIsEditing(false);
      
      // Show success message with verification reminder if needed
      if (needsVerification) {
        setShowIncompleteAlert(true);
      } else {
        setShowIncompleteAlert(false);
        setVerificationInfo('');
      }
      
      // Refresh profile completion status
      if (refreshProfileCompletion) {
        await refreshProfileCompletion();
      }
    } catch (error) {
      console.error('Error saving profile data:', error);
      setProfileError('Unable to save profile changes. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleVerificationComplete = async (verifiedValue) => {
    // Update the user profile with verified contact
    try {
      if (verificationType === 'phone') {
        await updateUserProfile(user.uid, {
          phoneVerified: true,
          verifiedPhone: verifiedValue
        });
        // Update local state
        user.phoneVerified = true;
      } else if (verificationType === 'email') {
        await updateUserProfile(user.uid, {
          emailVerified: true,
          verifiedEmail: verifiedValue
        });
        // Update local state
        user.emailVerified = true;
      }
      
      setShowVerificationModal(false);
      
      // Now save the profile
      await saveProfileData();
    } catch (error) {
      console.error('Error updating verification status:', error);
      setProfileError('Verification succeeded but failed to update profile. Please try again.');
    }
  };

  const handleFieldChange = (sectionId, fieldName, value) => {
    setDraftData((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [fieldName]: value
      }
    }));
  };

  const formatDisplayValue = (field, value) => {
    if (!value) return '';

    if (field.type === 'date') {
      try {
        return new Date(value).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (error) {
        return value;
      }
    }

    return value;
  };

  const renderField = (sectionId, field) => {
    const dataSource = isEditing ? draftData : profileData;
    const value = dataSource[sectionId][field.name] || '';
    const formattedValue = formatDisplayValue(field, value);
    const FieldIcon = field.icon || null;
    
    // Check if field is verified
    const isPhoneVerified = field.name === 'primaryPhone' && (user?.phoneVerified || (user?.authMethod === 'phone' && user?.authPhone));
    const isEmailVerified = field.name === 'email' && (user?.emailVerified || ((user?.authMethod === 'email' || user?.authMethod === 'google') && user?.authEmail));
    
    // Check if field is readonly (verified fields are readonly)
    const isReadonly = field.readonly || isPhoneVerified || isEmailVerified;
    
    // Check if field is required
    const isRequired = field.required || 
      (sectionId === 'personal' && ['fullName', 'dob', 'gender'].includes(field.name));

    return (
      <div
        key={field.name}
        className="rounded-2xl border border-gray-200/70 dark:border-gray-700/70 bg-white/80 dark:bg-gray-900/80 p-4 shadow-inner shadow-gray-200/40 dark:shadow-black/10"
      >
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
          <span className="flex items-center gap-2">
            {FieldIcon && <FieldIcon className="h-3.5 w-3.5 text-primary-500" />}
            <span>{field.label}</span>
            {isRequired && <span className="text-red-500">*</span>}
            {(isPhoneVerified || isEmailVerified) && (
              <span className="flex items-center gap-1 text-xs normal-case text-green-600 dark:text-green-400">
                <Shield className="h-3 w-3" />
                Verified
              </span>
            )}
            {isReadonly && !isPhoneVerified && !isEmailVerified && (
              <span className="text-xs normal-case text-blue-500">(Auto-filled from login)</span>
            )}
          </span>
        </label>
        {isEditing ? (
          field.type === 'textarea' ? (
            <textarea
              value={value}
              rows={field.rows || 3}
              onChange={(event) => handleFieldChange(sectionId, field.name, event.target.value)}
              className={`w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950/60 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 ${isReadonly ? 'opacity-60 cursor-not-allowed' : ''}`}
              placeholder={field.placeholder}
              disabled={savingProfile || isReadonly}
              required={isRequired}
            />
          ) : field.type === 'select' ? (
            <select
              value={value}
              onChange={(event) => handleFieldChange(sectionId, field.name, event.target.value)}
              className={`w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950/60 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 ${isReadonly ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={savingProfile || isReadonly}
              required={isRequired}
            >
              <option value="">{field.placeholder || 'Select an option'}</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type || 'text'}
              value={value}
              onChange={(event) => handleFieldChange(sectionId, field.name, event.target.value)}
              className={`w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950/60 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 ${isReadonly ? 'opacity-60 cursor-not-allowed' : ''}`}
              placeholder={field.placeholder}
              disabled={savingProfile || isReadonly}
              required={isRequired}
            />
          )
        ) : (
          <p className={`text-sm ${formattedValue ? 'text-gray-900 dark:text-white' : 'text-gray-400 italic'}`}>
            {formattedValue || field.emptyLabel || 'Add information'}
          </p>
        )}
      </div>
    );
  };

  const profileSections = [
    {
      id: 'personal',
      title: t('profile.personalInformation', 'Personal Information'),
      description: t('profile.personalInformationDescription', 'Tell us more about yourself so we can personalise your experience.'),
      icon: IdCard,
      fields: [
        { name: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Enter your full name', icon: User },
        { name: 'preferredName', label: 'Preferred Name', type: 'text', placeholder: 'What should we call you?', icon: IdCard },
        { name: 'dob', label: 'Date of Birth', type: 'date', icon: CalendarDays },
        {
          name: 'gender',
          label: 'Gender',
          type: 'select',
          options: ['Female', 'Male', 'Non-binary', 'Prefer not to say'],
          placeholder: 'Select gender',
          icon: IdCard
        },
        {
          name: 'bloodGroup',
          label: 'Blood Group',
          type: 'select',
          options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
          placeholder: 'Select blood group',
          icon: Droplet
        },
        {
          name: 'maritalStatus',
          label: 'Marital Status',
          type: 'select',
          options: ['Single', 'Married', 'Divorced', 'Widowed'],
          placeholder: 'Select status',
          icon: IdCard
        },
        { name: 'hometown', label: 'Hometown', type: 'text', placeholder: 'Where are you from?', icon: MapPin }
      ]
    },
    {
      id: 'business',
      title: t('profile.businessInformation', 'Business Information'),
      description: t('profile.businessInformationDescription', 'Share your business details to unlock local discovery opportunities.'),
      icon: Building2,
      fields: [
        { name: 'businessName', label: 'Business Name', type: 'text', placeholder: 'Registered business name', icon: Building2 },
        { name: 'industry', label: 'Industry', type: 'text', placeholder: 'Industry vertical', icon: Settings },
        { name: 'gstNumber', label: 'GST Number', type: 'text', placeholder: 'e.g. 24ABCDE1234F1Z5', icon: IdCard },
        { name: 'businessWebsite', label: 'Website', type: 'text', placeholder: 'https://yourbusiness.com', icon: Globe },
        { name: 'businessAddress', label: 'Business Address', type: 'textarea', rows: 3, placeholder: 'Street, area, city', icon: MapPin }
      ]
    },
    {
      id: 'job',
      title: t('profile.jobInformation', 'Job Information'),
      description: t('profile.jobInformationDescription', 'Help neighbours know what you do and connect professionally.'),
      icon: Briefcase,
      fields: [
        { name: 'currentRole', label: 'Current Role', type: 'text', placeholder: 'Job title', icon: Briefcase },
        { name: 'organization', label: 'Organization', type: 'text', placeholder: 'Company or institution', icon: Building2 },
        { name: 'experienceYears', label: 'Experience (Years)', type: 'number', placeholder: 'Total years of experience', icon: CalendarDays },
        { name: 'primarySkills', label: 'Primary Skills', type: 'textarea', rows: 3, placeholder: 'Separate skills with commas', icon: Settings },
        { name: 'workEmail', label: 'Work Email', type: 'email', placeholder: 'you@company.com', icon: Mail }
      ]
    },
    {
      id: 'contact',
      title: t('profile.contactInformation', 'Contact Information'),
      description: t('profile.contactInformationDescription', 'Keep your contact details current so we can reach you quickly.'),
      icon: Phone,
      fields: [
        { name: 'primaryPhone', label: 'Primary Phone', type: 'tel', placeholder: '+91 98765 43210', icon: Phone },
        { name: 'alternatePhone', label: 'Alternate Phone', type: 'tel', placeholder: 'Alternate contact number', icon: Phone },
        { name: 'email', label: 'Email Address', type: 'email', placeholder: 'name@email.com', icon: Mail },
        { name: 'address', label: 'Address', type: 'textarea', rows: 3, placeholder: 'House / Flat, Street, Landmark', icon: MapPin },
        { name: 'city', label: 'City', type: 'text', placeholder: 'City / Town', icon: MapPin },
        { name: 'postalCode', label: 'Postal Code', type: 'text', placeholder: 'PIN code', icon: IdCard },
        { name: 'country', label: 'Country', type: 'text', placeholder: 'Country', icon: Globe }
      ]
    }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'save':
        return <Bookmark className="w-4 h-4 text-yellow-500" />;
      case 'share':
        return <Share className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const dataSource = isEditing ? draftData : profileData;
  const displayName = dataSource.personal.fullName || user?.name || 'News Reader';
  const displayEmail = dataSource.contact.email || user?.email || 'reader@ourvadodara.com';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Incomplete Profile Alert */}
      {showIncompleteAlert && !user?.profileComplete && profileCompletion && !profileCompletion.isComplete && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                  Complete Your Profile to Access All Features
                </h3>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Please fill in the following required fields: {profileCompletion.missingFields.join(', ')}
                </p>
                <button
                  onClick={() => {
                    setShowIncompleteAlert(false);
                    if (!isEditing) handleStartEditing();
                  }}
                  className="mt-2 text-xs font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 underline"
                >
                  Complete Profile Now →
                </button>
              </div>
              <button
                onClick={() => setShowIncompleteAlert(false)}
                className="flex-shrink-0 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/40">
                  <User className="w-10 h-10 text-white" />
                </div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 transition-colors" title="Update avatar">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{displayName}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">{displayEmail}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Member since January 2024</p>
                {loadingProfile && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Loading profile details…</p>
                )}
                {profileError && !loadingProfile && (
                  <p className="mt-2 text-xs font-semibold text-red-500">{profileError}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  {/* Hide on mobile when editing (sticky button will be used instead) */}
                  {!isMobile && (
                    <>
                      <button
                        type="button"
                        onClick={handleCancelEditing}
                        className={`inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors ${savingProfile ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        disabled={savingProfile}
                      >
                        <X className="h-4 w-4" />
                        <span>{t('common.cancel', 'Cancel')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 transition-colors ${savingProfile ? 'bg-primary-400 cursor-progress' : 'bg-primary-500 hover:bg-primary-600'}`}
                        disabled={savingProfile}
                      >
                        <Check className="h-4 w-4" />
                        <span>{savingProfile ? t('common.saving', 'Saving...') : t('common.saveChanges', 'Save Changes')}</span>
                      </button>
                    </>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleStartEditing}
                  className={`inline-flex items-center gap-2 rounded-lg border border-primary-200/80 bg-primary-50/60 px-3 py-2 text-sm font-semibold text-primary-600 transition-colors dark:border-primary-500/40 dark:bg-primary-500/10 dark:text-primary-200 ${loadingProfile || savingProfile ? 'opacity-60 cursor-not-allowed' : 'hover:bg-primary-100/80'}`}
                  disabled={loadingProfile || savingProfile}
                >
                  <Edit3 className="h-4 w-4" />
                  <span>{t('profile.editProfile', 'Edit Profile')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-5">
          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-gray-50/60 dark:bg-gray-900/60 p-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loadingStats ? (
                  <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                ) : userStats.postsLiked}
              </p>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Liked</p>
            </div>
            <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-gray-50/60 dark:bg-gray-900/60 p-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loadingStats ? (
                  <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                ) : userStats.postsSaved}
              </p>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Saved</p>
            </div>
            <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-gray-50/60 dark:bg-gray-900/60 p-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loadingStats ? (
                  <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                ) : userStats.commentsPosted}
              </p>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Comments</p>
            </div>
            <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-gray-50/60 dark:bg-gray-900/60 p-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loadingStats ? (
                  <span className="inline-block w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                ) : userStats.articlesShared}
              </p>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Shared</p>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Info Alert */}
      {verificationInfo && (
        <div className="mx-4 mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 dark:text-blue-100">{verificationInfo}</p>
            <button
              onClick={() => {
                setShowVerificationModal(true);
                setVerificationInfo('');
              }}
              className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Verify Now
            </button>
          </div>
          <button
            onClick={() => setVerificationInfo('')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Profile Sections - Accordion for Mobile, Regular for Desktop */}
      <div className={`mt-6 px-4 space-y-5 ${isEditing && isMobile ? 'pb-32' : ''}`}>
        {profileSections.map((section) => {
          const Icon = section.icon;
          const isExpanded = !isMobile || expandedSection === section.id;
          
          return (
            <section
              key={section.id}
              className="rounded-3xl border border-gray-200/70 dark:border-gray-800/70 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm shadow-gray-200/40 dark:shadow-black/30 overflow-hidden"
            >
              {/* Section Header - Clickable on Mobile */}
              <div 
                className={`p-6 ${isMobile && isEditing ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (isMobile && isEditing) {
                    setExpandedSection(expandedSection === section.id ? null : section.id);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-primary-500/10 p-3 text-primary-600 dark:bg-primary-500/20 dark:text-primary-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{section.title}</h2>
                      {section.description && !isMobile && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{section.description}</p>
                      )}
                    </div>
                  </div>
                  {isMobile && isEditing && (
                    <button className="p-2">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Section Fields - Collapsible on Mobile */}
              {isExpanded && (
                <div className="px-6 pb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {section.fields.map((field) => renderField(section.id, field))}
                </div>
              )}
            </section>
          );
        })}
      </div>
      
      {/* Sticky Save Button for Mobile */}
      {isEditing && isMobile && (
        <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelEditing}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors ${savingProfile ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              disabled={savingProfile}
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSaveProfile}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 transition-colors ${savingProfile ? 'bg-primary-400 cursor-progress' : 'bg-primary-500 hover:bg-primary-600'}`}
              disabled={savingProfile}
            >
              <Check className="h-4 w-4" />
              <span>{savingProfile ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="mt-6 px-4">
        <div className="rounded-3xl border border-gray-200/70 dark:border-gray-800/70 bg-white/95 dark:bg-gray-900/95 p-6 shadow-sm shadow-gray-200/40 dark:shadow-black/30">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Settings</h2>

          <div className="space-y-4">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between rounded-xl border border-transparent bg-gray-50/80 px-4 py-3 text-left transition-colors hover:bg-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span className="text-gray-900 dark:text-white">{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
              </div>
            </button>

            <div className="flex items-center justify-between rounded-xl border border-transparent bg-gray-50/80 px-4 py-3 transition-colors hover:bg-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-800">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5" />
                <span className="text-gray-900 dark:text-white">Language</span>
              </div>
              <select
                value={currentLanguage}
                onChange={(event) => changeLanguage(event.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="gu">ગુજરાતી</option>
              </select>
            </div>

            <button className="w-full flex items-center justify-between rounded-xl border border-transparent bg-gray-50/80 px-4 py-3 text-left transition-colors hover:bg-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-800">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" />
                <span className="text-gray-900 dark:text-white">Notifications</span>
              </div>
              <div className="h-5 w-10 rounded-full bg-primary-500/30">
                <div className="h-5 w-5 rounded-full bg-primary-500"></div>
              </div>
            </button>

            <button className="w-full flex items-center justify-between rounded-xl border border-transparent bg-gray-50/80 px-4 py-3 text-left transition-colors hover:bg-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-800">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5" />
                <span className="text-gray-900 dark:text-white">General Settings</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6 px-4">
        <div className="rounded-3xl border border-gray-200/70 dark:border-gray-800/70 bg-white/95 dark:bg-gray-900/95 p-6 shadow-sm shadow-gray-200/40 dark:shadow-black/30">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>

          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 rounded-2xl bg-gray-50/70 px-3 py-2 hover:bg-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-gray-900 shadow-sm">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">{activity.article}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="mt-6 px-4 pb-10">
        <button
          onClick={logout}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-colors hover:bg-red-600"
        >
          <LogOut className="w-5 h-5" />
          <span>{t('auth.logout', 'Logout')}</span>
        </button>
      </div>

      {/* <BloodSOSButton /> */}
      
      {/* Contact Verification Modal */}
      {showVerificationModal && verificationType && verificationValue && (
        <ContactVerificationModal
          type={verificationType}
          value={verificationValue}
          user={firebaseAuth.currentUser}
          onClose={() => setShowVerificationModal(false)}
          onVerified={handleVerificationComplete}
        />
      )}
    </div>
  );
};

export default ProfilePage;
