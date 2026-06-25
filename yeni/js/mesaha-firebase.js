/* Mesaha İO v378 — tek Firebase motoru
   Amaç: Firebase SDK yükleme, initializeApp, anonymous auth ve Firestore settings işlemini tek promise üzerinden yürütmek. */
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

  function timeout(ms, label){
    return new Promise(function(_, reject){
      setTimeout(function(){ reject(new Error((label || 'İşlem') + ' zaman aşımı')); }, ms || 12000);
    });
  }

  function withTimeout(promise, ms, label){
    return Promise.race([promise, timeout(ms, label)]);
  }

  function scriptLoaded(src){
    try{
      return !!Array.prototype.find.call(document.scripts || [], function(s){
        return s && s.src && s.src.indexOf(src) !== -1;
      });
    }catch(e){ return false; }
  }

  function loadScript(src){
    return withTimeout(new Promise(function(resolve, reject){
      if(scriptLoaded(src)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.onload = function(){ resolve(); };
      s.onerror = function(){ reject(new Error('Firebase SDK yüklenemedi')); };
      document.head.appendChild(s);
    }), 12000, 'Firebase SDK');
  }

  async function ready(){
    if(!navigator.onLine) throw new Error('İnternet bağlantısı yok');
    if(!readyPromise){
      readyPromise = (async function(){
        const base = 'https://www.gstatic.com/firebasejs/' + SDK_VERSION;
        if(!window.firebase || !window.firebase.apps){
          await loadScript(base + '/firebase-app-compat.js');
          await loadScript(base + '/firebase-auth-compat.js');
          await loadScript(base + '/firebase-firestore-compat.js');
        }
        if(!window.firebase || !window.firebase.apps) throw new Error('Firebase başlatılamadı');
        if(!window.firebase.apps.length) window.firebase.initializeApp(CONFIG);
        const auth = window.firebase.auth();
        if(!auth.currentUser) await withTimeout(auth.signInAnonymously(), 12000, 'Firebase giriş');
        const db = window.firebase.firestore();
        if(!settingsApplied){
          try{ db.settings({experimentalAutoDetectLongPolling:true}); }catch(e){}
          settingsApplied = true;
        }
        try{ await withTimeout(db.enableNetwork(), 5000, 'Firebase ağ'); }catch(e){}
        return {db:db, auth:auth};
      })();
    }
    try{ return await readyPromise; }
    catch(e){ readyPromise = null; throw e; }
  }

  window.mesahaFirebaseV380 = {
    config: CONFIG,
    sdkVersion: SDK_VERSION,
    ready: ready,
    loadScript: loadScript,
    withTimeout: withTimeout
  };
})();
