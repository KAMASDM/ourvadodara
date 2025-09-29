// =============================================
// src/pages/Category/CategoryPage.jsx
// =============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/Language/LanguageContext';
import { CATEGORIES } from '../../utils/constants';
import PostCard from '../../components/Feed/PostCard';
import { sampleNews } from '../../data/newsData';
import { ArrowLeft, Filter } from 'lucide-react';

const CategoryPage = ({ categoryId, onBack }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [sortBy, setSortBy] = useState('latest');
  const [filteredNews, setFilteredNews] = useState([]);

  const category = CATEGORIES.find(cat => cat.id === categoryId);

  useEffect(() => {
    let news = categoryId === 'all' 
      ? sampleNews 
      : sampleNews.filter(item => item.category === categoryId);

    // Sort news
    if (sortBy === 'latest') {
      news = news.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    } else if (sortBy === 'popular') {
      news = news.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === 'trending') {
      news = news.sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments));
    }

    setFilteredNews(news);
  }, [categoryId, sortBy]);

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Category not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{category.icon}</span>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {category.name[currentLanguage]}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-gray-700 dark:text-gray-300"
              >
                <option value="latest">Latest</option>
                <option value="popular">Popular</option>
                <option value="trending">Trending</option>
              </select>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {/* Category Stats */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredNews.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Articles in this category
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last updated
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                2 hours ago
              </p>
            </div>
          </div>
        </div>

        {/* News List */}
        {filteredNews.length > 0 ? (
          <div className="space-y-4">
            {filteredNews.map((post) => (
              <div key={post.id} className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <PostCard post={post} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">{category.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No articles yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Check back later for updates in this category
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;