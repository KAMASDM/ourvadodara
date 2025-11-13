// =============================================
// src/components/Common/HeartAnimation.jsx
// Instagram-style Heart Like Animation
// =============================================
import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

const HeartAnimation = ({ show, onComplete, position = { x: 0, y: 0 } }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      
      // Remove after animation completes
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="animate-heart-pop">
        <Heart 
          className="w-24 h-24 text-red-500 fill-current drop-shadow-2xl"
          strokeWidth={1.5}
        />
      </div>
      <style jsx>{`
        @keyframes heartPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(0.8);
            opacity: 0;
          }
        }

        .animate-heart-pop {
          animation: heartPop 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
};

export default HeartAnimation;
