/* Mesaha İO v169 Modüler Stabil - app-15.js */
(function(){
  'use strict';
  const VERSION_TEXT_V149 = 'Mesaha İO v1.98';
  const FILE_VERSION_V149 = 'v149';
  function safeV149(fn){ try { return fn(); } catch(e) { return undefined; } }
  function readyV149(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true }); else fn(); }
  function moveTreeFilterV149(){
    const panelBody = document.querySelector('.records-panel .panel-body');
    const filter = document.getElementById('treeFilterV144');
    if (!panelBody || !filter) return false;
    const tools = panelBody.querySelector('.tools');
    const totals = panelBody.querySelector('.totals');
    if (tools) {
      if (filter.nextElementSibling !== tools) panelBody.insertBefore(filter, tools);
      return true;
    }
    if (totals) {
      const afterTotals = totals.nextSibling;
      if (afterTotals !== filter) panelBody.insertBefore(filter, afterTotals);
      return true;
    }
    return false;
  }
  function applyVersionV149(){
    safeV149(() => { document.title = VERSION_TEXT_V149; });
    safeV149(() => { const h1 = document.querySelector('.brand h1'); if (h1) h1.textContent = VERSION_TEXT_V149; });
    safeV149(() => {
      window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, {
        fileVersion: FILE_VERSION_V149,
        visibleVersion: VERSION_TEXT_V149,
        treeFilterAboveExport: true
      });
    });
  }
  function bootV149(){
    moveTreeFilterV149();
    applyVersionV149();
  }
  readyV149(bootV149);
  [50, 150, 350, 800, 1400, 2400].forEach(ms => setTimeout(bootV149, ms));
  document.addEventListener('click', function(event){
    if (event.target && event.target.closest && event.target.closest('#navRecords,[data-flow-tab="records"],#treeFilterV144,.records-panel')) {
      setTimeout(moveTreeFilterV149, 60);
      setTimeout(moveTreeFilterV149, 180);
    }
  }, true);
  safeV149(() => {
    if (typeof render === 'function' && !render.__v149TreeFilterPositionWrapped) {
      const oldRenderV149 = render;
      render = function(){
        const result = oldRenderV149.apply(this, arguments);
        setTimeout(moveTreeFilterV149, 20);
        setTimeout(applyVersionV149, 40);
        return result;
      };
      render.__v149TreeFilterPositionWrapped = true;
    }
  });
})();
