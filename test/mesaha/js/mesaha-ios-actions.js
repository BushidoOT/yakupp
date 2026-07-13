/* Mesaha İO V5.76 — iOS kesimci ve son barkod işlemleri, giriş alanına sınırlı tek olay yolu. */
(function(){
  'use strict';
  if(window.__mesahaIosActionsV576)return;
  window.__mesahaIosActionsV576=true;window.__mesahaIosActionsV546=true;
  var ua=navigator.userAgent||'',isIOS=/iPad|iPhone|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);if(!isIOS)return;
  var usePointer=!!window.PointerEvent,gesture=null,syntheticTarget=null,syntheticClick=false,lastTarget=null,lastAt=0,MOVE_LIMIT=14,DUPLICATE_MS=850;
  function actionFrom(target){if(!target||!target.closest)return null;return target.closest('#addCutterBtn,#cutterChips [data-cutter],#cutterChips [data-cutter-select-v406],#cutterChips [data-cutter-edit-v406],#cutterChips [data-cutter-delete-v406],#recentList [data-edit],#recentList [data-recent-delete]');}
  function disabled(el){return !el||el.disabled||el.getAttribute('aria-disabled')==='true';}
  function stop(ev){try{if(ev&&ev.cancelable)ev.preventDefault();if(ev){ev.stopPropagation();ev.stopImmediatePropagation();}}catch(e){}}
  function runDirect(el){var entry=window.MesahaEntryActionsV546||{},cutter=window.MesahaCutterManagerV406||{};if(el.id==='addCutterBtn'&&typeof entry.addCutter==='function'){entry.addCutter();return true;}if(el.hasAttribute('data-cutter-select-v406')&&typeof cutter.select==='function'){cutter.select(el.getAttribute('data-cutter-select-v406')||'');return true;}if(el.hasAttribute('data-cutter-edit-v406')&&typeof cutter.edit==='function'){cutter.edit(el.getAttribute('data-cutter-edit-v406')||'');return true;}if(el.hasAttribute('data-cutter-delete-v406')&&typeof cutter.remove==='function'){cutter.remove(el.getAttribute('data-cutter-delete-v406')||'');return true;}if(el.hasAttribute('data-edit')&&typeof entry.editRecent==='function'){entry.editRecent(el.getAttribute('data-edit')||'');return true;}if(el.hasAttribute('data-recent-delete')&&typeof entry.deleteRecent==='function'){entry.deleteRecent(el.getAttribute('data-recent-delete')||'');return true;}return false;}
  function fire(el,source){if(disabled(el))return false;var t=Date.now();if(lastTarget===el&&t-lastAt<380)return true;lastTarget=el;lastAt=t;try{if(runDirect(el))return true;}catch(e){}syntheticTarget=el;syntheticClick=true;try{el.click();}catch(e){try{el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));}catch(_e){}}finally{syntheticClick=false;setTimeout(function(){if(syntheticTarget===el)syntheticTarget=null;},DUPLICATE_MS+60);}return true;}
  function bind(){
    var entry=document.getElementById('entryView');if(!entry||entry.__iosActionsV576)return;entry.__iosActionsV576=true;
    entry.addEventListener('click',function(ev){var el=actionFrom(ev.target);if(!el)return;if(syntheticClick&&el===syntheticTarget)return;if((el===syntheticTarget||el===lastTarget)&&Date.now()-lastAt<DUPLICATE_MS)stop(ev);},true);
    if(usePointer){
      entry.addEventListener('pointerdown',function(ev){if(ev.pointerType==='mouse')return;var el=actionFrom(ev.target);gesture=el&&!disabled(el)?{id:ev.pointerId,el:el,x:ev.clientX,y:ev.clientY,moved:false}:null;},{capture:true,passive:true});
      entry.addEventListener('pointermove',function(ev){if(gesture&&gesture.id===ev.pointerId&&(Math.abs(ev.clientX-gesture.x)>MOVE_LIMIT||Math.abs(ev.clientY-gesture.y)>MOVE_LIMIT))gesture.moved=true;},{capture:true,passive:true});
      entry.addEventListener('pointercancel',function(){gesture=null;},{capture:true,passive:true});
      entry.addEventListener('pointerup',function(ev){var g=gesture;gesture=null;if(!g||g.id!==ev.pointerId||g.moved||actionFrom(ev.target)!==g.el)return;stop(ev);fire(g.el,'ios-pointerup');},{capture:true,passive:false});
    }else{
      entry.addEventListener('touchstart',function(ev){var t=ev.touches&&ev.touches[0],el=actionFrom(ev.target);gesture=t&&el&&!disabled(el)?{el:el,x:t.clientX,y:t.clientY,moved:false}:null;},{capture:true,passive:true});
      entry.addEventListener('touchmove',function(ev){var t=ev.touches&&ev.touches[0];if(gesture&&t&&(Math.abs(t.clientX-gesture.x)>MOVE_LIMIT||Math.abs(t.clientY-gesture.y)>MOVE_LIMIT))gesture.moved=true;},{capture:true,passive:true});
      entry.addEventListener('touchcancel',function(){gesture=null;},{capture:true,passive:true});
      entry.addEventListener('touchend',function(ev){var g=gesture;gesture=null;if(!g||g.moved||actionFrom(ev.target)!==g.el)return;stop(ev);fire(g.el,'ios-touchend');},{capture:true,passive:false});
    }
  }
  function style(){if(document.getElementById('mesaha-ios-actions-v576-style'))return;var s=document.createElement('style');s.id='mesaha-ios-actions-v576-style';s.textContent='#addCutterBtn,#cutterChips button,#recentList button{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;pointer-events:auto!important}';(document.head||document.documentElement).appendChild(s);}
  function boot(){style();bind();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.MesahaIosActionsV576=window.MesahaIosActionsV546={isIOS:true,mode:usePointer?'pointer':'touch',fire:fire,boot:boot};
})();
