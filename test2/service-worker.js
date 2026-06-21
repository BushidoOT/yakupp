importScripts('./js/version.js?v=188');
const CACHE_NAME = (self.MESAHA_VERSION && self.MESAHA_VERSION.cacheName) || 'mesaha-app-v188-lite-clean';

// v188 hafif temizlik:
// Sadece ana uygulama için gerekli dosyalar ön cache'e alınır.
// Admin/test dosyaları ve çift assets görselleri ilk açılış yükünü şişirmesin diye çıkarıldı.
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './service-worker.js',
  './version.json',
  './mesaha_logo.png',
  './icon-192.png',
  './icon-512.png',
  './css/style.css?v=188',
  './css/dark.css?v=188',
  './css/ios-ultra-entry-v186.css?v=188',
  './css/mesaha-v187-final-fixes.css?v=188',
  './js/version.js?v=188',
  './js/admin-access.js?v=188',
  './js/startup-offline.js?v=188',
  './js/core.js?v=188',
  './js/admin-cloud.js?v=188',
  './js/tree-entry.js?v=188',
  './js/ui-mobile.js?v=188',
  './js/records-filters.js?v=188',
  './js/backup-storage.js?v=188',
  './js/keyboard-filters.js?v=188',
  './js/cutters.js?v=188',
  './js/filters-stability.js?v=188',
  './js/stability-base.js?v=188',
  './js/app-stability.js?v=188',
  './js/auto-update.js?v=188',
  './js/ios-ultra-entry-v186.js?v=188',
  './js/mesaha-v187-final-fixes.js?v=188'
];

const FALLBACK_INDEX = './index.html';
const FALLBACK_ADMIN = './admin.html';
const TIMEOUT_MS = 5000;

function timeout(ms){ return new Promise((_, reject) => setTimeout(() => reject(new Error('network-timeout')), ms)); }

async function putSafe(cache, request, response){
  try{
    if(response && response.ok) await cache.put(request, response.clone());
  }catch(_){ }
}

async function installCore(){
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(CORE_ASSETS.map(async (asset) => {
    try{
      const res = await fetch(asset, {cache:'reload'});
      if(res && res.ok) await cache.put(asset, res.clone());
    }catch(_){ }
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil(installCore().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : Promise.resolve(false)));
    await self.clients.claim();
  })());
});

async function networkFirst(request){
  const cache = await caches.open(CACHE_NAME);
  try{
    const response = await Promise.race([fetch(request), timeout(TIMEOUT_MS)]);
    await putSafe(cache, request, response);
    return response;
  }catch(_){
    const cached = await cache.match(request, {ignoreSearch:true});
    if(cached) return cached;
    const url = new URL(request.url);
    if(request.mode === 'navigate'){
      if(url.pathname.endsWith('/admin.html')){
        return (await cache.match(FALLBACK_ADMIN)) || (await cache.match(FALLBACK_INDEX)) || Response.error();
      }
      return (await cache.match(FALLBACK_INDEX)) || Response.error();
    }
    return Response.error();
  }
}

async function cacheFirst(request){
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, {ignoreSearch:true});
  if(cached) return cached;
  try{
    const response = await fetch(request);
    await putSafe(cache, request, response);
    return response;
  }catch(_){ return Response.error(); }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if(request.method !== 'GET') return;
  const url = new URL(request.url);
  if(url.origin !== location.origin) return;
  if(request.mode === 'navigate' || url.pathname.endsWith('/version.json')) event.respondWith(networkFirst(request));
  else event.respondWith(cacheFirst(request));
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if(data.type === 'SKIP_WAITING') self.skipWaiting();
  if(data.type === 'CACHE_REFRESH') event.waitUntil(installCore());
  if(data.type === 'CLEAR_MESAHA_CACHE') event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
});
