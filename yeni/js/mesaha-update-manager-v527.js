/* Mesaha İO V5.27 — Güvenli PWA güncelleme yöneticisi */
(function(){
  'use strict';
  if(window.MesahaUpdateV527)return;
  var currentCache=(window.MESAHA_VERSION&&window.MESAHA_VERSION.cacheName)||'mesaha-app-v527-stability';
  function isMesahaCache(k){return /^mesaha-app-/i.test(k)||/^mesaha-io-/i.test(k)||/^mesaha-/i.test(k);}
  function wait(ms){return new Promise(function(r){setTimeout(r,ms);});}
  async function flushData(){try{if(window.MesahaStorageV527)await window.MesahaStorageV527.flush();}catch(e){}}
  async function clearOldCaches(){
    if(!('caches' in window))return [];
    var keys=await caches.keys(),deleted=[];
    await Promise.all(keys.map(async function(k){
      if(isMesahaCache(k)&&k.indexOf(currentCache)!==0){if(await caches.delete(k))deleted.push(k);}
    }));
    return deleted;
  }
  async function repair(){
    await flushData();
    if(!('serviceWorker' in navigator))return {ok:true,serviceWorker:false};
    var reg=await navigator.serviceWorker.getRegistration('./').catch(function(){return null;});
    if(!reg)reg=await navigator.serviceWorker.register('./service-worker.js',{scope:'./'});
    try{await reg.update();}catch(e){}
    try{if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});if(reg.active)reg.active.postMessage({type:'REPAIR_CACHE',build:(window.MESAHA_VERSION&&window.MESAHA_VERSION.build)||527});}catch(e){}
    await clearOldCaches();
    return {ok:true,serviceWorker:true};
  }
  async function updateAndReload(opts){
    opts=opts||{};
    await repair();
    try{localStorage.setItem('mesaha_current_version',(window.MESAHA_VERSION&&window.MESAHA_VERSION.version)||'v527');localStorage.setItem('mesaha_cache_repair_current',String(Date.now()));}catch(e){}
    await wait(Number(opts.delay||350));
    var target=opts.target||'./index.html';
    location.replace(target+(target.indexOf('?')>=0?'&':'?')+'updated='+Date.now());
  }
  async function check(){
    if(!window.MesahaVersion||typeof window.MesahaVersion.fetchRemote!=='function')return null;
    var remote=await window.MesahaVersion.fetchRemote();
    return {remote:remote,newer:window.MesahaVersion.isNewer(remote)};
  }
  window.MesahaUpdateV527={repair:repair,clearOldCaches:clearOldCaches,updateAndReload:updateAndReload,check:check,flushData:flushData};
  if(window.__mesahaSafeResetRequested){setTimeout(function(){updateAndReload({delay:200}).catch(function(){location.replace('./index.html');});},40);}
})();
