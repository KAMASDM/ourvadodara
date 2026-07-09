// =============================================
// src/components/Story/StoryViewer.jsx
// Instagram-style full-screen story viewer.
// Handles: segmented progress + auto-advance by duration, tap left/right
// navigation, press-and-hold to pause, multi-media stories, video playback
// (no native controls, muted autoplay, advance on end), per-story background
// and text colors, and hardware/browser back closes the viewer (no crash).
// =============================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { getLocalizedText } from '../../utils/textUtils';

const getText = (value) =>
  getLocalizedText(value, 'gu') || getLocalizedText(value, 'hi') || getLocalizedText(value, 'en');

// Normalize a story's media into an ordered array of { url, type, thumbnailUrl }.
const getStoryMediaItems = (story) => {
  const raw = story?.mediaContent?.items;
  let items = [];
  if (Array.isArray(raw)) items = raw.filter(Boolean);
  else if (raw && typeof raw === 'object') items = Object.values(raw).filter(Boolean);

  if (items.length === 0) {
    const url = story?.imageUrl || story?.videoUrl || story?.thumbnailUrl || story?.image || '';
    if (url) {
      items = [{
        url,
        thumbnailUrl: story?.thumbnailUrl || url,
        type: story?.mediaContent?.type === 'video' || story?.videoUrl ? 'video' : 'image',
      }];
    }
  }
  return items.map((it) => ({
    url: it.url || it.downloadURL || it.previewUrl || '',
    thumbnailUrl: it.thumbnailUrl || it.url || '',
    type: (it.type || '').toLowerCase().includes('video') ? 'video' : 'image',
    caption: it.caption,
  }));
};

const DEFAULT_DURATION = 15; // seconds

const StoryViewer = ({ stories, startIndex = 0, onClose }) => {
  const [storyIndex, setStoryIndex] = useState(startIndex);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0..100 for current segment
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const videoRef = useRef(null);
  const elapsedRef = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const story = stories[storyIndex];
  const mediaItems = useMemo(() => getStoryMediaItems(story), [story]);
  const media = mediaItems[mediaIndex] || null;

  const settings = story?.storySettings || {};
  const bgColor = settings.backgroundColor || '#000000';
  const textColor = settings.textColor || '#ffffff';
  const durationSec = Number(settings.duration) > 0 ? Number(settings.duration) : DEFAULT_DURATION;

  const title = getText(story?.title);
  const description = getText(story?.excerpt) || getText(story?.content) || getText(media?.caption);

  // --- Back button / hardware back closes the viewer instead of navigating
  // the app (which previously crashed). One history entry per viewer session.
  useEffect(() => {
    window.history.pushState({ storyViewer: true }, '');
    const handlePop = () => onCloseRef.current?.();
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // Closing always goes back through history so the pushed state is cleaned up.
  const requestClose = useCallback(() => {
    if (window.history.state?.storyViewer) window.history.back();
    else onCloseRef.current?.();
  }, []);

  const goToStory = useCallback((nextStoryIndex, nextMediaIndex = 0) => {
    if (nextStoryIndex < 0) return; // at the very beginning, ignore
    if (nextStoryIndex >= stories.length) {
      requestClose();
      return;
    }
    setStoryIndex(nextStoryIndex);
    setMediaIndex(nextMediaIndex);
    setProgress(0);
    setExpanded(false);
    elapsedRef.current = 0;
  }, [stories.length, requestClose]);

  const goNext = useCallback(() => {
    if (mediaIndex < mediaItems.length - 1) {
      setMediaIndex((i) => i + 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else {
      goToStory(storyIndex + 1, 0);
    }
  }, [mediaIndex, mediaItems.length, storyIndex, goToStory]);

  const goPrev = useCallback(() => {
    if (mediaIndex > 0) {
      setMediaIndex((i) => i - 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else if (storyIndex > 0) {
      const prevItems = getStoryMediaItems(stories[storyIndex - 1]);
      goToStory(storyIndex - 1, Math.max(0, prevItems.length - 1));
    }
  }, [mediaIndex, storyIndex, stories, goToStory]);

  // Keep the latest goNext in a ref so the timer never carries a stale closure
  // and doesn't need to re-run every time goNext is recreated.
  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;

  const isVideo = media?.type === 'video';

  // Reset the accumulated time whenever the segment changes.
  useEffect(() => {
    elapsedRef.current = 0;
    setProgress(0);
  }, [storyIndex, mediaIndex]);

  // --- Timer / progress driver for images (videos drive their own progress).
  // Restarts cleanly per segment; on pause it stops and resumes from the
  // accumulated elapsed time so it can never get stuck. ---
  useEffect(() => {
    if (!media || isVideo || paused) return undefined;

    const durationMs = durationSec * 1000;
    let raf;
    const segmentStart = performance.now() - elapsedRef.current;

    const loop = (now) => {
      const elapsed = now - segmentStart;
      elapsedRef.current = elapsed;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);
      if (pct >= 100) {
        elapsedRef.current = 0;
        goNextRef.current();
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [storyIndex, mediaIndex, paused, durationSec, isVideo, media]);

  // Pause/resume the video with the shared paused state.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused, media]);

  // Keyboard navigation (desktop)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, requestClose]);

  // Preload the next story's first image so transitions feel seamless.
  useEffect(() => {
    const nextStory = stories[storyIndex + 1];
    if (!nextStory) return;
    const nextItems = getStoryMediaItems(nextStory);
    const first = nextItems[0];
    if (first && first.type !== 'video' && first.url) {
      const img = new Image();
      img.src = first.url;
    }
  }, [storyIndex, stories]);

  // --- Pause on press, resume on release; a quick tap navigates. Pausing on
  // every pointer-down (rather than after a hold delay) is simpler and can't
  // strand the story paused; a global listener guarantees resume even if the
  // element's own pointerup is missed on mobile. ---
  const downTime = useRef(0);

  useEffect(() => {
    const resume = () => setPaused(false);
    window.addEventListener('pointerup', resume);
    window.addEventListener('pointercancel', resume);
    return () => {
      window.removeEventListener('pointerup', resume);
      window.removeEventListener('pointercancel', resume);
    };
  }, []);

  const handlePointerDown = () => {
    downTime.current = Date.now();
    setPaused(true);
  };

  const handlePointerUp = (e) => {
    setPaused(false);
    const held = Date.now() - downTime.current;
    if (held < 250) {
      // Quick tap: left third = previous, otherwise next.
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX ?? rect.left + rect.width / 2) - rect.left;
      if (x < rect.width * 0.32) goPrev();
      else goNext();
    }
  };

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col" style={{ backgroundColor: bgColor, color: textColor }}>
      {/* Segmented progress bars */}
      <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+0.5rem)] z-30 flex gap-1 px-3">
        {mediaItems.map((_, i) => (
          <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${i < mediaIndex ? 100 : i === mediaIndex ? progress : 0}%` }}
            />
          </div>
        ))}
      </div>

      {/* Header: author + close */}
      <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+1.25rem)] z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img
            src={story.avatar || media?.thumbnailUrl || '/logo.png'}
            alt=""
            className="h-9 w-9 rounded-full border border-white/40 object-cover"
          />
          <p className="text-sm font-semibold drop-shadow">{story.name || getText(story.title) || 'Story'}</p>
        </div>
        <button
          type="button"
          onClick={requestClose}
          className="grid h-10 w-10 place-items-center rounded-full bg-black/35 backdrop-blur"
          aria-label="Close story"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Media + tap zones. Long-press must pause the story, not trigger the
          browser's image context menu — so images render as a background-image
          div (no native image = no "Save/Open image" menu) and we suppress
          the context menu + selection/callout on the whole area. */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden select-none"
        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {media?.type === 'video' ? (
          <video
            ref={videoRef}
            key={`${storyIndex}-${mediaIndex}`}
            src={media.url}
            poster={media.thumbnailUrl}
            className="pointer-events-none h-full w-full object-contain"
            autoPlay
            muted
            playsInline
            controls={false}
            disablePictureInPicture
            controlsList="nodownload noplaybackrate"
            onContextMenu={(e) => e.preventDefault()}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration) setProgress(Math.min(100, (v.currentTime / v.duration) * 100));
            }}
            onEnded={goNext}
          />
        ) : (
          <div
            key={`${storyIndex}-${mediaIndex}`}
            className="pointer-events-none h-full w-full bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url("${media?.url || story.avatar || ''}")` }}
            role="img"
            aria-label={title}
          />
        )}

        {paused && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/10">
            <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-medium backdrop-blur">Paused</span>
          </div>
        )}
      </div>

      {/* Caption / description */}
      {(title || description) && (
        <div
          className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-16"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          {title && <h2 className="text-lg font-bold drop-shadow" style={{ color: textColor }}>{title}</h2>}
          {description && (
            <>
              <p
                className={`mt-1 text-sm drop-shadow ${expanded ? '' : 'line-clamp-3'}`}
                style={{ color: textColor, opacity: 0.9 }}
              >
                {description}
              </p>
              {description.length > 120 && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-1 text-xs font-semibold underline"
                  style={{ color: textColor }}
                >
                  {expanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StoryViewer;
