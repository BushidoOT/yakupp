importScripts('./js/version.js?v=350');
const META = self.MESAHA_VERSION || {cacheName:'mesaha-app-v350-light-only-optimized'};
const CACHE_NAME = META.cacheName || 'mesaha-app-v350-light-only-optimized';
const ASSETS = [
  './','./index.html','./admin.html','./manifest.json','./version.json','./service-worker.js','./js/version.js?v=350','./temizle.html',
  './assets/icon-192.png','./assets/icon-512.png','./assets/mesaha_logo.png','./assets/06_net_islem_onayi.wav','./assets/08_hata_uyari_onaydan_farkli.wav'
];
self.addEventListener('install', event => {event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));});
self.addEventListener('activate', event => {event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME && k.startsWith('mesaha-app-')).map(k => caches.delete(k)))).then(() => self.clients.claim()));});
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if(url.origin !== self.location.origin) return;
  const fresh = event.request.mode === 'navigate' || /\/(index\.html|version\.json|service-worker\.js|js\/version\.js)$/.test(url.pathname);
  if(fresh){event.respondWith(fetch(event.request,{cache:'no-store'}).then(res=>{const c=res.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,c)).catch(()=>{});return res}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));return;}
  event.respondWith(caches.match(event.request).then(r=>r||fetch(event.request).then(res=>{const c=res.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,c)).catch(()=>{});return res})));
});
