// =============================================
// src/components/Comments/CommentSection.jsx
// Integrated with Firebase Realtime Database
// =============================================
import React, { useState } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { ref, push, update, serverTimestamp, increment } from '../../firebase-config';
import { db } from '../../firebase-config';
import { Send, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import LoadingSpinner from '../Common/LoadingSpinner';

const CommentSection = ({ postId }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const { data: commentsObject, isLoading } = useRealtimeData(`comments/${postId}`);

  const comments = commentsObject ? Object.entries(commentsObject).map(([key, value]) => ({...value, id: key})).sort((a,b) => b.createdAt - a.createdAt) : [];

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const commentsRef = ref(db, `comments/${postId}`);
    push(commentsRef, {
      text: newComment,
      author: user.displayName || 'Anonymous',
      authorId: user.uid,
      createdAt: serverTimestamp(),
      likes: 0,
    });
    
    // Increment comments count on the post
    const postRef = ref(db, `posts/${postId}`);
    update(postRef, {
        comments: increment(1)
    });

    setNewComment('');
  };

  const handleLikeComment = (commentId) => {
      if (!user) return; // or prompt to login
      const commentRef = ref(db, `comments/${postId}/${commentId}`);
      // Simple like toggle - for a real app, you'd track users who liked
      update(commentRef, {
          likes: increment(1)
      });
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="px-4 py-2 max-h-96 overflow-y-auto">
        {isLoading ? <LoadingSpinner /> : (
            comments.length > 0 ? (
                comments.map(comment => (
                    <div key={comment.id} className="flex space-x-3 py-3">
                        <div className="w-8 h-8 bg-primary-red rounded-full flex items-center justify-center text-white font-bold text-xs">{comment.author.charAt(0)}</div>
                        <div className="flex-1">
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                                <span className="font-semibold text-sm text-gray-900 dark:text-white">{comment.author}</span>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                            </div>
                            <div className="flex items-center space-x-4 mt-1">
                                <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                                <button onClick={() => handleLikeComment(comment.id)} className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500">
                                    <Heart className="w-3 h-3" />
                                    <span>{comment.likes || 0}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center text-sm text-gray-500 py-4">Be the first to comment.</p>
            )
        )}
      </div>

      {user && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSubmitComment} className="flex space-x-3">
            <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 text-sm" />
            <button type="submit" disabled={!newComment.trim()} className="bg-primary-red hover:bg-secondary-red text-white p-2 rounded-full disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
