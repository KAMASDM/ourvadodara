// =============================================
// src/components/Category/SwipeableCategoryFilter.jsx
// Horizontal scrollable chip filter.
// Backward compat: accepts setActiveCategory (old) or onCategoryChange (new).
// =============================================
import React, { memo, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../../context/Language/LanguageContext';
import { CATEGORIES } from '../../utils/constants';

const SwipeableCategoryFilter = memo(function SwipeableCategoryFilter({
  activeCategory,
  setActiveCategory,    // legacy prop (HomePage.jsx)
  onCategoryChange,     // new design prop
}) {
  const { currentLanguage } = useLanguage();
  const scrollRef = useRef(null);
  const handleChange = onCategoryChange || setActiveCategory;

  // Scroll active chip into view
  useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-id="${activeCategory}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeCategory]);

  const handleClick = useCallback((id) => {
    handleChange?.(id);
  }, [handleChange]);

  return (
    <div
      ref={scrollRef}
      className="horizontal-scroll flex gap-2 overflow-x-auto px-4 py-2"
      role="listbox"
      aria-label="Filter by category"
    >
      {CATEGORIES.map((cat) => {
        const label = cat.name?.[currentLanguage] ?? cat.name?.en ?? cat.name ?? '';
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            data-id={cat.id}
            type="button"
            role="option"
            aria-selected={isActive}
            onClick={() => handleClick(cat.id)}
            className={isActive ? 'chip chip-active' : 'chip'}
          >
            <span aria-hidden>{cat.icon}</span>
            <span className="whitespace-nowrap">{label}</span>
          </button>
        );
      })}
    </div>
  );
});

export default SwipeableCategoryFilter;
