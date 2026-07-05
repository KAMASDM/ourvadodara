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
      // autoUpdate (not 'prompt'): installed PWAs were stranded on an old
      // precached index.html + old JS bundles because the update prompt was
      // never surfaced, so deployed fixes never reached them. Auto-activate
      // each new build and reload so users always run the latest code.
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
      // The complete, hand-maintained manifest lives at public/manifest.json
      // (linked from index.html). Disable VitePWA's own manifest so we don't
      // ship two competing manifests with different icons and theme colors.
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
      'firebase/storage',
      'axios',
      'date-fns',
      'i18next',
      'react-i18next',
      'i18next-browser-languagedetector',
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-placeholder',
      'lucide-react',
      'qrcode'
    ]
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