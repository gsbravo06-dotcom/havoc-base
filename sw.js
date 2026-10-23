const CACHE_NAME = 'bravo-ops-cache-v8';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/pwa.js',
  './manifest.json',
  './icons/logo.jpg',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pré-carregando arquivos essenciais...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignora chamadas de API para tentar rede primeiro com fallback
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Se a API falhar offline, retorna resposta mockada se for quotes
        if (event.request.url.includes('/api/quotes/random')) {
          return new Response(JSON.stringify({
            success: true,
            data: {
              text: "Bendito seja o Senhor, minha rocha, que adestra as minhas mãos para a peleja e os meus dedos para a guerra.",
              author: "Salmos 144:1",
              category: "biblico"
            }
          }), { headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ success: false, offline: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Para assets estáticos: Network-first com fallback pro cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
