// =============================================
// src/components/Shared/Logo.jsx
// Logo tile — ivory wash, warmBrown border,
// soft glow, 3 sizes.
// =============================================
import React from 'react';
import logoSrc from '../../assets/images/our-vadodara-logo.png.png';

const SIZES = {
  sm: 'w-10 h-10 rounded-lg p-1 border-2',
  md: 'w-14 h-14 rounded-xl p-1.5 border-2',
  lg: 'w-24 h-24 rounded-2xl p-2 border-2',
};

export default function Logo({ size = 'sm', className = '', alt = 'Our Vadodara' }) {
  return (
    <div
      className={`relative flex-shrink-0 ${SIZES[size] || SIZES.sm}
        bg-gradient-to-br from-ivory-50 to-ivory-100
        border-warmBrown-300 shadow-ivory
        flex items-center justify-center
        ${className}`}
    >
      <div
        aria-hidden
        className="absolute inset-0 rounded-[inherit] blur-md opacity-40
          bg-gradient-to-br from-warmBrown-400 to-warmBrown-600
          -z-10"
      />
      <img
        src={logoSrc}
        alt={alt}
        width="96"
        height="96"
        loading="eager"
        decoding="async"
        className="w-full h-full object-contain relative"
      />
    </div>
  );
}
