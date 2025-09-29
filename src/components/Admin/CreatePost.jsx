// =============================================
// src/components/Admin/CreatePost.jsx
// Desktop-Optimized Post Creation Interface
// =============================================
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { ref, push, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase-config';
import { 
  Save, 
  Eye, 
  Image, 
  Video, 
  Link, 
  Calendar, 
  Tag, 
  MapPin, 
  Clock,
  Send,
  X,
  Plus,
  AlertCircle,
  Languages,
  FileText,
  RefreshCw
} from 'lucide-react';
import { categoryData, categories } from '../../data/categories';
import axios from 'axios';

const CreatePost = () => {
  const { user } = useAuth();
  
  // Language labels for the multi-language interface
  const languageLabels = {
    en: 'English',
    hi: 'हिंदी',
    gu: 'ગુજરાતી'
  };
  
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
    isFeatured: false,
    publishDate: '',
    scheduledTime: ''
  });
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [preview, setPreview] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});
  const [activeLanguage, setActiveLanguage] = useState('en');
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const multipleImageInputRef = useRef(null);

  // Debug Firebase configuration on component mount
  useEffect(() => {
    console.log('Firebase Storage Configuration:');
    console.log('Storage instance:', storage);
    console.log('Storage bucket:', storage?.app?.options?.storageBucket);
    console.log('User authenticated:', !!user);
    console.log('User UID:', user?.uid);
  }, [user]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      mediaFiles.forEach(media => {
        if (media.previewUrl && media.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(media.previewUrl);
        }
      });
    };
  }, []);

  // Translation function using MyMemory Translation API (free)
  const translateText = async (text, targetLang) => {
    if (!text.trim()) return '';
    
    try {
      const langMap = {
        hi: 'hi',
        gu: 'gu'
      };
      
      console.log(`Translating "${text}" to ${targetLang}`);
      
      const response = await axios.get(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${langMap[targetLang]}`,
        {
          timeout: 10000, // 10 second timeout
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
      // Enhanced fallback with better basic translations
      const basicTranslations = {
        hi: text
          .replace(/news/gi, 'समाचार')
          .replace(/city/gi, 'शहर')
          .replace(/today/gi, 'आज')
          .replace(/breaking/gi, 'तत्काल')
          .replace(/update/gi, 'अपडेट'),
        gu: text
          .replace(/news/gi, 'સમાચાર')
          .replace(/city/gi, 'શહેર')
          .replace(/today/gi, 'આજે')
          .replace(/breaking/gi, 'તાત્કાલિક')
          .replace(/update/gi, 'અપડેટ')
      };
      return basicTranslations[targetLang] || text;
    }
  };

  // Handle content change immediately (synchronous)
  const handleContentChange = (field, value, lang = 'en') => {
    const updatedContent = { ...formData[field], [lang]: value };
    setFormData(prev => ({ ...prev, [field]: updatedContent }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Manual translation functions for forcing re-translation
  const handleForceTranslateTitle = async () => {
    const englishTitle = formData.title.en.trim();
    if (!englishTitle || englishTitle.length < 3) {
      alert('Please enter an English title first (minimum 3 characters).');
      return;
    }

    try {
      setTranslating(true);
      console.log('Force translating title:', englishTitle);
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
      console.log('Title translations completed:', { hi: hiTranslation, gu: guTranslation });
    } catch (error) {
      console.error('Force title translation failed:', error);
      alert('Translation failed. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  const handleForceTranslateExcerpt = async () => {
    const englishExcerpt = formData.excerpt.en.trim();
    if (!englishExcerpt || englishExcerpt.length < 3) {
      alert('Please enter an English excerpt first (minimum 3 characters).');
      return;
    }

    try {
      setTranslating(true);
      console.log('Force translating excerpt:', englishExcerpt);
      const [hiTranslation, guTranslation] = await Promise.all([
        translateText(englishExcerpt, 'hi'),
        translateText(englishExcerpt, 'gu')
      ]);
      
      setFormData(prev => ({
        ...prev,
        excerpt: { 
          ...prev.excerpt, 
          hi: hiTranslation, 
          gu: guTranslation 
        }
      }));
      console.log('Excerpt translations completed:', { hi: hiTranslation, gu: guTranslation });
    } catch (error) {
      console.error('Force excerpt translation failed:', error);
      alert('Translation failed. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  const handleForceTranslateContent = async () => {
    const englishContent = formData.content.en.trim();
    if (!englishContent || englishContent.length < 10) {
      alert('Please enter English content first (minimum 10 characters).');
      return;
    }

    try {
      setTranslating(true);
      console.log('Force translating content:', englishContent.substring(0, 50) + '...');
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
      console.log('Content translations completed');
    } catch (error) {
      console.error('Force content translation failed:', error);
      alert('Translation failed. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  const handleTranslateAll = async () => {
    const englishTitle = formData.title.en.trim();
    const englishExcerpt = formData.excerpt.en.trim();
    const englishContent = formData.content.en.trim();
    
    if (!englishTitle && !englishExcerpt && !englishContent) {
      alert('Please enter some English content first.');
      return;
    }

    try {
      setTranslating(true);
      console.log('Translating all content...');
      
      const translationPromises = [];
      
      if (englishTitle && englishTitle.length > 3) {
        translationPromises.push(
          Promise.all([
            translateText(englishTitle, 'hi'),
            translateText(englishTitle, 'gu')
          ]).then(([hi, gu]) => ({ type: 'title', hi, gu }))
        );
      }
      
      if (englishExcerpt && englishExcerpt.length > 3) {
        translationPromises.push(
          Promise.all([
            translateText(englishExcerpt, 'hi'),
            translateText(englishExcerpt, 'gu')
          ]).then(([hi, gu]) => ({ type: 'excerpt', hi, gu }))
        );
      }
      
      if (englishContent && englishContent.length > 10) {
        translationPromises.push(
          Promise.all([
            translateText(englishContent, 'hi'),
            translateText(englishContent, 'gu')
          ]).then(([hi, gu]) => ({ type: 'content', hi, gu }))
        );
      }

      const results = await Promise.all(translationPromises);
      
      setFormData(prev => {
        const newData = { ...prev };
        results.forEach(result => {
          newData[result.type] = {
            ...prev[result.type],
            hi: result.hi,
            gu: result.gu
          };
        });
        return newData;
      });
      
      console.log('All translations completed:', results);
      alert('All content translated successfully!');
    } catch (error) {
      console.error('Batch translation failed:', error);
      alert('Translation failed. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  // Debounced translation effect
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      const englishTitle = formData.title.en.trim();
      const englishExcerpt = formData.excerpt.en.trim();
      const englishContent = formData.content.en.trim();
      
      if (englishTitle && englishTitle.length > 3 && (!formData.title.hi.trim() || !formData.title.gu.trim())) {
        try {
          setTranslating(true);
          console.log('Translating title:', englishTitle);
          const [hiTranslation, guTranslation] = await Promise.all([
            translateText(englishTitle, 'hi'),
            translateText(englishTitle, 'gu')
          ]);
          
          setFormData(prev => ({
            ...prev,
            title: { 
              ...prev.title, 
              hi: prev.title.hi.trim() || hiTranslation, 
              gu: prev.title.gu.trim() || guTranslation 
            }
          }));
        } catch (error) {
          console.error('Title translation failed:', error);
        }
      }
      
      if (englishExcerpt && englishExcerpt.length > 3 && (!formData.excerpt.hi.trim() || !formData.excerpt.gu.trim())) {
        try {
          console.log('Translating excerpt:', englishExcerpt);
          const [hiTranslation, guTranslation] = await Promise.all([
            translateText(englishExcerpt, 'hi'),
            translateText(englishExcerpt, 'gu')
          ]);
          
          setFormData(prev => ({
            ...prev,
            excerpt: { 
              ...prev.excerpt, 
              hi: prev.excerpt.hi.trim() || hiTranslation, 
              gu: prev.excerpt.gu.trim() || guTranslation 
            }
          }));
        } catch (error) {
          console.error('Excerpt translation failed:', error);
        }
      }
      
      if (englishContent && englishContent.length > 10 && (!formData.content.hi.trim() || !formData.content.gu.trim())) {
        try {
          console.log('Translating content:', englishContent.substring(0, 50) + '...');
          const [hiTranslation, guTranslation] = await Promise.all([
            translateText(englishContent, 'hi'),
            translateText(englishContent, 'gu')
          ]);
          
          setFormData(prev => ({
            ...prev,
            content: { 
              ...prev.content, 
              hi: prev.content.hi.trim() || hiTranslation, 
              gu: prev.content.gu.trim() || guTranslation 
            }
          }));
        } catch (error) {
          console.error('Content translation failed:', error);
        }
      }
      
      setTranslating(false);
    }, 2000); // 2 second debounce for better UX
    
    return () => clearTimeout(timeoutId);
  }, [formData.title.en, formData.excerpt.en, formData.content.en]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleMediaUpload = async (file, type = 'image') => {
    try {
      // Validate file before upload
      if (!file) {
        throw new Error('No file provided');
      }
      
      // Clean filename to avoid issues
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const timestamp = Date.now();
      const filePath = `posts/${type}s/${timestamp}_${cleanFileName}`;
      
      console.log(`Uploading ${type} to:`, filePath);
      
      // Create storage reference
      const fileRef = storageRef(storage, filePath);
      
      // Set metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'uploadedBy': user?.uid || 'anonymous',
          'originalName': file.name,
          'uploadTime': new Date().toISOString()
        }
      };
      
      // Upload file with metadata
      console.log('Starting upload...');
      const snapshot = await uploadBytes(fileRef, file, metadata);
      console.log('Upload completed, getting download URL...');
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);
      
      return {
        url: downloadURL,
        type: type,
        name: file.name,
        size: file.size,
        path: filePath
      };
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      
      // Handle specific error types
      if (error.code === 'storage/unauthorized') {
        throw new Error('Upload failed: Please sign in to upload files');
      } else if (error.code === 'storage/canceled') {
        throw new Error('Upload was cancelled');
      } else if (error.code === 'storage/unknown') {
        throw new Error('Upload failed: Please check your internet connection');
      } else {
        throw new Error(`Upload failed: ${error.message}`);
      }
    }
  };

  const handleMultipleMediaSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadProgress({});
    const newMediaItems = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.type.startsWith('image/') ? 'image' : 
                      file.type.startsWith('video/') ? 'video' : 'file';
      
      // Validate file size (10MB for images, 100MB for videos)
      const maxSize = fileType === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, media: `${file.name} is too large. Max size: ${fileType === 'video' ? '100MB' : '10MB'}` }));
        continue;
      }

      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        // Create preview for immediate display
        const previewUrl = URL.createObjectURL(file);
        console.log(`Created preview URL for ${file.name}:`, previewUrl);
        
        const mediaItem = {
          file,
          previewUrl,
          type: fileType,
          name: file.name,
          size: file.size,
          uploading: true
        };
        
        newMediaItems.push(mediaItem);
        console.log(`Added media item:`, mediaItem);
        setUploadProgress(prev => ({ ...prev, [file.name]: 50 }));
        
        // Upload to Firebase
        const uploadResult = await handleMediaUpload(file, fileType);
        mediaItem.url = uploadResult.url;
        mediaItem.path = uploadResult.path;
        mediaItem.uploading = false;
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        console.log(`Successfully uploaded: ${file.name}`);
        
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        
        // Remove failed upload from media items
        const itemIndex = newMediaItems.findIndex(item => item.name === file.name);
        if (itemIndex > -1) {
          newMediaItems.splice(itemIndex, 1);
        }
        
        // Show user-friendly error message with specific CORS guidance
        let errorMessage = error.message || `Failed to upload ${file.name}`;
        
        if (error.message && error.message.includes('CORS')) {
          errorMessage = `CORS Error: Please check Firebase Storage rules. ${file.name} could not be uploaded due to cross-origin restrictions.`;
        } else if (error.code === 'storage/unauthorized') {
          errorMessage = `Authentication Error: Please sign in with Google to upload files.`;
        }
        
        setErrors(prev => ({ ...prev, media: errorMessage }));
        
        // Remove progress indicator for failed upload
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }
    }

    // Update mediaFiles state for preview (only successful uploads)
    const successfulUploads = newMediaItems.filter(item => !item.uploading && item.url);
    setMediaFiles(prev => [...prev, ...successfulUploads]);
    
    // Update formData with media information (only successful uploads)
    if (successfulUploads.length > 0) {
      setFormData(prev => ({ 
        ...prev, 
        media: [...prev.media, ...successfulUploads.map(item => ({
          url: item.url,
          type: item.type,
          name: item.name,
          size: item.size,
          path: item.path,
          previewUrl: item.previewUrl
        }))]
      }));
    }
    
    // Clear the input
    if (e.target) {
      e.target.value = '';
    }
    
    // Clear any previous errors if uploads were successful
    if (successfulUploads.length > 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.media;
        return newErrors;
      });
    }
  };

  const removeMediaItem = (index) => {
    // Clean up object URL to prevent memory leaks
    const mediaItem = mediaFiles[index];
    if (mediaItem && mediaItem.previewUrl && mediaItem.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaItem.previewUrl);
    }
    
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({ 
      ...prev, 
      media: prev.media.filter((_, i) => i !== index)
    }));
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

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const postData = {
        ...formData,
        status: 'draft',
        authorId: user.uid,
        authorName: user.displayName || user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const postsRef = ref(db, 'posts');
      await push(postsRef, postData);

      alert('Draft saved successfully!');
      // Reset form
      setFormData({
        title: { en: '', hi: '', gu: '' },
        content: { en: '', hi: '', gu: '' },
        excerpt: { en: '', hi: '', gu: '' },
        category: '', subcategory: '', tags: [], location: '', media: [],
        externalLink: '', isBreaking: false, isUrgent: false, isFeatured: false,
        publishDate: '', scheduledTime: ''
      });
      setMediaFiles([]);
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Error saving draft. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const postData = {
        ...formData,
        status: 'published',
        authorId: user.uid,
        authorName: user.displayName || user.email,
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 0,
        likes: 0,
        comments: 0
      };

      const postsRef = ref(db, 'posts');
      await push(postsRef, postData);

      alert('Post published successfully!');
      // Reset form
      setFormData({
        title: { en: '', hi: '', gu: '' },
        content: { en: '', hi: '', gu: '' },
        excerpt: { en: '', hi: '', gu: '' },
        category: '', subcategory: '', tags: [], location: '', media: [],
        externalLink: '', isBreaking: false, isUrgent: false, isFeatured: false,
        publishDate: '', scheduledTime: ''
      });
      setMediaFiles([]);
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('Error publishing post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.id === formData.category);

  return (
    <div className="w-full">
      <div className="grid grid-cols-12 gap-6">
        {/* Main Content Area */}
        <div className="col-span-8">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Create New Post</h2>
            </div>
            
            <div className="p-6 space-y-6">


              {/* Multiple Media Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Media Files (Images & Videos)
                </label>
                
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
                  <div className="text-center">
                    <div className="flex justify-center space-x-4 mb-4">
                      <Image className="h-12 w-12 text-gray-400" />
                      <Video className="h-12 w-12 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-600 text-sm">Upload multiple images and videos</p>
                      <p className="text-xs text-gray-500">Images: Max 10MB each • Videos: Max 100MB each</p>
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => multipleImageInputRef.current?.click()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Select Files
                      </button>
                      <input
                        ref={multipleImageInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleMultipleMediaSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Media Preview Grid */}
                {(mediaFiles.length > 0 || formData.media.length > 0) && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {mediaFiles.map((media, index) => (
                      <div key={index} className="relative group">
                        <div className="relative rounded-lg overflow-hidden bg-gray-100">
                          {media.type === 'image' ? (
                            <img
                              src={media.previewUrl || media.url}
                              alt={media.name}
                              className="w-full h-32 object-cover"
                              onLoad={() => console.log('Image loaded successfully:', media.name)}
                              onError={(e) => {
                                console.log('Image failed to load:', media.previewUrl || media.url);
                                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" text-anchor="middle" dy=".3em" font-family="system-ui" font-size="12" fill="%236b7280">Image</text></svg>';
                              }}
                            />
                          ) : media.type === 'video' ? (
                            <div className="relative">
                              <video
                                src={media.previewUrl || media.url}
                                className="w-full h-32 object-cover"
                                controls={false}
                                onError={(e) => {
                                  console.log('Video failed to load:', media.previewUrl || media.url);
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                                <Video className="h-8 w-8 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-32 flex flex-col items-center justify-center bg-gray-100">
                              <FileText className="h-8 w-8 text-gray-400 mb-2" />
                              <span className="text-xs text-gray-500 text-center px-2">{media.name}</span>
                            </div>
                          )}
                          
                          {/* Upload Progress */}
                          {media.uploading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <div className="bg-white rounded-full p-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                              </div>
                            </div>
                          )}
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => removeMediaItem(index)}
                            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 truncate">{media.name}</p>
                          <p className="text-xs text-gray-500">
                            {(media.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {errors.media && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
                        <p className="mt-1 text-sm text-red-700">{errors.media}</p>
                        <div className="mt-2 text-xs text-red-600">
                          <p><strong>Troubleshooting tips:</strong></p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Make sure you're signed in to your Google account</li>
                            <li>Check your internet connection</li>
                            <li>Ensure the file is under 10MB for images or 100MB for videos</li>
                            <li>Try refreshing the page and uploading again</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-Language Content */}
              <div className="space-y-6">
                {/* Language Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    {Object.entries(languageLabels).map(([lang, label]) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setActiveLanguage(lang)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeLanguage === lang
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Language Content Forms */}
                <div className="space-y-6">
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder={`Enter title in ${languageLabels[activeLanguage]}`}
                    />
                    {errors.title && activeLanguage === 'en' && (
                      <p className="text-red-500 text-sm mt-2">{errors.title}</p>
                    )}
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Excerpt ({languageLabels[activeLanguage]})
                    </label>
                    <textarea
                      rows={3}
                      value={formData.excerpt[activeLanguage]}
                      onChange={(e) => handleContentChange('excerpt', e.target.value, activeLanguage)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder={`Enter excerpt in ${languageLabels[activeLanguage]}`}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content ({languageLabels[activeLanguage]})
                      {activeLanguage === 'en' && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <textarea
                      rows={10}
                      value={formData.content[activeLanguage]}
                      onChange={(e) => handleContentChange('content', e.target.value, activeLanguage)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder={`Enter content in ${languageLabels[activeLanguage]}`}
                    />
                    {errors.content && activeLanguage === 'en' && (
                      <p className="text-red-500 text-sm mt-2">{errors.content}</p>
                    )}
                  </div>

                  {/* Auto-Translation Status */}
                  {activeLanguage === 'en' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <Languages className="h-5 w-5 text-blue-600 mr-2" />
                        <p className="text-sm text-blue-700">
                          Content will be automatically translated to Hindi and Gujarati when you type in English
                        </p>
                      </div>
                      
                      {/* Manual Translation Controls */}
                      <div className="border-t border-blue-200 pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-blue-600 font-medium">Manual Translation Controls:</p>
                          {translating && <div className="text-xs text-blue-500">Translating...</div>}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <button
                            onClick={handleForceTranslateTitle}
                            disabled={translating || !formData.title.en.trim()}
                            className="flex items-center justify-center space-x-1 px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 text-blue-700 rounded-md transition-colors"
                          >
                            <RefreshCw className={`h-3 w-3 ${translating ? 'animate-spin' : ''}`} />
                            <span>Title</span>
                          </button>
                          <button
                            onClick={handleForceTranslateExcerpt}
                            disabled={translating || !formData.excerpt.en.trim()}
                            className="flex items-center justify-center space-x-1 px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 text-blue-700 rounded-md transition-colors"
                          >
                            <RefreshCw className={`h-3 w-3 ${translating ? 'animate-spin' : ''}`} />
                            <span>Excerpt</span>
                          </button>
                          <button
                            onClick={handleForceTranslateContent}
                            disabled={translating || !formData.content.en.trim()}
                            className="flex items-center justify-center space-x-1 px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 text-blue-700 rounded-md transition-colors"
                          >
                            <RefreshCw className={`h-3 w-3 ${translating ? 'animate-spin' : ''}`} />
                            <span>Content</span>
                          </button>
                          <button
                            onClick={handleTranslateAll}
                            disabled={translating || (!formData.title.en.trim() && !formData.excerpt.en.trim() && !formData.content.en.trim())}
                            className="flex items-center justify-center space-x-1 px-3 py-1.5 text-xs bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 text-green-700 rounded-md transition-colors font-medium"
                          >
                            <Languages className={`h-3 w-3 ${translating ? 'animate-spin' : ''}`} />
                            <span>All</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* External Links */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video URL
                  </label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    External Link
                  </label>
                  <input
                    type="url"
                    value={formData.externalLink}
                    onChange={(e) => handleInputChange('externalLink', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          {/* Post Options */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Post Options</h3>
            
            {/* Category */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            {/* Subcategory */}
            {selectedCategory?.subcategories && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory
                </label>
                <select
                  value={formData.subcategory}
                  onChange={(e) => handleInputChange('subcategory', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select subcategory</option>
                  {selectedCategory.subcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Location */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Vadodara, Gujarat"
              />
            </div>

            {/* Tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add tag..."
                />
                <button
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Post Flags */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isBreaking}
                  onChange={(e) => handleInputChange('isBreaking', e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700">Breaking News</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isUrgent}
                  onChange={(e) => handleInputChange('isUrgent', e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-700">Urgent</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Featured</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setPreview(!preview)}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </button>
              <button
                onClick={handlePublish}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? 'Publishing...' : 'Publish Post'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview</h3>
              <button
                onClick={() => setPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <article className="prose max-w-none">
                <h1>{formData.title.en || 'No Title'}</h1>
                <p className="lead text-gray-600">{formData.excerpt.en || 'No excerpt'}</p>
                
                {/* Media Preview in Modal */}
                {mediaFiles.length > 0 && (
                  <div className="my-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mediaFiles.slice(0, 4).map((media, index) => (
                        <div key={index} className="rounded-lg overflow-hidden">
                          {media.type === 'image' ? (
                            <img 
                              src={media.previewUrl || media.url} 
                              alt={media.name}
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                e.target.src = '/api/placeholder/400/300';
                              }}
                            />
                          ) : media.type === 'video' ? (
                            <video 
                              src={media.previewUrl || media.url}
                              className="w-full h-48 object-cover"
                              controls
                            />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="whitespace-pre-wrap">{formData.content.en || 'No content'}</div>
                
                {/* Show other languages if available */}
                {(formData.title.hi || formData.content.hi) && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">हिंदी (Hindi)</h3>
                    <h2 className="text-xl font-bold mb-2">{formData.title.hi}</h2>
                    {formData.excerpt.hi && <p className="text-gray-600 mb-4">{formData.excerpt.hi}</p>}
                    <div className="whitespace-pre-wrap">{formData.content.hi}</div>
                  </div>
                )}
                
                {(formData.title.gu || formData.content.gu) && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">ગુજરાતી (Gujarati)</h3>
                    <h2 className="text-xl font-bold mb-2">{formData.title.gu}</h2>
                    {formData.excerpt.gu && <p className="text-gray-600 mb-4">{formData.excerpt.gu}</p>}
                    <div className="whitespace-pre-wrap">{formData.content.gu}</div>
                  </div>
                )}
              </article>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePost;