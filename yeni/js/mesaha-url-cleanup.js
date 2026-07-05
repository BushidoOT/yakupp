(function(){
  'use strict';
  var BUILD='456';
  var KEY='mesaha_url_cleanup_v456_done';
  function safeLog(oldV){
    try{
      var L=window.MesahaErrorLog || window.MesahaErrorLogV446;
      if(L && typeof L.info==='function') L.info('url-version-cleaned','old='+oldV+' new='+BUILD);
      else if(L && typeof L.add==='function') L.add({level:'info',kind:'url-version-cleaned',message:'old='+oldV+' new='+BUILD});
    }catch(e){}
  }
  function cleanWithURL(){
    var u=new URL(window.location.href);
    var oldV=u.searchParams.get('v');
    if(!oldV || oldV===BUILD) return false;
    var p=window.location.pathname || '';
    var isIndex=(!p || /\/$/.test(p) || /\/index\.html$/i.test(p));
    if(!isIndex) return false;
    u.searchParams.set('v',BUILD);
    window.history.replaceState(window.history.state || {}, document.title, u.pathname + u.search + u.hash);
    try{ localStorage.setItem('mesaha_last_url_cleanup_v456','old='+oldV+';at='+new Date().toISOString()); }catch(e){}
    if(sessionStorage.getItem(KEY)!==oldV){ sessionStorage.setItem(KEY,oldV); setTimeout(function(){safeLog(oldV);},600); }
    return true;
  }
  function cleanFallback(){
    var href=window.location.href;
    var m=href.match(/[?&]v=(\d+)/);
    if(!m || m[1]===BUILD) return false;
    var p=window.location.pathname || '';
    if(p && !/\/$/.test(p) && !/\/index\.html$/i.test(p)) return false;
    var oldV=m[1];
    var path=window.location.pathname || './index.html';
    var search=window.location.search || '';
    if(search.indexOf('?')!==0) search='?'+search;
    if(/[?&]v=\d+/.test(search)) search=search.replace(/([?&])v=\d+/, '$1v='+BUILD);
    else search+=(search?'&':'?')+'v='+BUILD;
    var next=path+search+(window.location.hash||'');
    window.history.replaceState(window.history.state || {}, document.title, next);
    try{ localStorage.setItem('mesaha_last_url_cleanup_v456','old='+oldV+';at='+(new Date()).toISOString()); }catch(e){}
    if(sessionStorage.getItem(KEY)!==oldV){ sessionStorage.setItem(KEY,oldV); setTimeout(function(){safeLog(oldV);},600); }
    return true;
  }
  try{
    if(!(window.history && window.history.replaceState)) return;
    try{ if(cleanWithURL()) return; }catch(e){}
    cleanFallback();
  }catch(e){}
})();
