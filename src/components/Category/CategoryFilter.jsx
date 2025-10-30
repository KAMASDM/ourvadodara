// =============================================
// src/components/Category/CategoryFilter.jsx
// =============================================
import React from 'react';
import { useLanguage } from '../../context/Language/LanguageContext';
import { CATEGORIES } from '../../utils/constants';

const CategoryFilter = ({ activeCategory, setActiveCategory }) => {
  const { currentLanguage } = useLanguage();

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {CATEGORIES.map((category) => {
        const isActive = activeCategory === category.id;

        return (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
              isActive
                ? 'bg-primary-500 text-white border-primary-500 shadow-sm shadow-primary-500/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-sm leading-none">{category.icon}</span>
            <span className="whitespace-nowrap">{category.name[currentLanguage]}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;