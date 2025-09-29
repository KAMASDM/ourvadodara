// =============================================
// src/components/AI/AIPicksReal.jsx
// AI-powered Content Recommendations with Firebase Integration
// =============================================

import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase-config';
import { DATABASE_PATHS } from '../../utils/databaseSchema';
import { Brain, Sparkles, Eye, Heart, MessageCircle, Clock, Star } from 'lucide-react';

const AIPicksReal = ({ onPostClick }) => {
  const [aiPicks, setAiPicks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const aiPicksRef = ref(db, DATABASE_PATHS.AI_PICKS);
    const unsubscribe = onValue(aiPicksRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.picks) {
        setAiPicks(data.picks.slice(0, 6)); // Show top 6 AI picks
      } else {
        setAiPicks([]);
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

  const getAIScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-amber-600 bg-amber-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getAIScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'New';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative">
              <Brain className="h-5 w-5 text-purple-600 mr-2" />
              <Sparkles className="h-3 w-3 text-amber-400 absolute -top-1 -right-1" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">AI Picks for You</h2>
          </div>
          <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
            Personalized
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {aiPicks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Brain className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>AI is learning your preferences...</p>
            <p className="text-xs mt-1">Check back soon for personalized content!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {aiPicks.map((pick, index) => (
              <div 
                key={pick.id} 
                className="relative p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md cursor-pointer transition-all"
                onClick={() => onPostClick && onPostClick(pick)}
              >
                {/* AI Score Badge */}
                <div className="absolute top-2 right-2">
                  <div className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getAIScoreColor(pick.aiScore * 10)}`}>
                    <Star className="h-3 w-3 mr-1" />
                    {getAIScoreLabel(pick.aiScore * 10)}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex space-x-3">
                  {/* Story Image */}
                  {pick.imageUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={pick.imageUrl}
                        alt={pick.title?.en || 'AI Pick'}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Story Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2 pr-16">
                      {pick.title?.en || 'AI Recommended Story'}
                    </h3>
                    
                    {pick.excerpt?.en && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {pick.excerpt.en}
                      </p>
                    )}
                    
                    {/* Why AI Picked This */}
                    <div className="mb-2">
                      <div className="flex items-center text-xs text-purple-600">
                        <Sparkles className="h-3 w-3 mr-1" />
                        <span className="italic">
                          {index === 0 && "Trending in your interests"}
                          {index === 1 && "High engagement from similar readers"}
                          {index === 2 && "Breaking news in your area"}
                          {index === 3 && "Popular in your reading history"}
                          {index === 4 && "Recommended based on your activity"}
                          {index >= 5 && "Curated for your preferences"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Engagement Metrics */}
                    <div className="flex items-center space-x-3 text-xs text-gray-500 mb-2">
                      <div className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {formatNumber(pick.analytics?.views || 0)}
                      </div>
                      
                      <div className="flex items-center">
                        <Heart className="h-3 w-3 mr-1" />
                        {formatNumber(pick.analytics?.likes || 0)}
                      </div>
                      
                      <div className="flex items-center">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {formatNumber(pick.analytics?.comments || 0)}
                      </div>
                    </div>
                    
                    {/* Time and AI Score */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTimeAgo(pick.createdAt)}
                      </div>
                      
                      <div className="text-xs font-medium text-purple-600">
                        AI Score: {(pick.aiScore * 10).toFixed(1)}/100
                      </div>
                    </div>
                    
                    {/* Category and Tags */}
                    <div className="flex items-center space-x-2 mt-2">
                      {pick.category && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                          {pick.category}
                        </span>
                      )}
                      
                      {pick.tags && pick.tags.slice(0, 2).map((tag, tagIndex) => (
                        <span 
                          key={tagIndex}
                          className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* AI Confidence Indicator */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>AI Confidence</span>
                    <span>{Math.round(pick.aiScore * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${pick.aiScore * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {/* AI Learning Notice */}
            <div className="text-center mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Brain className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-purple-700 font-medium mb-1">AI is learning your preferences</p>
              <p className="text-xs text-purple-600">
                The more you read and interact, the better our recommendations become!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPicksReal;