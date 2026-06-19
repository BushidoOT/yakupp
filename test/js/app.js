(function(){
'use strict';
const STORAGE_KEY = 'cam_mesaha_kayitlari_v1';
const SETTINGS_KEY = 'cam_mesaha_ayarlar_v1';
const VERSION = window.MESAHA_VERSION || {shortVersion:'v3.03', version:'v303-extras'};
const PRODUCTS = [
  {key:'Tomruk', label:'Tomruk', cls:'tomruk', rule:'Tomruk: çap 21 ve üzeri olmalı.'},
  {key:'Maden Direk', label:'Maden', cls:'maden', rule:'Maden: çap 20 ve altı olmalı.'},
  {key:'Kağıtlık', label:'Kağıtlık', cls:'kagit', rule:'Kağıtlık: özel çap kilidi yok.'},
  {key:'Sanayi Odunu', label:'Sanayi', cls:'sanayi', rule:'Sanayi: çap en az 12, boy 0,50 - 1,45 m olmalı.'},
  {key:'Tel Direk', label:'Tel', cls:'tel', rule:'Tel: çap 12 - 40, boy 6,5 - 25 m olmalı.'}
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
function normalizeProductType(value){
  const v = norm(value).toLocaleLowerCase('tr-TR');
  if(!v) return 'Tomruk';
  if(v==='tomruk') return 'Tomruk';
  if(v==='maden' || v==='maden direk' || v==='maden direği' || v==='maden diregi') return 'Maden Direk';
  if(v==='kağıtlık' || v==='kagitlik' || v==='kağıtlık odun' || v==='kagitlik odun') return 'Kağıtlık';
  if(v==='sanayi' || v==='sanayi odunu') return 'Sanayi Odunu';
  if(v==='tel' || v==='tel direk' || v==='tel direği' || v==='tel diregi') return 'Tel Direk';
  return PRODUCTS.some(p=>p.key===value) ? value : 'Tomruk';
}
function focusDiameter(){
  const el = $('diameterInput');
  if(!el) return;
  try{ el.focus({preventScroll:true}); el.select && el.select(); }catch{ try{ el.focus(); }catch{} }
}
function focusLength(){
  const el = $('lengthInput');
  if(!el) return;
  try{ el.focus({preventScroll:true}); el.select && el.select(); }catch{ try{ el.focus(); }catch{} }
}
function validateBarcode(value){
  const barcode = norm(value);
  if(barcode.length < 9){
    toast('Barkod en az 9 karakter olmalı. Örn: A17265597');
    try{ $('barcodeInput').focus({preventScroll:true}); }catch{ try{ $('barcodeInput').focus(); }catch{} }
    return false;
  }
  return true;
}
function validateProductRules(productType, diameter, length){
  const product = normalizeProductType(productType);
  const d = num(diameter);
  const l = num(length);

  if(product === 'Tomruk' && d < 21){
    toast('Tomruk 21 çapından küçük olmaz.');
    focusDiameter();
    return false;
  }

  if(product === 'Maden Direk' && d > 20){
    toast('Maden direği 20 çapından büyük olmaz.');
    focusDiameter();
    return false;
  }

  if(product === 'Sanayi Odunu'){
    if(d < 12){
      toast('Sanayi odunu 12 çapından küçük olmaz.');
      focusDiameter();
      return false;
    }
    if(l < 0.5 || l > 1.45){
      toast('Sanayi odununda boy 0,50 ile 1,45 metre arasında olmalı.');
      focusLength();
      return false;
    }
  }

  if(product === 'Tel Direk'){
    if(d < 12 || d > 40){
      toast('Tel direği çapı 12 ile 40 arasında olmalı.');
      focusDiameter();
      return false;
    }
    if(l < 6.5 || l > 25){
      toast('Tel direğinde boy 6,5 ile 25 metre arasında olmalı.');
      focusLength();
      return false;
    }
  }

  return true;
}
function productRuleText(){
  const p = productInfo(state.settings.currentProduct);
  return p.rule || '';
}
function syncProductBodyClass(){
  const cls = productInfo(state.settings.currentProduct).cls;
  document.body.classList.remove('product-tomruk-active','product-maden-active','product-kagit-active','product-sanayi-active','product-tel-active');
  document.body.classList.add('product-'+cls+'-active');
}
function ensureProductRuleHint(){
  const grid = $('productButtons');
  if(!grid) return;
  let hint = $('productRuleHint');
  if(!hint){
    hint = document.createElement('p');
    hint.id = 'productRuleHint';
    hint.className = 'product-rule-hint';
    grid.parentNode.insertBefore(hint, grid.nextSibling);
  }
  hint.textContent = productRuleText();
}
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
  productType:normalizeProductType(r.productType || r.odunTuru || r.odunAdi || r.product || 'Tomruk'), treeType:r.treeType || r.species || r.agacTuru || r.agacAdi || 'Karaçam', cutter:r.cutter || r.kesimci || '', productionDate:r.productionDate || r.uretimTarihi || state.settings?.mesahaDate || todayISO(),
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
  $('diameterInput').addEventListener('input', () => { const clean = String($('diameterInput').value||'').replace(/\D/g,'').slice(0,2); if($('diameterInput').value !== clean) $('diameterInput').value = clean; state.settings.diameter=clean; saveSettings(); });
  $('lengthInput').addEventListener('input', () => { state.settings.length=String($('lengthInput').value||'').replace(',', '.'); saveSettings(); });
  $('barcodeInput').addEventListener('input', () => { state.settings.barcode=String($('barcodeInput').value||'').toUpperCase(); $('barcodeInput').value=state.settings.barcode; saveSettings(); });
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
  $('diameterInput').value=state.settings.diameter||''; $('lengthInput').value=state.settings.length||''; $('barcodeInput').value=state.settings.barcode||''; if($('quantityInput')) $('quantityInput').value=state.settings.quantity||'1';
  renderCutters(); renderEntryTrees(); renderQuickChips(); renderProducts(); syncProductBodyClass(); ensureProductRuleHint(); renderRecent(); const t=totals(state.records); $('entryTotalCount').textContent=t.count.toLocaleString('tr-TR'); $('entryTotalM3').textContent=`${fmt(t.m3,3)} m³`;
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
  state.settings.visibleProducts = (state.settings.visibleProducts||[]).map(normalizeProductType).filter(k=>PRODUCTS.some(p=>p.key===k));
  if(!state.settings.visibleProducts.length) state.settings.visibleProducts=defaults.visibleProducts.slice();
  const list = state.settings.visibleProducts.filter(k=>PRODUCTS.some(p=>p.key===k));
  state.settings.currentProduct = normalizeProductType(state.settings.currentProduct);
  if(!list.includes(state.settings.currentProduct)) state.settings.currentProduct=list[0]||'Tomruk';
  $('productButtons').innerHTML = list.map(k => { const p=productInfo(k); return `<button class="product-btn product-${p.cls} ${k===state.settings.currentProduct?'active':''}" data-product="${esc(k)}" type="button">${esc(p.label)}</button>`; }).join('');
  $('productButtons').querySelectorAll('[data-product]').forEach(b => b.addEventListener('click', () => {
    state.settings.currentProduct=normalizeProductType(b.dataset.product);
    saveSettings();
    syncProductBodyClass();
    renderProducts();
    ensureProductRuleHint();
    const d=$('diameterInput').value, l=$('lengthInput').value;
    if(d) validateProductRules(state.settings.currentProduct, d, l || 0);
    try{ $('diameterInput').focus({preventScroll:true}); }catch{}
  }));
  syncProductBodyClass();
  ensureProductRuleHint();
}
function renderRecent(){ const recent=state.records.slice(-3).reverse(); $('recentList').innerHTML = recent.length ? recent.map(r=>`<button class="recent-item product-${productInfo(r.productType).cls}" data-edit="${r.id}" type="button"><b>${esc(r.barcode)}</b><small>${esc(r.treeType)} • ${esc(productInfo(r.productType).label)} • ${esc(r.diameter)} çap / ${esc(r.length)} boy</small></button>`).join('') : '<p class="hint">Henüz kayıt yok.</p>'; $('recentList').querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>{ const r=state.records.find(x=>x.id===b.dataset.edit); if(r) openEntry(r); })); }
function saveEntry(){
  const barcode=norm($('barcodeInput').value).toUpperCase(); const diameter=norm($('diameterInput').value); const length=norm($('lengthInput').value);
  if(!barcode) return toast('Barkod giriniz.');
  if(!validateBarcode(barcode)) return;
  if(!diameter) return toast('Çap giriniz.');
  if(!length) return toast('Boy giriniz.');
  if(!validateProductRules(state.settings.currentProduct, diameter, length)) return;
  const duplicate = state.records.find(r => r.barcode===barcode && r.id!==state.editingId); if(duplicate) return toast('Bu barkod daha önce kayıtlı.');
  const rec = { id: state.editingId || uid(), barcode, diameter, length, quantity:Math.max(1, num($('quantityInput') && $('quantityInput').value || 1)), productType:normalizeProductType(state.settings.currentProduct), treeType:state.settings.currentTree, cutter:state.settings.activeCutter||'', productionDate:state.settings.mesahaDate||todayISO(), createdAt:new Date().toISOString(), updatedAt: state.editingId ? new Date().toISOString() : '' };
  if(state.editingId){ const i=state.records.findIndex(r=>r.id===state.editingId); if(i>=0) state.records[i]=rec; state.editingId=null; $('cancelEditBtn').classList.add('hidden'); }
  else state.records.push(rec);
  state.settings.quantity = String(Math.max(1, num($('quantityInput') && $('quantityInput').value || 1))); rememberChip('recentDiameters', diameter); rememberChip('recentLengths', length); state.settings.barcode=nextBarcode(barcode); $('barcodeInput').value=state.settings.barcode; saveRecords(); saveSettings(); renderAll(); toast('Kayıt alındı.'); if(state.settings.soundEnabled!==false) beep();
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
function exportXls(){
  let list = filteredRecords();
  if(window.mesahaV303 && typeof window.mesahaV303.selected === 'function'){
    const selected = window.mesahaV303.selected();
    if(selected && selected.length) list = selected;
    else if(typeof window.mesahaV303.filtered === 'function') list = window.mesahaV303.filtered();
  }
  if(!list.length) return toast('Çıktı için kayıt yok.');
  const ordered=list.slice();
  const bolme=cleanFile(state.settings.bolmeNo);
  const file=`Mesaha_${bolme?bolme+'_':''}${formatDateFile()}.xls`;
  if(window.OrbisXls) window.OrbisXls.downloadXls(ordered, file); else toast('XLS modülü yüklenmedi.');
}
function backupJson(){ const data={version:'v3.03-extras', exportedAt:new Date().toISOString(), records:state.records, settings:state.settings}; downloadText(JSON.stringify(data,null,2), `mesaha_yedek_${formatDateFile()}.json`, 'application/json'); toast('Yedek indirildi.'); }
function restoreJson(e){ const file=e.target.files && e.target.files[0]; if(!file) return; const reader=new FileReader(); reader.onload=()=>{ try{ const data=JSON.parse(reader.result); const records=Array.isArray(data) ? data : data.records; if(!Array.isArray(records)) throw new Error('records yok'); state.records=records.map(migrateRecord).filter(Boolean); if(data.settings) state.settings={...state.settings,...data.settings}; saveRecords(); saveSettings(); renderAll(); toast('Yedek yüklendi.'); }catch(err){ toast('Yedek okunamadı.'); } e.target.value=''; }; reader.readAsText(file); }
function downloadText(content, filename, type){ const blob=new Blob([content],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000); }
window.state = state;
window.renderAll = renderAll;
window.renderRecords = renderRecords;
window.openEntry = openEntry;
window.saveRecords = saveRecords;
window.saveSettings = saveSettings;
window.toast = toast;
window.productInfo = productInfo;
window.volume = volume;
window.saveEntry = saveEntry;
function boot(){ load(); bind(); renderAll(); showView('home'); setTimeout(()=>$('startup').classList.add('hide'),350); if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(()=>{}); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();


/* v303: admin hariç eksik parçalar - canlı ölçüm, aynı barkod, seçimli kayıtlar, bakım, özet */
(function(){
  'use strict';

  const PAGE_SIZE = 20;
  let selectedIds = new Set();
  let lastDeleted = null;
  let currentPage = 1;

  const $ = id => document.getElementById(id);
  const norm = v => String(v ?? '').trim().replace(/\s+/g,' ');
  const num = v => {
    const n = Number(String(v ?? '').replace(',','.'));
    return Number.isFinite(n) ? n : 0;
  };
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmt = (n,d=3) => Number(n||0).toLocaleString('tr-TR',{maximumFractionDigits:d});
  const todayISO = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
    return d.toISOString().slice(0,10);
  };

  function appState(){
    try { return window.state || state; } catch { return null; }
  }
  function records(){
    const s = appState();
    return s && Array.isArray(s.records) ? s.records : [];
  }
  function settings(){
    const s = appState();
    return s && s.settings ? s.settings : {};
  }
  function toast(msg){
    if(typeof window.toast === 'function') return window.toast(msg);
    const el = $('toast');
    if(!el) return alert(msg);
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el.__t);
    el.__t = setTimeout(()=>el.classList.remove('show'), 2400);
  }
  function saveRecords(){
    try { if(typeof window.saveRecords === 'function') return window.saveRecords(); } catch {}
    try { localStorage.setItem('cam_mesaha_kayitlari_v1', JSON.stringify(records())); } catch {}
  }
  function saveSettings(){
    try { if(typeof window.saveSettings === 'function') return window.saveSettings(); } catch {}
    try { localStorage.setItem('cam_mesaha_ayarlar_v1', JSON.stringify(settings())); } catch {}
  }
  function volumeOf(diameter,length,quantity=1){
    const d=num(diameter), l=num(length), q=num(quantity||1);
    if(!d || !l || !q) return 0;
    return Math.PI*Math.pow(d/100,2)/4*l*q;
  }
  function productInfo(key){
    try { if(typeof window.productInfo === 'function') return window.productInfo(key); } catch {}
    const map = {
      'Tomruk':{label:'Tomruk', cls:'tomruk'},
      'Maden Direk':{label:'Maden', cls:'maden'},
      'Kağıtlık':{label:'Kağıtlık', cls:'kagit'},
      'Sanayi Odunu':{label:'Sanayi', cls:'sanayi'},
      'Tel Direk':{label:'Tel', cls:'tel'}
    };
    return map[key] || map['Tomruk'];
  }
  function normalizeProductType(v){
    v = norm(v).toLocaleLowerCase('tr-TR');
    if(v==='maden' || v==='maden direk' || v==='maden direği' || v==='maden diregi') return 'Maden Direk';
    if(v==='kağıtlık' || v==='kagitlik' || v==='kağıtlık odun' || v==='kagitlik odun') return 'Kağıtlık';
    if(v==='sanayi' || v==='sanayi odunu') return 'Sanayi Odunu';
    if(v==='tel' || v==='tel direk' || v==='tel direği' || v==='tel diregi') return 'Tel Direk';
    return v==='tomruk' ? 'Tomruk' : (v ? v : 'Tomruk');
  }

  function filteredRecordsV303(){
    const s = settings();
    const q = norm(($('recordSearch') && $('recordSearch').value) || '').toLocaleLowerCase('tr-TR');
    return records().filter(r => {
      const treeOk = !s.treeFilter || s.treeFilter === 'Tümü' || r.treeType === s.treeFilter;
      const cutterOk = !s.cutterFilter || s.cutterFilter === 'Tümü' || (s.cutterFilter === 'Kesimci kaydı yok' ? !r.cutter : r.cutter === s.cutterFilter);
      const searchOk = !q || [r.barcode, r.treeType, r.productType, productInfo(r.productType).label, r.cutter, r.diameter, r.length].some(x => String(x||'').toLocaleLowerCase('tr-TR').includes(q));
      return treeOk && cutterOk && searchOk;
    });
  }

  function updateLiveBox(){
    const d = $('diameterInput'), l = $('lengthInput'), q = $('quantityInput'), b = $('barcodeInput');
    const live = $('liveVolumeText'), warn = $('duplicateWarnText');
    if(live) live.textContent = 'Canlı hacim: ' + fmt(volumeOf(d&&d.value, l&&l.value, q&&q.value||1), 3) + ' m³';
    if(warn){
      const barcode = norm(b && b.value).toUpperCase();
      const s = appState();
      const dup = barcode && records().find(r => r.barcode === barcode && (!s || r.id !== s.editingId));
      warn.textContent = dup ? 'Bu barkod zaten kayıtlı' : '';
      warn.classList.toggle('show', !!dup);
    }
  }

  function setSameBarcodeButton(){
    const btn = $('sameBarcodeBtn');
    if(!btn) return;
    const on = settings().sameBarcodeMode === true;
    btn.textContent = 'Aynı Barkod: ' + (on ? 'Açık' : 'Kapalı');
    btn.classList.toggle('active', on);
  }

  function patchSaveEntry(){
    if(window.__v303SavePatched) return;
    window.__v303SavePatched = true;

    const old = window.saveEntry;
    if(typeof old !== 'function') return;

    window.saveEntry = function(){
      const beforeBarcode = norm($('barcodeInput') && $('barcodeInput').value).toUpperCase();
      const beforeCount = records().length;
      const result = old.apply(this, arguments);
      const afterCount = records().length;

      if(settings().sameBarcodeMode === true && afterCount > beforeCount && beforeBarcode){
        settings().barcode = beforeBarcode;
        if($('barcodeInput')) $('barcodeInput').value = beforeBarcode;
        saveSettings();
      }

      updateLiveBox();
      renderDetailSummary();
      renderRecordsV303();
      return result;
    };

    try { saveEntry = window.saveEntry; } catch {}
  }

  function patchRecordMigration(){
    records().forEach(r => {
      r.productType = normalizeProductType(r.productType || r.odunTuru || r.odunAdi || r.product || 'Tomruk');
      r.quantity = Math.max(1, Number(r.quantity || r.adet || 1));
    });
  }

  function renderDetailSummary(){
    const box = $('detailSummary');
    if(!box) return;
    const all = records();
    const today = todayISO();
    const todayList = all.filter(r => (r.createdAt || r.productionDate || '').slice(0,10) === today || r.productionDate === today);
    const last = all.length ? all[all.length-1] : null;
    const todayM3 = todayList.reduce((s,r)=>s+volumeOf(r.diameter,r.length,r.quantity||1),0);
    const totalM3 = all.reduce((s,r)=>s+volumeOf(r.diameter,r.length,r.quantity||1),0);
    box.innerHTML = `
      <div><small>Son Barkod</small><b>${esc(last ? last.barcode : '-')}</b></div>
      <div><small>Son Ağaç</small><b>${esc(last ? last.treeType : '-')}</b></div>
      <div><small>Bugün Kayıt</small><b>${todayList.length}</b></div>
      <div><small>Bugün m³</small><b>${fmt(todayM3,3)} m³</b></div>
      <div><small>Toplam Kayıt</small><b>${all.length}</b></div>
      <div><small>Toplam m³</small><b>${fmt(totalM3,3)} m³</b></div>`;
  }

  function selectedList(){
    return records().filter(r => selectedIds.has(r.id));
  }
  function updateSelectionInfo(){
    const el = $('selectedInfo');
    if(el) el.textContent = selectedIds.size + ' seçili';
    const undo = $('undoDeleteBtn');
    if(undo) undo.classList.toggle('hidden', !lastDeleted);
  }

  function renderRecordsV303(){
    const list = filteredRecordsV303();
    const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if(currentPage > pageCount) currentPage = pageCount;
    if(currentPage < 1) currentPage = 1;
    const page = list.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);
    const holder = $('recordList');
    if(!holder) return;
    holder.innerHTML = page.length ? page.slice().reverse().map(r => {
      const p = productInfo(r.productType);
      const checked = selectedIds.has(r.id) ? 'checked' : '';
      return `<article class="record-card product-${p.cls}">
        <input class="record-select" type="checkbox" data-select="${esc(r.id)}" ${checked}>
        <div class="record-main"><b>${esc(r.barcode)} • ${esc(r.treeType)} • ${esc(p.label)}</b><small>${esc(r.diameter)} çap / ${esc(r.length)} boy • ${Number(r.quantity||1)} adet • ${esc(r.cutter||'Kesimci yok')} • ${esc(r.productionDate||'')}</small></div>
        <div class="record-actions"><button data-edit="${esc(r.id)}">Düzelt</button><button data-del="${esc(r.id)}">Sil</button></div>
      </article>`;
    }).join('') : '<p class="hint">Kayıt bulunamadı.</p>';

    holder.querySelectorAll('[data-select]').forEach(ch => ch.addEventListener('change', () => {
      if(ch.checked) selectedIds.add(ch.dataset.select); else selectedIds.delete(ch.dataset.select);
      updateSelectionInfo();
    }));

    holder.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => {
      const r = records().find(x => x.id === b.dataset.edit);
      if(r && typeof window.openEntry === 'function') window.openEntry(r);
    }));

    holder.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
      if(!confirm('Kayıt silinsin mi?')) return;
      const arr = records();
      const idx = arr.findIndex(x => x.id === b.dataset.del);
      if(idx >= 0){
        lastDeleted = {records: arr.splice(idx,1)};
        selectedIds.delete(b.dataset.del);
        saveRecords();
        renderAllV303();
        toast('Kayıt silindi.');
      }
    }));

    renderPager(list.length, pageCount);
    updateSelectionInfo();
  }

  function renderPager(total, pageCount){
    const el = $('pager');
    if(!el) return;
    if(total <= PAGE_SIZE){ el.innerHTML = ''; return; }
    el.innerHTML = `<button class="btn soft" type="button" id="prevPageBtn">Önceki</button><span>${currentPage} / ${pageCount}</span><button class="btn soft" type="button" id="nextPageBtn">Sonraki</button>`;
    $('prevPageBtn').addEventListener('click', () => { currentPage--; renderRecordsV303(); });
    $('nextPageBtn').addEventListener('click', () => { currentPage++; renderRecordsV303(); });
  }

  function bindV303(){
    const d=$('diameterInput'), l=$('lengthInput'), q=$('quantityInput'), b=$('barcodeInput');
    [d,l,q,b].filter(Boolean).forEach(el => {
      if(el.__v303Live) return;
      el.__v303Live = true;
      el.addEventListener('input', updateLiveBox);
      el.addEventListener('change', updateLiveBox);
    });

    if(q && !q.__v303Qty){
      q.__v303Qty = true;
      q.addEventListener('input', () => {
        let v = String(q.value||'').replace(/\D/g,'').slice(0,3);
        if(!v || Number(v)<1) v='1';
        q.value = v;
      });
    }

    const same = $('sameBarcodeBtn');
    if(same && !same.__v303Same){
      same.__v303Same = true;
      same.addEventListener('click', () => {
        settings().sameBarcodeMode = settings().sameBarcodeMode !== true;
        saveSettings();
        setSameBarcodeButton();
      });
    }

    const save = $('saveBtn');
    if(save && !save.__v303SameRestore){
      save.__v303SameRestore = true;
      save.addEventListener('click', () => {
        const beforeBarcode = norm($('barcodeInput') && $('barcodeInput').value).toUpperCase();
        const beforeCount = records().length;
        setTimeout(() => {
          if(settings().sameBarcodeMode === true && records().length > beforeCount && beforeBarcode){
            settings().barcode = beforeBarcode;
            if($('barcodeInput')) $('barcodeInput').value = beforeBarcode;
            saveSettings();
          }
          updateLiveBox();
          renderDetailSummary();
          renderRecordsV303();
        }, 0);
      });
    }

    const search = $('recordSearch');
    if(search && !search.__v303Search){
      search.__v303Search = true;
      search.addEventListener('input', () => { currentPage=1; renderRecordsV303(); });
    }

    const selectFiltered = $('selectFilteredBtn');
    if(selectFiltered && !selectFiltered.__v303){
      selectFiltered.__v303 = true;
      selectFiltered.addEventListener('click', () => {
        filteredRecordsV303().forEach(r => selectedIds.add(r.id));
        renderRecordsV303();
      });
    }

    const clearSel = $('clearSelectionBtn');
    if(clearSel && !clearSel.__v303){
      clearSel.__v303 = true;
      clearSel.addEventListener('click', () => { selectedIds.clear(); renderRecordsV303(); });
    }

    const bulk = $('bulkDeleteBtn');
    if(bulk && !bulk.__v303){
      bulk.__v303 = true;
      bulk.addEventListener('click', () => {
        const list = selectedList();
        if(!list.length) return toast('Seçili kayıt yok.');
        if(!confirm(list.length + ' kayıt silinsin mi?')) return;
        lastDeleted = {records:list.slice()};
        const ids = new Set(list.map(r=>r.id));
        const s = appState();
        s.records = records().filter(r => !ids.has(r.id));
        selectedIds.clear();
        saveRecords();
        renderAllV303();
        toast('Seçili kayıtlar silindi.');
      });
    }

    const undo = $('undoDeleteBtn');
    if(undo && !undo.__v303){
      undo.__v303 = true;
      undo.addEventListener('click', () => {
        if(!lastDeleted || !lastDeleted.records) return;
        const s = appState();
        s.records = records().concat(lastDeleted.records);
        lastDeleted = null;
        saveRecords();
        renderAllV303();
        toast('Silme geri alındı.');
      });
    }

    const delAll = $('deleteAllBtn');
    if(delAll && !delAll.__v303){
      delAll.__v303 = true;
      delAll.addEventListener('click', () => {
        if(!records().length) return toast('Silinecek kayıt yok.');
        if(!confirm('Tüm kayıtlar silinsin mi?')) return;
        lastDeleted = {records:records().slice()};
        const s = appState();
        s.records = [];
        selectedIds.clear();
        saveRecords();
        renderAllV303();
        toast('Tüm kayıtlar silindi.');
      });
    }

    document.addEventListener('click', ev => { if(ev.target && ev.target.closest && ev.target.closest('[data-tree-filter],[data-cutter-filter]')) setTimeout(renderRecordsV303, 60); }, true);

    document.querySelectorAll('[data-nav="records"]').forEach(btn => {
      if(btn.__v303Nav) return;
      btn.__v303Nav = true;
      btn.addEventListener('click', () => setTimeout(renderRecordsV303, 80));
    });

    const update = $('forceUpdateBtn');
    if(update && !update.__v303){
      update.__v303 = true;
      update.addEventListener('click', forceUpdate);
    }

    const cache = $('clearCacheBtn');
    if(cache && !cache.__v303){
      cache.__v303 = true;
      cache.addEventListener('click', clearCacheOnly);
    }

    const backup = $('backupBtn');
    if(backup && !backup.__v303Info){
      backup.__v303Info = true;
      backup.addEventListener('click', () => {
        setTimeout(()=>alert('Yedek dosyası metin/JSON formatındadır. Sadece Mesaha İO içinde geri yükleme içindir. Excel yedeği değildir. Excel için Mesaha Dosyasını İndir butonunu kullanınız.'), 50);
      }, true);
    }

    const restore = $('restoreBtn');
    if(restore && !restore.__v303Info){
      restore.__v303Info = true;
      restore.addEventListener('click', () => {
        setTimeout(()=>alert('Yedek Yükle: Daha önce Mesaha İO ile alınan JSON yedeğini seçiniz. Bu işlem mevcut kayıtları yedekteki kayıtlarla değiştirir.'), 50);
      }, true);
    }

    const xls = $('downloadXlsBtn');
    if(xls && !xls.__v303Info){
      xls.__v303Info = true;
      xls.addEventListener('click', () => {
        setTimeout(()=>alert('Mesaha dosyası indiriliyor\\n\\nORBİS’e Aktarma:\\n1. Dosyayı bilgisayara aktarınız.\\n2. ORBİS’e bilgisayar üzerinden giriş yapınız.\\n3. İşletme Pazarlama > Kesme Faaliyetleri Raporu ekranına giriniz.\\n4. Şeflik ve bölme bilgilerini giriniz, bölmeye çift tıklayınız.\\n5. Dosya yükleme bölümünden Excel’den Aktar deyiniz.'), 50);
      }, true);
    }
  }

  function renderAllV303(){
    patchRecordMigration();
    updateLiveBox();
    setSameBarcodeButton();
    renderDetailSummary();
    try { if(typeof window.renderAll === 'function') window.renderAll(); } catch {}
    renderRecordsV303();
  }

  async function clearCacheOnly(){
    try{
      if('caches' in window){
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      toast('Ön bellek temizlendi.');
    }catch{
      toast('Ön bellek temizlenemedi.');
    }
  }

  async function forceUpdate(){
    try{
      if('serviceWorker' in navigator){
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.update()));
      }
      if('caches' in window){
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      toast('Yeni sürüm kontrol edildi. Sayfa yenileniyor.');
      setTimeout(()=>location.reload(), 800);
    }catch{
      toast('Güncelleme yapılamadı.');
    }
  }

  function boot(){
    patchSaveEntry();
    bindV303();
    patchRecordMigration();
    setSameBarcodeButton();
    updateLiveBox();
    renderDetailSummary();
    renderRecordsV303();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();

  [100,300,800,1600,3000].forEach(ms => setTimeout(boot, ms));
  window.mesahaV303 = {render:renderAllV303, live:updateLiveBox, records:renderRecordsV303, selected:selectedList, filtered:filteredRecordsV303};
})();
