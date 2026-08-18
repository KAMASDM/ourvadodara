// =============================================
// src/utils/pushNotifications.js
// Firebase Cloud Messaging (FCM) Push Notifications
// =============================================
import { fcmMessaging, functions, getToken, httpsCallable, onMessage } from '../firebase-config';
import { getFirebaseMessagingRegistration } from './firebaseMessagingRegistration';

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
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: await getFirebaseMessagingRegistration()
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

      // Default topics that all users subscribe to
      const defaultTopics = [
        'all-news',
        'breaking-news'
      ];

      const allTopics = [...new Set([...defaultTopics, ...topics])];

      // Topic authorization and token ownership are enforced server-side.
      const subscribe = httpsCallable(functions, 'subscribeToTopics');
      const result = await subscribe({ token, topics: allTopics });

      console.log('Successfully stored FCM token with topics:', result.data?.topics || allTopics);
      return result.data?.topics || allTopics;
    } catch (error) {
      console.error('Error subscribing to topics:', error);
      throw error;
    }
  }

  async subscribeToCityTopic(cityId) {
    try {
      const token = this.token || await this.getRegistrationToken();
      
      if (!token || !cityId) {
        return false;
      }

      const cityTopic = `city-${cityId}`;
      const subscribe = httpsCallable(functions, 'subscribeToTopics');
      await subscribe({ token, topics: [cityTopic] });

      console.log('Successfully subscribed to city topic:', cityTopic);
      return true;
    } catch (error) {
      console.error('Error subscribing to city topic:', error);
      return false;
    }
  }

  setupForegroundMessageListener() {
    if (!this.isSupported || !fcmMessaging) return;

    onMessage(fcmMessaging, (payload) => {
      console.log('Foreground message received:', payload);
      this.showRichNotification(payload);
    });
  }

  // Render a notification that matches the background service-worker card:
  // hero image, category/breaking label, clean (HTML-stripped) body.
  async showRichNotification(payload) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const data = payload.data || {};
    const notification = payload.notification || {};

    const strip = (value) => String(value || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&#39;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/\s+/g, ' ')
      .trim();

    const isBreaking = data.isBreaking === 'true';
    const title = strip(data.title || notification.title || 'Our Vadodara');
    const rawBody = strip(data.body || notification.body || '');
    const categoryLabel = strip(data.categoryLabel || data.category || '');
    const label = isBreaking ? '🔴 BREAKING' : categoryLabel.toUpperCase();
    const bodyText = rawBody || 'Tap to read the full story.';
    const body = label ? `${label}  •  ${bodyText}` : bodyText;
    const image = data.image || notification.image || '';

    const options = {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: `${data.type || 'news'}-${data.postId || Date.now()}`,
      renotify: true,
      requireInteraction: isBreaking,
      vibrate: isBreaking ? [200, 100, 200, 100, 200] : [200, 100, 200],
      data: {
        url: data.url || (data.postId ? `/post/${data.postId}` : '/'),
        postId: data.postId || '',
        type: data.type || 'news'
      },
      actions: [
        { action: 'view', title: 'Read Now' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };
    if (image) options.image = image;

    // The Notification constructor cannot render images or actions, so prefer
    // the service-worker registration which can.
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return;
      }
    } catch (error) {
      console.warn('SW notification failed, falling back to Notification():', error);
    }

    const fallback = new Notification(title, { body, icon: options.icon, badge: options.badge, data: options.data });
    fallback.onclick = () => {
      window.focus();
      window.location.href = options.data.url;
      fallback.close();
    };
    setTimeout(() => fallback.close(), 6000);
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

  async init(userId, topics = []) {
    try {
      if (!this.isSupported) {
        // Expected on desktop browsers / non-secure contexts; not an error.
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
      await this.subscribeToTopic(userId, topics);

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
