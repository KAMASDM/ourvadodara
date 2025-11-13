// =============================================
// src/components/Admin/MediaPostCreator.jsx
// Enhanced Post Creation with Full Media Support
// Multi-City Support Added
// Auto-Translation: Gujarati → Hindi & English
// =============================================
import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/Auth/AuthContext';
import { useCity } from '../../context/CityContext';
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
import { 
  Save, 
  Eye, 
  Image, 
  Video, 
  Film,
  Layers,
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
  Move,
  RotateCcw,
  Trash2,
  ArrowUp,
  ArrowDown,
  MapPin,
  Languages,
  RefreshCw
} from 'lucide-react';

const MediaPostCreator = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const { cities } = useCity(); // Use dynamic cities from Firebase
  
  // Multi-city selection state
  const [selectedCities, setSelectedCities] = useState([]);
  
  // Initialize selectedCities when cities load
  useEffect(() => {
    if (cities && cities.length > 0 && selectedCities.length === 0) {
      setSelectedCities([cities[0].id]);
    }
  }, [cities]);
  
  // Core state
  const [postType, setPostType] = useState(POST_TYPES.STANDARD);
  const [mediaType, setMediaType] = useState(MEDIA_TYPES.SINGLE_IMAGE);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  
  // Form data structure
  const [formData, setFormData] = useState({
    type: POST_TYPES.STANDARD,
    title: { en: '', hi: '', gu: '' },
    content: { en: '', hi: '', gu: '' },
    excerpt: { en: '', hi: '', gu: '' },
    category: '',
    tags: [],
    location: '',
    mediaContent: {
      type: MEDIA_TYPES.SINGLE_IMAGE,
      items: [],
      settings: {
        autoplay: false,
        showCaptions: true,
        duration: 15,
        aspectRatio: '16:9'
      }
    },
    storySettings: {
      duration: 15,
      backgroundColor: '#000000',
      textColor: '#ffffff',
      textPosition: 'bottom',
      hasMusic: false,
      musicUrl: ''
    },
    reelSettings: {
      musicUrl: '',
      effects: [],
      speed: 1,
      captions: []
    },
    isBreaking: false,
    isFeatured: false,
    publishedAt: null
  });
  
  // Media management state
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState('gu'); // Default to Gujarati
  const [translating, setTranslating] = useState(false);
  
  // Language labels
  const languageLabels = {
    en: 'English',
    hi: 'Hindi (हिंदी)',
    gu: 'Gujarati (ગુજરાતી)'
  };
  
  // File input refs
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const multipleFilesRef = useRef(null);

  // Translation function using MyMemory Translation API (free)
  // Translates FROM Gujarati TO Hindi/English
  const translateText = async (text, targetLang) => {
    if (!text.trim()) return '';
    
    try {
      const langMap = {
        hi: 'hi',
        en: 'en'
      };
      
      console.log(`Translating "${text}" from Gujarati to ${targetLang}`);
      
      const response = await axios.get(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=gu|${langMap[targetLang]}`,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = response.data;
      console.log('Translation response:', data);
      
      if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
      } else {
        console.warn('Translation API returned invalid response');
        throw new Error('Invalid translation response');
      }
    } catch (error) {
      console.error('Translation error:', error);
      console.warn(`Translation failed, using original Gujarati text as fallback for ${targetLang}`);
      return text;
    }
  };

  // Auto-translate title
  const handleTranslateTitle = async () => {
    const gujaratiTitle = formData.title.gu.trim();
    if (!gujaratiTitle || gujaratiTitle.length < 3) {
      alert('કૃપા કરીને પહેલા ગુજરાતી શીર્ષક દાખલ કરો (ઓછામાં ઓછા 3 અક્ષરો).\nPlease enter a Gujarati title first (minimum 3 characters).');
      return;
    }

    try {
      setTranslating(true);
      console.log('Auto-translating title from Gujarati:', gujaratiTitle);
      const [hiTranslation, enTranslation] = await Promise.all([
        translateText(gujaratiTitle, 'hi'),
        translateText(gujaratiTitle, 'en')
      ]);
      
      setFormData(prev => ({
        ...prev,
        title: { 
          ...prev.title, 
          hi: hiTranslation, 
          en: enTranslation 
        }
      }));
      console.log('Title translations completed:', { hi: hiTranslation, en: enTranslation });
      alert('✅ Title auto-translated!\nશીર્ષક સ્વતઃ અનુવાદિત!');
    } catch (error) {
      console.error('Auto-translation failed:', error);
      alert('Translation failed. Please try again.\nઅનુવાદ નિષ્ફળ. ફરી પ્રયાસ કરો.');
    } finally {
      setTranslating(false);
    }
  };

  // Auto-translate content
  const handleTranslateContent = async () => {
    const gujaratiContent = formData.content.gu.trim();
    if (!gujaratiContent || gujaratiContent.length < 10) {
      alert('કૃપા કરીને પહેલા ગુજરાતી સામગ્રી દાખલ કરો (ઓછામાં ઓછા 10 અક્ષરો).\nPlease enter Gujarati content first (minimum 10 characters).');
      return;
    }

    try {
      setTranslating(true);
      console.log('Auto-translating content from Gujarati:', gujaratiContent.substring(0, 50) + '...');
      const [hiTranslation, enTranslation] = await Promise.all([
        translateText(gujaratiContent, 'hi'),
        translateText(gujaratiContent, 'en')
      ]);
      
      setFormData(prev => ({
        ...prev,
        content: { 
          ...prev.content, 
          hi: hiTranslation, 
          en: enTranslation 
        }
      }));
      console.log('Content translations completed');
      alert('✅ Content auto-translated!\nસામગ્રી સ્વતઃ અનુવાદિત!');
    } catch (error) {
      console.error('Auto-translation failed:', error);
      alert('Translation failed. Please try again.\nઅનુવાદ નિષ્ફળ. ફરી પ્રયાસ કરો.');
    } finally {
      setTranslating(false);
    }
  };

  // Auto-translate all
  const handleTranslateAll = async () => {
    const gujaratiTitle = formData.title.gu.trim();
    const gujaratiContent = formData.content.gu.trim();
    
    if (!gujaratiTitle && !gujaratiContent) {
      alert('કૃપા કરીને પહેલા ગુજરાતી સામગ્રી દાખલ કરો.\nPlease enter some Gujarati content first.');
      return;
    }

    try {
      setTranslating(true);
      console.log('Auto-translating all Gujarati content to Hindi & English...');
      
      const translationPromises = [];
      
      if (gujaratiTitle && gujaratiTitle.length > 3) {
        translationPromises.push(
          Promise.all([
            translateText(gujaratiTitle, 'hi'),
            translateText(gujaratiTitle, 'en')
          ]).then(([hi, en]) => ({ type: 'title', hi, en }))
        );
      }
      
      if (gujaratiContent && gujaratiContent.length > 10) {
        translationPromises.push(
          Promise.all([
            translateText(gujaratiContent, 'hi'),
            translateText(gujaratiContent, 'en')
          ]).then(([hi, en]) => ({ type: 'content', hi, en }))
        );
      }

      const results = await Promise.all(translationPromises);
      
      setFormData(prev => {
        const newData = { ...prev };
        results.forEach(result => {
          newData[result.type] = {
            ...prev[result.type],
            hi: result.hi,
            en: result.en
          };
        });
        return newData;
      });
      
      console.log('All translations completed:', results);
      alert('✅ All content auto-translated!\nબધી સામગ્રી સ્વતઃ અનુવાદિત!');
    } catch (error) {
      console.error('Batch translation failed:', error);
      alert('Translation failed. Please try again.\nઅનુવાદ નિષ્ફળ. ફરી પ્રયાસ કરો.');
    } finally {
      setTranslating(false);
    }
  };

  // Post type configurations
  const postTypeConfig = {
    [POST_TYPES.STANDARD]: {
      title: 'Standard Post',
      description: 'Regular news post with text and media',
      icon: Image,
      allowedMedia: [MEDIA_TYPES.SINGLE_IMAGE, MEDIA_TYPES.CAROUSEL, MEDIA_TYPES.VIDEO, MEDIA_TYPES.MIXED_MEDIA],
      maxFiles: 10
    },
    [POST_TYPES.STORY]: {
      title: 'Story',
      description: 'Short-lived content (24 hours)',
      icon: Clock,
      allowedMedia: [MEDIA_TYPES.SINGLE_IMAGE, MEDIA_TYPES.VIDEO],
      maxFiles: 5,
      aspectRatio: '9:16'
    },
    [POST_TYPES.REEL]: {
      title: 'Reel',
      description: 'Short vertical video content',
      icon: Film,
      allowedMedia: [MEDIA_TYPES.REEL],
      maxFiles: 1,
      aspectRatio: '9:16',
      videoOnly: true
    },
    [POST_TYPES.CAROUSEL]: {
      title: 'Carousel',
      description: 'Multiple images/videos in slideshow',
      icon: Layers,
      allowedMedia: [MEDIA_TYPES.CAROUSEL],
      maxFiles: 10,
      minFiles: 2
    }
  };

  // Handle post type change
  const handlePostTypeChange = (type) => {
    setPostType(type);
    setFormData(prev => ({
      ...prev,
      type,
      mediaContent: {
        ...prev.mediaContent,
        type: postTypeConfig[type].allowedMedia[0],
        items: []
      }
    }));
    setMediaFiles([]);
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (files) => {
    const config = postTypeConfig[postType];
    const fileArray = Array.from(files);
    
    // Validate file count
    if (fileArray.length > config.maxFiles) {
      alert(`Maximum ${config.maxFiles} files allowed for ${config.title}`);
      return;
    }
    
    // Validate file types for reels
    if (postType === POST_TYPES.REEL) {
      const hasVideo = fileArray.some(file => file.type.startsWith('video/'));
      if (!hasVideo) {
        alert('Reels require at least one video file');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      const newMediaFiles = [];
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const fileId = `${Date.now()}_${i}`;
        
        // Get dimensions
        const dimensions = await getMediaDimensions(file);
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        
        // Generate thumbnail for videos
        let thumbnailUrl = null;
        if (file.type.startsWith('video/')) {
          thumbnailUrl = await generateVideoThumbnail(file);
        }
        
        const mediaItem = {
          id: fileId,
          file,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          previewUrl,
          thumbnailUrl,
          filename: file.name,
          size: file.size,
          dimensions,
          caption: { en: '', hi: '', gu: '' },
          uploaded: false,
          uploadProgress: 0
        };
        
        newMediaFiles.push(mediaItem);
      }
      
      setMediaFiles(prev => [...prev, ...newMediaFiles]);
      
    } catch (error) {
      console.error('Error processing files:', error);
      alert('Error processing files. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [postType]);

  // File drop handler
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  // Upload media files to Firebase
  const uploadAllMedia = async () => {
    const uploadPromises = mediaFiles.map(async (mediaItem) => {
      if (mediaItem.uploaded) return mediaItem;
      
      try {
        setUploadProgress(prev => ({ ...prev, [mediaItem.id]: 0 }));
        
        const result = await uploadMediaFile(
          mediaItem.file, 
          `posts/${postType}`, 
          user.uid
        );
        
        if (result.success) {
          setUploadProgress(prev => ({ ...prev, [mediaItem.id]: 100 }));
          return {
            ...mediaItem,
            ...result.mediaItem,
            uploaded: true,
            uploadProgress: 100
          };
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error(`Error uploading ${mediaItem.filename}:`, error);
        setUploadProgress(prev => ({ ...prev, [mediaItem.id]: -1 }));
        return { ...mediaItem, uploadError: error.message };
      }
    });
    
    const results = await Promise.all(uploadPromises);
    setMediaFiles(results);
    return results.filter(item => item.uploaded);
  };

  // Save post
  const handleSave = async () => {
    // Validate city selection
    if (selectedCities.length === 0) {
      alert('Please select at least one city');
      return;
    }
    
    setLoading(true);
    
    try {
      // Upload media files first
      const uploadedMedia = await uploadAllMedia();
      
      if (uploadedMedia.length === 0 && mediaFiles.length > 0) {
        throw new Error('Failed to upload media files');
      }
      
      // Prepare post data
      const postData = {
        ...formData,
        mediaContent: {
          ...formData.mediaContent,
          items: uploadedMedia.map(item => ({
            id: item.id,
            type: item.type,
            url: item.url,
            thumbnailUrl: item.thumbnailUrl,
            filename: item.filename,
            size: item.size,
            dimensions: item.dimensions,
            caption: item.caption,
            metadata: item.metadata
          }))
        },
        author: {
          uid: user.uid,
          name: user.displayName || user.email,
          role: user.role || 'admin'
        },
        cities: selectedCities // Add selected cities to post data
      };
      
      // Create post for each selected city
      const results = [];
      for (const cityId of selectedCities) {
        let result;
        const cityPostData = { ...postData, cityId };
        
        switch (postType) {
          case POST_TYPES.STORY:
            result = await createStory(cityPostData, user.uid, cityId);
            break;
          case POST_TYPES.REEL:
            result = await createReel(cityPostData, user.uid, cityId);
            break;
          case POST_TYPES.CAROUSEL:
            result = await createCarousel(cityPostData, user.uid, cityId);
            break;
          default:
            // Standard post - you'll need to implement this in your existing schema
            result = { success: true, id: 'temp_id', cityId };
            break;
        }
        
        results.push({ cityId, ...result });
      }
      
      const successfulPublishes = results.filter(r => r.success);
      const cityNames = cities.filter(c => successfulPublishes.some(r => r.cityId === c.id)).map(c => c.name).join(', ');
      
      if (successfulPublishes.length > 0) {
        onSuccess?.(results);
        alert(`${postTypeConfig[postType].title} created successfully for: ${cityNames}!`);
        onClose?.();
      } else {
        throw new Error('Failed to publish to any cities');
      }
      
    } catch (error) {
      console.error('Error saving post:', error);
      alert(`Error creating ${postTypeConfig[postType].title}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Remove media file
  const removeMediaFile = (id) => {
    setMediaFiles(prev => {
      const updated = prev.filter(item => item.id !== id);
      // Cleanup blob URL
      const item = prev.find(item => item.id === id);
      if (item?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return updated;
    });
  };

  // Move media file order
  const moveMediaFile = (id, direction) => {
    setMediaFiles(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  // Update media caption
  const updateMediaCaption = (id, language, caption) => {
    setMediaFiles(prev => prev.map(item => 
      item.id === id 
        ? { ...item, caption: { ...item.caption, [language]: caption } }
        : item
    ));
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      mediaFiles.forEach(item => {
        if (item?.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
        if (item?.thumbnailUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(item.thumbnailUrl);
        }
      });
    };
  }, [mediaFiles]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Media Post
            </h2>
            <div className="flex space-x-2">
              {Object.entries(postTypeConfig).map(([type, config]) => {
                const IconComponent = config.icon;
                return (
                  <button
                    key={type}
                    onClick={() => handlePostTypeChange(type)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      postType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="text-sm font-medium">{config.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setPreview(!preview)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            
            <button
              onClick={handleSave}
              disabled={loading || mediaFiles.length === 0}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Saving...' : 'Save'}</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left Panel - Form */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
            
            {/* City Multi-Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Select Cities (Multi-select)
              </label>
              <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {cities.map(city => (
                  <label key={city.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCities.includes(city.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCities([...selectedCities, city.id]);
                        } else {
                          setSelectedCities(selectedCities.filter(id => id !== city.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{city.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Selected: {selectedCities.length > 0 ? cities.filter(c => selectedCities.includes(c.id)).map(c => c.name).join(', ') : 'None'}
              </p>
            </div>
            
            {/* Post Type Description */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2 mb-2">
                {React.createElement(postTypeConfig[postType].icon, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" })}
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  {postTypeConfig[postType].title}
                </h3>
              </div>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                {postTypeConfig[postType].description}
              </p>
            </div>

            {/* Media Upload Area */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Media Content
              </label>
              
              {mediaFiles.length === 0 ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Drop files here or click to upload
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {postTypeConfig[postType].videoOnly 
                      ? 'Upload video files (MP4, WebM, MOV)'
                      : 'Upload images and videos (JPG, PNG, MP4, WebM)'
                    }
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Maximum {postTypeConfig[postType].maxFiles} files
                  </p>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Image className="w-4 h-4" />
                      <span>Choose Images</span>
                    </button>
                    
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Video className="w-4 h-4" />
                      <span>Choose Videos</span>
                    </button>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple={postType !== POST_TYPES.REEL}
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                  
                  <input
                    ref={videoInputRef}
                    type="file"
                    multiple={postType !== POST_TYPES.REEL}
                    accept="video/*"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                </div>
              ) : (
                // Media Files List
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Media Files ({mediaFiles.length})
                    </h4>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add More</span>
                    </button>
                  </div>
                  
                  {mediaFiles.map((media, index) => (
                    <div key={media.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0 w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                          {media.type === 'image' ? (
                            <img
                              src={media.previewUrl}
                              alt={media.filename}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {media.thumbnailUrl ? (
                                <img
                                  src={media.thumbnailUrl}
                                  alt={media.filename}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Video className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Media Info */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900 dark:text-white">
                              {media.filename}
                            </h5>
                            <div className="flex items-center space-x-2">
                              {index > 0 && (
                                <button
                                  onClick={() => moveMediaFile(media.id, 'up')}
                                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                              )}
                              {index < mediaFiles.length - 1 && (
                                <button
                                  onClick={() => moveMediaFile(media.id, 'down')}
                                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={() => removeMediaFile(media.id)}
                                className="p-1 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {media.dimensions.width}×{media.dimensions.height} • {formatFileSize(media.size)}
                          </div>
                          
                          {/* Upload Progress */}
                          {uploadProgress[media.id] !== undefined && (
                            <div className="mb-2">
                              {uploadProgress[media.id] === -1 ? (
                                <div className="text-red-600 dark:text-red-400 text-sm">
                                  Upload failed: {media.uploadError}
                                </div>
                              ) : uploadProgress[media.id] === 100 ? (
                                <div className="text-green-600 dark:text-green-400 text-sm">
                                  ✓ Uploaded successfully
                                </div>
                              ) : (
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress[media.id]}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Caption Input */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Caption ({activeLanguage.toUpperCase()})
                            </label>
                            <input
                              type="text"
                              value={media.caption[activeLanguage] || ''}
                              onChange={(e) => updateMediaCaption(media.id, activeLanguage, e.target.value)}
                              placeholder="Add a caption for this media..."
                              className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Language Tabs */}
            <div className="mb-6">
              <div className="flex space-x-2 mb-4">
                {Object.entries(languageLabels).map(([lang, label]) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLanguage(lang)}
                    className={`px-3 py-2 text-sm rounded ${
                      activeLanguage === lang
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title ({languageLabels[activeLanguage]})
                {activeLanguage === 'gu' && <span className="text-red-500 ml-1">* જરૂરી</span>}
              </label>
              <input
                type="text"
                value={formData.title[activeLanguage] || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  title: { ...prev.title, [activeLanguage]: e.target.value }
                }))}
                placeholder={`Enter title in ${languageLabels[activeLanguage]}...`}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Content Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content ({languageLabels[activeLanguage]})
                {activeLanguage === 'gu' && <span className="text-red-500 ml-1">* જરૂરી</span>}
              </label>
              <textarea
                value={formData.content[activeLanguage] || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  content: { ...prev.content, [activeLanguage]: e.target.value }
                }))}
                placeholder={`Write your content in ${languageLabels[activeLanguage]}...`}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              />
            </div>

            {/* Auto-Translation Controls - Show when on Gujarati tab */}
            {activeLanguage === 'gu' && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center mb-3">
                  <Languages className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-gujarati">
                    <strong>🌐 Auto-Translate:</strong> Write in Gujarati, click buttons below to translate to Hindi & English
                    <br />
                    <span className="text-xs">ગુજરાતીમાં લખો, હિન્દી અને અંગ્રેજીમાં અનુવાદ કરવા બટન ક્લિક કરો</span>
                  </p>
                </div>
                
                {/* Translation Buttons */}
                <div className="border-t border-blue-200 dark:border-blue-800 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Translation Buttons | અનુવાદ બટનો:</p>
                    {translating && <div className="text-xs text-blue-500">🔄 Translating... | અનુવાદ થઈ રહ્યો છે...</div>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={handleTranslateTitle}
                      disabled={translating || !formData.title.gu.trim()}
                      className="flex items-center justify-center space-x-1 px-3 py-2 text-xs bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 text-blue-700 dark:text-blue-200 rounded-md transition-colors"
                      title="Translate Gujarati title to Hindi & English"
                    >
                      <RefreshCw className={`h-3 w-3 ${translating ? 'animate-spin' : ''}`} />
                      <span>Title | શીર્ષક</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTranslateContent}
                      disabled={translating || !formData.content.gu.trim()}
                      className="flex items-center justify-center space-x-1 px-3 py-2 text-xs bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 text-blue-700 dark:text-blue-200 rounded-md transition-colors"
                      title="Translate Gujarati content to Hindi & English"
                    >
                      <RefreshCw className={`h-3 w-3 ${translating ? 'animate-spin' : ''}`} />
                      <span>Content | સામગ્રી</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTranslateAll}
                      disabled={translating || (!formData.title.gu.trim() && !formData.content.gu.trim())}
                      className="flex items-center justify-center space-x-1 px-3 py-2 text-xs bg-green-100 dark:bg-green-800 hover:bg-green-200 dark:hover:bg-green-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 text-green-700 dark:text-green-200 rounded-md transition-colors font-medium"
                      title="Translate all Gujarati content at once"
                    >
                      <Languages className={`h-3 w-3 ${translating ? 'animate-spin' : ''}`} />
                      <span>All | બધું</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Post Type Specific Settings */}
            {postType === POST_TYPES.STORY && (
              <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-4 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Story Settings
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                      Duration (seconds)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="30"
                      value={formData.storySettings.duration}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        storySettings: { ...prev.storySettings, duration: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                      Background Color
                    </label>
                    <input
                      type="color"
                      value={formData.storySettings.backgroundColor}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        storySettings: { ...prev.storySettings, backgroundColor: e.target.value }
                      }))}
                      className="w-full h-10 border border-purple-300 dark:border-purple-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {postType === POST_TYPES.REEL && (
              <div className="mb-6 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                <h3 className="font-semibold text-pink-900 dark:text-pink-100 mb-4 flex items-center">
                  <Film className="w-4 h-4 mr-2" />
                  Reel Settings
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-pink-700 dark:text-pink-300 mb-2">
                      Playback Speed
                    </label>
                    <select
                      value={formData.reelSettings.speed}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        reelSettings: { ...prev.reelSettings, speed: parseFloat(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-pink-300 dark:border-pink-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={1}>1x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2}>2x</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-pink-700 dark:text-pink-300 mb-2">
                      Music URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.reelSettings.musicUrl}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        reelSettings: { ...prev.reelSettings, musicUrl: e.target.value }
                      }))}
                      placeholder="https://example.com/music.mp3"
                      className="w-full px-3 py-2 border border-pink-300 dark:border-pink-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Category Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                <option value="local">Local News</option>
                <option value="breaking">Breaking News</option>
                <option value="sports">Sports</option>
                <option value="business">Business</option>
                <option value="entertainment">Entertainment</option>
                <option value="politics">Politics</option>
                <option value="technology">Technology</option>
                <option value="culture">Culture</option>
              </select>
            </div>

            {/* Flags */}
            <div className="mb-6 space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Post Flags
              </label>
              
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isBreaking}
                    onChange={(e) => setFormData(prev => ({ ...prev, isBreaking: e.target.checked }))}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Breaking News</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Featured Post</span>
                </label>
              </div>
            </div>

            </div>
          </div>

          {/* Right Panel - Preview */}
          {preview && (
            <div className="w-1/2 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
              <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Preview
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="space-y-4">
                  {/* Title */}
                  {formData.title[activeLanguage] && (
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                      {formData.title[activeLanguage]}
                    </h4>
                  )}
                  
                  {/* Media Preview */}
                  {mediaFiles.length > 0 && (
                    <div className="space-y-2">
                      {postType === POST_TYPES.CAROUSEL ? (
                        <div className="grid grid-cols-2 gap-2">
                          {mediaFiles.slice(0, 4).map((media, index) => (
                            <div key={media.id} className="relative aspect-video bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                              {media.type === 'image' ? (
                                <img
                                  src={media.previewUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Play className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                              {index === 3 && mediaFiles.length > 4 && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                  <span className="text-white font-semibold">
                                    +{mediaFiles.length - 4}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                          {mediaFiles[0]?.type === 'image' ? (
                            <img
                              src={mediaFiles[0].previewUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Content */}
                  {formData.content[activeLanguage] && (
                    <p className="text-gray-700 dark:text-gray-300">
                      {formData.content[activeLanguage]}
                    </p>
                  )}
                  
                  {/* Category */}
                  {formData.category && (
                    <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                      {formData.category}
                    </span>
                  )}
                </div>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPostCreator;