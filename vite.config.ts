import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import Terminal from 'vite-plugin-terminal'

const PWA_APP_NAME = 'CodeGapper Playground'
const PWA_SHORT_NAME = 'CodeGapper'
const PWA_THEME_COLOR = '#0f172a'
const PWA_DESCRIPTION =
  'Interactive JavaScript learning tool that generates fill-in-the-blanks exercises from your code using AST parsing.'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? '/codegapper-playground/' : '/'
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        scope: base,
        manifest: {
          name: PWA_APP_NAME,
          short_name: PWA_SHORT_NAME,
          description: PWA_DESCRIPTION,
          theme_color: PWA_THEME_COLOR,
          background_color: PWA_THEME_COLOR,
          display: 'standalone',
          start_url: base,
          icons: [
            { src: `${base}launchericon-192-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: `${base}launchericon-512-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          navigateFallback: `${base}index.html`,
          navigateFallbackDenylist: [/^\/api\//],
        },
      }),
      // Use `import { terminal } from 'virtual:terminal'` and terminal.log() for logs in the dev server terminal (stripped in production).
      Terminal(),
    ],
    server: {
      port: 3000,
      host: true, // Allow external connections for stagewise
    },
  }
})
