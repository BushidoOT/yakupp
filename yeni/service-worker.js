importScripts('./js/version.js?v=406');

const META = self.MESAHA_VERSION || {"app": "V3.91", "version": "v406_olcum_secim_kesimci_aktarma", "build": 406, "visibleVersion": "V3.91 •ExelanceX•", "shortVersion": "V3.91 •ExelanceX•", "name": "Mesaha İO V3.91 •ExelanceX•", "cacheName": "mesaha-app-v406-olcum-secim-kesimci-aktarma", "builtAt": "2026-06-27T13:55:00+03:00", "notes": "Ölçümlerde Tümünü Seç sadece aktif filtredeki kayıtları seçer; seçili kayıtları istenen kesimciye aktarma eklendi.", "assetVersion": "406"};
const BASE_CACHE = META.cacheName || 'mesaha-app-v406-olcum-secim-kesimci-aktarma';
const SHELL_CACHE = BASE_CACHE + '-shell';
const ASSET_CACHE = BASE_CACHE + '-assets';
const RUNTIME_CACHE = BASE_CACHE + '-runtime';
const OFFLINE_TIMEOUT_MS = 3000;
const VERSION_Q = String(META.assetVersion || META.build || 406);

const SHELL_ASSETS = [
  './', './index.html', './admin.html', './temizle.html', './manifest.json', './version.json', './service-worker.js',
  './js/version.js?v=406', './js/mesaha-early-optimizer.js?v=406', './js/mesaha-utils.js?v=406', './js/mesaha-data-guard.js?v=406',
  './js/mesaha-stability-core.js?v=406', './js/mesaha-firebase.js?v=406', './js/mesaha-offline-core.js?v=406',
  './js/mesaha-render-storage.js?v=406', './js/mesaha-sound.js?v=406'
];
const STATIC_ASSETS = [
  './assets/icon-192.png', './assets/icon-512.png', './assets/mesaha_logo.png', './assets/hero_forest_cover.png?v=406',
  './assets/mesaha_onay.wav?v=406', './assets/mesaha_uyari.wav?v=406'
];
function timeoutReject(ms,label){return new Promise((_,reject)=>setTimeout(()=>reject(new Error(label||'network-timeout')),ms||OFFLINE_TIMEOUT_MS));}
function networkWithTimeout(request,options,ms){return Promise.race([fetch(request,options||{}),timeoutReject(ms||OFFLINE_TIMEOUT_MS,'network-timeout')]);}
function plainUrl(u){ try{ const x=new URL(u,self.location.href); x.search=''; return x.href; }catch(e){ return String(u).split('?')[0]; } }
async function safePut(cacheName, request, response){
  try{
    if(!response || !response.ok) return false;
    const cache=await caches.open(cacheName);
    const clone=response.clone();
    const type=response.headers.get('content-type')||'';
    if(type.includes('text/html')){
      const text=await clone.text();
      if(!text || text.length<5000 || !/Mesaha|mesaha/i.test(text)) return false;
      const resp=new Response(text,{status:response.status,statusText:response.statusText,headers:response.headers});
      await cache.put(request,resp.clone());
      try{ await cache.put(plainUrl(request.url || request), resp.clone()); }catch(e){}
      return true;
    }
    await cache.put(request,response.clone());
    try{ await cache.put(plainUrl(request.url || request), response.clone()); }catch(e){}
    return true;
  }catch(e){ return false; }
}
async function matchAcrossCaches(request, fallback){
  const tries=[];
  tries.push(request);
  try{ tries.push(plainUrl(request.url || request)); }catch(e){}
  if(fallback) tries.push(fallback);
  const keys=await caches.keys();
  for(const t of tries){
    for(const k of keys){
      try{ const c=await caches.open(k); const h=await c.match(t,{ignoreSearch:true}); if(h) return h; }catch(e){}
    }
  }
  return null;
}
function fallbackForPath(path){
  if(path.endsWith('/index.html') || path.endsWith('/')) return './index.html';
  if(path.endsWith('/admin.html')) return './admin.html';
  if(path.endsWith('/temizle.html')) return './temizle.html';
  if(path.endsWith('/manifest.json')) return './manifest.json';
  if(path.endsWith('/version.json')) return './version.json';
  if(path.endsWith('/service-worker.js')) return './service-worker.js';
  if(path.includes('/js/')) return './js/' + path.split('/js/').pop().split('?')[0];
  if(path.includes('/assets/')) return './assets/' + path.split('/assets/').pop().split('?')[0];
  return null;
}
async function cacheOne(cacheName,u){
  try{ const r=await fetch(u,{cache:'reload'}); if(r&&r.ok){ await safePut(cacheName,u,r.clone()); const noQ=plainUrl(new URL(u,self.location.href).href); if(noQ!==u) await safePut(cacheName,noQ,r.clone()); } }catch(e){}
}
async function precache(){
  await Promise.allSettled(SHELL_ASSETS.map(u=>cacheOne(SHELL_CACHE,u)));
  await Promise.allSettled(STATIC_ASSETS.map(u=>cacheOne(ASSET_CACHE,u)));
}
function offlineJson(){return new Response(JSON.stringify({offline:true,timeout:true,message:'3 saniye içinde bağlantı kurulamadı, offline mod kullanılıyor.'}),{status:504,statusText:'Offline Timeout',headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});}
function offlineHtml(){return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mesaha İO Offline</title><body style="font-family:Arial;padding:24px;background:#f4f7f6;color:#101828"><h2>Mesaha İO offline açılıyor</h2><p>Ön bellek hazır değilse uygulamayı internet varken bir kez açın veya /yeni/temizle.html sayfasını çalıştırın.</p></body>',{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});}

self.addEventListener('install',event=>{ event.waitUntil(precache().then(()=>self.skipWaiting())); });
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>/^mesaha-app-/.test(k)&&![SHELL_CACHE,ASSET_CACHE,RUNTIME_CACHE].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()).then(()=>precache()));
});
self.addEventListener('message',event=>{ const d=event.data||{}; if(d.type==='SKIP_WAITING') self.skipWaiting(); if(d.type==='WARM_CACHE'||d.type==='REPAIR_CACHE') event.waitUntil(precache()); });
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url); if(url.origin!==self.location.origin) return;
  const path=url.pathname;
  const isVersion=path.endsWith('/version.json');
  const isPing=isVersion&&(url.searchParams.has('net')||url.searchParams.has('check')||url.searchParams.has('ping'));
  const isJs=path.includes('/js/')||path.endsWith('.js');
  const isCss=path.endsWith('.css');
  const isAsset=path.includes('/assets/')||/\.(png|jpg|jpeg|webp|svg|wav|mp3|json)$/i.test(path);
  const isShell=path.endsWith('/index.html')||path.endsWith('/admin.html')||path.endsWith('/temizle.html')||path.endsWith('/manifest.json')||path.endsWith('/version.json')||path.endsWith('/service-worker.js')||isJs||isCss;
  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      const fallback=path.endsWith('/admin.html')?'./admin.html':path.endsWith('/temizle.html')?'./temizle.html':'./index.html';
      try{ const r=await networkWithTimeout(event.request,{cache:'no-store'},OFFLINE_TIMEOUT_MS); event.waitUntil(safePut(SHELL_CACHE,fallback,r.clone())); return r; }
      catch(e){ return await matchAcrossCaches(event.request,fallback) || offlineHtml(); }
    })()); return;
  }
  if(isPing){ event.respondWith(networkWithTimeout(event.request,{cache:'no-store'},OFFLINE_TIMEOUT_MS).then(r=>{if(!r||!r.ok)throw new Error('bad-status');return r;}).catch(()=>offlineJson())); return; }
  if(isShell){
    event.respondWith((async()=>{
      try{ const r=await networkWithTimeout(event.request,{cache:'no-store'},OFFLINE_TIMEOUT_MS); event.waitUntil(safePut(SHELL_CACHE,event.request,r.clone())); return r; }
      catch(e){
        const fallback=fallbackForPath(path);
        const cached=await matchAcrossCaches(event.request,fallback);
        if(cached) return cached;
        if(isVersion) return offlineJson();
        if(isJs) return new Response('/* Mesaha offline JS cache bulunamadı. Internet varken temizle.html çalıştırın. */',{status:200,headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store'}});
        return Response.error();
      }
    })()); return;
  }
  event.respondWith((async()=>{
    const cached=await matchAcrossCaches(event.request,fallbackForPath(path));
    if(cached){ event.waitUntil(networkWithTimeout(event.request,{},OFFLINE_TIMEOUT_MS).then(r=>safePut(ASSET_CACHE,event.request,r)).catch(()=>{})); return cached; }
    try{ const r=await networkWithTimeout(event.request,{},OFFLINE_TIMEOUT_MS); event.waitUntil(safePut(ASSET_CACHE,event.request,r.clone())); return r; }catch(e){ return Response.error(); }
  })());
});
