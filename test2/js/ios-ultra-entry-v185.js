(function(){
  'use strict';
  var TAG = 'v185-ios-ultra';
  var IDB_NAME = 'mesaha_io_stabil_v152';
  var IDB_STORE = 'kv';
  var IDB_RECORDS_KEY = 'records';
  var IDB_SETTINGS_KEY = 'settings';
  var IDB_MARKER_KEY = 'mesaha_records_indexeddb_marker_v152';
  var idbTimer = null;
  var settingsTimer = null;
  var renderTimer = null;
  var summaryTimer = null;
  var focusTimer = null;
  var lastProductHit = 0;
  var productBound = false;
  var cleanSaveBound = false;

  function byId(id){ return document.getElementById(id); }
  function safe(fn, fallback){ try{ return fn(); }catch(e){ try{ console.warn('[Mesaha İO '+TAG+']', e); }catch(_){} return fallback; } }
  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function isCleanOpen(){ return document.body && document.body.classList.contains('clean-simple-open-v111'); }
  function esc(v){
    if(typeof escapeHtml === 'function') return escapeHtml(v);
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]; });
  }
  function normalizeProductFast(type){
    var t = String(type || '').trim();
    var l = t.toLocaleLowerCase('tr-TR');
    if(l === 'maden' || l === 'maden direk' || l === 'maden direği' || l === 'maden diregi') return 'Maden Direk';
    if(l === 'kağıtlık' || l === 'kagitlik' || l === 'kağıtlık odun' || l === 'kagitlik odun') return 'Kağıtlık';
    if(l === 'sanayi' || l === 'sanayi odunu') return 'Sanayi Odunu';
    if(l === 'tel' || l === 'tel direk' || l === 'tel direği' || l === 'tel diregi') return 'Tel Direk';
    return 'Tomruk';
  }
  function productClass(type){
    type = normalizeProductFast(type);
    if(type === 'Maden Direk') return 'maden';
    if(type === 'Kağıtlık') return 'kagit';
    if(type === 'Sanayi Odunu') return 'sanayi';
    if(type === 'Tel Direk') return 'tel';
    return 'tomruk';
  }
  function productText(type){
    type = normalizeProductFast(type);
    if(type === 'Maden Direk') return 'Maden direği: çap 20 cm ve altı olmalı.';
    if(type === 'Kağıtlık') return 'Kağıtlık odun: ölçüyü girip kaydediniz.';
    if(type === 'Sanayi Odunu') return 'Sanayi odunu: çap 12 cm ve üzeri, boy 0,50 - 1,45 m olmalı.';
    if(type === 'Tel Direk') return 'Tel direği: çap 12-40 cm, boy 6,50 - 25 m olmalı.';
    return 'Tomruk: çap 21 cm ve üzeri olmalı.';
  }
  function openDb(){
    return new Promise(function(resolve, reject){
      try{
        var req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = function(){ try{ if(!req.result.objectStoreNames.contains(IDB_STORE)) req.result.createObjectStore(IDB_STORE); }catch(_){} };
        req.onsuccess = function(){ resolve(req.result); };
        req.onerror = function(){ reject(req.error || new Error('IndexedDB açılamadı')); };
      }catch(e){ reject(e); }
    });
  }
  function idbPut(key, value){
    return openDb().then(function(db){
      return new Promise(function(resolve, reject){
        var tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(value, key);
        tx.oncomplete = function(){ try{ db.close(); }catch(_){} resolve(true); };
        tx.onerror = function(){ try{ db.close(); }catch(_){} reject(tx.error || new Error('IndexedDB yazma hatası')); };
      });
    });
  }
  function scheduleSettingsSave(delay){
    clearTimeout(settingsTimer);
    settingsTimer = setTimeout(function(){ safe(function(){ if(typeof saveSettings === 'function') saveSettings(); }); }, delay || 700);
  }
  function focusDiaLite(){
    clearTimeout(focusTimer);
    focusTimer = setTimeout(function(){
      var el = isCleanOpen() ? (byId('cleanDiameterV111') || byId('diameter')) : byId('diameter');
      if(!el) return;
      try{ if(document.activeElement !== el) el.focus({preventScroll:true}); }catch(_){ try{ el.focus(); }catch(__){} }
    }, 45);
  }
  function setProductFast(type, persist){
    type = normalizeProductFast(type);
    safe(function(){ if(typeof state !== 'undefined' && state.settings){ state.settings.lastProductType = type; if(Array.isArray(state.settings.visibleProducts) && state.settings.visibleProducts.indexOf(type) < 0) state.settings.visibleProducts.push(type); } });
    safe(function(){ if(typeof els !== 'undefined' && els.productType) els.productType.value = type; });
    var productType = byId('productType'); if(productType) productType.value = type;
    document.body.classList.remove('product-tomruk','product-maden','product-kagit','product-sanayi','product-tel');
    document.body.classList.add('product-' + productClass(type));
    document.querySelectorAll('[data-product], [data-clean-product], .product-box, .clean-product-v111').forEach(function(el){
      var val = el.getAttribute('data-product') || el.getAttribute('data-clean-product') || '';
      if(val) el.classList.toggle('active', normalizeProductFast(val) === type);
    });
    var hint = byId('productRuleHint'); if(hint) hint.textContent = productText(type);
    if(isCleanOpen()) safe(function(){ if(typeof renderCleanAutoV111 === 'function') renderCleanAutoV111(); });
    if(persist !== false) scheduleSettingsSave(850);
    focusDiaLite();
    return type;
  }
  function patchProduct(){
    safe(function(){
      if(typeof setProductType === 'function' && !setProductType.__v185Lite){
        var old = setProductType;
        setProductType = function(type, persist){ return setProductFast(type, persist); };
        setProductType.__v185Lite = true;
        setProductType.__old = old;
      }
      if(typeof focusDiameterKeepKeyboard === 'function' && !focusDiameterKeepKeyboard.__v185Lite){
        focusDiameterKeepKeyboard = function(){ focusDiaLite(); };
        focusDiameterKeepKeyboard.__v185Lite = true;
      }
    });
    if(productBound) return;
    productBound = true;
    function handler(ev){
      var t = ev.target && ev.target.closest ? ev.target.closest('[data-product], [data-clean-product], .product-box, .clean-product-v111') : null;
      if(!t) return;
      var val = t.getAttribute('data-product') || t.getAttribute('data-clean-product') || '';
      if(!val) return;
      var now = Date.now();
      if(ev.type === 'click' && now - lastProductHit < 700){ ev.preventDefault(); ev.stopImmediatePropagation(); return; }
      lastProductHit = now;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      setProductFast(val, true);
    }
    ['pointerdown','touchstart','click'].forEach(function(evt){
      document.addEventListener(evt, handler, {capture:true, passive:false});
    });
  }
  function patchStorage(){
    safe(function(){
      if(typeof saveRecords !== 'function' || saveRecords.__v185Lite) return;
      var oldSave = saveRecords;
      saveRecords = function(){
        var snapshot = safe(function(){ return Array.isArray(state.records) ? state.records.slice() : []; }, []);
        clearTimeout(idbTimer);
        idbTimer = setTimeout(function(){
          idbPut(IDB_RECORDS_KEY, snapshot).catch(function(){
            // Son çare: çok küçük listede localStorage'a yaz. Büyük listede iOS'u kilitlememek için yazma.
            try{ if(snapshot.length <= 5 && typeof STORAGE_KEY !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); }catch(_){}
          });
          safe(function(){ if(typeof state !== 'undefined' && state.settings) idbPut(IDB_SETTINGS_KEY, state.settings).catch(function(){}); });
        }, 45);
        try{ localStorage.setItem(IDB_MARKER_KEY, '1'); if(typeof STORAGE_KEY !== 'undefined') localStorage.removeItem(STORAGE_KEY); }catch(_){}
      };
      saveRecords.__v185Lite = true;
      saveRecords.__old = oldSave;
    });
  }
  function patchHeavyRender(){
    safe(function(){
      if(typeof render === 'function' && !render.__v185Lite){
        var oldRender = render;
        render = function(){
          var args = arguments;
          if(isCleanOpen()){
            clearTimeout(renderTimer);
            renderTimer = setTimeout(function(){ safe(function(){ oldRender.apply(null, args); }); }, 1600);
            return;
          }
          var active = document.activeElement;
          var id = active && active.id ? active.id : '';
          if(/^(diameter|length|quantity|barcode|cleanDiameterV111|cleanLengthV111)$/.test(id)){
            clearTimeout(renderTimer);
            renderTimer = setTimeout(function(){ safe(function(){ oldRender.apply(null, args); }); }, 420);
            return;
          }
          return oldRender.apply(null, args);
        };
        render.__v185Lite = true;
      }
      if(typeof forceRefreshSummaryCards === 'function' && !forceRefreshSummaryCards.__v185Lite){
        var oldSummary = forceRefreshSummaryCards;
        forceRefreshSummaryCards = function(){
          if(isCleanOpen()){
            clearTimeout(summaryTimer);
            summaryTimer = setTimeout(function(){ safe(function(){ oldSummary(); }); }, 1800);
            return;
          }
          clearTimeout(summaryTimer);
          summaryTimer = setTimeout(function(){ safe(function(){ oldSummary(); }); }, 250);
        };
        forceRefreshSummaryCards.__v185Lite = true;
      }
      if(typeof renderMobileRecordsV111 === 'function' && !renderMobileRecordsV111.__v185Lite){
        var oldMobile = renderMobileRecordsV111;
        renderMobileRecordsV111 = function(){
          if(isCleanOpen()) return;
          return oldMobile.apply(null, arguments);
        };
        renderMobileRecordsV111.__v185Lite = true;
      }
    });
  }
  function updateCleanRecentLite(){
    safe(function(){ if(typeof renderCleanRecentV111 === 'function') renderCleanRecentV111(); });
    safe(function(){ if(typeof renderCleanAutoV111 === 'function') renderCleanAutoV111(); });
  }
  function patchCleanSave(){
    var btn = byId('cleanSaveV111');
    if(!btn || cleanSaveBound) return;
    cleanSaveBound = true;
    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      var len = byId('cleanLengthV111');
      var dia = byId('cleanDiameterV111');
      var boy = String(len && len.value || '').trim();
      var cap = String(dia && dia.value || '').trim();
      if(!boy || !cap){
        safe(function(){ if(typeof showToast === 'function') showToast('Boy ve çap giriniz.'); });
        try{ (!boy ? len : dia).focus({preventScroll:true}); }catch(_){}
        return;
      }
      var before = safe(function(){ return Array.isArray(state.records) ? state.records.length : 0; }, 0);
      try{ localStorage.setItem('mesaha_simple_last_length_v1', boy); }catch(_){}
      var mainLen = byId('length'); if(mainLen) mainLen.value = boy;
      var mainDia = byId('diameter'); if(mainDia) mainDia.value = cap;
      var active = document.querySelector('#cleanProductGridV111 .clean-product-v111.active');
      var selected = active ? active.getAttribute('data-clean-product') : (byId('productType') && byId('productType').value) || 'Tomruk';
      setProductFast(selected, true);
      safe(function(){
        var form = byId('recordForm') || (typeof els !== 'undefined' && els.form);
        var submit = byId('submitBtn') || (typeof els !== 'undefined' && els.submitBtn);
        if(form && form.requestSubmit) form.requestSubmit(submit || undefined);
        else if(form) form.dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
        else if(submit) submit.click();
      });
      setTimeout(function(){
        var after = safe(function(){ return Array.isArray(state.records) ? state.records.length : before; }, before);
        if(after > before){
          if(dia) dia.value = '';
          if(mainDia) mainDia.value = '';
          if(len) len.value = boy;
          if(mainLen) mainLen.value = boy;
        }
        updateCleanRecentLite();
        focusDiaLite();
      }, 35);
    }, true);
  }
  function patchAutoUpdateQuiet(){
    // Kayıt girerken güncelleme kontrolü çalışmasın; giriş modu kapanınca devam etsin.
    safe(function(){
      if(typeof window.mesahaAutoUpdateCheck === 'function' && !window.mesahaAutoUpdateCheck.__v185Lite){
        var old = window.mesahaAutoUpdateCheck;
        window.mesahaAutoUpdateCheck = function(reason, manual){
          if(isCleanOpen() && !manual) return Promise.resolve(false);
          return old.call(this, reason, manual);
        };
        window.mesahaAutoUpdateCheck.__v185Lite = true;
      }
    });
  }
  function applyVersionSmall(){
    safe(function(){ if(typeof MESAHA_APPLY_VERSION === 'function') MESAHA_APPLY_VERSION(); });
    var h = document.querySelector('.app-brand-v143 .brand-copy-v143 h1');
    var s = document.querySelector('.app-brand-v143 .brand-copy-v143 span');
    if(h){ h.textContent = (window.MESAHA_VERSION && window.MESAHA_VERSION.shortVersion) || 'v2.14'; h.setAttribute('data-app-version-short',''); }
    if(s){ s.textContent = (window.MESAHA_VERSION && window.MESAHA_VERSION.version) || 'v185'; s.setAttribute('data-app-version-build',''); }
  }
  function boot(){
    patchProduct();
    patchStorage();
    patchHeavyRender();
    patchCleanSave();
    patchAutoUpdateQuiet();
    applyVersionSmall();
    document.body.classList.add('ios-ultra-lite-v185');
  }
  ready(boot);
  [80, 300, 900, 1800, 3500].forEach(function(ms){ setTimeout(boot, ms); });
  window.addEventListener('pageshow', function(){ setTimeout(boot, 80); });
  window.mesahaUltraEntryV185 = { setProduct:setProductFast, boot:boot };
})();
