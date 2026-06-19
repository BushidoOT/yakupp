(function(){
  'use strict';
  var TAG = 'v186-ios-ultra';
  var IDB_NAME = 'mesaha_io_stabil_v152';
  var IDB_STORE = 'kv';
  var IDB_RECORDS_KEY = 'records';
  var IDB_SETTINGS_KEY = 'settings';
  var IDB_MARKER_KEY = 'mesaha_records_indexeddb_marker_v152';
  var idbTimer = null;
  var settingsTimer = null;
  var renderDirty = false;
  var summaryDirty = false;
  var duplicateTimer = null;
  var focusTimer = null;
  var lastProduct = { key:'', t:0 };
  var productBound = false;
  var cleanSaveBound = false;
  var saveQueuedSnapshot = null;
  var nativeReduce = Array.prototype.reduce;
  var nativeUnshift = Array.prototype.unshift;
  var nativePush = Array.prototype.push;
  var nativeSplice = Array.prototype.splice;
  var nativePop = Array.prototype.pop;
  var nativeShift = Array.prototype.shift;

  function byId(id){ return document.getElementById(id); }
  function safe(fn, fallback){ try{ return fn(); }catch(e){ try{ console.warn('[Mesaha İO '+TAG+']', e); }catch(_){} return fallback; } }
  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function isCleanOpen(){ return !!(document.body && document.body.classList.contains('clean-simple-open-v111')); }
  function isInlineOpen(){ return !!(document.body && document.body.classList.contains('inline-simple-v119')); }
  function isFastEntry(){ return isCleanOpen() || isInlineOpen(); }
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
    settingsTimer = setTimeout(function(){ safe(function(){ if(typeof saveSettings === 'function') saveSettings(); }); }, delay || 650);
  }
  function focusDiaLite(){
    clearTimeout(focusTimer);
    focusTimer = setTimeout(function(){
      var el = isCleanOpen() ? (byId('cleanDiameterV111') || byId('diameter')) : byId('diameter');
      if(!el) return;
      try{ if(document.activeElement !== el) el.focus({preventScroll:true}); }catch(_){ try{ el.focus(); }catch(__){} }
    }, 25);
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
    if(persist !== false) scheduleSettingsSave(750);
    focusDiaLite();
    return type;
  }
  function patchProduct(){
    safe(function(){
      if(typeof setProductType === 'function' && !setProductType.__v186Lite){
        var old = setProductType;
        setProductType = function(type, persist){ return setProductFast(type, persist); };
        setProductType.__v186Lite = true;
        setProductType.__old = old;
      }
      if(typeof focusDiameterKeepKeyboard === 'function' && !focusDiameterKeepKeyboard.__v186Lite){
        focusDiameterKeepKeyboard = function(){ focusDiaLite(); };
        focusDiameterKeepKeyboard.__v186Lite = true;
      }
    });
    if(productBound) return;
    productBound = true;
    function handler(ev){
      var t = ev.target && ev.target.closest ? ev.target.closest('[data-product], [data-clean-product], .product-box, .clean-product-v111') : null;
      if(!t) return;
      var val = t.getAttribute('data-product') || t.getAttribute('data-clean-product') || '';
      if(!val) return;
      var key = normalizeProductFast(val);
      var now = Date.now();
      if(key === lastProduct.key && now - lastProduct.t < 320){ ev.preventDefault(); ev.stopImmediatePropagation(); return; }
      lastProduct = { key:key, t:now };
      ev.preventDefault();
      ev.stopImmediatePropagation();
      setProductFast(key, true);
    }
    ['pointerdown','touchstart','click'].forEach(function(evt){ document.addEventListener(evt, handler, {capture:true, passive:false}); });
  }
  function markRecordCacheDirty(){
    safe(function(){ if(typeof state !== 'undefined' && Array.isArray(state.records)) state.records.__v186CacheDirty = true; });
  }
  function computeRecordCache(arr){
    var qty = 0, desi = 0;
    for(var i=0;i<arr.length;i++){
      var r = arr[i] || {};
      qty += Number(r.quantity != null ? r.quantity : (r.adet || 0)) || 0;
      desi += Number(r.desi != null ? r.desi : 0) || 0;
    }
    arr.__v186CacheQty = qty;
    arr.__v186CacheDesi = desi;
    arr.__v186CacheLen = arr.length;
    arr.__v186CacheDirty = false;
    return arr.__v186Cache = { qty:qty, desi:desi, len:arr.length };
  }
  function cacheFor(arr){
    if(!arr || !Array.isArray(arr)) return {qty:0, desi:0, len:0};
    if(arr.__v186CacheDirty || arr.__v186CacheLen !== arr.length || !arr.__v186Cache) return computeRecordCache(arr);
    return arr.__v186Cache;
  }
  function callbackLooksLikeQty(fn){
    var s = '';
    try{ s = Function.prototype.toString.call(fn); }catch(_){}
    return s.indexOf('quantity') >= 0 || s.indexOf('adet') >= 0 || s.indexOf('qtyV145') >= 0 || s.indexOf('qty(') >= 0;
  }
  function callbackLooksLikeDesi(fn){
    var s = '';
    try{ s = Function.prototype.toString.call(fn); }catch(_){}
    return s.indexOf('desi') >= 0 || s.indexOf('hacim') >= 0 || s.indexOf('totalDesi') >= 0 || s.indexOf('desiV145') >= 0 || s.indexOf('desi(') >= 0;
  }
  function patchRecordArray(){
    safe(function(){
      if(typeof state === 'undefined' || !Array.isArray(state.records)) return;
      if(typeof window !== 'undefined' && !window.state) window.state = state;
      var arr = state.records;
      if(!arr.__v186ArrayPatched){
        Object.defineProperty(arr, 'reduce', { configurable:true, writable:true, value:function(cb, initial){
          if(arguments.length >= 2 && Number(initial) === 0){
            if(callbackLooksLikeQty(cb)) return cacheFor(this).qty;
            if(callbackLooksLikeDesi(cb)) return cacheFor(this).desi;
          }
          return nativeReduce.apply(this, arguments);
        }});
        Object.defineProperty(arr, 'unshift', { configurable:true, writable:true, value:function(){ var res = nativeUnshift.apply(this, arguments); if(this.__v186Cache && !this.__v186CacheDirty){ for(var i=0;i<arguments.length;i++){ var r=arguments[i]||{}; this.__v186Cache.qty += Number(r.quantity != null ? r.quantity : (r.adet || 0)) || 0; this.__v186Cache.desi += Number(r.desi != null ? r.desi : 0) || 0; } this.__v186Cache.len = this.__v186CacheLen = this.length; this.__v186CacheQty = this.__v186Cache.qty; this.__v186CacheDesi = this.__v186Cache.desi; } else { this.__v186CacheDirty = true; } return res; }});
        Object.defineProperty(arr, 'push', { configurable:true, writable:true, value:function(){ var res = nativePush.apply(this, arguments); if(this.__v186Cache && !this.__v186CacheDirty){ for(var i=0;i<arguments.length;i++){ var r=arguments[i]||{}; this.__v186Cache.qty += Number(r.quantity != null ? r.quantity : (r.adet || 0)) || 0; this.__v186Cache.desi += Number(r.desi != null ? r.desi : 0) || 0; } this.__v186Cache.len = this.__v186CacheLen = this.length; this.__v186CacheQty = this.__v186Cache.qty; this.__v186CacheDesi = this.__v186Cache.desi; } else { this.__v186CacheDirty = true; } return res; }});
        Object.defineProperty(arr, 'splice', { configurable:true, writable:true, value:function(){ this.__v186CacheDirty = true; return nativeSplice.apply(this, arguments); }});
        Object.defineProperty(arr, 'pop', { configurable:true, writable:true, value:function(){ this.__v186CacheDirty = true; return nativePop.apply(this, arguments); }});
        Object.defineProperty(arr, 'shift', { configurable:true, writable:true, value:function(){ this.__v186CacheDirty = true; return nativeShift.apply(this, arguments); }});
        arr.__v186ArrayPatched = true;
        arr.__v186CacheDirty = true;
      }
    });
  }
  function patchStorage(){
    safe(function(){
      if(typeof saveRecords !== 'function' || saveRecords.__v186Lite) return;
      var oldSave = saveRecords;
      saveRecords = function(){
        if(!isFastEntry()) markRecordCacheDirty();
        patchRecordArray();
        var delay = isFastEntry() ? 120 : 45;
        clearTimeout(idbTimer);
        saveQueuedSnapshot = null;
        idbTimer = setTimeout(function(){
          var snapshot = safe(function(){ return Array.isArray(state.records) ? state.records.slice() : []; }, []);
          saveQueuedSnapshot = snapshot;
          idbPut(IDB_RECORDS_KEY, snapshot).catch(function(){ try{ if(snapshot.length <= 5 && typeof STORAGE_KEY !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); }catch(_){} });
          safe(function(){ if(typeof state !== 'undefined' && state.settings) idbPut(IDB_SETTINGS_KEY, state.settings).catch(function(){}); });
        }, delay);
        try{ localStorage.setItem(IDB_MARKER_KEY, '1'); if(typeof STORAGE_KEY !== 'undefined') localStorage.removeItem(STORAGE_KEY); }catch(_){}
      };
      saveRecords.__v186Lite = true;
      saveRecords.__old = oldSave;
    });
  }
  function flushStorageNow(){
    safe(function(){
      clearTimeout(idbTimer);
      var snapshot = Array.isArray(state.records) ? state.records.slice() : [];
      idbPut(IDB_RECORDS_KEY, snapshot).catch(function(){});
      if(state.settings) idbPut(IDB_SETTINGS_KEY, state.settings).catch(function(){});
    });
  }
  function flushHeavySoon(reason){
    if(isFastEntry()) return;
    if(renderDirty){ renderDirty = false; safe(function(){ if(typeof render === 'function') render(); }); }
    if(summaryDirty){ summaryDirty = false; safe(function(){ if(typeof forceRefreshSummaryCards === 'function') forceRefreshSummaryCards(); }); }
    safe(function(){ if(typeof renderCleanRecentV111 === 'function') renderCleanRecentV111(); });
  }
  function patchHeavyRender(){
    safe(function(){
      if(typeof render === 'function' && !render.__v186Lite){
        var oldRender = render;
        render = function(){
          if(isFastEntry()) { renderDirty = true; return; }
          return oldRender.apply(null, arguments);
        };
        render.__v186Lite = true;
        render.__old = oldRender;
      }
      if(typeof forceRefreshSummaryCards === 'function' && !forceRefreshSummaryCards.__v186Lite){
        var oldSummary = forceRefreshSummaryCards;
        forceRefreshSummaryCards = function(){
          if(isFastEntry()) { summaryDirty = true; return; }
          return oldSummary.apply(null, arguments);
        };
        forceRefreshSummaryCards.__v186Lite = true;
        forceRefreshSummaryCards.__old = oldSummary;
      }
      if(typeof renderMobileRecordsV111 === 'function' && !renderMobileRecordsV111.__v186Lite){
        var oldMobile = renderMobileRecordsV111;
        renderMobileRecordsV111 = function(){ if(isFastEntry()) return; return oldMobile.apply(null, arguments); };
        renderMobileRecordsV111.__v186Lite = true;
      }
    });
  }
  function patchDuplicateAndBackup(){
    safe(function(){
      if(typeof updateDuplicateWarning === 'function' && !updateDuplicateWarning.__v186Lite){
        var oldDup = updateDuplicateWarning;
        updateDuplicateWarning = function(){
          if(isFastEntry()) return;
          clearTimeout(duplicateTimer);
          duplicateTimer = setTimeout(function(){ safe(function(){ oldDup(); }); }, 180);
        };
        updateDuplicateWarning.__v186Lite = true;
        updateDuplicateWarning.__old = oldDup;
      }
      if(typeof maybeShowBackupReminder === 'function' && !maybeShowBackupReminder.__v186Lite){
        var oldReminder = maybeShowBackupReminder;
        maybeShowBackupReminder = function(){
          var totalAdet = safe(function(){ return cacheFor(state.records).qty; }, 0) || 0;
          var reminderPoint = Math.floor(totalAdet / 200) * 200;
          if(reminderPoint < 200) return;
          if(Number(state.settings && state.settings.lastBackupReminderCount || 0) >= reminderPoint) return;
          state.settings.lastBackupReminderCount = reminderPoint;
          scheduleSettingsSave(900);
          setTimeout(function(){ safe(function(){ if(typeof showErrorToast === 'function') showErrorToast(reminderPoint.toLocaleString('tr-TR') + ' adet/ağaç girildi. Yedek almayı unutmayın.'); }); }, 900);
        };
        maybeShowBackupReminder.__v186Lite = true;
        maybeShowBackupReminder.__old = oldReminder;
      }
    });
  }
  function patchInputLag(){
    if(document.__mesahaInputLagV186) return;
    document.__mesahaInputLagV186 = true;
    function debouncedSettings(){ scheduleSettingsSave(650); }
    function debouncedDuplicate(){ clearTimeout(duplicateTimer); duplicateTimer = setTimeout(function(){ safe(function(){ if(typeof updateDuplicateWarning === 'function') updateDuplicateWarning(); }); }, 260); }
    function intercept(id, mode){
      var el = byId(id); if(!el || el.__v186InputLite) return;
      el.__v186InputLite = true;
      ['input','change'].forEach(function(evt){
        el.addEventListener(evt, function(ev){
          if(ev && ev.isTrusted){
            ev.stopImmediatePropagation();
            if(mode === 'diameter') safe(function(){ if(typeof limitDiameterToTwoDigits === 'function') limitDiameterToTwoDigits(); if(typeof updateLiveDesi === 'function') updateLiveDesi(); });
            if(mode === 'light') { safe(function(){ if(typeof updateLiveDesi === 'function') updateLiveDesi(); }); debouncedSettings(); }
            if(mode === 'barcode') { debouncedSettings(); if(!isFastEntry()) debouncedDuplicate(); }
            if(mode === 'settings') debouncedSettings();
            if(mode === 'clean') { /* Giriş Modu inputu: localStorage ve kayıt listesi tetikleme yok. */ }
          }
        }, true);
      });
    }
    intercept('length', 'light');
    intercept('quantity', 'light');
    intercept('barcode', 'barcode');
    intercept('productionDate', 'settings');
    intercept('bolmeNo', 'settings');
    intercept('seflik', 'settings');
    intercept('ekipNot', 'settings');
    intercept('diameter', 'diameter');
    intercept('cleanLengthV111', 'clean');
    intercept('cleanDiameterV111', 'clean');
  }
  function updateCleanRecentLite(){
    safe(function(){ if(typeof renderCleanRecentV111 === 'function') renderCleanRecentV111(); });
    safe(function(){ if(typeof renderCleanAutoV111 === 'function') renderCleanAutoV111(); });
    safe(function(){ if(typeof renderCleanChipsV111 === 'function') renderCleanChipsV111(); });
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
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      var len = byId('cleanLengthV111');
      var dia = byId('cleanDiameterV111');
      var boy = String(len && len.value || '').trim();
      var cap = String(dia && dia.value || '').trim().replace(/\D/g, '');
      if(dia && dia.value !== cap) dia.value = cap;
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
        var form = byId('entryForm') || byId('recordForm') || (typeof els !== 'undefined' && els.form);
        var submit = byId('submitBtn') || (typeof els !== 'undefined' && els.submitBtn);
        if(form && form.requestSubmit) form.requestSubmit(submit || undefined);
        else if(form) form.dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
        else if(submit) submit.click();
      });
      setTimeout(function(){
        patchRecordArray();
        var after = safe(function(){ return Array.isArray(state.records) ? state.records.length : before; }, before);
        if(after > before){
          if(dia) dia.value = '';
          if(mainDia) mainDia.value = '';
          if(len) len.value = boy;
          if(mainLen) mainLen.value = boy;
        }
        updateCleanRecentLite();
        focusDiaLite();
      }, 45);
    }, true);
  }
  function patchAutoUpdateQuiet(){
    safe(function(){
      if(typeof window.mesahaAutoUpdateCheck === 'function' && !window.mesahaAutoUpdateCheck.__v186Lite){
        var old = window.mesahaAutoUpdateCheck;
        window.mesahaAutoUpdateCheck = function(reason, manual){
          if(isFastEntry() && !manual) return Promise.resolve(false);
          return old.call(this, reason, manual);
        };
        window.mesahaAutoUpdateCheck.__v186Lite = true;
      }
    });
  }
  function applyVersionSmall(){
    safe(function(){ if(typeof MESAHA_APPLY_VERSION === 'function') MESAHA_APPLY_VERSION(); });
    var h = document.querySelector('.app-brand-v143 .brand-copy-v143 h1');
    var s = document.querySelector('.app-brand-v143 .brand-copy-v143 span');
    if(h){ h.textContent = (window.MESAHA_VERSION && window.MESAHA_VERSION.shortVersion) || 'v2.15'; h.setAttribute('data-app-version-short',''); }
    if(s){ s.textContent = (window.MESAHA_VERSION && window.MESAHA_VERSION.version) || 'v186'; s.setAttribute('data-app-version-build',''); }
  }
  function bindFlushTriggers(){
    if(document.__v186FlushTriggers) return;
    document.__v186FlushTriggers = true;
    var lastFast = isFastEntry();
    if(window.MutationObserver && document.body){
      new MutationObserver(function(){
        var nowFast = isFastEntry();
        if(lastFast && !nowFast) setTimeout(function(){ flushHeavySoon('exit-fast'); }, 80);
        lastFast = nowFast;
      }).observe(document.body, {attributes:true, attributeFilter:['class']});
    }
    document.addEventListener('click', function(ev){
      if(ev.target && ev.target.closest && ev.target.closest('#navRecords,[data-flow-tab="records"],#exportSystemXlsBtn,#printBtn')){
        setTimeout(function(){ flushHeavySoon('records'); }, 80);
      }
    }, true);
    document.addEventListener('visibilitychange', function(){ if(document.visibilityState === 'hidden') flushStorageNow(); });
    window.addEventListener('pagehide', flushStorageNow);
  }
  function boot(){
    patchRecordArray();
    safe(function(){ if(typeof state !== 'undefined' && Array.isArray(state.records)) cacheFor(state.records); });
    patchProduct();
    patchStorage();
    patchHeavyRender();
    patchDuplicateAndBackup();
    patchInputLag();
    patchCleanSave();
    patchAutoUpdateQuiet();
    bindFlushTriggers();
    applyVersionSmall();
    document.body.classList.add('ios-ultra-lite-v186');
  }
  ready(boot);
  [60, 180, 420, 900, 1800, 3500].forEach(function(ms){ setTimeout(boot, ms); });
  setInterval(function(){ patchRecordArray(); patchCleanSave(); }, 1600);
  window.addEventListener('pageshow', function(){ setTimeout(boot, 80); });
  window.mesahaUltraEntryV186 = { setProduct:setProductFast, boot:boot, flush:flushHeavySoon };
})();
