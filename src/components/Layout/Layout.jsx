// =============================================
// src/components/Layout/Layout.jsx
// =============================================
import React from 'react';
import Header from './Header';
import Navigation from './Navigation';
import OfflineIndicator from '../Common/OfflineIndicator';
import { useAuth } from '../../context/Auth/AuthContext';
import { useTheme } from '../../context/Theme/ThemeContext';

const Layout = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  showHeader = true, 
  showNavigation = true,
  containerClass = 'max-w-md',
  fullWidth = false
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200`}>
      <OfflineIndicator />
      
      {showHeader && (
        <Header 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
      
      <main className={`${
        fullWidth 
          ? 'w-full' 
          : `${containerClass} mx-auto`
      } ${showNavigation ? 'pb-20' : 'pb-4'} ${showHeader ? 'pt-16' : 'pt-4'} px-4 sm:px-6 lg:px-8`}>
        <div className="animate-fadeIn">
          {children}
        </div>
      </main>
      
      {showNavigation && (
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
        />
      )}
    </div>
  );
};

export default Layout;