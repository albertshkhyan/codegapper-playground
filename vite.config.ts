import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import Terminal from 'vite-plugin-terminal'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/codegapper-playground/' : '/',
  plugins: [
    react(),
    // Use `import { terminal } from 'virtual:terminal'` and terminal.log() for logs in the dev server terminal (stripped in production).
    Terminal(),
  ],
  server: {
    port: 3000,
    host: true, // Allow external connections for stagewise
  },
}))
