(function(){
  'use strict';
  if (window.MesahaDataGuard && window.MesahaDataGuard.__v526) return;
  var STORAGE_KEY = 'cam_mesaha_kayitlari_v1';
  var SETTINGS_KEY = 'cam_mesaha_ayarlar_v1';
  var OK_KEY = STORAGE_KEY + '_last_ok';
  var SNAP_KEY = STORAGE_KEY + '_snapshot_v385';
  var MIRROR_A = STORAGE_KEY + '_mirror_v526_a';
  var MIRROR_B = STORAGE_KEY + '_mirror_v526_b';
  var EMPTY_ALLOWED_KEY = 'mesaha_records_allow_empty_until_v526';
  var timers = Object.create(null);
  function parse(raw, fallback){ try { return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; } }
  function readRecordsFrom(key){ var arr = parse(localStorage.getItem(key), null); if(Array.isArray(arr)) return arr; if(arr && Array.isArray(arr.records)) return arr.records; return null; }
  function emptySaveAllowed(){ try{ return Number(localStorage.getItem(EMPTY_ALLOWED_KEY)||0)>Date.now(); }catch(e){ return false; } }
  function allowEmptySave(){ try{ localStorage.setItem(EMPTY_ALLOWED_KEY,String(Date.now()+30000)); }catch(e){} }
  function sizeOf(v){ try { return new Blob([typeof v === 'string' ? v : JSON.stringify(v)]).size; } catch(e){ return 0; } }
  function notify(title, sub, kind){ try{ if(typeof window.mesahaFloatToastV315==='function') return window.mesahaFloatToastV315(title, sub||'', kind||'warning'); if(typeof window.toast==='function') return window.toast([title,sub].filter(Boolean).join(' - ')); }catch(e){} }
  function bestCandidate(){
    var best=null, source='';
    [STORAGE_KEY, OK_KEY, MIRROR_A, MIRROR_B].forEach(function(k){ var a=readRecordsFrom(k); if(a && (!best || a.length>best.length)){ best=a; source=k; } });
    try{ var snap=parse(localStorage.getItem(SNAP_KEY),null); if(snap && snap.payload){ var arr=parse(snap.payload,null); if(Array.isArray(arr) && (!best || arr.length>best.length)){ best=arr; source=SNAP_KEY; } } }catch(e){}
    return {records:best||[], source:source, count:best?best.length:0};
  }
  function writeMirrors(records){
    if(!Array.isArray(records) || !records.length) return false;
    var payload = JSON.stringify(records);
    try { localStorage.setItem(OK_KEY, payload); } catch(e) {}
    try { localStorage.setItem(MIRROR_A, payload); } catch(e) {}
    try { localStorage.setItem(MIRROR_B, JSON.stringify({at:Date.now(), count:records.length, records:records})); } catch(e) {}
    try { localStorage.setItem(SNAP_KEY, JSON.stringify({at:Date.now(), count:records.length, payload:payload})); } catch(e) {}
    return true;
  }
  function makeSnapshot(records){
    if(!Array.isArray(records)) return false;
    try{
      if(records.length) writeMirrors(records);
      return true;
    }catch(e){
      try { window.dispatchEvent(new CustomEvent('mesaha:storage-error',{detail:{key:STORAGE_KEY,message:e && e.message ? e.message : String(e)}})); } catch(_) {}
      return false;
    }
  }
  function recoverIfNeeded(){
    var main = readRecordsFrom(STORAGE_KEY);
    var best = bestCandidate();
    if(Array.isArray(main) && main.length>0){ writeMirrors(main); return {ok:true, recovered:false, count:main.length}; }
    if(Array.isArray(main) && main.length===0 && emptySaveAllowed()) return {ok:true, recovered:false, count:0, emptyAllowed:true};
    if(best.records && best.records.length>0){
      try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(best.records)); }catch(e){}
      notify('Kayıtlar korumadan geri açıldı.', best.count+' kayıt kurtarıldı', 'warning');
      return {ok:true, recovered:true, count:best.count, source:best.source};
    }
    if(Array.isArray(main)) return {ok:true, recovered:false, count:main.length};
    return {ok:false, recovered:false, count:0};
  }
  function debounce(key, fn, ms){ clearTimeout(timers[key]); timers[key]=setTimeout(function(){ try{fn();}catch(e){} }, ms||120); }
  function records(){ var arr = readRecordsFrom(STORAGE_KEY); return Array.isArray(arr)?arr:[]; }
  function quotaInfo(){
    var recRaw = localStorage.getItem(STORAGE_KEY)||'';
    var setRaw = localStorage.getItem(SETTINGS_KEY)||'';
    return {recordsBytes:sizeOf(recRaw), settingsBytes:sizeOf(setRaw), recordsCount:records().length, backupCount:bestCandidate().count};
  }
  function lightRefresh(){
    var r = window.MesahaRenderStorage || window.MesahaRenderStorageV383 || window.MesahaRenderStorageV382;
    if(r && typeof r.renderRecordsSoon === 'function') return r.renderRecordsSoon(90);
    if(r && typeof r.renderAllSoon === 'function') return r.renderAllSoon(120);
    try{ if(typeof window.renderAll==='function') window.renderAll(); }catch(e){}
  }
  recoverIfNeeded();
  window.addEventListener('mesaha:records-saved', function(){ debounce('snapshot', function(){ makeSnapshot(records()); }, 250); }, {passive:true});
  window.addEventListener('mesaha:storage-error', function(ev){ var msg=(ev.detail&&ev.detail.message)||''; notify('Depolama uyarısı', msg || 'Telefon depolaması dolu olabilir.', 'warning'); }, {passive:true});
  document.addEventListener('visibilitychange', function(){ if(document.hidden) makeSnapshot(records()); else recoverIfNeeded(); }, {passive:true});
  window.addEventListener('pagehide', function(){ makeSnapshot(records()); }, {passive:true});
  window.MesahaDataGuard = {__stable:true,__v385:true,__v526:true, recoverIfNeeded:recoverIfNeeded, snapshot:function(){return makeSnapshot(records());}, quotaInfo:quotaInfo, refresh:lightRefresh, allowEmptySave:allowEmptySave};
})();
