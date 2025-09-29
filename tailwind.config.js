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
        // Our Vadodara Brand Colors
        'primary-red': '#E44F4F', // The prominent red from the logo (adjust if needed to match exact hex)
        'secondary-red': '#B23A3A', // A slightly darker red for hover/active states
        'text-light': '#F8FAFC', // Light text, e.g., on dark backgrounds (similar to white)
        'text-dark': '#1A202C',  // Dark text, e.g., on light backgrounds (similar to black)
        'bg-light': '#F8FAFC',  // Light background (similar to white)
        'bg-dark': '#1A202C',   // Dark background (similar to black)
        'border-light': '#E2E8F0', // Light border color
        'border-dark': '#2D3748', // Dark border color
        'accent-red': '#CC0000', // A pure, strong red for accents
      },
      fontFamily: {
        // You can add custom fonts here if needed
        // sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}