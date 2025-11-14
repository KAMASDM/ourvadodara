// =============================================
// src/components/Shared/Logo.jsx
// =============================================
import React from 'react';
import ourVadodaraLogo from '../../assets/images/our-vadodara-logo.png.png';

const Logo = ({ className = '', onClick }) => {
  return (
    <div className={`flex items-center cursor-pointer group ${className}`} onClick={onClick}>
      <div className="relative">
        {/* Glowing background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-warmBrown-400 to-warmBrown-600 dark:from-warmBrown-500 dark:to-warmBrown-700 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300 animate-pulse"></div>
        
        {/* Logo container with enhanced styling */}
        <div className="relative h-12 w-12 bg-gradient-to-br from-ivory-50 to-ivory-100 dark:from-white dark:to-gray-100 rounded-xl p-1.5 shadow-ivory-lg hover:shadow-ivory-xl border-2 border-warmBrown-300 dark:border-warmBrown-400 flex items-center justify-center transform group-hover:scale-105 transition-all duration-300">
          <img
            src={ourVadodaraLogo}
            alt="Our Vadodara Logo"
            className="h-full w-full object-contain drop-shadow-md"
          />
          
          {/* Shine effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-500 rounded-xl"></div>
        </div>
        
        {/* Decorative corner accents */}
        <div className="absolute -top-0.5 -left-0.5 w-2 h-2 bg-warmBrown-500 rounded-full opacity-70"></div>
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-warmBrown-500 rounded-full opacity-70"></div>
      </div>
    </div>
  );
};

export default Logo;