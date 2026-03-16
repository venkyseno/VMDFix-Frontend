import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Ensure sw.js and manifest.json are copied from public/ to dist/
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  },
  // Make sure public assets (icon.jpeg, sw.js, manifest.json) are served correctly
  publicDir: 'public',
})
