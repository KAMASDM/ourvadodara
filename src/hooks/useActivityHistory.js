import { useMemo } from 'react';
import { useRealtimeData } from './useRealtimeData';
import { getLocalizedText } from '../utils/textUtils';
import { getEventImage } from '../utils/eventUtils';

const timestampOf = (value, fallback = 0) => {
  const candidate = typeof value === 'object' && value !== null
    ? value.timestamp || value.createdAt || value.savedAt || value.registeredAt || value.updatedAt
    : value;
  if (typeof candidate === 'number') return candidate;
  const parsed = new Date(candidate || fallback).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatActivityTime = timestamp => {
  const time = Number(timestamp) || 0;
  if (!time) return 'Date unavailable';
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const useActivityHistory = (userId, language = 'en') => {
  const userPath = userId ? `users/${userId}` : null;
  const bookmarksPath = userId ? `bookmarks/${userId}` : null;
  const eventBookmarksPath = userId ? `eventBookmarks/${userId}` : null;
  const { data: userData, isLoading: loadingUser } = useRealtimeData(userPath, { scope: 'global' });
  const { data: bookmarks, isLoading: loadingBookmarks } = useRealtimeData(bookmarksPath, { scope: 'global' });
  const { data: eventBookmarks, isLoading: loadingEventBookmarks } = useRealtimeData(eventBookmarksPath, { scope: 'global' });
  const { data: posts, isLoading: loadingPosts } = useRealtimeData('posts', { scope: 'global' });
  const { data: reels } = useRealtimeData('reels', { scope: 'global' });
  const { data: carousels } = useRealtimeData('carousels', { scope: 'global' });
  const { data: comments, isLoading: loadingComments } = useRealtimeData('comments', { scope: 'global' });
  const { data: events, isLoading: loadingEvents } = useRealtimeData('events', { scope: 'global' });

  const activities = useMemo(() => {
    if (!userId) return [];
    const contentCollections = { posts: posts || {}, reels: reels || {}, carousels: carousels || {} };
    const findContent = (id, preferredSource) => contentCollections[preferredSource]?.[id] || posts?.[id] || reels?.[id] || carousels?.[id];
    const contentActivity = (type, contentId, rawValue, options = {}) => {
      const content = findContent(contentId, options.source);
      if (!content) return null;
      const fallback = content.updatedAt || content.publishedAt || content.createdAt;
      return {
        id: `${type}-${contentId}-${options.id || ''}`,
        type,
        group: options.group || (type === 'read' ? 'reading' : type === 'save' ? 'saved' : type === 'comment' ? 'comments' : 'engagement'),
        targetType: 'news',
        targetId: contentId,
        title: getLocalizedText(content.title, language) || 'News story',
        detail: options.detail || '',
        timestamp: timestampOf(rawValue, fallback),
        image: content.imageUrl || content.image || content.thumbnail || content.media?.thumbnail || content.media?.images?.[0]?.url || '',
        category: content.category || content.type || 'News'
      };
    };

    const result = [];
    Object.entries(userData?.likes || {}).forEach(([id, value]) => result.push(contentActivity('like', id, value)));
    Object.entries(userData?.shares || {}).forEach(([id, value]) => result.push(contentActivity('share', id, value)));
    Object.entries(userData?.reads || {}).forEach(([id, value]) => result.push(contentActivity('read', id, value)));
    Object.entries(userData?.reactions || {}).forEach(([id, value]) => result.push(contentActivity('reaction', id, value, { detail: value?.reaction ? `Reacted ${value.reaction}` : 'Reacted to this story' })));
    Object.entries(bookmarks || {}).forEach(([id, value]) => result.push(contentActivity('save', id, value, { source: value?.source })));

    Object.entries(eventBookmarks || {}).forEach(([eventId, value]) => {
      const savedEvent = events?.[eventId];
      if (!savedEvent) return;
      result.push({
        id: `event-save-${eventId}`,
        type: 'event-save',
        group: 'saved',
        targetType: 'event',
        targetId: eventId,
        title: getLocalizedText(savedEvent.title, language) || 'Event',
        detail: 'Saved this event',
        timestamp: timestampOf(value, savedEvent.createdAt),
        image: getEventImage(savedEvent),
        category: savedEvent.category || 'Event'
      });
    });

    Object.entries(comments || {}).forEach(([postId, postComments]) => {
      Object.entries(postComments || {}).forEach(([commentId, comment]) => {
        if (comment?.authorId === userId) result.push(contentActivity('comment', postId, comment, { id: commentId, detail: comment.text || 'Commented on this story' }));
        Object.entries(comment?.replies || {}).forEach(([replyId, reply]) => {
          if (reply?.authorId === userId) result.push(contentActivity('comment', postId, reply, { id: `${commentId}-${replyId}`, detail: reply.text || 'Replied to a comment' }));
        });
      });
    });

    Object.entries(events || {}).forEach(([eventId, event]) => {
      Object.entries(event?.registrations || {}).forEach(([registrationId, registration]) => {
        if (registration?.userId !== userId) return;
        result.push({
          id: `registration-${eventId}-${registrationId}`,
          type: 'registration',
          group: 'events',
          targetType: 'event',
          targetId: eventId,
          title: getLocalizedText(event.title, language) || 'Event',
          detail: registration.status === 'confirmed' ? 'Registration confirmed' : `Registration ${registration.status || 'submitted'}`,
          timestamp: timestampOf(registration),
          image: getEventImage(event),
          category: event.category || 'Event'
        });
      });
    });

    return result.filter(Boolean).filter(item => item.timestamp > 0).sort((a, b) => b.timestamp - a.timestamp);
  }, [userId, language, userData, bookmarks, eventBookmarks, posts, reels, carousels, comments, events]);

  return {
    activities,
    isLoading: loadingUser || loadingBookmarks || loadingEventBookmarks || loadingPosts || loadingComments || loadingEvents
  };
};

export default useActivityHistory;
