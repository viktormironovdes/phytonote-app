// ================================================================
// SERVICE WORKER (sw.js)
// ================================================================

const CACHE_NAME = 'phytonote-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/data.js',
  '/js/ui.js',
  '/js/calendar.js',
  '/js/care.js',
  '/js/catalog.js',
  '/js/collections.js',
  '/js/flower.js',
  '/js/settings.js',
  '/js/utils.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Кешируем файлы...');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) {
          return cached;
        }
        return fetch(event.request)
          .then(response => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
            return response;
          });
      })
      .catch(() => {
        return new Response('🌿 PhytoNote офлайн', {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        });
      })
  );
});
