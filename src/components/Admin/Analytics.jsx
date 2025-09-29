// =============================================
// src/components/Admin/Analytics.jsx
// =============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setAnalytics({
        overview: {
          totalViews: { current: 45234, previous: 38901 },
          uniqueVisitors: { current: 12456, previous: 10234 },
          pageViews: { current: 67890, previous: 56789 },
          bounceRate: { current: 32.5, previous: 38.2 },
          avgSessionDuration: { current: 245, previous: 198 },
          conversionRate: { current: 2.8, previous: 2.1 }
        },
        engagement: {
          likes: { current: 3421, previous: 2890 },
          comments: { current: 1876, previous: 1542 },
          shares: { current: 987, previous: 823 },
          bookmarks: { current: 456, previous: 389 }
        },
        traffic: {
          direct: 35,
          search: 28,
          social: 22,
          referral: 15
        },
        devices: {
          mobile: 68,
          desktop: 25,
          tablet: 7
        },
        topPages: [
          { path: '/news/vadodara-smart-city-update', views: 2345, title: 'Vadodara Smart City Update' },
          { path: '/news/traffic-management-system', views: 1876, title: 'Traffic Management System' },
          { path: '/news/cultural-festival-2024', views: 1543, title: 'Cultural Festival 2024' },
          { path: '/category/local-news', views: 1234, title: 'Local News Category' },
          { path: '/news/education-policy-changes', views: 987, title: 'Education Policy Changes' }
        ],
        timeData: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          views: [3200, 3800, 4100, 3900, 4300, 5200, 4800],
          users: [1200, 1400, 1500, 1350, 1600, 1900, 1750]
        }
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
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
            <div className="flex items-center justify-center mt-1">
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">
                +{((analytics.engagement.likes.current - analytics.engagement.likes.previous) / analytics.engagement.likes.previous * 100).toFixed(1)}%
              </span>
            </div>
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
            <div className="flex items-center justify-center mt-1">
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">
                +{((analytics.engagement.comments.current - analytics.engagement.comments.previous) / analytics.engagement.comments.previous * 100).toFixed(1)}%
              </span>
            </div>
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
            <div className="flex items-center justify-center mt-1">
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">
                +{((analytics.engagement.shares.current - analytics.engagement.shares.previous) / analytics.engagement.shares.previous * 100).toFixed(1)}%
              </span>
            </div>
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
            <div className="flex items-center justify-center mt-1">
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">
                +{((analytics.engagement.bookmarks.current - analytics.engagement.bookmarks.previous) / analytics.engagement.bookmarks.previous * 100).toFixed(1)}%
              </span>
            </div>
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