(function(){
  'use strict';
  if (window.__mesahaOfflineCore) return;
  window.__mesahaOfflineCore = true;

  var FALLBACK_META = {
  "app": "V3.90",
  "version": "v405-kesimci-duzenle-sil-koruma",
  "build": 451,
  "visibleVersion": "V3.90 •ExelanceX•",
  "shortVersion": "V3.90 •ExelanceX•",
  "name": "Mesaha İO V3.90 •ExelanceX•",
  "cacheName": "mesaha-app-v405-kesimci-duzenle-sil-koruma",
  "builtAt": "2026-06-27T13:25:00+03:00",
  "notes": "Kesimci isim düzenleme eklendi; kesimci yanında düzenle/sil butonları gösterilir; kayıt bağlı kesimci silinmez.",
  "assetVersion":"451"
};
  var META = (window.MESAHA_VERSION && typeof window.MESAHA_VERSION === 'object') ? window.MESAHA_VERSION : FALLBACK_META;
  var ASSET_VERSION = String(META.assetVersion || META.build || '405');

  function lock(name, value){
    try {
      Object.defineProperty(window, name, {
        configurable: false,
        enumerable: true,
        get: function(){ return value; },
        set: function(){}
      });
    } catch(e) {
      try { window[name] = value; } catch(_) {}
    }
  }

  lock('MESAHA_VERSION', META);
  lock('MESAHA_VERSION_TEXT', META.visibleVersion);
  lock('MESAHA_VERSION_SHORT', META.shortVersion);

  function $(id){ return document.getElementById(id); }
  function all(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function setVersionText(){
    try { document.title = 'Mesaha İO ' + META.visibleVersion; } catch(e) {}
    try { var apple = document.querySelector('meta[name="apple-mobile-web-app-title"]'); if (apple) apple.setAttribute('content', META.app); } catch(e) {}
    try { var st = document.querySelector('#startup strong'); if (st) st.textContent = META.visibleVersion; } catch(e) {}
    try { var vt = $('versionText'); if (vt) vt.textContent = META.shortVersion; } catch(e) {}
    try { all('.version-card b').forEach(function(el){ if (/^v?\d|^V\d|Mesaha|Exelance/i.test(el.textContent || '')) el.textContent = META.shortVersion; }); } catch(e) {}
    try { all('.version-card small').forEach(function(el){ el.textContent = ''; }); } catch(e) {}
  }

  function setOnlineClass(){
    var online = navigator.onLine !== false;
    try {
      document.documentElement.classList.toggle('mesaha-online', online);
      document.documentElement.classList.toggle('mesaha-offline', !online);
      if (document.body) { document.body.classList.toggle('mesaha-online', online); document.body.classList.toggle('mesaha-offline', !online); }
      if (online) localStorage.setItem('mesaha_last_online_ms', String(Date.now()));
    } catch(e) {}
  }

  function connectionSaveData(){
    try { var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection; return !!(c && c.saveData); }
    catch(e){ return false; }
  }

  var CORE_ASSETS = [
    './index.html', './admin.html', './manifest.json', './version.json', './service-worker.js', './temizle.html',
    './js/version.js?v=' + ASSET_VERSION, './js/mesaha-sound.js?v=' + ASSET_VERSION, './js/mesaha-firebase.js?v=' + ASSET_VERSION,
    './js/mesaha-early-optimizer.js?v=' + ASSET_VERSION, './js/mesaha-offline-core.js?v=' + ASSET_VERSION,
    './assets/icon-192.png', './assets/icon-512.png', './assets/mesaha_logo.png', './assets/hero_forest_cover.png?v=' + ASSET_VERSION,
    './assets/mesaha_onay.wav?v=' + ASSET_VERSION, './assets/mesaha_uyari.wav?v=' + ASSET_VERSION
  ];

  function warmCache(){
    if (!('caches' in window) || !navigator.onLine || connectionSaveData()) return;
    var last = 0;
    try { last = Number(localStorage.getItem('mesaha_cache_warm_current') || 0); } catch(e) {}
    if (Date.now() - last < 6 * 60 * 60 * 1000) return;
    try { localStorage.setItem('mesaha_cache_warm_current', String(Date.now())); } catch(e) {}
    var runner = function(){
      caches.open(META.cacheName).then(function(cache){
        return Promise.allSettled(CORE_ASSETS.map(function(url){
          return fetch(url, {cache:'reload'}).then(function(res){
            if (res && res.ok) return cache.put(url, res.clone());
          }).catch(function(){});
        }));
      }).catch(function(){});
    };
    try { requestIdleCallback(runner, {timeout: 2500}); } catch(e) { setTimeout(runner, 500); }
  }

  function registerServiceWorker(){
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./service-worker.js?v=' + ASSET_VERSION).then(function(reg){
      try {
        var last = Number(localStorage.getItem('mesaha_sw_update_check_current') || 0);
        if (navigator.onLine && Date.now() - last > 15 * 60 * 1000) {
          localStorage.setItem('mesaha_sw_update_check_current', String(Date.now()));
          reg.update().catch(function(){});
        }
      } catch(e) {}
      warmCache();
    }).catch(function(){});
  }

  setVersionText();
  setOnlineClass();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setVersionText(); setOnlineClass(); registerServiceWorker(); }, {once:true});
  } else {
    registerServiceWorker();
  }
  window.addEventListener('online', function(){ setOnlineClass(); registerServiceWorker(); }, {passive:true});
  window.addEventListener('offline', setOnlineClass, {passive:true});
  window.addEventListener('pageshow', function(){ setVersionText(); setOnlineClass(); }, {passive:true});

  // Eski yamalar DOM'u tekrar yazsa bile görünür sürüm bilgisi arada bozulmasın; düşük frekanslı ve hafif.
  setInterval(setVersionText, 60000);

  var offlineApi = {
    meta: META,
    cacheName: META.cacheName,
    warmCache: warmCache,
    online: function(){ return navigator.onLine !== false; }
  };
  window.MesahaOfflineCore = offlineApi;
  window.MesahaOfflineCoreV383 = offlineApi;
})();


// v383: Aynı oturumda güncelleme kontrolü üst üste bindirilmesin.
(function(){
  try {
    var KEY='mesaha_manual_update_guard_current';
    window.MesahaOfflineCore = window.MesahaOfflineCore || window.MesahaOfflineCoreV383 || window.MesahaOfflineCoreV382 || window.MesahaOfflineCoreV381 || window.MesahaOfflineCoreV380 || {};
    window.MesahaOfflineCore.canManualUpdate = function(){
      var last = Number(localStorage.getItem(KEY)||0);
      if(Date.now()-last < 30000) return false;
      localStorage.setItem(KEY, String(Date.now()));
      return true;
    };
  } catch(e) {}
})();


// v389: service worker ısındırma ve güncelleme kontrolü bindirmeme.
(function(){
  try {
    var KEY='mesaha_update_probe_guard_current';
    window.MesahaOfflineCoreV387 = window.MesahaOfflineCoreV387 || {};
    window.MesahaOfflineCoreV387.canProbe = function(){
      var last=Number(localStorage.getItem(KEY)||0);
      if(Date.now()-last<45000) return false;
      localStorage.setItem(KEY,String(Date.now())); return true;
    };
    if('serviceWorker' in navigator){
      navigator.serviceWorker.ready.then(function(reg){
        try{ if(reg && reg.active) reg.active.postMessage({type:'WARM_CACHE'}); }catch(e){}
      }).catch(function(){});
    }
  } catch(e) {}
})();
