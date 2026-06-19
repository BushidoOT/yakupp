/* Mesaha İO v169 Modüler Stabil - app-04.js */
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
  
