// =============================================
// Updated src/pages/Search/SearchPage.jsx
// =============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/Language/LanguageContext';
import SearchBar from '../../components/Search/SearchBar';
import AdvancedSearch from '../../components/Search/AdvancedSearch';
import PostCard from '../../components/Feed/PostCard';
import { Filter } from 'lucide-react';
import { sampleNews } from '../../data/newsData';

const SearchPage = ({ onPostClick }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    
    // Simulate search delay
    setTimeout(() => {
      const results = sampleNews.filter(news => 
        news.title[currentLanguage].toLowerCase().includes(query.toLowerCase()) ||
        news.content[currentLanguage].toLowerCase().includes(query.toLowerCase()) ||
        news.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
        news.author.toLowerCase().includes(query.toLowerCase()) ||
        news.category.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  const handleAdvancedSearch = (filters) => {
    setIsSearching(true);
    setHasSearched(true);
    
    // Simulate advanced search
    setTimeout(() => {
      let results = sampleNews;
      
      // Apply filters
      if (filters.query) {
        results = results.filter(news => 
          news.title[currentLanguage].toLowerCase().includes(filters.query.toLowerCase()) ||
          news.content[currentLanguage].toLowerCase().includes(filters.query.toLowerCase())
        );
      }
      
      if (filters.category !== 'all') {
        results = results.filter(news => news.category === filters.category);
      }
      
      if (filters.author) {
        results = results.filter(news => 
          news.author.toLowerCase().includes(filters.author.toLowerCase())
        );
      }
      
      if (filters.dateFrom) {
        results = results.filter(news => 
          new Date(news.publishedAt) >= new Date(filters.dateFrom)
        );
      }
      
      if (filters.dateTo) {
        results = results.filter(news => 
          new Date(news.publishedAt) <= new Date(filters.dateTo)
        );
      }
      
      // Sort results
      if (filters.sortBy === 'newest') {
        results.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      } else if (filters.sortBy === 'oldest') {
        results.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
      } else if (filters.sortBy === 'popular') {
        results.sort((a, b) => b.likes - a.likes);
      }
      
      setSearchResults(results);
      setIsSearching(false);
    }, 800);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
        {/* Search Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-4">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <SearchBar onSearch={handleSearch} />
              </div>
              <button
                onClick={() => setShowAdvancedSearch(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="px-4 py-6">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : hasSearched ? (
            searchResults.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Search Results ({searchResults.length})
                  </h2>
                </div>
                {searchResults.map((post) => (
                  <div key={post.id} className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <PostCard post={post} onPostClick={onPostClick} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try adjusting your search terms or use the advanced search
                </p>
                <button
                  onClick={() => setShowAdvancedSearch(true)}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Advanced Search
                </button>
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Search Our Vadodara News
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Find articles, breaking news, and updates from Vadodara
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Try searching for:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Smart City', 'Traffic', 'Cricket', 'Politics', 'Weather'].map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSearch(term)}
                      className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Search Modal */}
      <AdvancedSearch
        onSearch={handleAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
      />
    </>
  );
};

export default SearchPage;
