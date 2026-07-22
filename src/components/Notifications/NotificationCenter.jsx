// =============================================
// src/components/Notifications/NotificationCenter.jsx
// Shared responsive notification destination for web and mobile.
// =============================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/Auth/AuthContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { ref, update } from '../../firebase-config';
import { db } from '../../firebase-config';
import { Bell, Check, Heart, MessageCircle, Settings } from 'lucide-react';
import { NotificationSkeleton } from '../Common/SkeletonLoader';

const formatRelativeTime = (timestamp, language) => {
  const parsedTimestamp = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  if (!Number.isFinite(parsedTimestamp)) return '';
  const elapsedSeconds = Math.round((parsedTimestamp - Date.now()) / 1000);
  const ranges = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];
  const range = ranges.find(({ seconds }) => Math.abs(elapsedSeconds) >= seconds) || ranges.at(-1);
  const value = Math.round(elapsedSeconds / range.seconds);
  return new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(value, range.unit);
};

const NotificationCenter = ({ onOpenSettings }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data: notificationsObject, isLoading } = useRealtimeData(user ? `notifications/${user.uid}` : null);

  const notifications = notificationsObject
    ? Object.entries(notificationsObject)
      .map(([key, value]) => ({ ...value, id: key }))
      .sort((a, b) => b.createdAt - a.createdAt)
    : [];
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const language = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-rose-500" />;
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-teal-600 dark:text-teal-300" />;
    }
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    const updates = {};
    notifications.forEach((notification) => {
      if (!notification.isRead) {
        updates[`/notifications/${user.uid}/${notification.id}/isRead`] = true;
      }
    });
    await update(ref(db), updates);
  };

  const markAsRead = async (notification) => {
    if (!user || notification.isRead) return;
    await update(ref(db), {
      [`/notifications/${user.uid}/${notification.id}/isRead`]: true,
    });
  };

  return (
    <section className="mx-auto w-full max-w-4xl px-3 pb-28 pt-3 sm:px-5 sm:pt-5 lg:pb-8" aria-labelledby="notifications-heading">
      <div className="liquid-panel overflow-hidden rounded-3xl border border-white/70 shadow-xl shadow-slate-900/5 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-4 dark:border-white/10 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
              <Bell className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 id="notifications-heading" className="text-xl font-extrabold text-slate-950 dark:text-white">
                {t('notifications.title')}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {unreadCount > 0
                  ? t('notifications.unread_count', { count: unreadCount })
                  : t('notifications.all_caught_up')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent dark:text-teal-300 dark:hover:bg-teal-950/50"
            >
              <Check className="h-4 w-4" />
              {t('notifications.mark_all_read')}
            </button>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="liquid-action rounded-xl p-2.5"
                aria-label={t('notifications.open_preferences')}
                title={t('notifications.open_preferences')}
              >
                <Settings className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-200/70 dark:divide-white/10">
          {!user ? (
            <div className="px-6 py-16 text-center">
              <Bell className="mx-auto mb-4 h-10 w-10 text-slate-300 dark:text-slate-600" />
              <h2 className="font-extrabold text-slate-900 dark:text-white">{t('notifications.sign_in_title')}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('notifications.sign_in_description')}</p>
            </div>
          ) : isLoading ? (
            Array.from({ length: 5 }).map((_, index) => <NotificationSkeleton key={index} />)
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => markAsRead(notification)}
                className={`flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-white/55 dark:hover:bg-white/5 sm:px-6 ${
                  !notification.isRead ? 'bg-teal-50/70 dark:bg-teal-950/20' : ''
                }`}
              >
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-800">
                  {getNotificationIcon(notification.type)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-6 text-slate-800 dark:text-slate-200">{notification.message}</span>
                  <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                    {formatRelativeTime(notification.createdAt, language)}
                  </span>
                </span>
                {!notification.isRead && <span className="mt-3 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-500" aria-hidden />}
              </button>
            ))
          ) : (
            <div className="px-6 py-16 text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <Bell className="h-7 w-7 text-slate-400" />
              </span>
              <h2 className="font-extrabold text-slate-900 dark:text-white">{t('notifications.empty_title')}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('notifications.empty_description')}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NotificationCenter;
