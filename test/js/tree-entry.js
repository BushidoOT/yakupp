/* script block 4 id="mesaha-v144-istek-js" */

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


/* script block 5 id="mesaha-v153-keyboard-save-fix-js" */

/* v154: Kaydetten sonra çap klavyesi açık kalsın + ölçümler 20 kayıt/sayfa */
(function(){
  'use strict';
  const VERSION_TEXT_V153 = 'Mesaha İO v1.99';
  const FILE_VERSION_V153 = 'v154';
  function safe(fn){ try { return fn(); } catch(e) { return undefined; } }
  function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true }); else fn(); }
  function keepDiameterFocus(){
    safe(function(){
      const d = document.getElementById('diameter');
      if (!d) return;
      d.focus({ preventScroll:true });
      const len = String(d.value || '').length;
      try { d.setSelectionRange(len, len); } catch(e) {}
    });
  }
  function applyVersion(){
    safe(function(){ document.title = VERSION_TEXT_V153; });
    safe(function(){ const h1 = document.querySelector('.brand h1'); if (h1) h1.textContent = VERSION_TEXT_V153; });
    safe(function(){
      window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, {
        fileVersion: FILE_VERSION_V153,
        visibleVersion: VERSION_TEXT_V153,
        keyboardStayOpenAfterSave: true
      });
    });
  }
  function bind(){
    const form = document.getElementById('measureForm');
    const submit = document.getElementById('submitBtn');
    if (submit && !submit.__v153KeyboardBound) {
      submit.__v153KeyboardBound = true;
      submit.addEventListener('pointerdown', function(){
        keepDiameterFocus();
        setTimeout(keepDiameterFocus, 30);
        setTimeout(keepDiameterFocus, 120);
        setTimeout(keepDiameterFocus, 260);
      }, true);
      submit.addEventListener('click', function(){
        setTimeout(keepDiameterFocus, 30);
        setTimeout(keepDiameterFocus, 160);
        setTimeout(keepDiameterFocus, 320);
      }, true);
    }
    if (form && !form.__v153KeyboardBound) {
      form.__v153KeyboardBound = true;
      form.addEventListener('submit', function(){
        keepDiameterFocus();
        setTimeout(keepDiameterFocus, 40);
        setTimeout(keepDiameterFocus, 160);
        setTimeout(keepDiameterFocus, 320);
      }, false);
    }
  }
  ready(function(){ bind(); applyVersion(); });
  [80,240,700,1400,2600].forEach(function(ms){ setTimeout(function(){ bind(); applyVersion(); }, ms); });
  setInterval(applyVersion, 1200);
})();


;


/* script block 6 id="mesaha-v158-kesimci-js" */

(function(){
  'use strict';
  var VERSION_V158 = 'Mesaha İO v1.99';
  var FILE_VERSION_V158 = 'v158';
  var PAGE_SIZE_V158 = 20;
  var CUTTER_FILTER_KEY_V158 = 'mesaha_cutter_filter_v158';
  var TREE_FILTER_KEY_V158 = 'mesaha_tree_filter_v144';
  var TREE_ORDER_V158 = ['Karaçam','Sarıçam','Sedir','Göknar','Kızılçam'];
  var pendingSubmitV158 = null;

  function safe(fn, fallback){ try { return fn(); } catch(e) { return fallback; } }
  function byId(id){ return document.getElementById(id); }
  function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function esc(v){
    try { if (typeof escapeHtml === 'function') return escapeHtml(v); } catch(e) {}
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]; });
  }
  function jsq(v){ return String(v == null ? '' : v).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,' '); }
  function toast(msg){ safe(function(){ if (typeof showSuccessToast === 'function') showSuccessToast(msg); else if (typeof showToast === 'function') showToast(msg); }); }
  function errorToast(msg){ safe(function(){ if (typeof showErrorToast === 'function') showErrorToast(msg); else if (typeof showToast === 'function') showToast(msg); }); }
  function fmtM3(desi){
    try { if (typeof formatHacimFromDesi === 'function') return formatHacimFromDesi(Number(desi) || 0); } catch(e) {}
    return ((Number(desi) || 0) / 1000).toLocaleString('tr-TR', {minimumFractionDigits:3, maximumFractionDigits:3});
  }
  function normalizeTreeKey(value){
    try { if (typeof normalizeTreeType === 'function') return normalizeTreeType(value || 'Karaçam'); } catch(e) {}
    var raw = String(value || '').trim();
    if (!raw) return 'Karaçam';
    var key = raw.toLocaleLowerCase('tr-TR')
      .replace(/ı/g,'i').replace(/İ/g,'i').replace(/ğ/g,'g').replace(/Ğ/g,'g')
      .replace(/ü/g,'u').replace(/Ü/g,'u').replace(/ş/g,'s').replace(/Ş/g,'s')
      .replace(/ö/g,'o').replace(/Ö/g,'o').replace(/ç/g,'c').replace(/Ç/g,'c')
      .replace(/\s+/g,'');
    if (key.indexOf('sari') >= 0) return 'Sarıçam';
    if (key.indexOf('kizil') >= 0) return 'Kızılçam';
    if (key.indexOf('sedir') >= 0) return 'Sedir';
    if (key.indexOf('goknar') >= 0) return 'Göknar';
    return 'Karaçam';
  }
  function treeInfo(key){
    key = normalizeTreeKey(key);
    try { if (typeof getTreeInfo === 'function') return getTreeInfo(key); } catch(e) {}
    return { agacAdi:key };
  }
  function treeOfRecord(r){ return normalizeTreeKey(r && (r.treeType || r.species || r.agacAdi || r.agac || r['ağaç']) || 'Karaçam'); }
  function allRecords(){ return safe(function(){ return Array.isArray(state.records) ? state.records : []; }, []); }
  function cutterName(v){ return String(v == null ? '' : v).trim().replace(/\s+/g, ' '); }
  function cutterOfRecord(r){ return cutterName(r && (r.kesimci || r.kesimciAdi || r.cutterName || r.cutter || r.kesimciIsmi) || ''); }
  function cutterList(){
    var list = safe(function(){ return Array.isArray(state.settings.kesimcilerV158) ? state.settings.kesimcilerV158 : []; }, []);
    var seen = Object.create(null);
    var out = [];
    list.concat(allRecords().map(cutterOfRecord)).forEach(function(n){
      n = cutterName(n);
      var key = n.toLocaleLowerCase('tr-TR');
      if (n && !seen[key]) { seen[key] = true; out.push(n); }
    });
    out.sort(function(a,b){ return a.localeCompare(b, 'tr-TR'); });
    safe(function(){ state.settings.kesimcilerV158 = out; });
    return out;
  }
  function activeCutter(){ return cutterName(safe(function(){ return state.settings.activeKesimciV158; }, '') || ''); }
  function activeCutterFilter(){ return cutterName(safe(function(){ return state.cutterFilterV158; }, '') || safe(function(){ return localStorage.getItem(CUTTER_FILTER_KEY_V158); }, '') || 'all') || 'all'; }
  function persistSettings(){ safe(function(){ if (typeof saveSettings === 'function') saveSettings(); }); }
  function persistRecords(){ safe(function(){ if (typeof saveRecords === 'function') saveRecords(); }); }
  function setActiveCutter(name, renderSelect){
    name = cutterName(name);
    safe(function(){ state.settings.activeKesimciV158 = name; });
    persistSettings();
    if (renderSelect !== false) renderCutterSelect();
  }
  function addCutter(name){
    name = cutterName(name);
    if (!name) return;
    var list = cutterList();
    if (!list.some(function(x){ return x.toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR'); })) list.push(name);
    list.sort(function(a,b){ return a.localeCompare(b, 'tr-TR'); });
    safe(function(){ state.settings.kesimcilerV158 = list; });
    setActiveCutter(name, false);
    renderCutterSelect();
    renderCutterFilter();
    persistSettings();
  }
  function ensureCutterState(){
    safe(function(){
      if (!state.settings) state.settings = {};
      if (!Array.isArray(state.settings.kesimcilerV158)) state.settings.kesimcilerV158 = [];
      if (typeof state.settings.activeKesimciV158 !== 'string') state.settings.activeKesimciV158 = '';
      var list = cutterList();
      if (state.settings.activeKesimciV158 && !list.includes(state.settings.activeKesimciV158)) state.settings.kesimcilerV158.push(state.settings.activeKesimciV158);
    });
  }
  function ensureCutterInput(){
    var form = byId('entryForm');
    if (!form) return null;
    var panel = byId('cutterPanelV158');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'cutterPanelV158';
      panel.className = 'cutter-panel-v158';
      panel.innerHTML = '<div class="cutter-head-v158"><label for="cutterSelectV158">Kesimci</label><span class="pill">İsteğe bağlı</span></div>' +
        '<div class="cutter-row-v158"><select id="cutterSelectV158" aria-label="Kesimci seçimi"></select><button type="button" id="cutterAddBtnV158" class="cutter-add-v158"><span class="plus-v158">+</span> Kesimci Ekle</button></div>' +
        '<p class="hint cutter-hint-v158">Kayıt bu kesimci adıyla saklanır. Ölçümlerden kesimciye göre adet ve m³ filtreleyebilirsin.</p>';
      var treePanel = form.querySelector('.tree-compact') || byId('treeType') || form.firstElementChild;
      if (treePanel && treePanel.parentNode === form) form.insertBefore(panel, treePanel);
      else form.insertBefore(panel, form.firstChild);
    }
    if (!panel.__v158Bound) {
      panel.__v158Bound = true;
      panel.addEventListener('change', function(event){
        if (event.target && event.target.id === 'cutterSelectV158') {
          setActiveCutter(event.target.value || '', false);
          safe(function(){ if (typeof focusDiameterKeepKeyboard === 'function') focusDiameterKeepKeyboard(); });
        }
      });
      panel.addEventListener('click', function(event){
        var btn = event.target && event.target.closest ? event.target.closest('#cutterAddBtnV158') : null;
        if (!btn) return;
        event.preventDefault();
        var name = window.prompt('Kesimci ismini yazınız:');
        if (name === null) return;
        name = cutterName(name);
        if (!name) return errorToast('Kesimci ismi boş olamaz.');
        addCutter(name);
        toast('Kesimci eklendi: ' + name);
        safe(function(){ if (typeof focusDiameterKeepKeyboard === 'function') focusDiameterKeepKeyboard(); });
      });
    }
    renderCutterSelect();
    return panel;
  }
  function renderCutterSelect(){
    var sel = byId('cutterSelectV158');
    if (!sel) return;
    var active = activeCutter();
    var html = '<option value="">Kesimci seçilmedi</option>';
    cutterList().forEach(function(n){ html += '<option value="' + esc(n) + '" ' + (n === active ? 'selected' : '') + '>' + esc(n) + '</option>'; });
    sel.innerHTML = html;
  }
  function setCutterFilter(value){
    var val = cutterName(value || 'all') || 'all';
    safe(function(){ state.cutterFilterV158 = val; });
    safe(function(){ localStorage.setItem(CUTTER_FILTER_KEY_V158, val); });
    safe(function(){ state.__v152Page = 1; });
    if (typeof render === 'function') render();
  }
  function setTreeFilter(value){
    var val = (!value || value === 'all' || value === 'Tümü') ? 'all' : normalizeTreeKey(value);
    safe(function(){ state.treeFilterV144 = val; });
    safe(function(){ localStorage.setItem(TREE_FILTER_KEY_V158, val); });
    safe(function(){ state.__v152Page = 1; });
    if (typeof render === 'function') render();
  }
  function activeTreeFilter(){
    var val = safe(function(){ return state.treeFilterV144; }, '') || safe(function(){ return localStorage.getItem(TREE_FILTER_KEY_V158); }, '') || 'all';
    if (!val || val === 'Tümü') val = 'all';
    return val === 'all' ? 'all' : normalizeTreeKey(val);
  }
  function ensureTreeFilter(){
    var panelBody = document.querySelector('.records-panel .panel-body');
    if (!panelBody) return null;
    var wrap = byId('treeFilterV144');
    if (!wrap) { wrap = document.createElement('div'); wrap.id = 'treeFilterV144'; wrap.className = 'tree-filter-v144'; }
    var cutter = ensureCutterFilter();
    var tools = document.querySelector('.records-panel .tools');
    if (tools && wrap.parentNode !== panelBody) panelBody.insertBefore(wrap, tools);
    if (tools && cutter && cutter.parentNode === panelBody && wrap.nextSibling !== cutter) panelBody.insertBefore(wrap, cutter);
    if (tools && (!cutter || cutter.parentNode !== panelBody) && wrap.nextSibling !== tools) panelBody.insertBefore(wrap, tools);
    if (!wrap.__v158Bound) {
      wrap.__v158Bound = true;
      wrap.addEventListener('click', function(event){
        var btn = event.target && event.target.closest ? event.target.closest('button[data-tree-filter-v144]') : null;
        if (!btn) return;
        event.preventDefault(); event.stopPropagation(); if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        setTreeFilter(btn.getAttribute('data-tree-filter-v144') || 'all');
      }, true);
    }
    return wrap;
  }
  function renderTreeFilter(){
    var wrap = ensureTreeFilter(); if (!wrap) return;
    var records = allRecords();
    var active = activeTreeFilter();
    var counts = { all: records.length };
    records.forEach(function(r){ var k = treeOfRecord(r); counts[k] = (counts[k] || 0) + 1; });
    var activeLabel = active === 'all' ? 'Tümü' : (treeInfo(active).agacAdi || active);
    var html = '<div class="tree-filter-title-v144"><span>Ağaç filtresi</span><small>Seçili: ' + esc(activeLabel) + '</small></div>';
    html += '<button type="button" data-tree-filter-v144="all" class="' + (active === 'all' ? 'active' : '') + '">Tümü (' + (counts.all || 0).toLocaleString('tr-TR') + ')</button>';
    TREE_ORDER_V158.forEach(function(tree){ var key = normalizeTreeKey(tree), label = treeInfo(key).agacAdi || key; html += '<button type="button" data-tree-filter-v144="' + esc(key) + '" class="' + (active === key ? 'active' : '') + '">' + esc(label) + ' (' + (counts[key] || 0).toLocaleString('tr-TR') + ')</button>'; });
    wrap.innerHTML = html;
  }
  function ensureCutterFilter(){
    var panelBody = document.querySelector('.records-panel .panel-body');
    if (!panelBody) return null;
    var wrap = byId('cutterFilterV158');
    if (!wrap) { wrap = document.createElement('div'); wrap.id = 'cutterFilterV158'; wrap.className = 'cutter-filter-v158'; }
    var tools = document.querySelector('.records-panel .tools');
    var tree = byId('treeFilterV144');
    if (tools && wrap.parentNode !== panelBody) panelBody.insertBefore(wrap, tools);
    if (tools && tree && tree.parentNode === panelBody && tree.nextSibling !== wrap) panelBody.insertBefore(wrap, tree.nextSibling);
    if (!wrap.__v158Bound) {
      wrap.__v158Bound = true;
      wrap.addEventListener('click', function(event){
        var btn = event.target && event.target.closest ? event.target.closest('button[data-cutter-filter-v158]') : null;
        if (!btn) return;
        event.preventDefault(); event.stopPropagation(); if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        setCutterFilter(btn.getAttribute('data-cutter-filter-v158') || 'all');
      }, true);
    }
    return wrap;
  }
  function recordsAfterTree(){
    var tree = activeTreeFilter();
    var list = allRecords();
    if (tree !== 'all') list = list.filter(function(r){ return treeOfRecord(r) === tree; });
    return list;
  }
  function renderCutterFilter(){
    var wrap = ensureCutterFilter(); if (!wrap) return;
    var base = recordsAfterTree();
    var active = activeCutterFilter();
    var totals = Object.create(null);
    base.forEach(function(r){
      var n = cutterOfRecord(r);
      if (!n) return;
      if (!totals[n]) totals[n] = { adet:0, desi:0, rows:0 };
      totals[n].adet += Number(r.quantity || r.adet) || 0;
      totals[n].desi += Number(r.desi) || 0;
      totals[n].rows += 1;
    });
    var names = Object.keys(totals).sort(function(a,b){ return a.localeCompare(b, 'tr-TR'); });
    var activeLabel = active === 'all' ? 'Tümü' : active;
    var html = '<div class="cutter-filter-title-v158"><span>Kesimci filtresi</span><small>Seçili: ' + esc(activeLabel) + '</small></div>';
    html += '<button type="button" data-cutter-filter-v158="all" class="' + (active === 'all' ? 'active' : '') + '">Tümü</button>';
    if (!names.length) html += '<button type="button" disabled>Kesimci kaydı yok</button>';
    names.forEach(function(n){
      var t = totals[n];
      html += '<button type="button" data-cutter-filter-v158="' + esc(n) + '" class="' + (active === n ? 'active' : '') + '">' + esc(n) + ' (' + t.adet.toLocaleString('tr-TR') + ' adet • ' + fmtM3(t.desi) + ' m³)</button>';
    });
    wrap.innerHTML = html;
  }
  function queryText(r){
    var sys = safe(function(){ return typeof recordToSystemRow === 'function' ? (recordToSystemRow(r) || {}) : {}; }, {});
    var tree = treeInfo(r && (r.treeType || r.species || 'Karaçam'));
    return [r && r.barcode, cutterOfRecord(r), tree.agacAdi, r && r.treeType, r && r.species, r && r.productType, sys.odunAdi, r && r.qualityClass, r && r.length, r && r.diameter, r && r.quantity, r && r.desi, r && r.uretimTarihi, r && r.createdAt].join(' ').toLocaleLowerCase('tr-TR');
  }
  function filteredRecordsV158(){
    var list = allRecords();
    var tree = activeTreeFilter();
    var cutter = activeCutterFilter();
    var q = safe(function(){ return els && els.searchInput ? String(els.searchInput.value || '').trim().toLocaleLowerCase('tr-TR') : ''; }, '');
    if (tree !== 'all') list = list.filter(function(r){ return treeOfRecord(r) === tree; });
    if (cutter !== 'all') list = list.filter(function(r){ return cutterOfRecord(r) === cutter; });
    if (q) list = list.filter(function(r){ return queryText(r).indexOf(q) >= 0; });
    return list;
  }
  function totalsFrom(list){
    var t = { all:0, adet:0, Tomruk:0, TomrukAdet:0, 'Maden Direk':0, MadenAdet:0, 'Kağıtlık':0, KagitAdet:0, 'Sanayi Odunu':0, SanayiAdet:0, 'Tel Direk':0, TelAdet:0 };
    (list || []).forEach(function(r){
      var qty = Number(r && (r.quantity || r.adet)) || 0;
      var val = Number(r && r.desi) || 0;
      var key = r && (r.productType || r.woodType || r.odunAdi || 'Tomruk');
      try { if (typeof normalizeProductType === 'function') key = normalizeProductType(key); } catch(e) {}
      t.all += val; t.adet += qty;
      if (Object.prototype.hasOwnProperty.call(t, key)) t[key] += val;
      if (key === 'Tomruk') t.TomrukAdet += qty;
      if (key === 'Maden Direk') t.MadenAdet += qty;
      if (key === 'Kağıtlık') t.KagitAdet += qty;
      if (key === 'Sanayi Odunu') t.SanayiAdet += qty;
      if (key === 'Tel Direk') t.TelAdet += qty;
    });
    return t;
  }
  function ensurePager(){
    var pager = byId('recordsPagerV152');
    if (!pager) {
      pager = document.createElement('div'); pager.id = 'recordsPagerV152'; pager.className = 'records-pager-v152';
      var tableWrap = document.querySelector('.records-panel .table-wrap');
      if (tableWrap && tableWrap.parentNode) tableWrap.parentNode.insertBefore(pager, tableWrap.nextSibling);
    }
    if (!pager.__v158Bound) {
      pager.__v158Bound = true;
      pager.addEventListener('click', function(event){
        var btn = event.target && event.target.closest ? event.target.closest('[data-page-v152]') : null;
        if (!btn) return;
        event.preventDefault();
        var action = btn.getAttribute('data-page-v152');
        var totalPages = Number(safe(function(){ return state.__v152TotalPages; }, 1)) || 1;
        var page = Number(safe(function(){ return state.__v152Page; }, 1)) || 1;
        if (action === 'first') page = 1;
        if (action === 'prev') page -= 1;
        if (action === 'next') page += 1;
        if (action === 'last') page = totalPages;
        safe(function(){ state.__v152Page = Math.max(1, Math.min(totalPages, page)); });
        if (typeof render === 'function') render();
      });
    }
    return pager;
  }
  function renderPager(total, page, totalPages, start, end){
    var pager = ensurePager(); if (!pager) return;
    pager.style.display = total ? 'flex' : 'none';
    pager.innerHTML = '<div class="pager-info-v152">' + total.toLocaleString('tr-TR') + ' kayıt içinde ' + start.toLocaleString('tr-TR') + '-' + end.toLocaleString('tr-TR') + ' gösteriliyor<br><small>Sayfa ' + page.toLocaleString('tr-TR') + ' / ' + totalPages.toLocaleString('tr-TR') + ' • Her sayfada 20 kayıt.</small></div>' +
      '<div class="pager-actions-v152"><button type="button" class="ghost" data-page-v152="first" ' + (page<=1?'disabled':'') + '>İlk</button><button type="button" class="ghost" data-page-v152="prev" ' + (page<=1?'disabled':'') + '>Önceki</button><button type="button" data-page-v152="next" ' + (page>=totalPages?'disabled':'') + '>Sonraki</button><button type="button" class="ghost" data-page-v152="last" ' + (page>=totalPages?'disabled':'') + '>Son</button></div>';
  }
  function rowsHtml(pageRecords){
    return (pageRecords || []).map(function(r){
      var sys = safe(function(){ return typeof recordToSystemRow === 'function' ? (recordToSystemRow(r) || {}) : {}; }, {});
      var tree = treeInfo(r && (r.treeType || r.species || 'Karaçam'));
      var treeClass = safe(function(){ return typeof normalizeTreeClass === 'function' ? normalizeTreeClass(r && (r.treeType || r.species || 'Karaçam')) : ''; }, '');
      var prodClass = safe(function(){ return typeof normalizeProductClass === 'function' ? normalizeProductClass(r && (r.productType || 'Tomruk')) : ''; }, '');
      var id = String(r && r.id || '');
      var orderNo = allRecords().length - allRecords().indexOf(r);
      var checked = safe(function(){ return state.selectedRecordIds && state.selectedRecordIds.has(r.id); }, false);
      var odun = sys.odunAdi || (r && r.productType) || 'Tomruk';
      var cutter = cutterOfRecord(r);
      var cutterLine = cutter ? '<small class="record-cutter-v158">Kesimci: <b>' + esc(cutter) + '</b></small>' : '';
      return '<tr class="clickable-row" onclick="editRecord(\'' + jsq(id) + '\')">' +
        '<td class="select-col"><input class="record-select" type="checkbox" ' + (checked ? 'checked' : '') + ' onclick="event.stopPropagation()" onchange="toggleRecordSelection(\'' + jsq(id) + '\', this.checked)" /></td>' +
        '<td>' + orderNo + '</td><td><b>' + esc(r && r.barcode) + '</b>' + cutterLine + '</td>' +
        '<td><span class="tag tree-tag ' + treeClass + '">' + esc(tree.agacAdi) + '</span></td>' +
        '<td><span class="tag ' + prodClass + '">' + esc(odun) + '</span></td>' +
        '<td class="num">' + esc(sys.boy || (r && r.length) || '') + '</td>' +
        '<td class="num">' + esc(sys.cap || (r && r.diameter) || '') + '</td>' +
        '<td class="num">' + esc(sys.adet || (r && r.quantity) || '') + '</td>' +
        '<td class="num">' + fmtM3(Number(r && r.desi || 0)) + ' m³</td>' +
        '<td>' + esc(sys.uretimTarihi || (r && r.uretimTarihi) || '') + '</td>' +
        '<td><button class="mini-btn edit-mini" onclick="event.stopPropagation(); editRecord(\'' + jsq(id) + '\')">Düzelt</button><button class="mini-btn delete-mini" onclick="event.stopPropagation(); deleteRecord(\'' + jsq(id) + '\')">Sil</button></td>' +
        '</tr>';
    }).join('');
  }
  function renderMobileV158(){
    var wrap = byId('mobileRecordsV111'); if (!wrap) return;
    var list = safe(function(){ return state.__v152PageRecords || filteredRecordsV158().slice(0, PAGE_SIZE_V158); }, []);
    if (!state.selectedRecordIds) state.selectedRecordIds = new Set();
    if (!list.length) { wrap.innerHTML = '<div class="empty">Kayıt yok.</div>'; return; }
    wrap.innerHTML = list.map(function(r){
      var product = safe(function(){ return typeof normalizeProductType === 'function' ? normalizeProductType(r.productType || r.woodType || r.odunAdi || 'Tomruk') : (r.productType || 'Tomruk'); }, r.productType || 'Tomruk');
      var cls = safe(function(){ return typeof productClassV111 === 'function' ? productClassV111(product) : ''; }, '');
      var tree = r.treeType || r.agacAdi || 'Karaçam';
      var id = String(r.id || '');
      var checked = state.selectedRecordIds.has(id);
      var cutter = cutterOfRecord(r);
      return '<div class="record-row-v111 ' + esc(cls) + (checked ? ' selected' : '') + '" data-v111-row="' + esc(id) + '">' +
        '<label class="record-select-v111" title="Seç"><input type="checkbox" data-v111-select="' + esc(id) + '" ' + (checked ? 'checked' : '') + ' /></label>' +
        '<div class="record-main-v111"><b>' + esc(r.barcode || r.barkodNo || '-') + '</b><div class="record-tags-v111"><span class="mini-tag-v111 ' + esc(cls) + '">' + esc(safe(function(){ return productShortV111(product); }, product)) + '</span><span class="mini-tag-v111 tree">' + esc(safe(function(){ return treeShortV111(tree); }, tree)) + '</span>' + (cutter ? '<span class="mini-tag-v111 tree">' + esc(cutter) + '</span>' : '') + '</div></div>' +
        '<div class="record-values-v111"><div class="record-val-v111"><small>B</small><strong>' + esc(r.length || r.boy || '-') + '</strong></div><div class="record-val-v111"><small>Ç</small><strong>' + esc(r.diameter || r.cap || '-') + '</strong></div><div class="record-val-v111"><small>A</small><strong>' + esc(r.quantity || r.adet || 1) + '</strong></div></div>' +
        '<div class="record-actions-v111"><button type="button" class="record-edit-v111" data-v111-edit="' + esc(id) + '">Düz</button><button type="button" class="record-delete-v111" data-v111-delete="' + esc(id) + '">Sil</button></div></div>';
    }).join('');
  }
  function renderV158(){
    ensureCutterState(); ensureCutterInput();
    var filtered = filteredRecordsV158();
    safe(function(){ if (typeof cleanSelectedRecordIds === 'function') cleanSelectedRecordIds(); });
    safe(function(){ if (!state.selectedRecordIds) state.selectedRecordIds = new Set(); });
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE_V158));
    var page = Math.max(1, Math.min(totalPages, Number(safe(function(){ return state.__v152Page; }, 1)) || 1));
    safe(function(){ state.__v152Page = page; state.__v152TotalPages = totalPages; });
    var startIndex = filtered.length ? (page - 1) * PAGE_SIZE_V158 : 0;
    var pageRecords = filtered.slice(startIndex, startIndex + PAGE_SIZE_V158);
    var endIndex = filtered.length ? startIndex + pageRecords.length : 0;
    safe(function(){ state.__v152PageRecords = pageRecords; state.__v152FilteredRecords = filtered; });
    if (els && els.recordsBody) els.recordsBody.innerHTML = rowsHtml(pageRecords);
    if (els && els.emptyState) els.emptyState.style.display = filtered.length ? 'none' : 'block';
    safe(function(){ if (typeof updateBulkActions === 'function') updateBulkActions(pageRecords); });
    var tree = activeTreeFilter(); var cutter = activeCutterFilter();
    if (els && els.recordCount) {
      var allCount = allRecords().length;
      var labels = [];
      if (tree !== 'all') labels.push(treeInfo(tree).agacAdi || tree);
      if (cutter !== 'all') labels.push('Kesimci: ' + cutter);
      els.recordCount.textContent = labels.length ? filtered.length.toLocaleString('tr-TR') + '/' + allCount.toLocaleString('tr-TR') + ' kayıt • ' + labels.join(' • ') : allCount.toLocaleString('tr-TR') + ' kayıt';
    }
    safe(function(){ if (typeof renderRecentBarcodes === 'function') renderRecentBarcodes(); });
    safe(function(){ if (typeof renderDailyWorkSummary === 'function') renderDailyWorkSummary(); });
    var t = totalsFrom(filtered);
    safe(function(){
      if (els.totalDesi) els.totalDesi.textContent = fmtM3(t.all);
      if (els.totalAdet) els.totalAdet.textContent = t.adet.toLocaleString('tr-TR');
      if (els.totalTomruk) els.totalTomruk.textContent = fmtM3(t.Tomruk) + ' m³';
      if (els.totalTomrukAdet) els.totalTomrukAdet.textContent = t.TomrukAdet.toLocaleString('tr-TR') + ' adet';
      if (els.totalMaden) els.totalMaden.textContent = fmtM3(t['Maden Direk']) + ' m³';
      if (els.totalMadenAdet) els.totalMadenAdet.textContent = t.MadenAdet.toLocaleString('tr-TR') + ' adet';
      if (els.totalKagit) els.totalKagit.textContent = fmtM3(t['Kağıtlık']) + ' m³';
      if (els.totalKagitAdet) els.totalKagitAdet.textContent = t.KagitAdet.toLocaleString('tr-TR') + ' adet';
      if (els.totalSanayi) els.totalSanayi.textContent = fmtM3(t['Sanayi Odunu']) + ' m³';
      if (els.totalSanayiAdet) els.totalSanayiAdet.textContent = t.SanayiAdet.toLocaleString('tr-TR') + ' adet';
      if (els.totalTel) els.totalTel.textContent = fmtM3(t['Tel Direk']) + ' m³';
      if (els.totalTelAdet) els.totalTelAdet.textContent = t.TelAdet.toLocaleString('tr-TR') + ' adet';
    });
    if (els && els.recordsFoot) els.recordsFoot.innerHTML = filtered.length ? '<tr class="table-total-row"><td colspan="7">Seçili filtre toplamı</td><td class="num">' + t.adet.toLocaleString('tr-TR') + ' adet</td><td class="num">' + fmtM3(t.all) + ' m³</td><td colspan="2"></td></tr>' : '';
    renderTreeFilter(); renderCutterFilter(); renderPager(filtered.length, page, totalPages, startIndex + 1, endIndex); renderMobileV158(); renderCutterSelect();
    safe(function(){ if (typeof updateFlowTabsV111 === 'function') updateFlowTabsV111(); });
    safe(function(){ if (typeof hideOldNavsV111 === 'function') hideOldNavsV111(); });
  }
  function bindSubmitCutter(){
    var form = byId('entryForm'); if (!form || form.__v158CutterSubmit) return;
    form.__v158CutterSubmit = true;
    form.addEventListener('submit', function(){
      pendingSubmitV158 = { before: allRecords().length, editingId: safe(function(){ return state.editingId; }, null), cutter: activeCutter() };
      setTimeout(applyCutterToSavedRecord, 40);
      setTimeout(applyCutterToSavedRecord, 160);
      setTimeout(applyCutterToSavedRecord, 420);
    }, true);
  }
  function applyCutterToSavedRecord(){
    if (!pendingSubmitV158) return;
    var p = pendingSubmitV158;
    var rec = null;
    if (p.editingId) rec = allRecords().find(function(r){ return r && r.id === p.editingId; });
    else if (allRecords().length > p.before) rec = allRecords()[0];
    if (!rec) return;
    var cutter = cutterName(p.cutter);
    if (cutter) { rec.kesimci = cutter; rec.cutterName = cutter; }
    else { delete rec.kesimci; delete rec.cutterName; }
    pendingSubmitV158 = null;
    persistRecords();
    renderCutterFilter();
    safe(function(){ if (typeof render === 'function') render(); });
  }
  function wrapEditRecord(){
    safe(function(){
      if (typeof editRecord !== 'function' || editRecord.__v158Wrapped) return;
      var old = editRecord;
      editRecord = function(id){
        var result = old.apply(this, arguments);
        setTimeout(function(){
          var rec = allRecords().find(function(r){ return r && String(r.id) === String(id); });
          if (rec) setActiveCutter(cutterOfRecord(rec), true);
        }, 40);
        return result;
      };
      editRecord.__v158Wrapped = true;
    });
  }
  function bindSearchReset(){
    var search = safe(function(){ return els && els.searchInput; }, null);
    if (search && !search.__v158SearchReset) {
      search.__v158SearchReset = true;
      search.addEventListener('input', function(){ safe(function(){ state.__v152Page = 1; }); setTimeout(function(){ if (typeof render === 'function') render(); }, 80); });
    }
  }
  function applyVersion(){
    safe(function(){ document.title = VERSION_V158; });
    safe(function(){ var h = document.querySelector('.brand h1'); if (h) h.textContent = VERSION_V158; });
    safe(function(){ window.MESAHA_RECORDS_PAGE_SIZE = PAGE_SIZE_V158; });
    safe(function(){ window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, { fileVersion:FILE_VERSION_V158, visibleVersion:VERSION_V158, cutterSelect:true, cutterFilter:true, recordsPageSize:PAGE_SIZE_V158 }); });
  }
  function install(){
    ensureCutterState(); ensureCutterInput(); bindSubmitCutter(); wrapEditRecord(); bindSearchReset(); applyVersion();
    safe(function(){ getFilteredRecords = filteredRecordsV158; });
    safe(function(){ renderMobileRecordsV111 = renderMobileV158; });
    safe(function(){ render = renderV158; });
    safe(function(){ if (typeof render === 'function') render(); });
  }
  ready(install);
  [80,240,700,1400,2600,5200].forEach(function(ms){ setTimeout(install, ms); });
  setInterval(function(){ applyVersion(); ensureCutterInput(); bindSubmitCutter(); wrapEditRecord(); }, 2200);
  window.mesahaV158SetCutterFilter = setCutterFilter;
})();


;
