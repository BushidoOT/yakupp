/* Mesaha İO v169 Modüler Stabil - app-22.js */
(function(){
  'use strict';
  var VISIBLE_VERSION='Mesaha İO v1.98', FILE_VERSION='v169';
  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn,{once:true}); else fn(); }
  function safe(fn,fallback){ try{return fn();}catch(e){return fallback;} }
  function byId(id){ return document.getElementById(id); }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];}); }
  function norm(v){ return String(v==null?'':v).trim().replace(/\s+/g,' '); }
  function lower(v){ return norm(v).toLocaleLowerCase('tr-TR'); }
  function toast(msg){ safe(function(){ if(typeof showSuccessToast==='function') showSuccessToast(msg); else if(typeof showToast==='function') showToast(msg); }); }
  function err(msg){ safe(function(){ if(typeof showErrorToast==='function') showErrorToast(msg); else if(typeof showToast==='function') showToast(msg); }); }
  function ensureState(){ safe(function(){ if(!window.state) return; if(!state.settings) state.settings={}; if(!Array.isArray(state.settings.kesimcilerV158)) state.settings.kesimcilerV158=[]; if(typeof state.settings.activeKesimciV158!=='string') state.settings.activeKesimciV158=''; }); }
  function records(){ return safe(function(){ return Array.isArray(state.records)?state.records:[]; }, []); }
  function recCutter(r){ return norm(r && (r.kesimci || r.kesimciAdi || r.cutterName || r.cutter || r.kesimciIsmi) || ''); }
  function saveSettingsSafe(){ safe(function(){ if(typeof saveSettings==='function') saveSettings(); }); safe(function(){ localStorage.setItem('mesaha_settings', JSON.stringify(state.settings||{})); }); }
  function configuredCutters(){ ensureState(); var list=safe(function(){return Array.isArray(state.settings.kesimcilerV158)?state.settings.kesimcilerV158:[];},[]); var seen=Object.create(null), out=[]; list.concat(records().map(recCutter)).forEach(function(n){n=norm(n);var k=lower(n);if(n&&!seen[k]){seen[k]=true;out.push(n);}}); out.sort(function(a,b){return a.localeCompare(b,'tr-TR');}); safe(function(){state.settings.kesimcilerV158=out;}); return out; }
  function activeCutter(){ return norm(safe(function(){return state.settings.activeKesimciV158;},'')||''); }
  function setActiveCutter(name){ ensureState(); name=norm(name); safe(function(){state.settings.activeKesimciV158=name;}); saveSettingsSafe(); renderCutterButtons(); safe(function(){ if(typeof focusDiameterKeepKeyboard==='function') focusDiameterKeepKeyboard(); }); }
  window.getActiveKesimciNameV163=function(){ return activeCutter(); };
  function addCutter(){ ensureState(); var name=window.prompt('Kesimci ismini yazınız:'); if(name===null) return; name=norm(name); if(!name){err('Kesimci ismi boş olamaz.'); return;} var list=configuredCutters(); if(!list.some(function(x){return lower(x)===lower(name);})){ list.push(name); } list.sort(function(a,b){return a.localeCompare(b,'tr-TR');}); safe(function(){state.settings.kesimcilerV158=list; state.settings.activeKesimciV158=name;}); saveSettingsSafe(); renderCutterButtons(); toast('Kesimci eklendi: '+name); safe(function(){ if(typeof render==='function') render(); }); }
  function cutterRecordCount(name){
    var key=lower(name);
    if(!key) return 0;
    return records().filter(function(r){ return lower(recCutter(r))===key; }).length;
  }
  function deleteCutter(name){
    ensureState();
    name=norm(name);
    if(!name) return;
    var count=cutterRecordCount(name);
    if(count>0){
      window.alert('Bu kesimciye ait kayıtlar var.\n\nBu kesimciye bağlı '+count+' kayıt bulundu. Kayıt varken kesimci adı silinmez.');
      err('Bu kesimciye ait kayıtlar var: '+count+' kayıt');
      return;
    }
    if(!window.confirm(name+' kesimci seçeneklerden silinsin mi?')) return;
    var list=configuredCutters().filter(function(x){return lower(x)!==lower(name);});
    safe(function(){state.settings.kesimcilerV158=list; if(lower(state.settings.activeKesimciV158)===lower(name)) state.settings.activeKesimciV158='';});
    saveSettingsSafe();
    renderCutterButtons();
    toast('Kesimci silindi: '+name);
    safe(function(){ if(typeof render==='function') render(); });
  }
  function ensureCutterPanel(){ var form=byId('entryForm'); if(!form) return null; var panel=byId('cutterPanelV158'); if(!panel){ panel=document.createElement('div'); panel.id='cutterPanelV158'; var treePanel=form.querySelector('.tree-compact')||byId('treeType')||form.firstElementChild; if(treePanel&&treePanel.parentNode===form) form.insertBefore(panel,treePanel); else form.insertBefore(panel,form.firstChild); } panel.className='cutter-panel-v158 cutter-panel-v163'; if(!panel.__v163Bound){ panel.__v163Bound=true; panel.addEventListener('click',function(event){ var del=event.target&&event.target.closest?event.target.closest('[data-cutter-delete-v163]'):null; if(del){event.preventDefault();event.stopPropagation();deleteCutter(del.getAttribute('data-cutter-delete-v163')||'');return;} var sel=event.target&&event.target.closest?event.target.closest('[data-cutter-select-v163]'):null; if(sel){event.preventDefault();event.stopPropagation();setActiveCutter(sel.getAttribute('data-cutter-select-v163')||'');return;} var add=event.target&&event.target.closest?event.target.closest('#cutterAddBtnV163'):null; if(add){event.preventDefault();event.stopPropagation();addCutter();return;} },true); } return panel; }
  function renderCutterButtons(){ var panel=ensureCutterPanel(); if(!panel) return; var active=activeCutter(); var list=configuredCutters(); var html='<div class="cutter-head-v163"><span class="cutter-title-v163">Kesimci</span><span class="cutter-sub-v163">İsteğe bağlı</span></div><div class="cutter-actions-v163">'; html+='<button type="button" class="cutter-chip-v163 '+(!active?'active':'')+'" data-cutter-select-v163="">Kesimci seçilmedi</button>'; list.forEach(function(n){ var a=lower(n)===lower(active); html+='<button type="button" class="cutter-chip-v163 '+(a?'active':'')+'" data-cutter-select-v163="'+esc(n)+'"><span>'+esc(n)+'</span><span class="cutter-delete-v163" data-cutter-delete-v163="'+esc(n)+'" aria-label="Kesimci sil">×</span></button>'; }); html+='<button type="button" id="cutterAddBtnV163" class="cutter-add-v163"><span class="plus-v163">+</span> Kesimci Ekle</button></div><p class="cutter-hint-v163">Kayıt seçili kesimci adına kaydedilir. Ölçümlerden kesimciye göre adet ve m³ filtrelenir.</p>'; panel.innerHTML=html; }
  function recordsBody(){
    return document.querySelector('.records-panel .panel-body') || document.querySelector('#recordsPanel .panel-body') || document.querySelector('.records-panel') || null;
  }
  function findDownloadAnchor(body){
    if(!body) return null;
    var nodes=Array.from(body.querySelectorAll('button,a'));
    var btn=nodes.find(function(el){ return /Mesaha\s*Dosyas|Dosyasını\s*İndir|Dosyası\s*İndir/i.test(el.textContent||''); });
    if(btn) return btn.closest('.tools,.export-tools,.download-tools,.records-tools,.actions,.card,.section,div') || btn.parentElement;
    return body.querySelector('.tools,.export-tools,.download-tools,.records-tools,.actions');
  }
  function orderRecordFilters(){
    var tree=byId('treeFilterV144');
    var cutter=byId('cutterFilterV158');
    if(!tree && !cutter) return;
    var body=recordsBody();
    if(!body) return;
    var anchor=findDownloadAnchor(body);
    if(tree){
      if(anchor && anchor.parentNode===body) body.insertBefore(tree, anchor);
      else if(tree.parentNode!==body) body.insertBefore(tree, body.firstChild);
    }
    if(cutter){
      if(tree && tree.parentNode) tree.parentNode.insertBefore(cutter, tree.nextSibling);
      else if(anchor && anchor.parentNode===body) body.insertBefore(cutter, anchor);
      else if(cutter.parentNode!==body) body.insertBefore(cutter, body.firstChild);
    }
    // Son güvenlik: Ağaç filtresi her zaman üstte, kesimci hemen altında kalsın.
    if(tree && cutter && tree.parentNode && cutter.parentNode && tree.parentNode===cutter.parentNode && tree.nextSibling!==cutter){
      tree.parentNode.insertBefore(cutter, tree.nextSibling);
    }
  }
  function patchVersion(){ safe(function(){document.title=VISIBLE_VERSION;}); safe(function(){var h=document.querySelector('.brand h1'); if(h) h.textContent=VISIBLE_VERSION;}); safe(function(){window.MESAHA_BUILD_INFO=Object.assign({},window.MESAHA_BUILD_INFO||{},{fileVersion:FILE_VERSION,visibleVersion:VISIBLE_VERSION,cutterButtonSelect:true,cutterDelete:true,cutterDeleteLockedWhenRecords:true,cutterDirectSave:true,recordFiltersFixedOrder:true});}); }
  function afterRender(){ renderCutterButtons(); orderRecordFilters(); patchVersion(); }
  function wrapRender(){ safe(function(){ if(typeof window.render!=='function'||window.render.__v163Wrapped) return; var old=window.render; window.render=function(){ var result=old.apply(this,arguments); setTimeout(afterRender,0); return result; }; window.render.__v163Wrapped=true; }); }
  function install(){ ensureState(); wrapRender(); afterRender(); [120,350,800,1600,3200,5200].forEach(function(ms){setTimeout(function(){wrapRender();afterRender();},ms);}); }
  ready(install); window.addEventListener('load',install,{once:true}); setInterval(function(){wrapRender();afterRender();},900);
})();
