// =============================================
// src/components/Category/SwipeableCategoryFilter.jsx
// Swipeable Category Navigation with Gesture Support
// =============================================
import React, { useRef, useState, useEffect } from 'react';
import { useLanguage } from '../../context/Language/LanguageContext';
import { CATEGORIES } from '../../utils/constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SwipeableCategoryFilter = ({ activeCategory, setActiveCategory }) => {
  const { currentLanguage } = useLanguage();
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setShowLeftArrow(container.scrollLeft > 10);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, []);

  // Auto-scroll to active category
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const activeButton = container.querySelector(`[data-category="${activeCategory}"]`);
    if (activeButton) {
      activeButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeCategory]);

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = direction === 'left' ? -200 : 200;
    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swiped left - next category
      const currentIndex = CATEGORIES.findIndex(c => c.id === activeCategory);
      if (currentIndex < CATEGORIES.length - 1) {
        setActiveCategory(CATEGORIES[currentIndex + 1].id);
      }
    }

    if (touchStart - touchEnd < -75) {
      // Swiped right - previous category
      const currentIndex = CATEGORIES.findIndex(c => c.id === activeCategory);
      if (currentIndex > 0) {
        setActiveCategory(CATEGORIES[currentIndex - 1].id);
      }
    }
  };

  return (
    <div className="relative group">
      {/* Left Arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>
      )}

      {/* Scrollable Categories */}
      <div
        ref={scrollContainerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth swipe-container"
        style={{ scrollSnapType: 'x proximity' }}
      >
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              data-category={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium border transition-all duration-300 swipe-item ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white border-primary-500 shadow-lg shadow-primary-500/30 scale-105'
                  : 'glass-card text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:scale-105 hover:shadow-md'
              }`}
            >
              <span className="text-base leading-none">{category.icon}</span>
              <span className="whitespace-nowrap font-semibold">{category.name[currentLanguage]}</span>
            </button>
          );
        })}
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>
      )}

      {/* Gradient Overlays */}
      {showLeftArrow && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 dark:from-gray-950 to-transparent pointer-events-none" />
      )}
      {showRightArrow && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 dark:from-gray-950 to-transparent pointer-events-none" />
      )}
    </div>
  );
};

export default SwipeableCategoryFilter;
