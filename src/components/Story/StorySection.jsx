// =============================================
// src/components/Story/StorySection.jsx
// =============================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/Language/LanguageContext';
import StoryCard from './StoryCard';
import { breakingNews } from '../../data/newsData';

const StorySection = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  const stories = [
    ...breakingNews.map(news => ({
      id: news.id,
      type: 'news',
      title: news.title[currentLanguage],
      image: news.image,
      isBreaking: news.isBreaking,
    })),
  ];

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {t('breaking')}
        </h2>
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StorySection;
