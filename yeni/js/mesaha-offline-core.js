(function(){
  'use strict';
  if (window.__mesahaOfflineCoreV379) return;
  window.__mesahaOfflineCoreV379 = true;

  var META = {
    app: 'V3.66',
    version: 'v379-stability-battery-offline-fix',
    build: 379,
    visibleVersion: 'V3.66 •ExelanceX•',
    shortVersion: 'V3.66 •ExelanceX•',
    name: 'Mesaha İO V3.66 •ExelanceX•',
    cacheName: 'mesaha-app-v379-stability-battery-offline-fix',
    builtAt: '2026-06-25T22:45:00+03:00',
    notes: 'Stabilite, pil tüketimi ve offline açılış iyileştirildi; tek ses motoru ve tek Firebase motoru korundu.',
    assetVersion: '379'
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
    './js/version.js?v=379', './js/mesaha-sound.js?v=379', './js/mesaha-firebase.js?v=379',
    './js/mesaha-early-optimizer.js?v=379', './js/mesaha-offline-core.js?v=379',
    './assets/icon-192.png', './assets/icon-512.png', './assets/mesaha_logo.png', './assets/hero_forest_cover.png?v=379',
    './assets/mesaha_onay.wav?v=379', './assets/mesaha_uyari.wav?v=379'
  ];

  function warmCache(){
    if (!('caches' in window) || !navigator.onLine || connectionSaveData()) return;
    var last = 0;
    try { last = Number(localStorage.getItem('mesaha_cache_warm_v379') || 0); } catch(e) {}
    if (Date.now() - last < 6 * 60 * 60 * 1000) return;
    try { localStorage.setItem('mesaha_cache_warm_v379', String(Date.now())); } catch(e) {}
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
    navigator.serviceWorker.register('./service-worker.js?v=379').then(function(reg){
      try {
        var last = Number(localStorage.getItem('mesaha_sw_update_check_v379') || 0);
        if (navigator.onLine && Date.now() - last > 15 * 60 * 1000) {
          localStorage.setItem('mesaha_sw_update_check_v379', String(Date.now()));
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

  window.MesahaOfflineCoreV379 = {
    meta: META,
    cacheName: META.cacheName,
    warmCache: warmCache,
    online: function(){ return navigator.onLine !== false; }
  };
})();
