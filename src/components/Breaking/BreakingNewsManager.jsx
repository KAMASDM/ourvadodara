// =============================================
// src/components/Breaking/BreakingNewsManager.jsx
// Breaking News Management with Media Support
// =============================================

import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Clock,
  Image,
  Video,
  Upload,
  X,
  Save,
  RefreshCw,
  Languages
} from 'lucide-react';
import { ref, push, get, update, remove } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase-config';
import { useAuth } from '../../context/Auth/AuthContext';
import { DATABASE_PATHS } from '../../utils/databaseSchema';
import { adminStyles } from '../Admin/adminStyles';
import axios from 'axios';

const BreakingNewsManager = () => {
  const { user } = useAuth();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState('en');
  
  const [formData, setFormData] = useState({
    title: { en: '', hi: '', gu: '' },
    content: { en: '', hi: '', gu: '' },
    priority: 'high',
    category: 'general',
    expiresAt: '',
    isActive: true,
    media: [],
    externalLink: ''
  });
  
  const [mediaFiles, setMediaFiles] = useState([]);
  const [errors, setErrors] = useState({});

  const languageLabels = {
    en: 'English',
    hi: 'हिंदी',
    gu: 'ગુજરાતી'
  };

  const priorities = [
    { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
    { value: 'high', label: 'High', color: 'bg-orange-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'low', label: 'Low', color: 'bg-blue-500' }
  ];

  const categories = [
    'general', 'traffic', 'weather', 'politics', 'sports', 
    'entertainment', 'health', 'technology', 'business'
  ];

  // Load breaking news from Firebase
  useEffect(() => {
    fetchBreakingNews();
  }, []);

  const fetchBreakingNews = async () => {
    try {
      setLoading(true);
      const newsRef = ref(db, DATABASE_PATHS.BREAKING_NEWS);
      const snapshot = await get(newsRef);
      
      if (snapshot.exists()) {
        const newsData = snapshot.val();
        const newsArray = Object.entries(newsData)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNews(newsArray);
      } else {
        setNews([]);
      }
    } catch (error) {
      console.error('Error fetching breaking news:', error);
    } finally {
      setLoading(false);
    }
  };

  // Translation functionality
  const translateText = async (text, targetLang) => {
    if (!text || text.trim().length === 0) return text;
    
    const langMap = { hi: 'hi', gu: 'gu' };
    
    try {
      const response = await axios.get(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${langMap[targetLang]}`,
        { 
          timeout: 10000,
          headers: { 'Accept': 'application/json' }
        }
      );
      
      const data = response.data;
      if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error(`Translation error for ${targetLang}:`, error);
      return text;
    }
  };

  const handleForceTranslateTitle = async () => {
    const englishTitle = formData.title.en.trim();
    if (!englishTitle) {
      alert('Please enter an English title first.');
      return;
    }

    try {
      setTranslating(true);
      const [hiTranslation, guTranslation] = await Promise.all([
        translateText(englishTitle, 'hi'),
        translateText(englishTitle, 'gu')
      ]);
      
      setFormData(prev => ({
        ...prev,
        title: { 
          ...prev.title, 
          hi: hiTranslation, 
          gu: guTranslation 
        }
      }));
    } catch (error) {
      console.error('Translation failed:', error);
      alert('Translation failed. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  const handleForceTranslateContent = async () => {
    const englishContent = formData.content.en.trim();
    if (!englishContent) {
      alert('Please enter English content first.');
      return;
    }

    try {
      setTranslating(true);
      const [hiTranslation, guTranslation] = await Promise.all([
        translateText(englishContent, 'hi'),
        translateText(englishContent, 'gu')
      ]);
      
      setFormData(prev => ({
        ...prev,
        content: { 
          ...prev.content, 
          hi: hiTranslation, 
          gu: guTranslation 
        }
      }));
    } catch (error) {
      console.error('Translation failed:', error);
      alert('Translation failed. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  // Media upload functionality
  const handleMediaUpload = async (files) => {
    if (!files || files.length === 0) return;

    setLoading(true);
    const newMediaItems = [];

    try {
      for (const file of Array.from(files)) {
        const fileType = file.type.startsWith('image/') ? 'image' : 
                        file.type.startsWith('video/') ? 'video' : 'file';
        
        const fileName = `breaking_news/${Date.now()}_${file.name}`;
        const fileRef = storageRef(storage, fileName);
        
        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        const mediaItem = {
          url: downloadURL,
          type: fileType,
          name: file.name,
          size: file.size,
          path: fileName
        };
        
        newMediaItems.push(mediaItem);
      }

      setMediaFiles(prev => [...prev, ...newMediaItems]);
      setFormData(prev => ({ 
        ...prev, 
        media: [...prev.media, ...newMediaItems]
      }));

    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Failed to upload media files');
    } finally {
      setLoading(false);
    }
  };

  const handleMediaRemove = async (index) => {
    const mediaItem = mediaFiles[index];
    
    try {
      if (mediaItem.path) {
        const fileRef = storageRef(storage, mediaItem.path);
        await deleteObject(fileRef);
      }
      
      const newMediaFiles = mediaFiles.filter((_, i) => i !== index);
      setMediaFiles(newMediaFiles);
      setFormData(prev => ({ ...prev, media: newMediaFiles }));
      
    } catch (error) {
      console.error('Error removing media:', error);
      alert('Failed to remove media file');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContentChange = (field, value, language) => {
    setFormData(prev => ({
      ...prev,
      [field]: { ...prev[field], [language]: value }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.en.trim()) newErrors.title = 'English title is required';
    if (!formData.content.en.trim()) newErrors.content = 'English content is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      title: { en: '', hi: '', gu: '' },
      content: { en: '', hi: '', gu: '' },
      priority: 'high',
      category: 'general',
      expiresAt: '',
      isActive: true,
      media: [],
      externalLink: ''
    });
    setMediaFiles([]);
    setEditingId(null);
    setActiveLanguage('en');
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const newsData = {
        ...formData,
        authorId: user?.uid || 'admin',
        authorName: user?.displayName || user?.email || 'Admin',
        createdAt: editingId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingId) {
        const newsRef = ref(db, `${DATABASE_PATHS.BREAKING_NEWS}/${editingId}`);
        await update(newsRef, newsData);
      } else {
        const newsRef = ref(db, DATABASE_PATHS.BREAKING_NEWS);
        await push(newsRef, newsData);
      }

      alert(`Breaking news ${editingId ? 'updated' : 'created'} successfully!`);
      resetForm();
      setShowForm(false);
      fetchBreakingNews();
    } catch (error) {
      console.error('Error saving breaking news:', error);
      alert('Failed to save breaking news. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (newsItem) => {
    setFormData({
      title: newsItem.title || { en: '', hi: '', gu: '' },
      content: newsItem.content || { en: '', hi: '', gu: '' },
      priority: newsItem.priority || 'high',
      category: newsItem.category || 'general',
      expiresAt: newsItem.expiresAt || '',
      isActive: newsItem.isActive !== undefined ? newsItem.isActive : true,
      media: newsItem.media || [],
      externalLink: newsItem.externalLink || ''
    });
    setMediaFiles(newsItem.media || []);
    setEditingId(newsItem.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this breaking news?')) return;

    try {
      const newsRef = ref(db, `${DATABASE_PATHS.BREAKING_NEWS}/${id}`);
      await remove(newsRef);
      fetchBreakingNews();
    } catch (error) {
      console.error('Error deleting breaking news:', error);
      alert('Failed to delete breaking news');
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const newsRef = ref(db, `${DATABASE_PATHS.BREAKING_NEWS}/${id}`);
      await update(newsRef, { isActive: !currentStatus });
      fetchBreakingNews();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status');
    }
  };

  if (loading && !showForm) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">Breaking News Manager</h1>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Breaking News</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Breaking News' : 'Create Breaking News'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Language Selector */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                {Object.entries(languageLabels).map(([lang, label]) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLanguage(lang)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeLanguage === lang
                        ? 'bg-white text-red-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title ({languageLabels[activeLanguage]})
                  {activeLanguage === 'en' && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.title[activeLanguage]}
                  onChange={(e) => handleContentChange('title', e.target.value, activeLanguage)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={`Enter title in ${languageLabels[activeLanguage]}`}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-2">{errors.title}</p>
                )}
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content ({languageLabels[activeLanguage]})
                  {activeLanguage === 'en' && <span className="text-red-500 ml-1">*</span>}
                </label>
                <textarea
                  rows={4}
                  value={formData.content[activeLanguage]}
                  onChange={(e) => handleContentChange('content', e.target.value, activeLanguage)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.content ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={`Enter content in ${languageLabels[activeLanguage]}`}
                />
                {errors.content && (
                  <p className="text-red-500 text-sm mt-2">{errors.content}</p>
                )}
              </div>

              {/* Translation Controls */}
              {activeLanguage === 'en' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Languages className="h-5 w-5 text-blue-600 mr-2" />
                      <p className="text-sm text-blue-700">Manual Translation Controls</p>
                    </div>
                    {translating && <div className="text-xs text-blue-500">Translating...</div>}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleForceTranslateTitle}
                      disabled={translating || !formData.title.en.trim()}
                      className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 text-blue-700 rounded-md transition-colors"
                    >
                      <RefreshCw className={`h-3 w-3 ${translating ? 'animate-spin' : ''}`} />
                      <span>Translate Title</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleForceTranslateContent}
                      disabled={translating || !formData.content.en.trim()}
                      className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 text-blue-700 rounded-md transition-colors"
                    >
                      <RefreshCw className={`h-3 w-3 ${translating ? 'animate-spin' : ''}`} />
                      <span>Translate Content</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Media Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Media Files (Images/Videos)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => handleMediaUpload(e.target.files)}
                    className="hidden"
                    id="media-upload"
                  />
                  <label
                    htmlFor="media-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Click to upload images or videos</span>
                    <span className="text-xs text-gray-500 mt-1">Images: Max 10MB each • Videos: Max 100MB each</span>
                  </label>
                </div>

                {/* Media Preview */}
                {mediaFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {mediaFiles.map((media, index) => (
                      <div key={index} className="relative">
                        {media.type === 'image' ? (
                          <img
                            src={media.url}
                            alt={media.name}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        ) : media.type === 'video' ? (
                          <video
                            src={media.url}
                            className="w-full h-24 object-cover rounded-lg"
                            controls
                          />
                        ) : (
                          <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-gray-500">{media.name}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleMediaRemove(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Priority, Category, etc. */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.value}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expires At (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  External Link (Optional)
                </label>
                <input
                  type="url"
                  value={formData.externalLink}
                  onChange={(e) => handleInputChange('externalLink', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Active (Show on website)
                </label>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* News List */}
      <div className="grid gap-4">
        {news.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Breaking News</h3>
            <p className="text-gray-500">Create your first breaking news alert</p>
          </div>
        ) : (
          news.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-lg shadow-sm border-l-4 p-6 ${
                priorities.find(p => p.value === item.priority)?.color || 'border-gray-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {item.priority?.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.category?.toUpperCase()}
                    </span>
                    {item.isActive ? (
                      <span className="flex items-center text-green-600 text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center text-gray-500 text-xs">
                        <EyeOff className="w-3 h-3 mr-1" />
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {typeof item.title === 'object' ? item.title.en : item.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-3">
                    {typeof item.content === 'object' ? item.content.en : item.content}
                  </p>

                  {item.media && item.media.length > 0 && (
                    <div className="flex space-x-2 mb-3">
                      {item.media.slice(0, 3).map((media, index) => (
                        <div key={index} className="w-16 h-16 rounded overflow-hidden">
                          {media.type === 'image' ? (
                            <img
                              src={media.url}
                              alt="Breaking news media"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={media.url}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ))}
                      {item.media.length > 3 && (
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500">+{item.media.length - 3}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    {item.expiresAt && (
                      <span>
                        Expires: {new Date(item.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => toggleActive(item.id, item.isActive)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.isActive 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={item.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BreakingNewsManager;