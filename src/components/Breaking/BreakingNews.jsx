// =============================================
// src/components/Breaking/BreakingNews.jsx
// Breaking News Banner Component with Firebase Integration
// =============================================

import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase-config';
import { DATABASE_PATHS } from '../../utils/databaseSchema';
import { AlertTriangle, X, ExternalLink, Clock } from 'lucide-react';

const BreakingNews = () => {
  const [breakingNews, setBreakingNews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const breakingRef = ref(db, DATABASE_PATHS.BREAKING_NEWS);
    const unsubscribe = onValue(breakingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const activeNews = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(news => {
            const isActive = news.isActive;
            const notExpired = !news.expiresAt || new Date(news.expiresAt) > new Date();
            return isActive && notExpired;
          })
          .sort((a, b) => {
            // Sort by priority first, then by creation time
            const priorityOrder = { urgent: 3, high: 2, medium: 1, low: 0 };
            const aPriority = priorityOrder[a.priority] || 0;
            const bPriority = priorityOrder[b.priority] || 0;
            
            if (aPriority !== bPriority) return bPriority - aPriority;
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
        
        setBreakingNews(activeNews);
      } else {
        setBreakingNews([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-rotate breaking news items
  useEffect(() => {
    if (breakingNews.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % breakingNews.length);
      }, 8000); // Change every 8 seconds
      
      return () => clearInterval(interval);
    }
  }, [breakingNews.length]);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInMinutes = Math.floor((now - created) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-600 border-red-700';
      case 'high':
        return 'bg-orange-600 border-orange-700';
      case 'medium':
        return 'bg-yellow-600 border-yellow-700';
      default:
        return 'bg-blue-600 border-blue-700';
    }
  };

  if (loading || breakingNews.length === 0 || !isVisible) {
    return null;
  }

  const currentNews = breakingNews[currentIndex];

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${getPriorityStyle(currentNews.priority)} text-white shadow-lg border-b-2`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Breaking News Label */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              <span className="font-bold text-sm uppercase tracking-wide">
                {currentNews.priority === 'urgent' ? 'URGENT' : 'Breaking'}
              </span>
            </div>
            
            {/* News Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-4">
                <h3 className="font-semibold text-sm md:text-base truncate">
                  {currentNews.headline?.en || 'Breaking News'}
                </h3>
                
                {currentNews.summary?.en && (
                  <p className="hidden md:block text-sm opacity-90 truncate">
                    {currentNews.summary.en}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-3 mt-1 text-xs opacity-80">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTimeAgo(currentNews.createdAt)}
                </div>
                
                {currentNews.location && (
                  <span>{currentNews.location}</span>
                )}
                
                {breakingNews.length > 1 && (
                  <span>
                    {currentIndex + 1} of {breakingNews.length}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
            {currentNews.sourceUrl && (
              <a
                href={currentNews.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center space-x-1 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-full text-xs font-medium transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Read More</span>
              </a>
            )}
            
            {/* Progress Indicator */}
            {breakingNews.length > 1 && (
              <div className="hidden md:flex space-x-1">
                {breakingNews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex 
                        ? 'bg-white' 
                        : 'bg-white bg-opacity-40 hover:bg-opacity-60'
                    }`}
                  />
                ))}
              </div>
            )}
            
            {/* Close Button */}
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              title="Close breaking news"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        {breakingNews.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white bg-opacity-20">
            <div 
              className="h-full bg-white transition-all duration-8000 ease-linear"
              style={{ 
                width: `${((currentIndex + 1) / breakingNews.length) * 100}%` 
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BreakingNews;