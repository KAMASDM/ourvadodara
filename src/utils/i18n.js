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
