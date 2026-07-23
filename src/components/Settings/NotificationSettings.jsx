// =============================================
// src/components/Settings/NotificationSettings.jsx
// =============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, BellOff, Smartphone, Mail, MessageSquare, AlertCircle, CheckCircle, Send } from 'lucide-react';
import notificationManager, { initializeNotifications } from '../../utils/notificationManager.js';
import { onValue, ref, set } from 'firebase/database';
import { db } from '../../firebase-config';
import { useAuth } from '../../context/Auth/AuthContext';

const getPermission = () =>
  (typeof Notification !== 'undefined' ? Notification.permission : 'default');

const NotificationSettings = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const permissionGranted = getPermission() === 'granted';
  const [settings, setSettings] = useState({
    pushNotifications: permissionGranted,
    emailNotifications: false,
    smsNotifications: false,
    breakingNews: true,
    dailyDigest: true,
    categoryUpdates: false,
    commentReplies: true,
    soundEnabled: true
  });
  const [pushStatus, setPushStatus] = useState(getPermission()); // 'default' | 'granted' | 'denied'
  const [enabling, setEnabling] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [savedSettings, setSavedSettings] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setPushStatus(getPermission());
  }, []);

  useEffect(() => {
    if (!user?.uid) return undefined;
    return onValue(ref(db, `notificationPreferences/${user.uid}`), snapshot => {
      if (!snapshot.exists()) return;
      const loaded = { ...settings, ...snapshot.val(), pushNotifications: getPermission() === 'granted' && snapshot.val()?.pushNotifications !== false };
      setSettings(loaded);
      setSavedSettings(loaded);
    });
  // Preferences are loaded once per signed-in user.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const saveSettings = async () => {
    if (!user?.uid) return;
    await set(ref(db, `notificationPreferences/${user.uid}`), { ...settings, updatedAt: Date.now() });
    setSavedSettings(settings);
    setSaveMessage('Preferences saved.');
  };

  const cancelChanges = () => {
    if (savedSettings) setSettings(savedSettings);
    setSaveMessage('Changes discarded.');
  };

  const handleTogglePush = async () => {
    // Turning OFF: browsers can't revoke permission programmatically, so just
    // reflect intent and point the user to browser settings.
    if (settings.pushNotifications) {
      setSettings(prev => ({ ...prev, pushNotifications: false }));
      return;
    }

    if (getPermission() === 'denied') {
      setPushStatus('denied');
      return;
    }

    // Turning ON: request permission + register token + subscribe to topics.
    // This must run from a user gesture, which is exactly what this click is.
    setEnabling(true);
    try {
      const ok = await initializeNotifications();
      setPushStatus(getPermission());
      setSettings(prev => ({ ...prev, pushNotifications: ok }));
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      setPushStatus(getPermission());
    } finally {
      setEnabling(false);
    }
  };

  const handleToggle = (setting) => {
    if (setting === 'pushNotifications') {
      handleTogglePush();
      return;
    }
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSendTestNotification = async () => {
    if (sendingTest) return;
    setSendingTest(true);
    setTestMessage('');

    try {
      await notificationManager.sendTestNotification();
      setTestMessage('Test notification sent. It may take a few seconds to appear.');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      const code = String(error?.code || '');
      if (code.includes('unauthenticated')) {
        setTestMessage('Please sign in before sending a test notification.');
      } else if (code.includes('permission-denied')) {
        setTestMessage('Notifications are blocked. Allow them in your browser or device settings and try again.');
      } else if (code.includes('failed-precondition') || code.includes('registration-failed')) {
        setTestMessage('This device is not registered for notifications yet. Turn Push Notifications off and on, then try again.');
      } else if (code.includes('resource-exhausted')) {
        setTestMessage('Please wait a few seconds before sending another test.');
      } else if (code.includes('unsupported')) {
        setTestMessage('Push notifications are not supported in this browser. On iPhone, install the app to your Home Screen first.');
      } else {
        setTestMessage(error?.message || 'We could not send the test notification. Please try again.');
      }
    } finally {
      setSendingTest(false);
    }
  };

  const NotificationToggle = ({ id, title, description, icon: Icon, enabled }) => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${enabled ? 'bg-primary-100 dark:bg-primary-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
          <Icon className={`w-5 h-5 ${enabled ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <button
        onClick={() => handleToggle(id)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('notifications.settings')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {t('notifications.manage_preferences')}
        </p>
      </div>

      {pushStatus === 'denied' && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Notifications are blocked</p>
            <p>You've blocked notifications for this site. Enable them in your browser's site settings (the lock icon in the address bar), then reload.</p>
          </div>
        </div>
      )}
      {pushStatus === 'granted' && settings.pushNotifications && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">Push notifications are on. You'll get the latest Vadodara news as it's published.</p>
          </div>
          <button
            type="button"
            onClick={handleSendTestNotification}
            disabled={sendingTest}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:cursor-wait disabled:opacity-60 dark:bg-green-600 dark:hover:bg-green-500"
          >
            <Send className="h-4 w-4" />
            {sendingTest ? 'Sending…' : 'Send me a test notification'}
          </button>
          {testMessage && <p className="mt-2 text-xs">{testMessage}</p>}
        </div>
      )}

      <div className="space-y-4">
        <NotificationToggle
          id="pushNotifications"
          title={enabling ? 'Enabling…' : t('notifications.push_notifications')}
          description={t('notifications.push_description')}
          icon={Bell}
          enabled={settings.pushNotifications}
        />

        <NotificationToggle
          id="emailNotifications"
          title={t('notifications.email_notifications')}
          description={t('notifications.email_description')}
          icon={Mail}
          enabled={settings.emailNotifications}
        />

        <NotificationToggle
          id="smsNotifications"
          title={t('notifications.sms_notifications')}
          description={t('notifications.sms_description')}
          icon={Smartphone}
          enabled={settings.smsNotifications}
        />

        <NotificationToggle
          id="breakingNews"
          title={t('notifications.breaking_news')}
          description={t('notifications.breaking_news_description')}
          icon={Bell}
          enabled={settings.breakingNews}
        />

        <NotificationToggle
          id="dailyDigest"
          title={t('notifications.daily_digest')}
          description={t('notifications.daily_digest_description')}
          icon={MessageSquare}
          enabled={settings.dailyDigest}
        />

        <NotificationToggle
          id="categoryUpdates"
          title={t('notifications.category_updates')}
          description={t('notifications.category_updates_description')}
          icon={Bell}
          enabled={settings.categoryUpdates}
        />

        <NotificationToggle
          id="commentReplies"
          title={t('notifications.comment_replies')}
          description={t('notifications.comment_replies_description')}
          icon={MessageSquare}
          enabled={settings.commentReplies}
        />

        <NotificationToggle
          id="soundEnabled"
          title={t('notifications.sound_enabled')}
          description={t('notifications.sound_description')}
          icon={settings.soundEnabled ? Bell : BellOff}
          enabled={settings.soundEnabled}
        />
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-medium text-blue-900 dark:text-blue-100">
            {t('notifications.note_title')}
          </h3>
        </div>
        <p className="mt-2 text-sm text-blue-700 dark:text-blue-200">
          {t('notifications.note_description')}
        </p>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        {saveMessage && <span className="self-center text-sm text-gray-500">{saveMessage}</span>}
        <button onClick={cancelChanges} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          {t('common.cancel')}
        </button>
        <button onClick={saveSettings} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          {t('common.save_changes')}
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;
