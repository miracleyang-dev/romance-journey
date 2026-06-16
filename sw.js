/* Romance Journey Service Worker
 * 版本号采用 yyyymmdd（与 index.html / manifest 同步）：
 *   - 任意资源发版日 → APP_VERSION 改写为当天日期；
 *   - 同一天多次发版可在后面追加 -HHMM，例如 20260616-1830；
 *   - 新版 SW 安装完成后会主动 skipWaiting + 清理旧 cache，避免「老缓存覆盖新代码」。
 */
const APP_VERSION = '20260616';
const CACHE_NAME  = 'romance-journey-' + APP_VERSION;

/* 需要预缓存的应用外壳；这里全部用相对路径以兼容子目录部署。
 * 注意：带 ?v= 的请求与不带的视作两条不同 entry，
 * 这里只缓存「干净 URL」，运行时拦截会把 ?v= 请求重写到干净 URL 命中缓存。 */
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/config.js',
  './js/lunar.js',
  './js/store.js',
  './js/auth.js',
  './js/app.js',
  './icons/favicon.svg',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // 单个失败不应阻断全部安装
      Promise.all(SHELL.map((url) =>
        cache.add(new Request(url, { cache: 'reload' })).catch(() => null)
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k.startsWith('romance-journey-') && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

/* 抓取策略：
 *   - HTML / manifest.json：network-first，离线降级到缓存；
 *   - 同源静态资源：stale-while-revalidate，剥离 ?v= 命中缓存；
 *   - Supabase / 第三方 / 非 GET：直通网络，不缓存。 */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 不拦截跨域（Supabase 等）

  const accept = req.headers.get('accept') || '';
  const isHTML = req.mode === 'navigate' || accept.includes('text/html');
  const isManifest = url.pathname.endsWith('/manifest.json');

  if (isHTML || isManifest) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // 静态资源：剥离 ?v= 后再做 cache key
  const cleanUrl = url.origin + url.pathname;
  const cleanReq = new Request(cleanUrl, { credentials: req.credentials });

  event.respondWith(
    caches.match(cleanReq).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(cleanReq, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
