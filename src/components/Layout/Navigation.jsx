// =============================================
// src/components/Layout/Navigation.jsx
// =============================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Search, User, AlertTriangle } from 'lucide-react';
import logoImage from '../../assets/images/our-vadodara-logo.png.png';

const Navigation = ({ activeTab, setActiveTab }) => {
  const { t } = useTranslation();

  const leftNavItems = [
    { id: 'home', icon: Home, label: t('home') },
    { id: 'search', icon: Search, label: t('search') },
  ];

  const rightNavItems = [
    { id: 'breaking', icon: AlertTriangle, label: 'Breaking' },
    { id: 'profile', icon: User, label: t('profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center py-2 px-4">
          {/* Left Navigation Items */}
          <div className="flex space-x-4">
            {leftNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Center Logo */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setActiveTab('home')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <img 
                src={logoImage} 
                alt="Our Vadodara" 
                className="w-8 h-8 object-contain"
              />
            </button>
          </div>

          {/* Right Navigation Items */}
          <div className="flex space-x-4">
            {rightNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${item.id === 'breaking' ? 'animate-pulse text-red-500' : ''}`} />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;