(function(){
  'use strict';

  var INFO = window.MESAHA_VERSION || {};
  var FILE_VERSION = INFO.version || 'v179';
  var VISIBLE_VERSION = INFO.visibleVersion || (window.MESAHA_VERSION_TEXT || 'Mesaha İO');
  var ADMIN_NAME = 'Yakup';
  var ADMIN_SEFLIK = 'Yaylacık';
  var ERROR_KEY = 'mesaha_error_log_' + FILE_VERSION;
  var BOOT_KEY = 'mesaha_boot_status_' + FILE_VERSION;
  var USER_STORE_KEY = 'mesaha_kullanicilar_v1';
  var ADMIN_CODE = '4767';

  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function byId(id){ return document.getElementById(id); }
  function q(sel, root){ return (root || document).querySelector(sel); }
  function qa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function txt(el){ return (el && String(el.textContent || el.value || '').trim()) || ''; }
  function safe(name, fn, fallback){ try { return fn(); } catch(e){ logError(name, e); return fallback; } }
  function toast(msg){ safe('toast', function(){ if(typeof window.showToast === 'function') window.showToast(msg); else console.log(msg); }); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]; }); }
  function normalize(v){
    return String(v == null ? '' : v)
      .trim()
      .replace(/\s+/g, ' ')
      .toLocaleLowerCase('tr-TR')
      .replace(/ı/g, 'i')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
  function same(a,b){ return normalize(a) === normalize(b); }

  function logError(source, err){
    try{
      var list = JSON.parse(localStorage.getItem(ERROR_KEY) || '[]');
      list.unshift({
        time: new Date().toLocaleString('tr-TR'),
        version: FILE_VERSION,
        source: String(source || 'hata'),
        message: String((err && (err.message || err.reason || err)) || err || ''),
        stack: String((err && err.stack) || '').slice(0, 1800),
        url: location.href
      });
      localStorage.setItem(ERROR_KEY, JSON.stringify(list.slice(0, 80)));
    }catch(_){ }
  }
  window.addEventListener('error', function(ev){ logError(ev.filename || 'window.error', ev.error || ev.message); });
  window.addEventListener('unhandledrejection', function(ev){ logError('unhandledrejection', ev.reason || ev); });

  function parseUserText(value){
    var s = String(value || '').trim();
    if(!s) return null;
    var parts = s.split('•').map(function(x){ return x.trim(); }).filter(Boolean);
    if(parts.length >= 2) return {name: parts[0], seflik: parts.slice(1).join(' • ')};
    return null;
  }

  function userFromStore(){
    return safe('userFromStore', function(){
      var store = JSON.parse(localStorage.getItem(USER_STORE_KEY) || '{}');
      var users = Array.isArray(store.users) ? store.users : [];
      var active = users.find(function(u){ return u && u.id === store.activeUserId; });
      return active || null;
    }, null);
  }

  function activeUser(){
    var u = null;
    u = parseUserText(txt(byId('activeUserBadge'))); if(u) return u;
    u = parseUserText(txt(byId('userPanelInfo'))); if(u) return u;
    u = userFromStore(); if(u && (u.name || u.seflik)) return u;
    var ln = byId('loginUserName'), ls = byId('loginSeflik');
    if((ln && ln.value) || (ls && ls.value)) return {name: txt(ln), seflik: txt(ls)};
    var ekip = byId('ekipNot'), sf = byId('seflik');
    if((ekip && ekip.value) || (sf && sf.value)) return {name: txt(ekip), seflik: txt(sf)};
    return {name:'', seflik:''};
  }

  function isAdminUser(){
    var u = activeUser() || {};
    return same(u.name, ADMIN_NAME) && same(u.seflik, ADMIN_SEFLIK);
  }
  window.mesahaIsAdminUserV175 = isAdminUser;
  window.mesahaActiveUserV175 = activeUser;

  function setVersionText(){
    safe('setVersionText', function(){ document.title = VISIBLE_VERSION; });
    safe('setVersionText h1', function(){ var h = q('.brand h1'); if(h) h.textContent = VISIBLE_VERSION; });
    safe('setVersionMeta', function(){ window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, {fileVersion:FILE_VERSION, visibleVersion:VISIBLE_VERSION, offlineStabilization:true, adminOwner:ADMIN_NAME+' / '+ADMIN_SEFLIK}); });
  }

  function installCss(){
    if(byId('v175OfflineAdminCss')) return;
    var style = document.createElement('style');
    style.id = 'v175OfflineAdminCss';
    style.textContent = [
      'body:not(.mesaha-admin-ok) #navAdmin,body:not(.mesaha-admin-ok) #panelAdminOpenBtn,body:not(.mesaha-admin-ok) .admin-panel{display:none!important;visibility:hidden!important;pointer-events:none!important}',
      'body.mesaha-admin-ok #panelAdminOpenBtn{display:block!important;visibility:visible!important;pointer-events:auto!important}',
      '.v175-status{position:fixed;right:10px;bottom:82px;z-index:10000;padding:7px 10px;border-radius:999px;font-size:12px;font-weight:900;box-shadow:0 10px 25px rgba(15,23,42,.15);background:#ecfdf5;color:#166534;border:1px solid rgba(22,101,52,.14)}',
      '.v175-status.offline{background:#fff7ed;color:#9a3412;border-color:#fed7aa}',
      '.v175-admin-tools{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0;padding:10px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0}',
      '.v175-admin-tools button{border:0;border-radius:14px;padding:10px 12px;font-weight:900;background:#166534;color:#fff}',
      '.v175-admin-tools button.secondary{background:#e2e8f0;color:#0f172a}',
      '.v175-modal{position:fixed;inset:0;z-index:100600;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:14px}',
      '.v175-card{background:#fff;color:#0f172a;border-radius:24px;max-width:900px;width:min(96vw,900px);max-height:88vh;overflow:auto;padding:18px;box-shadow:0 25px 80px rgba(15,23,42,.35)}',
      '.v175-card h2{margin:0 0 10px;color:#14532d}',
      '.v175-card pre{white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:12px;max-height:62vh;overflow:auto}',
      '.v175-card .row-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}',
      '.v175-card button{border:0;border-radius:14px;padding:10px 13px;font-weight:900;background:#166534;color:#fff}',
      '.v175-card button.secondary{background:#e2e8f0;color:#0f172a}',
      '.v175-boot-warning{position:fixed;left:12px;right:12px;bottom:86px;z-index:100500;background:#fff7ed;border:1px solid #fed7aa;color:#7c2d12;border-radius:18px;padding:12px;box-shadow:0 15px 35px rgba(15,23,42,.16);font-weight:800}',
      '.v175-boot-warning button{margin-top:8px;border:0;border-radius:12px;padding:8px 10px;font-weight:900;background:#ea580c;color:#fff}',
      '@media(max-width:600px){.v175-status{left:12px;right:auto;bottom:84px}.v175-card{border-radius:20px;padding:14px}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function hideAdmin(){
    document.body.classList.remove('mesaha-admin-ok','show-admin','admin-unlocked-v131');
    qa('#navAdmin,#panelAdminOpenBtn,#flowTabsV111 [data-flow-tab="admin"]').forEach(function(el){
      el.style.setProperty('display','none','important');
      el.classList.remove('active');
    });
    var panel = q('.admin-panel'); if(panel) panel.style.setProperty('display','none','important');
    safe('hideAdmin session', function(){ sessionStorage.removeItem('mesaha_admin_panel_open'); sessionStorage.removeItem('mesaha_admin_code'); });
  }

  function showAdminAccess(){
    document.body.classList.add('mesaha-admin-ok');
    var userBtn = byId('panelAdminOpenBtn');
    if(userBtn){ userBtn.style.setProperty('display','block','important'); userBtn.textContent = 'Yönetici Panelini Aç'; }
    var tab = q('#flowTabsV111 [data-flow-tab="admin"]'); if(tab) tab.style.display = '';
    var nav = byId('navAdmin'); if(nav && sessionStorage.getItem('mesaha_admin_panel_open') === '1') nav.style.display = '';
    var panel = q('.admin-panel'); if(panel && sessionStorage.getItem('mesaha_admin_panel_open') === '1') panel.style.removeProperty('display');
  }

  function updateAdminVisibility(){
    installCss();
    if(isAdminUser()) showAdminAccess(); else hideAdmin();
  }

  function openAdminDirect(){
    updateAdminVisibility();
    if(!isAdminUser()){
      hideAdmin();
      toast('Admin paneli sadece Yakup / Yaylacık kullanıcısına açıktır.');
      return;
    }
    safe('openAdminDirect session', function(){
      sessionStorage.setItem('mesaha_admin_code', ADMIN_CODE);
      sessionStorage.setItem('mesaha_admin_panel_open', '1');
      try { if(window.state) window.state.lastAdminCode = ADMIN_CODE; } catch(_){ }
    });
    document.body.classList.remove('user-panel-open','show-records','show-guide');
    document.body.classList.add('mesaha-admin-ok','show-admin','admin-unlocked-v131');
    qa('#navEntry,#navRecords,#navGuide').forEach(function(b){ b.classList.remove('active'); });
    var nav = byId('navAdmin'); if(nav){ nav.style.display = ''; nav.classList.add('active'); }
    var panel = q('.admin-panel'); if(panel) panel.style.removeProperty('display');
    safe('loadAdmin', function(){
      if(typeof window.adminLoadWithLoadingV131 === 'function') return window.adminLoadWithLoadingV131('Admin paneli açılıyor...');
      if(typeof window.loadAdminPanelData === 'function') return window.loadAdminPanelData();
    });
  }
  window.openAdminFromUserPanel = openAdminDirect;
  window.mesahaOpenAdminV175 = openAdminDirect;

  function guardAdminClicks(){
    if(document.__v175AdminGuarded) return;
    document.__v175AdminGuarded = true;
    document.addEventListener('click', function(ev){
      var target = ev.target && ev.target.closest ? ev.target.closest('#panelAdminOpenBtn,#navAdmin,#flowTabsV111 [data-flow-tab="admin"]') : null;
      if(!target) return;
      if(!isAdminUser()){
        ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        hideAdmin();
        toast('Bu bölüm sadece Yakup / Yaylacık admin kullanıcısına açıktır.');
        return;
      }
      if(target.id === 'panelAdminOpenBtn' || target.id === 'navAdmin'){
        ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        openAdminDirect();
      }
    }, true);
  }

  function installStatus(){
    var el = byId('v175OfflineStatus');
    if(!el){
      el = document.createElement('div');
      el.id = 'v175OfflineStatus';
      el.className = 'v175-status';
      document.body.appendChild(el);
    }
    function update(){
      var online = navigator.onLine;
      el.textContent = online ? 'Çevrimiçi' : 'Çevrimdışı';
      el.classList.toggle('offline', !online);
      var home = byId('homeNetworkV143'); if(home) home.textContent = online ? 'Çevrimiçi' : 'Çevrimdışı';
      var upd = byId('userMenuForceUpdateBtn');
      if(upd){ upd.disabled = !online; upd.title = online ? 'Yeni sürümü internetten kontrol eder.' : 'Güncelleme için internet gerekir.'; upd.style.opacity = online ? '' : '.55'; }
    }
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    setInterval(update, 3000);
  }

  function openBox(title, text, canClear){
    var box = document.createElement('div');
    box.className = 'v175-modal';
    box.innerHTML = '<div class="v175-card"><h2>'+esc(title)+'</h2><pre>'+esc(text)+'</pre><div class="row-actions"><button type="button" data-close>Kapat</button>'+(canClear?'<button type="button" class="secondary" data-clear>Günlüğü Temizle</button>':'')+'<button type="button" class="secondary" data-cache>Önbelleği Temizle</button></div></div>';
    document.body.appendChild(box);
    box.addEventListener('click', function(e){
      if(e.target === box || e.target.hasAttribute('data-close')) box.remove();
      if(e.target.hasAttribute('data-clear')){ localStorage.removeItem(ERROR_KEY); localStorage.removeItem('mesaha_error_log_v173'); box.remove(); toast('Hata günlüğü temizlendi.'); }
      if(e.target.hasAttribute('data-cache')) clearCaches(true);
    });
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
    add('LocalStorage', safe('ls-check', function(){ localStorage.setItem('__mesaha_v175_test__','1'); localStorage.removeItem('__mesaha_v175_test__'); return true; }, false));
    add('Kayıt ekranı', !!byId('entryForm'));
    add('Ölçümler ekranı', !!(byId('recordsList') || q('.records-panel') || byId('recordsBody')));
    add('Yedek sistemi', !!(byId('backupBtn') || byId('restoreBtn') || q('input[type="file"]')));
    add('Mesaha indirme butonu', !!(byId('exportSystemXlsBtn') || q('[id*="export"][id*="Xls"]')));
    add('Admin kullanıcı', isAdminUser(), isAdminUser() ? 'Yakup / Yaylacık' : 'Normal kullanıcı');
    var data = {time:new Date().toLocaleString('tr-TR'), version:FILE_VERSION, ok:checks.every(function(x){ return x.ok || /Çevrimdışı|Normal kullanıcı/.test(x.detail); }), checks:checks};
    safe('bootCheck save', function(){ localStorage.setItem(BOOT_KEY, JSON.stringify(data)); });
    window.MESAHA_BOOT_STATUS = data;
    return data;
  }

  function openErrorLog(){
    var a = safe('read errors 174', function(){ return JSON.parse(localStorage.getItem(ERROR_KEY) || '[]'); }, []);
    var b = safe('read errors 173', function(){ return JSON.parse(localStorage.getItem('mesaha_error_log_v173') || '[]'); }, []);
    var list = (Array.isArray(a)?a:[]).concat(Array.isArray(b)?b:[]).slice(0,80);
    openBox('Hata Günlüğü', list.length ? JSON.stringify(list, null, 2) : 'Kayıtlı hata yok.', true);
  }

  function offlineHealth(){
    var data = bootCheck();
    var lines = [];
    lines.push('Durum: ' + (navigator.onLine ? 'Çevrimiçi' : 'Çevrimdışı'));
    lines.push('Sürüm: ' + VISIBLE_VERSION + ' / ' + FILE_VERSION);
    lines.push('Service Worker: ' + (navigator.serviceWorker ? 'Var' : 'Yok'));
    lines.push('Cache API: ' + (window.caches ? 'Var' : 'Yok'));
    lines.push('IndexedDB: ' + (window.indexedDB ? 'Var' : 'Yok'));
    lines.push('LocalStorage: ' + (data.checks.find(function(x){return x.name==='LocalStorage';}) || {}).ok);
    lines.push('');
    lines.push('Kontroller:');
    data.checks.forEach(function(c){ lines.push((c.ok ? '✓ ' : '• ') + c.name + (c.detail ? ' - ' + c.detail : '')); });
    if(window.caches && caches.keys){
      caches.keys().then(function(keys){ openBox('Offline Sağlık Kontrolü', lines.join('\n') + '\n\nCache listesi:\n' + (keys.join('\n') || 'Cache yok.'), false); })
        .catch(function(){ openBox('Offline Sağlık Kontrolü', lines.join('\n'), false); });
    } else openBox('Offline Sağlık Kontrolü', lines.join('\n'), false);
  }

  function injectAdminTools(){
    if(!isAdminUser()) return;
    var host = q('.admin-panel .panel-header') || q('.admin-panel .admin-panel-top') || null;
    if(!host || byId('v175AdminTools')) return;
    var wrap = document.createElement('div');
    wrap.id = 'v175AdminTools';
    wrap.className = 'v175-admin-tools';
    wrap.innerHTML = '<button type="button" data-v175="errors">Hata Günlüğü</button><button type="button" data-v175="boot">Açılış Kontrolü</button><button type="button" data-v175="offline">Offline Kontrol</button><button type="button" class="secondary" data-v175="cache">Önbelleği Temizle</button>';
    host.appendChild(wrap);
    wrap.addEventListener('click', function(e){
      var btn = e.target && e.target.closest ? e.target.closest('[data-v175]') : null;
      if(!btn) return;
      var act = btn.getAttribute('data-v175');
      if(act === 'errors') openErrorLog();
      if(act === 'boot') openBox('Stabil / Açılış Kontrolü', JSON.stringify(bootCheck(), null, 2), false);
      if(act === 'offline') offlineHealth();
      if(act === 'cache') clearCaches(true);
    });
  }

  function clearCaches(reload){
    Promise.resolve().then(function(){
      if(navigator.serviceWorker && navigator.serviceWorker.controller){
        try{ navigator.serviceWorker.controller.postMessage({type:'CLEAR_MESAHA_CACHE'}); }catch(_){ }
      }
      if(window.caches && caches.keys){
        return caches.keys().then(function(keys){ return Promise.all(keys.map(function(k){ return caches.delete(k); })); });
      }
    }).then(function(){
      if(reload){
        sessionStorage.setItem('mesaha_force_reload_'+FILE_VERSION, String(Date.now()));
        location.replace(location.pathname + '?v=' + encodeURIComponent(FILE_VERSION));
      }
    }).catch(function(e){ logError('clearCaches', e); if(reload) location.reload(); });
  }
  window.mesahaClearCachesV175 = clearCaches;

  function resetFromUrl(){
    safe('resetFromUrl', function(){
      var p = new URLSearchParams(location.search || '');
      if(p.get('reset') === '1' && sessionStorage.getItem('mesaha_reset_done_'+FILE_VERSION) !== '1'){
        sessionStorage.setItem('mesaha_reset_done_'+FILE_VERSION, '1');
        clearCaches(true);
      }
    });
  }

  function registerServiceWorker(){
    if(!('serviceWorker' in navigator)) return;
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('./service-worker.js?v='+FILE_VERSION).then(function(reg){
        try{ reg.update(); }catch(_){ }
      }).catch(function(e){ logError('serviceWorker.register', e); });
    }, {once:true});
  }

  function versionCheckBackground(){
    if(!navigator.onLine) return;
    setTimeout(function(){
      safe('versionCheckBackground', function(){
        fetch('./version.json?v=' + Date.now(), {cache:'no-store'}).then(function(r){ return r.ok ? r.json() : null; }).then(function(v){
          if(v && v.version && String(v.version) !== FILE_VERSION){
            toast('Yeni sürüm görünüyor. İnternet varken Yeni Sürümü Güncelle kullanabilirsiniz.');
          }
        }).catch(function(e){ logError('versionCheck fetch', e); });
      });
    }, 2500);
  }

  function loadingWatchdog(){
    setTimeout(function(){
      safe('loadingWatchdog', function(){
        var stuck = document.body.classList.contains('cloud-loading-open');
        var hasForm = !!byId('entryForm');
        if(stuck || !hasForm){
          document.body.classList.remove('cloud-loading-open');
          if(byId('v175BootWarning')) return;
          var warn = document.createElement('div');
          warn.id = 'v175BootWarning';
          warn.className = 'v175-boot-warning';
          warn.innerHTML = 'Uygulama açılışı yavaşladı. Kayıtlar silinmeden önbelleği temizleyip yeniden açabilirsiniz.<br><button type="button">Önbelleği Temizle ve Yenile</button>';
          document.body.appendChild(warn);
          warn.querySelector('button').addEventListener('click', function(){ clearCaches(true); });
        }
      });
    }, 6500);
  }

  function boot(){
    installCss();
    setVersionText();
    resetFromUrl();
    updateAdminVisibility();
    guardAdminClicks();
    installStatus();
    injectAdminTools();
    bootCheck();
    loadingWatchdog();
    versionCheckBackground();
  }

  ready(function(){
    boot();
    [120, 400, 900, 1800, 3200, 6000].forEach(function(ms){ setTimeout(function(){ setVersionText(); updateAdminVisibility(); injectAdminTools(); }, ms); });
  });
  window.addEventListener('load', function(){ boot(); registerServiceWorker(); }, {once:true});
  setInterval(function(){ setVersionText(); updateAdminVisibility(); injectAdminTools(); }, 2500);
})();
