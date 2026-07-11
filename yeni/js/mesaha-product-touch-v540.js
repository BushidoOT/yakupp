/* Mesaha İO V5.40 — Tomruk/Maden/ürün türü butonları için tek dokunuş köprüsü. */
(function(){
  'use strict';
  if(window.__mesahaProductTouchV540) return;
  window.__mesahaProductTouchV540 = true;

  var lastHandledAt = 0;
  var lastHandledKey = '';
  var pointerState = null;
  var touchState = null;
  var moveLimit = 14;

  var PRODUCT = {
    'Tomruk':       {cls:'tomruk', label:'Tomruk', rule:'Tomruk: çap 21 ve üzeri olmalı.'},
    'Maden Direk':  {cls:'maden', label:'Maden', rule:'Maden: çap 20 ve altı olmalı.'},
    'Kağıtlık':     {cls:'kagit', label:'Kağıtlık', rule:'Kağıtlık: özel çap kilidi yok.'},
    'Sanayi Odunu': {cls:'sanayi', label:'Sanayi', rule:'Sanayi: çap en az 12, boy 0,50 - 1,45 m olmalı.'},
    'Tel Direk':    {cls:'tel', label:'Tel', rule:'Tel: çap 12 - 40, boy 6,5 - 25 m olmalı.'}
  };

  function clean(v){ return String(v == null ? '' : v).trim(); }
  function normalize(v){
    var x = clean(v).toLocaleLowerCase('tr-TR');
    if(x === 'tomruk') return 'Tomruk';
    if(x === 'maden' || x === 'maden direk' || x === 'maden direği' || x === 'maden diregi') return 'Maden Direk';
    if(x === 'kağıtlık' || x === 'kagitlik' || x === 'kağıtlık odun' || x === 'kagitlik odun') return 'Kağıtlık';
    if(x === 'sanayi' || x === 'sanayi odunu') return 'Sanayi Odunu';
    if(x === 'tel' || x === 'tel direk' || x === 'tel direği' || x === 'tel diregi') return 'Tel Direk';
    return PRODUCT[v] ? v : 'Tomruk';
  }
  function buttonFrom(target){
    return target && target.closest ? target.closest('#productButtons [data-product]') : null;
  }
  function state(){
    return window.state && window.state.settings ? window.state : null;
  }
  function setBodyClass(key){
    var body = document.body;
    if(!body) return;
    ['tomruk','maden','kagit','sanayi','tel'].forEach(function(c){body.classList.remove('product-'+c+'-active');});
    body.classList.add('product-'+PRODUCT[key].cls+'-active');
  }
  function updateVisual(key){
    var grid = document.getElementById('productButtons');
    if(!grid) return;
    grid.querySelectorAll('[data-product]').forEach(function(btn){
      var active = normalize(btn.getAttribute('data-product')) === key;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    var hint = document.getElementById('productRuleHint');
    if(hint) hint.textContent = PRODUCT[key].rule;
    setBodyClass(key);
  }
  function persist(settings){
    try{
      if(window.MesahaStorageV527 && typeof window.MesahaStorageV527.saveSettings === 'function'){
        Promise.resolve(window.MesahaStorageV527.saveSettings(settings,{reason:'product-select-v540'})).catch(function(){});
        return;
      }
      if(typeof window.__flushSettings === 'function'){
        Promise.resolve(window.__flushSettings('product-select-v540')).catch(function(){});
        return;
      }
      if(typeof window.saveSettings === 'function'){
        Promise.resolve(window.saveSettings()).catch(function(){});
      }
    }catch(e){}
  }
  function applyProduct(raw, source){
    var key = normalize(raw);
    var s = state();
    if(!s || !PRODUCT[key]) return false;

    var now = Date.now();
    if(lastHandledKey === key && now - lastHandledAt < 260) return true;
    lastHandledKey = key;
    lastHandledAt = now;

    s.settings.currentProduct = key;
    updateVisual(key);
    persist(s.settings);
    try{ document.body.classList.remove('product-tap-lock-v372'); }catch(e){}
    try{ if(navigator.vibrate) navigator.vibrate(25); }catch(e){}
    try{ window.dispatchEvent(new CustomEvent('mesaha:product-selected',{detail:{product:key,source:source||'tap'}})); }catch(e){}
    return true;
  }
  function stop(ev){
    try{ if(ev && ev.cancelable) ev.preventDefault(); }catch(e){}
    try{ ev && ev.stopPropagation(); }catch(e){}
    try{ ev && ev.stopImmediatePropagation(); }catch(e){}
  }
  function moved(a,b){
    return !a || !b || Math.abs(a.x-b.x)>moveLimit || Math.abs(a.y-b.y)>moveLimit;
  }

  document.addEventListener('pointerdown',function(ev){
    var btn=buttonFrom(ev.target); if(!btn) return;
    pointerState={id:ev.pointerId,btn:btn,x:ev.clientX,y:ev.clientY,moved:false};
  },true);
  document.addEventListener('pointermove',function(ev){
    if(!pointerState || pointerState.id!==ev.pointerId) return;
    if(Math.abs(ev.clientX-pointerState.x)>moveLimit || Math.abs(ev.clientY-pointerState.y)>moveLimit) pointerState.moved=true;
  },true);
  document.addEventListener('pointercancel',function(){pointerState=null;},true);
  document.addEventListener('pointerup',function(ev){
    var btn=buttonFrom(ev.target), st=pointerState; pointerState=null;
    if(!btn || !st || st.id!==ev.pointerId || st.moved || st.btn!==btn) return;
    if(applyProduct(btn.getAttribute('data-product'),'pointerup')) stop(ev);
  },{capture:true,passive:false});

  document.addEventListener('touchstart',function(ev){
    var btn=buttonFrom(ev.target), t=ev.touches&&ev.touches[0];
    if(!btn || !t){touchState=null;return;}
    touchState={btn:btn,x:t.clientX,y:t.clientY,moved:false};
  },{capture:true,passive:true});
  document.addEventListener('touchmove',function(ev){
    var t=ev.touches&&ev.touches[0];
    if(!touchState || !t) return;
    if(Math.abs(t.clientX-touchState.x)>moveLimit || Math.abs(t.clientY-touchState.y)>moveLimit) touchState.moved=true;
  },{capture:true,passive:true});
  document.addEventListener('touchcancel',function(){touchState=null;},true);
  document.addEventListener('touchend',function(ev){
    var btn=buttonFrom(ev.target), st=touchState; touchState=null;
    if(!btn || !st || st.moved || st.btn!==btn) return;
    if(Date.now()-lastHandledAt<180 && lastHandledKey===normalize(btn.getAttribute('data-product'))){stop(ev);return;}
    if(applyProduct(btn.getAttribute('data-product'),'touchend')) stop(ev);
  },{capture:true,passive:false});

  document.addEventListener('click',function(ev){
    var btn=buttonFrom(ev.target); if(!btn) return;
    var key=normalize(btn.getAttribute('data-product'));
    if(Date.now()-lastHandledAt<700 && lastHandledKey===key){stop(ev);return;}
    if(applyProduct(key,'click')) stop(ev);
  },{capture:true,passive:false});

  function injectStyle(){
    if(document.getElementById('mesaha-product-touch-v540-style')) return;
    var style=document.createElement('style');
    style.id='mesaha-product-touch-v540-style';
    style.textContent='#entryView #productButtons{position:relative!important;z-index:90!important;pointer-events:auto!important;isolation:isolate!important}#entryView #productButtons .product-btn{position:relative!important;z-index:2!important;pointer-events:auto!important;touch-action:manipulation!important;-webkit-user-select:none!important;user-select:none!important}#entryView #productButtons .product-btn::before,#entryView #productButtons .product-btn::after{pointer-events:none!important}';
    document.head.appendChild(style);
  }
  function boot(){ injectStyle(); var s=state(); if(s) updateVisual(normalize(s.settings.currentProduct)); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  window.addEventListener('pageshow',boot,{passive:true});
  window.MesahaProductTouchV540={apply:applyProduct,refresh:boot};
})();
