/* Mesaha İO V543 service worker — atomik kritik kabuk ve doğrulanmış güncelleme. */
try{importScripts('./js/version.js');}catch(e){}
const META=self.MESAHA_VERSION||{app:'Mesaha İO',version:'local',build:0,visibleVersion:'Mesaha İO',shortVersion:'Mesaha İO',name:'Mesaha İO',cacheName:'mesaha-app-local',assetVersion:''};
const BASE_CACHE=META.cacheName||'mesaha-app-current';
const SHELL_CACHE=BASE_CACHE+'-shell',STAGE_CACHE=BASE_CACHE+'-stage',ASSET_CACHE=BASE_CACHE+'-assets',RUNTIME_CACHE=BASE_CACHE+'-runtime';
const MARKER='./__mesaha_cache_manifest__.json',NETWORK_TIMEOUT=8000;
const CRITICAL_ASSETS=[
 './index.html','./css/app.css','./css/mesaha-seflik-folder-v529.css','./version.json','./js/version.js','./js/mesaha-update-manager-v527.js','./js/mesaha-utils.js','./js/mesaha-data-guard.js','./js/mesaha-persistent-store.js','./js/mesaha-stability-core.js','./js/mesaha-error-log.js','./js/mesaha-offline-core.js','./js/mesaha-render-storage.js','./js/mesaha-runtime-v527.js','./js/mesaha-filter-cutter-fix.js','./js/mesaha-seflik-folder-v529.js','./js/mesaha-ios-touch-v538.js','./js/mesaha-product-touch-v540.js'
];
const OPTIONAL_SHELL=['./','./admin.html','./yonetim/index.html','./yonetim/admin.css','./yonetim/admin.js','./temizle.html','./guncelle.html','./manifest.json','./service-worker.js','./js/mesaha-early-optimizer.js','./js/mesaha-url-cleanup.js','./js/mesaha-supabase-config.js','./js/mesaha-firebase.js','./js/mesaha-sound.js','./js/mesaha-storage-health.js','./js/mesaha-records-performance.js','./js/mesaha-fast-tap-nav.js','./js/mesaha-terminal-performance.js','./js/mesaha-hybrid-cloud.js'];
const STATIC_ASSETS=['./assets/icon-192.png','./assets/icon-512.png','./assets/mesaha_logo.png','./assets/hero_forest_cover.webp','./assets/hero_forest_cover.png','./assets/mesaha_onay.wav','./assets/mesaha_uyari.wav'];
function plainUrl(u){try{const x=new URL(u,self.location.href);x.search='';return x.href}catch(e){return String(u).split('?')[0]}}
function fetchTimed(input,opts,ms){const ctrl=typeof AbortController!=='undefined'?new AbortController():null,t=ctrl?setTimeout(()=>ctrl.abort(),ms||NETWORK_TIMEOUT):0;return fetch(input,Object.assign({},opts||{},ctrl?{signal:ctrl.signal}:{})).finally(()=>{if(t)clearTimeout(t)})}
async function validResponse(path,response){
 if(!response||!response.ok)return false;const type=response.headers.get('content-type')||'',clone=response.clone();
 if(path.endsWith('version.json')){try{const j=await clone.json();return Number(j.build||j.latestBuild||0)===Number(META.build||0)&&String(j.version||'')===String(META.version||'')}catch(e){return false}}
 if(/\.html(?:$|\?)/.test(path)){try{const t=await clone.text();return t.length>5000&&/Mesaha|mesaha/i.test(t)}catch(e){return false}}
 if(/\.js(?:$|\?)/.test(path)){try{const t=await clone.text();return t.length>80&&!/offline JS cache bulunamadı/i.test(t)}catch(e){return false}}
 if(/\.css(?:$|\?)/.test(path)){try{return (await clone.text()).length>80}catch(e){return false}}
 return true;
}
async function fetchCritical(path){const r=await fetchTimed(path,{cache:'reload',headers:{'Cache-Control':'no-cache'}},12000);if(!(await validResponse(path,r)))throw new Error('Kritik dosya doğrulanamadı: '+path);return r}
async function writeMarker(cache){const body=JSON.stringify({app:META.app,version:META.version,build:META.build,critical:CRITICAL_ASSETS,createdAt:Date.now()});await cache.put(MARKER,new Response(body,{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}}))}
async function cacheHas(cache,path){return !!(await cache.match(path,{ignoreSearch:true})||await cache.match(new URL(path,self.location.href).href,{ignoreSearch:true}))}
async function verifyCache(name){try{const c=await caches.open(name),m=await c.match(MARKER);if(!m)return false;const j=await m.json();if(Number(j.build)!==Number(META.build)||String(j.version)!==String(META.version))return false;for(const p of CRITICAL_ASSETS)if(!(await cacheHas(c,p)))return false;return true}catch(e){return false}}
async function stageCritical(){
 await caches.delete(STAGE_CACHE);const pairs=await Promise.all(CRITICAL_ASSETS.map(async p=>[p,await fetchCritical(p)]));const stage=await caches.open(STAGE_CACHE);
 for(const [p,r] of pairs){await stage.put(p,r.clone());await stage.put(plainUrl(new URL(p,self.location.href).href),r.clone())}
 await writeMarker(stage);if(!(await verifyCache(STAGE_CACHE))){await caches.delete(STAGE_CACHE);throw new Error('Kritik önbellek doğrulanamadı')}return true;
}
async function promoteStage(){const stage=await caches.open(STAGE_CACHE),target=await caches.open(SHELL_CACHE);for(const p of CRITICAL_ASSETS){const r=await stage.match(p,{ignoreSearch:true});if(!r)throw new Error('Hazırlanan kritik dosya eksik: '+p);await target.put(p,r.clone());await target.put(plainUrl(new URL(p,self.location.href).href),r.clone())}await writeMarker(target);if(!(await verifyCache(SHELL_CACHE)))throw new Error('Aktif kritik önbellek doğrulanamadı');await caches.delete(STAGE_CACHE);return true}
async function prepareAtomicShell(){try{await stageCritical();await promoteStage();return true}catch(e){await caches.delete(STAGE_CACHE);throw e}}
async function oldCached(path){const keys=await caches.keys();for(const k of keys){if(k===STAGE_CACHE)continue;try{const c=await caches.open(k),r=await c.match(path,{ignoreSearch:true});if(r)return r}catch(e){}}return null}
async function cacheOptionalOne(name,path,allowOld){try{const r=await fetchTimed(path,{cache:'reload'},6000);if(r&&r.ok){const c=await caches.open(name);await c.put(path,r.clone());return true}}catch(e){}if(allowOld){try{const r=await oldCached(path);if(r){const c=await caches.open(name);await c.put(path,r.clone());return true}}catch(e){}}return false}
async function warmOptional(){await Promise.allSettled(OPTIONAL_SHELL.map(p=>cacheOptionalOne(SHELL_CACHE,p,false)));await Promise.allSettled(STATIC_ASSETS.map(p=>cacheOptionalOne(ASSET_CACHE,p,true)));try{const c=await caches.open(SHELL_CACHE),idx=await c.match('./index.html');if(idx){await c.put('./',idx.clone());await c.put(new URL('./',self.location.href).href,idx.clone())}}catch(e){}return true}
function mesahaCacheKey(k){return /^(mesaha|mio)(-|_)/i.test(String(k||''))||/mesaha/i.test(String(k||''))}
async function clearOld(){if(!(await verifyCache(SHELL_CACHE)))return false;const keep=new Set([SHELL_CACHE,ASSET_CACHE,RUNTIME_CACHE,STAGE_CACHE]),keys=await caches.keys();await Promise.all(keys.filter(k=>mesahaCacheKey(k)&&!keep.has(k)).map(k=>caches.delete(k)));return true}
async function status(){return {ready:await verifyCache(SHELL_CACHE),build:Number(META.build||0),version:META.version,cache:SHELL_CACHE}}
function reply(event,data){try{if(event.ports&&event.ports[0])event.ports[0].postMessage(data)}catch(e){}}
self.addEventListener('install',event=>event.waitUntil((async()=>{try{await prepareAtomicShell();await warmOptional();await self.skipWaiting()}catch(e){try{await caches.delete(STAGE_CACHE)}catch(_e){}throw e}})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{if(await verifyCache(SHELL_CACHE)){await clearOld();await self.clients.claim();warmOptional().catch(()=>{})}})()));
self.addEventListener('message',event=>{const d=event.data||{};
 if(d.type==='GET_STATUS')event.waitUntil(status().then(x=>reply(event,x)));
 if(d.type==='SKIP_WAITING')event.waitUntil((async()=>{const ok=await verifyCache(SHELL_CACHE);reply(event,{ok:ok,build:META.build});if(ok)await self.skipWaiting()})());
 if(d.type==='REPAIR_CACHE')event.waitUntil((async()=>{try{await prepareAtomicShell();await warmOptional();reply(event,{ok:true,ready:true,build:META.build})}catch(e){reply(event,{ok:false,ready:await verifyCache(SHELL_CACHE),build:META.build,error:String(e&&e.message||e)})}})());
 if(d.type==='WARM_CACHE')event.waitUntil(warmOptional().then(()=>reply(event,{ok:true,build:META.build})));
 if(d.type==='CLEAR_OLD_CACHES')event.waitUntil(clearOld().then(ok=>reply(event,{ok:ok,build:META.build})));
});
async function currentMatch(request,fallback){const c=await caches.open(SHELL_CACHE);return await c.match(request,{ignoreSearch:true})||fallback&&await c.match(fallback,{ignoreSearch:true})||null}
function fallbackFor(path){if(path.endsWith('/')||path.endsWith('/index.html'))return'./index.html';if(path.endsWith('/temizle.html'))return'./temizle.html';if(path.endsWith('/guncelle.html'))return'./guncelle.html';if(path.includes('/js/'))return'./js/'+path.split('/js/').pop().split('?')[0];if(path.includes('/css/'))return'./css/'+path.split('/css/').pop().split('?')[0];return null}
function localVersion(){return new Response(JSON.stringify(META),{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Mesaha-Fallback':'local'}})}
function offlineHtml(){return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mesaha İO Offline</title><body style="font-family:Arial;padding:24px"><h2>Mesaha İO ön belleği hazırlanamadı</h2><p>İnternet varken uygulamayı yeniden açıp Ön Bellek Onar işlemini çalıştırın.</p></body>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})}
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;const path=url.pathname;
 if(path.endsWith('/admin.html')||path.endsWith('/yonetim/')||path.endsWith('/yonetim/index.html')){event.respondWith(fetchTimed(event.request,{cache:'no-store'},8000).catch(()=>currentMatch(event.request,path.endsWith('/admin.html')?'./admin.html':'./yonetim/index.html').then(r=>r||offlineHtml())));return}
 const isVersion=path.endsWith('/version.json'),isPing=isVersion&&(url.searchParams.has('net')||url.searchParams.has('check')||url.searchParams.has('ping')||url.searchParams.has('fresh')||url.searchParams.has('v'));
 if(isPing){event.respondWith(fetchTimed(event.request,{cache:'no-store'},16000).then(r=>r&&r.ok?r:Promise.reject()).catch(()=>localVersion()));return}
 if(event.request.mode==='navigate'){const fb=fallbackFor(path)||'./index.html';event.respondWith(currentMatch(event.request,fb).then(r=>r||fetchTimed(event.request,{cache:'no-store'},8000).catch(()=>offlineHtml())));return}
 const rel='./'+path.split('/').filter(Boolean).slice(-2).join('/'),critical=CRITICAL_ASSETS.some(p=>path.endsWith(p.slice(1))),js=path.endsWith('.js'),css=path.endsWith('.css');
 if(critical||js||css){event.respondWith(currentMatch(event.request,fallbackFor(path)).then(r=>r||fetchTimed(event.request,{cache:'no-store'},8000).then(n=>n&&n.ok?n:Response.error()).catch(()=>isVersion?localVersion():Response.error())));return}
 event.respondWith((async()=>{const c=await caches.open(ASSET_CACHE),hit=await c.match(event.request,{ignoreSearch:true});if(hit)return hit;try{const r=await fetchTimed(event.request,{},6000);if(r&&r.ok)event.waitUntil(c.put(event.request,r.clone()));return r}catch(e){return Response.error()}})());
});
