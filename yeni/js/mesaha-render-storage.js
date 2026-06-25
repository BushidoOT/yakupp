(function(){
  'use strict';
  if (window.__mesahaRenderStorageV383) return;
  window.__mesahaRenderStorageV383 = true;

  var renderTimer = 0;
  var recordsTimer = 0;
  var lightTimer = 0;
  function safe(fn){ try { if (typeof fn === 'function') return fn(); } catch(e){} }
  function renderAllSoon(delay){
    clearTimeout(renderTimer);
    renderTimer = setTimeout(function(){
      if (document.hidden) return;
      safe(window.renderAll);
      safe(function(){ if(window.mesahaV305) window.mesahaV305.updateBeyanTotals(); });
    }, delay || 90);
  }
  function renderRecordsSoon(delay){
    clearTimeout(recordsTimer);
    recordsTimer = setTimeout(function(){
      if (document.hidden) return;
      if (window.mesahaV303 && typeof window.mesahaV303.records === 'function') safe(window.mesahaV303.records);
      else safe(window.renderRecords);
      safe(function(){ if(window.mesahaV305) window.mesahaV305.updateBeyanTotals(); });
    }, delay || 90);
  }
  function lightRefreshSoon(delay){
    clearTimeout(lightTimer);
    lightTimer = setTimeout(function(){
      if (document.hidden) return;
      safe(function(){ if(window.mesahaV305) window.mesahaV305.updateBeyanTotals(); });
      safe(function(){ if(window.mesahaV304) window.mesahaV304.updateExportScopeInfo(); });
    }, delay || 120);
  }
  function flushLocalSettings(){
    try { if (typeof window.__flushSettings === 'function') window.__flushSettings(); } catch(e) {}
  }
  window.addEventListener('mesaha:records-saved', function(){ renderRecordsSoon(80); }, {passive:true});
  window.addEventListener('mesaha:settings-saved', function(){ lightRefreshSoon(120); }, {passive:true});
  window.addEventListener('pagehide', flushLocalSettings, {passive:true});
  document.addEventListener('visibilitychange', function(){ if(document.hidden) flushLocalSettings(); }, {passive:true});

  window.MesahaRenderStorageV383 = {
    renderAllSoon: renderAllSoon,
    renderRecordsSoon: renderRecordsSoon,
    lightRefreshSoon: lightRefreshSoon,
    flushSettings: flushLocalSettings
  };
})();
