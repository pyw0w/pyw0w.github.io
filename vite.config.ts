import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Anime PWA',
        short_name: 'Anime',
        start_url: '/',
        display: 'standalone',
        background_color: '#0b0b0f',
        theme_color: '#0b0b0f',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.endsWith('shikimori.io') && url.pathname.includes('/system/'),
            handler: 'CacheFirst',
            options: { cacheName: 'posters', expiration: { maxEntries: 300, maxAgeSeconds: 604800 } },
          },
          {
            urlPattern: ({ url }) => url.hostname.endsWith('shikimori.io') && url.pathname.startsWith('/api'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'shikimori-api', expiration: { maxEntries: 200, maxAgeSeconds: 3600 } },
          },
        ],
      },
    }),
  ],
  test: { environment: 'jsdom', globals: true, setupFiles: './test/setup.ts', exclude: ['worker/**', 'node_modules/**'] },
});
