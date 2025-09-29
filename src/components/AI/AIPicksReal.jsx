// =============================================
// src/components/AI/AIPicksReal.jsx
// AI-powered Content Recommendations with Firebase Integration
// =============================================

import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase-config';
import { DATABASE_PATHS } from '../../utils/databaseSchema';
import { Brain, Sparkles, Eye, Heart, MessageCircle, Clock, Star, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../context/Language/LanguageContext';

const AIPicksReal = ({ onPostClick }) => {
  const [posts, setPosts] = useState([]);
  const [aiPicks, setAiPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentLanguage } = useLanguage();

  // Calculate AI score based on engagement metrics
  const calculateAIScore = (post) => {
    const baseScore = 50;
    const viewWeight = 0.1;
    const likeWeight = 5;
    const commentWeight = 10;
    const recencyWeight = 20;
    
    const views = post.views || 0;
    const likes = post.likes || 0;
    const comments = post.comments || 0;
    
    // Recency bonus (newer posts get higher scores)
    const hoursOld = (Date.now() - new Date(post.publishedAt || post.createdAt).getTime()) / (1000 * 60 * 60);
    const recencyBonus = Math.max(0, recencyWeight * (1 - hoursOld / 24)); // Decreases over 24 hours
    
    const engagementScore = (views * viewWeight) + (likes * likeWeight) + (comments * commentWeight);
    const finalScore = Math.min(100, baseScore + engagementScore + recencyBonus);
    
    return Math.round(finalScore);
  };

  useEffect(() => {
    // Listen to posts and generate AI picks from actual data
    const postsRef = ref(db, 'posts');
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsArray = Object.entries(data)
          .map(([id, post]) => ({ ...post, id }))
          .filter(post => post.status === 'published')
          .map(post => ({
            ...post,
            aiScore: calculateAIScore(post),
            trending: (post.views || 0) > 100 && (Date.now() - new Date(post.publishedAt || post.createdAt).getTime()) < 24 * 60 * 60 * 1000
          }))
          .sort((a, b) => b.aiScore - a.aiScore)
          .slice(0, 6); // Top 6 AI picks

        setAiPicks(postsArray);
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
                  {(pick.media?.[0]?.url || pick.imageUrl) && (
                    <div className="flex-shrink-0">
                      <img
                        src={pick.media?.[0]?.url || pick.imageUrl}
                        alt={typeof pick.title === 'object' ? (pick.title[currentLanguage] || pick.title.en) : pick.title || 'AI Pick'}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Story Content */}
                  <div className="flex-1 min-w-0">
                    {/* Trending indicator */}
                    {pick.trending && (
                      <div className="flex items-center mb-1">
                        <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                        <span className="text-xs text-red-500 font-medium">Trending Now</span>
                      </div>
                    )}
                    
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2 pr-16">
                      {typeof pick.title === 'object' ? (pick.title[currentLanguage] || pick.title.en || Object.values(pick.title)[0]) : (pick.title || 'AI Recommended Story')}
                    </h3>
                    
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {typeof pick.excerpt === 'object' ? (pick.excerpt[currentLanguage] || pick.excerpt.en || Object.values(pick.excerpt)[0]) : (pick.excerpt || '')}
                    </p>
                    
                    {/* Why AI Picked This */}
                    <div className="mb-2">
                      <div className="flex items-center text-xs text-purple-600">
                        <Sparkles className="h-3 w-3 mr-1" />
                        <span className="italic">
                          {pick.aiScore >= 90 && "Exceptional engagement"}
                          {pick.aiScore >= 80 && pick.aiScore < 90 && "Trending in your interests"}
                          {pick.aiScore >= 70 && pick.aiScore < 80 && "High engagement from readers"}
                          {pick.aiScore >= 60 && pick.aiScore < 70 && "Popular in your area"}
                          {pick.aiScore >= 50 && pick.aiScore < 60 && "Recommended for you"}
                          {pick.aiScore < 50 && "Fresh content"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Engagement Metrics */}
                    <div className="flex items-center space-x-3 text-xs text-gray-500 mb-2">
                      <div className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {formatNumber(pick.views || 0)}
                      </div>
                      
                      <div className="flex items-center">
                        <Heart className="h-3 w-3 mr-1" />
                        {formatNumber(pick.likes || 0)}
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