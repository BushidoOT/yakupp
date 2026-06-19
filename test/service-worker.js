importScripts('./js/version.js?v=182');
const CACHE_NAME = (self.MESAHA_VERSION && self.MESAHA_VERSION.cacheName) || "mesaha-app-v182-pwa-fullscreen";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./admin.html",
  "./manifest.json",
  "./service-worker.js",
  "./version.json",
  "./.nojekyll",
  "./mesaha_logo.png",
  "./icon-192.png",
  "./icon-512.png",
  "./assets/mesaha_logo.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./css/style.css?v=182",
  "./css/dark.css?v=182",
  "./js/version.js?v=182",
  "./js/admin-access.js?v=182",
  "./js/startup-offline.js?v=182",
  "./js/core.js?v=182",
  "./js/admin-cloud.js?v=182",
  "./js/tree-entry.js?v=182",
  "./js/ui-mobile.js?v=182",
  "./js/records-filters.js?v=182",
  "./js/backup-storage.js?v=182",
  "./js/keyboard-filters.js?v=182",
  "./js/cutters.js?v=182",
  "./js/filters-stability.js?v=182",
  "./js/stability-base.js?v=182",
  "./js/control-test.js?v=182",
  "./js/stability-admin.js?v=182",
  "./js/offline-admin.js?v=182",
  "./js/app-stability.js?v=182",
  "./js/auto-update.js?v=182"
];
const FALLBACK_INDEX = "./index.html";
const FALLBACK_ADMIN = "./admin.html";
const TIMEOUT_MS = 5000;
function timeout(ms){ return new Promise((_, reject) => setTimeout(() => reject(new Error("network-timeout")), ms)); }
async function putSafe(cache, request, response){ try{ if(response && response.ok) await cache.put(request, response.clone()); }catch(_){ } }
async function installCore(){
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(CORE_ASSETS.map(async (asset) => {
    try{ const res = await fetch(asset, {cache:"reload"}); if(res && res.ok) await cache.put(asset, res.clone()); }catch(_){ }
  }));
}
self.addEventListener("install", (event) => { event.waitUntil(installCore().then(() => self.skipWaiting())); });
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : null))).then(() => self.clients.claim()));
});
self.addEventListener("message", (event) => {
  if (!event.data) return;
  if (event.data.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data.type === "CLEAR_MESAHA_CACHE") event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))));
});
async function navigationResponse(request){
  const cache = await caches.open(CACHE_NAME);
  const isAdminRequest = new URL(request.url).pathname.endsWith("/admin.html");
  const cached = await cache.match(request, {ignoreSearch:true}) || (isAdminRequest ? await cache.match(FALLBACK_ADMIN) : null) || await cache.match(FALLBACK_INDEX) || await cache.match("./");
  const networkPromise = fetch(request, {cache:"reload"}).then(async (res) => { await putSafe(cache, request, res); if(new URL(request.url).pathname.endsWith("/index.html") || new URL(request.url).pathname.endsWith("/")) await putSafe(cache, FALLBACK_INDEX, res); return res; });
  if(cached){ networkPromise.catch(() => {}); return cached; }
  try{ return await Promise.race([networkPromise, timeout(TIMEOUT_MS)]); }catch(_){ return cached || new Response("Mesaha İO offline cache hazır değil. İnternet varken bir kez açıp tekrar deneyiniz.", {status:200, headers:{"Content-Type":"text/plain; charset=utf-8"}}); }
}
async function versionResponse(request){
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, {ignoreSearch:true}) || await cache.match("./version.json");
  try{ const res = await Promise.race([fetch(request, {cache:"no-store"}), timeout(TIMEOUT_MS)]); await putSafe(cache, "./version.json", res); return res; }catch(_){ return cached || new Response("{}", {headers:{"Content-Type":"application/json"}}); }
}
async function staticResponse(request){
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request) || await cache.match(request, {ignoreSearch:true});
  if(cached){ fetch(request).then((res) => putSafe(cache, request, res)).catch(() => {}); return cached; }
  try{ const res = await Promise.race([fetch(request), timeout(TIMEOUT_MS)]); await putSafe(cache, request, res); return res; }catch(_){ return cached || Response.error(); }
}
self.addEventListener("fetch", (event) => {
  const request = event.request; if(request.method !== "GET") return;
  const url = new URL(request.url); if(url.origin !== self.location.origin) return;
  const isNavigation = request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html") || url.pathname.endsWith("/admin.html");
  if(isNavigation){ event.respondWith(navigationResponse(request)); return; }
  if(url.pathname.endsWith("/version.json")){ event.respondWith(versionResponse(request)); return; }
  event.respondWith(staticResponse(request));
});
