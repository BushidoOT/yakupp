(function(){
  'use strict';
  var TAG = 'v201-entry-mode';
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
    var head = card.querySelector('.clean-simple-head-v111');
    if(head && !byId('cleanHomeBtnV188')){
      var homeBtn = document.createElement('button');
      homeBtn.id = 'cleanHomeBtnV188';
      homeBtn.type = 'button';
      homeBtn.className = 'clean-home-btn-v189';
      homeBtn.textContent = 'Ana Ekran';
      var closeBtn = byId('cleanSimpleCloseV111');
      if(closeBtn && closeBtn.parentNode === head) head.insertBefore(homeBtn, closeBtn); else head.appendChild(homeBtn);
      homeBtn.addEventListener('click', function(ev){ ev.preventDefault(); goHome(); }, true);
    }

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
      card.insertBefore(productSection, measure.nextSibling);
    }

    var clear = byId('cleanClearV187');
    if(!clear){
      clear = document.createElement('button');
      clear.id = 'cleanClearV187';
      clear.type = 'button';
      clear.className = 'clean-clear-v187';
      clear.textContent = 'Alanları Temizle';
      if(save && save.parentNode) save.parentNode.insertBefore(clear, save.nextSibling);
      else if(recent && recent.parentNode) recent.parentNode.insertBefore(clear, recent);
      else card.appendChild(clear);
      clear.addEventListener('click', function(ev){ ev.preventDefault(); clearEntryFields(); });
    } else if(save && save.parentNode && clear.previousElementSibling !== save){
      save.parentNode.insertBefore(clear, save.nextSibling);
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
  function closeCleanOverlay(){
    var overlay = byId('cleanSimpleOverlayV111');
    if(overlay) overlay.classList.remove('show','active','open');
    document.body.classList.remove('clean-simple-open-v111','clean-simple-active-v111');
  }
  function goHome(){
    closeCleanOverlay();
    document.body.classList.remove('show-records','show-guide','show-admin');
    ['navEntry','navRecords','navGuide','navAdmin'].forEach(function(id){ var el = byId(id); if(el) el.classList.toggle('active', id === 'navEntry'); });
    var home = byId('mesahaHomeV143');
    if(home){ try{ home.scrollIntoView({block:'start', behavior:'smooth'}); }catch(_){ try{ window.scrollTo(0,0); }catch(__){} } }
  }
  function refreshCleanProductsSoon(){
    setTimeout(function(){
      safe(function(){ if(typeof renderCleanProductsV111 === 'function') renderCleanProductsV111(); });
      safe(function(){ if(typeof renderCleanAutoV111 === 'function') renderCleanAutoV111(); });
      safe(function(){ if(typeof window.mesahaUltraEntryV186 === 'object' && window.mesahaUltraEntryV186 && typeof window.mesahaUltraEntryV186.boot === 'function') window.mesahaUltraEntryV186.boot(); });
      syncCleanFromMain();
    }, 60);
  }

  function renderHomeTreeButtonsV194(){
    // v201 çoklu ağaç seçimi ayrı IIFE tarafından çizilir.
    var panel = byId('homeTreePanelV194');
    if(panel) panel.className = 'home-tree-panel-v201';
  }
  function ensureHomeSoundCardV194(){
    var home = byId('mesahaHomeV143');
    if(!home) return;
    var summary = home.querySelector('.home-card-v143.summary-v143');
    var card = byId('homeSoundCardV194');
    if(!card){
      card = document.createElement('div');
      card.id = 'homeSoundCardV194';
      card.className = 'home-card-v143 home-sound-card-v201';
      card.innerHTML = '<div class="home-card-head-v143"><h3>Ses Ayarı</h3></div><button type="button" id="homeSoundToggleBtnV194" class="home-sound-btn-v201">Ses: Açık</button>';
      if(summary) home.insertBefore(card, summary); else home.appendChild(card);
    }
    var source = byId('soundToggleBtn');
    var btn = byId('homeSoundToggleBtnV194');
    if(btn){
      if(source) btn.textContent = source.textContent || 'Ses: Açık';
      if(!btn.__v201Sound){
        btn.__v201Sound = true;
        btn.addEventListener('click', function(ev){
          ev.preventDefault();
          var s = byId('soundToggleBtn');
          if(s) s.click();
          setTimeout(function(){ var s2 = byId('soundToggleBtn'); if(s2) btn.textContent = s2.textContent || btn.textContent; }, 60);
        }, false);
      }
    }
  }
  function enhanceInlineTreeV194(){
    // v201 yönetiyor: ağaç paneli artık çoklu seçim + aç/kapa mantığında.
    var treeCompact = document.querySelector('.tree-compact');
    if(treeCompact) treeCompact.classList.add('tree-compact-v201');
    var apply = byId('treeTypeApplyBtn');
    if(apply){ apply.style.setProperty('display','none','important'); apply.tabIndex = -1; }
  }
  function moveEntrySettingsToHome(){
    var home = byId('mesahaHomeV143');
    var dateInput = byId('productionDate');
    var woodPanel = byId('woodTypePanel');
    if(!home || (!dateInput && !woodPanel)) return;
    var card = byId('homeEntrySettingsV188');
    if(!card){
      card = document.createElement('div');
      card.id = 'homeEntrySettingsV188';
      card.className = 'home-entry-settings-v189 home-card-v143';
      card.innerHTML = '<div class="home-card-head-v143"><h3>Giriş Ayarları</h3></div><div class="home-entry-settings-grid-v189"></div>';
      var fileInfo = home.querySelector('.info-details.file-info-v187') || home.querySelector('.file-info-v187');
      if(fileInfo && fileInfo.nextSibling) home.insertBefore(card, fileInfo.nextSibling); else {
        var status = home.querySelector('.home-status-v143');
        if(status && status.nextSibling) home.insertBefore(card, status.nextSibling); else home.insertBefore(card, home.firstChild);
      }
      var openBtn = card.querySelector('#homeOpenCleanV188');
      if(openBtn) openBtn.addEventListener('click', function(ev){ ev.preventDefault(); openClean(); }, true);
    }
    var grid = card.querySelector('.home-entry-settings-grid-v189');
    if(!grid) return;
    var dateBlock = byId('homeDateBlockV188');
    if(!dateBlock && dateInput){
      dateBlock = document.createElement('div');
      dateBlock.id = 'homeDateBlockV188';
      dateBlock.className = 'home-setting-block-v189';
      dateBlock.innerHTML = '<label for="productionDate">Mesaha Tarihi</label>';
      dateBlock.appendChild(dateInput);
      grid.appendChild(dateBlock);
    }
    var woodBlock = byId('homeWoodBlockV188');
    if(!woodBlock && woodPanel){
      woodBlock = document.createElement('div');
      woodBlock.id = 'homeWoodBlockV188';
      woodBlock.className = 'home-setting-block-v189 home-wood-block-v189';
      woodBlock.innerHTML = '<div class="home-setting-title-v189">Odun Türleri</div><p class="home-setting-hint-v189">Tikli olan odun türleri Giriş Modu içinde görünür.</p>';
      woodPanel.classList.add('open','home-wood-panel-v189');
      woodBlock.appendChild(woodPanel);
      grid.appendChild(woodBlock);
      var apply = byId('woodTypeApplyBtn');
      if(apply){
        apply.style.setProperty('display','none','important');
        apply.setAttribute('aria-hidden','true');
        apply.tabIndex = -1;
      }
      if(apply && !apply.__v201Refresh){
        apply.__v201Refresh = true;
        apply.addEventListener('click', refreshCleanProductsSoon, false);
      }
      woodPanel.querySelectorAll('input[type="checkbox"]').forEach(function(ch){
        if(ch.__v189Check) return;
        ch.__v189Check = true;
        ch.addEventListener('change', function(){
          var applyBtn = byId('woodTypeApplyBtn');
          if(applyBtn) setTimeout(function(){ try{ applyBtn.click(); }catch(_){} }, 0);
          else refreshCleanProductsSoon();
        }, false);
      });
    }
    var treeBlock = byId('homeTreeBlockV194');
    if(!treeBlock){
      treeBlock = document.createElement('div');
      treeBlock.id = 'homeTreeBlockV194';
      treeBlock.className = 'home-setting-block-v189 home-tree-block-v201';
      treeBlock.innerHTML = '<div class="home-setting-title-v189">Ağaç Türleri</div><p class="home-setting-hint-v189">Seçili ağaç türü Giriş Modu içinde aktif olur.</p><div id="homeTreePanelV194" class="home-tree-panel-v201"></div>';
      grid.appendChild(treeBlock);
    }
    renderHomeTreeButtonsV194();
    ensureHomeSoundCardV194();
    enhanceInlineTreeV194();
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
    var shortV = (window.MESAHA_VERSION && window.MESAHA_VERSION.shortVersion) || 'v2.29';
    var buildV = (window.MESAHA_VERSION && window.MESAHA_VERSION.version) || 'v201';
    safe(function(){ document.title = shortV; });
    var h = document.querySelector('.app-brand-v143 .brand-copy-v143 h1');
    var s = document.querySelector('.app-brand-v143 .brand-copy-v143 span');
    if(h){ h.textContent = shortV; h.setAttribute('data-version-no-auto','1'); h.setAttribute('data-app-version-short',''); }
    if(s){ s.textContent = buildV; s.setAttribute('data-version-no-auto','1'); s.setAttribute('data-app-version-build',''); }
    document.querySelectorAll('.app-brand-v143 .brand-copy-v143,[data-app-version-short],[data-app-version-build]').forEach(function(el){
      if(el && /Mesaha\s*İ?O/i.test(el.textContent || '')) el.textContent = (el === s ? buildV : shortV);
    });
    var splashH = document.querySelector('.mesaha-startup-logo-v178 h2'); if(splashH) splashH.textContent = shortV;
    var splashP = document.querySelector('.mesaha-startup-logo-v178 p'); if(splashP) splashP.textContent = 'Uygulama hazırlanıyor';
  }
  function patchNavigation(){
    document.body.classList.add('mesaha-v187-entry-only','mesaha-v188-entry-only','mesaha-v189-entry-only');
    var navEntry = byId('navEntry');
    if(navEntry && !navEntry.__v189Home){
      navEntry.__v189Home = true;
      navEntry.textContent = 'Ana Ekran';
      navEntry.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); goHome(); }, true);
    } else if(navEntry) {
      navEntry.textContent = 'Ana Ekran';
    }
    document.querySelectorAll('[data-home-action-v143="new"],[data-home-action-v143="diameter"],[data-home-simple-v146],#openSimpleV112').forEach(function(btn){
      if(btn.__v189Open) return;
      btn.__v189Open = true;
      btn.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); openClean(); }, true);
    });
    var entryTab = document.querySelector('#flowTabsV111 [data-flow-tab="entry"]');
    if(entryTab){
      entryTab.style.removeProperty('display');
      entryTab.style.setProperty('display','flex','important');
      entryTab.style.setProperty('visibility','visible','important');
      entryTab.style.setProperty('pointer-events','auto','important');
      entryTab.innerHTML = '<span class="tab-ico-v143">🏠</span><span class="tab-label-v143">Ana Ekran</span>';
      if(!entryTab.__v189Home){
        entryTab.__v189Home = true;
        entryTab.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); goHome(); }, true);
      }
    }
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
    moveEntrySettingsToHome();
    ensureCleanLayout();
    patchCleanSave();
    patchNavigation();
    observeOverlay();
    patchGuide();
    if(layoutDone) syncCleanFromMain();
  }
  ready(boot);
  [80,240,700,1400,2600,5200].forEach(function(ms){ setTimeout(boot, ms); });
  setInterval(function(){ patchBrand(); patchNavigation(); patchCleanSave(); moveEntrySettingsToHome(); }, 1800);
  window.mesahaEntryModeV188 = { boot:boot, open:openClean, clear:clearEntryFields, home:goHome };
  window.mesahaEntryModeV187 = window.mesahaEntryModeV188;
})();


/* v189 final guard: Ana Ekran sekmesi + sıralama + başlık sabitleme */
(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  function safe(fn){ try{return fn();}catch(e){} }
  function goHome(){
    safe(function(){
      var overlay = byId('cleanSimpleOverlayV111');
      if(overlay){ overlay.classList.remove('show','active','open'); overlay.style.removeProperty('display'); overlay.style.removeProperty('visibility'); overlay.style.removeProperty('pointer-events'); }
      document.body.classList.remove('clean-simple-open-v111','clean-simple-active-v111','show-records','show-guide','show-admin');
      document.body.classList.add('mesaha-v189-entry-only');
      document.querySelectorAll('#flowTabsV111 button,.bottom-nav button').forEach(function(b){ b.classList.remove('active'); });
      var entry = document.querySelector('#flowTabsV111 [data-flow-tab="entry"]') || byId('navEntry');
      if(entry) entry.classList.add('active');
      var home = byId('mesahaHomeV143');
      if(home) home.scrollIntoView({block:'start'}); else window.scrollTo(0,0);
    });
  }
  function titleFix(){
    safe(function(){ document.title = 'v2.29'; });
    safe(function(){
      document.querySelectorAll('.app-brand-v143 .brand-copy-v143,[data-app-version-short],[data-app-version-build]').forEach(function(el){
        if(!el) return;
        if(/Mesaha\s*İ?O/i.test(el.textContent || '')) el.textContent = el.matches('[data-app-version-build], .app-brand-v143 .brand-copy-v143 span') ? 'v201' : 'v2.29';
      });
      var h = document.querySelector('.app-brand-v143 .brand-copy-v143 h1'); if(h) h.textContent = 'v2.29';
      var s = document.querySelector('.app-brand-v143 .brand-copy-v143 span'); if(s) s.textContent = 'v201';
      var splashH = document.querySelector('.mesaha-startup-logo-v178 h2'); if(splashH) splashH.textContent = 'v2.29';
    });
  }
  function navFix(){
    safe(function(){
      document.body.classList.add('mesaha-v187-entry-only','mesaha-v188-entry-only','mesaha-v189-entry-only');
      var entry = document.querySelector('#flowTabsV111 [data-flow-tab="entry"]');
      if(entry){
        entry.style.removeProperty('display');
        entry.style.setProperty('display','flex','important');
        entry.style.setProperty('visibility','visible','important');
        entry.style.setProperty('pointer-events','auto','important');
        entry.innerHTML = '<span class="tab-ico-v143">🏠</span><span class="tab-label-v143">Ana Ekran</span>';
        if(!entry.__v189FinalHome){
          entry.__v189FinalHome = true;
          entry.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); goHome(); }, true);
        }
      }
      var navEntry = byId('navEntry');
      if(navEntry){ navEntry.textContent = 'Ana Ekran'; if(!navEntry.__v189FinalHome){ navEntry.__v189FinalHome = true; navEntry.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); goHome(); }, true); } }
    });
  }
  function syncCleanSafe(){
    safe(function(){ if(window.mesahaEntryModeV188 && typeof window.mesahaEntryModeV188.boot === 'function') window.mesahaEntryModeV188.boot(); });
  }
  function openCleanSafe(){
    safe(function(){
      if(window.mesahaEntryModeV188 && typeof window.mesahaEntryModeV188.open === 'function') window.mesahaEntryModeV188.open();
      else if(typeof window.openCleanSimpleV111 === 'function') window.openCleanSimpleV111();
      else {
        var overlay = byId('cleanSimpleOverlayV111');
        if(overlay) overlay.classList.add('show','active','open');
        document.body.classList.add('clean-simple-open-v111','clean-simple-active-v111');
      }
    });
  }

  function hideUnusedHomeControls(){
    safe(function(){
      var btn = byId('homeOpenCleanV188');
      if(btn) btn.remove();
      var apply = byId('woodTypeApplyBtn');
      if(apply){
        apply.style.setProperty('display','none','important');
        apply.style.setProperty('visibility','hidden','important');
        apply.setAttribute('aria-hidden','true');
        apply.tabIndex = -1;
      }
    });
  }
  function forceEditRecordToClean(){
    safe(function(){
      var old = window.editRecord;
      if(typeof old !== 'function' || old.__v201CleanOpen) return;
      var wrapped = function(id){
        var result = old.apply(this, arguments);
        setTimeout(function(){
          syncCleanSafe();
          openCleanSafe();
          setTimeout(function(){
            var dia = byId('cleanDiameterV111') || byId('cleanLengthV111') || byId('cleanBarcodeV187');
            if(dia){ try{ dia.focus({preventScroll:true}); dia.select && dia.select(); }catch(_){ try{ dia.focus(); }catch(__){} } }
          }, 120);
        }, 60);
        return result;
      };
      wrapped.__v201CleanOpen = true;
      wrapped.__v201Old = old;
      window.editRecord = wrapped;
      try{ editRecord = wrapped; }catch(_){ }
    });
  }
  function orderFix(){
    safe(function(){
      var card = document.querySelector('#cleanSimpleOverlayV111 .clean-simple-card-v111');
      var top = byId('cleanTopFieldsV187');
      var measure = card && card.querySelector('.clean-measure-grid-v111');
      var grid = byId('cleanProductGridV111');
      var save = byId('cleanSaveV111');
      var clear = byId('cleanClearV187');
      var auto = byId('cleanAutoInfoV111');
      var recent = card && card.querySelector('.clean-recent-area-v111');
      if(!card || !measure || !grid || !save) return;
      card.style.setProperty('display','flex','important');
      card.style.setProperty('flex-direction','column','important');
      if(top && top.parentNode === card) card.appendChild(top);
      card.insertBefore(top, card.firstChild.nextSibling);
      measure.classList.add('v187-reordered');
      var lenWrap = byId('cleanLengthV111') ? byId('cleanLengthV111').closest('div') : null;
      var diaWrap = byId('cleanDiameterV111') ? byId('cleanDiameterV111').closest('div') : null;
      if(lenWrap && diaWrap){ measure.insertBefore(diaWrap, measure.firstChild); if(diaWrap.nextSibling !== lenWrap) measure.insertBefore(lenWrap, diaWrap.nextSibling); }

      var section = byId('cleanProductSectionV187');
      if(!section){
        section = document.createElement('div');
        section.id = 'cleanProductSectionV187';
        section.className = 'clean-block-v187 clean-product-section-v187';
        section.innerHTML = '<span class="clean-product-title-v187">Odun Türü</span>';
      }
      if(grid.parentNode !== section) section.appendChild(grid);

      // sıra: başlık -> üst alanlar -> ölçü -> ürün -> kaydet -> temizle -> otomatik bilgi -> son 3
      if(top && top.parentNode === card) card.insertBefore(top, measure);
      if(measure.parentNode === card) card.insertBefore(measure, card.querySelector('#cleanProductSectionV187') || save);
      if(section.parentNode !== card) card.insertBefore(section, save);
      if(section.previousElementSibling !== measure) card.insertBefore(section, measure.nextSibling);
      if(save.previousElementSibling !== section) card.insertBefore(save, section.nextSibling);
      if(clear){
        if(clear.parentNode !== card) card.insertBefore(clear, auto || recent || null);
        if(save.nextElementSibling !== clear) card.insertBefore(clear, save.nextSibling);
      }
      if(auto){
        if(clear && auto.previousElementSibling !== clear) card.insertBefore(auto, clear.nextSibling);
        else if(!clear && save.nextElementSibling !== auto) card.insertBefore(auto, save.nextSibling);
      }
      if(recent){ card.appendChild(recent); }

      [top, measure, section, save, clear, auto, recent].forEach(function(el, idx){ if(el) el.style.setProperty('order', String(idx+1), 'important'); });
    });
  }
  function run(){ titleFix(); navFix(); orderFix(); hideUnusedHomeControls(); forceEditRecordToClean(); moveEntrySettingsToHome(); moveFileInfoToHome(); ensureHomeSoundCardV194(); enhanceInlineTreeV194(); renderHomeTreeButtonsV194(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, {once:true}); else run();
  [50,150,350,800,1500,2600,5200].forEach(function(ms){ setTimeout(run, ms); });
  setInterval(run, 900);
  window.mesahaV190GoHome = goHome; window.mesahaV190OpenClean = openCleanSafe;
})();


/* v201: gerçek Giriş Modu inline form düzeltmesi
   Ürün Türü / Çap-Boy sırası artık temiz overlay değil, aktif kullanılan entryForm üzerinde düzeltilir. */
(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  function safe(fn){ try{return fn();}catch(e){ try{ console.warn('[Mesaha İO v201 inline fix]', e); }catch(_){} } }
  function q(sel, root){ return (root || document).querySelector(sel); }

  function forceInlineOrder(){
    safe(function(){
      var form = byId('entryForm');
      if(!form) return;
      form.classList.add('entry-form-v201-fixed');

      var tree = q('.product-compact.tree-compact', form);
      var product = q('.product-compact:not(.tree-compact)', form);
      var measure = q('.measure-compact', form);
      var barcode = q('.barcode-save-row-final', form);
      var recent = q('.recent-barcodes-box', form);
      var clearBtn = byId('clearInputsBtn');
      var clearRow = clearBtn ? clearBtn.closest('.btn-row') : null;
      var sameBtn = byId('sameBarcodeBtn');

      // Esas istenen sıra: Ağaç/Kesimci alanları kalır, sonra Çap-Boy, sonra Ürün Türü.
      if(tree && measure && tree.nextElementSibling !== measure){
        form.insertBefore(measure, tree.nextSibling);
      }
      if(measure && product && measure.nextElementSibling !== product){
        form.insertBefore(product, measure.nextSibling);
      }
      if(product && barcode && product.nextElementSibling !== barcode){
        form.insertBefore(barcode, product.nextSibling);
      }
      if(barcode && recent && barcode.nextElementSibling !== recent){
        form.insertBefore(recent, barcode.nextSibling);
      }

      // Alanları Temizle giriş modunda görünür kalsın.
      if(clearRow){
        clearRow.classList.add('clear-row-v201');
        if(recent && clearRow.previousElementSibling !== recent){
          form.insertBefore(clearRow, recent.nextSibling);
        }
      }
      if(sameBtn){
        sameBtn.style.setProperty('display','none','important');
        sameBtn.setAttribute('aria-hidden','true');
        sameBtn.tabIndex = -1;
      }
      if(clearBtn){
        clearBtn.style.removeProperty('display');
        clearBtn.style.setProperty('display','flex','important');
        clearBtn.style.setProperty('align-items','center','important');
        clearBtn.style.setProperty('justify-content','center','important');
        clearBtn.style.setProperty('width','100%','important');
        clearBtn.textContent = 'Alanları Temizle';
      }
    });
  }

  function openInlineEntry(){
    safe(function(){
      var overlay = byId('cleanSimpleOverlayV111');
      if(overlay){
        overlay.classList.remove('show','active','open');
        overlay.style.setProperty('display','none','important');
      }
      document.body.classList.remove('show-records','show-guide','show-admin','clean-simple-open-v111','clean-simple-active-v111','clean-keyboard-v118');
      document.body.classList.add('inline-simple-v119','mesaha-v201-edit-entry');
      var entry = q('.panel.entry-panel');
      if(entry) entry.style.setProperty('display','block','important');
      document.querySelectorAll('#flowTabsV111 button,.bottom-nav button').forEach(function(b){ b.classList.remove('active'); });
      var nav = byId('navEntry') || q('#flowTabsV111 [data-flow-tab="entry"]');
      if(nav) nav.classList.add('active');
      forceInlineOrder();
      setTimeout(function(){
        forceInlineOrder();
        var dia = byId('diameter') || byId('length') || byId('barcode');
        if(dia){ try{ dia.focus({preventScroll:true}); dia.select && dia.select(); }catch(_){ try{ dia.focus(); }catch(__){} } }
      }, 80);
    });
  }

  function wrapEditRecord(){
    safe(function(){
      var old = window.editRecord;
      if(typeof old !== 'function' || old.__v201InlineEdit) return;
      var wrapped = function(id){
        var result = old.apply(this, arguments);
        setTimeout(openInlineEntry, 40);
        setTimeout(openInlineEntry, 180);
        return result;
      };
      wrapped.__v201InlineEdit = true;
      wrapped.__v201Old = old;
      window.editRecord = wrapped;
      try{ editRecord = wrapped; }catch(_){}
    });
  }

  function bindEditClicks(){
    if(document.__mesahaV193EditClick) return;
    document.__mesahaV193EditClick = true;
    document.addEventListener('click', function(ev){
      var t = ev.target;
      if(!t || !t.closest) return;
      var hit = t.closest('.edit-mini,.record-edit-v111,[data-v111-edit],[onclick*="editRecord"]');
      if(hit){
        setTimeout(openInlineEntry, 60);
        setTimeout(openInlineEntry, 220);
      }
    }, true);
  }

  function boot(){
    forceInlineOrder();
    wrapEditRecord();
    bindEditClicks();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  [50,150,350,800,1500,2600,5200].forEach(function(ms){ setTimeout(boot, ms); });
  setInterval(function(){
    forceInlineOrder();
    wrapEditRecord();
  }, 700);

  window.mesahaV193OpenEntry = openInlineEntry;
  window.mesahaV193ForceOrder = forceInlineOrder;
})();


/* v201: kayıt modu kök sabitleme - fiziksel form sırası ve alan boyutları */
(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  function q(sel, root){ return (root || document).querySelector(sel); }
  function safe(fn){ try{return fn();}catch(e){ try{ console.warn('[Mesaha v201]', e); }catch(_){} } }
  function hardFix(){
    safe(function(){
      var form = byId('entryForm');
      if(!form) return;
      form.classList.add('entry-form-v201-hard');
      var tree = q('.product-compact.tree-compact', form);
      var product = q('.product-compact:not(.tree-compact)', form);
      var measure = q('.measure-compact', form);
      var barcode = q('.barcode-save-row-final', form);
      var recent = q('.recent-barcodes-box', form);
      var clearBtn = byId('clearInputsBtn');
      var clearRow = clearBtn ? clearBtn.closest('.btn-row') : null;
      var soundBtn = byId('soundToggleBtn');
      var soundRow = soundBtn ? soundBtn.closest('.btn-row') : null;
      var same = byId('sameBarcodeBtn');

      if(tree && measure && tree.nextElementSibling !== measure) form.insertBefore(measure, tree.nextSibling);
      if(measure && product && measure.nextElementSibling !== product) form.insertBefore(product, measure.nextSibling);
      if(product && barcode && product.nextElementSibling !== barcode) form.insertBefore(barcode, product.nextSibling);
      if(barcode && recent && barcode.nextElementSibling !== recent) form.insertBefore(recent, barcode.nextSibling);
      if(clearRow){
        clearRow.classList.add('clear-row-v201');
        if(recent && clearRow.previousElementSibling !== recent) form.insertBefore(clearRow, recent.nextSibling);
      }
      if(soundRow){
        soundRow.classList.add('sound-row-v201');
        if(clearRow && soundRow.previousElementSibling !== clearRow) form.insertBefore(soundRow, clearRow.nextSibling);
      }
      if(same) same.style.setProperty('display','none','important');
      if(clearBtn){
        clearBtn.style.setProperty('display','flex','important');
        clearBtn.style.setProperty('width','100%','important');
        clearBtn.style.setProperty('align-items','center','important');
        clearBtn.style.setProperty('justify-content','center','important');
        clearBtn.textContent = 'Alanları Temizle';
      }

      var panelTitle = q('.entry-panel .panel-header h2');
      if(panelTitle) panelTitle.textContent = 'Mesaha Gir';
      var title = byId('homeSimpleV146');
      if(title) title.textContent = 'Mesaha Gir';
      var hint = byId('homeSimpleHintV146');
      if(hint) hint.textContent = 'Dokun ve hızlı mesaha girişine geç';
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hardFix, {once:true});
  else hardFix();
  [50,150,300,700,1200,2500,5000].forEach(function(ms){ setTimeout(hardFix, ms); });
  setInterval(hardFix, 700);
  window.mesahaV197HardFix = hardFix;
})();


/* v201: Ağaç türleri çoklu seçim + girişte aç/kapa + Yeni Kayıt menüsünü tamamen gizle */
(function(){
  'use strict';
  var TREES = ['Karaçam','Sarıçam','Sedir','Göknar','Kızılçam'];
  var STORE = 'mesaha_visible_trees_v201';
  var PANEL_STORE = 'mesaha_tree_panel_open_v201';
  function byId(id){ return document.getElementById(id); }
  function safe(fn,fb){ try{return fn();}catch(e){ try{console.warn('[Mesaha v201]',e);}catch(_){} return fb; } }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];}); }
  function norm(v){ return String(v==null?'':v).trim().replace(/\s+/g,' '); }
  function lower(v){ return norm(v).toLocaleLowerCase('tr-TR'); }
  function settings(){ return safe(function(){ return window.state && state.settings ? state.settings : {}; },{}); }
  function saveSettingsSafe(){ safe(function(){ if(typeof saveSettings === 'function') saveSettings(); }); }
  function readList(){
    var s = settings();
    var arr = Array.isArray(s.visibleTreesV198) ? s.visibleTreesV198 : null;
    if(!arr){ arr = safe(function(){ return JSON.parse(localStorage.getItem(STORE)||'null'); }, null); }
    if(!Array.isArray(arr) || !arr.length) arr = TREES.slice();
    arr = arr.map(norm).filter(function(t){ return TREES.some(function(x){ return lower(x)===lower(t); }); });
    if(!arr.length) arr = TREES.slice();
    return arr.filter(function(t,i,a){ return a.findIndex(function(x){return lower(x)===lower(t);})===i; });
  }
  function writeList(arr){
    arr = (Array.isArray(arr)?arr:[]).map(norm).filter(function(t){ return TREES.some(function(x){ return lower(x)===lower(t); }); });
    if(!arr.length) arr = [currentTree() || 'Karaçam'];
    if(!arr.length) arr = ['Karaçam'];
    safe(function(){ settings().visibleTreesV198 = arr.slice(); });
    safe(function(){ localStorage.setItem(STORE, JSON.stringify(arr)); });
    saveSettingsSafe();
    var cur = currentTree();
    if(cur && !arr.some(function(t){return lower(t)===lower(cur);})){ setTree(arr[0]); }
  }
  function currentTree(){ return norm((byId('treeType') && byId('treeType').value) || (settings().lastTreeType) || 'Karaçam') || 'Karaçam'; }
  function setTree(name){
    name = norm(name) || 'Karaçam';
    var hidden = byId('treeType'); if(hidden) hidden.value = name;
    var cur = byId('treeTypeCurrent'); if(cur) cur.textContent = name;
    safe(function(){ settings().lastTreeType = name; });
    document.querySelectorAll('input[name="treeTypeRadio"]').forEach(function(r){ r.checked = lower(r.value)===lower(name); });
    saveSettingsSafe();
    renderHomeTrees();
    renderInlineTreePanel();
  }
  function renderHomeTrees(){
    var panel = byId('homeTreePanelV194');
    if(!panel) return;
    panel.className = 'home-tree-panel-v201';
    var list = readList();
    panel.innerHTML = TREES.map(function(t){
      var checked = list.some(function(x){return lower(x)===lower(t);});
      return '<label class="home-tree-check-v201 '+(checked?'is-checked':'')+'"><input type="checkbox" value="'+esc(t)+'" '+(checked?'checked':'')+' /> <span>'+esc(t)+'</span></label>';
    }).join('');
    panel.querySelectorAll('input[type="checkbox"]').forEach(function(ch){
      if(ch.__v201HomeTree) return;
      ch.__v201HomeTree = true;
      ch.addEventListener('change', function(){
        var selected = Array.prototype.slice.call(panel.querySelectorAll('input[type="checkbox"]:checked')).map(function(i){return i.value;});
        writeList(selected);
        renderHomeTrees();
        renderInlineTreePanel();
      }, false);
    });
    var block = byId('homeTreeBlockV194');
    if(block){
      var hint = block.querySelector('.home-setting-hint-v189');
      if(hint) hint.textContent = 'Tikli olan ağaç türleri Hızlı Giriş içinde görünür.';
    }
  }
  function isPanelOpen(){ return safe(function(){ return localStorage.getItem(PANEL_STORE)==='1'; }, false); }
  function setPanelOpen(on){ safe(function(){ localStorage.setItem(PANEL_STORE, on?'1':'0'); }); }
  function renderInlineTreePanel(){
    var wrap = document.querySelector('.product-compact.tree-compact');
    var head = wrap && wrap.querySelector('.product-select-head');
    var btn = byId('treeTypeSelectBtn');
    var panel = byId('treeTypePanel');
    if(!wrap || !head || !btn || !panel) return;
    wrap.classList.add('tree-dropdown-v201');
    btn.style.removeProperty('display');
    btn.style.setProperty('display','inline-flex','important');
    btn.textContent = 'Ağaç Türü Seç: ' + currentTree();
    var open = isPanelOpen();
    panel.classList.toggle('open', open);
    panel.classList.toggle('closed-v201', !open);
    var list = readList();
    var cur = currentTree();
    if(!list.some(function(t){return lower(t)===lower(cur);})) cur = list[0] || 'Karaçam';
    panel.innerHTML = list.map(function(t){
      return '<label class="wood-check tree-radio-v201 '+(lower(t)===lower(cur)?'is-active':'')+'"><input type="radio" name="treeTypeRadio" value="'+esc(t)+'" '+(lower(t)===lower(cur)?'checked':'')+' /> '+esc(t)+'</label>';
    }).join('');
    panel.querySelectorAll('input[type="radio"]').forEach(function(r){
      r.addEventListener('change', function(ev){
        setTree(r.value || 'Karaçam');
        setPanelOpen(true);
        var p = byId('treeTypePanel'); if(p){ p.classList.add('open'); p.classList.remove('closed-v201'); }
      }, false);
    });
    var apply = byId('treeTypeApplyBtn'); if(apply) apply.style.setProperty('display','none','important');
  }
  function bindTreeButton(){
    var old = byId('treeTypeSelectBtn');
    if(!old || old.__v201Bound) return;
    var btn = old.cloneNode(true);
    btn.__v201Bound = true;
    old.parentNode.replaceChild(btn, old);
    btn.addEventListener('click', function(ev){
      ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      var on = !isPanelOpen();
      setPanelOpen(on);
      renderInlineTreePanel();
    }, true);
  }
  function killYeniKayitMenu(){
    document.querySelectorAll('#flowTabsV111,[data-flow-tab="entry"],#navAdmin,[data-flow-tab="admin"]').forEach(function(el){
      if(el && el.id === 'flowTabsV111') el.style.setProperty('display','none','important');
      if(el && el.getAttribute && el.getAttribute('data-flow-tab') === 'entry') el.style.setProperty('display','none','important');
    });
    document.querySelectorAll('.entry-panel .panel-header h2').forEach(function(h){ if(/Yeni\s*Kayıt/i.test(h.textContent||'')) h.textContent = 'Mesaha Gir'; });
    document.querySelectorAll('button,a,span,h2,h3').forEach(function(el){ if((el.textContent||'').trim()==='Yeni Kayıt') el.textContent='Mesaha Gir'; });
  }
  function boot(){
    renderHomeTrees();
    bindTreeButton();
    renderInlineTreePanel();
    killYeniKayitMenu();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  [50,160,420,900,1800,3200,5200].forEach(function(ms){ setTimeout(boot, ms); });
  setInterval(boot, 900);
  window.mesahaV198RenderTrees = boot;
})();


/* v201: Ana menü ağaç türü çoklu seçim + hızlı giriş ağaç aç/kapa + admin yeni kayıt menüsü kapatma */
(function(){
  'use strict';
  var TREES = ['Karaçam','Sarıçam','Sedir','Göknar','Kızılçam'];
  var STORE = 'mesaha_visible_trees_v201';
  var OPEN_STORE = 'mesaha_tree_panel_open_v201';
  function byId(id){ return document.getElementById(id); }
  function norm(v){ return String(v == null ? '' : v).trim(); }
  function lower(v){ return norm(v).toLocaleLowerCase('tr-TR'); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]; }); }
  function safe(fn){ try{return fn();}catch(e){ try{ console.warn('[Mesaha İO v201]', e); }catch(_){} } }
  function currentTree(){ return norm((byId('treeType') && byId('treeType').value) || (typeof state !== 'undefined' && state.settings && state.settings.lastTreeType) || 'Karaçam') || 'Karaçam'; }
  function selectedTrees(){
    var arr = null;
    safe(function(){ arr = JSON.parse(localStorage.getItem(STORE) || 'null'); });
    if(!Array.isArray(arr) || !arr.length) arr = (typeof state !== 'undefined' && state.settings && Array.isArray(state.settings.visibleTreesV198) && state.settings.visibleTreesV198.length) ? state.settings.visibleTreesV198.slice() : TREES.slice();
    arr = arr.map(norm).filter(function(x){ return TREES.some(function(t){ return lower(t) === lower(x); }); });
    if(!arr.length) arr = TREES.slice();
    return arr.filter(function(x,i,a){ return a.findIndex(function(y){ return lower(x)===lower(y); }) === i; });
  }
  function saveSelectedTrees(arr){
    arr = (arr || []).map(norm).filter(Boolean);
    if(!arr.length) arr = [currentTree() || 'Karaçam'];
    arr = arr.filter(function(x){ return TREES.some(function(t){ return lower(t) === lower(x); }); });
    if(!arr.length) arr = ['Karaçam'];
    safe(function(){ localStorage.setItem(STORE, JSON.stringify(arr)); });
    safe(function(){ if(typeof state !== 'undefined' && state.settings) state.settings.visibleTreesV198 = arr.slice(); if(typeof saveSettings === 'function') saveSettings(); });
    return arr;
  }
  function setTreeValue(t){
    t = norm(t) || 'Karaçam';
    var input = byId('treeType'); if(input) input.value = t;
    var current = byId('treeTypeCurrent'); if(current) current.textContent = t;
    document.querySelectorAll('input[name="treeTypeRadio"]').forEach(function(r){ r.checked = lower(r.value) === lower(t); });
    safe(function(){ if(typeof state !== 'undefined' && state.settings) state.settings.lastTreeType = t; if(typeof saveSettings === 'function') saveSettings(); });
  }
  function ensureCurrentAllowed(arr){
    var cur = currentTree();
    if(!arr.some(function(t){ return lower(t) === lower(cur); })) setTreeValue(arr[0] || 'Karaçam');
  }
  function renderHomeTreeMulti(){
    var panel = byId('homeTreePanelV194');
    if(!panel) return;
    var arr = selectedTrees();
    ensureCurrentAllowed(arr);
    panel.className = 'home-tree-panel-v201';
    panel.innerHTML = TREES.map(function(t){
      var checked = arr.some(function(x){ return lower(x) === lower(t); });
      return '<label class="home-tree-check-v201 '+(checked?'active':'')+'"><input type="checkbox" value="'+esc(t)+'" '+(checked?'checked':'')+' /> <span>'+esc(t)+'</span></label>';
    }).join('');
    panel.querySelectorAll('input[type="checkbox"]').forEach(function(ch){
      if(ch.__v201TreeCheck) return;
      ch.__v201TreeCheck = true;
      ch.addEventListener('change', function(){
        var vals = Array.prototype.slice.call(panel.querySelectorAll('input[type="checkbox"]:checked')).map(function(i){ return i.value; });
        vals = saveSelectedTrees(vals);
        ensureCurrentAllowed(vals);
        renderHomeTreeMulti();
        syncFastTreePanel();
      }, false);
    });
  }
  function treePanelOpen(){ return localStorage.getItem(OPEN_STORE) === '1'; }
  function setTreePanelOpen(on){ localStorage.setItem(OPEN_STORE, on ? '1' : '0'); }
  function syncFastTreePanel(){
    var compact = document.querySelector('.tree-compact');
    var panel = byId('treeTypePanel');
    var btn = byId('treeTypeSelectBtn');
    var apply = byId('treeTypeApplyBtn');
    var arr = selectedTrees();
    ensureCurrentAllowed(arr);
    if(compact) compact.classList.add('tree-compact-v201');
    if(btn){
      btn.style.setProperty('display','inline-flex','important');
      btn.style.setProperty('align-items','center','important');
      btn.style.setProperty('justify-content','center','important');
      btn.tabIndex = 0;
      btn.textContent = 'Ağaç Türü Seç: ' + currentTree();
      if(!btn.__v201Toggle){
        btn.__v201Toggle = true;
        btn.addEventListener('click', function(ev){
          ev.preventDefault();
          setTreePanelOpen(!treePanelOpen());
          syncFastTreePanel();
        }, true);
      }
    }
    if(apply){ apply.style.setProperty('display','none','important'); apply.tabIndex = -1; }
    if(panel){
      panel.classList.add('tree-panel-v201');
      panel.classList.toggle('open', treePanelOpen());
      panel.querySelectorAll('label.wood-check').forEach(function(label){
        var r = label.querySelector('input[type="radio"]');
        var val = r ? r.value : '';
        var show = arr.some(function(x){ return lower(x) === lower(val); });
        label.classList.toggle('tree-hidden-v201', !show);
        label.style.setProperty('display', show ? 'flex' : 'none', 'important');
        if(r && !r.__v201Radio){
          r.__v201Radio = true;
          r.addEventListener('change', function(){
            if(r.checked){
              setTreeValue(r.value || 'Karaçam');
              // açıkken açık kalır, kapalıyken kapalı kalır
              syncFastTreePanel();
              renderHomeTreeMulti();
            }
          }, false);
        }
      });
    }
  }
  function adminMenuFix(){
    // Eski üst sekme menüsünde Yeni Kayıt/Admin açılmasın; gerçek alt menü kalsın.
    var tabs = byId('flowTabsV111');
    if(tabs){ tabs.style.setProperty('display','none','important'); tabs.setAttribute('aria-hidden','true'); }
    if(document.body && document.body.classList.contains('show-admin') && !document.body.classList.contains('inline-simple-v119')){
      var entry = document.querySelector('.panel.entry-panel');
      if(entry) entry.style.setProperty('display','none','important');
    }
  }
  function boot(){ renderHomeTreeMulti(); syncFastTreePanel(); adminMenuFix(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  [80,240,700,1500,3000,5200].forEach(function(ms){ setTimeout(boot, ms); });
  setInterval(boot, 500);
  window.mesahaV198TreeMenu = { render:renderHomeTreeMulti, sync:syncFastTreePanel, selected:selectedTrees };
})();


/* v201: flow tabs görünür + input focus scroll zıplama azaltma */
(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  function safe(fn){ try{return fn();}catch(e){ try{ console.warn('[Mesaha İO v201 scroll/nav fix]', e); }catch(_){}} }
  function ensureFlowTabsVisibleV199(){
    safe(function(){
      var tabs = byId('flowTabsV111');
      if(!tabs) return;
      tabs.style.setProperty('display','grid','important');
      tabs.style.setProperty('visibility','visible','important');
      tabs.style.setProperty('pointer-events','auto','important');
      ['entry','records','guide'].forEach(function(name){
        var btn = tabs.querySelector('[data-flow-tab="'+name+'"]');
        if(btn){
          btn.style.setProperty('display','flex','important');
          btn.style.setProperty('visibility','visible','important');
          btn.style.setProperty('pointer-events','auto','important');
        }
      });
    });
  }
  function bindScrollLockV199(){
    if(document.__mesahaV199ScrollLock) return;
    document.__mesahaV199ScrollLock = true;
    var lastY = 0, timer = null;
    function stabilize(){
      var count = 0;
      document.documentElement.classList.add('mesaha-lock-scroll-v201');
      document.body.classList.add('mesaha-lock-scroll-v201');
      clearInterval(timer);
      timer = setInterval(function(){
        try{ window.scrollTo(0, lastY); }catch(_){ }
        count++;
        if(count > 8){ clearInterval(timer); document.documentElement.classList.remove('mesaha-lock-scroll-v201'); document.body.classList.remove('mesaha-lock-scroll-v201'); }
      }, 80);
    }
    ['length','diameter','barcode'].forEach(function(id){
      var el = byId(id);
      if(!el || el.__v201Bound) return;
      el.__v201Bound = true;
      ['touchstart','mousedown','focus'].forEach(function(evName){
        el.addEventListener(evName, function(){
          if(!document.body.classList.contains('inline-simple-v119')) return;
          lastY = window.scrollY || window.pageYOffset || 0;
          setTimeout(stabilize, 20);
        }, true);
      });
      el.addEventListener('blur', function(){ clearInterval(timer); document.documentElement.classList.remove('mesaha-lock-scroll-v201'); document.body.classList.remove('mesaha-lock-scroll-v201'); }, true);
    });
  }
  function bootV199(){ ensureFlowTabsVisibleV199(); bindScrollLockV199(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootV199, {once:true}); else bootV199();
  [120,400,900,1800].forEach(function(ms){ setTimeout(bootV199, ms); });
  setInterval(ensureFlowTabsVisibleV199, 1200);
})();


/* v201: alt menü sabit + Boy/Çap/Barkod odakta sayfa yukarı zıplamasın */
(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  function safe(fn){ try{return fn();}catch(e){} }
  function fixBottomNav(){
    safe(function(){
      var nav = document.querySelector('.bottom-nav');
      if(!nav) return;
      nav.style.setProperty('display','flex','important');
      nav.style.setProperty('visibility','visible','important');
      nav.style.setProperty('opacity','1','important');
      nav.style.setProperty('pointer-events','auto','important');
      var entry = byId('navEntry'); if(entry) entry.textContent = 'Ana Ekran';
      var records = byId('navRecords'); if(records) records.textContent = 'Ölçümler';
      var guide = byId('navGuide'); if(guide) guide.textContent = 'Kılavuz';
      var tabs = byId('flowTabsV111'); if(tabs){ tabs.style.setProperty('display','none','important'); tabs.setAttribute('aria-hidden','true'); }
    });
  }
  var lastY = 0;
  var lockUntil = 0;
  function shouldLockTarget(el){
    if(!el || !el.matches) return false;
    return document.body && document.body.classList.contains('inline-simple-v119') && el.matches('#length,#diameter,#barcode,.measure-compact input,.barcode-save-row-final input');
  }
  function restoreY(y){
    safe(function(){ window.scrollTo(0, y); });
  }
  function startKeyboardLock(el){
    if(!shouldLockTarget(el)) return;
    lastY = window.scrollY || document.documentElement.scrollTop || 0;
    lockUntil = Date.now() + 900;
    document.body.classList.add('keyboard-lock-v201');
    [0,40,90,160,260,420,650,900].forEach(function(ms){ setTimeout(function(){ if(Date.now() <= lockUntil + 80) restoreY(lastY); }, ms); });
  }
  document.addEventListener('touchstart', function(ev){
    var t = ev.target && ev.target.closest ? ev.target.closest('#length,#diameter,#barcode,.measure-compact input,.barcode-save-row-final input') : null;
    if(shouldLockTarget(t)) lastY = window.scrollY || document.documentElement.scrollTop || 0;
  }, true);
  document.addEventListener('focusin', function(ev){ startKeyboardLock(ev.target); }, true);
  document.addEventListener('focusout', function(){
    lockUntil = 0;
    setTimeout(function(){ document.body.classList.remove('keyboard-lock-v201'); }, 120);
  }, true);
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', function(){ if(Date.now() < lockUntil) restoreY(lastY); });
    window.visualViewport.addEventListener('scroll', function(){ if(Date.now() < lockUntil) restoreY(lastY); });
  }
  function boot(){ fixBottomNav(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  [80,240,700,1500,3000,5200].forEach(function(ms){ setTimeout(boot, ms); });
  setInterval(boot, 1000);
  window.mesahaV199BottomNavFix = fixBottomNav;
})();


/* v201: Alt menü eski görünümlü sabit menü; orijinal menünün gidip gelmesini engeller */
(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  function safe(fn){ try{return fn();}catch(e){ try{ console.warn('[Mesaha İO v201 nav]', e); }catch(_){} } }

  function hideOldNavs(){
    safe(function(){
      document.querySelectorAll('.bottom-nav,#flowTabsV111,.flow-tabs-v111').forEach(function(el){
        if(el && el.id !== 'stableBottomNavV200'){
          el.style.setProperty('display','none','important');
          el.style.setProperty('visibility','hidden','important');
          el.style.setProperty('opacity','0','important');
          el.style.setProperty('pointer-events','none','important');
        }
      });
    });
  }

  function syncActive(){
    var nav = byId('stableBottomNavV200');
    if(!nav) return;
    var key = 'home';
    if(document.body.classList.contains('show-records')) key = 'records';
    if(document.body.classList.contains('show-guide')) key = 'guide';
    nav.querySelectorAll('button').forEach(function(btn){
      btn.classList.toggle('active', btn.getAttribute('data-stable-nav-v200') === key);
    });
  }

  function showHome(){
    safe(function(){
      document.body.classList.remove('show-records','show-guide','show-admin','inline-simple-v119','clean-simple-open-v111','clean-simple-active-v111');
      var overlay = byId('cleanSimpleOverlayV111');
      if(overlay) overlay.classList.remove('show','active','open');
      syncActive();
      var home = byId('mesahaHomeV143');
      if(home){ try{ home.scrollIntoView({block:'start'}); }catch(_){ window.scrollTo(0,0); } }
    });
  }

  function showRecords(){
    safe(function(){
      document.body.classList.remove('show-guide','show-admin','inline-simple-v119','clean-simple-open-v111','clean-simple-active-v111');
      document.body.classList.add('show-records');
      var overlay = byId('cleanSimpleOverlayV111');
      if(overlay) overlay.classList.remove('show','active','open');
      if(typeof render === 'function') setTimeout(function(){ try{ render(); }catch(_){} }, 0);
      syncActive();
      try{ window.scrollTo({top:0, behavior:'auto'}); }catch(_){ window.scrollTo(0,0); }
    });
  }

  function showGuide(){
    safe(function(){
      document.body.classList.remove('show-records','show-admin','inline-simple-v119','clean-simple-open-v111','clean-simple-active-v111');
      document.body.classList.add('show-guide');
      var overlay = byId('cleanSimpleOverlayV111');
      if(overlay) overlay.classList.remove('show','active','open');
      syncActive();
      try{ window.scrollTo({top:0, behavior:'auto'}); }catch(_){ window.scrollTo(0,0); }
    });
  }

  function ensureStableNav(){
    hideOldNavs();
    if(document.body.classList.contains('inline-simple-v119') ||
       document.body.classList.contains('clean-simple-open-v111') ||
       document.body.classList.contains('clean-simple-active-v111') ||
       document.body.classList.contains('clean-keyboard-v118')){
      var existingNav = byId('stableBottomNavV200');
      if(existingNav){
        existingNav.style.setProperty('display','none','important');
        existingNav.style.setProperty('visibility','hidden','important');
        existingNav.style.setProperty('opacity','0','important');
        existingNav.style.setProperty('pointer-events','none','important');
      }
      return;
    }
    var nav = byId('stableBottomNavV200');
    if(!nav){
      nav = document.createElement('nav');
      nav.id = 'stableBottomNavV200';
      nav.setAttribute('aria-label','Alt menü');
      nav.innerHTML =
        '<button type="button" data-stable-nav-v200="home" aria-label="Ana Ekran"></button>'+
        '<button type="button" data-stable-nav-v200="records" aria-label="Ölçümler"></button>'+
        '<button type="button" data-stable-nav-v200="guide" aria-label="Kılavuz"></button>';
      document.body.appendChild(nav);
      nav.addEventListener('click', function(ev){
        var btn = ev.target && ev.target.closest ? ev.target.closest('[data-stable-nav-v200]') : null;
        if(!btn) return;
        ev.preventDefault();
        ev.stopPropagation();
        if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        var key = btn.getAttribute('data-stable-nav-v200');
        if(key === 'records') showRecords();
        else if(key === 'guide') showGuide();
        else showHome();
      }, true);
    }
    nav.style.setProperty('display','grid','important');
    nav.style.setProperty('visibility','visible','important');
    nav.style.setProperty('opacity','1','important');
    nav.style.setProperty('pointer-events','auto','important');
    syncActive();
  }

  function boot(){
    ensureStableNav();
    hideOldNavs();
    syncActive();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  [60,200,500,1000,1800,3000,5200].forEach(function(ms){ setTimeout(boot, ms); });
  setInterval(boot, 1000);
  window.mesahaV200StableNav = {home:showHome, records:showRecords, guide:showGuide, sync:syncActive}; window.mesahaV201StableNav = window.mesahaV200StableNav;
})();


/* v201: Hızlı girişte alt menü kesin gizli; ana ekran/ölçümler/kılavuzda sabit */
(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  function safe(fn){ try{return fn();}catch(e){ try{ console.warn('[Mesaha İO v201 nav guard]', e); }catch(_){} } }

  function isFastEntryOpen(){
    return !!(
      document.body.classList.contains('inline-simple-v119') ||
      document.body.classList.contains('clean-simple-open-v111') ||
      document.body.classList.contains('clean-simple-active-v111') ||
      document.body.classList.contains('clean-keyboard-v118')
    );
  }

  function nav(){
    return byId('stableBottomNavV200') || byId('stableBottomNavV200');
  }

  function hideStableNav(){
    safe(function(){
      var n = nav();
      if(!n) return;
      n.style.setProperty('display','none','important');
      n.style.setProperty('visibility','hidden','important');
      n.style.setProperty('opacity','0','important');
      n.style.setProperty('pointer-events','none','important');
    });
  }

  function showStableNav(){
    safe(function(){
      if(isFastEntryOpen()) { hideStableNav(); return; }
      var n = nav();
      if(!n) {
        if(typeof window.mesahaV200StableNav === 'object' && window.mesahaV200StableNav && typeof window.mesahaV200StableNav.sync === 'function') {
          try { window.mesahaV200StableNav.sync(); } catch(_){}
        }
        n = nav();
      }
      if(!n) return;
      n.style.setProperty('display','grid','important');
      n.style.setProperty('visibility','visible','important');
      n.style.setProperty('opacity','1','important');
      n.style.setProperty('pointer-events','auto','important');
    });
  }

  function hideOldNavs(){
    safe(function(){
      document.querySelectorAll('.bottom-nav,#flowTabsV111,.flow-tabs-v111').forEach(function(el){
        if(!el || el.id === 'stableBottomNavV200' || el.id === 'stableBottomNavV200') return;
        el.style.setProperty('display','none','important');
        el.style.setProperty('visibility','hidden','important');
        el.style.setProperty('opacity','0','important');
        el.style.setProperty('pointer-events','none','important');
      });
    });
  }

  function guard(){
    hideOldNavs();
    if(isFastEntryOpen()) hideStableNav();
    else showStableNav();
  }

  // Hızlı girişe giren ana fonksiyonları sarmala: açılınca menüyü anında gizle.
  function wrapOpeners(){
    safe(function(){
      ['openCleanSimpleV111','openCleanSimpleV113','setInlineSimpleV119','setInlineSimpleV122','setInlineSimpleV126'].forEach(function(name){
        var fn = window[name];
        if(typeof fn !== 'function' || fn.__v201NavWrapped) return;
        var wrapped = function(){
          var result = fn.apply(this, arguments);
          setTimeout(guard, 0);
          setTimeout(guard, 80);
          setTimeout(guard, 220);
          return result;
        };
        wrapped.__v201NavWrapped = true;
        wrapped.__v201Old = fn;
        try { window[name] = wrapped; } catch(_){}
        try { eval(name + ' = wrapped'); } catch(_){}
      });
    });
  }

  function boot(){
    wrapOpeners();
    guard();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();

  [30,80,160,320,700,1200,2400,5200].forEach(function(ms){ setTimeout(boot, ms); });
  setInterval(boot, 700);

  document.addEventListener('click', function(ev){
    var t = ev.target && ev.target.closest ? ev.target.closest('#openSimpleV112,[data-home-simple-v146],.home-simple-v146') : null;
    if(t){
      setTimeout(guard, 0);
      setTimeout(guard, 120);
      setTimeout(guard, 300);
    }
  }, true);

  window.mesahaV201NavGuard = {guard:guard, hide:hideStableNav, show:showStableNav, isFastEntryOpen:isFastEntryOpen};
})();
