// =============================================
// src/components/Admin/RealTimeContent.jsx
// Breaking News & Live Updates Management
// =============================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { 
  createBreakingNews, 
  createLiveUpdate, 
  DATABASE_PATHS, 
  calculateTrendingStories, 
  calculateAIPicks 
} from '../../utils/databaseSchema';
import { ref, onValue, update, remove } from 'firebase/database';
import { db } from '../../firebase-config';
import { 
  Zap, 
  Radio, 
  TrendingUp, 
  Brain, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  AlertCircle,
  Clock,
  MapPin,
  Settings,
  RefreshCw
} from 'lucide-react';

const RealTimeContent = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('breaking');
  const [breakingNews, setBreakingNews] = useState([]);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [trendingStories, setTrendingStories] = useState([]);
  const [aiPicks, setAiPicks] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    headline: { en: '', hi: '', gu: '' },
    summary: { en: '', hi: '', gu: '' },
    priority: 'high',
    category: 'general',
    tags: [],
    mediaUrl: '',
    sourceUrl: '',
    location: '',
    expiresAt: '',
    isActive: true
  });

  // Load real-time content
  useEffect(() => {
    // Breaking News
    const breakingRef = ref(db, DATABASE_PATHS.BREAKING_NEWS);
    const unsubscribeBreaking = onValue(breakingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setBreakingNews(items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } else {
        setBreakingNews([]);
      }
    });

    // Live Updates
    const liveRef = ref(db, DATABASE_PATHS.LIVE_UPDATES);
    const unsubscribeLive = onValue(liveRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setLiveUpdates(items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } else {
        setLiveUpdates([]);
      }
    });

    // Trending Stories
    const trendingRef = ref(db, DATABASE_PATHS.TRENDING_STORIES);
    const unsubscribeTrending = onValue(trendingRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.stories) {
        setTrendingStories(data.stories);
      }
    });

    // AI Picks
    const aiPicksRef = ref(db, DATABASE_PATHS.AI_PICKS);
    const unsubscribeAI = onValue(aiPicksRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.picks) {
        setAiPicks(data.picks);
      }
    });

    return () => {
      unsubscribeBreaking();
      unsubscribeLive();
      unsubscribeTrending();
      unsubscribeAI();
    };
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleMultiLanguageChange = (field, lang, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [lang]: value
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.headline.en.trim()) newErrors.headline = 'English headline is required';
    if (!formData.summary.en.trim()) newErrors.summary = 'English summary is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (activeTab === 'breaking') {
        if (editingItem) {
          const itemRef = ref(db, `${DATABASE_PATHS.BREAKING_NEWS}/${editingItem.id}`);
          await update(itemRef, formData);
        } else {
          await createBreakingNews(formData, user.uid);
        }
      } else if (activeTab === 'live') {
        if (editingItem) {
          const itemRef = ref(db, `${DATABASE_PATHS.LIVE_UPDATES}/${editingItem.id}`);
          await update(itemRef, formData);
        } else {
          await createLiveUpdate({
            title: formData.headline,
            content: formData.summary,
            category: formData.category,
            tags: formData.tags,
            mediaUrl: formData.mediaUrl,
            location: formData.location,
            priority: formData.priority,
            isActive: formData.isActive
          }, user.uid);
        }
      }
      
      // Reset form
      setFormData({
        headline: { en: '', hi: '', gu: '' },
        summary: { en: '', hi: '', gu: '' },
        priority: 'high',
        category: 'general',
        tags: [],
        mediaUrl: '',
        sourceUrl: '',
        location: '',
        expiresAt: '',
        isActive: true
      });
      
      setShowCreateForm(false);
      setEditingItem(null);
      
    } catch (error) {
      console.error('Error saving content:', error);
      setErrors({ submit: 'Failed to save content' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    if (activeTab === 'breaking') {
      setFormData({
        headline: item.headline || { en: '', hi: '', gu: '' },
        summary: item.summary || { en: '', hi: '', gu: '' },
        priority: item.priority || 'high',
        category: item.category || 'general',
        tags: item.tags || [],
        mediaUrl: item.mediaUrl || '',
        sourceUrl: item.sourceUrl || '',
        location: item.location || '',
        expiresAt: item.expiresAt || '',
        isActive: item.isActive !== false
      });
    } else if (activeTab === 'live') {
      setFormData({
        headline: item.title || { en: '', hi: '', gu: '' },
        summary: item.content || { en: '', hi: '', gu: '' },
        priority: item.priority || 'normal',
        category: item.category || 'general',
        tags: item.tags || [],
        mediaUrl: item.mediaUrl || '',
        sourceUrl: '',
        location: item.location || '',
        expiresAt: '',
        isActive: item.isActive !== false
      });
    }
    setEditingItem(item);
    setShowCreateForm(true);
  };

  const handleDelete = async (itemId, type) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const path = type === 'breaking' ? DATABASE_PATHS.BREAKING_NEWS : DATABASE_PATHS.LIVE_UPDATES;
      const itemRef = ref(db, `${path}/${itemId}`);
      await remove(itemRef);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const refreshTrendingStories = async () => {
    setLoading(true);
    try {
      await calculateTrendingStories();
    } catch (error) {
      console.error('Error refreshing trending stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAIPicks = async () => {
    setLoading(true);
    try {
      await calculateAIPicks();
    } catch (error) {
      console.error('Error refreshing AI picks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const tabs = [
    { id: 'breaking', label: 'Breaking News', icon: Zap, color: 'text-red-600' },
    { id: 'live', label: 'Live Updates', icon: Radio, color: 'text-green-600' },
    { id: 'trending', label: 'Trending Stories', icon: TrendingUp, color: 'text-blue-600' },
    { id: 'ai-picks', label: 'AI Picks', icon: Brain, color: 'text-purple-600' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Real-time Content Management</h1>
        {(activeTab === 'breaking' || activeTab === 'live') && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create {activeTab === 'breaking' ? 'Breaking News' : 'Live Update'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? `border-blue-500 ${tab.color}`
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingItem 
                  ? `Edit ${activeTab === 'breaking' ? 'Breaking News' : 'Live Update'}`
                  : `Create ${activeTab === 'breaking' ? 'Breaking News' : 'Live Update'}`
                }
              </h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingItem(null);
                  setErrors({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Multi-language Headline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {activeTab === 'breaking' ? 'Headline' : 'Title'} *
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.headline.en}
                    onChange={(e) => handleMultiLanguageChange('headline', 'en', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="English headline"
                  />
                  <input
                    type="text"
                    value={formData.headline.hi}
                    onChange={(e) => handleMultiLanguageChange('headline', 'hi', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="हिंदी शीर्षक"
                  />
                  <input
                    type="text"
                    value={formData.headline.gu}
                    onChange={(e) => handleMultiLanguageChange('headline', 'gu', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="ગુજરાતી શીર્ષક"
                  />
                </div>
                {errors.headline && <p className="text-red-500 text-sm mt-2">{errors.headline}</p>}
              </div>

              {/* Multi-language Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {activeTab === 'breaking' ? 'Summary' : 'Content'} *
                </label>
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={formData.summary.en}
                    onChange={(e) => handleMultiLanguageChange('summary', 'en', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="English content"
                  />
                  <textarea
                    rows={3}
                    value={formData.summary.hi}
                    onChange={(e) => handleMultiLanguageChange('summary', 'hi', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="हिंदी सामग्री"
                  />
                  <textarea
                    rows={3}
                    value={formData.summary.gu}
                    onChange={(e) => handleMultiLanguageChange('summary', 'gu', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="ગુજરાતી સામગ્રી"
                  />
                </div>
                {errors.summary && <p className="text-red-500 text-sm mt-2">{errors.summary}</p>}
              </div>

              {/* Priority and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Category"
                  />
                </div>
              </div>

              {/* Location and Media URL */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Media URL</label>
                  <input
                    type="url"
                    value={formData.mediaUrl}
                    onChange={(e) => handleInputChange('mediaUrl', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Image/Video URL"
                  />
                </div>
              </div>

              {/* Breaking News specific fields */}
              {activeTab === 'breaking' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source URL</label>
                    <input
                      type="url"
                      value={formData.sourceUrl}
                      onChange={(e) => handleInputChange('sourceUrl', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Source URL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                    <input
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Active Status */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>

              {/* Error Message */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <p className="ml-3 text-sm text-red-700">{errors.submit}</p>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingItem(null);
                    setErrors({});
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content Display */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Breaking News Tab */}
        {activeTab === 'breaking' && (
          <div>
            {breakingNews.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No breaking news</h3>
                <p className="text-gray-500">Create your first breaking news alert.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {breakingNews.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {item.headline?.en || 'No headline'}
                        </h3>
                        <p className="text-gray-600 mb-3">
                          {item.summary?.en || 'No summary'}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDate(item.createdAt)}
                          </div>
                          {item.location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {item.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, 'breaking')}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Live Updates Tab */}
        {activeTab === 'live' && (
          <div>
            {liveUpdates.length === 0 ? (
              <div className="text-center py-12">
                <Radio className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No live updates</h3>
                <p className="text-gray-500">Create your first live update.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {liveUpdates.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.isActive ? 'Live' : 'Inactive'}
                          </span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {item.title?.en || 'No title'}
                        </h3>
                        <p className="text-gray-600 mb-3">
                          {item.content?.en || 'No content'}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDate(item.createdAt)}
                          </div>
                          {item.location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {item.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, 'live')}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trending Stories Tab */}
        {activeTab === 'trending' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Trending Stories (Auto-Generated)</h3>
              <button
                onClick={refreshTrendingStories}
                disabled={loading}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            {trendingStories.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No trending stories available. Click refresh to generate.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {trendingStories.slice(0, 10).map((story, index) => (
                  <div key={story.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{story.title?.en || 'No title'}</h4>
                      <p className="text-sm text-gray-500">
                        Score: {story.trendingScore?.toFixed(2)} | Views: {story.analytics?.views || 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Picks Tab */}
        {activeTab === 'ai-picks' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">AI Picks (Auto-Generated)</h3>
              <button
                onClick={refreshAIPicks}
                disabled={loading}
                className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh AI
              </button>
            </div>
            {aiPicks.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No AI picks available. Click refresh to generate.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {aiPicks.slice(0, 10).map((pick, index) => (
                  <div key={pick.id} className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{pick.title?.en || 'No title'}</h4>
                      <p className="text-sm text-gray-500">
                        AI Score: {pick.aiScore?.toFixed(2)} | Engagement: {pick.analytics?.likes + pick.analytics?.comments + pick.analytics?.shares || 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeContent;