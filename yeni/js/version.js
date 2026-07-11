(function(root){
  'use strict';
  var info={"app":"Mesaha İO","version":"v543_yakupp","build":543,"visibleVersion":"V5.43 •Yakupp•","shortVersion":"V5.43","name":"Mesaha İO V5.43 •Yakupp•","cacheName":"mio-app-v543-yakupp","builtAt":"2026-07-11T21:15:00+03:00","notes":"Atomik service worker kurulumu, kritik dosya bütünlük kontrolü, güvenli güncelleme doğrulaması ve eski çakışan çalışma katmanlarının kontrollü sadeleştirilmesi.","assetVersion":"543","latestVersion":"v543_yakupp","latestBuild":543,"currentBuild":543,"minSupportedBuild":409,"forceUpdate":false,"updateUrl":"./guncelle.html","cleanUrl":"./temizle.html","version_id":"v543_yakupp","versionId":"v543_yakupp","id":"v543_yakupp","updated_at":"2026-07-11T21:15:00+03:00"};
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function applyToDocument(doc){
    if(!doc)return info;
    try{doc.title=info.name;}catch(e){}
    try{doc.documentElement.setAttribute('data-mesaha-build',String(info.build));doc.documentElement.setAttribute('data-mesaha-version',info.version);}catch(e){}
    try{doc.querySelectorAll('[data-version],[data-app-version]').forEach(function(el){el.textContent=info.visibleVersion;});}catch(e){}
    return info;
  }
  function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
  async function fetchOne(url,timeout,cacheMode){
    var ctrl=typeof AbortController!=='undefined'?new AbortController():null;
    var timer=ctrl?setTimeout(function(){ctrl.abort();},timeout||12000):0;
    try{
      var res=await fetch(url,{cache:cacheMode||'no-store',headers:{'Cache-Control':'no-cache, no-store, must-revalidate','Pragma':'no-cache'},signal:ctrl&&ctrl.signal});
      if(!res||!res.ok)throw new Error('Sürüm bilgisi alınamadı: '+(res&&res.status||'bağlantı'));
      var remote=await res.json();
      if(!remote||typeof remote!=='object'||!Number(remote.build||remote.latestBuild||0))throw new Error('Sürüm dosyası geçersiz');
      return remote;
    }finally{if(timer)clearTimeout(timer);}
  }
  async function fetchRemote(options){
    options=options||{};
    var base='./version.json';
    var urls=[base+'?v='+Math.floor(Date.now()/60000),base,base+'?fresh='+Date.now()];
    var last=null;
    for(var i=0;i<urls.length;i++){
      try{return await fetchOne(urls[i],i===0?12000:16000,i===1?'reload':'no-store');}
      catch(e){last=e;if(i<urls.length-1)await wait(250*(i+1));}
    }
    if(options.allowLocalFallback!==false){
      var fallback=clone(info);fallback._localFallback=true;fallback._remoteError=String(last&&last.message||last||'Sürüm sunucusuna ulaşılamadı');return fallback;
    }
    throw last||new Error('Sürüm bilgisi alınamadı');
  }
  function isNewer(remote){
    if(!remote||remote._localFallback)return false;
    var rb=Number(remote.build||remote.latestBuild||0)||0,cb=Number(info.build||0)||0;
    if(rb&&cb)return rb>cb;
    return !!(remote.version&&remote.version!==info.version);
  }
  var frozen=Object.freeze(info);
  root.MESAHA_VERSION=frozen;root.MESAHA_BUILD=info.build;root.MESAHA_VERSION_ID=info.version;root.MESAHA_VERSION_TEXT=info.visibleVersion;root.MESAHA_VERSION_SHORT=info.shortVersion;
  root.MesahaVersion={current:frozen,info:frozen,applyToDocument:applyToDocument,fetchRemote:fetchRemote,isNewer:isNewer,clone:clone};
  try{if(typeof self!=='undefined'){self.MESAHA_VERSION=frozen;self.MesahaVersion=root.MesahaVersion;}}catch(e){}
})(typeof window!=='undefined'?window:self);
