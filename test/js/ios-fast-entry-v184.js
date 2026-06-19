(function(){
  'use strict';
  var TAG = 'v184-fast-entry';
  var saveTimer = null;
  var focusTimer = null;
  var recentTouch = 0;
  function byId(id){ return document.getElementById(id); }
  function safe(fn, fallback){ try{ return fn(); }catch(e){ try{ console.warn('[Mesaha İO '+TAG+']', e); }catch(_){} return fallback; } }
  function normalizeProductTypeFast(type){
    var t = String(type || '').trim().toLocaleLowerCase('tr-TR');
    if(t === 'maden' || t === 'maden direk' || t === 'maden direği' || t === 'maden diregi') return 'Maden Direk';
    if(t === 'kağıtlık' || t === 'kagitlik' || t === 'kağıtlık odun' || t === 'kagitlik odun') return 'Kağıtlık';
    if(t === 'sanayi' || t === 'sanayi odunu') return 'Sanayi Odunu';
    if(t === 'tel' || t === 'tel direk' || t === 'tel direği' || t === 'tel diregi') return 'Tel Direk';
    return 'Tomruk';
  }
  function productClass(type){
    type = normalizeProductTypeFast(type);
    if(type === 'Maden Direk') return 'maden';
    if(type === 'Kağıtlık') return 'kagit';
    if(type === 'Sanayi Odunu') return 'sanayi';
    if(type === 'Tel Direk') return 'tel';
    return 'tomruk';
  }
  function focusDiameter(){
    clearTimeout(focusTimer);
    focusTimer = setTimeout(function(){
      var el = byId('diameter') || byId('cleanDiameterV111');
      if(el && document.activeElement !== el){ try{ el.focus({preventScroll:true}); }catch(_){ try{ el.focus(); }catch(__){} } }
    }, 35);
  }
  function deferSave(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function(){ safe(function(){ if(typeof saveSettings === 'function') saveSettings(); }); }, 450);
  }
  function applyProduct(type, persist){
    type = normalizeProductTypeFast(type);
    safe(function(){
      if(typeof state !== 'undefined' && state.settings){
        state.settings.lastProductType = type;
        if(Array.isArray(state.settings.visibleProducts) && state.settings.visibleProducts.indexOf(type) < 0) state.settings.visibleProducts.push(type);
      }
    });
    safe(function(){ if(typeof els !== 'undefined' && els && els.productType) els.productType.value = type; });
    var hidden = byId('productType'); if(hidden) hidden.value = type;
    document.body.classList.remove('product-tomruk','product-maden','product-kagit','product-sanayi','product-tel');
    document.body.classList.add('product-' + productClass(type));
    var sel = '[data-product], [data-clean-product]';
    document.querySelectorAll(sel).forEach(function(el){
      var val = el.getAttribute('data-product') || el.getAttribute('data-clean-product') || '';
      el.classList.toggle('active', normalizeProductTypeFast(val) === type);
    });
    safe(function(){ if(typeof updateProductRuleHint === 'function') setTimeout(updateProductRuleHint, 60); });
    safe(function(){ if(typeof renderCleanAutoV111 === 'function' && document.body.classList.contains('clean-simple-open-v111')) setTimeout(renderCleanAutoV111, 60); });
    if(persist !== false) deferSave();
    focusDiameter();
    return type;
  }
  function patchSetProduct(){
    safe(function(){
      if(typeof setProductType !== 'function' || setProductType.__v184Fast) return;
      var old = setProductType;
      setProductType = function(type, persist){
        return applyProduct(type, persist);
      };
      setProductType.__v184Fast = true;
      setProductType.__old = old;
    });
  }
  function handleProductEvent(ev){
    var target = ev.target && ev.target.closest ? ev.target.closest('[data-product], [data-clean-product]') : null;
    if(!target) return;
    var now = Date.now();
    if(ev.type === 'click' && now - recentTouch < 550){ ev.preventDefault(); ev.stopImmediatePropagation(); return; }
    var product = target.getAttribute('data-product') || target.getAttribute('data-clean-product');
    if(!product) return;
    recentTouch = now;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    applyProduct(product, true);
  }
  function patchSaveRecordsFast(){
    safe(function(){
      if(typeof saveRecords !== 'function' || saveRecords.__v184FastIdb) return;
      var IDB_NAME = 'mesaha_io_stabil_v152', STORE = 'kv', KEY = 'records', MARKER = 'mesaha_records_indexeddb_marker_v152';
      var timer = null;
      function openDb(){ return new Promise(function(resolve, reject){ var req = indexedDB.open(IDB_NAME, 1); req.onupgradeneeded = function(){ try{ req.result.createObjectStore(STORE); }catch(_){} }; req.onsuccess = function(){ resolve(req.result); }; req.onerror = function(){ reject(req.error); }; }); }
      function put(records){ return openDb().then(function(db){ return new Promise(function(resolve, reject){ var tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(records, KEY); tx.oncomplete=function(){ try{db.close();}catch(_){} resolve(true); }; tx.onerror=function(){ try{db.close();}catch(_){} reject(tx.error); }; }); }); }
      saveRecords = function(){
        var records = safe(function(){ return Array.isArray(state.records) ? state.records.slice() : []; }, []);
        clearTimeout(timer);
        timer = setTimeout(function(){ put(records).catch(function(){
          try{ if(typeof STORAGE_KEY !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }catch(_){}
        }); }, 40);
        try{ localStorage.setItem(MARKER, '1'); if(typeof STORAGE_KEY !== 'undefined' && records.length > 5) localStorage.removeItem(STORAGE_KEY); }catch(_){}
      };
      saveRecords.__v184FastIdb = true;
    });
  }
  function patchForceUpdateButtons(){
    function bind(id){
      var btn = byId(id); if(!btn || btn.__v184UpdateBound) return;
      btn.__v184UpdateBound = true;
      btn.addEventListener('click', function(ev){
        ev.preventDefault(); ev.stopPropagation();
        if(window.mesahaAutoUpdateCheck) window.mesahaAutoUpdateCheck('manual-'+id, true);
        else location.reload();
      }, true);
    }
    bind('userMenuForceUpdateBtn'); bind('guideForceUpdateBtn'); bind('startupClearCacheBtnV178');
  }
  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  ready(function(){
    patchSetProduct();
    patchSaveRecordsFast();
    patchForceUpdateButtons();
    document.addEventListener('touchstart', handleProductEvent, {capture:true, passive:false});
    document.addEventListener('pointerdown', handleProductEvent, {capture:true, passive:false});
    document.addEventListener('click', handleProductEvent, true);
    setTimeout(patchSetProduct, 500);
    setTimeout(patchSaveRecordsFast, 700);
  });
  window.mesahaFastProductSetV184 = applyProduct;
})();
