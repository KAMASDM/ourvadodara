// =============================================
// src/components/Story/EnhancedStorySection.jsx
// Stories rail — modern, performant, keyboard-nav.
// Lazy avatars, gradient ring, seen/unseen, "Your story" slot.
// =============================================
import React, { memo, useCallback, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { getLocalizedText } from '../../utils/textUtils';

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
  const selectedStory = selectedIndex !== null ? displayStories[selectedIndex] : null;
  const selectedMedia = selectedStory ? getStoryMedia(selectedStory) : null;

  const handleOpen = useCallback((id) => {
    const storyIndex = displayStories.findIndex(story => story.id === id);
    const story = displayStories[storyIndex];
    (onOpen || onStoryOpen || onViewStory)?.(story || id);
    if (storyIndex >= 0) {
      setSelectedIndex(storyIndex);
    }
  }, [displayStories, onOpen, onStoryOpen, onViewStory]);

  const handleCreate = onCreate || onStoryCreate;

  const goToStory = (direction) => {
    setSelectedIndex((currentIndex) => {
      if (currentIndex === null) return null;
      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= displayStories.length) return currentIndex;
      return nextIndex;
    });
  };

  if (!displayStories.length && !handleCreate) return null;

  return (
    <section aria-label="Stories" className="relative">
      <div className="horizontal-scroll flex gap-3 overflow-x-auto px-4 py-3">
        {handleCreate && <YourStory avatar={userAvatar} onCreate={handleCreate} />}
        {displayStories.map((s) => (
          <StoryBubble key={s.id} story={s} onOpen={handleOpen} />
        ))}
      </div>

      {selectedStory && (
        <div className="fixed inset-0 z-[70] bg-black text-white">
          <button
            type="button"
            onClick={() => setSelectedIndex(null)}
            className="absolute right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-20 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur"
            aria-label="Close story"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute left-4 top-[calc(env(safe-area-inset-top)+1rem)] z-20 flex items-center gap-3">
            <img
              src={selectedStory.avatar}
              alt=""
              className="h-10 w-10 rounded-full border border-white/40 object-cover"
            />
            <div>
              <p className="text-sm font-semibold">{selectedStory.name}</p>
              {selectedStory.category && <p className="text-xs text-white/70">{selectedStory.category}</p>}
            </div>
          </div>

          <div className="flex h-full w-full items-center justify-center">
            {selectedMedia?.type === 'video' ? (
              <video
                src={selectedMedia.url}
                poster={selectedMedia.thumbnailUrl}
                className="h-full w-full object-contain"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={selectedMedia?.url || selectedStory.avatar}
                alt={selectedStory.name}
                className="h-full w-full object-contain"
              />
            )}
          </div>

          {(getText(selectedStory.title) || getText(selectedStory.excerpt)) && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-20">
              <h2 className="text-lg font-bold">{getText(selectedStory.title)}</h2>
              {getText(selectedStory.excerpt) && (
                <p className="mt-1 line-clamp-3 text-sm text-white/80">{getText(selectedStory.excerpt)}</p>
              )}
            </div>
          )}

          {selectedIndex > 0 && (
            <button
              type="button"
              onClick={() => goToStory(-1)}
              className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/35 backdrop-blur"
              aria-label="Previous story"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {selectedIndex < displayStories.length - 1 && (
            <button
              type="button"
              onClick={() => goToStory(1)}
              className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/35 backdrop-blur"
              aria-label="Next story"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      )}
    </section>
  );
});

export default EnhancedStorySection;
