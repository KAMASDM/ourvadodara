// =============================================
// src/pages/Home/HomePage.jsx - Redesigned Layout
// =============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/Auth/AuthContext';
import StorySection from '../../components/Story/StorySection';
import CategoryFilter from '../../components/Category/CategoryFilter';
import NewsFeed from '../../components/Feed/NewsFeed';
import WeatherWidget from '../../components/Weather/WeatherWidget';
import LiveUpdates from '../../components/Live/LiveUpdates';
import TrendingTopics from '../../components/Trending/TrendingTopics';
import EventsCalendar from '../../components/Events/EventsCalendar';
import PollWidget from '../../components/Polls/PollWidget';
import SmartRecommendations from '../../components/AI/SmartRecommendations';
import { 
  Cloud, 
  TrendingUp, 
  Calendar, 
  BarChart3, 
  Sparkles, 
  Radio, 
  X,
  ChevronRight 
} from 'lucide-react';

const HomePage = ({ onPostClick }) => {
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
      component: SmartRecommendations
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Top Sections Bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Our Vadodara
            </h1>
            {activeSection && (
              <button
                onClick={() => setActiveSection(null)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Horizontal Scrollable Sections */}
          <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => handleSectionClick(section.id)}
                  className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2.5 rounded-full transition-all duration-300 transform ${
                    isActive
                      ? `${section.color} text-white shadow-lg scale-105 ring-2 ring-white ring-opacity-50`
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-102'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                  <span className="text-sm font-medium whitespace-nowrap">
                    {section.name}
                  </span>
                  {!isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative">
        {/* Active Section Content */}
        {activeSection && ActiveSectionComponent && (
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${sections.find(s => s.id === activeSection)?.color}`}>
                    {React.createElement(sections.find(s => s.id === activeSection)?.icon, {
                      className: "w-5 h-5 text-white"
                    })}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {sections.find(s => s.id === activeSection)?.name}
                  </h2>
                </div>
                <button
                  onClick={() => setActiveSection(null)}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center space-x-1 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span>Show News</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <ActiveSectionComponent />
            </div>
          </div>
        )}

        {/* News Feed Section - Always visible but can be pushed down */}
        <div className={`transition-all duration-300 ${activeSection ? 'mt-0' : ''}`}>
          {/* Stories Section */}
          {!activeSection && (
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <StorySection />
            </div>
          )}

          {/* Category Filter and News Feed */}
          <div className="bg-white dark:bg-gray-900">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {activeSection ? 'Latest News' : 'Top Stories'}
                </h2>
                {activeSection && (
                  <span className="text-sm text-gray-800 dark:text-gray-400">
                    Scroll down for more news
                  </span>
                )}
              </div>
              
              <CategoryFilter 
                activeCategory={activeCategory} 
                setActiveCategory={setActiveCategory} 
              />
            </div>
          </div>

          {/* News Feed */}
          <div className="bg-gray-50 dark:bg-gray-950">
            <NewsFeed 
              activeCategory={activeCategory} 
              onPostClick={onPostClick} 
            />
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles are handled by Tailwind CSS utilities */}
    </div>
  );
};

export default HomePage;