const CACHE='mesaha-istif-v010';
const CORE=['./','./index.html','./styles.css','./app.js','./manifest.json','./version.json','./assets/mesaha-fallback.svg','../assets/icon-192.png','../assets/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE.map(x=>new Request(x,{cache:'reload'}))).catch(()=>caches.open(CACHE).then(c=>c.addAll(CORE.slice(0,7))))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>{if(e.request.mode==='navigate')return caches.match('./index.html');})));
});
