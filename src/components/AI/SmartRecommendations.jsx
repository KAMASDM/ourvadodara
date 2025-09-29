// =============================================
// src/components/AI/SmartRecommendations.jsx
// AI-powered news recommendations
// =============================================
import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Star, 
  Clock, 
  TrendingUp,
  Eye,
  Heart,
  Bookmark,
  Share2,
  RefreshCw,
  Settings,
  Filter,
  Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SmartRecommendations = ({ className = '' }) => {
  const { t } = useTranslation();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recommendationType, setRecommendationType] = useState('personalized');
  const [userPreferences, setUserPreferences] = useState({
    interests: ['local', 'politics', 'sports'],
    readingTime: 'medium',
    contentType: 'mixed'
  });

  // Mock AI recommendations
  const mockRecommendations = {
    personalized: [
      {
        id: 1,
        title: 'Smart City Initiative: Vadodara Gets ₹500 Crore Investment',
        excerpt: 'New smart infrastructure projects to transform city connectivity and services...',
        category: 'local',
        readTime: 4,
        confidence: 0.95,
        reason: 'Based on your interest in local development and government initiatives',
        engagement: { views: 12400, likes: 230, comments: 45 },
        publishedAt: '2025-09-28T10:30:00Z',
        imageUrl: '/images/smart-city.jpg',
        trending: true,
        personalizedScore: 94
      },
      {
        id: 2,
        title: 'Local Cricket Team Wins State Championship',
        excerpt: 'Vadodara Warriors defeat defending champions in thrilling final match...',
        category: 'sports',
        readTime: 3,
        confidence: 0.88,
        reason: 'You frequently read sports articles and follow local teams',
        engagement: { views: 8700, likes: 156, comments: 32 },
        publishedAt: '2025-09-28T15:45:00Z',
        imageUrl: '/images/cricket-victory.jpg',
        trending: false,
        personalizedScore: 87
      },
      {
        id: 3,
        title: 'New Education Policy Implementation in Gujarat Schools',
        excerpt: 'State government announces comprehensive reforms in curriculum and teaching methods...',
        category: 'education',
        readTime: 6,
        confidence: 0.82,
        reason: 'Similar to articles you\'ve bookmarked recently',
        engagement: { views: 5600, likes: 89, comments: 23 },
        publishedAt: '2025-09-28T08:15:00Z',
        imageUrl: '/images/education-policy.jpg',
        trending: false,
        personalizedScore: 78
      }
    ],
    trending: [
      {
        id: 4,
        title: 'Monsoon Update: Heavy Rainfall Expected This Week',
        excerpt: 'Weather department issues advisory for Vadodara and surrounding districts...',
        category: 'weather',
        readTime: 2,
        confidence: 0.91,
        reason: 'Trending topic with high user engagement',
        engagement: { views: 23400, likes: 412, comments: 89 },
        publishedAt: '2025-09-28T12:00:00Z',
        imageUrl: '/images/monsoon.jpg',
        trending: true,
        personalizedScore: 85
      }
    ],
    breaking: [
      {
        id: 5,
        title: 'Emergency: Bridge Closure on Express Highway',
        excerpt: 'Immediate traffic diversions in place as maintenance work begins urgently...',
        category: 'traffic',
        readTime: 1,
        confidence: 0.99,
        reason: 'Breaking news requiring immediate attention',
        engagement: { views: 18900, likes: 234, comments: 67 },
        publishedAt: '2025-09-28T16:20:00Z',
        imageUrl: '/images/bridge-closure.jpg',
        trending: true,
        personalizedScore: 92
      }
    ]
  };

  const recommendationTypes = [
    { id: 'personalized', name: t('ai.types.personalized', 'For You'), icon: Brain },
    { id: 'trending', name: t('ai.types.trending', 'Trending'), icon: TrendingUp },
    { id: 'breaking', name: t('ai.types.breaking', 'Breaking'), icon: Zap }
  ];

  useEffect(() => {
    loadRecommendations();
  }, [recommendationType]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const recs = mockRecommendations[recommendationType] || [];
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      local: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      sports: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      education: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      weather: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      traffic: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      politics: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.8) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('ai.title', 'Smart Recommendations')}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadRecommendations}
              className={`p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors ${loading ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Recommendation Type Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {recommendationTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setRecommendationType(type.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  recommendationType === type.id
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{type.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommendations Content */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-4">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {t('ai.noRecommendations', 'No recommendations available')}
            </p>
            <button
              onClick={loadRecommendations}
              className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              {t('ai.retry', 'Try Again')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="group border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                <div className="flex space-x-4">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                      {rec.category.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(rec.category)}`}>
                          {rec.category}
                        </span>
                        {rec.trending && (
                          <div className="flex items-center space-x-1 text-orange-500">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-xs font-medium">{t('ai.trending', 'Trending')}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className={`w-4 h-4 ${getConfidenceColor(rec.confidence)}`} />
                        <span className={`text-xs font-medium ${getConfidenceColor(rec.confidence)}`}>
                          {Math.round(rec.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {rec.title}
                    </h4>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                      {rec.excerpt}
                    </p>

                    {/* AI Reason */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md p-2 mb-3">
                      <div className="flex items-center space-x-1 mb-1">
                        <Brain className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-medium text-purple-800 dark:text-purple-200">
                          {t('ai.whyRecommended', 'Why recommended:')}
                        </span>
                      </div>
                      <p className="text-xs text-purple-700 dark:text-purple-300">
                        {rec.reason}
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{rec.readTime} min read</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{formatNumber(rec.engagement.views)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="w-3 h-3" />
                          <span>{formatNumber(rec.engagement.likes)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="hover:text-gray-700 dark:hover:text-gray-300">
                          <Bookmark className="w-3 h-3" />
                        </button>
                        <button className="hover:text-gray-700 dark:hover:text-gray-300">
                          <Share2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personalized Score Bar */}
                {recommendationType === 'personalized' && (
                  <div className="mt-3 pt-3 border-t dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t('ai.matchScore', 'Match Score')}
                      </span>
                      <span className="font-medium text-purple-600 dark:text-purple-400">
                        {rec.personalizedScore}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-purple-500 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${rec.personalizedScore}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {recommendations.length > 0 && (
          <div className="mt-6 text-center">
            <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm">
              {t('ai.loadMore', 'Load More Recommendations')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartRecommendations;