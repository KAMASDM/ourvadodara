// =============================================
// src/components/Story/EnhancedStorySection.jsx
// Stories rail — modern, performant, keyboard-nav.
// Lazy avatars, gradient ring, seen/unseen, "Your story" slot.
// =============================================
import React, { memo, useCallback, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { getLocalizedText } from '../../utils/textUtils';
import StoryViewer from './StoryViewer';

const getText = (value) => {
  return getLocalizedText(value, 'gu') || getLocalizedText(value, 'hi') || getLocalizedText(value, 'en');
};

const getStoryMedia = (story) => {
  const items = Array.isArray(story?.mediaContent?.items)
    ? story.mediaContent.items
    : Object.values(story?.mediaContent?.items || {});

  return items[0] || {
    url: story?.imageUrl || story?.thumbnailUrl || story?.image || '',
    thumbnailUrl: story?.thumbnailUrl || story?.imageUrl || story?.image || '',
    type: story?.mediaContent?.type === 'video' ? 'video' : 'image'
  };
};

const mapFirebaseStory = ([id, story]) => {
  const primaryMedia = getStoryMedia(story);
  return {
    id,
    ...story,
    name: getText(story.title) || 'Story',
    avatar: primaryMedia.thumbnailUrl || primaryMedia.url || '/logo.png',
    media: primaryMedia
  };
};

const StoryBubble = memo(function StoryBubble({ story, onOpen }) {
  const { id, name, avatar, seen } = story;
  return (
    <button
      type="button"
      onClick={() => onOpen?.(id)}
      className="flex-shrink-0 flex flex-col items-center gap-1.5 w-[68px] group focus:outline-none"
      aria-label={`Story: ${name}`}
    >
      <div className={`w-16 h-16 rounded-full p-[2.5px] transition-transform group-active:scale-95 ${
        seen ? 'bg-neutral-300 dark:bg-neutral-700' : 'bg-story-gradient'
      }`}>
        <div className="w-full h-full rounded-full bg-white dark:bg-neutral-950 p-[2px]">
          <img
            src={avatar}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full rounded-full object-cover bg-neutral-200 dark:bg-neutral-800"
          />
        </div>
      </div>
      <span className="text-[10px] font-medium text-neutral-700 dark:text-neutral-300 truncate max-w-[68px]">{name}</span>
    </button>
  );
});

const YourStory = memo(function YourStory({ avatar, onCreate }) {
  return (
    <button
      type="button"
      onClick={onCreate}
      className="flex-shrink-0 flex flex-col items-center gap-1.5 w-[68px] group"
      aria-label="Add your story"
    >
      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 border-2 border-dashed border-neutral-300 dark:border-neutral-700 grid place-items-center">
        {avatar ? (
          <img src={avatar} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        ) : null}
        <div className="relative z-10 w-6 h-6 rounded-full bg-primary-600 text-white grid place-items-center shadow-primary-glow">
          <Plus className="w-4 h-4" strokeWidth={2.5} />
        </div>
      </div>
      <span className="text-[10px] font-medium text-neutral-700 dark:text-neutral-300">Your story</span>
    </button>
  );
});

const EnhancedStorySection = memo(function EnhancedStorySection({
  stories = [], userAvatar, onOpen, onCreate,
  // Legacy props (no-op, kept for backward compat)
  onStoryOpen, onStoryCreate, onViewStory,
}) {
  const { data: storiesData } = useRealtimeData('stories');
  const [selectedIndex, setSelectedIndex] = useState(null);

  const firebaseStories = useMemo(() => {
    if (!storiesData) return [];
    const now = Date.now();
    return Object.entries(storiesData)
      .map(mapFirebaseStory)
      .filter((story) => {
        const expiresAt = story.expiresAt ? new Date(story.expiresAt).getTime() : null;
        const isExpired = expiresAt && expiresAt <= now;
        const status = story.status || 'published';
        return !isExpired && story.isActive !== false && story.isPublished !== false && status === 'published';
      })
      .sort((a, b) => new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0));
  }, [storiesData]);

  const displayStories = stories.length > 0 ? stories : firebaseStories;

  const handleOpen = useCallback((id) => {
    const storyIndex = displayStories.findIndex(story => story.id === id);
    const story = displayStories[storyIndex];
    (onOpen || onStoryOpen || onViewStory)?.(story || id);
    if (storyIndex >= 0) {
      setSelectedIndex(storyIndex);
    }
  }, [displayStories, onOpen, onStoryOpen, onViewStory]);

  const handleCreate = onCreate || onStoryCreate;

  if (!displayStories.length && !handleCreate) return null;

  return (
    <section aria-label="Stories" className="relative">
      <div className="horizontal-scroll flex gap-3 overflow-x-auto px-4 py-3">
        {handleCreate && <YourStory avatar={userAvatar} onCreate={handleCreate} />}
        {displayStories.map((s) => (
          <StoryBubble key={s.id} story={s} onOpen={handleOpen} />
        ))}
      </div>

      {selectedIndex !== null && (
        <StoryViewer
          stories={displayStories}
          startIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </section>
  );
});

export default EnhancedStorySection;
