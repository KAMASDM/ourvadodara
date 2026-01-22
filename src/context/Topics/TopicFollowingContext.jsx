// =============================================
// src/context/Topics/TopicFollowingContext.jsx
// Topic/Hashtag Following System
// =============================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../Auth/AuthContext';
import { ref, get, set, update, remove } from 'firebase/database';
import { db } from '../../firebase-config';

const TopicFollowingContext = createContext();

export const useTopicFollowing = () => {
  const context = useContext(TopicFollowingContext);
  if (!context) {
    throw new Error('useTopicFollowing must be used within a TopicFollowingProvider');
  }
  return context;
};

export const TopicFollowingProvider = ({ children }) => {
  const { user } = useAuth();
  const [followedTopics, setFollowedTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load user's followed topics
  useEffect(() => {
    if (!user || user.isAnonymous) {
      setFollowedTopics([]);
      setLoading(false);
      return;
    }

    const loadFollowedTopics = async () => {
      try {
        setLoading(true);
        const topicsRef = ref(db, `users/${user.uid}/followedTopics`);
        const snapshot = await get(topicsRef);

        if (snapshot.exists()) {
          const topics = Object.keys(snapshot.val());
          setFollowedTopics(topics);
        } else {
          setFollowedTopics([]);
        }
      } catch (error) {
        console.error('Error loading followed topics:', error);
        setFollowedTopics([]);
      } finally {
        setLoading(false);
      }
    };

    loadFollowedTopics();
  }, [user]);

  const followTopic = async (topic) => {
    if (!user || user.isAnonymous) {
      document.dispatchEvent(new Event('showGuestPrompt'));
      return false;
    }

    try {
      const normalizedTopic = topic.toLowerCase().replace(/^#/, '');
      const topicRef = ref(db, `users/${user.uid}/followedTopics/${normalizedTopic}`);
      
      await set(topicRef, {
        followedAt: Date.now(),
        topic: normalizedTopic
      });

      // Optimistically update local state
      setFollowedTopics(prev => [...prev, normalizedTopic]);

      // Try to update global topic followers count (but don't fail if permission denied)
      try {
        const globalTopicRef = ref(db, `topics/${normalizedTopic}/followers`);
        const snapshot = await get(globalTopicRef);
        const currentCount = snapshot.exists() ? snapshot.val() : 0;
        await set(globalTopicRef, currentCount + 1);
      } catch (globalError) {
        // Silently ignore permission errors for global stats
        if (!globalError.message.includes('Permission denied')) {
          console.warn('Could not update global topic stats:', globalError);
        }
      }

      return true;
    } catch (error) {
      console.error('Error following topic:', error);
      return false;
    }
  };

  const unfollowTopic = async (topic) => {
    if (!user || user.isAnonymous) return false;

    try {
      const normalizedTopic = topic.toLowerCase().replace(/^#/, '');
      const topicRef = ref(db, `users/${user.uid}/followedTopics/${normalizedTopic}`);
      
      await remove(topicRef);

      // Optimistically update local state
      setFollowedTopics(prev => prev.filter(t => t !== normalizedTopic));

      // Try to update global topic followers count (but don't fail if permission denied)
      try {
        const globalTopicRef = ref(db, `topics/${normalizedTopic}/followers`);
        const snapshot = await get(globalTopicRef);
        const currentCount = snapshot.exists() ? snapshot.val() : 0;
        await set(globalTopicRef, Math.max(0, currentCount - 1));
      } catch (globalError) {
        // Silently ignore permission errors for global stats
        if (!globalError.message.includes('Permission denied')) {
          console.warn('Could not update global topic stats:', globalError);
        }
      }

      return true;
    } catch (error) {
      console.error('Error unfollowing topic:', error);
      return false;
    }
  };

  const isFollowing = (topic) => {
    const normalizedTopic = topic.toLowerCase().replace(/^#/, '');
    return followedTopics.includes(normalizedTopic);
  };

  const toggleTopic = async (topic) => {
    if (isFollowing(topic)) {
      return await unfollowTopic(topic);
    } else {
      return await followTopic(topic);
    }
  };

  // Extract topics from text
  const extractTopics = (text) => {
    if (!text) return [];
    const hashtagRegex = /#[\w\u0900-\u097F\u0A80-\u0AFF]+/g;
    const matches = text.match(hashtagRegex) || [];
    return matches.map(tag => tag.toLowerCase().replace('#', ''));
  };

  // Get trending topics
  const getTrendingTopics = async (limit = 10) => {
    try {
      const topicsRef = ref(db, 'topics');
      const snapshot = await get(topicsRef);

      if (!snapshot.exists()) {
        // Return mock trending topics if no data
        return getMockTrendingTopics(limit);
      }

      const topics = Object.entries(snapshot.val())
        .map(([topic, data]) => ({
          topic,
          followers: data.followers || 0,
          posts: data.posts || 0
        }))
        .sort((a, b) => b.followers - a.followers)
        .slice(0, limit);

      return topics.length > 0 ? topics : getMockTrendingTopics(limit);
    } catch (error) {
      // Silently handle permission errors and return mock data
      if (error.code === 'PERMISSION_DENIED' || error.message.includes('Permission denied')) {
        return getMockTrendingTopics(limit);
      }
      console.error('Error getting trending topics:', error);
      return getMockTrendingTopics(limit);
    }
  };

  // Mock trending topics for fallback
  const getMockTrendingTopics = (limit = 10) => {
    const mockTopics = [
      { topic: 'vadodara', followers: 1250, posts: 340 },
      { topic: 'localnews', followers: 980, posts: 256 },
      { topic: 'gujaratnews', followers: 875, posts: 189 },
      { topic: 'breaking', followers: 720, posts: 145 },
      { topic: 'cityupdate', followers: 650, posts: 178 },
      { topic: 'development', followers: 540, posts: 123 },
      { topic: 'education', followers: 480, posts: 98 },
      { topic: 'politics', followers: 420, posts: 87 },
      { topic: 'sports', followers: 390, posts: 112 },
      { topic: 'business', followers: 350, posts: 76 }
    ];
    return mockTopics.slice(0, limit);
  };

  const value = {
    followedTopics,
    loading,
    followTopic,
    unfollowTopic,
    isFollowing,
    toggleTopic,
    extractTopics,
    getTrendingTopics
  };

  return (
    <TopicFollowingContext.Provider value={value}>
      {children}
    </TopicFollowingContext.Provider>
  );
};
