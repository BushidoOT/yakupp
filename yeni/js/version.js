(function(root){
  'use strict';
  var info = {"app": "V5.09", "version": "v509_guvenlik_hareketleri_sade", "build": 509, "visibleVersion": "V5.09 •ExelanceX•", "shortVersion": "V5.09 •ExelanceX•", "name": "Mesaha İO V5.09 •ExelanceX•", "cacheName": "mesaha-app-v509-guvenlik-hareketleri-sade", "builtAt": "2026-07-08T11:55:00+03:00", "notes": "", "assetVersion": "509", "latestVersion": "v509_guvenlik_hareketleri_sade", "latestBuild": 509, "currentBuild": 509, "minSupportedBuild": 409, "forceUpdate": true, "updateUrl": "./temizle.html", "cleanUrl": "./guncelle.html"};
  try{ Object.freeze(info); }catch(e){}
  function expose(name,value){
    try{ Object.defineProperty(root,name,{configurable:false,enumerable:true,get:function(){return value;},set:function(){}}); }
    catch(e){ try{ root[name]=value; }catch(_){} }
  }
  expose('MESAHA_VERSION', info);
  expose('MESAHA_VERSION_TEXT', info.visibleVersion);
  expose('MESAHA_VERSION_SHORT', info.shortVersion);
  expose('APP_VERSION', info.visibleVersion);
  expose('FILE_VERSION', info.version);
  function text(){ return info.visibleVersion || info.app || info.version || 'Mesaha İO'; }
  function build(){ return Number(info.build || 0) || 0; }
  function parseVersionJs(txt){
    try{
      var m = String(txt || '').match(/MESAHA_VERSION\s*=\s*(\{[\s\S]*?\})\s*;/);
      if(!m) m = String(txt || '').match(/var\s+info\s*=\s*(\{[\s\S]*?\})\s*;/);
      return m ? JSON.parse(m[1]) : null;
    }catch(e){ return null; }
  }
  function fetchRemote(){
    if(!root.fetch) return Promise.reject(new Error('fetch yok'));
    var t = Date.now();
    return root.fetch('./js/version.js?check=' + t, {cache:'no-store', headers:{'Cache-Control':'no-cache'}})
      .then(function(res){ if(!res.ok) throw new Error('version.js okunamadı'); return res.text(); })
      .then(function(txt){ var v=parseVersionJs(txt); if(!v) throw new Error('version.js parse edilemedi'); return v; })
      .catch(function(){
        return root.fetch('./version.json?check=' + t, {cache:'no-store', headers:{'Cache-Control':'no-cache'}})
          .then(function(res){ if(!res.ok) throw new Error('version.json okunamadı'); return res.json(); });
      });
  }
  function applyToDocument(doc){
    try{
      doc = doc || root.document;
      if(!doc) return;
      doc.title = info.name || ('Mesaha İO ' + text());
      var apple = doc.querySelector('meta[name="apple-mobile-web-app-title"]');
      if(apple) apple.setAttribute('content', info.app || 'Mesaha İO');
      var vt = doc.getElementById('versionText');
      if(vt) vt.textContent = info.shortVersion || text();
      var st = doc.querySelector('#startup strong');
      if(st) st.textContent = info.visibleVersion || text();
      var cards = doc.querySelectorAll ? doc.querySelectorAll('.version-card b') : [];
      for(var i=0;i<cards.length;i++){ cards[i].textContent = info.shortVersion || text(); }
      var smalls = doc.querySelectorAll ? doc.querySelectorAll('.version-card small') : [];
      for(var j=0;j<smalls.length;j++){ smalls[j].textContent = ''; }
    }catch(e){}
  }
  var api = {current:info,text:text,build:build,parseVersionJs:parseVersionJs,fetchRemote:fetchRemote,applyToDocument:applyToDocument};
  expose('MesahaVersion', api);
  try{
    if(root.document){
      var boot=function(){ applyToDocument(root.document); };
      if(root.document.readyState==='loading') root.document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
      [50,300,900,1800,4000].forEach(function(ms){ root.setTimeout(boot,ms); });
      root.setInterval(boot, 15000);
    }
  }catch(e){}
})(typeof self !== 'undefined' ? self : window);
