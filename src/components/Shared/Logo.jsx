// =============================================
// src/components/Shared/Logo.jsx
// =============================================
import React from 'react';
import ourVadodaraLogo from '../../assets/images/our-vadodara-logo.png.png';

const Logo = ({ className = '', onClick }) => {
  return (
    <img
      src={ourVadodaraLogo}
      alt="Our Vadodara Logo"
      className={`h-10 w-auto cursor-pointer ${className}`} // Adjust height as needed
      onClick={onClick}
    />
  );
};

export default Logo;