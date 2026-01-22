// =============================================
// src/pages/Home/HomePage.jsx - Redesigned Layout with Pull-to-Refresh
// =============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../../components/Common/PullToRefreshIndicator';
import EnhancedStorySection from '../../components/Story/EnhancedStorySection';
import CategoryFilter from '../../components/Category/CategoryFilter';
import SwipeableCategoryFilter from '../../components/Category/SwipeableCategoryFilter';
import EnhancedNewsFeed from '../../components/Feed/EnhancedNewsFeed';
import DesktopNewsFeed from '../../components/Feed/DesktopNewsFeed';
import WeatherWidget from '../../components/Weather/WeatherWidget';
import LiveUpdates from '../../components/Live/LiveUpdates';
import TrendingTopics from '../../components/Trending/TrendingTopics';
import TrendingTopicsWidget from '../../components/Topics/TrendingTopicsWidget';
import EventsCalendar from '../../components/Events/EventsCalendar';
import PollWidget from '../../components/Polls/PollWidget';
import AIPicksReal from '../../components/AI/AIPicksReal';
import ReadingStreak from '../../components/Gamification/ReadingStreak';
import {
  Cloud,
  TrendingUp,
  Calendar,
  BarChart3,
  Sparkles,
  Radio,
  ChevronRight,
  SlidersHorizontal,
  X
} from 'lucide-react';

const HomePage = ({ onPostClick, onShowReels = () => {} }) => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSection, setActiveSection] = useState(null); // null means show news
  const [isSectionSheetOpen, setSectionSheetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [feedTab, setFeedTab] = useState('for-you'); // 'for-you' | 'following' | 'all'
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      id: 'trending',
      name: t('trending', 'Trending'),
      icon: TrendingUp,
      color: 'bg-red-500',
      component: TrendingTopics
    },
    {
      id: 'weather',
      name: t('weather', 'Weather'),
      icon: Cloud,
      color: 'bg-blue-500',
      component: WeatherWidget
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
    <div ref={containerRef} className={`min-h-screen bg-gray-50 dark:bg-gray-950 ${!isDesktop ? 'pb-24' : ''}`}>
      {/* Pull-to-refresh indicator - mobile only */}
      {!isDesktop && (
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          progress={progress}
          rotation={rotation}
          isThresholdReached={isThresholdReached}
          refreshing={refreshing}
        />
      )}
      
      {/* Desktop view - no sticky sections */}
      {isDesktop ? (
        <div className="pt-6">
          <DesktopNewsFeed
            key={refreshKey}
            category={activeCategory === 'all' ? null : activeCategory}
            feedType="all"
            onPostClick={onPostClick}
          />
        </div>
      ) : (
        /* Mobile view - with sticky sections */
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

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSectionClick('weather')}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-sm transition-colors ${
                        activeSection === 'weather'
                          ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-sky-50 text-blue-700 dark:border-blue-700 dark:from-blue-900/20 dark:to-sky-900/20 dark:text-blue-300'
                          : 'border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50 text-blue-600 hover:border-blue-300 hover:from-blue-100 hover:to-sky-100 dark:border-blue-800 dark:from-blue-900/20 dark:to-sky-900/20 dark:text-blue-400 dark:hover:border-blue-700'
                      }`}
                    >
                      <span className="text-sm">☁️</span>
                      {t('weather', 'Weather')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onShowReels()}
                      className="inline-flex items-center gap-1 rounded-full border border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 px-3 py-1.5 text-[11px] font-semibold text-pink-700 shadow-sm transition-colors hover:border-pink-300 hover:from-pink-100 hover:to-purple-100 dark:border-pink-800 dark:from-pink-900/20 dark:to-purple-900/20 dark:text-pink-300 dark:hover:border-pink-700"
                    >
                      <span className="text-sm">🎬</span>
                      Reels
                    </button>
                    <button
                      type="button"
                      onClick={() => setSectionSheetOpen(true)}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      {t('home.open_focus', 'Focus')}
                    </button>
                  </div>
                </div>

                {/* Feed Tabs */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setFeedTab('for-you')}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      feedTab === 'for-you'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      ✨ {t('for_you', 'For You')}
                    </span>
                  </button>
                  <button
                    onClick={() => setFeedTab('all')}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      feedTab === 'all'
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {t('all', 'All')}
                  </button>
                </div>

                <SwipeableCategoryFilter
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 bg-gray-50 dark:bg-gray-950 pt-0 pb-6">
            {!activeSection && (
              <div className="px-2 sm:px-3 mt-3 mb-3">
                <EnhancedStorySection
                  onViewStory={(story) => console.log('View story:', story)}
                />
              </div>
            )}

            {/* Widgets Section */}
            <div className="px-2 sm:px-3 mt-3 space-y-3">
              <TrendingTopicsWidget 
                onTopicClick={(topic) => {
                  setSelectedTopic(topic);
                  console.log('Topic clicked:', topic);
                }}
              />
              
              <ReadingStreak compact={true} />
            </div>

            <div className="mt-3">
              <EnhancedNewsFeed
                key={`${refreshKey}-${feedTab}-${selectedTopic}`}
                activeCategory={activeCategory}
                onPostClick={onPostClick}
                feedType="all"
              />
            </div>
          </div>
        </div>
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