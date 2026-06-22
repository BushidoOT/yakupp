importScripts('./js/version.js?v=355');

const META = self.MESAHA_VERSION || {"app": "V3.46", "version": "v355-orbis-template-excel-fix", "build": 355, "visibleVersion": "V3.46 •ExelanceX•", "shortVersion": "V3.46 •ExelanceX•", "name": "Mesaha İO V3.46 •ExelanceX•", "cacheName": "mesaha-app-v355-orbis-template-excel-fix", "builtAt": "2026-06-22T17:05:00+03:00", "notes": "ORBİS orijinal Mesaha_Ornek_Temp şablonuna göre Excel dışa aktarma düzeltildi; Kayın ID ve örnek sayfa birebir ayarlandı.", "assetVersion": "355"};
const CACHE_NAME = META.cacheName || 'mesaha-app-v355-orbis-template-excel-fix';
const ASSETS = [
  "./",
  "./index.html",
  "./admin.html",
  "./manifest.json",
  "./version.json",
  "./service-worker.js",
  "./js/version.js?v=355",
  "./temizle.html",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/mesaha_logo.png",
<<<<<<< HEAD
  "./assets/hero_forest_cover.png?v=354",
=======
  "./assets/hero_forest_cover.png?v=355",
>>>>>>> 7ab176a (Fix test3)
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
