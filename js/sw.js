/* Romance Journey Service Worker
 * 版本号采用 yyyymmdd（与 index.html / manifest 同步）：
 *   - 任意资源发版日 → APP_VERSION 改写为当天日期；
 *   - 同一天多次发版可在后面追加 -HHMM，例如 20260620-1830；
 *   - 新版 SW 安装完成后会主动 skipWaiting + 清理旧 cache，避免「老缓存覆盖新代码」。
 * 文件位置：本 SW 位于 /js/sw.js，但注册时 scope 强制为 '/'（依赖
 *   nginx 返回 Service-Worker-Allowed: /），因此 SHELL 内全部使用根绝对路径，
 *   不能再用 './' 这类相对路径，否则会解析到 /js/ 下导致预缓存全部失败。 */
const APP_VERSION = '20260913-01';
const CACHE_NAME  = 'romance-journey-' + APP_VERSION;

/* 需要预缓存的应用外壳；统一使用根绝对路径，避免 SW 落在子目录时 './' 被解析到 /js/。
 * 注意：带 ?v= 的请求与不带的视作两条不同 entry，
 * 这里只缓存「干净 URL」，运行时拦截会把 ?v= 请求重写到干净 URL 命中缓存。 */
const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/js/config.js',
  '/js/lunar.js',
  '/js/store.js',
  '/js/auth.js',
  '/js/app.js',
  '/icons/favicon.svg',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-512-maskable.png',
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

function fetchWithTimeout(request, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(request, { signal: ctrl.signal })
    .finally(() => clearTimeout(timer));
}

function putCache(cacheKey, res) {
  if (res && res.status === 200 && res.type === 'basic') {
    const copy = res.clone();
    caches.open(CACHE_NAME).then((c) => c.put(cacheKey, copy)).catch(() => {});
  }
  return res;
}

function matchStatic(req, cleanReq) {
  return caches.match(req).then((cached) => cached || caches.match(cleanReq));
}

/* 抓取策略：
 *   - HTML / manifest.json：network-first，离线降级到缓存；
 *   - JS / CSS：network-first，离线时降级到缓存，避免代码更新后仍运行旧脚本；
 *   - 其它同源静态资源：cache-first + 后台更新；
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
      fetchWithTimeout(req, 3500)
        .then((res) => putCache(req, res))
        .catch(() => caches.match(req).then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  // JS/CSS 优先网络：改代码后即使忘记手动改 ?v=，刷新也能拿到新内容；离线再回退缓存。
  const cleanUrl = url.origin + url.pathname;
  const cleanReq = new Request(cleanUrl, { credentials: req.credentials });
  const isFreshAsset = /\.(?:js|css)$/.test(url.pathname);

  if (isFreshAsset) {
    const cacheKey = url.search ? req : cleanReq;
    event.respondWith(
      fetchWithTimeout(req, 2500)
        .then((res) => putCache(cacheKey, res))
        .catch(() => matchStatic(cacheKey, cleanReq))
    );
    return;
  }

  event.respondWith(
    matchStatic(req, cleanReq).then((cached) => {
      const network = fetch(req).then((res) => {
        return putCache(cleanReq, res);
      }).catch(() => cached);
      return cached || network;
    })
  );
});
