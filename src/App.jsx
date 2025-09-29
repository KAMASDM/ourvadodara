// =============================================
// Updated src/App.jsx (Final version with navigation and layout fix)
// =============================================
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/Auth/AuthContext.jsx';
import { ThemeProvider } from './context/Theme/ThemeContext.jsx';
import { LanguageProvider } from './context/Language/LanguageContext.jsx';
import { ToastProvider } from './components/Common/Toast.jsx';
import ErrorBoundary from './components/Common/ErrorBoundary.jsx';
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
import FirebaseSetup from './components/Admin/FirebaseSetup.jsx';
import AdminUpgrade from './components/Admin/AdminUpgrade.jsx';
import BreakingNewsManager from './components/Breaking/BreakingNewsManager.jsx';
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
  const { user } = useAuth();

  // Check for Firebase setup URL parameter and admin route
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    
    if (path === '/admin' || path.includes('/admin')) {
      setCurrentView({ type: 'admin', data: null });
      setActiveTab('admin');
    } else if (urlParams.get('setup') === 'firebase') {
      setCurrentView({ type: 'firebase-setup', data: null });
      setActiveTab('firebase-setup');
    } else if (urlParams.get('admin') === 'upgrade') {
      setCurrentView({ type: 'admin-upgrade', data: null });
      setActiveTab('admin-upgrade');
    }
  }, []);

  useEffect(() => {
    // Initialize PWA features
    initPWA();
    registerServiceWorker();
    
    // Track app start
    analytics.track('app_start');
    
    return () => {
      analytics.track('app_end', analytics.getSessionStats());
      performanceMonitor.cleanup();
    };
  }, []);

  useEffect(() => {
    // Track page views
    analytics.page(activeTab);
  }, [activeTab]);
  
  // --- LAYOUT FIX START ---
  // Define which views should take up the full screen width
  const isFullWidthView = [
    'admin', 
    'breaking',
    'firebase-setup', 
    'admin-upgrade'
  ].includes(currentView.type);

  // Dynamically set the main container's class based on the current view
  const mainContainerClass = isFullWidthView
    ? 'w-full' // Use full width for admin pages
    : 'max-w-md mx-auto'; // Use mobile-sized container for regular pages
  // --- LAYOUT FIX END ---

  const handlePostClick = (postId) => {
    setCurrentView({ type: 'news-detail', data: { newsId: postId } });
    analytics.track('post_viewed', { postId });
  };

  const handleBackToHome = () => {
    setCurrentView({ type: 'home', data: null });
    setActiveTab('home');
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

  const renderContent = () => {
    switch (currentView.type) {
      case 'news-detail':
        return (
          <NewsDetailPage 
            newsId={currentView.data.newsId}
            onBack={handleBackToHome}
          />
        );
      case 'home':
        return <HomePage onPostClick={handlePostClick} />;
      case 'search':
        return <SearchPage onPostClick={handlePostClick} />;
      case 'profile':
        return <ProfilePage />;
      case 'admin':
        return <AdminDashboard />;
      case 'breaking':
        return <BreakingNewsManager />;
      case 'firebase-setup':
        return <FirebaseSetup />;
      case 'admin-upgrade':
        return <AdminUpgrade />;
      case 'saved':
        return <SavedPosts onPostClick={handlePostClick} />;
      case 'notifications-settings':
        return <NotificationSettings />;
      default:
        return <HomePage onPostClick={handlePostClick} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Splash Screen */}
      {showSplash && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}
      
      {!showSplash && (
        <>
          <OfflineIndicator />
          
          {currentView.type !== 'news-detail' && !isFullWidthView && (
            <Header 
              onNotificationClick={() => setShowNotifications(true)}
              onLoginClick={() => setShowLogin(true)}
            />
          )}
          
          {/* Apply the dynamic container class to the main element */}
          <main className={mainContainerClass}>
            {renderContent()}
          </main>
          
          {currentView.type !== 'news-detail' && !isFullWidthView && (
            <Navigation 
              activeTab={activeTab} 
              setActiveTab={handleTabChange}
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
            <Login onClose={() => setShowLogin(false)} />
          )}
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

