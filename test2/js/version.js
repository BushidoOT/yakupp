(function(root){
  'use strict';
  var info = {
    appName: 'Mesaha İO',
    version: 'v190',
    build: 'v190',
    assetVersion: '190',
    visibleVersion: 'Mesaha İO v2.19 Orman Tasarım',
    shortVersion: 'v2.19',
    name: 'Mesaha İO v2.19 Orman Tasarım',
    cacheName: 'mesaha-app-v190-forest-ui',
    builtAt: '2026-06-21',
    notes: 'v189 performans paketi üzerine orman temalı modern arayüz düzeni eklendi. Odun türlerinde resim/ikon kullanılmadı; metin seçenekleri korundu. ORBİS XLS çekirdeği, kayıt veri modeli ve yedek formatı değiştirilmedi.'
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
    finalFixesV187: true,
    liteCleanupV188: true,
    performanceBuildV189: true,
    forestUiV190: true
  });
  function applyVersionText(){
    try{
      if(root.document){
        document.title = info.visibleVersion;
        var meta = document.querySelector('meta[name="mesaha-build"]');
        if(meta) meta.setAttribute('content', info.build);
        Array.prototype.forEach.call(document.querySelectorAll('[data-app-version-short]'), function(el){ if(el) el.textContent = info.shortVersion; });
        Array.prototype.forEach.call(document.querySelectorAll('[data-app-version-build]'), function(el){ if(el) el.textContent = info.build; });
        Array.prototype.forEach.call(document.querySelectorAll('[data-app-version-text], [data-version-title]'), function(el){
          if(el && !el.hasAttribute('data-version-no-auto')) el.textContent = info.visibleVersion;
        });
        var brandH1 = document.querySelector('.app-brand-v143 .brand-copy-v143 h1');
        if(brandH1 && !brandH1.hasAttribute('data-version-no-auto')) brandH1.textContent = 'Mesaha İO';
        var brandSub = document.querySelector('.app-brand-v143 .brand-copy-v143 span');
        if(brandSub && !brandSub.hasAttribute('data-version-no-auto')) brandSub.textContent = info.shortVersion;
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
