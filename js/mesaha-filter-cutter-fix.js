(function(){
  'use strict';
  if(window.__mesahaFilterCutterFix) return;
  window.__mesahaFilterCutterFix = true;

  var SETTINGS_KEY='cam_mesaha_ayarlar_v1';
  var STORAGE_KEY='cam_mesaha_kayitlari_v1';
  var REMOVED_KEY='mesaha_removed_cutters_v407';
  var timer=0;
  var rendering=false;
  var statsCache=null;
  var COMMON_TREES=['Karaçam','Kayın','Sarıçam','Sedir','Göknar','Kızılçam'];

  function $(id){return document.getElementById(id)}
  function clean(v){return String(v==null?'':v).trim().replace(/\s+/g,' ')}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
  function jsonGet(k,f){try{var v=localStorage.getItem(k); return v?JSON.parse(v):f}catch(e){return f}}
  function jsonSet(k,v){try{localStorage.setItem(k,JSON.stringify(v)); return true}catch(e){return false}}
  function appState(){try{return window.state||null}catch(e){return null}}
  function records(){var s=appState(); var r=s&&Array.isArray(s.records)?s.records:jsonGet(STORAGE_KEY,[]); return Array.isArray(r)?r:[]}
  function settings(){var s=appState(); if(s){ if(!s.settings)s.settings={}; return s.settings; } return jsonGet(SETTINGS_KEY,{})||{} }
  function dispatch(name,detail){try{window.dispatchEvent(new CustomEvent(name,{detail:detail||{}}))}catch(e){}}
  function commitSettings(st){
    st=st||settings();
    try{var s=appState();if(s){if(!s.settings)s.settings={};Object.assign(s.settings,st);st=s.settings;}}catch(e){}
    try{
      if(window.MesahaStorageV527){window.MesahaStorageV527.saveSettings(st,{reason:'filter-cutter'});return;}
      if(window.__flushSettings){window.__flushSettings('filter-cutter');return;}
    }catch(e){}
    jsonSet(SETTINGS_KEY,st);
    dispatch('mesaha:settings-saved',{source:'filter-cutter-fallback'});
  }
  function uniq(arr){var out=[];(arr||[]).forEach(function(x){x=clean(x); if(x && out.indexOf(x)<0)out.push(x)}); return out}
  function cutterOf(r){return clean(r && (r.cutter || r.kesimci))}
  function treeOf(r){return clean(r && (r.treeType || r.agac || r.tree || r.agacTuru))}
  function recordSig(list){
    var last=list.length?list[list.length-1]:null;
    return list.length+'|'+(last?[(last.id||''),(last.updatedAt||''),(last.createdAt||''),cutterOf(last),treeOf(last)].join(':'):'');
  }
  function buildStats(){
    var list=records(), sig=recordSig(list);
    if(statsCache && statsCache.records===list && statsCache.sig===sig) return statsCache;
    var tree=Object.create(null), cutter=Object.create(null), cutterOrder=[], treeOrder=[], noCutter=0;
    list.forEach(function(r){
      var t=treeOf(r)||'Karaçam', c=cutterOf(r);
      if(!tree[t]) treeOrder.push(t); tree[t]=(tree[t]||0)+1;
      if(c){ if(!cutter[c]) cutterOrder.push(c); cutter[c]=(cutter[c]||0)+1; } else noCutter++;
    });
    statsCache={records:list,sig:sig,tree:tree,treeOrder:treeOrder,cutter:cutter,cutterOrder:cutterOrder,noCutter:noCutter,total:list.length};
    return statsCache;
  }
  function invalidateStats(){statsCache=null; try{ if(window.mesahaInvalidateRecordStatsV447) window.mesahaInvalidateRecordStatsV447(); }catch(e){}}
  function readRemoved(){
    var arr=jsonGet(REMOVED_KEY,[]); if(!Array.isArray(arr))arr=[];
    var st=settings(); if(st && Array.isArray(st.removedCuttersV407)) arr=arr.concat(st.removedCuttersV407);
    return uniq(arr);
  }
  function writeRemoved(arr){
    arr=uniq(arr||[]); jsonSet(REMOVED_KEY,arr);
    var st=settings(); st.removedCuttersV407=arr; commitSettings(st);
  }
  function unmarkRemoved(name){name=clean(name); if(!name)return; var list=readRemoved().filter(function(x){return clean(x)!==name}); writeRemoved(list)}
  function countTree(name,stats){stats=stats||buildStats(); name=clean(name)||'Tümü'; if(name==='Tümü')return stats.total; return stats.tree[name]||0}
  function countCutter(name,stats){stats=stats||buildStats(); name=clean(name)||'Tümü'; if(name==='Tümü')return stats.total; if(name==='Kesimci kaydı yok')return stats.noCutter||0; return stats.cutter[name]||0}

  function syncCutterStore(stats){
    stats=stats||buildStats();
    var st=settings();
    if(!Array.isArray(st.cutters)) st.cutters=[];
    var active=clean(st.activeCutter);
    if(active) unmarkRemoved(active);
    var removed=readRemoved();
    var list=uniq([].concat(st.cutters||[], active||[], stats.cutterOrder||[]));
    list=list.filter(function(n){return removed.indexOf(n)<0 || countCutter(n,stats)>0 || n===active});
    var old=JSON.stringify(st.cutters||[]);
    st.cutters=list;
    if(active && st.cutters.indexOf(active)<0) st.cutters.unshift(active);
    if(st.cutterFilter && st.cutterFilter!=='Tümü' && st.cutterFilter!=='Kesimci kaydı yok' && st.cutters.indexOf(st.cutterFilter)<0 && countCutter(st.cutterFilter,stats)===0) st.cutterFilter='Tümü';
    if(old!==JSON.stringify(st.cutters||[])) commitSettings(st);
    return st.cutters;
  }

  function filterLists(){
    var stats=buildStats(), st=settings();
    var treeNames=['Tümü'];
    uniq([].concat((st.visibleTrees||[]), COMMON_TREES, stats.treeOrder||[], st.treeFilter||[])).forEach(function(t){
      if(!t || t==='Tümü') return;
      if(countTree(t,stats)>0 || t===st.treeFilter) treeNames.push(t);
    });
    var cutterNames=['Tümü'];
    if(countCutter('Kesimci kaydı yok',stats)>0) cutterNames.push('Kesimci kaydı yok');
    syncCutterStore(stats).forEach(function(c){ if(cutterNames.indexOf(c)<0) cutterNames.push(c); });
    var cf=clean(st.cutterFilter); if(cf && cutterNames.indexOf(cf)<0) cutterNames.push(cf);
    return {treeNames:treeNames,cutterNames:cutterNames,stats:stats,settings:st};
  }

  function renderFilters(){
    if(rendering) return;
    var treeWrap=$('treeFilters'), cutterWrap=$('cutterFilters');
    if(!treeWrap && !cutterWrap) return;
    rendering=true;
    try{
      var data=filterLists(), st=data.settings, stats=data.stats;
      if(!st.treeFilter) st.treeFilter='Tümü';
      if(!st.cutterFilter) st.cutterFilter='Tümü';
      if(treeWrap){
        var treeHtml=data.treeNames.map(function(t){var cnt=countTree(t,stats); return '<button type="button" class="filter-chip '+(st.treeFilter===t?'active':'')+'" data-tree-filter="'+esc(t)+'">'+esc(t)+' ('+cnt+' kayıt)</button>';}).join('');
        if(treeWrap.innerHTML!==treeHtml) treeWrap.innerHTML=treeHtml;
        treeWrap.style.display='flex'; treeWrap.style.visibility='visible'; treeWrap.style.height='auto';
      }
      if(cutterWrap){
        var cutterHtml=data.cutterNames.map(function(c){var cnt=countCutter(c,stats); return '<button type="button" class="filter-chip '+(st.cutterFilter===c?'active':'')+'" data-cutter-filter="'+esc(c)+'">'+esc(c)+' ('+cnt+' kayıt)</button>';}).join('');
        if(cutterWrap.innerHTML!==cutterHtml) cutterWrap.innerHTML=cutterHtml;
        cutterWrap.style.display='flex'; cutterWrap.style.visibility='visible'; cutterWrap.style.height='auto';
      }
      var th=$('treeFilterText'); if(th) th.textContent='Seçili: '+(st.treeFilter||'Tümü');
      var ch=$('cutterFilterText'); if(ch) ch.textContent='Seçili: '+(st.cutterFilter||'Tümü')+' ('+countCutter(st.cutterFilter||'Tümü',stats)+' kayıt)';
    }catch(e){
      try{ if(window.MesahaErrorLog&&window.MesahaErrorLog.error) window.MesahaErrorLog.error('filter-render',e); }catch(_){}
    }
    rendering=false;
  }

  function renderCuttersAndSelects(){
    syncCutterStore(buildStats());
    try{ if(window.MesahaCutterManagerV406 && typeof window.MesahaCutterManagerV406.render==='function') window.MesahaCutterManagerV406.render(); }catch(e){}
    try{ if(window.MesahaBulkCutterTransferV406 && typeof window.MesahaBulkCutterTransferV406.populate==='function') window.MesahaBulkCutterTransferV406.populate(); }catch(e){}
    renderFilters();
  }

  function rerenderRecordsSoon(){
    invalidateStats();
    try{ if(typeof window.renderRecords==='function') window.renderRecords(); }catch(e){}
    try{ if(window.mesahaV303 && typeof window.mesahaV303.records==='function') window.mesahaV303.records(); }catch(e){}
    try{ if(window.mesahaV303 && typeof window.mesahaV303.render==='function') window.mesahaV303.render(); }catch(e){}
    setTimeout(renderFilters,80);
  }

  function schedule(delay){clearTimeout(timer); timer=setTimeout(function(){renderCuttersAndSelects();}, delay==null?60:delay)}

  document.addEventListener('click',function(ev){
    var filter=ev.target && ev.target.closest && ev.target.closest('[data-tree-filter],[data-cutter-filter]');
    if(filter){
      var st=settings();
      if(filter.hasAttribute('data-tree-filter')) st.treeFilter=filter.getAttribute('data-tree-filter')||'Tümü';
      if(filter.hasAttribute('data-cutter-filter')) st.cutterFilter=filter.getAttribute('data-cutter-filter')||'Tümü';
      commitSettings(st);
      setTimeout(rerenderRecordsSoon,20);
      return;
    }
    var add=ev.target && ev.target.closest && ev.target.closest('#addCutterBtn');
    if(add){
      setTimeout(function(){
        var st=settings();
        var active=clean(st.activeCutter);
        if(active){
          unmarkRemoved(active);
          if(!Array.isArray(st.cutters)) st.cutters=[];
          if(st.cutters.indexOf(active)<0) st.cutters.push(active);
          commitSettings(st);
        }
        invalidateStats();
        renderCuttersAndSelects();
      },220);
      setTimeout(renderCuttersAndSelects,700);
    }
  },true);

  ['mesaha:records-saved','mesaha:settings-saved','storage','online','offline'].forEach(function(evt){window.addEventListener(evt,function(){if(evt!=='mesaha:settings-saved') invalidateStats(); schedule(90)},false)});
  document.addEventListener('input',function(ev){if(ev.target && ev.target.id==='recordSearch') setTimeout(renderFilters,100)},true);
  document.addEventListener('change',function(ev){if(ev.target && (ev.target.id==='bulkCutterSelectV406' || ev.target.id==='recordSearch')) setTimeout(renderFilters,100)},true);
  window.addEventListener('pageshow',function(){schedule(120)});

  function boot(){
    renderCuttersAndSelects();
    [180,700,1800].forEach(function(ms){setTimeout(renderCuttersAndSelects,ms)});
    var rec=$('recordsView');
    if(rec && window.MutationObserver && !rec.__filterWatch){
      rec.__filterWatch=true;
      new MutationObserver(function(){schedule(80)}).observe(rec,{childList:true,subtree:true});
    }
    document.addEventListener('mesaha:view-changed',function(){schedule(80)},{passive:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  var api={render:renderCuttersAndSelects,filters:renderFilters,syncCutters:syncCutterStore,stats:buildStats,clearStats:invalidateStats};
  window.MesahaFilterCutterFix=api;
  window.MesahaFilterCutterFixV455=api;
  window.MesahaFilterCutterFixV454=api;
})();
