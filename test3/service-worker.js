importScripts('./js/version.js?v=326');
const CACHE_NAME = (self.MESAHA_VERSION && self.MESAHA_VERSION.cacheName) || 'mesaha-app-v326-user-fixes';
const ASSETS = [
  './','./index.html','./admin.html','./manifest.json','./version.json','./service-worker.js',
  './css/style.css?v=326','./js/version.js?v=326','./js/orbis-xls.js?v=326','./js/app.js?v=326',
  './assets/icon-192.png','./assets/icon-512.png','./assets/mesaha_logo.png',
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
  event.respondWith(fetch(event.request).then(response => {
    const clone = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(()=>{});
    return response;
  }).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html'))));
});
