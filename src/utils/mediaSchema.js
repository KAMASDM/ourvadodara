// =============================================
// src/utils/mediaSchema.js
// Comprehensive Media Schema for Our Vadodara News Platform
// =============================================

import { ref, push, set, get, update, remove } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase-config';

// =============================================
// MEDIA TYPE DEFINITIONS
// =============================================

export const MEDIA_TYPES = {
  SINGLE_IMAGE: 'single_image',
  CAROUSEL: 'carousel',
  VIDEO: 'video',
  REEL: 'reel',
  STORY: 'story',
  MIXED_MEDIA: 'mixed_media'
};

export const POST_TYPES = {
  STANDARD: 'standard',
  STORY: 'story',
  REEL: 'reel',
  CAROUSEL: 'carousel',
  VIDEO: 'video',
  LIVE_UPDATE: 'live_update'
};

// =============================================
// ENHANCED POST SCHEMA WITH MEDIA SUPPORT
// =============================================

export const enhancedPostSchema = {
  id: '',
  type: POST_TYPES.STANDARD, // standard, story, reel, carousel, video
  title: { en: '', hi: '', gu: '' },
  content: { en: '', hi: '', gu: '' },
  excerpt: { en: '', hi: '', gu: '' },
  
  // Enhanced Media Structure
  mediaContent: {
    type: MEDIA_TYPES.SINGLE_IMAGE,
    primaryMedia: null, // Main media for thumbnails
    items: [], // Array of media items
    settings: {
      autoplay: false,
      showCaptions: true,
      allowDownload: false,
      duration: 0, // For stories/reels
      aspectRatio: '16:9' // 16:9, 9:16, 1:1, 4:3
    }
  },
  
  // Story/Reel specific
  storySettings: {
    duration: 15, // seconds
    isHighlight: false,
    expiresAt: null,
    backgroundColor: '#000000',
    textColor: '#ffffff',
    musicUrl: null,
    effects: []
  },
  
  // Standard post fields
  category: '',
  subcategory: '',
  tags: [],
  location: {
    address: '',
    coordinates: { lat: 0, lng: 0 },
    city: 'Vadodara'
  },
  
  // Publishing settings
  isBreaking: false,
  isUrgent: false,
  isFeatured: false,
  isPublished: false,
  publishedAt: null,
  scheduledAt: null,
  expiresAt: null,
  
  // Analytics
  analytics: {
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    watchTime: 0, // For videos/reels
    engagementRate: 0
  },
  
  // Metadata
  author: {
    uid: '',
    name: '',
    role: '',
    avatar: ''
  },
  createdAt: '',
  updatedAt: ''
};

// =============================================
// MEDIA ITEM SCHEMA
// =============================================

export const mediaItemSchema = {
  id: '',
  type: '', // image, video, audio
  url: '',
  thumbnailUrl: '', // For videos
  filename: '',
  size: 0,
  dimensions: { width: 0, height: 0 },
  duration: 0, // For videos/audio
  caption: { en: '', hi: '', gu: '' },
  altText: { en: '', hi: '', gu: '' },
  metadata: {
    format: '',
    quality: '',
    compression: '',
    uploadedAt: '',
    storageRef: ''
  }
};

// =============================================
// STORY SCHEMA
// =============================================

export const storySchema = {
  id: '',
  type: POST_TYPES.STORY,
  title: { en: '', hi: '', gu: '' },
  
  mediaContent: {
    type: MEDIA_TYPES.STORY,
    items: [], // Array of media items
    settings: {
      duration: 15,
      autoAdvance: true,
      showProgress: true,
      allowReplay: true
    }
  },
  
  storySettings: {
    backgroundColor: '#000000',
    textColor: '#ffffff',
    textPosition: 'bottom', // top, center, bottom
    hasMusic: false,
    musicUrl: '',
    effects: [],
    isHighlight: false,
    highlightCategory: ''
  },
  
  visibility: {
    isPublic: true,
    allowedUsers: [],
    excludedUsers: []
  },
  
  interactions: {
    allowComments: true,
    allowReactions: true,
    allowSharing: true,
    viewers: []
  },
  
  // Auto-expiry for stories (24 hours default)
  expiresAt: '',
  isActive: true,
  
  // Standard fields
  category: '',
  tags: [],
  location: '',
  author: {
    uid: '',
    name: '',
    avatar: ''
  },
  createdAt: '',
  
  analytics: {
    views: 0,
    uniqueViews: 0,
    completionRate: 0,
    shares: 0,
    reactions: {},
    averageWatchTime: 0
  }
};

// =============================================
// REEL SCHEMA
// =============================================

export const reelSchema = {
  id: '',
  type: POST_TYPES.REEL,
  title: { en: '', hi: '', gu: '' },
  description: { en: '', hi: '', gu: '' },
  
  mediaContent: {
    type: MEDIA_TYPES.REEL,
    videoUrl: '',
    thumbnailUrl: '',
    duration: 0,
    aspectRatio: '9:16',
    settings: {
      autoplay: true,
      loop: true,
      muted: false,
      showControls: false
    }
  },
  
  reelSettings: {
    musicUrl: '',
    musicTitle: '',
    musicArtist: '',
    effects: [],
    filters: [],
    speed: 1, // 0.5x, 1x, 1.5x, 2x
    captions: []
  },
  
  hashtags: [],
  mentions: [],
  category: '',
  location: '',
  
  interactions: {
    allowComments: true,
    allowDuet: true,
    allowStitch: true,
    allowDownload: false
  },
  
  author: {
    uid: '',
    name: '',
    username: '',
    avatar: '',
    verified: false
  },
  
  isPublished: true,
  publishedAt: '',
  createdAt: '',
  
  analytics: {
    views: 0,
    uniqueViews: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    watchTime: 0,
    completionRate: 0,
    engagementRate: 0
  }
};

// =============================================
// CAROUSEL SCHEMA
// =============================================

export const carouselSchema = {
  id: '',
  type: POST_TYPES.CAROUSEL,
  title: { en: '', hi: '', gu: '' },
  description: { en: '', hi: '', gu: '' },
  
  mediaContent: {
    type: MEDIA_TYPES.CAROUSEL,
    items: [], // Array of media items (images/videos)
    settings: {
      autoplay: false,
      autoplaySpeed: 3000,
      showDots: true,
      showArrows: true,
      infinite: true,
      slidesToShow: 1,
      aspectRatio: '16:9'
    }
  },
  
  // Standard post fields
  category: '',
  subcategory: '',
  tags: [],
  location: '',
  
  isBreaking: false,
  isFeatured: false,
  isPublished: true,
  publishedAt: '',
  
  author: {
    uid: '',
    name: '',
    avatar: ''
  },
  
  createdAt: '',
  updatedAt: '',
  
  analytics: {
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    slideViews: [], // Views per slide
    averageTimePerSlide: 0
  }
};

// =============================================
// DATABASE PATHS
// =============================================

export const MEDIA_DATABASE_PATHS = {
  POSTS: 'posts',
  STORIES: 'stories',
  REELS: 'reels',
  CAROUSELS: 'carousels',
  MEDIA_LIBRARY: 'mediaLibrary',
  STORY_HIGHLIGHTS: 'storyHighlights',
  USER_STORIES: 'userStories'
};

// =============================================
// MEDIA UPLOAD FUNCTIONS
// =============================================

export const uploadMediaFile = async (file, folder = 'media', userId) => {
  try {
    const timestamp = Date.now();
    const filename = `${folder}/${userId}/${timestamp}_${file.name}`;
    const mediaRef = storageRef(storage, filename);
    
    // Upload file
    const snapshot = await uploadBytes(mediaRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Create media item record
    const mediaItem = {
      id: `${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
      url: downloadURL,
      filename: file.name,
      size: file.size,
      metadata: {
        format: file.type,
        uploadedAt: new Date().toISOString(),
        storageRef: filename,
        uploader: userId
      }
    };
    
    // If it's a video, generate thumbnail
    if (file.type.startsWith('video/')) {
      mediaItem.thumbnailUrl = await generateVideoThumbnail(file);
    }
    
    return { success: true, mediaItem };
  } catch (error) {
    console.error('Error uploading media:', error);
    return { success: false, error: error.message };
  }
};

export const uploadMultipleMedia = async (files, folder = 'media', userId) => {
  const uploadPromises = files.map(file => uploadMediaFile(file, folder, userId));
  const results = await Promise.allSettled(uploadPromises);
  
  const successful = results
    .filter(result => result.status === 'fulfilled' && result.value.success)
    .map(result => result.value.mediaItem);
    
  const failed = results
    .filter(result => result.status === 'rejected' || !result.value.success)
    .length;
    
  return { successful, failed, total: files.length };
};

// =============================================
// VIDEO THUMBNAIL GENERATION
// =============================================

export const generateVideoThumbnail = (videoFile) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      video.currentTime = 1; // Capture at 1 second
    });
    
    video.addEventListener('seeked', () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      resolve(thumbnailDataUrl);
    });
    
    video.src = URL.createObjectURL(videoFile);
  });
};

// =============================================
// STORY MANAGEMENT FUNCTIONS
// =============================================

export const createStory = async (storyData, userId) => {
  try {
    const storiesRef = ref(db, MEDIA_DATABASE_PATHS.STORIES);
    const newStoryRef = push(storiesRef);
    
    const story = {
      ...storySchema,
      ...storyData,
      id: newStoryRef.key,
      author: {
        uid: userId,
        ...storyData.author
      },
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    await set(newStoryRef, story);
    return { success: true, id: newStoryRef.key, story };
  } catch (error) {
    console.error('Error creating story:', error);
    return { success: false, error: error.message };
  }
};

export const createReel = async (reelData, userId) => {
  try {
    const reelsRef = ref(db, MEDIA_DATABASE_PATHS.REELS);
    const newReelRef = push(reelsRef);
    
    const reel = {
      ...reelSchema,
      ...reelData,
      id: newReelRef.key,
      author: {
        uid: userId,
        ...reelData.author
      },
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    await set(newReelRef, reel);
    return { success: true, id: newReelRef.key, reel };
  } catch (error) {
    console.error('Error creating reel:', error);
    return { success: false, error: error.message };
  }
};

export const createCarousel = async (carouselData, userId) => {
  try {
    const carouselsRef = ref(db, MEDIA_DATABASE_PATHS.CAROUSELS);
    const newCarouselRef = push(carouselsRef);
    
    const carousel = {
      ...carouselSchema,
      ...carouselData,
      id: newCarouselRef.key,
      author: {
        uid: userId,
        ...carouselData.author
      },
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await set(newCarouselRef, carousel);
    return { success: true, id: newCarouselRef.key, carousel };
  } catch (error) {
    console.error('Error creating carousel:', error);
    return { success: false, error: error.message };
  }
};

// =============================================
// STORY HIGHLIGHTS MANAGEMENT
// =============================================

export const createStoryHighlight = async (highlightData, userId) => {
  try {
    const highlightsRef = ref(db, `${MEDIA_DATABASE_PATHS.STORY_HIGHLIGHTS}/${userId}`);
    const newHighlightRef = push(highlightsRef);
    
    const highlight = {
      id: newHighlightRef.key,
      title: highlightData.title,
      coverImage: highlightData.coverImage,
      stories: highlightData.stories || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await set(newHighlightRef, highlight);
    return { success: true, id: newHighlightRef.key };
  } catch (error) {
    console.error('Error creating story highlight:', error);
    return { success: false, error: error.message };
  }
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

export const getMediaDimensions = (file) => {
  return new Promise((resolve) => {
    if (file.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve({ width: video.videoWidth, height: video.videoHeight });
      };
      video.src = URL.createObjectURL(file);
    } else {
      resolve({ width: 0, height: 0 });
    }
  });
};

export const calculateAspectRatio = (width, height) => {
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};