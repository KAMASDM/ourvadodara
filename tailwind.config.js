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
        // GenZ Vibrant Theme - Purple & Blue Accents
        primary: {
          50: '#f5f3ff',   // Very light purple
          100: '#ede9fe',  // Light purple
          200: '#ddd6fe',  // Lighter purple
          300: '#c4b5fd',  // Medium light purple
          400: '#a78bfa',  // Medium purple
          500: '#8b5cf6',  // Main purple (primary)
          600: '#7c3aed',  // Darker purple
          700: '#6d28d9',  // Dark purple
          800: '#5b21b6',  // Very dark purple
          900: '#4c1d95',  // Darkest purple
        },
        // Vibrant accent colors
        accent: {
          blue: {
            light: '#60a5fa',
            DEFAULT: '#3b82f6',
            dark: '#2563eb',
          },
          pink: {
            light: '#f472b6',
            DEFAULT: '#ec4899',
            dark: '#db2777',
          },
          orange: {
            light: '#fb923c',
            DEFAULT: '#f97316',
            dark: '#ea580c',
          },
          green: {
            light: '#4ade80',
            DEFAULT: '#22c55e',
            dark: '#16a34a',
          },
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
        // Semantic colors using GenZ vibrant theme
        'text-light': '#fafafa',     // White text for dark backgrounds
        'text-dark': '#18181b',      // Black text for light backgrounds
        'bg-light': '#ffffff',       // Pure white background
        'bg-dark': '#0f0f1a',        // Deep dark purple-tinted background
        'bg-card-light': '#fafafa',  // Light gray for cards on white
        'bg-card-dark': '#1a1a2e',   // Dark purple-tinted cards
        'border-light': '#e4e4e7',   // Light border
        'border-dark': '#3f3f46',    // Dark border
        'accent': '#8b5cf6',         // Primary purple accent
        'accent-hover': '#7c3aed',   // Darker purple for hover states
        'surface-light': '#f4f4f5',  // Light surface color
        'surface-dark': '#1a1a2e',   // Dark purple-tinted surface
      },
      fontFamily: {
        // You can add custom fonts here if needed
        // sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}