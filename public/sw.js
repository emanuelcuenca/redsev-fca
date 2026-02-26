
// Service Worker mínimo para cumplir con los requisitos de PWA (Instalabilidad)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Estrategia de red primero para asegurar que los datos estén siempre actualizados
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
