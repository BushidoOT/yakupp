/* Mesaha İO v169 Modüler Stabil - app-19.js */
(function(){
  'use strict';
  var VERSION='Mesaha İO v1.98';
  function safe(fn){ try{return fn();}catch(e){} }
  function apply(){
    safe(function(){ document.title=VERSION; });
    safe(function(){ var h=document.querySelector('.brand h1'); if(h) h.textContent=VERSION; });
    safe(function(){
      document.querySelectorAll('button, a, .chip, .nav-item, .seg-btn, .bottom-nav button').forEach(function(el){
        if ((el.textContent||'').trim()==='↩ Normal' || (el.textContent||'').trim()==='Normal') { el.textContent='🏠 Ana Sayfaya Dön'; }
      });
    });
    safe(function(){ window.MESAHA_RECORDS_PAGE_SIZE=20; });
    safe(function(){ window.MESAHA_BUILD_INFO=Object.assign({}, window.MESAHA_BUILD_INFO||{}, {fileVersion:'v155', visibleVersion:VERSION, leakFix:true, recordsPageSize:20}); });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', apply, {once:true}); else apply();
  [100,400,1200,2500].forEach(function(ms){ setTimeout(apply, ms); });
})();
