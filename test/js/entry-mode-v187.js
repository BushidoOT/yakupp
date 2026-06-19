(function(){
  'use strict';
  var TAG = 'v187-entry-mode';
  var SAVE_BOUND = false;
  var layoutDone = false;
  var timer = null;
  var TREES = ['Karaçam','Sarıçam','Sedir','Göknar','Kızılçam'];
  function byId(id){ return document.getElementById(id); }
  function safe(fn, fallback){ try{ return fn(); }catch(e){ try{ console.warn('[Mesaha İO '+TAG+']', e); }catch(_){} return fallback; } }
  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]; }); }
  function norm(v){ return String(v == null ? '' : v).trim().replace(/\s+/g,' '); }
  function lower(v){ return norm(v).toLocaleLowerCase('tr-TR'); }
  function toast(msg){ safe(function(){ if(typeof showSuccessToast === 'function') showSuccessToast(msg); else if(typeof showToast === 'function') showToast(msg); }); }
  function errorToast(msg){ safe(function(){ if(typeof showErrorToast === 'function') showErrorToast(msg); else if(typeof showToast === 'function') showToast(msg); }); }
  function schedule(fn, ms){ clearTimeout(timer); timer = setTimeout(fn, ms || 80); }
  function settings(){ return safe(function(){ return state.settings || (state.settings = {}); }, {}); }
  function saveSettingsLite(){ safe(function(){ if(typeof saveSettings === 'function') saveSettings(); }); }
  function currentProduct(){ var active = document.querySelector('#cleanProductGridV111 .clean-product-v111.active'); return (active && active.getAttribute('data-clean-product')) || (byId('productType') && byId('productType').value) || 'Tomruk'; }
  function setProduct(type){ safe(function(){ if(window.mesahaUltraEntryV186 && typeof window.mesahaUltraEntryV186.setProduct === 'function') window.mesahaUltraEntryV186.setProduct(type, true); else if(typeof setProductType === 'function') setProductType(type, true); else if(byId('productType')) byId('productType').value = type; }); }
  function activeTree(){ return norm((byId('treeType') && byId('treeType').value) || settings().lastTreeType || 'Karaçam') || 'Karaçam'; }
  function setTree(name){
    name = norm(name) || 'Karaçam';
    var input = byId('treeType'); if(input) input.value = name;
    document.querySelectorAll('input[name="treeTypeRadio"]').forEach(function(r){ r.checked = lower(r.value) === lower(name); });
    var current = byId('treeTypeCurrent'); if(current) current.textContent = name;
    safe(function(){ settings().lastTreeType = name; });
    saveSettingsLite();
    renderTreeChips();
    syncAutoInfo();
  }
  function cutterList(){
    var out = [], seen = Object.create(null);
    function add(n){ n = norm(n); var k = lower(n); if(n && !seen[k]){ seen[k] = true; out.push(n); } }
    safe(function(){ (Array.isArray(settings().kesimcilerV158) ? settings().kesimcilerV158 : []).forEach(add); });
    var active = activeCutter(); if(active) add(active);
    out.sort(function(a,b){ return a.localeCompare(b, 'tr-TR'); });
    safe(function(){ settings().kesimcilerV158 = out.slice(); });
    return out;
  }
  function activeCutter(){ return norm(safe(function(){ if(typeof window.getActiveKesimciNameV163 === 'function') return window.getActiveKesimciNameV163(); return settings().activeKesimciV158 || ''; }, '')); }
  function setActiveCutter(name){
    name = norm(name);
    safe(function(){ settings().activeKesimciV158 = name; });
    var sel = byId('cutterSelectV158'); if(sel) sel.value = name;
    saveSettingsLite();
    renderCutterChips();
    syncAutoInfo();
  }
  function addCutter(){
    var name = window.prompt('Kesimci ismini yazınız:');
    if(name === null) return;
    name = norm(name);
    if(!name){ errorToast('Kesimci ismi boş olamaz.'); return; }
    var list = cutterList();
    if(!list.some(function(x){ return lower(x) === lower(name); })) list.push(name);
    list.sort(function(a,b){ return a.localeCompare(b,'tr-TR'); });
    safe(function(){ settings().kesimcilerV158 = list; settings().activeKesimciV158 = name; });
    saveSettingsLite();
    renderCutterChips();
    toast('Kesimci eklendi: ' + name);
  }
  function syncAutoInfo(){
    var auto = byId('cleanAutoInfoV111');
    if(!auto) return;
    var barcode = (byId('cleanBarcodeV187') && byId('cleanBarcodeV187').value) || (byId('barcode') && byId('barcode').value) || '-';
    var tree = activeTree();
    var cutter = activeCutter() || 'Kesimci seçilmedi';
    var product = currentProduct();
    auto.innerHTML = '<b>Kayıt:</b> ' + esc(product) + ' • ' + esc(tree) + ' • ' + esc(cutter) + ' • Barkod ' + esc(barcode);
  }
  function renderTreeChips(){
    var wrap = byId('cleanTreeGridV187'); if(!wrap) return;
    var active = activeTree();
    wrap.innerHTML = TREES.map(function(t){ return '<button type="button" class="clean-tree-chip-v187 '+(lower(t)===lower(active)?'active':'')+'" data-clean-tree-v187="'+esc(t)+'">'+esc(t)+'</button>'; }).join('');
  }
  function renderCutterChips(){
    var wrap = byId('cleanCutterGridV187'); if(!wrap) return;
    var active = activeCutter();
    var html = '<button type="button" class="clean-cutter-chip-v187 clean-cutter-none-v187 '+(!active?'active':'')+'" data-clean-cutter-v187="">Kesimci seçilmedi</button>';
    cutterList().forEach(function(n){ html += '<button type="button" class="clean-cutter-chip-v187 '+(lower(n)===lower(active)?'active':'')+'" data-clean-cutter-v187="'+esc(n)+'">'+esc(n)+'</button>'; });
    html += '<button type="button" class="clean-cutter-chip-v187 clean-cutter-add-v187" id="cleanCutterAddV187">+ Kesimci Ekle</button>';
    wrap.innerHTML = html;
  }
  function ensureCleanLayout(){
    var card = document.querySelector('#cleanSimpleOverlayV111 .clean-simple-card-v111');
    var grid = byId('cleanProductGridV111');
    var measure = card && card.querySelector('.clean-measure-grid-v111');
    var save = byId('cleanSaveV111');
    var recent = card && card.querySelector('.clean-recent-area-v111');
    if(!card || !grid || !measure || !save) return;
    document.body.classList.add('mesaha-v187-entry-only');
    var headP = card.querySelector('.clean-simple-head-v111 p');
    if(headP) headP.textContent = 'Kayıt girişi artık sadece bu ekrandan yapılır.';

    var top = byId('cleanTopFieldsV187');
    if(!top){
      top = document.createElement('div');
      top.id = 'cleanTopFieldsV187';
      top.className = 'clean-top-fields-v187';
      top.innerHTML = '<div class="clean-block-v187"><label for="cleanBarcodeV187">Barkod No</label><input id="cleanBarcodeV187" type="text" placeholder="A17265597" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="next" /></div>' +
        '<div class="clean-block-v187"><span class="clean-tree-v187-title">Ağaç Türü</span><div id="cleanTreeGridV187" class="clean-tree-grid-v187"></div></div>' +
        '<div class="clean-block-v187"><span class="clean-tree-v187-title">Kesimci</span><div id="cleanCutterGridV187" class="clean-cutter-grid-v187"></div></div>';
      card.insertBefore(top, measure);
      top.addEventListener('input', function(ev){
        if(ev.target && ev.target.id === 'cleanBarcodeV187'){
          var b = byId('barcode'); if(b) b.value = ev.target.value;
          syncAutoInfo();
        }
      }, true);
      top.addEventListener('keydown', function(ev){
        if(ev.target && ev.target.id === 'cleanBarcodeV187' && ev.key === 'Enter'){
          ev.preventDefault(); var dia = byId('cleanDiameterV111'); if(dia){ try{ dia.focus({preventScroll:true}); dia.select(); }catch(_){ dia.focus(); } }
        }
      }, true);
      top.addEventListener('click', function(ev){
        var tree = ev.target && ev.target.closest ? ev.target.closest('[data-clean-tree-v187]') : null;
        if(tree){ ev.preventDefault(); setTree(tree.getAttribute('data-clean-tree-v187') || 'Karaçam'); return; }
        var cutter = ev.target && ev.target.closest ? ev.target.closest('[data-clean-cutter-v187]') : null;
        if(cutter){ ev.preventDefault(); setActiveCutter(cutter.getAttribute('data-clean-cutter-v187') || ''); return; }
        var add = ev.target && ev.target.closest ? ev.target.closest('#cleanCutterAddV187') : null;
        if(add){ ev.preventDefault(); addCutter(); return; }
      }, true);
    }

    // Çap ve Boy, odun türü butonlarının üstünde kalır. Çap ilk alana alındı.
    measure.classList.add('v187-reordered');
    var lenWrap = byId('cleanLengthV111') ? byId('cleanLengthV111').closest('div') : null;
    var diaWrap = byId('cleanDiameterV111') ? byId('cleanDiameterV111').closest('div') : null;
    if(lenWrap && diaWrap && measure.firstElementChild !== diaWrap) measure.insertBefore(diaWrap, lenWrap);

    var productSection = byId('cleanProductSectionV187');
    if(!productSection){
      productSection = document.createElement('div');
      productSection.id = 'cleanProductSectionV187';
      productSection.className = 'clean-block-v187 clean-product-section-v187';
      productSection.innerHTML = '<span class="clean-product-title-v187">Odun Türü</span>';
      productSection.appendChild(grid);
      card.insertBefore(productSection, save);
    }

    var clear = byId('cleanClearV187');
    if(!clear){
      clear = document.createElement('button');
      clear.id = 'cleanClearV187';
      clear.type = 'button';
      clear.className = 'clean-clear-v187';
      clear.textContent = 'Alanları Temizle';
      if(recent && recent.parentNode) recent.parentNode.insertBefore(clear, recent.nextSibling); else card.appendChild(clear);
      clear.addEventListener('click', function(ev){ ev.preventDefault(); clearEntryFields(); });
    }
    layoutDone = true;
  }
  function syncCleanFromMain(){
    ensureCleanLayout();
    var cb = byId('cleanBarcodeV187'); if(cb && byId('barcode')) cb.value = byId('barcode').value || '';
    if(byId('cleanLengthV111') && byId('length') && !byId('cleanLengthV111').value) byId('cleanLengthV111').value = byId('length').value || localStorage.getItem('mesaha_simple_last_length_v1') || '';
    if(byId('cleanDiameterV111') && byId('diameter')) byId('cleanDiameterV111').value = byId('diameter').value || '';
    renderTreeChips(); renderCutterChips(); syncAutoInfo();
  }
  function syncMainFromClean(){
    var cb = byId('cleanBarcodeV187'), b = byId('barcode'); if(cb && b) b.value = cb.value || '';
    var len = byId('cleanLengthV111'), mainLen = byId('length'); if(len && mainLen) mainLen.value = len.value || '';
    var dia = byId('cleanDiameterV111'), mainDia = byId('diameter'); if(dia && mainDia) mainDia.value = String(dia.value || '').replace(/\D/g,'');
    setTree(activeTree());
    setActiveCutter(activeCutter());
  }
  function focusFirstMissing(missing){
    var el = missing === 'barcode' ? byId('cleanBarcodeV187') : (missing === 'boy' ? byId('cleanLengthV111') : byId('cleanDiameterV111'));
    if(el){ try{ el.focus({preventScroll:true}); el.select && el.select(); }catch(_){ try{ el.focus(); }catch(__){} } }
  }
  function saveCleanV187(ev){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }
    syncMainFromClean();
    var barcode = norm(byId('barcode') && byId('barcode').value);
    var boy = norm(byId('length') && byId('length').value);
    var cap = norm(byId('diameter') && byId('diameter').value).replace(/\D/g,'');
    if(byId('diameter')) byId('diameter').value = cap;
    if(byId('cleanDiameterV111')) byId('cleanDiameterV111').value = cap;
    if(!barcode || !boy || !cap){
      errorToast(!barcode ? 'Barkod No giriniz.' : (!boy ? 'Boy bilgisi giriniz.' : 'Çap bilgisi giriniz.'));
      focusFirstMissing(!barcode ? 'barcode' : (!boy ? 'boy' : 'cap'));
      return;
    }
    safe(function(){ localStorage.setItem('mesaha_simple_last_length_v1', boy); });
    setProduct(currentProduct());
    var before = safe(function(){ return Array.isArray(state.records) ? state.records.length : 0; }, 0);
    safe(function(){
      var form = byId('entryForm');
      var submit = byId('submitBtn');
      if(form && form.requestSubmit) form.requestSubmit(submit || undefined);
      else if(form) form.dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
      else if(submit) submit.click();
    });
    setTimeout(function(){
      var after = safe(function(){ return Array.isArray(state.records) ? state.records.length : before; }, before);
      if(after > before){
        if(byId('cleanBarcodeV187') && byId('barcode')) byId('cleanBarcodeV187').value = byId('barcode').value || '';
        if(byId('cleanDiameterV111')) byId('cleanDiameterV111').value = '';
        if(byId('diameter')) byId('diameter').value = '';
        if(byId('cleanLengthV111')) byId('cleanLengthV111').value = boy;
        if(byId('length')) byId('length').value = boy;
      }
      safe(function(){ if(typeof renderRecentBarcodes === 'function') renderRecentBarcodes(); });
      syncCleanFromMain();
      var dia = byId('cleanDiameterV111'); if(dia){ try{ dia.focus({preventScroll:true}); dia.select(); }catch(_){} }
    }, 90);
  }
  function patchCleanSave(){
    var btn = byId('cleanSaveV111');
    if(!btn || btn.__v187Save) return;
    var clone = btn.cloneNode(true);
    clone.__v187Save = true;
    btn.parentNode.replaceChild(clone, btn);
    clone.addEventListener('click', saveCleanV187, true);
    SAVE_BOUND = true;
  }
  function clearEntryFields(){
    ['cleanBarcodeV187','cleanDiameterV111','cleanLengthV111','barcode','diameter','length'].forEach(function(id){ var el = byId(id); if(el) el.value = ''; });
    var q = byId('quantity'); if(q) q.value = '1';
    safe(function(){ if(typeof updateLiveDesi === 'function') updateLiveDesi(); });
    syncAutoInfo();
    var b = byId('cleanBarcodeV187'); if(b){ try{ b.focus({preventScroll:true}); }catch(_){} }
  }
  function moveFileInfoToHome(){
    var home = byId('mesahaHomeV143');
    var details = document.querySelector('details.info-details');
    if(!home || !details || details.__v187Moved) return;
    details.__v187Moved = true;
    details.open = true;
    details.classList.add('file-info-v187');
    var body = details.querySelector('.info-body');
    var card = document.createElement('div');
    card.className = 'file-info-card-v187';
    card.innerHTML = '<div class="file-info-head-v187"><h3>Dosya Bilgileri</h3><span>Açık</span></div>';
    if(body) card.appendChild(body);
    details.appendChild(card);
    var status = home.querySelector('.home-status-v143');
    if(status && status.nextSibling) home.insertBefore(details, status.nextSibling); else home.insertBefore(details, home.firstChild);
  }
  function patchBrand(){
    var h = document.querySelector('.app-brand-v143 .brand-copy-v143 h1');
    var s = document.querySelector('.app-brand-v143 .brand-copy-v143 span');
    if(h){ h.textContent = (window.MESAHA_VERSION && window.MESAHA_VERSION.shortVersion) || 'v2.16'; h.setAttribute('data-version-no-auto','1'); }
    if(s){ s.textContent = (window.MESAHA_VERSION && window.MESAHA_VERSION.version) || 'v187'; s.setAttribute('data-version-no-auto','1'); }
    var splashH = document.querySelector('.mesaha-startup-logo-v178 h2'); if(splashH) splashH.textContent = (window.MESAHA_VERSION && window.MESAHA_VERSION.shortVersion) || 'v2.16';
    var splashP = document.querySelector('.mesaha-startup-logo-v178 p'); if(splashP) splashP.textContent = 'Uygulama hazırlanıyor';
  }
  function patchNavigation(){
    document.body.classList.add('mesaha-v187-entry-only');
    var navEntry = byId('navEntry');
    if(navEntry && !navEntry.__v187){
      navEntry.__v187 = true;
      navEntry.textContent = 'Giriş';
      navEntry.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); openClean(); }, true);
    }
    document.querySelectorAll('[data-home-action-v143="new"],[data-home-action-v143="diameter"],[data-home-simple-v146],#openSimpleV112').forEach(function(btn){
      if(btn.__v187Open) return;
      btn.__v187Open = true;
      btn.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); openClean(); }, true);
    });
    var entryTab = document.querySelector('#flowTabsV111 [data-flow-tab="entry"]'); if(entryTab) entryTab.style.display = 'none';
  }
  function openClean(){
    safe(function(){ if(typeof openCleanSimpleV111 === 'function') openCleanSimpleV111(); else byId('cleanSimpleOverlayV111').classList.add('show'); });
    setTimeout(syncCleanFromMain, 40);
    setTimeout(function(){ var b = byId('cleanBarcodeV187'); if(b && !b.value){ try{ b.focus({preventScroll:true}); }catch(_){} } }, 130);
  }
  function observeOverlay(){
    var overlay = byId('cleanSimpleOverlayV111'); if(!overlay || overlay.__v187Observed) return;
    overlay.__v187Observed = true;
    if(window.MutationObserver){
      new MutationObserver(function(){ if(overlay.classList.contains('show')) setTimeout(syncCleanFromMain, 20); }).observe(overlay, {attributes:true, attributeFilter:['class']});
    }
  }
  function patchGuide(){
    document.querySelectorAll('.guide-card h3').forEach(function(h){ if((h.textContent||'').indexOf('Yeni Kayıt') >= 0) h.textContent = h.textContent.replace('Yeni Kayıt','Giriş Modu'); });
  }
  function boot(){
    patchBrand();
    moveFileInfoToHome();
    ensureCleanLayout();
    patchCleanSave();
    patchNavigation();
    observeOverlay();
    patchGuide();
    if(layoutDone) syncCleanFromMain();
  }
  ready(boot);
  [80,240,700,1400,2600,5200].forEach(function(ms){ setTimeout(boot, ms); });
  setInterval(function(){ patchBrand(); patchNavigation(); patchCleanSave(); }, 1800);
  window.mesahaEntryModeV187 = { boot:boot, open:openClean, clear:clearEntryFields };
})();
