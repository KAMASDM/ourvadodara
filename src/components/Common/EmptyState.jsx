// =============================================
// src/components/Common/EmptyState.jsx
// =============================================
import React from 'react';
import { FileText, Search, Wifi } from 'lucide-react';

const EmptyState = ({ 
  type = 'default', 
  title, 
  description, 
  actionText, 
  onAction,
  icon: CustomIcon 
}) => {
  const getDefaultIcon = () => {
    switch (type) {
      case 'search':
        return Search;
      case 'offline':
        return Wifi;
      case 'no-content':
        return FileText;
      default:
        return FileText;
    }
  };

  const Icon = CustomIcon || getDefaultIcon();

  const getDefaultContent = () => {
    switch (type) {
      case 'search':
        return {
          title: 'No results found',
          description: 'Try adjusting your search terms or browse different categories'
        };
      case 'offline':
        return {
          title: 'You\'re offline',
          description: 'Check your internet connection and try again'
        };
      case 'no-content':
        return {
          title: 'No content available',
          description: 'There are no articles in this category yet'
        };
      default:
        return {
          title: 'Nothing here yet',
          description: 'Check back later for updates'
        };
    }
  };

  const defaultContent = getDefaultContent();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
        <Icon className="w-12 h-12 text-gray-400 dark:text-gray-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title || defaultContent.title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
        {description || defaultContent.description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;