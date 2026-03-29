// =============================================
// src/components/Admin/UnifiedPostCreator.jsx
// Single Unified Interface for All Post Types
// Regular News Posts + Media Posts (Reels, Stories, Carousels)
// =============================================
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { useCity } from '../../context/CityContext';
import { ref, push, set } from 'firebase/database';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase-config';
import RichTextEditor from '../Common/RichTextEditor';
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
  Check,
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

const MAX_VISIBLE_CITY_PILLS = 12;
const CITY_VALIDATION_MESSAGE = 'Please select at least one city | ઓછામાં ઓછું એક શહેર પસંદ કરો';

const UnifiedPostCreator = () => {
  const { user } = useAuth();
  const { cities, currentCity } = useCity();
  
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
  const [citiesTouched, setCitiesTouched] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);

  const availableCities = useMemo(() => cities || [], [cities]);
  const cityIdSet = useMemo(() => new Set(availableCities.map(city => city.id)), [availableCities]);
  const validSelectedCities = useMemo(
    () => selectedCities.filter(id => cityIdSet.has(id)),
    [selectedCities, cityIdSet]
  );
  const displayedCities = useMemo(
    () => (showAllCities ? availableCities : availableCities.slice(0, MAX_VISIBLE_CITY_PILLS)),
    [availableCities, showAllCities]
  );
  const selectedCityNames = useMemo(() => {
    if (availableCities.length === 0) return [];
    const nameMap = new Map(
      availableCities.map(city => [
        city.id,
        city.name?.en || city.name || city.nameEn || city.nameGu || city.nameHi || city.id
      ])
    );
    return validSelectedCities.map(id => nameMap.get(id) || id);
  }, [availableCities, validSelectedCities]);
  const citySelectionError = errors.cities || (citiesTouched && validSelectedCities.length === 0 ? CITY_VALIDATION_MESSAGE : null);
  
  // Keep selected cities in sync with available cities and current preference
  useEffect(() => {
    if (!availableCities.length) return;

    setSelectedCities(prev => {
      const availableIds = new Set(availableCities.map(city => city.id));
      const filtered = prev.filter(id => availableIds.has(id));

      if (filtered.length > 0) {
        return filtered.length === prev.length ? prev : filtered;
      }

      const fallbackId = (currentCity && availableIds.has(currentCity.id))
        ? currentCity.id
        : availableCities[0]?.id;

      return fallbackId ? [fallbackId] : [];
    });
  }, [availableCities, currentCity]);

  const handleCityToggle = (cityId) => {
    setCitiesTouched(true);
    setErrors(prev => ({ ...prev, cities: null }));
    setSelectedCities(prev => (
      prev.includes(cityId)
        ? prev.filter(id => id !== cityId)
        : [...prev, cityId]
    ));
  };

  const handleSelectCurrentCity = () => {
    if (!currentCity?.id) return;
    setCitiesTouched(true);
    setErrors(prev => ({ ...prev, cities: null }));
    setSelectedCities([currentCity.id]);
  };

  const handleSelectAllCities = () => {
    if (!availableCities.length) return;
    setCitiesTouched(true);
    setErrors(prev => ({ ...prev, cities: null }));
    setSelectedCities(availableCities.map(city => city.id));
  };

  const handleClearCities = () => {
    setCitiesTouched(true);
    setSelectedCities([]);
  };
  
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
  // Handles text of any length by chunking into 500 character segments
  const translateText = async (text, targetLang) => {
    if (!text || !text.trim()) return '';
    
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
            const response = await axios.get('https://api.mymemory.translated.net/get', {
              params: {
                q: chunk,
                langpair: `en|${targetLang}`
              }
            });
            return response.data.responseData.translatedText || chunk;
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
  
  // Handle media file selection - Optimized with parallel processing
  const handleMediaSelect = async (e, type = 'image') => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Process all files in parallel for faster loading
    const processFile = async (file) => {
      const previewUrl = URL.createObjectURL(file);
      const mediaItem = {
        file,
        previewUrl,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        name: file.name,
        size: file.size,
        mimeType: file.type
      };
      
      // Process thumbnail and dimensions in parallel
      const promises = [];
      
      // Generate thumbnail for videos
      if (mediaItem.type === 'video') {
        promises.push(
          generateVideoThumbnail(file)
            .then(thumbnail => { mediaItem.thumbnailUrl = thumbnail; })
            .catch(error => console.error('Thumbnail generation failed:', error))
        );
      }
      
      // Get dimensions
      promises.push(
        getMediaDimensions(file)
          .then(dimensions => {
            mediaItem.width = dimensions.width;
            mediaItem.height = dimensions.height;
          })
          .catch(error => console.error('Dimension detection failed:', error))
      );
      
      await Promise.all(promises);
      return mediaItem;
    };
    
    // Process all files in parallel
    const newMediaFiles = await Promise.all(files.map(processFile));
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
  
  // Upload media files to Firebase Storage with progress tracking
  const uploadMedia = async (mediaFile, index) => {
    try {
      const fileName = `${Date.now()}_${index}_${mediaFile.name}`;
      const path = postType === POST_TYPES.STORY ? 'stories' :
                   postType === POST_TYPES.REEL ? 'reels' :
                   postType === POST_TYPES.CAROUSEL ? 'carousels' :
                   'posts';
      
      const fileRef = storageRef(storage, `${path}/${user.uid}/${fileName}`);
      
      // Use uploadBytesResumable for progress tracking
      const uploadTask = uploadBytesResumable(fileRef, mediaFile.file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(prev => ({ ...prev, [index]: Math.round(progress) }));
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              // Upload thumbnail for videos in parallel
              let thumbnailURL = null;
              if (mediaFile.type === 'video' && mediaFile.thumbnailUrl) {
                const thumbnailBlob = await fetch(mediaFile.thumbnailUrl).then(r => r.blob());
                const thumbnailRef = storageRef(storage, `${path}/${user.uid}/thumbnails/${fileName}_thumb.jpg`);
                const thumbnailTask = uploadBytesResumable(thumbnailRef, thumbnailBlob);
                const thumbnailSnapshot = await thumbnailTask;
                thumbnailURL = await getDownloadURL(thumbnailSnapshot.ref);
              }
              
              resolve({
                url: downloadURL,
                thumbnailUrl: thumbnailURL || downloadURL,
                type: mediaFile.type,
                mimeType: mediaFile.mimeType,
                width: mediaFile.width,
                height: mediaFile.height,
                size: mediaFile.size,
                fileName: mediaFile.name
              });
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Media upload error:', error);
      throw error;
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Check if at least one language has a title
    const hasTitle = formData.title.en.trim() || formData.title.hi.trim() || formData.title.gu.trim();
    if (!hasTitle) {
      newErrors.title = 'Title is required in at least one language';
    }
    
    // For standard posts, check if at least one language has content
    if (postType === POST_TYPES.STANDARD) {
      const hasContent = formData.content.en.trim() || formData.content.hi.trim() || formData.content.gu.trim();
      if (!hasContent) {
        newErrors.content = 'Content is required in at least one language';
      }
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (validSelectedCities.length === 0) {
      newErrors.cities = CITY_VALIDATION_MESSAGE;
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
    
    setCitiesTouched(true);
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
        cities: validSelectedCities,
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
      
      // Clear upload progress first
      setUploadProgress({});
      
      // Reset form to blank state
      resetForm();
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error('Post creation error:', error);
      alert(`Failed to create ${postType}. Please try again.`);
    } finally {
      setLoading(false);
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {postTypes.map((type) => {
        const Icon = type.icon;
        const active = postType === type.value;
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => setPostType(type.value)}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${
              active
                ? 'border-primary-600 bg-primary-50 dark:bg-primary-600/10 shadow-md'
                : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm'
            }`}
          >
            {active && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-600" />
            )}
            <Icon className={`w-7 h-7 ${active ? 'text-primary-600' : 'text-neutral-400 dark:text-neutral-500'}`} />
            <span className={`text-sm font-semibold leading-tight text-center ${active ? 'text-primary-700 dark:text-primary-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
              {type.label}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 text-center leading-snug hidden sm:block">
              {type.description}
            </span>
          </button>
        );
      })}
    </div>
  );
  
  // Render basic fields (title, content, category, etc.)
  const renderBasicFields = () => (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm mb-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-600" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Content</h3>
        </div>
        <button
          type="button"
          onClick={handleAutoTranslate}
          disabled={translating || (!formData.title.en && !formData.title.hi && !formData.title.gu)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {translating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Languages className="w-3.5 h-3.5" />
          )}
          <span>{translating ? 'Translating…' : 'Auto Translate'}</span>
        </button>
      </div>
      
      {/* Language Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-neutral-100 dark:bg-neutral-700/50 rounded-lg w-fit">
        {Object.entries(languageLabels).map(([lang, label]) => {
          const hasContent = formData.title[lang]?.trim() || formData.content[lang]?.trim();
          return (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveLanguage(lang)}
              className={`relative px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeLanguage === lang
                  ? 'bg-white dark:bg-neutral-800 text-primary-700 dark:text-primary-400 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
            >
              {label}
              {hasContent && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Title */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
          Title — {languageLabels[activeLanguage]}
          <span className="text-danger ml-1">*</span>
          <span className="text-xs text-neutral-400 ml-2 font-normal">required in at least one language</span>
        </label>
        <input
          type="text"
          value={formData.title[activeLanguage]}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            title: { ...prev.title, [activeLanguage]: e.target.value }
          }))}
          className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
          placeholder={`Enter title in ${languageLabels[activeLanguage]}`}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.title ? (
            <p className="text-danger text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</p>
          ) : <span />}
          <span className="text-xs text-neutral-400">{formData.title[activeLanguage]?.length || 0} chars</span>
        </div>
      </div>

      {/* Content - Only for regular posts */}
      {postType === POST_TYPES.STANDARD && (
        <div className="mb-5">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Content — {languageLabels[activeLanguage]}
            <span className="text-danger ml-1">*</span>
          </label>
          <div className="rounded-lg overflow-hidden border border-neutral-300 dark:border-neutral-600 focus-within:ring-2 focus-within:ring-primary-500">
            <RichTextEditor
              content={formData.content[activeLanguage]}
              onChange={(html) => setFormData(prev => ({
                ...prev,
                content: { ...prev.content, [activeLanguage]: html }
              }))}
              placeholder={`Enter content in ${languageLabels[activeLanguage]}`}
              minHeight="300px"
            />
          </div>
          {errors.content && <p className="text-danger text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.content}</p>}
        </div>
      )}

      {/* Excerpt/Description */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
          {postType === POST_TYPES.STANDARD ? 'Excerpt' : 'Description'} — {languageLabels[activeLanguage]}
          <span className="text-xs text-neutral-400 ml-2 font-normal">optional summary</span>
        </label>
        <div className="rounded-lg overflow-hidden border border-neutral-300 dark:border-neutral-600 focus-within:ring-2 focus-within:ring-primary-500">
          <RichTextEditor
            content={formData.excerpt[activeLanguage]}
            onChange={(html) => setFormData(prev => ({
              ...prev,
              excerpt: { ...prev.excerpt, [activeLanguage]: html }
            }))}
            placeholder={`Enter ${postType === POST_TYPES.STANDARD ? 'excerpt' : 'description'} in ${languageLabels[activeLanguage]}`}
            minHeight="120px"
          />
        </div>
      </div>

      {/* Category and Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Category <span className="text-danger">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value, subcategory: '' }))}
            className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
          >
            <option value="">Select Category</option>
            {Object.keys(categoryData).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <p className="text-danger text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.category}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              placeholder="e.g., Alkapuri, Vadodara"
            />
          </div>
        </div>
      </div>

      {/* Cities Multi-Select */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary-500" />
            Target Cities <span className="text-danger">*</span>
          </label>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded-full">
            {validSelectedCities.length}/{availableCities.length || 0}
          </span>
        </div>
        <div className="p-4 bg-neutral-50 dark:bg-neutral-700/40 rounded-xl border border-neutral-200 dark:border-neutral-600 space-y-3">
          {availableCities.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSelectCurrentCity}
                  disabled={!currentCity?.id}
                  className={`px-3 py-1 text-xs rounded-full border transition focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    currentCity?.id && validSelectedCities.length === 1 && validSelectedCities[0] === currentCity.id
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-300 dark:border-neutral-600 hover:border-primary-400 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  My city
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllCities}
                  disabled={availableCities.length === 0 || availableCities.length === validSelectedCities.length}
                  className="px-3 py-1 text-xs rounded-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  All ({availableCities.length})
                </button>
                <button
                  type="button"
                  onClick={handleClearCities}
                  disabled={validSelectedCities.length === 0}
                  className="px-3 py-1 text-xs rounded-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-danger disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Clear
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {displayedCities.map(city => {
                  const isSelected = validSelectedCities.includes(city.id);
                  const cityLabel = city.name?.en || city.name || city.nameEn || city.nameGu || city.nameHi || city.id;
                  return (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handleCityToggle(city.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-full border transition focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        isSelected
                          ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                          : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-600 hover:border-primary-400'
                      }`}
                    >
                      <Check className={`w-3 h-3 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                      {cityLabel}
                    </button>
                  );
                })}
              </div>

              {availableCities.length > MAX_VISIBLE_CITY_PILLS && (
                <button
                  type="button"
                  onClick={() => setShowAllCities(prev => !prev)}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {showAllCities ? 'Show fewer' : `+${availableCities.length - MAX_VISIBLE_CITY_PILLS} more cities`}
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-neutral-500">Loading cities…</p>
          )}
          {citySelectionError && (
            <p className="text-danger text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{citySelectionError}</p>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
          <Tag className="inline w-3.5 h-3.5 mr-1" />Tags
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            className="flex-1 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            placeholder="Type a tag and press Enter"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-3 py-2.5 bg-neutral-200 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-500 transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs border border-primary-200 dark:border-primary-700">
                #{tag}
                <button type="button" onClick={() => removeTag(tag)} className="text-primary-400 hover:text-primary-700 dark:hover:text-primary-100">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Publishing Flags (Standard posts only) */}
      {postType === POST_TYPES.STANDARD && (
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500 mb-3">Publish Options</p>
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'isBreaking', label: 'Breaking News', color: 'danger' },
              { key: 'isUrgent', label: 'Urgent', color: 'accent' },
              { key: 'isFeatured', label: 'Featured', color: 'primary' },
            ].map(({ key, label, color }) => (
              <label key={key} className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 cursor-pointer transition select-none ${
                formData[key]
                  ? color === 'danger' ? 'border-danger bg-red-50 dark:bg-red-900/20 text-danger'
                    : color === 'accent' ? 'border-accent-500 bg-orange-50 dark:bg-orange-900/20 text-accent-600 dark:text-accent-400'
                    : 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}>
                <input
                  type="checkbox"
                  checked={formData[key]}
                  onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="sr-only"
                />
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  formData[key] ? 'bg-current border-current' : 'border-neutral-300 dark:border-neutral-600'
                }`}>
                  {formData[key] && <Check className="w-2.5 h-2.5 text-white" />}
                </span>
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
  // Render media upload section
  const renderMediaUpload = () => (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm mb-6">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-5">
        <Upload className="w-5 h-5 text-primary-600" />
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
          Media {postType !== POST_TYPES.STANDARD && <span className="text-danger">*</span>}
        </h3>
      </div>

      {/* Drop zone */}
      <div
        className="relative flex flex-col items-center justify-center gap-3 p-8 mb-4 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700/30 hover:border-primary-400 dark:hover:border-primary-500 transition-colors cursor-pointer group"
        onClick={() => multipleImageInputRef.current?.click()}
      >
        <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
          <Upload className="w-6 h-6 text-primary-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Drop files here or <span className="text-primary-600">browse</span>
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Images &amp; Videos supported</p>
        </div>
        <div className="flex gap-2">
          {(postType === POST_TYPES.STANDARD || postType === POST_TYPES.STORY || postType === POST_TYPES.CAROUSEL) && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); multipleImageInputRef.current?.click(); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Image className="w-3.5 h-3.5" />
              Add Images
            </button>
          )}
          {(postType === POST_TYPES.STANDARD || postType === POST_TYPES.STORY || postType === POST_TYPES.REEL) && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); videoInputRef.current?.click(); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-neutral-700 dark:bg-neutral-600 text-white rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-500 transition-colors"
            >
              <Video className="w-3.5 h-3.5" />
              Add Video
            </button>
          )}
        </div>
      </div>

      {errors.media && (
        <p className="text-danger text-xs mb-4 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.media}</p>
      )}

      {/* Hidden file inputs */}
      <input ref={multipleImageInputRef} type="file" accept="image/*" multiple onChange={(e) => handleMediaSelect(e, 'image')} className="hidden" />
      <input ref={videoInputRef} type="file" accept="video/*" onChange={(e) => handleMediaSelect(e, 'video')} className="hidden" />

      {/* Media previews */}
      {mediaFiles.length > 0 && (
        <div className="space-y-2">
          {mediaFiles.map((media, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-600 flex-shrink-0">
                {media.type === 'video' ? (
                  <video src={media.previewUrl} className="w-full h-full object-cover" />
                ) : (
                  <img src={media.previewUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>

              {/* Info + progress */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{media.name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {formatFileSize(media.size)} · {media.type}
                  {media.width && media.height && ` · ${media.width}×${media.height}`}
                </p>
                {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>Uploading…</span><span>{uploadProgress[index]}%</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress[index]}%` }}
                      />
                    </div>
                  </div>
                )}
                {uploadProgress[index] === 100 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1"><Check className="w-3 h-3" />Uploaded</p>
                )}
              </div>

              {/* Reorder + remove */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {index > 0 && (
                  <button type="button" onClick={() => moveMediaFile(index, 'up')} className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                )}
                {index < mediaFiles.length - 1 && (
                  <button type="button" onClick={() => moveMediaFile(index, 'down')} className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                )}
                <button type="button" onClick={() => removeMediaFile(index)} className="p-1.5 text-danger hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
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
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Settings className="w-5 h-5 text-primary-600" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white capitalize">
            {postType.toLowerCase()} Settings
          </h3>
        </div>

        {/* Story Settings */}
        {postType === POST_TYPES.STORY && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
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
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Background Color
                </label>
                <input
                  type="color"
                  value={formData.storySettings.backgroundColor}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    storySettings: { ...prev.storySettings, backgroundColor: e.target.value }
                  }))}
                  className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Text Color
                </label>
                <input
                  type="color"
                  value={formData.storySettings.textColor}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    storySettings: { ...prev.storySettings, textColor: e.target.value }
                  }))}
                  className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Reel Settings */}
        {postType === POST_TYPES.REEL && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Music Title
                </label>
                <div className="relative">
                  <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.reelSettings.musicTitle}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      reelSettings: { ...prev.reelSettings, musicTitle: e.target.value }
                    }))}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    placeholder="Song name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Artist Name
                </label>
                <input
                  type="text"
                  value={formData.reelSettings.musicArtist}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reelSettings: { ...prev.reelSettings, musicArtist: e.target.value }
                  }))}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  placeholder="Artist name"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'allowDownload', label: 'Allow Download' },
                { key: 'allowDuet', label: 'Allow Duet' },
                { key: 'allowComments', label: 'Allow Comments' },
              ].map(({ key, label }) => (
                <label key={key} className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 cursor-pointer transition select-none ${
                  formData.reelSettings[key]
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}>
                  <input type="checkbox" checked={formData.reelSettings[key]} onChange={(e) => setFormData(prev => ({ ...prev, reelSettings: { ...prev.reelSettings, [key]: e.target.checked } }))} className="sr-only" />
                  <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${formData.reelSettings[key] ? 'bg-primary-600 border-primary-600' : 'border-neutral-300 dark:border-neutral-600'}`}>
                    {formData.reelSettings[key] && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Carousel Settings */}
        {postType === POST_TYPES.CAROUSEL && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'autoPlay', label: 'Auto Play', obj: 'carouselSettings' },
                { key: 'showIndicators', label: 'Show Indicators', obj: 'carouselSettings' },
                { key: 'showArrows', label: 'Show Arrows', obj: 'carouselSettings' },
              ].map(({ key, label }) => (
                <label key={key} className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 cursor-pointer transition select-none ${
                  formData.carouselSettings[key]
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}>
                  <input type="checkbox" checked={formData.carouselSettings[key]} onChange={(e) => setFormData(prev => ({ ...prev, carouselSettings: { ...prev.carouselSettings, [key]: e.target.checked } }))} className="sr-only" />
                  <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${formData.carouselSettings[key] ? 'bg-primary-600 border-primary-600' : 'border-neutral-300 dark:border-neutral-600'}`}>
                    {formData.carouselSettings[key] && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
            {formData.carouselSettings.autoPlay && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Interval (ms)
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
                  className="w-full sm:w-48 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Page header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">Create Post</h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">News · Story · Reel · Carousel</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 transition"
            >
              Reset
            </button>
            <button
              type="button"
              form="unified-post-form"
              onClick={(e) => { e.preventDefault(); document.getElementById('unified-post-form').requestSubmit(); }}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Publishing…</span></>
              ) : (
                <><Send className="w-4 h-4" /><span>Publish</span></>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <form id="unified-post-form" onSubmit={handleSubmit}>
          {/* Step 1: Post Type */}
          <div className="mb-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">Step 1 — Choose Type</p>
          </div>
          {renderPostTypeSelector()}

          {/* Step 2: Content */}
          <div className="mb-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">Step 2 — Write Content</p>
          </div>
          {renderBasicFields()}

          {/* Step 3: Media */}
          <div className="mb-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">Step 3 — Attach Media</p>
          </div>
          {renderMediaUpload()}

          {/* Step 4: Type-specific settings */}
          {postType !== POST_TYPES.STANDARD && (
            <div className="mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">Step 4 — Format Settings</p>
            </div>
          )}
          {renderTypeSettings()}

          {/* Bottom publish bar */}
          <div className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm mt-2">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 hidden sm:block">
              Ready to go? Hit publish when content is ready.
            </p>
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="px-4 py-2.5 text-sm border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 transition"
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Publishing…</span></>
                ) : (
                  <><Send className="w-4 h-4" /><span>Publish {postType.charAt(0) + postType.slice(1).toLowerCase()}</span></>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Upload Progress Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-full mb-4">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                Publishing your {postType.charAt(0) + postType.slice(1).toLowerCase()}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Please wait while we upload your content…
              </p>
            </div>

            {Object.keys(uploadProgress).length > 0 && (
              <div className="space-y-3 mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Uploading files</p>
                {Object.entries(uploadProgress).map(([index, progress]) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>File {parseInt(index) + 1}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />This may take a few moments
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedPostCreator;

