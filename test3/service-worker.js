importScripts('./js/version.js?v=353');

const META = self.MESAHA_VERSION || {"app": "V3.44", "version": "v353-hero-forest-cover", "build": 353, "visibleVersion": "V3.44 •ExelanceX•", "shortVersion": "V3.44 •ExelanceX•", "name": "Mesaha İO V3.44 •ExelanceX•", "cacheName": "mesaha-app-v353-hero-forest-cover", "builtAt": "2026-06-22T12:20:00+03:00", "notes": "Ana sayfadaki Merhaba kartına gerçek orman kapak görseli eklendi.", "assetVersion": "353"};
const CACHE_NAME = META.cacheName || 'mesaha-app-v353-hero-forest-cover';
const ASSETS = [
  "./",
  "./index.html",
  "./admin.html",
  "./manifest.json",
  "./version.json",
  "./service-worker.js",
  "./js/version.js?v=353",
  "./temizle.html",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/mesaha_logo.png",
  "./assets/hero_forest_cover.png",
  "./assets/06_net_islem_onayi.wav",
  "./assets/08_hata_uyari_onaydan_farkli.wav"
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME && k.startsWith('mesaha-app-')).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const noStore = url.pathname.endsWith('/index.html') || url.pathname.endsWith('/version.json') || url.pathname.endsWith('/service-worker.js') || url.pathname.endsWith('/js/version.js');
  if (event.request.mode === 'navigate' || noStore) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }).then(response => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(() => {});
      return response;
    }).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const clone = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(() => {});
    return response;
  })));
});
