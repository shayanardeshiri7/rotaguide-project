import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  // The app is served from its own Vercel project at the root, but the
  // marketing site also embeds it under /app/ — a relative base keeps
  // both working without a rebuild.
  base: './',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'RotaGuide — Injection Site Tracker',
        short_name: 'RotaGuide',
        description:
          'Track insulin injection-site rotation. All data stays on your device.',
        theme_color: '#2D7A5F',
        background_color: '#F7F5F2',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Cloud sync is opt-in and needs the network anyway, so its
        // chunk is fetched on demand rather than bloating the offline
        // install for the majority who never enable it.
        globIgnores: ['**/supabase-*.js'],
        // Injection data never leaves the device, so there is nothing to
        // sync in the background and no network route worth caching.
        navigateFallback: 'index.html',
      },
    }),
  ],
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Stable name so the service worker can exclude this chunk from
        // the offline precache by pattern.
        manualChunks(id) {
          if (id.includes('@supabase')) return 'supabase';
          return undefined;
        },
      },
    },
  },
});
