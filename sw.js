// ── StudyOS Service Worker v10 ──────────────────────────────────
// HTML 先向網路重新驗證，離線時才讀取頁面快取。介面發版時一併更新快取版本。
//        同源靜態資源 → cache-first（加速載入）
//        Firebase / Google → 直接穿透
// 全部使用相對路徑，放在 GitHub Pages 子路徑（/repo-name/）也能正常運作

const CACHE_NAME  = 'course-tracker-v10';
const STATIC_EXTS = ['.js', '.css', '.png', '.jpg', '.svg', '.ico', '.woff2', '.json'];
const PRECACHE    = ['./manifest.json', './icon-192.png', './icon-512.png'];
const EXTERNAL    = ['firebase', 'google', 'gstatic', 'googleapis', 'firebaseio'];

// Keep the previous worker active until the new HTML is cached and the client updates.
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(['./index.html', './studyos-intro.js?v=3'].map(url => new Request(url, { cache: 'reload' })));
    await Promise.all(PRECACHE.map(url =>
      cache.add(new Request(url, { cache: 'reload' })).catch(error => console.warn('[SW] precache skip', url, error))
    ));
  })());
});

// ── Activate：清除舊快取並接管；只有「升級」時才通知頁面 ──────────────
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const old = keys.filter(key => /^course-tracker-v\d+$/.test(key) && key !== CACHE_NAME);
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
    if (old.length) {
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }));
    }
  })());
});

// ── Fetch ─────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // 1. Firebase / Google：不攔截
  if (EXTERNAL.some(h => url.hostname.includes(h))) return;

  // 2. 其他網域：不攔截
  if (url.origin !== self.location.origin) return;

  // 3. HTML / 頁面導覽：network-first
  const isHTML = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if (isHTML) {
    event.respondWith((async () => {
      try {
        const resp = await fetch(req, { cache: 'no-cache' });
        if (resp.ok) {
          const copy = resp.clone();
          try {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(req, copy);
          } catch (error) {
            console.warn('[SW] Could not cache HTML', error);
          }
        }
        return resp;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(req, { ignoreSearch: true }))
            || (await cache.match('./index.html'))
            || (await cache.match('./'))
            || new Response('離線中，且尚無快取版本。', {
                 status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
               });
      }
    })());
    return;
  }

  // 4. 同源靜態資源：cache-first
  if (STATIC_EXTS.some(ext => url.pathname.endsWith(ext))) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => cache.match(req)).then(cached => {
        if (cached) return cached;
        return fetch(req).then(resp => {
          if (resp && resp.status === 200 && resp.type === 'basic') {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copy));
          }
          return resp;
        });
      })
    );
  }
});

// ── Background Sync ───────────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-state') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients =>
        clients.forEach(c => c.postMessage({ type: 'FLUSH_SYNC' }))
      )
    );
  }
});

// ── Message from main thread ──────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
