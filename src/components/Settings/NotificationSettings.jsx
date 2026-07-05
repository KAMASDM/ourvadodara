// =============================================
// src/components/Settings/NotificationSettings.jsx
// =============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, BellOff, Smartphone, Mail, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { initializeNotifications } from '../../utils/notificationManager.js';

const getPermission = () =>
  (typeof Notification !== 'undefined' ? Notification.permission : 'default');

const NotificationSettings = () => {
  const { t } = useTranslation();
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

  useEffect(() => {
    setPushStatus(getPermission());
  }, []);

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
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">Push notifications are on. You'll get the latest Vadodara news as it's published.</p>
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
        <button className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          {t('common.cancel')}
        </button>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          {t('common.save_changes')}
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;