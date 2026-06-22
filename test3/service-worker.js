importScripts('./js/version.js?v=345');
const CACHE_NAME = (self.MESAHA_VERSION && self.MESAHA_VERSION.cacheName) || 'mesaha-app-v345-dark-gray-live-patch';
const ASSETS = [
  './','./index.html','./admin.html','./manifest.json','./version.json','./service-worker.js',
  './js/version.js?v=345','./mesaha-patch-v345.css','./mesaha-patch-v345.js',
  './assets/icon-192.png','./assets/icon-512.png','./assets/mesaha_logo.png',
  './assets/06_net_islem_onayi.wav','./assets/08_hata_uyari_onaydan_farkli.wav'
];
function injectPatch(html){
  try{
    if(html.indexOf('mesaha-patch-v345.js') !== -1) return html;
    html = html.replace('</head>', '<link rel="stylesheet" href="./mesaha-patch-v345.css?v=345"></head>');
    html = html.replace('</body>', '<script src="./mesaha-patch-v345.js?v=345"></script></body>');
    return html;
  }catch(e){ return html; }
}
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME && k.startsWith('mesaha-app-')).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const isIndex = url.pathname.endsWith('/test3/') || url.pathname.endsWith('/test3/index.html') || url.pathname.endsWith('/index.html');
  if(isIndex){
    event.respondWith(fetch(event.request, {cache:'no-store'}).then(r => r.text()).then(html => new Response(injectPatch(html), {headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})).catch(() => caches.match('./index.html').then(r => r || fetch(event.request))));
    return;
  }
  if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/service-worker.js')) {
    event.respondWith(fetch(event.request, {cache:'no-store'}).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(fetch(event.request).then(response => {
    const clone = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(()=>{});
    return response;
  }).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html'))));
});
