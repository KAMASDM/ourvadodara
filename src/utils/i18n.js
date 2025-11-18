// =============================================
// src/utils/i18n.js
// =============================================
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Navigation
      home: 'Home',
      search: 'Search',
      profile: 'Profile',
      admin: 'Admin',
      
      // Common
      loading: 'Loading...',
      error: 'Something went wrong',
      retry: 'Retry',
      share: 'Share',
      like: 'Like',
      comment: 'Comment',
      save: 'Save',
      
      // App specific
      appName: 'Our Vadodara',
      breaking: 'Breaking News',
      trending: 'Trending',
      readMore: 'Read More',
      publishedOn: 'Published on',
      by: 'by',
      
      // Actions
      login: 'Login',
      logout: 'Logout',
      signup: 'Sign Up',
      submit: 'Submit',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      
      // Enhanced Authentication
      auth: {
        signIn: 'Sign In',
        signUp: 'Sign Up',
        phone: 'Phone',
        signInTitle: 'Welcome Back',
        signUpTitle: 'Create Account',
        phoneSignIn: 'Phone Login',
        resetPasswordTitle: 'Reset Password',
        displayName: 'Display Name',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        phoneNumber: 'Phone Number',
        otpCode: 'OTP Code',
        enterDisplayName: 'Enter your name',
        enterEmail: 'Enter your email',
        enterPassword: 'Enter your password',
        sendOTP: 'Send OTP',
        verifyOTP: 'Verify OTP',
        otpSentTo: 'OTP sent to',
        orContinueWith: 'Or continue with',
        continueWithGoogle: 'Continue with Google',
        continueAsGuest: 'Continue as Guest',
        forgotPassword: 'Forgot Password?',
        backToSignIn: 'Back to Sign In',
        resetPassword: 'Reset Password'
      },
      
      // Categories
      categories: {
        politics: 'Politics',
        sports: 'Sports',
        entertainment: 'Entertainment',
        business: 'Business',
        technology: 'Technology',
        local: 'Local',
        weather: 'Weather',
        india: 'India',
        world: 'World',
        science: 'Science',
        space: 'Space',
        health: 'Health'
      },
      
      // Search
      search: {
        all_categories: 'All Categories',
        category: 'Category',
        tags: 'Tags'
      },
      
      // Time
      justNow: 'Just now',
      minutesAgo: '{{count}} minutes ago',
      hoursAgo: '{{count}} hours ago',
      daysAgo: '{{count}} days ago',
    }
  },
  hi: {
    translation: {
      // Navigation
      home: 'होम',
      search: 'खोजें',
      profile: 'प्रोफाइल',
      admin: 'एडमिन',
      
      // Common
      loading: 'लोड हो रहा है...',
      error: 'कुछ गलत हुआ',
      retry: 'फिर कोशिश करें',
      share: 'साझा करें',
      like: 'पसंद',
      comment: 'टिप्पणी',
      save: 'सेव करें',
      
      // App specific
      appName: 'हमारा वडोदरा',
      breaking: 'तत्काल समाचार',
      trending: 'ट्रेंडिंग',
      readMore: 'और पढ़ें',
      publishedOn: 'प्रकाशित',
      by: 'द्वारा',
      
      // Actions
      login: 'लॉगिन',
      logout: 'लॉगआउट',
      signup: 'साइन अप',
      submit: 'सबमिट',
      cancel: 'रद्द करें',
      edit: 'संपादित करें',
      delete: 'हटाएं',
      
      // Categories
      categories: {
        politics: 'राजनीति',
        sports: 'खेल',
        entertainment: 'मनोरंजन',
        business: 'व्यापार',
        technology: 'तकनीक',
        local: 'स्थानीय',
        weather: 'मौसम',
        india: 'भारत',
        world: 'विश्व',
        science: 'विज्ञान',
        space: 'अंतरिक्ष',
        health: 'स्वास्थ्य'
      },
      
      // Search
      search: {
        all_categories: 'सभी श्रेणियां',
        category: 'श्रेणी',
        tags: 'टैग'
      },
      
      // Time
      justNow: 'अभी',
      minutesAgo: '{{count}} मिनट पहले',
      hoursAgo: '{{count}} घंटे पहले',
      daysAgo: '{{count}} दिन पहले',
    }
  },
  gu: {
    translation: {
      // Navigation
      home: 'હોમ',
      search: 'શોધો',
      profile: 'પ્રોફાઇલ',
      admin: 'એડમિન',
      
      // Common
      loading: 'લોડ થઈ રહ્યું છે...',
      error: 'કંઈક ખોટું થયું',
      retry: 'ફરી પ્રયાસ કરો',
      share: 'શેર કરો',
      like: 'લાઇક',
      comment: 'કોમેન્ટ',
      save: 'સેવ કરો',
      
      // App specific
      appName: 'અમારું વડોદરા',
      breaking: 'તાત્કાલિક સમાચાર',
      trending: 'ટ્રેન્ડિંગ',
      readMore: 'વધુ વાંચો',
      publishedOn: 'પ્રકાશિત',
      by: 'દ્વારા',
      
      // Actions
      login: 'લોગિન',
      logout: 'લોગઆઉટ',
      signup: 'સાઇન અપ',
      submit: 'સબમિટ',
      cancel: 'રદ કરો',
      edit: 'એડિટ કરો',
      delete: 'ડિલીટ કરો',
      
      // Categories
      categories: {
        politics: 'રાજકારણ',
        sports: 'રમતગમત',
        entertainment: 'મનોરંજન',
        business: 'વ્યવસાય',
        technology: 'ટેકનોલોજી',
        local: 'સ્થાનિક',
        weather: 'હવામાન',
        india: 'ભારત',
        world: 'વિશ્વ',
        science: 'વિજ્ઞાન',
        space: 'અવકાશ',
        health: 'આરોગ્ય'
      },
      
      // Search
      search: {
        all_categories: 'બધી શ્રેણીઓ',
        category: 'શ્રેણી',
        tags: 'ટેગ્સ'
      },
      
      // Time
      justNow: 'હમણાં',
      minutesAgo: '{{count}} મિનિટ પહેલાં',
      hoursAgo: '{{count}} કલાક પહેલાં',
      daysAgo: '{{count}} દિવસ પહેલાં',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie'],
    },
  });

export default i18n;
