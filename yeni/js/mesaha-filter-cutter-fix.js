(function(){
  'use strict';
  if(window.__mesahaFilterCutterFixV454) return;
  window.__mesahaFilterCutterFixV454 = true;

  var SETTINGS_KEY='cam_mesaha_ayarlar_v1';
  var STORAGE_KEY='cam_mesaha_kayitlari_v1';
  var REMOVED_KEY='mesaha_removed_cutters_v407';
  var timer=0;
  var rendering=false;
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
    try{var s=appState(); if(s){ if(!s.settings)s.settings={}; Object.assign(s.settings,st); st=s.settings; }}catch(e){}
    jsonSet(SETTINGS_KEY,st);
    try{ if(window.__flushSettings) window.__flushSettings(); }catch(e){}
    dispatch('mesaha:settings-saved',{source:'v454-filter-cutter-fix'});
  }
  function uniq(arr){var out=[];(arr||[]).forEach(function(x){x=clean(x); if(x && out.indexOf(x)<0)out.push(x)}); return out}
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
  function cutterOf(r){return clean(r && (r.cutter || r.kesimci))}
  function treeOf(r){return clean(r && (r.treeType || r.agac || r.tree || r.agacTuru))}
  function countTree(name,list){list=list||records(); name=clean(name)||'Tümü'; if(name==='Tümü')return list.length; return list.filter(function(r){return treeOf(r)===name}).length}
  function countCutter(name,list){list=list||records(); name=clean(name)||'Tümü'; if(name==='Tümü')return list.length; if(name==='Kesimci kaydı yok')return list.filter(function(r){return !cutterOf(r)}).length; return list.filter(function(r){return cutterOf(r)===name}).length}

  function syncCutterStore(){
    var st=settings();
    if(!Array.isArray(st.cutters)) st.cutters=[];
    var list=uniq([].concat(st.cutters||[], st.activeCutter||[], records().map(cutterOf)));
    var active=clean(st.activeCutter);
    if(active) unmarkRemoved(active);
    var removed=readRemoved();
    list=list.filter(function(n){return removed.indexOf(n)<0 || countCutter(n)>0 || n===active});
    var old=JSON.stringify(st.cutters||[]);
    st.cutters=list;
    if(active && st.cutters.indexOf(active)<0) st.cutters.unshift(active);
    if(st.cutterFilter && st.cutterFilter!=='Tümü' && st.cutterFilter!=='Kesimci kaydı yok' && st.cutters.indexOf(st.cutterFilter)<0 && countCutter(st.cutterFilter)===0) st.cutterFilter='Tümü';
    if(old!==JSON.stringify(st.cutters||[])) commitSettings(st);
    return st.cutters;
  }

  function filterLists(){
    var list=records(), st=settings();
    var treeNames=['Tümü'];
    uniq([].concat((st.visibleTrees||[]), COMMON_TREES, list.map(treeOf), st.treeFilter||[])).forEach(function(t){
      if(!t || t==='Tümü') return;
      if(countTree(t,list)>0 || t===st.treeFilter) treeNames.push(t);
    });
    var cutterNames=['Tümü'];
    if(countCutter('Kesimci kaydı yok',list)>0) cutterNames.push('Kesimci kaydı yok');
    syncCutterStore().forEach(function(c){ if(cutterNames.indexOf(c)<0) cutterNames.push(c); });
    var cf=clean(st.cutterFilter); if(cf && cutterNames.indexOf(cf)<0) cutterNames.push(cf);
    return {treeNames:treeNames,cutterNames:cutterNames,records:list,settings:st};
  }

  function renderFilters(){
    if(rendering) return;
    var treeWrap=$('treeFilters'), cutterWrap=$('cutterFilters');
    if(!treeWrap && !cutterWrap) return;
    rendering=true;
    try{
      var data=filterLists(), st=data.settings, list=data.records;
      if(!st.treeFilter) st.treeFilter='Tümü';
      if(!st.cutterFilter) st.cutterFilter='Tümü';
      if(treeWrap){
        var treeHtml=data.treeNames.map(function(t){var cnt=countTree(t,list); return '<button type="button" class="filter-chip '+(st.treeFilter===t?'active':'')+'" data-tree-filter="'+esc(t)+'">'+esc(t)+' ('+cnt+' kayıt)</button>';}).join('');
        if(treeWrap.innerHTML!==treeHtml) treeWrap.innerHTML=treeHtml;
        treeWrap.style.display='flex'; treeWrap.style.visibility='visible'; treeWrap.style.height='auto';
      }
      if(cutterWrap){
        var cutterHtml=data.cutterNames.map(function(c){var cnt=countCutter(c,list); return '<button type="button" class="filter-chip '+(st.cutterFilter===c?'active':'')+'" data-cutter-filter="'+esc(c)+'">'+esc(c)+' ('+cnt+' kayıt)</button>';}).join('');
        if(cutterWrap.innerHTML!==cutterHtml) cutterWrap.innerHTML=cutterHtml;
        cutterWrap.style.display='flex'; cutterWrap.style.visibility='visible'; cutterWrap.style.height='auto';
      }
      var th=$('treeFilterText'); if(th) th.textContent='Seçili: '+(st.treeFilter||'Tümü');
      var ch=$('cutterFilterText'); if(ch) ch.textContent='Seçili: '+(st.cutterFilter||'Tümü')+' ('+countCutter(st.cutterFilter||'Tümü',list)+' kayıt)';
    }catch(e){
      try{ if(window.MesahaErrorLogV446&&window.MesahaErrorLogV446.error) window.MesahaErrorLogV446.error('v454-filter-render',e); }catch(_){}
    }
    rendering=false;
  }

  function renderCuttersAndSelects(){
    syncCutterStore();
    try{ if(window.MesahaCutterManagerV406 && typeof window.MesahaCutterManagerV406.render==='function') window.MesahaCutterManagerV406.render(); }catch(e){}
    try{ if(window.MesahaBulkCutterTransferV406 && typeof window.MesahaBulkCutterTransferV406.populate==='function') window.MesahaBulkCutterTransferV406.populate(); }catch(e){}
    renderFilters();
  }

  function rerenderRecordsSoon(){
    try{ if(window.mesahaInvalidateRecordStatsV447) window.mesahaInvalidateRecordStatsV447(); }catch(e){}
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
        renderCuttersAndSelects();
      },220);
      setTimeout(renderCuttersAndSelects,700);
    }
  },true);

  ['mesaha:records-saved','mesaha:settings-saved','storage','online','offline'].forEach(function(evt){window.addEventListener(evt,function(){schedule(90)},false)});
  document.addEventListener('input',function(ev){if(ev.target && ev.target.id==='recordSearch') setTimeout(renderFilters,100)},true);
  document.addEventListener('change',function(ev){if(ev.target && (ev.target.id==='bulkCutterSelectV406' || ev.target.id==='recordSearch')) setTimeout(renderFilters,100)},true);
  window.addEventListener('pageshow',function(){schedule(120)});

  function boot(){
    renderCuttersAndSelects();
    [200,700,1500,3000].forEach(function(ms){setTimeout(renderCuttersAndSelects,ms)});
    var rec=$('recordsView');
    if(rec && window.MutationObserver && !rec.__v454FilterWatch){
      rec.__v454FilterWatch=true;
      new MutationObserver(function(){schedule(80)}).observe(rec,{childList:true,subtree:true});
    }
    setInterval(function(){
      var rv=$('recordsView'), ev=$('entryView');
      if((rv&&rv.classList.contains('active')) || (ev&&ev.classList.contains('active'))) renderCuttersAndSelects();
    },2200);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  window.MesahaFilterCutterFixV454={render:renderCuttersAndSelects,filters:renderFilters,syncCutters:syncCutterStore};
})();
