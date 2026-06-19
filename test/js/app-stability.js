(function(){
  'use strict';
  var INFO = window.MESAHA_VERSION || {};
  var FILE_VERSION = INFO.version || 'v179';
  var VISIBLE_VERSION = INFO.visibleVersion || (window.MESAHA_VERSION_TEXT || 'Mesaha İO');
  var ERROR_KEY = 'mesaha_error_log_' + FILE_VERSION;
  var BOOT_KEY = 'mesaha_boot_status_' + FILE_VERSION;
  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function byId(id){ return document.getElementById(id); }
  function q(sel, root){ return (root || document).querySelector(sel); }
  function safe(source, fn, fallback){ try { return fn(); } catch(e){ logError(source, e); return fallback; } }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]; }); }
  function toast(msg){ safe('toast', function(){ if(typeof window.showToast === 'function') window.showToast(msg); else console.log(msg); }); }
  function logError(source, err){
    try{
      var list = JSON.parse(localStorage.getItem(ERROR_KEY) || '[]');
      list.unshift({ time:new Date().toLocaleString('tr-TR'), version:FILE_VERSION, source:String(source || 'hata'), message:String((err && (err.message || err.reason || err)) || err || ''), stack:String((err && err.stack) || '').slice(0,1800), url:location.href });
      localStorage.setItem(ERROR_KEY, JSON.stringify(list.slice(0,60)));
    }catch(_){ }
  }
  window.addEventListener('error', function(ev){ logError(ev.filename || 'window.error', ev.error || ev.message); });
  window.addEventListener('unhandledrejection', function(ev){ logError('unhandledrejection', ev.reason || ev); });
  function setVersionText(){
    safe('setVersionText', function(){ document.title = VISIBLE_VERSION; });
    safe('setVersionText h1', function(){ var h = q('.brand h1'); if(h) h.textContent = VISIBLE_VERSION; });
    safe('buildInfo', function(){ window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, {fileVersion:FILE_VERSION, visibleVersion:VISIBLE_VERSION, stableMode:true, adminSeparated:true, excelLocked:true}); });
  }
  function installCss(){
    if(byId('mesahaStabilityCss')) return;
    var isAdminPage = /admin\.html/i.test(location.pathname);
    var style = document.createElement('style');
    style.id = 'mesahaStabilityCss';
    style.textContent = [
      (isAdminPage ? 'body:not(.mesaha-admin-ok) #panelAdminOpenBtn,body:not(.mesaha-admin-ok) #navAdmin,body:not(.mesaha-admin-ok) #flowTabsV111 [data-flow-tab="admin"],body:not(.mesaha-admin-ok) .admin-panel{display:none!important;visibility:hidden!important;pointer-events:none!important}' : '#panelAdminOpenBtn,#navAdmin,#flowTabsV111 [data-flow-tab="admin"],.admin-panel{display:none!important;visibility:hidden!important;pointer-events:none!important}'),
      '.v175-status{position:fixed;right:10px;bottom:82px;z-index:10000;padding:7px 10px;border-radius:999px;font-size:12px;font-weight:900;box-shadow:0 10px 25px rgba(15,23,42,.15);background:#ecfdf5;color:#166534;border:1px solid rgba(22,101,52,.14)}',
      '.v175-status.offline{background:#fff7ed;color:#9a3412;border-color:#fed7aa}',
      '.v175-boot-warning{position:fixed;left:12px;right:12px;bottom:86px;z-index:100500;background:#fff7ed;border:1px solid #fed7aa;color:#7c2d12;border-radius:18px;padding:12px;box-shadow:0 15px 35px rgba(15,23,42,.16);font-weight:800}',
      '.v175-boot-warning button{margin-top:8px;border:0;border-radius:12px;padding:8px 10px;font-weight:900;background:#ea580c;color:#fff}',
      '@media(max-width:600px){.v175-status{left:12px;right:auto;bottom:84px}}'
    ].join('\n');
    document.head.appendChild(style);
  }
  function installStatus(){
    var el = byId('mesahaOfflineStatus');
    if(!el){ el = document.createElement('div'); el.id = 'mesahaOfflineStatus'; el.className = 'v175-status'; document.body.appendChild(el); }
    function update(){
      var online = navigator.onLine;
      var label = online ? 'Çevrim içi' : 'Çevrim dışı';
      el.textContent = label;
      el.classList.toggle('offline', !online);
      el.classList.toggle('online', !!online);
      var home = byId('homeNetworkV143'); if(home) home.textContent = label;
      var badge = byId('mesahaNetBadgeV178'); if(badge){ badge.textContent = label; badge.classList.toggle('offline', !online); badge.classList.toggle('online', !!online); }
      if(window.MESAHA_STARTUP_V178 && typeof window.MESAHA_STARTUP_V178.setNetStatus === 'function') window.MESAHA_STARTUP_V178.setNetStatus(online, label);
      var upd = byId('userMenuForceUpdateBtn');
      if(upd){ upd.disabled = !online; upd.title = online ? 'Yeni sürümü internetten kontrol eder.' : 'Güncelleme için internet gerekir.'; upd.style.opacity = online ? '' : '.55'; }
    }
    update(); window.addEventListener('online', update); window.addEventListener('offline', update); setInterval(update, 4000);
  }
  function bootCheck(){
    var checks = [];
    function add(name, ok, detail){ checks.push({name:name, ok:!!ok, detail:detail || ''}); }
    add('HTML hazır', !!document.body);
    add('CSS yüklendi', !!q('link[href*="css/style.css"]'));
    add('Ana JS yüklendi', typeof window.MESAHA_BUILD_INFO !== 'undefined' || !!q('script[src*="core.js"]'));
    add('Service Worker destekli', 'serviceWorker' in navigator);
    add('Online durum', navigator.onLine, navigator.onLine ? 'Çevrimiçi' : 'Çevrimdışı çalışıyor');
    add('Cache API', !!window.caches);
    add('IndexedDB', !!window.indexedDB);
    add('LocalStorage', safe('localStorage test', function(){ localStorage.setItem('__mesaha_storage_test__','1'); localStorage.removeItem('__mesaha_storage_test__'); return true; }, false));
    add('Kayıt ekranı', !!byId('entryForm'));
    add('Ölçümler ekranı', !!(byId('recordsList') || q('.records-panel') || byId('recordsBody')));
    add('Yedek sistemi', !!(byId('backupBtn') || byId('restoreBtn') || q('input[type="file"]')));
    add('Mesaha indirme butonu', !!(byId('exportSystemXlsBtn') || q('[id*="export"][id*="Xls"]')));
    var ok = checks.every(function(x){ return x.ok || /Çevrimdışı/.test(x.detail); });
    var data = {time:new Date().toLocaleString('tr-TR'), version:FILE_VERSION, ok:ok, checks:checks};
    safe('bootCheck save', function(){ localStorage.setItem(BOOT_KEY, JSON.stringify(data)); });
    window.MESAHA_BOOT_STATUS = data;
    return data;
  }
  function clearCaches(reload){
    Promise.resolve().then(function(){
      if(navigator.serviceWorker && navigator.serviceWorker.controller){ try{ navigator.serviceWorker.controller.postMessage({type:'CLEAR_MESAHA_CACHE'}); }catch(_){ } }
      if(window.caches && caches.keys){ return caches.keys().then(function(keys){ return Promise.all(keys.map(function(k){ return caches.delete(k); })); }); }
    }).then(function(){
      if(reload){ sessionStorage.setItem('mesaha_force_reload_'+FILE_VERSION, String(Date.now())); location.replace(location.pathname + '?v=' + encodeURIComponent(FILE_VERSION)); }
    }).catch(function(e){ logError('clearCaches', e); if(reload) location.reload(); });
  }
  window.mesahaClearCaches = clearCaches;
  window.mesahaBootCheck = bootCheck;
  function resetFromUrl(){
    safe('resetFromUrl', function(){
      var p = new URLSearchParams(location.search || '');
      if(p.get('reset') === '1' && sessionStorage.getItem('mesaha_reset_done_'+FILE_VERSION) !== '1'){
        sessionStorage.setItem('mesaha_reset_done_'+FILE_VERSION, '1'); clearCaches(true);
      }
    });
  }
  function registerServiceWorker(){
    if(!('serviceWorker' in navigator)) return;
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('./service-worker.js?v='+FILE_VERSION).then(function(reg){ try{ reg.update(); }catch(_){ } }).catch(function(e){ logError('serviceWorker.register', e); });
    }, {once:true});
  }
  function versionCheckBackground(){
    if(!navigator.onLine) return;
    setTimeout(function(){ safe('versionCheckBackground', function(){
      if(window.mesahaAutoUpdateCheck && typeof window.mesahaAutoUpdateCheck === 'function'){
        window.mesahaAutoUpdateCheck('background');
        return;
      }
      fetch('./version.json?v=' + Date.now(), {cache:'no-store'}).then(function(r){ return r.ok ? r.json() : null; }).then(function(v){
        if(v && v.version && String(v.version) !== FILE_VERSION){ toast('Yeni sürüm görünüyor. Güncelleme hazırlanıyor...'); }
      }).catch(function(e){ logError('versionCheck fetch', e); });
    }); }, 3000);
  }
  function loadingWatchdog(){
    setTimeout(function(){ safe('loadingWatchdog', function(){
      var stuck = document.body.classList.contains('cloud-loading-open');
      var hasForm = !!byId('entryForm');
      if(stuck || !hasForm){
        document.body.classList.remove('cloud-loading-open');
        if(byId('mesahaBootWarning')) return;
        var warn = document.createElement('div'); warn.id = 'mesahaBootWarning'; warn.className = 'v175-boot-warning';
        warn.innerHTML = 'Uygulama açılışı yavaşladı. Kayıtlar silinmeden önbelleği temizleyip yeniden açabilirsiniz.<br><button type="button">Önbelleği Temizle ve Yenile</button>';
        document.body.appendChild(warn); warn.querySelector('button').addEventListener('click', function(){ clearCaches(true); });
      }
    }); }, 7000);
  }
  function boot(){ installCss(); setVersionText(); resetFromUrl(); installStatus(); bootCheck(); loadingWatchdog(); versionCheckBackground(); }
  ready(function(){ boot(); [150,500,1200,2500].forEach(function(ms){ setTimeout(function(){ setVersionText(); bootCheck(); }, ms); }); });
  window.addEventListener('load', function(){ boot(); registerServiceWorker(); }, {once:true});
})();
