// =============================================
// src/utils/notificationManager.js
// Centralized notification and badge management
// =============================================
import { fcmMessaging, firebaseAuth, db } from '../firebase-config';
import { getToken, onMessage } from 'firebase/messaging';
import { ref, set, update, serverTimestamp } from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase-config';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

class NotificationManager {
  constructor() {
    this.token = null;
    this.isInitialized = false;
  }

  // Check if notifications are supported
  isSupported() {
    // Check if we're in a secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost';
    
    return (
      isSecureContext &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      fcmMessaging !== null
    );
  }

  // Initialize notifications on app install/first run
  async initialize() {
    if (this.isInitialized) {
      return false;
    }

    if (!this.isSupported()) {
      console.log('Push notifications not supported in this browser/environment');
      return false;
    }

    try {
      // Request permission
      const permission = await this.requestPermission();
      if (!permission) {
        console.log('Notification permission denied');
        return false;
      }

      // Get FCM token
      this.token = await this.getToken();
      if (!this.token) {
        console.log('Failed to get FCM token');
        return false;
      }

      // Subscribe to default topics
      await this.subscribeToDefaultTopics();

      // Setup foreground message listener
      this.setupForegroundListener();

      // Clear badge on app open
      this.clearBadge();

      this.isInitialized = true;
      console.log('Notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  // Get FCM token
  async getToken() {
    if (!this.isSupported() || !fcmMessaging) {
      return null;
    }

    try {
      const currentToken = await getToken(fcmMessaging, {
        vapidKey: VAPID_KEY
      });

      if (currentToken) {
        console.log('FCM Token:', currentToken);
        this.token = currentToken;

        // Save token to database if user is logged in
        const user = firebaseAuth.currentUser;
        if (user) {
          await this.saveTokenToDatabase(user.uid, currentToken);
        }

        return currentToken;
      } else {
        console.log('No registration token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Save token to Firebase database
  async saveTokenToDatabase(userId, token) {
    try {
      const tokenRef = ref(db, `fcmTokens/${userId}`);
      await set(tokenRef, {
        token: token,
        createdAt: serverTimestamp(),
        lastUsed: serverTimestamp(),
        device: this.getDeviceInfo()
      });
      console.log('Token saved to database');
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  // Get device information
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen: {
        width: window.screen.width,
        height: window.screen.height
      }
    };
  }

  // Subscribe to default topics
  async subscribeToDefaultTopics() {
    if (!this.token) {
      console.log('No token available for subscription');
      return false;
    }

    try {
      const user = firebaseAuth.currentUser;
      if (!user) {
        console.log('User not authenticated, skipping topic subscription');
        return false;
      }

      // Call cloud function to subscribe
      const subscribeToTopics = httpsCallable(functions, 'subscribeToTopics');
      const result = await subscribeToTopics({
        token: this.token,
        topics: ['all-news', 'breaking-news']
      });

      console.log('Subscribed to topics:', result.data);
      return true;
    } catch (error) {
      console.error('Error subscribing to topics:', error);
      return false;
    }
  }

  // Setup foreground message listener
  setupForegroundListener() {
    if (!this.isSupported() || !fcmMessaging) {
      return;
    }

    onMessage(fcmMessaging, (payload) => {
      console.log('Foreground notification received:', payload);

      const { notification, data } = payload;

      // Show notification
      this.showNotification({
        title: notification?.title || 'Our Vadodara',
        body: notification?.body || 'New update',
        icon: notification?.icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: data || {}
      });

      // Increment badge
      this.incrementBadge();
    });
  }

  // Show notification
  showNotification({ title, body, icon, badge, data }) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification(title, {
      body,
      icon,
      badge,
      tag: data.tag || 'our-vadodara',
      renotify: true,
      vibrate: [200, 100, 200],
      data
    });

    notification.onclick = () => {
      window.focus();
      notification.close();

      // Navigate to the relevant page
      if (data.postId) {
        window.location.href = `/post/${data.postId}`;
      } else if (data.url) {
        window.location.href = data.url;
      }

      // Decrement badge
      this.decrementBadge();
    };
  }

  // Badge management
  async incrementBadge() {
    if (!navigator.setAppBadge) {
      console.log('Badge API not supported');
      return;
    }

    try {
      const currentCount = await this.getBadgeCount();
      const newCount = currentCount + 1;
      await navigator.setAppBadge(newCount);
      await this.saveBadgeCount(newCount);
      console.log('Badge incremented to:', newCount);
    } catch (error) {
      console.error('Error incrementing badge:', error);
    }
  }

  async decrementBadge() {
    if (!navigator.setAppBadge) {
      return;
    }

    try {
      const currentCount = await this.getBadgeCount();
      const newCount = Math.max(0, currentCount - 1);
      
      if (newCount === 0) {
        await navigator.clearAppBadge();
      } else {
        await navigator.setAppBadge(newCount);
      }
      
      await this.saveBadgeCount(newCount);
      console.log('Badge decremented to:', newCount);
    } catch (error) {
      console.error('Error decrementing badge:', error);
    }
  }

  async clearBadge() {
    if (!navigator.clearAppBadge) {
      return;
    }

    try {
      await navigator.clearAppBadge();
      await this.saveBadgeCount(0);
      
      // Also send message to service worker
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_BADGE' });
      }
      
      console.log('Badge cleared');
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  }

  // Badge count storage (using localStorage)
  async getBadgeCount() {
    try {
      const count = localStorage.getItem('badgeCount');
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      return 0;
    }
  }

  async saveBadgeCount(count) {
    try {
      localStorage.setItem('badgeCount', count.toString());
    } catch (error) {
      console.error('Error saving badge count:', error);
    }
  }

  // Unsubscribe from topics
  async unsubscribeFromTopics(topics) {
    if (!this.token) {
      return false;
    }

    try {
      const unsubscribeFromTopics = httpsCallable(functions, 'unsubscribeFromTopics');
      await unsubscribeFromTopics({
        token: this.token,
        topics: topics
      });
      console.log('Unsubscribed from topics:', topics);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from topics:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();

// Helper function to initialize on app install
export const initializeNotifications = async () => {
  return await notificationManager.initialize();
};

// Helper to check permission status
export const getNotificationPermission = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

export default notificationManager;
