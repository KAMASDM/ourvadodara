// =============================================
// src/components/Topics/TopicChip.jsx
// Interactive Topic/Hashtag Chip Component
// =============================================
import React from 'react';
import { useTopicFollowing } from '../../context/Topics/TopicFollowingContext';
import { Hash, Check, Plus } from 'lucide-react';

const TopicChip = ({ topic, onClick, showFollowButton = true, size = 'md' }) => {
  const { isFollowing, toggleTopic } = useTopicFollowing();
  const following = isFollowing(topic);
  const normalizedTopic = topic.replace(/^#/, '');

  const handleFollow = async (e) => {
    e.stopPropagation();
    await toggleTopic(normalizedTopic);
  };

  const handleClick = (e) => {
    if (onClick) {
      e.stopPropagation();
      onClick(normalizedTopic);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-[10px]',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm'
  };

  return (
    <div
      onClick={handleClick}
      className={`topic-chip ${following ? 'following' : ''} inline-flex items-center gap-1.5 cursor-pointer ${sizeClasses[size]}`}
    >
      <Hash className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}`} />
      <span className="font-semibold">#{normalizedTopic}</span>
      
      {showFollowButton && (
        <button
          onClick={handleFollow}
          className={`flex items-center justify-center ${
            size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
          } rounded-full transition-all ${
            following
              ? 'bg-white/20 hover:bg-white/30'
              : 'bg-white/10 hover:bg-white/20'
          }`}
          title={following ? 'Unfollow' : 'Follow'}
        >
          {following ? (
            <Check className={`${size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'} text-white`} />
          ) : (
            <Plus className={`${size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'} text-white`} />
          )}
        </button>
      )}
    </div>
  );
};

export default TopicChip;
