(function(){
  'use strict';
  var TAG = 'v194-entry-mode';
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
    var panel = byId('homeTreePanelV194');
    if(!panel) return;
    var active = activeTree();
    panel.innerHTML = TREES.map(function(t){ return '<button type="button" class="home-tree-chip-v194 '+(lower(t)===lower(active)?'active':'')+'" data-home-tree-v194="'+esc(t)+'">'+esc(t)+'</button>'; }).join('');
    panel.querySelectorAll('[data-home-tree-v194]').forEach(function(btn){
      if(btn.__v194Tree) return;
      btn.__v194Tree = true;
      btn.addEventListener('click', function(ev){
        ev.preventDefault();
        setTree(btn.getAttribute('data-home-tree-v194') || 'Karaçam');
        renderHomeTreeButtonsV194();
      }, false);
    });
  }
  function ensureHomeSoundCardV194(){
    var home = byId('mesahaHomeV143');
    if(!home) return;
    var summary = home.querySelector('.home-card-v143.summary-v143');
    var card = byId('homeSoundCardV194');
    if(!card){
      card = document.createElement('div');
      card.id = 'homeSoundCardV194';
      card.className = 'home-card-v143 home-sound-card-v194';
      card.innerHTML = '<div class="home-card-head-v143"><h3>Ses Ayarı</h3></div><button type="button" id="homeSoundToggleBtnV194" class="home-sound-btn-v194">Ses: Açık</button>';
      if(summary) home.insertBefore(card, summary); else home.appendChild(card);
    }
    var source = byId('soundToggleBtn');
    var btn = byId('homeSoundToggleBtnV194');
    if(btn){
      if(source) btn.textContent = source.textContent || 'Ses: Açık';
      if(!btn.__v194Sound){
        btn.__v194Sound = true;
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
    var treeCompact = document.querySelector('.tree-compact');
    var panel = byId('treeTypePanel');
    var apply = byId('treeTypeApplyBtn');
    var selectBtn = byId('treeTypeSelectBtn');
    if(treeCompact) treeCompact.classList.add('tree-compact-v194');
    if(panel){
      panel.classList.add('open','tree-panel-v194');
      panel.querySelectorAll('input[type="radio"]').forEach(function(r){
        if(r.__v194TreeChange) return;
        r.__v194TreeChange = true;
        r.addEventListener('change', function(){
          setTree(r.value || 'Karaçam');
          renderHomeTreeButtonsV194();
        }, false);
      });
    }
    if(selectBtn){ selectBtn.style.setProperty('display','none','important'); selectBtn.tabIndex = -1; }
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
      if(apply && !apply.__v194Refresh){
        apply.__v194Refresh = true;
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
      treeBlock.className = 'home-setting-block-v189 home-tree-block-v194';
      treeBlock.innerHTML = '<div class="home-setting-title-v189">Ağaç Türleri</div><p class="home-setting-hint-v189">Seçili ağaç türü Giriş Modu içinde aktif olur.</p><div id="homeTreePanelV194" class="home-tree-panel-v194"></div>';
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
    var shortV = (window.MESAHA_VERSION && window.MESAHA_VERSION.shortVersion) || 'v2.23';
    var buildV = (window.MESAHA_VERSION && window.MESAHA_VERSION.version) || 'v194';
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
    safe(function(){ document.title = 'v2.23'; });
    safe(function(){
      document.querySelectorAll('.app-brand-v143 .brand-copy-v143,[data-app-version-short],[data-app-version-build]').forEach(function(el){
        if(!el) return;
        if(/Mesaha\s*İ?O/i.test(el.textContent || '')) el.textContent = el.matches('[data-app-version-build], .app-brand-v143 .brand-copy-v143 span') ? 'v194' : 'v2.23';
      });
      var h = document.querySelector('.app-brand-v143 .brand-copy-v143 h1'); if(h) h.textContent = 'v2.23';
      var s = document.querySelector('.app-brand-v143 .brand-copy-v143 span'); if(s) s.textContent = 'v194';
      var splashH = document.querySelector('.mesaha-startup-logo-v178 h2'); if(splashH) splashH.textContent = 'v2.23';
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
      if(typeof old !== 'function' || old.__v194CleanOpen) return;
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
      wrapped.__v194CleanOpen = true;
      wrapped.__v194Old = old;
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


/* v194: gerçek Giriş Modu inline form düzeltmesi
   Ürün Türü / Çap-Boy sırası artık temiz overlay değil, aktif kullanılan entryForm üzerinde düzeltilir. */
(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  function safe(fn){ try{return fn();}catch(e){ try{ console.warn('[Mesaha İO v194 inline fix]', e); }catch(_){} } }
  function q(sel, root){ return (root || document).querySelector(sel); }

  function forceInlineOrder(){
    safe(function(){
      var form = byId('entryForm');
      if(!form) return;
      form.classList.add('entry-form-v194-fixed');

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
        clearRow.classList.add('clear-row-v194');
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
      document.body.classList.add('inline-simple-v119','mesaha-v194-edit-entry');
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
      if(typeof old !== 'function' || old.__v194InlineEdit) return;
      var wrapped = function(id){
        var result = old.apply(this, arguments);
        setTimeout(openInlineEntry, 40);
        setTimeout(openInlineEntry, 180);
        return result;
      };
      wrapped.__v194InlineEdit = true;
      wrapped.__v194Old = old;
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
