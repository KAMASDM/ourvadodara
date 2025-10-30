// =============================================
// src/components/Admin/EditPost.jsx
// Post editing functionality with Firebase integration
// =============================================

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Eye, 
  Image, 
  Video, 
  X, 
  RefreshCw,
  Languages,
  Upload,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { ref, update, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase-config';
import { useAuth } from '../../context/Auth/AuthContext';
import { categoryData, categories } from '../../data/categories';
import axios from 'axios';

const EditPost = ({ postId, basePath = 'posts', onClose, onSave, isEmbedded = false }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [formData, setFormData] = useState({
    title: { en: '', hi: '', gu: '' },
    content: { en: '', hi: '', gu: '' },
    excerpt: { en: '', hi: '', gu: '' },
    category: '',
    subcategory: '',
    tags: [],
    location: '',
    media: [],
    externalLink: '',
    isBreaking: false,
    isUrgent: false,
    isFeatured: false
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  const languageLabels = {
    en: 'English',
    hi: 'हिंदी',
    gu: 'ગુજરાતી'
  };

  // Load existing post data
  useEffect(() => {
    const loadPost = async () => {
      if (!postId) return;
      
      try {
        setLoading(true);
  const postRef = ref(db, `${basePath}/${postId}`);
        const snapshot = await get(postRef);
        
        if (snapshot.exists()) {
          const postData = snapshot.val();
          setFormData({
            title: postData.title || { en: '', hi: '', gu: '' },
            content: postData.content || { en: '', hi: '', gu: '' },
            excerpt: postData.excerpt || { en: '', hi: '', gu: '' },
            category: postData.category || '',
            subcategory: postData.subcategory || '',
            tags: postData.tags || [],
            location: postData.location || '',
            media: postData.media || [],
            externalLink: postData.externalLink || '',
            isBreaking: postData.isBreaking || false,
            isUrgent: postData.isUrgent || false,
            isFeatured: postData.isFeatured || false
          });
          setMediaFiles(postData.media || []);
        }
      } catch (error) {
        console.error('Error loading post:', error);
        alert('Failed to load post data');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId, basePath]);

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
      return text; // Return original text if translation fails
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

  const handleTagAdd = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
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
        
        const fileName = `${Date.now()}_${file.name}`;
        const fileRef = storageRef(storage, `posts/${fileName}`);
        
        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        const mediaItem = {
          url: downloadURL,
          type: fileType,
          name: file.name,
          size: file.size,
          path: `posts/${fileName}`
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
      // Delete from storage
      if (mediaItem.path) {
        const fileRef = storageRef(storage, mediaItem.path);
        await deleteObject(fileRef);
      }
      
      // Remove from state
      const newMediaFiles = mediaFiles.filter((_, i) => i !== index);
      setMediaFiles(newMediaFiles);
      setFormData(prev => ({ ...prev, media: newMediaFiles }));
      
    } catch (error) {
      console.error('Error removing media:', error);
      alert('Failed to remove media file');
    }
  };

  // Translation functions
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.en.trim()) newErrors.title = 'English title is required';
    if (!formData.content.en.trim()) newErrors.content = 'English content is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.excerpt.en.trim()) newErrors.excerpt = 'English excerpt is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const updateData = {
        ...formData,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid || 'admin',
        updatedByName: user?.displayName || user?.email || 'Admin'
      };

  const postRef = ref(db, `${basePath}/${postId}`);
      await update(postRef, updateData);

      alert('Post updated successfully!');
      if (onSave) onSave();
      if (onClose) onClose();
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loaderContent = (
    <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-200">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 dark:border-blue-400 border-t-transparent"></div>
      <span>Loading post data...</span>
    </div>
  );

  if (loading && !formData.title.en) {
    if (isEmbedded) {
      return (
        <div className="flex items-center justify-center p-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          {loaderContent}
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
          {loaderContent}
        </div>
      </div>
    );
  }

  const handleTogglePreview = () => setShowPreview(prev => !prev);

  const content = (
    <div className="flex flex-col min-h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center space-x-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close editor"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Post</h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleTogglePreview}
            className="flex items-center space-x-2 px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>{showPreview ? 'Hide Preview' : 'Preview'}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          {Object.entries(languageLabels).map(([lang, label]) => (
            <button
              key={lang}
              onClick={() => setActiveLanguage(lang)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeLanguage === lang
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title ({languageLabels[activeLanguage]})
            {activeLanguage === 'en' && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={formData.title[activeLanguage]}
            onChange={(e) => handleContentChange('title', e.target.value, activeLanguage)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
              errors.title ? 'border-red-300 dark:border-red-500/60' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder={`Enter title in ${languageLabels[activeLanguage]}`}
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-2">{errors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content ({languageLabels[activeLanguage]})
            {activeLanguage === 'en' && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            rows={10}
            value={formData.content[activeLanguage]}
            onChange={(e) => handleContentChange('content', e.target.value, activeLanguage)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
              errors.content ? 'border-red-300 dark:border-red-500/60' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder={`Enter content in ${languageLabels[activeLanguage]}`}
          />
          {errors.content && (
            <p className="text-red-500 text-sm mt-2">{errors.content}</p>
          )}
        </div>

        {activeLanguage === 'en' && (
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Languages className="h-5 w-5 text-blue-600 dark:text-blue-300 mr-2" />
                <p className="text-sm text-blue-700 dark:text-blue-200">Manual Translation Controls</p>
              </div>
              {translating && <div className="text-xs text-blue-500 dark:text-blue-200">Translating...</div>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleForceTranslateTitle}
                disabled={translating || !formData.title.en.trim()}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 disabled:bg-gray-100 dark:disabled:bg-gray-700/60 disabled:text-gray-400 dark:disabled:text-gray-500 text-blue-700 dark:text-blue-200 rounded-md transition-colors"
              >
                <RefreshCw className={`h-3 w-3 ${translating ? 'animate-spin' : ''}`} />
                <span>Translate Title</span>
              </button>
              <button
                onClick={handleForceTranslateContent}
                disabled={translating || !formData.content.en.trim()}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 disabled:bg-gray-100 dark:disabled:bg-gray-700/60 disabled:text-gray-400 dark:disabled:text-gray-500 text-blue-700 dark:text-blue-200 rounded-md transition-colors"
              >
                <RefreshCw className={`h-3 w-3 ${translating ? 'animate-spin' : ''}`} />
                <span>Translate Content</span>
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Media Files
          </label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-800/40">
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
              className="cursor-pointer flex flex-col items-center text-gray-600 dark:text-gray-300"
            >
              <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
              <span className="text-sm">Click to upload media files</span>
            </label>
          </div>

          {mediaFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mediaFiles.map((media, index) => (
                <div key={index} className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800/60">
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt={media.name}
                      className="w-full h-32 object-cover"
                    />
                  ) : media.type === 'video' ? (
                    <video
                      src={media.url}
                      className="w-full h-32 object-cover"
                      controls
                    />
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                      {media.name}
                    </div>
                  )}
                  <button
                    onClick={() => handleMediaRemove(index)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-500"
                    aria-label="Remove media item"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
              errors.category ? 'border-red-300 dark:border-red-500/60' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">Select category</option>
            {categories.map(category => (
              <option key={category.id} value={category.value}>{category.name}</option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-500 text-sm mt-2">{errors.category}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={formData.isBreaking}
              onChange={(e) => handleInputChange('isBreaking', e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800"
            />
            <span className="ml-2">Breaking News</span>
          </label>
          <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={formData.isUrgent}
              onChange={(e) => handleInputChange('isUrgent', e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800"
            />
            <span className="ml-2">Urgent</span>
          </label>
          <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800"
            />
            <span className="ml-2">Featured</span>
          </label>
        </div>

        {showPreview && (
          <div className="space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Preview</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">English content shown for quick review.</p>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
              {formData.title.en || 'Untitled Post'}
            </h4>
            <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
              {formData.content.en || 'Add content to see the preview.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="max-h-[90vh] overflow-y-auto">
          {content}
        </div>
      </div>
    </div>
  );
};

export default EditPost;