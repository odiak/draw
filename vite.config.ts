import { PluginOption, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import svgr from 'vite-plugin-svgr'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig((env) => {
  const kakeruSecrets = fs.readFileSync('./secrets.json', 'utf-8')
  const isRecaptchaEnabled = env.mode === 'production'

  const vitePwa = VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/i\.kakeru\.app\//i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 7 // 1週間
            },
            networkTimeoutSeconds: 10
          }
        }
      ]
    },
    manifest: {
      name: 'Kakeru',
      short_name: 'Kakeru',
      description: 'A whiteboard app on the Web',
      start_url: 'https://kakeru.app',
      theme_color: '#555555',
      icons: [
        // アイコンの設定をここに追加
        {
          src: '/kakeru-icon.svg',
          sizes: '195x195',
          type: 'image/svg+xml'
        }
      ],
      background_color: '#ffffff',
      display: 'standalone'
    }
  })

  return {
    plugins: [react(), svgr(), modifyHtml(), vitePwa],
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
