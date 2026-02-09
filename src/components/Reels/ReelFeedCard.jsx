// =============================================
// src/components/Reels/ReelFeedCard.jsx
// Reel Card for Main News Feed
// =============================================
import React, { useRef, useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Play } from 'lucide-react';

const ReelFeedCard = ({ reel, onLike, onComment, onShare, onSave, isLiked, isSaved }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const videoUrl = reel.mediaContent?.items?.[0]?.url || reel.videoUrl || '';
  const thumbnailUrl = reel.mediaContent?.items?.[0]?.thumbnailUrl || reel.thumbnail || '';

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden shadow-lg mb-8 flex flex-col">
      <div className="relative w-full aspect-video bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl}
          className="w-full h-full object-cover cursor-pointer"
          muted={isMuted}
          loop
          playsInline
          onClick={handlePlayPause}
        />
        {!isPlaying && (
          <button
            className="absolute inset-0 flex items-center justify-center text-white bg-black/40"
            onClick={handlePlayPause}
            style={{ pointerEvents: 'auto' }}
          >
            <Play className="w-16 h-16 opacity-80" />
          </button>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-white text-base line-clamp-1">{reel.title?.en || 'Untitled Reel'}</span>
          {reel.tags && reel.tags.length > 0 && (
            <span className="ml-2 text-xs text-blue-300">#{reel.tags[0]}</span>
          )}
        </div>
        {reel.excerpt?.en && (
          <p className="text-gray-200 text-sm line-clamp-2 mb-1">{reel.excerpt.en}</p>
        )}
        <div className="flex items-center gap-4 mt-2">
          <button onClick={onLike} className={`flex items-center gap-1 text-white ${isLiked ? 'text-pink-400' : ''}`}>
            <Heart className="w-5 h-5" />
            <span className="text-xs">{reel.likes || 0}</span>
          </button>
          <button onClick={onComment} className="flex items-center gap-1 text-white">
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs">{reel.comments || 0}</span>
          </button>
          <button onClick={onShare} className="flex items-center gap-1 text-white">
            <Share2 className="w-5 h-5" />
            <span className="text-xs">Share</span>
          </button>
          <button onClick={onSave} className={`flex items-center gap-1 text-white ${isSaved ? 'text-yellow-400' : ''}`}>
            <Bookmark className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReelFeedCard;
