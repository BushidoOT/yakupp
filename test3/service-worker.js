importScripts('./js/version.js?v=346');

const META = self.MESAHA_VERSION || {
  app: 'V3.38',
  version: 'v346-runtime-theme-update-fix',
  build: 346,
  visibleVersion: 'V3.38 •ExelanceX•',
  shortVersion: 'V3.38 •ExelanceX•',
  name: 'Mesaha İO V3.38 •ExelanceX•',
  cacheName: 'mesaha-app-v346-runtime-theme-update-fix',
  builtAt: '2026-06-22T03:10:00+03:00',
  notes: 'Service worker sayfa yüklenirken eski sürüm izlerini ve karanlık tema butonunu düzeltir.',
  assetVersion: '346'
};
const CACHE_NAME = META.cacheName || 'mesaha-app-v346-runtime-theme-update-fix';
const ASSET_VERSION = META.assetVersion || '346';
const ASSETS = [
  './','./index.html','./admin.html','./manifest.json','./version.json','./service-worker.js',
  './js/version.js?v=' + ASSET_VERSION,
  './assets/icon-192.png','./assets/icon-512.png','./assets/mesaha_logo.png',
  './assets/06_net_islem_onayi.wav','./assets/08_hata_uyari_onaydan_farkli.wav'
];

function metaJson(){
  return JSON.stringify(META);
}

function pageFixBlock(){
  const meta = metaJson().replace(/</g, '\\u003c');
  return `
<style id="mesaha-v346-runtime-theme-update-fix-style">
#themeBtn{display:grid!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;z-index:999!important;place-items:center!important;}
body.dark #themeBtn{background:#15191f!important;border-color:#35404a!important;color:#f6c84c!important;}
</style>
<script id="mesaha-v346-runtime-theme-update-fix-script">
(function(){
  'use strict';
  var META=${meta};
  var SETTINGS_KEY='cam_mesaha_ayarlar_v1';
  var THEME_KEY='mesaha_theme_v342';
  function $(id){return document.getElementById(id);}
  function qsa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel));}
  function publishVersion(){
    window.MESAHA_VERSION=META;
    window.MESAHA_VERSION_TEXT=META.visibleVersion;
    window.MESAHA_VERSION_SHORT=META.shortVersion;
    window.MESAHA_FORCE_VERSION=META.version;
    try{document.title='Mesaha İO '+META.visibleVersion;}catch(e){}
    var apple=document.querySelector('meta[name="apple-mobile-web-app-title"]'); if(apple) apple.setAttribute('content',META.app);
    var vt=$('versionText'); if(vt) vt.textContent=META.shortVersion;
    qsa('.version-card b').forEach(function(b){b.textContent=META.shortVersion;});
    qsa('.version-card small').forEach(function(s){s.textContent='';});
    var st=document.querySelector('#startup strong'); if(st) st.textContent=META.shortVersion;
  }
  function readTheme(){
    try{var a=localStorage.getItem(THEME_KEY); if(a==='dark'||a==='light') return a;}catch(e){}
    try{var s=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'); if(s.theme==='dark'||s.theme==='light') return s.theme;}catch(e){}
    try{var ws=window.state&&window.state.settings&&window.state.settings.theme; if(ws==='dark'||ws==='light') return ws;}catch(e){}
    return document.body.classList.contains('dark')?'dark':'light';
  }
  function persistTheme(mode){
    try{localStorage.setItem(THEME_KEY,mode);}catch(e){}
    try{var s=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'); s.theme=mode; localStorage.setItem(SETTINGS_KEY,JSON.stringify(s));}catch(e){}
    try{if(window.state&&window.state.settings) window.state.settings.theme=mode;}catch(e){}
  }
  function setIcon(){
    var btn=$('themeBtn'); if(!btn) return;
    var dark=document.body.classList.contains('dark');
    btn.textContent=dark?'☀':'🌙';
    btn.setAttribute('title',dark?'Aydınlık moda geç':'Karanlık moda geç');
    btn.setAttribute('aria-label',btn.getAttribute('title'));
  }
  function applyTheme(mode){
    var dark=mode==='dark';
    document.body.classList.toggle('dark',dark);
    persistTheme(dark?'dark':'light');
    setIcon();
  }
  function cleanThemeButton(){
    var top=document.querySelector('.topbar'); if(!top) return;
    var old=$('themeBtn');
    if(!old){ old=document.createElement('button'); old.id='themeBtn'; old.className='icon-btn'; old.type='button'; top.appendChild(old); }
    var btn=old;
    if(!btn.__v346Clean){
      var clone=btn.cloneNode(true);
      clone.__v346Clean=true;
      clone.__v342DarkBound=true;
      clone.id='themeBtn';
      clone.className=btn.className || 'icon-btn';
      clone.type='button';
      btn.parentNode.replaceChild(clone,btn);
      btn=clone;
    } else { btn.__v342DarkBound=true; }
    btn.style.setProperty('display','grid','important');
    btn.style.setProperty('visibility','visible','important');
    btn.style.setProperty('opacity','1','important');
    btn.style.setProperty('pointer-events','auto','important');
    btn.style.setProperty('place-items','center','important');
    if(!btn.__v346Bound){
      btn.__v346Bound=true;
      btn.addEventListener('click',function(ev){
        ev.preventDefault();
        ev.stopImmediatePropagation();
        applyTheme(document.body.classList.contains('dark')?'light':'dark');
        return false;
      },true);
    }
    setIcon();
  }
  function silenceOldUpdatePopup(){
    try{localStorage.setItem('mesaha_last_seen_version', META.version);}catch(e){}
    try{localStorage.setItem('mesaha_current_version', META.version);}catch(e){}
  }
  function boot(){
    publishVersion();
    silenceOldUpdatePopup();
    applyTheme(readTheme());
    cleanThemeButton();
  }
  boot();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  [50,150,350,700,1500,3000,5000].forEach(function(ms){setTimeout(boot,ms);});
  setInterval(function(){publishVersion(); silenceOldUpdatePopup(); cleanThemeButton();},2500);
  window.mesahaV346Fix={publishVersion:publishVersion,applyTheme:applyTheme,cleanThemeButton:cleanThemeButton};
})();
</script>`;
}

function patchHtml(html){
  const meta = metaJson();
  html = html.replace(/<title>.*?<\/title>/i, '<title>Mesaha İO ' + META.visibleVersion + '</title>');
  html = html.replace(/<meta name="apple-mobile-web-app-title" content="[^"]*"\s*\/?>/i, '<meta name="apple-mobile-web-app-title" content="' + META.app + '" />');
  html = html.replace(/const info = \{"app": "V3\.[^"]+"[\s\S]*?\};/, 'const info = ' + meta + ';');
  html = html.replace(/var info=\{"app": "V3\.[^"]+"[\s\S]*?\};/, 'var info=' + meta + ';');
  html = html.replace(/version:'v330-ui-fix'/g, "version:'" + META.version + "'");
  html = html.replace(/fileVersion:'v330-ui-fix'/g, "fileVersion:'" + META.version + "'");
  html = html.replace(/var BUILD=\d+;/g, 'var BUILD=' + META.build + ';');
  html = html.replace(/var SOUND_VERSION='\d+';/g, "var SOUND_VERSION='" + META.assetVersion + "';");
  html = html.replace(/#themeBtn\{display:none!important;\}/g, '#themeBtn{display:grid!important;}');
  html = html.replace(/id="mesaha-v345-dark-theme-update-alert-fix-script"/g, 'id="mesaha-v345-disabled-script"');
  html = html.replace(/id="mesaha-v345-dark-theme-update-alert-fix-style"/g, 'id="mesaha-v345-disabled-style"');
  if (!html.includes('mesaha-v346-runtime-theme-update-fix-script')) {
    const fix = pageFixBlock();
    if (html.includes('</body>')) html = html.replace('</body>', fix + '\n</body>');
    else html += fix;
  }
  return html;
}

async function networkFirstPatchedHtml(request){
  try {
    const response = await fetch(request, {cache:'no-store'});
    const text = await response.text();
    const patched = patchHtml(text);
    const out = new Response(patched, {status: response.status, statusText: response.statusText, headers: {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
    const clone = out.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(request, clone)).catch(()=>{});
    return out;
  } catch (e) {
    const cached = await caches.match(request) || await caches.match('./index.html');
    if (cached) {
      const text = await cached.text();
      return new Response(patchHtml(text), {headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
    }
    throw e;
  }
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
  if (event.request.mode === 'navigate' || isIndex) {
    event.respondWith(networkFirstPatchedHtml(event.request));
    return;
  }
  if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/service-worker.js') || url.pathname.endsWith('/js/version.js')) {
    event.respondWith(fetch(event.request, {cache:'no-store'}).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(fetch(event.request).then(response => {
    const clone = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(()=>{});
    return response;
  }).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html'))));
});
