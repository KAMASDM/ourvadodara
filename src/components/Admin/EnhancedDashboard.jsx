// =============================================
// src/components/Admin/EnhancedDashboard.jsx
// Real-time Analytics Dashboard with Filters
// =============================================
import React, { useState, useEffect, useMemo } from 'react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import {
  FileText,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Users,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Clock,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

const EnhancedDashboard = () => {
  const { data: postsData, loading: postsLoading } = useRealtimeData('posts');
  const { data: usersData } = useRealtimeData('users');
  const { data: commentsData } = useRealtimeData('comments');
  const { data: likesData } = useRealtimeData('likes');

  // Filter states
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month, year
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPost, setSelectedPost] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Convert Firebase data to arrays
  const posts = useMemo(() => {
    if (!postsData) return [];
    return Object.entries(postsData).map(([id, post]) => ({
      id,
      ...post
    }));
  }, [postsData]);

  const users = useMemo(() => {
    if (!usersData) return [];
    return Object.entries(usersData).map(([id, user]) => ({
      id,
      ...user
    }));
  }, [usersData]);

  // Extract categories
  const categories = useMemo(() => {
    const cats = new Set(posts.map(p => p.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [posts]);

  // Date filter helper
  const isInDateRange = (timestamp) => {
    if (!timestamp) return false;
    const postDate = new Date(timestamp);
    const now = new Date();
    
    if (customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      return postDate >= start && postDate <= end;
    }

    switch (dateRange) {
      case 'today':
        return postDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        return postDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        return postDate >= monthAgo;
      case 'year':
        const yearAgo = new Date(now - 365 * 24 * 60 * 60 * 1000);
        return postDate >= yearAgo;
      default:
        return true;
    }
  };

  // Filter posts based on all criteria
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const dateMatch = isInDateRange(post.publishedAt || post.createdAt);
      const categoryMatch = selectedCategory === 'all' || post.category === selectedCategory;
      const postMatch = selectedPost === 'all' || post.id === selectedPost;
      
      return dateMatch && categoryMatch && postMatch;
    });
  }, [posts, dateRange, selectedCategory, selectedPost, customStartDate, customEndDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalPosts = filteredPosts.length;
    
    // Calculate total views
    const totalViews = filteredPosts.reduce((sum, post) => {
      return sum + (post.analytics?.views || post.views || 0);
    }, 0);

    // Calculate total likes
    const totalLikes = filteredPosts.reduce((sum, post) => {
      return sum + (post.analytics?.likes || post.likes || 0);
    }, 0);

    // Calculate total comments
    let totalComments = 0;
    if (commentsData) {
      filteredPosts.forEach(post => {
        const postComments = commentsData[post.id];
        if (postComments) {
          totalComments += Object.keys(postComments).length;
        }
      });
    }

    // Calculate total shares
    const totalShares = filteredPosts.reduce((sum, post) => {
      return sum + (post.analytics?.shares || post.shares || 0);
    }, 0);

    // Engagement rate
    const totalEngagements = totalLikes + totalComments + totalShares;
    const engagementRate = totalViews > 0 ? ((totalEngagements / totalViews) * 100).toFixed(1) : 0;

    // Active users (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const activeUsers = users.filter(user => {
      const lastActive = new Date(user.lastActiveAt || user.lastLogin || 0).getTime();
      return lastActive > oneDayAgo;
    }).length;

    // Category breakdown
    const categoryStats = {};
    filteredPosts.forEach(post => {
      const cat = post.category || 'Uncategorized';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { count: 0, views: 0, likes: 0 };
      }
      categoryStats[cat].count++;
      categoryStats[cat].views += (post.analytics?.views || post.views || 0);
      categoryStats[cat].likes += (post.analytics?.likes || post.likes || 0);
    });

    // Top performing posts
    const topPosts = [...filteredPosts]
      .sort((a, b) => {
        const aViews = a.analytics?.views || a.views || 0;
        const bViews = b.analytics?.views || b.views || 0;
        return bViews - aViews;
      })
      .slice(0, 5);

    return {
      totalPosts,
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      engagementRate,
      activeUsers,
      totalUsers: users.length,
      categoryStats,
      topPosts
    };
  }, [filteredPosts, commentsData, users]);

  const handleExportData = () => {
    const exportData = {
      generatedAt: new Date().toISOString(),
      filters: { dateRange, selectedCategory, selectedPost },
      stats,
      posts: filteredPosts.map(p => ({
        id: p.id,
        title: p.title,
        category: p.category,
        views: p.analytics?.views || p.views || 0,
        likes: p.analytics?.likes || p.likes || 0,
        publishedAt: p.publishedAt
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${Date.now()}.json`;
    a.click();
  };

  if (postsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                <Activity className="w-8 h-8 text-blue-600" />
                <span>Real-time Analytics</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Live performance metrics and insights
              </p>
            </div>
            <button
              onClick={handleExportData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg"
            >
              <Download className="w-5 h-5" />
              <span>Export Data</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Post Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Specific Post
              </label>
              <select
                value={selectedPost}
                onChange={(e) => setSelectedPost(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Posts ({posts.length})</option>
                {posts.slice(0, 50).map(post => {
                  const title = typeof post.title === 'string' ? post.title : String(post.title || '');
                  const displayTitle = title ? title.substring(0, 50) : `Post ${post.id?.substring(0, 8) || 'Unknown'}`;
                  return (
                    <option key={post.id} value={post.id}>
                      {displayTitle}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setDateRange('all');
                  setSelectedCategory('all');
                  setSelectedPost('all');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FileText}
            label="Total Posts"
            value={stats.totalPosts}
            color="blue"
            trend="+12%"
          />
          <StatCard
            icon={Eye}
            label="Total Views"
            value={stats.totalViews.toLocaleString()}
            color="green"
            trend="+25%"
          />
          <StatCard
            icon={Heart}
            label="Total Likes"
            value={stats.totalLikes.toLocaleString()}
            color="red"
            trend="+18%"
          />
          <StatCard
            icon={MessageSquare}
            label="Total Comments"
            value={stats.totalComments.toLocaleString()}
            color="purple"
            trend="+8%"
          />
          <StatCard
            icon={Share2}
            label="Total Shares"
            value={stats.totalShares.toLocaleString()}
            color="orange"
            trend="+15%"
          />
          <StatCard
            icon={TrendingUp}
            label="Engagement Rate"
            value={`${stats.engagementRate}%`}
            color="indigo"
            trend="+5%"
          />
          <StatCard
            icon={Users}
            label="Active Users"
            value={stats.activeUsers.toLocaleString()}
            subtitle="Last 24 hours"
            color="teal"
          />
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats.totalUsers.toLocaleString()}
            color="cyan"
          />
        </div>

        {/* Top Posts & Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Posts */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Top Performing Posts</span>
            </h3>
            <div className="space-y-3">
              {stats.topPosts.map((post, index) => (
                <div
                  key={post.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-all"
                >
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 font-bold text-sm">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {typeof post.title === 'string' ? post.title : String(post.title || 'Untitled Post')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {post.category || 'General'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {(post.analytics?.views || post.views || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">views</p>
                  </div>
                </div>
              ))}
              {stats.topPosts.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No posts found in this filter
                </p>
              )}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              <span>Category Breakdown</span>
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.categoryStats)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([category, data]) => (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {category}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {data.count} posts
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(data.count / stats.totalPosts) * 100}%`
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{data.views.toLocaleString()} views</span>
                      <span>{data.likes.toLocaleString()} likes</span>
                    </div>
                  </div>
                ))}
              {Object.keys(stats.categoryStats).length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No categories found
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color, trend, subtitle }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    indigo: 'from-indigo-500 to-indigo-600',
    teal: 'from-teal-500 to-teal-600',
    cyan: 'from-cyan-500 to-cyan-600'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
        {label}
      </h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default EnhancedDashboard;
