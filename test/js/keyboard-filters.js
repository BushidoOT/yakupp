/* script block 18 id="mesaha-v153-keyboard-save-fix-js" */

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


/* script block 19 id="mesaha-v155-stability-fix-js" */

(function(){
  'use strict';
  var VERSION='Mesaha İO v1.99';
  function safe(fn){ try{return fn();}catch(e){} }
  function apply(){
    safe(function(){ document.title=VERSION; });
    safe(function(){ var h=document.querySelector('.brand h1'); if(h) h.textContent=VERSION; });
    safe(function(){
      document.querySelectorAll('button, a, .chip, .nav-item, .seg-btn, .bottom-nav button').forEach(function(el){
        if ((el.textContent||'').trim()==='↩ Normal' || (el.textContent||'').trim()==='Normal') { el.textContent='🏠 Ana Sayfaya Dön'; }
      });
    });
    safe(function(){ window.MESAHA_RECORDS_PAGE_SIZE=20; });
    safe(function(){ window.MESAHA_BUILD_INFO=Object.assign({}, window.MESAHA_BUILD_INFO||{}, {fileVersion:'v155', visibleVersion:VERSION, leakFix:true, recordsPageSize:20}); });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', apply, {once:true}); else apply();
  [100,400,1200,2500].forEach(function(ms){ setTimeout(apply, ms); });
})();


;


/* script block 20 id="mesaha-v156-filter-keyboard-fix-js" */

/* v156: Ölçümler ağaç filtresi kesin düzeltme + hızlı girişte klavye açık kalsın */
(function(){
  'use strict';
  var VERSION_V156 = 'Mesaha İO v1.99';
  var FILE_VERSION_V156 = 'v157';
  var TREE_FILTER_KEY_V156 = 'mesaha_tree_filter_v144';
  var PAGE_SIZE_V156 = 20;
  var TREE_ORDER_V156 = ['Karaçam','Sarıçam','Sedir','Göknar','Kızılçam'];
  var lastInlineSubmitV156 = 0;

  function safe(fn, fallback){ try { return fn(); } catch(e) { return fallback; } }
  function byId(id){ return document.getElementById(id); }
  function esc(v){
    try { if (typeof escapeHtml === 'function') return escapeHtml(v); } catch(e) {}
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]; });
  }
  function fmtM3(desi){
    try { if (typeof formatHacimFromDesi === 'function') return formatHacimFromDesi(Number(desi)||0); } catch(e) {}
    return ((Number(desi)||0)/1000).toLocaleString('tr-TR', {minimumFractionDigits:3, maximumFractionDigits:3});
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
  function treeOfRecord(r){
    return normalizeTreeKey(r && (r.treeType || r.species || r.agacAdi || r.agac || r['ağaç']) || 'Karaçam');
  }
  function allRecords(){ return safe(function(){ return Array.isArray(state.records) ? state.records : []; }, []); }
  function activeTreeFilter(){
    var val = safe(function(){ return state && state.treeFilterV144; }, '') || '';
    if (!val || val === 'Tümü') val = safe(function(){ return localStorage.getItem(TREE_FILTER_KEY_V156) || 'all'; }, 'all');
    if (!val || val === 'Tümü') val = 'all';
    return val === 'all' ? 'all' : normalizeTreeKey(val);
  }
  function setTreeFilter(value){
    var val = (!value || value === 'all' || value === 'Tümü') ? 'all' : normalizeTreeKey(value);
    safe(function(){ state.treeFilterV144 = val; });
    safe(function(){ localStorage.setItem(TREE_FILTER_KEY_V156, val); });
    safe(function(){ state.__v152Page = 1; });
    renderTreeFilter();
    if (typeof render === 'function') render();
  }
  function queryText(r){
    var sys = safe(function(){ return typeof recordToSystemRow === 'function' ? (recordToSystemRow(r) || {}) : {}; }, {});
    var tree = treeInfo(r && (r.treeType || r.species || 'Karaçam'));
    return [r && r.barcode, tree.agacAdi, r && r.treeType, r && r.species, r && r.productType, sys.odunAdi, r && r.qualityClass, r && r.length, r && r.diameter, r && r.quantity, r && r.desi, r && r.uretimTarihi, r && r.createdAt].join(' ').toLocaleLowerCase('tr-TR');
  }
  function filteredRecords(){
    var records = allRecords();
    var filter = activeTreeFilter();
    var q = safe(function(){ return els && els.searchInput ? String(els.searchInput.value || '').trim().toLocaleLowerCase('tr-TR') : ''; }, '');
    var list = records;
    if (filter !== 'all') list = list.filter(function(r){ return treeOfRecord(r) === filter; });
    if (q) list = list.filter(function(r){ return queryText(r).indexOf(q) >= 0; });
    return list;
  }
  function treeList(){ return TREE_ORDER_V156.slice(); }
  function ensureTreeFilter(){
    var panelBody = document.querySelector('.records-panel .panel-body');
    if (!panelBody) return null;
    var wrap = byId('treeFilterV144');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'treeFilterV144';
      wrap.className = 'tree-filter-v144';
    }
    var tools = document.querySelector('.records-panel .tools');
    var totals = document.querySelector('.records-panel .totals');
    if (tools && wrap.nextSibling !== tools) panelBody.insertBefore(wrap, tools);
    else if (!wrap.parentNode) panelBody.insertBefore(wrap, totals ? totals.nextSibling : panelBody.firstChild);
    if (!wrap.__v156Bound) {
      wrap.__v156Bound = true;
      wrap.addEventListener('click', function(event){
        var btn = event.target && event.target.closest ? event.target.closest('button[data-tree-filter-v144]') : null;
        if (!btn) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
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
    treeList().forEach(function(tree){
      var key = normalizeTreeKey(tree), label = treeInfo(key).agacAdi || key;
      html += '<button type="button" data-tree-filter-v144="' + esc(key) + '" class="' + (active === key ? 'active' : '') + '">' + esc(label) + ' (' + (counts[key] || 0).toLocaleString('tr-TR') + ')</button>';
    });
    wrap.innerHTML = html;
  }
  function ensurePager(){
    var pager = byId('recordsPagerV152');
    if (!pager) {
      pager = document.createElement('div');
      pager.id = 'recordsPagerV152';
      pager.className = 'records-pager-v152';
      var tableWrap = document.querySelector('.records-panel .table-wrap');
      if (tableWrap && tableWrap.parentNode) tableWrap.parentNode.insertBefore(pager, tableWrap.nextSibling);
    }
    if (!pager.__v156Bound) {
      pager.__v156Bound = true;
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
  function rowsHtml(pageRecords){
    return (pageRecords || []).map(function(r){
      var sys = safe(function(){ return typeof recordToSystemRow === 'function' ? (recordToSystemRow(r) || {}) : {}; }, {});
      var tree = treeInfo(r && (r.treeType || r.species || 'Karaçam'));
      var treeClass = safe(function(){ return typeof normalizeTreeClass === 'function' ? normalizeTreeClass(r && (r.treeType || r.species || 'Karaçam')) : ''; }, '');
      var prodClass = safe(function(){ return typeof normalizeProductClass === 'function' ? normalizeProductClass(r && (r.productType || 'Tomruk')) : ''; }, '');
      var id = esc(r && r.id || '');
      var orderNo = allRecords().length - allRecords().indexOf(r);
      var checked = safe(function(){ return state.selectedRecordIds && state.selectedRecordIds.has(r.id); }, false);
      var odun = sys.odunAdi || (r && r.productType) || 'Tomruk';
      return '<tr class="clickable-row" onclick="editRecord(\'' + id + '\')">' +
        '<td class="select-col"><input class="record-select" type="checkbox" ' + (checked ? 'checked' : '') + ' onclick="event.stopPropagation()" onchange="toggleRecordSelection(\'' + id + '\', this.checked)" /></td>' +
        '<td>' + orderNo + '</td><td><b>' + esc(r && r.barcode) + '</b></td>' +
        '<td><span class="tag tree-tag ' + treeClass + '">' + esc(tree.agacAdi) + '</span></td>' +
        '<td><span class="tag ' + prodClass + '">' + esc(odun) + '</span></td>' +
        '<td class="num">' + esc(sys.boy || (r && r.length) || '') + '</td>' +
        '<td class="num">' + esc(sys.cap || (r && r.diameter) || '') + '</td>' +
        '<td class="num">' + esc(sys.adet || (r && r.quantity) || '') + '</td>' +
        '<td class="num">' + fmtM3(Number(r && r.desi || 0)) + ' m³</td>' +
        '<td>' + esc(sys.uretimTarihi || (r && r.uretimTarihi) || '') + '</td>' +
        '<td><button class="mini-btn edit-mini" onclick="event.stopPropagation(); editRecord(\'' + id + '\')">Düzelt</button><button class="mini-btn delete-mini" onclick="event.stopPropagation(); deleteRecord(\'' + id + '\')">Sil</button></td>' +
        '</tr>';
    }).join('');
  }
  function renderV156(){
    var filtered = filteredRecords();
    safe(function(){ if (typeof cleanSelectedRecordIds === 'function') cleanSelectedRecordIds(); });
    safe(function(){ if (!state.selectedRecordIds) state.selectedRecordIds = new Set(); });
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE_V156));
    var page = Math.max(1, Math.min(totalPages, Number(safe(function(){ return state.__v152Page; }, 1)) || 1));
    safe(function(){ state.__v152Page = page; state.__v152TotalPages = totalPages; });
    var startIndex = filtered.length ? (page - 1) * PAGE_SIZE_V156 : 0;
    var pageRecords = filtered.slice(startIndex, startIndex + PAGE_SIZE_V156);
    var endIndex = filtered.length ? startIndex + pageRecords.length : 0;
    safe(function(){ state.__v152PageRecords = pageRecords; state.__v152FilteredRecords = filtered; });
    if (els && els.recordsBody) els.recordsBody.innerHTML = rowsHtml(pageRecords);
    if (els && els.emptyState) els.emptyState.style.display = filtered.length ? 'none' : 'block';
    safe(function(){ if (typeof updateBulkActions === 'function') updateBulkActions(pageRecords); });
    var active = activeTreeFilter();
    if (els && els.recordCount) {
      var allCount = allRecords().length;
      var label = active === 'all' ? '' : ' • ' + (treeInfo(active).agacAdi || active);
      els.recordCount.textContent = active === 'all' ? allCount.toLocaleString('tr-TR') + ' kayıt' : filtered.length.toLocaleString('tr-TR') + '/' + allCount.toLocaleString('tr-TR') + ' kayıt' + label;
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
    renderPager(filtered.length, page, totalPages, startIndex + 1, endIndex);
    renderTreeFilter();
    safe(function(){ if (typeof renderMobileRecordsV111 === 'function') renderMobileRecordsV111(true); });
    safe(function(){ if (typeof updateFlowTabsV111 === 'function') updateFlowTabsV111(); });
    safe(function(){ if (typeof hideOldNavsV111 === 'function') hideOldNavsV111(); });
  }
  function focusTarget(){
    var overlayOpen = document.body.classList.contains('clean-simple-open-v111');
    if (overlayOpen) {
      var clean = byId('cleanDiameterV111');
      if (clean && clean.offsetParent !== null) return clean;
    }
    return byId('diameter') || byId('cleanDiameterV111');
  }
  function focusDiameter(){
    var d = focusTarget(); if (!d) return;
    try { d.focus({ preventScroll:true }); } catch(e) { try { d.focus(); } catch(x) {} }
    try { var len = String(d.value || '').length; d.setSelectionRange(len, len); } catch(e) {}
  }
  function scheduleFocus(){ [0,40,120,260,520].forEach(function(ms){ setTimeout(focusDiameter, ms); }); }
  function isInlineSimple(){ return document.body.classList.contains('inline-simple-v119'); }
  function submitInlineSimple(event){
    if (!isInlineSimple()) return;
    var now = Date.now();
    if (now - lastInlineSubmitV156 < 450) {
      if (event) { event.preventDefault(); event.stopPropagation(); if (event.stopImmediatePropagation) event.stopImmediatePropagation(); }
      return;
    }
    lastInlineSubmitV156 = now;
    if (event) { event.preventDefault(); event.stopPropagation(); if (event.stopImmediatePropagation) event.stopImmediatePropagation(); }
    focusDiameter();
    var form = byId('entryForm');
    var btn = byId('submitBtn');
    setTimeout(function(){
      try { if (form && form.requestSubmit) form.requestSubmit(btn || undefined); else if (form) form.dispatchEvent(new Event('submit', {bubbles:true, cancelable:true})); } catch(e) { try { if (btn) btn.click(); } catch(x) {} }
      scheduleFocus();
    }, 0);
  }
  function bindKeyboard(){
    var submit = byId('submitBtn');
    var form = byId('entryForm');
    if (submit && !submit.__v156Keyboard) {
      submit.__v156Keyboard = true;
      submit.setAttribute('tabindex','-1');
      ['pointerdown','touchstart','mousedown'].forEach(function(type){
        submit.addEventListener(type, function(event){ if (isInlineSimple()) { event.preventDefault(); focusDiameter(); } }, true);
      });
      ['pointerup','touchend'].forEach(function(type){ submit.addEventListener(type, submitInlineSimple, true); });
      submit.addEventListener('click', function(event){
        if (isInlineSimple() && Date.now() - lastInlineSubmitV156 < 700) { event.preventDefault(); event.stopPropagation(); if (event.stopImmediatePropagation) event.stopImmediatePropagation(); return; }
        scheduleFocus();
      }, true);
    }
    if (form && !form.__v156Keyboard) {
      form.__v156Keyboard = true;
      form.addEventListener('submit', function(){ scheduleFocus(); }, false);
    }
    ['cleanSaveV111','cleanHeaderSaveV113'].forEach(function(id){
      var b = byId(id);
      if (b && !b.__v156Keyboard) {
        b.__v156Keyboard = true;
        b.setAttribute('tabindex','-1');
        b.addEventListener('click', function(){ scheduleFocus(); }, true);
        b.addEventListener('pointerdown', function(){ focusDiameter(); }, true);
      }
    });
  }
  function applyVersion(){
    safe(function(){ document.title = VERSION_V156; });
    safe(function(){ var h = document.querySelector('.brand h1'); if (h) h.textContent = VERSION_V156; });
    safe(function(){ window.MESAHA_RECORDS_PAGE_SIZE = PAGE_SIZE_V156; });
    safe(function(){ window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, { fileVersion:FILE_VERSION_V156, visibleVersion:VERSION_V156, treeFilterFixed:true, quickKeyboardFixed:true, recordsPageSize:PAGE_SIZE_V156, todayDateDefault:true, restoreZipInfoClean:true }); });
  }
  function install(){
    applyVersion();
    bindKeyboard();
    ensureTreeFilter();
    renderTreeFilter();
    safe(function(){ getFilteredRecords = filteredRecords; });
    safe(function(){ render = renderV156; });
    safe(function(){ if (typeof getBeyanTotals === 'function' || true) getBeyanTotals = function(){ var t = totalsFrom(filteredRecords()); return { all:t.all, adet:t.adet, products:{ 'Tomruk':{label:'Tomruk', className:'tomruk', volume:t.Tomruk, adet:t.TomrukAdet}, 'Maden Direk':{label:'Maden Direği', className:'maden', volume:t['Maden Direk'], adet:t.MadenAdet}, 'Kağıtlık':{label:'Kağıtlık', className:'kagit', volume:t['Kağıtlık'], adet:t.KagitAdet}, 'Sanayi Odunu':{label:'Sanayi Odunu', className:'sanayi', volume:t['Sanayi Odunu'], adet:t.SanayiAdet}, 'Tel Direk':{label:'Tel Direği', className:'tel', volume:t['Tel Direk'], adet:t.TelAdet} } }; }; });
    safe(function(){ if (typeof render === 'function') render(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true}); else install();
  [80,250,700,1500,3000,5200].forEach(function(ms){ setTimeout(install, ms); });
  setInterval(function(){ applyVersion(); bindKeyboard(); }, 1500);
  window.mesahaV156SetTreeFilter = setTreeFilter;
})();


;
