importScripts('./js/version.js?v=379');

const META = self.MESAHA_VERSION || {
  app: 'V3.66',
  version: 'v379-stability-battery-offline-fix',
  build: 379,
  visibleVersion: 'V3.66 •ExelanceX•',
  shortVersion: 'V3.66 •ExelanceX•',
  name: 'Mesaha İO V3.66 •ExelanceX•',
  cacheName: 'mesaha-app-v379-stability-battery-offline-fix',
  builtAt: '2026-06-25T22:45:00+03:00',
  notes: 'Stabilite, pil tüketimi ve offline açılış iyileştirildi; tek ses motoru ve tek Firebase motoru korundu.',
  assetVersion: '379'
};
const CACHE_NAME = META.cacheName || 'mesaha-app-v379-stability-battery-offline-fix';
const OFFLINE_TIMEOUT_MS = 3000;
const ASSETS = [
  './',
  './index.html',
  './admin.html',
  './manifest.json',
  './version.json',
  './service-worker.js',
  './temizle.html',
  './js/version.js?v=379',
  './js/mesaha-sound.js?v=379',
  './js/mesaha-firebase.js?v=379',
  './js/mesaha-early-optimizer.js?v=379',
  './js/mesaha-offline-core.js?v=379',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/mesaha_logo.png',
  './assets/hero_forest_cover.png?v=379',
  './assets/mesaha_onay.wav?v=379',
  './assets/mesaha_uyari.wav?v=379'
];

function timeoutReject(ms, label){
  return new Promise((_, reject) => setTimeout(() => reject(new Error(label || 'network-timeout')), ms || OFFLINE_TIMEOUT_MS));
}

function networkWithTimeout(request, options, ms){
  return Promise.race([
    fetch(request, options || {}),
    timeoutReject(ms || OFFLINE_TIMEOUT_MS, 'network-timeout')
  ]);
}

async function cachePutSafe(request, response){
  try{
    if(!response || !response.ok) return;
    const copy = response.clone();
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, copy);
  }catch(e){}
}

async function precache(){
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(ASSETS.map(async asset => {
    try{
      const response = await fetch(asset, {cache:'reload'});
      if(response && response.ok) await cache.put(asset, response.clone());
    }catch(e){}
  }));
}

function offlineJson(){
  return new Response(JSON.stringify({
    offline:true,
    timeout:true,
    message:'3 saniye içinde bağlantı kurulamadı, offline mod kullanılıyor.'
  }), {
    status:504,
    statusText:'Offline Timeout',
    headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
  });
}

function offlineHtml(){
  return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mesaha İO Offline</title><body style="font-family:Arial;padding:24px;background:#f4f7f6;color:#101828"><h2>Mesaha İO offline açılıyor</h2><p>Ön bellek henüz hazır değilse uygulamayı internet varken bir kez açmanız gerekir.</p></body>', {
    status:200,
    headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}
  });
}

self.addEventListener('install', event => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME && k.startsWith('mesaha-app-')).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if(data.type === 'SKIP_WAITING') self.skipWaiting();
  if(data.type === 'WARM_CACHE') event.waitUntil(precache());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isVersion = url.pathname.endsWith('/version.json');
  const isStatusPing = isVersion && (url.searchParams.has('net') || url.searchParams.has('check') || url.searchParams.has('ping'));
  const isShellFile = url.pathname.endsWith('/index.html') ||
                      url.pathname.endsWith('/admin.html') ||
                      url.pathname.endsWith('/temizle.html') ||
                      url.pathname.endsWith('/version.json') ||
                      url.pathname.endsWith('/service-worker.js') ||
                      url.pathname.endsWith('/js/version.js');

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      const fallback = url.pathname.endsWith('/admin.html') ? './admin.html' :
                       url.pathname.endsWith('/temizle.html') ? './temizle.html' : './index.html';
      const cached = await caches.match(event.request, {ignoreSearch:true}) ||
                     await caches.match(fallback, {ignoreSearch:true}) ||
                     await caches.match('./index.html', {ignoreSearch:true});
      if(cached){
        event.waitUntil(
          networkWithTimeout(event.request, {cache:'no-store'}, OFFLINE_TIMEOUT_MS)
            .then(response => { cachePutSafe(event.request, response); cachePutSafe(fallback, response.clone()); })
            .catch(() => {})
        );
        return cached;
      }
      try{
        const response = await networkWithTimeout(event.request, {cache:'no-store'}, OFFLINE_TIMEOUT_MS);
        event.waitUntil(cachePutSafe(event.request, response.clone()));
        return response;
      }catch(e){
        return (await caches.match(fallback, {ignoreSearch:true})) ||
               (await caches.match('./index.html', {ignoreSearch:true})) ||
               offlineHtml();
      }
    })());
    return;
  }

  // Gerçek bağlantı testi: cache'ten sahte başarılı cevap döndürmez.
  if (isStatusPing) {
    event.respondWith((async () => {
      try{
        const response = await networkWithTimeout(event.request, {cache:'no-store'}, OFFLINE_TIMEOUT_MS);
        if(!response || !response.ok) throw new Error('bad-status');
        return response;
      }catch(e){
        return offlineJson();
      }
    })());
    return;
  }

  // Shell dosyalarında ağ öncelikli, cache yedekli; böylece güncelleme gelir ama offline açılış bozulmaz.
  if (isShellFile) {
    event.respondWith((async () => {
      try{
        const response = await networkWithTimeout(event.request, {cache:'no-store'}, OFFLINE_TIMEOUT_MS);
        event.waitUntil(cachePutSafe(event.request, response.clone()));
        return response;
      }catch(e){
        const cached = await caches.match(event.request, {ignoreSearch:true});
        if(cached) return cached;
        if(url.pathname.endsWith('/index.html')) return (await caches.match('./index.html', {ignoreSearch:true})) || offlineHtml();
        if(url.pathname.endsWith('/admin.html')) return (await caches.match('./admin.html', {ignoreSearch:true})) || offlineHtml();
        if(url.pathname.endsWith('/temizle.html')) return (await caches.match('./temizle.html', {ignoreSearch:true})) || offlineHtml();
        if(isVersion) return (await caches.match('./version.json', {ignoreSearch:true})) || offlineJson();
        return Response.error();
      }
    })());
    return;
  }

  // Statik dosyalar: cache varsa anında aç, ağ güncellemesini arka planda yap.
  event.respondWith((async () => {
    const cached = await caches.match(event.request, {ignoreSearch:true});
    if(cached){
      event.waitUntil(
        networkWithTimeout(event.request, {}, OFFLINE_TIMEOUT_MS)
          .then(response => cachePutSafe(event.request, response))
          .catch(() => {})
      );
      return cached;
    }
    try{
      const response = await networkWithTimeout(event.request, {}, OFFLINE_TIMEOUT_MS);
      event.waitUntil(cachePutSafe(event.request, response.clone()));
      return response;
    }catch(e){
      return Response.error();
    }
  })());
});
