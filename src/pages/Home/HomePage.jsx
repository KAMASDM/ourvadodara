// =============================================
// src/pages/Home/HomePage.jsx - Redesigned Layout with Pull-to-Refresh
// =============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../../components/Common/PullToRefreshIndicator';
import EnhancedStorySection from '../../components/Story/EnhancedStorySection';
import CategoryFilter from '../../components/Category/CategoryFilter';
import EnhancedNewsFeed from '../../components/Feed/EnhancedNewsFeed';
import ReelsRail from '../../components/Reels/ReelsRail.jsx';
import TodaysRoundup from '../../components/Feed/TodaysRoundup';
import WeatherWidget from '../../components/Weather/WeatherWidget';
import LiveUpdates from '../../components/Live/LiveUpdates';
import TrendingTopics from '../../components/Trending/TrendingTopics';
import EventsCalendar from '../../components/Events/EventsCalendar';
import PollWidget from '../../components/Polls/PollWidget';
import AIPicksReal from '../../components/AI/AIPicksReal';
import {
  Cloud,
  TrendingUp,
  Calendar,
  BarChart3,
  Sparkles,
  Radio,
  ChevronRight,
  SlidersHorizontal,
  X,
  Newspaper
} from 'lucide-react';

const HomePage = ({ onPostClick, onShowReels = () => {} }) => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSection, setActiveSection] = useState(null); // null means show news
  const [isSectionSheetOpen, setSectionSheetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showRoundup, setShowRoundup] = useState(false);

  // Pull-to-refresh implementation
  const handleRefresh = async () => {
    // Trigger a refresh by updating the key
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshKey(prev => prev + 1);
  };

  const {
    containerRef,
    refreshing,
    pullDistance,
    progress,
    rotation,
    isThresholdReached
  } = usePullToRefresh(handleRefresh, {
    threshold: 80,
    enabled: true
  });

  const sectionHeading = activeSection
    ? t('latest_news', 'Latest News')
    : t('top_stories', 'Top Stories');

  // Define available sections
  const sections = [
    {
      id: 'weather',
      name: t('weather', 'Weather'),
      icon: Cloud,
      color: 'bg-blue-500',
      component: WeatherWidget
    },
    {
      id: 'trending',
      name: t('trending', 'Trending'),
      icon: TrendingUp,
      color: 'bg-red-500',
      component: TrendingTopics
    },
    {
      id: 'events',
      name: t('events', 'Events'),
      icon: Calendar,
      color: 'bg-green-500',
      component: EventsCalendar
    },
    {
      id: 'polls',
      name: t('polls', 'Polls'),
      icon: BarChart3,
      color: 'bg-purple-500',
      component: PollWidget
    },
    {
      id: 'recommendations',
      name: t('ai_picks', 'AI Picks'),
      icon: Sparkles,
      color: 'bg-yellow-500',
      component: AIPicksReal
    },
    {
      id: 'live',
      name: t('live_updates', 'Live Updates'),
      icon: Radio,
      color: 'bg-orange-500',
      component: LiveUpdates
    }
  ];

  const handleSectionClick = (sectionId) => {
    setActiveSection((current) => (current === sectionId ? null : sectionId));
    setSectionSheetOpen(false);
  };

  const ActiveSectionComponent = activeSection 
    ? sections.find(s => s.id === activeSection)?.component 
    : null;

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Pull-to-refresh indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        progress={progress}
        rotation={rotation}
        isThresholdReached={isThresholdReached}
        refreshing={refreshing}
      />
      
      <div className="relative flex flex-col">
        <div
          className="sticky z-30 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.28)]"
          style={{ top: '4.5rem' }}
        >
          {activeSection && ActiveSectionComponent && (
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <div className="px-2 sm:px-3 py-2.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full ${sections.find(s => s.id === activeSection)?.color}`}>
                      {React.createElement(sections.find(s => s.id === activeSection)?.icon, {
                        className: 'h-4 w-4 text-white'
                      })}
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                      {sections.find(s => s.id === activeSection)?.name}
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveSection(null)}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span>{t('show_news', 'Show News')}</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="max-h-[45vh] overflow-y-auto pr-1">
                  <ActiveSectionComponent onPostClick={onPostClick} />
                </div>
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="px-2 sm:px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  {sectionHeading}
                </h2>
                <div className="flex items-center gap-2">
                  {activeSection && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {sections.find((s) => s.id === activeSection)?.name}
                    </span>
                  )}
                  {activeSection && (
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {t('scroll_for_updates', 'Scroll for more updates')}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSectionSheetOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {t('home.open_focus', 'Focus')}
                </button>
              </div>

              <CategoryFilter
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 bg-gray-50 dark:bg-gray-950 pt-0 pb-6">
          {!activeSection && (
            <div className="space-y-4 px-2 sm:px-3 mt-3 mb-5">
              <EnhancedStorySection
                onViewStory={(story) => console.log('View story:', story)}
              />

              {/* Today's News Roundup Button */}
              <button
                onClick={() => setShowRoundup(true)}
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Newspaper className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-bold text-lg">Today's News Roundup</h3>
                      <p className="text-white/80 text-sm">Catch up on today's top stories</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                      <span className="text-white text-xs font-semibold">View All</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>

              <ReelsRail
                onSelectReel={(reelId) => onShowReels(reelId)}
              />
            </div>
          )}

          <div className="mt-3">
            <EnhancedNewsFeed
              key={refreshKey}
              activeCategory={activeCategory}
              onPostClick={onPostClick}
              feedType="all"
            />
          </div>
        </div>
      </div>

      {/* Today's Roundup Modal */}
      {showRoundup && (
        <TodaysRoundup onClose={() => setShowRoundup(false)} />
      )}

      {isSectionSheetOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/40 backdrop-blur-sm">
          <button
            type="button"
            aria-label={t('home.close_focus_panel', 'Close focus panel')}
            className="absolute inset-0"
            onClick={() => setSectionSheetOpen(false)}
          />
          <div className="relative z-50 flex max-h-[70vh] w-full flex-col rounded-t-3xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
            <div className="px-5 pt-4 pb-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('home.choose_focus', 'Choose a focus')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('home.choose_focus_hint', 'Tap a section to spotlight or return to news.')}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={t('home.close_focus_panel', 'Close focus panel')}
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2 text-gray-500 hover:text-gray-700 dark:border-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                  onClick={() => setSectionSheetOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid max-h-[55vh] grid-cols-1 gap-3 overflow-y-auto pr-2 sm:grid-cols-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => handleSectionClick(section.id)}
                      className={`flex items-center justify-between rounded-2xl border-2 px-3.5 py-3 text-left transition-all ${
                        isActive
                          ? 'border-warmBrown-400 bg-ivory-50 text-warmBrown-900 shadow-ivory-lg dark:border-gray-200/50 dark:bg-gray-800 dark:text-white'
                          : 'border-warmBrown-200 bg-ivory-100 text-warmBrown-800 hover:border-warmBrown-300 hover:bg-ivory-50 hover:shadow-ivory dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${section.color} text-white shadow-sm`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-semibold">
                          {section.name}
                        </span>
                      </span>
                      {isActive && (
                        <ChevronRight className="h-4 w-4 text-warmBrown-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;