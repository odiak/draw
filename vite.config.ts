import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vitejs.dev/config/
console.log(process.env.NODE_ENV)
export default defineConfig((env) => {
  const kakeruSecrets = fs.readFileSync('./secrets.json', 'utf-8')
  const isRecaptchaEnabled = env.mode === 'production'

  return {
    plugins: [react()],
    define: {
      kakeruSecrets,
      isRecaptchaEnabled
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
  }
})
