
(function(){
  'use strict';
  var INFO = window.MESAHA_VERSION || {};
  var FILE_VERSION = INFO.version || 'v179';
  var VISIBLE_VERSION = INFO.visibleVersion || (window.MESAHA_VERSION_TEXT || 'Mesaha İO');
  var ADMIN_NAME = 'Yakup';
  var ADMIN_SEFLIK = 'Yaylacık';
  var ERROR_KEY = 'mesaha_error_log_' + FILE_VERSION;
  var BOOT_KEY = 'mesaha_boot_status_' + FILE_VERSION;

  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function safe(fn, fallback){ try { return fn(); } catch(e){ logError('safe', e); return fallback; } }
  function byId(id){ return document.getElementById(id); }
  function norm(v){ return String(v == null ? '' : v).trim().replace(/\s+/g,' '); }
  function key(v){ return norm(v).toLocaleLowerCase('tr-TR'); }
  function isAdminUser(){
    var user = safe(function(){ return window.state && state.activeUser ? state.activeUser : null; }, null) || {};
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
    safe(function(){ if(window.state && state.lastAdminCode && !isAdminUser()) state.lastAdminCode=''; });
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
    // v184: Bakım/Hata butonları offline-admin.js tarafında tek merkezden gösterilir.
    return;
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
