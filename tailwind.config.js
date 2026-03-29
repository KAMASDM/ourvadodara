// =============================================
// tailwind.config.js
// =============================================
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand — deep indigo, professional & editorial
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',  // main brand
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Accent — warm saffron/orange (local Vadodara feel, Google News-like)
        accent: '#f97316',
        'accent-hover': '#ea580c',
        // Breaking / alert red
        danger: '#ef4444',
        // Neutral slate — replaces ivory + warmBrown
        neutral: {
          0:   '#ffffff',
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Keep legacy aliases so existing components don't hard-error
        ivory: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
          300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
          600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a',
        },
        warmBrown: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
          300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
          600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a',
        },
        gray: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
          300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
          600: '#475569', 700: '#334155', 800: '#1e293b',
          900: '#0f172a', 950: '#020617',
        },
        // Semantic tokens
        'text-light':   '#f8fafc',
        'text-dark':    '#0f172a',
        'bg-light':     '#ffffff',
        'bg-dark':      '#0f172a',
        'bg-card-light':'#ffffff',
        'bg-card-dark': '#1e293b',
        'border-light': '#e2e8f0',
        'border-dark':  '#334155',
        'surface-light':'#f1f5f9',
        'surface-dark': '#1e293b',
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
        'card-hover': '0 4px 16px -4px rgb(0 0 0 / 0.12)',
        'nav': '0 -1px 0 0 rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
}