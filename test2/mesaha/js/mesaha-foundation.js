/* module: mesaha-core.js */
/* Mesaha İO V71 — başlangıç, yardımcılar, UI gözlemcisi ve performans çekirdeği */

/* ===== mesaha-early-optimizer.js ===== */
/* Mesaha İO V5.45 — güvenli başlangıç ve eski terminal-lite temizliği. */
(function(){
  'use strict';
  if(window.__mesahaEarlyOptimizerV545)return;
  window.__mesahaEarlyOptimizerV545=true;
  try{
    document.documentElement.classList.remove('mesaha-terminal-lite','scrolling-now');
    document.documentElement.classList.add('mesaha-boot-v527');
    var ua=navigator.userAgent||'',isIOS=/iPad|iPhone|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    if(isIOS)document.documentElement.classList.add('mesaha-ios-device');
    localStorage.removeItem('mesaha_terminal_lite');
    localStorage.removeItem('mesaha_terminal_lite_active');
  }catch(e){}
  function cleanup(){
    try{document.documentElement.classList.remove('mesaha-terminal-lite','scrolling-now');}catch(e){}
    try{if(document.body)document.body.classList.remove('mesaha-terminal-lite','scrolling-now');}catch(e){}
    try{var old=document.getElementById('mesaha-terminal-lite-style-v462');if(old)old.remove();}catch(e){}
  }
  function ready(){
    cleanup();
    try{document.documentElement.classList.remove('mesaha-boot-v527');document.documentElement.classList.add('mesaha-ready-v527');}catch(e){}
  }
  cleanup();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true,passive:true});else ready();
  window.addEventListener('pageshow',cleanup,{passive:true});
})();

/* ===== mesaha-utils.js ===== */
(function(){
  'use strict';
  if (window.MesahaUtils && window.MesahaUtils.__stable) return;
  var bound = Object.create(null);
  function safe(fn, fallback){ try { return typeof fn === 'function' ? fn() : fallback; } catch(e){ return fallback; } }
  function clean(v){ return String(v == null ? '' : v).trim(); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]; }); }
  function qs(sel, root){ return (root || document).querySelector(sel); }
  function qsa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function byId(id){ return document.getElementById(id); }
  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function jsonGet(key, fallback){ try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; } }
  function jsonSet(key, value){
    try {
      localStorage.setItem(key, JSON.stringify(value));
      try { window.dispatchEvent(new CustomEvent('mesaha:json-set', {detail:{key:key}})); } catch(e) {}
      return true;
    } catch(e) {
      try { window.dispatchEvent(new CustomEvent('mesaha:storage-error', {detail:{key:key, message:e && e.message ? e.message : String(e)}})); } catch(_) {}
      return false;
    }
  }
  function debounce(key, fn, delay){
    clearTimeout(bound[key]);
    bound[key] = setTimeout(function(){ safe(fn); }, delay || 120);
  }
  function throttle(key, fn, delay){
    var now = Date.now(), item = bound[key] || {last:0, timer:0};
    var wait = Math.max(0, (delay || 300) - (now - item.last));
    clearTimeout(item.timer);
    if(wait === 0){ item.last = now; safe(fn); }
    else { item.timer = setTimeout(function(){ item.last = Date.now(); safe(fn); }, wait); }
    bound[key] = item;
  }
  function withTimeout(promise, ms, label){
    var t;
    return Promise.race([
      promise,
      new Promise(function(_, reject){ t = setTimeout(function(){ reject(new Error((label || 'İşlem') + ' zaman aşımı')); }, ms || 10000); })
    ]).finally(function(){ clearTimeout(t); });
  }
  function loadScript(src){
    var existing = document.querySelector('script[src="'+src+'"]');
    if(existing) return Promise.resolve(existing);
    return new Promise(function(resolve, reject){
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function(){ resolve(s); };
      s.onerror = function(){ reject(new Error('Script yüklenemedi: '+src)); };
      document.head.appendChild(s);
    });
  }
  function onceEvent(el, type, key, fn, opts){
    if(!el) return false;
    var prop = '__mesaha_' + (key || type);
    if(el[prop]) return false;
    el[prop] = true;
    el.addEventListener(type, fn, opts || false);
    return true;
  }
  function isVisible(){ return document.visibilityState !== 'hidden'; }
  function connection(){ try { return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null; } catch(e){ return null; } }
  function saveData(){ var c=connection(); return !!(c && c.saveData); }
  function slowConnection(){ var c=connection(), t=String(c && c.effectiveType || ''); return /(^|-)2g$|slow-2g/i.test(t); }
  function reducedMotion(){ try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch(e){ return false; } }
  function lowPower(){ return saveData() || slowConnection() || reducedMotion(); }
  function idle(fn, timeout){
    if(typeof requestIdleCallback === 'function') return requestIdleCallback(function(){ safe(fn); }, {timeout: timeout || 1200});
    return setTimeout(function(){ safe(fn); }, Math.min(timeout || 180, 500));
  }
  window.MesahaUtils = {
    __stable:true,__v384:true,
    safe:safe, clean:clean, esc:esc, qs:qs, qsa:qsa, byId:byId, ready:ready,
    jsonGet:jsonGet, jsonSet:jsonSet, debounce:debounce, throttle:throttle,
    withTimeout:withTimeout, loadScript:loadScript, onceEvent:onceEvent,
    isVisible:isVisible, connection:connection, saveData:saveData, slowConnection:slowConnection, reducedMotion:reducedMotion, lowPower:lowPower, idle:idle
  };
})();

/* ===== mesaha-performance-core.js ===== */
/* Mesaha İO V71 — birleşik performans, görünüm ve kayıt toplamları çekirdeği. */
(function installMesahaPerformanceCore(root) {
  "use strict";
  if (!root || root.MesahaPerformanceCoreV71) return;

  var timers = Object.create(null);
  var renderTimer = 0;
  var recordsTimer = 0;
  var lightTimer = 0;
  var commitTimer = 0;
  var commitFlags = { records: false, settings: false };
  var stats = { ready: false, records: null, length: 0, count: 0, m3: 0 };

  function safe(fn, fallback) {
    try { return typeof fn === "function" ? fn() : fallback; }
    catch (_) { return fallback; }
  }
  function byId(id) { return document.getElementById(id); }
  function active(id) {
    var el = byId(id);
    return !!(el && el.classList && el.classList.contains("active"));
  }
  function entryActive() {
    return active("entryView") || !!(document.body && document.body.classList.contains("entry-open"));
  }
  function recordsActive() { return active("recordsView"); }
  function beyanActive() { return active("beyanView"); }
  function recordsDataActive() { return recordsActive() || beyanActive(); }
  function homeActive() { return active("homeView"); }
  function records() {
    return root.state && Array.isArray(root.state.records) ? root.state.records : [];
  }
  function quantity(record) {
    var value = Number(record && (record.quantity || record.adet || 1));
    return Number.isFinite(value) && value > 0 ? value : 1;
  }
  function decimal(value) {
    var number = Number(String(value == null ? "" : value).replace(",", "."));
    return Number.isFinite(number) ? number : 0;
  }
  function volume(record) {
    var diameter = decimal(record && (record.diameter || record.cap));
    var length = decimal(record && (record.length || record.boy));
    return diameter > 0 && length > 0
      ? Math.PI * Math.pow(diameter / 100, 2) / 4 * length * quantity(record)
      : 0;
  }
  function updateEntryStatsDom() {
    if (!entryActive()) return;
    var count = byId("entryTotalCount");
    var cubic = byId("entryTotalM3");
    if (count) count.textContent = Math.max(0, stats.count).toLocaleString("tr-TR");
    if (cubic) {
      cubic.textContent = Math.max(0, stats.m3).toLocaleString("tr-TR", {
        maximumFractionDigits: 3,
      }) + " m³";
    }
  }
  function rebuildEntryStats() {
    var list = records();
    var count = 0;
    var cubic = 0;
    for (var i = 0; i < list.length; i += 1) {
      count += quantity(list[i]);
      cubic += volume(list[i]);
    }
    stats = {
      ready: true,
      records: list,
      length: list.length,
      count: count,
      m3: cubic,
    };
    updateEntryStatsDom();
    return stats;
  }
  function refreshEntryStats(force) {
    var list = records();
    if (force || !stats.ready || stats.records !== list || stats.length !== list.length) {
      return rebuildEntryStats();
    }
    updateEntryStatsDom();
    return stats;
  }
  function applyEntryDelta(delta) {
    var list = records();
    if (!stats.ready || stats.records !== list) return rebuildEntryStats();
    var previous = delta && delta.previousRecord;
    var current = delta && (delta.record || delta.upsert);
    if (previous) {
      stats.count -= quantity(previous);
      stats.m3 -= volume(previous);
    }
    if (current) {
      stats.count += quantity(current);
      stats.m3 += volume(current);
    }
    if (delta && delta.type === "delete" && !previous) return rebuildEntryStats();
    stats.length = list.length;
    updateEntryStatsDom();
    return stats;
  }
  function later(key, fn, delay) {
    clearTimeout(timers[key]);
    timers[key] = setTimeout(function () {
      if (document.hidden) return;
      safe(fn);
    }, Number(delay == null ? 120 : delay));
  }
  function fire(name, detail) {
    try { root.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); }
    catch (_) {}
  }
  function fastEntryRefresh() { refreshEntryStats(false); }
  function renderAllSoon(delay) {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(function () {
      if (document.hidden) return;
      if (entryActive()) return fastEntryRefresh();
      safe(root.renderAll);
      if (recordsDataActive()) safe(function () {
        if (root.mesahaV305 && typeof root.mesahaV305.updateBeyanTotals === "function") {
          root.mesahaV305.updateBeyanTotals();
        }
      });
    }, Number(delay == null ? 90 : delay));
  }
  function renderRecordsSoon(delay) {
    clearTimeout(recordsTimer);
    recordsTimer = setTimeout(function () {
      if (document.hidden || !recordsActive()) return;
      if (root.mesahaV303 && typeof root.mesahaV303.records === "function") safe(root.mesahaV303.records);
      else safe(root.renderRecords);
      safe(function () {
        if (root.mesahaV305 && typeof root.mesahaV305.updateBeyanTotals === "function") {
          root.mesahaV305.updateBeyanTotals();
        }
      });
    }, Number(delay == null ? 90 : delay));
  }
  function lightRefreshSoon(delay) {
    clearTimeout(lightTimer);
    lightTimer = setTimeout(function () {
      if (document.hidden) return;
      if (entryActive()) return fastEntryRefresh();
      if (recordsDataActive()) {
        safe(function () {
          if (root.mesahaV305 && typeof root.mesahaV305.updateBeyanTotals === "function") {
            root.mesahaV305.updateBeyanTotals();
          }
        });
        safe(function () {
          if (root.mesahaV304 && typeof root.mesahaV304.updateExportScopeInfo === "function") {
            root.mesahaV304.updateExportScopeInfo();
          }
        });
      } else if (homeActive()) safe(root.renderAll);
    }, Number(delay == null ? 120 : delay));
  }
  function flushSettings() {
    safe(function () {
      if (typeof root.__flushSettings === "function") root.__flushSettings();
    });
  }
  function queueCommitted(kind, detail) {
    commitFlags[kind] = true;
    if (kind === "records" && detail && detail.delta && entryActive()) {
      applyEntryDelta(detail.delta);
    }
    clearTimeout(commitTimer);
    commitTimer = setTimeout(function () {
      var hasRecords = commitFlags.records;
      commitFlags = { records: false, settings: false };
      if (entryActive()) {
        if (hasRecords && !(detail && detail.delta)) refreshEntryStats(true);
        return;
      }
      if (recordsActive()) {
        if (hasRecords) renderRecordsSoon(20);
        else lightRefreshSoon(60);
        return;
      }
      if (beyanActive()) {
        lightRefreshSoon(hasRecords ? 25 : 60);
        return;
      }
      if (homeActive() && hasRecords) renderAllSoon(60);
    }, 45);
  }
  function shouldRunHeavy(target) {
    if (document.hidden) return false;
    if (target === "entry") return entryActive();
    if (target === "records") return recordsDataActive();
    if (target === "home") return homeActive();
    return !entryActive();
  }
  function idle(fn, timeout) {
    if (typeof requestIdleCallback === "function") {
      return requestIdleCallback(function () { safe(fn); }, { timeout: timeout || 1200 });
    }
    return setTimeout(function () { safe(fn); }, Math.min(timeout || 300, 500));
  }
  function markDevice() {
    var ua = navigator.userAgent || "";
    var ios = /iPad|iPhone|iPod/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    try {
      document.documentElement.classList.toggle("mesaha-ios-device", ios);
      document.documentElement.classList.toggle("mesaha-low-power-v71", ios ||
        !!(root.MesahaUtils && root.MesahaUtils.lowPower && root.MesahaUtils.lowPower()));
    } catch (_) {}
    return ios;
  }

  var isIOS = markDevice();
  var renderApi = {
    renderAllSoon: renderAllSoon,
    renderRecordsSoon: renderRecordsSoon,
    lightRefreshSoon: lightRefreshSoon,
    queueCommitted: queueCommitted,
    flushSettings: flushSettings,
  };
  var stabilityApi = {
    later: later,
    fire: fire,
    refreshTotals: function () { lightRefreshSoon(40); },
    refreshBinders: function () {
      later("binders", function () {
        if (recordsActive() && root.mesahaV306 && typeof root.mesahaV306.bindMeasureButtons === "function") {
          root.mesahaV306.bindMeasureButtons();
        }
      }, 40);
    },
  };
  var iosApi = {
    isIOS: isIOS,
    entryActive: entryActive,
    recordsActive: recordsDataActive,
    homeActive: homeActive,
    shouldRunHeavy: shouldRunHeavy,
    refreshEntryStats: refreshEntryStats,
    applyDelta: applyEntryDelta,
    scheduleEntryStats: function (force, delay) {
      later("entry-stats", function () { refreshEntryStats(!!force); }, delay == null ? 45 : delay);
    },
    idle: idle,
  };

  root.MesahaRenderStorage = renderApi;
  root.MesahaRenderStorageV382 = renderApi;
  root.MesahaRenderStorageV383 = renderApi;
  root.MesahaStabilityCore = stabilityApi;
  root.MesahaStabilityCoreV383 = stabilityApi;
  root.MesahaIOSPerformanceV576 = iosApi;
  root.MesahaEntryStatsV576 = {
    refresh: refreshEntryStats,
    applyDelta: applyEntryDelta,
    schedule: iosApi.scheduleEntryStats,
  };
  root.MesahaRecordsPerformance = {
    __v71: true,
    __v70: true,
    __v447: true,
    info: function () {
      return {
        records: records().length,
        pageSize: 20,
        recordsViewActive: recordsDataActive(),
      };
    },
    refresh: function () {
      safe(root.mesahaInvalidateRecordStatsV447);
      renderRecordsSoon(20);
    },
  };

  root.addEventListener("mesaha:records-saved", function (event) {
    queueCommitted("records", event && event.detail || {});
  }, { passive: true });
  root.addEventListener("mesaha:settings-saved", function () {
    queueCommitted("settings", {});
  }, { passive: true });
  root.addEventListener("mesaha:light-refresh", function () {
    lightRefreshSoon(60);
  }, { passive: true });
  root.addEventListener("mesaha:view-changed", function (event) {
    if (event && event.detail && event.detail.view === "entry") {
      later("entry-view", function () { refreshEntryStats(false); }, 30);
    }
  }, { passive: true });
  root.addEventListener("pagehide", flushSettings, { passive: true });
  root.addEventListener("pageshow", function () {
    markDevice();
    lightRefreshSoon(150);
  }, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) flushSettings();
    else lightRefreshSoon(150);
  }, { passive: true });

  var performanceApi = Object.freeze({
    render: renderApi,
    stability: stabilityApi,
    stats: iosApi,
    refresh: function () { lightRefreshSoon(20); },
  });
  root.MesahaPerformanceCoreV71 = performanceApi;
  root.MesahaPerformanceCoreV70 = performanceApi;
})(typeof window !== "undefined" ? window : null);

/* ===== mesaha-ui-hub.js ===== */
"use strict";

/*
 * Aynı panelin class değişimini izleyen eski yamaları tek MutationObserver
 * altında toplar. Her abone yalnızca bir kez kaydolur; değişiklikler aynı
 * animation frame içinde gruplanır.
 */
(function installMesahaUiHub(root) {
  if (!root || root.MesahaUiHub) return;
  const classWatches = new Map();
  const scheduleFrame = typeof root.requestAnimationFrame === "function"
    ? root.requestAnimationFrame.bind(root)
    : function (callback) { return root.setTimeout(callback, 16); };

  function elementFor(idOrElement) {
    return typeof idOrElement === "string"
      ? document.getElementById(idOrElement)
      : idOrElement;
  }

  function watchClass(idOrElement, callback) {
    if (typeof callback !== "function") return function () {};
    const id = typeof idOrElement === "string" ? idOrElement : idOrElement?.id;
    const bind = function () {
      const element = elementFor(idOrElement);
      if (!element) return false;
      const key = id || element;
      let entry = classWatches.get(key);
      if (!entry) {
        entry = { element, callbacks: new Set(), queued: false, observer: null };
        entry.observer = new MutationObserver(function () {
          if (entry.queued) return;
          entry.queued = true;
          scheduleFrame(function () {
            entry.queued = false;
            entry.callbacks.forEach(function (fn) {
              try {
                fn(element);
              } catch (error) {
                try {
                  root.MesahaErrorLog?.error("ui-hub.class-watch", error);
                } catch (_) {}
              }
            });
          });
        });
        entry.observer.observe(element, {
          attributes: true,
          attributeFilter: ["class", "aria-hidden"],
        });
        classWatches.set(key, entry);
      }
      entry.callbacks.add(callback);
      return true;
    };

    if (!bind() && document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bind, { once: true });
    }

    return function unsubscribe() {
      const key = id || elementFor(idOrElement);
      const entry = classWatches.get(key);
      if (!entry) return;
      entry.callbacks.delete(callback);
      if (!entry.callbacks.size) {
        entry.observer.disconnect();
        classWatches.delete(key);
      }
    };
  }

  root.MesahaUiHub = Object.freeze({ watchClass });
})(typeof window !== "undefined" ? window : null);
;

/* module: mesaha-data-guard.js */
/* Mesaha İO V5.27 — Eski snapshot geri yükleme kaldırıldı.
   Silinen kayıtların geri gelmemesi için yalnızca revision tabanlı depolama kullanılır. */
(function(){
  'use strict';
  var api={
    __stable:true,__v527:true,
    recoverIfNeeded:function(){return window.MesahaStorageV527?window.MesahaStorageV527.recoverIntoApp():Promise.resolve({ok:false});},
    snapshot:function(){return window.MesahaStorageV527?window.MesahaStorageV527.flush():Promise.resolve(false);},
    quotaInfo:function(){return window.MesahaStorageV527?window.MesahaStorageV527.info():{};},
    refresh:function(){try{if(window.MesahaRenderStorageV382&&window.MesahaRenderStorageV382.renderAllSoon)window.MesahaRenderStorageV382.renderAllSoon();else if(typeof window.renderAll==='function')window.renderAll();}catch(e){}}
  };
  window.MesahaDataGuard=api;
})();
;

/* module: mesaha-backup-format.js */
"use strict";

/*
 * Mesaha İO yedek biçimi uyumluluk katmanı.
 *
 * Desteklenen güvenli biçimler:
 *  - [record, ...]
 *  - { records: [...], settings: {...} }
 *  - { payload: { records: [...], settings: {...} } }
 *  - { payload: "{...}" } veya { payloadText: "{...}" }
 *
 * Buradaki amaç eski bulut yedeklerini yükleyebilmek; rastgele bir JSON
 * nesnesini kayıt listesi gibi kabul etmemektir.
 */
(function installMesahaBackupFormat(root) {
  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function parseJsonObject(value, label) {
    if (typeof value !== "string") return value;
    const text = value.trim();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (_) {
      throw new Error(`${label || "Yedek"} JSON içeriği okunamadı.`);
    }
  }

  function unwrap(input) {
    let source = parseJsonObject(input, "Yedek");
    if (Array.isArray(source)) return { records: source, settings: null, envelope: source };
    if (!isObject(source)) throw new Error("Yedek biçimi geçersiz.");

    // Bazı eski yedekler payloadText kullanır.
    if (!source.payload && typeof source.payloadText === "string") {
      source = { ...source, payload: parseJsonObject(source.payloadText, "Yedek payload") };
    }

    let payload = source.payload;
    if (typeof payload === "string") payload = parseJsonObject(payload, "Yedek payload");

    const nested = isObject(payload) ? payload : null;
    const records = Array.isArray(source.records)
      ? source.records
      : nested && Array.isArray(nested.records)
        ? nested.records
        : null;
    if (!records) throw new Error("Yedek içinde kayıt listesi bulunamadı.");

    const settings = isObject(source.settings)
      ? source.settings
      : nested && isObject(nested.settings)
        ? nested.settings
        : null;

    return {
      records,
      settings,
      envelope: source,
      payload: nested,
      meta: isObject(source.meta) ? source.meta : null,
    };
  }

  const api = Object.freeze({ extract: unwrap });
  if (root) root.MesahaBackupFormat = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
;

/* module: mesaha-persistent-store.js */
/* Mesaha İO V5.78 — iOS düşük gecikmeli, sıralı ve anlık görüntü güvenli kalıcı depolama motoru.
   - Tek kayıt ekleme/düzeltme IndexedDB'de yalnız ilgili kaydı yazar.
   - Kayıt ve ayar kuyrukları ayrıdır; ağaç/ürün seçimi kayıt düğmesini bekletmez.
   - Büyük localStorage kopyası dokunma anında değil, boş zamanda ve birleştirilerek alınır.
   - Eski V5.27 belge deposu ve localStorage kopyalarıyla geriye uyumludur. */
(function(){
  'use strict';
  if(window.MesahaStorageV527 && window.MesahaStorageV527.__v576) return;

  var DB_NAME='mesaha_io_storage_v527';
  var DB_VERSION=2;
  var DOC_STORE='documents';
  var RECORD_STORE='record_items';
  var META_STORE='state_meta';
  var RECORDS_KEY='cam_mesaha_kayitlari_v1';
  var SETTINGS_KEY='cam_mesaha_ayarlar_v1';
  var RECORDS_META='mesaha_v527_records_meta';
  var SETTINGS_META='mesaha_v527_settings_meta';
  var LEGACY_RECORD_KEYS=[RECORDS_KEY+'_mirror_v515',RECORDS_KEY+'_last_ok',RECORDS_KEY+'_snapshot_v385',RECORDS_KEY+'_mirror_meta_v515'];
  var LEGACY_SETTINGS_KEYS=[SETTINGS_KEY+'_mirror_v515',SETTINGS_KEY+'_mirror_meta_v515'];

  var dbPromise=null,seq=0;
  var recordChain=Promise.resolve(),settingsChain=Promise.resolve(),bulkChain=Promise.resolve();
  var bootRecords=[],bootSettings={},bootRecordMeta=null,bootSettingsMeta=null;
  var lastCommittedRecords=[],lastCommittedSettings={};
  var recoveryPromise=null;
  var snapshotJobs={records:null,settings:null};
  var snapshotTimers={records:0,settings:0};
  var isIOS=/iPad|iPhone|iPod/i.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

  function now(){return Date.now();}
  function parse(raw,f){try{return raw==null?f:JSON.parse(raw);}catch(e){return f;}}
  function readJson(k,f){try{return parse(localStorage.getItem(k),f);}catch(e){return f;}}
  function shallowRecords(v){return Array.isArray(v)?v.slice():[];}
  function shallowSettings(v){return v&&typeof v==='object'&&!Array.isArray(v)?Object.assign({},v):{};}
  function cloneRecord(r){return r&&typeof r==='object'?Object.assign({},r):r;}
  function cloneRecordsForApi(v){return Array.isArray(v)?v.map(cloneRecord):[];}
  function cleanLegacy(){try{LEGACY_RECORD_KEYS.concat(LEGACY_SETTINGS_KEYS).forEach(function(k){localStorage.removeItem(k);});}catch(e){}}
  function checksumText(s){s=String(s==null?'':s);var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16)+':'+s.length;}
  function checksum(value){var s='';try{s=JSON.stringify(value);}catch(e){}return checksumText(s);}
  function summaryChecksumRecords(list){
    list=Array.isArray(list)?list:[];var h=2166136261;
    function mix(v){v=String(v==null?'':v);for(var i=0;i<v.length;i++){h^=v.charCodeAt(i);h=Math.imul(h,16777619);}}
    mix(list.length);
    for(var i=0;i<list.length;i++){
      var r=list[i]||{};
      mix(r.id);mix(r.barcode||r.barkodNo);mix(r.updatedAt||r.createdAt);mix(r.quantity||r.adet||1);
    }
    return 'summary-v1:'+(h>>>0).toString(16)+':'+list.length;
  }
  function readMeta(key){var m=readJson(key,null);return m&&typeof m==='object'?m:null;}
  function nextRevision(meta){seq=(seq+1)%1000;return Math.max(now()*1000+seq,Number(meta&&meta.revision||0)+1);}
  function validSettings(v){return !!(v&&typeof v==='object'&&!Array.isArray(v));}
  function legacyRecords(){
    var raw=null;try{raw=localStorage.getItem(RECORDS_KEY);}catch(e){}
    if(raw!==null){var direct=parse(raw,null);if(Array.isArray(direct))return direct;}
    for(var i=0;i<LEGACY_RECORD_KEYS.length;i++){
      if(/meta/i.test(LEGACY_RECORD_KEYS[i])||/snapshot/i.test(LEGACY_RECORD_KEYS[i]))continue;
      var a=readJson(LEGACY_RECORD_KEYS[i],null);if(Array.isArray(a))return a;
    }
    var snap=readJson(RECORDS_KEY+'_snapshot_v385',null);if(snap&&snap.payload){var b=parse(snap.payload,null);if(Array.isArray(b))return b;}
    return [];
  }
  function legacySettings(){
    var raw=null;try{raw=localStorage.getItem(SETTINGS_KEY);}catch(e){}
    if(raw!==null){var direct=parse(raw,null);if(validSettings(direct))return direct;}
    var old=readJson(SETTINGS_KEY+'_mirror_v515',null);return validSettings(old)?old:{};
  }
  function notify(name,detail){try{window.dispatchEvent(new CustomEvent(name,{detail:detail||{}}));}catch(e){}}
  function notifyFailure(kind,error,extra){var d={key:kind,message:error&&error.message?error.message:String(error||'Depolama hatası'),fatal:true};try{Object.assign(d,extra||{});}catch(e){}notify('mesaha:storage-error',d);}
  function notifyWarning(kind,error,extra){var d={key:kind,message:error&&error.message?error.message:String(error||'Depolama yedeği gecikti'),fatal:false,degraded:true};try{Object.assign(d,extra||{});}catch(e){}notify('mesaha:storage-warning',d);}

  function resetDb(db){try{if(db)db.close();}catch(e){}dbPromise=null;}
  function openDb(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise(function(resolve,reject){
      if(!('indexedDB' in window)){dbPromise=null;reject(new Error('IndexedDB kullanılamıyor'));return;}
      var req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=function(){
        var db=req.result;
        if(!db.objectStoreNames.contains(DOC_STORE))db.createObjectStore(DOC_STORE,{keyPath:'key'});
        if(!db.objectStoreNames.contains(RECORD_STORE))db.createObjectStore(RECORD_STORE,{keyPath:'id'});
        if(!db.objectStoreNames.contains(META_STORE))db.createObjectStore(META_STORE,{keyPath:'key'});
      };
      req.onsuccess=function(){var db=req.result;try{db.onversionchange=function(){resetDb(db);};}catch(e){}resolve(db);};
      req.onerror=function(){var err=req.error||new Error('IndexedDB açılamadı');dbPromise=null;reject(err);};
      req.onblocked=function(){dbPromise=null;reject(new Error('IndexedDB başka sekme tarafından kilitli'));};
    });
    return dbPromise;
  }
  function requestPromise(req,label){return new Promise(function(resolve,reject){req.onsuccess=function(){resolve(req.result==null?null:req.result);};req.onerror=function(){reject(req.error||new Error(label||'IndexedDB isteği başarısız'));};});}
  function txDone(tx,label,db){return new Promise(function(resolve,reject){tx.oncomplete=function(){resolve(true);};tx.onerror=function(){var e=tx.error||new Error(label||'IndexedDB işlemi başarısız');resetDb(db);reject(e);};tx.onabort=function(){var e=tx.error||new Error(label||'IndexedDB işlemi iptal edildi');resetDb(db);reject(e);};});}
  async function idbGet(store,key){var db=await openDb(),tx=db.transaction(store,'readonly');return requestPromise(tx.objectStore(store).get(key),'IndexedDB okunamadı');}
  async function idbGetAll(store){var db=await openDb(),tx=db.transaction(store,'readonly');return requestPromise(tx.objectStore(store).getAll(),'IndexedDB listesi okunamadı').then(function(x){return Array.isArray(x)?x:[];});}
  async function idbPutDoc(env){var db=await openDb(),tx=db.transaction(DOC_STORE,'readwrite');tx.objectStore(DOC_STORE).put(env);await txDone(tx,'Belge deposu yazılamadı',db);return true;}

  function recordMetaFrom(base,list,reason){
    var rev=nextRevision(base||{}),at=now();
    return {key:'records',schema:3,engine:'delta-v576',initialized:true,revision:rev,updatedAt:at,deletedAt:Array.isArray(list)&&list.length===0?at:0,count:Array.isArray(list)?list.length:0,reason:String(reason||'save').slice(0,80)};
  }
  function settingsEnvelope(settings,base,reason){
    var value=shallowSettings(settings),text='';try{text=JSON.stringify(value);}catch(e){value={};text='{}';}
    return {key:'settings',schema:3,engine:'delta-v576',revision:nextRevision(base||{}),updatedAt:now(),count:Object.keys(value).length,checksum:checksumText(text),checksumMode:'json-v1',reason:String(reason||'save').slice(0,80),value:value};
  }
  function recordsEnvelope(list,base,reason){
    list=shallowRecords(list);
    return {key:'records',schema:3,engine:'delta-v576',revision:nextRevision(base||{}),updatedAt:now(),deletedAt:list.length===0?now():0,count:list.length,checksum:summaryChecksumRecords(list),checksumMode:'summary-v1',reason:String(reason||'save').slice(0,80),value:list};
  }
  function envelopeValid(kind,env){
    if(!env||env.key!==kind)return false;
    if(kind==='records'){
      if(!Array.isArray(env.value))return false;
      if(env.checksumMode==='summary-v1')return summaryChecksumRecords(env.value)===env.checksum;
      return !env.checksum||checksum(env.value)===env.checksum;
    }
    if(!validSettings(env.value))return false;
    return !env.checksum||checksum(env.value)===env.checksum;
  }

  function applyRecords(list,meta,detail){
    bootRecords=shallowRecords(list);lastCommittedRecords=shallowRecords(list);
    bootRecordMeta=Object.assign({},meta||{},{count:bootRecords.length});
    notify('mesaha:records-saved',Object.assign({count:bootRecords.length,revision:Number(meta&&meta.revision||0),reason:meta&&meta.reason||'save',verified:true,durable:true,degraded:false,indexedDB:true,localStorage:false,engine:'delta-v576'},detail||{}));
  }
  function applySettings(settings,env,detail){
    bootSettings=shallowSettings(settings);lastCommittedSettings=shallowSettings(settings);
    bootSettingsMeta={revision:Number(env&&env.revision||0),updatedAt:Number(env&&env.updatedAt||0),count:Object.keys(bootSettings).length,checksum:env&&env.checksum,schema:3};
    notify('mesaha:settings-saved',Object.assign({revision:Number(env&&env.revision||0),reason:env&&env.reason||'save',verified:true,durable:true,degraded:false,indexedDB:true,localStorage:false,engine:'delta-v576'},detail||{}));
  }

  function localSnapshotDelay(kind){return kind==='records'?(isIOS?9000:5000):1200;}
  function runIdle(fn,timeout){
    if(typeof requestIdleCallback==='function')return requestIdleCallback(fn,{timeout:timeout||2500});
    return setTimeout(fn,Math.min(timeout||1200,1200));
  }
  function commitLocalSnapshot(kind,job){
    if(!job)return false;
    var dataKey=kind==='records'?RECORDS_KEY:SETTINGS_KEY,metaKey=kind==='records'?RECORDS_META:SETTINGS_META;
    try{
      var text=JSON.stringify(job.value);
      localStorage.setItem(dataKey,text);
      var m=Object.assign({},job.meta||{}, {schema:3,checksum:checksumText(text),checksumMode:'json-v1',provisional:false,count:kind==='records'?job.value.length:Object.keys(job.value||{}).length});
      localStorage.setItem(metaKey,JSON.stringify(m));
      if(kind==='records')bootRecordMeta=Object.assign({},m);else bootSettingsMeta=Object.assign({},m);
      cleanLegacy();return true;
    }catch(e){notifyWarning(kind,e,{localSnapshot:true});return false;}
  }
  function scheduleLocalSnapshot(kind,value,meta,delay){
    snapshotJobs[kind]={value:kind==='records'?shallowRecords(value):shallowSettings(value),meta:Object.assign({},meta||{})};
    if(snapshotTimers[kind])clearTimeout(snapshotTimers[kind]);
    snapshotTimers[kind]=setTimeout(function(){
      snapshotTimers[kind]=0;
      var job=snapshotJobs[kind];snapshotJobs[kind]=null;
      runIdle(function(){commitLocalSnapshot(kind,job);},isIOS?3500:2200);
    },delay==null?localSnapshotDelay(kind):Math.max(0,delay));
  }

  async function replaceRecordStore(list,meta,docEnv){
    var db=await openDb(),stores=[RECORD_STORE,META_STORE];if(docEnv)stores.push(DOC_STORE);
    var tx=db.transaction(stores,'readwrite'),rs=tx.objectStore(RECORD_STORE);rs.clear();
    for(var i=0;i<list.length;i++){var r=list[i];if(r&&r.id!=null)rs.put(r);}
    tx.objectStore(META_STORE).put(meta);
    if(docEnv)tx.objectStore(DOC_STORE).put(docEnv);
    await txDone(tx,'Kayıt deposu yenilenemedi',db);return true;
  }
  async function ensureRecordStore(list,preferredMeta,markFresh){
    if(bootRecordMeta&&bootRecordMeta.initialized===true)return bootRecordMeta;
    var current=null;try{current=await idbGet(META_STORE,'records');}catch(e){}
    if(current&&current.initialized===true){bootRecordMeta=Object.assign({},current);return bootRecordMeta;}
    var meta=recordMetaFrom(preferredMeta||bootRecordMeta||{},list,'initial-migration');
    await replaceRecordStore(list,meta,null);bootRecordMeta=Object.assign({},meta);
    return markFresh?Object.assign({},meta,{__justInitialized:true}):bootRecordMeta;
  }

  function saveRecordDelta(change,list,opts){
    /* Kuyruğa giren veriyi çağrı anında sabitle. Hızlı kayıtlarda state dizisi sonraki
       kayıtla değişirse eski işin yanlış uzunluk görüp tüm veriyi yeniden yazmasını önler. */
    list=Array.isArray(list)?list.slice():[];
    change=Object.assign({},change||{});
    if(change.upsert&&typeof change.upsert==='object')change.upsert=Object.assign({},change.upsert);
    if(change.previousRecord&&typeof change.previousRecord==='object')change.previousRecord=Object.assign({},change.previousRecord);
    opts=Object.assign({},opts||{});
    recordChain=recordChain.catch(function(){return null;}).then(async function(){
      var meta=null;
      try{
        meta=await ensureRecordStore(list,bootRecordMeta||{},true);
        if(meta&&meta.__justInitialized){
          delete meta.__justInitialized;
          applyRecords(list,meta,{delta:{type:change.deleteId!=null?'delete':'upsert',record:change.upsert||null,previousRecord:change.previousRecord||null,deleteId:change.deleteId||null},migrated:true});
          scheduleLocalSnapshot('records',list,meta);
          return {ok:true,indexedDB:true,localStorage:false,localStoragePending:true,verified:true,durable:true,degraded:false,revision:meta.revision,engine:'delta-v576-initial'};
        }
        var expectedBefore=list.length;
        if(change.deleteId!=null)expectedBefore=list.length+1;
        else if(change.upsert&&!change.previousRecord)expectedBefore=Math.max(0,list.length-1);
        if(Number(meta.count||0)!==expectedBefore){
          var repaired=recordMetaFrom(meta,list,opts&&opts.reason||'record-delta-repair');
          await replaceRecordStore(list,repaired,null);
          applyRecords(list,repaired,{delta:{type:change.deleteId!=null?'delete':'upsert',record:change.upsert||null,previousRecord:change.previousRecord||null,deleteId:change.deleteId||null},repaired:true});
          scheduleLocalSnapshot('records',list,repaired);
          return {ok:true,indexedDB:true,localStorage:false,localStoragePending:true,verified:true,durable:true,degraded:false,revision:repaired.revision,engine:'delta-v576-repair'};
        }
        var next=recordMetaFrom(meta,list,opts&&opts.reason||change.type||'record-delta');
        var db=await openDb(),tx=db.transaction([RECORD_STORE,META_STORE],'readwrite'),rs=tx.objectStore(RECORD_STORE);
        if(change.deleteId!=null)rs.delete(String(change.deleteId));
        if(change.upsert&&change.upsert.id!=null)rs.put(change.upsert);
        tx.objectStore(META_STORE).put(next);
        await txDone(tx,'Tek kayıt yazılamadı',db);
        applyRecords(list,next,{delta:{type:change.deleteId!=null?'delete':'upsert',record:change.upsert||null,previousRecord:change.previousRecord||null,deleteId:change.deleteId||null}});
        scheduleLocalSnapshot('records',list,next);
        return {ok:true,indexedDB:true,localStorage:false,localStoragePending:true,verified:true,durable:true,degraded:false,revision:next.revision,engine:'delta-v576'};
      }catch(err){
        var fallbackMeta=recordMetaFrom(meta||bootRecordMeta||{},list,opts&&opts.reason||'record-delta-fallback');
        var ok=commitLocalSnapshot('records',{value:shallowRecords(list),meta:fallbackMeta});
        if(ok){applyRecords(list,fallbackMeta,{degraded:true,indexedDB:false,localStorage:true});notifyWarning('records',err,{localStorage:true,indexedDB:false,deltaFallback:true});return {ok:true,indexedDB:false,localStorage:true,verified:true,durable:true,degraded:true,revision:fallbackMeta.revision,error:String(err&&err.message||err)};}
        notifyFailure('records',err,{delta:true});return {ok:false,indexedDB:false,localStorage:false,verified:false,durable:false,error:String(err&&err.message||err)};
      }
    });
    return recordChain;
  }

  function saveRecords(list,opts){
    list=Array.isArray(list)?list.slice():[];
    opts=Object.assign({},opts||{});
    recordChain=recordChain.catch(function(){return null;}).then(async function(){
      var base=null;try{base=await idbGet(META_STORE,'records');}catch(e){}
      var meta=recordMetaFrom(base||bootRecordMeta||{},list,opts&&opts.reason||'records-save');
      var doc=recordsEnvelope(list,meta,opts&&opts.reason||'records-save');doc.revision=meta.revision;doc.updatedAt=meta.updatedAt;doc.deletedAt=meta.deletedAt;
      try{
        await replaceRecordStore(list,meta,doc);
        applyRecords(list,meta,{full:true});scheduleLocalSnapshot('records',list,meta,1000);
        return {ok:true,indexedDB:true,localStorage:false,localStoragePending:true,verified:true,durable:true,degraded:false,revision:meta.revision,engine:'bulk-v576'};
      }catch(err){
        var ok=commitLocalSnapshot('records',{value:shallowRecords(list),meta:meta});
        if(ok){applyRecords(list,meta,{full:true,degraded:true,indexedDB:false,localStorage:true});notifyWarning('records',err,{bulkFallback:true});return {ok:true,indexedDB:false,localStorage:true,verified:true,durable:true,degraded:true,revision:meta.revision};}
        notifyFailure('records',err,{full:true});return {ok:false,error:String(err&&err.message||err)};
      }
    });
    return recordChain;
  }

  function saveSettings(settings,opts){
    settings=validSettings(settings)?shallowSettings(settings):{};
    opts=Object.assign({},opts||{});
    settingsChain=settingsChain.catch(function(){return null;}).then(async function(){
      var base=bootSettingsMeta||null;
      var env=settingsEnvelope(settings,base||{},opts&&opts.reason||'settings-save');
      try{
        await idbPutDoc(env);applySettings(settings,env);scheduleLocalSnapshot('settings',settings,env);
        return {ok:true,indexedDB:true,localStorage:false,localStoragePending:true,verified:true,durable:true,degraded:false,revision:env.revision,engine:'settings-v576'};
      }catch(err){
        var ok=commitLocalSnapshot('settings',{value:shallowSettings(settings),meta:env});
        if(ok){applySettings(settings,env,{degraded:true,indexedDB:false,localStorage:true});notifyWarning('settings',err,{localStorage:true});return {ok:true,indexedDB:false,localStorage:true,verified:true,durable:true,degraded:true,revision:env.revision};}
        notifyFailure('settings',err);return {ok:false,error:String(err&&err.message||err)};
      }
    });
    return settingsChain;
  }

  function replaceAll(records,settings,opts){
    records=Array.isArray(records)?records.slice():[];
    settings=validSettings(settings)?shallowSettings(settings):{};
    opts=Object.assign({},opts||{});
    bulkChain=bulkChain.catch(function(){return null;}).then(async function(){
      await Promise.all([recordChain.catch(function(){}),settingsChain.catch(function(){})]);
      var currentMeta=null,currentSettings=null;try{var p=await Promise.all([idbGet(META_STORE,'records').catch(function(){return null;}),idbGet(DOC_STORE,'settings').catch(function(){return null;})]);currentMeta=p[0];currentSettings=p[1];}catch(e){}
      var meta=recordMetaFrom(currentMeta||bootRecordMeta||{},records,opts&&opts.reason||'replace-all');
      var recDoc=recordsEnvelope(records,meta,opts&&opts.reason||'replace-all');recDoc.revision=meta.revision;recDoc.updatedAt=meta.updatedAt;recDoc.deletedAt=meta.deletedAt;
      var setDoc=settingsEnvelope(settings,currentSettings||bootSettingsMeta||{},opts&&opts.reason||'replace-all');
      try{
        var db=await openDb(),tx=db.transaction([RECORD_STORE,META_STORE,DOC_STORE],'readwrite'),rs=tx.objectStore(RECORD_STORE);rs.clear();
        for(var i=0;i<records.length;i++){var r=records[i];if(r&&r.id!=null)rs.put(r);}
        tx.objectStore(META_STORE).put(meta);var ds=tx.objectStore(DOC_STORE);ds.put(recDoc);ds.put(setDoc);
        await txDone(tx,'Toplu veri yazılamadı',db);
        applyRecords(records,meta,{full:true,transaction:true});applySettings(settings,setDoc,{transaction:true});
        scheduleLocalSnapshot('records',records,meta,600);scheduleLocalSnapshot('settings',settings,setDoc,500);
        return {ok:true,indexedDB:true,localStorage:false,localStoragePending:true,verified:true,durable:true,degraded:false,recordsRevision:meta.revision,settingsRevision:setDoc.revision,engine:'replace-v576'};
      }catch(err){
        var a=commitLocalSnapshot('records',{value:shallowRecords(records),meta:meta}),b=commitLocalSnapshot('settings',{value:shallowSettings(settings),meta:setDoc});
        if(a&&b){applyRecords(records,meta,{full:true,transaction:true,degraded:true,indexedDB:false,localStorage:true});applySettings(settings,setDoc,{transaction:true,degraded:true,indexedDB:false,localStorage:true});notifyWarning('replace',err,{localStorage:true});return {ok:true,indexedDB:false,localStorage:true,verified:true,durable:true,degraded:true,recordsRevision:meta.revision,settingsRevision:setDoc.revision};}
        notifyFailure('replace',err);return {ok:false,error:String(err&&err.message||err)};
      }
    });
    return bulkChain;
  }

  function candidateRevision(x){return Number(x&&x.revision||0);}
  function localRecordsCandidate(){
    var list=readJson(RECORDS_KEY,null),meta=readMeta(RECORDS_META);if(!Array.isArray(list))return null;
    var valid=true;if(meta&&meta.checksum){try{valid=checksum(list)===meta.checksum;}catch(e){valid=false;}}
    return valid?{source:'local',records:list,meta:meta||{revision:0,updatedAt:0,count:list.length,provisional:true}}:null;
  }
  function localSettingsCandidate(){
    var value=readJson(SETTINGS_KEY,null),meta=readMeta(SETTINGS_META);if(!validSettings(value))return null;
    var valid=true;if(meta&&meta.checksum){try{valid=checksum(value)===meta.checksum;}catch(e){valid=false;}}
    return valid?{source:'local',settings:value,meta:meta||{revision:0,updatedAt:0,provisional:true}}:null;
  }
  function newer(a,b){
    if(!a)return b;if(!b)return a;
    if(a.meta&&a.meta.provisional===true&&!(b.meta&&b.meta.provisional===true))return b;
    if(b.meta&&b.meta.provisional===true&&!(a.meta&&a.meta.provisional===true))return a;
    return candidateRevision(b.meta)>candidateRevision(a.meta)?b:a;
  }
  function applyToApp(records,settings,reason){
    try{
      if(window.state){
        if(validSettings(settings))window.state.settings=Object.assign(window.state.settings||{},shallowSettings(settings));
        if(Array.isArray(records)){
          var fb=String(window.state.settings&&window.state.settings.bolmeNo||'').trim(),fs=String(window.state.settings&&window.state.settings.seflik||'').trim();
          window.state.records=records.map(function(r){if(!r||typeof r!=='object')return r;var o=Object.assign({},r);if(!String(o.bolmeNo||o.bolme||o.bolme_no||'').trim()&&fb)o.bolmeNo=fb;if(!String(o.seflik||o.seflikAdi||o.seflik_adi||'').trim()&&fs)o.seflik=fs;return o;});
        }
      }
      try{if(window.MesahaRenderStorageV382&&window.MesahaRenderStorageV382.renderAllSoon)window.MesahaRenderStorageV382.renderAllSoon(30);else if(typeof window.renderAll==='function')window.renderAll();}catch(e){}
      notify('mesaha:storage-recovered',{reason:reason||'recovery',count:Array.isArray(records)?records.length:0,engine:'delta-v576'});
    }catch(e){}
  }
  async function recoverIntoApp(){
    if(recoveryPromise)return recoveryPromise;
    recoveryPromise=(async function(){
      var localRec=localRecordsCandidate(),localSet=localSettingsCandidate();
      var itemMeta=null,itemList=null,docRec=null,docSet=null;
      try{
        var dbVals=await Promise.all([
          idbGet(META_STORE,'records').catch(function(){return null;}),
          idbGet(DOC_STORE,'records').catch(function(){return null;}),
          idbGet(DOC_STORE,'settings').catch(function(){return null;})
        ]);
        itemMeta=dbVals[0];docRec=dbVals[1];docSet=dbVals[2];
        if(itemMeta&&itemMeta.initialized===true)itemList=await idbGetAll(RECORD_STORE);
      }catch(e){notifyWarning('recovery',e,{startup:true});}

      var recCandidate=localRec;
      if(envelopeValid('records',docRec))recCandidate=newer(recCandidate,{source:'document',records:docRec.value,meta:docRec});
      if(itemMeta&&itemMeta.initialized===true&&Array.isArray(itemList)&&Number(itemMeta.count||0)===itemList.length){recCandidate=newer(recCandidate,{source:'items',records:itemList,meta:itemMeta});}
      if(!recCandidate)recCandidate={source:'empty',records:[],meta:{revision:0,updatedAt:0,count:0,provisional:true}};

      var setCandidate=localSet;
      if(envelopeValid('settings',docSet))setCandidate=newer(setCandidate,{source:'document',settings:docSet.value,meta:docSet});
      if(!setCandidate)setCandidate={source:'empty',settings:{},meta:{revision:0,updatedAt:0,provisional:true}};

      bootRecords=shallowRecords(recCandidate.records);lastCommittedRecords=shallowRecords(recCandidate.records);bootRecordMeta=Object.assign({},recCandidate.meta||{});
      bootSettings=shallowSettings(setCandidate.settings);lastCommittedSettings=shallowSettings(setCandidate.settings);bootSettingsMeta=Object.assign({},setCandidate.meta||{});

      if(!(itemMeta&&itemMeta.initialized===true)){
        try{var migrated=await ensureRecordStore(bootRecords,bootRecordMeta);bootRecordMeta=Object.assign({},migrated);}catch(e){notifyWarning('records-migration',e,{startup:true});}
      }else if(recCandidate.source!=='items'&&candidateRevision(recCandidate.meta)>candidateRevision(itemMeta)){
        try{var synced=recordMetaFrom(itemMeta,bootRecords,'startup-record-store-sync');synced.revision=candidateRevision(recCandidate.meta)||synced.revision;synced.updatedAt=Number(recCandidate.meta&&recCandidate.meta.updatedAt||synced.updatedAt);await replaceRecordStore(bootRecords,synced,null);bootRecordMeta=Object.assign({},synced);}catch(e){notifyWarning('records-store-sync',e,{startup:true});}
      }
      if(recCandidate.source!=='local')scheduleLocalSnapshot('records',bootRecords,bootRecordMeta,500);
      if(setCandidate.source!=='local')scheduleLocalSnapshot('settings',bootSettings,bootSettingsMeta,400);

      var currentCount=window.state&&Array.isArray(window.state.records)?window.state.records.length:-1;
      var currentRev=readMeta(RECORDS_META)||{};
      var changed=currentCount!==bootRecords.length||candidateRevision(bootRecordMeta)>candidateRevision(currentRev)||recCandidate.source==='items';
      if(window.state&&(changed||setCandidate.source!=='local'))applyToApp(bootRecords,bootSettings,'newer-or-valid-revision');
      cleanLegacy();return {ok:true,changed:changed,records:bootRecords.length,source:recCandidate.source,engine:'delta-v576'};
    })().finally(function(){recoveryPromise=null;});
    return recoveryPromise;
  }

  function checkpointKind(kind,value,reason){
    if(kind==='records'){
      var list=Array.isArray(value)?value:[];scheduleLocalSnapshot('records',list,bootRecordMeta||{},0);return {ok:true,pending:true,engine:'delta-v576'};
    }
    var st=validSettings(value)?value:{};scheduleLocalSnapshot('settings',st,bootSettingsMeta||{},0);return {ok:true,pending:true,engine:'delta-v576'};
  }
  function checkpointAll(records,settings,opts){return {ok:true,records:checkpointKind('records',records,opts&&opts.reason),settings:checkpointKind('settings',settings,opts&&opts.reason),engine:'delta-v576'};}
  async function flush(){await Promise.all([recordChain.catch(function(){}),settingsChain.catch(function(){}),bulkChain.catch(function(){})]);return true;}
  function info(){return {recordsMeta:bootRecordMeta||readMeta(RECORDS_META),settingsMeta:bootSettingsMeta||readMeta(SETTINGS_META),recordsCount:(window.state&&Array.isArray(window.state.records)?window.state.records:bootRecords).length,pending:!!(snapshotJobs.records||snapshotJobs.settings||snapshotTimers.records||snapshotTimers.settings),database:DB_NAME,engine:'delta-v576',incremental:true};}

  bootRecords=legacyRecords();bootSettings=legacySettings();bootRecordMeta=readMeta(RECORDS_META);bootSettingsMeta=readMeta(SETTINGS_META);
  if(!bootRecordMeta)bootRecordMeta={revision:1,updatedAt:0,deletedAt:0,count:bootRecords.length,checksum:checksum(bootRecords),schema:2,provisional:true};
  if(!bootSettingsMeta)bootSettingsMeta={revision:1,updatedAt:0,count:Object.keys(bootSettings).length,checksum:checksum(bootSettings),schema:2,provisional:true};
  lastCommittedRecords=shallowRecords(bootRecords);lastCommittedSettings=shallowSettings(bootSettings);cleanLegacy();

  var api={
    __v527:true,__v576:true,engine:'delta-v576',
    bootstrapRecords:function(){return cloneRecordsForApi(bootRecords);},
    bootstrapSettings:function(){return shallowSettings(bootSettings);},
    saveRecordDelta:saveRecordDelta,
    saveRecords:saveRecords,
    saveSettings:saveSettings,
    replaceAll:replaceAll,
    checkpointRecords:function(records,reason){return checkpointKind('records',records,reason||'manual-records-checkpoint');},
    checkpointSettings:function(settings,reason){return checkpointKind('settings',settings,reason||'manual-settings-checkpoint');},
    checkpointAll:checkpointAll,
    clearRecords:function(reason){return saveRecords([],{reason:reason||'clear'});},
    recoverIntoApp:recoverIntoApp,
    flush:flush,
    info:info,
    lastCommittedRecords:function(){return cloneRecordsForApi(lastCommittedRecords);},
    lastCommittedSettings:function(){return shallowSettings(lastCommittedSettings);}
  };
  window.MesahaStorageV527=api;
  window.MesahaPersistentStoreV515={__v527:true,__v576:true,saveRecordDelta:saveRecordDelta,saveRecords:saveRecords,saveSettings:saveSettings,recoverIntoApp:recoverIntoApp};

  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(function(){});}catch(e){}
  setTimeout(function(){recoverIntoApp().catch(function(){});},40);
  window.addEventListener('pagehide',function(){flush();},{passive:true});
})();
;

/* module: mesaha-ios-actions.js */
/* Mesaha İO V5.76 — iOS kesimci ve son barkod işlemleri, giriş alanına sınırlı tek olay yolu. */
(function(){
  'use strict';
  if(window.__mesahaIosActionsV576)return;
  window.__mesahaIosActionsV576=true;window.__mesahaIosActionsV546=true;
  var ua=navigator.userAgent||'',isIOS=/iPad|iPhone|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);if(!isIOS)return;
  var usePointer=!!window.PointerEvent,gesture=null,syntheticTarget=null,syntheticClick=false,lastTarget=null,lastAt=0,MOVE_LIMIT=14,DUPLICATE_MS=850;
  function actionFrom(target){if(!target||!target.closest)return null;return target.closest('#addCutterBtn,#cutterChips [data-cutter],#cutterChips [data-cutter-select-v406],#cutterChips [data-cutter-edit-v406],#cutterChips [data-cutter-delete-v406],#recentList [data-edit],#recentList [data-recent-delete]');}
  function disabled(el){return !el||el.disabled||el.getAttribute('aria-disabled')==='true';}
  function stop(ev){try{if(ev&&ev.cancelable)ev.preventDefault();if(ev){ev.stopPropagation();ev.stopImmediatePropagation();}}catch(e){}}
  function runDirect(el){var entry=window.MesahaEntryActionsV546||{},cutter=window.MesahaCutterManagerV406||{};if(el.id==='addCutterBtn'&&typeof entry.addCutter==='function'){entry.addCutter();return true;}if(el.hasAttribute('data-cutter-select-v406')&&typeof cutter.select==='function'){cutter.select(el.getAttribute('data-cutter-select-v406')||'');return true;}if(el.hasAttribute('data-cutter-edit-v406')&&typeof cutter.edit==='function'){cutter.edit(el.getAttribute('data-cutter-edit-v406')||'');return true;}if(el.hasAttribute('data-cutter-delete-v406')&&typeof cutter.remove==='function'){cutter.remove(el.getAttribute('data-cutter-delete-v406')||'');return true;}if(el.hasAttribute('data-edit')&&typeof entry.editRecent==='function'){entry.editRecent(el.getAttribute('data-edit')||'');return true;}if(el.hasAttribute('data-recent-delete')&&typeof entry.deleteRecent==='function'){entry.deleteRecent(el.getAttribute('data-recent-delete')||'');return true;}return false;}
  function fire(el,source){if(disabled(el))return false;var t=Date.now();if(lastTarget===el&&t-lastAt<380)return true;lastTarget=el;lastAt=t;try{if(runDirect(el))return true;}catch(e){}syntheticTarget=el;syntheticClick=true;try{el.click();}catch(e){try{el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));}catch(_e){}}finally{syntheticClick=false;setTimeout(function(){if(syntheticTarget===el)syntheticTarget=null;},DUPLICATE_MS+60);}return true;}
  function bind(){
    var entry=document.getElementById('entryView');if(!entry||entry.__iosActionsV576)return;entry.__iosActionsV576=true;
    entry.addEventListener('click',function(ev){var el=actionFrom(ev.target);if(!el)return;if(syntheticClick&&el===syntheticTarget)return;if((el===syntheticTarget||el===lastTarget)&&Date.now()-lastAt<DUPLICATE_MS)stop(ev);},true);
    if(usePointer){
      entry.addEventListener('pointerdown',function(ev){if(ev.pointerType==='mouse')return;var el=actionFrom(ev.target);gesture=el&&!disabled(el)?{id:ev.pointerId,el:el,x:ev.clientX,y:ev.clientY,moved:false}:null;},{capture:true,passive:true});
      entry.addEventListener('pointermove',function(ev){if(gesture&&gesture.id===ev.pointerId&&(Math.abs(ev.clientX-gesture.x)>MOVE_LIMIT||Math.abs(ev.clientY-gesture.y)>MOVE_LIMIT))gesture.moved=true;},{capture:true,passive:true});
      entry.addEventListener('pointercancel',function(){gesture=null;},{capture:true,passive:true});
      entry.addEventListener('pointerup',function(ev){var g=gesture;gesture=null;if(!g||g.id!==ev.pointerId||g.moved||actionFrom(ev.target)!==g.el)return;stop(ev);fire(g.el,'ios-pointerup');},{capture:true,passive:false});
    }else{
      entry.addEventListener('touchstart',function(ev){var t=ev.touches&&ev.touches[0],el=actionFrom(ev.target);gesture=t&&el&&!disabled(el)?{el:el,x:t.clientX,y:t.clientY,moved:false}:null;},{capture:true,passive:true});
      entry.addEventListener('touchmove',function(ev){var t=ev.touches&&ev.touches[0];if(gesture&&t&&(Math.abs(t.clientX-gesture.x)>MOVE_LIMIT||Math.abs(t.clientY-gesture.y)>MOVE_LIMIT))gesture.moved=true;},{capture:true,passive:true});
      entry.addEventListener('touchcancel',function(){gesture=null;},{capture:true,passive:true});
      entry.addEventListener('touchend',function(ev){var g=gesture;gesture=null;if(!g||g.moved||actionFrom(ev.target)!==g.el)return;stop(ev);fire(g.el,'ios-touchend');},{capture:true,passive:false});
    }
  }
  function style(){if(document.getElementById('mesaha-ios-actions-v576-style'))return;var s=document.createElement('style');s.id='mesaha-ios-actions-v576-style';s.textContent='#addCutterBtn,#cutterChips button,#recentList button{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;pointer-events:auto!important}';(document.head||document.documentElement).appendChild(s);}
  function boot(){style();bind();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.MesahaIosActionsV576=window.MesahaIosActionsV546={isIOS:true,mode:usePointer?'pointer':'touch',fire:fire,boot:boot};
})();
;

/* module: mesaha-error-log.js */
(function(){
  'use strict';
  if(window.MesahaErrorLog && window.MesahaErrorLog.__current) return;
  var KEY='mesaha_error_log_v446';
  var MAX=50;
  function now(){try{return new Date().toISOString();}catch(e){return String(Date.now());}}
  function meta(extra){
    var v=window.MESAHA_VERSION||{};
    return Object.assign({at:now(),url:location.href,app:v.app||'',build:v.build||'',online:navigator.onLine,userAgent:navigator.userAgent},extra||{});
  }
  function cleanItem(x){
    if(!x || typeof x!=='object') return null;
    var out={};
    Object.keys(x).forEach(function(k){ if(!/^\d+$/.test(k)) out[k]=x[k]; });
    if(!out.at) out.at=now();
    if(!out.level) out.level=out.kind==='offline-entry-guard-ready'?'info':(out.level||'info');
    if(out.message==null) out.message='';
    return out;
  }
  function compact(arr){
    arr=Array.isArray(arr)?arr:[];
    var out=[], lastGuard=null;
    arr.forEach(function(raw){
      var x=cleanItem(raw); if(!x) return;
      if(x.kind==='offline-entry-guard-ready'){ lastGuard=x; return; }
      out.push(x);
    });
    if(lastGuard) out.push(lastGuard);
    return out.slice(-MAX);
  }
  function read(){try{var arr=JSON.parse(localStorage.getItem(KEY)||'[]');return compact(arr);}catch(e){return [];}}
  function write(arr){try{localStorage.setItem(KEY,JSON.stringify(compact(arr)));}catch(e){}}
  function textOf(x){try{if(!x)return ''; if(x.stack)return String(x.stack); if(x.message)return String(x.message); return String(x);}catch(e){return 'unknown';}}
  function skipInfo(kind,extra){
    try{
      if(kind==='offline-entry-guard-ready'){
        var v=window.MESAHA_VERSION||{};
        var k='mesaha_log_seen_'+kind+'_'+String(v.build||'')+'_'+String(navigator.onLine!==false);
        if(sessionStorage.getItem(k)) return true;
        sessionStorage.setItem(k,'1');
      }
    }catch(e){}
    return false;
  }
  function add(kind,err,extra){try{
    kind=kind||'error'; extra=extra||{};
    if(skipInfo(kind,extra)) return;
    var arr=read();
    arr.push(Object.assign(meta(extra),{kind:kind,message:textOf(err).slice(0,1600)}));
    write(arr);
    window.dispatchEvent(new CustomEvent('mesaha:error-log-updated',{detail:{count:read().length}}));
  }catch(e){}}
  function info(kind,extra){add(kind||'info',(extra&&extra.message)||'',Object.assign({level:'info'},extra||{}));}
  function error(kind,err,extra){add(kind||'error',err,extra||{});}
  function clear(){try{localStorage.removeItem(KEY);}catch(e){} }
  function download(){
    var arr=read(); write(arr);
    var payload=JSON.stringify({exportedAt:now(),version:window.MESAHA_VERSION||{},count:arr.length,items:arr},null,2);
    var blob=new Blob([payload],{type:'application/json;charset=utf-8'});
    var url=URL.createObjectURL(blob); var a=document.createElement('a');
    a.href=url; a.download='mesaha_hata_gunlugu_'+now().slice(0,10)+'.json'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},1200);
  }
  function toast(msg){try{if(typeof window.toast==='function')return window.toast(msg); alert(msg);}catch(e){}}
  window.addEventListener('error',function(ev){add('window.error',ev.error||ev.message,{source:ev.filename,line:ev.lineno,column:ev.colno,level:'error'});},true);
  window.addEventListener('unhandledrejection',function(ev){add('promise.rejection',ev.reason||'Unhandled promise rejection',{level:'error'});},true);
  window.addEventListener('mesaha:storage-error',function(ev){add('storage.error',(ev.detail&&ev.detail.message)||'storage error',Object.assign({level:'error'},ev.detail||{}));},true);
  function bind(){
    var d=document.getElementById('downloadErrorLogBtn'), c=document.getElementById('clearErrorLogBtn');
    if(d && !d.__errLog){d.__errLog=true; d.addEventListener('click',function(){download(); toast('Hata günlüğü indirildi.');});}
    if(c && !c.__errLog){c.__errLog=true; c.addEventListener('click',function(){clear(); toast('Hata günlüğü temizlendi.');});}
  }
  try{ write(read()); }catch(e){}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true}); else bind();
  [500,1500,3500].forEach(function(ms){setTimeout(bind,ms);});
  var api={__current:true,__v446:true,__v459:true,add:add,info:info,error:error,list:read,clear:clear,download:download};
  window.MesahaErrorLog=api;
  window.MesahaErrorLogV446=api;
  window.MesahaErrorLogV455=api;
  window.MesahaErrorLogV459=api;
})();
;

/* module: mesaha-url-cleanup.js */
(function(){
  'use strict';
  function meta(){ return window.MESAHA_VERSION || {}; }
  function build(){ var m=meta(); return String(m.assetVersion || m.build || 'current'); }
  function key(){ return 'mesaha_url_cleanup_current_done'; }
  function safeLog(oldV){
    try{
      var L=window.MesahaErrorLog || window.MesahaErrorLogV446;
      var msg='old='+oldV+' build='+build();
      if(L && typeof L.add==='function') L.add('url-version-cleaned', msg, {level:'info', oldVersion:String(oldV||''), targetBuild:build()});
      else if(L && typeof L.info==='function') L.info('url-version-cleaned', {message:msg, oldVersion:String(oldV||''), targetBuild:build()});
    }catch(e){}
  }
  function clean(){
    try{
      if(!(window.history && window.history.replaceState)) return false;
      var u=new URL(window.location.href);
      var oldV=u.searchParams.get('v');
      if(!oldV) return false;
      var p=window.location.pathname || '';
      var isIndex=(!p || /\/$/.test(p) || /\/index\.html$/i.test(p));
      if(!isIndex) return false;
      u.searchParams.delete('v');
      var next=u.pathname + (u.searchParams.toString() ? '?' + u.searchParams.toString() : '') + u.hash;
      window.history.replaceState(window.history.state || {}, document.title, next);
      try{ localStorage.setItem('mesaha_last_url_cleanup_current','old='+oldV+';build='+build()+';at='+(new Date()).toISOString()); }catch(e){}
      try{ if(sessionStorage.getItem(key())!==oldV){ sessionStorage.setItem(key(),oldV); setTimeout(function(){safeLog(oldV);},600); } }catch(e){}
      return true;
    }catch(e){ return false; }
  }
  clean();
})();
;
