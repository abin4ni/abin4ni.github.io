// ── 課程進度追蹤 Service Worker v4 ───────────────────────────────
// 策略：HTML → network-first（確保永遠取得最新版）
//        靜態資源 → cache-first（加速載入）
//        Firebase / Google → 直接穿透

const CACHE_NAME  = 'course-tracker-v5';
const STATIC_EXTS = ['.js', '.css', '.png', '.jpg', '.svg', '.ico', '.woff2'];
const HTML_FILES  = ['/index.html', '/'];

// ── Install：只快取非 HTML 靜態資源 ──────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] install', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(['/manifest.json']))   // 只快取 manifest
      .then(() => self.skipWaiting())
  );
});

// ── Activate：清除舊版快取，立即接管 ─────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] activate', CACHE_NAME);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] deleting old cache:', k);
          return caches.delete(k);
        })
      ))
      .then(() => self.clients.claim())
      .then(() => {
        // 通知所有分頁有新版本
        return self.clients.matchAll({ type: 'window' }).then(clients =>
          clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }))
        );
      })
  );
});

// ── Fetch：分策略處理 ─────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Firebase / Google — 完全穿透，不攔截
  const isExternal = ['firebase', 'google', 'gstatic', 'googleapis', 'firebaseio']
    .some(h => url.hostname.includes(h));
  if (isExternal) return;

  // 2. HTML 檔案 — network-first，失敗才回傳快取版本
  const isHTML = HTML_FILES.includes(url.pathname) ||
    url.pathname.endsWith('.html');
  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          // 成功：更新快取並回傳
          if (resp && resp.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, resp.clone()));
          }
          return resp;
        })
        .catch(() => {
          // 網路失敗：回傳快取版本（離線模式）
          console.log('[SW] Offline fallback for:', url.pathname);
          return caches.match(event.request) || caches.match('/index.html');
        })
    );
    return;
  }

  // 3. 靜態資源（JS / CSS / fonts / images）— cache-first
  const isStatic = STATIC_EXTS.some(ext => url.pathname.endsWith(ext));
  if (isStatic) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(resp => {
          if (resp && resp.status === 200 && resp.type !== 'opaque') {
            caches.open(CACHE_NAME).then(c => c.put(event.request, resp.clone()));
          }
          return resp;
        });
      })
    );
    return;
  }

  // 4. 其他請求 — 直接穿透
});

// ── Background Sync ───────────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-state') {
    console.log('[SW] background sync triggered');
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients =>
        clients.forEach(c => c.postMessage({ type: 'FLUSH_SYNC' }))
      )
    );
  }
});

// ── Message from main thread ──────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('[SW] skip waiting — installing new version');
    self.skipWaiting();
  }
});
