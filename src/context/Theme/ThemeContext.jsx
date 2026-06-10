// =============================================
// src/context/Theme/ThemeContext.jsx
// =============================================
import React, { createContext, useContext, useEffect } from 'react';
import { THEMES } from '../../utils/constants';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const theme = THEMES.LIGHT;

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    localStorage.setItem('theme', THEMES.LIGHT);
  }, []);

  const value = {
    theme,
    toggleTheme: () => {},
    isDark: false,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
