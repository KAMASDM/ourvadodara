// =============================================
// src/components/Admin/ContentManagement.jsx
// Comprehensive Content Management Interface
// Now with Multi-City Support
// =============================================
import React, { useState, useEffect, useMemo } from 'react';
import { ref, remove, update } from 'firebase/database';
import { db } from '../../firebase-config';
import { useCity } from '../../context/CityContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Tag, 
  MapPin, 
  Search,
  Filter,
  MoreVertical,
  TrendingUp,
  X,
  AlertCircle
} from 'lucide-react';
import EditPost from './EditPost';

const ContentManagement = () => {
  const { cities } = useCity(); // Use dynamic cities from Firebase
  const [selectedCity, setSelectedCity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [10, 20, 50];
  
  // Initialize selectedCity when cities load
  useEffect(() => {
    if (cities && cities.length > 0 && !selectedCity) {
      setSelectedCity(cities[0].id);
    }
  }, [cities, selectedCity]);

  // Helper function to extract text from multi-language objects or strings
  const getTextContent = (content) => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
      // Return the first available language content
      return content.en || content.hi || content.gu || Object.values(content)[0] || '';
    }
    return '';
  };

  const { data: rawPostsData, isLoading: postsLoading, source: postsSource } = useRealtimeData(
    selectedCity ? 'posts' : null,
    {
      scope: 'auto',
      cityId: selectedCity || null,
      fallbackToGlobal: true,
      debug: false
    }
  );

  const posts = useMemo(() => {
    if (!rawPostsData) return [];
    const formatted = Object.entries(rawPostsData).map(([id, data]) => ({
      id,
      ...data
    }));

    const sorted = [...formatted];
    sorted.sort((a, b) => {
      if (sortBy === 'title') {
        return getTextContent(a.title).localeCompare(getTextContent(b.title));
      }

      if (sortBy === 'views') {
        return (b.views || 0) - (a.views || 0);
      }

      const getTimestamp = (post, field) => {
        if (!post || !field) return 0;
        const value = post[field];
        if (!value) return 0;
        const time = new Date(value).getTime();
        return Number.isNaN(time) ? 0 : time;
      };

      const primaryField = sortBy === 'updatedAt' ? 'updatedAt' : 'createdAt';
      const aTime = getTimestamp(a, primaryField);
      const bTime = getTimestamp(b, primaryField);
      return bTime - aTime;
    });

    return sorted;
  }, [rawPostsData, sortBy]);

  const loading = postsLoading || (!selectedCity && postsSource !== 'fallback');
  const isUsingGlobalFallback = postsSource === 'fallback';
  const postsBasePath = isUsingGlobalFallback
    ? 'posts'
    : (selectedCity ? `cities/${selectedCity}/posts` : null);
  const selectedCityName = selectedCity
    ? cities.find(c => c.id === selectedCity)?.name || selectedCity
    : '...';

  useEffect(() => {
    setSelectedPosts([]);
    setCurrentPage(1);
  }, [selectedCity, isUsingGlobalFallback, searchTerm, filterStatus, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  const handleDeletePost = async (postId) => {
    if (!postsBasePath) {
      alert('Unable to resolve post location for deletion.');
      return;
    }
    const post = posts.find(p => p.id === postId);
    if (window.confirm(`Are you sure you want to delete "${getTextContent(post?.title)}"?\n\nThis action cannot be undone.`)) {
      try {
        await remove(ref(db, `${postsBasePath}/${postId}`));
        alert('Post deleted successfully');
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post');
      }
    }
  };

  const handleToggleStatus = async (postId, currentStatus) => {
    if (!postsBasePath) {
      alert('Unable to resolve post location for status update.');
      return;
    }
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const post = posts.find(p => p.id === postId);
    const action = newStatus === 'published' ? 'publish' : 'unpublish';
    
    if (window.confirm(`Are you sure you want to ${action} "${getTextContent(post?.title)}"?`)) {
      try {
        await update(ref(db, `${postsBasePath}/${postId}`), {
          status: newStatus,
          updatedAt: new Date().toISOString()
        });
        alert(`Post ${action}ed successfully`);
      } catch (error) {
        console.error('Error updating post:', error);
        alert('Error updating post status');
      }
    }
  };

  const handleEditPost = (postId) => {
    if (!postsBasePath) {
      alert('Unable to resolve post location for editing.');
      return;
    }
    setEditingPostId(postId);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setEditingPostId(null);
    setShowEditModal(false);
  };

  const handleSavePost = () => {
    // Post will be automatically updated through Firebase real-time listeners
    setEditingPostId(null);
    setShowEditModal(false);
    // Note: Success message is handled by EditPost component
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showEditModal) {
        handleCloseEditModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showEditModal]);

  const handleViewPost = (postId) => {
    // Open post in new tab or navigate to post detail
    const post = posts.find(p => p.id === postId);
    if (post) {
      alert(`View Post: ${getTextContent(post.title)}\nStatus: ${post.status}\nCreated: ${new Date(post.createdAt).toLocaleString()}`);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedPosts.length === 0) {
      alert('Please select posts first');
      return;
    }

    if (!postsBasePath) {
      alert('Unable to resolve post location for bulk action.');
      return;
    }

    if (action === 'delete') {
      if (window.confirm(`Are you sure you want to delete ${selectedPosts.length} selected posts?`)) {
        try {
          const deletePromises = selectedPosts.map(postId => 
            remove(ref(db, `${postsBasePath}/${postId}`))
          );
          await Promise.all(deletePromises);
          setSelectedPosts([]);
          alert('Selected posts deleted successfully');
        } catch (error) {
          console.error('Error deleting posts:', error);
          alert('Error deleting some posts');
        }
      }
    } else if (action === 'publish') {
      try {
        const updatePromises = selectedPosts.map(postId =>
          update(ref(db, `${postsBasePath}/${postId}`), {
            status: 'published',
            updatedAt: new Date().toISOString()
          })
        );
        await Promise.all(updatePromises);
        setSelectedPosts([]);
        alert('Selected posts published successfully');
      } catch (error) {
        console.error('Error publishing posts:', error);
        alert('Error publishing some posts');
      }
    } else if (action === 'draft') {
      try {
        const updatePromises = selectedPosts.map(postId =>
          update(ref(db, `${postsBasePath}/${postId}`), {
            status: 'draft',
            updatedAt: new Date().toISOString()
          })
        );
        await Promise.all(updatePromises);
        setSelectedPosts([]);
        alert('Selected posts moved to draft successfully');
      } catch (error) {
        console.error('Error updating posts:', error);
        alert('Error updating some posts');
      }
    }
  };

  const filteredPosts = posts.filter(post => {
    // Safety check for post object
    if (!post || typeof post !== 'object') return false;
    
    const titleText = getTextContent(post.title);
    const contentText = getTextContent(post.content);
    
    const matchesSearch = !searchTerm || 
      titleText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contentText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || post.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safePage - 1) * pageSize;
  const paginatedPosts = filteredPosts.slice(pageStartIndex, pageStartIndex + pageSize);
  const displayedRangeStart = filteredPosts.length === 0 ? 0 : pageStartIndex + 1;
  const displayedRangeEnd = pageStartIndex + paginatedPosts.length;
  const allPageSelected = paginatedPosts.length > 0 && paginatedPosts.every(post => selectedPosts.includes(post.id));
  const paginationNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }

    if (safePage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (safePage >= totalPages - 2) {
      return Array.from({ length: 5 }, (_, idx) => totalPages - 4 + idx);
    }

    return [safePage - 2, safePage - 1, safePage, safePage + 1, safePage + 2];
  }, [safePage, totalPages]);
  const showLeftEllipsis = paginationNumbers[0] > 1;
  const showRightEllipsis = paginationNumbers[paginationNumbers.length - 1] < totalPages;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getStatusBadge = (status) => {
    const statusStyles = {
      published: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200',
      draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200',
      archived: 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-200'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || statusStyles.draft}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Safety check for posts array
  if (!Array.isArray(posts)) {
    return (
      <div className="p-6 text-gray-900 dark:text-gray-100">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>Error loading posts. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Content Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage all your published content</p>
        </div>
      </div>

      {isUsingGlobalFallback && (
        <div className="flex items-start space-x-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-100 px-4 py-3 rounded-lg">
          <AlertCircle className="w-5 h-5 mt-0.5 text-yellow-700 dark:text-yellow-200" />
          <div>
            <p className="text-sm font-medium">Showing legacy global posts</p>
            <p className="text-xs text-yellow-900 dark:text-yellow-200">
              No posts were found under {selectedCityName}. Managing actions here will target the global <code>posts</code> collection.
            </p>
          </div>
        </div>
      )}

      {/* City Selector */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <MapPin className="inline w-4 h-4 mr-1" />
          Filter by City
        </label>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          {cities.map(city => (
            <option key={city.id} value={city.id}>{city.name}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Showing posts for {selectedCityName}</p>
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center space-x-4">
        <label className="flex items-center text-sm text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            checked={allPageSelected}
            onChange={(e) => {
              if (e.target.checked) {
                const updatedSelections = new Set(selectedPosts);
                paginatedPosts.forEach(post => updatedSelections.add(post.id));
                setSelectedPosts(Array.from(updatedSelections));
              } else {
                const pageIds = new Set(paginatedPosts.map(post => post.id));
                setSelectedPosts(selectedPosts.filter(id => !pageIds.has(id)));
              }
            }}
            className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
          Select All
        </label>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredPosts.length === 0
            ? 'No posts available'
            : `Showing ${displayedRangeStart}-${displayedRangeEnd} of ${filteredPosts.length} posts`}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPosts.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {selectedPosts.length} posts selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('publish')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Publish
              </button>
              <button
                onClick={() => handleBulkAction('draft')}
                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
              >
                Move to Draft
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedPosts([])}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-4 border border-transparent dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="createdAt">Date Created</option>
            <option value="updatedAt">Last Updated</option>
            <option value="title">Title</option>
            <option value="views">Views</option>
          </select>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-transparent dark:border-gray-700">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Edit className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No posts found</h3>
            <p className="text-gray-500 dark:text-gray-400">No posts match your current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedPosts.map(post => (
              <div key={post.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedPosts.includes(post.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPosts(prev => {
                          const updated = new Set(prev);
                          updated.add(post.id);
                          return Array.from(updated);
                        });
                      } else {
                        setSelectedPosts(prev => prev.filter(id => id !== post.id));
                      }
                    }}
                    className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                  {/* Display thumbnail - support both imageUrl and media array */}
                  {(post.imageUrl || (post.media && post.media.length > 0)) && (
                    <img
                      src={post.imageUrl || (post.media && post.media[0]?.url)}
                      alt="Post thumbnail"
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                          {getTextContent(post.title)}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">
                          {getTextContent(post.excerpt) || getTextContent(post.content)?.substring(0, 100) + '...'}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                          {post.category && (
                            <span className="flex items-center">
                              <Tag className="w-3 h-3 mr-1" />
                              {post.category}
                            </span>
                          )}
                          {post.location && (
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {post.location}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {post.views || 0} views
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(post.status)}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleToggleStatus(post.id, post.status)}
                            className={`p-1 transition-colors ${
                              post.status === 'published' 
                                ? 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300' 
                                : 'text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400'
                            }`}
                            title={post.status === 'published' ? 'Unpublish Post' : 'Publish Post'}
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditPost(post.id)}
                            className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="Edit Post"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete Post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleViewPost(post.id)}
                            className="p-1 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="View Post Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredPosts.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-lg shadow-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Page {safePage} of {totalPages}
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={safePage === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="hidden md:flex items-center space-x-1">
              {showLeftEllipsis && (
                <button
                  onClick={() => setCurrentPage(1)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  1
                </button>
              )}
              {showLeftEllipsis && (
                <span className="px-2 text-sm text-gray-500 dark:text-gray-400">...</span>
              )}
              {paginationNumbers.map(pageNumber => (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${
                    pageNumber === safePage
                      ? 'border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-500/20 dark:text-blue-200'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              {showRightEllipsis && (
                <span className="px-2 text-sm text-gray-500 dark:text-gray-400">...</span>
              )}
              {showRightEllipsis && (
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${
                    safePage === totalPages
                      ? 'border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-500/20 dark:text-blue-200'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {totalPages}
                </button>
              )}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={safePage === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {showEditModal && editingPostId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-transparent dark:border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Post</h2>
              <button
                onClick={handleCloseEditModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <EditPost
                postId={editingPostId}
                basePath={postsBasePath}
                onClose={handleCloseEditModal}
                onSave={handleSavePost}
                isEmbedded
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;