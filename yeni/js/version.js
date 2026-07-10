(function(root){
  'use strict';
  var info={"app":"Mesaha İO","version":"v537_yakupp","build":537,"visibleVersion":"V5.37 •Yakupp•","shortVersion":"V5.37","name":"Mesaha İO V5.37 •Yakupp•","cacheName":"mio-app-v537-yakupp","builtAt":"2026-07-10T19:05:00+03:00","notes":"Güncelleme tek dokunuşta tamamlanır. Kalıcı Kaydet kaldırıldı; giriş alanlarında klavye açılınca yüzen Kaydet güvenilir şekilde görünür.","assetVersion":"537","latestVersion":"v537_yakupp","latestBuild":537,"currentBuild":537,"minSupportedBuild":409,"forceUpdate":false,"updateUrl":"./guncelle.html","cleanUrl":"./temizle.html","version_id":"v537_yakupp","versionId":"v537_yakupp","id":"v537_yakupp","updated_at":"2026-07-10T19:05:00+03:00"};
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function applyToDocument(doc){
    if(!doc)return info;
    try{doc.title=info.name;}catch(e){}
    try{doc.documentElement.setAttribute('data-mesaha-build',String(info.build));doc.documentElement.setAttribute('data-mesaha-version',info.version);}catch(e){}
    try{doc.querySelectorAll('[data-version],[data-app-version]').forEach(function(el){el.textContent=info.visibleVersion;});}catch(e){}
    return info;
  }
  async function fetchRemote(){
    var url='./version.json?check='+Date.now();
    var ctrl=typeof AbortController!=='undefined'?new AbortController():null;
    var timer=ctrl?setTimeout(function(){ctrl.abort();},6500):0;
    try{
      var res=await fetch(url,{cache:'no-store',headers:{'Cache-Control':'no-cache, no-store, must-revalidate','Pragma':'no-cache'},signal:ctrl&&ctrl.signal});
      if(!res.ok)throw new Error('Sürüm bilgisi alınamadı: '+res.status);
      var remote=await res.json();
      return remote&&typeof remote==='object'?remote:null;
    }finally{if(timer)clearTimeout(timer);}
  }
  function isNewer(remote){
    if(!remote)return false;
    var rb=Number(remote.build||remote.latestBuild||0)||0,cb=Number(info.build||0)||0;
    if(rb&&cb)return rb>cb;
    return !!(remote.version&&remote.version!==info.version);
  }
  var frozen=Object.freeze(info);
  root.MESAHA_VERSION=frozen;
  root.MESAHA_BUILD=info.build;
  root.MESAHA_VERSION_ID=info.version;
  root.MESAHA_VERSION_TEXT=info.visibleVersion;
  root.MESAHA_VERSION_SHORT=info.shortVersion;
  root.MesahaVersion={current:frozen,info:frozen,applyToDocument:applyToDocument,fetchRemote:fetchRemote,isNewer:isNewer,clone:clone};
  try{if(typeof self!=='undefined'){self.MESAHA_VERSION=frozen;self.MesahaVersion=root.MesahaVersion;}}catch(e){}
})(typeof window!=='undefined'?window:self);
