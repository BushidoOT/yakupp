(function(root){
  'use strict';
  var info = {
    appName: 'Mesaha İO',
    version: 'v184',
    build: 'v184',
    assetVersion: '184',
    visibleVersion: 'Mesaha İO v2.13',
    name: 'Mesaha İO v2.13',
    cacheName: 'mesaha-app-v184-ios-hiz-guncelleme',
    builtAt: '2026-06-19',
    notes: 'iOS kayıt girişinde ürün/çap-boy tepkisi hızlandırıldı; otomatik güncelleme penceresi ve cache yenileme düzeltildi. ORBİS Excel formatına dokunulmadı.'
  };
  root.MESAHA_VERSION = info;
  root.MESAHA_VERSION_TEXT = info.visibleVersion;
  root.MESAHA_BUILD_INFO = Object.assign({}, root.MESAHA_BUILD_INFO || {}, {
    fileVersion: info.version,
    visibleVersion: info.visibleVersion,
    cacheName: info.cacheName,
    centralizedVersion: true,
    excelLocked: true
  });
  function applyVersionText(){
    try{
      if(root.document){
        document.title = info.visibleVersion;
        var meta = document.querySelector('meta[name="mesaha-build"]');
        if(meta) meta.setAttribute('content', info.build);
        var nodes = document.querySelectorAll('[data-app-version-text], .brand-copy-v143 h1, .brand h1, [data-version-title]');
        Array.prototype.forEach.call(nodes, function(el){
          if(el && !el.hasAttribute('data-version-no-auto')) el.textContent = info.visibleVersion;
        });
      }
    }catch(_){}
  }
  root.MESAHA_APPLY_VERSION = applyVersionText;
  if(root.document){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyVersionText, {once:true});
    else applyVersionText();
    setTimeout(applyVersionText, 250);
    setTimeout(applyVersionText, 1000);
  }
})(typeof self !== 'undefined' ? self : window);
