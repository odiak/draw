import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    kakeruSecrets: fs.readFileSync('./secrets.json', 'utf-8'),
    isRecaptchaEnabled: false
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
