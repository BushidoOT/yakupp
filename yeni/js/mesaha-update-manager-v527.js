/* Mesaha İO V5.37 — Kesintisiz PWA güncelleme yöneticisi */
(function(){
  'use strict';
  var previous=window.MesahaUpdateV527;
  if(previous&&Number(previous.apiVersion||0)>=537)return;

  var API_VERSION=537;
  var localInfo=window.MESAHA_VERSION||{};
  var localBuild=Number(localInfo.build||537)||537;

  function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
  function isAppCache(name){return /^(mesaha|mio)(-|_)/i.test(String(name||''))||/mesaha/i.test(String(name||''));}
  function expectedCache(remote){return String((remote&&remote.cacheName)||localInfo.cacheName||'');}
  function buildOf(remote){return Number(remote&&((remote.build||remote.latestBuild))||localBuild)||localBuild;}
  function absolute(path){try{return new URL(path,location.href).href;}catch(e){return path;}}

  async function flushData(){
    try{if(window.MesahaStorageV527&&typeof window.MesahaStorageV527.flush==='function')await window.MesahaStorageV527.flush();}catch(e){}
  }

  async function fetchRemote(){
    if(window.MesahaVersion&&typeof window.MesahaVersion.fetchRemote==='function')return await window.MesahaVersion.fetchRemote();
    var res=await fetch('./version.json?check='+Date.now(),{cache:'no-store',headers:{'Cache-Control':'no-cache, no-store, must-revalidate'}});
    if(!res.ok)throw new Error('Sürüm bilgisi alınamadı: '+res.status);
    return await res.json();
  }

  function waitWorkerState(worker,timeout){
    timeout=Number(timeout||12000);
    return new Promise(function(resolve){
      if(!worker)return resolve(null);
      if(worker.state==='installed'||worker.state==='activated'||worker.state==='redundant')return resolve(worker.state);
      var done=false;
      var timer=setTimeout(function(){if(done)return;done=true;resolve(worker.state||'timeout');},timeout);
      worker.addEventListener('statechange',function(){
        if(done)return;
        if(worker.state==='installed'||worker.state==='activated'||worker.state==='redundant'){
          done=true;clearTimeout(timer);resolve(worker.state);
        }
      });
    });
  }

  function waitControllerChange(timeout){
    timeout=Number(timeout||12000);
    return new Promise(function(resolve){
      if(!('serviceWorker' in navigator))return resolve(false);
      var done=false;
      var timer=setTimeout(function(){if(done)return;done=true;resolve(false);},timeout);
      navigator.serviceWorker.addEventListener('controllerchange',function onChange(){
        if(done)return;done=true;clearTimeout(timer);
        try{navigator.serviceWorker.removeEventListener('controllerchange',onChange);}catch(e){}
        resolve(true);
      });
    });
  }

  async function clearOldCaches(keepBase){
    if(!('caches' in window))return [];
    var keys=await caches.keys(),deleted=[];
    var keep=String(keepBase||'');
    await Promise.all(keys.map(async function(name){
      if(!isAppCache(name))return;
      if(keep&&name.indexOf(keep)===0)return;
      try{if(await caches.delete(name))deleted.push(name);}catch(e){}
    }));
    return deleted;
  }

  async function installLatest(remote,opts){
    opts=opts||{};
    await flushData();
    if(!('serviceWorker' in navigator))return {ok:true,serviceWorker:false,remote:remote||null};

    remote=remote||await fetchRemote().catch(function(){return localInfo;});
    var targetBuild=buildOf(remote);
    var script='./service-worker.js?build='+encodeURIComponent(targetBuild)+'&update='+Date.now();
    var controllerWait=waitControllerChange(Number(opts.controllerTimeout||14000));
    var reg=await navigator.serviceWorker.register(script,{scope:'./',updateViaCache:'none'});

    try{await reg.update();}catch(e){}
    var worker=reg.installing||reg.waiting;
    if(worker&&worker.state==='installing')await waitWorkerState(worker,14000);
    reg=await navigator.serviceWorker.getRegistration('./').catch(function(){return reg;})||reg;

    if(reg.waiting){
      try{reg.waiting.postMessage({type:'SKIP_WAITING',build:targetBuild});}catch(e){}
    }else if(reg.installing){
      await waitWorkerState(reg.installing,8000);
      if(reg.waiting)try{reg.waiting.postMessage({type:'SKIP_WAITING',build:targetBuild});}catch(e){}
    }

    var changed=await controllerWait;
    reg=await navigator.serviceWorker.getRegistration('./').catch(function(){return reg;})||reg;
    try{if(reg.active)reg.active.postMessage({type:'WARM_CACHE',build:targetBuild});}catch(e){}
    if(changed||!navigator.serviceWorker.controller){
      await clearOldCaches(expectedCache(remote));
      try{if(reg.active)reg.active.postMessage({type:'CLEAR_OLD_CACHES',build:targetBuild});}catch(e){}
    }

    try{
      localStorage.setItem('mesaha_expected_build',String(targetBuild));
      localStorage.setItem('mesaha_update_completed_at',String(Date.now()));
    }catch(e){}
    return {ok:true,serviceWorker:true,controllerChanged:changed,remote:remote,targetBuild:targetBuild};
  }

  async function repair(){
    var remote=await fetchRemote().catch(function(){return localInfo;});
    return await installLatest(remote,{controllerTimeout:9000});
  }

  function updatePageUrl(remote){
    var build=buildOf(remote);
    var u=new URL('./guncelle.html',location.href);
    u.searchParams.set('targetBuild',String(build));
    u.searchParams.set('fresh',String(Date.now()));
    return u.href;
  }

  async function updateAndReload(opts){
    opts=opts||{};
    await flushData();
    var remote=opts.remote||await fetchRemote();
    try{sessionStorage.setItem('mesaha_pending_remote',JSON.stringify(remote));}catch(e){}
    // Güncelleme özel sayfada tamamlanır; bu sayfa eski worker kontrolünden çıkışı güvenilir hale getirir.
    location.replace(updatePageUrl(remote));
    return {ok:true,redirecting:true,remote:remote};
  }

  async function executeUpdatePage(){
    var remote=null;
    try{remote=JSON.parse(sessionStorage.getItem('mesaha_pending_remote')||'null');}catch(e){}
    var live=await fetchRemote().catch(function(){return null;});
    if(live&&buildOf(live)>=buildOf(remote))remote=live;
    remote=remote||live||localInfo;
    var result=await installLatest(remote,{controllerTimeout:15000});
    await wait(250);
    return result;
  }

  async function check(){
    var remote=await fetchRemote();
    var newer=window.MesahaVersion&&typeof window.MesahaVersion.isNewer==='function'?window.MesahaVersion.isNewer(remote):buildOf(remote)>localBuild;
    return {remote:remote,newer:!!newer};
  }

  var api={
    apiVersion:API_VERSION,
    repair:repair,
    clearOldCaches:clearOldCaches,
    updateAndReload:updateAndReload,
    executeUpdatePage:executeUpdatePage,
    installLatest:installLatest,
    check:check,
    fetchRemote:fetchRemote,
    flushData:flushData
  };
  window.MesahaUpdateV527=api;
  window.MesahaUpdateV537=api;

  if(window.__mesahaSafeResetRequested){
    setTimeout(function(){repair().then(function(){location.replace('./index.html?repaired='+Date.now());}).catch(function(){location.replace('./index.html?repaired='+Date.now());});},40);
  }
})();
