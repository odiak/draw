import { PluginOption, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig((env) => {
  const kakeruSecrets = fs.readFileSync('./secrets.json', 'utf-8')
  const isRecaptchaEnabled = env.mode === 'production'

  return {
    plugins: [react(), svgr(), modifyHtml()],
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

function modifyHtml(): PluginOption {
  return {
    name: 'modify-html',
    transformIndexHtml(html) {
      const metaTags = process.env.KAKERU_META_TAGS ?? ''
      if (metaTags === '') return html

      return html.replace('</head>', `${metaTags}</head>`)
    }
  }
}
