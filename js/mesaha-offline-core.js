(function(){
  'use strict';
  if (window.__mesahaOfflineCoreV383) return;
  window.__mesahaOfflineCoreV383 = true;

  var META = {
    app: 'V3.76',
    version: 'v391-orbis-beyan-export-hotfix',
    build: 389,
    visibleVersion: 'V3.76 •ExelanceX•',
    shortVersion: 'V3.76 •ExelanceX•',
    name: 'Mesaha İO V3.76 •ExelanceX•',
    cacheName: 'mesaha-app-v391-orbis-beyan-export-hotfix',
    builtAt: '2026-06-25T23:05:00+03:00',
    notes: 'Görünür sürüm V3.76 yapıldı; güncelleme uyarısının aynı sürümde tekrar tekrar görünmesi engellendi.',
    assetVersion:"389"
  };

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
    './js/version.js?v=391', './js/mesaha-sound.js?v=391', './js/mesaha-firebase.js?v=391',
    './js/mesaha-early-optimizer.js?v=391', './js/mesaha-offline-core.js?v=391',
    './assets/icon-192.png', './assets/icon-512.png', './assets/mesaha_logo.png', './assets/hero_forest_cover.png?v=391',
    './assets/mesaha_onay.wav?v=391', './assets/mesaha_uyari.wav?v=391'
  ];

  function warmCache(){
    if (!('caches' in window) || !navigator.onLine || connectionSaveData()) return;
    var last = 0;
    try { last = Number(localStorage.getItem('mesaha_cache_warm_v383') || 0); } catch(e) {}
    if (Date.now() - last < 6 * 60 * 60 * 1000) return;
    try { localStorage.setItem('mesaha_cache_warm_v383', String(Date.now())); } catch(e) {}
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
    navigator.serviceWorker.register('./service-worker.js?v=391').then(function(reg){
      try {
        var last = Number(localStorage.getItem('mesaha_sw_update_check_v383') || 0);
        if (navigator.onLine && Date.now() - last > 15 * 60 * 1000) {
          localStorage.setItem('mesaha_sw_update_check_v383', String(Date.now()));
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
  setInterval(setVersionText, 10000);

  window.MesahaOfflineCoreV383 = {
    meta: META,
    cacheName: META.cacheName,
    warmCache: warmCache,
    online: function(){ return navigator.onLine !== false; }
  };
})();


// v383: Aynı oturumda güncelleme kontrolü üst üste bindirilmesin.
(function(){
  try {
    var KEY='mesaha_v383_last_manual_update';
    window.MesahaOfflineCoreV383 = window.MesahaOfflineCoreV383 || window.MesahaOfflineCoreV382 || window.MesahaOfflineCoreV381 || window.MesahaOfflineCoreV380 || {};
    window.MesahaOfflineCoreV383.canManualUpdate = function(){
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
    var KEY='mesaha_v389_last_update_probe';
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
