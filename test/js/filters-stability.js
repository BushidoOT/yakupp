/* Mesaha İO v180 - Ölçümler filtre sırası ve boş ağaç seçeneği düzeltmesi
   Yeni özellik eklemez; sadece mevcut ağaç/kesimci filtrelerini sabit ve temiz tutar. */
(function(){
  'use strict';
  var TREE_KEY = 'mesaha_tree_filter_v144';
  var TREE_ORDER = ['Karaçam','Sarıçam','Sedir','Göknar','Kızılçam'];
  var BUSY = false;

  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function safe(fn, fallback){ try { return fn(); } catch(e){ return fallback; } }
  function byId(id){ return document.getElementById(id); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]; }); }
  function normTree(v){
    try { if(typeof normalizeTreeType === 'function') return normalizeTreeType(v || 'Karaçam'); } catch(e) {}
    var raw = String(v || '').trim();
    if(!raw) return 'Karaçam';
    var k = raw.toLocaleLowerCase('tr-TR')
      .replace(/ı/g,'i').replace(/İ/g,'i').replace(/ğ/g,'g').replace(/Ğ/g,'g')
      .replace(/ü/g,'u').replace(/Ü/g,'u').replace(/ş/g,'s').replace(/Ş/g,'s')
      .replace(/ö/g,'o').replace(/Ö/g,'o').replace(/ç/g,'c').replace(/Ç/g,'c')
      .replace(/\s+/g,'');
    if(k.indexOf('sari') >= 0) return 'Sarıçam';
    if(k.indexOf('kizil') >= 0) return 'Kızılçam';
    if(k.indexOf('sedir') >= 0) return 'Sedir';
    if(k.indexOf('goknar') >= 0) return 'Göknar';
    return 'Karaçam';
  }
  function treeLabel(key){
    key = normTree(key);
    return safe(function(){ return (typeof getTreeInfo === 'function' && getTreeInfo(key).agacAdi) || key; }, key) || key;
  }
  function recTree(r){ return normTree(r && (r.treeType || r.species || r.agacAdi || r.agac || r['ağaç']) || 'Karaçam'); }
  function records(){ return safe(function(){ return Array.isArray(window.state.records) ? window.state.records : []; }, []); }
  function activeTree(){
    var val = safe(function(){ return window.state.treeFilterV144; }, '') || safe(function(){ return localStorage.getItem(TREE_KEY); }, '') || 'all';
    if(!val || val === 'Tümü' || val === 'all') return 'all';
    return normTree(val);
  }
  function setActiveTree(val){
    val = (!val || val === 'all' || val === 'Tümü') ? 'all' : normTree(val);
    safe(function(){ window.state.treeFilterV144 = val; });
    safe(function(){ localStorage.setItem(TREE_KEY, val); });
    safe(function(){ window.state.__v152Page = 1; });
  }
  function panelBody(){ return document.querySelector('.records-panel .panel-body') || document.querySelector('#recordsPanel .panel-body') || document.querySelector('.records-panel'); }
  function toolsAnchor(body){ return body && (body.querySelector('.tools') || body.querySelector('.export-tools,.download-tools,.records-tools,.actions')); }
  function ensureTreeWrap(){
    var body = panelBody(); if(!body) return null;
    var tree = byId('treeFilterV144');
    if(!tree){ tree = document.createElement('div'); tree.id = 'treeFilterV144'; tree.className = 'tree-filter-v144'; }
    tree.classList.add('tree-filter-v180-clean');
    if(!tree.__v180Click){
      tree.__v180Click = true;
      tree.addEventListener('click', function(event){
        var btn = event.target && event.target.closest ? event.target.closest('button[data-tree-filter-v144]') : null;
        if(!btn) return;
        event.preventDefault();
        event.stopPropagation();
        if(event.stopImmediatePropagation) event.stopImmediatePropagation();
        setActiveTree(btn.getAttribute('data-tree-filter-v144') || 'all');
        if(typeof window.render === 'function') window.render();
        setTimeout(stabilize, 20);
      }, true);
    }
    return tree;
  }
  function ensureCutterWrap(){
    var body = panelBody(); if(!body) return null;
    var cutter = byId('cutterFilterV158');
    if(!cutter){ cutter = document.createElement('div'); cutter.id = 'cutterFilterV158'; cutter.className = 'cutter-filter-v158'; }
    cutter.classList.add('cutter-filter-v180-clean');
    return cutter;
  }
  function orderFilters(){
    var body = panelBody(); if(!body) return;
    var anchor = toolsAnchor(body);
    var tree = ensureTreeWrap();
    var cutter = ensureCutterWrap();
    if(tree){
      if(anchor && anchor.parentNode === body) body.insertBefore(tree, anchor);
      else if(tree.parentNode !== body) body.insertBefore(tree, body.firstChild);
    }
    if(cutter){
      if(anchor && anchor.parentNode === body) body.insertBefore(cutter, anchor);
      else if(tree && tree.parentNode === body) body.insertBefore(cutter, tree.nextSibling);
      else if(cutter.parentNode !== body) body.insertBefore(cutter, body.firstChild);
    }
    if(tree && cutter && tree.parentNode === cutter.parentNode && tree.nextSibling !== cutter){
      tree.parentNode.insertBefore(cutter, tree.nextSibling);
    }
  }
  function renderTreeButtons(){
    var wrap = ensureTreeWrap(); if(!wrap) return;
    var rows = records();
    var counts = { all: rows.length };
    rows.forEach(function(r){ var k = recTree(r); counts[k] = (counts[k] || 0) + 1; });
    var active = activeTree();
    if(active !== 'all' && !counts[active]){ active = 'all'; setActiveTree('all'); }
    var present = TREE_ORDER.filter(function(t){ return (counts[normTree(t)] || 0) > 0; });
    Object.keys(counts).forEach(function(k){ if(k !== 'all' && present.indexOf(k) < 0) present.push(k); });
    var html = '<div class="tree-filter-title-v144"><span>Ağaç filtresi</span><small>Seçili: ' + esc(active === 'all' ? 'Tümü' : treeLabel(active)) + '</small></div>';
    html += '<button type="button" data-tree-filter-v144="all" class="' + (active === 'all' ? 'active' : '') + '">Tümü (' + (counts.all || 0).toLocaleString('tr-TR') + ')</button>';
    if(!present.length){
      html += '<button type="button" disabled>Ağaç kaydı yok</button>';
    }else{
      present.forEach(function(tree){
        var key = normTree(tree), count = counts[key] || 0;
        if(!count) return;
        html += '<button type="button" data-tree-filter-v144="' + esc(key) + '" class="' + (active === key ? 'active' : '') + '">' + esc(treeLabel(key)) + ' (' + count.toLocaleString('tr-TR') + ')</button>';
      });
    }
    if(wrap.__lastV180Html !== html){ wrap.innerHTML = html; wrap.__lastV180Html = html; }
  }
  function stabilize(){
    if(BUSY) return;
    BUSY = true;
    try{
      renderTreeButtons();
      ensureCutterWrap();
      orderFilters();
    }finally{
      BUSY = false;
    }
  }
  function wrapRender(){
    safe(function(){
      if(typeof window.render !== 'function' || window.render.__v180FilterStable) return;
      var old = window.render;
      window.render = function(){
        var out = old.apply(this, arguments);
        setTimeout(stabilize, 0);
        setTimeout(stabilize, 50);
        return out;
      };
      window.render.__v180FilterStable = true;
    });
  }
  function install(){
    wrapRender();
    stabilize();
    var body = panelBody();
    if(body && !body.__v180FilterObserver){
      body.__v180FilterObserver = true;
      var mo = new MutationObserver(function(){ setTimeout(stabilize, 0); });
      mo.observe(body, { childList:true });
    }
    safe(function(){ window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, { filterOrderLockV180:true, treeFilterOnlyExisting:true, darkCssSeparated:true }); });
  }
  ready(install);
  window.addEventListener('load', install, { once:true });
  [60, 180, 450, 900, 1800, 3600].forEach(function(ms){ setTimeout(install, ms); });
  setInterval(function(){ wrapRender(); stabilize(); }, 650);
})();
