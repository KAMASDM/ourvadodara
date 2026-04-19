// =============================================
// src/components/Story/EnhancedStorySection.jsx
// Stories rail — modern, performant, keyboard-nav.
// Lazy avatars, gradient ring, seen/unseen, "Your story" slot.
// =============================================
import React, { memo, useCallback } from 'react';
import { Plus } from 'lucide-react';

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
  onStoryOpen, onStoryCreate,
}) {
  const handleOpen = useCallback((id) => (onOpen || onStoryOpen)?.(id), [onOpen, onStoryOpen]);
  const handleCreate = onCreate || onStoryCreate;

  if (!stories.length && !handleCreate) return null;

  return (
    <section aria-label="Stories" className="relative">
      <div className="horizontal-scroll flex gap-3 overflow-x-auto px-4 py-3">
        {handleCreate && <YourStory avatar={userAvatar} onCreate={handleCreate} />}
        {stories.map((s) => (
          <StoryBubble key={s.id} story={s} onOpen={handleOpen} />
        ))}
      </div>
    </section>
  );
});

export default EnhancedStorySection;
