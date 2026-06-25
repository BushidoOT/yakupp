(function(){
  'use strict';
  if (window.__mesahaStabilityCoreV383) return;
  window.__mesahaStabilityCoreV383 = true;

  var timers = Object.create(null);
  function later(key, fn, delay){
    clearTimeout(timers[key]);
    timers[key] = setTimeout(function(){
      if (document.hidden) return;
      try { fn(); } catch(e) {}
    }, delay || 120);
  }
  function fire(name, detail){
    try { window.dispatchEvent(new CustomEvent(name, {detail: detail || {}})); } catch(e) {}
  }
  function callTotals(){
    try { if (window.mesahaV305 && typeof window.mesahaV305.updateBeyanTotals === 'function') window.mesahaV305.updateBeyanTotals(); } catch(e) {}
    try { if (typeof window.mesahaV304 === 'object' && typeof window.mesahaV304.updateExportScopeInfo === 'function') window.mesahaV304.updateExportScopeInfo(); } catch(e) {}
  }
  function callBinders(){
    try { if (window.mesahaV306 && typeof window.mesahaV306.bindMeasureButtons === 'function') window.mesahaV306.bindMeasureButtons(); } catch(e) {}
  }
  ['input','change','click'].forEach(function(type){
    document.addEventListener(type, function(ev){
      var t = ev && ev.target;
      if (!t) return;
      if (type === 'click' || /Input|Select|TextArea|Button/i.test(t.constructor && t.constructor.name || '')) {
        later('totals', callTotals, 90);
        later('binders', callBinders, 140);
      }
    }, {capture:true, passive:true});
  });
  document.addEventListener('visibilitychange', function(){
    if (!document.hidden) { later('totals', callTotals, 160); later('binders', callBinders, 220); }
  }, {passive:true});
  window.addEventListener('pageshow', function(){ later('totals', callTotals, 160); later('binders', callBinders, 220); }, {passive:true});

  window.MesahaStabilityCoreV383 = {
    later: later,
    fire: fire,
    refreshTotals: function(){ later('totals', callTotals, 40); },
    refreshBinders: function(){ later('binders', callBinders, 40); }
  };
})();

try{ if(window.MesahaUtils){ window.MesahaUtils.stabilityCore = window.MesahaStabilityCoreV381; } }catch(e){}
