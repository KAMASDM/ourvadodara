// =============================================
// src/utils/databaseSchema.js
// Comprehensive Database Schema for Our Vadodara News Platform
// =============================================

import { ref, set, push, get, update, remove, onValue, off } from 'firebase/database';
import { db } from '../firebase-config';

// =============================================
// DATABASE SCHEMA DEFINITIONS
// =============================================

export const DATABASE_PATHS = {
  // Existing
  POSTS: 'posts',
  USERS: 'users',
  COMMENTS: 'comments',
  
  // New Collections
  EVENTS: 'events',
  POLLS: 'polls',
  BREAKING_NEWS: 'breakingNews',
  TRENDING_STORIES: 'trendingStories',
  AI_PICKS: 'aiPicks',
  LIVE_UPDATES: 'liveUpdates',
  POST_ANALYTICS: 'postAnalytics',
  USER_INTERACTIONS: 'userInteractions',
  ADMIN_MODERATION: 'adminModeration'
};

// =============================================
// EVENT MANAGEMENT
// =============================================

export const eventSchema = {
  id: '',
  title: { en: '', hi: '', gu: '' },
  description: { en: '', hi: '', gu: '' },
  imageUrl: '',
  mediaFiles: [],
  location: {
    address: '',
    coordinates: { lat: 0, lng: 0 },
    venue: '',
    city: 'Vadodara',
    state: 'Gujarat'
  },
  contactInfo: {
    phone: '',
    email: '',
    website: '',
    organizer: ''
  },
  dateTime: {
    start: '',
    end: '',
    timezone: 'Asia/Kolkata'
  },
  category: '',
  tags: [],
  ticketInfo: {
    isFree: true,
    price: 0,
    bookingUrl: '',
    capacity: 0
  },
  status: 'upcoming', // upcoming, ongoing, completed, cancelled
  isPublished: false,
  createdBy: '',
  createdAt: '',
  updatedAt: '',
  analytics: {
    views: 0,
    interested: 0,
    going: 0,
    shares: 0
  }
};

export const createEvent = async (eventData, userId) => {
  try {
    const eventsRef = ref(db, DATABASE_PATHS.EVENTS);
    const newEventRef = push(eventsRef);
    
    const event = {
      ...eventSchema,
      ...eventData,
      id: newEventRef.key,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await set(newEventRef, event);
    return { success: true, id: newEventRef.key };
  } catch (error) {
    console.error('Error creating event:', error);
    return { success: false, error };
  }
};

// =============================================
// POLL MANAGEMENT
// =============================================

export const pollSchema = {
  id: '',
  question: { en: '', hi: '', gu: '' },
  description: { en: '', hi: '', gu: '' },
  options: [
    { id: '', text: { en: '', hi: '', gu: '' }, votes: 0, voters: [] }
  ],
  category: '',
  tags: [],
  mediaUrl: '',
  settings: {
    allowMultipleVotes: false,
    requireAuth: true,
    showResults: 'after_vote', // always, after_vote, after_end
    endDate: '',
    isActive: true
  },
  isPublished: false,
  createdBy: '',
  createdAt: '',
  updatedAt: '',
  analytics: {
    totalVotes: 0,
    uniqueVoters: 0,
    views: 0,
    shares: 0
  }
};

export const createPoll = async (pollData, createdBy) => {
  const db = getDatabase();
  const pollsRef = ref(db, DATABASE_PATHS.POLLS);
  
  const pollId = push(pollsRef).key;
  
  const pollToSave = {
    id: pollId,
    createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    question: pollData.question,
    description: pollData.description,
    options: pollData.options,
    category: pollData.category || 'general',
    tags: pollData.tags || [],
    settings: {
      ...pollSchema.settings,
      ...pollData.settings
    },
    isPublished: pollData.isPublished || false,
    totalVotes: 0,
    analytics: pollSchema.analytics
  };
  
  const pollRef = ref(db, `${DATABASE_PATHS.POLLS}/${pollId}`);
  await set(pollRef, pollToSave);
  
  return pollId;
};

// =============================================
// BREAKING NEWS MANAGEMENT
// =============================================

export const breakingNewsSchema = {
  id: '',
  headline: { en: '', hi: '', gu: '' },
  summary: { en: '', hi: '', gu: '' },
  priority: 'high', // high, medium, low
  category: '',
  tags: [],
  mediaUrl: '',
  sourceUrl: '',
  location: '',
  isActive: true,
  expiresAt: '',
  createdBy: '',
  createdAt: '',
  analytics: {
    views: 0,
    clicks: 0,
    shares: 0
  }
};

export const createBreakingNews = async (newsData, userId) => {
  try {
    const breakingRef = ref(db, DATABASE_PATHS.BREAKING_NEWS);
    const newNewsRef = push(breakingRef);
    
    const news = {
      ...breakingNewsSchema,
      ...newsData,
      id: newNewsRef.key,
      createdBy: userId,
      createdAt: new Date().toISOString()
    };
    
    await set(newNewsRef, news);
    return { success: true, id: newNewsRef.key };
  } catch (error) {
    console.error('Error creating breaking news:', error);
    return { success: false, error };
  }
};

// =============================================
// LIVE UPDATES MANAGEMENT
// =============================================

export const liveUpdateSchema = {
  id: '',
  title: { en: '', hi: '', gu: '' },
  content: { en: '', hi: '', gu: '' },
  category: '',
  tags: [],
  mediaUrl: '',
  location: '',
  isActive: true,
  priority: 'normal', // urgent, high, normal, low
  createdBy: '',
  createdAt: '',
  analytics: {
    views: 0,
    reactions: 0
  }
};

export const createLiveUpdate = async (updateData, userId) => {
  try {
    const updatesRef = ref(db, DATABASE_PATHS.LIVE_UPDATES);
    const newUpdateRef = push(updatesRef);
    
    const update = {
      ...liveUpdateSchema,
      ...updateData,
      id: newUpdateRef.key,
      createdBy: userId,
      createdAt: new Date().toISOString()
    };
    
    await set(newUpdateRef, update);
    return { success: true, id: newUpdateRef.key };
  } catch (error) {
    console.error('Error creating live update:', error);
    return { success: false, error };
  }
};

// =============================================
// ANALYTICS & REAL-TIME FEATURES
// =============================================

export const updatePostAnalytics = async (postId, analyticsData) => {
  try {
    const analyticsRef = ref(db, `${DATABASE_PATHS.POST_ANALYTICS}/${postId}`);
    await update(analyticsRef, {
      ...analyticsData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating analytics:', error);
    return { success: false, error };
  }
};

export const recordUserInteraction = async (userId, postId, interactionType, metadata = {}) => {
  try {
    const interactionRef = ref(db, DATABASE_PATHS.USER_INTERACTIONS);
    const newInteractionRef = push(interactionRef);
    
    const interaction = {
      id: newInteractionRef.key,
      userId,
      postId,
      type: interactionType, // view, like, comment, share, click
      metadata,
      timestamp: new Date().toISOString()
    };
    
    await set(newInteractionRef, interaction);
    return { success: true };
  } catch (error) {
    console.error('Error recording interaction:', error);
    return { success: false, error };
  }
};

// =============================================
// AI PICKS ALGORITHM (Simplified)
// =============================================

export const calculateAIPicks = async (userId = null) => {
  try {
    // Get all posts with analytics
    const postsRef = ref(db, DATABASE_PATHS.POSTS);
    const analyticsRef = ref(db, DATABASE_PATHS.POST_ANALYTICS);
    const interactionsRef = ref(db, DATABASE_PATHS.USER_INTERACTIONS);
    
    const [postsSnapshot, analyticsSnapshot, interactionsSnapshot] = await Promise.all([
      get(postsRef),
      get(analyticsRef),
      get(interactionsRef)
    ]);
    
    const posts = postsSnapshot.val() || {};
    const analytics = analyticsSnapshot.val() || {};
    const interactions = interactionsSnapshot.val() || {};
    
    // Calculate AI score for each post
    const scoredPosts = Object.keys(posts).map(postId => {
      const post = posts[postId];
      const postAnalytics = analytics[postId] || { views: 0, likes: 0, comments: 0, shares: 0 };
      
      // Simple AI scoring algorithm
      const score = (
        (postAnalytics.views || 0) * 0.1 +
        (postAnalytics.likes || 0) * 0.3 +
        (postAnalytics.comments || 0) * 0.4 +
        (postAnalytics.shares || 0) * 0.2
      ) / Math.max(1, (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60)); // Time decay
      
      return {
        ...post,
        aiScore: score,
        analytics: postAnalytics
      };
    });
    
    // Sort by AI score and return top picks
    const aiPicks = scoredPosts
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 10);
    
    // Update AI picks in database
    const aiPicksRef = ref(db, DATABASE_PATHS.AI_PICKS);
    await set(aiPicksRef, {
      picks: aiPicks,
      generatedAt: new Date().toISOString(),
      userId: userId || 'global'
    });
    
    return { success: true, picks: aiPicks };
  } catch (error) {
    console.error('Error calculating AI picks:', error);
    return { success: false, error };
  }
};

// =============================================
// TRENDING ALGORITHM
// =============================================

export const calculateTrendingStories = async () => {
  try {
    const postsRef = ref(db, DATABASE_PATHS.POSTS);
    const analyticsRef = ref(db, DATABASE_PATHS.POST_ANALYTICS);
    
    const [postsSnapshot, analyticsSnapshot] = await Promise.all([
      get(postsRef),
      get(analyticsRef)
    ]);
    
    const posts = postsSnapshot.val() || {};
    const analytics = analyticsSnapshot.val() || {};
    
    // Calculate trending score (last 24 hours activity)
    const now = Date.now();
    const dayAgo = now - (24 * 60 * 60 * 1000);
    
    const trendingPosts = Object.keys(posts)
      .filter(postId => new Date(posts[postId].createdAt).getTime() > dayAgo)
      .map(postId => {
        const post = posts[postId];
        const postAnalytics = analytics[postId] || {};
        
        // Trending score based on recent activity
        const trendingScore = (
          (postAnalytics.views || 0) * 0.2 +
          (postAnalytics.likes || 0) * 0.3 +
          (postAnalytics.comments || 0) * 0.4 +
          (postAnalytics.shares || 0) * 0.1
        );
        
        return {
          ...post,
          trendingScore,
          analytics: postAnalytics
        };
      })
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 10);
    
    // Update trending stories
    const trendingRef = ref(db, DATABASE_PATHS.TRENDING_STORIES);
    await set(trendingRef, {
      stories: trendingPosts,
      generatedAt: new Date().toISOString()
    });
    
    return { success: true, stories: trendingPosts };
  } catch (error) {
    console.error('Error calculating trending stories:', error);
    return { success: false, error };
  }
};

// =============================================
// ADMIN MODERATION
// =============================================

export const getCommentsForModeration = async () => {
  try {
    const commentsRef = ref(db, DATABASE_PATHS.COMMENTS);
    const postsRef = ref(db, DATABASE_PATHS.POSTS);
    
    const [commentsSnapshot, postsSnapshot] = await Promise.all([
      get(commentsRef),
      get(postsRef)
    ]);
    
    const comments = commentsSnapshot.val() || {};
    const posts = postsSnapshot.val() || {};
    
    // Format comments with post information for admin review
    const moderationQueue = Object.keys(comments).map(commentId => {
      const comment = comments[commentId];
      const post = posts[comment.postId] || {};
      
      return {
        ...comment,
        id: commentId,
        postTitle: post.title?.en || 'Unknown Post',
        postId: comment.postId,
        needsModeration: !comment.approved,
        createdAt: comment.createdAt
      };
    }).filter(comment => comment.needsModeration);
    
    return { success: true, comments: moderationQueue };
  } catch (error) {
    console.error('Error fetching comments for moderation:', error);
    return { success: false, error };
  }
};

export const moderateComment = async (commentId, action, moderatorId) => {
  try {
    const commentRef = ref(db, `${DATABASE_PATHS.COMMENTS}/${commentId}`);
    
    await update(commentRef, {
      approved: action === 'approve',
      rejected: action === 'reject',
      moderatedBy: moderatorId,
      moderatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error moderating comment:', error);
    return { success: false, error };
  }
};

// =============================================
// REAL-TIME LISTENERS
// =============================================

export const setupRealtimeListeners = () => {
  // Set up listeners for real-time updates
  const listeners = {};
  
  listeners.breakingNews = (callback) => {
    const ref_path = ref(db, DATABASE_PATHS.BREAKING_NEWS);
    onValue(ref_path, callback);
    return () => off(ref_path, callback);
  };
  
  listeners.liveUpdates = (callback) => {
    const ref_path = ref(db, DATABASE_PATHS.LIVE_UPDATES);
    onValue(ref_path, callback);
    return () => off(ref_path, callback);
  };
  
  listeners.trendingStories = (callback) => {
    const ref_path = ref(db, DATABASE_PATHS.TRENDING_STORIES);
    onValue(ref_path, callback);
    return () => off(ref_path, callback);
  };
  
  return listeners;
};

export default {
  createEvent,
  createPoll,
  createBreakingNews,
  createLiveUpdate,
  updatePostAnalytics,
  recordUserInteraction,
  calculateAIPicks,
  calculateTrendingStories,
  getCommentsForModeration,
  moderateComment,
  setupRealtimeListeners,
  DATABASE_PATHS
};