/* Mesaha İO v190 - performans paketi
   Amaç: Giriş Modu/Yeni Kayıt sırasında ağır liste ve özet tekrarlarını azaltmak.
   ORBİS XLS, kayıt veri modeli ve yedek formatı değiştirilmedi. */
(function(){
  'use strict';
  var BUILD = 'v190';
  var VISIBLE = 'Mesaha İO v2.18 Performans';
  var SHORT = 'v2.18';

  function safe(fn, fallback){ try { return fn(); } catch(_) { return fallback; } }
  function now(){ return Date.now ? Date.now() : (new Date()).getTime(); }
  function entryFastMode(){
    return safe(function(){
      return !!(document.body.classList.contains('inline-simple-v119') ||
        document.body.classList.contains('clean-simple-open-v111') ||
        (!document.body.classList.contains('show-records') && !document.body.classList.contains('show-admin')));
    }, false);
  }
  function recordsVisible(){
    return safe(function(){
      var nav = document.getElementById('navRecords');
      return !!(document.body.classList.contains('show-records') || (nav && nav.classList.contains('active')));
    }, false);
  }
  function markRecordsChanged(){
    window.__mesahaRecordsRevisionV189 = (Number(window.__mesahaRecordsRevisionV189) || 0) + 1;
    window.__mesahaLastWriteMsV189 = now();
  }

  // Kayıt yazımlarını işaretle; aynı kayıt işleminde özet tekrarını tek hesaplamaya indir.
  safe(function(){
    if (typeof saveRecords === 'function' && !saveRecords.__v190Perf) {
      var oldSave = saveRecords;
      saveRecords = function(){
        markRecordsChanged();
        return oldSave.apply(this, arguments);
      };
      saveRecords.__v190Perf = true;
      saveRecords.__old = oldSave;
    }
  });

  // Özet kartları aynı revizyonda art arda çağrılırsa tekrar hesaplama yapma.
  safe(function(){
    if (typeof forceRefreshSummaryCards === 'function' && !forceRefreshSummaryCards.__v190Perf) {
      var oldSummary = forceRefreshSummaryCards;
      forceRefreshSummaryCards = function(){
        var rev = Number(window.__mesahaRecordsRevisionV189) || 0;
        var t = now();
        if (forceRefreshSummaryCards.__lastRev === rev && (t - (forceRefreshSummaryCards.__lastAt || 0)) < 350) return;
        var result = oldSummary.apply(this, arguments);
        forceRefreshSummaryCards.__lastRev = rev;
        forceRefreshSummaryCards.__lastAt = now();
        return result;
      };
      forceRefreshSummaryCards.__v190Perf = true;
      forceRefreshSummaryCards.__old = oldSummary;
    }
  });

  // Günlük özet de hızlı girişte aynı revizyonda üst üste çalışmasın.
  safe(function(){
    if (typeof renderDailyWorkSummary === 'function' && !renderDailyWorkSummary.__v190Perf) {
      var oldDaily = renderDailyWorkSummary;
      renderDailyWorkSummary = function(){
        var rev = Number(window.__mesahaRecordsRevisionV189) || 0;
        var t = now();
        if (renderDailyWorkSummary.__lastRev === rev && (t - (renderDailyWorkSummary.__lastAt || 0)) < 350) return;
        var result = oldDaily.apply(this, arguments);
        renderDailyWorkSummary.__lastRev = rev;
        renderDailyWorkSummary.__lastAt = now();
        return result;
      };
      renderDailyWorkSummary.__v190Perf = true;
      renderDailyWorkSummary.__old = oldDaily;
    }
  });

  // Kayıtlar sekmesine girilince ertelenen tabloyu tam çiz.
  function forceRecordsRenderSoon(){
    if (!recordsVisible()) return;
    window.__mesahaForceFullRenderV189 = true;
    setTimeout(function(){
      safe(function(){ if (typeof render === 'function') render(); });
      window.__mesahaForceFullRenderV189 = false;
    }, 30);
  }
  safe(function(){
    var nav = document.getElementById('navRecords');
    if (nav && !nav.__v190PerfBound) {
      nav.__v190PerfBound = true;
      nav.addEventListener('click', forceRecordsRenderSoon, {passive:true});
    }
    document.addEventListener('click', function(ev){
      var t = ev && ev.target;
      if (t && t.closest && t.closest('#navRecords,[data-flow-tab="records"]')) forceRecordsRenderSoon();
    }, {capture:true, passive:true});
  });

  // Hızlı girişte son kayıt kutucuğunu hafif ve seyrek yenile.
  safe(function(){
    if (typeof renderCleanRecentV111 === 'function' && !renderCleanRecentV111.__v190Perf) {
      var oldCleanRecent = renderCleanRecentV111;
      renderCleanRecentV111 = function(){
        var t = now();
        if (entryFastMode() && (t - (renderCleanRecentV111.__lastAt || 0)) < 180) return;
        renderCleanRecentV111.__lastAt = t;
        return oldCleanRecent.apply(this, arguments);
      };
      renderCleanRecentV111.__v190Perf = true;
      renderCleanRecentV111.__old = oldCleanRecent;
    }
  });

  // Görünür sürüm bilgisi.
  safe(function(){
    window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, {
      fileVersion: BUILD,
      visibleVersion: VISIBLE,
      shortVersion: SHORT,
      performanceBuildV189: true,
      deferredRecordsTable: true,
      summaryDedupe: true,
      imageOptimized: true
    });
    var meta = document.querySelector('meta[name="mesaha-build"]');
    if (meta) meta.setAttribute('content', BUILD);
    document.title = VISIBLE;
    Array.prototype.forEach.call(document.querySelectorAll('[data-app-version-short]'), function(el){ el.textContent = SHORT; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-app-version-build]'), function(el){ el.textContent = BUILD; });
  });
})();
