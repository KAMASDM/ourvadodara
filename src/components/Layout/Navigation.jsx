// =============================================
// src/components/Layout/Navigation.jsx
// =============================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Calendar, User, AlertTriangle } from 'lucide-react';
import logoImage from '../../assets/images/our-vadodara-logo.png.png';

const Navigation = ({ activeTab, setActiveTab }) => {
  const { t } = useTranslation();

  const leftNavItems = [
    { id: 'home', icon: Home, label: t('home') },
    { id: 'events', icon: Calendar, label: 'Events' },
  ];

  const rightNavItems = [
    { id: 'breaking', icon: AlertTriangle, label: 'Breaking' },
    { id: 'profile', icon: User, label: t('profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-bg-card-dark border-t border-border-light dark:border-border-dark z-50 shadow-lg">
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
                  className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'text-accent bg-accent/10 dark:bg-accent/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-text-dark dark:hover:text-text-light hover:bg-surface-light dark:hover:bg-surface-dark'
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
              className="p-2 rounded-full hover:bg-surface-light dark:hover:bg-surface-dark transition-colors duration-200"
            >
              <div className="w-14 h-14 bg-white dark:bg-white rounded-full p-1.5 shadow-lg">
                <img 
                  src={logoImage} 
                  alt="Our Vadodara" 
                  className="w-full h-full object-contain"
                />
              </div>
            </button>
          </div>

          {/* Right Navigation Items */}
          <div className="flex space-x-2">
            {rightNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'text-accent bg-accent/10 dark:bg-accent/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-text-dark dark:hover:text-text-light hover:bg-surface-light dark:hover:bg-surface-dark'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${item.id === 'breaking' ? 'animate-pulse text-accent' : ''}`} />
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