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
  const [viewMode, setViewMode] = useState('enhanced'); // 'enhanced' or 'standard'

  // Temporary access to Firebase setup
  const handleFirebaseSetup = () => {
    if (window.location.hash) {
      window.location.hash = '';
    }
    window.location.hash = '#firebase-setup';
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* View Mode Toggle */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-2">
        <div className="flex justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('enhanced')}
            className={`w-full flex justify-center items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'enhanced'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>{t('Enhanced')}</span>
          </button>
          <button
            onClick={() => setViewMode('standard')}
            className={`w-full flex justify-center items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'standard'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
            <span>{t('Standard')}</span>
          </button>
        </div>
      </div>

      {viewMode === 'enhanced' ? (
        // =============================================
        // Enhanced Dashboard View
        // =============================================
        <div className="space-y-4 p-4">
          <StorySection />
          <WeatherWidget />
          <LiveUpdates />
          <SmartRecommendations />
          <TrendingTopics />
          <PollWidget />
          <EventsCalendar />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('Latest News')}</h2>
            <CategoryFilter activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
            <NewsFeed activeCategory={activeCategory} onPostClick={onPostClick} />
          </div>
        </div>
      ) : (
        // =============================================
        // Standard News Feed View
        // =============================================
        <div>
          <StorySection />
          <CategoryFilter activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
          <NewsFeed activeCategory={activeCategory} onPostClick={onPostClick} />
        </div>
      )}
    </div>
  );
};

export default HomePage;