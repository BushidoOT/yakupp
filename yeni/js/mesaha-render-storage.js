(function(){
  'use strict';
  if (window.__mesahaRenderStorage) return;
  window.__mesahaRenderStorage = true;

  var renderTimer = 0, recordsTimer = 0, lightTimer = 0, commitTimer=0, commitFlags={records:false,settings:false};
  function safe(fn){ try { if (typeof fn === 'function') return fn(); } catch(e){} }
  function active(id){ var el=document.getElementById(id); return !!(el && el.classList && el.classList.contains('active')); }
  function entryViewActive(){ return active('entryView') || (document.body && document.body.classList.contains('entry-open')); }
  function recordsViewVisible(){ return active('recordsView'); }
  function fastEntryRefresh(){
    if (window.MesahaV433Refresh && typeof window.MesahaV433Refresh.fastAfterSave === 'function') return safe(window.MesahaV433Refresh.fastAfterSave);
    safe(function(){ if(window.MesahaV433Refresh && typeof window.MesahaV433Refresh.renderShortcuts === 'function') window.MesahaV433Refresh.renderShortcuts(); });
    safe(function(){ if(window.mesahaV305) window.mesahaV305.updateBeyanTotals(); });
  }
  function renderAllSoon(delay){
    clearTimeout(renderTimer);
    renderTimer = setTimeout(function(){
      if (document.hidden) return;
      // Stabil: Mesaha Gir açıkken full render inputları geri yazmasın; hafif yenile.
      if (entryViewActive()) { fastEntryRefresh(); return; }
      safe(window.renderAll);
      safe(function(){ if(window.mesahaV305) window.mesahaV305.updateBeyanTotals(); });
    }, delay || 90);
  }
  function renderRecordsSoon(delay){
    clearTimeout(recordsTimer);
    recordsTimer = setTimeout(function(){
      if (document.hidden) return;
      if (!recordsViewVisible()) { lightRefreshSoon(80); return; }
      if (window.mesahaV303 && typeof window.mesahaV303.records === 'function') safe(window.mesahaV303.records);
      else safe(window.renderRecords);
      safe(function(){ if(window.mesahaV305) window.mesahaV305.updateBeyanTotals(); });
    }, delay || 90);
  }
  function lightRefreshSoon(delay){
    clearTimeout(lightTimer);
    lightTimer = setTimeout(function(){
      if (document.hidden) return;
      safe(function(){ if(window.MesahaV433Refresh && typeof window.MesahaV433Refresh.fastAfterSave === 'function') window.MesahaV433Refresh.fastAfterSave(); });
      safe(function(){ if(window.mesahaV305) window.mesahaV305.updateBeyanTotals(); });
      safe(function(){ if(window.mesahaV304) window.mesahaV304.updateExportScopeInfo(); });
    }, delay || 120);
  }
  function flushLocalSettings(){ try { if (typeof window.__flushSettings === 'function') window.__flushSettings(); } catch(e) {} }
  function queueCommitted(kind){
    commitFlags[kind]=true;clearTimeout(commitTimer);
    commitTimer=setTimeout(function(){
      var hasRecords=commitFlags.records;commitFlags={records:false,settings:false};
      if(hasRecords){
        if(entryViewActive())fastEntryRefresh();
        else if(recordsViewVisible())renderRecordsSoon(20);
        else renderAllSoon(20);
      }else lightRefreshSoon(30);
    },45);
  }
  window.addEventListener('mesaha:records-saved', function(){ queueCommitted('records'); }, {passive:true});
  window.addEventListener('mesaha:settings-saved', function(){ queueCommitted('settings'); }, {passive:true});
  window.addEventListener('pagehide', flushLocalSettings, {passive:true});
  document.addEventListener('visibilitychange', function(){ if(document.hidden) flushLocalSettings(); }, {passive:true});
  var api = { renderAllSoon: renderAllSoon, renderRecordsSoon: renderRecordsSoon, lightRefreshSoon: lightRefreshSoon, queueCommitted:queueCommitted, flushSettings: flushLocalSettings };
  window.MesahaRenderStorage = api; window.MesahaRenderStorageV383 = api; window.MesahaRenderStorageV382 = api;
})();
