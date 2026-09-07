// Service Worker mínimo — solo cumple el requisito de instalabilidad de la PWA.
// No cachea nada (fetch handler no-op): la app siempre pide todo a la red.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // no-op: dejamos pasar todas las requests directo a la red
})
