importScripts('./js/version.js?v=356');

const META = self.MESAHA_VERSION || {"app": "V3.47", "version": "v356-cap-boy-limit", "build": 356, "visibleVersion": "V3.47 •ExelanceX•", "shortVersion": "V3.47 •ExelanceX•", "name": "Mesaha İO V3.47 •ExelanceX•", "cacheName": "mesaha-app-v356-cap-boy-limit", "builtAt": "2026-06-22T13:10:00+03:00", "notes": "Çap 200 üstü ve boy 50 üstü giriş/kayıt engeli eklendi; ORBİS Excel düzeltmesi korundu.", "assetVersion": "356"};
const CACHE_NAME = META.cacheName || 'mesaha-app-v356-cap-boy-limit';
const ASSETS = [
  "./",
  "./index.html",
  "./admin.html",
  "./manifest.json",
  "./version.json",
  "./service-worker.js",
  "./js/version.js?v=356",
  "./temizle.html",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/mesaha_logo.png",
  "./assets/hero_forest_cover.png?v=355",
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
