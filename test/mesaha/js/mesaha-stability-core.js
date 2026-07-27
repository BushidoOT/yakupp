(function(){
  'use strict';
  if(window.__mesahaStabilityCore)return;
  window.__mesahaStabilityCore=true;
  var timers=Object.create(null);
  function later(key,fn,delay){clearTimeout(timers[key]);timers[key]=setTimeout(function(){if(document.hidden)return;try{fn();}catch(e){}},delay||120);}
  function fire(name,detail){try{window.dispatchEvent(new CustomEvent(name,{detail:detail||{}}));}catch(e){}}
  function active(id){var e=document.getElementById(id);return !!(e&&e.classList.contains('active'));}
  function entryActive(){return active('entryView')||(document.body&&document.body.classList.contains('entry-open'));}
  function recordsActive(){return active('recordsView');}
  function callTotals(){
    if(entryActive()){try{if(window.MesahaEntryStatsV576)window.MesahaEntryStatsV576.refresh(false);}catch(e){}return;}
    if(!recordsActive())return;
    try{if(window.mesahaV305&&typeof window.mesahaV305.updateBeyanTotals==='function')window.mesahaV305.updateBeyanTotals();}catch(e){}
    try{if(window.mesahaV304&&typeof window.mesahaV304.updateExportScopeInfo==='function')window.mesahaV304.updateExportScopeInfo();}catch(e){}
  }
  function callBinders(){if(!recordsActive())return;try{if(window.mesahaV306&&typeof window.mesahaV306.bindMeasureButtons==='function')window.mesahaV306.bindMeasureButtons();}catch(e){}}
  var commitKind={records:false,settings:false},commitTimer=0;
  function queueCommit(kind){commitKind[kind]=true;clearTimeout(commitTimer);commitTimer=setTimeout(function(){var records=commitKind.records;commitKind={records:false,settings:false};later('totals',callTotals,records?50:120);if(records&&!entryActive())later('binders',callBinders,120);},45);}
  window.addEventListener('mesaha:records-saved',function(){queueCommit('records');},{passive:true});
  window.addEventListener('mesaha:settings-saved',function(){queueCommit('settings');},{passive:true});
  window.addEventListener('mesaha:light-refresh',function(){later('totals',callTotals,60);later('binders',callBinders,120);},{passive:true});
  document.addEventListener('visibilitychange',function(){if(!document.hidden){later('totals',callTotals,160);later('binders',callBinders,220);}},{passive:true});
  window.addEventListener('pageshow',function(){later('totals',callTotals,160);later('binders',callBinders,220);},{passive:true});
  var api={later:later,fire:fire,refreshTotals:function(){later('totals',callTotals,40);},refreshBinders:function(){later('binders',callBinders,40);}};
  window.MesahaStabilityCore=api;window.MesahaStabilityCoreV383=api;try{if(window.MesahaUtils)window.MesahaUtils.stabilityCore=api;}catch(e){}
})();
