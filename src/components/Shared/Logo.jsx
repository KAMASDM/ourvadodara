// =============================================
// src/components/Shared/Logo.jsx
// =============================================
import React from 'react';
import ourVadodaraLogo from '../../assets/images/our-vadodara-logo.png.png';

const Logo = ({ className = '', onClick }) => {
  return (
    <div className={`flex items-center cursor-pointer ${className}`} onClick={onClick}>
      <div className="h-10 w-10 bg-white dark:bg-white rounded-lg p-1 shadow-sm flex items-center justify-center">
        <img
          src={ourVadodaraLogo}
          alt="Our Vadodara Logo"
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );
};

export default Logo;