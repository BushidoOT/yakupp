importScripts('./js/version.js?v=348');

const META = self.MESAHA_VERSION || {
  "app": "V3.39",
  "version": "v348-temiz-paket-final",
  "build": 348,
  "visibleVersion": "V3.39 •ExelanceX•",
  "shortVersion": "V3.39 •ExelanceX•",
  "name": "Mesaha İO V3.39 •ExelanceX•",
  "cacheName": "mesaha-app-v348-temiz-paket-final",
  "builtAt": "2026-06-22T04:35:00+03:00",
  "notes": "Temiz paket: index/admin syntax kontrol edildi, karanlık tema ve sürüm-cache bilgileri sabitlendi.",
  "assetVersion": "348"
};
const CACHE_NAME = META.cacheName || 'mesaha-app-v348-temiz-paket-final';
const ASSET_VERSION = META.assetVersion || '348';
const ASSETS = [
  './', './index.html', './admin.html', './manifest.json', './version.json', './service-worker.js', './temizle.html',
  './js/version.js?v=' + ASSET_VERSION,
  './assets/icon-192.png', './assets/icon-512.png', './assets/mesaha_logo.png',
  './assets/06_net_islem_onayi.wav', './assets/08_hata_uyari_onaydan_farkli.wav'
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
  const fresh = event.request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/version.json') || url.pathname.endsWith('/service-worker.js') || url.pathname.endsWith('/js/version.js');
  if (fresh) {
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
