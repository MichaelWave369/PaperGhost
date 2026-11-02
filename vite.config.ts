import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/PaperGhost/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['ghost.svg'],
      manifest: {
        name: 'PaperGhost | Digital Paper Vessel',
        short_name: 'PaperGhost',
        description: 'Your paper-like, private digital library.',
        theme_color: '#14233a',
        background_color: '#f2e9d8',
        display: 'standalone',
        scope: '/PaperGhost/',
        start_url: '/PaperGhost/',
        icons: [{ src: 'ghost.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
      }
    })
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
});
