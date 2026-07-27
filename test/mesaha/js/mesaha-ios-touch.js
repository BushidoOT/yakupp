/* Mesaha İO V5.76 — iPhone giriş ekranı tek dokunma ve odak köprüsü. */
(function(){
  'use strict';
  if(window.__mesahaIosTouchV576)return;
  window.__mesahaIosTouchV576=true;window.__mesahaIosTouchV542=true;window.__mesahaIosTouchV538=true;
  var ua=navigator.userAgent||'',isIOS=/iPad|iPhone|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);if(!isIOS)return;
  var usePointer=!!window.PointerEvent,gesture=null,lastHomeAt=0,bootTimer=0;
  function byId(id){return document.getElementById(id);}
  function now(){return Date.now();}
  function inputFrom(t){return t&&t.closest?t.closest('#diameterInput,#lengthInput,#barcodeInput,#quantityInput'):null;}
  function validInput(i){return !!(i&&!i.disabled&&!i.readOnly&&/^(diameterInput|lengthInput|barcodeInput|quantityInput)$/.test(i.id));}
  function focusInput(i){
    if(!validInput(i)||document.activeElement===i)return;
    try{i.focus({preventScroll:true});}catch(e){try{i.focus();}catch(_e){}}
    if(i.id==='barcodeInput'){try{var p=String(i.value||'').length;i.setSelectionRange(p,p);}catch(e){}}
  }
  function cleanKeyboardClasses(){var b=document.body,h=document.documentElement;['keyboard-open-v311','mesaha-entry-keyboard-open','mesaha-floating-save-open-v537','typing'].forEach(function(c){try{b&&b.classList.remove(c);h&&h.classList.remove(c);}catch(e){}});try{h.style.setProperty('--mesaha-kb-bottom-v537','0px');}catch(e){}}
  function hardHome(){try{var a=document.activeElement;if(a&&a.blur)a.blur();}catch(e){}cleanKeyboardClasses();try{if(typeof window.showView==='function')window.showView('home');else if(window.state)window.state.view='home';}catch(e){}try{window.scrollTo(0,0);}catch(e){}}
  function stop(ev){try{if(ev&&ev.cancelable)ev.preventDefault();if(ev){ev.stopPropagation();ev.stopImmediatePropagation();}}catch(e){}}
  function finish(ev,x,y,id){
    var g=gesture;gesture=null;if(!g||(id!=null&&g.id!==id)||g.moved)return;
    var end=ev.target;
    if(g.home){if(!(end&&end.closest&&end.closest('#entryHomeBtn')))return;lastHomeAt=now();stop(ev);hardHome();return;}
    var input=inputFrom(end);if(input&&input===g.input)focusInput(input);
  }
  function bind(){
    var entry=byId('entryView');if(!entry||entry.__iosTouchV576)return;entry.__iosTouchV576=true;
    if(usePointer){
      entry.addEventListener('pointerdown',function(ev){if(ev.pointerType==='mouse')return;var home=ev.target&&ev.target.closest&&ev.target.closest('#entryHomeBtn'),input=inputFrom(ev.target);gesture=home?{id:ev.pointerId,home:true,x:ev.clientX,y:ev.clientY,moved:false}:validInput(input)?{id:ev.pointerId,input:input,x:ev.clientX,y:ev.clientY,moved:false}:null;},{capture:true,passive:true});
      entry.addEventListener('pointermove',function(ev){if(gesture&&gesture.id===ev.pointerId&&(Math.abs(ev.clientX-gesture.x)>11||Math.abs(ev.clientY-gesture.y)>11))gesture.moved=true;},{capture:true,passive:true});
      entry.addEventListener('pointercancel',function(){gesture=null;},{capture:true,passive:true});
      entry.addEventListener('pointerup',function(ev){finish(ev,ev.clientX,ev.clientY,ev.pointerId);},{capture:true,passive:false});
    }else{
      entry.addEventListener('touchstart',function(ev){var t=ev.touches&&ev.touches[0],home=ev.target&&ev.target.closest&&ev.target.closest('#entryHomeBtn'),input=inputFrom(ev.target);gesture=t&&(home||validInput(input))?{home:!!home,input:input,x:t.clientX,y:t.clientY,moved:false}:null;},{capture:true,passive:true});
      entry.addEventListener('touchmove',function(ev){var t=ev.touches&&ev.touches[0];if(gesture&&t&&(Math.abs(t.clientX-gesture.x)>11||Math.abs(t.clientY-gesture.y)>11))gesture.moved=true;},{capture:true,passive:true});
      entry.addEventListener('touchcancel',function(){gesture=null;},{capture:true,passive:true});
      entry.addEventListener('touchend',function(ev){finish(ev,0,0,null);},{capture:true,passive:false});
    }
    entry.addEventListener('click',function(ev){if(ev.target&&ev.target.closest&&ev.target.closest('#entryHomeBtn')&&now()-lastHomeAt<900)stop(ev);},{capture:true,passive:false});
    ['diameterInput','lengthInput','barcodeInput','quantityInput'].forEach(function(id){var e=byId(id);if(e){e.classList.add('mesaha-ios-focus-v576');e.setAttribute('data-ios-focus-v576','1');}});
  }
  function boot(){clearTimeout(bootTimer);bind();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('pageshow',boot,{passive:true});window.addEventListener('orientationchange',function(){clearTimeout(bootTimer);bootTimer=setTimeout(boot,180);},{passive:true});
  window.MesahaIosTouchV576=window.MesahaIosTouchV542=window.MesahaIosTouchV538={home:hardHome,focus:focusInput,boot:boot,mode:usePointer?'pointer':'touch'};
})();
