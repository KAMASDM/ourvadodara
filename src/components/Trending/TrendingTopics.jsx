import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Hash,
  Clock,
  MessageCircle,
  ArrowRight,
  Flame,
  Globe,
  MapPin,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase-config';

// ── Mock fallback (used when Firebase has no data) ─────────────────────────
const MOCK_TRENDS = {
  vadodara: {
    '1h': [
      { id: 1, hashtag: '#VadodaraRains', posts: 1247, growth: 45, category: 'weather' },
      { id: 2, hashtag: '#TrafficUpdate', posts: 892, growth: 23, category: 'traffic' },
      { id: 3, hashtag: '#LocalNews', posts: 567, growth: 12, category: 'local' },
    ],
    '24h': [
      { id: 1, hashtag: '#VadodaraMetro', posts: 15420, growth: 78, category: 'development' },
      { id: 2, hashtag: '#FestivalPrep', posts: 12380, growth: 56, category: 'culture' },
      { id: 3, hashtag: '#CityDevelopment', posts: 9876, growth: 34, category: 'development' },
      { id: 4, hashtag: '#LocalBusiness', posts: 8901, growth: 28, category: 'business' },
      { id: 5, hashtag: '#EducationNews', posts: 7654, growth: 19, category: 'education' },
      { id: 6, hashtag: '#HealthCare', posts: 6543, growth: 15, category: 'health' },
    ],
    '7d': [
      { id: 1, hashtag: '#GujaratElections', posts: 98765, growth: 145, category: 'politics' },
      { id: 2, hashtag: '#SmartCity', posts: 76543, growth: 89, category: 'development' },
      { id: 3, hashtag: '#NavratriPrep', posts: 65432, growth: 67, category: 'culture' },
      { id: 4, hashtag: '#StartupVadodara', posts: 54321, growth: 45, category: 'business' },
    ],
  },
  gujarat: {
    '24h': [
      { id: 1, hashtag: '#GujaratNews', posts: 45678, growth: 123, category: 'general' },
      { id: 2, hashtag: '#AhmedabadUpdates', posts: 34567, growth: 87, category: 'city' },
      { id: 3, hashtag: '#SuratBusiness', posts: 23456, growth: 56, category: 'business' },
    ],
  },
};

const CATEGORY_COLORS = {
  weather: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  traffic: 'bg-accent/10 text-accent dark:bg-orange-900/30 dark:text-orange-300',
  local: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  development: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  culture: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  business: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  politics: 'bg-danger/10 text-danger dark:bg-red-900/30 dark:text-red-300',
  education: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  health: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  general: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
  city: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
};

const fmt = (n) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1_000 ? (n / 1_000).toFixed(1) + 'K' : String(n);

const TrendingTopics = ({ className = '' }) => {
  const { t } = useTranslation();
  const [timeFilter, setTimeFilter] = useState('24h');
  const [locationFilter, setLocationFilter] = useState('vadodara');
  const [trends, setTrends] = useState([]);
  const [fromFirebase, setFromFirebase] = useState(false);

  // ── Firebase live data ──────────────────────────────────────────────────
  useEffect(() => {
    const trendingRef = ref(db, 'trendingStories');
    const unsub = onValue(
      trendingRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data && typeof data === 'object') {
          // Expect array or object of { hashtag, posts, growth, category } entries
          const items = Array.isArray(data)
            ? data
            : Object.values(data);
          if (items.length > 0) {
            setTrends(items.slice(0, 8).map((item, i) => ({ id: i + 1, ...item })));
            setFromFirebase(true);
            return;
          }
        }
        // Fall back to mock
        setTrends(MOCK_TRENDS[locationFilter]?.[timeFilter] ?? []);
        setFromFirebase(false);
      },
      () => {
        // Permission denied or offline → use mock
        setTrends(MOCK_TRENDS[locationFilter]?.[timeFilter] ?? []);
        setFromFirebase(false);
      }
    );
    return () => unsub();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When not from Firebase, re-filter mock data on filter change
  useEffect(() => {
    if (!fromFirebase) {
      setTrends(MOCK_TRENDS[locationFilter]?.[timeFilter] ?? []);
    }
  }, [timeFilter, locationFilter, fromFirebase]);

  return (
    <div className={`bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-neutral-100 dark:border-neutral-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              {t('trending.title', 'Trending')}
            </h3>
          </div>
          <TrendingUp className="w-4 h-4 text-green-500" />
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-2">
          {/* Time filter */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-700/60 rounded-lg">
            {['1h', '24h', '7d'].map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition ${
                  timeFilter === f
                    ? 'bg-white dark:bg-neutral-600 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Location filter */}
          <div className="relative flex items-center gap-1 text-neutral-400 dark:text-neutral-500">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="appearance-none bg-transparent text-xs font-medium text-neutral-600 dark:text-neutral-300 focus:outline-none pr-1 cursor-pointer"
            >
              <option value="vadodara">{t('location.vadodara', 'Vadodara')}</option>
              <option value="gujarat">{t('location.gujarat', 'Gujarat')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-3 py-2 max-h-72 overflow-y-auto">
        {trends.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2 text-neutral-400 dark:text-neutral-500">
            <Hash className="w-8 h-8" />
            <p className="text-sm">{t('trending.noTrends', 'No trending topics')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-50 dark:divide-neutral-700/50">
            {trends.map((trend, index) => (
              <li key={trend.id}>
                <button className="w-full flex items-center gap-3 py-2.5 px-1 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700/30 rounded-xl transition group">
                  {/* Rank */}
                  <span className="w-5 text-xs font-bold text-neutral-400 dark:text-neutral-500 text-center flex-shrink-0">
                    {index + 1}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <Hash className="w-3 h-3 text-primary-500 flex-shrink-0" />
                      <span className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition truncate">
                        {trend.hashtag ? trend.hashtag.replace('#', '') : trend.topic}
                      </span>
                      {trend.category && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${CATEGORY_COLORS[trend.category] ?? CATEGORY_COLORS.general}`}>
                          {trend.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-400 dark:text-neutral-500">
                      {trend.posts && (
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {fmt(trend.posts)}
                        </span>
                      )}
                      {trend.growth && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <TrendingUp className="w-3 h-3" />
                          +{trend.growth}%
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 flex-shrink-0 transition" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {trends.length > 0 && (
          <div className="pt-2 pb-1">
            <button className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition">
              <Globe className="w-3.5 h-3.5" />
              {t('trending.viewMore', 'View all trending topics')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


export default TrendingTopics;