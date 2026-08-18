// =============================================
// src/utils/notificationManager.js
// Centralized notification and badge management
// =============================================
import { fcmMessaging, firebaseAuth } from '../firebase-config';
import { getToken, onMessage } from 'firebase/messaging';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase-config';
import { getFirebaseMessagingRegistration } from './firebaseMessagingRegistration';

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
      'indexedDB' in window &&
      fcmMessaging !== null
    );
  }

  // Initialize notifications on app install/first run
  async initialize() {
    if (this.isInitialized) {
      // Already set up this session — report success so UI toggles reflect
      // the enabled state instead of silently showing "off".
      return true;
    }

    // Early return if not supported - don't log anything
    if (!this.isSupported()) {
      return false;
    }

    try {
      // Request permission
      const permission = await this.requestPermission();
      if (!permission) {
        return false;
      }

      // Get FCM token
      this.token = await this.getToken();
      if (!this.token) {
        return false;
      }

      // Subscribe to default topics
      await this.subscribeToDefaultTopics();

      // Setup foreground message listener
      this.setupForegroundListener();

      // Registration may have completed after the Firebase unread listener
      // first ran. Seed the worker with the already-synchronized count.
      await this.setBadgeCount(await this.getBadgeCount());

      this.isInitialized = true;
      console.log('✅ Notifications initialized successfully');
      return true;
    } catch (error) {
      // Silent fail - notifications are optional
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
    // Early return if not supported - avoid IndexedDB access
    if (!this.isSupported() || !fcmMessaging) {
      return null;
    }

    // Additional check for IndexedDB availability
    if (!window.indexedDB) {
      console.log('IndexedDB not available');
      return null;
    }

    try {
      // Wait for service worker to be ready before getting token
      const registration = await getFirebaseMessagingRegistration();
      if (!registration || !registration.active) {
        console.log('No active service worker');
        return null;
      }

      const currentToken = await getToken(fcmMessaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (currentToken) {
        this.token = currentToken;

        return currentToken;
      } else {
        console.log('No registration token available');
        return null;
      }
    } catch (error) {
      // Silent fail - notifications are optional feature
      return null;
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

  // Send a real FCM notification to the current signed-in user's device.
  async sendTestNotification() {
    const user = firebaseAuth.currentUser;
    if (!user) {
      const error = new Error('Please sign in before sending a test notification.');
      error.code = 'unauthenticated';
      throw error;
    }

    if (!this.isSupported()) {
      const error = new Error('Push notifications are not supported in this browser.');
      error.code = 'unsupported';
      throw error;
    }

    if (!this.isInitialized || !this.token) {
      const initialized = await this.initialize();
      if (!initialized || !this.token) {
        const error = new Error('Notifications could not be enabled on this device.');
        error.code = Notification.permission === 'denied' ? 'permission-denied' : 'registration-failed';
        throw error;
      }
    }

    const sendTestNotification = httpsCallable(functions, 'sendTestNotification');
    const result = await sendTestNotification();
    return result.data;
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
      if (data.url) {
        window.location.href = data.url;
      } else if (data.postId) {
        window.location.href = `/post/${data.postId}`;
      }

    };
  }

  // Badge management
  async setBadgeCount(count) {
    const normalizedCount = Math.max(0, Number(count) || 0);

    try {
      if (normalizedCount > 0 && navigator.setAppBadge) {
        await navigator.setAppBadge(normalizedCount);
      } else if (normalizedCount === 0 && navigator.clearAppBadge) {
        await navigator.clearAppBadge();
      }

      await this.saveBadgeCount(normalizedCount);

      // Keep the service worker's background counter aligned with Firebase's
      // unread count. It can then increment the correct value while the app is
      // closed and a push arrives.
      if (navigator.serviceWorker) {
        const registrations = await navigator.serviceWorker.getRegistrations().catch(() => []);
        const workers = new Set([
          navigator.serviceWorker.controller,
          ...registrations.map(registration => registration.active),
        ].filter(Boolean));
        workers.forEach(worker => {
          worker.postMessage({ type: 'SET_BADGE_COUNT', count: normalizedCount });
        });
      }
    } catch (error) {
      // Badging is an optional, platform-dependent enhancement. Persist the
      // count even if the operating system declines to display it.
      await this.saveBadgeCount(normalizedCount);
      console.warn('Unable to update app badge:', error);
    }
  }

  async incrementBadge() {
    try {
      const currentCount = await this.getBadgeCount();
      await this.setBadgeCount(currentCount + 1);
    } catch (error) {
      console.error('Error incrementing badge:', error);
    }
  }

  async decrementBadge() {
    try {
      const currentCount = await this.getBadgeCount();
      await this.setBadgeCount(currentCount - 1);
    } catch (error) {
      console.error('Error decrementing badge:', error);
    }
  }

  async clearBadge() {
    await this.setBadgeCount(0);
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
