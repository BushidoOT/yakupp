(function(){
'use strict';
const STORAGE_KEY = 'cam_mesaha_kayitlari_v1';
const SETTINGS_KEY = 'cam_mesaha_ayarlar_v1';
const VERSION = window.MESAHA_VERSION || {shortVersion:'v3.00', version:'v300-clean'};
const PRODUCTS = [
  {key:'Tomruk', label:'Tomruk', cls:'tomruk'},
  {key:'Maden Direk', label:'Maden', cls:'maden'},
  {key:'Kağıtlık', label:'Kağıtlık', cls:'kagit'},
  {key:'Sanayi Odunu', label:'Sanayi', cls:'sanayi'},
  {key:'Tel Direk', label:'Tel', cls:'tel'}
];
const TREES = ['Karaçam','Sarıçam','Sedir','Göknar','Kızılçam'];
const defaults = {
  bolmeNo:'', seflik:'Yaylacık', ekipNot:'Yakup', mesahaDate: todayISO(),
  visibleProducts:['Tomruk','Maden Direk','Kağıtlık'], visibleTrees:TREES.slice(),
  currentProduct:'Tomruk', currentTree:'Karaçam', treePanelOpen:false,
  length:'3', diameter:'', barcode:'', recentLengths:['3'], recentDiameters:[],
  cutters:[], activeCutter:'', soundEnabled:true, theme:'light', treeFilter:'Tümü', cutterFilter:'Tümü'
};
const state = { records:[], settings:{...defaults}, view:'home', editingId:null, toastTimer:null };
const $ = id => document.getElementById(id);
function todayISO(){ const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
function norm(v){ return String(v ?? '').trim().replace(/\s+/g,' '); }
function num(v){ const n=Number(String(v ?? '').replace(',','.')); return Number.isFinite(n) ? n : 0; }
function esc(v){ return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function fmt(n, d=3){ return Number(n||0).toLocaleString('tr-TR',{maximumFractionDigits:d}); }
function formatDateFile(){ const d=new Date(); const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`; }
function cleanFile(v){ return norm(v).replace(/[ıİ]/g,'i').replace(/[ğĞ]/g,'g').replace(/[üÜ]/g,'u').replace(/[şŞ]/g,'s').replace(/[öÖ]/g,'o').replace(/[çÇ]/g,'c').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,40); }
function volume(r){ const d=num(r.diameter), l=num(r.length), q=num(r.quantity||1); if(!d||!l) return 0; return Math.PI*Math.pow(d/100,2)/4*l*q; }
function productInfo(key){ return PRODUCTS.find(p=>p.key===key) || PRODUCTS[0]; }
function isThisWeek(r){ const dt = new Date(r.createdAt || r.productionDate || todayISO()); if(Number.isNaN(dt.getTime())) return false; const now=new Date(); const day=(now.getDay()+6)%7; const start=new Date(now); start.setHours(0,0,0,0); start.setDate(start.getDate()-day); return dt >= start; }
function toast(msg){ const el=$('toast'); if(!el) return; el.textContent=msg; el.classList.add('show'); clearTimeout(state.toastTimer); state.toastTimer=setTimeout(()=>el.classList.remove('show'),2200); }
function load(){
  try{ const r=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); state.records = Array.isArray(r) ? r.map(migrateRecord).filter(Boolean) : []; }catch{ state.records=[]; }
  try{ const s=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'); state.settings = {...defaults, ...s}; }catch{ state.settings={...defaults}; }
  if(!state.settings.mesahaDate) state.settings.mesahaDate=todayISO();
  if(!Array.isArray(state.settings.visibleProducts) || !state.settings.visibleProducts.length) state.settings.visibleProducts=defaults.visibleProducts.slice();
  if(!Array.isArray(state.settings.visibleTrees) || !state.settings.visibleTrees.length) state.settings.visibleTrees=TREES.slice();
  if(!Array.isArray(state.settings.cutters)) state.settings.cutters=[];
  document.body.classList.toggle('dark', state.settings.theme==='dark');
}
function migrateRecord(r){ if(!r) return null; return {
  id:r.id || uid(), barcode:norm(r.barcode || r.barkodNo), diameter:String(r.diameter || r.cap || ''), length:String(r.length || r.boy || ''), quantity:Number(r.quantity || r.adet || 1),
  productType:r.productType || r.odunTuru || 'Tomruk', treeType:r.treeType || r.species || r.agacTuru || 'Karaçam', cutter:r.cutter || r.kesimci || '', productionDate:r.productionDate || r.uretimTarihi || state.settings?.mesahaDate || todayISO(),
  createdAt:r.createdAt || new Date().toISOString(), updatedAt:r.updatedAt || ''
}; }
function saveRecords(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records)); }
function saveSettings(){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); }
function bind(){
  $('openEntryBtn').addEventListener('click', () => openEntry());
  $('entryHomeBtn').addEventListener('click', () => showView('home'));
  $('themeBtn').addEventListener('click', () => { state.settings.theme = state.settings.theme==='dark'?'light':'dark'; document.body.classList.toggle('dark', state.settings.theme==='dark'); saveSettings(); });
  $('soundBtn').addEventListener('click', () => { state.settings.soundEnabled=!state.settings.soundEnabled; saveSettings(); renderSound(); });
  $('treeToggleBtn').addEventListener('click', () => { state.settings.treePanelOpen=!state.settings.treePanelOpen; saveSettings(); renderEntryTrees(); });
  $('addCutterBtn').addEventListener('click', addCutter);
  $('saveBtn').addEventListener('click', saveEntry);
  $('clearBtn').addEventListener('click', clearEntry);
  $('cancelEditBtn').addEventListener('click', () => { state.editingId=null; $('cancelEditBtn').classList.add('hidden'); clearEntry(false); toast('Düzenleme iptal edildi.'); });
  $('downloadXlsBtn').addEventListener('click', exportXls);
  $('backupBtn').addEventListener('click', backupJson);
  $('restoreBtn').addEventListener('click', () => $('restoreInput').click());
  $('restoreInput').addEventListener('change', restoreJson);
  $('printBtn').addEventListener('click', () => window.print());
  $('bottomNav').addEventListener('click', e => { const b=e.target.closest('[data-nav]'); if(b) showView(b.dataset.nav); });
  ['bolmeNo','seflik','ekipNot','mesahaDate'].forEach(id => $(id).addEventListener('input', settingsFromInputs));
  ['diameterInput','lengthInput','barcodeInput'].forEach(id => {
    $(id).addEventListener('input', entryInputChanged);
    $(id).addEventListener('focus', () => document.body.classList.add('typing'));
    $(id).addEventListener('blur', () => setTimeout(()=>document.body.classList.remove('typing'), 160));
  });
  window.addEventListener('online', renderNetwork); window.addEventListener('offline', renderNetwork);
}
function settingsFromInputs(){ state.settings.bolmeNo=$('bolmeNo').value; state.settings.seflik=$('seflik').value; state.settings.ekipNot=$('ekipNot').value; state.settings.mesahaDate=$('mesahaDate').value || todayISO(); saveSettings(); renderUser(); }
function entryInputChanged(){ state.settings.diameter=$('diameterInput').value; state.settings.length=$('lengthInput').value; state.settings.barcode=$('barcodeInput').value.toUpperCase(); if($('barcodeInput').value!==state.settings.barcode) $('barcodeInput').value=state.settings.barcode; saveSettings(); }
function showView(view){
  state.view=view; document.body.classList.toggle('entry-open', view==='entry');
  ['home','entry','records','guide'].forEach(v => $(`${v}View`)?.classList.toggle('active', v===view));
  document.querySelectorAll('#bottomNav button').forEach(b => b.classList.toggle('active', b.dataset.nav===view));
  if(view==='records') renderRecords();
  if(view==='home') renderHome();
  try{ window.scrollTo({top:0, behavior:'auto'}); }catch{ window.scrollTo(0,0); }
}
function openEntry(record){
  if(record){ state.editingId=record.id; state.settings.currentTree=record.treeType; state.settings.currentProduct=record.productType; state.settings.length=record.length; state.settings.diameter=record.diameter; state.settings.barcode=record.barcode; state.settings.activeCutter=record.cutter||''; $('cancelEditBtn').classList.remove('hidden'); }
  else { state.editingId=null; $('cancelEditBtn').classList.add('hidden'); }
  renderEntry(); showView('entry'); setTimeout(()=>{ try{$('diameterInput').focus({preventScroll:true});}catch{} },80);
}
function renderAll(){ renderVersion(); renderUser(); renderNetwork(); renderHome(); renderEntry(); renderRecords(); renderSound(); }
function renderVersion(){ $('versionText').textContent=VERSION.shortVersion || 'v3.00'; document.querySelectorAll('.version-card b').forEach(b=>b.textContent=VERSION.shortVersion||'v3.00'); document.querySelectorAll('.version-card small').forEach(s=>s.textContent=VERSION.version||'v300-clean'); }
function renderUser(){ $('userBadge').textContent = `${norm(state.settings.ekipNot)||'Yakup'} • ${norm(state.settings.seflik)||'Yaylacık'}`; }
function renderNetwork(){ $('netText').textContent = navigator.onLine ? 'Çevrim içi' : 'Çevrimdışı'; }
function renderSound(){ $('soundBtn').textContent = state.settings.soundEnabled===false ? 'Ses: Kapalı' : 'Ses: Açık'; }
function renderHome(){
  $('bolmeNo').value=state.settings.bolmeNo||''; $('seflik').value=state.settings.seflik||''; $('ekipNot').value=state.settings.ekipNot||''; $('mesahaDate').value=state.settings.mesahaDate||todayISO();
  renderHomeChecks(); renderSummary(); renderSound(); renderUser();
}
function renderHomeChecks(){
  $('homeProductChecks').innerHTML = PRODUCTS.map(p => checkCard('product', p.key, p.label, state.settings.visibleProducts.includes(p.key))).join('');
  $('homeTreeChecks').innerHTML = TREES.map(t => checkCard('tree', t, t, state.settings.visibleTrees.includes(t))).join('');
  document.querySelectorAll('[data-check-kind]').forEach(ch => ch.addEventListener('change', checkChanged));
}
function checkCard(kind, value, label, checked){ return `<label class="check-card"><input type="checkbox" data-check-kind="${kind}" value="${esc(value)}" ${checked?'checked':''}><span>${esc(label)}</span></label>`; }
function checkChanged(e){
  const kind=e.target.dataset.checkKind; const boxes=[...document.querySelectorAll(`[data-check-kind="${kind}"]:checked`)].map(i=>i.value);
  if(!boxes.length){ e.target.checked=true; toast('En az bir seçim açık kalmalı.'); return; }
  if(kind==='product'){ state.settings.visibleProducts=boxes; if(!boxes.includes(state.settings.currentProduct)) state.settings.currentProduct=boxes[0]; }
  else { state.settings.visibleTrees=boxes; if(!boxes.includes(state.settings.currentTree)) state.settings.currentTree=boxes[0]; }
  saveSettings(); renderEntry(); renderHomeChecks();
}
function renderSummary(){ const total=totals(state.records), week=state.records.filter(isThisWeek); const avg=state.records.length ? state.records.reduce((s,r)=>s+num(r.diameter),0)/state.records.length : 0; $('sumCount').textContent=week.length.toLocaleString('tr-TR'); $('sumAvg').textContent=`${fmt(avg,1)} cm`; $('sumM3').textContent=`${fmt(total.m3,3)} m³`; }
function totals(list){ return list.reduce((a,r)=>{ a.count+=Number(r.quantity||1); a.m3+=volume(r); return a; },{count:0,m3:0}); }
function renderEntry(){
  $('diameterInput').value=state.settings.diameter||''; $('lengthInput').value=state.settings.length||''; $('barcodeInput').value=state.settings.barcode||'';
  renderCutters(); renderEntryTrees(); renderQuickChips(); renderProducts(); renderRecent(); const t=totals(state.records); $('entryTotalCount').textContent=t.count.toLocaleString('tr-TR'); $('entryTotalM3').textContent=`${fmt(t.m3,3)} m³`;
}
function renderCutters(){
  const list = [...new Set([...(state.settings.cutters||[]), state.settings.activeCutter].filter(Boolean))]; state.settings.cutters=list; saveSettings();
  $('cutterChips').innerHTML = `<button class="chip ${!state.settings.activeCutter?'active':''}" data-cutter="">Kesimci seçilmedi</button>` + list.map(c => `<button class="chip ${c===state.settings.activeCutter?'active':''}" data-cutter="${esc(c)}">${esc(c)} ✕</button>`).join('');
  $('cutterChips').querySelectorAll('[data-cutter]').forEach(b => b.addEventListener('click', () => { const c=b.dataset.cutter; if(c && state.settings.activeCutter===c){ state.settings.cutters=state.settings.cutters.filter(x=>x!==c); state.settings.activeCutter=''; } else state.settings.activeCutter=c; saveSettings(); renderCutters(); }));
}
function addCutter(){ const name=norm(prompt('Kesimci ismini yazınız:')); if(!name) return; if(!state.settings.cutters.includes(name)) state.settings.cutters.push(name); state.settings.activeCutter=name; saveSettings(); renderCutters(); }
function renderEntryTrees(){
  $('treeCurrent').textContent=state.settings.currentTree; $('treeToggleBtn').textContent='Ağaç Türü Seç: '+state.settings.currentTree;
  $('treePanel').classList.toggle('open', !!state.settings.treePanelOpen);
  $('treePanel').innerHTML = state.settings.visibleTrees.map(t => `<label class="tree-option"><input type="radio" name="entryTree" value="${esc(t)}" ${t===state.settings.currentTree?'checked':''}><span>${esc(t)}</span></label>`).join('');
  $('treePanel').querySelectorAll('input').forEach(r => r.addEventListener('change', () => { state.settings.currentTree=r.value; state.settings.treePanelOpen=true; saveSettings(); renderEntryTrees(); }));
}
function renderQuickChips(){
  $('diameterChips').innerHTML = (state.settings.recentDiameters||[]).slice(0,5).map(v=>`<button data-dia="${esc(v)}">${esc(v)}</button>`).join('');
  $('lengthChips').innerHTML = (state.settings.recentLengths||['3']).slice(0,5).map(v=>`<button data-len="${esc(v)}">${esc(v)}</button>`).join('');
  $('diameterChips').querySelectorAll('[data-dia]').forEach(b=>b.addEventListener('click',()=>{ $('diameterInput').value=b.dataset.dia; entryInputChanged(); }));
  $('lengthChips').querySelectorAll('[data-len]').forEach(b=>b.addEventListener('click',()=>{ $('lengthInput').value=b.dataset.len; entryInputChanged(); }));
}
function renderProducts(){
  const list = state.settings.visibleProducts.filter(k=>PRODUCTS.some(p=>p.key===k)); if(!list.includes(state.settings.currentProduct)) state.settings.currentProduct=list[0]||'Tomruk';
  $('productButtons').innerHTML = list.map(k => { const p=productInfo(k); return `<button class="product-btn product-${p.cls} ${k===state.settings.currentProduct?'active':''}" data-product="${esc(k)}" type="button">${esc(p.label)}</button>`; }).join('');
  $('productButtons').querySelectorAll('[data-product]').forEach(b => b.addEventListener('click', () => { state.settings.currentProduct=b.dataset.product; saveSettings(); renderProducts(); }));
}
function renderRecent(){ const recent=state.records.slice(-3).reverse(); $('recentList').innerHTML = recent.length ? recent.map(r=>`<button class="recent-item product-${productInfo(r.productType).cls}" data-edit="${r.id}" type="button"><b>${esc(r.barcode)}</b><small>${esc(r.treeType)} • ${esc(productInfo(r.productType).label)} • ${esc(r.diameter)} çap / ${esc(r.length)} boy</small></button>`).join('') : '<p class="hint">Henüz kayıt yok.</p>'; $('recentList').querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>{ const r=state.records.find(x=>x.id===b.dataset.edit); if(r) openEntry(r); })); }
function saveEntry(){
  const barcode=norm($('barcodeInput').value).toUpperCase(); const diameter=norm($('diameterInput').value); const length=norm($('lengthInput').value);
  if(!barcode || barcode.length<5) return toast('Barkod boş veya kısa.'); if(!diameter) return toast('Çap giriniz.'); if(!length) return toast('Boy giriniz.');
  const duplicate = state.records.find(r => r.barcode===barcode && r.id!==state.editingId); if(duplicate) return toast('Bu barkod daha önce kayıtlı.');
  const rec = { id: state.editingId || uid(), barcode, diameter, length, quantity:1, productType:state.settings.currentProduct, treeType:state.settings.currentTree, cutter:state.settings.activeCutter||'', productionDate:state.settings.mesahaDate||todayISO(), createdAt:new Date().toISOString(), updatedAt: state.editingId ? new Date().toISOString() : '' };
  if(state.editingId){ const i=state.records.findIndex(r=>r.id===state.editingId); if(i>=0) state.records[i]=rec; state.editingId=null; $('cancelEditBtn').classList.add('hidden'); }
  else state.records.push(rec);
  rememberChip('recentDiameters', diameter); rememberChip('recentLengths', length); state.settings.barcode=nextBarcode(barcode); $('barcodeInput').value=state.settings.barcode; saveRecords(); saveSettings(); renderAll(); toast('Kayıt alındı.'); if(state.settings.soundEnabled!==false) beep();
}
function rememberChip(key, val){ const arr=[val, ...(state.settings[key]||[]).filter(x=>String(x)!==String(val))].slice(0,5); state.settings[key]=arr; }
function nextBarcode(b){ const m=String(b).match(/^(.*?)(\d+)$/); if(!m) return ''; return m[1]+String(Number(m[2])+1).padStart(m[2].length,'0'); }
function clearEntry(show=true){ state.settings.diameter=''; state.settings.length=''; state.settings.barcode=''; $('diameterInput').value=''; $('lengthInput').value=''; $('barcodeInput').value=''; saveSettings(); if(show) toast('Alanlar temizlendi.'); }
function beep(){ try{ const ctx=new (window.AudioContext||window.webkitAudioContext)(); const osc=ctx.createOscillator(); const gain=ctx.createGain(); osc.frequency.value=880; gain.gain.value=.08; osc.connect(gain); gain.connect(ctx.destination); osc.start(); setTimeout(()=>{osc.stop(); ctx.close();},70); }catch{} }
function filteredRecords(){ return state.records.filter(r => (state.settings.treeFilter==='Tümü'||r.treeType===state.settings.treeFilter) && (state.settings.cutterFilter==='Tümü'||(state.settings.cutterFilter==='Kesimci kaydı yok' ? !r.cutter : r.cutter===state.settings.cutterFilter))); }
function renderRecords(){
  const list=filteredRecords(); const all=totals(list), totalAll=totals(state.records); $('recordCountPill').textContent=`${state.records.length} kayıt`; $('recTotalM3').textContent=`${fmt(totalAll.m3,3)} m³`; $('recTotalCount').textContent=totalAll.count.toLocaleString('tr-TR');
  renderProductTotals(); renderFilters();
  $('recordList').innerHTML = list.length ? list.slice().reverse().map(r => recordCard(r)).join('') : '<p class="hint">Kayıt bulunamadı.</p>';
  $('recordList').querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>{ const r=state.records.find(x=>x.id===b.dataset.edit); if(r) openEntry(r); }));
  $('recordList').querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{ if(confirm('Kayıt silinsin mi?')){ state.records=state.records.filter(x=>x.id!==b.dataset.del); saveRecords(); renderAll(); }}));
}
function renderProductTotals(){ const html=PRODUCTS.map(p=>{ const list=state.records.filter(r=>r.productType===p.key); const t=totals(list); return `<div class="prod-total product-${p.cls}"><small>${esc(p.label)}</small><b>${fmt(t.m3,3)} m³</b><small>${t.count} adet</small></div>`; }).join(''); $('productTotals').innerHTML=html; }
function renderFilters(){
  const trees=['Tümü',...TREES.filter(t=>state.records.some(r=>r.treeType===t))]; $('treeFilters').innerHTML=trees.map(t=>`<button class="filter-chip ${state.settings.treeFilter===t?'active':''}" data-tree-filter="${esc(t)}">${esc(t)} (${t==='Tümü'?state.records.length:state.records.filter(r=>r.treeType===t).length})</button>`).join('');
  $('treeFilterText').textContent='Seçili: '+state.settings.treeFilter; $('treeFilters').querySelectorAll('[data-tree-filter]').forEach(b=>b.addEventListener('click',()=>{ state.settings.treeFilter=b.dataset.treeFilter; saveSettings(); renderRecords(); }));
  const cutters=['Tümü']; if(state.records.some(r=>!r.cutter)) cutters.push('Kesimci kaydı yok'); [...new Set(state.records.map(r=>r.cutter).filter(Boolean))].forEach(c=>cutters.push(c));
  $('cutterFilters').innerHTML=cutters.map(c=>`<button class="filter-chip ${state.settings.cutterFilter===c?'active':''}" data-cutter-filter="${esc(c)}">${esc(c)}</button>`).join('');
  $('cutterFilterText').textContent='Seçili: '+state.settings.cutterFilter; $('cutterFilters').querySelectorAll('[data-cutter-filter]').forEach(b=>b.addEventListener('click',()=>{ state.settings.cutterFilter=b.dataset.cutterFilter; saveSettings(); renderRecords(); }));
}
function recordCard(r){ const p=productInfo(r.productType); return `<article class="record-card product-${p.cls}"><input type="checkbox"><div class="record-main"><b>${esc(r.barcode)} • ${esc(r.treeType)} • ${esc(p.label)}</b><small>${esc(r.diameter)} çap / ${esc(r.length)} boy • ${esc(r.cutter||'Kesimci yok')} • ${esc(r.productionDate)}</small></div><div class="record-actions"><button data-edit="${r.id}">Düzelt</button><button data-del="${r.id}">Sil</button></div></article>`; }
function exportXls(){ const list=filteredRecords(); if(!list.length) return toast('Çıktı için kayıt yok.'); const ordered=list.slice(); const bolme=cleanFile(state.settings.bolmeNo); const file=`Mesaha_${bolme?bolme+'_':''}${formatDateFile()}.xls`; if(window.OrbisXls) window.OrbisXls.downloadXls(ordered, file); else toast('XLS modülü yüklenmedi.'); }
function backupJson(){ const data={version:'v3-clean', exportedAt:new Date().toISOString(), records:state.records, settings:state.settings}; downloadText(JSON.stringify(data,null,2), `mesaha_yedek_${formatDateFile()}.json`, 'application/json'); toast('Yedek indirildi.'); }
function restoreJson(e){ const file=e.target.files && e.target.files[0]; if(!file) return; const reader=new FileReader(); reader.onload=()=>{ try{ const data=JSON.parse(reader.result); const records=Array.isArray(data) ? data : data.records; if(!Array.isArray(records)) throw new Error('records yok'); state.records=records.map(migrateRecord).filter(Boolean); if(data.settings) state.settings={...state.settings,...data.settings}; saveRecords(); saveSettings(); renderAll(); toast('Yedek yüklendi.'); }catch(err){ toast('Yedek okunamadı.'); } e.target.value=''; }; reader.readAsText(file); }
function downloadText(content, filename, type){ const blob=new Blob([content],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000); }
function boot(){ load(); bind(); renderAll(); showView('home'); setTimeout(()=>$('startup').classList.add('hide'),350); if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(()=>{}); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
