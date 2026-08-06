(function(){
  'use strict';
  function meta(){ return window.MESAHA_VERSION || {}; }
  function build(){ var m=meta(); return String(m.assetVersion || m.build || 'current'); }
  function key(){ return 'mesaha_url_cleanup_current_done'; }
  function safeLog(oldV){
    try{
      var L=window.MesahaErrorLog || window.MesahaErrorLogV446;
      var msg='old='+oldV+' build='+build();
      if(L && typeof L.add==='function') L.add('url-version-cleaned', msg, {level:'info', oldVersion:String(oldV||''), targetBuild:build()});
      else if(L && typeof L.info==='function') L.info('url-version-cleaned', {message:msg, oldVersion:String(oldV||''), targetBuild:build()});
    }catch(e){}
  }
  function clean(){
    try{
      if(!(window.history && window.history.replaceState)) return false;
      var u=new URL(window.location.href);
      var oldV=u.searchParams.get('v');
      if(!oldV) return false;
      var p=window.location.pathname || '';
      var isIndex=(!p || /\/$/.test(p) || /\/index\.html$/i.test(p));
      if(!isIndex) return false;
      u.searchParams.delete('v');
      var next=u.pathname + (u.searchParams.toString() ? '?' + u.searchParams.toString() : '') + u.hash;
      window.history.replaceState(window.history.state || {}, document.title, next);
      try{ localStorage.setItem('mesaha_last_url_cleanup_current','old='+oldV+';build='+build()+';at='+(new Date()).toISOString()); }catch(e){}
      try{ if(sessionStorage.getItem(key())!==oldV){ sessionStorage.setItem(key(),oldV); setTimeout(function(){safeLog(oldV);},600); } }catch(e){}
      return true;
    }catch(e){ return false; }
  }
  clean();
})();
