/* Mesaha İO V70 — tek performans, görünüm ve kayıt toplamları çekirdeği. */
(function installMesahaPerformanceCore(root) {
  "use strict";
  if (!root || root.MesahaPerformanceCoreV70) return;

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
      document.documentElement.classList.toggle("mesaha-low-power-v70", ios ||
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

  root.MesahaPerformanceCoreV70 = Object.freeze({
    render: renderApi,
    stability: stabilityApi,
    stats: iosApi,
    refresh: function () { lightRefreshSoon(20); },
  });
})(typeof window !== "undefined" ? window : null);
