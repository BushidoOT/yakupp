/* Mesaha İO V4.00 / build 415 — tek sürümlük genel log tutucu
   Amaç: uygulama, admin, Firebase, cache ve buton akışlarını güvenli şekilde izlemek. */
(function(){
  'use strict';
  if(window.__mesahaDebugLoggerV415) return;
  window.__mesahaDebugLoggerV415 = true;

  var BUILD = 415;
  var VERSION = 'V4.00';
  var VERSION_CODE = 'v415_log_tutucu_denemesi';
  var KEY = 'mesaha_debug_logs_v415';
  var OLD_KEY = 'mesaha_debug_logs_v1';
  var SESSION_KEY = 'mesaha_debug_session_v415';
  var INSTALL_KEY = 'mesaha_debug_install_id_v415';
  var MAX_LOGS = 900;
  var WRAP_FLAG = '__mesahaDebugWrappedV415';
  var originalConsole = {};
  var selfWriting = false;
  var cloudTimer = null;
  var lastClickAt = 0;

  function now(){ return Date.now(); }
  function trTime(ms){ try{return new Date(ms||now()).toLocaleString('tr-TR');}catch(e){return String(ms||now());} }
  function rid(prefix){ return (prefix||'id') + '_' + Math.random().toString(36).slice(2,8) + '_' + Date.now().toString(36); }
  function lsGet(k, fallback){ try{ var v = localStorage.getItem(k); return v == null ? fallback : v; }catch(e){ return fallback; } }
  function lsSet(k, v){ try{ localStorage.setItem(k, v); return true; }catch(e){ return false; } }
  function jsonGet(k, fallback){ try{ var v=localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; } }
  function getSession(){ var s=lsGet(SESSION_KEY,''); if(!s){s=rid('session'); lsSet(SESSION_KEY,s);} return s; }
  function getInstall(){ var s=lsGet(INSTALL_KEY,''); if(!s){s=rid('device'); lsSet(INSTALL_KEY,s);} return s; }
  function userInfo(){
    var u = jsonGet('mesaha_panel_user_v316', {}) || {};
    var st = jsonGet('mesaha_settings_v313', null) || jsonGet('mesaha_settings_v303', null) || {};
    return {
      name: String(u.name || st.ekipNot || '').trim(),
      seflik: String(u.seflik || st.seflik || '').trim(),
      bolmeNo: String(u.bolmeNo || st.bolmeNo || '').trim()
    };
  }
  function deviceInfo(){
    var screenText = '';
    try{ screenText = window.screen ? (screen.width + 'x' + screen.height) : ''; }catch(e){}
    return {
      ua: String(navigator.userAgent || '').slice(0,260),
      platform: String(navigator.platform || ''),
      language: String(navigator.language || ''),
      online: navigator.onLine !== false,
      viewport: (window.innerWidth||0) + 'x' + (window.innerHeight||0),
      screen: screenText,
      pixelRatio: window.devicePixelRatio || 1
    };
  }
  function shortText(v, len){ v = String(v == null ? '' : v); len = len || 900; return v.length > len ? v.slice(0,len) + '…' : v; }
  function serialize(v, depth, seen){
    depth = depth || 0; seen = seen || [];
    try{
      if(v == null) return v;
      if(typeof v === 'string') return shortText(v, 1500);
      if(typeof v === 'number' || typeof v === 'boolean') return v;
      if(typeof v === 'function') return '[Function ' + (v.name || 'anonymous') + ']';
      if(v instanceof Error) return {name:v.name, message:v.message, stack:shortText(v.stack||'',2000)};
      if(v && v.nodeType === 1) return describeElement(v);
      if(depth > 3) return '[MaxDepth]';
      if(seen.indexOf(v) >= 0) return '[Circular]';
      seen.push(v);
      if(Array.isArray(v)) return v.slice(0,20).map(function(x){ return serialize(x, depth+1, seen); });
      var out = {};
      Object.keys(v).slice(0,35).forEach(function(k){ out[k] = serialize(v[k], depth+1, seen); });
      return out;
    }catch(e){ return shortText(String(v), 1200); }
  }
  function argsText(args){
    try{return Array.prototype.slice.call(args).map(function(a){
      if(a instanceof Error) return (a.name||'Error') + ': ' + (a.message||'');
      if(typeof a === 'string') return a;
      return JSON.stringify(serialize(a));
    }).join(' ');}catch(e){return '[args okunamadı]';}
  }
  function readLogs(){
    try{
      var raw = localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY) || '[]';
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    }catch(e){ return []; }
  }
  function writeLogs(arr){
    try{
      if(arr.length > MAX_LOGS) arr = arr.slice(arr.length - MAX_LOGS);
      localStorage.setItem(KEY, JSON.stringify(arr));
      try{ localStorage.removeItem(OLD_KEY); }catch(_e){}
      return true;
    }catch(e){
      try{ localStorage.setItem(KEY, JSON.stringify(arr.slice(-250))); return true; }catch(_e){ return false; }
    }
  }
  function add(level, area, message, data){
    if(selfWriting) return;
    selfWriting = true;
    try{
      var logs = readLogs();
      var entry = {
        id: rid('log'),
        t: trTime(),
        atMs: now(),
        level: level || 'info',
        area: area || 'app',
        message: shortText(message || '', 1000),
        data: serialize(data),
        page: location.pathname.split('/').pop() || 'index.html',
        url: shortText(location.href, 500),
        appVersion: (window.MESAHA_VERSION && (window.MESAHA_VERSION.app || window.MESAHA_VERSION.visibleVersion)) || VERSION,
        build: (window.MESAHA_VERSION && window.MESAHA_VERSION.build) || BUILD,
        sessionId: getSession(),
        installId: getInstall(),
        user: userInfo(),
        online: navigator.onLine !== false
      };
      logs.push(entry); writeLogs(logs); updateBadge();
      if(level === 'error' || level === 'fatal') scheduleCloudFlush('error');
      return entry;
    }catch(e){}
    finally{ selfWriting = false; }
  }
  function updateBadge(){
    try{
      var b = document.getElementById('mesahaDebugLogBadgeV415');
      if(b) b.textContent = String(readLogs().length);
    }catch(e){}
  }
  function describeElement(el){
    try{
      return {
        tag: (el.tagName || '').toLowerCase(),
        id: el.id || '',
        cls: shortText(el.className || '', 160),
        text: shortText((el.innerText || el.textContent || '').replace(/\s+/g,' ').trim(), 120),
        type: el.getAttribute && (el.getAttribute('type') || ''),
        href: el.getAttribute && (el.getAttribute('href') || '')
      };
    }catch(e){ return {tag:'unknown'}; }
  }
  function wrapConsole(){
    ['log','info','warn','error'].forEach(function(m){
      try{
        if(!console || !console[m] || console[m][WRAP_FLAG]) return;
        originalConsole[m] = console[m].bind(console);
        var fn = function(){
          try{ add(m === 'error' ? 'error' : (m === 'warn' ? 'warn' : 'info'), 'console.' + m, argsText(arguments), Array.prototype.slice.call(arguments)); }catch(e){}
          try{ return originalConsole[m].apply(console, arguments); }catch(_e){}
        };
        fn[WRAP_FLAG] = true;
        console[m] = fn;
      }catch(e){}
    });
  }
  function wrapFetch(){
    try{
      if(!window.fetch || window.fetch[WRAP_FLAG]) return;
      var old = window.fetch.bind(window);
      var f = function(input, init){
        var url = '';
        try{ url = typeof input === 'string' ? input : (input && input.url) || ''; }catch(e){}
        var started = now();
        return old(input, init).then(function(res){
          var ms = now() - started;
          if(!res || !res.ok || ms > 4000) add(res && res.ok ? 'warn' : 'error', 'fetch', 'Fetch sonucu', {url:url, status:res && res.status, ok:res && res.ok, ms:ms});
          return res;
        }).catch(function(err){ add('error', 'fetch', 'Fetch hata', {url:url, error:serialize(err), ms:now()-started}); throw err; });
      };
      f[WRAP_FLAG] = true;
      window.fetch = f;
    }catch(e){}
  }
  function wrapXHR(){
    try{
      if(!window.XMLHttpRequest || window.XMLHttpRequest.prototype.__mesahaXHRLoggedV415) return;
      var p = window.XMLHttpRequest.prototype;
      var oldOpen = p.open, oldSend = p.send;
      p.open = function(method, url){ this.__mesahaLogReq = {method:method, url:url, start:0}; return oldOpen.apply(this, arguments); };
      p.send = function(){
        var xhr=this; if(xhr.__mesahaLogReq) xhr.__mesahaLogReq.start=now();
        xhr.addEventListener('loadend', function(){
          try{ var r=xhr.__mesahaLogReq||{}; var ms=now()-(r.start||now()); if(xhr.status>=400 || ms>5000) add(xhr.status>=400?'error':'warn','xhr','XHR sonucu',{method:r.method,url:r.url,status:xhr.status,ms:ms}); }catch(e){}
        });
        return oldSend.apply(this, arguments);
      };
      p.__mesahaXHRLoggedV415 = true;
    }catch(e){}
  }
  function wrapFunction(name, label){
    try{
      var fn = window[name];
      if(typeof fn !== 'function' || fn[WRAP_FLAG]) return;
      var wrapped = function(){
        var started = now();
        add('info', 'function', (label || name) + ' başladı', {args:Array.prototype.slice.call(arguments,0,5)});
        try{
          var res = fn.apply(this, arguments);
          if(res && typeof res.then === 'function'){
            return res.then(function(v){ add('info','function',(label||name)+' tamamlandı',{ms:now()-started}); return v; })
              .catch(function(e){ add('error','function',(label||name)+' hata',{error:serialize(e),ms:now()-started}); throw e; });
          }
          add('info','function',(label||name)+' tamamlandı',{ms:now()-started});
          return res;
        }catch(e){ add('error','function',(label||name)+' hata',{error:serialize(e),ms:now()-started}); throw e; }
      };
      Object.keys(fn).forEach(function(k){ try{ wrapped[k]=fn[k]; }catch(e){} });
      wrapped[WRAP_FLAG] = true;
      window[name] = wrapped;
    }catch(e){}
  }
  function wrapKnownFunctions(){
    ['saveEntry','renderAll','renderRecords','renderCutters','showView','openEntry','backupData','backupZip','saveRecords','saveSettings','toast','volume'].forEach(function(n){ wrapFunction(n); });
    ['mesahaPanelV316','mesahaUserBackupsV318','mesahaLoginGateV319','MesahaOrbisV392','MesahaCutterManagerV406','MesahaBulkCutterTransferV406','MesahaEntryScrollTapGuardV408','MesahaCutterStaticSaveFixV409'].forEach(function(objName){
      try{ var obj=window[objName]; if(!obj || typeof obj !== 'object') return; Object.keys(obj).forEach(function(k){ if(typeof obj[k] === 'function' && !obj[k][WRAP_FLAG]){ var old=obj[k]; obj[k]=function(){ add('info','module',objName+'.'+k+' çalıştı',{args:Array.prototype.slice.call(arguments,0,4)}); return old.apply(this,arguments); }; obj[k][WRAP_FLAG]=true; } }); }catch(e){}
    });
    ['mesahaFirebase','mesahaFirebaseV380','mesahaFirebaseV383'].forEach(function(objName){
      try{ var obj=window[objName]; if(!obj || typeof obj !== 'object') return; ['ready','health','reset','status'].forEach(function(k){ if(typeof obj[k] === 'function' && !obj[k][WRAP_FLAG]){ var old=obj[k]; obj[k]=function(){ add('info','firebase',objName+'.'+k+' başladı'); var started=now(); try{ var res=old.apply(this,arguments); if(res&&typeof res.then==='function') return res.then(function(v){ add('info','firebase',objName+'.'+k+' tamam',{ms:now()-started}); return v; }).catch(function(e){ add('error','firebase',objName+'.'+k+' hata',{error:serialize(e),ms:now()-started}); throw e; }); add('info','firebase',objName+'.'+k+' tamam',{ms:now()-started}); return res; }catch(e){ add('error','firebase',objName+'.'+k+' hata',{error:serialize(e),ms:now()-started}); throw e; } }; obj[k][WRAP_FLAG]=true; } }); }catch(e){}
    });
  }
  function bindEvents(){
    window.addEventListener('error', function(ev){ add('error','window.error', ev.message || 'script hata', {filename:ev.filename, lineno:ev.lineno, colno:ev.colno, error:ev.error}); }, true);
    window.addEventListener('unhandledrejection', function(ev){ add('error','promise', 'Promise hata', {reason:ev.reason}); }, true);
    window.addEventListener('online', function(){ add('info','network','Cihaz online oldu'); });
    window.addEventListener('offline', function(){ add('warn','network','Cihaz offline oldu'); });
    window.addEventListener('load', function(){ add('info','page','Sayfa yüklendi', deviceInfo()); });
    window.addEventListener('pagehide', function(){ add('info','page','Sayfa kapandı/gizlendi'); });
    document.addEventListener('visibilitychange', function(){ add('info','page','Görünürlük değişti', {state:document.visibilityState}); });
    document.addEventListener('click', function(ev){
      try{
        var el = ev.target && ev.target.closest ? ev.target.closest('button,a,input,select,textarea,[role="button"],[data-action]') : ev.target;
        if(!el) return;
        var dt = now() - lastClickAt; lastClickAt = now();
        add('info','click','Tıklama', {element:describeElement(el), doubleTap:dt<450});
      }catch(e){}
    }, true);
    try{
      if(navigator.serviceWorker){
        navigator.serviceWorker.addEventListener('message', function(ev){
          var d = ev.data || {}; if(d && d.type === 'MESAHA_DEBUG_LOG') add(d.level || 'info', d.area || 'service-worker', d.message || 'Service worker mesajı', d.data || {});
        });
      }
    }catch(e){}
  }
  function downloadLogs(){
    var payload = {exportedAt:new Date().toISOString(), version:VERSION, build:BUILD, sessionId:getSession(), installId:getInstall(), user:userInfo(), device:deviceInfo(), logs:readLogs()};
    var blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json;charset=utf-8'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mesaha_debug_log_' + (new Date().toISOString().slice(0,19).replace(/[-:T]/g,'')) + '.json';
    document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1200);
  }
  function copyLogs(){
    var text = JSON.stringify({version:VERSION, build:BUILD, sessionId:getSession(), user:userInfo(), logs:readLogs().slice(-160)}, null, 2);
    if(navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(function(){ add('info','debug','Log kopyalandı'); renderPanel(); });
    return Promise.reject(new Error('Kopyalama desteklenmiyor'));
  }
  async function sendToCloud(manual){
    var logs = readLogs();
    if(!logs.length) throw new Error('Gönderilecek log yok');
    var latest = logs.slice(-250);
    var api = window.mesahaFirebaseV380 || window.mesahaFirebaseV383 || window.mesahaFirebase;
    if(!api || typeof api.ready !== 'function') throw new Error('Firebase motoru hazır değil');
    var r = await api.ready();
    var payload = {
      kind:'client-debug-log',
      appVersion:(window.MESAHA_VERSION && window.MESAHA_VERSION.app) || VERSION,
      fileVersion:(window.MESAHA_VERSION && window.MESAHA_VERSION.version) || VERSION_CODE,
      build:(window.MESAHA_VERSION && window.MESAHA_VERSION.build) || BUILD,
      createdAt:new Date().toLocaleString('tr-TR'),
      createdAtMs:Date.now(),
      sessionId:getSession(),
      installId:getInstall(),
      user:userInfo(),
      device:deviceInfo(),
      page:location.pathname,
      url:location.href,
      manual:!!manual,
      logCount:logs.length,
      latestCount:latest.length,
      logs:latest
    };
    var ref = await r.db.collection('debugLogs').add(payload);
    add('info','debug','Log Firebase’e gönderildi',{id:ref.id,count:latest.length});
    return ref.id;
  }
  function scheduleCloudFlush(reason){
    try{
      if(cloudTimer) return;
      cloudTimer = setTimeout(function(){ cloudTimer=null; sendToCloud(false).catch(function(e){ add('warn','debug','Otomatik log gönderilemedi',{reason:reason,error:serialize(e)}); }); }, 8000);
    }catch(e){}
  }
  function renderPanel(){
    var body = document.getElementById('mesahaDebugLogBodyV415');
    if(!body) return;
    var logs = readLogs();
    var latest = logs.slice(-90).reverse();
    body.innerHTML = latest.map(function(l){
      var color = l.level === 'error' || l.level === 'fatal' ? '#dc2626' : (l.level === 'warn' ? '#d97706' : '#0f766e');
      return '<div class="dbg-row-v415"><div><b style="color:'+color+'">'+escapeHtml(l.level)+'</b> <span>'+escapeHtml(l.area)+'</span></div><small>'+escapeHtml(l.t)+' • '+escapeHtml(l.page||'')+'</small><p>'+escapeHtml(l.message)+'</p></div>';
    }).join('') || '<p class="dbg-empty-v415">Henüz log yok.</p>';
    var count = document.getElementById('mesahaDebugLogCountV415'); if(count) count.textContent = String(logs.length);
  }
  function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function ensureUi(){
    if(document.getElementById('mesahaDebugLogBtnV415')) return;
    var style = document.createElement('style');
    style.id = 'mesaha-debug-logger-style-v415';
    style.textContent = '.mesaha-debug-btn-v415{position:fixed;left:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 88px);z-index:2147483200;border:0;border-radius:999px;padding:9px 12px;background:#111827;color:#fff;font:800 12px system-ui;box-shadow:0 10px 24px rgba(0,0,0,.22)}.mesaha-debug-btn-v415 span{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;margin-left:6px;border-radius:999px;background:#f59e0b;color:#111827}.mesaha-debug-panel-v415{position:fixed;inset:0;z-index:2147483300;background:rgba(15,23,42,.58);display:none;align-items:flex-end;justify-content:center}.mesaha-debug-panel-v415.open{display:flex}.mesaha-debug-card-v415{width:min(760px,100%);max-height:86vh;overflow:hidden;background:#fff;border-radius:26px 26px 0 0;box-shadow:0 -18px 50px rgba(0,0,0,.28);font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#111827}.mesaha-debug-head-v415{display:flex;align-items:center;justify-content:space-between;padding:18px 18px 12px;border-bottom:1px solid #e5e7eb}.mesaha-debug-head-v415 b{font-size:20px}.mesaha-debug-head-v415 small{display:block;color:#64748b;font-weight:700;margin-top:3px}.mesaha-debug-actions-v415{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px}.mesaha-debug-actions-v415 button{border:1px solid #dbe3ea;border-radius:16px;background:#f8fafc;color:#0f172a;padding:12px;font-weight:900}.mesaha-debug-actions-v415 button.primary{background:#16a34a;color:#fff;border-color:#16a34a}.mesaha-debug-actions-v415 button.danger{background:#fee2e2;color:#b91c1c;border-color:#fecaca}.mesaha-debug-body-v415{max-height:48vh;overflow:auto;padding:8px 14px 18px;-webkit-overflow-scrolling:touch}.dbg-row-v415{border:1px solid #e5e7eb;border-radius:16px;padding:10px 12px;margin:8px 0;background:#fff}.dbg-row-v415 small{color:#64748b;font-weight:700}.dbg-row-v415 p{margin:5px 0 0;color:#0f172a;font-weight:700;line-height:1.35}.dbg-empty-v415{padding:18px;color:#64748b;font-weight:800}.mesaha-debug-close-v415{border:0;background:#f1f5f9;border-radius:14px;padding:10px 12px;font-weight:900;color:#111827}';
    document.head.appendChild(style);
    var btn = document.createElement('button');
    btn.id = 'mesahaDebugLogBtnV415'; btn.className = 'mesaha-debug-btn-v415'; btn.type = 'button'; btn.innerHTML = 'LOG <span id="mesahaDebugLogBadgeV415">0</span>';
    var panel = document.createElement('div');
    panel.id = 'mesahaDebugLogPanelV415'; panel.className = 'mesaha-debug-panel-v415';
    panel.innerHTML = '<div class="mesaha-debug-card-v415"><div class="mesaha-debug-head-v415"><div><b>Mesaha Log Tutucu</b><small>Tek sürümlük test • <span id="mesahaDebugLogCountV415">0</span> kayıt</small></div><button class="mesaha-debug-close-v415" id="mesahaDebugCloseV415" type="button">Kapat</button></div><div class="mesaha-debug-actions-v415"><button class="primary" id="mesahaDebugDownloadV415" type="button">Log İndir</button><button id="mesahaDebugCopyV415" type="button">Kopyala</button><button id="mesahaDebugCloudV415" type="button">Firebase’e Gönder</button><button class="danger" id="mesahaDebugClearV415" type="button">Temizle</button></div><div class="mesaha-debug-body-v415" id="mesahaDebugLogBodyV415"></div></div>';
    document.body.appendChild(btn); document.body.appendChild(panel);
    btn.addEventListener('click', function(){ panel.classList.add('open'); renderPanel(); });
    document.getElementById('mesahaDebugCloseV415').addEventListener('click', function(){ panel.classList.remove('open'); });
    document.getElementById('mesahaDebugDownloadV415').addEventListener('click', function(){ downloadLogs(); });
    document.getElementById('mesahaDebugCopyV415').addEventListener('click', function(){ copyLogs().catch(function(e){ add('warn','debug','Log kopyalama başarısız',{error:serialize(e)}); renderPanel(); }); });
    document.getElementById('mesahaDebugCloudV415').addEventListener('click', function(){ var el=this; el.textContent='Gönderiliyor…'; sendToCloud(true).then(function(){ el.textContent='Gönderildi'; renderPanel(); setTimeout(function(){el.textContent='Firebase’e Gönder';},1600); }).catch(function(e){ add('error','debug','Manuel log gönderme hatası',{error:serialize(e)}); el.textContent='Gönderilemedi'; renderPanel(); setTimeout(function(){el.textContent='Firebase’e Gönder';},1800); }); });
    document.getElementById('mesahaDebugClearV415').addEventListener('click', function(){ if(confirm('Log kayıtları temizlensin mi?')){ writeLogs([]); add('info','debug','Loglar temizlendi'); renderPanel(); } });
    updateBadge();
  }

  window.mesahaDebugLog = {
    add:add,
    logs:readLogs,
    clear:function(){ writeLogs([]); updateBadge(); },
    download:downloadLogs,
    send:sendToCloud,
    version:VERSION,
    build:BUILD
  };

  wrapConsole(); wrapFetch(); wrapXHR(); bindEvents();
  add('info','debug','Log tutucu başladı',{version:VERSION, build:BUILD, page:location.pathname, device:deviceInfo()});
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureUi); else ensureUi();
  var tries = 0;
  var t = setInterval(function(){ tries++; wrapKnownFunctions(); if(tries > 30) clearInterval(t); }, 750);
})();
