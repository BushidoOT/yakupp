(function(){
  'use strict';
  var FILE_VERSION = 'v173';
  var VISIBLE_VERSION = 'Mesaha İO v2.02';
  var CACHE_NAME = 'mesaha-app-v173-stabilizasyon';
  var ADMIN_NAME = 'Yakup';
  var ADMIN_SEFLIK = 'Yaylacık';
  var ERROR_KEY = 'mesaha_error_log_v173';
  var BOOT_KEY = 'mesaha_boot_status_v173';
  var LAST_VERSION_KEY = 'mesaha_last_seen_version';
  var REPAIR_KEY = 'mesaha_data_repair_v173_done';
  var INIT_START = Date.now();

  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function safe(source, fn, fallback){ try { return fn(); } catch(e){ logError(source, e); return fallback; } }
  function byId(id){ return document.getElementById(id); }
  function q(sel, root){ return (root || document).querySelector(sel); }
  function qa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function norm(v){ return String(v == null ? '' : v).trim().replace(/\s+/g, ' '); }
  function key(v){ return norm(v).toLocaleLowerCase('tr-TR').replace(/[ıİ]/g, function(ch){ return ch === 'İ' ? 'i' : 'ı'; }); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];}); }
  function toast(msg){ safe('toast', function(){ if(typeof showToast === 'function') showToast(msg); else if(typeof showSuccessToast === 'function') showSuccessToast(msg); else console.log(msg); }); }
  function nowText(){ return new Date().toLocaleString('tr-TR'); }
  function logError(source, err){
    try{
      var list = JSON.parse(localStorage.getItem(ERROR_KEY) || '[]');
      list.unshift({
        time: nowText(),
        version: FILE_VERSION,
        source: String(source || 'hata'),
        message: String((err && (err.message || err.reason || err)) || err || ''),
        stack: String((err && err.stack) || '').slice(0, 1800),
        url: location.href
      });
      localStorage.setItem(ERROR_KEY, JSON.stringify(list.slice(0, 60)));
    }catch(_){ }
  }
  window.addEventListener('error', function(ev){ logError(ev.filename || 'window.error', ev.error || ev.message); });
  window.addEventListener('unhandledrejection', function(ev){ logError('unhandledrejection', ev.reason || ev); });

  function activeUser(){
    return safe('activeUser', function(){
      var st = window.state && state.activeUser ? state.activeUser : null;
      if(st && (st.name || st.seflik)) return st;
      var saved = JSON.parse(localStorage.getItem('mesaha_active_user_v1') || '{}');
      if(saved && (saved.name || saved.seflik)) return saved;
      return { name: (byId('loginUserName') || {}).value || '', seflik: (byId('loginSeflik') || {}).value || '' };
    }, {name:'', seflik:''});
  }
  function isAdminUser(){
    var u = activeUser() || {};
    return key(u.name) === key(ADMIN_NAME) && key(u.seflik) === key(ADMIN_SEFLIK);
  }
  window.mesahaIsAdminUserV173 = isAdminUser;

  function installCss(){
    if(byId('v173StabilizeCss')) return;
    var style = document.createElement('style');
    style.id = 'v173StabilizeCss';
    style.textContent = [
      'body:not(.mesaha-admin-ok) #navAdmin,',
      'body:not(.mesaha-admin-ok) #panelAdminOpenBtn,',
      'body:not(.mesaha-admin-ok) #flowTabsV111 [data-flow-tab="admin"],',
      'body:not(.mesaha-admin-ok) .admin-panel{display:none!important;visibility:hidden!important;pointer-events:none!important}',
      '#v171ControlBtn{display:none!important}',
      '#v172MaintenanceBtn,#v172BootBtn{display:none!important}',
      'body:not(.mesaha-admin-ok) #v171ControlBtnAdmin,body:not(.mesaha-admin-ok) #v173AdminTools{display:none!important}',
      '.v173-admin-tools{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0;padding:10px;border:1px solid rgba(22,101,52,.15);border-radius:18px;background:rgba(22,101,52,.045)}',
      '.v173-admin-tools button,.v173-safe-btn{border:0;border-radius:14px;padding:10px 12px;font-weight:900;background:#166534;color:#fff;box-shadow:0 10px 20px rgba(22,101,52,.12)}',
      '.v173-admin-tools button.secondary,.v173-safe-btn.secondary{background:#f1f5f9;color:#334155}',
      '.v173-admin-tools button.danger{background:#b91c1c;color:#fff}',
      '.v173-modal{position:fixed;inset:0;z-index:200000;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:14px}',
      '.v173-card{background:#fff;border-radius:24px;max-width:920px;width:min(96vw,920px);max-height:88vh;overflow:auto;padding:18px;box-shadow:0 25px 80px rgba(15,23,42,.35);color:#0f172a}',
      '.v173-card h2{margin:0 0 8px;color:#14532d}.v173-card pre{white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:12px;max-height:58vh;overflow:auto}',
      '.v173-card .row-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.v173-safe-banner{position:fixed;left:12px;right:12px;bottom:12px;z-index:199999;background:#fff7ed;border:1px solid #fed7aa;color:#7c2d12;border-radius:18px;padding:12px;box-shadow:0 16px 40px rgba(15,23,42,.18)}',
      '.v173-safe-banner b{display:block;margin-bottom:4px}.v173-safe-banner .actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}',
      '.v173-hidden-hard{display:none!important;visibility:hidden!important;pointer-events:none!important}',
      'body.mesaha-admin-ok #flowTabsV111 [data-flow-tab="admin"]{display:inline-flex!important}',
      'body.mesaha-admin-ok #panelAdminOpenBtn{display:inline-flex!important}'
    ].join('');
    document.head.appendChild(style);
  }

  function setVersionText(){
    safe('setVersionText', function(){ document.title = VISIBLE_VERSION; });
    safe('setVersionText h1', function(){ qa('.brand h1,.brand-copy-v143 h1,[data-version-title]').forEach(function(el){ el.textContent = VISIBLE_VERSION; }); });
    safe('buildInfo', function(){ window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, {fileVersion:FILE_VERSION, visibleVersion:VISIBLE_VERSION, stableMode:true, adminOwner:ADMIN_NAME+' / '+ADMIN_SEFLIK, excelLocked:true}); });
  }

  function goEntry(){ safe('goEntry', function(){ document.body.classList.remove('show-admin','show-records','show-guide'); if(byId('navEntry')) byId('navEntry').classList.add('active'); if(byId('navAdmin')) byId('navAdmin').classList.remove('active'); }); }
  function hideAdmin(){
    document.body.classList.remove('mesaha-admin-ok','show-admin','admin-unlocked-v131');
    qa('#navAdmin,#panelAdminOpenBtn,#flowTabsV111 [data-flow-tab="admin"]').forEach(function(el){ el.style.setProperty('display','none','important'); el.classList.remove('active'); });
    var panel = q('.admin-panel'); if(panel) panel.style.setProperty('display','none','important');
    safe('hideAdmin session', function(){ sessionStorage.removeItem('mesaha_admin_panel_open'); sessionStorage.removeItem('mesaha_admin_code'); });
    safe('hideAdmin state', function(){ if(window.state){ state.lastAdminCode = ''; } });
    var ctrl = byId('v171ControlBtn'); if(ctrl) ctrl.remove();
    var admCtrl = byId('v171ControlBtnAdmin'); if(admCtrl && !isAdminUser()) admCtrl.remove();
  }
  function showAdminAccess(){
    document.body.classList.add('mesaha-admin-ok');
    var tab = q('#flowTabsV111 [data-flow-tab="admin"]'); if(tab) tab.style.display = '';
    var panelBtn = byId('panelAdminOpenBtn'); if(panelBtn) panelBtn.style.display = '';
    if(byId('navAdmin') && sessionStorage.getItem('mesaha_admin_panel_open') === '1') byId('navAdmin').style.display = '';
    var panel = q('.admin-panel'); if(panel) panel.style.removeProperty('display');
  }
  function updateAdminVisibility(){
    installCss();
    if(isAdminUser()) showAdminAccess(); else hideAdmin();
  }

  function wrapAdminFns(){
    ['showAdminPage','showAdminPageV131','unlockAdminPanel'].forEach(function(name){
      safe('wrap '+name, function(){
        if(typeof window[name] !== 'function' || window[name].__v173Guard) return;
        var old = window[name];
        window[name] = function(){
          updateAdminVisibility();
          if(!isAdminUser()){
            hideAdmin();
            toast('Admin paneli sadece Yakup / Yaylacık kullanıcısına açıktır.');
            goEntry();
            return;
          }
          return old.apply(this, arguments);
        };
        window[name].__v173Guard = true;
      });
    });
    safe('wrap openAdmin', function(){
      if(typeof window.openAdminFromUserPanel === 'function' && !window.openAdminFromUserPanel.__v173Guard){
        var oldOpen = window.openAdminFromUserPanel;
        window.openAdminFromUserPanel = function(){
          updateAdminVisibility();
          if(!isAdminUser()){
            hideAdmin();
            toast('Bu cihazda admin yetkisi yok.');
            return;
          }
          return oldOpen.apply(this, arguments);
        };
        window.openAdminFromUserPanel.__v173Guard = true;
      }
    });
  }

  function guardClicks(){
    if(document.__v173AdminGuarded) return;
    document.__v173AdminGuarded = true;
    document.addEventListener('click', function(ev){
      var target = ev.target && ev.target.closest ? ev.target.closest('#navAdmin,#panelAdminOpenBtn,#flowTabsV111 [data-flow-tab="admin"],#v171ControlBtn,#v171ControlBtnAdmin,#v173AdminTools button') : null;
      if(!target) return;
      if(!isAdminUser()){
        ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        hideAdmin(); goEntry(); toast('Bu bölüm sadece Yakup / Yaylacık admin kullanıcısına açıktır.');
      }
    }, true);
  }

  function clearAppCache(reload){
    return Promise.resolve().then(function(){
      if(navigator.serviceWorker && navigator.serviceWorker.controller){
        try{ navigator.serviceWorker.controller.postMessage({type:'CLEAR_MESAHA_CACHE'}); }catch(_){ }
      }
      if(window.caches && caches.keys){
        return caches.keys().then(function(keys){ return Promise.all(keys.map(function(k){ return caches.delete(k); })); });
      }
    }).then(function(){
      localStorage.setItem(LAST_VERSION_KEY, FILE_VERSION);
      if(reload) location.replace(location.pathname + '?v=' + encodeURIComponent(FILE_VERSION));
    }).catch(function(e){ logError('clearAppCache', e); if(reload) location.reload(); });
  }
  window.mesahaClearCacheV173 = clearAppCache;

  function maybeResetCacheFromUrl(){
    safe('resetCacheFromUrl', function(){
      var params = new URLSearchParams(location.search || '');
      if(params.get('reset') === '1' && sessionStorage.getItem('mesaha_reset_done_'+FILE_VERSION) !== '1'){
        sessionStorage.setItem('mesaha_reset_done_'+FILE_VERSION, '1');
        clearAppCache(true);
      }
    });
  }
  function markVersion(){
    safe('markVersion', function(){
      var old = localStorage.getItem(LAST_VERSION_KEY);
      if(old !== FILE_VERSION){
        localStorage.setItem(LAST_VERSION_KEY, FILE_VERSION);
        if(navigator.serviceWorker && navigator.serviceWorker.controller){
          try{ navigator.serviceWorker.controller.postMessage({type:'SKIP_WAITING'}); }catch(_){ }
        }
      }
    });
  }

  function openInfoBox(title, text, canClear){
    var box = document.createElement('div'); box.className = 'v173-modal';
    box.innerHTML = '<div class="v173-card"><h2>'+esc(title)+'</h2><pre>'+esc(text)+'</pre><div class="row-actions"><button class="v173-safe-btn" data-close type="button">Kapat</button>'+(canClear?'<button class="v173-safe-btn secondary" data-clear type="button">Temizle</button>':'')+'<button class="v173-safe-btn secondary" data-cache type="button">Önbelleği Temizle</button></div></div>';
    document.body.appendChild(box);
    box.addEventListener('click', function(e){
      if(e.target === box || e.target.hasAttribute('data-close')) box.remove();
      if(e.target.hasAttribute('data-clear')){ localStorage.removeItem(ERROR_KEY); box.remove(); toast('Günlük temizlendi.'); }
      if(e.target.hasAttribute('data-cache')){ clearAppCache(true); }
    });
  }
  function openErrorLog(){
    var list = safe('openErrorLog read', function(){ return JSON.parse(localStorage.getItem(ERROR_KEY) || '[]'); }, []);
    openInfoBox('Hata Günlüğü', list && list.length ? JSON.stringify(list, null, 2) : 'Kayıtlı hata yok.', true);
  }
  function bootCheck(){
    var checks = [];
    function add(name, ok, detail){ checks.push({name:name, ok:!!ok, detail:detail || ''}); }
    add('HTML hazır', !!document.body);
    add('Yeni kayıt formu', !!byId('entryForm'));
    add('Kayıt listesi', !!(byId('recordsList') || q('.records-panel')));
    add('Ağaç filtresi alanı', true, 'render sonrası oluşturulur');
    add('Kesimci sistemi', !!(window.getActiveKesimciNameV163 || byId('cutterChoicesV158') || byId('cutterPanelV158')), 'render sonrası olabilir');
    add('Yedek sistemi', typeof window.backup === 'function' || typeof backup === 'function');
    add('Mesaha indirme çekirdeği', typeof window.exportSystemXls === 'function' || typeof exportSystemXls === 'function');
    add('LocalStorage', safe('localStorage test', function(){ localStorage.setItem('__mesaha_v173__','1'); localStorage.removeItem('__mesaha_v173__'); return true; }, false));
    add('Admin yetki', isAdminUser(), isAdminUser() ? 'Yakup / Yaylacık' : 'normal kullanıcı');
    var fail = checks.filter(function(x){ return !x.ok && x.name !== 'Admin yetki'; });
    var data = {time:nowText(), version:FILE_VERSION, ok:fail.length === 0, checks:checks, loadMs:Date.now() - INIT_START};
    safe('bootCheck save', function(){ localStorage.setItem(BOOT_KEY, JSON.stringify(data)); });
    window.MESAHA_BOOT_STATUS = data;
    return data;
  }
  function openBootCheck(){ openInfoBox('Açılış / Stabil Kontrol', JSON.stringify(bootCheck(), null, 2), false); }

  function injectAdminTools(){
    if(!isAdminUser()) return;
    var host = q('.admin-panel .admin-tabs-clean') || q('.admin-panel .admin-panel-top') || q('.admin-panel .panel-header');
    if(!host || byId('v173AdminTools')) return;
    var tools = document.createElement('div');
    tools.id = 'v173AdminTools'; tools.className = 'v173-admin-tools';
    tools.innerHTML = '<button type="button" id="v173OpenControl">🧪 Stabil Kontrol</button><button type="button" id="v173OpenErrors" class="secondary">Hata Günlüğü</button><button type="button" id="v173OpenBoot" class="secondary">Açılış Kontrolü</button><button type="button" id="v173RepairData" class="secondary">Veriyi Kontrol Et</button><button type="button" id="v173ClearCache" class="danger">Önbelleği Temizle</button>';
    host.parentNode.insertBefore(tools, host.nextSibling);
    byId('v173OpenControl').addEventListener('click', function(){ if(typeof window.mesahaOpenStabilKontrolV171 === 'function') window.mesahaOpenStabilKontrolV171(); else openBootCheck(); });
    byId('v173OpenErrors').addEventListener('click', openErrorLog);
    byId('v173OpenBoot').addEventListener('click', openBootCheck);
    byId('v173RepairData').addEventListener('click', function(){ var r = repairData(true); openInfoBox('Veri Kontrolü', JSON.stringify(r, null, 2), false); });
    byId('v173ClearCache').addEventListener('click', function(){ if(confirm('Uygulama önbelleği temizlenip sayfa yenilensin mi? Kayıtlar silinmez.')) clearAppCache(true); });
  }

  function removeUserControlButton(){
    var b = byId('v171ControlBtn'); if(b) b.remove();
    if(!isAdminUser()){ var ba = byId('v171ControlBtnAdmin'); if(ba) ba.remove(); }
  }

  function repairData(force){
    return safe('repairData', function(){
      if(!window.state || !Array.isArray(state.records)) return {ok:false, message:'state.records hazır değil'};
      if(!force && localStorage.getItem(REPAIR_KEY) === '1') return {ok:true, skipped:true, records:state.records.length};
      var changed = 0, fixedDates = 0, fixedCutter = 0, fixedIds = 0;
      var today = (function(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); })();
      state.records.forEach(function(r, i){
        if(!r || typeof r !== 'object') return;
        if(!r.id){ r.id = 'r'+Date.now().toString(36)+'_'+i; changed++; fixedIds++; }
        if(!r.productionDate && !r.uretimTarihi){ r.productionDate = today; changed++; fixedDates++; }
        if(r.kesimci || r.kesimciAdi || r.cutterName){
          var c = norm(r.kesimci || r.kesimciAdi || r.cutterName || r.cutter || r.kesimciIsmi);
          if(c && (r.kesimci !== c || r.kesimciAdi !== c || r.cutterName !== c)){ r.kesimci = c; r.kesimciAdi = c; r.cutterName = c; changed++; fixedCutter++; }
        }
        if(!r.treeType && r.species){ r.treeType = r.species; changed++; }
        if(!r.species && r.treeType){ r.species = r.treeType; changed++; }
      });
      if(changed){ safe('persist repair', function(){ if(typeof persistRecordsAndSettings === 'function') persistRecordsAndSettings(); else localStorage.setItem('mesaha_records_v1', JSON.stringify(state.records)); }); }
      localStorage.setItem(REPAIR_KEY, '1');
      return {ok:true, records:state.records.length, changed:changed, fixedIds:fixedIds, fixedDates:fixedDates, fixedCutter:fixedCutter, time:nowText()};
    }, {ok:false, message:'Veri kontrolü sırasında hata oluştu'});
  }

  function loadingWatchdog(){
    setTimeout(function(){
      safe('loadingWatchdog', function(){
        var bad = document.body.classList.contains('cloud-loading-open');
        var hasButtons = !!byId('submitBtn') && !!byId('navRecords');
        var status = bootCheck();
        if((bad && Date.now() - INIT_START > 4500) || !hasButtons || !status.ok){
          document.body.classList.remove('cloud-loading-open');
          var banner = byId('v173SafeBanner');
          if(!banner){
            banner = document.createElement('div'); banner.id = 'v173SafeBanner'; banner.className = 'v173-safe-banner';
            banner.innerHTML = '<b>Uygulama açılışı kontrol edildi.</b><span>Yüklenme takılı kaldıysa önbelleği temizleyip tekrar açabilirsiniz. Kayıtlar silinmez.</span><div class="actions"><button type="button" class="v173-safe-btn" data-v173-cache>Önbelleği Temizle</button><button type="button" class="v173-safe-btn secondary" data-v173-close>Kapat</button></div>';
            document.body.appendChild(banner);
            banner.addEventListener('click', function(e){ if(e.target.hasAttribute('data-v173-cache')) clearAppCache(true); if(e.target.hasAttribute('data-v173-close')) banner.remove(); });
          }
        }
      });
    }, 5500);
  }

  function patchFlowTabAdmin(){
    safe('patchFlowTabAdmin', function(){
      var tab = q('#flowTabsV111 [data-flow-tab="admin"]');
      if(tab && !tab.__v173Text){ tab.textContent = 'Admin'; tab.__v173Text = true; }
      if(!isAdminUser() && document.body.classList.contains('show-admin')) goEntry();
    });
  }

  function install(){
    installCss(); maybeResetCacheFromUrl(); markVersion(); setVersionText(); guardClicks(); wrapAdminFns(); updateAdminVisibility(); removeUserControlButton(); injectAdminTools(); patchFlowTabAdmin(); loadingWatchdog();
    setTimeout(function(){ repairData(false); }, 1200);
    bootCheck();
  }

  ready(function(){ install(); [150,500,1200,2500,5000].forEach(function(ms){ setTimeout(function(){ setVersionText(); wrapAdminFns(); updateAdminVisibility(); removeUserControlButton(); injectAdminTools(); patchFlowTabAdmin(); }, ms); }); });
  window.addEventListener('load', install, {once:true});
  setInterval(function(){ setVersionText(); wrapAdminFns(); updateAdminVisibility(); removeUserControlButton(); injectAdminTools(); patchFlowTabAdmin(); }, 2200);
})();
