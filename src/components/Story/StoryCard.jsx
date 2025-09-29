// =============================================
// src/components/Story/StoryCard.jsx
// =============================================
import React from 'react';
import { Plus } from 'lucide-react';

const StoryCard = ({ story }) => {
  if (story.type === 'add') {
    return (
      <div className="flex-shrink-0 w-16 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center cursor-pointer">
        <Plus className="w-6 h-6 text-white" />
      </div>
    );
  }

  return (
    <div className="relative flex-shrink-0 w-16 h-20 rounded-xl overflow-hidden cursor-pointer">
      <img
        src={story.image}
        alt={story.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      {story.isBreaking && (
        <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1 rounded">
          LIVE
        </div>
      )}
      <div className="absolute bottom-1 left-1 right-1">
        <p className="text-white text-xs font-medium line-clamp-2">
          {story.title}
        </p>
      </div>
    </div>
  );
};

export default StoryCard;