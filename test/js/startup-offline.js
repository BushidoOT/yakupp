(function(){
  'use strict';
  var INFO = window.MESAHA_VERSION || {};
  var FILE_VERSION = INFO.version || 'v185';
  var startTime = Date.now();
  var finished = false;
  var CHECK_TIMEOUT_MS = 5000;
  function byId(id){ return document.getElementById(id); }
  function qs(sel){ return document.querySelector(sel); }
  function safe(fn){ try{ return fn(); }catch(e){ try{ console.warn('[startup-v178]', e); }catch(_){} } }
  function setText(id, text){ var el = byId(id); if(el) el.textContent = text; }
  function mark(stepId, text, state){
    safe(function(){
      var el = byId(stepId); if(!el) return;
      el.classList.remove('done','active','warn','fail');
      if(state) el.classList.add(state);
      var t = el.querySelector('.step-text'); if(t) t.textContent = text;
      var icon = el.querySelector('.step-icon');
      if(icon){ icon.textContent = state === 'done' ? '✓' : state === 'warn' ? '!' : state === 'fail' ? '×' : '•'; }
    });
  }
  function addLog(msg){
    safe(function(){
      var el = byId('startupLogV178'); if(!el) return;
      var div = document.createElement('div');
      div.textContent = msg;
      el.appendChild(div);
      while(el.children.length > 6) el.removeChild(el.firstChild);
    });
  }
  function setNetStatus(online, label){
    safe(function(){
      var text = label || (online ? 'Çevrim içi' : 'Çevrim dışı');
      ['homeNetworkV143','netStatusTextV178','mesahaNetBadgeV178'].forEach(function(id){ var el = byId(id); if(el) el.textContent = text; });
      var badge = byId('mesahaNetBadgeV178') || byId('mesahaOfflineStatus');
      if(badge){ badge.classList.toggle('offline', !online); badge.classList.toggle('online', !!online); }
      var fixed = byId('mesahaOfflineStatus');
      if(fixed){ fixed.textContent = text; fixed.classList.toggle('offline', !online); }
    });
  }
  function showStartup(){
    safe(function(){
      var el = byId('mesahaStartupV178'); if(el){ el.classList.remove('hide'); el.style.display='flex'; }
      mark('startupStepAppV178','Uygulama başlatılıyor','done');
      mark('startupStepFilesV178','Offline dosyalar kontrol ediliyor','active');
      mark('startupStepRecordsV178','Kayıt sistemi hazırlanıyor','active');
      mark('startupStepBackupV178','Yedek sistemi hazırlanıyor','active');
      mark('startupStepNetV178','İnternet bağlantısı kontrol ediliyor','active');
      setText('startupStatusV178','Uygulama hazırlanıyor...');
      addLog('Açılış kontrolü başladı.');
    });
  }
  function hideStartup(reason){
    if(finished) return; finished = true;
    safe(function(){
      setText('startupStatusV178', reason || 'Uygulama hazır.');
      mark('startupStepFilesV178','Offline dosyalar hazır','done');
      mark('startupStepRecordsV178','Kayıt sistemi hazır','done');
      mark('startupStepBackupV178','Yedek sistemi hazır','done');
      addLog(reason || 'Uygulama hazır.');
      setTimeout(function(){
        var el = byId('mesahaStartupV178'); if(el){ el.classList.add('hide'); setTimeout(function(){ el.style.display='none'; }, 320); }
        document.documentElement.classList.add('mesaha-startup-done');
      }, 650);
    });
  }
  function showSlowWarning(){
    safe(function(){
      if(finished) return;
      var actions = byId('startupActionsV178'); if(actions) actions.style.display='flex';
      setText('startupStatusV178','Açılış beklenenden uzun sürdü. Offline başlatmayı deneyebilirsiniz.');
      addLog('Açılış uzun sürdü, offline devam seçeneği hazır.');
    });
  }
  function connectionCheck(){
    if(!navigator.onLine){
      mark('startupStepNetV178','İnternet yok, çevrimdışı başlatılıyor','warn');
      setNetStatus(false, 'Çevrim dışı');
      setText('startupStatusV178','İnternet yok, uygulama çevrimdışı olarak başlatılıyor.');
      addLog('İnternet yok; offline devam.');
      return Promise.resolve(false);
    }
    setNetStatus(true, 'Kontrol ediliyor');
    var controller = null, timer = null;
    try{ controller = new AbortController(); }catch(_){ controller = null; }
    var timeoutPromise = new Promise(function(resolve){
      timer = setTimeout(function(){
        try{ if(controller) controller.abort(); }catch(_){}
        resolve('timeout');
      }, CHECK_TIMEOUT_MS);
    });
    var fetchPromise = fetch('./version.json?boot=' + Date.now(), { cache:'no-store', signal: controller ? controller.signal : undefined })
      .then(function(r){ return r && r.ok ? 'online' : 'weak'; })
      .catch(function(){ return 'weak'; });
    return Promise.race([fetchPromise, timeoutPromise]).then(function(result){
      clearTimeout(timer);
      if(result === 'online'){
        mark('startupStepNetV178','İnternet bağlantısı hazır','done');
        setNetStatus(true, 'Çevrim içi');
        setText('startupStatusV178','Çevrim içi başlatılıyor.');
        addLog('Çevrim içi bağlantı hazır.');
        return true;
      }
      mark('startupStepNetV178','İnternet zayıf, çevrimdışı başlatılıyor','warn');
      setNetStatus(false, 'Çevrim dışı');
      setText('startupStatusV178','İnternet zayıf veya cevap vermiyor. Uygulama çevrimdışı olarak başlatılıyor.');
      addLog('5 saniye içinde cevap gelmedi; offline devam.');
      return false;
    });
  }
  function serviceWorkerWarmup(){
    safe(function(){
      if(!('serviceWorker' in navigator)) { mark('startupStepFilesV178','Offline dosya desteği bu tarayıcıda sınırlı','warn'); return; }
      mark('startupStepFilesV178','Offline dosyalar hazırlanıyor','active');
      navigator.serviceWorker.getRegistration().then(function(reg){
        mark('startupStepFilesV178', reg ? 'Offline dosyalar hazır' : 'Offline dosyalar ilk açılışta hazırlanacak', reg ? 'done' : 'warn');
      }).catch(function(){ mark('startupStepFilesV178','Offline dosya kontrolü yapılamadı','warn'); });
    });
  }
  function basicStorageCheck(){
    safe(function(){
      var ok = true;
      try{ localStorage.setItem('__mesaha_boot_test__','1'); localStorage.removeItem('__mesaha_boot_test__'); }catch(e){ ok = false; }
      mark('startupStepRecordsV178', ok ? 'Kayıt sistemi hazır' : 'Kayıt sistemi kontrol edilemedi', ok ? 'done' : 'warn');
      mark('startupStepBackupV178', (window.JSZip || true) ? 'Yedek sistemi hazırlanıyor' : 'Yedek sistemi kontrol ediliyor', 'active');
      setTimeout(function(){ mark('startupStepBackupV178','Yedek sistemi hazır','done'); }, 600);
    });
  }
  function bindActions(){
    safe(function(){
      var off = byId('startupOfflineBtnV178');
      if(off) off.addEventListener('click', function(){
        setNetStatus(false, 'Çevrim dışı');
        hideStartup('Çevrimdışı olarak başlatıldı.');
      });
      var clean = byId('startupClearCacheBtnV178');
      if(clean) clean.addEventListener('click', function(){
        if(window.mesahaClearCaches) window.mesahaClearCaches(true);
        else if(window.caches && caches.keys) caches.keys().then(function(keys){ return Promise.all(keys.map(function(k){ return caches.delete(k); })); }).finally(function(){ location.replace(location.pathname + '?v=' + encodeURIComponent(FILE_VERSION)); });
        else location.replace(location.pathname + '?v=' + encodeURIComponent(FILE_VERSION));
      });
    });
  }
  function boot(){
    showStartup(); bindActions(); basicStorageCheck(); serviceWorkerWarmup();
    connectionCheck().finally(function(){
      var minWait = Math.max(400, 900 - (Date.now() - startTime));
      setTimeout(function(){ hideStartup(navigator.onLine ? 'Uygulama hazır.' : 'Çevrimdışı olarak başlatıldı.'); }, minWait);
    });
    setTimeout(showSlowWarning, 7000);
  }
  window.MESAHA_STARTUP_V178 = { setNetStatus:setNetStatus, hide:hideStartup, mark:mark };
  window.addEventListener('online', function(){ setNetStatus(true, 'Çevrim içi'); mark('startupStepNetV178','İnternet bağlantısı geldi','done'); });
  window.addEventListener('offline', function(){ setNetStatus(false, 'Çevrim dışı'); mark('startupStepNetV178','İnternet kesildi, çevrimdışı devam','warn'); });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
