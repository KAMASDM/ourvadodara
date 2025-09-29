// =============================================
// src/components/Category/CategoryFilter.jsx
// =============================================
import React from 'react';
import { useLanguage } from '../../context/Language/LanguageContext';
import { CATEGORIES } from '../../utils/constants';

const CategoryFilter = ({ activeCategory, setActiveCategory }) => {
  const { currentLanguage } = useLanguage();

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 py-3">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-full border transition-colors ${
                  isActive
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-sm">{category.icon}</span>
                <span className="text-sm font-medium whitespace-nowrap">
                  {category.name[currentLanguage]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryFilter;