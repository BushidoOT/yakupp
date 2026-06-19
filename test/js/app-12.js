/* Mesaha İO v169 Modüler Stabil - app-12.js */
(function(){
  'use strict';
  const VERSION_TEXT_V145 = 'Mesaha İO v1.98';
  const FILE_VERSION_V145 = 'v145';
  function safeV145(fn){ try { return fn(); } catch(e) { return undefined; } }
  function readyV145(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true });
    else fn();
  }
  function recordsV145(){
    return safeV145(() => Array.isArray(state.records) ? state.records : []) || [];
  }
  function qtyV145(r){
    return Number(r && (r.quantity ?? r.adet ?? r.count)) || 0;
  }
  function desiV145(r){
    return Number(r && (r.desi ?? r.volume ?? r.hacim)) || 0;
  }
  function totalAdetV145(){
    return recordsV145().reduce((sum, r) => sum + qtyV145(r), 0);
  }
  function totalDesiV145(){
    return recordsV145().reduce((sum, r) => sum + desiV145(r), 0);
  }
  function fmtM3V145(desi){
    let out = '';
    safeV145(() => { if (typeof formatHacimFromDesi === 'function') out = formatHacimFromDesi(desi); });
    if (!out) {
      const value = (Number(desi) || 0) / 1000;
      out = value.toLocaleString('tr-TR', { minimumFractionDigits:3, maximumFractionDigits:3 });
    }
    out = String(out).replace(/\s*m³\s*$/i, '').trim();
    return (out || '0') + ' m³';
  }
  function ensureDualTotalV145(){
    const header = document.querySelector('.entry-panel .panel-header');
    let box = document.getElementById('simpleTotalAdetV126');
    if (!box && header) {
      box = document.createElement('div');
      box.id = 'simpleTotalAdetV126';
      box.className = 'simple-total-adet-v126';
      header.appendChild(box);
    }
    if (!box) return null;
    box.classList.add('simple-total-dual-v145');
    if (!box.querySelector('#simpleTotalM3ValueV145') || !box.querySelector('.simple-total-item-v145')) {
      box.innerHTML = [
        '<div class="simple-total-item-v145"><span class="simple-total-label-v126">Toplam Adet</span><strong id="simpleTotalAdetValueV126" class="simple-total-value-v126">0</strong></div>',
        '<div class="simple-total-divider-v145" aria-hidden="true"></div>',
        '<div class="simple-total-item-v145"><span class="simple-total-label-v126">Toplam m³</span><strong id="simpleTotalM3ValueV145" class="simple-total-value-v126">0 m³</strong></div>'
      ].join('');
    }
    return box;
  }
  function updateDualTotalV145(){
    ensureDualTotalV145();
    const adetEl = document.getElementById('simpleTotalAdetValueV126');
    const m3El = document.getElementById('simpleTotalM3ValueV145');
    if (adetEl) adetEl.textContent = totalAdetV145().toLocaleString('tr-TR');
    if (m3El) m3El.textContent = fmtM3V145(totalDesiV145());
  }
  function patchTreeKeepOpenV145(){
    const panel = document.getElementById('treeTypePanel');
    if (!panel) return;
    const apply = document.getElementById('treeTypeApplyBtn');
    if (apply) apply.remove();
    panel.dataset.keepOpenV145 = '1';
    if (!panel.__v145KeepOpenBound) {
      panel.__v145KeepOpenBound = true;
      panel.addEventListener('click', function(event){
        const input = event.target && event.target.matches && event.target.matches('input[name="treeTypeRadio"]')
          ? event.target
          : (event.target && event.target.closest ? (event.target.closest('label') ? event.target.closest('label').querySelector('input[name="treeTypeRadio"]') : null) : null);
        if (!input) return;
        setTimeout(() => { try { panel.classList.add('open'); } catch{} }, 0);
        setTimeout(() => { try { panel.classList.add('open'); } catch{} }, 60);
      }, true);
    }
  }
  function applyVersionV145(){
    safeV145(() => { document.title = VERSION_TEXT_V145; });
    safeV145(() => { const h1 = document.querySelector('.brand h1'); if (h1) h1.textContent = VERSION_TEXT_V145; });
    safeV145(() => {
      window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, {
        fileVersion: FILE_VERSION_V145,
        visibleVersion: VERSION_TEXT_V145,
        treePanelStayOpen: true,
        simpleTotalM3: true
      });
    });
  }
  function bootV145(){
    patchTreeKeepOpenV145();
    updateDualTotalV145();
    applyVersionV145();
  }
  readyV145(bootV145);
  [50, 250, 900, 1400, 2400].forEach(ms => setTimeout(bootV145, ms));
  setInterval(updateDualTotalV145, 1200);
  document.addEventListener('click', (event) => {
    if (event.target && event.target.closest && event.target.closest('#openSimpleV112,#submitBtn,.delete-mini,#deleteAllBtn,#bulkDeleteBtn,#treeTypePanel')) {
      setTimeout(bootV145, 80);
      setTimeout(updateDualTotalV145, 260);
    }
  }, true);
  document.addEventListener('input', (event) => {
    if (event.target && event.target.closest && event.target.closest('#quantity,#length,#diameter,#barcode')) {
      setTimeout(updateDualTotalV145, 80);
    }
  }, true);
  safeV145(() => {
    if (typeof render === 'function' && !render.__v145TotalWrapped) {
      const oldRenderV145 = render;
      render = function(){
        const result = oldRenderV145.apply(this, arguments);
        setTimeout(updateDualTotalV145, 30);
        setTimeout(applyVersionV145, 60);
        return result;
      };
      render.__v145TotalWrapped = true;
    }
  });
})();
