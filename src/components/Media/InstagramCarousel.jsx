// =============================================
// src/components/Media/InstagramCarousel.jsx
// Instagram-style Carousel with Touch Gestures
// =============================================
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';

const formatCompactNumber = (value = 0) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
};

const InstagramCarousel = ({ 
  images = [], 
  className = '', 
  aspectRatio = '1/1',
  showDots = true,
  enableSwipe = true,
  onImageChange = null,
  autoPlay = false,
  autoPlayInterval = 3000,
  externalCurrentIndex = null,
  viewCount = null
}) => {
  const normalizeAspectRatio = (value, fallback = '1/1') => {
    const target = value || fallback;
    if (typeof target === 'number') return String(target);
    if (typeof target !== 'string') return fallback;

    if (target.includes(':')) {
      const [width, height] = target.split(':').map(part => part.trim());
      if (width && height) {
        return `${width}/${height}`;
      }
    }

    return target;
  };

  const resolvedAspectRatio = normalizeAspectRatio(aspectRatio);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const carouselRef = useRef(null);
  const autoPlayRef = useRef(null);
  const isExternalUpdate = useRef(false);

  // Minimum swipe distance to trigger slide change
  const minSwipeDistance = 50;

  const getImageSrc = (image) => {
    if (!image) return '';
    if (typeof image === 'string') return image;

    const {
      url,
      src,
      downloadURL,
      downloadUrl,
      fileUrl,
      fileURL,
      imageUrl,
      previewUrl,
      mediaUrl,
      secureUrl,
      path
    } = image;

    const candidate = url || src || downloadURL || downloadUrl || fileUrl || fileURL || imageUrl || previewUrl || mediaUrl || secureUrl;
    if (candidate) {
      return candidate;
    }

    if (path && /^https?:\/\//.test(path)) {
      return path;
    }

    return '';
  };

  const normalizedImages = Array.isArray(images) ? images : [];
  const sanitizedImages = normalizedImages
    .map((image) => ({ raw: image, src: getImageSrc(image) }))
    .filter((item) => !!item.src);
  const imageCount = sanitizedImages.length;

  useEffect(() => {
    if (typeof externalCurrentIndex !== 'number' || imageCount === 0) {
      return;
    }

    const clampedIndex = Math.max(0, Math.min(externalCurrentIndex, imageCount - 1));
    isExternalUpdate.current = true;
    setCurrentIndex(clampedIndex);
  }, [externalCurrentIndex, imageCount]);

  // Handle autoplay
  useEffect(() => {
    if (!autoPlay || imageCount <= 1) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = prev >= imageCount - 1 ? 0 : prev + 1;
        return nextIndex;
      });
    }, autoPlayInterval);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, autoPlayInterval, imageCount]);

  // Clear autoplay on manual interaction
  const clearAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  };

  const goToSlide = (index) => {
    if (isTransitioning || index === currentIndex) return;
    
    setIsTransitioning(true);
    setCurrentIndex(index);
    // onImageChange is now called via useEffect when currentIndex changes
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const goToPrevious = () => {
    if (imageCount === 0) return;
    clearAutoPlay();
    const newIndex = currentIndex === 0 ? imageCount - 1 : currentIndex - 1;
    goToSlide(newIndex);
  };

  const goToNext = () => {
    if (imageCount === 0) return;
    clearAutoPlay();
    const newIndex = currentIndex === imageCount - 1 ? 0 : currentIndex + 1;
    goToSlide(newIndex);
  };

  // Touch handlers
  const handleTouchStart = (e) => {
    if (!enableSwipe) return;
    setTouchEnd(0); // Reset touchEnd
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!enableSwipe) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!enableSwipe || !touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < imageCount - 1) {
      goToNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      goToPrevious();
    }
  };

  // Mouse/touch drag handlers for desktop
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);

  const handleMouseDown = (e) => {
    if (!enableSwipe || e.button !== 0) return;
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  const handleMouseUp = (e) => {
    if (!isDragging || !enableSwipe) return;
    setIsDragging(false);
    
    const distance = dragStart - e.clientX;
    const isLeftDrag = distance > minSwipeDistance;
    const isRightDrag = distance < -minSwipeDistance;

    if (isLeftDrag && currentIndex < imageCount - 1) {
      goToNext();
    }
    if (isRightDrag && currentIndex > 0) {
      goToPrevious();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, imageCount]);

  // Store onImageChange in a ref to avoid triggering effect when callback reference changes
  const onImageChangeRef = useRef(onImageChange);
  useEffect(() => {
    onImageChangeRef.current = onImageChange;
  }, [onImageChange]);

  // Notify parent of index changes - in useEffect to avoid setState during render
  useEffect(() => {
    // Only notify parent if this was an internal change (not from externalCurrentIndex prop)
    if (!isExternalUpdate.current && onImageChangeRef.current) {
      onImageChangeRef.current(currentIndex);
    }
    // Reset the flag after handling
    isExternalUpdate.current = false;
  }, [currentIndex]);

  // Reset index if it's out of bounds - wrapped in useEffect to avoid setState during render
  useEffect(() => {
    if (imageCount === 0) {
      if (currentIndex !== 0) {
        setCurrentIndex(0);
      }
    } else if (currentIndex >= imageCount) {
      setCurrentIndex(imageCount - 1);
    }
  }, [imageCount]); // Only depend on imageCount, not currentIndex to avoid loops

  if (imageCount === 0) {
    return (
      <div className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 dark:text-gray-400">No images available</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div 
        ref={carouselRef}
        className="relative overflow-hidden rounded-lg bg-black"
        style={{ height: '450px' }}
      >
        {typeof viewCount === 'number' && viewCount >= 0 && (
          <div className="absolute top-3 left-3 z-20 inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <Eye className="h-3.5 w-3.5" />
            {formatCompactNumber(viewCount)}
          </div>
        )}

        {/* Image Container */}
        <div className="relative w-full h-full overflow-hidden">
        <div
          className="relative w-full h-full select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDragging(false)}
          style={{ 
            cursor: enableSwipe && imageCount > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            touchAction: enableSwipe ? 'pan-y' : 'auto'
          }}
        >
          {sanitizedImages.map(({ raw, src }, index) => {
            const altText = typeof raw === 'object'
              ? raw.alt || raw.caption || `Image ${index + 1}`
              : `Image ${index + 1}`;

            return (
              <div 
                key={index} 
                className="absolute inset-0 w-full h-full transition-transform duration-300 ease-out"
                style={{ 
                  transform: `translateX(${(index - currentIndex) * 100}%)`,
                  zIndex: index === currentIndex ? 1 : 0
                }}
              >
                <img
                  src={src}
                  alt={altText}
                  className="w-full h-full object-contain"
                  style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
                  draggable={false}
                  loading={index === currentIndex ? 'eager' : 'lazy'}
                  onError={(e) => {
                    console.error('Image failed to load in carousel:', src);
                    e.target.style.display = 'none';
                  }}
                />
                
                {/* Image overlay for better touch target */}
                <div className="absolute inset-0 bg-transparent" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Arrows (Hidden on mobile, shown on hover on desktop) */}
      {imageCount > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-black/60 hover:bg-black/80 rounded-full backdrop-blur-sm transition-opacity duration-200 ${
              currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'
            }`}
            disabled={currentIndex === 0}
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          
          <button
            onClick={goToNext}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-black/60 hover:bg-black/80 rounded-full backdrop-blur-sm transition-opacity duration-200 ${
              currentIndex === imageCount - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'
            }`}
            disabled={currentIndex === imageCount - 1}
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </>
      )}

        {/* Image counter (Instagram style - top right) */}
        {imageCount > 1 && (
          <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs font-medium">
            {currentIndex + 1}/{imageCount}
          </div>
        )}

        {/* Loading overlay during transition */}
        {isTransitioning && (
          <div className="absolute inset-0 bg-black bg-opacity-10 pointer-events-none" />
        )}
      </div>

      {/* Dots Indicator (Instagram style) */}
      {imageCount > 1 && showDots && (
        <div className="mt-3 flex justify-center space-x-2">
          {sanitizedImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-black dark:bg-white scale-125 shadow-md shadow-black/40 dark:shadow-white/40' 
                  : 'bg-black/20 hover:bg-black/40 dark:bg-white/40 dark:hover:bg-white/60'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InstagramCarousel;