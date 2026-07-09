(function(root){
  'use strict';
  var info = {"app": "V5.32", "version": "v532_admin_app_detay_destek_duyuru", "build": 532, "visibleVersion": "V5.32 •ExelanceX•", "shortVersion": "V5.32 •ExelanceX•", "name": "Mesaha İO V5.32 •ExelanceX•", "cacheName": "mesaha-app-v532-admin-app-detay-destek-duyuru", "builtAt": "2026-07-09T17:55:00+03:00", "notes": "", "assetVersion": "532", "latestVersion": "v532_admin_app_detay_destek_duyuru", "latestBuild": 532, "currentBuild": 532, "minSupportedBuild": 409, "forceUpdate": true, "updateUrl": "./temizle.html", "cleanUrl": "./guncelle.html"};
  root.MESAHA_VERSION = info;
  root.MesahaVersion = root.MesahaVersion || {};
  root.MesahaVersion.info = info;
  root.MesahaVersion.applyToDocument = function(doc){ try{ doc.documentElement.setAttribute('data-mesaha-build', String(info.build||'')); }catch(e){} };
})(typeof window!=='undefined'?window:this);
