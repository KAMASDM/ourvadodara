// =============================================
// src/components/Common/SplashScreen.jsx
// Splash screen component that shows app logo for 3 seconds
// =============================================
import React, { useEffect } from 'react';
import logoImage from '../../assets/images/our-vadodara-logo.png.png';

const SplashScreen = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000); // Show for 3 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo with animation */}
        <div className="mb-8 animate-pulse">
          <img 
            src={logoImage} 
            alt="Our Vadodara" 
            className="w-32 h-32 mx-auto object-contain filter drop-shadow-2xl"
          />
        </div>
        
        {/* App Name */}
        <h1 className="text-4xl font-bold text-white mb-2 animate-fade-in">
          Our Vadodara
        </h1>
        
        {/* Tagline */}
        <p className="text-blue-100 text-lg font-medium animate-fade-in-delayed">
          Your Local News Hub
        </p>
        
        {/* Loading indicator */}
        <div className="mt-8">
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-blue-200 text-sm mt-2">Loading...</p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;