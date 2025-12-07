# Push Notifications Setup Guide

## Overview
The app now supports push notifications when new news articles are published, with badge counter on the app icon.

## Features
- ✅ Automatic notification when new news is published
- ✅ Breaking news notifications with high priority
- ✅ Red badge counter on app icon showing unread notifications
- ✅ Auto-subscribe to notifications on app install
- ✅ Clear badge when app is opened or notification is clicked
- ✅ Foreground and background notification support

## Setup Instructions

### 1. Firebase Cloud Functions Setup

Install dependencies:
```bash
cd functions
npm install
```

Deploy functions:
```bash
firebase deploy --only functions
```

### 2. Get Firebase VAPID Key

1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Under "Web Push certificates", click "Generate key pair"
3. Copy the generated key
4. Add to `.env`:
```
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
```

### 3. Update Firebase Config in Service Worker

Edit `public/firebase-messaging-sw.js` and replace the placeholder config with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Firebase Database Rules

Add these rules to allow notification token storage:

```json
{
  "rules": {
    "fcmTokens": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "users": {
      "$uid": {
        "unreadNotifications": {
          ".read": "$uid === auth.uid",
          ".write": true
        }
      }
    }
  }
}
```

## How It Works

### 1. On App Install
- User is automatically prompted for notification permission
- FCM token is generated and saved to database
- User is subscribed to default topics: `all-news` and `breaking-news`

### 2. When Admin Publishes News
- Cloud Function `sendNewNewsNotification` triggers
- Notification sent to all users subscribed to `all-news` topic
- Breaking news sent to `breaking-news` topic with high priority
- Badge count incremented for all users

### 3. User Receives Notification
- **Background**: Service worker shows notification with badge
- **Foreground**: In-app notification shown with badge increment
- Badge counter shows on app icon (iOS/Android)

### 4. User Interacts
- **Opens App**: Badge cleared automatically
- **Clicks Notification**: Navigates to article, badge decremented
- **Dismisses Notification**: Badge remains until app opened

## Cloud Functions

### `sendNewNewsNotification`
Triggered when new post is created in `/posts/{postId}`
- Sends notification to subscribed users
- Updates badge count
- Marks notification as sent

### `sendBreakingNewsNotification`
Triggered when breaking news created in `/breakingNews/{newsId}`
- High priority notification
- Persistent notification (requireInteraction: true)
- Special vibration pattern

### `subscribeToTopics`
Callable function to subscribe user to FCM topics
- Auto-subscribes to: `all-news`, `breaking-news`
- Saves subscription to database

### `clearBadgeCount`
Callable function to reset badge count
- Called when user opens app
- Updates database

## Badge API Support

### Browser Support
- ✅ **Chrome/Edge** (Android, Windows, macOS)
- ✅ **Safari** (macOS, iOS)
- ✅ **Opera**
- ❌ Firefox (not yet supported)

### Fallback
For browsers without Badge API, notifications still work but no badge counter is shown on app icon.

## Testing

### Test Notifications Locally

1. **Manual Test via Firebase Console**:
   - Go to Firebase Console → Cloud Messaging
   - Send test message to your FCM token
   - Select topic: `all-news`

2. **Test via Cloud Functions**:
   ```bash
   # Create a test post
   firebase database:update /posts/test-123 --data '{"title":{"en":"Test"},"isPublished":true,"status":"published"}'
   ```

3. **Test Badge**:
   ```javascript
   // In browser console
   navigator.setAppBadge(5); // Set badge to 5
   navigator.clearAppBadge(); // Clear badge
   ```

## Admin Workflow

When publishing news from admin panel:
1. Admin creates/publishes post
2. Cloud Function auto-triggers
3. Notification sent to all users
4. Users see notification + badge counter
5. Users click → Navigate to article
6. Badge auto-clears when app opens

## Notification Structure

```json
{
  "notification": {
    "title": "📰 Article Title",
    "body": "Article excerpt...",
    "icon": "/icons/icon-192x192.png",
    "badge": "/icons/icon-72x72.png"
  },
  "data": {
    "postId": "post-id",
    "type": "news",
    "category": "local",
    "url": "/post/post-id"
  }
}
```

## Troubleshooting

### Notifications Not Working
1. Check if permission is granted: `Notification.permission`
2. Verify FCM token generated: Check console logs
3. Check service worker is active: DevTools → Application → Service Workers
4. Verify Firebase config in service worker matches your project

### Badge Not Showing
1. Check browser support: `'setAppBadge' in navigator`
2. Ensure app is installed as PWA
3. Check manifest.json has proper icons
4. Clear browser cache and reinstall PWA

### Functions Not Triggering
1. Check Firebase Functions logs: `firebase functions:log`
2. Verify database rules allow writes
3. Check post has `isPublished: true` and `status: 'published'`
4. Ensure functions are deployed: `firebase deploy --only functions`

## Environment Variables

Required in `.env`:
```
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

## Files Modified
- `functions/index.js` - Cloud Functions for notifications
- `functions/package.json` - Dependencies
- `public/firebase-messaging-sw.js` - Service worker with badge support
- `src/utils/notificationManager.js` - Notification manager utility
- `src/App.jsx` - Initialize notifications on app start

## Next Steps
1. Test notifications in production
2. Customize notification sounds
3. Add notification preferences in user settings
4. Implement notification history
5. Add rich media notifications (images, actions)
