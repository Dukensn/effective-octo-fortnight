import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'avatars/*.jpg', 'icons/*.png'],
      manifest: {
        name: 'École Mixte Solonart',
        short_name: 'Solonart',
        description: "Gestion scolaire : élèves, notes, bulletins, badges, finance.",
        lang: 'fr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f5f8fd',
        theme_color: '#0f5ae0',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: 'index.html',
        // Moteur ONNX (WebAssembly, ~21 Mo) : gardé au 1er usage pour que l'assistant marche hors ligne.
        runtimeCaching: [
          { urlPattern: /\/assets\/ort-wasm[^/]*\.(?:wasm|mjs)$/, handler: 'CacheFirst', options: { cacheName: 'ia-moteur', expiration: { maxEntries: 4 } } },
        ]
      }
    })
  ],
  worker: { format: 'es' },
  build: { chunkSizeWarningLimit: 1500 }
});
