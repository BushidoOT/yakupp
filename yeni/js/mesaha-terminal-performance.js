(function(){
  'use strict';
  if(window.__mesahaTerminalPerformanceV462) return;
  window.__mesahaTerminalPerformanceV462 = true;

  var ua = '';
  try{ ua = navigator.userAgent || ''; }catch(e){}
  var isAndroid = /Android/i.test(ua);
  var isHytera = /PNC560|Hytera|PNC/i.test(ua);
  var isTerminal = isHytera || (isAndroid && /Chrome\/1(3|4|5)\d/i.test(ua));
  var enabled = isTerminal;
  try{
    if(localStorage.getItem('mesaha_terminal_lite') === '1') enabled = true;
    if(localStorage.getItem('mesaha_terminal_lite') === '0') enabled = false;
  }catch(e){}
  if(!enabled) return;

  function addClass(){
    try{ document.documentElement.classList.add('mesaha-terminal-lite'); }catch(e){}
    try{ document.body && document.body.classList.add('mesaha-terminal-lite'); }catch(e){}
  }

  function addStyle(){
    try{
      if(document.getElementById('mesaha-terminal-lite-style-v462')) return;
      var st=document.createElement('style');
      st.id='mesaha-terminal-lite-style-v462';
      st.textContent = [
        'html.mesaha-terminal-lite *,body.mesaha-terminal-lite *{scroll-behavior:auto!important}',
        'html.mesaha-terminal-lite .card,html.mesaha-terminal-lite .hero-card,html.mesaha-terminal-lite .status-card,html.mesaha-terminal-lite .record-card,html.mesaha-terminal-lite .bottom-nav,html.mesaha-terminal-lite button{box-shadow:none!important;filter:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}',
        'html.mesaha-terminal-lite *{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}',
        'html.mesaha-terminal-lite .hero-card,html.mesaha-terminal-lite .topbar{background-image:none!important}',
        'html.mesaha-terminal-lite #bottomNav,html.mesaha-terminal-lite #bottomNav button,html.mesaha-terminal-lite #openEntryBtn,html.mesaha-terminal-lite #entryHomeBtn{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}',
        'html.mesaha-terminal-lite .float-toast,html.mesaha-terminal-lite .toast{transition:none!important}'
      ].join('\n');
      document.head.appendChild(st);
    }catch(e){}
  }

  var navLock = 0;
  function now(){ return Date.now ? Date.now() : (new Date()).getTime(); }
  function protectRapidNav(fn){
    return function(){
      var t = now();
      if(t - navLock < 110) return;
      navLock = t;
      return fn.apply(this, arguments);
    };
  }

  function patchRenderBursts(){
    try{
      if(window.__mesahaTerminalRenderPatchV462) return;
      window.__mesahaTerminalRenderPatchV462 = true;
      var lastAll=0, lastRecords=0;
      if(typeof window.renderAll === 'function'){
        var oldAll = window.renderAll;
        window.renderAll = function(){
          var t=now();
          if(t-lastAll<140) return;
          lastAll=t;
          return oldAll.apply(this, arguments);
        };
      }
      if(typeof window.renderRecords === 'function'){
        var oldRecords = window.renderRecords;
        window.renderRecords = function(){
          var t=now();
          if(t-lastRecords<120) return;
          lastRecords=t;
          return oldRecords.apply(this, arguments);
        };
      }
      if(window.mesahaV303 && typeof window.mesahaV303.records === 'function' && !window.mesahaV303.__terminalPatchedV462){
        var r = window.mesahaV303.records;
        window.mesahaV303.records = function(){
          var t=now();
          if(t-lastRecords<120) return;
          lastRecords=t;
          return r.apply(this, arguments);
        };
        window.mesahaV303.__terminalPatchedV462 = true;
      }
      if(window.MesahaFastTapNavV461 && typeof window.MesahaFastTapNavV461.nav === 'function' && !window.MesahaFastTapNavV461.__terminalPatchedV462){
        window.MesahaFastTapNavV461.nav = protectRapidNav(window.MesahaFastTapNavV461.nav);
        window.MesahaFastTapNavV461.__terminalPatchedV462 = true;
      }
    }catch(e){}
  }

  function keepLight(){
    addClass();
    patchRenderBursts();
  }

  function boot(){
    addClass();
    addStyle();
    patchRenderBursts();
    try{ localStorage.setItem('mesaha_terminal_lite_active','1'); }catch(e){}
    [250,800,1800,4000].forEach(function(ms){ setTimeout(keepLight, ms); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  window.addEventListener('pageshow', function(){ setTimeout(boot, 60); }, {passive:true});
  try{ window.MesahaTerminalPerformanceV462 = {active:true, enabled:enabled, userAgent:ua}; }catch(e){}
})();
