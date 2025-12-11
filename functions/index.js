// =============================================
// Firebase Cloud Functions for Our Vadodara News
// =============================================
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Send push notification when new news is published (main posts path)
exports.sendNewNewsNotification = functions.database
  .ref('/posts/{postId}')
  .onCreate(async (snapshot, context) => {
    return sendNotificationForNewPost(snapshot, context.params.postId);
  });

// Send push notification when new news is published in a city
exports.sendNewCityNewsNotification = functions.database
  .ref('/cities/{cityId}/posts/{postId}')
  .onCreate(async (snapshot, context) => {
    const cityId = context.params.cityId;
    return sendNotificationForNewPost(snapshot, context.params.postId, cityId);
  });

// Shared function to send notification for new posts
async function sendNotificationForNewPost(snapshot, postId, cityId = null) {
  const post = snapshot.val();

  // Only send notification if post is published and not a draft
  if (post.status === 'draft' || post.isPublished === false) {
    console.log('Post is draft or unpublished, skipping notification');
    return null;
  }

  // Get post details
  const title = post.title?.en || post.title || 'New Article Published';
  const body = post.excerpt?.en || post.content?.en?.substring(0, 100) || 'Check out the latest news';
  const category = post.category || 'news';
  
  // Get image from different possible locations
  let imageUrl = '';
  if (post.image) {
    imageUrl = post.image;
  } else if (post.media && post.media.length > 0) {
    imageUrl = post.media[0].url || post.media[0].downloadURL || '';
  } else if (post.mediaContent?.items) {
    const items = Array.isArray(post.mediaContent.items) 
      ? post.mediaContent.items 
      : Object.values(post.mediaContent.items);
    if (items.length > 0) {
      imageUrl = items[0].url || items[0].downloadURL || '';
    }
  }

  // Build notification payload
  const notificationTitle = post.isBreaking ? `🚨 BREAKING: ${title}` : `📰 ${title}`;
  
  const payload = {
    notification: {
      title: notificationTitle,
      body: body,
      icon: imageUrl || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: `news-${postId}`,
      requireInteraction: post.isBreaking || false,
    },
    data: {
      postId: postId,
      type: 'news',
      category: category,
      cityId: cityId || '',
      url: `/?post=${postId}`,
      timestamp: new Date().toISOString(),
      click_action: 'FLUTTER_NOTIFICATION_CLICK'
    },
    webpush: {
      headers: {
        Urgency: post.isBreaking ? 'high' : 'normal',
        TTL: '86400'
      },
      notification: {
        badge: '/icons/icon-72x72.png',
        icon: imageUrl || '/icons/icon-192x192.png',
        image: imageUrl || undefined,
        vibrate: post.isBreaking ? [200, 100, 200, 100, 200] : [200, 100, 200],
        actions: [
          {
            action: 'view',
            title: 'Read Now',
            icon: '/icons/icon-72x72.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      },
      fcm_options: {
        link: `/?post=${postId}`
      }
    }
  };

  try {
    // Determine which topics to send to
    const topics = [];
    
    // Always send to all-news unless it's breaking
    if (post.isBreaking) {
      topics.push('breaking-news');
    } else {
      topics.push('all-news');
    }
    
    // Add city-specific topic if available
    if (cityId) {
      topics.push(`city-${cityId}`);
    }
    
    // Also send to cities array if present
    if (post.cities && Array.isArray(post.cities)) {
      post.cities.forEach(city => {
        topics.push(`city-${city}`);
      });
    }
    
    // Send to category topic
    if (category) {
      topics.push(`category-${category.toLowerCase().replace(/\s+/g, '-')}`);
    }

    console.log(`Sending notification to topics: ${topics.join(', ')}`);

    // Send notification to each topic
    const responses = await Promise.all(
      topics.map(topic => 
        admin.messaging().send({
          topic: topic,
          ...payload
        }).catch(error => {
          console.error(`Error sending to topic ${topic}:`, error);
          return null;
        })
      )
    );

    console.log('Successfully sent notifications for post:', postId, responses);

    // Update post with notification sent status
    const updatePath = cityId ? `/cities/${cityId}/posts/${postId}` : `/posts/${postId}`;
    await admin.database().ref(updatePath).update({
      notificationSent: true,
      notificationSentAt: admin.database.ServerValue.TIMESTAMP,
      notificationTopics: topics
    });

    // Increment badge count for all relevant topics
    for (const topic of topics) {
      await incrementBadgeCount(topic);
    }

    return responses;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
}

// Send notification for breaking news updates
exports.sendBreakingNewsNotification = functions.database
  .ref('/breakingNews/{newsId}')
  .onCreate(async (snapshot, context) => {
    const news = snapshot.val();
    const newsId = context.params.newsId;

    if (!news.isActive) {
      console.log('Breaking news is not active, skipping notification');
      return null;
    }

    const title = news.headline?.en || news.headline || '🚨 BREAKING NEWS';
    const body = news.summary?.en || news.summary || 'Breaking news update';

    const payload = {
      notification: {
        title: title,
        body: body,
        icon: news.mediaUrl || '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: `breaking-${newsId}`,
        requireInteraction: true,
      },
      data: {
        newsId: newsId,
        type: 'breaking',
        category: news.category || 'breaking',
        url: `/breaking/${newsId}`,
        priority: 'high'
      },
      webpush: {
        headers: {
          Urgency: 'high',
          TTL: '3600'
        },
        notification: {
          badge: '/icons/icon-72x72.png',
          icon: news.mediaUrl || '/icons/icon-192x192.png',
          vibrate: [300, 100, 300, 100, 300],
          renotify: true
        }
      }
    };

    try {
      const response = await admin.messaging().send({
        topic: 'breaking-news',
        ...payload
      });

      console.log('Successfully sent breaking news notification:', newsId, response);

      // Increment badge count
      await incrementBadgeCount('breaking-news');

      return response;
    } catch (error) {
      console.error('Error sending breaking news notification:', error);
      return null;
    }
  });

// Helper function to increment badge count for users
async function incrementBadgeCount(topic) {
  try {
    // Get all FCM tokens subscribed to the topic
    const tokensSnapshot = await admin.database().ref('/fcmTokens').once('value');
    const tokens = tokensSnapshot.val() || {};

    const updates = {};
    Object.keys(tokens).forEach(userId => {
      const userToken = tokens[userId];
      if (userToken.topics && userToken.topics.includes(topic)) {
        updates[`/users/${userId}/unreadNotifications`] = admin.database.ServerValue.increment(1);
      }
    });

    if (Object.keys(updates).length > 0) {
      await admin.database().ref().update(updates);
      console.log(`Updated badge count for ${Object.keys(updates).length} users`);
    }

    return updates;
  } catch (error) {
    console.error('Error incrementing badge count:', error);
    return null;
  }
}

// Subscribe FCM token to topics when stored in database
exports.subscribeTokenToTopics = functions.database
  .ref('/fcmTokens/{userId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const tokenData = change.after.val();

    // If token was deleted, skip
    if (!tokenData || !tokenData.token) {
      console.log('Token deleted or invalid, skipping subscription');
      return null;
    }

    const { token, topics = [] } = tokenData;

    try {
      // Subscribe token to all listed topics
      const subscriptionPromises = topics.map(topic =>
        admin.messaging().subscribeToTopic(token, topic)
          .then(() => {
            console.log(`Successfully subscribed ${userId} to topic: ${topic}`);
            return { topic, success: true };
          })
          .catch(error => {
            console.error(`Error subscribing ${userId} to topic ${topic}:`, error);
            return { topic, success: false, error: error.message };
          })
      );

      const results = await Promise.all(subscriptionPromises);
      
      // Update subscription status in database
      await admin.database().ref(`/fcmTokens/${userId}`).update({
        subscriptionResults: results,
        lastSubscribed: admin.database.ServerValue.TIMESTAMP
      });

      console.log(`Token subscription completed for user ${userId}`);
      return results;
    } catch (error) {
      console.error('Error in token subscription:', error);
      return null;
    }
  });

// Clear badge count when user opens the app
exports.clearBadgeCount = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;

  try {
    await admin.database().ref(`/users/${userId}`).update({
      unreadNotifications: 0,
      lastReadAt: admin.database.ServerValue.TIMESTAMP
    });

    return { success: true, message: 'Badge count cleared' };
  } catch (error) {
    console.error('Error clearing badge count:', error);
    throw new functions.https.HttpsError('internal', 'Error clearing badge count');
  }
});

// Subscribe user to FCM topics
exports.subscribeToTopics = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { token, topics = [] } = data;
  const userId = context.auth.uid;

  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'FCM token is required');
  }

  try {
    // Default topics everyone should be subscribed to
    const defaultTopics = ['all-news', 'breaking-news'];
    const allTopics = [...new Set([...defaultTopics, ...topics])];

    // Subscribe to each topic
    const subscriptionPromises = allTopics.map(topic =>
      admin.messaging().subscribeToTopic(token, topic)
    );

    await Promise.all(subscriptionPromises);

    // Save token and topics to database
    await admin.database().ref(`/fcmTokens/${userId}`).set({
      token: token,
      topics: allTopics,
      subscribedAt: admin.database.ServerValue.TIMESTAMP,
      lastUpdated: admin.database.ServerValue.TIMESTAMP
    });

    console.log(`User ${userId} subscribed to topics:`, allTopics);

    return { 
      success: true, 
      message: 'Successfully subscribed to topics',
      topics: allTopics 
    };
  } catch (error) {
    console.error('Error subscribing to topics:', error);
    throw new functions.https.HttpsError('internal', 'Error subscribing to topics');
  }
});

// Unsubscribe user from FCM topics
exports.unsubscribeFromTopics = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { token, topics = [] } = data;
  const userId = context.auth.uid;

  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'FCM token is required');
  }

  try {
    const unsubscriptionPromises = topics.map(topic =>
      admin.messaging().unsubscribeFromTopic(token, topic)
    );

    await Promise.all(unsubscriptionPromises);

    // Update database
    const tokenRef = admin.database().ref(`/fcmTokens/${userId}`);
    const tokenSnapshot = await tokenRef.once('value');
    const tokenData = tokenSnapshot.val();

    if (tokenData) {
      const updatedTopics = tokenData.topics.filter(t => !topics.includes(t));
      await tokenRef.update({
        topics: updatedTopics,
        lastUpdated: admin.database.ServerValue.TIMESTAMP
      });
    }

    console.log(`User ${userId} unsubscribed from topics:`, topics);

    return { 
      success: true, 
      message: 'Successfully unsubscribed from topics' 
    };
  } catch (error) {
    console.error('Error unsubscribing from topics:', error);
    throw new functions.https.HttpsError('internal', 'Error unsubscribing from topics');
  }
});
