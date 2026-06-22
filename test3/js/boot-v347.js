(async function(){
  'use strict';
  var META={app:'V3.39',version:'v347-final-dark-version-fix',build:347,visibleVersion:'V3.39 •ExelanceX•',shortVersion:'V3.39 •ExelanceX•',name:'Mesaha İO V3.39 •ExelanceX•',cacheName:'mesaha-app-v347-final-dark-version-fix',assetVersion:'347'};
  var SOURCES=[
    'https://raw.githubusercontent.com/BushidoOT/yakupp/468d076d25553d5176d8accc95f7d0535f66c888/test3/index.html',
    'https://cdn.jsdelivr.net/gh/BushidoOT/yakupp@468d076d25553d5176d8accc95f7d0535f66c888/test3/index.html'
  ];
  function err(msg){var el=document.getElementById('err'); if(el) el.textContent=msg;}
  async function getSource(){
    var last='';
    for(var i=0;i<SOURCES.length;i++){
      try{var r=await fetch(SOURCES[i],{cache:'no-store'}); if(r.ok) return await r.text(); last='HTTP '+r.status;}catch(e){last=e&&e.message?e.message:String(e);}
    }
    throw new Error(last||'Kaynak alınamadı');
  }
  function finalFixScript(){return '<script src="./js/final-fix-v347.js?v=347"></scr'+'ipt>';}
  function patch(html){
    var meta=JSON.stringify(META);
    html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>Mesaha İO '+META.visibleVersion+'</title>');
    html=html.replace(/<meta name="theme-color" content="[^"]*"\s*\/?>/i,'<meta name="theme-color" content="#08090b" />');
    html=html.replace(/<meta name="apple-mobile-web-app-title" content="[^"]*"\s*\/?>/i,'<meta name="apple-mobile-web-app-title" content="'+META.app+'" />');
    html=html.replace(/<link rel="manifest" href="[^"]*"\s*\/?>/i,'<link rel="manifest" href="./manifest.json?v=347" />');
    html=html.replace(/const info = \{"app": "V3\.[^"]+"[\s\S]*?\};/,'const info = '+meta+';');
    html=html.replace(/var info=\{"app": "V3\.[^"]+"[\s\S]*?\};/,'var info='+meta+';');
    html=html.replace(/V3\.35 •ExelanceX•/g,META.visibleVersion).replace(/V3\.38 •ExelanceX•/g,META.visibleVersion).replace(/V3\.35/g,META.app).replace(/V3\.38/g,META.app);
    html=html.replace(/v339-olcum-filtre-onay-sesi-fix/g,META.version).replace(/v340[-\w]*/g,META.version).replace(/v341[-\w]*/g,META.version).replace(/v342[-\w]*/g,META.version).replace(/v344[-\w]*/g,META.version);
    html=html.replace(/var BUILD=\d+;/g,'var BUILD='+META.build+';').replace(/var SOUND_VERSION='\d+';/g,"var SOUND_VERSION='"+META.assetVersion+"';");
    html=html.replace(/s\.settings\s*=\s*\{\s*\.s\.settings\s*,\s*\.data\.settings\s*,\s*sameBarcodeMode\s*:\s*false\s*,\s*quantity\s*:\s*'1'\s*\}\s*;/g,"s.settings = Object.assign({}, s.settings || {}, data.settings || {}, {sameBarcodeMode:false, quantity:'1'});");
    html=html.replace(/rgba\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d{2,3})\)/g,function(_,r,g,b,a){return 'rgba('+r+','+g+','+b+','+(Number(a)/100).toFixed(2).replace('0.','.')+')';});
    if(html.indexOf('final-fix-v347.js')<0){html=html.includes('</body>')?html.replace('</body>',finalFixScript()+'\n</body>'):html+finalFixScript();}
    return html;
  }
  try{
    try{if('serviceWorker' in navigator){var regs=await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(function(r){return r.unregister();}));}}catch(e){}
    try{if('caches' in window){var keys=await caches.keys(); await Promise.all(keys.filter(function(k){return k.indexOf('mesaha-app-')===0;}).map(function(k){return caches.delete(k);}));}}catch(e){}
    try{localStorage.setItem('mesaha_last_seen_version',META.version);localStorage.setItem('mesaha_current_version',META.version);}catch(e){}
    var html=patch(await getSource());
    document.open();
    document.write(html);
    document.close();
  }catch(e){err('Yükleme hatası: '+(e&&e.message?e.message:String(e)));}
})();
