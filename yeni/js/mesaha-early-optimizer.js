(function(){
  'use strict';
  if (window.__mesahaEarlyOptimizerV383) return;
  window.__mesahaEarlyOptimizerV383 = true;

  var root = document.documentElement;
  var nativeSetInterval = window.setInterval.bind(window);
  var nativeClearInterval = window.clearInterval.bind(window);
  var nativeSetTimeout = window.setTimeout.bind(window);
  var nativeClearTimeout = window.clearTimeout.bind(window);
  var managedIntervals = new Map();
  var managedSeq = 1;

  function safeConnection(){
    try { return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null; }
    catch(e){ return null; }
  }

  function isSaveData(){
    var c = safeConnection();
    return !!(c && c.saveData);
  }

  function scheduleDelay(ms){
    ms = Math.max(0, Number(ms) || 0);
    if (document.hidden) return Math.max(ms, 60000);
    if (isSaveData()) return Math.max(ms, 3000);
    return Math.max(ms, 1000);
  }

  // Çok sık çalışan eski yama interval'leri uygulama görünmüyorken pili yemesin.
  window.setInterval = function(fn, ms){
    var args = Array.prototype.slice.call(arguments, 2);
    ms = Number(ms) || 0;
    if (typeof fn !== 'function' || ms >= 10000) {
      return nativeSetInterval.apply(window, arguments);
    }
    var id = '__mesaha_interval_' + (managedSeq++);
    var active = true;
    var timer = 0;
    function run(){
      if (!active) return;
      timer = nativeSetTimeout(function(){
        if (!active) return;
        if (!document.hidden) {
          try { fn.apply(window, args); }
          catch (err) { nativeSetTimeout(function(){ throw err; }, 0); }
        }
        run();
      }, scheduleDelay(ms));
    }
    run();
    managedIntervals.set(id, function(){ active = false; if (timer) nativeClearTimeout(timer); });
    return id;
  };

  window.clearInterval = function(id){
    if (managedIntervals.has(id)) {
      try { managedIntervals.get(id)(); } catch(e) {}
      managedIntervals.delete(id);
      return;
    }
    return nativeClearInterval(id);
  };

  // Aynı global event listener tekrar tekrar bağlanınca tekini bırak.
  try {
    var nativeAdd = EventTarget.prototype.addEventListener;
    var seenByTarget = new WeakMap();
    var dedupeTypes = {
      click:1, touchstart:1, touchend:1, pointerdown:1, pointerup:1,
      online:1, offline:1, visibilitychange:1, pagehide:1, beforeunload:1,
      resize:1, orientationchange:1, storage:1
    };
    function globalTarget(t){
      return t === window || t === document || t === document.documentElement || t === document.body;
    }
    function captureOf(options){
      if (options === true) return '1';
      if (options && typeof options === 'object' && options.capture) return '1';
      return '0';
    }
    EventTarget.prototype.addEventListener = function(type, listener, options){
      if (listener && dedupeTypes[type] && globalTarget(this)) {
        try {
          var src = typeof listener === 'function' ? Function.prototype.toString.call(listener) : String(listener);
          if (src && src.length < 6000) {
            var map = seenByTarget.get(this);
            if (!map) { map = Object.create(null); seenByTarget.set(this, map); }
            var key = type + '|' + captureOf(options) + '|' + src;
            if (map[key]) return;
            map[key] = 1;
          }
        } catch(e) {}
      }
      return nativeAdd.call(this, type, listener, options);
    };
  } catch(e) {}

  if (!window.requestIdleCallback) {
    window.requestIdleCallback = function(cb, opts){
      var start = Date.now();
      var timeout = opts && opts.timeout ? opts.timeout : 800;
      return nativeSetTimeout(function(){
        cb({ didTimeout: Date.now() - start >= timeout, timeRemaining: function(){ return Math.max(0, 50 - (Date.now() - start)); } });
      }, 1);
    };
    window.cancelIdleCallback = function(id){ nativeClearTimeout(id); };
  }

  function applyPowerClass(){
    try {
      root.classList.toggle('mesaha-low-power', document.hidden || isSaveData());
      root.classList.toggle('mesaha-save-data', isSaveData());
    } catch(e) {}
  }
  try {
    var style = document.createElement('style');
    style.id = 'mesaha-v383-power-style';
    style.textContent = 'html.mesaha-low-power *{animation-play-state:paused!important}html.mesaha-save-data .hero-cover-image{filter:none!important}@media (prefers-reduced-motion: reduce){*{scroll-behavior:auto!important;animation-duration:.001ms!important;transition-duration:.001ms!important}}';
    document.head.appendChild(style);
  } catch(e) {}
  applyPowerClass();
  document.addEventListener('visibilitychange', applyPowerClass, {passive:true});
  window.addEventListener('pageshow', applyPowerClass, {passive:true});

  window.mesahaEarlyOptimizerV383 = {
    active: true,
    managedIntervals: function(){ return managedIntervals.size; },
    saveData: isSaveData
  };
})();
