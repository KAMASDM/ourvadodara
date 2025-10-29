// =============================================
// src/utils/pushNotifications.js
// Firebase Cloud Messaging (FCM) Push Notifications
// =============================================
import { fcmMessaging, getToken, onMessage } from '../firebase-config';

// FCM Vapid Key - Add your Firebase Project's Vapid Key
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

class PushNotificationService {
  constructor() {
    this.token = null;
    this.isSupported = this.checkSupport();
  }

  checkSupport() {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window &&
      fcmMessaging !== null
    );
  }

  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      return true;
    } else {
      console.log('Notification permission denied');
      return false;
    }
  }

  async getRegistrationToken() {
    if (!this.isSupported || !fcmMessaging) {
      throw new Error('FCM not supported');
    }

    try {
      const token = await getToken(fcmMessaging, {
        vapidKey: VAPID_KEY
      });

      if (token) {
        console.log('FCM Registration token:', token);
        this.token = token;
        return token;
      } else {
        console.log('No registration token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      throw error;
    }
  }

  async subscribeToTopic(userId, topics = []) {
    try {
      const token = this.token || await this.getRegistrationToken();
      
      if (!token) {
        throw new Error('No FCM token available');
      }

      // Subscribe to default topics
      const defaultTopics = [
        'all-users',
        'breaking-news',
        'local-news'
      ];

      const allTopics = [...defaultTopics, ...topics, `user-${userId}`];

      // Send subscription request to your backend
      const response = await fetch('/api/fcm/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          topics: allTopics,
          userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe to topics');
      }

      console.log('Successfully subscribed to topics:', allTopics);
      return allTopics;
    } catch (error) {
      console.error('Error subscribing to topics:', error);
      throw error;
    }
  }

  setupForegroundMessageListener() {
    if (!this.isSupported || !fcmMessaging) return;

    onMessage(fcmMessaging, (payload) => {
      console.log('Foreground message received:', payload);

      const { notification, data } = payload;

      // Show custom notification
      this.showCustomNotification({
        title: notification?.title || 'Our Vadodara',
        body: notification?.body || 'New update available',
        icon: notification?.icon || '/icons/icon-192x192.png',
        badge: notification?.badge || '/icons/icon-72x72.png',
        data: data || {}
      });
    });
  }

  showCustomNotification({ title, body, icon, badge, data }) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon,
        badge,
        tag: data.tag || 'our-vadodara-notification',
        renotify: true,
        vibrate: [200, 100, 200],
        data
      });

      notification.onclick = () => {
        window.focus();
        
        // Handle notification click based on data
        if (data.url) {
          window.location.href = data.url;
        } else if (data.postId) {
          // Navigate to specific post
          window.location.href = `/?post=${data.postId}`;
        }
        
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }

  async sendNotification(notification) {
    try {
      // Send notification via your backend API
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(notification)
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      const result = await response.json();
      console.log('Notification sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Helper method to get auth token (implement based on your auth system)
  getAuthToken() {
    // Return user's authentication token
    return localStorage.getItem('authToken') || '';
  }

  async init(userId) {
    try {
      if (!this.isSupported) {
        console.warn('Push notifications not supported');
        return false;
      }

      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return false;
      }

      // Get FCM token
      const token = await this.getRegistrationToken();
      if (!token) {
        return false;
      }

      // Subscribe to topics
      await this.subscribeToTopic(userId);

      // Setup message listener
      this.setupForegroundMessageListener();

      console.log('Push notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Export notification types for admin use
export const NOTIFICATION_TYPES = {
  BREAKING_NEWS: 'breaking_news',
  LOCAL_UPDATE: 'local_update',
  EVENT_REMINDER: 'event_reminder',
  SYSTEM_ALERT: 'system_alert',
  USER_MENTION: 'user_mention',
  COMMENT_REPLY: 'comment_reply'
};

// Export notification templates
export const NOTIFICATION_TEMPLATES = {
  [NOTIFICATION_TYPES.BREAKING_NEWS]: {
    title: 'Breaking News',
    icon: '/icons/breaking-news.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [300, 100, 300, 100, 300]
  },
  [NOTIFICATION_TYPES.LOCAL_UPDATE]: {
    title: 'Local Update',
    icon: '/icons/local-news.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200]
  },
  [NOTIFICATION_TYPES.EVENT_REMINDER]: {
    title: 'Event Reminder',
    icon: '/icons/event.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100]
  }
};