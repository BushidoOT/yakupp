(function(){
  'use strict';
  if (window.MesahaDataGuard && window.MesahaDataGuard.__stable) return;
  var STORAGE_KEY = 'cam_mesaha_kayitlari_v1';
  var SETTINGS_KEY = 'cam_mesaha_ayarlar_v1';
  var OK_KEY = STORAGE_KEY + '_last_ok';
  var SNAP_KEY = STORAGE_KEY + '_snapshot_v385';
  var timers = Object.create(null);
  function parse(raw, fallback){ try { return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; } }
  function readRecordsFrom(key){ var arr = parse(localStorage.getItem(key), null); return Array.isArray(arr) ? arr : null; }
  function sizeOf(v){ try { return new Blob([typeof v === 'string' ? v : JSON.stringify(v)]).size; } catch(e){ return 0; } }
  function notify(title, sub, kind){ try{ if(typeof window.mesahaFloatToastV315==='function') return window.mesahaFloatToastV315(title, sub||'', kind||'warning'); if(typeof window.toast==='function') return window.toast([title,sub].filter(Boolean).join(' - ')); }catch(e){} }
  function makeSnapshot(records){
    if(!Array.isArray(records)) return false;
    var payload = JSON.stringify(records);
    try {
      if(payload.length < 3500000){
        var old = localStorage.getItem(STORAGE_KEY);
        if(old && old !== payload) localStorage.setItem(OK_KEY, old);
        localStorage.setItem(SNAP_KEY, JSON.stringify({at:Date.now(), count:records.length, payload:payload}));
      }
      return true;
    } catch(e) {
      try { window.dispatchEvent(new CustomEvent('mesaha:storage-error',{detail:{key:STORAGE_KEY,message:e && e.message ? e.message : String(e)}})); } catch(_) {}
      return false;
    }
  }
  function recoverIfNeeded(){
    var main = readRecordsFrom(STORAGE_KEY);
    if(main) return {ok:true, recovered:false, count:main.length};
    var last = readRecordsFrom(OK_KEY);
    if(last){ localStorage.setItem(STORAGE_KEY, JSON.stringify(last)); notify('Kayıtlar son sağlam yedekten açıldı.','','warning'); return {ok:true, recovered:true, count:last.length}; }
    var snap = parse(localStorage.getItem(SNAP_KEY), null);
    if(snap && snap.payload){
      var arr = parse(snap.payload, null);
      if(Array.isArray(arr)){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); notify('Kayıtlar güvenli snapshot üzerinden açıldı.','','warning'); return {ok:true, recovered:true, count:arr.length}; }
    }
    return {ok:false, recovered:false, count:0};
  }
  function debounce(key, fn, ms){ clearTimeout(timers[key]); timers[key]=setTimeout(function(){ try{fn();}catch(e){} }, ms||120); }
  function records(){ var arr = readRecordsFrom(STORAGE_KEY); return Array.isArray(arr)?arr:[]; }
  function quotaInfo(){
    var recRaw = localStorage.getItem(STORAGE_KEY)||'';
    var setRaw = localStorage.getItem(SETTINGS_KEY)||'';
    return {recordsBytes:sizeOf(recRaw), settingsBytes:sizeOf(setRaw), recordsCount:records().length};
  }
  function lightRefresh(){
    var r = window.MesahaRenderStorage || window.MesahaRenderStorageV383 || window.MesahaRenderStorageV382;
    if(r && typeof r.renderRecordsSoon === 'function') return r.renderRecordsSoon(90);
    if(r && typeof r.renderAllSoon === 'function') return r.renderAllSoon(120);
    try{ if(typeof window.renderAll==='function') window.renderAll(); }catch(e){}
  }
  recoverIfNeeded();
  window.addEventListener('mesaha:records-saved', function(){ debounce('snapshot', function(){ makeSnapshot(records()); }, 400); }, {passive:true});
  window.addEventListener('mesaha:storage-error', function(ev){ var msg=(ev.detail&&ev.detail.message)||''; notify('Depolama uyarısı', msg || 'Telefon depolaması dolu olabilir.', 'warning'); }, {passive:true});
  document.addEventListener('visibilitychange', function(){ if(document.hidden) makeSnapshot(records()); }, {passive:true});
  window.addEventListener('pagehide', function(){ makeSnapshot(records()); }, {passive:true});
  window.MesahaDataGuard = {__stable:true,__v385:true, recoverIfNeeded:recoverIfNeeded, snapshot:function(){return makeSnapshot(records());}, quotaInfo:quotaInfo, refresh:lightRefresh};
})();
