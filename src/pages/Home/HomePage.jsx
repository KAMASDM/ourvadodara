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
import logoImage from '../../assets/images/our-vadodara-logo.png.png';
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
    <div ref={containerRef} className={`min-h-screen ${!isDesktop ? 'pb-24' : ''}`}>
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

      {/* Desktop view */}
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
        /* Mobile view */
        <div className="flex flex-col">

          {/* ── Sticky control bar ── */}
          <div
            className="sticky z-30 px-2 pt-1"
            style={{ top: 'calc(56px + env(safe-area-inset-top) + 4px)' }}
          >
            <div className="liquid-panel rounded-[1.35rem] px-3 py-2.5 space-y-2.5 border border-white/60 dark:border-white/10">

              {/* Row 1: section title + focus button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-inner ring-1 ring-white/70">
                    <img src={logoImage} alt="Our Vadodara" className="h-10 w-10 object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-teal-700">Our Vadodara</p>
                    <div className="flex items-center gap-1.5">
                      {activeSection && (
                        <span className={`w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-lg ${sections.find(s => s.id === activeSection)?.color}`}>
                          {React.createElement(sections.find(s => s.id === activeSection)?.icon, { className: 'w-3 h-3 text-white' })}
                        </span>
                      )}
                      <h2 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                        {activeSection
                          ? sections.find(s => s.id === activeSection)?.name
                          : t('top_stories', 'Top Stories')}
                      </h2>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {activeSection && (
                    <button
                      type="button"
                      onClick={() => setActiveSection(null)}
                      className="liquid-chip px-2.5 py-1 text-xs font-semibold text-neutral-600 dark:text-neutral-300 transition"
                    >
                      <X className="w-3 h-3" />
                      News
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSectionSheetOpen(true)}
                    className={`liquid-chip px-3 py-1.5 text-xs font-semibold transition ${
                      activeSection
                        ? 'text-blue-700 dark:text-sky-300'
                        : 'text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    {t('home.open_focus', 'Focus')}
                  </button>
                </div>
              </div>

              {/* Row 2: Feed tabs */}
              <div className="liquid-chip flex items-center gap-1 p-1 w-fit">
                {[
                  { id: 'for-you', label: t('for_you', 'For You') },
                  { id: 'all', label: t('all', 'All') },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFeedTab(tab.id)}
                    className={`px-3.5 py-1 text-xs font-semibold rounded-full transition ${
                      feedTab === tab.id
                        ? 'bg-white/80 dark:bg-white/10 text-blue-700 dark:text-sky-300 shadow-sm'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Row 3: Category filter */}
              <SwipeableCategoryFilter
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
              />
            </div>
          </div>

          {/* Active section panel (non-sticky, scrolls with page) */}
          {activeSection && ActiveSectionComponent && (
            <div className="px-2 pt-3">
              <div className="liquid-card p-3">
                <ActiveSectionComponent onPostClick={onPostClick} />
              </div>
            </div>
          )}

          {/* Scrollable content */}
          <div className="flex-1 pb-6">
            {!activeSection && (
              <div className="mt-3 mb-2">
                <EnhancedStorySection
                  onViewStory={(story) => console.log('View story:', story)}
                />
              </div>
            )}

            <div className="px-2 mt-2 space-y-2.5">
              <TrendingTopicsWidget
                onTopicClick={(topic) => {
                  setSelectedTopic(topic);
                }}
              />
              <ReadingStreak compact={true} />
            </div>

            <div className="mt-2">
              <EnhancedNewsFeed
                key={`${refreshKey}-${feedTab}-${selectedTopic}`}
                activeCategory={activeCategory}
                onPostClick={onPostClick}
                onShowReels={onShowReels}
                feedType="all"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Focus Bottom Sheet ── */}
      {isSectionSheetOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          {/* Backdrop */}
          <button
            type="button"
            aria-label={t('home.close_focus_panel', 'Close focus panel')}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setSectionSheetOpen(false)}
          />

          {/* Sheet — raised above the 64px bottom nav bar */}
          <div className="relative z-50 w-full max-h-[75vh] mb-[74px] liquid-panel rounded-t-3xl border-t border-white/60 dark:border-white/10 flex flex-col shadow-2xl">
            {/* Drag handle */}
            <div className="mx-auto mt-3 w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600 flex-shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-4 flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  {t('home.choose_focus', 'Choose a focus')}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {t('home.choose_focus_hint', 'Pin a section above the news feed.')}
                </p>
              </div>
              <button
                type="button"
                aria-label={t('home.close_focus_panel', 'Close focus panel')}
                onClick={() => setSectionSheetOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Section grid */}
            <div className="flex-1 overflow-y-auto px-5 pb-6">
              <div className="grid grid-cols-2 gap-3">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => handleSectionClick(section.id)}
                      className={`liquid-action flex items-center gap-3 p-3.5 rounded-2xl text-left focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        isActive
                          ? 'text-blue-700 dark:text-sky-300'
                          : 'text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <span className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl ${section.color} shadow-sm`}>
                        <Icon className="w-5 h-5 text-white" />
                      </span>
                      <div className="min-w-0">
                        <span className={`text-sm font-semibold block leading-tight ${isActive ? 'text-primary-700 dark:text-primary-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                          {section.name}
                        </span>
                        {isActive && (
                          <span className="text-[10px] text-primary-500 dark:text-primary-400 font-medium mt-0.5 block">
                            Active
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {activeSection && (
                <button
                  type="button"
                  onClick={() => { setActiveSection(null); setSectionSheetOpen(false); }}
                  className="mt-4 w-full liquid-action flex items-center justify-center gap-2 py-2.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-danger rounded-2xl transition"
                >
                  <X className="w-4 h-4" />
                  Clear focus
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
