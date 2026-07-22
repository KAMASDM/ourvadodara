import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CloudSun,
  Gift,
  Megaphone,
  Radio,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

const PollWidget = React.lazy(() => import('../../components/Polls/PollWidget'));
const WeatherWidget = React.lazy(() => import('../../components/Weather/WeatherWidget'));
const LiveUpdates = React.lazy(() => import('../../components/Live/LiveUpdates'));
const AIPicksReal = React.lazy(() => import('../../components/AI/AIPicksReal'));
const TrendingTopics = React.lazy(() => import('../../components/Trending/TrendingTopics'));

const EMBEDDED_SECTIONS = {
  polls: PollWidget,
  weather: WeatherWidget,
  live: LiveUpdates,
  recommendations: AIPicksReal,
  trending: TrendingTopics,
};

const navigateTo = (path, view) => {
  window.history.pushState({ view }, '', path);
  window.dispatchEvent(new Event('popstate'));
};

const ExplorePage = ({ initialSection = null }) => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const features = useMemo(() => [
    {
      id: 'events',
      title: t('events', 'Events'),
      description: t('explore.events_description', 'What is happening around Vadodara'),
      Icon: CalendarDays,
      color: 'from-emerald-500 to-teal-600',
      path: '/events',
    },
    {
      id: 'polls',
      title: t('polls', 'Polls'),
      description: t('explore.polls_description', 'Vote and see what the city thinks'),
      Icon: BarChart3,
      color: 'from-violet-500 to-purple-600',
    },
    {
      id: 'offers',
      title: t('offers', 'Offers'),
      description: t('explore.offers_description', 'Discover coupons from local brands'),
      Icon: Gift,
      color: 'from-amber-500 to-orange-600',
      path: '/offers',
    },
    {
      id: 'breaking',
      title: t('breakingNav', 'Breaking'),
      description: t('explore.breaking_description', 'Important updates happening right now'),
      Icon: AlertTriangle,
      color: 'from-rose-500 to-red-600',
      path: '/breaking',
    },
    {
      id: 'weather',
      title: t('weather', 'Weather'),
      description: t('explore.weather_description', 'Forecast, rain, moon phase and conditions'),
      Icon: CloudSun,
      color: 'from-sky-500 to-blue-600',
    },
    {
      id: 'live',
      title: t('live_updates', 'Live Updates'),
      description: t('explore.live_description', 'Follow developing local stories'),
      Icon: Radio,
      color: 'from-orange-500 to-rose-500',
    },
    {
      id: 'trending',
      title: t('trending', 'Trending'),
      description: t('explore.trending_description', 'Topics Vadodara is reading today'),
      Icon: TrendingUp,
      color: 'from-cyan-500 to-teal-600',
    },
    {
      id: 'recommendations',
      title: t('ai_picks', 'AI Picks'),
      description: t('explore.ai_description', 'Stories selected around your interests'),
      Icon: Sparkles,
      color: 'from-fuchsia-500 to-pink-600',
    },
    {
      id: 'business',
      title: t('explore.business_title', 'Work with us'),
      description: t('explore.business_description', 'Advertising, campaigns and business enquiries'),
      Icon: Megaphone,
      color: 'from-slate-700 to-slate-950',
      path: '/advertise',
    },
  ], [t]);

  const openFeature = (feature) => {
    if (feature.path) {
      navigateTo(feature.path, feature.id);
      return;
    }
    window.history.pushState({ view: 'explore', section: feature.id }, '', `/explore/${feature.id}`);
    setActiveSection(feature.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeFeature = () => {
    window.history.pushState({ view: 'explore' }, '', '/explore');
    setActiveSection(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedFeature = features.find((feature) => feature.id === activeSection);
  const ActiveComponent = activeSection ? EMBEDDED_SECTIONS[activeSection] : null;

  if (ActiveComponent && selectedFeature) {
    const ActiveIcon = selectedFeature.Icon;
    return (
      <div className="mx-auto min-h-screen w-full max-w-3xl px-3 pb-28 pt-3 sm:px-5">
        <div className="mb-3 flex items-center gap-3">
          <button type="button" onClick={closeFeature} className="liquid-action grid h-10 w-10 place-items-center rounded-xl" aria-label={t('explore.back', 'Back to Explore')}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${selectedFeature.color} text-white shadow-sm`}>
            <ActiveIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">{t('explore.title', 'Explore')}</p>
            <h1 className="text-lg font-black text-slate-950 dark:text-white">{selectedFeature.title}</h1>
          </div>
        </div>
        <div className="liquid-card overflow-hidden rounded-3xl p-3 sm:p-5">
          <React.Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />}>
            <ActiveComponent />
          </React.Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-3 pb-28 pt-3 sm:px-5">
      <section className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-600 px-5 py-6 text-white shadow-xl shadow-teal-900/15">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-100">{t('appName', 'Our Vadodara')}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">{t('explore.title', 'Explore')}</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-teal-50">{t('explore.subtitle', 'Events, polls, offers and useful city tools—all in one place.')}</p>
          </div>
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <Sparkles className="h-7 w-7" />
          </span>
        </div>
      </section>

      <div className="mt-5">
        <h2 className="px-1 text-sm font-black text-slate-950 dark:text-white">{t('explore.choose_feature', 'What would you like to do?')}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {features.map((feature) => {
            const FeatureIcon = feature.Icon;
            return (
              <button
                key={feature.id}
                type="button"
                onClick={() => openFeature(feature)}
                className={`liquid-card group min-h-40 min-w-0 rounded-3xl p-4 text-left transition active:scale-[0.98] ${feature.id === 'business' ? 'col-span-2 sm:col-span-1' : ''}`}
              >
                <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-sm transition group-hover:scale-105`}>
                  <FeatureIcon className="h-5 w-5" />
                </span>
                <span className="mt-4 block text-base font-black text-slate-950 dark:text-white">{feature.title}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{feature.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
