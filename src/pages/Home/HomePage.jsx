// =============================================
// src/pages/Home/HomePage.jsx - Redesigned Layout with Pull-to-Refresh
// =============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useAutoHideOnScroll } from '../../hooks/useAutoHideOnScroll';
import PullToRefreshIndicator from '../../components/Common/PullToRefreshIndicator';
import EnhancedStorySection from '../../components/Story/EnhancedStorySection';
import SwipeableCategoryFilter from '../../components/Category/SwipeableCategoryFilter';
import EnhancedNewsFeed from '../../components/Feed/EnhancedNewsFeed';
import BreakingNews from '../../components/Breaking/BreakingNews';
import WeatherAtmosphere from '../../components/Weather/WeatherAtmosphere';
import { useVadodaraWeather } from '../../utils/weather';

// Secondary/home-desktop features are split out of the mobile feed bundle.
// They load only when rendered instead of delaying the first scrollable posts.
const DesktopNewsFeed = React.lazy(() => import('../../components/Feed/DesktopNewsFeed'));
const CampaignAssistantChat = React.lazy(() => import('../../components/Leads/CampaignAssistantChat'));

const HomePage = ({ onPostClick, onShowReels = () => {}, initialCategory = 'all' }) => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState(initialCategory || 'all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [feedTab, setFeedTab] = useState('for-you'); // 'for-you' | 'following' | 'all'
  const { weather: homeWeather } = useVadodaraWeather();

  // Shares the same scroll-direction logic as the fixed Header so the whole
  // top chrome hides and reappears together.
  const isChromeHidden = useAutoHideOnScroll({ enabled: !isDesktop });
  const areTopControlsHidden = isChromeHidden;

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setActiveCategory(initialCategory || 'all');
  }, [initialCategory]);

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

  const handleOpenBreaking = () => {
    window.history.pushState({ view: 'breaking' }, '', '/breaking');
    window.dispatchEvent(new Event('popstate'));
  };

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
        <div className="pt-1">
          <div className="mb-4">
            <BreakingNews onOpenBreaking={handleOpenBreaking} />
          </div>
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
            className={`sticky z-40 px-2 pt-0 transition-all duration-300 ease-out ${
              areTopControlsHidden
                ? '-translate-y-[calc(100%+env(safe-area-inset-top))] opacity-0 pointer-events-none'
                : 'translate-y-0 opacity-100'
            }`}
            style={{ top: 'calc(59px + env(safe-area-inset-top))' }}
          >
            <div className="liquid-panel relative isolate overflow-hidden rounded-[1.35rem] px-3 py-2.5 space-y-2 border border-white/60 dark:border-white/10">
              {homeWeather?.current?.symbolCode && <WeatherAtmosphere symbolCode={homeWeather.current.symbolCode} compact />}

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                  {t('top_stories', 'Top Stories')}
                </p>
                <div className="liquid-chip flex items-center gap-1 p-1 w-fit">
                  {[
                    { id: 'for-you', label: t('for_you', 'For You') },
                    { id: 'all', label: t('all', 'All') },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setFeedTab(tab.id)}
                      className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition ${
                        feedTab === tab.id
                          ? 'border-blue-400 bg-white/80 text-blue-700 shadow-sm dark:border-sky-600 dark:bg-white/10 dark:text-sky-300'
                          : 'border-slate-300 bg-white/40 text-neutral-500 hover:border-slate-400 hover:text-neutral-700 dark:border-slate-600 dark:bg-slate-900/30 dark:text-neutral-400 dark:hover:border-slate-500 dark:hover:text-neutral-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <SwipeableCategoryFilter
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
              />
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 pb-6">
            <div className="px-2 mt-3">
              <BreakingNews onOpenBreaking={handleOpenBreaking} />
            </div>

            <div className="mt-3 mb-2">
              <EnhancedStorySection
                onViewStory={(story) => console.log('View story:', story)}
              />
            </div>

            <div className="mt-2">
              <EnhancedNewsFeed
                key={`${refreshKey}-${feedTab}`}
                activeCategory={activeCategory}
                onPostClick={onPostClick}
                onShowReels={onShowReels}
                feedType="all"
              />
            </div>
          </div>
        </div>
      )}

      {isDesktop && (
        <React.Suspense fallback={null}>
          <CampaignAssistantChat showFab fabBottomClass="bottom-6" />
        </React.Suspense>
      )}
    </div>
  );
};

export default HomePage;
