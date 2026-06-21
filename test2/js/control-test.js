(function(){
  'use strict';
  var INFO = window.MESAHA_VERSION || {};
  var VISIBLE_VERSION = INFO.visibleVersion || (window.MESAHA_VERSION_TEXT || 'Mesaha İO');
  var FILE_VERSION = INFO.version || 'v179';
  var CONTROL_KEY = 'mesaha_v171_control_log';
  var LAST_BACKUP_KEY = 'mesaha_v171_last_backup_info';
  var LAST_RESTORE_KEY = 'mesaha_v171_last_restore_info';
  var TEST_FLAG = '__testV171';
  var CHUNK = 500;

  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function safe(fn, fallback){ try { return fn(); } catch(e){ try{ console.warn('[v171]', e); }catch(_){} return fallback; } }
  function byId(id){ return document.getElementById(id); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]; }); }
  function norm(v){ return String(v == null ? '' : v).trim().replace(/\s+/g, ' '); }
  function lower(v){ return norm(v).toLocaleLowerCase('tr-TR'); }
  function num(v){ var n = Number(String(v == null ? '' : v).replace(',', '.')); return Number.isFinite(n) ? n : 0; }
  function records(){ return safe(function(){ return Array.isArray(state.records) ? state.records : []; }, []); }
  function settings(){ return safe(function(){ if(!state.settings) state.settings = {}; return state.settings; }, {}); }
  function toast(msg){ safe(function(){ if(typeof showSuccessToast === 'function') showSuccessToast(msg); else if(typeof showToast === 'function') showToast(msg); else console.log(msg); }); }
  function errorToast(msg){ safe(function(){ if(typeof showErrorToast === 'function') showErrorToast(msg); else if(typeof showToast === 'function') showToast(msg); else alert(msg); }); }
  function delay(ms){ return new Promise(function(resolve){ setTimeout(resolve, ms || 0); }); }
  function todayISO(){ var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
  function trDate(iso){ if(typeof isoToTRDate === 'function') return isoToTRDate(iso); var p=String(iso||'').split('-'); return p.length===3 ? p[2]+'.'+p[1]+'.'+p[0] : iso; }
  function fmtDateTime(){ return safe(function(){ return typeof formatDateTime === 'function' ? formatDateTime() : new Date().toLocaleString('tr-TR'); }, new Date().toLocaleString('tr-TR')); }
  function formatM3FromDesi(desi){ return safe(function(){ return typeof formatHacimFromDesi === 'function' ? formatHacimFromDesi(Number(desi)||0) : ((Number(desi)||0)/1000).toLocaleString('tr-TR',{minimumFractionDigits:3,maximumFractionDigits:3}); }, ((Number(desi)||0)/1000).toFixed(3).replace('.',',')); }
  function calcDesi(diameter, length, quantity){ return safe(function(){ return typeof calculateDesi === 'function' ? calculateDesi(diameter, length, quantity) : Math.round(0.00007854 * Number(diameter) * Number(diameter) * Number(length) * 1000 * Number(quantity || 1)); }, 0); }
  function cleanCutter(r){ return norm(r && (r.kesimci || r.kesimciAdi || r.cutterName || r.cutter || r.kesimciIsmi) || ''); }
  function cleanTree(r){ return norm(r && (r.treeType || r.species || r.agacAdi) || 'Karaçam') || 'Karaçam'; }
  function cleanProduct(r){ return norm(r && (r.productType || r.woodType || r.odunAdi) || 'Tomruk') || 'Tomruk'; }
  function qty(r){ return num(r && (r.quantity != null ? r.quantity : r.adet)) || 0; }
  function desi(r){ return num(r && r.desi) || (num(r && r.hacim) * 1000) || 0; }
  function fileDateName(){ var d=new Date(), p=function(n){return String(n).padStart(2,'0')}; return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'_'+p(d.getHours())+p(d.getMinutes()); }
  function newId(){ return safe(function(){ return crypto.randomUUID(); }, 'id_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2)); }
  function getLocalJSON(key, fallback){ return safe(function(){ var v=localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }, fallback); }
  function setLocalJSON(key, value){ safe(function(){ localStorage.setItem(key, JSON.stringify(value)); }); }
  function persistRecordsAndSettings(){
    safe(function(){ if(typeof saveRecords === 'function') saveRecords(); });
    safe(function(){ if(typeof STORAGE_KEY !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(records())); });
    safe(function(){ if(typeof SETTINGS_KEY !== 'undefined') localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings())); });
    safe(function(){ if(typeof render === 'function') render(); });
    safe(function(){ if(typeof forceRefreshSummaryCards === 'function') forceRefreshSummaryCards(); });
    renderControl(); renderCutterReport();
  }

  function injectCss(){
    if(byId('v171Css')) return;
    var st = document.createElement('style');
    st.id = 'v171Css';
    st.textContent = [
      '.v171-control-btn{background:#0f6b37!important;color:#fff!important;border:0!important;box-shadow:0 12px 24px rgba(15,107,55,.18)!important}',
      '.v171-overlay{position:fixed;inset:0;z-index:100300;display:none;align-items:center;justify-content:center;background:rgba(15,23,42,.44);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:14px}',
      '.v171-overlay.show{display:flex}.v171-card{width:min(980px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:28px;box-shadow:0 30px 90px rgba(15,23,42,.30);border:1px solid rgba(15,23,42,.10);padding:18px}',
      '.v171-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px}.v171-head h2{margin:0;color:#164d2c;font-size:22px;font-weight:950}.v171-head p{margin:4px 0 0;color:#64748b;font-weight:750}.v171-close{border:0;border-radius:16px;width:42px;height:42px;background:#f1f5f9;color:#334155;font-size:24px;font-weight:900}',
      '.v171-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:12px 0}.v171-stat{border:1px solid rgba(15,23,42,.08);border-radius:20px;background:#f8fafc;padding:12px}.v171-stat small{display:block;color:#64748b;font-weight:850;font-size:12px}.v171-stat b{display:block;margin-top:4px;color:#0f3d25;font-size:20px;font-weight:950}.v171-stat span{display:block;color:#64748b;font-size:12px;font-weight:750;margin-top:2px}',
      '.v171-section{margin-top:14px;border:1px solid rgba(15,23,42,.08);border-radius:22px;background:#fff;overflow:hidden}.v171-section h3{margin:0;padding:13px 14px;background:#f1f8f3;color:#164d2c;font-size:16px;font-weight:950}.v171-body{padding:12px 14px}.v171-table{width:100%;border-collapse:collapse;font-size:13px}.v171-table th,.v171-table td{padding:9px 7px;border-bottom:1px solid #e2e8f0;text-align:left}.v171-table th{color:#475569;background:#f8fafc;font-weight:950}.v171-table td.num{text-align:right;font-weight:900;color:#164d2c}.v171-empty{padding:12px;border-radius:16px;background:#f8fafc;color:#64748b;font-weight:800}',
      '.v171-actions{display:flex;flex-wrap:wrap;gap:8px}.v171-actions button,.v171-modal-actions button{border:0;border-radius:16px;padding:11px 13px;font-weight:950;background:#18753d;color:#fff}.v171-actions button.secondary,.v171-modal-actions button.secondary{background:#f1f5f9;color:#334155;border:1px solid rgba(15,23,42,.08)}.v171-actions button.warn{background:#b45309}.v171-actions button.danger,.v171-modal-actions button.danger{background:#b91c1c}',
      '.v171-note{margin-top:10px;padding:12px;border-radius:18px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;font-weight:850;line-height:1.45}.v171-oknote{margin-top:10px;padding:12px;border-radius:18px;background:#ecfdf5;border:1px solid #bbf7d0;color:#166534;font-weight:850;line-height:1.45}',
      '.v171-progress{margin-top:10px;height:12px;border-radius:999px;background:#e2e8f0;overflow:hidden}.v171-progress span{display:block;height:100%;width:0;background:#18753d;transition:width .15s ease}.v171-progress-text{margin-top:6px;color:#64748b;font-weight:850;font-size:12px}',
      '.v171-mini-report{margin:10px 0 12px;padding:12px;border:1px solid rgba(24,117,61,.16);background:#f0fdf4;border-radius:18px;color:#164d2c;font-weight:850}.v171-mini-report b{font-weight:950}.v171-mini-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.v171-mini-chips span{background:#fff;border:1px solid rgba(24,117,61,.16);border-radius:999px;padding:6px 9px;font-size:12px;color:#166534}',
      '.v171-modal{position:fixed;inset:0;z-index:100400;display:none;align-items:center;justify-content:center;background:rgba(15,23,42,.48);padding:14px}.v171-modal.show{display:flex}.v171-modal-card{width:min(620px,94vw);max-height:88vh;overflow:auto;background:#fff;border-radius:26px;padding:18px;box-shadow:0 24px 70px rgba(15,23,42,.30)}.v171-modal-card h3{margin:0 0 6px;color:#164d2c;font-size:20px}.v171-modal-card p{color:#475569;line-height:1.45;font-weight:750}.v171-modal-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-top:12px}',
      'body.theme-dark .v171-card,body.theme-dark .v171-section,body.theme-dark .v171-modal-card{background:#18221b;color:#f8fafc;border-color:rgba(255,255,255,.12)}body.theme-dark .v171-head h2,body.theme-dark .v171-section h3,body.theme-dark .v171-stat b,body.theme-dark .v171-table td.num{color:#f8fafc}body.theme-dark .v171-head p,body.theme-dark .v171-stat small,body.theme-dark .v171-stat span,body.theme-dark .v171-modal-card p{color:#cbd5e1}body.theme-dark .v171-stat,body.theme-dark .v171-table th,body.theme-dark .v171-empty{background:#243026;color:#f8fafc}body.theme-dark .v171-section h3{background:#243026}',
      '@media(max-width:760px){.v171-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.v171-card{padding:14px}.v171-table{font-size:12px}.v171-table th,.v171-table td{padding:8px 5px}.v171-actions button{flex:1 1 42%}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function totals(list){
    var out = {records:list.length, adet:0, desi:0};
    list.forEach(function(r){ out.adet += qty(r); out.desi += desi(r); });
    return out;
  }
  function groupBy(list, getter){
    var map = {};
    list.forEach(function(r){
      var key = norm(getter(r)) || 'Belirsiz';
      if(!map[key]) map[key] = {name:key, records:0, adet:0, desi:0, products:{}, trees:{}};
      var g = map[key]; g.records++; g.adet += qty(r); g.desi += desi(r);
      var p = cleanProduct(r); if(!g.products[p]) g.products[p] = {adet:0, desi:0}; g.products[p].adet += qty(r); g.products[p].desi += desi(r);
      var t = cleanTree(r); if(!g.trees[t]) g.trees[t] = {adet:0, desi:0}; g.trees[t].adet += qty(r); g.trees[t].desi += desi(r);
    });
    return Object.keys(map).map(function(k){ return map[k]; }).sort(function(a,b){ return b.desi - a.desi || b.adet - a.adet || a.name.localeCompare(b.name, 'tr-TR'); });
  }
  function configuredCutters(){
    var list = safe(function(){ return Array.isArray(settings().kesimcilerV158) ? settings().kesimcilerV158.slice() : []; }, []);
    var seen = {}; records().forEach(function(r){ var c=cleanCutter(r); if(c) list.push(c); });
    return list.filter(function(n){ var k=lower(n); if(!k || seen[k]) return false; seen[k]=1; return true; }).sort(function(a,b){ return a.localeCompare(b,'tr-TR'); });
  }
  function activeCutterFilterName(){
    return safe(function(){ if(typeof activeCutterFilter === 'function') return activeCutterFilter(); }, null) || safe(function(){ return state.cutterFilterV158 || localStorage.getItem('mesaha_cutter_filter_v158') || 'all'; }, 'all') || 'all';
  }
  function activeTreeFilterName(){
    return safe(function(){ if(typeof activeTreeFilterV144 === 'function') return activeTreeFilterV144(); }, null) || safe(function(){ if(typeof activeTreeFilter === 'function') return activeTreeFilter(); }, null) || 'all';
  }
  function filteredByCurrent(list){
    var tree = activeTreeFilterName(); var cutter = activeCutterFilterName();
    return list.filter(function(r){
      var okTree = !tree || tree === 'all' || lower(cleanTree(r)) === lower(tree);
      var okCutter = !cutter || cutter === 'all' || lower(cleanCutter(r)) === lower(cutter);
      return okTree && okCutter;
    });
  }
  function simpleTable(groups, nameLabel){
    if(!groups.length) return '<div class="v171-empty">Kayıt bulunamadı.</div>';
    return '<table class="v171-table"><thead><tr><th>'+esc(nameLabel)+'</th><th class="num">Kayıt</th><th class="num">Adet</th><th class="num">m³</th></tr></thead><tbody>' + groups.map(function(g){
      return '<tr><td><b>'+esc(g.name)+'</b></td><td class="num">'+g.records.toLocaleString('tr-TR')+'</td><td class="num">'+g.adet.toLocaleString('tr-TR')+'</td><td class="num">'+formatM3FromDesi(g.desi)+'</td></tr>';
    }).join('') + '</tbody></table>';
  }

  function ensureControlOverlay(){
    injectCss();
    var overlay = byId('v171ControlOverlay');
    if(overlay) return overlay;
    overlay = document.createElement('div'); overlay.id='v171ControlOverlay'; overlay.className='v171-overlay'; overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true');
    overlay.innerHTML = '<div class="v171-card"><div class="v171-head"><div><h2>Stabil Kontrol</h2><p>Kayıt, kesimci, yedek ve test araçları.</p></div><button class="v171-close" type="button" data-v171-close>×</button></div><div id="v171ControlContent"></div></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e){ if(e.target===overlay || (e.target.closest && e.target.closest('[data-v171-close]'))) overlay.classList.remove('show'); });
    overlay.addEventListener('click', function(e){
      var btn = e.target.closest ? e.target.closest('[data-v171-action]') : null; if(!btn) return;
      e.preventDefault();
      var action = btn.getAttribute('data-v171-action');
      if(action === 'test100') return createTestRecords(100);
      if(action === 'test1000') return createTestRecords(1000);
      if(action === 'test5000') return createTestRecords(5000);
      if(action === 'deleteTests') return deleteTestRecords();
      if(action === 'backupCheck') return openBackupHealthFile();
      if(action === 'refresh') return renderControl();
    });
    return overlay;
  }
  function openControl(){ var overlay = ensureControlOverlay(); renderControl(); overlay.classList.add('show'); }
  function addControlButton(){
    injectCss();
    var panel = document.querySelector('.user-panel-actions');
    if(panel && !byId('v171ControlBtn')){
      var btn = document.createElement('button'); btn.id='v171ControlBtn'; btn.type='button'; btn.className='secondary v171-control-btn'; btn.textContent='🧪 Stabil Kontrol';
      btn.addEventListener('click', function(){ safe(function(){ if(typeof closeUserPanel === 'function') closeUserPanel(); }); openControl(); });
      panel.appendChild(btn);
    }
    var admin = byId('adminToolbar') || document.querySelector('.admin-actions, .admin-filters-clean');
    if(admin && !byId('v171ControlBtnAdmin')){
      var b = document.createElement('button'); b.id='v171ControlBtnAdmin'; b.type='button'; b.className='secondary v171-control-btn'; b.textContent='🧪 Stabil Kontrol'; b.addEventListener('click', openControl); admin.appendChild(b);
    }
  }

  function renderControl(){
    var content = byId('v171ControlContent'); if(!content) return;
    var recs = records(); var all = totals(recs); var shown = totals(filteredByCurrent(recs));
    var treeGroups = groupBy(recs, cleanTree); var cutterGroups = groupBy(recs.filter(function(r){ return cleanCutter(r); }), cleanCutter);
    var lastBackup = getLocalJSON(LAST_BACKUP_KEY, null); var lastRestore = getLocalJSON(LAST_RESTORE_KEY, null);
    var lastRecord = recs[0] || null;
    var testCount = recs.filter(function(r){ return r && r[TEST_FLAG]; }).length;
    var activeTree = activeTreeFilterName(); var activeCutter = activeCutterFilterName();
    content.innerHTML =
      '<div class="v171-grid">' +
      '<div class="v171-stat"><small>Toplam Kayıt</small><b>'+all.records.toLocaleString('tr-TR')+'</b><span>Test: '+testCount.toLocaleString('tr-TR')+'</span></div>'+
      '<div class="v171-stat"><small>Toplam Adet</small><b>'+all.adet.toLocaleString('tr-TR')+'</b><span>Seçili filtre: '+shown.adet.toLocaleString('tr-TR')+'</span></div>'+
      '<div class="v171-stat"><small>Toplam m³</small><b>'+formatM3FromDesi(all.desi)+'</b><span>Seçili filtre: '+formatM3FromDesi(shown.desi)+'</span></div>'+
      '<div class="v171-stat"><small>Kesimci Sayısı</small><b>'+configuredCutters().length.toLocaleString('tr-TR')+'</b><span>Ağaç türü: '+treeGroups.length.toLocaleString('tr-TR')+'</span></div>'+
      '<div class="v171-stat"><small>Son Kayıt</small><b>'+esc(lastRecord ? (lastRecord.barcode || '-') : '-')+'</b><span>'+esc(lastRecord ? (lastRecord.createdAt || lastRecord.uretimTarihi || '-') : '-')+'</span></div>'+
      '<div class="v171-stat"><small>Son ZIP Yedek</small><b>'+esc(lastBackup ? (lastBackup.records || 0).toLocaleString('tr-TR')+' kayıt' : '-')+'</b><span>'+esc(lastBackup ? lastBackup.time : 'Bu sürümde alınmadı')+'</span></div>'+
      '<div class="v171-stat"><small>Son Yükleme</small><b>'+esc(lastRestore ? (lastRestore.mode || '-') : '-')+'</b><span>'+esc(lastRestore ? lastRestore.time : 'Henüz yok')+'</span></div>'+
      '<div class="v171-stat"><small>Aktif Filtre</small><b>'+esc((activeTree==='all'?'Tüm ağaçlar':activeTree))+'</b><span>'+esc((activeCutter==='all'?'Tüm kesimciler':'Kesimci: '+activeCutter))+'</span></div>'+
      '</div>'+
      '<div class="v171-section"><h3>Test ve Sağlık Araçları</h3><div class="v171-body"><div class="v171-actions"><button data-v171-action="refresh" type="button" class="secondary">Yenile</button><button data-v171-action="backupCheck" type="button">Yedek Sağlık Kontrolü</button><button data-v171-action="test100" type="button" class="secondary">100 test kaydı</button><button data-v171-action="test1000" type="button" class="secondary">1000 test kaydı</button><button data-v171-action="test5000" type="button" class="warn">5000 test kaydı</button><button data-v171-action="deleteTests" type="button" class="danger">Test kayıtlarını sil</button></div><div id="v171Progress" class="v171-progress" style="display:none"><span></span></div><div id="v171ProgressText" class="v171-progress-text"></div><div class="v171-note">Test kayıtları gerçek kayıtlarla karışmasın diye özel işaretlenir. İşiniz bitince “Test kayıtlarını sil” butonuyla temizleyin. Mesaha Excel / ORBİS formatına dokunulmaz.</div></div></div>'+
      '<div class="v171-section"><h3>Ağaç Türü Bazlı Toplam</h3><div class="v171-body">'+simpleTable(treeGroups, 'Ağaç türü')+'</div></div>'+
      '<div class="v171-section"><h3>Kesimci Bazlı Toplam</h3><div class="v171-body">'+simpleTable(cutterGroups, 'Kesimci')+'</div></div>'+
      '<div class="v171-section"><h3>Yedek Durumu</h3><div class="v171-body"><div class="v171-oknote">Yedek yüklerken ZIP dosyası önce kontrol edilir; kaç kayıt olduğu görülür. Sonra isterseniz mevcut kayıtları silip yükleyebilir veya mevcut kayıtların üstüne ekleyebilirsiniz.</div></div></div>';
  }
  function setProgress(pct, text){ var bar=byId('v171Progress'), span=bar&&bar.querySelector('span'), t=byId('v171ProgressText'); if(bar) bar.style.display='block'; if(span) span.style.width=Math.max(0,Math.min(100,pct||0))+'%'; if(t) t.textContent=text||''; }
  function hideProgressSoon(){ setTimeout(function(){ var bar=byId('v171Progress'), t=byId('v171ProgressText'); if(bar) bar.style.display='none'; if(t) t.textContent=''; }, 1000); }

  async function createTestRecords(count){
    count = Number(count)||0; if(!count) return;
    if(!confirm(count.toLocaleString('tr-TR')+' test kaydı oluşturulsun mu?')) return;
    var trees=['Karaçam','Sarıçam','Kızılçam','Sedir','Göknar']; var products=['Tomruk','Maden Direk','Kağıtlık','Sanayi Odunu','Tel Direk'];
    var cutters = configuredCutters(); if(!cutters.length) cutters=['Test Kesimci'];
    var date=todayISO(), tr=trDate(date), start=records().length, made=[];
    for(var i=0;i<count;i++){
      var product=products[i%products.length], tree=trees[i%trees.length], cutter=cutters[i%cutters.length];
      var length = product==='Maden Direk' ? 2.5 + ((i%4)*0.5) : product==='Kağıtlık' ? 2 : 3 + (i%3);
      var diameter = 18 + (i%28); var quantity = 1; var d = calcDesi(diameter, length, quantity);
      made.push({ id:newId(), barcode:'TEST'+String(Date.now()).slice(-5)+String(start+i+1).padStart(5,'0'), treeType:tree, species:tree, productType:product, qualityClass:'', productionDate:date, uretimTarihi:tr, length:String(length).replace('.',','), diameter:String(diameter), quantity:String(quantity), desi:d, hacim:formatM3FromDesi(d), createdAt:fmtDateTime(), kesimci:cutter, kesimciAdi:cutter, cutterName:cutter, __testV171:true });
      if(i%CHUNK===0){ setProgress(Math.round((i/Math.max(count,1))*85), Math.min(i,count).toLocaleString('tr-TR')+' / '+count.toLocaleString('tr-TR')+' test kaydı hazırlanıyor'); await delay(0); }
    }
    safe(function(){ state.records = made.concat(records()); });
    persistRecordsAndSettings();
    setProgress(100, count.toLocaleString('tr-TR')+' test kaydı eklendi.'); hideProgressSoon(); toast('Test kayıtları eklendi.');
  }
  function deleteTestRecords(){
    var count = records().filter(function(r){ return r && r[TEST_FLAG]; }).length;
    if(!count){ toast('Silinecek test kaydı yok.'); return; }
    if(!confirm(count.toLocaleString('tr-TR')+' test kaydı silinsin mi?')) return;
    safe(function(){ state.records = records().filter(function(r){ return !(r && r[TEST_FLAG]); }); });
    persistRecordsAndSettings(); toast('Test kayıtları silindi.');
  }

  function renderCutterReport(){
    var wrap = byId('cutterFilterV158'); if(!wrap) return;
    var rep = byId('cutterReportV171');
    if(!rep){ rep=document.createElement('div'); rep.id='cutterReportV171'; rep.className='v171-mini-report'; wrap.parentNode.insertBefore(rep, wrap.nextSibling); }
    var c = activeCutterFilterName();
    if(!c || c==='all'){ rep.style.display='none'; return; }
    var list = records().filter(function(r){ return lower(cleanCutter(r))===lower(c); });
    var t = totals(list); var trees = groupBy(list, cleanTree).slice(0,5);
    rep.style.display='block';
    rep.innerHTML = '<b>Kesimci Raporu:</b> '+esc(c)+' • '+t.adet.toLocaleString('tr-TR')+' adet • '+formatM3FromDesi(t.desi)+' m³ <div class="v171-mini-chips">'+trees.map(function(g){ return '<span>'+esc(g.name)+': '+g.adet.toLocaleString('tr-TR')+' adet • '+formatM3FromDesi(g.desi)+' m³</span>'; }).join('')+'</div>';
  }

  function readU16(b,o){ return b[o] | (b[o+1]<<8); }
  function readU32(b,o){ return (b[o] | (b[o+1]<<8) | (b[o+2]<<16) | (b[o+3]<<24)) >>> 0; }
  function findEocd(bytes){ var min=Math.max(0, bytes.length-66000); for(var i=bytes.length-22;i>=min;i--){ if(readU32(bytes,i)===0x06054b50) return i; } return -1; }
  function parseZip(bytes){
    var dec = new TextDecoder('utf-8'); var eocd=findEocd(bytes); if(eocd<0) throw new Error('ZIP dosyası okunamadı.');
    var count=readU16(bytes,eocd+10), cdOffset=readU32(bytes,eocd+16), pos=cdOffset, files={};
    for(var i=0;i<count;i++){
      if(readU32(bytes,pos)!==0x02014b50) throw new Error('ZIP dizini bozuk.');
      var method=readU16(bytes,pos+10), compSize=readU32(bytes,pos+20), nameLen=readU16(bytes,pos+28), extraLen=readU16(bytes,pos+30), commentLen=readU16(bytes,pos+32), localOffset=readU32(bytes,pos+42);
      var name=dec.decode(bytes.slice(pos+46,pos+46+nameLen));
      if(readU32(bytes,localOffset)!==0x04034b50) throw new Error('ZIP parçası okunamadı.');
      if(method!==0) throw new Error('Bu ZIP desteklenmeyen sıkıştırma kullanıyor. Mesaha İO ZIP yedeğini seçin.');
      var localNameLen=readU16(bytes,localOffset+26), localExtraLen=readU16(bytes,localOffset+28), dataStart=localOffset+30+localNameLen+localExtraLen;
      files[name] = dec.decode(bytes.slice(dataStart, dataStart+compSize));
      pos += 46 + nameLen + extraLen + commentLen;
    }
    return files;
  }
  async function inspectBackupFile(file){
    var name = String(file && file.name || '').toLowerCase();
    if(name.endsWith('.zip')){
      var bytes = new Uint8Array(await file.arrayBuffer()); var files = parseZip(bytes); var manifest = JSON.parse(files['manifest.json'] || '{}');
      if(manifest.backupType !== 'mesaha-zip' || !Array.isArray(manifest.chunks)) throw new Error('Bu dosya Mesaha İO ZIP yedeği değil.');
      var out=[];
      for(var i=0;i<manifest.chunks.length;i++){
        var partName=manifest.chunks[i]; if(!files[partName]) throw new Error(partName+' ZIP içinde bulunamadı.');
        var part=JSON.parse(files[partName]); if(!Array.isArray(part.records)) throw new Error(partName+' geçersiz.'); out = out.concat(part.records);
      }
      return {type:'zip', file:file, fileName:file.name, manifest:manifest, settings: safe(function(){ return files['ayarlar.json'] ? JSON.parse(files['ayarlar.json']) : {}; }, {}), records:out};
    }
    var text = await file.text(); var data = JSON.parse(text);
    if(!Array.isArray(data.records)) throw new Error('Yedek içinde kayıt bulunamadı.');
    return {type:'json', file:file, fileName:file.name, manifest:{createdAt:data.exportedAt || data.createdAt || '-', totalRecords:data.records.length, chunks:[]}, settings:data.settings || {}, records:data.records};
  }
  function showModal(title, html, buttons){
    injectCss(); var modal=byId('v171Modal');
    if(!modal){ modal=document.createElement('div'); modal.id='v171Modal'; modal.className='v171-modal'; modal.innerHTML='<div class="v171-modal-card"><h3 data-title></h3><div data-body></div><div class="v171-modal-actions" data-actions></div></div>'; document.body.appendChild(modal); modal.addEventListener('click', function(e){ if(e.target===modal) modal.classList.remove('show'); }); }
    modal.querySelector('[data-title]').textContent=title||''; modal.querySelector('[data-body]').innerHTML=html||'';
    var actions=modal.querySelector('[data-actions]'); actions.innerHTML='';
    (buttons||[{text:'Tamam',className:'secondary'}]).forEach(function(b){ var btn=document.createElement('button'); btn.type='button'; btn.textContent=b.text; btn.className=b.className||''; btn.addEventListener('click', function(){ if(b.close!==false) modal.classList.remove('show'); if(typeof b.onClick==='function') b.onClick(); }); actions.appendChild(btn); });
    modal.classList.add('show');
  }
  function openBackupHealthFile(){
    var input=byId('v171BackupInput'); if(!input){ input=document.createElement('input'); input.id='v171BackupInput'; input.type='file'; input.accept='.zip,application/zip'; input.style.display='none'; document.body.appendChild(input); input.addEventListener('change', function(){ var f=input.files&&input.files[0]; input.value=''; if(f) inspectAndAskRestore(f); }); }
    input.click();
  }
  async function inspectAndAskRestore(file){
    try{
      showModal('Yedek kontrol ediliyor', '<p>ZIP yedeği okunuyor, lütfen bekleyin.</p>', []);
      var info = await inspectBackupFile(file); var t = totals(info.records); var cutters = groupBy(info.records.filter(function(r){ return cleanCutter(r); }), cleanCutter).length; var trees = groupBy(info.records, cleanTree).length;
      var html = '<p><b>'+esc(file.name)+'</b> dosyası sağlam görünüyor.</p>'+
        '<div class="v171-grid"><div class="v171-stat"><small>Kayıt</small><b>'+info.records.length.toLocaleString('tr-TR')+'</b><span>'+esc(info.type.toUpperCase())+'</span></div><div class="v171-stat"><small>Adet</small><b>'+t.adet.toLocaleString('tr-TR')+'</b><span>Toplam</span></div><div class="v171-stat"><small>m³</small><b>'+formatM3FromDesi(t.desi)+'</b><span>Toplam</span></div><div class="v171-stat"><small>İçerik</small><b>'+trees+'</b><span>Ağaç • '+cutters+' kesimci</span></div></div>'+
        '<div class="v171-note">“Silip yükle” mevcut kayıtları yedekle değiştirir. “Üstüne ekle” mevcut kayıtların yanına ekler; aynı id çakışırsa yeni id verilir.</div>';
      showModal('Yedek Sağlık Kontrolü', html, [
        {text:'Vazgeç', className:'secondary'},
        {text:'Üstüne ekle', className:'', onClick:function(){ restoreInspected(info, 'ekle'); }},
        {text:'Silip yükle', className:'danger', onClick:function(){ restoreInspected(info, 'silip-yukle'); }}
      ]);
    }catch(e){ console.error(e); showModal('Yedek okunamadı', '<p>'+esc(e && e.message ? e.message : 'Dosya okunamadı.')+'</p><div class="v171-note">Sadece Mesaha İO’dan alınan ZIP yedeğini seçiniz.</div>', [{text:'Tamam',className:'secondary'}]); }
  }
  async function restoreInspected(info, mode){
    var incoming = Array.isArray(info.records) ? info.records.slice() : [];
    if(!incoming.length) return errorToast('Yedekte kayıt bulunamadı.');
    var replace = mode === 'silip-yukle';
    if(!confirm((replace ? 'Mevcut kayıtlar silinip ' : 'Mevcut kayıtların üstüne ') + incoming.length.toLocaleString('tr-TR') + ' kayıt yüklensin mi?')) return;
    var existing = records(); var existingIds = {}; existing.forEach(function(r){ if(r && r.id) existingIds[String(r.id)] = 1; });
    if(!replace){ incoming = incoming.map(function(r){ var copy = Object.assign({}, r); if(copy.id && existingIds[String(copy.id)]) copy.id = newId(); existingIds[String(copy.id)] = 1; copy.importedAtV171 = fmtDateTime(); return copy; }); }
    for(var i=0;i<incoming.length;i+=CHUNK){ setProgress(Math.round((i/Math.max(incoming.length,1))*75), Math.min(i+CHUNK,incoming.length).toLocaleString('tr-TR')+' / '+incoming.length.toLocaleString('tr-TR')+' kayıt yükleniyor'); await delay(0); }
    safe(function(){ state.records = replace ? incoming : incoming.concat(existing); state.settings = Object.assign({}, state.settings || {}, info.settings || {}); });
    setLocalJSON(LAST_RESTORE_KEY, {time:fmtDateTime(), records:incoming.length, mode:replace?'Silip yükle':'Üstüne ekle', file:info.fileName});
    persistRecordsAndSettings(); setProgress(100, 'Yedek başarıyla yüklendi.'); hideProgressSoon(); toast('Yedek yüklendi.'); openControl();
  }
  function bindRestoreHealth(){
    var btn=byId('restoreBtn'); if(btn && !btn.__v171Restore){ var clone=btn.cloneNode(true); clone.textContent='Yedek Yükle'; clone.__v171Restore=true; clone.__v152Bound=true; clone.__v151InfoBound=true; btn.parentNode.replaceChild(clone, btn); clone.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); openBackupHealthFile(); }, true); safe(function(){ if(typeof els !== 'undefined') els.restoreBtn=clone; }); }
  }
  function wrapBackup(){
    safe(function(){
      if(typeof backup !== 'function' || backup.__v171Wrapped) return;
      var old = backup;
      backup = async function(){
        var res = old.apply(this, arguments);
        try { if(res && typeof res.then === 'function') await res; } catch(e){ throw e; }
        setLocalJSON(LAST_BACKUP_KEY, {time:fmtDateTime(), records:records().length, type:'ZIP'});
        renderControl();
        return res;
      };
      backup.__v171Wrapped = true;
    });
  }

  function applyVersion(){
    safe(function(){ document.title = VISIBLE_VERSION; });
    safe(function(){ document.querySelectorAll('.brand h1,.brand-copy-v143 h1,[data-version-title]').forEach(function(el){ el.textContent = VISIBLE_VERSION; }); });
    safe(function(){ window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, {fileVersion:FILE_VERSION, visibleVersion:VISIBLE_VERSION, controlPanel:true, testRecords:true, backupHealth:true, cutterReport:true}); });
  }
  function boot(){ injectCss(); addControlButton(); bindRestoreHealth(); wrapBackup(); applyVersion(); renderCutterReport(); }
  ready(function(){ boot(); [150,600,1400,2600,5200].forEach(function(ms){ setTimeout(boot, ms); }); });
  window.addEventListener('load', boot, {once:true});
  setInterval(function(){ applyVersion(); addControlButton(); bindRestoreHealth(); wrapBackup(); renderCutterReport(); }, 1800);
  window.mesahaOpenStabilKontrolV171 = openControl;
})();
