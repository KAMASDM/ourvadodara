// =============================================
// Updated src/App.jsx (Final version with navigation and layout fix)
// =============================================
import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/Auth/AuthContext.jsx';
import { EnhancedAuthProvider, useEnhancedAuth } from './context/Auth/SimpleEnhancedAuth.jsx';
import { ThemeProvider } from './context/Theme/ThemeContext.jsx';
import { LanguageProvider } from './context/Language/LanguageContext.jsx';
import { CityProvider } from './context/CityContext.jsx';
import { ToastProvider } from './components/Common/Toast.jsx';
import ErrorBoundary from './components/Common/ErrorBoundary.jsx';
import ResponsiveLayout from './components/Layout/ResponsiveLayout.jsx';
import OfflineIndicator from './components/Common/OfflineIndicator.jsx';
import NotificationCenter from './components/Notifications/NotificationCenter.jsx';
import InstallPrompt from './components/PWA/InstallPrompt.jsx';
import Header from './components/Layout/Header.jsx';
import Navigation from './components/Layout/Navigation.jsx';
import HomePage from './pages/Home/HomePage.jsx';
import SearchPage from './pages/Search/SearchPage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
import EnhancedLogin from './components/Auth/EnhancedLogin.jsx';
import GuestModePrompt from './components/Auth/GuestModePrompt.jsx';
import FirebaseSetupGuide from './components/Auth/FirebaseSetupGuide.jsx';

// Heavy views are code-split so the home feed (the LCP path) loads a much
// smaller initial bundle.
const AdminDashboard = React.lazy(() => import('./pages/Admin/AdminDashboard.jsx'));
const MarketingDashboard = React.lazy(() => import('./pages/Marketing/MarketingDashboard.jsx'));
const NewsDetailPage = React.lazy(() => import('./pages/NewsDetail/NewsDetailPage.jsx'));
const SavedPosts = React.lazy(() => import('./components/Bookmarks/SavedPosts.jsx'));
const NotificationSettings = React.lazy(() => import('./components/Settings/NotificationSettings.jsx'));
const GeneralSettings = React.lazy(() => import('./components/Settings/GeneralSettings.jsx'));
const ActivityHistory = React.lazy(() => import('./pages/Profile/ActivityHistory.jsx'));
const ReelsPage = React.lazy(() => import('./pages/Reels/ReelsPage.jsx'));
const ExplorePage = React.lazy(() => import('./pages/Explore/ExplorePage.jsx'));
const AdvertisePage = React.lazy(() => import('./pages/Advertise/AdvertisePage.jsx'));
const EventsCalendar = React.lazy(() => import('./components/Events/EventsCalendar.jsx'));
const EventDetail = React.lazy(() => import('./components/Events/EventDetail.jsx'));
const FirebaseSetup = React.lazy(() => import('./components/Admin/FirebaseSetup.jsx'));
const AdminUpgrade = React.lazy(() => import('./components/Admin/AdminUpgrade.jsx'));
const EventQRScanner = React.lazy(() => import('./components/Admin/EventQRScanner.jsx'));
const BreakingNewsManager = React.lazy(() => import('./components/Breaking/BreakingNewsManager.jsx'));
const BreakingNewsView = React.lazy(() => import('./components/Breaking/BreakingNewsView.jsx'));
const BreakingNewsDetail = React.lazy(() => import('./components/Breaking/BreakingNewsDetail.jsx'));
const LegalPage = React.lazy(() => import('./pages/Legal/LegalPage.jsx'));
const CouponMarketplace = React.lazy(() => import('./components/Coupons/CouponMarketplace.jsx'));
const BrandPortal = React.lazy(() => import('./pages/Brand/BrandPortal.jsx'));
import { BloodSOSProvider } from './context/SOS/BloodSOSContext.jsx';
import { TopicFollowingProvider } from './context/Topics/TopicFollowingContext.jsx';
import { initPWA, registerServiceWorker } from './utils/pwaHelpers.js';
import { analytics } from './utils/analytics.js';
import { performanceMonitor } from './utils/performance.js';
import { initializeNotifications } from './utils/notificationManager.js';
import { pushNotificationService } from './utils/pushNotifications.js';
import './utils/i18n.js';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentView, setCurrentView] = useState({ type: 'home', data: null });
  const [showLogin, setShowLogin] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [showFirebaseSetup, setShowFirebaseSetup] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  
  // Use the enhanced auth context
  const { user, profileCompletion } = useEnhancedAuth();
  
  // Check profile completion after login
  useEffect(() => {
    if (user && user.role !== 'brand' && !user.isAnonymous && !user.profileComplete && profileCompletion && !profileCompletion.isComplete) {
      // Redirect to profile page if incomplete
      if (currentView.type !== 'profile') {
        setCurrentView({ type: 'profile', data: null });
        setActiveTab('profile');
      }
    }
  }, [user, profileCompletion]);

  // Check for Firebase setup URL parameter and admin route
  const handlePathNavigation = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const path = window.location.pathname;

    const postMatch = path.match(/^\/post\/([^/]+)$/);
    if (postMatch) {
      const newsId = decodeURIComponent(postMatch[1]);
      window.history.replaceState({ view: 'news-detail', newsId }, '', `/post/${newsId}`);
      setCurrentView({ type: 'news-detail', data: { newsId } });
      setActiveTab('home');
      return;
    }

    // Check for QR scanner routes: /eventname/scanqr or /events/eventid/scanqr
    const scannerMatch = path.match(/^\/events\/([^/]+)\/scanqr$/) || path.match(/^\/([^/]+)\/scanqr$/);
    if (scannerMatch) {
      const eventIdentifier = scannerMatch[1];
      setCurrentView({ type: 'qr-scanner', data: { eventId: eventIdentifier } });
      setActiveTab('qr-scanner');
      return;
    }

    const eventMatch = path.match(/^\/events\/([^/]+)$/);
    if (eventMatch) {
      const eventId = decodeURIComponent(eventMatch[1]);
      setCurrentView({ type: 'event-detail', data: { eventId } });
      setActiveTab('explore');
      return;
    }

    if (path === '/marketing') {
      setCurrentView({ type: 'marketing', data: null });
      setActiveTab('marketing');
      return;
    }

    if (['/contact', '/terms', '/privacy'].includes(path)) {
      setCurrentView({ type: 'legal', data: { page: path.slice(1) } });
      setActiveTab('home');
      return;
    }

    if (path === '/admin' || path.includes('/admin')) {
      setCurrentView({ type: 'admin', data: null });
      setActiveTab('admin');
      return;
    }

    if (path === '/roundup') {
      window.history.replaceState({ view: 'home' }, '', '/');
      setCurrentView({ type: 'home', data: null });
      setActiveTab('home');
      return;
    }

    if (path === '/advertise' || path === '/enquiry' || path === '/brand-solutions') {
      setCurrentView({ type: 'advertise', data: null });
      setActiveTab('advertise');
      return;
    }
    if (path === '/offers' || path === '/coupons') {
      setCurrentView({ type: 'offers', data: null });
      setActiveTab('explore');
      return;
    }

    const exploreMatch = path.match(/^\/explore(?:\/([^/]+))?\/?$/);
    if (exploreMatch) {
      setCurrentView({ type: 'explore', data: { section: exploreMatch[1] || null } });
      setActiveTab('explore');
      return;
    }

    if (path === '/search') {
      setCurrentView({ type: 'search', data: null });
      setActiveTab('home');
      return;
    }

    if (path.startsWith('/category/')) {
      const category = decodeURIComponent(path.replace('/category/', ''));
      setCurrentView({ type: 'category', data: { category } });
      setActiveTab('home');
      return;
    }

    const breakingMatch = path.match(/^\/breaking\/([^/]+)$/);
    if (breakingMatch) {
      setCurrentView({ type: 'breaking-detail', data: { newsId: decodeURIComponent(breakingMatch[1]) } });
      setActiveTab('breaking');
      return;
    }

    if (path === '/breaking') {
      setCurrentView({ type: 'breaking', data: null });
      setActiveTab('breaking');
      return;
    }

    if (path === '/reels') {
      setCurrentView({ type: 'reels', data: null });
      setActiveTab('reels');
      return;
    }

    if (path === '/events') {
      setCurrentView({ type: 'events', data: null });
      setActiveTab('explore');
      return;
    }

    if (path === '/saved') {
      setCurrentView({ type: 'saved', data: null });
      setActiveTab('home');
      return;
    }

    if (path === '/profile') {
      setCurrentView({ type: 'profile', data: null });
      setActiveTab('profile');
      return;
    }

    if (path === '/settings' || path === '/notifications-settings' || path === '/notifications') {
      const type = path === '/settings'
        ? 'settings'
        : path === '/notifications-settings'
          ? 'notifications-settings'
          : 'notifications';
      setCurrentView({ type, data: null });
      setActiveTab('home');
      return;
    }

    if (path === '/activity') {
      setCurrentView({ type: 'activity', data: null });
      setActiveTab('profile');
      return;
    }

    if (urlParams.get('setup') === 'firebase') {
      setCurrentView({ type: 'firebase-setup', data: null });
      setActiveTab('firebase-setup');
      return;
    }

    if (urlParams.get('admin') === 'upgrade') {
      setCurrentView({ type: 'admin-upgrade', data: null });
      setActiveTab('admin-upgrade');
      return;
    }

    // Brand partner portals intentionally use a short root URL such as
    // domain.com/brand-name. All first-party routes above take precedence.
    const brandPortalMatch = path.match(/^\/([a-z0-9][a-z0-9-]*)\/?$/i);
    if (brandPortalMatch) {
      setCurrentView({ type: 'brand-portal', data: { slug: brandPortalMatch[1].toLowerCase() } });
      setActiveTab('brand-portal');
      return;
    }

    setCurrentView((previous) => (previous.type === 'home' ? previous : { type: 'home', data: null }));
    setActiveTab((previous) => (previous === 'home' ? previous : 'home'));
  }, []);

  useEffect(() => {
    // An installed app can be launched directly into a section with no prior
    // in-app history. Seed Home beneath that entry so the first device Back
    // returns Home instead of closing the app.
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    const initialUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (isStandalone && window.location.pathname !== '/' && !window.history.state?.ourVadodaraEntry) {
      const initialState = window.history.state || {};
      window.history.replaceState({ view: 'home', ourVadodaraEntry: true }, '', '/');
      window.history.pushState({ ...initialState, ourVadodaraEntry: true }, '', initialUrl);
    } else if (!window.history.state?.ourVadodaraEntry) {
      window.history.replaceState(
        { ...(window.history.state || {}), ourVadodaraEntry: true },
        '',
        initialUrl
      );
    }

    handlePathNavigation();
  }, [handlePathNavigation]);

  useEffect(() => {
    window.addEventListener('popstate', handlePathNavigation);
    return () => window.removeEventListener('popstate', handlePathNavigation);
  }, [handlePathNavigation]);

  useEffect(() => {
    // Initialize PWA features
    initPWA();
    registerServiceWorker();
    
    // Track app start
    analytics.track('app_start');
    
    // Initialize push notifications ONLY on mobile PWA (non-blocking)
    // Check if running as PWA (standalone mode) and on mobile
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isPWA && isMobile) {
      // Run in background without blocking UI
      setTimeout(() => {
        initializeNotifications()
          .then((initialized) => {
            if (initialized) {
              console.log('✅ Push notifications enabled');
            }
          })
          .catch(err => {
            // Silent fail - don't log errors for desktop browsers
          });
      }, 3000); // Wait 3 seconds after app loads
    }
    
    // Listen for guest prompt event
    const handleShowGuestPrompt = () => setShowLogin(true);
    
    // Listen for Firebase setup needed event
    const handleShowFirebaseSetup = () => {
      setShowFirebaseSetup(true);
    };
    
    // Listen for navigate to profile event
    const handleNavigateToProfile = () => {
      setCurrentView({ type: 'profile', data: null });
      setActiveTab('profile');
    };
    
    document.addEventListener('showGuestPrompt', handleShowGuestPrompt);
    document.addEventListener('showFirebaseSetup', handleShowFirebaseSetup);
    document.addEventListener('navigateToProfile', handleNavigateToProfile);
    
    return () => {
      analytics.track('app_end', analytics.getSessionStats());
      performanceMonitor.cleanup();
      document.removeEventListener('showGuestPrompt', handleShowGuestPrompt);
      document.removeEventListener('showFirebaseSetup', handleShowFirebaseSetup);
      document.removeEventListener('navigateToProfile', handleNavigateToProfile);
    };
  }, []);

  useEffect(() => {
    // Track page views
    analytics.page(activeTab);
  }, [activeTab]);

  // Initialize push notifications when user is authenticated
  useEffect(() => {
    if (user && !user.isAnonymous) {
      console.log('Initializing push notifications for user:', user.uid);
      pushNotificationService.init(user.uid, user.role === 'admin' ? ['admin-leads'] : [])
        .then(success => {
          if (success) {
            console.log('Push notifications initialized successfully');
          } else {
            console.log('Push notifications initialization failed or not supported');
          }
        })
        .catch(error => {
          console.error('Error initializing push notifications:', error);
        });
    }
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // --- LAYOUT FIX START ---
  // Define which views should take up the full screen width
  const isFullWidthView = [
    'admin',
    'marketing',
    'firebase-setup',
    'admin-upgrade',
    'qr-scanner',
    'brand-portal',
    'advertise',
    'event-detail',
    'reels' // immersive full-screen; ReelsPage has its own back control
  ].includes(currentView.type);
  const hasMobileHeader = !isDesktop && currentView.type !== 'news-detail' && !isFullWidthView;

  // Dynamically set the main container's class based on the current view
  const mainContainerClass = isFullWidthView
    ? 'w-full'
    : `max-w-2xl mx-auto w-full ${hasMobileHeader ? 'pt-[calc(56px+env(safe-area-inset-top))]' : ''}`;
  // --- LAYOUT FIX END ---

  const handlePostClick = (postId) => {
    window.history.pushState({ view: 'news-detail', newsId: postId }, '', `/post/${postId}`);
    setCurrentView({ type: 'news-detail', data: { newsId: postId } });
    analytics.track('post_viewed', { postId });
  };

  const handleBackToHome = () => {
    window.history.pushState({}, '', '/');
    setCurrentView({ type: 'home', data: null });
    setActiveTab('home');
  };

  const handleShowReels = (reelId = null) => {
    setCurrentView({ type: 'reels', data: { reelId } });
  };

  const handleTabChange = (tab) => {
    if (['profile', 'admin'].includes(tab) && !user) {
      setShowLogin(true);
      return;
    }

    const tabPaths = {
      home: '/',
      reels: '/reels',
      explore: '/explore',
      breaking: '/breaking',
      profile: '/profile'
    };
    const nextPath = tabPaths[tab] || `/${tab}`;
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ view: tab }, '', nextPath);
    }
    
    setActiveTab(tab);
    setCurrentView({ type: tab, data: null });
  };

  // Navigation handler for desktop layout
  const handleNavigation = (viewData) => {
    // Handle object format { type: 'view', data: {...} }
    if (typeof viewData === 'object' && viewData.type) {
      const { type, data } = viewData;
      
      // Handle login view
      if (type === 'login') {
        setShowLogin(true);
        return;
      }
      
      // Check authentication for protected views
      if (['profile', 'saved', 'activity', 'admin', 'notifications', 'notifications-settings', 'settings'].includes(type) && !user) {
        setShowLogin(true);
        return;
      }
      
      setCurrentView({ type, data });
      
      // Set active tab based on view type
      if (type === 'home' || type === 'category' || type === 'trending' || type === 'headlines') {
        setActiveTab('home');
      } else if (type === 'reels') {
        setActiveTab('reels');
      } else if (type === 'explore' || type === 'offers' || type === 'events') {
        setActiveTab('explore');
      } else if (type === 'breaking' || type === 'breaking-detail') {
        setActiveTab('breaking');
      } else if (type === 'profile') {
        setActiveTab('profile');
      }
      
      return;
    }
    
    // Legacy path-based navigation (kept for backward compatibility)
    if (viewData === '/') {
      handleBackToHome();
    } else if (viewData.startsWith('/category/')) {
      const category = viewData.replace('/category/', '');
      setCurrentView({ type: 'category', data: { category } });
      setActiveTab('home');
    } else if (viewData === '/trending') {
      setCurrentView({ type: 'trending', data: null });
      setActiveTab('home');
    } else if (viewData === '/reels') {
      setCurrentView({ type: 'reels', data: null });
      setActiveTab('reels');
    } else if (viewData === '/advertise') {
      setCurrentView({ type: 'advertise', data: null });
      setActiveTab('advertise');
    } else if (viewData === '/saved') {
      if (!user) {
        setShowLogin(true);
        return;
      }
      setCurrentView({ type: 'saved', data: null });
      setActiveTab('home');
    } else if (viewData === '/profile') {
      if (!user) {
        setShowLogin(true);
        return;
      }
      setCurrentView({ type: 'profile', data: null });
      setActiveTab('profile');
    }
  };
  
  const handleProfileClick = () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setActiveTab('profile');
    setCurrentView({ type: 'profile', data: null });
  };

  const handleSearchClick = () => {
    window.history.pushState({ view: 'search' }, '', '/search');
    setActiveTab('home');
    setCurrentView({ type: 'search', data: null });
  };

  const handleNotificationsClick = () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    window.history.pushState({ view: 'notifications' }, '', '/notifications');
    setActiveTab('home');
    setCurrentView({ type: 'notifications', data: null });
  };

  const handleNotificationSettingsClick = () => {
    window.history.pushState({ view: 'notifications-settings' }, '', '/notifications-settings');
    setActiveTab('home');
    setCurrentView({ type: 'notifications-settings', data: null });
  };

  const renderContent = () => {
    switch (currentView.type) {
      case 'news-detail':
        return (
          <NewsDetailPage 
            newsId={currentView.data.newsId}
            onBack={handleBackToHome}
            onPostClick={handlePostClick}
          />
        );
      case 'qr-scanner':
        return (
          <EventQRScanner 
            eventId={currentView.data.eventId}
            onBack={() => {
              setCurrentView({ type: 'home', data: null });
              setActiveTab('home');
            }}
          />
        );
      case 'home':
        return <HomePage onPostClick={handlePostClick} onShowReels={handleShowReels} />;
      case 'category':
        return (
          <HomePage
            onPostClick={handlePostClick}
            onShowReels={handleShowReels}
            initialCategory={currentView.data?.category || 'all'}
          />
        );
      case 'search':
        return <SearchPage onPostClick={handlePostClick} onShowReels={handleShowReels} />;
      case 'explore':
        return <ExplorePage initialSection={currentView.data?.section || null} />;
      case 'advertise':
        return <AdvertisePage onBack={handleBackToHome} />;
      case 'events':
        return <EventsCalendar />;
      case 'offers':
        return <CouponMarketplace />;
      case 'brand-portal':
        return <BrandPortal slug={currentView.data?.slug} />;
      case 'event-detail':
        return (
          <EventDetail
            eventId={currentView.data?.eventId}
            onBack={() => {
              window.history.pushState({ view: 'events' }, '', '/events');
              setCurrentView({ type: 'events', data: null });
              setActiveTab('explore');
            }}
          />
        );
      case 'profile':
        return <ProfilePage />;
      case 'admin':
        return <AdminDashboard />;
      case 'marketing':
        return <MarketingDashboard />;
      case 'legal':
        return (
          <LegalPage
            page={currentView.data?.page}
            onBack={handleBackToHome}
            onNavigate={(page) => {
              window.history.pushState({ view: 'legal', page }, '', `/${page}`);
              setCurrentView({ type: 'legal', data: { page } });
              setActiveTab('home');
            }}
          />
        );
      case 'breaking':
        return user?.role === 'admin' ? (
          <BreakingNewsManager />
        ) : (
          <BreakingNewsView onPostClick={handlePostClick} />
        );
      case 'breaking-detail':
        return (
          <BreakingNewsDetail
            newsId={currentView.data?.newsId}
            onBack={() => {
              window.history.pushState({ view: 'breaking' }, '', '/breaking');
              setCurrentView({ type: 'breaking', data: null });
              setActiveTab('breaking');
            }}
            onNavigate={(newsId) => {
              window.history.pushState({ view: 'breaking-detail', newsId }, '', `/breaking/${encodeURIComponent(newsId)}`);
              setCurrentView({ type: 'breaking-detail', data: { newsId } });
            }}
          />
        );
      case 'firebase-setup':
        return <FirebaseSetup />;
      case 'admin-upgrade':
        return <AdminUpgrade />;
      case 'saved':
        return (
          <SavedPosts
            onPostClick={handlePostClick}
            onEventClick={(eventId) => {
              window.history.pushState({ view: 'event-detail', eventId }, '', `/events/${encodeURIComponent(eventId)}`);
              setCurrentView({ type: 'event-detail', data: { eventId } });
              setActiveTab('explore');
            }}
          />
        );
      case 'notifications-settings':
        return <NotificationSettings />;
      case 'notifications':
        return <NotificationCenter onOpenSettings={handleNotificationSettingsClick} />;
      case 'settings':
        return <GeneralSettings />;
      case 'activity':
        return (
          <ActivityHistory
            onPostClick={handlePostClick}
            onEventClick={(eventId) => {
              window.history.pushState({ view: 'event-detail', eventId }, '', `/events/${encodeURIComponent(eventId)}`);
              setCurrentView({ type: 'event-detail', data: { eventId } });
              setActiveTab('explore');
            }}
          />
        );
      case 'reels':
        return <ReelsPage onBack={handleBackToHome} initialReelId={currentView.data?.reelId} />;
      default:
  return <HomePage onPostClick={handlePostClick} onShowReels={handleShowReels} />;
    }
  };

  return (
    <ResponsiveLayout currentView={currentView} onNavigate={handleNavigation} isDesktop={isDesktop}>
      <div className="min-h-screen liquid-app-bg">
        <OfflineIndicator />
            
            {/* Only show mobile header on mobile or for full-width views */}
            {hasMobileHeader && (
              <Header 
                onNotificationClick={handleNotificationsClick}
                onProfileClick={handleProfileClick}
                onSearchClick={handleSearchClick}
              />
            )}

            {/* Apply the dynamic container class to the main element - only on mobile */}
            <main className={!isDesktop && !isFullWidthView ? mainContainerClass : ''}>
              <React.Suspense
                fallback={
                  <div className="flex items-center justify-center py-24">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
                  </div>
                }
              >
                {renderContent()}
              </React.Suspense>
            </main>
            
            {/* Only show mobile navigation on mobile */}
            {!isDesktop && currentView.type !== 'news-detail' && !isFullWidthView && (
              <Navigation 
                activeTab={activeTab} 
                setActiveTab={handleTabChange}
                hasActiveSOS={false}
              />
            )}

          {/* PWA Install Prompt */}
          <InstallPrompt />

          {/* Modals */}
          {showLogin && (
            <EnhancedLogin onClose={() => setShowLogin(false)} />
          )}
          
          <GuestModePrompt
            isOpen={showGuestPrompt}
            onClose={() => setShowGuestPrompt(false)}
          />
          
          <FirebaseSetupGuide
            isOpen={showFirebaseSetup}
            onClose={() => setShowFirebaseSetup(false)}
          />
      </div>
    </ResponsiveLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <EnhancedAuthProvider>
          <ThemeProvider>
            <LanguageProvider>
              <CityProvider>
                <BloodSOSProvider>
                  <TopicFollowingProvider>
                    <ToastProvider>
                      <AppContent />
                    </ToastProvider>
                  </TopicFollowingProvider>
                </BloodSOSProvider>
              </CityProvider>
            </LanguageProvider>
          </ThemeProvider>
        </EnhancedAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
