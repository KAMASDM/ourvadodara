// =============================================
// src/components/Feed/NewsFeed.jsx
// Now fetching real-time data from Firebase
// =============================================
import React from 'react';
import PostCard from './PostCard';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { sampleNews } from '../../data/newsData';

const NewsFeed = ({ activeCategory, onPostClick }) => {
  const { data: postsObject, isLoading, error } = useRealtimeData('posts');

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
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Firebase Setup Required
          </h3>
          <p className="text-red-600 dark:text-red-300 mb-4">
            Database access denied. Please set up Firebase security rules first.
          </p>
          <a 
            href="?setup=firebase"
            className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Open Firebase Setup Helper
          </a>
        </div>
      </div>
    );
  }

  // Convert posts object to array and sort by date
  // Use Firebase data if available, otherwise use sample data
  const posts = postsObject && Object.keys(postsObject).length > 0
    ? Object.entries(postsObject)
        .map(([id, post]) => ({ id, ...post }))
        .filter(post => (post.status || 'published') !== 'draft')
        .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt))
    : [...sampleNews].sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));

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
