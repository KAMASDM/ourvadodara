// =============================================
// src/components/Admin/Analytics.jsx
// =============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ref, get, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from '../../firebase-config';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Heart, 
  MessageCircle,
  Share,
  Calendar,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import StatsCard from '../Dashboard/StatsCard';
import LoadingSpinner from '../Common/LoadingSpinner';

const Analytics = () => {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [activeChart, setActiveChart] = useState('traffic');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch all posts with their analytics data
      const postsRef = ref(db, 'posts');
      const postsSnapshot = await get(postsRef);
      const postsData = postsSnapshot.val() || {};
      
      console.log('Raw posts data from Firebase:', postsData);
      console.log('Number of posts:', Object.keys(postsData).length);
      
      // Convert to array
      const posts = Object.entries(postsData).map(([id, post]) => ({
        id,
        ...post,
        views: post.views || post.analytics?.views || 0,
        likes: post.likes || post.analytics?.likes || 0,
        comments: post.comments || post.analytics?.comments || 0,
        shares: post.analytics?.shares || 0,
        createdAt: post.createdAt || post.timestamp || Date.now()
      }));
      
      console.log('Processed posts:', posts);
      console.log('Sample post views:', posts.slice(0, 3).map(p => ({ id: p.id, views: p.views, likes: p.likes })));
      
      // Calculate time range filter
      const now = Date.now();
      const timeFilters = {
        day: now - (24 * 60 * 60 * 1000),
        week: now - (7 * 24 * 60 * 60 * 1000),
        month: now - (30 * 24 * 60 * 60 * 1000),
        quarter: now - (90 * 24 * 60 * 60 * 1000),
        year: now - (365 * 24 * 60 * 60 * 1000)
      };
      
      const filterTime = timeFilters[timeRange];
      const previousFilterTime = filterTime - (now - filterTime); // Same duration before
      
      console.log('Time range:', timeRange);
      console.log('Filter time:', new Date(filterTime));
      console.log('Now:', new Date(now));
      
      // Filter posts by time range
      const currentPosts = posts.filter(p => new Date(p.createdAt).getTime() >= filterTime);
      const previousPosts = posts.filter(p => {
        const time = new Date(p.createdAt).getTime();
        return time >= previousFilterTime && time < filterTime;
      });
      
      console.log('Current posts count:', currentPosts.length);
      console.log('Previous posts count:', previousPosts.length);
      console.log('All posts (no filter):', posts.length);
      
      // Calculate totals
      const calculateTotals = (postsList) => {
        return postsList.reduce((acc, post) => ({
          views: acc.views + (post.views || 0),
          likes: acc.likes + (post.likes || 0),
          comments: acc.comments + (post.comments || 0),
          shares: acc.shares + (post.shares || 0)
        }), { views: 0, likes: 0, comments: 0, shares: 0 });
      };
      
      const currentTotals = calculateTotals(currentPosts);
      const previousTotals = calculateTotals(previousPosts);
      
      console.log('Current totals:', currentTotals);
      console.log('Previous totals:', previousTotals);
      
      // Fetch comments count
      const commentsRef = ref(db, 'comments');
      const commentsSnapshot = await get(commentsRef);
      const commentsData = commentsSnapshot.val() || {};
      const currentComments = Object.values(commentsData).filter(c => 
        new Date(c.createdAt).getTime() >= filterTime
      ).length;
      const previousComments = Object.values(commentsData).filter(c => {
        const time = new Date(c.createdAt).getTime();
        return time >= previousFilterTime && time < filterTime;
      }).length;
      
      // Calculate unique visitors (approximation based on posts * 0.6)
      const currentUniqueVisitors = Math.floor(currentTotals.views * 0.6);
      const previousUniqueVisitors = Math.floor(previousTotals.views * 0.6);
      
      // Calculate page views (views + comments interactions)
      const currentPageViews = currentTotals.views + currentComments;
      const previousPageViews = previousTotals.views + previousComments;
      
      // Get top posts
      const topPosts = [...posts]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .map(post => ({
          path: `/news/${post.id}`,
          views: post.views || 0,
          title: post.title?.en || post.title?.gu || post.title?.hi || 'Untitled'
        }));
      
      // Simulate device breakdown based on typical mobile-first patterns
      const devices = {
        mobile: 68,
        desktop: 25,
        tablet: 7
      };
      
      // Simulate traffic sources
      const traffic = {
        direct: 35,
        search: 28,
        social: 22,
        referral: 15
      };
      
      // Calculate engagement rates
      const engagementRate = currentTotals.views > 0 
        ? ((currentTotals.likes + currentComments + currentTotals.shares) / currentTotals.views * 100).toFixed(1)
        : 0;
      const previousEngagementRate = previousTotals.views > 0
        ? ((previousTotals.likes + previousComments + previousTotals.shares) / previousTotals.views * 100).toFixed(1)
        : 0;
      
      // Generate time series data for charts
      const getDaysInRange = () => {
        const days = timeRange === 'day' ? 24 : timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
        return days;
      };
      
      const days = getDaysInRange();
      const timeData = {
        labels: timeRange === 'day' 
          ? Array.from({length: 24}, (_, i) => `${i}:00`)
          : Array.from({length: Math.min(days, 30)}, (_, i) => `Day ${i + 1}`),
        views: Array.from({length: Math.min(days, 30)}, () => 
          Math.floor(currentTotals.views / Math.min(days, 30) + Math.random() * 100)
        ),
        users: Array.from({length: Math.min(days, 30)}, () => 
          Math.floor(currentUniqueVisitors / Math.min(days, 30) + Math.random() * 50)
        )
      };
      
      setAnalytics({
        overview: {
          totalViews: { current: currentTotals.views, previous: previousTotals.views },
          uniqueVisitors: { current: currentUniqueVisitors, previous: previousUniqueVisitors },
          pageViews: { current: currentPageViews, previous: previousPageViews },
          bounceRate: { current: 32.5, previous: 38.2 }, // Simulated
          avgSessionDuration: { current: 245, previous: 198 }, // Simulated
          conversionRate: { current: parseFloat(engagementRate), previous: parseFloat(previousEngagementRate) }
        },
        engagement: {
          likes: { current: currentTotals.likes, previous: previousTotals.likes },
          comments: { current: currentComments, previous: previousComments },
          shares: { current: currentTotals.shares, previous: previousTotals.shares },
          bookmarks: { current: Math.floor(currentTotals.likes * 0.3), previous: Math.floor(previousTotals.likes * 0.3) }
        },
        traffic,
        devices,
        topPages: topPosts,
        timeData
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Fallback to dummy data
      setAnalytics({
        overview: {
          totalViews: { current: 0, previous: 0 },
          uniqueVisitors: { current: 0, previous: 0 },
          pageViews: { current: 0, previous: 0 },
          bounceRate: { current: 0, previous: 0 },
          avgSessionDuration: { current: 0, previous: 0 },
          conversionRate: { current: 0, previous: 0 }
        },
        engagement: {
          likes: { current: 0, previous: 0 },
          comments: { current: 0, previous: 0 },
          shares: { current: 0, previous: 0 },
          bookmarks: { current: 0, previous: 0 }
        },
        traffic: { direct: 0, search: 0, social: 0, referral: 0 },
        devices: { mobile: 0, desktop: 0, tablet: 0 },
        topPages: [],
        timeData: { labels: [], views: [], users: [] }
      });
    } finally {
      setLoading(false);
    }
  };

  const timeRanges = [
    { value: 'day', label: t('analytics.today', 'Today') },
    { value: 'week', label: t('analytics.thisWeek', 'This Week') },
    { value: 'month', label: t('analytics.thisMonth', 'This Month') },
    { value: 'quarter', label: t('analytics.thisQuarter', 'This Quarter') },
    { value: 'year', label: t('analytics.thisYear', 'This Year') }
  ];

  // Safe percentage calculation that handles zero values
  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) {
      return current > 0 ? '+100' : '0';
    }
    const change = ((current - previous) / previous * 100).toFixed(1);
    return change > 0 ? `+${change}` : change;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('analytics.title', 'Analytics Dashboard')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('analytics.subtitle', 'Track your website performance and user engagement')}
          </p>
        </div>
        
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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title={t('analytics.totalViews', 'Total Views')}
          value={analytics.overview.totalViews.current}
          previousValue={analytics.overview.totalViews.previous}
          icon={Eye}
          color="blue"
          format="number"
        />
        
        <StatsCard
          title={t('analytics.uniqueVisitors', 'Unique Visitors')}
          value={analytics.overview.uniqueVisitors.current}
          previousValue={analytics.overview.uniqueVisitors.previous}
          icon={Users}
          color="green"
          format="number"
        />
        
        <StatsCard
          title={t('analytics.pageViews', 'Page Views')}
          value={analytics.overview.pageViews.current}
          previousValue={analytics.overview.pageViews.previous}
          icon={Globe}
          color="purple"
          format="number"
        />
        
        <StatsCard
          title={t('analytics.bounceRate', 'Bounce Rate')}
          value={analytics.overview.bounceRate.current}
          previousValue={analytics.overview.bounceRate.previous}
          icon={TrendingDown}
          color="red"
          format="percentage"
        />
        
        <StatsCard
          title={t('analytics.avgSessionDuration', 'Avg. Session Duration')}
          value={Math.floor(analytics.overview.avgSessionDuration.current / 60)}
          previousValue={Math.floor(analytics.overview.avgSessionDuration.previous / 60)}
          icon={Clock}
          color="indigo"
          format="number"
        />
        
        <StatsCard
          title={t('analytics.conversionRate', 'Conversion Rate')}
          value={analytics.overview.conversionRate.current}
          previousValue={analytics.overview.conversionRate.previous}
          icon={TrendingUp}
          color="yellow"
          format="percentage"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('analytics.trafficSources', 'Traffic Sources')}
          </h3>
          <div className="space-y-4">
            {Object.entries(analytics.traffic).map(([source, percentage]) => (
              <div key={source} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    source === 'direct' ? 'bg-blue-500' :
                    source === 'search' ? 'bg-green-500' :
                    source === 'social' ? 'bg-purple-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {source}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        source === 'direct' ? 'bg-blue-500' :
                        source === 'search' ? 'bg-green-500' :
                        source === 'social' ? 'bg-purple-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Analytics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('analytics.deviceBreakdown', 'Device Breakdown')}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('analytics.mobile', 'Mobile')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${analytics.devices.mobile}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {analytics.devices.mobile}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Monitor className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('analytics.desktop', 'Desktop')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-green-500"
                    style={{ width: `${analytics.devices.desktop}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {analytics.devices.desktop}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Tablet className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('analytics.tablet', 'Tablet')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-purple-500"
                    style={{ width: `${analytics.devices.tablet}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {analytics.devices.tablet}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {t('analytics.engagement', 'Engagement Metrics')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg mx-auto mb-3">
              <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.engagement.likes.current.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('analytics.likes', 'Likes')}
            </p>
            {analytics.engagement.likes.current > 0 && (
              <div className="flex items-center justify-center mt-1">
                {calculatePercentageChange(analytics.engagement.likes.current, analytics.engagement.likes.previous).startsWith('+') ? (
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                )}
                <span className={`text-xs ${calculatePercentageChange(analytics.engagement.likes.current, analytics.engagement.likes.previous).startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {calculatePercentageChange(analytics.engagement.likes.current, analytics.engagement.likes.previous)}%
                </span>
              </div>
            )}
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.engagement.comments.current.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('analytics.comments', 'Comments')}
            </p>
            {analytics.engagement.comments.current > 0 && (
              <div className="flex items-center justify-center mt-1">
                {calculatePercentageChange(analytics.engagement.comments.current, analytics.engagement.comments.previous).startsWith('+') ? (
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                )}
                <span className={`text-xs ${calculatePercentageChange(analytics.engagement.comments.current, analytics.engagement.comments.previous).startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {calculatePercentageChange(analytics.engagement.comments.current, analytics.engagement.comments.previous)}%
                </span>
              </div>
            )}
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg mx-auto mb-3">
              <Share className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.engagement.shares.current.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('analytics.shares', 'Shares')}
            </p>
            {analytics.engagement.shares.current > 0 && (
              <div className="flex items-center justify-center mt-1">
                {calculatePercentageChange(analytics.engagement.shares.current, analytics.engagement.shares.previous).startsWith('+') ? (
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                )}
                <span className={`text-xs ${calculatePercentageChange(analytics.engagement.shares.current, analytics.engagement.shares.previous).startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {calculatePercentageChange(analytics.engagement.shares.current, analytics.engagement.shares.previous)}%
                </span>
              </div>
            )}
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg mx-auto mb-3">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.engagement.bookmarks.current.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('analytics.bookmarks', 'Bookmarks')}
            </p>
            {analytics.engagement.bookmarks.current > 0 && (
              <div className="flex items-center justify-center mt-1">
                {calculatePercentageChange(analytics.engagement.bookmarks.current, analytics.engagement.bookmarks.previous).startsWith('+') ? (
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                )}
                <span className={`text-xs ${calculatePercentageChange(analytics.engagement.bookmarks.current, analytics.engagement.bookmarks.previous).startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {calculatePercentageChange(analytics.engagement.bookmarks.current, analytics.engagement.bookmarks.previous)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Pages */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {t('analytics.topPages', 'Top Pages')}
        </h3>
        <div className="space-y-4">
          {analytics.topPages.map((page, index) => (
            <div key={page.path} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-sm font-medium">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {page.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {page.path}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {page.views.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('analytics.views', 'views')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;