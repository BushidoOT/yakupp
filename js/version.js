(function(root){
  'use strict';
  var info = {"app": "V5.41", "version": "v541_engel_emval_cloud_fix", "build": 541, "visibleVersion": "V5.41 •ExelanceX•", "shortVersion": "V5.41 •ExelanceX•", "name": "Mesaha İO V5.41 •ExelanceX•", "cacheName": "mesaha-app-v541-engel-emval-cloud-fix", "builtAt": "2026-07-09T23:05:00+03:00", "notes": "", "assetVersion": "541", "latestVersion": "v541_engel_emval_cloud_fix", "latestBuild": 541, "currentBuild": 541, "minSupportedBuild": 409, "forceUpdate": true, "updateUrl": "./temizle.html", "cleanUrl": "./guncelle.html"};
  root.MESAHA_VERSION = info;
  root.MesahaVersion = root.MesahaVersion || {};
  root.MesahaVersion.info = info;
  root.MesahaVersion.applyToDocument = function(doc){ try{ doc.documentElement.setAttribute('data-mesaha-build', String(info.build||'')); }catch(e){} };
  root.MesahaVersion.fetchRemote = async function(){
    try{
      var url = new URL('./version.json', root.location ? root.location.href : './version.json');
      url.searchParams.set('v', String(Date.now()));
      var ctrl = new AbortController();
      var timer = setTimeout(function(){try{ctrl.abort()}catch(e){}}, 2500);
      var res = await fetch(url.href, {cache:'no-store', signal:ctrl.signal});
      clearTimeout(timer);
      if(!res || !res.ok) return info;
      var j = await res.json();
      return j && (j.build || j.version) ? j : info;
    }catch(e){ return info; }
  };
})(typeof window!=='undefined'?window:this);
