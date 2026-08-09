const CACHE_VERSION = 'v1';
const STATIC_CACHE = `bazar-static-${CACHE_VERSION}`;

// Recursos estáticos que queremos cachear (solo assets públicos con hash/largo plazo)
const PRECACHE_URLS = [
  '/',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
];

// Nunca cachear estas rutas: son dinámicas, sensibles o con sesión.
const NEVER_CACHE = [
  '/api/',
  '/_next/static/chunks/app/api',
  '/admin',
  '/superadmin',
  '/ventas',
  '/cart',
  '/carrito',
  '/checkout',
  '/auth/',
];

function shouldSkip(request) {
  const url = request.url;
  if (NEVER_CACHE.some((prefix) => url.includes(prefix))) return true;
  if (request.method !== 'GET') return true;
  return false;
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => console.warn('[SW] precache falló:', err)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('bazar-static-') && key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo manejar GET y peticiones http(s) del mismo origen para evitar complejidades.
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

  // Nunca cachear rutas sensibles.
  if (shouldSkip(request)) return;

  // Navegación: network-first, luego cache, luego fallo.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() =>
          caches.match('/').then((cached) => cached || caches.match(request)),
        ),
    );
    return;
  }

  // Otros GET (assets: _next/static, imágenes): stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const refresh = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || refresh;
    }),
  );
});