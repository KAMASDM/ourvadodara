// =============================================
// src/components/Admin/UnifiedPostCreator.jsx
// Single Unified Interface for All Post Types
// Regular News Posts + Media Posts (Reels, Stories, Carousels)
// =============================================
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { useCity } from '../../context/CityContext';
import { ref, push, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase-config';
import { 
  Save, 
  Eye, 
  Image, 
  Video, 
  Film,
  Layers,
  FileText,
  Newspaper,
  Clock,
  Play,
  Plus,
  X,
  Upload,
  Loader2,
  AlertCircle,
  Settings,
  Palette,
  Music,
  Type,
  Trash2,
  ArrowUp,
  ArrowDown,
  MapPin,
  Languages,
  RefreshCw,
  Tag,
  Calendar,
  Link,
  Send
} from 'lucide-react';
import { categoryData, categories } from '../../data/categories';
import { 
  MEDIA_TYPES, 
  POST_TYPES, 
  uploadMediaFile, 
  uploadMultipleMedia,
  createStory,
  createReel,
  createCarousel,
  generateVideoThumbnail,
  getMediaDimensions,
  formatFileSize 
} from '../../utils/mediaSchema';
import axios from 'axios';

const UnifiedPostCreator = () => {
  const { user } = useAuth();
  const { cities } = useCity();
  
  // Post Type Selection
  const [postType, setPostType] = useState(POST_TYPES.STANDARD); // STANDARD, STORY, REEL, CAROUSEL
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  
  // Multi-city selection
  const [selectedCities, setSelectedCities] = useState([]);
  
  // Initialize selectedCities
  useEffect(() => {
    if (cities && cities.length > 0 && selectedCities.length === 0) {
      setSelectedCities([cities[0].id]);
    }
  }, [cities, selectedCities.length]);
  
  // Universal form data structure
  const [formData, setFormData] = useState({
    title: { en: '', hi: '', gu: '' },
    content: { en: '', hi: '', gu: '' },
    excerpt: { en: '', hi: '', gu: '' },
    category: '',
    subcategory: '',
    tags: [],
    location: '',
    media: [], // For legacy regular posts
    externalLink: '',
    isBreaking: false,
    isUrgent: false,
    isFeatured: false,
    publishDate: '',
    scheduledTime: '',
    // Media content for stories/reels/carousels
    mediaContent: {
      type: MEDIA_TYPES.SINGLE_IMAGE,
      items: [],
      settings: {
        autoplay: false,
        showCaptions: true,
        duration: 15,
        aspectRatio: '16:9',
        infinite: false,
        loop: false
      }
    },
    // Story-specific settings
    storySettings: {
      duration: 15,
      backgroundColor: '#000000',
      textColor: '#ffffff',
      textPosition: 'bottom',
      hasMusic: false,
      musicUrl: '',
      musicTitle: ''
    },
    // Reel-specific settings
    reelSettings: {
      musicUrl: '',
      musicTitle: '',
      musicArtist: '',
      effects: [],
      speed: 1.0,
      allowDownload: true,
      allowDuet: true,
      allowComments: true
    },
    // Carousel-specific settings
    carouselSettings: {
      autoPlay: false,
      interval: 3000,
      showIndicators: true,
      showArrows: true,
      transition: 'slide'
    }
  });
  
  const [newTag, setNewTag] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const multipleImageInputRef = useRef(null);
  
  const languageLabels = {
    en: 'English',
    hi: 'हिंदी',
    gu: 'ગુજરાતી'
  };
  
  // Post type configurations
  const postTypes = [
    { 
      value: POST_TYPES.STANDARD, 
      label: 'Regular News Post', 
      icon: Newspaper,
      description: 'Traditional news article with text, images, and videos'
    },
    { 
      value: POST_TYPES.STORY, 
      label: 'Story', 
      icon: Image,
      description: 'Instagram-style story (24-hour expiry)'
    },
    { 
      value: POST_TYPES.REEL, 
      label: 'Reel', 
      icon: Film,
      description: 'Short-form vertical video content'
    },
    { 
      value: POST_TYPES.CAROUSEL, 
      label: 'Carousel', 
      icon: Layers,
      description: 'Multiple images/videos in a swipeable carousel'
    }
  ];
  
  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      mediaFiles.forEach(media => {
        if (media.previewUrl && media.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(media.previewUrl);
        }
        if (media.thumbnailUrl && media.thumbnailUrl.startsWith('blob:')) {
          URL.revokeObjectURL(media.thumbnailUrl);
        }
      });
    };
  }, [mediaFiles]);
  
  // Translation function using MyMemory API
  const translateText = async (text, targetLang) => {
    if (!text || !text.trim()) return '';
    
    try {
      const response = await axios.get('https://api.mymemory.translated.net/get', {
        params: {
          q: text,
          langpair: `en|${targetLang}`
        }
      });
      
      return response.data.responseData.translatedText || text;
    } catch (error) {
      console.error(`Translation error for ${targetLang}:`, error);
      return text;
    }
  };
  
  // Auto-translate all fields
  const handleAutoTranslate = async () => {
    setTranslating(true);
    
    try {
      const [hiTitle, guTitle] = await Promise.all([
        translateText(formData.title.en, 'hi'),
        translateText(formData.title.en, 'gu')
      ]);
      
      const [hiContent, guContent] = await Promise.all([
        translateText(formData.content.en, 'hi'),
        translateText(formData.content.en, 'gu')
      ]);
      
      const [hiExcerpt, guExcerpt] = await Promise.all([
        translateText(formData.excerpt.en, 'hi'),
        translateText(formData.excerpt.en, 'gu')
      ]);
      
      setFormData(prev => ({
        ...prev,
        title: { ...prev.title, hi: hiTitle, gu: guTitle },
        content: { ...prev.content, hi: hiContent, gu: guContent },
        excerpt: { ...prev.excerpt, hi: hiExcerpt, gu: guExcerpt }
      }));
    } catch (error) {
      console.error('Translation failed:', error);
      alert('Translation failed. Please try again.');
    } finally {
      setTranslating(false);
    }
  };
  
  // Handle media file selection
  const handleMediaSelect = async (e, type = 'image') => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const newMediaFiles = [];
    
    for (const file of files) {
      const previewUrl = URL.createObjectURL(file);
      const mediaItem = {
        file,
        previewUrl,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        name: file.name,
        size: file.size,
        mimeType: file.type
      };
      
      // Generate thumbnail for videos
      if (mediaItem.type === 'video') {
        try {
          const thumbnail = await generateVideoThumbnail(file);
          mediaItem.thumbnailUrl = thumbnail;
        } catch (error) {
          console.error('Thumbnail generation failed:', error);
        }
      }
      
      // Get dimensions
      try {
        const dimensions = await getMediaDimensions(file);
        mediaItem.width = dimensions.width;
        mediaItem.height = dimensions.height;
      } catch (error) {
        console.error('Dimension detection failed:', error);
      }
      
      newMediaFiles.push(mediaItem);
    }
    
    setMediaFiles(prev => [...prev, ...newMediaFiles]);
  };
  
  // Remove media file
  const removeMediaFile = (index) => {
    const media = mediaFiles[index];
    if (media.previewUrl && media.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(media.previewUrl);
    }
    if (media.thumbnailUrl && media.thumbnailUrl.startsWith('blob:')) {
      URL.revokeObjectURL(media.thumbnailUrl);
    }
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Move media file up/down
  const moveMediaFile = (index, direction) => {
    const newMediaFiles = [...mediaFiles];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newMediaFiles.length) return;
    
    [newMediaFiles[index], newMediaFiles[targetIndex]] = [newMediaFiles[targetIndex], newMediaFiles[index]];
    setMediaFiles(newMediaFiles);
  };
  
  // Handle tag addition
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (formData.tags.includes(newTag.trim())) return;
    
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, newTag.trim()]
    }));
    setNewTag('');
  };
  
  // Remove tag
  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };
  
  // Upload media files to Firebase Storage
  const uploadMedia = async (mediaFile, index) => {
    try {
      const fileName = `${Date.now()}_${mediaFile.name}`;
      const path = postType === POST_TYPES.STORY ? 'stories' :
                   postType === POST_TYPES.REEL ? 'reels' :
                   postType === POST_TYPES.CAROUSEL ? 'carousels' :
                   'posts';
      
      const fileRef = storageRef(storage, `${path}/${user.uid}/${fileName}`);
      
      // Update upload progress
      setUploadProgress(prev => ({ ...prev, [index]: 0 }));
      
      const snapshot = await uploadBytes(fileRef, mediaFile.file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Upload thumbnail for videos
      let thumbnailURL = null;
      if (mediaFile.type === 'video' && mediaFile.thumbnailUrl) {
        const thumbnailBlob = await fetch(mediaFile.thumbnailUrl).then(r => r.blob());
        const thumbnailRef = storageRef(storage, `${path}/${user.uid}/thumbnails/${fileName}_thumb.jpg`);
        const thumbnailSnapshot = await uploadBytes(thumbnailRef, thumbnailBlob);
        thumbnailURL = await getDownloadURL(thumbnailSnapshot.ref);
      }
      
      setUploadProgress(prev => ({ ...prev, [index]: 100 }));
      
      return {
        url: downloadURL,
        thumbnailUrl: thumbnailURL || downloadURL,
        type: mediaFile.type,
        mimeType: mediaFile.mimeType,
        width: mediaFile.width,
        height: mediaFile.height,
        size: mediaFile.size,
        fileName: mediaFile.name
      };
    } catch (error) {
      console.error('Media upload error:', error);
      throw error;
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.en.trim()) {
      newErrors.title = 'Title (English) is required';
    }
    
    if (postType === POST_TYPES.STANDARD && !formData.content.en.trim()) {
      newErrors.content = 'Content (English) is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (selectedCities.length === 0) {
      newErrors.cities = 'At least one city must be selected';
    }
    
    // Media validation based on post type
    if (postType === POST_TYPES.REEL && mediaFiles.length === 0) {
      newErrors.media = 'At least one video is required for Reels';
    }
    
    if (postType === POST_TYPES.STORY && mediaFiles.length === 0) {
      newErrors.media = 'At least one image or video is required for Stories';
    }
    
    if (postType === POST_TYPES.CAROUSEL && mediaFiles.length < 2) {
      newErrors.media = 'At least 2 images are required for Carousels';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fix the errors before submitting');
      return;
    }
    
    setLoading(true);
    
    try {
      // Upload all media files
      const uploadedMedia = await Promise.all(
        mediaFiles.map((media, index) => uploadMedia(media, index))
      );
      
      // Prepare post data based on post type
      let postData = {
        ...formData,
        cities: selectedCities,
        author: {
          uid: user.uid,
          name: user.displayName || 'Admin',
          email: user.email
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: postType,
        isPublished: true
      };
      
      // Add media content for media posts
      if (postType !== POST_TYPES.STANDARD) {
        postData.mediaContent = {
          type: postType === POST_TYPES.REEL ? MEDIA_TYPES.VIDEO :
                postType === POST_TYPES.STORY ? (uploadedMedia[0].type === 'video' ? MEDIA_TYPES.VIDEO : MEDIA_TYPES.SINGLE_IMAGE) :
                MEDIA_TYPES.CAROUSEL,
          items: uploadedMedia.map((media, index) => ({
            ...media,
            order: index,
            caption: formData.title
          })),
          settings: formData.mediaContent.settings
        };
        
        // Add type-specific settings
        if (postType === POST_TYPES.STORY) {
          postData.storySettings = formData.storySettings;
          postData.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
          postData.isActive = true;
        }
        
        if (postType === POST_TYPES.REEL) {
          postData.reelSettings = formData.reelSettings;
        }
        
        if (postType === POST_TYPES.CAROUSEL) {
          postData.carouselSettings = formData.carouselSettings;
        }
      } else {
        // Regular post - legacy format
        postData.media = uploadedMedia;
        postData.image = uploadedMedia[0]?.url || '';
      }
      
      // Save to Firebase based on post type
      const dbPath = postType === POST_TYPES.STORY ? 'stories' :
                     postType === POST_TYPES.REEL ? 'reels' :
                     postType === POST_TYPES.CAROUSEL ? 'carousels' :
                     'posts';
      
      const postRef = ref(db, dbPath);
      const newPostRef = push(postRef);
      await set(newPostRef, {
        ...postData,
        id: newPostRef.key,
        publishedAt: new Date().toISOString()
      });
      
      alert(`${postType} created successfully!`);
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error('Post creation error:', error);
      alert(`Failed to create ${postType}. Please try again.`);
    } finally {
      setLoading(false);
      setUploadProgress({});
    }
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
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
      isFeatured: false,
      publishDate: '',
      scheduledTime: '',
      mediaContent: {
        type: MEDIA_TYPES.SINGLE_IMAGE,
        items: [],
        settings: {
          autoplay: false,
          showCaptions: true,
          duration: 15,
          aspectRatio: '16:9',
          infinite: false,
          loop: false
        }
      },
      storySettings: {
        duration: 15,
        backgroundColor: '#000000',
        textColor: '#ffffff',
        textPosition: 'bottom',
        hasMusic: false,
        musicUrl: '',
        musicTitle: ''
      },
      reelSettings: {
        musicUrl: '',
        musicTitle: '',
        musicArtist: '',
        effects: [],
        speed: 1.0,
        allowDownload: true,
        allowDuet: true,
        allowComments: true
      },
      carouselSettings: {
        autoPlay: false,
        interval: 3000,
        showIndicators: true,
        showArrows: true,
        transition: 'slide'
      }
    });
    setMediaFiles([]);
    setErrors({});
  };
  
  // Render post type selector
  const renderPostTypeSelector = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Select Post Type
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {postTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.value}
              onClick={() => setPostType(type.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                postType === type.value
                  ? 'border-primary-red bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Icon className={`w-8 h-8 mx-auto mb-2 ${
                postType === type.value ? 'text-primary-red' : 'text-gray-500 dark:text-gray-400'
              }`} />
              <div className="text-center">
                <div className={`font-semibold mb-1 ${
                  postType === type.value ? 'text-primary-red' : 'text-gray-900 dark:text-white'
                }`}>
                  {type.label}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {type.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
  
  // Render basic fields (title, content, category, etc.)
  const renderBasicFields = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Basic Information
        </h3>
        <button
          type="button"
          onClick={handleAutoTranslate}
          disabled={translating || !formData.title.en}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {translating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Languages className="w-4 h-4" />
          )}
          <span>{translating ? 'Translating...' : 'Auto Translate'}</span>
        </button>
      </div>
      
      {/* Language Tabs */}
      <div className="flex space-x-2 mb-4 border-b border-gray-200 dark:border-gray-700">
        {Object.entries(languageLabels).map(([lang, label]) => (
          <button
            key={lang}
            type="button"
            onClick={() => setActiveLanguage(lang)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeLanguage === lang
                ? 'text-primary-red border-b-2 border-primary-red'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      
      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title ({languageLabels[activeLanguage]}) *
        </label>
        <input
          type="text"
          value={formData.title[activeLanguage]}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            title: { ...prev.title, [activeLanguage]: e.target.value }
          }))}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder={`Enter title in ${languageLabels[activeLanguage]}`}
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>
      
      {/* Content - Only for regular posts */}
      {postType === POST_TYPES.STANDARD && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content ({languageLabels[activeLanguage]}) *
          </label>
          <textarea
            value={formData.content[activeLanguage]}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              content: { ...prev.content, [activeLanguage]: e.target.value }
            }))}
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder={`Enter content in ${languageLabels[activeLanguage]}`}
          />
          {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
        </div>
      )}
      
      {/* Excerpt/Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {postType === POST_TYPES.STANDARD ? 'Excerpt' : 'Description'} ({languageLabels[activeLanguage]})
        </label>
        <textarea
          value={formData.excerpt[activeLanguage]}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            excerpt: { ...prev.excerpt, [activeLanguage]: e.target.value }
          }))}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder={`Enter ${postType === POST_TYPES.STANDARD ? 'excerpt' : 'description'} in ${languageLabels[activeLanguage]}`}
        />
      </div>
      
      {/* Category and Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value, subcategory: '' }))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select Category</option>
            {Object.keys(categoryData).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Alkapuri, Vadodara"
          />
        </div>
      </div>
      
      {/* Cities Multi-Select */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Cities * (Select one or more)
        </label>
        <div className="flex flex-wrap gap-2">
          {cities && cities.map(city => (
            <button
              key={city.id}
              type="button"
              onClick={() => {
                setSelectedCities(prev => 
                  prev.includes(city.id) 
                    ? prev.filter(id => id !== city.id)
                    : [...prev, city.id]
                );
              }}
              className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                selectedCities.includes(city.id)
                  ? 'border-primary-red bg-red-50 dark:bg-red-900/20 text-primary-red'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
              }`}
            >
              {city.name.en}
            </button>
          ))}
        </div>
        {errors.cities && <p className="text-red-500 text-sm mt-1">{errors.cities}</p>}
      </div>
      
      {/* Tags */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tags
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Add tag and press Enter"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Flags for regular posts */}
      {postType === POST_TYPES.STANDARD && (
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isBreaking}
              onChange={(e) => setFormData(prev => ({ ...prev, isBreaking: e.target.checked }))}
              className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Breaking News</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isUrgent}
              onChange={(e) => setFormData(prev => ({ ...prev, isUrgent: e.target.checked }))}
              className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Urgent</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
              className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Featured</span>
          </label>
        </div>
      )}
    </div>
  );
  
  // Render media upload section
  const renderMediaUpload = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Media {postType !== POST_TYPES.STANDARD && '*'}
      </h3>
      
      {/* Upload buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        {(postType === POST_TYPES.STANDARD || postType === POST_TYPES.STORY || postType === POST_TYPES.CAROUSEL) && (
          <button
            type="button"
            onClick={() => multipleImageInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Image className="w-5 h-5" />
            <span>Add Images</span>
          </button>
        )}
        
        {(postType === POST_TYPES.STANDARD || postType === POST_TYPES.STORY || postType === POST_TYPES.REEL) && (
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Video className="w-5 h-5" />
            <span>Add Video</span>
          </button>
        )}
      </div>
      
      {errors.media && <p className="text-red-500 text-sm mb-4">{errors.media}</p>}
      
      {/* Hidden file inputs */}
      <input
        ref={multipleImageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleMediaSelect(e, 'image')}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => handleMediaSelect(e, 'video')}
        className="hidden"
      />
      
      {/* Media preview */}
      {mediaFiles.length > 0 && (
        <div className="space-y-3">
          {mediaFiles.map((media, index) => (
            <div
              key={index}
              className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              {/* Preview */}
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                {media.type === 'video' ? (
                  <video src={media.previewUrl} className="w-full h-full object-cover" />
                ) : (
                  <img src={media.previewUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {media.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(media.size)} • {media.type}
                  {media.width && media.height && ` • ${media.width}x${media.height}`}
                </p>
                {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-primary-red h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress[index]}%` }}
                    />
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-2">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveMediaFile(index, 'up')}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                )}
                {index < mediaFiles.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveMediaFile(index, 'down')}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeMediaFile(index)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
  // Render type-specific settings
  const renderTypeSettings = () => {
    if (postType === POST_TYPES.STANDARD) return null;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {postType} Settings
        </h3>
        
        {/* Story Settings */}
        {postType === POST_TYPES.STORY && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (seconds)
              </label>
              <input
                type="number"
                value={formData.storySettings.duration}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  storySettings: { ...prev.storySettings, duration: parseInt(e.target.value) }
                }))}
                min="5"
                max="60"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Background Color
                </label>
                <input
                  type="color"
                  value={formData.storySettings.backgroundColor}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    storySettings: { ...prev.storySettings, backgroundColor: e.target.value }
                  }))}
                  className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Text Color
                </label>
                <input
                  type="color"
                  value={formData.storySettings.textColor}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    storySettings: { ...prev.storySettings, textColor: e.target.value }
                  }))}
                  className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Reel Settings */}
        {postType === POST_TYPES.REEL && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Music Title
              </label>
              <input
                type="text"
                value={formData.reelSettings.musicTitle}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  reelSettings: { ...prev.reelSettings, musicTitle: e.target.value }
                }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Song name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Artist Name
              </label>
              <input
                type="text"
                value={formData.reelSettings.musicArtist}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  reelSettings: { ...prev.reelSettings, musicArtist: e.target.value }
                }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Artist name"
              />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.reelSettings.allowDownload}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reelSettings: { ...prev.reelSettings, allowDownload: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Allow Download</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.reelSettings.allowDuet}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reelSettings: { ...prev.reelSettings, allowDuet: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Allow Duet</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.reelSettings.allowComments}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reelSettings: { ...prev.reelSettings, allowComments: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Allow Comments</span>
              </label>
            </div>
          </div>
        )}
        
        {/* Carousel Settings */}
        {postType === POST_TYPES.CAROUSEL && (
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.carouselSettings.autoPlay}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  carouselSettings: { ...prev.carouselSettings, autoPlay: e.target.checked }
                }))}
                className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Auto Play</span>
            </label>
            
            {formData.carouselSettings.autoPlay && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interval (milliseconds)
                </label>
                <input
                  type="number"
                  value={formData.carouselSettings.interval}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    carouselSettings: { ...prev.carouselSettings, interval: parseInt(e.target.value) }
                  }))}
                  min="1000"
                  max="10000"
                  step="500"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}
            
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.carouselSettings.showIndicators}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    carouselSettings: { ...prev.carouselSettings, showIndicators: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show Indicators</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.carouselSettings.showArrows}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    carouselSettings: { ...prev.carouselSettings, showArrows: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-primary-red focus:ring-primary-red"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show Arrows</span>
              </label>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Post
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create news posts, stories, reels, and carousels all from one place
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {renderPostTypeSelector()}
          {renderBasicFields()}
          {renderMediaUpload()}
          {renderTypeSettings()}
          
          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-primary-red text-white rounded-lg hover:bg-secondary-red disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Publish {postType}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnifiedPostCreator;
