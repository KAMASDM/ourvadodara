// =============================================
// src/components/Comments/ThreadedCommentSection.jsx
// Nested Comment Threading with Firebase Realtime Database
// =============================================
import React, { useState } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { ref, push, update, remove, serverTimestamp, increment } from '../../firebase-config';
import { runTransaction } from 'firebase/database';
import { db } from '../../firebase-config';
import { Send, Heart, MessageCircle, LogIn, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CommentSkeleton } from '../Common/SkeletonLoader';
import EnhancedLogin from '../Auth/EnhancedLogin';

const countCommentBranch = comment => 1 + Object.values(comment?.replies || {}).reduce(
  (total, reply) => total + countCommentBranch(reply),
  0
);

const Comment = ({
  comment,
  postId,
  contentPath,
  commentPath,
  level = 0,
  onReply,
  onLike
}) => {
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text || '');
  const { data: repliesObject } = useRealtimeData(`${commentPath}/replies`);

  const isOwnComment = user?.uid && user.uid === comment.authorId;
  const isLiked = Boolean(user?.uid && comment.likedBy?.[user.uid]);

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const trimmed = editText.trim();
    if (!trimmed || trimmed === comment.text) {
      setIsEditing(false);
      setEditText(comment.text || '');
      return;
    }
    try {
      await update(ref(db, commentPath), { text: trimmed, editedAt: Date.now() });
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing comment:', error);
      alert('Failed to edit comment. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment? This cannot be undone.')) return;
    try {
      await remove(ref(db, commentPath));
      const removedCount = countCommentBranch(comment);
      await update(ref(db), {
        [`${contentPath}/${postId}/comments`]: increment(-removedCount),
        [`${contentPath}/${postId}/analytics/comments`]: increment(-removedCount)
      });
      await update(ref(db, `users/${user.uid}`), { totalComments: increment(-1) });
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };
  
  const replies = repliesObject
    ? Object.entries(repliesObject)
        .map(([key, value]) => ({ ...value, id: key }))
        .filter(reply => reply.rejected !== true) // hide comments rejected by moderators
        .sort((a, b) => {
          // Handle both 'createdAt' and 'timestamp' fields
          const timeA = a.createdAt || a.timestamp || 0;
          const timeB = b.createdAt || b.timestamp || 0;
          return timeA - timeB;
        })
    : [];

  const maxNestingLevel = 3; // Limit nesting depth to 3 levels
  const canReply = level < maxNestingLevel;
  
  // Handle both 'author' and 'userName' fields for backward compatibility
  const authorName = comment.author || comment.userName || 'Anonymous';
  // Handle both 'createdAt' and 'timestamp' fields for backward compatibility
  const commentTime = comment.createdAt || comment.timestamp || Date.now();

  return (
    <div className={`${level > 0 ? 'ml-8 mt-2' : 'py-3'}`}>
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="w-8 h-8 bg-primary-red rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
          {authorName.charAt(0).toUpperCase()}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-2">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {authorName}
            </span>
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-red"
                  autoFocus
                />
                <button type="submit" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setEditText(comment.text || ''); }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                {comment.text}
                {comment.editedAt && (
                  <span className="ml-1 text-[10px] text-gray-400">(edited)</span>
                )}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4 mt-1 px-1">
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(commentTime), { addSuffix: true })}
            </span>
            
            <button 
              onClick={() => onLike(commentPath)}
              aria-label={isLiked ? 'Unlike comment' : 'Like comment'}
              aria-pressed={isLiked}
              className={`flex items-center space-x-1 text-xs hover:text-red-500 transition-colors ${
                isLiked ? 'text-red-500 font-medium' : 'text-gray-500'
              }`}
            >
              <Heart className={`w-3 h-3 ${isLiked ? 'fill-red-500' : ''}`} />
              {comment.likes > 0 && <span>{comment.likes}</span>}
            </button>

            {canReply && (
              <button 
                onClick={() => onReply({ ...comment, commentPath })}
                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                <span>Reply</span>
              </button>
            )}

            {isOwnComment && !isEditing && (
              <>
                <button
                  onClick={() => { setIsEditing(true); setEditText(comment.text || ''); }}
                  className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </>
            )}

            {replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 transition-colors"
              >
                {showReplies ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                <span>
                  {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {showReplies && replies.length > 0 && (
        <div className="mt-2">
          {replies.map(reply => (
            <Comment
              key={reply.id}
              comment={reply}
              postId={postId}
              contentPath={contentPath}
              commentPath={`${commentPath}/replies/${reply.id}`}
              level={level + 1}
              onReply={onReply}
              onLike={onLike}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ThreadedCommentSection = ({ postId, contentPath = 'posts', commentsEnabled = true }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const { data: commentsObject, isLoading } = useRealtimeData(`comments/${postId}`);

  // Get top-level comments only
  const comments = commentsObject
    ? Object.entries(commentsObject)
        .map(([key, value]) => ({ ...value, id: key }))
        .filter(comment => Boolean(comment.text || comment.content))
        .filter(comment => !comment.parentId) // Only top-level comments
        .filter(comment => comment.rejected !== true) // hide comments rejected by moderators
        .sort((a, b) => {
          // Handle both 'createdAt' and 'timestamp' fields
          const timeA = a.createdAt || a.timestamp || 0;
          const timeB = b.createdAt || b.timestamp || 0;
          return timeB - timeA;
        })
    : [];

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !commentsEnabled) return;

    try {
      if (replyingTo) {
        // Submit as a reply
        const parentCommentPath = replyingTo.commentPath || `comments/${postId}/${replyingTo.id}`;
        const repliesRef = ref(db, `${parentCommentPath}/replies`);
        await push(repliesRef, {
          text: newComment,
          author: user.displayName || 'Anonymous',
          authorId: user.uid,
          createdAt: serverTimestamp(),
          likes: 0,
          parentId: replyingTo.id
        });

        await update(ref(db), {
          [`${parentCommentPath}/replyCount`]: increment(1),
          [`${contentPath}/${postId}/comments`]: increment(1),
          [`${contentPath}/${postId}/analytics/comments`]: increment(1)
        });
      } else {
        // Submit as top-level comment
        const commentsRef = ref(db, `comments/${postId}`);
        await push(commentsRef, {
          text: newComment,
          author: user.displayName || 'Anonymous',
          authorId: user.uid,
          createdAt: serverTimestamp(),
          likes: 0,
          replyCount: 0
        });
        await update(ref(db), {
          [`${contentPath}/${postId}/comments`]: increment(1),
          [`${contentPath}/${postId}/analytics/comments`]: increment(1)
        });
      }

      await update(ref(db, `users/${user.uid}`), { totalComments: increment(1) });

      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error posting comment:', error);
      alert(commentsEnabled ? 'Unable to post this comment. Please try again.' : 'Comments are turned off.');
    }
  };

  const handleLikeComment = async (commentPath) => {
    if (!user) return;
    try {
      await runTransaction(ref(db, commentPath), current => {
        if (!current) return current;
        const likedBy = { ...(current.likedBy || {}) };
        const wasLiked = Boolean(likedBy[user.uid]);
        if (wasLiked) delete likedBy[user.uid];
        else likedBy[user.uid] = true;
        return {
          ...current,
          likedBy,
          likes: Math.max(0, Number(current.likes || 0) + (wasLiked ? -1 : 1))
        };
      });
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  };

  const handleReply = (comment) => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setReplyingTo(comment);
    // Focus input (you could add a ref here)
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment('');
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      {/* Comments List */}
      <div className="px-4 py-2 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3">
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
          </div>
        ) : comments.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {comments.map(comment => (
              <Comment
                key={comment.id}
                comment={comment}
                postId={postId}
                contentPath={contentPath}
                commentPath={`comments/${postId}/${comment.id}`}
                level={0}
                onReply={handleReply}
                onLike={handleLikeComment}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500">Be the first to comment</p>
          </div>
        )}
      </div>

      {/* Comment Input */}
      {!commentsEnabled ? (
        <div className="border-t border-gray-200 p-4 text-center text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Comments are turned off for this content.
        </div>
      ) : user ? (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {/* Reply Indicator */}
          {replyingTo && (
            <div className="mb-3 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Replying to <span className="font-semibold">{replyingTo.author}</span>
                </span>
              </div>
              <button
                onClick={cancelReply}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmitComment} className="flex space-x-3">
            <div className="w-8 h-8 bg-primary-red rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {user.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <input 
              type="text" 
              value={newComment} 
              onChange={(e) => setNewComment(e.target.value)} 
              placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
              className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-red"
              autoFocus={!!replyingTo}
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="inline-flex items-center gap-1.5 bg-primary-red hover:bg-secondary-red text-white px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{replyingTo ? 'Reply' : 'Post'}</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Please sign in to join the conversation
            </p>
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:bg-red-600 dark:hover:bg-red-500"
            >
              <LogIn className="w-4 h-4 mr-2" />
              <span>Sign In to Comment</span>
            </button>
          </div>
        </div>
      )}

      {showLogin && <EnhancedLogin onClose={() => setShowLogin(false)} />}
    </div>
  );
};

export default ThreadedCommentSection;
