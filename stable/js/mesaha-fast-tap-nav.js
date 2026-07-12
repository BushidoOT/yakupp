(function(){
  'use strict';
  if(window.__mesahaFastTapNavV461) return;
  window.__mesahaFastTapNavV461 = true;

  var lastView = '';
  var lastAt = 0;
  var lastOpenAt = 0;
  var raf = window.requestAnimationFrame || function(fn){ return setTimeout(fn, 0); };

  function $(id){ return document.getElementById(id); }
  function qsa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function now(){ return Date.now ? Date.now() : (new Date()).getTime(); }

  function isTypingTarget(el){
    try{
      return !!(el && el.closest && el.closest('input, textarea, select, [contenteditable="true"]'));
    }catch(e){ return false; }
  }

  function setActiveView(view){
    try{ if(window.state) window.state.view = view; }catch(e){}
    try{ if(document.body) document.body.classList.toggle('entry-open', view === 'entry'); }catch(e){}
    ['home','entry','records','guide','settings'].forEach(function(v){
      var el = $(v + 'View');
      if(!el) return;
      var on = v === view;
      try{ el.classList.toggle('active', on); }catch(e){}
      try{ el.style.display = on ? 'block' : 'none'; }catch(e){}
    });
    qsa('#bottomNav button').forEach(function(b){
      try{ b.classList.toggle('active', b.getAttribute('data-nav') === view); }catch(e){}
    });
    try{ document.documentElement.classList.remove('scrolling-now'); }catch(e){}
    try{ if(view !== 'entry') document.body.classList.remove('mesaha-entry-keyboard-open','keyboard-open-v311','typing'); }catch(e){}
  }

  function lightRender(view){
    raf(function(){
      try{
        if(view === 'records'){
          if(window.mesahaV303 && typeof window.mesahaV303.records === 'function') window.mesahaV303.records();
          else if(typeof window.renderRecords === 'function') window.renderRecords();
        }else if(view === 'home'){
          if(typeof window.renderHome === 'function') window.renderHome();
          else if(typeof window.renderAll === 'function') window.renderAll();
        }else if(view === 'entry'){
          if(typeof window.renderEntry === 'function') window.renderEntry();
        }
      }catch(e){}
    });
  }

  function nav(view){
    if(!view) return;
    var t = now();
    if(view === lastView && t - lastAt < 220) return;
    lastView = view;
    lastAt = t;
    setActiveView(view);
    lightRender(view);
    try{ window.scrollTo({top:0, left:0, behavior:'auto'}); }catch(e){ try{ window.scrollTo(0,0); }catch(_){} }
  }

  function openEntryFast(){
    var t = now();
    if(t - lastOpenAt < 220) return;
    lastOpenAt = t;
    try{
      if(typeof window.openEntry === 'function'){
        window.openEntry();
        setTimeout(function(){
          var ev = $('entryView');
          if(ev && !ev.classList.contains('active')) setActiveView('entry');
        }, 30);
        return;
      }
    }catch(e){}
    nav('entry');
  }

  function consume(ev){
    try{ ev.preventDefault(); }catch(e){}
    try{ ev.stopPropagation(); }catch(e){}
    try{ ev.stopImmediatePropagation(); }catch(e){}
  }

  function handle(ev){
    var target = ev && ev.target;
    if(!target || !target.closest) return;
    var navBtn = target.closest('#bottomNav [data-nav]');
    if(navBtn){
      consume(ev);
      nav(navBtn.getAttribute('data-nav'));
      return;
    }
    var open = target.closest('#openEntryBtn');
    if(open){
      consume(ev);
      openEntryFast();
      return;
    }
    var home = target.closest('#entryHomeBtn');
    if(home){
      consume(ev);
      nav('home');
      return;
    }
    var settingsBack = target.closest('#settingsView .settings-title-v325 .back');
    if(settingsBack){
      consume(ev);
      nav('home');
    }
  }

  function bind(){
    if(document.__mesahaFastTapNavV461) return;
    document.__mesahaFastTapNavV461 = true;
    var opts = {capture:true, passive:false};
    ['pointerdown','touchstart','click'].forEach(function(type){
      try{ document.addEventListener(type, handle, opts); }catch(e){}
    });
    try{
      var navEl = $('bottomNav');
      if(navEl){
        navEl.style.pointerEvents = 'auto';
        navEl.style.touchAction = 'manipulation';
      }
    }catch(e){}
  }

  function installCss(){
    try{
      if($('mesaha-fast-tap-nav-style-v461')) return;
      var st = document.createElement('style');
      st.id = 'mesaha-fast-tap-nav-style-v461';
      st.textContent = '#bottomNav,#bottomNav button,#openEntryBtn,#entryHomeBtn{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;user-select:none!important;-webkit-user-select:none!important}#bottomNav{pointer-events:auto!important}#bottomNav button{cursor:pointer!important}.mesaha-fast-nav-now *{scroll-behavior:auto!important}';
      document.head.appendChild(st);
    }catch(e){}
  }

  function boot(){ installCss(); bind(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  window.addEventListener('pageshow', function(){ setTimeout(boot, 30); });
  try{ window.MesahaFastTapNavV461 = {nav:nav, openEntry:openEntryFast}; }catch(e){}
})();
