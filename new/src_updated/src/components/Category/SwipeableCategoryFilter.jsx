// =============================================
// src/components/Category/SwipeableCategoryFilter.jsx
// Category chips — pointer-events drag, snap scroll,
// edge fade, keyboard arrow-nav.
// =============================================
import React, { memo, useRef, useCallback, useEffect } from 'react';
import { CATEGORIES } from '../../data/categories';

const SwipeableCategoryFilter = memo(function SwipeableCategoryFilter({
  activeCategory = 'all',
  onCategoryChange,
}) {
  const railRef = useRef(null);
  const dragState = useRef({ down: false, startX: 0, startScroll: 0, moved: false });

  const onPointerDown = useCallback((e) => {
    const el = railRef.current; if (!el) return;
    dragState.current = { down: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
    el.setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    const s = dragState.current; if (!s.down) return;
    const dx = e.clientX - s.startX;
    if (Math.abs(dx) > 4) s.moved = true;
    railRef.current.scrollLeft = s.startScroll - dx;
  }, []);

  const onPointerUp = useCallback((e) => {
    const el = railRef.current;
    dragState.current.down = false;
    el?.releasePointerCapture?.(e.pointerId);
  }, []);

  const select = useCallback((id) => {
    if (dragState.current.moved) return; // ignore tap after drag
    onCategoryChange?.(id);
  }, [onCategoryChange]);

  // Auto-scroll active into view
  useEffect(() => {
    const el = railRef.current?.querySelector(`[data-cat="${activeCategory}"]`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeCategory]);

  const onKey = useCallback((e) => {
    const idx = CATEGORIES.findIndex(c => c.id === activeCategory);
    if (e.key === 'ArrowRight') { e.preventDefault(); onCategoryChange?.(CATEGORIES[(idx + 1) % CATEGORIES.length].id); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); onCategoryChange?.(CATEGORIES[(idx - 1 + CATEGORIES.length) % CATEGORIES.length].id); }
  }, [activeCategory, onCategoryChange]);

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-neutral-50 dark:from-neutral-950 to-transparent z-10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-neutral-50 dark:from-neutral-950 to-transparent z-10"
        aria-hidden
      />
      <div
        ref={railRef}
        role="tablist"
        aria-label="News categories"
        onKeyDown={onKey}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="horizontal-scroll flex gap-2 overflow-x-auto px-4 py-3 cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: 'pan-x' }}
      >
        {CATEGORIES.map((c) => {
          const active = c.id === activeCategory;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              data-cat={c.id}
              onClick={() => select(c.id)}
              className={active ? 'chip-active' : 'chip'}
            >
              {c.emoji && <span aria-hidden>{c.emoji}</span>}
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default SwipeableCategoryFilter;
