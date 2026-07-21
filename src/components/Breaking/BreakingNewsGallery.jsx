import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const getMediaUrl = entry => {
  if (typeof entry === 'string') return entry;
  return entry?.url || entry?.src || entry?.imageUrl || entry?.mediaUrl || '';
};

const BreakingNewsGallery = ({ media, title }) => {
  const slides = media
    .map(entry => ({ entry, url: getMediaUrl(entry) }))
    .filter(slide => slide.url);
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStart = useRef(null);

  if (slides.length === 0) return null;

  const hasMultipleSlides = slides.length > 1;
  const goToSlide = index => {
    setCurrentIndex((index + slides.length) % slides.length);
  };

  const handleTouchStart = event => {
    if (event.target.closest('video')) return;
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = event => {
    if (!hasMultipleSlides || !touchStart.current) return;

    const touch = event.changedTouches[0];
    const deltaX = touchStart.current.x - touch.clientX;
    const deltaY = touchStart.current.y - touch.clientY;
    touchStart.current = null;

    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    goToSlide(currentIndex + (deltaX > 0 ? 1 : -1));
  };

  const handleKeyDown = event => {
    if (!hasMultipleSlides) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToSlide(currentIndex - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToSlide(currentIndex + 1);
    }
  };

  return (
    <section
      aria-label={`Media gallery for ${title}`}
      aria-roledescription="carousel"
      className="bg-slate-950"
    >
      <div
        className="group relative aspect-[4/3] max-h-[70vh] w-full overflow-hidden sm:aspect-video"
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => { touchStart.current = null; }}
        tabIndex={hasMultipleSlides ? 0 : undefined}
        style={{ touchAction: 'pan-y' }}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map(({ entry, url }, index) => {
            const isVideo = entry?.type === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(url);
            const alt = typeof entry === 'object' && (entry.alt || entry.caption)
              ? entry.alt || entry.caption
              : `${title} — image ${index + 1} of ${slides.length}`;

            return (
              <div
                key={`${url}-${index}`}
                aria-hidden={index !== currentIndex}
                aria-label={`Slide ${index + 1} of ${slides.length}`}
                aria-roledescription="slide"
                inert={index !== currentIndex}
                className="h-full w-full shrink-0"
              >
                {isVideo ? (
                  <video
                    src={url}
                    controls
                    playsInline
                    preload={index === 0 ? 'metadata' : 'none'}
                    className="h-full w-full bg-black object-contain"
                  />
                ) : (
                  <img
                    src={url}
                    alt={alt}
                    draggable={false}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'low'}
                    className="h-full w-full select-none object-contain"
                  />
                )}
              </div>
            );
          })}
        </div>

        {hasMultipleSlides && (
          <>
            <button
              type="button"
              onClick={() => goToSlide(currentIndex - 1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:flex"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => goToSlide(currentIndex + 1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:flex"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <div
              aria-live="polite"
              aria-atomic="true"
              className="absolute right-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm"
            >
              {currentIndex + 1}/{slides.length}
            </div>
          </>
        )}
      </div>

      {hasMultipleSlides && (
        <div className="overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto flex w-max min-w-full items-center justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToSlide(index)}
                aria-label={`Go to image ${index + 1}`}
                aria-current={index === currentIndex ? 'true' : undefined}
                className={`h-2 shrink-0 rounded-full transition-all ${index === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default BreakingNewsGallery;
