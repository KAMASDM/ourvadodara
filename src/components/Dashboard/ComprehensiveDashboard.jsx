// =============================================
// src/components/Dashboard/ComprehensiveDashboard.jsx
// Complete dashboard with all advanced features
// =============================================
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard,
  Grid,
  List,
  Maximize2,
  Minimize2,
  Settings,
  Filter,
  Calendar,
  Map,
  Brain,
  Radio,
  TrendingUp,
  CloudSun
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Import all feature components
import WeatherWidget from '../Weather/WeatherWidget';
import LiveUpdates from '../Live/LiveUpdates';
import TrendingTopics from '../Trending/TrendingTopics';
import EventsCalendar from '../Events/EventsCalendar';
import PollWidget from '../Polls/PollWidget';
import NewsMap from '../Maps/NewsMap';
import SmartRecommendations from '../AI/SmartRecommendations';
import StatsCard from './StatsCard';

const ComprehensiveDashboard = ({ className = '' }) => {
  const { t } = useTranslation();
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid', 'list', 'compact'
  const [activeWidgets, setActiveWidgets] = useState({
    weather: true,
    liveUpdates: true,
    trending: true,
    events: true,
    polls: true,
    map: true,
    ai: true,
    stats: true
  });
  const [dashboardStats, setDashboardStats] = useState({
    totalReaders: 15420,
    articlesPublished: 89,
    engagement: 23.5,
    trendsDetected: 12
  });

  const widgets = [
    {
      id: 'weather',
      name: t('dashboard.widgets.weather', 'Weather'),
      icon: CloudSun,
      component: WeatherWidget,
      size: 'small',
      category: 'environment'
    },
    {
      id: 'liveUpdates',
      name: t('dashboard.widgets.live', 'Live Updates'),
      icon: Radio,
      component: LiveUpdates,
      size: 'large',
      category: 'news'
    },
    {
      id: 'trending',
      name: t('dashboard.widgets.trending', 'Trending Topics'),
      icon: TrendingUp,
      component: TrendingTopics,
      size: 'medium',
      category: 'analytics'
    },
    {
      id: 'events',
      name: t('dashboard.widgets.events', 'Events Calendar'),
      icon: Calendar,
      component: EventsCalendar,
      size: 'large',
      category: 'community'
    },
    {
      id: 'polls',
      name: t('dashboard.widgets.polls', 'Community Polls'),
      icon: Grid,
      component: PollWidget,
      size: 'medium',
      category: 'engagement'
    },
    {
      id: 'map',
      name: t('dashboard.widgets.map', 'News Map'),
      icon: Map,
      component: NewsMap,
      size: 'large',
      category: 'location'
    },
    {
      id: 'ai',
      name: t('dashboard.widgets.ai', 'Smart Recommendations'),
      icon: Brain,
      component: SmartRecommendations,
      size: 'large',
      category: 'ai'
    }
  ];

  const getGridColumns = (size) => {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-1 lg:col-span-2';
      case 'large': return 'col-span-1 lg:col-span-2 xl:col-span-3';
      default: return 'col-span-1';
    }
  };

  const toggleWidget = (widgetId) => {
    setActiveWidgets(prev => ({
      ...prev,
      [widgetId]: !prev[widgetId]
    }));
  };

  const renderStatsOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatsCard
        title={t('stats.readers', 'Total Readers')}
        value={dashboardStats.totalReaders}
        previousValue={12800}
        icon={({ className }) => <div className={className}>👥</div>}
        color="blue"
        format="number"
      />
      <StatsCard
        title={t('stats.articles', 'Articles Published')}
        value={dashboardStats.articlesPublished}
        previousValue={76}
        icon={({ className }) => <div className={className}>📰</div>}
        color="green"
        format="number"
      />
      <StatsCard
        title={t('stats.engagement', 'Engagement Rate')}
        value={dashboardStats.engagement}
        previousValue={19.2}
        icon={({ className }) => <div className={className}>💬</div>}
        color="purple"
        format="percentage"
      />
      <StatsCard
        title={t('stats.trends', 'Trends Detected')}
        value={dashboardStats.trendsDetected}
        previousValue={8}
        icon={({ className }) => <div className={className}>📈</div>}
        color="orange"
        format="number"
      />
    </div>
  );

  const renderGridLayout = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {widgets
        .filter(widget => activeWidgets[widget.id])
        .map(widget => {
          const WidgetComponent = widget.component;
          return (
            <div key={widget.id} className={getGridColumns(widget.size)}>
              <WidgetComponent className="h-full" />
            </div>
          );
        })}
    </div>
  );

  const renderListLayout = () => (
    <div className="space-y-6">
      {widgets
        .filter(widget => activeWidgets[widget.id])
        .map(widget => {
          const WidgetComponent = widget.component;
          return (
            <div key={widget.id} className="w-full">
              <div className="flex items-center space-x-2 mb-4">
                <widget.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {widget.name}
                </h3>
              </div>
              <WidgetComponent />
            </div>
          );
        })}
    </div>
  );

  const renderCompactLayout = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {widgets
        .filter(widget => activeWidgets[widget.id])
        .map(widget => {
          const WidgetComponent = widget.component;
          return (
            <div key={widget.id} className="col-span-1">
              <WidgetComponent className="h-80" />
            </div>
          );
        })}
    </div>
  );

  return (
    <div className={`${className}`}>
      {/* Dashboard Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <LayoutDashboard className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('dashboard.title', 'Comprehensive Dashboard')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('dashboard.subtitle', 'Your complete news and information hub')}
              </p>
            </div>
          </div>

          {/* Layout Controls */}
          <div className="flex items-center space-x-4">
            {/* Layout Mode Switcher */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-2 rounded transition-colors ${
                  layoutMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={t('dashboard.layout.grid', 'Grid Layout')}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutMode('list')}
                className={`p-2 rounded transition-colors ${
                  layoutMode === 'list'
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={t('dashboard.layout.list', 'List Layout')}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutMode('compact')}
                className={`p-2 rounded transition-colors ${
                  layoutMode === 'compact'
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={t('dashboard.layout.compact', 'Compact Layout')}
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Widget Toggle */}
            <div className="relative group">
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              
              {/* Widget Selection Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {t('dashboard.widgets.title', 'Active Widgets')}
                  </h4>
                  <div className="space-y-2">
                    {widgets.map(widget => (
                      <label key={widget.id} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeWidgets[widget.id]}
                          onChange={() => toggleWidget(widget.id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex items-center space-x-2 flex-1">
                          <widget.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {widget.name}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {['Refresh All', 'Export Data', 'Customize', 'Full Screen'].map((action, index) => (
            <button
              key={action}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {t(`dashboard.actions.${action.toLowerCase().replace(' ', '')}`, action)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      {renderStatsOverview()}

      {/* Main Dashboard Content */}
      <div className="space-y-8">
        {layoutMode === 'grid' && renderGridLayout()}
        {layoutMode === 'list' && renderListLayout()}
        {layoutMode === 'compact' && renderCompactLayout()}
      </div>

      {/* Dashboard Footer */}
      <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>{t('dashboard.lastUpdated', 'Last updated')}: {new Date().toLocaleString()}</span>
            <span>•</span>
            <span>{t('dashboard.dataSource', 'Real-time data')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>{t('dashboard.status.live', 'Live')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveDashboard;