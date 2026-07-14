// =============================================
// src/hooks/useAutoHideOnScroll.js
// Shared scroll-direction auto-hide for fixed
// chrome (header, sticky control bars). Hides on
// scroll down, reappears on scroll up / near top.
// =============================================
import { useEffect, useRef, useState } from 'react';

export const useAutoHideOnScroll = ({ enabled = true } = {}) => {
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const hiddenRef = useRef(false);
  const tickingRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      hiddenRef.current = false;
      setIsHidden(false);
      return undefined;
    }

    const setHiddenIfChanged = (nextHidden) => {
      if (hiddenRef.current === nextHidden) return;
      hiddenRef.current = nextHidden;
      setIsHidden(nextHidden);
    };

    const show = () => setHiddenIfChanged(false);

    const handleScroll = () => {
      if (tickingRef.current) return;

      tickingRef.current = true;
      requestAnimationFrame(() => {
        const currentY = Math.max(window.scrollY, 0);
        const delta = currentY - lastScrollY.current;
        const nearTop = currentY < 48;
        const nearBottom = window.innerHeight + currentY >= document.documentElement.scrollHeight - 96;

        if (nearTop || nearBottom || delta < -8) {
          setHiddenIfChanged(false);
        } else if (delta > 10 && currentY > 120) {
          setHiddenIfChanged(true);
        }

        lastScrollY.current = currentY;
        tickingRef.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('focusin', show);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('focusin', show);
    };
  }, [enabled]);

  return isHidden;
};

export default useAutoHideOnScroll;
