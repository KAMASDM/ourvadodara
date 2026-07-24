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
  Languages,
  Radio,
  ChevronRight
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
  // Handles text of any length by chunking into 500 character segments
  const translateText = async (text, targetLang) => {
    if (!text || text.trim().length === 0) return text;
    
    const langMap = { hi: 'hi', gu: 'gu' };
    
    try {
      // Split text into chunks of 500 characters (API limit)
      const chunkSize = 500;
      const chunks = [];
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }
      
      console.log(`Translating text from English to ${targetLang} (${chunks.length} chunks, ${text.length} total chars)`);
      
      // Translate each chunk
      const translatedChunks = await Promise.all(
        chunks.map(async (chunk, index) => {
          try {
            const response = await axios.get(
              `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|${langMap[targetLang]}`,
              { 
                timeout: 10000,
                headers: { 'Accept': 'application/json' }
              }
            );
            
            const data = response.data;
            if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
              return data.responseData.translatedText;
            } else {
              console.warn(`Translation API returned invalid response for chunk ${index + 1}`);
              return chunk;
            }
          } catch (chunkError) {
            console.error(`Translation error for chunk ${index + 1}:`, chunkError);
            return chunk;
          }
        })
      );
      
      // Combine translated chunks
      const translatedText = translatedChunks.join('');
      console.log(`Translation completed: ${text.length} chars -> ${translatedText.length} chars`);
      return translatedText;
      
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
        updatedAt: new Date().toISOString()
      };
      // Firebase update() rejects undefined values — only set createdAt on create
      if (!editingId) {
        newsData.createdAt = new Date().toISOString();
      }

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

  const openBreakingNewsDetail = (id) => {
    window.history.pushState({ view: 'breaking-detail', newsId: id }, '', `/breaking/${encodeURIComponent(id)}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (loading && !showForm) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-3 pb-24 pt-2 sm:px-5 sm:pt-4">
      {/* Header */}
      <div className="liquid-panel mb-3 flex items-center justify-between gap-3 rounded-[1.75rem] border border-white/70 p-4 dark:border-white/10 sm:mb-4 sm:p-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-800">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="eyebrow text-rose-600 dark:text-rose-300">Newsroom</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800"><Radio className="h-3 w-3" /> Live</span>
            </div>
            <h1 className="mt-1 truncate text-xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-2xl">Breaking News</h1>
            <p className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">Create, review and publish urgent city updates.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-teal-700 px-3.5 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-700/20 transition hover:bg-teal-800 sm:px-4"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Breaking News</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="app-modal-layer !p-0 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center sm:!p-4">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl dark:bg-slate-950 sm:rounded-[2rem]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
              <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">
                {editingId ? 'Edit Breaking News' : 'Create Breaking News'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-6">
              {/* Language Selector */}
              <div className="flex w-fit space-x-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
                {Object.entries(languageLabels).map(([lang, label]) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLanguage(lang)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeLanguage === lang
                        ? 'bg-white text-teal-700 shadow-sm dark:bg-slate-800 dark:text-teal-300'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
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
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
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
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {news.length === 0 ? (
          <div className="liquid-panel col-span-full rounded-[1.75rem] px-6 py-14 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/50"><AlertTriangle className="h-7 w-7" /></div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">No Breaking News</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create your first newsroom alert.</p>
          </div>
        ) : (
          news.map((item) => (
            <div
              key={item.id}
              role="link"
              tabIndex={0}
              onClick={() => openBreakingNewsDetail(item.id)}
              onKeyDown={(event) => {
                if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  openBreakingNewsDetail(item.id);
                }
              }}
              aria-label={`Open breaking news: ${typeof item.title === 'object' ? item.title.en : item.title}`}
              className="liquid-panel group h-full cursor-pointer rounded-[1.75rem] border border-white/70 p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-white/10 sm:p-5"
            >
              <div className="flex h-full flex-col justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ring-1 ${
                      item.priority === 'urgent' ? 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-800' :
                      item.priority === 'high' ? 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800' :
                      item.priority === 'medium' ? 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-800' :
                      'bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:ring-teal-800'
                    }`}>
                      {item.priority?.toUpperCase()}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {item.category?.toUpperCase()}
                    </span>
                    {item.isActive ? (
                      <span className="ml-auto flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <Eye className="w-3 h-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="ml-auto flex items-center text-xs font-semibold text-slate-400">
                        <EyeOff className="w-3 h-3 mr-1" />
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  <h3 className="mb-2 text-lg font-extrabold leading-snug text-slate-950 group-hover:text-teal-800 dark:text-white dark:group-hover:text-teal-300">
                    {typeof item.title === 'object' ? item.title.en : item.title}
                  </h3>
                  
                  <p className="mb-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
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
                  
                  <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
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
                
                <div className="flex items-center justify-end gap-1 border-t border-slate-200/70 pt-3 dark:border-slate-700/70">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleActive(item.id, item.isActive);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      item.isActive 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={item.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-300">Open <ChevronRight className="h-4 w-4" /></span>
                  
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleEdit(item);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(item.id);
                    }}
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
