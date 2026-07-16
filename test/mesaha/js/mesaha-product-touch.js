/* Mesaha İO V5.77 — iPhone ürün kısayollarında klavyeyi açık tutan dokunma köprüsü. */
(function(){
  'use strict';
  if(window.__mesahaProductTouchV577)return;
  window.__mesahaProductTouchV577=true;
  window.__mesahaProductTouchV576=true;
  window.__mesahaProductTouchV542=true;
  window.__mesahaProductTouchV540=true;

  var ua=navigator.userAgent||'';
  var isIOS=/iPad|iPhone|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  var usePointer=isIOS&&!!window.PointerEvent;
  var lastHandledAt=0,lastHandledKey='',gesture=null,lastFocus=null,moveLimit=14;
  var PRODUCT={
    'Tomruk':{cls:'tomruk',rule:'Tomruk: çap 21 ve üzeri olmalı.'},
    'Maden Direk':{cls:'maden',rule:'Maden: çap 20 ve altı olmalı.'},
    'Kağıtlık':{cls:'kagit',rule:'Kağıtlık: özel çap kilidi yok.'},
    'Sanayi Odunu':{cls:'sanayi',rule:'Sanayi: çap en az 12, boy 0,50 - 1,45 m olmalı.'},
    'Tel Direk':{cls:'tel',rule:'Tel: çap 12 - 40, boy 6,5 - 25 m olmalı.'}
  };

  function clean(v){return String(v==null?'':v).trim();}
  function normalize(v){
    var x=clean(v).toLocaleLowerCase('tr-TR');
    if(x==='tomruk')return'Tomruk';
    if(x==='maden'||x==='maden direk'||x==='maden direği'||x==='maden diregi')return'Maden Direk';
    if(x==='kağıtlık'||x==='kagitlik'||x==='kağıtlık odun'||x==='kagitlik odun')return'Kağıtlık';
    if(x==='sanayi'||x==='sanayi odunu')return'Sanayi Odunu';
    if(x==='tel'||x==='tel direk'||x==='tel direği'||x==='tel diregi')return'Tel Direk';
    return PRODUCT[v]?v:'Tomruk';
  }
  function buttonFrom(t){return t&&t.closest?t.closest('[data-product]'):null;}
  function appState(){return window.state&&window.state.settings?window.state:null;}
  function validEntryInput(input){
    return !!(input&&!input.disabled&&!input.readOnly&&/^(diameterInput|lengthInput|barcodeInput|quantityInput)$/.test(input.id));
  }
  function captureFocus(){
    var input=document.activeElement;
    if(!validEntryInput(input))return null;
    var snap={input:input,start:null,end:null,direction:null};
    try{snap.start=input.selectionStart;snap.end=input.selectionEnd;snap.direction=input.selectionDirection;}catch(e){}
    lastFocus=snap;
    return snap;
  }
  function restoreFocus(snap){
    snap=snap||lastFocus;
    if(!snap||!validEntryInput(snap.input)||!document.documentElement.contains(snap.input))return;
    var run=function(){
      try{snap.input.focus({preventScroll:true});}catch(e){try{snap.input.focus();}catch(_e){}}
      if(snap.start!=null){try{snap.input.setSelectionRange(snap.start,snap.end,snap.direction||'none');}catch(e){}}
    };
    run();
    requestAnimationFrame(run);
  }
  function stop(ev){
    try{
      if(ev&&ev.cancelable)ev.preventDefault();
      if(ev){ev.stopPropagation();ev.stopImmediatePropagation();}
    }catch(e){}
  }
  function updateVisual(key){
    var grid=document.getElementById('productButtons');
    if(grid)grid.querySelectorAll('[data-product]').forEach(function(btn){
      var active=normalize(btn.getAttribute('data-product'))===key;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',active?'true':'false');
      btn.setAttribute('tabindex','-1');
    });
    var hint=document.getElementById('productRuleHint');
    if(hint)hint.textContent=PRODUCT[key].rule;
    var body=document.body;
    if(body){
      ['tomruk','maden','kagit','sanayi','tel'].forEach(function(cls){body.classList.remove('product-'+cls+'-active');});
      body.classList.add('product-'+PRODUCT[key].cls+'-active');
    }
  }
  function persist(){
    try{
      if(typeof window.saveSettings==='function')window.saveSettings();
      else if(typeof window.__flushSettings==='function')window.__flushSettings('product-select');
    }catch(e){}
  }
  function applyProduct(raw,source){
    var key=normalize(raw),state=appState();
    if(!state||!PRODUCT[key])return false;
    var time=Date.now();
    if(lastHandledKey===key&&time-lastHandledAt<300)return true;
    lastHandledKey=key;
    lastHandledAt=time;
    state.settings.currentProduct=key;
    updateVisual(key);
    persist();
    try{window.dispatchEvent(new CustomEvent('mesaha:product-selected',{detail:{product:key,source:source||'tap'}}));}catch(e){}
    return true;
  }
  function finishGesture(ev,id){
    var current=gesture;
    gesture=null;
    var button=buttonFrom(ev&&ev.target);
    if(!current||(id!=null&&current.id!==id)||current.moved||button!==current.btn)return;
    if(applyProduct(button.getAttribute('data-product'),current.source)){
      stop(ev);
      restoreFocus(current.focus);
    }
  }
  function bind(){
    var grid=document.getElementById('productButtons');
    if(!grid||grid.__productTouchV577)return;
    grid.__productTouchV577=true;
    grid.querySelectorAll('[data-product]').forEach(function(btn){btn.setAttribute('tabindex','-1');});
    if(!isIOS)return;

    if(usePointer){
      grid.addEventListener('pointerdown',function(ev){
        if(ev.pointerType==='mouse')return;
        var button=buttonFrom(ev.target),focus=button?captureFocus():null;
        gesture=button?{id:ev.pointerId,btn:button,x:ev.clientX,y:ev.clientY,moved:false,focus:focus,source:'ios-pointerup'}:null;
        /* iOS'ta düğmenin odağı almasını engeller; açık klavye kapanmaz. */
        if(button&&focus&&ev.cancelable)ev.preventDefault();
      },{capture:true,passive:false});
      grid.addEventListener('pointermove',function(ev){
        if(gesture&&gesture.id===ev.pointerId&&(Math.abs(ev.clientX-gesture.x)>moveLimit||Math.abs(ev.clientY-gesture.y)>moveLimit))gesture.moved=true;
      },{capture:true,passive:true});
      grid.addEventListener('pointercancel',function(){gesture=null;},{capture:true,passive:true});
      grid.addEventListener('pointerup',function(ev){finishGesture(ev,ev.pointerId);},{capture:true,passive:false});
    }else{
      grid.addEventListener('touchstart',function(ev){
        var button=buttonFrom(ev.target),touch=ev.touches&&ev.touches[0],focus=button?captureFocus():null;
        gesture=button&&touch?{btn:button,x:touch.clientX,y:touch.clientY,moved:false,focus:focus,source:'ios-touchend'}:null;
        if(button&&focus&&ev.cancelable)ev.preventDefault();
      },{capture:true,passive:false});
      grid.addEventListener('touchmove',function(ev){
        var touch=ev.touches&&ev.touches[0];
        if(gesture&&touch&&(Math.abs(touch.clientX-gesture.x)>moveLimit||Math.abs(touch.clientY-gesture.y)>moveLimit))gesture.moved=true;
      },{capture:true,passive:true});
      grid.addEventListener('touchcancel',function(){gesture=null;},{capture:true,passive:true});
      grid.addEventListener('touchend',function(ev){finishGesture(ev,null);},{capture:true,passive:false});
    }

    grid.addEventListener('click',function(ev){
      var button=buttonFrom(ev.target);
      if(!button)return;
      var key=normalize(button.getAttribute('data-product'));
      if(lastHandledKey===key&&Date.now()-lastHandledAt<1000){
        stop(ev);
        restoreFocus(lastFocus);
      }
    },{capture:true,passive:false});
  }
  function boot(){
    bind();
    var state=appState();
    if(state)updateVisual(normalize(state.settings.currentProduct));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('pageshow',boot,{passive:true});
  window.MesahaProductTouchV577=window.MesahaProductTouchV576=window.MesahaProductTouchV542=window.MesahaProductTouchV540={
    apply:applyProduct,refresh:boot,isIOS:isIOS,mode:isIOS?(usePointer?'pointer':'touch'):'native-click',restoreFocus:restoreFocus
  };
})();
