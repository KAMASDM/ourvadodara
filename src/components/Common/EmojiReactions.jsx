// =============================================
// src/components/Common/EmojiReactions.jsx
// Emoji Reaction System with Firebase Integration
// =============================================
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { ref, update, get, increment, serverTimestamp } from 'firebase/database';
import { db } from '../../firebase-config';
import { REACTIONS } from '../../utils/constants';
import { Plus } from 'lucide-react';

const EmojiReactions = ({ postId, postType = 'posts', showCount = true, compact = false }) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState({});
  const [userReaction, setUserReaction] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isAnimating, setIsAnimating] = useState(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!postId) return;
    
    const loadReactions = async () => {
      try {
        const reactionsRef = ref(db, `${postType}/${postId}/reactions`);
        const snapshot = await get(reactionsRef);
        
        if (snapshot.exists()) {
          setReactions(snapshot.val());
        }

        // Check user's reaction
        if (user && !user.isAnonymous) {
          const userReactionRef = ref(db, `users/${user.uid}/reactions/${postId}`);
          const userSnapshot = await get(userReactionRef);
          
          if (userSnapshot.exists()) {
            setUserReaction(userSnapshot.val().reaction);
          }
        }
      } catch (error) {
        console.error('Error loading reactions:', error);
      }
    };

    loadReactions();
  }, [postId, postType, user]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowReactionPicker(false);
      }
    };

    if (showReactionPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReactionPicker]);

  const handleReaction = async (reactionId) => {
    if (!user || user.isAnonymous) {
      // Trigger login prompt
      document.dispatchEvent(new Event('showGuestPrompt'));
      return;
    }

    const isSameReaction = userReaction === reactionId;
    const newReaction = isSameReaction ? null : reactionId;

    // Optimistic update
    setIsAnimating(reactionId);
    setTimeout(() => setIsAnimating(null), 600);
    
    const prevReaction = userReaction;
    setUserReaction(newReaction);

    try {
      const updates = {};

      // Update post reactions count
      if (prevReaction) {
        updates[`${postType}/${postId}/reactions/${prevReaction}`] = increment(-1);
      }
      if (newReaction) {
        updates[`${postType}/${postId}/reactions/${newReaction}`] = increment(1);
      }

      // Update user's reaction
      if (newReaction) {
        updates[`users/${user.uid}/reactions/${postId}`] = {
          reaction: newReaction,
          postId,
          postType,
          timestamp: serverTimestamp()
        };
      } else {
        updates[`users/${user.uid}/reactions/${postId}`] = null;
      }

      await update(ref(db), updates);

      // Update local state
      setReactions(prev => {
        const updated = { ...prev };
        if (prevReaction) {
          updated[prevReaction] = Math.max(0, (updated[prevReaction] || 0) - 1);
        }
        if (newReaction) {
          updated[newReaction] = (updated[newReaction] || 0) + 1;
        }
        return updated;
      });

      setShowReactionPicker(false);
    } catch (error) {
      console.error('Error updating reaction:', error);
      // Revert optimistic update
      setUserReaction(prevReaction);
    }
  };

  const getTotalReactions = () => {
    return Object.values(reactions).reduce((sum, count) => sum + (count || 0), 0);
  };

  const getTopReactions = () => {
    return REACTIONS
      .map(r => ({ ...r, count: reactions[r.id] || 0 }))
      .filter(r => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const totalReactions = getTotalReactions();
  const topReactions = getTopReactions();

  if (compact) {
    return (
      <div className="relative inline-block">
        <button
          onClick={() => setShowReactionPicker(!showReactionPicker)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all ${
            userReaction
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {userReaction ? (
            <span className="text-base leading-none">
              {REACTIONS.find(r => r.id === userReaction)?.emoji}
            </span>
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {showCount && totalReactions > 0 && (
            <span className="text-xs font-medium">{totalReactions}</span>
          )}
        </button>

        {showReactionPicker && (
          <div
            ref={pickerRef}
            className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 p-2 flex gap-1 z-50 animate-scale-up"
          >
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.id}
                onClick={() => handleReaction(reaction.id)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all hover:scale-125 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  isAnimating === reaction.id ? 'animate-bounce-once scale-150' : ''
                }`}
                title={reaction.label}
              >
                {reaction.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Reaction Display */}
      {topReactions.length > 0 && (
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            {topReactions.map((reaction) => (
              <div
                key={reaction.id}
                className="w-6 h-6 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center text-sm border border-gray-200 dark:border-gray-700"
              >
                {reaction.emoji}
              </div>
            ))}
          </div>
          {showCount && (
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {totalReactions}
            </span>
          )}
        </div>
      )}

      {/* Reaction Button */}
      <div className="relative">
        <button
          onClick={() => setShowReactionPicker(!showReactionPicker)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-sm font-medium ${
            userReaction
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {userReaction ? (
            <>
              <span className="text-base leading-none">
                {REACTIONS.find(r => r.id === userReaction)?.emoji}
              </span>
              <span>{REACTIONS.find(r => r.id === userReaction)?.label}</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>React</span>
            </>
          )}
        </button>

        {showReactionPicker && (
          <div
            ref={pickerRef}
            className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 z-50 animate-scale-up"
          >
            <div className="flex gap-2">
              {REACTIONS.map((reaction) => (
                <button
                  key={reaction.id}
                  onClick={() => handleReaction(reaction.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    userReaction === reaction.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  } ${isAnimating === reaction.id ? 'animate-bounce-once scale-110' : ''}`}
                  title={reaction.label}
                >
                  <span className="text-2xl">{reaction.emoji}</span>
                  <span className="text-[10px] text-gray-600 dark:text-gray-400">
                    {reaction.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmojiReactions;
