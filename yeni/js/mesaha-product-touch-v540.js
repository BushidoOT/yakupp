/* Mesaha İO V5.42 — ürün türü butonları için platforma ayrılmış tek dokunuş köprüsü. */
(function(){
  'use strict';
  if(window.__mesahaProductTouchV542) return;
  window.__mesahaProductTouchV542=true;window.__mesahaProductTouchV540=true;
  var ua=navigator.userAgent||'',isIOS=/iPad|iPhone|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  var usePointer=isIOS&&!!window.PointerEvent,lastHandledAt=0,lastHandledKey='',gesture=null,moveLimit=14;
  var PRODUCT={'Tomruk':{cls:'tomruk',label:'Tomruk',rule:'Tomruk: çap 21 ve üzeri olmalı.'},'Maden Direk':{cls:'maden',label:'Maden',rule:'Maden: çap 20 ve altı olmalı.'},'Kağıtlık':{cls:'kagit',label:'Kağıtlık',rule:'Kağıtlık: özel çap kilidi yok.'},'Sanayi Odunu':{cls:'sanayi',label:'Sanayi',rule:'Sanayi: çap en az 12, boy 0,50 - 1,45 m olmalı.'},'Tel Direk':{cls:'tel',label:'Tel',rule:'Tel: çap 12 - 40, boy 6,5 - 25 m olmalı.'}};
  function clean(v){return String(v==null?'':v).trim()}
  function normalize(v){var x=clean(v).toLocaleLowerCase('tr-TR');if(x==='tomruk')return'Tomruk';if(x==='maden'||x==='maden direk'||x==='maden direği'||x==='maden diregi')return'Maden Direk';if(x==='kağıtlık'||x==='kagitlik'||x==='kağıtlık odun'||x==='kagitlik odun')return'Kağıtlık';if(x==='sanayi'||x==='sanayi odunu')return'Sanayi Odunu';if(x==='tel'||x==='tel direk'||x==='tel direği'||x==='tel diregi')return'Tel Direk';return PRODUCT[v]?v:'Tomruk'}
  function buttonFrom(t){return t&&t.closest?t.closest('#productButtons [data-product]'):null}
  function state(){return window.state&&window.state.settings?window.state:null}
  function stop(ev){try{if(ev&&ev.cancelable)ev.preventDefault()}catch(e){}try{ev&&ev.stopPropagation();ev&&ev.stopImmediatePropagation()}catch(e){}}
  function updateVisual(key){var grid=document.getElementById('productButtons');if(grid)grid.querySelectorAll('[data-product]').forEach(function(btn){var a=normalize(btn.getAttribute('data-product'))===key;btn.classList.toggle('active',a);btn.setAttribute('aria-pressed',a?'true':'false')});var h=document.getElementById('productRuleHint');if(h)h.textContent=PRODUCT[key].rule;var b=document.body;if(b){['tomruk','maden','kagit','sanayi','tel'].forEach(function(c){b.classList.remove('product-'+c+'-active')});b.classList.add('product-'+PRODUCT[key].cls+'-active')}}
  function persist(settings){try{if(typeof window.__flushSettings==='function')Promise.resolve(window.__flushSettings('product-select-v542')).catch(function(){});else if(typeof window.saveSettings==='function')window.saveSettings()}catch(e){}}
  function applyProduct(raw,source){var key=normalize(raw),s=state();if(!s||!PRODUCT[key])return false;var t=Date.now();if(lastHandledKey===key&&t-lastHandledAt<420)return true;lastHandledKey=key;lastHandledAt=t;s.settings.currentProduct=key;updateVisual(key);persist(s.settings);try{if(navigator.vibrate)navigator.vibrate(25)}catch(e){}try{window.dispatchEvent(new CustomEvent('mesaha:product-selected',{detail:{product:key,source:source||'tap'}}))}catch(e){}return true}
  function moved(ev){return !gesture||Math.abs(ev.clientX-gesture.x)>moveLimit||Math.abs(ev.clientY-gesture.y)>moveLimit}
  if(isIOS&&usePointer){
    document.addEventListener('pointerdown',function(ev){var b=buttonFrom(ev.target);if(!b||ev.pointerType==='mouse')return;gesture={id:ev.pointerId,btn:b,x:ev.clientX,y:ev.clientY,moved:false}},true);
    document.addEventListener('pointermove',function(ev){if(gesture&&gesture.id===ev.pointerId&&moved(ev))gesture.moved=true},true);
    document.addEventListener('pointercancel',function(){gesture=null},true);
    document.addEventListener('pointerup',function(ev){var b=buttonFrom(ev.target),g=gesture;gesture=null;if(!b||!g||g.id!==ev.pointerId||g.moved||g.btn!==b)return;if(applyProduct(b.getAttribute('data-product'),'ios-pointerup'))stop(ev)},{capture:true,passive:false});
  }else if(isIOS){
    document.addEventListener('touchstart',function(ev){var b=buttonFrom(ev.target),t=ev.touches&&ev.touches[0];gesture=b&&t?{btn:b,x:t.clientX,y:t.clientY,moved:false}:null},{capture:true,passive:true});
    document.addEventListener('touchmove',function(ev){var t=ev.touches&&ev.touches[0];if(gesture&&t&&(Math.abs(t.clientX-gesture.x)>moveLimit||Math.abs(t.clientY-gesture.y)>moveLimit))gesture.moved=true},{capture:true,passive:true});
    document.addEventListener('touchcancel',function(){gesture=null},true);
    document.addEventListener('touchend',function(ev){var b=buttonFrom(ev.target),g=gesture;gesture=null;if(!b||!g||g.moved||g.btn!==b)return;if(applyProduct(b.getAttribute('data-product'),'ios-touchend'))stop(ev)},{capture:true,passive:false});
  }
  /* iOS'ta pointer/touch sonrasında üretilen sentetik click yalnız bastırılır. Android mevcut click akışında kalır. */
  if(isIOS)document.addEventListener('click',function(ev){var b=buttonFrom(ev.target);if(!b)return;var key=normalize(b.getAttribute('data-product'));if(lastHandledKey===key&&Date.now()-lastHandledAt<900)stop(ev)},{capture:true,passive:false});
  function injectStyle(){if(document.getElementById('mesaha-product-touch-v540-style'))return;var st=document.createElement('style');st.id='mesaha-product-touch-v540-style';st.textContent='#entryView #productButtons{position:relative!important;z-index:90!important;pointer-events:auto!important;isolation:isolate!important}#entryView #productButtons .product-btn{position:relative!important;z-index:2!important;pointer-events:auto!important;touch-action:manipulation!important;-webkit-user-select:none!important;user-select:none!important}#entryView #productButtons .product-btn::before,#entryView #productButtons .product-btn::after{pointer-events:none!important}';document.head.appendChild(st)}
  function boot(){injectStyle();var s=state();if(s)updateVisual(normalize(s.settings.currentProduct))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.addEventListener('pageshow',boot,{passive:true});
  window.MesahaProductTouchV542=window.MesahaProductTouchV540={apply:applyProduct,refresh:boot,isIOS:isIOS,mode:isIOS?(usePointer?'pointer':'touch'):'native-click'};
})();
