// =============================================
// src/hooks/useDoubleTap.js
// Double-Tap Gesture Hook with Animation
// =============================================
import { useCallback, useRef } from 'react';

/**
 * Double-tap gesture detection hook
 * @param {Function} onDoubleTap - Callback when double tap detected
 * @param {Object} options - Configuration options
 * @returns {Function} - Tap handler function
 */
export const useDoubleTap = (onDoubleTap, options = {}) => {
  const { delay = 300 } = options;
  const lastTap = useRef(0);

  const handleTap = useCallback((event) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTap.current;

    if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
      // Double tap detected
      event.preventDefault();
      event.stopPropagation();
      onDoubleTap(event);
      lastTap.current = 0;
    } else {
      // First tap or timeout exceeded
      lastTap.current = now;
    }
  }, [onDoubleTap, delay]);

  return handleTap;
};
