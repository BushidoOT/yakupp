/* Mesaha İO V5.38 — iPhone gezinme ve ölçü alanı odak köprüsü. */
(function(){
  'use strict';
  if(window.__mesahaIosTouchV538) return;
  window.__mesahaIosTouchV538 = true;

  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if(!isIOS) return;

  var lastActionAt = 0;
  var lastScrollAt = 0;
  var touchState = null;
  var bootTimer = 0;

  function byId(id){ return document.getElementById(id); }
  function now(){ return Date.now(); }
  function currentY(){ return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0; }
  function stopMomentum(){
    try{
      var y = currentY();
      window.scrollTo(0, y);
    }catch(e){}
  }
  function inputFromTarget(target){
    if(!target) return null;
    var input = target.closest && target.closest('#diameterInput,#lengthInput,#barcodeInput,#quantityInput');
    if(input) return input;
    var label = target.closest && target.closest('#entryView label');
    if(!label) return null;
    return label.querySelector('#diameterInput,#lengthInput,#barcodeInput,#quantityInput');
  }
  function validInput(input){
    return !!(input && !input.disabled && !input.readOnly && /^(diameterInput|lengthInput|barcodeInput|quantityInput)$/.test(input.id));
  }
  function focusInput(input){
    if(!validInput(input)) return;
    /* iOS momentum kaydırmada ilk dokunuşu yalnız kaydırmayı durdurmak için tüketebilir. */
    if(now() - lastScrollAt < 650) stopMomentum();
    try{ input.focus({preventScroll:true}); }catch(e){ try{ input.focus(); }catch(_){} }
    try{
      if(input.id === 'barcodeInput' && input.setSelectionRange){
        var p = String(input.value || '').length;
        input.setSelectionRange(p,p);
      }
    }catch(e){}
    try{
      if(window.MesahaV537 && typeof window.MesahaV537.syncFloatingSave === 'function'){
        window.MesahaV537.syncFloatingSave();
      }
    }catch(e){}
    requestAnimationFrame(function(){
      if(document.activeElement !== input){
        try{ input.focus({preventScroll:true}); }catch(e){ try{ input.focus(); }catch(_){} }
      }
    });
  }
  function cleanKeyboardClasses(){
    var body = document.body, html = document.documentElement;
    ['keyboard-open-v311','mesaha-entry-keyboard-open','mesaha-floating-save-open-v537','typing'].forEach(function(c){
      try{ body && body.classList.remove(c); html && html.classList.remove(c); }catch(e){}
    });
    try{ html.style.setProperty('--mesaha-kb-bottom-v537','0px'); }catch(e){}
  }
  function hardHome(){
    try{
      var active = document.activeElement;
      if(active && typeof active.blur === 'function') active.blur();
    }catch(e){}
    cleanKeyboardClasses();
    try{
      if(typeof window.showView === 'function') window.showView('home');
    }catch(e){}
    try{
      if(window.state) window.state.view = 'home';
      ['home','entry','records','seflikFolder','guide','settings'].forEach(function(v){
        var el = byId(v+'View');
        if(el) el.classList.toggle('active',v==='home');
      });
      document.body.classList.remove('entry-open');
      document.querySelectorAll('#bottomNav [data-nav]').forEach(function(b){
        b.classList.toggle('active',b.getAttribute('data-nav')==='home');
      });
      window.scrollTo(0,0);
    }catch(e){}
    setTimeout(function(){
      try{
        var home = byId('homeView');
        if(home && !home.classList.contains('active')){
          home.classList.add('active');
          var entry = byId('entryView'); if(entry) entry.classList.remove('active');
        }
        window.scrollTo(0,0);
      }catch(e){}
    },60);
  }
  function activateHome(ev){
    var t = now();
    if(t-lastActionAt < 500) return false;
    lastActionAt = t;
    if(ev){
      try{ if(ev.cancelable) ev.preventDefault(); }catch(e){}
      try{ ev.stopPropagation(); ev.stopImmediatePropagation(); }catch(e){}
    }
    hardHome();
    return false;
  }
  function replaceAndBindHome(){
    var old = byId('entryHomeBtn');
    if(!old || old.__v538Bound) return;
    var btn = old.cloneNode(true);
    btn.__v538Bound = true;
    btn.__v453OfflineFallback = true;
    old.parentNode.replaceChild(btn,old);

    var start = null;
    btn.addEventListener('touchstart',function(ev){
      var t=ev.touches&&ev.touches[0];
      start=t?{x:t.clientX,y:t.clientY}:null;
    },{passive:true,capture:true});
    btn.addEventListener('touchmove',function(ev){
      if(!start)return;
      var t=ev.touches&&ev.touches[0];
      if(t&&(Math.abs(t.clientX-start.x)>10||Math.abs(t.clientY-start.y)>10)) start.moved=true;
    },{passive:true,capture:true});
    btn.addEventListener('touchend',function(ev){
      if(start&&start.moved){start=null;return;}
      start=null;activateHome(ev);
    },{passive:false,capture:true});
    btn.addEventListener('pointerup',function(ev){
      if(ev.pointerType && ev.pointerType!=='touch' && ev.pointerType!=='pen') return;
      activateHome(ev);
    },{passive:false,capture:true});
    btn.addEventListener('click',activateHome,{passive:false,capture:true});
  }
  function bindInputBridge(){
    var entry = byId('entryView');
    if(!entry || entry.__v538InputBridge) return;
    entry.__v538InputBridge = true;

    entry.addEventListener('touchstart',function(ev){
      var input=inputFromTarget(ev.target); if(!validInput(input)){touchState=null;return;}
      var t=ev.touches&&ev.touches[0];
      touchState=t?{input:input,x:t.clientX,y:t.clientY,moved:false}:null;
    },{passive:true,capture:true});
    entry.addEventListener('touchmove',function(ev){
      if(!touchState)return;
      var t=ev.touches&&ev.touches[0];
      if(t&&(Math.abs(t.clientX-touchState.x)>9||Math.abs(t.clientY-touchState.y)>9)) touchState.moved=true;
    },{passive:true,capture:true});
    entry.addEventListener('touchend',function(){
      var s=touchState; touchState=null;
      if(!s||s.moved||!validInput(s.input)) return;
      focusInput(s.input);
    },{passive:true,capture:true});
    entry.addEventListener('pointerup',function(ev){
      if(ev.pointerType && ev.pointerType!=='touch' && ev.pointerType!=='pen') return;
      var input=inputFromTarget(ev.target);
      if(validInput(input)) focusInput(input);
    },{passive:true,capture:true});
    entry.addEventListener('click',function(ev){
      var input=inputFromTarget(ev.target);
      if(validInput(input) && document.activeElement!==input) focusInput(input);
    },{passive:true,capture:true});
  }
  function markInputs(){
    ['diameterInput','lengthInput','barcodeInput','quantityInput'].forEach(function(id){
      var el=byId(id); if(!el)return;
      el.classList.add('mesaha-ios-focus-v538');
      el.setAttribute('data-ios-focus-v538','1');
    });
  }
  function boot(){
    clearTimeout(bootTimer);
    replaceAndBindHome();
    bindInputBridge();
    markInputs();
  }

  window.addEventListener('scroll',function(){lastScrollAt=now();},{passive:true});
  window.addEventListener('touchmove',function(){lastScrollAt=now();},{passive:true});
  window.addEventListener('pageshow',boot,{passive:true});
  window.addEventListener('orientationchange',function(){bootTimer=setTimeout(boot,220);},{passive:true});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)bootTimer=setTimeout(boot,80);});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  [120,500,1200,2400].forEach(function(ms){setTimeout(boot,ms);});

  window.MesahaIosTouchV538={home:hardHome,focus:focusInput,boot:boot};
})();
