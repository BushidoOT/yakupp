(function(){
  'use strict';
  var META={app:'V3.39',version:'v347-final-dark-version-fix',build:347,visibleVersion:'V3.39 •ExelanceX•',shortVersion:'V3.39 •ExelanceX•',name:'Mesaha İO V3.39 •ExelanceX•',cacheName:'mesaha-app-v347-final-dark-version-fix',assetVersion:'347'};
  var SETTINGS_KEY='cam_mesaha_ayarlar_v1', THEME_KEY='mesaha_theme_v342';
  function $(id){return document.getElementById(id);}
  function all(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel));}
  function saveTheme(mode){
    try{localStorage.setItem(THEME_KEY,mode);}catch(e){}
    try{var s=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');s.theme=mode;localStorage.setItem(SETTINGS_KEY,JSON.stringify(s));}catch(e){}
    try{if(window.state&&window.state.settings)window.state.settings.theme=mode;}catch(e){}
  }
  function readTheme(){
    try{var a=localStorage.getItem(THEME_KEY); if(a==='dark'||a==='light') return a;}catch(e){}
    try{var s=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'); if(s.theme==='dark'||s.theme==='light') return s.theme;}catch(e){}
    try{var ws=window.state&&window.state.settings&&window.state.settings.theme; if(ws==='dark'||ws==='light') return ws;}catch(e){}
    return document.body.classList.contains('dark')?'dark':'light';
  }
  function applyTheme(mode){
    var dark=mode==='dark';
    document.body.classList.toggle('dark',dark);
    saveTheme(dark?'dark':'light');
    setThemeIcon();
  }
  function setThemeIcon(){
    var b=$('themeBtn'); if(!b) return;
    var dark=document.body.classList.contains('dark');
    b.textContent=dark?'☀':'🌙';
    b.title=dark?'Aydınlık moda geç':'Karanlık moda geç';
    b.setAttribute('aria-label',b.title);
  }
  function bindThemeButton(){
    var top=document.querySelector('.topbar,header,.hero,.entry-top')||document.body;
    var b=$('themeBtn');
    if(!b){b=document.createElement('button');b.id='themeBtn';b.className='icon-btn';b.type='button';top.appendChild(b);}
    if(!b.__v347Bound){
      var c=b.cloneNode(true);c.__v347Bound=true;c.id='themeBtn';c.type='button';
      b.parentNode.replaceChild(c,b);b=c;
      b.addEventListener('click',function(ev){ev.preventDefault();ev.stopImmediatePropagation();applyTheme(document.body.classList.contains('dark')?'light':'dark');return false;},true);
    }
    b.style.setProperty('display','grid','important');
    b.style.setProperty('visibility','visible','important');
    b.style.setProperty('opacity','1','important');
    b.style.setProperty('pointer-events','auto','important');
    b.style.setProperty('place-items','center','important');
    setThemeIcon();
  }
  function ensureStyle(){
    if($('mesaha-v347-final-dark-css')) return;
    var css='body.dark{background:#08090b!important;color:#e5e7eb!important}body.dark .app,body.dark .wrap,body.dark main,body.dark .page{background:#08090b!important;color:#e5e7eb!important}body.dark .card,body.dark .panel,body.dark .box,body.dark .section,body.dark .modal,body.dark .sheet,body.dark .summary-card,body.dark .record-card,body.dark .glass,body.dark .info-card,body.dark .status-card,body.dark .hero-card{background:#111318!important;border-color:#2b3038!important;color:#e5e7eb!important;box-shadow:0 14px 42px rgba(0,0,0,.34)!important}body.dark .topbar,body.dark header,body.dark .bottom-nav{background:rgba(12,14,18,.96)!important;border-color:#262b33!important;color:#f3f4f6!important}body.dark input,body.dark select,body.dark textarea{background:#0d0f13!important;border-color:#303842!important;color:#f9fafb!important}body.dark button{border-color:#303842}body.dark .muted,body.dark small,body.dark .sub,body.dark .hint{color:#aeb6c2!important}body.dark table,body.dark th,body.dark td{background:#111318!important;color:#e5e7eb!important;border-color:#2b3038!important}body.dark .version-card{background:#111318!important;border-color:#2b3038!important}body.dark #themeBtn{display:grid!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;background:#15191f!important;border-color:#35404a!important;color:#f6c84c!important}';
    var st=document.createElement('style');st.id='mesaha-v347-final-dark-css';st.textContent=css;document.head.appendChild(st);
  }
  function versionFix(){
    window.MESAHA_VERSION=META;window.MESAHA_VERSION_TEXT=META.visibleVersion;window.MESAHA_VERSION_SHORT=META.shortVersion;
    try{localStorage.setItem('mesaha_last_seen_version',META.version);localStorage.setItem('mesaha_current_version',META.version);localStorage.setItem('mesaha_last_update_check',String(Date.now()));}catch(e){}
    try{document.title='Mesaha İO '+META.visibleVersion;}catch(e){}
    var apple=document.querySelector('meta[name="apple-mobile-web-app-title"]'); if(apple) apple.setAttribute('content',META.app);
    var vt=$('versionText'); if(vt) vt.textContent=META.shortVersion;
    all('.version-card b,.app-version,b,strong').forEach(function(x){var t=x.textContent||''; if(/V3\.|ExelanceX|Mesaha/.test(t)) x.textContent=META.shortVersion;});
    all('.version-card small').forEach(function(x){x.textContent='';});
  }
  function hideOldUpdate(){
    all('div,section,dialog,aside').forEach(function(x){var t=(x.textContent||'').toLowerCase(); if(t.indexOf('yeni sürüm')>=0&&t.indexOf('var')>=0&&x.offsetParent!==null){x.style.display='none';}});
  }
  function boot(){ensureStyle();versionFix();applyTheme(readTheme());bindThemeButton();hideOldUpdate();}
  boot();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  [80,250,700,1500,3000,5000].forEach(function(ms){setTimeout(boot,ms);});
  setInterval(function(){versionFix();bindThemeButton();hideOldUpdate();},2500);
})();
