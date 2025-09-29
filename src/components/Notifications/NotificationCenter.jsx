// =============================================
// src/components/Notifications/NotificationCenter.jsx
// Now with real-time Firebase notifications
// =============================================
import React from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { ref, update, remove } from '../../firebase-config';
import { db } from '../../firebase-config';
import { Bell, Heart, MessageCircle, X, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import LoadingSpinner from '../Common/LoadingSpinner';

const NotificationCenter = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { data: notificationsObject, isLoading } = useRealtimeData(user ? `notifications/${user.uid}` : null);

  const notifications = notificationsObject 
    ? Object.entries(notificationsObject).map(([key, value]) => ({...value, id: key})).sort((a, b) => b.createdAt - a.createdAt) 
    : [];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment': return <MessageCircle className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const markAllAsRead = () => {
    if (!user) return;
    const updates = {};
    notifications.forEach(notif => {
      if (!notif.isRead) {
        updates[`/notifications/${user.uid}/${notif.id}/isRead`] = true;
      }
    });
    // Use Firebase v9+ update function
    update(ref(db), updates);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-16">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md m-4 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Notifications {unreadCount > 0 && `(${unreadCount})`}</h2>
          <button onClick={onClose}><X /></button>
        </div>
        
        <div className="p-2 border-b">
            <button onClick={markAllAsRead} disabled={unreadCount === 0} className="text-sm text-primary-red disabled:text-gray-400 flex items-center gap-1"><Check size={16} /> Mark all as read</button>
        </div>

        <div className="overflow-y-auto flex-1">
          {isLoading ? <LoadingSpinner /> : (
            notifications.length > 0 ? (
              notifications.map(notif => (
                <div key={notif.id} className={`p-4 flex items-start gap-3 border-b ${!notif.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                  {getNotificationIcon(notif.type)}
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 dark:text-gray-200">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-gray-500 py-8">You have no notifications.</p>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
