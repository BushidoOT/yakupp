/* Mesaha İO V4.04 / build 419 — DETAYLI LOG TEST BLOĞU
   YAYIN ÖNCESİ KALDIRILACAK DOSYA.
   Amaç: iOS/Android kayıt akışında dokunuş kaynağı, klavye/viewport, değer okuma,
   saveEntry çağrıları ve render/Firebase gecikmelerini daha ayrıntılı yakalamak. */
(function(){
  'use strict';
  if(window.__mesahaDeepDebugV419) return;
  window.__mesahaDeepDebugV419 = true;

  var BUILD = 419;
  var VERSION = 'V4.04';
  var CODE = 'v419_detayli_log_test';
  var FLOW_KEY = '__mesahaDeepSaveFlowV419';
  var SAVE_WRAP = '__mesahaDeepSaveWrappedV419';
  var STORAGE_WRAP = '__mesahaDeepStorageWrappedV419';
  var PERF_WRAP = '__mesahaDeepPerfStartedV419';
  var lastInputLog = {};
  var lastViewportLogAt = 0;
  var lastPointerFlow = null;
  var flowCounter = 0;

  function now(){ return Date.now(); }
  function q(id){ return document.getElementById(id); }
  function closest(el, sel){ try{return el && el.closest ? el.closest(sel) : null;}catch(e){return null;} }
  function hasEntry(){ var e=q('entryView'); return !!(e && e.classList && e.classList.contains('active')); }
  function dbg(level, area, msg, data){
    try{
      if(window.mesahaDebugLog && typeof window.mesahaDebugLog.add === 'function'){
        return window.mesahaDebugLog.add(level||'info', area||'deep-v419', msg||'', data||{});
      }
    }catch(e){}
  }
  function safe(v, max){
    v = String(v == null ? '' : v);
    max = max || 160;
    if(v.length > max) v = v.slice(0,max) + '…';
    return v;
  }
  function maskedBarcode(v){
    v = String(v || '').trim().toUpperCase();
    if(!v) return '';
    if(v.length <= 4) return '***' + v;
    return v.slice(0,2) + '***' + v.slice(-4);
  }
  function activeEl(){
    var el = document.activeElement;
    if(!el) return {};
    return {
      tag: (el.tagName||'').toLowerCase(),
      id: el.id || '',
      cls: safe(el.className||'',80),
      type: (el.getAttribute && el.getAttribute('type')) || ''
    };
  }
  function viewport(){
    var vv = window.visualViewport;
    return {
      scrollY: Math.round(window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0),
      inner: (window.innerWidth||0) + 'x' + (window.innerHeight||0),
      visual: vv ? Math.round(vv.width) + 'x' + Math.round(vv.height) : '',
      visualOffsetTop: vv ? Math.round(vv.offsetTop || 0) : 0,
      visualScale: vv ? Number(vv.scale || 1) : 1,
      keyboardLikely: vv ? ((window.innerHeight||0) - vv.height > 120) : false,
      pixelRatio: window.devicePixelRatio || 1
    };
  }
  function stateSnap(){
    var st = (window.state && window.state.settings) || {};
    var records = (window.state && Array.isArray(window.state.records)) ? window.state.records : [];
    return {
      barcode: maskedBarcode(q('barcodeInput') && q('barcodeInput').value),
      diameter: safe(q('diameterInput') && q('diameterInput').value, 20),
      length: safe(q('lengthInput') && q('lengthInput').value, 20),
      quantity: safe(q('quantityInput') && q('quantityInput').value, 20),
      product: st.currentProduct || '',
      tree: st.treeType || st.currentTree || st.activeTree || '',
      cutter: st.activeCutter ? 'seçili' : 'seçili değil',
      cutterName: safe(st.activeCutter || '', 80),
      editingId: window.state && window.state.editingId ? String(window.state.editingId) : '',
      recordCount: records.length,
      entryActive: hasEntry(),
      activeElement: activeEl(),
      viewport: viewport(),
      online: navigator.onLine !== false
    };
  }
  function eventInfo(ev){
    var t = ev && (ev.changedTouches && ev.changedTouches[0] || ev.touches && ev.touches[0] || ev);
    var target = ev && ev.target;
    var save = closest(target, '#saveBtn,.save-btn');
    var prod = closest(target, '.product-btn,[data-product]');
    var chip = closest(target, '[data-dia],[data-len],.chip,.quick-chip');
    return {
      type: ev && ev.type || '',
      pointerType: ev && ev.pointerType || '',
      isTrusted: !!(ev && ev.isTrusted),
      detail: ev && ev.detail,
      target: target ? {
        tag:(target.tagName||'').toLowerCase(),
        id:target.id||'',
        cls:safe(target.className||'',100),
        text:safe((target.innerText||target.textContent||'').replace(/\s+/g,' ').trim(),80),
        type:(target.getAttribute&&target.getAttribute('type'))||''
      } : {},
      match: save ? 'saveBtn' : (prod ? 'productBtn' : (chip ? 'quickChip' : 'entryOther')),
      x: t && Number.isFinite(Number(t.clientX)) ? Math.round(Number(t.clientX)) : null,
      y: t && Number.isFinite(Number(t.clientY)) ? Math.round(Number(t.clientY)) : null,
      timeStamp: ev && Math.round(ev.timeStamp || 0)
    };
  }
  function newFlow(ev){
    flowCounter += 1;
    var flow = 'S' + String(flowCounter).padStart(4,'0') + '-' + Date.now().toString(36);
    lastPointerFlow = {id:flow, event:eventInfo(ev), at:now(), snap:stateSnap()};
    window[FLOW_KEY] = lastPointerFlow;
    return lastPointerFlow;
  }
  function flowForSave(){
    var f = window[FLOW_KEY] || lastPointerFlow;
    if(!f || now() - (f.at||0) > 1800){
      f = {id:'AUTO-' + Date.now().toString(36), event:{type:'programmatic'}, at:now(), snap:stateSnap()};
      window[FLOW_KEY] = f;
    }
    return f;
  }
  function bindDetailedEvents(){
    if(document.__mesahaDeepEventsV419) return;
    document.__mesahaDeepEventsV419 = true;
    ['pointerdown','pointerup','touchstart','touchend','mousedown','mouseup','click','keydown'].forEach(function(type){
      document.addEventListener(type, function(ev){
        try{
          var target = ev.target;
          var interesting = closest(target, '#saveBtn,.save-btn,#entryView button,#entryView input,#entryView textarea,#entryView select,.product-btn,[data-product],[data-dia],[data-len]');
          if(!interesting) return;
          var info = eventInfo(ev);
          var isSave = info.match === 'saveBtn' || (ev.type === 'keydown' && (ev.key === 'Enter' || ev.keyCode === 13) && hasEntry());
          if(isSave){
            var f = newFlow(ev);
            dbg('info','deep-v419','Kaydet olayı yakalandı',{flowId:f.id,event:info,snapshot:f.snap});
          }else if(type === 'click' || type === 'touchend' || type === 'pointerdown'){
            dbg('info','deep-v419','Giriş ekranı etkileşimi',{event:info,snapshot:stateSnap()});
          }
        }catch(e){}
      }, true);
    });

    ['focusin','focusout','input','change'].forEach(function(type){
      document.addEventListener(type, function(ev){
        try{
          var el = ev.target;
          if(!closest(el, '#entryView input,#entryView textarea,#entryView select')) return;
          var key = type + ':' + (el.id || el.name || el.tagName);
          var n = now();
          if(type === 'input' && lastInputLog[key] && n - lastInputLog[key] < 280) return;
          lastInputLog[key] = n;
          dbg('info','deep-v419','Alan ' + type,{field:{id:el.id||'',type:el.type||'',value:(el.id==='barcodeInput'?maskedBarcode(el.value):safe(el.value,30))},snapshot:stateSnap()});
        }catch(e){}
      }, true);
    });

    function viewportLog(reason){
      var n=now(); if(n-lastViewportLogAt<600) return; lastViewportLogAt=n;
      if(!hasEntry()) return;
      dbg('info','deep-v419','Viewport/klavye değişimi',{reason:reason,viewport:viewport(),activeElement:activeEl()});
    }
    window.addEventListener('resize', function(){viewportLog('window.resize')}, true);
    window.addEventListener('scroll', function(){viewportLog('window.scroll')}, true);
    try{
      if(window.visualViewport){
        window.visualViewport.addEventListener('resize', function(){viewportLog('visualViewport.resize')}, true);
        window.visualViewport.addEventListener('scroll', function(){viewportLog('visualViewport.scroll')}, true);
      }
    }catch(e){}
  }
  function wrapSaveEntry(){
    try{
      var fn = window.saveEntry;
      if(typeof fn !== 'function' || fn[SAVE_WRAP]) return;
      var wrapped = function(){
        var f = flowForSave();
        var before = stateSnap();
        var started = performance && performance.now ? performance.now() : Date.now();
        dbg('info','deep-v419','saveEntry detay başladı',{flowId:f.id,sourceEvent:f.event,before:before});
        try{
          var res = fn.apply(this, arguments);
          var done = function(ok, value){
            var end = performance && performance.now ? performance.now() : Date.now();
            dbg(ok?'info':'error','deep-v419', ok?'saveEntry detay tamamlandı':'saveEntry detay hata',{
              flowId:f.id,
              ms:Math.round(end-started),
              before:before,
              after:stateSnap(),
              blockedStatus: window.MesahaSaveSingleGateV418 && typeof window.MesahaSaveSingleGateV418.status==='function' ? window.MesahaSaveSingleGateV418.status() : null
            });
            return value;
          };
          if(res && typeof res.then === 'function'){
            return res.then(function(v){return done(true,v)}).catch(function(e){done(false); throw e;});
          }
          return done(true,res);
        }catch(e){
          dbg('error','deep-v419','saveEntry detay hata',{flowId:f.id,error:{name:e.name,message:e.message,stack:safe(e.stack,900)},before:before,after:stateSnap()});
          throw e;
        }
      };
      try{ Object.keys(fn).forEach(function(k){ wrapped[k]=fn[k]; }); }catch(e){}
      wrapped[SAVE_WRAP] = true;
      wrapped.__mesahaDebugWrappedV415 = true;
      window.saveEntry = wrapped;
      try{ saveEntry = wrapped; }catch(e){}
      dbg('info','deep-v419','saveEntry detay sarmalayıcı kuruldu',{version:CODE});
    }catch(e){ dbg('warn','deep-v419','saveEntry detay sarmalayıcı kurulamadı',{error:String(e&&e.message||e)}); }
  }
  function wrapStorage(){
    try{
      if(window.localStorage && !Storage.prototype[STORAGE_WRAP]){
        var oldSet = Storage.prototype.setItem;
        Storage.prototype.setItem = function(k,v){
          var s = performance && performance.now ? performance.now() : Date.now();
          var r = oldSet.apply(this, arguments);
          try{
            if(String(k||'').indexOf('mesaha') >= 0){
              var ms = Math.round((performance && performance.now ? performance.now() : Date.now()) - s);
              if(ms > 8 || /records|settings|debug/.test(String(k||''))) dbg('info','deep-v419','localStorage yazma',{key:String(k),size:String(v||'').length,ms:ms});
            }
          }catch(e){}
          return r;
        };
        Storage.prototype[STORAGE_WRAP] = true;
      }
    }catch(e){}
  }
  function startPerf(){
    if(window[PERF_WRAP]) return; window[PERF_WRAP] = true;
    try{
      if('PerformanceObserver' in window){
        var po = new PerformanceObserver(function(list){
          list.getEntries().forEach(function(ent){
            try{ if(ent.duration > 80) dbg('warn','deep-v419','Uzun görev algılandı',{name:ent.name,entryType:ent.entryType,duration:Math.round(ent.duration)}); }catch(e){}
          });
        });
        try{po.observe({entryTypes:['longtask']});}catch(e){}
      }
    }catch(e){}
  }
  function syncVersion(){
    try{
      window.MESAHA_VERSION = Object.assign({}, window.MESAHA_VERSION || {}, {
        app:VERSION, version:CODE, build:BUILD, visibleVersion:'V4.04 •ExelanceX•', shortVersion:'V4.04 •ExelanceX•',
        name:'Mesaha İO V4.04 •ExelanceX•', cacheName:'mesaha-app-v419-detayli-log-test', assetVersion:String(BUILD),
        debugMode:'detailed-test-remove-before-publish'
      });
    }catch(e){}
  }
  function boot(){
    syncVersion();
    bindDetailedEvents();
    wrapStorage();
    startPerf();
    wrapSaveEntry();
    dbg('info','deep-v419','Detaylı log test modu açık',{version:VERSION,build:BUILD,code:CODE,removeBeforePublish:true,snapshot:stateSnap()});
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  [80,200,500,1000,2000,4000,8000,12000,18000,24000,30000].forEach(function(ms){ setTimeout(function(){ syncVersion(); wrapSaveEntry(); }, ms); });
  window.MesahaDeepDebugV419 = {boot:boot, snapshot:stateSnap, flow:function(){return window[FLOW_KEY]||null}, version:CODE, removeBeforePublish:true};
})();
