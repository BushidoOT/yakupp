(function(){
  'use strict';
  if (window.__mesahaStabilityCore) return;
  window.__mesahaStabilityCore = true;

  var timers = Object.create(null);
  function later(key, fn, delay){
    clearTimeout(timers[key]);
    timers[key] = setTimeout(function(){
      if (document.hidden) return;
      try { fn(); } catch(e) {}
    }, delay || 120);
  }
  function fire(name, detail){ try { window.dispatchEvent(new CustomEvent(name, {detail: detail || {}})); } catch(e) {} }
  function callTotals(){
    try { if (window.mesahaV305 && typeof window.mesahaV305.updateBeyanTotals === 'function') window.mesahaV305.updateBeyanTotals(); } catch(e) {}
    try { if (window.mesahaV304 && typeof window.mesahaV304.updateExportScopeInfo === 'function') window.mesahaV304.updateExportScopeInfo(); } catch(e) {}
  }
  function callBinders(){ try { if (window.mesahaV306 && typeof window.mesahaV306.bindMeasureButtons === 'function') window.mesahaV306.bindMeasureButtons(); } catch(e) {} }

  // Stabil: Her input/click için global yakalama yok; Mesaha Gir ekranı hafif kalır.
  // Artık sadece kayıt/ayar kaydı, sayfa görünür olma ve manuel refresh olaylarında hafif yenileme yapıyoruz.
  var commitKind={records:false,settings:false},commitTimer=0;
  function queueCommit(kind){commitKind[kind]=true;clearTimeout(commitTimer);commitTimer=setTimeout(function(){var records=commitKind.records;commitKind={records:false,settings:false};later('totals',callTotals,records?50:120);if(records)later('binders',callBinders,100);},45);}
  window.addEventListener('mesaha:records-saved', function(){ queueCommit('records'); }, {passive:true});
  window.addEventListener('mesaha:settings-saved', function(){ queueCommit('settings'); }, {passive:true});
  window.addEventListener('mesaha:light-refresh', function(){ later('totals', callTotals, 60); later('binders', callBinders, 120); }, {passive:true});
  document.addEventListener('visibilitychange', function(){ if(!document.hidden){ later('totals', callTotals, 160); later('binders', callBinders, 220); } }, {passive:true});
  window.addEventListener('pageshow', function(){ later('totals', callTotals, 160); later('binders', callBinders, 220); }, {passive:true});

  var api = { later: later, fire: fire, refreshTotals: function(){ later('totals', callTotals, 40); }, refreshBinders: function(){ later('binders', callBinders, 40); } };
  window.MesahaStabilityCore = api;
  window.MesahaStabilityCoreV383 = api;
  try{ if(window.MesahaUtils){ window.MesahaUtils.stabilityCore = api; } }catch(e){}
})();
