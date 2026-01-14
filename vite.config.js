import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure proper routing for SPA
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})

