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
import { initPWA, registerServiceWorker } from './utils/pwaHelpers.js';
import { analytics } from './utils/analytics.js';
import { performanceMonitor } from './utils/performance.js';
import './utils/i18n.js';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentView, setCurrentView] = useState({ type: 'home', data: null });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { user } = useAuth();

  // Check for Firebase setup URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('setup') === 'firebase') {
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
    'firebase-setup', 
    'admin-upgrade'
  ].includes(currentView.type);

  // Dynamically set the main container's class based on the current view
  const mainContainerClass = isFullWidthView
    ? 'w-full' // Use full width for admin pages
    : 'max-w-md mx-auto'; // Use mobile-sized container for regular pages
  // --- LAYOUT FIX END ---

  const handlePostClick = (postId) => {
    console.log('App: handlePostClick called with postId:', postId);
    setCurrentView({ type: 'news-detail', data: { newsId: postId } });
    analytics.track('post_viewed', { postId });
  };

  const handleBackToHome = () => {
    setCurrentView({ type: 'home', data: null });
    setActiveTab('home');
  };

  const handleTabChange = (tab) => {
    if (['profile', 'admin'].includes(tab) && !user) {
      setShowLogin(true);
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
      <OfflineIndicator />
      
      {currentView.type !== 'news-detail' && (
        <Header 
          onNotificationClick={() => setShowNotifications(true)}
          onLoginClick={() => setShowLogin(true)}
        />
      )}
      
      {/* Apply the dynamic container class to the main element */}
      <main className={mainContainerClass}>
        {renderContent()}
      </main>
      
      {currentView.type !== 'news-detail' && (
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={handleTabChange}
        />
      )}

      {/* Modals */}
      <NotificationCenter 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      
      {showLogin && (
        <Login onClose={() => setShowLogin(false)} />
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

