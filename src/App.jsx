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
import SplashScreen from './components/Common/SplashScreen.jsx';
import InstallPrompt from './components/PWA/InstallPrompt.jsx';
import Header from './components/Layout/Header.jsx';
import Navigation from './components/Layout/Navigation.jsx';
import HomePage from './pages/Home/HomePage.jsx';
import SearchPage from './pages/Search/SearchPage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';
import NewsDetailPage from './pages/NewsDetail/NewsDetailPage.jsx';
import SavedPosts from './components/Bookmarks/SavedPosts.jsx';
import NotificationSettings from './components/Settings/NotificationSettings.jsx';
import Login from './components/Auth/Login.jsx';
import EnhancedLogin from './components/Auth/EnhancedLogin.jsx';
import GuestModePrompt from './components/Auth/GuestModePrompt.jsx';
import FirebaseSetupGuide from './components/Auth/FirebaseSetupGuide.jsx';
import ReelsPage from './pages/Reels/ReelsPage.jsx';
import RoundupPage from './pages/Roundup/RoundupPage.jsx';
import EventsCalendar from './components/Events/EventsCalendar.jsx';
import FirebaseSetup from './components/Admin/FirebaseSetup.jsx';
import AdminUpgrade from './components/Admin/AdminUpgrade.jsx';
import EventQRScanner from './components/Admin/EventQRScanner.jsx';
import BreakingNewsManager from './components/Breaking/BreakingNewsManager.jsx';
import BreakingNewsView from './components/Breaking/BreakingNewsView.jsx';
import BloodSOSBanner from './components/SOS/BloodSOSBanner.jsx';
import { BloodSOSProvider, useBloodSOS } from './context/SOS/BloodSOSContext.jsx';
import { initPWA, registerServiceWorker } from './utils/pwaHelpers.js';
import { analytics } from './utils/analytics.js';
import { performanceMonitor } from './utils/performance.js';
import './utils/i18n.js';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentView, setCurrentView] = useState({ type: 'home', data: null });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [showFirebaseSetup, setShowFirebaseSetup] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const { hasActiveSOS } = useBloodSOS();
  
  // Use the enhanced auth context
  const { user, profileCompletion } = useEnhancedAuth();
  
  // Check profile completion after login
  useEffect(() => {
    if (user && !user.isAnonymous && !user.profileComplete && profileCompletion && !profileCompletion.isComplete) {
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
    const scannerMatch = path.match(/^\/(.+)\/scanqr$/) || path.match(/^\/events\/(.+)\/scanqr$/);
    if (scannerMatch) {
      const eventIdentifier = scannerMatch[1];
      setCurrentView({ type: 'qr-scanner', data: { eventId: eventIdentifier } });
      setActiveTab('qr-scanner');
      return;
    }

    if (path === '/admin' || path.includes('/admin')) {
      setCurrentView({ type: 'admin', data: null });
      setActiveTab('admin');
      return;
    }

    if (path === '/roundup') {
      setCurrentView({ type: 'roundup', data: null });
      setActiveTab('roundup');
      return;
    }

    if (path === '/breaking') {
      setCurrentView({ type: 'breaking', data: null });
      setActiveTab('breaking');
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

    setCurrentView((previous) => (previous.type === 'home' ? previous : { type: 'home', data: null }));
    setActiveTab((previous) => (previous === 'home' ? previous : 'home'));
  }, []);

  useEffect(() => {
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
    
    // Listen for guest prompt event
    const handleShowGuestPrompt = () => {
      setShowGuestPrompt(true);
    };
    
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
    'firebase-setup', 
    'admin-upgrade',
    'qr-scanner'
  ].includes(currentView.type);

  // Dynamically set the main container's class based on the current view
  const mainContainerClass = isFullWidthView
    ? 'w-full'
    : 'max-w-2xl mx-auto px-3 sm:px-4';
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

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleTabChange = (tab) => {
    if (['profile', 'admin'].includes(tab) && !user) {
      setShowLogin(true);
      return;
    }
    
    // Breaking news can be accessed without authentication
    if (tab === 'breaking') {
      setActiveTab(tab);
      setCurrentView({ type: 'breaking', data: null });
      return;
    }
    
    setActiveTab(tab);
    setCurrentView({ type: tab, data: null });
  };

  // Navigation handler for desktop layout
  const handleNavigation = (viewData) => {
    // Handle object format { type: 'view', data: {...} }
    if (typeof viewData === 'object' && viewData.type) {
      const { type, data } = viewData;
      
      // Check authentication for protected views
      if (['profile', 'saved', 'admin'].includes(type) && !user) {
        setShowLogin(true);
        return;
      }
      
      setCurrentView({ type, data });
      
      // Set active tab based on view type
      if (type === 'home' || type === 'category' || type === 'trending' || type === 'headlines') {
        setActiveTab('home');
      } else if (type === 'reels') {
        setActiveTab('reels');
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

  const renderContent = () => {
    switch (currentView.type) {
      case 'news-detail':
        return (
          <NewsDetailPage 
            newsId={currentView.data.newsId}
            onBack={handleBackToHome}
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
      case 'roundup':
        return <RoundupPage onBack={handleBackToHome} />;
      case 'profile':
        return <ProfilePage />;
      case 'admin':
        return <AdminDashboard />;
      case 'breaking':
        return user?.role === 'admin' ? (
          <BreakingNewsManager />
        ) : (
          <BreakingNewsView onPostClick={handlePostClick} />
        );
      case 'firebase-setup':
        return <FirebaseSetup />;
      case 'admin-upgrade':
        return <AdminUpgrade />;
      case 'saved':
        return <SavedPosts onPostClick={handlePostClick} />;
      case 'notifications-settings':
        return <NotificationSettings />;
      case 'reels':
        return <ReelsPage onBack={handleBackToHome} initialReelId={currentView.data?.reelId} />;
      default:
  return <HomePage onPostClick={handlePostClick} onShowReels={handleShowReels} />;
    }
  };

  return (
    <ResponsiveLayout currentView={currentView} onNavigate={handleNavigation} isDesktop={isDesktop}>
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
        {/* Splash Screen */}
        {showSplash && (
          <SplashScreen onComplete={handleSplashComplete} />
        )}
        
        {!showSplash && (
          <>
            <OfflineIndicator />
            
            {!isDesktop && currentView.type !== 'news-detail' && !isFullWidthView && (
              <Header 
                onNotificationClick={() => setShowNotifications(true)}
                onLoginClick={() => setShowLogin(true)}
                onProfileClick={handleProfileClick}
              />
            )}

            {!isDesktop && currentView.type !== 'news-detail' && (
              <BloodSOSBanner />
            )}
            
            {/* Apply the dynamic container class to the main element */}
            <main className={mainContainerClass}>
              {renderContent()}
            </main>
            
            {!isDesktop && currentView.type !== 'news-detail' && !isFullWidthView && (
              <Navigation 
                activeTab={activeTab} 
                setActiveTab={handleTabChange}
                hasActiveSOS={hasActiveSOS}
              />
            )}

          {/* PWA Install Prompt */}
          <InstallPrompt />

          {/* Modals */}
          <NotificationCenter 
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
          
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
        </>
      )}
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
                  <ToastProvider>
                    <AppContent />
                  </ToastProvider>
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

