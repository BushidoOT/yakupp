/* Mesaha İO V5.76 — iOS düşük güç ve görünüm bazlı çalışma denetimi. */
(function(){
  'use strict';
  if(window.MesahaIOSPerformanceV576)return;
  var ua=navigator.userAgent||'';
  var isIOS=/iPad|iPhone|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  var cache={ready:false,records:null,length:0,count:0,m3:0};
  var refreshTimer=0;

  function byId(id){return document.getElementById(id);}
  function active(id){var e=byId(id);return !!(e&&e.classList.contains('active'));}
  function entryActive(){return active('entryView')||!!(document.body&&document.body.classList.contains('entry-open'));}
  function recordsActive(){return active('recordsView');}
  function homeActive(){return active('homeView');}
  function quantity(r){var q=Number(r&&(r.quantity||r.adet||1));return Number.isFinite(q)&&q>0?q:1;}
  function volume(r){var d=Number(String(r&&(r.diameter||r.cap||0)||0).replace(',','.')),l=Number(String(r&&(r.length||r.boy||0)||0).replace(',','.')),q=quantity(r);return d>0&&l>0?Math.PI*Math.pow(d/100,2)/4*l*q:0;}
  function records(){return window.state&&Array.isArray(window.state.records)?window.state.records:[];}
  function updateDom(){
    if(!entryActive())return;
    var c=byId('entryTotalCount'),m=byId('entryTotalM3');
    if(c)c.textContent=Math.max(0,cache.count).toLocaleString('tr-TR');
    if(m)m.textContent=(Math.max(0,cache.m3)).toLocaleString('tr-TR',{maximumFractionDigits:3})+' m³';
  }
  function rebuild(){
    var list=records(),count=0,m3=0;
    for(var i=0;i<list.length;i++){count+=quantity(list[i]);m3+=volume(list[i]);}
    cache={ready:true,records:list,length:list.length,count:count,m3:m3};updateDom();return cache;
  }
  function refresh(force){
    var list=records();
    if(force||!cache.ready||cache.records!==list||cache.length!==list.length)return rebuild();
    updateDom();return cache;
  }
  function applyDelta(delta){
    var list=records();
    if(!cache.ready||cache.records!==list){rebuild();return;}
    var prev=delta&&delta.previousRecord,rec=delta&&delta.record;
    if(prev){cache.count-=quantity(prev);cache.m3-=volume(prev);}
    if(rec){cache.count+=quantity(rec);cache.m3+=volume(rec);}
    if(delta&&delta.type==='delete'&&!prev){cache.ready=false;rebuild();return;}
    cache.length=list.length;updateDom();
  }
  function scheduleRefresh(force,delay){
    clearTimeout(refreshTimer);refreshTimer=setTimeout(function(){if(document.hidden)return;refresh(!!force);},delay==null?45:delay);
  }
  function shouldRunHeavy(target){
    if(document.hidden)return false;
    if(target==='records')return recordsActive();
    if(target==='home')return homeActive();
    if(target==='entry')return entryActive();
    return !entryActive();
  }
  function idle(fn,timeout){
    if(typeof requestIdleCallback==='function')return requestIdleCallback(function(){try{fn();}catch(e){}},{timeout:timeout||1200});
    return setTimeout(function(){try{fn();}catch(e){}},Math.min(timeout||500,500));
  }
  function installStyle(){
    if(!isIOS||byId('mesaha-ios-low-power-v576'))return;
    var s=document.createElement('style');s.id='mesaha-ios-low-power-v576';s.textContent='\
html.mesaha-ios-device body.entry-open #entryView,html.mesaha-ios-device body.entry-open #entryView *{scroll-behavior:auto!important;}\
html.mesaha-ios-device body.entry-open #entryView .entry-form,html.mesaha-ios-device body.entry-open #entryView .entry-total,html.mesaha-ios-device body.entry-open #entryView .entry-total>div,html.mesaha-ios-device body.entry-open #entryView .measure-grid label,html.mesaha-ios-device body.entry-open #entryView .barcode-save label,html.mesaha-ios-device body.entry-open #entryView .recent-box,html.mesaha-ios-device body.entry-open #entryView .tree-panel,html.mesaha-ios-device body.entry-open #entryView .tree-option,html.mesaha-ios-device body.entry-open #entryView .product-btn,html.mesaha-ios-device body.entry-open #entryView .chip{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;filter:none!important;box-shadow:none!important;}\
html.mesaha-ios-device body.entry-open #entryView *,html.mesaha-ios-device body.entry-open #entryView *::before,html.mesaha-ios-device body.entry-open #entryView *::after{animation:none!important;transition:none!important;will-change:auto!important;}\
html.mesaha-ios-device body.entry-open .mesaha-pressed-v527{transform:none!important;filter:none!important;}\
html.mesaha-ios-device body.entry-open #floatingSaveBtnV531{box-shadow:none!important;filter:none!important;background:#0d7a4b!important;}\
html.mesaha-ios-device body.entry-open #entryView .tree-panel,html.mesaha-ios-device body.entry-open #entryView #productButtons,html.mesaha-ios-device body.entry-open #entryView #cutterChips,html.mesaha-ios-device body.entry-open #entryView #recentList{contain:layout style paint;}';
    (document.head||document.documentElement).appendChild(s);
  }
  function boot(){
    if(isIOS){try{document.documentElement.classList.add('mesaha-ios-device','mesaha-ios-low-power-v576');}catch(e){}installStyle();}
    if(window.state)scheduleRefresh(true,80);
  }
  window.addEventListener('mesaha:records-saved',function(ev){var d=ev&&ev.detail||{};if(d.delta)applyDelta(d.delta);else{cache.ready=false;if(entryActive())scheduleRefresh(true,45);}},{passive:true});
  window.addEventListener('mesaha:view-changed',function(ev){var v=ev&&ev.detail&&ev.detail.view;if(v==='entry')scheduleRefresh(false,30);},{passive:true});
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&entryActive())scheduleRefresh(false,80);},{passive:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

  window.MesahaIOSPerformanceV576={isIOS:isIOS,entryActive:entryActive,recordsActive:recordsActive,homeActive:homeActive,shouldRunHeavy:shouldRunHeavy,refreshEntryStats:refresh,applyDelta:applyDelta,scheduleEntryStats:scheduleRefresh,idle:idle};
  window.MesahaEntryStatsV576={refresh:refresh,applyDelta:applyDelta,schedule:scheduleRefresh};
})();
