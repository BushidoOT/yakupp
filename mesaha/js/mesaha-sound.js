/* Mesaha İO V5.83 — iOS/Android tek ve gerçek WAV ses motoru.
   Sentetik bip üretmez; yalnız paket içindeki onay/uyarı dosyalarını çalar. */
(function () {
  "use strict";
  if (window.__mesahaExactSoundEngineV583) return;
  window.__mesahaExactSoundEngineV583 = true;

  var SRC = {
    success: "../assets/mesaha_onay.wav",
    warning: "../assets/mesaha_uyari.wav",
  };
  var htmlAudio = { success: null, warning: null };
  var buffers = { success: null, warning: null };
  var loading = { success: null, warning: null };
  var context = null;
  var gestureSeen = false;
  var htmlPrimed = false;
  var lastPrimeAttempt = 0;
  var lastAny = 0;
  var lastKind = { success: 0, warning: 0 };

  function normalizeKind(kind) {
    return /warn|warning|uyarı|uyari|error|hata|danger|delete|sil/i.test(
      String(kind || ""),
    )
      ? "warning"
      : "success";
  }

  function enabled() {
    try {
      return !(
        window.state &&
        window.state.settings &&
        window.state.settings.soundEnabled === false
      );
    } catch (_error) {
      return true;
    }
  }

  function ensureAudio(kind) {
    kind = normalizeKind(kind);
    if (htmlAudio[kind]) return htmlAudio[kind];
    try {
      var audio = new Audio(SRC[kind]);
      audio.preload = "auto";
      audio.volume = 1;
      audio.setAttribute("playsinline", "");
      try {
        audio.load();
      } catch (_error) {}
      htmlAudio[kind] = audio;
      return audio;
    } catch (_error) {
      return null;
    }
  }

  function ensureContext() {
    if (context && context.state !== "closed") return context;
    try {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      context = new AudioContextClass();
      window.__mesahaExactSoundContextV583 = context;
      return context;
    } catch (_error) {
      context = null;
      return null;
    }
  }

  function decodeAudio(ctx, arrayBuffer) {
    return new Promise(function (resolve, reject) {
      try {
        var copy = arrayBuffer.slice(0);
        var result = ctx.decodeAudioData(copy, resolve, reject);
        if (result && typeof result.then === "function") result.then(resolve, reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  function preload(kind) {
    kind = normalizeKind(kind);
    if (buffers[kind]) return Promise.resolve(buffers[kind]);
    if (loading[kind]) return loading[kind];
    var ctx = ensureContext();
    if (!ctx || typeof fetch !== "function") return Promise.resolve(null);
    loading[kind] = fetch(SRC[kind], { cache: "force-cache" })
      .then(function (response) {
        if (!response || !response.ok) throw new Error("Ses dosyası alınamadı");
        return response.arrayBuffer();
      })
      .then(function (arrayBuffer) {
        return decodeAudio(ctx, arrayBuffer);
      })
      .then(function (buffer) {
        buffers[kind] = buffer || null;
        return buffers[kind];
      })
      .catch(function () {
        return null;
      })
      .finally(function () {
        loading[kind] = null;
      });
    return loading[kind];
  }

  function resumeContext() {
    var ctx = ensureContext();
    if (!ctx) return Promise.resolve(false);
    try {
      if (ctx.state === "suspended") {
        var result = ctx.resume();
        if (result && typeof result.then === "function")
          return result.then(
            function () {
              return ctx.state === "running";
            },
            function () {
              return false;
            },
          );
      }
      return Promise.resolve(ctx.state === "running");
    } catch (_error) {
      return Promise.resolve(false);
    }
  }

  function primeHtmlAudio(kind) {
    if (htmlPrimed) return;
    var now = Date.now();
    if (now - lastPrimeAttempt < 900) return;
    lastPrimeAttempt = now;
    var audio = ensureAudio(kind);
    if (!audio) return;
    try {
      audio.muted = true;
      audio.currentTime = 0;
      var promise = audio.play();
      if (promise && typeof promise.then === "function") {
        promise.then(
          function () {
            htmlPrimed = true;
            try {
              audio.pause();
              audio.currentTime = 0;
              audio.muted = false;
            } catch (_error) {}
          },
          function () {
            htmlPrimed = false;
            try {
              audio.muted = false;
            } catch (_error) {}
          },
        );
      } else {
        htmlPrimed = true;
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      }
    } catch (_error) {
      htmlPrimed = false;
      try {
        audio.muted = false;
      } catch (_innerError) {}
    }
  }

  function warm(event) {
    if (event && event.isTrusted === false) return false;
    if (event && event.isTrusted === true) gestureSeen = true;
    if (!gestureSeen) return false;
    resumeContext();
    preload("success");
    preload("warning");
    /* İlk gerçek dokunuşta HTMLAudio da yetkilendirilir. Başarısız olursa
       kilit kalıcı sayılmaz; sonraki gerçek dokunuşlarda yeniden denenir. */
    primeHtmlAudio("success");
    return true;
  }

  function playBuffer(kind) {
    var ctx = ensureContext();
    var buffer = buffers[kind];
    if (!ctx || ctx.state !== "running" || !buffer) return false;
    try {
      var source = ctx.createBufferSource();
      var gain = ctx.createGain();
      source.buffer = buffer;
      gain.gain.value = 1;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function playHtml(kind) {
    var audio = ensureAudio(kind);
    if (!audio) return false;
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
      audio.volume = 1;
      var promise = audio.play();
      if (promise && typeof promise.catch === "function")
        promise.catch(function () {});
      return true;
    } catch (_error) {
      return false;
    }
  }

  function play(kind, force) {
    kind = normalizeKind(kind);
    if (!force && !enabled()) return false;
    if (!gestureSeen) return false;
    var now = Date.now();
    if (!force && (now - lastAny < 170 || now - lastKind[kind] < 220))
      return false;
    lastAny = now;
    lastKind[kind] = now;
    resumeContext();
    preload(kind);
    if (playBuffer(kind)) return true;
    return playHtml(kind);
  }

  function pauseAll() {
    Object.keys(htmlAudio).forEach(function (kind) {
      try {
        if (htmlAudio[kind]) htmlAudio[kind].pause();
      } catch (_error) {}
    });
  }

  function install() {
    ensureAudio("success");
    ensureAudio("warning");
    preload("success");
    preload("warning");
    var api = {
      play: function (kind) {
        return play(kind, false);
      },
      success: function () {
        return play("success", false);
      },
      warning: function () {
        return play("warning", false);
      },
      forceSuccess: function () {
        return play("success", true);
      },
      forceWarning: function () {
        return play("warning", true);
      },
      warm: warm,
      unlock: warm,
      prime: warm,
      test: function () {
        play("success", true);
      },
      sources: SRC,
      exactWavOnly: true,
      syntheticFallback: false,
    };
    window.beep = api.success;
    window.mesahaSound = api;
    window.mesahaSoundFixV583 = api;
    window.mesahaSoundFixV377 = api;
    window.mesahaSoundFixV376 = api;
    window.mesahaSoundFixV374 = api;
    window.mesahaFastSoundV373 = api;
  }

  ["pointerdown", "touchstart", "mousedown", "keydown", "click"].forEach(
    function (eventName) {
      try {
        document.addEventListener(eventName, warm, {
          capture: true,
          passive: true,
        });
      } catch (_error) {}
    },
  );
  document.addEventListener(
    "visibilitychange",
    function () {
      if (document.hidden) pauseAll();
    },
    { passive: true },
  );
  window.addEventListener("pagehide", pauseAll, { passive: true });

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
