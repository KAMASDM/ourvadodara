// =============================================
// src/components/Trending/TrendingTopics.jsx
// Trending topics and hashtags
// =============================================
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Hash, 
  Clock, 
  Eye, 
  MessageCircle,
  ArrowRight,
  Flame,
  Globe,
  MapPin
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TrendingTopics = ({ className = '' }) => {
  const { t } = useTranslation();
  const [timeFilter, setTimeFilter] = useState('24h');
  const [locationFilter, setLocationFilter] = useState('vadodara');
  const [trends, setTrends] = useState([]);

  // Mock trending data
  const mockTrends = {
    vadodara: {
      '1h': [
        { id: 1, hashtag: '#VadodaraRains', posts: 1247, growth: 45, category: 'weather' },
        { id: 2, hashtag: '#TrafficUpdate', posts: 892, growth: 23, category: 'traffic' },
        { id: 3, hashtag: '#LocalNews', posts: 567, growth: 12, category: 'local' }
      ],
      '24h': [
        { id: 1, hashtag: '#VadodaraMetro', posts: 15420, growth: 78, category: 'development' },
        { id: 2, hashtag: '#FestivalPrep', posts: 12380, growth: 56, category: 'culture' },
        { id: 3, hashtag: '#CityDevelopment', posts: 9876, growth: 34, category: 'development' },
        { id: 4, hashtag: '#LocalBusiness', posts: 8901, growth: 28, category: 'business' },
        { id: 5, hashtag: '#EducationNews', posts: 7654, growth: 19, category: 'education' },
        { id: 6, hashtag: '#HealthCare', posts: 6543, growth: 15, category: 'health' }
      ],
      '7d': [
        { id: 1, hashtag: '#GujaratElections', posts: 98765, growth: 145, category: 'politics' },
        { id: 2, hashtag: '#SmartCity', posts: 76543, growth: 89, category: 'development' },
        { id: 3, hashtag: '#NavratriPrep', posts: 65432, growth: 67, category: 'culture' },
        { id: 4, hashtag: '#StartupVadodara', posts: 54321, growth: 45, category: 'business' }
      ]
    },
    gujarat: {
      '24h': [
        { id: 1, hashtag: '#GujaratNews', posts: 45678, growth: 123, category: 'general' },
        { id: 2, hashtag: '#AhmedabadUpdates', posts: 34567, growth: 87, category: 'city' },
        { id: 3, hashtag: '#SuratBusiness', posts: 23456, growth: 56, category: 'business' }
      ]
    }
  };

  useEffect(() => {
    const currentTrends = mockTrends[locationFilter]?.[timeFilter] || [];
    setTrends(currentTrends);
  }, [timeFilter, locationFilter]);

  const getCategoryColor = (category) => {
    const colors = {
      weather: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      traffic: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      local: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      development: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      culture: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      business: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      politics: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      education: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      health: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[category] || colors.general;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="p-3 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('trending.title', 'Trending Topics')}
            </h3>
          </div>
          <TrendingUp className="w-5 h-5 text-green-500" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          {/* Time Filter */}
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {['1h', '24h', '7d'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    timeFilter === filter
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Location Filter */}
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-3 py-1 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="vadodara">{t('location.vadodara', 'Vadodara')}</option>
              <option value="gujarat">{t('location.gujarat', 'Gujarat')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trending List */}
      <div className="p-3 max-h-72 overflow-y-auto">
        {trends.length === 0 ? (
          <div className="text-center py-8">
            <Hash className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {t('trending.noTrends', 'No trending topics found')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trends.map((trend, index) => (
              <div
                key={trend.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-3 flex-1">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-bold text-gray-600 dark:text-gray-400">
                    {index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Hash className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {trend.hashtag.replace('#', '')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(trend.category)}`}>
                        {trend.category}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{formatNumber(trend.posts)} posts</span>
                      </div>
                      <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>+{trend.growth}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </div>
            ))}
          </div>
        )}

        {/* View More */}
        {trends.length > 0 && (
          <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <button className="w-full flex items-center justify-center space-x-2 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
              <Globe className="w-4 h-4" />
              <span>{t('trending.viewMore', 'View all trending topics')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendingTopics;