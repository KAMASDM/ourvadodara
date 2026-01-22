// =============================================
// src/utils/recommendationEngine.js
// Smart Content Recommendation Algorithm
// =============================================

/**
 * Advanced recommendation engine that combines multiple signals:
 * 1. Content-based filtering (tags, category, location)
 * 2. Collaborative filtering (user behavior)
 * 3. Recency boost (recent articles get higher scores)
 * 4. Engagement metrics (likes, views, comments)
 * 5. Diversity factor (avoid showing too similar content)
 * 6. For You algorithm (personalized feed based on user history)
 */

/**
 * Generate personalized "For You" feed
 * Combines user preferences with trending content
 */
export const generateForYouFeed = (articles, userInteractions, options = {}) => {
  const {
    maxResults = 20,
    diversityFactor = 0.3,
    trendingWeight = 0.3,
    personalWeight = 0.7
  } = options;

  if (!articles || articles.length === 0) return [];
  if (!userInteractions || userInteractions.length === 0) {
    // Return trending content for new users
    return articles
      .sort((a, b) => calculateEngagementScore(b.analytics) - calculateEngagementScore(a.analytics))
      .slice(0, maxResults);
  }

  // Score each article
  const scoredArticles = articles.map(article => {
    const personalScore = calculateUserPreferenceScore(article, userInteractions);
    const trendingScore = calculateEngagementScore(article.analytics);
    const recencyScore = calculateRecencyScore(article.publishedAt || article.createdAt);
    
    // Weighted combination
    const finalScore = (
      personalScore * personalWeight +
      trendingScore * trendingWeight +
      recencyScore * 0.2
    );

    return {
      ...article,
      recommendationScore: finalScore,
      _personalScore: personalScore,
      _trendingScore: trendingScore,
      _recencyScore: recencyScore
    };
  });

  // Sort by score
  scoredArticles.sort((a, b) => b.recommendationScore - a.recommendationScore);

  // Apply diversity filter
  const diverseResults = applyDiversityFilter(scoredArticles, diversityFactor, maxResults);

  return diverseResults;
};

/**
 * Apply diversity filter to avoid too similar content
 */
const applyDiversityFilter = (articles, diversityFactor, maxResults) => {
  const selected = [];
  const usedCategories = new Map();
  const usedTags = new Set();

  for (const article of articles) {
    if (selected.length >= maxResults) break;

    // Check category diversity
    const categoryCount = usedCategories.get(article.category) || 0;
    const categoryPenalty = categoryCount * diversityFactor;

    // Check tag diversity
    let tagOverlap = 0;
    if (article.tags) {
      tagOverlap = article.tags.filter(tag => usedTags.has(tag)).length;
    }
    const tagPenalty = tagOverlap * diversityFactor * 0.5;

    // Adjust score with penalties
    const adjustedScore = article.recommendationScore - categoryPenalty - tagPenalty;

    if (adjustedScore > 0 || selected.length < 5) {
      selected.push(article);
      
      // Update diversity trackers
      usedCategories.set(article.category, categoryCount + 1);
      if (article.tags) {
        article.tags.forEach(tag => usedTags.add(tag));
      }
    }
  }

  return selected;
};

/**
 * Calculate similarity score between two articles based on tags
 * Uses Jaccard similarity coefficient
 */
const calculateTagSimilarity = (tags1, tags2) => {
  if (!tags1 || !tags2 || tags1.length === 0 || tags2.length === 0) return 0;
  
  const set1 = new Set(tags1.map(tag => tag.toLowerCase()));
  const set2 = new Set(tags2.map(tag => tag.toLowerCase()));
  
  const intersection = new Set([...set1].filter(tag => set2.has(tag)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
};

/**
 * Calculate location similarity score
 */
const calculateLocationSimilarity = (cities1, cities2) => {
  if (!cities1 || !cities2 || cities1.length === 0 || cities2.length === 0) return 0;
  
  const set1 = new Set(cities1);
  const set2 = new Set(cities2);
  
  const intersection = new Set([...set1].filter(city => set2.has(city)));
  return intersection.size > 0 ? 1 : 0;
};

/**
 * Calculate recency score (newer articles get higher scores)
 * Uses exponential decay with half-life of 7 days
 */
const calculateRecencyScore = (timestamp) => {
  if (!timestamp) return 0;
  
  const now = Date.now();
  const articleDate = new Date(timestamp).getTime();
  const ageInDays = (now - articleDate) / (1000 * 60 * 60 * 24);
  
  // Exponential decay: score = e^(-λ * age)
  // Half-life of 7 days: λ = ln(2) / 7
  const lambda = Math.LN2 / 7;
  return Math.exp(-lambda * ageInDays);
};

/**
 * Calculate engagement score based on analytics
 */
const calculateEngagementScore = (analytics) => {
  if (!analytics) return 0;
  
  const { views = 0, likes = 0, comments = 0, shares = 0 } = analytics;
  
  // Weighted engagement score
  // Comments and shares are more valuable than views
  const engagementScore = (
    views * 0.1 +
    likes * 1.0 +
    comments * 2.0 +
    shares * 3.0
  );
  
  // Normalize using logarithm to prevent very popular posts from dominating
  return Math.log10(engagementScore + 1);
};

/**
 * Calculate user preference score based on interaction history
 */
const calculateUserPreferenceScore = (article, userInteractions) => {
  if (!userInteractions || userInteractions.length === 0) return 0;
  
  let score = 0;
  
  // Category preference
  const categoryInteractions = userInteractions.filter(
    interaction => interaction.category === article.category
  );
  if (categoryInteractions.length > 0) {
    score += 0.3 * (categoryInteractions.length / userInteractions.length);
  }
  
  // Tag preference
  if (article.tags && article.tags.length > 0) {
    const userLikedTags = new Set();
    userInteractions.forEach(interaction => {
      if (interaction.tags) {
        interaction.tags.forEach(tag => userLikedTags.add(tag.toLowerCase()));
      }
    });
    
    const matchingTags = article.tags.filter(tag => 
      userLikedTags.has(tag.toLowerCase())
    );
    score += 0.4 * (matchingTags.length / article.tags.length);
  }
  
  // Location preference
  if (article.cities && article.cities.length > 0) {
    const userLikedCities = new Set();
    userInteractions.forEach(interaction => {
      if (interaction.cities) {
        interaction.cities.forEach(city => userLikedCities.add(city));
      }
    });
    
    const matchingCities = article.cities.filter(city => 
      userLikedCities.has(city)
    );
    score += 0.3 * (matchingCities.length / article.cities.length);
  }
  
  return score;
};

/**
 * Calculate diversity penalty to avoid showing too similar content
 */
const calculateDiversityPenalty = (article, alreadyRecommended) => {
  if (alreadyRecommended.length === 0) return 0;
  
  let maxSimilarity = 0;
  
  alreadyRecommended.forEach(recommended => {
    // Same category reduces diversity
    if (recommended.category === article.category) {
      maxSimilarity = Math.max(maxSimilarity, 0.5);
    }
    
    // Same tags reduce diversity
    const tagSimilarity = calculateTagSimilarity(article.tags, recommended.tags);
    maxSimilarity = Math.max(maxSimilarity, tagSimilarity * 0.3);
  });
  
  return maxSimilarity;
};

/**
 * Main recommendation function
 * 
 * @param {Object} currentArticle - The article user is currently viewing
 * @param {Array} allArticles - All available articles
 * @param {Array} userInteractions - User's interaction history (likes, reads, etc.)
 * @param {Object} options - Configuration options
 * @returns {Array} Recommended articles sorted by relevance score
 */
export const getRecommendedArticles = (
  currentArticle,
  allArticles,
  userInteractions = [],
  options = {}
) => {
  const {
    maxResults = 6,
    minScore = 0.1,
    weights = {
      tags: 0.25,
      category: 0.15,
      location: 0.15,
      recency: 0.15,
      engagement: 0.15,
      userPreference: 0.15
    },
    diversityFactor = 0.2
  } = options;
  
  // Filter out current article and calculate scores
  const scoredArticles = allArticles
    .filter(article => article.id !== currentArticle.id)
    .map(article => {
      // Content-based scores
      const tagSimilarity = calculateTagSimilarity(
        currentArticle.tags,
        article.tags
      );
      
      const categoryMatch = 
        currentArticle.category && article.category &&
        currentArticle.category === article.category ? 1 : 0;
      
      const locationSimilarity = calculateLocationSimilarity(
        currentArticle.cities,
        article.cities
      );
      
      // Time and engagement scores
      const recencyScore = calculateRecencyScore(
        article.publishedAt || article.createdAt || article.timestamp
      );
      
      const engagementScore = calculateEngagementScore(article.analytics);
      
      // User preference score
      const userPrefScore = calculateUserPreferenceScore(
        article,
        userInteractions
      );
      
      // Calculate weighted total score
      const baseScore = (
        tagSimilarity * weights.tags +
        categoryMatch * weights.category +
        locationSimilarity * weights.location +
        recencyScore * weights.recency +
        engagementScore * weights.engagement +
        userPrefScore * weights.userPreference
      );
      
      return {
        article,
        score: baseScore,
        breakdown: {
          tagSimilarity,
          categoryMatch,
          locationSimilarity,
          recencyScore,
          engagementScore,
          userPrefScore,
          baseScore
        }
      };
    });
  
  // Sort by score
  scoredArticles.sort((a, b) => b.score - a.score);
  
  // Apply diversity filter
  const diverseRecommendations = [];
  const alreadyRecommended = [];
  
  for (const scored of scoredArticles) {
    if (diverseRecommendations.length >= maxResults) break;
    
    const diversityPenalty = calculateDiversityPenalty(
      scored.article,
      alreadyRecommended
    );
    
    const finalScore = scored.score * (1 - diversityPenalty * diversityFactor);
    
    if (finalScore >= minScore) {
      diverseRecommendations.push({
        ...scored.article,
        recommendationScore: finalScore,
        scoreBreakdown: scored.breakdown
      });
      alreadyRecommended.push(scored.article);
    }
  }
  
  // If we don't have enough recommendations, fill with most recent articles
  if (diverseRecommendations.length < maxResults) {
    const remaining = scoredArticles
      .filter(scored => !diverseRecommendations.find(rec => rec.id === scored.article.id))
      .slice(0, maxResults - diverseRecommendations.length)
      .map(scored => scored.article);
    
    diverseRecommendations.push(...remaining);
  }
  
  return diverseRecommendations;
};

/**
 * Get user interaction history from Firebase
 * This should be called to build user profile
 */
export const buildUserInteractionProfile = (userId, likesData, readsData, sharesData) => {
  const interactions = [];
  
  // Process likes
  if (likesData) {
    Object.entries(likesData).forEach(([postId, likeData]) => {
      if (likeData.userId === userId) {
        interactions.push({
          type: 'like',
          postId,
          timestamp: likeData.timestamp,
          ...likeData.postData
        });
      }
    });
  }
  
  // Process reads (can be tracked from analytics)
  if (readsData) {
    Object.entries(readsData).forEach(([postId, readData]) => {
      if (readData.userId === userId) {
        interactions.push({
          type: 'read',
          postId,
          timestamp: readData.timestamp,
          duration: readData.duration,
          ...readData.postData
        });
      }
    });
  }
  
  // Process shares
  if (sharesData) {
    Object.entries(sharesData).forEach(([postId, shareData]) => {
      if (shareData.userId === userId) {
        interactions.push({
          type: 'share',
          postId,
          timestamp: shareData.timestamp,
          ...shareData.postData
        });
      }
    });
  }
  
  // Sort by timestamp (most recent first)
  interactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  
  // Return most recent 50 interactions
  return interactions.slice(0, 50);
};

export default {
  getRecommendedArticles,
  buildUserInteractionProfile
};
