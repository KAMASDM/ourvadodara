// =============================================
// src/pages/Home/HomePage.jsx - Redesigned Layout
// =============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/Auth/AuthContext';
import EnhancedStorySection from '../../components/Story/EnhancedStorySection';
import CategoryFilter from '../../components/Category/CategoryFilter';
import EnhancedNewsFeed from '../../components/Feed/EnhancedNewsFeed';
import ReelsRail from '../../components/Reels/ReelsRail.jsx';
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
  ChevronRight 
} from 'lucide-react';

const HomePage = ({ onPostClick, onShowReels = () => {} }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSection, setActiveSection] = useState(null); // null means show news

  // Define available sections
  const sections = [
    {
      id: 'weather',
      name: 'Weather',
      icon: Cloud,
      color: 'bg-blue-500',
      component: WeatherWidget
    },
    {
      id: 'trending',
      name: 'Trending',
      icon: TrendingUp,
      color: 'bg-red-500',
      component: TrendingTopics
    },
    {
      id: 'events',
      name: 'Events',
      icon: Calendar,
      color: 'bg-green-500',
      component: EventsCalendar
    },
    {
      id: 'polls',
      name: 'Polls',
      icon: BarChart3,
      color: 'bg-purple-500',
      component: PollWidget
    },
    {
      id: 'recommendations',
      name: 'AI Picks',
      icon: Sparkles,
      color: 'bg-yellow-500',
      component: AIPicksReal
    },
    {
      id: 'live',
      name: 'Live Updates',
      icon: Radio,
      color: 'bg-orange-500',
      component: LiveUpdates
    }
  ];

  const handleSectionClick = (sectionId) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  const ActiveSectionComponent = activeSection 
    ? sections.find(s => s.id === activeSection)?.component 
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <div className="relative flex flex-col">
        <div
          className="sticky z-30 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.35)]"
          style={{ top: '4.75rem' }}
        >
          {activeSection && ActiveSectionComponent && (
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
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
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span>Show News</span>
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
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {activeSection ? 'Latest News' : 'Top Stories'}
                </h2>
                {activeSection && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">Scroll for more updates</span>
                )}
              </div>

              <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-3 -mx-1 px-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionClick(section.id)}
                      className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? `${section.color} text-white shadow-lg shadow-black/10`
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isActive ? 'animate-pulse' : ''}`} />
                      <span className="whitespace-nowrap">{section.name}</span>
                      {!isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
                    </button>
                  );
                })}
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
            <div className="space-y-4 px-4 sm:px-5 mt-4 mb-6">
              <EnhancedStorySection
                onViewStory={(story) => console.log('View story:', story)}
              />

              <ReelsRail
                onSelectReel={(reelId) => onShowReels(reelId)}
              />
            </div>
          )}

          <div className="mt-4">
            <EnhancedNewsFeed
              activeCategory={activeCategory}
              onPostClick={onPostClick}
              feedType="all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;