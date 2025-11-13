// =============================================
// src/components/Comments/ThreadedCommentSection.jsx
// Nested Comment Threading with Firebase Realtime Database
// =============================================
import React, { useState } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { ref, push, update, serverTimestamp, increment } from '../../firebase-config';
import { db } from '../../firebase-config';
import { Send, Heart, MessageCircle, LogIn, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CommentSkeleton } from '../Common/SkeletonLoader';
import Login from '../Auth/Login';

const Comment = ({ 
  comment, 
  postId, 
  level = 0, 
  onReply, 
  onLike 
}) => {
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const { data: repliesObject } = useRealtimeData(`comments/${postId}/${comment.id}/replies`);
  
  const replies = repliesObject 
    ? Object.entries(repliesObject)
        .map(([key, value]) => ({ ...value, id: key }))
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
            <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
              {comment.text}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4 mt-1 px-1">
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(commentTime), { addSuffix: true })}
            </span>
            
            <button 
              onClick={() => onLike(comment.id)}
              className={`flex items-center space-x-1 text-xs hover:text-red-500 transition-colors ${
                comment.likes > 0 ? 'text-red-500 font-medium' : 'text-gray-500'
              }`}
            >
              <Heart className={`w-3 h-3 ${comment.likes > 0 ? 'fill-red-500' : ''}`} />
              {comment.likes > 0 && <span>{comment.likes}</span>}
            </button>

            {canReply && (
              <button 
                onClick={() => onReply(comment)}
                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                <span>Reply</span>
              </button>
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
              level={level + 1}
              onReply={onReply}
              onLike={(replyId) => onLike(replyId, comment.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ThreadedCommentSection = ({ postId }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const { data: commentsObject, isLoading } = useRealtimeData(`comments/${postId}`);

  // Get top-level comments only
  const comments = commentsObject 
    ? Object.entries(commentsObject)
        .map(([key, value]) => ({ ...value, id: key }))
        .filter(comment => !comment.parentId) // Only top-level comments
        .sort((a, b) => {
          // Handle both 'createdAt' and 'timestamp' fields
          const timeA = a.createdAt || a.timestamp || 0;
          const timeB = b.createdAt || b.timestamp || 0;
          return timeB - timeA;
        })
    : [];

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    if (replyingTo) {
      // Submit as a reply
      const repliesRef = ref(db, `comments/${postId}/${replyingTo.id}/replies`);
      push(repliesRef, {
        text: newComment,
        author: user.displayName || 'Anonymous',
        authorId: user.uid,
        createdAt: serverTimestamp(),
        likes: 0,
        parentId: replyingTo.id
      });

      // Increment reply count
      const commentRef = ref(db, `comments/${postId}/${replyingTo.id}`);
      update(commentRef, {
        replyCount: increment(1)
      });
    } else {
      // Submit as top-level comment
      const commentsRef = ref(db, `comments/${postId}`);
      push(commentsRef, {
        text: newComment,
        author: user.displayName || 'Anonymous',
        authorId: user.uid,
        createdAt: serverTimestamp(),
        likes: 0,
        replyCount: 0
      });
      
      // Increment comments count on the post
      const postRef = ref(db, `posts/${postId}`);
      update(postRef, {
        comments: increment(1)
      });
    }

    setNewComment('');
    setReplyingTo(null);
  };

  const handleLikeComment = (commentId, parentId = null) => {
    if (!user) return;
    
    const commentPath = parentId 
      ? `comments/${postId}/${parentId}/replies/${commentId}`
      : `comments/${postId}/${commentId}`;
    
    const commentRef = ref(db, commentPath);
    update(commentRef, {
      likes: increment(1)
    });
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
      {user ? (
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
              className="bg-primary-red hover:bg-secondary-red text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
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
              onClick={() => setShowLogin(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-red text-white rounded-lg hover:bg-secondary-red transition-colors text-sm"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In to Comment
            </button>
          </div>
        </div>
      )}

      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </div>
  );
};

export default ThreadedCommentSection;
