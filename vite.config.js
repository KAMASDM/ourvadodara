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
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.png', 'logo.png', 'icons/*.png'],
      useCredentials: true,
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      devOptions: {
        enabled: true
      },
      // Use our existing manifest.json instead of generating one
      manifest: false
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
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})