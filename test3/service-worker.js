importScripts('./js/version.js?v=376');

const META = self.MESAHA_VERSION || {"app": "V3.66", "version": "v376-user-sounds-warning-fix", "build": 376, "visibleVersion": "V3.66 •ExelanceX•", "shortVersion": "V3.66 •ExelanceX•", "name": "Mesaha İO V3.66 •ExelanceX•", "cacheName": "mesaha-app-v376-user-sounds-warning-fix", "builtAt": "2026-06-25T20:05:00+03:00", "notes": "Kullanıcının gönderdiği onay ve uyarı WAV sesleri eklendi. Uyarı sesi toast/alert/modal hatalarına da bağlandı.", "assetVersion": "376"};
const CACHE_NAME = META.cacheName || 'mesaha-app-v376-user-sounds-warning-fix';
const ASSETS = [
  "./",
  "./index.html",
  "./admin.html",
  "./manifest.json",
  "./version.json",
  "./service-worker.js",
  "./js/version.js?v=376",
  "./temizle.html",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/mesaha_logo.png",
  "./assets/hero_forest_cover.png?v=376",
  "./assets/06_net_islem_onayi.wav",
  "./assets/08_hata_uyari_onaydan_farkli.wav",
  "./js/sound.js?v=380",
  "./assets/mesaha_onay_v376.wav?v=380",
  "./assets/mesaha_uyari_v376.wav?v=380"
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

const OFFLINE_TIMEOUT_MS = 1500;

function timeoutReject(ms, label){
  return new Promise((_, reject) => setTimeout(() => reject(new Error(label || 'network-timeout')), ms || OFFLINE_TIMEOUT_MS));
}

function networkWithTimeout(request, options, ms){
  return Promise.race([
    fetch(request, options || {}),
    timeoutReject(ms || OFFLINE_TIMEOUT_MS, 'network-timeout')
  ]);
}

function cachePutSafe(request, response){
  try{
    if(!response || !response.ok) return Promise.resolve();
    const copy = response.clone();
    return caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
  }catch(e){ return Promise.resolve(); }
}

function offlineJson(){
  return new Response(JSON.stringify({
    offline:true,
    timeout:true,
    message:'1.5 saniye içinde bağlantı kurulamadı, offline mod kullanılıyor.'
  }), {
    status:504,
    statusText:'Offline Timeout',
    headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
  });
}

function offlineHtml(){
  return new Response('<!doctype html><meta charset="utf-8"><title>Mesaha İO Offline</title><body style="font-family:Arial;padding:24px"><h2>Mesaha İO offline açılıyor</h2><p>Ön bellek henüz hazır değilse uygulamayı internet varken bir kez açmanız gerekir.</p></body>', {
    status:200,
    headers:{'Content-Type':'text/html; charset=utf-8'}
  });
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isVersion = url.pathname.endsWith('/version.json');
  const isStatusPing = isVersion && (url.searchParams.has('net') || url.searchParams.has('check') || url.searchParams.has('ping'));
  const isNoStoreFile = url.pathname.endsWith('/index.html') ||
                        url.pathname.endsWith('/admin.html') ||
                        url.pathname.endsWith('/version.json') ||
                        url.pathname.endsWith('/service-worker.js') ||
                        url.pathname.endsWith('/js/version.js');

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      const fallback = url.pathname.endsWith('/admin.html') ? './admin.html' :
                       url.pathname.endsWith('/temizle.html') ? './temizle.html' : './index.html';

      // v373: zayıf internette uygulama beklemesin; cache varsa hemen aç, ağı arka planda güncelle.
      const cached = await caches.match(event.request, {ignoreSearch:true}) ||
                     await caches.match(fallback, {ignoreSearch:true}) ||
                     await caches.match('./index.html', {ignoreSearch:true});
      if(cached){
        event.waitUntil(
          networkWithTimeout(event.request, {cache:'no-store'}, OFFLINE_TIMEOUT_MS)
            .then(response => {
              cachePutSafe(event.request, response);
              try{ cachePutSafe(fallback, response.clone()); }catch(e){}
            })
            .catch(() => {})
        );
        return cached;
      }

      try{
        const response = await networkWithTimeout(event.request, {cache:'no-store'}, OFFLINE_TIMEOUT_MS);
        cachePutSafe(event.request, response);
        try{ cachePutSafe(fallback, response.clone()); }catch(e){}
        return response;
      }catch(e){
        const fallbackCached = await caches.match(fallback, {ignoreSearch:true});
        if(fallbackCached) return fallbackCached;
        const indexCached = await caches.match('./index.html', {ignoreSearch:true});
        return indexCached || offlineHtml();
      }
    })());
    return;
  }

  // Bağlantı durumu/sürüm kontrolü: cache'ten başarılı cevap döndürme.
  // İnternet 5 saniye içinde cevap vermezse uygulama bunu gerçekten "çevrimdışı" görsün.
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

  if (isNoStoreFile) {
    event.respondWith((async () => {
      try{
        const response = await networkWithTimeout(event.request, {cache:'no-store'}, OFFLINE_TIMEOUT_MS);
        cachePutSafe(event.request, response);
        return response;
      }catch(e){
        const cached = await caches.match(event.request, {ignoreSearch:true});
        if(cached) return cached;
        if(url.pathname.endsWith('/index.html')) return (await caches.match('./index.html', {ignoreSearch:true})) || offlineHtml();
        if(isVersion) return (await caches.match('./version.json', {ignoreSearch:true})) || offlineJson();
        throw e;
      }
    })());
    return;
  }

  // Normal dosyalar: cache varsa hemen aç, yoksa 5 saniye içinde ağdan dene.
  event.respondWith((async () => {
    const cached = await caches.match(event.request, {ignoreSearch:true});
    if(cached) return cached;
    try{
      const response = await networkWithTimeout(event.request, {}, OFFLINE_TIMEOUT_MS);
      cachePutSafe(event.request, response);
      return response;
    }catch(e){
      return cached || Response.error();
    }
  })());
});

// v374 sound assets: ./assets/mesaha_onay_v376.wav?v=376 ./assets/mesaha_uyari_v376.wav?v=376
