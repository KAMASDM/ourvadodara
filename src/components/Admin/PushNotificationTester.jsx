// =============================================
// Push Notification Manual Tester for Admin
// Use this until Cloud Functions are deployed
// =============================================
import React, { useState } from 'react';
import { Bell, Send } from 'lucide-react';

const PushNotificationTester = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const sendTestNotification = async () => {
    if (!title || !body) {
      alert('Please fill in both title and body');
      return;
    }

    setSending(true);
    try {
      // Check if user has granted permission
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Notification permission denied');
          setSending(false);
          return;
        }
      }

      // Send local notification (simulates push notification)
      const notification = new Notification(title, {
        body: body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: 'test-notification',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => {
        notification.close();
      }, 5000);

      alert('Test notification sent!');
      setTitle('');
      setBody('');
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Error sending notification: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Push Notification Tester
        </h3>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Test push notifications locally. Note: This sends a browser notification, not a Firebase Cloud Messaging notification.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notification Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Breaking News: New Article Published"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notification Body
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Check out the latest news from your city..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          />
        </div>

        <button
          onClick={sendTestNotification}
          disabled={sending || !title || !body}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {sending ? 'Sending...' : 'Send Test Notification'}
        </button>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Note:</strong> To enable real push notifications from Cloud Functions:
        </p>
        <ol className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 ml-4 list-decimal space-y-1">
          <li>Upgrade Firebase project to Blaze (pay-as-you-go) plan</li>
          <li>Run: <code className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-900 rounded">firebase deploy --only functions</code></li>
          <li>Cloud Functions will automatically send notifications when new posts are published</li>
        </ol>
      </div>
    </div>
  );
};

export default PushNotificationTester;
