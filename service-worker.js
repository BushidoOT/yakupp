importScripts('./js/version.js?v=394');

const META = self.MESAHA_VERSION || {"app": "V3.79", "version": "v394-video-linkleri-hotfix", "build": 394, "visibleVersion": "V3.79 •ExelanceX•", "shortVersion": "V3.79 •ExelanceX•", "name": "Mesaha İO V3.79 •ExelanceX•", "cacheName": "mesaha-app-v394-video-linkleri-hotfix", "builtAt": "2026-06-26T19:35:00+03:00", "notes": "Kılavuza uygulama kullanım videosu eklendi; ORBİS aktarım video linki güncellendi.", "assetVersion": "394"};
const SHELL_CACHE = META.cacheName + '-shell';
const ASSET_CACHE = META.cacheName + '-assets';
const RUNTIME_CACHE = META.cacheName + '-runtime';
const OFFLINE_TIMEOUT_MS = 3000;
const SHELL_ASSETS = [
  './', './index.html', './admin.html', './temizle.html', './manifest.json', './version.json', './service-worker.js',
  './js/version.js?v=394', './js/mesaha-early-optimizer.js?v=394', './js/mesaha-utils.js?v=394', './js/mesaha-data-guard.js?v=394',
  './js/mesaha-stability-core.js?v=394', './js/mesaha-firebase.js?v=394', './js/mesaha-offline-core.js?v=394',
  './js/mesaha-render-storage.js?v=394', './js/mesaha-sound.js?v=394'
];
const STATIC_ASSETS = [
  './assets/icon-192.png', './assets/icon-512.png', './assets/mesaha_logo.png', './assets/hero_forest_cover.png?v=394',
  './assets/mesaha_onay.wav?v=394', './assets/mesaha_uyari.wav?v=394'
];
function timeoutReject(ms, label){ return new Promise((_, reject) => setTimeout(() => reject(new Error(label || 'network-timeout')), ms || OFFLINE_TIMEOUT_MS)); }
function networkWithTimeout(request, options, ms){ return Promise.race([fetch(request, options || {}), timeoutReject(ms || OFFLINE_TIMEOUT_MS, 'network-timeout')]); }
async function safePut(cacheName, request, response){
  try{
    if(!response || !response.ok) return false;
    const type = response.headers.get('content-type') || '';
    const clone = response.clone();
    if(type.includes('text/html')){
      const text = await clone.text();
      if(!text || text.length < 5000 || !/Mesaha|mesaha/i.test(text)) return false;
      const c = await caches.open(cacheName);
      await c.put(request, new Response(text, {status:response.status, statusText:response.statusText, headers:response.headers}));
      return true;
    }
    const c=await caches.open(cacheName); await c.put(request, response.clone()); return true;
  }catch(e){ return false; }
}
async function matchAny(request, fallback){
  return (await caches.match(request, {ignoreSearch:true})) || (fallback ? await caches.match(fallback, {ignoreSearch:true}) : null) || await caches.match('./index.html', {ignoreSearch:true});
}
async function precache(){
  const shell=await caches.open(SHELL_CACHE); const assets=await caches.open(ASSET_CACHE);
  await Promise.allSettled(SHELL_ASSETS.map(async u=>{ try{ const r=await fetch(u, {cache:'reload'}); await safePut(SHELL_CACHE, u, r); }catch(e){} }));
  await Promise.allSettled(STATIC_ASSETS.map(async u=>{ try{ const old=await assets.match(u, {ignoreSearch:true}); if(old) return; const r=await fetch(u, {cache:'reload'}); await safePut(ASSET_CACHE, u, r); }catch(e){} }));
}
function offlineJson(){ return new Response(JSON.stringify({offline:true,timeout:true,message:'3 saniye içinde bağlantı kurulamadı, offline mod kullanılıyor.'}), {status:504,statusText:'Offline Timeout',headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}}); }
function offlineHtml(){ return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mesaha İO Offline</title><body style="font-family:Arial;padding:24px;background:#f4f7f6;color:#101828"><h2>Mesaha İO offline açılıyor</h2><p>Ön bellek henüz hazır değilse uygulamayı internet varken bir kez açmanız gerekir.</p></body>', {status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}}); }
self.addEventListener('install', event => { event.waitUntil(precache().then(()=>self.skipWaiting())); });
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>/^mesaha-app-/.test(k) && ![SHELL_CACHE,ASSET_CACHE,RUNTIME_CACHE].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('message', event => { const d=event.data||{}; if(d.type==='SKIP_WAITING') self.skipWaiting(); if(d.type==='WARM_CACHE') event.waitUntil(precache()); });
self.addEventListener('fetch', event => {
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url); if(url.origin!==self.location.origin) return;
  const path=url.pathname;
  const isVersion=path.endsWith('/version.json');
  const isPing=isVersion && (url.searchParams.has('net')||url.searchParams.has('check')||url.searchParams.has('ping'));
  const isShell=path.endsWith('/index.html')||path.endsWith('/admin.html')||path.endsWith('/temizle.html')||path.endsWith('/manifest.json')||path.endsWith('/version.json')||path.endsWith('/service-worker.js')||path.includes('/js/');
  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      const fallback=path.endsWith('/admin.html')?'./admin.html':path.endsWith('/temizle.html')?'./temizle.html':'./index.html';
      const cached=await matchAny(event.request,fallback);
      if(cached){ event.waitUntil(networkWithTimeout(event.request,{cache:'no-store'},OFFLINE_TIMEOUT_MS).then(r=>safePut(SHELL_CACHE,fallback,r)).catch(()=>{})); return cached; }
      try{ const r=await networkWithTimeout(event.request,{cache:'no-store'},OFFLINE_TIMEOUT_MS); event.waitUntil(safePut(SHELL_CACHE,fallback,r.clone())); return r; }catch(e){ return await matchAny(event.request,fallback) || offlineHtml(); }
    })()); return;
  }
  if(isPing){ event.respondWith(networkWithTimeout(event.request,{cache:'no-store'},OFFLINE_TIMEOUT_MS).then(r=>{if(!r||!r.ok) throw new Error('bad-status'); return r;}).catch(()=>offlineJson())); return; }
  if(isShell){ event.respondWith((async()=>{ try{ const r=await networkWithTimeout(event.request,{cache:'no-store'},OFFLINE_TIMEOUT_MS); event.waitUntil(safePut(SHELL_CACHE,event.request,r.clone())); return r; }catch(e){ return await matchAny(event.request, path.endsWith('/version.json')?'./version.json':null) || (isVersion?offlineJson():Response.error()); } })()); return; }
  event.respondWith((async()=>{
    const cached=await caches.match(event.request,{ignoreSearch:true}); if(cached){ event.waitUntil(networkWithTimeout(event.request,{},OFFLINE_TIMEOUT_MS).then(r=>safePut(ASSET_CACHE,event.request,r)).catch(()=>{})); return cached; }
    try{ const r=await networkWithTimeout(event.request,{},OFFLINE_TIMEOUT_MS); event.waitUntil(safePut(ASSET_CACHE,event.request,r.clone())); return r; }catch(e){ return Response.error(); }
  })());
});
