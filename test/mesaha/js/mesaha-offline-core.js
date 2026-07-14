(function(){
  'use strict';
  if (window.__mesahaOfflineCore) return;
  window.__mesahaOfflineCore = true;

  var FALLBACK_META = {app:'Mesaha İO', version:'local', build:0, visibleVersion:'Mesaha İO', shortVersion:'Mesaha İO', name:'Mesaha İO', cacheName:'mesaha-app-local', integrityId:'local', assetVersion:''};
  var META = (window.MESAHA_VERSION && typeof window.MESAHA_VERSION === 'object') ? window.MESAHA_VERSION : FALLBACK_META;
  var ASSET_VERSION = String(META.assetVersion || META.build || '');

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
    try { var vt = $('versionText'); if (vt) vt.textContent = META.visibleVersion; } catch(e) {}
    try { all('.version-card b').forEach(function(el){ if (/^v?\d|^V\d|Mesaha|Exelance/i.test(el.textContent || '')) el.textContent = META.visibleVersion; }); } catch(e) {}
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
    './index.html', './manifest.json', './version.json', './service-worker.js', './temizle.html',
    './js/version.js', './js/mesaha-sound.js', './js/mesaha-firebase.js',
    './js/mesaha-early-optimizer.js', './js/mesaha-offline-core.js',
    './assets/icon-192.png', './assets/icon-512.png', './assets/mesaha_logo.png', './assets/hero_forest_cover.webp',
    './assets/mesaha_onay.wav', './assets/mesaha_uyari.wav'
  ];

  function warmCache(){
    if(window.MESAHA_SUITE_MODE)return;
    if(!('serviceWorker' in navigator)||!navigator.onLine||connectionSaveData())return;
    var last=0,key='mesaha_cache_warm_'+String(META.build||META.integrityId||'current');
    try{last=Number(localStorage.getItem(key)||0);}catch(e){}
    if(Date.now()-last<6*60*60*1000)return;
    try{localStorage.setItem(key,String(Date.now()));}catch(e){}
    navigator.serviceWorker.ready.then(function(reg){
      try{if(reg&&reg.active)reg.active.postMessage({type:'REPAIR_CACHE',build:META.build||0,integrityId:META.integrityId||''});}catch(e){}
    }).catch(function(){});
  }

  function registerServiceWorker(){
    if(window.MESAHA_SUITE_MODE)return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('../service-worker.js?v=9', {scope:'../', updateViaCache:'none'}).then(function(reg){
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

  window.addEventListener('mesaha:version-refresh', setVersionText, {passive:true});

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
  } catch(e) {}
})();
