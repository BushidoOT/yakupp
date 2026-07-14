/* Mesaha İO — merkezi sürüm kimlikli atomik PWA güncelleme yöneticisi */
(function(){
  'use strict';
  if(window.MESAHA_SUITE_MODE){
    function suiteWorker(){return navigator.serviceWorker&&navigator.serviceWorker.getRegistration('../')}
    async function suiteRepair(){var reg=await navigator.serviceWorker.register('../service-worker.js?v=28',{scope:'../',updateViaCache:'none'});await navigator.serviceWorker.ready;try{(reg.active||navigator.serviceWorker.controller).postMessage({type:'CACHE_ALL'})}catch(e){}return{ok:true,repaired:true,preserved:true,ready:true,build:28,integrity:'suite-v28'}}
    var suiteApi={apiVersion:547,repair:suiteRepair,clearOldCaches:async function(){return[]},updateAndReload:async function(){location.href='../';return{ok:true,redirecting:true}},executeUpdatePage:suiteRepair,installLatest:suiteRepair,check:async function(){return{remote:{version:'suite-v28',build:28},newer:false,unavailable:!navigator.onLine}},fetchRemote:async function(){return{version:'suite-v28',build:28}},flushData:async function(){},workerStatus:async function(){return{ready:true,build:28,integrity:'suite-v28',criticalCount:99}},verifiedStatus:function(st){return!!(st&&st.ready)}};
    window.MesahaUpdateV627=suiteApi;window.MesahaUpdateV637=suiteApi;return;
  }
  var previous=window.MesahaUpdateV627;
  if(previous&&Number(previous.apiVersion||0)>=546)return;
  var API_VERSION=546;
  var localInfo=window.MESAHA_VERSION||{};
  var localBuild=Number(localInfo.build||0)||0;
  var localIntegrity=String(localInfo.integrityId||'');

  function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms)})}
  function integrityOf(info){return String(info&&info.integrityId||localIntegrity||'')}
  function verifiedStatus(st,target,integrity){
    var b=Number(target||0),id=String(integrity||'');
    return !!(st&&st.ready&&Number(st.build)===b&&st.integrity==='sha256'&&Number(st.criticalCount||0)>=32&&id&&String(st.integrityId||'')===id);
  }
  function isAppCache(n){return /^(mesaha|mio)(-|_)/i.test(String(n||''))||/mesaha/i.test(String(n||''))}
  function buildOf(r){return Number(r&&((r.build||r.latestBuild))||localBuild)||localBuild}
  function expectedCache(r){return String(r&&r.cacheName||localInfo.cacheName||'')}

  async function flushData(){try{if(window.MesahaStorageV627&&window.MesahaStorageV627.flush)await window.MesahaStorageV627.flush()}catch(e){}}
  async function fetchRemote(o){
    o=o||{};
    if(window.MesahaVersion&&window.MesahaVersion.fetchRemote)return await window.MesahaVersion.fetchRemote(o);
    try{var r=await fetch('./version.json?fresh='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('Sürüm bilgisi alınamadı: '+r.status);return await r.json()}
    catch(e){if(o.allowLocalFallback!==false){var f=Object.assign({},localInfo);f._localFallback=true;f._remoteError=String(e&&e.message||e);return f}throw e}
  }
  function waitState(w,ms){return new Promise(function(resolve){if(!w)return resolve('none');if(['installed','activated','redundant'].includes(w.state))return resolve(w.state);var done=false,t=setTimeout(function(){if(!done){done=true;resolve(w.state||'timeout')}},ms||30000);w.addEventListener('statechange',function(){if(!done&&['installed','activated','redundant'].includes(w.state)){done=true;clearTimeout(t);resolve(w.state)}})})}
  function controllerChange(ms){return new Promise(function(resolve){if(!('serviceWorker'in navigator))return resolve(false);var done=false,t=setTimeout(function(){if(!done){done=true;resolve(false)}},ms||30000);function f(){if(done)return;done=true;clearTimeout(t);navigator.serviceWorker.removeEventListener('controllerchange',f);resolve(true)}navigator.serviceWorker.addEventListener('controllerchange',f)})}
  function message(worker,data,timeout){return new Promise(function(resolve,reject){if(!worker)return reject(new Error('Service worker bulunamadı'));var ch=new MessageChannel(),done=false,t=setTimeout(function(){if(!done){done=true;reject(new Error('Service worker yanıt vermedi'))}},timeout||15000);ch.port1.onmessage=function(e){if(done)return;done=true;clearTimeout(t);resolve(e.data||{})};try{worker.postMessage(data,[ch.port2])}catch(e){clearTimeout(t);reject(e)}})}
  async function workerStatus(worker,retries){var last=null;for(var i=0;i<(retries||1);i++){try{last=await message(worker,{type:'GET_STATUS'},7000);if(last&&last.ready)return last}catch(e){last={ready:false,error:String(e&&e.message||e)}}await wait(350)}return last||{ready:false}}
  async function clearOldCaches(keepBase){if(!('caches'in window))return[];var keys=await caches.keys(),deleted=[],keep=String(keepBase||'');await Promise.all(keys.map(async function(n){if(!isAppCache(n)||(keep&&n.indexOf(keep)===0))return;try{if(await caches.delete(n))deleted.push(n)}catch(e){}}));return deleted}

  async function installLatest(remote,opts){
    opts=opts||{};await flushData();
    if(!('serviceWorker'in navigator))return{ok:true,serviceWorker:false,remote:remote||null};
    remote=remote||await fetchRemote().catch(function(){return localInfo});
    var target=buildOf(remote),identity=integrityOf(remote);
    if(!identity)throw new Error('Güncelleme bütünlük kimliği bulunamadı');
    var script='./service-worker.js?build='+encodeURIComponent(target)+'&integrity='+encodeURIComponent(identity)+'&update='+Date.now();
    var current=navigator.serviceWorker.controller;
    var st=await workerStatus(current,1).catch(function(){return null});
    if(verifiedStatus(st,target,identity))return{ok:true,serviceWorker:true,alreadyActive:true,targetBuild:target,integrityId:identity,remote:remote,status:st};

    var changedPromise=controllerChange(Number(opts.controllerTimeout||30000));
    var reg=await navigator.serviceWorker.register(script,{scope:'./',updateViaCache:'none'});
    try{await reg.update()}catch(e){}
    var worker=reg.installing||reg.waiting,firstState='none';
    if(worker&&worker.state==='installing')firstState=await waitState(worker,45000);
    if(firstState==='redundant')throw new Error('Yeni sürümün kritik dosyaları tamamlanamadı');
    reg=await navigator.serviceWorker.getRegistration('./').catch(function(){return reg})||reg;
    if(reg.installing){var state=await waitState(reg.installing,30000);if(state==='redundant')throw new Error('Yeni sürümün kritik dosyaları tamamlanamadı');reg=await navigator.serviceWorker.getRegistration('./').catch(function(){return reg})||reg}
    if(reg.waiting){var prep=await workerStatus(reg.waiting,3);if(!verifiedStatus(prep,target,identity))throw new Error('Yeni sürüm önbelleği, kimliği veya dosya bütünlüğü doğrulanamadı');await message(reg.waiting,{type:'SKIP_WAITING',build:target,integrityId:identity},10000).catch(function(){return{ok:false}})}
    var changed=await changedPromise;
    reg=await navigator.serviceWorker.getRegistration('./').catch(function(){return reg})||reg;
    var active=reg.active||navigator.serviceWorker.controller;
    var status=await workerStatus(active,16);
    if(!verifiedStatus(status,target,identity))throw new Error('Yeni sürüm etkinleştirilemedi veya dosya bütünlüğü eksik bulundu');
    await clearOldCaches(expectedCache(remote));
    try{await message(active,{type:'CLEAR_OLD_CACHES',build:target,integrityId:identity},10000)}catch(e){}
    try{localStorage.setItem('mesaha_expected_build',String(target));localStorage.setItem('mesaha_expected_integrity',identity);localStorage.setItem('mesaha_update_completed_at',String(Date.now()))}catch(e){}
    return{ok:true,serviceWorker:true,controllerChanged:changed,remote:remote,targetBuild:target,integrityId:identity,status:status};
  }

  async function repair(){
    await flushData();
    if(!('serviceWorker'in navigator))return{ok:true,serviceWorker:false};
    var reg=await navigator.serviceWorker.getRegistration('./').catch(function(){return null});
    if(!reg)reg=await navigator.serviceWorker.register('./service-worker.js?build='+localBuild+'&integrity='+encodeURIComponent(localIntegrity)+'&repair='+Date.now(),{scope:'./',updateViaCache:'none'});
    try{await reg.update()}catch(e){}
    var active=reg.active||navigator.serviceWorker.controller;
    if(!active)return installLatest(localInfo,{controllerTimeout:30000});
    var before=await workerStatus(active,1).catch(function(){return null});
    if(!verifiedStatus(before,localBuild,localIntegrity))return installLatest(localInfo,{controllerTimeout:30000});
    var result=await message(active,{type:'REPAIR_CACHE',build:localBuild,integrityId:localIntegrity},35000);
    if(result&&result.ok&&verifiedStatus(result,localBuild,localIntegrity))return{ok:true,repaired:!!result.repaired,preserved:!!result.preserved,targetBuild:localBuild,integrityId:localIntegrity,status:result};
    if(result&&verifiedStatus(result,localBuild,localIntegrity))return{ok:true,repaired:false,preserved:true,targetBuild:localBuild,integrityId:localIntegrity,status:result,warning:result.error||'Mevcut sağlam önbellek korundu'};
    return installLatest(localInfo,{controllerTimeout:30000});
  }

  function updatePageUrl(r){var u=new URL('./guncelle.html',location.href);u.searchParams.set('targetBuild',String(buildOf(r)));u.searchParams.set('integrity',integrityOf(r));u.searchParams.set('fresh',String(Date.now()));return u.href}
  async function updateAndReload(o){o=o||{};await flushData();var r=o.remote||await fetchRemote({allowLocalFallback:true});try{sessionStorage.setItem('mesaha_pending_remote',JSON.stringify(r))}catch(e){}location.replace(updatePageUrl(r));return{ok:true,redirecting:true,remote:r}}
  async function executeUpdatePage(){var r=null;try{r=JSON.parse(sessionStorage.getItem('mesaha_pending_remote')||'null')}catch(e){}var live=await fetchRemote().catch(function(){return null});if(live&&!live._localFallback){var lb=buildOf(live),rb=buildOf(r);if(!r||lb>rb||(lb===rb&&integrityOf(live)===integrityOf(r))){r=live}else if(lb===rb&&integrityOf(live)!==integrityOf(r)){var lt=Date.parse(live.updated_at||live.builtAt||0)||0,rt=Date.parse(r.updated_at||r.builtAt||0)||0;if(lt>rt)r=live}}r=r||live||localInfo;var result=await installLatest(r,{controllerTimeout:35000});await wait(250);return result}
  async function check(){var r=await fetchRemote(),unavailable=!!(r&&r._localFallback),identityMismatch=!unavailable&&!!integrityOf(r)&&integrityOf(r)!==localIntegrity,newer=!unavailable&&((window.MesahaVersion&&window.MesahaVersion.isNewer?window.MesahaVersion.isNewer(r):buildOf(r)>localBuild)||identityMismatch);return{remote:r,newer:!!newer,identityMismatch:!!identityMismatch,unavailable:unavailable,error:r&&r._remoteError||''}}

  var api={apiVersion:API_VERSION,repair:repair,clearOldCaches:clearOldCaches,updateAndReload:updateAndReload,executeUpdatePage:executeUpdatePage,installLatest:installLatest,check:check,fetchRemote:fetchRemote,flushData:flushData,workerStatus:workerStatus,verifiedStatus:verifiedStatus};
  window.MesahaUpdateV627=api;window.MesahaUpdateV637=api;
  if(window.__mesahaSafeResetRequested)setTimeout(function(){repair().then(function(){location.replace('./index.html?repaired='+Date.now())}).catch(function(){location.replace('./index.html?repaired='+Date.now())})},40);
})();
