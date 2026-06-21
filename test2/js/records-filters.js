/* script block 11 id="mesaha-v144-istek-js" */

  (function(){
    'use strict';
    const TREE_FILTER_KEY_V144 = 'mesaha_tree_filter_v144';
    const TREE_ORDER_V144 = ['Karaçam','Sarıçam','Sedir','Göknar','Kızılçam'];

    function readyV144(fn){
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true });
      else fn();
    }
    function safeV144(fn){ try { return fn(); } catch (err) { return undefined; } }
    function escV144(value){
      if (typeof escapeHtml === 'function') return escapeHtml(value);
      return String(value ?? '')
        .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
        .replaceAll('"','&quot;').replaceAll("'",'&#039;');
    }
    function fmtM3V144(desi){
      if (typeof formatHacimFromDesi === 'function') return formatHacimFromDesi(desi);
      const value = (Number(desi) || 0) / 1000;
      return value.toFixed(3).replace(/0+$/,'').replace(/\.$/,'');
    }
    function normalizeTreeV144(value){
      if (typeof normalizeTreeType === 'function') return normalizeTreeType(value || 'Karaçam');
      const raw = String(value || '').trim();
      return raw || 'Karaçam';
    }
    function treeInfoV144(value){
      if (typeof getTreeInfo === 'function') return getTreeInfo(value || 'Karaçam');
      const key = normalizeTreeV144(value);
      return { agacAdi:key };
    }
    function treeOfRecordV144(record){
      return normalizeTreeV144(record && (record.treeType || record.species || record.agacAdi || record.agac || record.ağaç) || 'Karaçam');
    }
    function activeTreeFilterV144(){
      let val = 'all';
      safeV144(() => { if (typeof state !== 'undefined' && state && state.treeFilterV144) val = state.treeFilterV144; });
      if (!val || val === 'Tümü') {
        safeV144(() => { val = localStorage.getItem(TREE_FILTER_KEY_V144) || 'all'; });
      }
      if (val !== 'all') val = normalizeTreeV144(val);
      return val || 'all';
    }
    function setTreeFilterV144(value){
      const val = (!value || value === 'all' || value === 'Tümü') ? 'all' : normalizeTreeV144(value);
      safeV144(() => { state.treeFilterV144 = val; });
      safeV144(() => localStorage.setItem(TREE_FILTER_KEY_V144, val));
      renderTreeFilterV144();
      if (typeof render === 'function') render();
    }

    function moveHomeSummaryV144(){
      const summary = document.querySelector('.home-card-v143.summary-v143');
      const grid = document.querySelector('.app > main.grid, main.grid');
      if (summary && grid && grid.parentNode) {
        summary.classList.add('home-summary-bottom-v144');
        if (summary.previousElementSibling !== grid) grid.parentNode.insertBefore(summary, grid.nextSibling);
      }
      document.querySelectorAll('.home-card-v143.quick-v143,.home-card-v143.records-v143').forEach(el => el.remove());
    }

    function treeListV144(){
      let trees = TREE_ORDER_V144.slice();
      safeV144(() => {
        if (typeof TREE_MAP !== 'undefined' && TREE_MAP) {
          const keys = Object.keys(TREE_MAP).filter(Boolean);
          trees = TREE_ORDER_V144.filter(t => keys.includes(t)).concat(keys.filter(t => !TREE_ORDER_V144.includes(t)));
        }
      });
      return trees;
    }

    function ensureTreeFilterV144(){
      const panelBody = document.querySelector('.records-panel .panel-body');
      if (!panelBody) return null;
      let wrap = document.getElementById('treeFilterV144');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'treeFilterV144';
        wrap.className = 'tree-filter-v144';
        const tools = document.querySelector('.records-panel .tools');
        const totals = document.querySelector('.records-panel .totals');
        panelBody.insertBefore(wrap, tools || (totals ? totals.nextSibling : panelBody.firstChild));
      }
      if (!wrap.__v144Bound) {
        wrap.__v144Bound = true;
        wrap.addEventListener('click', (event) => {
          const btn = event.target.closest('button[data-tree-filter-v144]');
          if (!btn) return;
          event.preventDefault();
          setTreeFilterV144(btn.dataset.treeFilterV144 || 'all');
        });
      }
      return wrap;
    }

    function renderTreeFilterV144(){
      const wrap = ensureTreeFilterV144();
      if (!wrap) return;
      const records = safeV144(() => Array.isArray(state.records) ? state.records : []) || [];
      const active = activeTreeFilterV144();
      const counts = { all: records.length };
      records.forEach(r => {
        const key = treeOfRecordV144(r);
        counts[key] = (counts[key] || 0) + 1;
      });
      const activeLabel = active === 'all' ? 'Tümü' : treeInfoV144(active).agacAdi;
      const parts = [
        `<div class="tree-filter-title-v144"><span>Ağaç filtresi</span><small>Seçili: ${escV144(activeLabel)}</small></div>`,
        `<button type="button" data-tree-filter-v144="all" class="${active === 'all' ? 'active' : ''}">Tümü (${(counts.all || 0).toLocaleString('tr-TR')})</button>`
      ];
      treeListV144().forEach(tree => {
        const info = treeInfoV144(tree);
        const key = normalizeTreeV144(tree);
        parts.push(`<button type="button" data-tree-filter-v144="${escV144(key)}" class="${active === key ? 'active' : ''}">${escV144(info.agacAdi || key)} (${(counts[key] || 0).toLocaleString('tr-TR')})</button>`);
      });
      wrap.innerHTML = parts.join('');
    }

    function patchTreeSelectionV144(){
      const apply = document.getElementById('treeTypeApplyBtn');
      if (apply) apply.remove();
      const panel = document.getElementById('treeTypePanel');
      if (!panel || panel.__v144DirectTree) return;
      panel.__v144DirectTree = true;
      panel.addEventListener('click', (event) => {
        const input = event.target.matches('input[name="treeTypeRadio"]')
          ? event.target
          : (event.target.closest('label') ? event.target.closest('label').querySelector('input[name="treeTypeRadio"]') : null);
        if (!input) return;
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        const value = input.value || 'Karaçam';
        input.checked = true;
        if (typeof setTreeType === 'function') setTreeType(value, true);
        if (typeof syncTreeTypePanel === 'function') syncTreeTypePanel();
        panel.classList.add('open');
        if (typeof showSuccessToast === 'function') showSuccessToast('Ağaç türü seçildi.');
        else if (typeof showToast === 'function') showToast('Ağaç türü seçildi.');
      }, true);
    }

    function filteredRecordsV144(){
      const records = safeV144(() => Array.isArray(state.records) ? state.records : []) || [];
      const treeFilter = activeTreeFilterV144();
      const query = safeV144(() => els.searchInput ? els.searchInput.value.trim().toLowerCase() : '') || '';
      let list = records;
      if (treeFilter !== 'all') list = list.filter(r => treeOfRecordV144(r) === treeFilter);
      if (!query) return list;
      return list.filter(r => {
        const sys = (typeof recordToSystemRow === 'function') ? recordToSystemRow(r) : {};
        const tree = treeInfoV144(r.treeType || r.species || 'Karaçam');
        return [
          r.barcode, tree.agacAdi, r.treeType, r.species, r.productType, sys.odunAdi, r.qualityClass, r.length,
          r.diameter, r.quantity, r.desi, r.uretimTarihi, r.createdAt
        ].join(' ').toLowerCase().includes(query);
      });
    }

    safeV144(() => {
      getFilteredRecords = function(){ return filteredRecordsV144(); };
    });

    function totalsFromV144(list){
      const totals = {
        all:0, adet:0,
        Tomruk:0, TomrukAdet:0,
        'Maden Direk':0, MadenAdet:0,
        'Kağıtlık':0, KagitAdet:0,
        'Sanayi Odunu':0, SanayiAdet:0,
        'Tel Direk':0, TelAdet:0
      };
      (Array.isArray(list) ? list : []).forEach(r => {
        const qty = Number(r.quantity) || 0;
        const value = Number(r.desi) || 0;
        const key = (typeof normalizeProductType === 'function') ? normalizeProductType(r.productType || 'Tomruk') : (r.productType || 'Tomruk');
        totals.all += value;
        totals.adet += qty;
        if (Object.prototype.hasOwnProperty.call(totals, key)) totals[key] += value;
        if (key === 'Tomruk') totals.TomrukAdet += qty;
        if (key === 'Maden Direk') totals.MadenAdet += qty;
        if (key === 'Kağıtlık') totals.KagitAdet += qty;
        if (key === 'Sanayi Odunu') totals.SanayiAdet += qty;
        if (key === 'Tel Direk') totals.TelAdet += qty;
      });
      return totals;
    }

    safeV144(() => {
      render = function(){
        const filtered = filteredRecordsV144();
        if (typeof cleanSelectedRecordIds === 'function') cleanSelectedRecordIds();
        if (!state.selectedRecordIds) state.selectedRecordIds = new Set();

        if (els.recordsBody) {
          els.recordsBody.innerHTML = filtered.map((r) => {
            const sys = (typeof recordToSystemRow === 'function') ? recordToSystemRow(r) : {};
            const tree = treeInfoV144(r.treeType || r.species || 'Karaçam');
            const treeClass = (typeof normalizeTreeClass === 'function') ? normalizeTreeClass(r.treeType || r.species || 'Karaçam') : '';
            const productClass = (typeof normalizeProductClass === 'function') ? normalizeProductClass(r.productType || 'Tomruk') : '';
            const sysOdun = sys.odunAdi || r.productType || 'Tomruk';
            return `
              <tr class="clickable-row" onclick="editRecord('${escV144(r.id)}')">
                <td class="select-col"><input class="record-select" type="checkbox" ${state.selectedRecordIds.has(r.id) ? 'checked' : ''} onclick="event.stopPropagation()" onchange="toggleRecordSelection('${escV144(r.id)}', this.checked)" /></td>
                <td>${(state.records || []).length - (state.records || []).indexOf(r)}</td>
                <td><b>${escV144(r.barcode)}</b></td>
                <td><span class="tag tree-tag ${treeClass}">${escV144(tree.agacAdi)}</span></td>
                <td><span class="tag ${productClass}">${escV144(sysOdun)}</span></td>
                <td class="num">${escV144(sys.boy || r.length || '')}</td>
                <td class="num">${escV144(sys.cap || r.diameter || '')}</td>
                <td class="num">${escV144(sys.adet || r.quantity || '')}</td>
                <td class="num">${fmtM3V144(Number(r.desi || 0))} m³</td>
                <td>${escV144(sys.uretimTarihi || r.uretimTarihi || '')}</td>
                <td>
                  <button class="mini-btn edit-mini" onclick="event.stopPropagation(); editRecord('${escV144(r.id)}')">Düzelt</button>
                  <button class="mini-btn delete-mini" onclick="event.stopPropagation(); deleteRecord('${escV144(r.id)}')">Sil</button>
                </td>
              </tr>`;
          }).join('');
        }

        if (els.emptyState) els.emptyState.style.display = filtered.length ? 'none' : 'block';
        if (typeof updateBulkActions === 'function') updateBulkActions(filtered);

        const active = activeTreeFilterV144();
        const activeLabel = active === 'all' ? '' : ` • ${treeInfoV144(active).agacAdi}`;
        if (els.recordCount) {
          const totalCount = (state.records || []).length;
          els.recordCount.textContent = active === 'all'
            ? `${totalCount.toLocaleString('tr-TR')} kayıt`
            : `${filtered.length.toLocaleString('tr-TR')}/${totalCount.toLocaleString('tr-TR')} kayıt${activeLabel}`;
        }

        if (typeof renderRecentBarcodes === 'function') renderRecentBarcodes();
        if (typeof renderDailyWorkSummary === 'function') renderDailyWorkSummary();

        const totals = totalsFromV144(filtered);
        if (els.totalDesi) els.totalDesi.textContent = fmtM3V144(totals.all);
        if (els.totalAdet) els.totalAdet.textContent = totals.adet.toLocaleString('tr-TR');
        if (els.totalTomruk) els.totalTomruk.textContent = fmtM3V144(totals.Tomruk) + ' m³';
        if (els.totalTomrukAdet) els.totalTomrukAdet.textContent = totals.TomrukAdet.toLocaleString('tr-TR') + ' adet';
        if (els.totalMaden) els.totalMaden.textContent = fmtM3V144(totals['Maden Direk']) + ' m³';
        if (els.totalMadenAdet) els.totalMadenAdet.textContent = totals.MadenAdet.toLocaleString('tr-TR') + ' adet';
        if (els.totalKagit) els.totalKagit.textContent = fmtM3V144(totals['Kağıtlık']) + ' m³';
        if (els.totalKagitAdet) els.totalKagitAdet.textContent = totals.KagitAdet.toLocaleString('tr-TR') + ' adet';
        if (els.totalSanayi) els.totalSanayi.textContent = fmtM3V144(totals['Sanayi Odunu']) + ' m³';
        if (els.totalSanayiAdet) els.totalSanayiAdet.textContent = totals.SanayiAdet.toLocaleString('tr-TR') + ' adet';
        if (els.totalTel) els.totalTel.textContent = fmtM3V144(totals['Tel Direk']) + ' m³';
        if (els.totalTelAdet) els.totalTelAdet.textContent = totals.TelAdet.toLocaleString('tr-TR') + ' adet';

        const setPrintZero = (el, adet, hacim) => {
          const card = el ? el.closest('.stat') : null;
          if (!card) return;
          card.classList.toggle('print-zero', !(Number(adet) || Number(hacim)));
        };
        setPrintZero(els.totalTomruk, totals.TomrukAdet, totals.Tomruk);
        setPrintZero(els.totalMaden, totals.MadenAdet, totals['Maden Direk']);
        setPrintZero(els.totalKagit, totals.KagitAdet, totals['Kağıtlık']);
        setPrintZero(els.totalSanayi, totals.SanayiAdet, totals['Sanayi Odunu']);
        setPrintZero(els.totalTel, totals.TelAdet, totals['Tel Direk']);

        if (els.recordsFoot) {
          els.recordsFoot.innerHTML = filtered.length ? `
            <tr class="table-total-row">
              <td colspan="7">Alttaki liste toplamı</td>
              <td class="num">${totals.adet.toLocaleString('tr-TR')} adet</td>
              <td class="num">${fmtM3V144(totals.all)} m³</td>
              <td colspan="2"></td>
            </tr>` : '';
        }

        renderTreeFilterV144();
        setTimeout(() => {
          safeV144(() => renderMobileRecordsV111(true));
          safeV144(() => updateFlowTabsV111());
          safeV144(() => hideOldNavsV111());
        }, 20);
      };
    });

    safeV144(() => {
      getBeyanTotals = function(){
        const list = (typeof filteredRecordsV144 === 'function') ? filteredRecordsV144() : (state.records || []);
        const t = totalsFromV144(list);
        return {
          all: t.all,
          adet: t.adet,
          products: {
            'Tomruk': { label:'Tomruk', className:'tomruk', volume:t.Tomruk, adet:t.TomrukAdet },
            'Maden Direk': { label:'Maden Direği', className:'maden', volume:t['Maden Direk'], adet:t.MadenAdet },
            'Kağıtlık': { label:'Kağıtlık', className:'kagit', volume:t['Kağıtlık'], adet:t.KagitAdet },
            'Sanayi Odunu': { label:'Sanayi Odunu', className:'sanayi', volume:t['Sanayi Odunu'], adet:t.SanayiAdet },
            'Tel Direk': { label:'Tel Direği', className:'tel', volume:t['Tel Direk'], adet:t.TelAdet }
          }
        };
      };
    });

    function patchClearInputsV144(){
      const btn = document.getElementById('clearInputsBtn');
      if (!btn || btn.__v144ClearBound) return;
      btn.__v144ClearBound = true;
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        if (!confirm('Giriş alanları, barkod ve kısayol butonları temizlensin mi?')) return;
        safeV144(() => { if (els.length) els.length.value = ''; });
        safeV144(() => { if (els.diameter) els.diameter.value = ''; });
        safeV144(() => { if (els.barcode) els.barcode.value = ''; });
        safeV144(() => { if (els.quantity) els.quantity.value = '1'; });
        safeV144(() => { state.settings.recentLengths = []; state.settings.recentDiameters = []; });
        safeV144(() => saveSettings());
        safeV144(() => renderRecentChips());
        safeV144(() => updateInputPlaceholders());
        safeV144(() => updateLiveDesi());
        safeV144(() => updateDuplicateWarning());
        safeV144(() => { const cl = document.getElementById('cleanLengthV111'); if (cl) cl.value = ''; });
        safeV144(() => { const cd = document.getElementById('cleanDiameterV111'); if (cd) cd.value = ''; });
        if (typeof showSuccessToast === 'function') showSuccessToast('Alanlar, barkod ve kısayol butonları temizlendi.');
        else if (typeof showToast === 'function') showToast('Alanlar temizlendi.');
        safeV144(() => focusDiameterKeepKeyboard());
      }, true);
    }

    function bootV144(){
      moveHomeSummaryV144();
      ensureTreeFilterV144();
      renderTreeFilterV144();
      patchTreeSelectionV144();
      patchClearInputsV144();
      safeV144(() => { if (typeof render === 'function') render(); });
    }

    readyV144(bootV144);
    setTimeout(bootV144, 200);
    setTimeout(bootV144, 800);
    window.mesahaV144SetTreeFilter = setTreeFilterV144;
  })();
  

;


/* script block 12 id="mesaha-v145-tree-total-js" */

(function(){
  'use strict';
  const VERSION_TEXT_V145 = (window.MESAHA_VERSION_TEXT || 'Mesaha İO');
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


;


/* script block 13 id="mesaha-v146-home-simple-js" */

(function(){
  'use strict';
  const VERSION_TEXT_V146 = (window.MESAHA_VERSION_TEXT || 'Mesaha İO');
  const FILE_VERSION_V146 = 'v146';

  function readyV146(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true });
    else fn();
  }
  function safeV146(fn){ try { return fn(); } catch(err) { return undefined; } }
  function blurActiveV146(){
    safeV146(() => {
      const active = document.activeElement;
      if (active && active !== document.body && typeof active.blur === 'function') active.blur();
    });
  }
  function setOldNavActiveV146(){
    safeV146(() => {
      const entry = (typeof els !== 'undefined' && els && els.navEntry) ? els.navEntry : document.getElementById('navEntry');
      const records = (typeof els !== 'undefined' && els && els.navRecords) ? els.navRecords : document.getElementById('navRecords');
      const guide = (typeof els !== 'undefined' && els && els.navGuide) ? els.navGuide : document.getElementById('navGuide');
      const admin = (typeof els !== 'undefined' && els && els.navAdmin) ? els.navAdmin : document.getElementById('navAdmin');
      if (entry) entry.classList.add('active');
      if (records) records.classList.remove('active');
      if (guide) guide.classList.remove('active');
      if (admin) admin.classList.remove('active');
    });
  }
  function closeInlineSimpleV146(){
    // Ana Sayfa tuşu sadece ana ekrana dönsün; giriş alanlarına fokus atıp klavye açmasın.
    safeV146(() => {
      if (typeof setInlineSimpleV122 === 'function') { setInlineSimpleV122(false); return; }
      if (typeof setInlineSimpleV119 === 'function') { setInlineSimpleV119(false); return; }
      if (typeof closeInlineSimpleV119 === 'function') { closeInlineSimpleV119(); return; }
    });
    safeV146(() => {
      document.body.classList.remove('inline-simple-v119','clean-simple-open-v111','clean-keyboard-v118');
      const overlay = document.getElementById('cleanSimpleOverlayV111');
      if (overlay) {
        overlay.classList.remove('show');
        overlay.style.setProperty('display','none','important');
        overlay.style.setProperty('visibility','hidden','important');
        overlay.style.setProperty('pointer-events','none','important');
      }
    });
  }
  function goHomeNoKeyboardV146(event){
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    }
    blurActiveV146();
    closeInlineSimpleV146();
    safeV146(() => document.body.classList.remove('show-records','show-guide','show-admin'));
    setOldNavActiveV146();
    safeV146(() => { if (typeof updateFlowTabsV111 === 'function') updateFlowTabsV111(); });
    safeV146(() => { if (typeof renderMobileRecordsV111 === 'function') renderMobileRecordsV111(true); });
    safeV146(() => { if (typeof hideOldNavsV111 === 'function') hideOldNavsV111(); });
    safeV146(() => { const home = document.getElementById('mesahaHomeV143'); if (home) home.scrollIntoView({ block:'start', behavior:'smooth' }); });
    [0, 60, 180, 360].forEach(ms => setTimeout(blurActiveV146, ms));
    setTimeout(syncHomeSimpleV146, 90);
  }
  function toggleSimpleFromHomeV146(event){
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    }
    blurActiveV146();
    safeV146(() => document.body.classList.remove('show-records','show-guide','show-admin'));
    const topBtn = document.getElementById('openSimpleV112');
    if (topBtn) {
      safeV146(() => topBtn.click());
    } else {
      safeV146(() => {
        if (typeof toggleInlineSimpleV122 === 'function') toggleInlineSimpleV122();
        else if (typeof toggleInlineSimpleV119 === 'function') toggleInlineSimpleV119();
        else if (typeof openCleanSimpleV111 === 'function') openCleanSimpleV111();
      });
    }
    [0, 90, 220].forEach(ms => setTimeout(blurActiveV146, ms));
    setTimeout(syncHomeSimpleV146, 140);
  }
  function bindHomeNoKeyboardV146(){
    const tabs = document.getElementById('flowTabsV111');
    if (tabs && !tabs.__v146HomeNoKeyboard) {
      tabs.__v146HomeNoKeyboard = true;
      tabs.addEventListener('click', function(event){
        const btn = event.target && event.target.closest ? event.target.closest('[data-flow-tab="entry"]') : null;
        if (!btn) return;
        goHomeNoKeyboardV146(event);
      }, true);
    }
    const navEntry = (typeof els !== 'undefined' && els && els.navEntry) ? els.navEntry : document.getElementById('navEntry');
    if (navEntry && !navEntry.__v146HomeNoKeyboard) {
      navEntry.__v146HomeNoKeyboard = true;
      navEntry.addEventListener('click', goHomeNoKeyboardV146, true);
    }
  }
  function bindHomeSimpleV146(){
    const btn = document.querySelector('[data-home-simple-v146]');
    if (!btn || btn.__v146SimpleBound) return;
    btn.__v146SimpleBound = true;
    btn.addEventListener('click', toggleSimpleFromHomeV146, true);
    btn.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') toggleSimpleFromHomeV146(event);
    });
  }
  function syncHomeSimpleV146(){
    const btn = document.querySelector('[data-home-simple-v146]');
    if (!btn) return;
    const on = document.body.classList.contains('inline-simple-v119') || document.body.classList.contains('clean-simple-open-v111');
    btn.classList.toggle('is-active', on);
    const title = document.getElementById('homeSimpleV146');
    const hint = document.getElementById('homeSimpleHintV146');
    if (title) title.textContent = on ? 'Aktif' : 'Hızlı Kayıt';
    if (hint) hint.textContent = on ? 'Giriş modu açık' : 'Dokun ve hızlı girişe geç';
  }
  function applyVersionV146(){
    safeV146(() => { document.title = VERSION_TEXT_V146; });
    safeV146(() => { const h1 = document.querySelector('.brand h1'); if (h1) h1.textContent = VERSION_TEXT_V146; });
    safeV146(() => {
      window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, {
        fileVersion: FILE_VERSION_V146,
        visibleVersion: VERSION_TEXT_V146,
        homeTabNoKeyboard: true,
        homeSimpleButton: true
      });
    });
  }
  function bootV146(){
    bindHomeNoKeyboardV146();
    bindHomeSimpleV146();
    syncHomeSimpleV146();
    applyVersionV146();
  }
  readyV146(bootV146);
  [50, 250, 800, 1600, 2600].forEach(ms => setTimeout(bootV146, ms));
  setInterval(applyVersionV146, 2500);
  safeV146(() => {
    if (typeof render === 'function' && !render.__v146VersionWrapped) {
      const oldRenderV146 = render;
      render = function(){
        const result = oldRenderV146.apply(this, arguments);
        setTimeout(applyVersionV146, 40);
        setTimeout(syncHomeSimpleV146, 80);
        return result;
      };
      render.__v146VersionWrapped = true;
    }
  });
  document.addEventListener('click', (event) => {
    if (event.target && event.target.closest && event.target.closest('#openSimpleV112,[data-home-simple-v146],[data-flow-tab="entry"]')) {
      setTimeout(syncHomeSimpleV146, 80);
      setTimeout(blurActiveV146, 160);
    }
  }, true);
})();


;


/* script block 14 id="mesaha-v147-fix-js" */

(function(){
  'use strict';
  const VERSION_TEXT_V147 = (window.MESAHA_VERSION_TEXT || 'Mesaha İO');
  const FILE_VERSION_V147 = 'v147';
  function safe(fn){ try { return fn(); } catch(e) { return undefined; } }
  function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function blurActive(){
    safe(() => {
      const a = document.activeElement;
      if (a && a !== document.body && typeof a.blur === 'function') a.blur();
    });
  }
  function goHomeNoKeyboard(){
    blurActive();
    safe(() => { if (typeof showHomeV143 === 'function') showHomeV143(); });
    safe(() => { document.body.classList.remove('inline-simple-v119','show-records','show-guide','show-admin'); });
    blurActive();
  }
  function boot(){
    safe(() => { document.title = VERSION_TEXT_V147; });
    safe(() => { const h1 = document.querySelector('.brand h1'); if (h1) h1.textContent = VERSION_TEXT_V147; });
    safe(() => { window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, { fileVersion: FILE_VERSION_V147, visibleVersion: VERSION_TEXT_V147, packageFix:true }); });
    document.querySelectorAll('#homeBtn,[data-tab="home"],.bottom-tab.home,[data-flow-tab="home"]').forEach(btn => {
      if (btn.__v147HomeBound) return;
      btn.__v147HomeBound = true;
      btn.addEventListener('click', function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        if (typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
        goHomeNoKeyboard();
      }, true);
    });
  }
  ready(boot);
  [80,300,900,1800].forEach(ms => setTimeout(boot, ms));
})();


;


/* script block 15 id="mesaha-v149-tree-filter-position-js" */

(function(){
  'use strict';
  const VERSION_TEXT_V149 = (window.MESAHA_VERSION_TEXT || 'Mesaha İO');
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


;
