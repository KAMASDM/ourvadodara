// =============================================
// src/components/Breaking/BreakingNewsView.jsx
// Public Breaking News View for Regular Users
// =============================================
import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Calendar,
  MapPin,
  Share2,
  ChevronRight,
  Zap
} from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase-config';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';

const BreakingNewsView = ({ onPostClick }) => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const [breakingNews, setBreakingNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState('all');

  useEffect(() => {
    const breakingRef = ref(db, 'breakingNews');
    const unsubscribe = onValue(breakingRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const newsArray = Object.entries(data)
          .map(([id, news]) => ({ id, ...news }))
          .filter(news => news.isActive && (!news.expiresAt || new Date(news.expiresAt) > new Date()))
          .sort((a, b) => {
            // Sort by priority first, then by creation date
            const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
              return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
        setBreakingNews(newsArray);
      } else {
        setBreakingNews([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getTextContent = (content) => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
      return content[currentLanguage] || content.en || content.hi || content.gu || Object.values(content)[0] || '';
    }
    return '';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white shadow-inner shadow-red-900/30';
      case 'high':
        return 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-inner shadow-orange-900/20';
      case 'medium':
        return 'bg-gradient-to-r from-yellow-400 to-amber-300 text-gray-900 shadow-inner shadow-amber-500/20';
      case 'low':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-inner shadow-blue-900/20';
      default:
        return 'bg-gradient-to-r from-gray-600 to-slate-500 text-white shadow-inner shadow-gray-900/20';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical': return <Zap className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const filteredNews = selectedPriority === 'all' 
    ? breakingNews 
    : breakingNews.filter(news => news.priority === selectedPriority);

  const handleNewsClick = (news) => {
    if (news.externalLink) {
      window.open(news.externalLink, '_blank');
    } else if (onPostClick && news.relatedPostId) {
      onPostClick(news.relatedPostId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-24">
      <div className="px-4 pt-8 pb-6 sm:pt-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="rounded-3xl border border-red-200/60 dark:border-red-500/40 bg-gradient-to-br from-red-600 via-rose-600 to-orange-500 text-white shadow-lg shadow-red-500/30 p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-white/20">
                  <AlertTriangle className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Breaking News</h1>
                  <p className="text-sm sm:text-base text-white/80">
                    Stay updated with urgent alerts curated by the newsroom team.
                  </p>
                </div>
              </div>
              <div className="flex items-center text-sm text-white/80">
                <Clock className="w-4 h-4 mr-2" />
                Live feed auto-refreshes every few minutes.
              </div>
            </div>
          </div>

          {/* Priority Filter */}
          <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/90 dark:bg-gray-900/90 backdrop-blur p-4 shadow-sm shadow-gray-200/40 dark:shadow-black/30">
            <div className="flex flex-wrap gap-2">
              {['all', 'critical', 'high', 'medium', 'low'].map(priority => (
                <button
                  key={priority}
                  onClick={() => setSelectedPriority(priority)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                    selectedPriority === priority
                      ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {priority === 'all' ? 'All Updates' : `${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`}
                </button>
              ))}
            </div>
          </div>

          {/* Breaking News List */}
          <div className="space-y-5">
        {filteredNews.length === 0 ? (
          <div className="rounded-3xl border border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-b from-white/95 via-white to-gray-50 dark:from-gray-900/95 dark:via-gray-900 dark:to-gray-950 shadow-sm shadow-gray-200/40 dark:shadow-black/30 p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Breaking News
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {selectedPriority === 'all' 
                ? 'There are currently no active breaking news updates.'
                : `No ${selectedPriority} priority updates at this time.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNews.map(news => (
              <div 
                key={news.id} 
                className="rounded-3xl border border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-b from-white/95 via-white to-gray-50 dark:from-gray-900/95 dark:via-gray-900 dark:to-gray-950 overflow-hidden shadow-sm shadow-gray-200/40 dark:shadow-black/30 hover:-translate-y-1 hover:shadow-2xl transition-all"
              >
                {/* Priority Badge */}
                <div className={`px-4 py-2 ${getPriorityColor(news.priority)} flex items-center justify-between`}> 
                  <div className="flex items-center space-x-2">
                    {getPriorityIcon(news.priority)}
                    <span className="font-medium text-sm uppercase">
                      {news.priority} Priority
                    </span>
                    {news.category && (
                      <span className="text-xs opacity-80">
                        • {news.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-xs opacity-80">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(news.createdAt))} ago</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {getTextContent(news.title)}
                  </h2>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    {getTextContent(news.content)}
                  </p>

                  {/* Media */}
                  {news.media && news.media.length > 0 && (
                    <div className="mb-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {news.media.slice(0, 3).map((media, index) => (
                          <div key={index} className="relative">
                            {media.type === 'image' ? (
                              <img 
                                src={media.url} 
                                alt="Breaking news media"
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            ) : (
                              <video 
                                src={media.url}
                                className="w-full h-32 object-cover rounded-lg"
                                controls={false}
                                muted
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(news.createdAt).toLocaleDateString()}
                      </span>
                      {news.location && (
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {news.location}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {/* Handle share */}}
                        className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      
                      {(news.externalLink || news.relatedPostId) && (
                        <button
                          onClick={() => handleNewsClick(news)}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-full hover:bg-red-700 shadow shadow-red-500/30 transition-colors"
                        >
                          <span>Read More</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>

  {/* Live Updates Banner */}
  {breakingNews.some(news => news.priority === 'critical') && (
        <div className="fixed bottom-20 left-4 right-4 z-40 max-w-sm mx-auto">
          <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-medium">
                Critical updates available • Check latest news
              </span>
            </div>
          </div>
        </div>
  )}
</div>
  );
};

export default BreakingNewsView;