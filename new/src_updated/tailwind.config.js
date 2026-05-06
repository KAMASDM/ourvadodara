/** @type {import('tailwindcss').Config} */
// =============================================
// tailwind.config.js
// Our Vadodara — full token set
// Drop into project root (next to package.json)
// =============================================

export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        hindi: ['"Noto Sans Devanagari"', 'Inter', 'sans-serif'],
        gujarati: ['"Noto Sans Gujarati"', 'Inter', 'sans-serif'],
      },

      // ─── Colors ────────────────────────────────────────────
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5', // primary action
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          400: '#fb923c',
          500: '#f97316', // breaking / attention
          600: '#ea580c',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444', // LIVE / SOS
          600: '#dc2626',
        },
        ivory: {
          50:  '#fffef9',
          100: '#fff9e6',
          200: '#fffcf0',
          300: '#f5e0b3',
        },
        warmBrown: {
          100: '#f3ead6',
          200: '#e9dcbb',
          300: '#d4c189',
          400: '#b9a373',
          500: '#a8926f',
          600: '#8d7859',
          700: '#73624b',
          800: '#5a4d3b',
          900: '#3f352a',
        },
        neutral: {
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
      },

      // ─── Radii ─────────────────────────────────────────────
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },

      // ─── Shadows ───────────────────────────────────────────
      boxShadow: {
        sm:          '0 1px 2px rgba(15, 23, 42, 0.05)',
        DEFAULT:     '0 1px 3px rgba(15, 23, 42, 0.1), 0 1px 2px -1px rgba(15, 23, 42, 0.1)',
        md:          '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -2px rgba(15, 23, 42, 0.1)',
        lg:          '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.1)',
        xl:          '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
        card:        '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.06)',
        'card-hover':'0 10px 20px -6px rgba(15, 23, 42, 0.15)',
        ivory:       '0 4px 6px -1px rgba(162,146,111,.1), 0 2px 4px -1px rgba(162,146,111,.06)',
        'ivory-lg':  '0 10px 15px -3px rgba(162,146,111,.15), 0 4px 6px -2px rgba(162,146,111,.1)',
        'ivory-xl':  '0 20px 25px -5px rgba(162,146,111,.2),  0 10px 10px -5px rgba(162,146,111,.1)',
        glass:       '0 8px 32px rgba(31, 38, 135, 0.15)',
        'glass-ivory':'0 8px 32px rgba(162, 146, 111, 0.15)',
        'primary-glow':'0 4px 14px rgba(79, 70, 229, 0.35)',
      },

      // ─── Type scale (tight editorial) ──────────────────────
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        xs:    ['12px', { lineHeight: '16px' }],
        sm:    ['14px', { lineHeight: '20px' }],
        base:  ['16px', { lineHeight: '24px' }],
        lg:    ['18px', { lineHeight: '26px' }],
        xl:    ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '30px', letterSpacing: '-0.01em' }],
        '3xl': ['30px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
        '4xl': ['36px', { lineHeight: '40px', letterSpacing: '-0.02em' }],
      },

      // ─── Animation ─────────────────────────────────────────
      transitionTimingFunction: {
        'standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'fade-in-up':   'fadeInUp 0.25s cubic-bezier(0.4, 0, 0.2, 1) both',
        'scale-fade':   'scaleFade 0.6s ease-out',
        'slide-up':     'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'heart-burst':  'heartBurst 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'ping-once':    'pingOnce 0.4s ease-out',
        'bounce-slow':  'bounceSlow 2s ease-in-out infinite',
        'shimmer':      'shimmer 1.5s ease-in-out infinite',
        'flame-flicker':'flameFlicker 0.6s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeInUp:     { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleFade:    { '0%': { transform: 'scale(0.8)', opacity: 0 }, '50%': { transform: 'scale(1.05)', opacity: 1 }, '100%': { transform: 'scale(1)', opacity: 0 } },
        slideUp:      { from: { transform: 'translateY(100%)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        heartBurst:   { '0%': { transform: 'scale(0)', opacity: 0 }, '15%': { transform: 'scale(1.2)', opacity: 1 }, '30%': { transform: 'scale(0.95)' }, '45%,80%': { transform: 'scale(1)', opacity: 1 }, '100%': { transform: 'scale(1.3)', opacity: 0 } },
        pingOnce:     { '0%': { transform: 'scale(1)', opacity: 1 }, '60%': { transform: 'scale(1.15)', opacity: 0.6 }, '100%': { transform: 'scale(1)', opacity: 0 } },
        bounceSlow:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        shimmer:      { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        flameFlicker: { '0%': { transform: 'scale(1) rotate(-2deg)' }, '100%': { transform: 'scale(1.08) rotate(2deg)' } },
      },

      // ─── Spacing / layout ──────────────────────────────────
      maxWidth: {
        'app':    '448px',
        'reader': '640px',
      },
      spacing: {
        'safe-top':    'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'header':      '56px',
        'tabbar':      '64px',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
};
