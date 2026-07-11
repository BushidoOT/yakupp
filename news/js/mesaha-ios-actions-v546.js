/* Mesaha İO V5.46 — iOS kesimci ve son barkod işlemleri için tek dokunma köprüsü. */
(function(){
  'use strict';
  if(window.__mesahaIosActionsV546)return;
  window.__mesahaIosActionsV546=true;

  var ua=navigator.userAgent||'';
  var isIOS=/iPad|iPhone|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(!isIOS)return;

  var usePointer=!!window.PointerEvent;
  var gesture=null;
  var syntheticTarget=null;
  var syntheticClick=false;
  var lastTarget=null;
  var lastAt=0;
  var MOVE_LIMIT=14;
  var DUPLICATE_MS=900;

  function actionFrom(target){
    if(!target||!target.closest)return null;
    return target.closest(
      '#addCutterBtn,'+
      '#cutterChips [data-cutter],'+
      '#cutterChips [data-cutter-select-v406],'+
      '#cutterChips [data-cutter-edit-v406],'+
      '#cutterChips [data-cutter-delete-v406],'+
      '#recentList [data-edit],'+
      '#recentList [data-recent-delete]'
    );
  }
  function disabled(el){return !el||el.disabled||el.getAttribute('aria-disabled')==='true';}
  function stop(ev){
    try{if(ev&&ev.cancelable)ev.preventDefault();}catch(e){}
    try{if(ev)ev.stopPropagation();}catch(e){}
    try{if(ev&&ev.stopImmediatePropagation)ev.stopImmediatePropagation();}catch(e){}
  }
  function moved(x,y){return !gesture||Math.abs(x-gesture.x)>MOVE_LIMIT||Math.abs(y-gesture.y)>MOVE_LIMIT;}
  function runDirect(el){
    var entry=window.MesahaEntryActionsV546||{};
    var cutter=window.MesahaCutterManagerV406||{};
    if(el.id==='addCutterBtn'&&typeof entry.addCutter==='function'){entry.addCutter();return true;}
    if(el.hasAttribute('data-cutter-select-v406')&&typeof cutter.select==='function'){cutter.select(el.getAttribute('data-cutter-select-v406')||'');return true;}
    if(el.hasAttribute('data-cutter-edit-v406')&&typeof cutter.edit==='function'){cutter.edit(el.getAttribute('data-cutter-edit-v406')||'');return true;}
    if(el.hasAttribute('data-cutter-delete-v406')&&typeof cutter.remove==='function'){cutter.remove(el.getAttribute('data-cutter-delete-v406')||'');return true;}
    if(el.hasAttribute('data-edit')&&typeof entry.editRecent==='function'){entry.editRecent(el.getAttribute('data-edit')||'');return true;}
    if(el.hasAttribute('data-recent-delete')&&typeof entry.deleteRecent==='function'){entry.deleteRecent(el.getAttribute('data-recent-delete')||'');return true;}
    return false;
  }
  function fire(el,source){
    if(disabled(el))return false;
    var now=Date.now();
    if(lastTarget===el&&now-lastAt<420)return true;
    lastTarget=el;lastAt=now;
    el.setAttribute('data-ios-action-v546',source||'tap');
    try{if(runDirect(el))return true;}catch(e){}
    syntheticTarget=el;syntheticClick=true;
    try{el.click();}
    catch(e){try{el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));}catch(_e){}}
    finally{
      syntheticClick=false;
      setTimeout(function(){if(syntheticTarget===el)syntheticTarget=null;},DUPLICATE_MS+80);
    }
    return true;
  }

  /* Bu dinleyici dosya başta yüklendiği için daha sonra eklenen eski click yöneticilerinden önce çalışır. */
  document.addEventListener('click',function(ev){
    var el=actionFrom(ev.target);
    if(!el)return;
    if(syntheticClick&&el===syntheticTarget)return;
    if((el===syntheticTarget||el===lastTarget)&&Date.now()-lastAt<DUPLICATE_MS)stop(ev);
  },true);

  if(usePointer){
    document.addEventListener('pointerdown',function(ev){
      if(ev.pointerType==='mouse')return;
      var el=actionFrom(ev.target);
      gesture=el&&!disabled(el)?{id:ev.pointerId,el:el,x:ev.clientX,y:ev.clientY,moved:false}:null;
    },{capture:true,passive:true});
    document.addEventListener('pointermove',function(ev){
      if(gesture&&gesture.id===ev.pointerId&&moved(ev.clientX,ev.clientY))gesture.moved=true;
    },{capture:true,passive:true});
    document.addEventListener('pointercancel',function(){gesture=null;},true);
    document.addEventListener('pointerup',function(ev){
      var g=gesture;gesture=null;
      if(!g||g.id!==ev.pointerId||g.moved)return;
      var end=actionFrom(ev.target);
      if(end!==g.el)return;
      stop(ev);
      fire(g.el,'ios-pointerup');
    },{capture:true,passive:false});
  }else{
    document.addEventListener('touchstart',function(ev){
      var t=ev.touches&&ev.touches[0],el=actionFrom(ev.target);
      gesture=t&&el&&!disabled(el)?{el:el,x:t.clientX,y:t.clientY,moved:false}:null;
    },{capture:true,passive:true});
    document.addEventListener('touchmove',function(ev){
      var t=ev.touches&&ev.touches[0];
      if(gesture&&t&&moved(t.clientX,t.clientY))gesture.moved=true;
    },{capture:true,passive:true});
    document.addEventListener('touchcancel',function(){gesture=null;},true);
    document.addEventListener('touchend',function(ev){
      var g=gesture;gesture=null;
      if(!g||g.moved)return;
      var end=actionFrom(ev.target);
      if(end!==g.el)return;
      stop(ev);
      fire(g.el,'ios-touchend');
    },{capture:true,passive:false});
  }

  function installStyle(){
    if(document.getElementById('mesaha-ios-actions-v546-style'))return;
    var st=document.createElement('style');
    st.id='mesaha-ios-actions-v546-style';
    st.textContent='#addCutterBtn,#cutterChips button,#recentList button{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;pointer-events:auto!important}';
    (document.head||document.documentElement).appendChild(st);
  }
  installStyle();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installStyle,{once:true});
  window.MesahaIosActionsV546={isIOS:true,mode:usePointer?'pointer':'touch',fire:fire};
})();
