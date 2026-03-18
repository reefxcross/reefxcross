const CACHE = 'reefxcross-static-v1';

// Only cache static assets — NEVER cache index.html
// This means app updates are instant without reinstalling
const STATIC_ASSETS = [
      'https://fonts.googleapis.com/css2?family=Pacifico&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap',
      'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
    ];

self.addEventListener('install', e => {
      e.waitUntil(
              caches.open(CACHE).then(c =>
                        Promise.allSettled(STATIC_ASSETS.map(url => c.add(url).catch(() => {})))
                                          )
            );
      self.skipWaiting();
});

self.addEventListener('activate', e => {
      e.waitUntil(
              caches.keys().then(keys =>
                        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
                                     )
            );
      self.clients.claim();
});

self.addEventListener('fetch', e => {
      const url = new URL(e.request.url);

                        // Always fetch index.html fresh from network — this is the key to instant updates
                        if (url.pathname === '/' || url.pathname === '/index.html') {
                                e.respondWith(
                                          fetch(e.request).catch(() => caches.match('/index.html'))
                                        );
                                return;
                        }

                        // For static assets (fonts, Chart.js) use cache-first
                        e.respondWith(
                                caches.match(e.request).then(cached => {
                                          if (cached) return cached;
                                          return fetch(e.request).then(response => {
                                                      if (response && response.status === 200) {
                                                                    const clone = response.clone();
                                                                    caches.open(CACHE).then(c => c.put(e.request, clone));
                                                      }
                                                      return response;
                                          }).catch(() => cached);
                                })
                              );
});
