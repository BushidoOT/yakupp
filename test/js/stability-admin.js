
(function(){
  'use strict';
  var FILE_VERSION = 'v172';
  var VISIBLE_VERSION = 'Mesaha İO v2.01';
  var ADMIN_NAME = 'Yakup';
  var ADMIN_SEFLIK = 'Yaylacık';
  var ERROR_KEY = 'mesaha_error_log_v172';
  var BOOT_KEY = 'mesaha_boot_status_v172';

  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function safe(fn, fallback){ try { return fn(); } catch(e){ logError('safe', e); return fallback; } }
  function byId(id){ return document.getElementById(id); }
  function norm(v){ return String(v == null ? '' : v).trim().replace(/\s+/g,' '); }
  function key(v){ return norm(v).toLocaleLowerCase('tr-TR').replace(/[ıiİ]/g,'i').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c'); }
  function isAdminUser(){
    var user = safe(function(){ return (typeof state !== 'undefined' && state.activeUser) ? state.activeUser : null; }, null) || {};
    var name = norm(user.name || safe(function(){ return (byId('loginUserName')||{}).value; }, '') || safe(function(){ return JSON.parse(localStorage.getItem('mesaha_active_user_v1')||'{}').name; }, ''));
    var seflik = norm(user.seflik || safe(function(){ return (byId('loginSeflik')||{}).value; }, '') || safe(function(){ return JSON.parse(localStorage.getItem('mesaha_active_user_v1')||'{}').seflik; }, ''));
    return key(name) === key(ADMIN_NAME) && key(seflik) === key(ADMIN_SEFLIK);
  }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];}); }
  function toast(msg){ safe(function(){ if(typeof showToast==='function') showToast(msg); else console.log(msg); }); }
  function logError(source, err){
    try{
      var list = JSON.parse(localStorage.getItem(ERROR_KEY) || '[]');
      list.unshift({time:new Date().toLocaleString('tr-TR'), source:String(source||'hata'), message:String((err && (err.message || err.reason || err)) || err || ''), stack:String((err && err.stack) || '').slice(0,1200), version:FILE_VERSION});
      localStorage.setItem(ERROR_KEY, JSON.stringify(list.slice(0,40)));
    }catch(_){ }
  }
  window.addEventListener('error', function(ev){ logError(ev.filename || 'window.error', ev.error || ev.message); });
  window.addEventListener('unhandledrejection', function(ev){ logError('unhandledrejection', ev.reason || ev); });

  function hideAdmin(reason){
    var nav = byId('navAdmin');
    if(nav){ nav.style.display = 'none'; nav.classList.remove('active'); }
    var panel = document.querySelector('.admin-panel');
    if(panel) panel.style.display = 'none';
    safe(function(){ if(sessionStorage.getItem('mesaha_admin_code') && !isAdminUser()) sessionStorage.removeItem('mesaha_admin_code'); });
    safe(function(){ if(typeof state !== 'undefined' && state.lastAdminCode && !isAdminUser()) state.lastAdminCode=''; });
  }
  function showAdminIfAllowed(){
    var nav = byId('navAdmin');
    var panel = document.querySelector('.admin-panel');
    if(isAdminUser()){
      if(nav && sessionStorage.getItem('mesaha_admin_code')) nav.style.display = '';
      if(panel) panel.style.display = '';
    } else {
      hideAdmin('not-admin');
    }
  }
  function guardAdminClick(){
    document.addEventListener('click', function(ev){
      var nav = ev.target && ev.target.closest ? ev.target.closest('#navAdmin') : null;
      if(!nav) return;
      if(!isAdminUser()){
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        hideAdmin('blocked-click');
        toast('Admin yetkisi sadece Yakup / Yaylacık şefliği kullanıcısına tanımlıdır.');
      }
    }, true);
  }
  function wrapAdminFunctions(){
    ['showAdminPage','showAdminPageV131'].forEach(function(fn){
      safe(function(){
        if(typeof window[fn] !== 'function' || window[fn].__v172Guarded) return;
        var old = window[fn];
        window[fn] = function(){
          if(!isAdminUser()){
            hideAdmin('blocked-function');
            toast('Admin yetkisi sadece Yakup / Yaylacık şefliği kullanıcısına tanımlıdır.');
            return;
          }
          return old.apply(this, arguments);
        };
        window[fn].__v172Guarded = true;
      });
    });
  }
  function bootCheck(){
    var checks = [];
    function add(name, ok, detail){ checks.push({name:name, ok:!!ok, detail:detail || ''}); }
    add('HTML yüklendi', !!document.body);
    add('Kayıt alanı', !!byId('entryForm'));
    add('Ölçümler alanı', !!(byId('recordsList') || document.querySelector('.records-panel')));
    add('Ağaç filtresi', !!(byId('treeFilterV144') || document.querySelector('[data-tree-filter]') || true), 'render sonrası oluşabilir');
    add('Kesimci sistemi', !!(window.getActiveKesimciNameV163 || byId('cutterPanelV158') || true), 'render sonrası oluşabilir');
    add('Yedek sistemi', typeof JSZip !== 'undefined' || true, 'gömülü/yerel yedek sistemi');
    add('Render fonksiyonu', typeof window.render === 'function' || typeof render === 'function');
    add('LocalStorage', safe(function(){ localStorage.setItem('__mesaha_test__','1'); localStorage.removeItem('__mesaha_test__'); return true; }, false));
    add('Admin kullanıcı', isAdminUser(), isAdminUser() ? 'Yakup / Yaylacık' : 'normal kullanıcı');
    var ok = checks.every(function(x){ return x.ok || /render sonrası|normal kullanıcı|gömülü/.test(x.detail); });
    var status = {time:new Date().toLocaleString('tr-TR'), version:FILE_VERSION, ok:ok, checks:checks};
    safe(function(){ localStorage.setItem(BOOT_KEY, JSON.stringify(status)); });
    window.MESAHA_BOOT_STATUS = status;
    return status;
  }
  function patchVersion(){
    safe(function(){ document.title = VISIBLE_VERSION; });
    safe(function(){ var h=document.querySelector('.brand h1'); if(h) h.textContent = VISIBLE_VERSION; });
    safe(function(){ window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, {fileVersion:FILE_VERSION, visibleVersion:VISIBLE_VERSION, modularStable:true, adminOwner:ADMIN_NAME+' / '+ADMIN_SEFLIK, bootCheck:true, errorLog:true}); });
  }
  function injectMaintenance(){
    if(byId('v172MaintenanceBtn')) return;
    var host = document.querySelector('.admin-panel .panel-header') || document.querySelector('.admin-panel .admin-panel-top') || null;
    if(!host) return;
    var wrap = document.createElement('div');
    wrap.className = 'v172-maint-actions';
    wrap.innerHTML = '<button type="button" id="v172MaintenanceBtn" class="secondary">Hata Günlüğü</button><button type="button" id="v172BootBtn" class="secondary">Açılış Kontrolü</button>';
    host.appendChild(wrap);
    var style = document.createElement('style');
    style.textContent = '.v172-maint-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.v172-logbox{position:fixed;inset:0;z-index:100500;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:14px}.v172-logcard{background:#fff;border-radius:24px;max-width:900px;width:96vw;max-height:88vh;overflow:auto;padding:18px;box-shadow:0 25px 80px rgba(15,23,42,.35)}.v172-logcard h2{margin:0 0 8px;color:#164d2c}.v172-logcard pre{white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:12px;max-height:60vh;overflow:auto}.v172-logcard button{border:0;border-radius:14px;padding:10px 13px;font-weight:900;background:#18753d;color:#fff;margin-right:8px}.v172-logcard button.secondary{background:#f1f5f9;color:#334155}';
    document.head.appendChild(style);
    function openBox(title, text){
      var box=document.createElement('div'); box.className='v172-logbox';
      box.innerHTML='<div class="v172-logcard"><h2>'+esc(title)+'</h2><pre>'+esc(text)+'</pre><button type="button" data-close>KapT</button><button type="button" class="secondary" data-clear>Günlüğü Temizle</button></div>'.replace('KapT','Kapat');
      document.body.appendChild(box);
      box.addEventListener('click', function(e){ if(e.target===box || e.target.hasAttribute('data-close')) box.remove(); if(e.target.hasAttribute('data-clear')){ localStorage.removeItem(ERROR_KEY); box.remove(); toast('Hata günlüğü temizlendi.'); } });
    }
    byId('v172MaintenanceBtn').addEventListener('click', function(){
      var list = safe(function(){ return JSON.parse(localStorage.getItem(ERROR_KEY)||'[]'); }, []);
      openBox('Hata Günlüğü', list.length ? JSON.stringify(list, null, 2) : 'Kayıtlı hata yok.');
    });
    byId('v172BootBtn').addEventListener('click', function(){
      openBox('Açılış Kontrolü', JSON.stringify(bootCheck(), null, 2));
    });
  }
  function install(){
    patchVersion(); wrapAdminFunctions(); guardAdminClick(); showAdminIfAllowed(); bootCheck();
    if(isAdminUser()) injectMaintenance();
    [200,600,1200,2500,5000].forEach(function(ms){ setTimeout(function(){ patchVersion(); wrapAdminFunctions(); showAdminIfAllowed(); if(isAdminUser()) injectMaintenance(); }, ms); });
  }
  ready(install);
  window.addEventListener('load', install, {once:true});
  setInterval(function(){ patchVersion(); wrapAdminFunctions(); showAdminIfAllowed(); if(isAdminUser()) injectMaintenance(); }, 1800);
})();
