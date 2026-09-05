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
