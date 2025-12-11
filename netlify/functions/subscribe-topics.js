// =============================================
// Netlify Function: Subscribe to Topics
// Uses Firebase Admin SDK to manage topic subscriptions
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
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { token, topics = [], userId } = JSON.parse(event.body);

    if (!token || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: token, userId' })
      };
    }

    // Initialize Firebase Admin
    const app = getAdminApp();
    const messaging = getMessaging(app);

    // Subscribe token to each topic
    const subscriptionResults = await Promise.allSettled(
      topics.map(topic =>
        messaging.subscribeToTopic(token, topic)
          .then(() => ({ topic, success: true }))
          .catch(error => ({ topic, success: false, error: error.message }))
      )
    );

    const results = subscriptionResults.map(result => 
      result.status === 'fulfilled' ? result.value : result.reason
    );

    const successCount = results.filter(r => r.success).length;

    console.log(`Token subscribed to ${successCount}/${topics.length} topics`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Token subscribed to topics',
        results: results,
        userId
      })
    };

  } catch (error) {
    console.error('Error subscribing to topics:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
