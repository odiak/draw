const worker = self as unknown as ServiceWorkerGlobalScope

worker.addEventListener('install', (event) => {
  event.waitUntil(worker.skipWaiting())
})

worker.addEventListener('activate', (event) => {
  event.waitUntil(worker.clients.claim())
})

const prefix = `${location.origin}/`
const extensionsToExclude = ['.js', '.css', '.png', '.jpeg', '.jpg', '.json']

worker.addEventListener('fetch', (event) => {
  const { request } = event
  const base = request.url.split('?').at(0)?.split('/').at(-1)?.toLowerCase() ?? ''
  if (
    event.request.method === 'GET' &&
    event.request.url.startsWith(prefix) &&
    !extensionsToExclude.some((x) => base.endsWith(x))
  ) {
    const request = new Request(event.request, {
      headers: {
        'Kakeru-No-OGP': '1'
      }
    })
    return event.respondWith(fetch(request))
  }
})
