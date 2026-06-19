(function(){
  'use strict';
  var INFO = window.MESAHA_VERSION || {};
  var CURRENT = String(INFO.version || 'v185');
  var AUTO_PREFIX = 'mesaha_auto_update_done_';
  var CHECK_LOCK = false;
  var TIMEOUT_MS = 6500;
  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function byId(id){ return document.getElementById(id); }
  function safe(fn, fallback){ try{ return fn(); }catch(e){ try{ console.warn('[mesaha-auto-update]', e); }catch(_){} return fallback; } }
  function num(v){ var m = String(v || '').match(/v?(\d+)/i); return m ? Number(m[1]) : 0; }
  function isNewer(remote, current){ return num(remote) > num(current); }
  function toast(msg){ safe(function(){ if(typeof window.showToast === 'function') window.showToast(msg); else console.log(msg); }); }
  function log(msg){ safe(function(){ console.log('[Mesaha İO Güncelleme]', msg); }); }
  function timeout(ms){ return new Promise(function(_, reject){ setTimeout(function(){ reject(new Error('update-timeout')); }, ms); }); }
  function updateHomeStatus(text){
    safe(function(){
      var el = byId('homeNetworkV143');
      if(el) el.textContent = text;
      var startup = byId('startupStatusV178');
      if(startup && !document.documentElement.classList.contains('mesaha-startup-done')) startup.textContent = text;
    });
  }
  function ensureOverlay(){
    var old = byId('mesahaAutoUpdateOverlayV179');
    if(old) return old;
    var style = document.createElement('style');
    style.id = 'mesahaAutoUpdateCssV179';
    style.textContent = [
      '.mesaha-auto-update-v179{position:fixed;inset:0;z-index:2147483100;display:none;align-items:center;justify-content:center;background:rgba(2,6,23,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:18px}',
      '.mesaha-auto-update-v179.show{display:flex}',
      '.mesaha-auto-update-card-v179{width:min(430px,94vw);border-radius:26px;background:#fff;color:#0f172a;padding:22px;box-shadow:0 28px 90px rgba(0,0,0,.35);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
      '.mesaha-auto-update-card-v179 h2{margin:0 0 6px;font-size:21px;font-weight:950;color:#14532d}',
      '.mesaha-auto-update-card-v179 p{margin:0 0 14px;color:#475569;font-weight:750;line-height:1.4}',
      '.mesaha-auto-update-spinner-v179{width:34px;height:34px;border-radius:999px;border:4px solid #dcfce7;border-top-color:#16a34a;animation:mesahaAutoSpinV179 .85s linear infinite;margin:8px auto 14px}',
      '.mesaha-auto-update-log-v179{background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:10px 12px;font-size:13px;font-weight:850;color:#334155;min-height:42px}',
      '.mesaha-auto-update-actions-v179{display:none;gap:8px;margin-top:13px;flex-wrap:wrap}',
      '.mesaha-auto-update-actions-v179 button{flex:1 1 145px;border:0;border-radius:14px;padding:11px 12px;font-weight:950;background:#14532d;color:#fff}',
      '.mesaha-auto-update-actions-v179 .secondary{background:#e2e8f0;color:#0f172a}',
      '@keyframes mesahaAutoSpinV179{to{transform:rotate(360deg)}}'
    ].join('\n');
    document.head.appendChild(style);
    var div = document.createElement('div');
    div.id = 'mesahaAutoUpdateOverlayV179';
    div.className = 'mesaha-auto-update-v179';
    div.innerHTML = '<div class="mesaha-auto-update-card-v179"><h2>Yeni sürüm hazırlanıyor</h2><p>Kayıtlarınız silinmez. Sadece uygulama dosyaları güncellenir.</p><div class="mesaha-auto-update-spinner-v179"></div><div id="mesahaAutoUpdateLogV179" class="mesaha-auto-update-log-v179">Güncelleme kontrol ediliyor...</div><div id="mesahaAutoUpdateActionsV179" class="mesaha-auto-update-actions-v179"><button id="mesahaAutoUpdateReloadV179" type="button">Yenile</button><button id="mesahaAutoUpdateCancelV179" class="secondary" type="button">Sonra</button></div></div>';
    document.body.appendChild(div);
    byId('mesahaAutoUpdateReloadV179').addEventListener('click', function(){ location.reload(); });
    byId('mesahaAutoUpdateCancelV179').addEventListener('click', function(){ div.classList.remove('show'); });
    return div;
  }
  function overlayLog(msg, showActions){
    safe(function(){
      var ov = ensureOverlay(); ov.classList.add('show');
      var logEl = byId('mesahaAutoUpdateLogV179'); if(logEl) logEl.textContent = msg;
      var actions = byId('mesahaAutoUpdateActionsV179'); if(actions) actions.style.display = showActions ? 'flex' : 'none';
    });
  }
  async function fetchRemoteVersion(){
    var controller = null;
    try{ controller = new AbortController(); }catch(_){ controller = null; }
    var url = './version.json?autoUpdate=' + Date.now();
    var fetchPromise = fetch(url, {cache:'no-store', signal: controller ? controller.signal : undefined}).then(function(r){
      if(!r || !r.ok) throw new Error('version-http-' + (r && r.status));
      return r.json();
    });
    var timer = setTimeout(function(){ try{ if(controller) controller.abort(); }catch(_){} }, TIMEOUT_MS);
    try{ return await Promise.race([fetchPromise, timeout(TIMEOUT_MS)]); }
    finally{ clearTimeout(timer); }
  }
  async function clearRuntimeCaches(){
    if(window.caches && caches.keys){
      var keys = await caches.keys();
      await Promise.all(keys.map(function(k){ return caches.delete(k).catch(function(){ return false; }); }));
    }
  }
  async function unregisterWorkers(){
    if(!('serviceWorker' in navigator)) return;
    try{
      var regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(function(reg){ try{ if(reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'}); }catch(_){} return reg.unregister().catch(function(){ return false; }); }));
    }catch(_){ }
  }
  async function refreshServiceWorkers(remoteVersion){
    if(!('serviceWorker' in navigator)) return;
    try{ await navigator.serviceWorker.register('./service-worker.js?v=' + encodeURIComponent(remoteVersion || Date.now()), {updateViaCache:'none'}); }catch(_){ }
  }
  function reloadToVersion(remoteVersion){
    var url = new URL(location.href);
    url.searchParams.set('v', String(remoteVersion || '').replace(/^v/i,'') || String(Date.now()));
    url.searchParams.set('reset', '1');
    url.searchParams.set('appUpdate', Date.now().toString());
    url.hash = '';
    location.replace(url.toString());
  }
  async function applyUpdate(info, manual){
    var rv = String(info && info.version || '');
    if(!rv || !isNewer(rv, CURRENT)){ if(manual) toast('Güncel sürüm kullanılıyor.'); return false; }
    var key = AUTO_PREFIX + rv;
    if(sessionStorage.getItem(key) === '1' && !manual) return false;
    sessionStorage.setItem(key, '1');
    localStorage.setItem('mesaha_last_auto_update_check', new Date().toISOString());
    overlayLog('Yeni sürüm bulundu: ' + (info.visibleVersion || rv) + '. Güncelleme hazırlanıyor...', false);
    updateHomeStatus('Güncelleme yapılıyor');
    overlayLog('Eski önbellek temizleniyor...', false);
    await clearRuntimeCaches();
    overlayLog('Service worker yenileniyor...', false);
    await unregisterWorkers();
    await refreshServiceWorkers(rv);
    localStorage.setItem('mesaha_last_auto_update', new Date().toISOString());
    overlayLog('Güncelleme tamamlandı. Uygulama yeniden açılıyor...', false);
    setTimeout(function(){ reloadToVersion(rv); }, 850);
    return true;
  }
  async function check(reason, manual){
    if(CHECK_LOCK) return false;
    if(!navigator.onLine) return false;
    CHECK_LOCK = true;
    try{
      log('kontrol: ' + (reason || 'auto'));
      var info = await fetchRemoteVersion();
      if(info && info.version && isNewer(info.version, CURRENT)) return await applyUpdate(info, manual);
      localStorage.setItem('mesaha_last_auto_update_check', new Date().toISOString());
      return false;
    }catch(e){
      log('kontrol başarısız: ' + (e && e.message || e));
      return false;
    }finally{
      setTimeout(function(){ CHECK_LOCK = false; }, 1500);
    }
  }
  window.mesahaAutoUpdateCheck = check;
  ready(function(){
    setTimeout(function(){ check('online-start'); }, 2200);
    window.addEventListener('online', function(){ setTimeout(function(){ check('online-event'); }, 1200); });
    var btn = byId('userMenuForceUpdateBtn');
    if(btn){
      btn.addEventListener('click', function(){
        setTimeout(function(){ check('manual-panel', true).then(function(updated){ if(!updated) toast('Güncel sürüm kullanılıyor veya bağlantı zayıf.'); }); }, 50);
      }, true);
    }
  });
})();
