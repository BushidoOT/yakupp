(function(root){
  'use strict';
  var info = {
    appName: 'Mesaha İO',
    version: 'v187',
    build: 'v187',
    assetVersion: '187',
    visibleVersion: 'Mesaha İO v2.16',
    shortVersion: 'v2.16',
    name: 'Mesaha İO v2.16',
    cacheName: 'mesaha-app-v187-giris-modu-tek-ekran',
    builtAt: '2026-06-19',
    notes: 'Yeni Kayıt ekranındaki giriş alanları kaldırıldı; barkod, çap, boy, odun türü, ağaç türü, kesimci, son 3 barkod ve Alanları Temizle Giriş Modu içine alındı. Dosya Bilgileri ana sayfada açık kart oldu. Logo yanında küçük versiyon kartı eklendi. ORBİS Excel formatına dokunulmadı.'
  };
  root.MESAHA_VERSION = info;
  root.MESAHA_VERSION_TEXT = info.visibleVersion;
  root.MESAHA_VERSION_SHORT = info.shortVersion;
  root.MESAHA_BUILD_INFO = Object.assign({}, root.MESAHA_BUILD_INFO || {}, {
    fileVersion: info.version,
    visibleVersion: info.visibleVersion,
    shortVersion: info.shortVersion,
    cacheName: info.cacheName,
    centralizedVersion: true,
    excelLocked: true,
    iosInputLagFixed: true,
    entryModeOnly: true
  });
  function applyVersionText(){
    try{
      if(root.document){
        document.title = info.visibleVersion;
        var meta = document.querySelector('meta[name="mesaha-build"]');
        if(meta) meta.setAttribute('content', info.build);
        Array.prototype.forEach.call(document.querySelectorAll('[data-app-version-short]'), function(el){ if(el && !el.hasAttribute('data-version-no-auto')) el.textContent = info.shortVersion; });
        Array.prototype.forEach.call(document.querySelectorAll('[data-app-version-build]'), function(el){ if(el && !el.hasAttribute('data-version-no-auto')) el.textContent = info.build; });
        Array.prototype.forEach.call(document.querySelectorAll('[data-app-version-text], [data-version-title]'), function(el){
          if(el && !el.hasAttribute('data-version-no-auto')) el.textContent = info.visibleVersion;
        });
        var brandH1 = document.querySelector('.app-brand-v143 .brand-copy-v143 h1');
        if(brandH1 && !brandH1.hasAttribute('data-version-no-auto')) brandH1.textContent = info.shortVersion;
        var brandSub = document.querySelector('.app-brand-v143 .brand-copy-v143 span');
        if(brandSub && !brandSub.hasAttribute('data-version-no-auto')) brandSub.textContent = info.build;
      }
    }catch(_){}
  }
  root.MESAHA_APPLY_VERSION = applyVersionText;
  if(root.document){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyVersionText, {once:true});
    else applyVersionText();
    setTimeout(applyVersionText, 250);
    setTimeout(applyVersionText, 1000);
    setTimeout(applyVersionText, 2500);
  }
})(typeof self !== 'undefined' ? self : window);
