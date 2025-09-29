// =============================================
// src/components/Trending/TrendingStoriesReal.jsx
// Real-time Trending Stories Component with Firebase Integration
// =============================================

import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase-config';
import { DATABASE_PATHS } from '../../utils/databaseSchema';
import { TrendingUp, Eye, Heart, MessageCircle, Share2, Clock } from 'lucide-react';

const TrendingStoriesReal = ({ onPostClick }) => {
  const [trendingStories, setTrendingStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const trendingRef = ref(db, DATABASE_PATHS.TRENDING_STORIES);
    const unsubscribe = onValue(trendingRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.stories) {
        setTrendingStories(data.stories.slice(0, 8)); // Show top 8 trending stories
      } else {
        setTrendingStories([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInMinutes = Math.floor((now - created) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getTrendingRank = (index) => {
    const colors = [
      'bg-yellow-500', // #1 - Gold
      'bg-gray-400',   // #2 - Silver
      'bg-amber-600',  // #3 - Bronze
      'bg-blue-500',   // #4+ - Blue
    ];
    return colors[index] || 'bg-blue-500';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-red-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Trending Now</h2>
          </div>
          <div className="text-xs text-gray-500">
            Updated in real-time
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {trendingStories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No trending stories available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trendingStories.map((story, index) => (
              <div 
                key={story.id} 
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onPostClick && onPostClick(story)}
              >
                {/* Trending Rank */}
                <div className={`flex-shrink-0 w-6 h-6 ${getTrendingRank(index)} text-white text-xs font-bold rounded-full flex items-center justify-center`}>
                  {index + 1}
                </div>
                
                {/* Story Image (if available) */}
                {story.imageUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={story.imageUrl}
                      alt={story.title?.en || 'Story image'}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  </div>
                )}
                
                {/* Story Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
                    {story.title?.en || 'Trending Story'}
                  </h3>
                  
                  {story.excerpt?.en && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {story.excerpt.en}
                    </p>
                  )}
                  
                  {/* Engagement Metrics */}
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {formatNumber(story.analytics?.views || 0)}
                    </div>
                    
                    <div className="flex items-center">
                      <Heart className="h-3 w-3 mr-1" />
                      {formatNumber(story.analytics?.likes || 0)}
                    </div>
                    
                    <div className="flex items-center">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      {formatNumber(story.analytics?.comments || 0)}
                    </div>
                    
                    <div className="flex items-center">
                      <Share2 className="h-3 w-3 mr-1" />
                      {formatNumber(story.analytics?.shares || 0)}
                    </div>
                  </div>
                  
                  {/* Trending Score and Time */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimeAgo(story.createdAt)}
                    </div>
                    
                    <div className="text-xs font-medium text-red-600">
                      🔥 {story.trendingScore?.toFixed(1) || '0.0'}
                    </div>
                  </div>
                  
                  {/* Category Badge */}
                  {story.category && (
                    <div className="mt-2">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {story.category}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendingStoriesReal;