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
      reels: 'Reels',
      breakingNav: 'Breaking',
      profile: 'Profile',
      admin: 'Admin',
      events: 'Events',
      polls: 'Polls',
      offers: 'Offers',
      weather: 'Weather',
      live_updates: 'Live Updates',
      ai_picks: 'AI Picks',
      top_stories: 'Top Stories',
      for_you: 'For You',
      all: 'All',
      app_preferences: 'City and language',
      preferences_hint: 'Personalize the app in one place',
      city: 'City',
      language: 'Language',
      close: 'Close',
      done: 'Done',
      
      // Common
      loading: 'Loading...',
      error: 'Something went wrong',
      retry: 'Retry',
      share: 'Share',
      like: 'Like',
      comment: 'Comment',
      save: 'Save',
      common: {
        optional: 'Optional',
        cancel: 'Cancel',
        save_changes: 'Save changes'
      },
      report: {
        title: 'Report post',
        description: 'Help us understand what is wrong with this content.',
        reason_label: 'Select a reason',
        spam: 'Spam',
        harassment: 'Harassment or bullying',
        hate_speech: 'Hate speech',
        misinformation: 'False or misleading information',
        violence: 'Violence or dangerous content',
        inappropriate: 'Inappropriate content',
        copyright: 'Copyright violation',
        other: 'Other',
        additional_details: 'Additional details',
        details_placeholder: 'Add any details that may help our moderation team',
        important_note: 'Important note',
        false_reports_warning: 'False or abusive reports may result in account restrictions.',
        submit: 'Submit report',
        submitting: 'Submitting…',
        success_message: 'Thank you. Your report has been submitted.',
        error_message: 'We could not submit your report. Please try again.'
      },
      notifications: {
        title: 'Notifications',
        aria_label: 'Notifications, {{count}} unread',
        unread_count_one: '{{count}} unread notification',
        unread_count_other: '{{count}} unread notifications',
        all_caught_up: 'You are all caught up',
        mark_all_read: 'Mark all as read',
        open_preferences: 'Notification preferences',
        empty_title: 'No notifications yet',
        empty_description: 'Your latest updates will appear here.',
        sign_in_title: 'Sign in to see notifications',
        sign_in_description: 'Notifications are connected to your account.',
        settings: 'Notification settings',
        manage_preferences: 'Choose how and when Our Vadodara contacts you.',
        push_notifications: 'Push notifications',
        push_description: 'Receive alerts on this device.',
        email_notifications: 'Email notifications',
        email_description: 'Receive important updates by email.',
        sms_notifications: 'SMS notifications',
        sms_description: 'Receive urgent alerts by text message.',
        breaking_news: 'Breaking news',
        breaking_news_description: 'Urgent city and public-safety updates.',
        daily_digest: 'Daily digest',
        daily_digest_description: 'A daily summary of top local stories.',
        category_updates: 'Category updates',
        category_updates_description: 'Updates from categories you follow.',
        comment_replies: 'Comment replies',
        comment_replies_description: 'Alerts when someone replies to you.',
        sound_enabled: 'Notification sound',
        sound_description: 'Play a sound for supported notifications.',
        note_title: 'You are in control',
        note_description: 'You can update these preferences at any time.'
      },
      explore: {
        title: 'Explore',
        subtitle: 'Events, polls, offers and useful city tools—all in one place.',
        choose_feature: 'What would you like to do?',
        back: 'Back to Explore',
        events_description: 'What is happening around Vadodara',
        polls_description: 'Vote and see what the city thinks',
        offers_description: 'Discover coupons from local brands',
        breaking_description: 'Important updates happening right now',
        weather_description: 'Forecast, rain, moon phase and conditions',
        live_description: 'Follow developing local stories',
        trending_description: 'Topics Vadodara is reading today',
        ai_description: 'Stories selected around your interests',
        business_title: 'Work with us',
        business_description: 'Advertising, campaigns and business enquiries'
      },
      
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
        search: 'Search',
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
      reels: 'रील्स',
      breakingNav: 'ब्रेकिंग',
      profile: 'प्रोफाइल',
      admin: 'एडमिन',
      events: 'इवेंट्स',
      polls: 'पोल',
      offers: 'ऑफ़र',
      weather: 'मौसम',
      live_updates: 'लाइव अपडेट',
      ai_picks: 'एआई चयन',
      top_stories: 'मुख्य खबरें',
      for_you: 'आपके लिए',
      all: 'सभी',
      app_preferences: 'शहर और भाषा',
      preferences_hint: 'ऐप को एक ही जगह से अपनी पसंद के अनुसार सेट करें',
      city: 'शहर',
      language: 'भाषा',
      close: 'बंद करें',
      done: 'पूर्ण',
      
      // Common
      loading: 'लोड हो रहा है...',
      error: 'कुछ गलत हुआ',
      retry: 'फिर कोशिश करें',
      share: 'साझा करें',
      like: 'पसंद',
      comment: 'टिप्पणी',
      save: 'सेव करें',

      notifications: {
        title: 'सूचनाएं',
        aria_label: 'सूचनाएं, {{count}} अपठित',
        unread_count_one: '{{count}} अपठित सूचना',
        unread_count_other: '{{count}} अपठित सूचनाएं',
        all_caught_up: 'आपने सभी सूचनाएं देख ली हैं',
        mark_all_read: 'सभी को पढ़ा हुआ मानें',
        open_preferences: 'सूचना प्राथमिकताएं',
        empty_title: 'अभी कोई सूचना नहीं',
        empty_description: 'आपके नवीनतम अपडेट यहां दिखाई देंगे।',
        sign_in_title: 'सूचनाएं देखने के लिए साइन इन करें',
        sign_in_description: 'सूचनाएं आपके खाते से जुड़ी होती हैं।',
        settings: 'सूचना सेटिंग्स',
        manage_preferences: 'चुनें कि हमारा वडोदरा आपसे कब और कैसे संपर्क करे।',
        push_notifications: 'पुश सूचनाएं',
        push_description: 'इस डिवाइस पर अलर्ट प्राप्त करें।',
        email_notifications: 'ईमेल सूचनाएं',
        email_description: 'ईमेल से महत्वपूर्ण अपडेट प्राप्त करें।',
        sms_notifications: 'एसएमएस सूचनाएं',
        sms_description: 'टेक्स्ट संदेश से जरूरी अलर्ट प्राप्त करें।',
        breaking_news: 'ब्रेकिंग न्यूज़',
        breaking_news_description: 'शहर और सार्वजनिक सुरक्षा के जरूरी अपडेट।',
        daily_digest: 'दैनिक सारांश',
        daily_digest_description: 'प्रमुख स्थानीय खबरों का दैनिक सारांश।',
        category_updates: 'श्रेणी अपडेट',
        category_updates_description: 'आपकी पसंदीदा श्रेणियों के अपडेट।',
        comment_replies: 'टिप्पणी के जवाब',
        comment_replies_description: 'किसी के जवाब देने पर सूचना पाएं।',
        sound_enabled: 'सूचना ध्वनि',
        sound_description: 'समर्थित सूचनाओं के लिए ध्वनि चलाएं।',
        note_title: 'नियंत्रण आपके हाथ में है',
        note_description: 'आप इन प्राथमिकताओं को कभी भी बदल सकते हैं।'
      },
      explore: {
        title: 'एक्सप्लोर',
        subtitle: 'इवेंट्स, पोल, ऑफ़र और उपयोगी शहर सेवाएं—सब एक जगह।',
        choose_feature: 'आप क्या करना चाहते हैं?',
        back: 'एक्सप्लोर पर वापस जाएं',
        events_description: 'वडोदरा में आसपास क्या हो रहा है',
        polls_description: 'वोट करें और जानें शहर क्या सोचता है',
        offers_description: 'स्थानीय ब्रांड के कूपन खोजें',
        breaking_description: 'अभी की महत्वपूर्ण ताज़ा जानकारी',
        weather_description: 'पूर्वानुमान, बारिश, चंद्र चरण और मौसम',
        live_description: 'चल रही स्थानीय खबरों को फॉलो करें',
        trending_description: 'आज वडोदरा में पढ़े जा रहे विषय',
        ai_description: 'आपकी रुचि के अनुसार चुनी गई खबरें',
        business_title: 'हमारे साथ काम करें',
        business_description: 'विज्ञापन, अभियान और व्यावसायिक पूछताछ'
      },
      
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
        search: 'खोजें',
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
      reels: 'રીલ્સ',
      breakingNav: 'બ્રેકિંગ',
      profile: 'પ્રોફાઇલ',
      admin: 'એડમિન',
      events: 'ઇવેન્ટ્સ',
      polls: 'પોલ',
      offers: 'ઓફર્સ',
      weather: 'હવામાન',
      live_updates: 'લાઇવ અપડેટ',
      ai_picks: 'એઆઈ પસંદગી',
      top_stories: 'મુખ્ય સમાચાર',
      for_you: 'તમારા માટે',
      all: 'બધું',
      app_preferences: 'શહેર અને ભાષા',
      preferences_hint: 'એપને એક જ જગ્યાએ તમારી પસંદ પ્રમાણે ગોઠવો',
      city: 'શહેર',
      language: 'ભાષા',
      close: 'બંધ કરો',
      done: 'પૂર્ણ',
      
      // Common
      loading: 'લોડ થઈ રહ્યું છે...',
      error: 'કંઈક ખોટું થયું',
      retry: 'ફરી પ્રયાસ કરો',
      share: 'શેર કરો',
      like: 'લાઇક',
      comment: 'કોમેન્ટ',
      save: 'સેવ કરો',

      notifications: {
        title: 'સૂચનાઓ',
        aria_label: 'સૂચનાઓ, {{count}} વાંચવાની બાકી',
        unread_count_one: '{{count}} સૂચના વાંચવાની બાકી',
        unread_count_other: '{{count}} સૂચનાઓ વાંચવાની બાકી',
        all_caught_up: 'તમે બધી સૂચનાઓ જોઈ લીધી છે',
        mark_all_read: 'બધી વાંચેલી ગણો',
        open_preferences: 'સૂચના પસંદગીઓ',
        empty_title: 'હજુ કોઈ સૂચના નથી',
        empty_description: 'તમારા નવા અપડેટ અહીં દેખાશે.',
        sign_in_title: 'સૂચનાઓ જોવા સાઇન ઇન કરો',
        sign_in_description: 'સૂચનાઓ તમારા એકાઉન્ટ સાથે જોડાયેલી છે.',
        settings: 'સૂચના સેટિંગ્સ',
        manage_preferences: 'અમારું વડોદરા તમારો ક્યારે અને કેવી રીતે સંપર્ક કરે તે પસંદ કરો.',
        push_notifications: 'પુશ સૂચનાઓ',
        push_description: 'આ ઉપકરણ પર એલર્ટ મેળવો.',
        email_notifications: 'ઇમેઇલ સૂચનાઓ',
        email_description: 'ઇમેઇલ દ્વારા મહત્વપૂર્ણ અપડેટ મેળવો.',
        sms_notifications: 'એસએમએસ સૂચનાઓ',
        sms_description: 'ટેક્સ્ટ સંદેશ દ્વારા તાત્કાલિક એલર્ટ મેળવો.',
        breaking_news: 'બ્રેકિંગ ન્યૂઝ',
        breaking_news_description: 'શહેર અને જાહેર સુરક્ષાના તાત્કાલિક અપડેટ.',
        daily_digest: 'દૈનિક સારાંશ',
        daily_digest_description: 'મુખ્ય સ્થાનિક સમાચારોનો દૈનિક સારાંશ.',
        category_updates: 'કેટેગરી અપડેટ',
        category_updates_description: 'તમે અનુસરતા વિભાગોના અપડેટ.',
        comment_replies: 'કૉમેન્ટના જવાબ',
        comment_replies_description: 'કોઈ જવાબ આપે ત્યારે સૂચના મેળવો.',
        sound_enabled: 'સૂચના અવાજ',
        sound_description: 'સમર્થિત સૂચનાઓ માટે અવાજ વગાડો.',
        note_title: 'નિયંત્રણ તમારા હાથમાં છે',
        note_description: 'તમે આ પસંદગીઓ કોઈપણ સમયે બદલી શકો છો.'
      },
      explore: {
        title: 'એક્સપ્લોર',
        subtitle: 'ઇવેન્ટ્સ, પોલ, ઓફર્સ અને ઉપયોગી શહેર સેવાઓ—બધું એક જગ્યાએ.',
        choose_feature: 'તમે શું કરવા માંગો છો?',
        back: 'એક્સપ્લોર પર પાછા જાઓ',
        events_description: 'વડોદરામાં આસપાસ શું થઈ રહ્યું છે',
        polls_description: 'મત આપો અને જાણો શહેર શું વિચારે છે',
        offers_description: 'સ્થાનિક બ્રાન્ડના કૂપન શોધો',
        breaking_description: 'અત્યારે બની રહેલા મહત્વપૂર્ણ અપડેટ',
        weather_description: 'આગાહી, વરસાદ, ચંદ્રકળા અને હવામાન',
        live_description: 'ચાલુ સ્થાનિક સમાચારોને અનુસરો',
        trending_description: 'આજે વડોદરા વાંચી રહ્યું છે તે વિષયો',
        ai_description: 'તમારી રુચિ મુજબ પસંદ કરેલા સમાચાર',
        business_title: 'અમારી સાથે કામ કરો',
        business_description: 'જાહેરાત, કેમ્પેઇન અને વ્યવસાયિક પૂછપરછ'
      },
      
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
        search: 'શોધો',
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
