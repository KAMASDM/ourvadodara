// =============================================
// Updated src/components/Bookmarks/SavedPosts.jsx
// =============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/Language/LanguageContext';
import { Bookmark, Search, Filter, Calendar, Grid, List } from 'lucide-react';
import PostCard from '../Feed/PostCard';
import EmptyState from '../Common/EmptyState';

const SavedPosts = ({ onPostClick }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [savedPosts, setSavedPosts] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('newest');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load saved posts from localStorage or API
    const mockSavedPosts = [
      {
        id: '1',
        title: {
          en: 'Vadodara Smart City Project Update',
          hi: 'वडोदरा स्मार्ट सिटी प्रोजेक्ट अपडेट',
          gu: 'વડોદરા સ્માર્ટ સિટી પ્રોજેક્ટ અપડેટ'
        },
        content: {
          en: 'Latest developments in the smart city initiative...',
          hi: 'स्मार्ट सिटी पहल में नवीनतम विकास...',
          gu: 'સ્માર્ટ સિટી પહેલમાં તાજેતરનો વિકાસ...'
        },
        image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600',
        category: 'local',
        author: 'Our Vadodara Team',
        publishedAt: new Date('2024-01-15T10:00:00Z'),
        savedAt: new Date('2024-01-16T14:30:00Z'),
        likes: 45,
        comments: 12,
        tags: ['smart city', 'infrastructure']
      }
    ];
    setSavedPosts(mockSavedPosts);
  }, []);

  const filteredAndSortedPosts = savedPosts
    .filter(post => {
      const matchesCategory = filterCategory === 'all' || post.category === filterCategory;
      const matchesSearch = searchQuery === '' || 
        post.title[currentLanguage].toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content[currentLanguage].toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.savedAt) - new Date(b.savedAt);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'newest':
        default:
          return new Date(b.savedAt) - new Date(a.savedAt);
      }
    });

  const categories = ['all', 'local', 'politics', 'sports', 'entertainment', 'business'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-6">
          <div className="flex items-center space-x-3 mb-4">
            <Bookmark className="w-6 h-6 text-primary-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Saved Posts
            </h1>
          </div>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved posts..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filters and Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300"
              >
                {categories.map(category => (
                  <option key={category} value={category} className="capitalize">
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="category">By Category</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {filteredAndSortedPosts.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4' : 'space-y-4'}>
            {filteredAndSortedPosts.map((post) => (
              <div key={post.id} className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <PostCard post={post} onPostClick={onPostClick} />
                <div className="px-4 pb-3">
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Saved on {new Date(post.savedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Bookmark}
            title="No saved posts"
            description={
              searchQuery
                ? `No saved posts match "${searchQuery}"`
                : "You haven't saved any posts yet. Tap the bookmark icon on any post to save it here."
            }
            actionText="Browse News"
            onAction={() => {/* Navigate to home */}}
          />
        )}
      </div>
    </div>
  );
};

export default SavedPosts;