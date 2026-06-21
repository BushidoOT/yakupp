importScripts('./js/version.js?v=334');
const CACHE_NAME = (self.MESAHA_VERSION && self.MESAHA_VERSION.cacheName) || 'mesaha-app-v334-print-android-version-fix';
const ASSETS = [
  './','./index.html','./admin.html','./manifest.json','./version.json','./service-worker.js',
  './css/style.css?v=334','./js/version.js?v=334','./js/orbis-xls.js?v=334','./js/app.js?v=334',
  './assets/icon-192.png','./assets/icon-512.png','./assets/mesaha_logo.png','./assets/06_net_islem_onayi.wav','./assets/08_hata_uyari_onaydan_farkli.wav',
  './icon-192.png','./icon-512.png','./mesaha_logo.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME && k.startsWith('mesaha-app-')).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/service-worker.js')) {
    event.respondWith(fetch(event.request, {cache:'no-store'}).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(fetch(event.request).then(response => {
    const clone = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(()=>{});
    return response;
  }).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html'))));
});
