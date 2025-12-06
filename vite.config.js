import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      include: "**/*.{jsx,tsx}"
    }),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}']
      },
      manifest: {
        name: 'Our Vadodara - Local News Hub',
        short_name: 'Our Vadodara',
        description: 'Your local news hub for Vadodara city',
        theme_color: '#f97316',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173,
    hmr: {
      port: 5173
    },
    fs: {
      strict: false
    }
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'firebase/app',
      'firebase/auth',
      'firebase/database',
      'firebase/storage'
    ],
    force: true
  },
  build: {
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Firebase modules
          if (id.includes('firebase')) {
            return 'firebase';
          }
          // React core
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router-dom')) {
            return 'react-vendor';
          }
          // UI libraries
          if (id.includes('lucide-react') || 
              id.includes('@headlessui') || 
              id.includes('@heroicons')) {
            return 'ui-vendor';
          }
        }
      }
    }
  }
})