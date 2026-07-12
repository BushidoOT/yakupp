(function(){
  'use strict';
  var info={"app":"Mesaha İO","version":"v563_yakupp","build":563,"visibleVersion":"V5.63 •Yakupp•","shortVersion":"V5.63","name":"Mesaha İO V5.63 •Yakupp•","cacheName":"mio-app-v563-yakupp","integrityId":"v563-panel-logout-terminal-badge-version-ok-r1","builtAt":"2026-07-12T13:35:00+03:00","notes":"Sürüm kontrolü yerel fallback ile güvenli hale getirildi. Kullanıcı paneline çıkış yap eklendi. Terminal koduyla eşleşen cihazlar panelde ve admin ekranında ayrı belirtildi.","assetVersion":"563","latestVersion":"v563_yakupp","latestBuild":563,"currentBuild":563,"minSupportedBuild":409,"forceUpdate":false,"updateUrl":"./guncelle.html","cleanUrl":"./temizle.html","version_id":"v563_yakupp","versionId":"v563_yakupp","id":"v563_yakupp","updated_at":"2026-07-12T13:35:00+03:00"};
  function localFallback(error){
    var out=Object.assign({},info);
    out._localFallback=true;
    if(error) out._remoteError=String(error&&error.message||error);
    return out;
  }
  async function fetchRemote(opts){
    opts=opts||{};
    var urls=['./version.json?fresh='+Date.now(),'./version.json?v='+Date.now()];
    var last=null;
    for(var i=0;i<urls.length;i++){
      try{
        var r=await fetch(urls[i],{cache:'no-store',headers:{'Cache-Control':'no-cache'}});
        if(!r||!r.ok) throw new Error('Sürüm bilgisi alınamadı: '+(r&&r.status));
        var j=await r.json();
        if(j&&typeof j==='object') return j;
      }catch(e){last=e;}
    }
    if(opts.allowLocalFallback===false) throw last||new Error('Sürüm bilgisi alınamadı');
    return localFallback(last);
  }
  function isNewer(remote){
    var rb=Number(remote&&remote.build||remote&&remote.latestBuild||0)||0;
    var cb=Number(info.build||0)||0;
    return rb>cb;
  }
  function applyToDocument(doc){
    try{
      doc=doc||document;
      var display=info.visibleVersion||info.shortVersion||info.app||'Mesaha İO';
      if(doc.title) doc.title=info.name||((info.app||'Mesaha İO')+' '+display);
      var apple=doc.querySelector&&doc.querySelector('meta[name="apple-mobile-web-app-title"]');
      if(apple) apple.setAttribute('content',info.app||'Mesaha İO');
      var vt=doc.getElementById&&doc.getElementById('versionText'); if(vt) vt.textContent=display;
      Array.prototype.slice.call(doc.querySelectorAll?doc.querySelectorAll('.version-card b'):[]).forEach(function(el){el.textContent=display;});
      Array.prototype.slice.call(doc.querySelectorAll?doc.querySelectorAll('.version-card small'):[]).forEach(function(el){el.textContent='';});
    }catch(e){}
  }
  window.MESAHA_VERSION=Object.assign({},window.MESAHA_VERSION||{},info);
  window.MESAHA_APP_VERSION=info.visibleVersion;
  window.MESAHA_BUILD=info.build;
  window.MESAHA_CACHE_NAME=info.cacheName;
  window.MESAHA_ASSET_VERSION=info.assetVersion;
  window.MesahaVersion=Object.assign({},window.MesahaVersion||{},{info:info,fetchRemote:fetchRemote,isNewer:isNewer,applyToDocument:applyToDocument});
})();
