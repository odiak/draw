import { registerSW } from 'virtual:pwa-register'

export function initializeServiceWorker() {
  if ('serviceWorker' in navigator) {
    registerSW()
  }
}
