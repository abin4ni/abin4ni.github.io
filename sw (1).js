// ── 課程進度追蹤 Service Worker ──────────────────────────────────
const CACHE_NAME = 'course-tracker-v3';
const APP_SHELL = ['./course-tracker.html','./manifest.json'];

// Install
self.addEventListener('install', event => {
  console.log('[SW] install', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(APP_SHELL.map(u => cache.add(u).catch(e => console.warn('[SW] miss:', u, e))))
    ).then(() => self.skipWaiting())
  );
});

// Activate – 清除舊快取
self.addEventListener('activate', event => {
  console.log('[SW] activate', CACHE_NAME);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch – Cache-first for app shell; pass-through for Firebase/Google
self.addEventListener('fetch', event => {
  const { hostname } = new URL(event.request.url);
  const isExternal = ['firebase','google','gstatic','googleapis','firebaseio'].some(h => hostname.includes(h));
  if (isExternal) return; // let browser handle Firebase requests natively

  event.respondWith(
    caches.match(event.request).then(cached => {
      // Stale-while-revalidate: return cache immediately, refresh in background
      const networkFetch = fetch(event.request)
        .then(resp => {
          if (resp && resp.status === 200 && resp.type !== 'opaque') {
            caches.open(CACHE_NAME).then(c => c.put(event.request, resp.clone()));
          }
          return resp;
        })
        .catch(() => null);

      return cached || networkFetch.then(r => r || caches.match('./course-tracker.html'));
    })
  );
});

// Background Sync – fires when device comes back online
self.addEventListener('sync', event => {
  if (event.tag === 'sync-state') {
    console.log('[SW] background sync: sync-state');
    event.waitUntil(
      self.clients.matchAll({ type: 'window' })
        .then(clients => clients.forEach(c => c.postMessage({ type: 'FLUSH_SYNC' })))
    );
  }
});

// Message from main thread
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
