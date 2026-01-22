// =============================================
// src/components/Topics/TrendingTopicsWidget.jsx
// Trending Topics Discovery Widget
// =============================================
import React, { useState, useEffect } from 'react';
import { useTopicFollowing } from '../../context/Topics/TopicFollowingContext';
import TopicChip from './TopicChip';
import { TrendingUp, Hash } from 'lucide-react';

const TrendingTopicsWidget = ({ onTopicClick }) => {
  const { getTrendingTopics, followedTopics } = useTopicFollowing();
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        setLoading(true);
        const topics = await getTrendingTopics(8);
        setTrendingTopics(topics);
      } catch (error) {
        // Silently handle errors - getTrendingTopics already returns fallback data
        console.debug('Could not load trending topics, using fallback');
      } finally {
        setLoading(false);
      }
    };

    loadTrending();
  }, [followedTopics]);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-4">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (trendingTopics.length === 0) {
    return null;
  }

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-orange-500" />
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Trending Topics
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {trendingTopics.map((topic) => (
          <TopicChip
            key={topic.topic}
            topic={topic.topic}
            onClick={onTopicClick}
            size="md"
            showFollowButton={true}
          />
        ))}
      </div>

      {followedTopics.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Following ({followedTopics.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {followedTopics.slice(0, 5).map((topic) => (
              <TopicChip
                key={topic}
                topic={topic}
                onClick={onTopicClick}
                size="sm"
                showFollowButton={false}
              />
            ))}
            {followedTopics.length > 5 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                +{followedTopics.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendingTopicsWidget;
