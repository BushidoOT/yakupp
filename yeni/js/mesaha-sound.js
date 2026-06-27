/* Mesaha İO v377 - tek ses motoru
   Onay ve uyarı ayrı WAV dosyalarıdır; çalışan motor tek global kaynaktır. */
(function(){
  'use strict';
  if (window.__mesahaSingleSoundEngineV377) return;
  window.__mesahaSingleSoundEngineV377 = true;

  var VERSION = String((window.MESAHA_VERSION && (window.MESAHA_VERSION.assetVersion || window.MESAHA_VERSION.build)) || '405');
  var SRC = {
    success: './assets/mesaha_onay.wav?v=' + VERSION,
    warning: './assets/mesaha_uyari.wav?v=' + VERSION
  };

  var pool = { success:null, warning:null };
  var last = { success:0, warning:0, any:0 };
  var unlocked = false;
  var original = {};
  var wrapped = {};
  var installed = {};

  function enabled(){
    try { return !(window.state && window.state.settings && window.state.settings.soundEnabled === false); }
    catch(e){ return true; }
  }

  function makeAudio(kind){
    try{
      var a = new Audio(SRC[kind] || SRC.success);
      a.preload = 'auto';
      a.volume = 1;
      try { a.load(); } catch(e) {}
      return a;
    }catch(e){ return null; }
  }

  function ensure(){
    if(!pool.success) pool.success = makeAudio('success');
    if(!pool.warning) pool.warning = makeAudio('warning');
  }

  function unlock(){
    if(unlocked) return;
    unlocked = true;
    ensure();
    ['success','warning'].forEach(function(kind){
      try{
        var a = pool[kind];
        if(!a) return;
        a.muted = true;
        var p = a.play();
        if(p && p.then){
          p.then(function(){ try{ a.pause(); a.currentTime = 0; a.muted = false; }catch(e){} })
           .catch(function(){ try{ a.muted = false; }catch(e){} });
        }else{
          try{ a.pause(); a.currentTime = 0; a.muted = false; }catch(e){}
        }
      }catch(e){}
    });
  }

  function fallback(kind){
    try{
      var AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return;
      var ctx = window.__mesahaSoundContextV377;
      if(!ctx || ctx.state === 'closed') ctx = window.__mesahaSoundContextV377 = new AC();
      if(ctx.state === 'suspended') ctx.resume().catch(function(){});
      var now = ctx.currentTime + 0.004;
      var freqs = kind === 'warning' ? [520,390] : [1046,1318];
      freqs.forEach(function(freq, i){
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        var t = now + i * 0.052;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(kind === 'warning' ? 0.22 : 0.24, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.095);
      });
    }catch(e){}
  }

  function normalizeKind(kind){
    kind = String(kind || '').toLowerCase();
    return /warn|warning|uyarı|uyari|error|hata|danger|delete|sil/.test(kind) ? 'warning' : 'success';
  }

  function argsText(args){
    var out = [];
    Array.prototype.slice.call(args || []).forEach(function(x){
      if(x == null) return;
      if(typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean') out.push(String(x));
      else if(typeof x === 'object'){
        ['type','kind','icon','title','message','msg','text','html','detail','sub','className'].forEach(function(k){
          try{ if(x[k] != null) out.push(String(x[k])); }catch(e){}
        });
      }
    });
    return out.join(' ').toLocaleLowerCase('tr-TR');
  }

  function kindFromArgs(args, defaultKind){
    var text = argsText(args);
    if(/hata|uyarı|uyari|dikkat|giriniz|seçiniz|seciniz|küçük|kucuk|büyük|buyuk|arasında|aralig|okunamadı|okunamadi|yüklenmedi|yuklenmedi|başarısız|basarisiz|boş|bos|silinsin|silindi|silinemedi|geçersiz|gecersiz|eksik|kayıtlı|kayitli|aynı barkod|ayni barkod|iptal|başarısız|basarisiz/.test(text)) return 'warning';
    if(/success|başarılı|basarili|eklendi|güncellendi|guncellendi|kaydedildi|alındı|alindi|yüklendi|yuklendi|tamamlandı|tamamlandi/.test(text)) return 'success';
    return normalizeKind(defaultKind || 'success');
  }

  function play(kind, force){
    kind = normalizeKind(kind);
    if(!force && !enabled()) return;
    var now = Date.now();
    if(!force){
      if(now - last.any < 170) return;          // toast + float toast çift sarmasını susturur
      if(now - (last[kind] || 0) < 220) return;
    }
    last.any = now;
    last[kind] = now;
    unlock();
    ensure();
    try{
      var a = pool[kind];
      if(!a){ fallback(kind); return; }
      var failed = false;
      try{ a.pause(); a.currentTime = 0; a.muted = false; a.volume = 1; }catch(e){}
      var p = a.play();
      if(p && p.catch){
        p.catch(function(){ if(!failed){ failed = true; fallback(kind); } });
      }
      setTimeout(function(){
        try{ if(a.paused && !failed){ failed = true; fallback(kind); } }catch(e){}
      }, 120);
    }catch(e){ fallback(kind); }
  }

  function callWithSound(fn, ctx, args, defaultKind){
    try{ play(kindFromArgs(args, defaultKind), false); }catch(e){}
    return fn.apply(ctx, args);
  }

  function wrapFn(name, fn, defaultKind){
    if(typeof fn !== 'function') return fn;
    if(fn.__mesahaSoundWrappedV377) return fn;
    var w = function(){ return callWithSound(fn, this, arguments, defaultKind); };
    try{ Object.defineProperty(w, 'name', {value:name + 'SoundWrapped'}); }catch(e){}
    w.__mesahaSoundWrappedV377 = true;
    w.__mesahaSoundRawV377 = fn;
    return w;
  }

  function installHook(name, defaultKind){
    if(installed[name]) return;
    installed[name] = true;
    var current;
    try{ current = window[name]; }catch(e){ current = undefined; }
    original[name] = (typeof current === 'function' && current.__mesahaSoundRawV377) ? current.__mesahaSoundRawV377 : current;
    wrapped[name] = wrapFn(name, original[name], defaultKind);
    try{
      Object.defineProperty(window, name, {
        configurable: true,
        enumerable: true,
        get: function(){ return wrapped[name]; },
        set: function(fn){
          original[name] = (typeof fn === 'function' && fn.__mesahaSoundRawV377) ? fn.__mesahaSoundRawV377 : fn;
          wrapped[name] = wrapFn(name, original[name], defaultKind);
        }
      });
    }catch(e){
      try{ if(typeof current === 'function') window[name] = wrapped[name]; }catch(_e){}
    }
  }

  function install(){
    ensure();
    installHook('toast', 'warning');
    installHook('mesahaFloatToastV315', 'success');
    installHook('mesahaFloatToastV314', 'success');
    installHook('modal', 'success');
    installHook('alert', 'warning');

    window.beep = function(){ play('success', false); };

    var api = {
      play:function(k){ play(k, false); },
      success:function(){ play('success', false); },
      warning:function(){ play('warning', false); },
      forceSuccess:function(){ play('success', true); },
      forceWarning:function(){ play('warning', true); },
      unlock:unlock,
      warm:unlock,
      test:function(){ play('success', true); setTimeout(function(){ play('warning', true); }, 360); },
      sources:SRC,
      singleEngine:true
    };

    window.mesahaSound = api;
    window.mesahaSound = api;
    window.mesahaSoundFixV377 = api;
    window.mesahaSoundFixV376 = api;
    window.mesahaSoundFixV374 = api;
    window.mesahaFastSoundV373 = api;
    window.mesahaSoundFeedbackV333 = { play:function(k){ play(k, false); }, beepDisabled:true };
    window.mesahaSoundFeedbackV335 = window.mesahaSoundFeedbackV333;
    window.mesahaSoundFeedbackV339 = {
      playSuccess:function(){ play('success', false); },
      playWarning:function(){ play('warning', false); },
      beepDisabled:true
    };
  }

  ['touchstart','pointerdown','mousedown','keydown','click'].forEach(function(evt){
    try{ document.addEventListener(evt, unlock, {capture:true, passive:true}); }catch(e){}
  });

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
