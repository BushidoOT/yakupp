(function(){
'use strict';
const STORAGE_KEY = 'cam_mesaha_kayitlari_v1';
const SETTINGS_KEY = 'cam_mesaha_ayarlar_v1';
const VERSION = window.MESAHA_VERSION || {shortVersion:'v3.15', version:'v315-warning-toast-bind-fix'};
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
function toast(msg){
  const message = String(msg || '').trim();
  if(!message) return;
  try{
    const fn = window.mesahaFloatToastV315 || window.mesahaFloatToastV314;
    if(typeof fn === 'function'){
      fn(message, 'Kontrol et', 'warning');
      return;
    }
    let floatEl = document.getElementById('saveFloatToastV310') || document.getElementById('saveFloatToastV313') || document.getElementById('saveFloatToastV314');
    if(!floatEl){
      floatEl = document.createElement('div');
      floatEl.id = 'saveFloatToastV310';
      document.body.appendChild(floatEl);
    }
    floatEl.className = 'save-float-toast-v310 save-float-toast-v313 save-float-toast-v314 warning';
    if(!floatEl.querySelector('.txt')) floatEl.innerHTML = '<span class="ico">⚠</span><span class="txt"><b></b><small></small></span>';
    const icon = floatEl.querySelector('.ico');
    const b = floatEl.querySelector('b');
    const small = floatEl.querySelector('small');
    if(icon) icon.textContent = '⚠';
    if(b) b.textContent = message;
    if(small) small.textContent = 'Kontrol et';
    const vv = window.visualViewport;
    const inset = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
    const activeId = document.activeElement && document.activeElement.id;
    const entryActive = document.body.classList.contains('entry-open') || ['diameterInput','lengthInput','barcodeInput'].includes(activeId);
    const bottom = entryActive ? Math.max(inset + 14, 118) : 104;
    floatEl.style.setProperty('bottom', `calc(${bottom}px + env(safe-area-inset-bottom,0px))`, 'important');
    floatEl.style.setProperty('top', 'auto', 'important');
    floatEl.style.setProperty('left', window.innerWidth <= 430 ? '8px' : '10px', 'important');
    floatEl.style.setProperty('right', 'auto', 'important');
    floatEl.classList.remove('show');
    void floatEl.offsetWidth;
    floatEl.classList.add('show');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(()=>floatEl.classList.remove('show'),3200);
    return;
  }catch{}
  const el=$('toast');
  if(!el) return;
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer=setTimeout(()=>el.classList.remove('show'),2200);
}
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
  ['lengthInput'].forEach(id => {
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
  if(record){
    state.editingReturnBarcode = state.settings.barcode || (($('barcodeInput') && $('barcodeInput').value) || '');
    state.editingId=record.id; state.settings.currentTree=record.treeType; state.settings.currentProduct=record.productType; state.settings.length=record.length; state.settings.diameter=record.diameter; state.settings.barcode=record.barcode; state.settings.activeCutter=record.cutter||''; $('cancelEditBtn').classList.remove('hidden');
  }
  else { state.editingId=null; state.editingReturnBarcode=''; $('cancelEditBtn').classList.add('hidden'); }
  renderEntry(); showView('entry'); setTimeout(()=>{ try{$('diameterInput').focus({preventScroll:true}); const dl=String($('diameterInput').value||'').length; try{$('diameterInput').setSelectionRange(dl,dl);}catch{}}catch{} },80);
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
  const wasEditing = Boolean(state.editingId);
  const returnBarcodeAfterEdit = state.editingReturnBarcode || state.settings.barcode || '';
  const barcode=norm($('barcodeInput').value).toUpperCase(); const diameter=norm($('diameterInput').value); const length=norm($('lengthInput').value);
  if(!barcode) return toast('Barkod giriniz.');
  if(!validateBarcode(barcode)) return;
  if(!diameter) return toast('Çap giriniz.');
  if(!length) return toast('Boy giriniz.');
  if(!validateProductRules(state.settings.currentProduct, diameter, length)) return;
  const duplicate = state.records.find(r => String(r.barcode||'').toUpperCase()===barcode && r.id!==state.editingId); if(duplicate) return toast('Bu barkod daha önce kayıtlı.');
  const rec = { id: state.editingId || uid(), barcode, diameter, length, quantity:Math.max(1, num($('quantityInput') && $('quantityInput').value || 1)), productType:normalizeProductType(state.settings.currentProduct), treeType:state.settings.currentTree, cutter:state.settings.activeCutter||'', productionDate:state.settings.mesahaDate||todayISO(), createdAt:new Date().toISOString(), updatedAt: state.editingId ? new Date().toISOString() : '' };
  if(state.editingId){ const i=state.records.findIndex(r=>r.id===state.editingId); if(i>=0) state.records[i]=rec; state.editingId=null; state.editingReturnBarcode=''; $('cancelEditBtn').classList.add('hidden'); }
  else state.records.push(rec);
  state.settings.quantity = '1'; state.settings.length = length; state.settings.diameter = ''; if($('lengthInput')) $('lengthInput').value = length; rememberChip('recentDiameters', diameter); rememberChip('recentLengths', length); state.settings.barcode = wasEditing ? (returnBarcodeAfterEdit || nextBarcode(barcode)) : nextBarcode(barcode); $('barcodeInput').value=state.settings.barcode; saveRecords(); saveSettings(); renderAll(); if(window.mesahaV310SavedToast){ window.mesahaV310SavedToast(rec, wasEditing); } else toast(wasEditing ? 'Kayıt güncellendi.' : 'Kayıt alındı.'); try{ setTimeout(()=>{ $('diameterInput').value=''; $('diameterInput').focus({preventScroll:true}); const dl=String($('diameterInput').value||'').length; try{$('diameterInput').setSelectionRange(dl,dl);}catch{} }, 0); }catch{} if(state.settings.soundEnabled!==false) beep();
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
function backupJson(){ const data={version:'v3.15-extras', exportedAt:new Date().toISOString(), records:state.records, settings:state.settings}; downloadText(JSON.stringify(data,null,2), `mesaha_yedek_${formatDateFile()}.json`, 'application/json'); toast('Yedek indirildi.'); }
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
function boot(){ load(); bind(); renderAll(); showView('home'); setTimeout(()=>$('startup').classList.add('hide'),1100); if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(()=>{}); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();


/* v311: admin hariç eksik parçalar - canlı ölçüm, aynı barkod, seçimli kayıtlar, bakım, özet */
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
    if(window.__v311SavePatched) return;
    window.__v311SavePatched = true;

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
      if(el.__v311Live) return;
      el.__v311Live = true;
      el.addEventListener('input', updateLiveBox);
      el.addEventListener('change', updateLiveBox);
    });

    if(q && !q.__v311Qty){
      q.__v311Qty = true;
      q.addEventListener('input', () => {
        let v = String(q.value||'').replace(/\D/g,'').slice(0,3);
        if(!v || Number(v)<1) v='1';
        q.value = v;
      });
    }

    const same = $('sameBarcodeBtn');
    if(same && !same.__v311Same){
      same.__v311Same = true;
      same.addEventListener('click', () => {
        settings().sameBarcodeMode = settings().sameBarcodeMode !== true;
        saveSettings();
        setSameBarcodeButton();
      });
    }

    const save = $('saveBtn');
    if(save && !save.__v311SameRestore){
      save.__v311SameRestore = true;
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
    if(search && !search.__v311Search){
      search.__v311Search = true;
      search.addEventListener('input', () => { currentPage=1; renderRecordsV303(); });
    }

    const selectFiltered = $('selectFilteredBtn');
    if(selectFiltered && !selectFiltered.__v311){
      selectFiltered.__v311 = true;
      selectFiltered.addEventListener('click', () => {
        filteredRecordsV303().forEach(r => selectedIds.add(r.id));
        renderRecordsV303();
      });
    }

    const clearSel = $('clearSelectionBtn');
    if(clearSel && !clearSel.__v311){
      clearSel.__v311 = true;
      clearSel.addEventListener('click', () => { selectedIds.clear(); renderRecordsV303(); });
    }

    const bulk = $('bulkDeleteBtn');
    if(bulk && !bulk.__v311){
      bulk.__v311 = true;
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
    if(undo && !undo.__v311){
      undo.__v311 = true;
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
    if(delAll && !delAll.__v311){
      delAll.__v311 = true;
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
      if(btn.__v311Nav) return;
      btn.__v311Nav = true;
      btn.addEventListener('click', () => setTimeout(renderRecordsV303, 80));
    });

    const update = $('forceUpdateBtn');
    if(update && !update.__v311){
      update.__v311 = true;
      update.addEventListener('click', forceUpdate);
    }

    const cache = $('clearCacheBtn');
    if(cache && !cache.__v311){
      cache.__v311 = true;
      cache.addEventListener('click', clearCacheOnly);
    }

    const backup = $('backupBtn');
    if(backup && !backup.__v311Info){
      backup.__v311Info = true;
      backup.addEventListener('click', () => {
        setTimeout(()=>alert('Yedek dosyası metin/JSON formatındadır. Sadece Mesaha İO içinde geri yükleme içindir. Excel yedeği değildir. Excel için Mesaha Dosyasını İndir butonunu kullanınız.'), 50);
      }, true);
    }

    const restore = $('restoreBtn');
    if(restore && !restore.__v311Info){
      restore.__v311Info = true;
      restore.addEventListener('click', () => {
        setTimeout(()=>alert('Yedek Yükle: Daha önce Mesaha İO ile alınan JSON yedeğini seçiniz. Bu işlem mevcut kayıtları yedekteki kayıtlarla değiştirir.'), 50);
      }, true);
    }

    const xls = $('downloadXlsBtn');
    if(xls && !xls.__v311Info){
      xls.__v311Info = true;
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


/* v311: modern pencereler + yedek zip + başlangıç/güncelleme + seçili/filtreli bilgi */
(function(){
  'use strict';

  const STORAGE_KEY = 'cam_mesaha_kayitlari_v1';
  const SETTINGS_KEY = 'cam_mesaha_ayarlar_v1';
  let lastDeletedV304 = null;

  const $ = id => document.getElementById(id);
  const norm = v => String(v ?? '').trim().replace(/\s+/g,' ');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const num = v => { const n = Number(String(v ?? '').replace(',','.')); return Number.isFinite(n) ? n : 0; };
  const fmt = (n,d=3) => Number(n||0).toLocaleString('tr-TR',{maximumFractionDigits:d});
  const appState = () => window.state || null;
  const records = () => (appState() && Array.isArray(appState().records)) ? appState().records : [];
  const settings = () => (appState() && appState().settings) ? appState().settings : {};
  const productInfo = key => {
    if(typeof window.productInfo === 'function') return window.productInfo(key);
    const map = {
      'Tomruk':{label:'Tomruk', cls:'tomruk'},
      'Maden Direk':{label:'Maden', cls:'maden'},
      'Kağıtlık':{label:'Kağıtlık', cls:'kagit'},
      'Sanayi Odunu':{label:'Sanayi', cls:'sanayi'},
      'Tel Direk':{label:'Tel', cls:'tel'}
    };
    return map[key] || map['Tomruk'];
  };
  function saveRecords(){
    if(typeof window.saveRecords === 'function') return window.saveRecords();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records()));
  }
  function saveSettings(){
    if(typeof window.saveSettings === 'function') return window.saveSettings();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings()));
  }
  function toast(msg){
    if(typeof window.toast === 'function') return window.toast(msg);
    const el = $('toast');
    if(!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el.__t);
    el.__t = setTimeout(()=>el.classList.remove('show'), 2200);
  }
  function cleanFile(v){
    return norm(v).replace(/[ıİ]/g,'i').replace(/[ğĞ]/g,'g').replace(/[üÜ]/g,'u').replace(/[şŞ]/g,'s').replace(/[öÖ]/g,'o').replace(/[çÇ]/g,'c').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,44);
  }
  function dateFile(){
    const d = new Date();
    const p = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
  }
  function volumeOf(r){
    const d=num(r.diameter), l=num(r.length), q=num(r.quantity||1);
    if(!d || !l || !q) return 0;
    return Math.PI*Math.pow(d/100,2)/4*l*q;
  }

  function modal(opts){
    opts = opts || {};
    return new Promise(resolve => {
      const back = $('modernModal');
      if(!back) { resolve(confirm(String(opts.title||'Devam edilsin mi?'))); return; }
      const card = back.querySelector('.modal-card');
      const close = $('modalCloseBtn');
      const icon = $('modalIcon');
      const title = $('modalTitle');
      const body = $('modalBody');
      const actions = $('modalActions');
      card.classList.remove('warn','danger','success');
      if(opts.type) card.classList.add(opts.type);
      icon.textContent = opts.icon || (opts.type==='danger' ? '!' : opts.type==='success' ? '✓' : opts.type==='warn' ? '!' : 'ℹ');
      title.textContent = opts.title || 'Bilgi';
      body.innerHTML = opts.html || `<p>${esc(opts.message || '')}</p>`;
      actions.innerHTML = '';
      const buttons = opts.buttons || [{text:'Tamam', value:true, cls:'primary'}];
      function done(v){
        back.classList.add('hidden');
        document.body.classList.remove('modal-open');
        back.onclick = null;
        close.onclick = null;
        resolve(v);
      }
      buttons.forEach(b => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = b.text;
        btn.className = b.cls || '';
        btn.addEventListener('click', () => done(b.value));
        actions.appendChild(btn);
      });
      close.onclick = () => done(false);
      back.onclick = ev => { if(ev.target === back) done(false); };
      back.classList.remove('hidden');
      document.body.classList.add('modal-open');
    });
  }

  window.mesahaModal = modal;
  window.alert = function(message){ modal({title:'Bilgi', message:String(message||''), icon:'ℹ'}); };

  function setStep(name, cls, text){
    const el = document.querySelector(`#startupSteps [data-step="${name}"]`);
    if(!el) return;
    el.classList.remove('ok','warn');
    if(cls) el.classList.add(cls);
    if(text) el.textContent = text;
  }

  async function startupChecks(){
    try{
      setStep('files','ok','Dosyalar hazır');
      let count = 0;
      try{ count = JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]').length || 0; }catch{}
      setStep('records','ok', count + ' kayıt hazır');
      if(navigator.onLine){
        setStep('offline','ok','Online / offline çalışma hazır');
        try{
          const ctrl = new AbortController();
          const timer = setTimeout(()=>ctrl.abort(), 2500);
          const res = await fetch('./version.json?v=' + Date.now(), {cache:'no-store', signal:ctrl.signal});
          clearTimeout(timer);
          if(res.ok){
            const remote = await res.json();
            setStep('version','ok','Sürüm kontrol edildi');
            const current = window.MESAHA_VERSION || {};
            if(remote && remote.version && current.version && remote.version !== current.version){
              setTimeout(() => modal({
                title:'Yeni sürüm var',
                type:'success',
                icon:'↻',
                html:`<p>Yeni sürüm bulundu: <b>${esc(remote.visibleVersion || remote.app || remote.version)}</b></p><p>Güncellemek için aşağıdaki butona basabilirsin.</p>`,
                buttons:[{text:'Sonra', value:false, cls:'ghost'}, {text:'Güncelle', value:true, cls:'primary'}]
              }).then(ok => { if(ok) forceUpdateFlow(); }), 800);
            }
          }else{
            setStep('version','warn','Sürüm kontrolü yapılamadı');
          }
        }catch{
          setStep('version','warn','Sürüm kontrolü offline geçildi');
        }
      }else{
        setStep('version','warn','Offline açıldı, sürüm sonra kontrol edilir');
        setStep('offline','ok','Offline mod hazır');
      }
    }catch{}
  }

  function updateNetwork(){
    const el = $('netText');
    if(el) el.textContent = navigator.onLine ? 'Çevrim içi' : 'Offline';
  }

  function exportScope(){
    const selected = (window.mesahaV303 && typeof window.mesahaV303.selected === 'function') ? window.mesahaV303.selected() : [];
    const filtered = (window.mesahaV303 && typeof window.mesahaV303.filtered === 'function') ? window.mesahaV303.filtered() : records();
    const q = norm(($('recordSearch') && $('recordSearch').value) || '');
    const s = settings();
    const filteredMode = q || (s.treeFilter && s.treeFilter !== 'Tümü') || (s.cutterFilter && s.cutterFilter !== 'Tümü');
    if(selected && selected.length) return {list:selected, text:`Seçili kayıtlar (${selected.length})`, mode:'selected'};
    if(filteredMode) return {list:filtered, text:`Filtrelenen kayıtlar (${filtered.length})`, mode:'filtered'};
    return {list:records(), text:`Tüm kayıtlar (${records().length})`, mode:'all'};
  }

  function updateExportScopeInfo(){
    const el = $('exportScopeInfo');
    if(el) el.textContent = 'İndirilecek: ' + exportScope().text;
    updateLastBarcodeCard();
  }

  function updateLastBarcodeCard(){
    const card = $('homeLastBarcode');
    if(!card) return;
    const last = records().length ? records()[records().length - 1] : null;
    const txt = $('lastBarcodeText');
    const meta = $('lastBarcodeMeta');
    const prod = $('lastBarcodeProduct');
    card.classList.remove('product-tomruk','product-maden','product-kagit','product-sanayi','product-tel');
    if(!last){
      if(txt) txt.textContent = '-';
      if(meta) meta.textContent = 'Henüz kayıt yok';
      if(prod) prod.textContent = '-';
      return;
    }
    const p = productInfo(last.productType);
    card.classList.add('product-' + p.cls);
    if(txt) txt.textContent = last.barcode || '-';
    if(meta) meta.textContent = `${last.treeType || '-'} • ${p.label} • ${last.diameter || '-'} çap / ${last.length || '-'} boy`;
    if(prod) prod.textContent = p.label;
  }

  function selectedIdsFromCheckboxes(){
    return Array.from(document.querySelectorAll('[data-select]:checked')).map(x => x.getAttribute('data-select')).filter(Boolean);
  }

  function renderAfterChange(){
    try{ if(typeof window.renderAll === 'function') window.renderAll(); }catch{}
    try{ if(window.mesahaV303 && typeof window.mesahaV303.render === 'function') window.mesahaV303.render(); }catch{}
    updateExportScopeInfo();
    const undo = $('undoDeleteBtn');
    if(undo) undo.classList.toggle('hidden', !lastDeletedV304);
  }

  function downloadBlob(blob, filename){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1200);
  }

  function downloadText(content, filename, type='text/plain;charset=utf-8'){
    downloadBlob(new Blob([content], {type}), filename);
  }

  function makeXlsDownload(){
    const scope = exportScope();
    if(!scope.list.length){ toast('Çıktı için kayıt yok.'); return; }
    const bolme = cleanFile(settings().bolmeNo || '');
    const file = `Mesaha_${bolme ? bolme + '_' : ''}${dateFile()}.xls`;
    if(window.OrbisXls) window.OrbisXls.downloadXls(scope.list.slice(), file);
    else toast('XLS modülü yüklenmedi.');
  }

  function crc32(bytes){
    if(!crc32.table){
      crc32.table = new Uint32Array(256);
      for(let i=0;i<256;i++){
        let c=i;
        for(let k=0;k<8;k++) c = (c&1) ? (0xEDB88320 ^ (c>>>1)) : (c>>>1);
        crc32.table[i]=c>>>0;
      }
    }
    let c = 0xffffffff;
    for(let i=0;i<bytes.length;i++) c = crc32.table[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function u16(v){ const b=new Uint8Array(2); new DataView(b.buffer).setUint16(0, v, true); return b; }
  function u32(v){ const b=new Uint8Array(4); new DataView(b.buffer).setUint32(0, v>>>0, true); return b; }
  function dosTimeDate(){
    const d = new Date();
    return {
      time: (d.getHours()<<11) | (d.getMinutes()<<5) | Math.floor(d.getSeconds()/2),
      date: ((d.getFullYear()-1980)<<9) | ((d.getMonth()+1)<<5) | d.getDate()
    };
  }
  function concatBytes(parts){
    const len = parts.reduce((s,p)=>s+p.length,0);
    const out = new Uint8Array(len);
    let off=0;
    parts.forEach(p=>{ out.set(p, off); off += p.length; });
    return out;
  }
  function makeZip(files){
    const enc = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const dt = dosTimeDate();
    files.forEach(file => {
      const nameBytes = enc.encode(file.name);
      const data = typeof file.data === 'string' ? enc.encode(file.data) : file.data;
      const crc = crc32(data);
      const local = concatBytes([
        u32(0x04034b50), u16(20), u16(0), u16(0), u16(dt.time), u16(dt.date),
        u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), nameBytes, data
      ]);
      localParts.push(local);
      const central = concatBytes([
        u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(dt.time), u16(dt.date),
        u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes
      ]);
      centralParts.push(central);
      offset += local.length;
    });
    const centralSize = centralParts.reduce((s,p)=>s+p.length,0);
    const end = concatBytes([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(centralSize), u32(offset), u16(0)]);
    return new Blob([...localParts, ...centralParts, end], {type:'application/zip'});
  }
  function backupFilename(ext='zip'){
    const bolme = cleanFile(settings().bolmeNo || '');
    const sef = cleanFile(settings().seflik || '');
    return `mesaha_yedek_${bolme ? bolme + '_' : ''}${sef ? sef + '_' : ''}${dateFile()}.${ext}`;
  }
  function backupZip(){
    const data = {
      version:'v3.15-modern',
      exportedAt:new Date().toISOString(),
      records:records(),
      settings:settings()
    };
    const jsonName = backupFilename('json');
    const zip = makeZip([{name:jsonName, data:JSON.stringify(data,null,2)}]);
    downloadBlob(zip, backupFilename('zip'));
    toast('ZIP yedek indirildi.');
  }
  async function readZipJson(file){
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const dec = new TextDecoder();
    let pos = 0;
    while(pos + 30 <= bytes.length){
      const dv = new DataView(bytes.buffer, bytes.byteOffset + pos);
      const sig = dv.getUint32(0, true);
      if(sig !== 0x04034b50) break;
      const method = dv.getUint16(8, true);
      const size = dv.getUint32(18, true);
      const nameLen = dv.getUint16(26, true);
      const extraLen = dv.getUint16(28, true);
      const nameStart = pos + 30;
      const name = dec.decode(bytes.slice(nameStart, nameStart + nameLen));
      const dataStart = nameStart + nameLen + extraLen;
      const dataEnd = dataStart + size;
      if(dataEnd > bytes.length) throw new Error('ZIP dosyası eksik veya bozuk.');
      if(/\.json$/i.test(name)){
        if(method !== 0) throw new Error('Bu ZIP sıkıştırılmış. Mesaha İO ile alınan ZIP yedeğini seçiniz.');
        return JSON.parse(dec.decode(bytes.slice(dataStart, dataEnd)));
      }
      pos = dataEnd;
    }
    throw new Error('ZIP içinde JSON yedek bulunamadı.');
  }
  async function readBackupFile(file){
    if(/\.zip$/i.test(file.name) || /zip/i.test(file.type||'')) return await readZipJson(file);
    const text = await file.text();
    return JSON.parse(text);
  }
  function restoreData(data){
    const recs = Array.isArray(data) ? data : data.records;
    if(!Array.isArray(recs)) throw new Error('Yedek içinde kayıt listesi bulunamadı.');
    const s = appState();
    if(!s) throw new Error('Uygulama hazır değil.');
    s.records = recs.map(r => ({
      id:r.id || (Date.now().toString(36)+Math.random().toString(36).slice(2,8)),
      barcode:norm(r.barcode || r.barkodNo),
      diameter:String(r.diameter || r.cap || ''),
      length:String(r.length || r.boy || ''),
      quantity:Number(r.quantity || r.adet || 1),
      productType:r.productType || r.odunTuru || r.odunAdi || 'Tomruk',
      treeType:r.treeType || r.species || r.agacTuru || r.agacAdi || 'Karaçam',
      cutter:r.cutter || r.kesimci || '',
      productionDate:r.productionDate || r.uretimTarihi || settings().mesahaDate || new Date().toISOString().slice(0,10),
      createdAt:r.createdAt || new Date().toISOString(),
      updatedAt:r.updatedAt || ''
    })).filter(r => r.barcode);
    if(data.settings && typeof data.settings === 'object'){
      s.settings = {...s.settings, ...data.settings, sameBarcodeMode:false, quantity:'1'};
      window.state = s;
    }
    saveRecords(); saveSettings(); renderAfterChange();
  }

  async function clearCacheFlow(){
    if(!navigator.onLine){
      await modal({
        title:'İnternet yok',
        type:'danger',
        icon:'!',
        html:'<p>Ön bellek temizleme işlemini internet yokken uygulamayın.</p><div class="modal-note">Ön bellek temizlendikten sonra uygulama yeni dosyaları internetten tekrar alır. İnternet yoksa uygulama eksik açılabilir.</div>',
        buttons:[{text:'Tamam', value:true, cls:'primary'}]
      });
      return;
    }
    const ok = await modal({
      title:'Ön Bellek Temizle',
      type:'warn',
      icon:'♻',
      html:'<p>Bu işlem eski uygulama dosyalarını temizler. Kayıtların ve yedeklerin silinmez.</p><div class="modal-note">Dikkat: İnternet yokken uygulamayın. Temizleme bitince sistem kendini otomatik yeniden başlatır.</div>',
      buttons:[{text:'Vazgeç', value:false, cls:'ghost'}, {text:'Temizle ve Yeniden Başlat', value:true, cls:'primary'}]
    });
    if(!ok) return;
    try{
      if('serviceWorker' in navigator){
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister().catch(()=>{})));
      }
      if('caches' in window){
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      await modal({title:'Ön bellek temizlendi', type:'success', icon:'✓', html:'<p>Eski dosyalar temizlendi. Uygulama şimdi kendini yeniden başlatacak.</p>', buttons:[{text:'Yeniden Başlat', value:true, cls:'primary'}]});
      location.replace(location.pathname + '?v=' + Date.now());
    }catch{
      modal({title:'Temizleme başarısız', type:'danger', icon:'!', message:'Ön bellek temizlenemedi.'});
    }
  }
  async function forceUpdateFlow(){
    async function fetchRemoteVersion(){
      const res = await fetch('./version.json?check=' + Date.now(), {cache:'no-store', headers:{'Cache-Control':'no-cache'}});
      if(!res.ok) throw new Error('version.json okunamadı');
      return await res.json();
    }
    const current = window.MESAHA_VERSION || {};
    let remote = null;
    try{ remote = await fetchRemoteVersion(); }catch{}
    const remoteText = remote ? (remote.visibleVersion || remote.app || remote.version || 'Yeni sürüm') : 'Sürüm bilgisi alınamadı';
    const same = remote && current.version && remote.version === current.version;
    const ok = await modal({
      title: same ? 'Sürüm Güncel' : 'Yeni Sürümü Güncelle',
      type: same ? 'success' : 'warn',
      icon:'↻',
      html:(same
        ? `<p>Şu anki sürüm güncel görünüyor: <b>${remoteText}</b></p><div class="modal-note">Yine de takılma varsa ön belleği temizleyip yeniden başlatabilirsin.</div>`
        : `<p>Uygulama son dosyaları kontrol edecek ve ön belleği temizleyip yeniden başlatacak.</p><div class="modal-note">Bulunan sürüm: <b>${remoteText}</b><br>İşlem için internet bağlantısı açık olmalı.</div>`),
      buttons:[{text:'Vazgeç', value:false, cls:'ghost'}, {text:same ? 'Yine De Yenile' : 'Güncelle', value:true, cls:'primary'}]
    });
    if(!ok) return;
    if(!navigator.onLine){
      await modal({title:'İnternet yok', type:'danger', icon:'!', html:'<p>Güncelleme için internet bağlantısı gerekiyor.</p>', buttons:[{text:'Tamam', value:true, cls:'primary'}]});
      return;
    }
    try{
      if('serviceWorker' in navigator){
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister().catch(()=>{})));
      }
      if('caches' in window){
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      await fetch('./index.html?preload=' + Date.now(), {cache:'reload'}).catch(()=>{});
      await modal({title:'Güncelleme hazır', type:'success', icon:'✓', html:'<p>Dosyalar yenilendi. Uygulama şimdi yeniden başlatılacak.</p>', buttons:[{text:'Yeniden Başlat', value:true, cls:'primary'}]});
      location.replace(location.pathname + '?v=' + Date.now());
    }catch{
      modal({title:'Güncelleme yapılamadı', type:'danger', icon:'!', message:'Bağlantı veya tarayıcı önbelleği nedeniyle güncelleme tamamlanamadı.'});
    }
  }

  function bindIntercepts(){
    document.addEventListener('click', async ev => {
      const target = ev.target && ev.target.closest ? ev.target.closest('button,[data-del]') : null;
      if(!target) return;

      if(target.id === 'downloadXlsBtn'){
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        const scope = exportScope();
        const ok = await modal({
          title:'Mesaha dosyası indiriliyor',
          icon:'▣',
          html:`<p><b>${esc(scope.text)}</b> ORBİS uyumlu .xls olarak indirilecek.</p>
            <ol>
              <li>Dosyayı bilgisayara aktarınız.</li>
              <li>ORBİS’e bilgisayar üzerinden giriş yapınız.</li>
              <li>İşletme Pazarlama modülüne giriniz.</li>
              <li>Kesme Faaliyetleri Raporu ekranında şeflik ve bölme bilgilerini giriniz.</li>
              <li>Bölmeye çift tıklayıp dosya yükleme bölümünden <b>Excel’den Aktar</b> deyiniz.</li>
            </ol>`,
          buttons:[{text:'Vazgeç', value:false, cls:'ghost'}, {text:'Dosyayı İndir', value:true, cls:'primary'}]
        });
        if(ok) makeXlsDownload();
        return;
      }

      if(target.id === 'backupBtn'){
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        const ok = await modal({
          title:'Yedek Al',
          icon:'↧',
          html:'<p>Yedek ZIP formatında indirilecek. İçinde JSON yedek dosyası bulunur.</p><div class="modal-note">Bu yedek sadece Mesaha İO içinde geri yükleme içindir. Excel yedeği değildir. Excel için Mesaha Dosyasını İndir butonunu kullanınız.</div>',
          buttons:[{text:'Vazgeç', value:false, cls:'ghost'}, {text:'ZIP Yedek Al', value:true, cls:'primary'}]
        });
        if(ok) backupZip();
        return;
      }

      if(target.id === 'restoreBtn'){
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        const ok = await modal({
          title:'Yedek Yükle',
          type:'warn',
          icon:'!',
          html:'<p>JSON veya Mesaha İO ZIP yedeği seçebilirsiniz.</p><div class="modal-note">Yedek yüklenince mevcut kayıtlar yedekteki kayıtlarla değiştirilir. Devam etmeden önce mevcut verilerinizden emin olun.</div>',
          buttons:[{text:'Vazgeç', value:false, cls:'ghost'}, {text:'Dosya Seç', value:true, cls:'primary'}]
        });
        if(ok && $('restoreInput')) $('restoreInput').click();
        return;
      }

      if(target.id === 'clearCacheBtn'){
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        clearCacheFlow();
        return;
      }

      if(target.id === 'forceUpdateBtn'){
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        forceUpdateFlow();
        return;
      }

      if(target.id === 'bulkDeleteBtn'){
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        const list = (window.mesahaV303 && typeof window.mesahaV303.selected === 'function') ? window.mesahaV303.selected() : [];
        if(!list.length){ toast('Seçili kayıt yok.'); return; }
        const ok = await modal({title:'Seçilileri Sil', type:'danger', icon:'!', html:`<p><b>${list.length}</b> kayıt silinecek.</p><div class="modal-note">Yanlışlık olursa Geri Al butonuyla son silmeyi geri alabilirsin.</div>`, buttons:[{text:'Vazgeç', value:false, cls:'ghost'}, {text:'Sil', value:true, cls:'danger'}]});
        if(!ok) return;
        const ids = new Set(list.map(r => r.id));
        lastDeletedV304 = list.slice();
        const s = appState(); s.records = records().filter(r => !ids.has(r.id)); window.state = s;
        saveRecords(); renderAfterChange(); toast('Seçili kayıtlar silindi.');
        return;
      }

      if(target.id === 'deleteAllBtn'){
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        if(!records().length){ toast('Silinecek kayıt yok.'); return; }
        const ok = await modal({title:'Tümünü Sil', type:'danger', icon:'!', html:`<p><b>${records().length}</b> kayıt tamamen silinecek.</p><div class="modal-note">Bu işlemden sonra Geri Al butonuyla son silmeyi geri alabilirsin.</div>`, buttons:[{text:'Vazgeç', value:false, cls:'ghost'}, {text:'Tümünü Sil', value:true, cls:'danger'}]});
        if(!ok) return;
        lastDeletedV304 = records().slice();
        const s = appState(); s.records = []; window.state = s;
        saveRecords(); renderAfterChange(); toast('Tüm kayıtlar silindi.');
        return;
      }

      if(target.id === 'undoDeleteBtn'){
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        if(!lastDeletedV304 || !lastDeletedV304.length){ toast('Geri alınacak silme yok.'); return; }
        const s = appState(); s.records = records().concat(lastDeletedV304); window.state = s;
        lastDeletedV304 = null;
        saveRecords(); renderAfterChange(); toast('Silme geri alındı.');
        return;
      }

      if(target.matches && target.matches('[data-del]')){
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        const id = target.getAttribute('data-del');
        const rec = records().find(r => r.id === id);
        if(!rec) return;
        const ok = await modal({title:'Kayıt Sil', type:'danger', icon:'!', html:`<p><b>${esc(rec.barcode)}</b> barkodlu kayıt silinsin mi?</p>`, buttons:[{text:'Vazgeç', value:false, cls:'ghost'}, {text:'Sil', value:true, cls:'danger'}]});
        if(!ok) return;
        lastDeletedV304 = [rec];
        const s = appState(); s.records = records().filter(r => r.id !== id); window.state = s;
        saveRecords(); renderAfterChange(); toast('Kayıt silindi.');
        return;
      }
    }, true);

    document.addEventListener('change', async ev => {
      const input = ev.target;
      if(!input || input.id !== 'restoreInput') return;
      ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
      const file = input.files && input.files[0];
      input.value = '';
      if(!file) return;
      try{
        const data = await readBackupFile(file);
        restoreData(data);
        await modal({title:'Yedek yüklendi', type:'success', icon:'✓', html:`<p>Yedek başarıyla yüklendi.</p><div class="modal-note">Toplam kayıt: ${records().length}</div>`, buttons:[{text:'Tamam', value:true, cls:'primary'}]});
      }catch(err){
        modal({title:'Yedek okunamadı', type:'danger', icon:'!', html:`<p>Seçilen dosya geri yüklenemedi.</p><div class="modal-note">${esc(err && err.message ? err.message : 'Dosya hatalı veya uyumsuz.')}</div>`});
      }
    }, true);

    document.addEventListener('change', updateExportScopeInfo, true);
    document.addEventListener('input', updateExportScopeInfo, true);
  }

  function removeSameBarcodeAndQuantity(){
    const s = settings();
    s.sameBarcodeMode = false;
    s.quantity = '1';
    saveSettings();
    const q = $('quantityInput'); if(q) q.value = '1';
  }

  function boot(){
    removeSameBarcodeAndQuantity();
    bindIntercepts();
    updateNetwork();
    updateExportScopeInfo();
    startupChecks();
    window.addEventListener('online', () => { updateNetwork(); setStep('offline','ok','Online / offline çalışma hazır'); });
    window.addEventListener('offline', () => { updateNetwork(); setStep('offline','ok','Offline mod hazır'); });
    setTimeout(updateExportScopeInfo, 400);
    setTimeout(updateExportScopeInfo, 1200);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();

  [600,1600,3200].forEach(ms => setTimeout(updateExportScopeInfo, ms));
  setInterval(updateExportScopeInfo, 1200);

  window.mesahaV304 = {modal, backupZip, clearCacheFlow, forceUpdateFlow, updateExportScopeInfo};
})();


/* v311: Boy solda / Çap sağda, klavye kapanmasın, seçili filtre BEYAN toplamı, düzenlemede barkod devamı */
(function(){
  'use strict';

  const $ = id => document.getElementById(id);
  const norm = v => String(v ?? '').trim().replace(/\s+/g,' ');
  const num = v => { const n = Number(String(v ?? '').replace(',','.')); return Number.isFinite(n) ? n : 0; };
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmt = (n,d=3) => Number(n||0).toLocaleString('tr-TR',{maximumFractionDigits:d});
  const appState = () => window.state || null;
  const records = () => (appState() && Array.isArray(appState().records)) ? appState().records : [];
  const settings = () => (appState() && appState().settings) ? appState().settings : {};
  const productInfo = key => {
    if(typeof window.productInfo === 'function') return window.productInfo(key);
    const map = {'Tomruk':{label:'Tomruk',cls:'tomruk'},'Maden Direk':{label:'Maden',cls:'maden'},'Kağıtlık':{label:'Kağıtlık',cls:'kagit'},'Sanayi Odunu':{label:'Sanayi',cls:'sanayi'},'Tel Direk':{label:'Tel',cls:'tel'}};
    return map[key] || map['Tomruk'];
  };
  function volumeOf(r){
    const d=num(r.diameter), l=num(r.length), q=num(r.quantity||1);
    if(!d || !l || !q) return 0;
    return Math.PI*Math.pow(d/100,2)/4*l*q;
  }
  function totals(list){
    return (list||[]).reduce((a,r)=>{ a.count += Number(r.quantity||1); a.m3 += volumeOf(r); return a; }, {count:0,m3:0});
  }
  function filtered(){
    if(window.mesahaV303 && typeof window.mesahaV303.filtered === 'function'){
      try{return window.mesahaV303.filtered() || [];}catch{}
    }
    const s = settings();
    return records().filter(r => (!s.treeFilter || s.treeFilter==='Tümü' || r.treeType===s.treeFilter) && (!s.cutterFilter || s.cutterFilter==='Tümü' || (s.cutterFilter==='Kesimci kaydı yok' ? !r.cutter : r.cutter===s.cutterFilter)));
  }
  function isFiltered(list){
    const s = settings();
    const q = norm(($('recordSearch') && $('recordSearch').value) || '');
    return Boolean(q || (s.treeFilter && s.treeFilter !== 'Tümü') || (s.cutterFilter && s.cutterFilter !== 'Tümü') || (list.length !== records().length));
  }

  function selectInput(el){
    if(!el) return;
    try{
      el.focus({preventScroll:true});
      setTimeout(()=>{ try{ el.select(); }catch{} }, 0);
    }catch{
      try{ el.focus(); el.select(); }catch{}
    }
  }

  function bindSelectOnTap(){
    ['lengthInput'].forEach(id => {
      const el = $(id);
      if(!el || el.__v311Select) return;
      el.__v311Select = true;
      ['focus','click','pointerup','touchend'].forEach(evt => {
        el.addEventListener(evt, () => selectInput(el), {passive:true});
      });
    });
  }

  function focusDiameter(){
    const d = $('diameterInput');
    if(!d) return;
    try{
      d.focus({preventScroll:true});
      const len = String(d.value || '').length;
      try{ d.setSelectionRange(len, len); }catch{}
    }catch{
      try{ d.focus(); }catch{}
    }
  }

  function bindSaveKeepKeyboard(){
    const btn = $('saveBtn');
    if(!btn || btn.__v311KeepKeyboard) return;
    btn.__v311KeepKeyboard = true;

    let handled = false;
    function run(ev){
      if(ev){
        ev.preventDefault();
        ev.stopPropagation();
        if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      }
      if(handled) return;
      handled = true;
      try{
        if(typeof window.saveEntry === 'function') window.saveEntry();
        else if(typeof saveEntry === 'function') saveEntry();
      }catch(e){ console.error(e); }
      setTimeout(() => {
        focusDiameter();
        updateBeyanTotals();
      }, 80);
      setTimeout(() => { handled = false; }, 550);
    }

    btn.addEventListener('pointerdown', run, true);
    btn.addEventListener('touchstart', run, true);
    btn.addEventListener('click', function(ev){
      if(handled){
        ev.preventDefault();
        ev.stopPropagation();
        if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      }
    }, true);
  }

  function updateBeyanTotals(){
    const list = filtered();
    const t = totals(list);
    const total = records().length;
    const filteredMode = isFiltered(list);

    const countPill = $('recordCountPill');
    if(countPill) countPill.textContent = filteredMode ? `${list.length} / ${total} kayıt` : `${total} kayıt`;
    const m3 = $('recTotalM3');
    if(m3) m3.textContent = `${fmt(t.m3,3)} m³`;
    const count = $('recTotalCount');
    if(count) count.textContent = t.count.toLocaleString('tr-TR');

    const scope = $('exportScopeInfo');
    if(scope){
      const selected = window.mesahaV303 && typeof window.mesahaV303.selected === 'function' ? window.mesahaV303.selected() : [];
      if(selected && selected.length) scope.textContent = `İndirilecek: Seçili kayıtlar (${selected.length})`;
      else if(filteredMode) scope.textContent = `İndirilecek: Filtrelenen kayıtlar (${list.length})`;
      else scope.textContent = `İndirilecek: Tüm kayıtlar (${total})`;
    }

    const productTotals = $('productTotals');
    if(productTotals){
      const order = [
        ['Tomruk','Tomruk','tomruk'],
        ['Maden Direk','Maden','maden'],
        ['Kağıtlık','Kağıtlık','kagit'],
        ['Sanayi Odunu','Sanayi','sanayi'],
        ['Tel Direk','Tel','tel']
      ];
      productTotals.innerHTML = order.map(([key,label,cls]) => {
        const part = list.filter(r => r.productType === key);
        const pt = totals(part);
        return `<div class="prod-total product-${cls}"><small>${esc(label)}</small><b>${fmt(pt.m3,3)} m³</b><small>${pt.count} adet</small></div>`;
      }).join('');
    }
  }

  function patchOpenEntryRuntime(){
    if(window.__v311OpenEntryPatched || typeof window.openEntry !== 'function') return;
    window.__v311OpenEntryPatched = true;
    const old = window.openEntry;
    window.openEntry = function(record){
      if(record && appState()){
        appState().editingReturnBarcode = settings().barcode || (($('barcodeInput') && $('barcodeInput').value) || '');
      }
      const res = old.apply(this, arguments);
      setTimeout(focusDiameter, 100);
      return res;
    };
    try{ openEntry = window.openEntry; }catch{}
  }

  function boot(){
    bindSelectOnTap();
    bindSaveKeepKeyboard();
    patchOpenEntryRuntime();
    updateBeyanTotals();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();

  document.addEventListener('click', () => setTimeout(updateBeyanTotals, 80), true);
  document.addEventListener('input', () => setTimeout(updateBeyanTotals, 80), true);
  document.addEventListener('change', () => setTimeout(updateBeyanTotals, 80), true);
  [100,400,1000,2200].forEach(ms => setTimeout(boot, ms));
  setInterval(updateBeyanTotals, 900);

  window.mesahaV305 = {focusDiameter, updateBeyanTotals};
})();


/* v311: mobil oturum + ölçüm kısayollarında klavye kapanmasın */
(function(){
  'use strict';

  const $ = id => document.getElementById(id);

  function focusNoSelectV309(el){
    if(!el) return;
    try{
      el.focus({preventScroll:true});
      const len = String(el.value || '').length;
      try{ el.setSelectionRange(len, len); }catch{}
    }catch{ try{ el.focus(); }catch{} }
  }

  function focusAndSelect(el){
    if(!el) return;
    try{
      el.focus({preventScroll:true});
      setTimeout(()=>{ try{ el.select(); }catch{} }, 0);
    }catch{
      try{ el.focus(); el.select(); }catch{}
    }
  }

  function bindMeasureButtons(){
    const diameter = $('diameterInput');
    const length = $('lengthInput');

    document.querySelectorAll('#diameterChips button,[data-dia]').forEach(btn => {
      if(btn.__v311Measure) return;
      btn.__v311Measure = true;
      const run = ev => {
        if(ev){
          ev.preventDefault();
          ev.stopPropagation();
          if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        }
        if(diameter){
          diameter.value = btn.dataset.dia || btn.textContent.trim();
          try{ if(typeof entryInputChanged === 'function') entryInputChanged(); }catch{}
          focusNoSelectV309(diameter);
          setTimeout(()=>focusNoSelectV309(diameter), 80);
        }
      };
      btn.addEventListener('pointerdown', run, true);
      btn.addEventListener('touchstart', run, true);
      btn.addEventListener('click', run, true);
    });

    document.querySelectorAll('#lengthChips button,[data-len]').forEach(btn => {
      if(btn.__v311Measure) return;
      btn.__v311Measure = true;
      const run = ev => {
        if(ev){
          ev.preventDefault();
          ev.stopPropagation();
          if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        }
        if(length){
          length.value = btn.dataset.len || btn.textContent.trim();
          try{ if(typeof entryInputChanged === 'function') entryInputChanged(); }catch{}
          focusAndSelect(length);
          setTimeout(()=>focusAndSelect(length), 80);
        }
      };
      btn.addEventListener('pointerdown', run, true);
      btn.addEventListener('touchstart', run, true);
      btn.addEventListener('click', run, true);
    });

    ['diameterInput','lengthInput'].forEach(id => {
      const el = $(id);
      if(!el || el.__v311Tap) return;
      el.__v311Tap = true;
      el.addEventListener('focus', () => focusAndSelect(el), true);
      el.addEventListener('click', () => focusAndSelect(el), true);
    });
  }

  function stabilizeViewport(){
    document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px');
    document.body.classList.toggle('keyboard-open-v311', window.visualViewport ? window.visualViewport.height < window.innerHeight - 120 : false);
  }

  function boot(){
    bindMeasureButtons();
    stabilizeViewport();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();

  document.addEventListener('click', () => setTimeout(bindMeasureButtons, 50), true);
  document.addEventListener('focusin', () => setTimeout(bindMeasureButtons, 50), true);
  [100,400,1000,2200,4200].forEach(ms => setTimeout(boot, ms));
  setInterval(bindMeasureButtons, 900);

  window.addEventListener('resize', stabilizeViewport);
  if(window.visualViewport) window.visualViewport.addEventListener('resize', stabilizeViewport);

  window.mesahaV306 = {bindMeasureButtons, focusAndSelect};
})();


/* v311: iOS klavyede Kaydet butonunu klavye üstünde tut */
(function(){
  'use strict';

  function isEntryOpen(){
    const entry = document.getElementById('entryView');
    return entry && entry.classList.contains('active');
  }

  function activeIsMeasureInput(){
    const a = document.activeElement;
    return !!(a && ['diameterInput','lengthInput','barcodeInput'].includes(a.id));
  }

  function keyboardInset(){
    if(window.visualViewport){
      const vv = window.visualViewport;
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      return Math.round(inset);
    }
    return 0;
  }

  function updateKeyboardState(){
    const inset = keyboardInset();
    const open = isEntryOpen() && activeIsMeasureInput() && (inset > 80 || document.body.classList.contains('keyboard-open-v311'));
    document.body.classList.toggle('keyboard-open-v311', open);
    document.documentElement.style.setProperty('--keyboard-bottom-v311', open ? inset + 'px' : '0px');

    const btn = document.getElementById('saveBtn');
    if(btn && open){
      btn.setAttribute('data-keyboard-sticky','1');
    }else if(btn){
      btn.removeAttribute('data-keyboard-sticky');
    }
  }

  function bind(){
    ['diameterInput','lengthInput','barcodeInput'].forEach(id => {
      const el = document.getElementById(id);
      if(!el || el.__v311Keyboard) return;
      el.__v311Keyboard = true;
      el.addEventListener('focus', () => setTimeout(updateKeyboardState, 80), true);
      el.addEventListener('blur', () => setTimeout(updateKeyboardState, 220), true);
      el.addEventListener('input', () => setTimeout(updateKeyboardState, 40), true);
      el.addEventListener('click', () => setTimeout(updateKeyboardState, 40), true);
    });

    const save = document.getElementById('saveBtn');
    if(save && !save.__v311Keep){
      save.__v311Keep = true;
      save.addEventListener('pointerdown', () => setTimeout(updateKeyboardState, 20), true);
      save.addEventListener('touchstart', () => setTimeout(updateKeyboardState, 20), true);
      save.addEventListener('click', () => setTimeout(updateKeyboardState, 120), true);
    }
  }

  function boot(){
    bind();
    updateKeyboardState();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();

  window.addEventListener('resize', updateKeyboardState);
  window.addEventListener('orientationchange', () => setTimeout(updateKeyboardState, 250));
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', updateKeyboardState);
    window.visualViewport.addEventListener('scroll', updateKeyboardState);
  }

  document.addEventListener('focusin', () => setTimeout(boot, 80), true);
  document.addEventListener('click', () => setTimeout(boot, 80), true);
  [100,400,1000,2200].forEach(ms => setTimeout(boot, ms));

  window.mesahaV307 = {updateKeyboardState};
})();


/* v311: detaylı kayıt toast + bakım güncelleme bildirimi */
(function(){
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const productLabel = key => {
    const map = {'Tomruk':'Tomruk','Maden Direk':'Maden','Kağıtlık':'Kağıtlık','Sanayi Odunu':'Sanayi','Tel Direk':'Tel'};
    return map[key] || key || '';
  };

  function ensureSaveToast(){
    let el = $('saveFloatToastV310');
    if(el) return el;
    el = document.createElement('div');
    el.id = 'saveFloatToastV310';
    el.className = 'save-float-toast-v311';
    el.innerHTML = '<span class="ico">✓</span><span class="txt"><b></b><small></small></span>';
    document.body.appendChild(el);
    return el;
  }

  window.mesahaV310SavedToast = function(rec, wasEditing){
    const el = ensureSaveToast();
    const title = `${rec.barcode || ''} ${rec.diameter || ''}Ç ${rec.length || ''}B ${productLabel(rec.productType)}`.trim();
    const action = wasEditing ? 'Güncellendi' : 'Eklendi';
    const b = el.querySelector('b');
    const s = el.querySelector('small');
    if(b) b.textContent = title;
    if(s) s.textContent = action;
    el.classList.add('show');
    clearTimeout(el.__timer);
    el.__timer = setTimeout(() => el.classList.remove('show'), 2300);
  };

  async function remoteVersion(){
    const res = await fetch('./version.json?check=' + Date.now(), {cache:'no-store', headers:{'Cache-Control':'no-cache'}});
    if(!res.ok) throw new Error('version.json okunamadı');
    return await res.json();
  }

  function versionDifferent(remote){
    const current = window.MESAHA_VERSION || {};
    if(!remote || !remote.version || !current.version) return false;
    return String(remote.version) !== String(current.version);
  }

  function setUpdateStatus(text, cls){
    const el = $('updateStatusBox');
    if(!el) return;
    el.classList.remove('update-available','update-ok','update-offline');
    if(cls) el.classList.add(cls);
    el.textContent = text;
  }

  async function checkUpdateStatus(){
    if(!navigator.onLine){
      setUpdateStatus('Offline: sürüm kontrolü internet gelince yapılır.', 'update-offline');
      return;
    }
    try{
      const remote = await remoteVersion();
      const label = remote.visibleVersion || remote.app || remote.version || 'Yeni sürüm';
      if(versionDifferent(remote)){
        setUpdateStatus('Yeni sürüm hazır: ' + label + ' — Güncelle butonuna bas.', 'update-available');
      }else{
        setUpdateStatus('Uygulama güncel: ' + (window.MESAHA_VERSION?.visibleVersion || label), 'update-ok');
      }
    }catch{
      setUpdateStatus('Sürüm kontrolü yapılamadı. İnternet varsa tekrar deneyin.', 'update-offline');
    }
  }

  function boot(){
    checkUpdateStatus();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();

  window.addEventListener('online', checkUpdateStatus);
  window.addEventListener('offline', checkUpdateStatus);
  setTimeout(checkUpdateStatus, 1500);
  setInterval(checkUpdateStatus, 60000);

  window.mesahaV310 = {checkUpdateStatus, savedToast:window.mesahaV310SavedToast};
})();


/* v311: kayıt bildirimi klavye üstüne + boy son değer + ölçüm butonları üstte */
(function(){
  'use strict';

  function keyboardInset(){
    if(window.visualViewport){
      const vv = window.visualViewport;
      return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
    }
    return 0;
  }

  function productLabel(key){
    const map = {'Tomruk':'Tomruk','Maden Direk':'Maden','Kağıtlık':'Kağıtlık','Sanayi Odunu':'Sanayi','Tel Direk':'Tel'};
    return map[key] || key || '';
  }

  function ensureToast(){
    let el = document.getElementById('saveFloatToastV310');
    if(el) return el;
    el = document.createElement('div');
    el.id = 'saveFloatToastV310';
    el.className = 'save-float-toast-v311';
    el.innerHTML = '<span class="ico">✓</span><span class="txt"><b></b><small></small></span>';
    document.body.appendChild(el);
    return el;
  }

  window.mesahaV310SavedToast = function(rec, wasEditing){
    try{ if(window.mesahaV307 && typeof window.mesahaV307.updateKeyboardState === 'function') window.mesahaV307.updateKeyboardState(); }catch{}
    const el = ensureToast();
    const title = `${rec.barcode || ''} ${rec.diameter || ''}Ç ${rec.length || ''}B ${productLabel(rec.productType)}`.trim();
    const action = wasEditing ? 'Güncellendi' : 'Eklendi';
    const b = el.querySelector('b');
    const s = el.querySelector('small');
    if(b) b.textContent = title;
    if(s) s.textContent = action;

    const inset = keyboardInset();
    const active = document.activeElement && ['diameterInput','lengthInput','barcodeInput'].includes(document.activeElement.id);
    const bottom = (inset > 80 || active) ? Math.max(inset + 16, 118) : 92;
    el.style.bottom = `calc(${bottom}px + env(safe-area-inset-bottom,0px))`;
    el.style.left = '10px';
    el.style.right = 'auto';
    el.style.width = (window.innerWidth <= 430) ? 'calc(100vw - 150px)' : 'min(52vw,260px)';

    el.classList.add('show');
    clearTimeout(el.__timer);
    el.__timer = setTimeout(() => el.classList.remove('show'), 2400);
  };

  function boot(){
    const len = document.getElementById('lengthInput');
    if(len && window.state && window.state.settings && window.state.settings.length){
      len.value = window.state.settings.length;
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  [200,700,1500].forEach(ms => setTimeout(boot, ms));
})();

/* v313: kayıt alındı toast görünürlüğü + güncel mesaha tarihi */
(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const productLabel = key => ({'Tomruk':'Tomruk','Maden Direk':'Maden','Kağıtlık':'Kağıtlık','Sanayi Odunu':'Sanayi','Tel Direk':'Tel'}[key] || key || '');
  function todayISO(){ const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0,10); }
  function keyboardInset(){
    try{
      if(window.visualViewport){
        const vv = window.visualViewport;
        return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      }
    }catch{}
    return 0;
  }
  function ensureToast(){
    let el = $('saveFloatToastV310') || $('saveFloatToastV313');
    if(!el){
      el = document.createElement('div');
      el.id = 'saveFloatToastV310';
      document.body.appendChild(el);
    }
    el.className = 'save-float-toast-v310 save-float-toast-v313';
    if(!el.querySelector('.txt')) el.innerHTML = '<span class="ico">✓</span><span class="txt"><b></b><small></small></span>';
    return el;
  }
  function placeToast(el){
    const inset = keyboardInset();
    const activeId = document.activeElement && document.activeElement.id;
    const entryActive = document.body.classList.contains('entry-open') || ['diameterInput','lengthInput','barcodeInput'].includes(activeId);
    const bottom = entryActive ? Math.max(inset + 14, 118) : 104;
    document.documentElement.style.setProperty('--save-toast-bottom-v313', bottom + 'px');
    el.style.setProperty('bottom', `calc(${bottom}px + env(safe-area-inset-bottom,0px))`, 'important');
    el.style.setProperty('top', 'auto', 'important');
    el.style.setProperty('left', window.innerWidth <= 430 ? '8px' : '10px', 'important');
    el.style.setProperty('right', 'auto', 'important');
  }
  window.mesahaV310SavedToast = function(rec, wasEditing){
    const el = ensureToast();
    const title = `${rec && rec.barcode || ''} ${rec && rec.diameter || ''}Ç ${rec && rec.length || ''}B ${productLabel(rec && rec.productType)}`.trim();
    const b = el.querySelector('b');
    const s = el.querySelector('small');
    if(b) b.textContent = title || 'Kayıt';
    if(s) s.textContent = wasEditing ? 'Güncellendi' : 'Eklendi';
    placeToast(el);
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(el.__timer);
    el.__timer = setTimeout(() => el.classList.remove('show'), 2600);
  };
  function applyToday(){
    const today = todayISO();
    try{
      if(window.state && window.state.settings){
        window.state.settings.mesahaDate = today;
        if(typeof window.saveSettings === 'function') window.saveSettings();
      }
    }catch{}
    const input = $('mesahaDate');
    if(input && input.value !== today) input.value = today;
  }
  function boot(){
    ensureToast();
    applyToday();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  [120,450,1000,1800].forEach(ms => setTimeout(boot, ms));
  window.addEventListener('resize', () => { const el=$('saveFloatToastV310'); if(el) placeToast(el); }, {passive:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', () => { const el=$('saveFloatToastV310'); if(el) placeToast(el); }, {passive:true});
    window.visualViewport.addEventListener('scroll', () => { const el=$('saveFloatToastV310'); if(el) placeToast(el); }, {passive:true});
  }
})();

/* v315: ürün/çap uyarıları aynı kayan barda + BEYAN üst özeti yazdır */
(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  function keyboardInset(){
    try{
      if(window.visualViewport){
        const vv = window.visualViewport;
        return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      }
    }catch{}
    return 0;
  }
  function ensureFloatToast(){
    let el = $('saveFloatToastV310') || $('saveFloatToastV313') || $('saveFloatToastV314');
    if(!el){
      el = document.createElement('div');
      el.id = 'saveFloatToastV310';
      document.body.appendChild(el);
    }
    el.className = 'save-float-toast-v310 save-float-toast-v313 save-float-toast-v315';
    if(!el.querySelector('.txt')) el.innerHTML = '<span class="ico">✓</span><span class="txt"><b></b><small></small></span>';
    return el;
  }
  function placeFloatToast(el){
    const inset = keyboardInset();
    const activeId = document.activeElement && document.activeElement.id;
    const entryActive = document.body.classList.contains('entry-open') || ['diameterInput','lengthInput','barcodeInput'].includes(activeId);
    const bottom = entryActive ? Math.max(inset + 14, 118) : 104;
    document.documentElement.style.setProperty('--save-toast-bottom-v313', bottom + 'px');
    el.style.setProperty('bottom', `calc(${bottom}px + env(safe-area-inset-bottom,0px))`, 'important');
    el.style.setProperty('top', 'auto', 'important');
    el.style.setProperty('left', window.innerWidth <= 430 ? '8px' : '10px', 'important');
    el.style.setProperty('right', 'auto', 'important');
  }
  function showFloatToast(title, detail, type){
    const el = ensureFloatToast();
    const cleanTitle = String(title || '').trim();
    const cleanDetail = String(detail || '').trim();
    const kind = type || 'warning';
    el.className = 'save-float-toast-v310 save-float-toast-v313 save-float-toast-v315 ' + kind;
    const icon = el.querySelector('.ico');
    const b = el.querySelector('b');
    const s = el.querySelector('small');
    if(icon) icon.textContent = kind === 'success' ? '✓' : (kind === 'error' ? '!' : '⚠');
    if(b) b.textContent = cleanTitle || 'Uyarı';
    if(s) s.textContent = cleanDetail || 'Kontrol et';
    placeFloatToast(el);
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(el.__timer);
    el.__timer = setTimeout(() => el.classList.remove('show'), kind === 'success' ? 2600 : 3200);
  }
  function productLabel(key){
    return ({'Tomruk':'Tomruk','Maden Direk':'Maden','Kağıtlık':'Kağıtlık','Sanayi Odunu':'Sanayi','Tel Direk':'Tel'}[key] || key || '');
  }
  function patchToasts(){
    const legacy = $('toast');
    if(legacy) legacy.classList.remove('show');
    window.mesahaFloatToastV314 = showFloatToast;
    window.mesahaV310SavedToast = function(rec, wasEditing){
      const title = `${rec && rec.barcode || ''} ${rec && rec.diameter || ''}Ç ${rec && rec.length || ''}B ${productLabel(rec && rec.productType)}`.trim();
      showFloatToast(title || 'Kayıt', wasEditing ? 'Güncellendi' : 'Eklendi', 'success');
    };
    const unifiedToast = function(message){
      const msg = String(message || '').trim();
      if(!msg) return;
      showFloatToast(msg, 'Kontrol et', /hata|olmadı|okunamadı|yüklenmedi|giriniz|küçük|büyük|arasında|kayıtlı/i.test(msg) ? 'warning' : 'warning');
    };
    window.toast = unifiedToast;
    try{ toast = unifiedToast; }catch{}
  }
  function text(id, fallback=''){
    const el = $(id);
    return el ? (el.textContent || el.value || fallback).trim() : fallback;
  }
  function inputValue(id, fallback=''){
    const el = $(id);
    return el ? String(el.value || fallback).trim() : fallback;
  }
  function todayTR(){
    const d = new Date();
    return d.toLocaleDateString('tr-TR');
  }
  function productPrintBoxes(){
    const cards = Array.from(document.querySelectorAll('#productTotals .prod-total'));
    if(!cards.length) return '<div class="print-beyan-box-v315"><small>Ürün toplamı</small><b>Kayıt yok</b></div>';
    return cards.map(card => {
      const lines = Array.from(card.querySelectorAll('small,b')).map(x => (x.textContent || '').trim()).filter(Boolean);
      const label = lines[0] || 'Ürün';
      const m3 = lines[1] || '0 m³';
      const adet = lines[2] || '0 adet';
      return `<div class="print-beyan-box-v315"><small>${esc(label)}</small><b>${esc(m3)}</b><small>${esc(adet)}</small></div>`;
    }).join('');
  }
  function buildPrintPage(){
    try{ window.mesahaV305 && window.mesahaV305.updateBeyanTotals && window.mesahaV305.updateBeyanTotals(); }catch{}
    let holder = $('printBeyanPageV314');
    if(!holder){
      holder = document.createElement('section');
      holder.id = 'printBeyanPageV314';
      holder.className = 'print-beyan-page-v315';
      document.body.appendChild(holder);
    }
    const tree = text('treeFilterText','Seçili: Tümü').replace(/^Seçili:\s*/,'');
    const cutter = text('cutterFilterText','Seçili: Tümü').replace(/^Seçili:\s*/,'');
    holder.innerHTML = `
      <div class="print-beyan-head-v315">
        <img src="./assets/mesaha_logo.png" alt="Mesaha İO">
        <div><h1>BEYAN ÖZETİ</h1><small>Mesaha İO • ${esc(todayTR())}</small></div>
      </div>
      <div class="print-beyan-meta-v315">
        <div class="print-beyan-box-v315"><small>Toplam m³</small><b>${esc(text('recTotalM3','0 m³'))}</b></div>
        <div class="print-beyan-box-v315"><small>Toplam Adet</small><b>${esc(text('recTotalCount','0'))}</b></div>
        <div class="print-beyan-box-v315"><small>Kayıt</small><b>${esc(text('recordCountPill','0 kayıt'))}</b></div>
        <div class="print-beyan-box-v315"><small>Mesaha Tarihi</small><b>${esc(inputValue('mesahaDate','-'))}</b></div>
      </div>
      <div class="print-beyan-meta-v315">
        <div class="print-beyan-box-v315"><small>Ağaç filtresi</small><b>${esc(tree || 'Tümü')}</b></div>
        <div class="print-beyan-box-v315"><small>Kesimci filtresi</small><b>${esc(cutter || 'Tümü')}</b></div>
        <div class="print-beyan-box-v315"><small>Bölme No</small><b>${esc(inputValue('bolmeNo','-') || '-')}</b></div>
        <div class="print-beyan-box-v315"><small>Şeflik</small><b>${esc(inputValue('seflik','-') || '-')}</b></div>
      </div>
      <div class="print-beyan-products-v315">${productPrintBoxes()}</div>
      <div class="print-scope-v315">${esc(text('exportScopeInfo','İndirilecek: Tüm kayıtlar'))}</div>`;
    return holder;
  }
  function printBeyanOnly(){
    buildPrintPage();
    document.body.classList.add('print-beyan-v315');
    const cleanup = () => {
      document.body.classList.remove('print-beyan-v315');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      try{ window.print(); }
      finally{ setTimeout(cleanup, 1200); }
    }, 60);
  }
  function bindPrint(){
    const btn = $('printBtn');
    if(!btn || btn.__v315PrintBound) return;
    btn.__v315PrintBound = true;
    btn.addEventListener('click', ev => {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      printBeyanOnly();
    }, true);
  }
  function boot(){
    ensureFloatToast();
    patchToasts();
    bindPrint();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  [100,350,900,1800,3000].forEach(ms => setTimeout(boot, ms));
  window.addEventListener('resize', () => { const el=$('saveFloatToastV310'); if(el) placeFloatToast(el); }, {passive:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', () => { const el=$('saveFloatToastV310'); if(el) placeFloatToast(el); }, {passive:true});
    window.visualViewport.addEventListener('scroll', () => { const el=$('saveFloatToastV310'); if(el) placeFloatToast(el); }, {passive:true});
  }
})();

