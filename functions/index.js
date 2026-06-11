// =============================================
// Firebase Cloud Functions for Our Vadodara News
// =============================================
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();

const PUBLIC_LEAD_PATH = 'leads';
const LEAD_TEMPLATE_PATH = 'leadMessageTemplates';
const LEAD_NOTIFICATION_LOG_PATH = 'leadNotificationLogs';

function cleanString(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function cleanOptionalString(value, maxLength = 500) {
  return cleanString(value || '', maxLength);
}

function requirePublicLeadString(data, field, label, maxLength = 160) {
  const value = cleanString(data?.[field], maxLength);
  if (!value) {
    throw new functions.https.HttpsError('invalid-argument', `${label} is required`);
  }
  return value;
}

function publicLeadActivity(message, note = '') {
  return {
    message,
    note,
    at: new Date().toISOString(),
    by: 'Campaign Assistant',
    byUid: 'public-enquiry'
  };
}

function stripHtml(value) {
  return cleanOptionalString(String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '), 450);
}

function interpolateLeadMessage(template, lead) {
  const stage = lead.stage || lead.status || 'new';
  const values = {
    companyName: lead.companyName || 'Lead',
    contactName: lead.contactName || 'Contact',
    city: lead.city || '',
    stage,
    packageInterest: lead.packageInterest || '',
    followUpDate: lead.followUpDate || '',
    assignedTo: lead.assignedTo || '',
    serviceType: lead.serviceType || ''
  };

  return String(template || '').replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] || '');
}

function getLeadTriggerIds(beforeLead, afterLead, created) {
  const triggers = created ? ['lead_created'] : ['lead_updated'];
  const beforeStage = beforeLead?.stage || beforeLead?.status || '';
  const afterStage = afterLead?.stage || afterLead?.status || '';

  if (afterStage && afterStage !== beforeStage) {
    triggers.push(`stage_${afterStage}`);
  }

  if (afterLead?.followUpDate && afterLead.followUpDate !== beforeLead?.followUpDate) {
    const dueAt = new Date(`${afterLead.followUpDate}T23:59:59`);
    if (!Number.isNaN(dueAt.getTime()) && dueAt <= new Date()) {
      triggers.push('followup_due');
    }
  }

  return triggers;
}

exports.createPublicLead = functions.https.onCall(async (data) => {
  const contactName = requirePublicLeadString(data, 'contactName', 'Name');
  const companyName = requirePublicLeadString(data, 'companyName', 'Brand name');
  const city = requirePublicLeadString(data, 'city', 'City');
  const phone = cleanOptionalString(data?.phone, 40);
  const email = cleanOptionalString(data?.email, 180);

  if (!phone && !email) {
    throw new functions.https.HttpsError('invalid-argument', 'Phone or email is required');
  }

  const businessCategory = cleanOptionalString(data?.businessCategory, 120);
  const now = new Date().toISOString();

  try {
    const leadRef = admin.database().ref(PUBLIC_LEAD_PATH).push();
    await leadRef.set({
      companyName,
      contactName,
      phone,
      email,
      city,
      businessCategory,
      source: 'Campaign Assistant',
      serviceType: 'combined',
      packageInterest: 'General campaign enquiry',
      budget: null,
      expectedValue: null,
      stage: 'new',
      status: 'new',
      priority: 'warm',
      followUpDate: '',
      expectedCloseDate: '',
      assignedTo: 'Sales Team',
      requirements: '',
      notes: 'Lead captured before assistant flow',
      createdAt: now,
      updatedAt: now,
      createdBy: 'public-enquiry',
      createdByName: 'Campaign Assistant',
      updatedBy: 'public-enquiry',
      updatedByName: 'Campaign Assistant',
      lastActivityAt: now,
      activityLog: [
        publicLeadActivity('Lead captured before bot conversation', `${companyName} from ${city}`)
      ]
    });

    return { success: true, leadId: leadRef.key };
  } catch (error) {
    console.error('Error creating public lead:', error);
    throw new functions.https.HttpsError('internal', 'Unable to create lead');
  }
});

exports.updatePublicLead = functions.https.onCall(async (data) => {
  const leadId = cleanString(data?.leadId, 120);
  if (!leadId || !/^[A-Za-z0-9_-]+$/.test(leadId)) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid lead id is required');
  }

  const message = cleanOptionalString(data?.message, 180) || 'Campaign assistant update';
  const note = cleanOptionalString(data?.note, 1200);
  const serviceType = cleanOptionalString(data?.serviceType, 60) || 'combined';
  const packageInterest = cleanOptionalString(data?.packageInterest, 180) || 'General campaign enquiry';
  const priority = ['hot', 'warm', 'cold'].includes(data?.priority) ? data.priority : 'warm';
  const budgetRange = cleanOptionalString(data?.budgetRange, 120);
  const now = new Date().toISOString();

  try {
    const leadRef = admin.database().ref(`${PUBLIC_LEAD_PATH}/${leadId}`);
    const snapshot = await leadRef.once('value');
    if (!snapshot.exists()) {
      throw new functions.https.HttpsError('not-found', 'Lead not found');
    }

    const lead = snapshot.val() || {};
    const currentLog = Array.isArray(lead.activityLog) ? lead.activityLog : [];
    await leadRef.update({
      serviceType,
      packageInterest,
      requirements: note || lead.requirements || '',
      notes: budgetRange ? `Budget range: ${budgetRange}` : lead.notes || 'Budget not shared',
      priority,
      updatedAt: now,
      updatedBy: 'public-enquiry',
      updatedByName: 'Campaign Assistant',
      lastActivityAt: now,
      activityLog: [
        ...currentLog,
        publicLeadActivity(message, note)
      ].slice(-30)
    });

    return { success: true };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    console.error('Error updating public lead:', error);
    throw new functions.https.HttpsError('internal', 'Unable to update lead');
  }
});

exports.sendLeadMessageNotifications = functions.database
  .ref('/leads/{leadId}')
  .onWrite(async (change, context) => {
    if (!change.after.exists()) return null;

    const leadId = context.params.leadId;
    const beforeLead = change.before.exists() ? change.before.val() : null;
    const afterLead = change.after.val() || {};
    const created = !change.before.exists();
    const triggerIds = getLeadTriggerIds(beforeLead, afterLead, created);

    try {
      const templatesSnapshot = await admin.database().ref(LEAD_TEMPLATE_PATH).once('value');
      const templates = templatesSnapshot.val() || {};
      const enabledTemplates = Object.entries(templates)
        .map(([id, template]) => ({ id, ...template }))
        .filter(template => template.enabled !== false)
        .filter(template => {
          const templateTriggers = Array.isArray(template.triggers) ? template.triggers : [];
          return templateTriggers.some(trigger => triggerIds.includes(trigger));
        });

      if (enabledTemplates.length === 0) {
        console.log('No lead message templates matched triggers:', triggerIds);
        return null;
      }

      const responses = await Promise.all(enabledTemplates.map(async (template) => {
        const rawBody = template.editorMode === 'html' ? template.html : template.richText;
        const title = interpolateLeadMessage(template.title || 'Lead update', afterLead).slice(0, 120);
        const body = stripHtml(interpolateLeadMessage(rawBody || '', afterLead)).slice(0, 240);
        const topic = cleanOptionalString(template.audienceTopic, 80) || 'admin-leads';

        const payload = {
          topic,
          notification: {
            title,
            body: body || `${afterLead.companyName || 'A lead'} was updated`
          },
          data: {
            type: 'lead',
            leadId,
            templateId: template.id,
            triggers: triggerIds.join(','),
            url: '/admin',
            timestamp: new Date().toISOString()
          },
          webpush: {
            headers: {
              Urgency: triggerIds.includes('lead_created') || triggerIds.includes('followup_due') ? 'high' : 'normal',
              TTL: '86400'
            },
            notification: {
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-72x72.png',
              tag: `lead-${leadId}-${template.id}`
            },
            fcm_options: {
              link: '/admin'
            }
          }
        };

        const response = await admin.messaging().send(payload);
        await admin.database().ref(LEAD_NOTIFICATION_LOG_PATH).push({
          leadId,
          templateId: template.id,
          topic,
          title,
          body: payload.notification.body,
          triggers: triggerIds,
          response,
          sentAt: new Date().toISOString()
        });
        return response;
      }));

      console.log('Lead message notifications sent:', responses.length);
      return responses;
    } catch (error) {
      console.error('Error sending lead message notifications:', error);
      return null;
    }
  });

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

  // City post entries are often mirrors of the canonical /posts entry.
  // The canonical post already targets city topics, so skip mirrored writes.
  if (cityId && post.mainPostId) {
    console.log('City post mirrors main post, skipping duplicate notification');
    return null;
  }

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
    const previousTokenData = change.before.val();

    // If token was deleted, skip
    if (!tokenData || !tokenData.token) {
      console.log('Token deleted or invalid, skipping subscription');
      return null;
    }

    const { token } = tokenData;
    const topics = Array.isArray(tokenData.topics) ? tokenData.topics : [];
    const previousTopics = Array.isArray(previousTokenData?.topics) ? previousTokenData.topics : [];
    const topicsChanged = JSON.stringify([...topics].sort()) !== JSON.stringify([...previousTopics].sort());
    const tokenChanged = token !== previousTokenData?.token;

    if (!tokenChanged && !topicsChanged) {
      console.log('FCM token and topics unchanged, skipping subscription');
      return null;
    }

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
