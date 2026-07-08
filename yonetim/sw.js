/* Mesaha İO Yönetim V514 admin service worker */
const CACHE='mesaha-admin-v514';
const ASSETS=[
  './',
  './index.html',
  './manifest.json',
  '../assets/icon-192.png',
  '../assets/icon-512.png',
  '../assets/mesaha_logo.png',
  '../js/version.js'
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('mesaha-admin-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const u=new URL(e.request.url);
  if(u.origin!==self.location.origin) return;
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const c=r.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',c)).catch(()=>{});return r;}).catch(async()=>{return (await caches.match('./index.html')) || Response.error();}));
    return;
  }
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=> hit || fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,c)).catch(()=>{});return r;}).catch(()=>caches.match('./index.html'))));
});
