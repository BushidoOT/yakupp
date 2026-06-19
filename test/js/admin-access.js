(function(){
  'use strict';
  var INFO = window.MESAHA_VERSION || {};
  var FILE_VERSION = INFO.version || 'v179';
  var ADMIN_NAME = 'Yakup';
  var ADMIN_SEFLIK = 'Yaylacık';
  var USER_STORE_KEY = 'mesaha_kullanicilar_v1';
  var ADMIN_CODE = '4767';

  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function byId(id){ return document.getElementById(id); }
  function safe(fn, fallback){ try { return fn(); } catch(_) { return fallback; } }
  function trim(v){ return String(v == null ? '' : v).trim().replace(/\s+/g,' '); }
  function fold(v){
    return trim(v).toLocaleLowerCase('tr-TR')
      .replace(/ı/g,'i').replace(/İ/g,'i')
      .replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ö/g,'o').replace(/ş/g,'s').replace(/ü/g,'u')
      .replace(/[^a-z0-9]+/g,'');
  }
  function same(a,b){ return fold(a) === fold(b); }
  function isAdminPair(name,seflik){ return same(name, ADMIN_NAME) && same(seflik, ADMIN_SEFLIK); }
  function createUserId(name, seflik){
    var raw = trim(name).toLocaleLowerCase('tr-TR') + '__' + trim(seflik).toLocaleLowerCase('tr-TR');
    var hash = 0;
    for(var i=0;i<raw.length;i++){ hash = ((hash << 5) - hash) + raw.charCodeAt(i); hash |= 0; }
    return 'u_' + Math.abs(hash);
  }
  function readStore(){
    return safe(function(){
      var parsed = JSON.parse(localStorage.getItem(USER_STORE_KEY) || '{}');
      return { activeUserId: parsed.activeUserId || '', users: Array.isArray(parsed.users) ? parsed.users : [] };
    }, {activeUserId:'', users:[]});
  }
  function writeStore(store){ safe(function(){ localStorage.setItem(USER_STORE_KEY, JSON.stringify(store)); }); }
  function ensureUser(name,seflik){
    name = trim(name); seflik = trim(seflik);
    if(!name || !seflik) return null;
    var store = readStore();
    var id = createUserId(name,seflik);
    var now = new Date().toLocaleString('tr-TR');
    var user = store.users.find(function(u){ return u && u.id === id; });
    if(!user){
      user = {id:id, name:name, seflik:seflik, firstLogin:now, lastLogin:'', loginCount:0};
      store.users.unshift(user);
    } else {
      user.name = name; user.seflik = seflik;
    }
    user.lastLogin = now;
    user.loginCount = Number(user.loginCount || 0) + 1;
    store.activeUserId = id;
    writeStore(store);
    safe(function(){ localStorage.setItem('mesaha_active_user_v1', JSON.stringify(user)); });
    return user;
  }
  function activeUser(){
    var u = safe(function(){ return window.state && state.activeUser ? state.activeUser : null; }, null);
    if(u && (u.name || u.seflik)) return u;
    var store = readStore();
    u = store.users.find(function(x){ return x && x.id === store.activeUserId; });
    if(u) return u;
    u = safe(function(){ return JSON.parse(localStorage.getItem('mesaha_active_user_v1') || 'null'); }, null);
    if(u && (u.name || u.seflik)) return u;
    var badge = byId('activeUserBadge');
    if(badge && badge.textContent && badge.textContent.indexOf('•') > -1){
      var parts = badge.textContent.split('•').map(trim).filter(Boolean);
      if(parts.length >= 2) return {name:parts[0], seflik:parts.slice(1).join(' • ')};
    }
    var ln = byId('loginUserName'), ls = byId('loginSeflik');
    if((ln && ln.value) || (ls && ls.value)) return {name: trim(ln && ln.value), seflik: trim(ls && ls.value)};
    return {name:'', seflik:''};
  }
  function isAdminUser(){ var u = activeUser(); return isAdminPair(u.name, u.seflik); }
  window.mesahaIsAdminUser = isAdminUser;
  window.mesahaIsAdminUserV178 = isAdminUser;
  window.mesahaActiveUserV178 = activeUser;

  function processAdminQuery(){
    var p = new URLSearchParams(location.search || '');
    var name = p.get('u') || p.get('user') || '';
    var seflik = p.get('s') || p.get('seflik') || '';
    if(name || seflik){
      try { name = decodeURIComponent(name); seflik = decodeURIComponent(seflik); } catch(_) {}
      if(isAdminPair(name,seflik)){
        ensureUser(name,seflik);
        sessionStorage.setItem('mesaha_admin_code', ADMIN_CODE);
        sessionStorage.setItem('mesaha_admin_panel_open', '1');
        document.documentElement.classList.add('mesaha-admin-query-ok');
        document.body && document.body.classList.add('mesaha-admin-ok');
      }
    }
  }
  processAdminQuery();

  function css(){
    if(byId('v178AdminAccessCss')) return;
    var st = document.createElement('style'); st.id='v178AdminAccessCss';
    st.textContent = [
      '.v178-admin-launch{background:#14532d!important;color:#fff!important;border:0!important;border-radius:18px!important;padding:14px 16px!important;font-weight:900!important;width:100%;box-shadow:0 12px 30px rgba(20,83,45,.18)!important}',
      '.v178-admin-launch:before{content:"🛠️ ";}',
      '.v178-admin-note{font-size:12px;color:#64748b;margin-top:-4px;margin-bottom:8px;text-align:center}',
      'body.mesaha-admin-ok .admin-panel{display:block!important;visibility:visible!important;pointer-events:auto!important}',
      'body.mesaha-admin-ok #navAdmin,body.mesaha-admin-ok #panelAdminOpenBtn{visibility:visible!important;pointer-events:auto!important}',
      'body:not(.mesaha-admin-ok) #v178OpenAdminBtn{display:none!important}'
    ].join('\n');
    document.head.appendChild(st);
  }
  function launchAdmin(){
    var u = activeUser();
    if(!isAdminPair(u.name, u.seflik)){
      safe(function(){ if(typeof showToast === 'function') showToast('Admin paneli sadece Yakup / Yaylacık kullanıcısına açıktır.'); });
      return;
    }
    ensureUser(u.name, u.seflik);
    sessionStorage.setItem('mesaha_admin_code', ADMIN_CODE);
    sessionStorage.setItem('mesaha_admin_panel_open', '1');
    var url = './admin.html?v=' + encodeURIComponent(FILE_VERSION) + '&admin=1&u=' + encodeURIComponent(u.name) + '&s=' + encodeURIComponent(u.seflik);
    location.href = url;
  }
  function injectIndexAdminButton(){
    css();
    var host = document.querySelector('.user-panel-actions');
    if(!host) return;
    var existing = byId('v178OpenAdminBtn');
    var ok = isAdminUser();
    document.body.classList.toggle('mesaha-admin-ok', ok);
    if(ok && !existing){
      var btn = document.createElement('button');
      btn.id = 'v178OpenAdminBtn';
      btn.type = 'button';
      btn.className = 'v178-admin-launch';
      btn.textContent = 'Admin Panelini Aç';
      btn.addEventListener('click', launchAdmin);
      host.appendChild(btn);
      var note = document.createElement('div');
      note.id = 'v178AdminLaunchNote';
      note.className = 'v178-admin-note';
      note.textContent = 'Ana ekrana eklenen uygulamada admin paneli ayrı sayfada açılır.';
      host.appendChild(note);
    } else if(existing){
      existing.style.display = ok ? '' : 'none';
      var noteEl = byId('v178AdminLaunchNote'); if(noteEl) noteEl.style.display = ok ? '' : 'none';
    }
  }
  function adminPageAutoOpen(){
    css();
    if(!/admin\.html/i.test(location.pathname)) return;
    var ok = isAdminUser();
    document.body.classList.toggle('mesaha-admin-ok', ok);
    if(ok){
      sessionStorage.setItem('mesaha_admin_code', ADMIN_CODE);
      sessionStorage.setItem('mesaha_admin_panel_open', '1');
      safe(function(){ if(window.state) state.lastAdminCode = ADMIN_CODE; });
      setTimeout(function(){
        safe(function(){ if(typeof window.mesahaOpenAdminV175 === 'function') window.mesahaOpenAdminV175();
          else if(typeof window.openAdminFromUserPanel === 'function') window.openAdminFromUserPanel();
        });
      }, 700);
    }
  }
  function boot(){ injectIndexAdminButton(); adminPageAutoOpen(); }
  ready(function(){ boot(); [300,900,1800,3500].forEach(function(ms){ setTimeout(boot, ms); }); });
  window.addEventListener('load', function(){ boot(); }, {once:true});
  setInterval(function(){ injectIndexAdminButton(); }, 2500);
})();
