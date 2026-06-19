(function(root){
  'use strict';
  var info = {
    appName: 'v2.30',
    version: 'v202',
    build: 'v202',
    assetVersion: '202',
    visibleVersion: 'v2.30',
    shortVersion: 'v2.30',
    name: 'v2.30',
    cacheName: 'mesaha-app-v202-tree-final-fix',
    builtAt: '2026-06-19',
    notes: 'Ağaç türleri ana menüde odun türleri gibi kart/tik stiline alındı; hızlı giriş ağaç aç/kapa sabitlendi.'
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
