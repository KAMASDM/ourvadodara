// =============================================
// src/pages/Dashboard/DashboardPage.jsx
// Complete dashboard page with all advanced features
// =============================================
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { useTranslation } from 'react-i18next';
import ComprehensiveDashboard from '../../components/Dashboard/ComprehensiveDashboard';
import { LayoutDashboard, ArrowLeft } from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading dashboard data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {t('dashboard.loading', 'Loading your personalized dashboard...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Navigation */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => window.history.back()}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <LayoutDashboard className="w-6 h-6 text-blue-500" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('dashboard.pageTitle', 'Advanced Dashboard')}
                </h1>
              </div>
            </div>

            {/* User Info */}
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name || t('auth.guest', 'Guest User')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('dashboard.welcomeBack', 'Welcome back!')}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {user.name?.charAt(0) || 'U'}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ComprehensiveDashboard />
      </main>
    </div>
  );
};

export default DashboardPage;