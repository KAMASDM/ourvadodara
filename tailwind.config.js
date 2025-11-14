// =============================================
// tailwind.config.js
// =============================================
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode based on 'class'
  theme: {
    extend: {
      colors: {
        // Modern Red, Black & White Theme
        primary: {
          50: '#fef2f2',   // Very light red
          100: '#fee2e2',  // Light red
          200: '#fecaca',  // Lighter red
          300: '#fca5a5',  // Medium light red
          400: '#f87171',  // Medium red
          500: '#ef4444',  // Main red (primary)
          600: '#dc2626',  // Darker red
          700: '#b91c1c',  // Dark red
          800: '#991b1b',  // Very dark red
          900: '#7f1d1d',  // Darkest red
        },
        // Ivory Color Palette for Light Mode
        ivory: {
          50: '#fffef9',   // Almost white ivory
          100: '#fffcf0',  // Very light ivory
          200: '#fff9e6',  // Light ivory
          300: '#fff5d9',  // Medium light ivory
          400: '#ffefcc',  // Medium ivory
          500: '#ffe9bf',  // Main ivory
          600: '#f5e0b3',  // Darker ivory
          700: '#e6d4a3',  // Dark ivory
          800: '#d4c189',  // Very dark ivory
          900: '#c2ae70',  // Darkest ivory
        },
        // Warm accent colors for ivory theme
        warmBrown: {
          50: '#faf8f5',
          100: '#f5f1ea',
          200: '#ebe3d5',
          300: '#d9cbb8',
          400: '#c4b09a',
          500: '#a8926f',  // Main warm brown
          600: '#8f7a5d',
          700: '#73624b',
          800: '#5a4d3c',
          900: '#443a2f',
        },
        gray: {
          50: '#fafafa',   // Almost white
          100: '#f4f4f5',  // Very light gray
          200: '#e4e4e7',  // Light gray
          300: '#d4d4d8',  // Medium light gray
          400: '#a1a1aa',  // Medium gray
          500: '#71717a',  // Main gray
          600: '#52525b',  // Darker gray
          700: '#3f3f46',  // Dark gray
          800: '#27272a',  // Very dark gray
          900: '#18181b',  // Almost black
        },
        // Semantic colors using red, black, white theme
        'text-light': '#fafafa',     // White text for dark backgrounds
        'text-dark': '#18181b',      // Black text for light backgrounds
        'bg-light': '#ffffff',       // Pure white background
        'bg-dark': '#18181b',        // Pure black background
        'bg-card-light': '#fafafa',  // Light gray for cards on white
        'bg-card-dark': '#27272a',   // Dark gray for cards on black
        'border-light': '#e4e4e7',   // Light border
        'border-dark': '#3f3f46',    // Dark border
        'accent': '#ef4444',         // Primary red accent
        'accent-hover': '#dc2626',   // Darker red for hover states
        'surface-light': '#f4f4f5',  // Light surface color
        'surface-dark': '#27272a',   // Dark surface color
      },
      fontFamily: {
        // You can add custom fonts here if needed
        // sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}