// Service Worker mínimo — solo cumple el requisito de instalabilidad de la PWA.
// No cachea nada: la app siempre pide todo a la red.
// Sin handler de `fetch` a propósito: uno vacío no cambia nada y Chrome avisa que agrega
// overhead en cada navegación. La instalabilidad ya no lo exige.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
