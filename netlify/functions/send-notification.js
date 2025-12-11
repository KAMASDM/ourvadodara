// =============================================
// Netlify Function: Send Push Notification
// Uses Firebase Admin SDK (modern approach)
// =============================================
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin (only once)
let adminApp;
const getAdminApp = () => {
  if (!adminApp && getApps().length === 0) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    adminApp = initializeApp({
      credential: cert(serviceAccount)
    });
  }
  return adminApp || getApps()[0];
};

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { post, fcmTokens, cityId } = JSON.parse(event.body);

    if (!post || !fcmTokens || fcmTokens.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: post, fcmTokens' })
      };
    }

    // Initialize Firebase Admin
    const app = getAdminApp();
    const messaging = getMessaging(app);

    // Build notification payload
    const title = post.title?.en || post.title || 'New Article Published';
    const body = post.excerpt?.en || post.content?.en?.substring(0, 100) || 'Check out the latest news';
    
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

    const notificationTitle = post.isBreaking ? `🚨 BREAKING: ${title}` : `📰 ${title}`;
    
    // Prepare messages for each token using FCM v1 format
    const messages = fcmTokens.map(tokenData => ({
      token: tokenData.token,
      notification: {
        title: notificationTitle,
        body: body,
        imageUrl: imageUrl || undefined
      },
      data: {
        postId: post.id,
        type: 'news',
        category: post.category || 'news',
        cityId: cityId || '',
        url: `/?post=${post.id}`,
        timestamp: new Date().toISOString()
      },
      webpush: {
        headers: {
          Urgency: post.isBreaking ? 'high' : 'normal',
          TTL: '86400'
        },
        notification: {
          icon: imageUrl || '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          image: imageUrl || undefined,
          vibrate: post.isBreaking ? [200, 100, 200, 100, 200] : [200, 100, 200],
          actions: [
            {
              action: 'view',
              title: 'Read Now'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        },
        fcmOptions: {
          link: `${process.env.URL}/?post=${post.id}`
        }
      }
    }));

    // Send notifications in batch (FCM allows up to 500 per batch)
    const batchSize = 500;
    const results = [];
    
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(message => messaging.send(message))
      );
      
      results.push(...batchResults);
    }

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    console.log(`Notifications sent: ${successCount} success, ${failureCount} failed`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Notifications sent',
        successCount,
        failureCount,
        total: results.length
      })
    };

  } catch (error) {
    console.error('Error sending notifications:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
