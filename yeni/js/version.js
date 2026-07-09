(function(root){
  'use strict';
  var info = {"app": "V5.43", "version": "v543_admin_engel_cihaz_ip_fix", "build": 543, "visibleVersion": "V5.43 •ExelanceX•", "shortVersion": "V5.43 •ExelanceX•", "name": "Mesaha İO V5.43 •ExelanceX•", "cacheName": "mesaha-app-v543-admin-engel-cihaz-ip-fix", "builtAt": "2026-07-09T23:43:00+03:00", "notes": "", "assetVersion": "543", "latestVersion": "v543_admin_engel_cihaz_ip_fix", "latestBuild": 543, "currentBuild": 543, "minSupportedBuild": 409, "forceUpdate": true, "updateUrl": "./temizle.html", "cleanUrl": "./guncelle.html"};
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
