/**
 * REDSEV FCA - Service Worker Básico
 * Requerido para la instalabilidad PWA y el funcionamiento sin conexión básico.
 */

const CACHE_NAME = 'redsev-fca-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Estrategia: Red primero, con caída a caché para recursos estáticos
  // Esto asegura que los documentos del repositorio siempre estén actualizados
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
