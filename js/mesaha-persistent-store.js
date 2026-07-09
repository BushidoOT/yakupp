(function(){
  'use strict';
  if(window.MesahaPersistentStoreV515) return;
  var DB_NAME='mesaha_io_persistent_v515';
  var DB_VERSION=1;
  var STORE='kv';
  var RECORDS_KEY='cam_mesaha_kayitlari_v1';
  var SETTINGS_KEY='cam_mesaha_ayarlar_v1';
  var readyPromise=null;
  function parse(v,f){try{return v?JSON.parse(v):f}catch(e){return f}}
  function readLS(k,f){try{return parse(localStorage.getItem(k),f)}catch(e){return f}}
  function writeLS(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
  function openDb(){
    if(readyPromise) return readyPromise;
    readyPromise=new Promise(function(resolve,reject){
      if(!('indexedDB' in window)){reject(new Error('IndexedDB yok'));return;}
      var req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=function(){var db=req.result; if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:'key'});};
      req.onsuccess=function(){resolve(req.result)};
      req.onerror=function(){reject(req.error||new Error('IndexedDB açılamadı'))};
    });
    return readyPromise;
  }
  function put(key,value){
    return openDb().then(function(db){return new Promise(function(resolve,reject){
      var tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put({key:key,value:value,updatedAt:Date.now()});
      tx.oncomplete=function(){resolve(true)};
      tx.onerror=function(){reject(tx.error||new Error('Yazılamadı'))};
    })}).catch(function(){return false});
  }
  function get(key){
    return openDb().then(function(db){return new Promise(function(resolve,reject){
      var tx=db.transaction(STORE,'readonly'); var req=tx.objectStore(STORE).get(key);
      req.onsuccess=function(){resolve(req.result||null)};
      req.onerror=function(){reject(req.error||new Error('Okunamadı'))};
    })}).catch(function(){return null});
  }
  function appRecords(){try{return window.state&&Array.isArray(window.state.records)?window.state.records:null}catch(e){return null}}
  function appSettings(){try{return window.state&&window.state.settings?window.state.settings:null}catch(e){return null}}
  function toast(t,s,k){try{if(typeof window.mesahaFloatToastV315==='function')return window.mesahaFloatToastV315(t,s||'',k||'warning'); if(typeof window.toast==='function')return window.toast([t,s].filter(Boolean).join(' - '));}catch(e){}}
  function saveRecords(list){
    if(!Array.isArray(list)) list=appRecords();
    if(!Array.isArray(list)) return;
    try{localStorage.setItem(RECORDS_KEY+'_mirror_v515',JSON.stringify(list)); localStorage.setItem(RECORDS_KEY+'_mirror_meta_v515',JSON.stringify({count:list.length,at:Date.now()}));}catch(e){}
    put('records',list);
  }
  function saveSettings(st){
    st=st||appSettings(); if(!st||typeof st!=='object') return;
    try{localStorage.setItem(SETTINGS_KEY+'_mirror_v515',JSON.stringify(st)); localStorage.setItem(SETTINGS_KEY+'_mirror_meta_v515',JSON.stringify({at:Date.now()}));}catch(e){}
    put('settings',st);
  }
  function localMirrorRecords(){
    var a=readLS(RECORDS_KEY,null); if(Array.isArray(a)&&a.length) return a;
    var b=readLS(RECORDS_KEY+'_mirror_v515',null); if(Array.isArray(b)&&b.length) return b;
    var c=readLS(RECORDS_KEY+'_last_ok',null); if(Array.isArray(c)&&c.length) return c;
    return Array.isArray(a)?a:[];
  }
  async function recoverIntoApp(){
    try{
      if(navigator.storage&&navigator.storage.persist) navigator.storage.persist().catch(function(){});
      var localRecords=localMirrorRecords();
      var dbRec=await get('records');
      var dbRecords=dbRec&&Array.isArray(dbRec.value)?dbRec.value:[];
      if(dbRecords.length>localRecords.length){
        writeLS(RECORDS_KEY,dbRecords); writeLS(RECORDS_KEY+'_mirror_v515',dbRecords);
        if(window.state&&Array.isArray(window.state.records)){window.state.records=dbRecords;}
        try{if(typeof window.renderAll==='function')window.renderAll(); else if(window.MesahaRenderStorageV382&&window.MesahaRenderStorageV382.renderAllSoon)window.MesahaRenderStorageV382.renderAllSoon();}catch(e){}
        toast('Kayıtlar güvenli kopyadan geri alındı.',dbRecords.length+' kayıt yüklendi.','warning');
      }else if(localRecords.length){ saveRecords(localRecords); }
      var localSettings=readLS(SETTINGS_KEY,null)||readLS(SETTINGS_KEY+'_mirror_v515',null)||{};
      var dbSet=await get('settings');
      var dbSettings=dbSet&&dbSet.value&&typeof dbSet.value==='object'?dbSet.value:null;
      if(dbSettings){
        var merged=Object.assign({},localSettings,dbSettings);
        if(window.state&&window.state.settings){window.state.settings=Object.assign(window.state.settings,merged);}
        writeLS(SETTINGS_KEY,merged); writeLS(SETTINGS_KEY+'_mirror_v515',merged);
        try{if(typeof window.renderAll==='function')window.renderAll();}catch(e){}
      }else if(localSettings&&Object.keys(localSettings).length){ saveSettings(localSettings); }
    }catch(e){}
  }
  window.addEventListener('mesaha:records-saved',function(){setTimeout(function(){saveRecords();},80)},{passive:true});
  window.addEventListener('mesaha:settings-saved',function(){setTimeout(function(){saveSettings();},80)},{passive:true});
  window.addEventListener('pagehide',function(){saveRecords();saveSettings();},{passive:true});
  document.addEventListener('visibilitychange',function(){if(document.hidden){saveRecords();saveSettings();}else setTimeout(recoverIntoApp,250);},{passive:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(recoverIntoApp,500);},{once:true}); else setTimeout(recoverIntoApp,500);
  window.MesahaPersistentStoreV515={__v515:true,saveRecords:saveRecords,saveSettings:saveSettings,recoverIntoApp:recoverIntoApp};
})();
