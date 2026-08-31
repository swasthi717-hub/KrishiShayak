import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // we're supplying public/manifest.json ourselves
      includeAssets: ['favicon.svg'],
      workbox: {
        runtimeCaching: [
          {
            // Supabase REST reads (mandi prices, weather, schemes, etc.)
            // NetworkFirst = try the network, fall back to cache if offline.
            // Right choice for data that changes often but should still
            // be viewable stale rather than not at all.
            urlPattern: ({ url }) =>
              url.hostname.endsWith('.supabase.co') &&
              url.pathname.startsWith('/rest/v1/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 6 }, // 6h
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // Images (crop photos, icons) — CacheFirst since these rarely
            // change once uploaded; no point re-fetching over the network
            // every time.
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 } // 30d
            }
          }
        ]
      }
    })
  ]
})
