// =============================================
// src/components/Feed/NewsFeed.jsx
// Now fetching real-time data from Firebase
// =============================================
import React from 'react';
import PostCard from './PostCard';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import { useRealtimeData } from '../../hooks/useRealtimeData';

const NewsFeed = ({ activeCategory, onPostClick }) => {
  const { data: postsObject, isLoading, error } = useRealtimeData('publicPosts', { scope: 'global', orderByField: 'timestamp', limitLast: 120 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 m-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">News is temporarily unavailable</h3>
          <p className="text-red-600 dark:text-red-300 mb-4">
            Please check your connection and try again shortly.
          </p>
        </div>
      </div>
    );
  }

  // Convert posts object to array and sort by date
  // Never show sample stories as if they were live news.
  const posts = postsObject && Object.keys(postsObject).length > 0
    ? Object.entries(postsObject)
        .map(([id, post]) => ({ id, ...post }))
        .filter(post => !['draft', 'scheduled'].includes(post.status || 'published'))
        .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt))
    : [];

  const filteredNews = activeCategory === 'all'
    ? posts
    : posts.filter(news => news.category === activeCategory);

  if (filteredNews.length === 0) {
    return <EmptyState type="no-content" />;
  }

  return (
    <div className="space-y-0">
      {filteredNews.map((post, index) => (
        <PostCard 
          key={post.id || `post-${index}`} 
          post={post} 
          onPostClick={onPostClick}
        />
      ))}
    </div>
  );
};

export default NewsFeed;
