/* Mesaha İO v414 — sağlam Firebase motoru
   Amaç: navigator.onLine hatasına takılmadan Firebase SDK yükleme, anonymous auth ve Firestore bağlantısını tek güvenli promise ile yürütmek. */
(function(){
  'use strict';
  const CONFIG = {
    apiKey:'AIzaSyCKveylTPgKmWEMmYf-aFj6yLXB5CKAiJ0',
    authDomain:'mesaha-io.firebaseapp.com',
    projectId:'mesaha-io',
    storageBucket:'mesaha-io.firebasestorage.app',
    messagingSenderId:'840655878243',
    appId:'1:840655878243:web:add76f52bbf55ad9dd6056',
    measurementId:'G-81JPD5ZY44'
  };
  const SDK_VERSION = '9.23.0';
  let readyPromise = null;
  let settingsApplied = false;
  let lastOkMs = 0;
  let lastError = '';

  function timeout(ms, label){
    return new Promise(function(_, reject){
      setTimeout(function(){ reject(new Error((label || 'İşlem') + ' zaman aşımı')); }, ms || 15000);
    });
  }

  function withTimeout(promise, ms, label){
    return Promise.race([promise, timeout(ms, label)]);
  }

  function normalize(src){
    try{ return new URL(src, location.href).href; }catch(e){ return String(src || ''); }
  }

  function findScript(src){
    const wanted = normalize(src);
    try{
      return Array.prototype.find.call(document.scripts || [], function(s){
        return s && s.src && normalize(s.src) === wanted;
      }) || null;
    }catch(e){ return null; }
  }

  function loadScript(src){
    return withTimeout(new Promise(function(resolve, reject){
      const old = findScript(src);
      if(old){
        if(old.__mesahaFirebaseLoaded) return resolve();
        if(old.__mesahaFirebaseError) old.parentNode && old.parentNode.removeChild(old);
        else{
          old.addEventListener('load', function(){ old.__mesahaFirebaseLoaded = true; resolve(); }, {once:true});
          old.addEventListener('error', function(){ old.__mesahaFirebaseError = true; reject(new Error('Firebase SDK yüklenemedi')); }, {once:true});
          return;
        }
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.defer = false;
      s.crossOrigin = 'anonymous';
      s.referrerPolicy = 'no-referrer';
      s.onload = function(){ s.__mesahaFirebaseLoaded = true; resolve(); };
      s.onerror = function(){ s.__mesahaFirebaseError = true; reject(new Error('Firebase SDK yüklenemedi')); };
      document.head.appendChild(s);
    }), 15000, 'Firebase SDK');
  }

  async function loadSdk(){
    const base = 'https://www.gstatic.com/firebasejs/' + SDK_VERSION;
    if(!window.firebase || !window.firebase.apps){
      await loadScript(base + '/firebase-app-compat.js');
      await loadScript(base + '/firebase-auth-compat.js');
      await loadScript(base + '/firebase-firestore-compat.js');
    }
    if(!window.firebase || !window.firebase.apps) throw new Error('Firebase başlatılamadı');
  }

  async function ready(){
    // navigator.onLine bazı terminal/Chrome kurulumlarında yanlış false dönebiliyor.
    // Bu yüzden burada bağlantıyı navigator yerine gerçek Firebase denemesi belirler.
    if(!readyPromise){
      readyPromise = (async function(){
        await loadSdk();
        if(!window.firebase.apps.length) window.firebase.initializeApp(CONFIG);
        const auth = window.firebase.auth();
        if(!auth.currentUser) await withTimeout(auth.signInAnonymously(), 15000, 'Firebase giriş');
        const db = window.firebase.firestore();
        if(!settingsApplied){
          try{ db.settings({experimentalForceLongPolling:true}); }catch(e){
            try{ db.settings({experimentalAutoDetectLongPolling:true}); }catch(_e){}
          }
          settingsApplied = true;
        }
        try{ await withTimeout(db.enableNetwork(), 8000, 'Firebase ağ'); }catch(e){}
        lastOkMs = Date.now();
        lastError = '';
        return {db:db, auth:auth};
      })();
    }
    try{ return await readyPromise; }
    catch(e){
      readyPromise = null;
      lastError = e && e.message ? e.message : String(e || 'Firebase hatası');
      throw e;
    }
  }

  async function health(){
    const r = await ready();
    try{
      await withTimeout(r.db.collection('healthChecks').doc('client').set({ok:true, atMs:Date.now(), appVersion:(window.APP_VERSION||'V3.99'), source:'client'}, {merge:true}), 12000, 'Firebase test');
    }catch(e){
      readyPromise = null;
      lastError = e && e.message ? e.message : String(e || 'Firebase test hatası');
      throw e;
    }
    lastOkMs = Date.now();
    lastError = '';
    return r;
  }

  function reset(){ readyPromise = null; lastError = ''; }
  function status(){ return {ok:!!lastOkMs, lastOkMs:lastOkMs, lastError:lastError, online:navigator.onLine !== false}; }

  var firebaseApi = {
    config: CONFIG,
    sdkVersion: SDK_VERSION,
    ready: ready,
    health: health,
    reset: reset,
    status: status,
    loadScript: loadScript,
    withTimeout: withTimeout
  };

  window.mesahaFirebase = firebaseApi;
  window.mesahaFirebaseV383 = firebaseApi;
  window.mesahaFirebaseV380 = firebaseApi;
})();
