// =============================================
// src/components/Admin/Dashboard.jsx
// =============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  FileText, 
  Eye, 
  TrendingUp, 
  Calendar,
  Clock,
  Globe,
  MessageSquare
} from 'lucide-react';
import StatsCard from '../Dashboard/StatsCard';
import LoadingSpinner from '../Common/LoadingSpinner';
import { ref, get } from 'firebase/database';
import { db } from '../../firebase-config';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { sampleNews } from '../../data/newsData';

const Dashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');

  // Real-time data hooks
  const { data: postsData } = useRealtimeData('posts');
  const { data: usersData } = useRealtimeData('users');
  const { data: commentsData } = useRealtimeData('comments');
  const { data: analyticsData } = useRealtimeData('analytics');

  useEffect(() => {
    const calculateStats = () => {
      setLoading(true);
      try {
        // Debug: Log the Firebase data to check what's available
        console.log('Posts Data:', postsData);
        console.log('Users Data:', usersData);
        console.log('Comments Data:', commentsData);
        console.log('Analytics Data:', analyticsData);
        
        // Use Firebase data if available, otherwise use sample data
        const dataSource = postsData && Object.keys(postsData).length > 0 ? postsData : sampleNews;
        const isUsingFirebase = postsData && Object.keys(postsData).length > 0;
        
        console.log('Using data source:', isUsingFirebase ? 'Firebase' : 'Sample Data');
        console.log('Data source content:', dataSource);
        
        // Calculate real stats from data source
        const totalPosts = isUsingFirebase ? Object.keys(postsData).length : sampleNews.length;
        const totalUsers = usersData ? Object.keys(usersData).length : 150; // Fallback for demo
        
        // Calculate total views from all posts
        let totalViews = 0;
        if (isUsingFirebase) {
          totalViews = Object.values(postsData).reduce((sum, post) => {
            const views = post.views || 0;
            console.log(`Post ${post.id || 'unknown'} views:`, views);
            return sum + views;
          }, 0);
        } else {
          totalViews = sampleNews.reduce((sum, post) => {
            const views = post.views || 0;
            console.log(`Post ${post.id} views:`, views);
            return sum + views;
          }, 0);
        }
        
        console.log('Total Views Calculated:', totalViews);
        
        // Calculate total comments
        const totalComments = commentsData ? Object.values(commentsData).reduce((sum, postComments) => {
          return sum + (postComments ? Object.keys(postComments).length : 0);
        }, 0) : 0;
        
        // Calculate total likes and shares
        let totalLikes = 0;
        let totalShares = 0;
        
        if (isUsingFirebase) {
          totalLikes = Object.values(postsData).reduce((sum, post) => sum + (post.likes || 0), 0);
          totalShares = Object.values(postsData).reduce((sum, post) => sum + (post.shares || 0), 0);
        } else {
          totalLikes = sampleNews.reduce((sum, post) => sum + (post.likes || 0), 0);
          totalShares = sampleNews.reduce((sum, post) => sum + (post.shares || 0), 0);
        }
        
        // Calculate engagement rate: (likes + comments + shares) / views * 100
        const totalEngagements = totalLikes + totalComments + totalShares;
        const engagementRate = totalViews > 0 ? ((totalEngagements / totalViews) * 100).toFixed(1) : 0;
        
        // Calculate average read time from actual analytics data
        let avgReadTime = 0;
        
        if (isUsingFirebase && totalPosts > 0) {
          avgReadTime = Object.values(postsData).reduce((sum, post) => {
            // Check if post has analytics data with read time
            const analyticsReadTime = post.analytics?.avgReadTime || 0;
            
            if (analyticsReadTime > 0) {
              return sum + analyticsReadTime;
            } else {
              // Fallback: calculate based on content length for posts without analytics
              const content = typeof post.content === 'object' ? 
                (post.content.en || post.content.hi || post.content.gu || '') : 
                (post.content || '');
              const wordCount = content.split(' ').length;
              const estimatedReadTime = Math.max(0.5, Math.round(wordCount / 200 * 60)); // seconds
              return sum + estimatedReadTime;
            }
          }, 0) / totalPosts / 60; // Convert to minutes
        } else if (!isUsingFirebase && totalPosts > 0) {
          // Use sample data for read time calculation
          avgReadTime = sampleNews.reduce((sum, post) => {
            const content = typeof post.content === 'object' ? 
              (post.content.en || post.content.hi || post.content.gu || '') : 
              (post.content || '');
            const wordCount = content.split(' ').length;
            const estimatedReadTime = Math.max(0.5, Math.round(wordCount / 200 * 60)); // seconds
            return sum + estimatedReadTime;
          }, 0) / totalPosts / 60; // Convert to minutes
        }
        
        // Calculate daily active users (estimate from recent activity)
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const recentUsers = usersData ? Object.values(usersData).filter(user => 
          user.lastActiveAt && new Date(user.lastActiveAt).getTime() > oneDayAgo
        ).length : Math.floor(totalUsers * 0.3);
        
        // Calculate time-based statistics for previous values
        const getTimeFilteredData = (data, timeRange) => {
          if (!data) return [];
          const now = Date.now();
          let timeThreshold = now;
          
          switch (timeRange) {
            case 'day':
              timeThreshold = now - (24 * 60 * 60 * 1000);
              break;
            case 'week':
              timeThreshold = now - (7 * 24 * 60 * 60 * 1000);
              break;
            case 'month':
              timeThreshold = now - (30 * 24 * 60 * 60 * 1000);
              break;
            case 'year':
              timeThreshold = now - (365 * 24 * 60 * 60 * 1000);
              break;
            default:
              return Object.values(data);
          }
          
          return Object.values(data).filter(item => 
            item.createdAt && new Date(item.createdAt).getTime() > timeThreshold
          );
        };
        
        // Handle time-based filtering for both Firebase and sample data
        let filteredPosts, filteredUsers;
        
        if (isUsingFirebase) {
          filteredPosts = getTimeFilteredData(postsData, timeRange);
          filteredUsers = getTimeFilteredData(usersData, timeRange);
        } else {
          // Convert sample data to object format for filtering
          const sampleDataObject = {};
          sampleNews.forEach(post => {
            sampleDataObject[post.id] = {
              ...post,
              createdAt: post.publishedAt.toISOString()
            };
          });
          filteredPosts = getTimeFilteredData(sampleDataObject, timeRange);
          filteredUsers = usersData ? getTimeFilteredData(usersData, timeRange) : [];
        }
        
        // Calculate previous period stats (same period length, but previous)
        const getPreviousPeriodData = (data, timeRange) => {
          if (!data) return [];
          const now = Date.now();
          let periodLength = 7 * 24 * 60 * 60 * 1000; // default week
          
          switch (timeRange) {
            case 'day':
              periodLength = 24 * 60 * 60 * 1000;
              break;
            case 'week':
              periodLength = 7 * 24 * 60 * 60 * 1000;
              break;
            case 'month':
              periodLength = 30 * 24 * 60 * 60 * 1000;
              break;
            case 'year':
              periodLength = 365 * 24 * 60 * 60 * 1000;
              break;
          }
          
          const currentPeriodStart = now - periodLength;
          const previousPeriodStart = currentPeriodStart - periodLength;
          
          return Object.values(data).filter(item => 
            item.createdAt && 
            new Date(item.createdAt).getTime() > previousPeriodStart &&
            new Date(item.createdAt).getTime() <= currentPeriodStart
          );
        };
        
        // Handle previous period data
        let previousPosts, previousUsers;
        
        if (isUsingFirebase) {
          previousPosts = getPreviousPeriodData(postsData, timeRange);
          previousUsers = getPreviousPeriodData(usersData, timeRange);
        } else {
          const sampleDataObject = {};
          sampleNews.forEach(post => {
            sampleDataObject[post.id] = {
              ...post,
              createdAt: post.publishedAt.toISOString()
            };
          });
          previousPosts = getPreviousPeriodData(sampleDataObject, timeRange);
          previousUsers = usersData ? getPreviousPeriodData(usersData, timeRange) : [];
        }
        
        // Calculate previous period metrics
        const prevTotalViews = previousPosts.reduce((sum, post) => sum + (post.views || 0), 0);
        const prevTotalLikes = previousPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
        const prevTotalShares = previousPosts.reduce((sum, post) => sum + (post.shares || 0), 0);
        const prevTotalEngagements = prevTotalLikes + (previousPosts.length * 2); // estimated comments
        const prevEngagementRate = prevTotalViews > 0 ? ((prevTotalEngagements / prevTotalViews) * 100).toFixed(1) : 0;
        
        setStats({
          totalUsers: { 
            current: filteredUsers.length || totalUsers, 
            previous: previousUsers.length || Math.max(0, totalUsers - 5) 
          },
          totalPosts: { 
            current: filteredPosts.length || totalPosts, 
            previous: previousPosts.length || Math.max(0, totalPosts - 2) 
          },
          totalViews: { 
            current: filteredPosts.reduce((sum, post) => sum + (post.views || 0), 0) || totalViews, 
            previous: prevTotalViews || Math.max(0, totalViews - 100) 
          },
          engagement: { 
            current: parseFloat(engagementRate), 
            previous: parseFloat(prevEngagementRate) || Math.max(0, parseFloat(engagementRate) - 5) 
          },
          dailyActiveUsers: { 
            current: recentUsers, 
            previous: Math.max(0, recentUsers - Math.floor(recentUsers * 0.1)) 
          },
          avgReadTime: { 
            current: parseFloat(avgReadTime.toFixed(1)), 
            previous: Math.max(1, parseFloat((avgReadTime * 0.9).toFixed(1))) 
          },
          shares: { 
            current: totalShares, 
            previous: prevTotalShares || Math.max(0, totalShares - Math.floor(totalShares * 0.1)) 
          },
          comments: { 
            current: totalComments, 
            previous: Math.max(0, totalComments - 10) 
          }
        });
      } catch (error) {
        console.error('Error calculating stats:', error);
        // Fallback stats in case of error
        setStats({
          totalUsers: { current: 0, previous: 0 },
          totalPosts: { current: 0, previous: 0 },
          totalViews: { current: 0, previous: 0 },
          engagement: { current: 0, previous: 0 },
          dailyActiveUsers: { current: 0, previous: 0 },
          avgReadTime: { current: 0, previous: 0 },
          shares: { current: 0, previous: 0 },
          comments: { current: 0, previous: 0 }
        });
      } finally {
        setLoading(false);
      }
    };

    calculateStats();
  }, [timeRange, postsData, usersData, commentsData, analyticsData]);

  const timeRanges = [
    { value: 'day', label: t('dashboard.today', 'Today') },
    { value: 'week', label: t('dashboard.thisWeek', 'This Week') },
    { value: 'month', label: t('dashboard.thisMonth', 'This Month') },
    { value: 'year', label: t('dashboard.thisYear', 'This Year') }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.title', 'Dashboard')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('dashboard.subtitle', 'Overview of your news platform performance')}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title={t('dashboard.totalUsers', 'Total Users')}
          value={stats.totalUsers.current}
          previousValue={stats.totalUsers.previous}
          icon={Users}
          color="blue"
          format="number"
        />
        
        <StatsCard
          title={t('dashboard.totalPosts', 'Total Posts')}
          value={stats.totalPosts.current}
          previousValue={stats.totalPosts.previous}
          icon={FileText}
          color="green"
          format="number"
        />
        
        <StatsCard
          title={t('dashboard.totalViews', 'Total Views')}
          value={stats.totalViews.current}
          previousValue={stats.totalViews.previous}
          icon={Eye}
          color="purple"
          format="number"
        />
        
        <StatsCard
          title={t('dashboard.engagement', 'Engagement Rate')}
          value={stats.engagement.current}
          previousValue={stats.engagement.previous}
          icon={TrendingUp}
          color="yellow"
          format="percentage"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title={t('dashboard.dailyActiveUsers', 'Daily Active Users')}
          value={stats.dailyActiveUsers.current}
          previousValue={stats.dailyActiveUsers.previous}
          icon={Calendar}
          color="indigo"
          format="number"
        />
        
        <StatsCard
          title={t('dashboard.avgReadTime', 'Avg. Read Time')}
          value={`${stats.avgReadTime.current}m`}
          previousValue={`${stats.avgReadTime.previous}m`}
          icon={Clock}
          color="red"
          format="text"
        />
        
        <StatsCard
          title={t('dashboard.shares', 'Total Shares')}
          value={stats.shares.current}
          previousValue={stats.shares.previous}
          icon={Globe}
          color="green"
          format="number"
        />
        
        <StatsCard
          title={t('dashboard.comments', 'Total Comments')}
          value={stats.comments.current}
          previousValue={stats.comments.previous}
          icon={MessageSquare}
          color="blue"
          format="number"
        />
      </div>

      {/* Additional Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('dashboard.recentActivity', 'Recent Activity')}
          </h2>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((_, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    New post published: "Sample News Title {index + 1}"
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {index + 1} hours ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('dashboard.insights', 'Performance Insights')}
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-400">
              <p className="text-sm text-green-800 dark:text-green-200">
                {t('dashboard.insight1', 'User engagement increased by 12% this week')}
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {t('dashboard.insight2', 'Most popular category: Local News')}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {t('dashboard.insight3', 'Peak reading time: 8-10 PM')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;