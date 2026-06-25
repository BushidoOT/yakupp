/*!
 * Mesaha İO - Ses geri bildirimi (TEK motor)
 * v380-refactor
 *
 * Bu dosya, index.html içindeki iki ayrı ses bloğunun (v374 + v376) yerini alır.
 * Eski yapıda toast() iki kez sarılıyordu ve her bildirimde iki ses üst üste
 * çalıyordu (üstelik uyarı/başarı tespiti iki blokta farklıydı). Burada toast,
 * alert ve modal yalnızca BİR kez, tek bir guard ile sarılır.
 *
 * Çalınan dosyalar: ./assets/mesaha_onay_v376.wav, ./assets/mesaha_uyari_v376.wav
 * Ses çalınamazsa AudioContext ile kısa çift ton yedek devreye girer.
 */
(function () {
  'use strict';

  var SRC = {
    success: './assets/mesaha_onay_v376.wav?v=380',
    warning: './assets/mesaha_uyari_v376.wav?v=380'
  };

  var pool = {};                       // önceden yüklenmiş Audio nesneleri
  var last = { success: 0, warning: 0 }; // arka arkaya çift tetiklemeyi engelleme
  var unlocked = false;                // mobil otomatik oynatma kilidi açıldı mı

  // Kullanıcı sesi ayarlardan kapatmış olabilir.
  function enabled() {
    try {
      return !(window.state && window.state.settings && window.state.settings.soundEnabled === false);
    } catch (e) {
      return true;
    }
  }

  function make(kind) {
    try {
      var a = new Audio(SRC[kind] || SRC.success);
      a.preload = 'auto';
      a.volume = 1;
      a.load();
      return a;
    } catch (e) {
      return null;
    }
  }

  function ensure() {
    if (!pool.success) pool.success = make('success');
    if (!pool.warning) pool.warning = make('warning');
  }

  // iOS/Android: ilk kullanıcı etkileşiminde sesleri sessizce bir kez oynatıp
  // duraklatarak otomatik oynatma kilidini açar.
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    ensure();
    ['success', 'warning'].forEach(function (k) {
      try {
        var a = pool[k];
        if (!a) return;
        a.muted = true;
        var p = a.play();
        if (p && p.then) {
          p.then(function () {
            try { a.pause(); a.currentTime = 0; a.muted = false; } catch (e) {}
          }).catch(function () {
            try { a.muted = false; } catch (e) {}
          });
        } else {
          try { a.pause(); a.currentTime = 0; a.muted = false; } catch (e) {}
        }
      } catch (e) {}
    });
  }

  // WAV çalınamazsa son çare: kısa çift ton.
  function fallback(kind) {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ctx = window.__mesahaSoundCtx;
      if (!ctx || ctx.state === 'closed') ctx = window.__mesahaSoundCtx = new AC();
      if (ctx.state === 'suspended') ctx.resume().catch(function () {});
      var now = ctx.currentTime + 0.004;
      var freqs = kind === 'warning' ? [520, 390] : [1046, 1318];
      freqs.forEach(function (freq, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        var t = now + i * 0.052;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(kind === 'warning' ? 0.23 : 0.25, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.095);
      });
    } catch (e) {}
  }

  function play(kind, force) {
    if (!force && !enabled()) return;
    kind = (kind === 'warning' || kind === 'error' || kind === 'warn') ? 'warning' : 'success';
    var now = Date.now();
    if (now - (last[kind] || 0) < 220) return; // 220ms içinde aynı türü tekrar çalma
    last[kind] = now;
    unlock();
    ensure();
    try {
      var a = pool[kind] || make(kind);
      pool[kind] = a;
      if (!a) { fallback(kind); return; }
      var failed = false;
      try { a.pause(); a.currentTime = 0; a.muted = false; a.volume = 1; } catch (e) {}
      var p = a.play();
      if (p && p.catch) {
        p.catch(function () { if (!failed) { failed = true; fallback(kind); } });
      }
      setTimeout(function () {
        try { if (a.paused && !failed) { failed = true; fallback(kind); } } catch (e) {}
      }, 110);
    } catch (e) {
      fallback(kind);
    }
  }

  // Toast/alert/modal metninden uyarı mı başarı mı olduğunu anlar.
  function isWarning(args) {
    var msg = Array.prototype.slice.call(args || []).join(' ').toLocaleLowerCase('tr-TR');
    return /hata|uyarı|uyari|dikkat|giriniz|seçiniz|seciniz|küçük|kucuk|büyük|buyuk|arasında|aralig|okunamadı|okunamadi|yüklenmedi|yuklenmedi|başarısız|basarisiz|boş|bos|silinsin|silindi|silinemedi|geçersiz|gecersiz|eksik|kayıtlı|kayitli|aynı barkod|ayni barkod/.test(msg);
  }

  // TEK guard: toast/alert/modal yalnızca bir kez sarılır, asla iki kez değil.
  var WRAP_FLAG = '__mesahaSoundWrapped';

  function wrapToast() {
    if (!window.toast || window.toast[WRAP_FLAG]) return;
    var old = window.toast;
    var wrapped = function () {
      try { play(isWarning(arguments) ? 'warning' : 'success', false); } catch (e) {}
      return old.apply(this, arguments);
    };
    wrapped[WRAP_FLAG] = true;
    window.toast = wrapped;
  }

  function wrapAlert() {
    if (!window.alert || window.alert[WRAP_FLAG]) return;
    var oldAlert = window.alert;
    var wrappedAlert = function (msg) {
      try { play(isWarning([msg]) ? 'warning' : 'success', false); } catch (e) {}
      return oldAlert.apply(window, arguments);
    };
    wrappedAlert[WRAP_FLAG] = true;
    window.alert = wrappedAlert;
  }

  function wrapModal() {
    if (!window.modal || window.modal[WRAP_FLAG]) return;
    var oldModal = window.modal;
    var wrappedModal = function (opts) {
      try {
        var kind = opts && (opts.type || opts.kind || opts.icon || opts.title || opts.html);
        play(isWarning([kind]) ? 'warning' : 'success', false);
      } catch (e) {}
      return oldModal.apply(this, arguments);
    };
    wrappedModal[WRAP_FLAG] = true;
    window.modal = wrappedModal;
  }

  function expose() {
    ensure();
    wrapToast();
    wrapAlert();
    wrapModal();

    window.beep = function () { play('success', false); };

    // Eski sürümlerin beklediği global'ler korunur (geriye dönük uyumluluk).
    window.mesahaFastSoundV373 = {
      success: function () { play('success', false); },
      warning: function () { play('warning', false); },
      play: function (k) { play(k, false); },
      warm: unlock
    };

    window.mesahaSoundFixV374 = {
      play: function (k) { play(k, false); },
      success: function () { play('success', false); },
      warning: function () { play('warning', false); },
      unlock: unlock,
      test: function () { play('success', true); setTimeout(function () { play('warning', true); }, 350); }
    };

    window.mesahaSoundFixV376 = {
      play: function (k) { play(k, false); },
      success: function () { play('success', false); },
      warning: function () { play('warning', false); },
      forceWarning: function () { play('warning', true); },
      forceSuccess: function () { play('success', true); },
      unlock: unlock,
      test: function () { play('success', true); setTimeout(function () { play('warning', true); }, 350); }
    };

    window.mesahaSoundFeedbackV333 = {
      play: function (k) { play(k === 'warning' || k === 'error' ? 'warning' : 'success', false); },
      beepDisabled: true
    };
    window.mesahaSoundFeedbackV335 = window.mesahaSoundFeedbackV333;
    window.mesahaSoundFeedbackV339 = {
      playSuccess: function () { play('success', false); },
      playWarning: function () { play('warning', false); },
      beepDisabled: true
    };
  }

  // İlk kullanıcı etkileşiminde otomatik oynatma kilidini aç.
  ['touchstart', 'pointerdown', 'mousedown', 'keydown', 'click'].forEach(function (evt) {
    document.addEventListener(evt, unlock, { capture: true, passive: true });
  });

  // toast() geç tanımlanmış olabilir; DOM hazır olunca ve birkaç kez daha sar.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', expose, { once: true });
  } else {
    expose();
  }
  [60, 160, 400, 900, 1800, 3500].forEach(function (ms) { setTimeout(expose, ms); });
})();
