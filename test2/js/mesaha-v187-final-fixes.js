(function(){
  'use strict';
  var TAG = 'v187-final-fixes';
  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function byId(id){ return document.getElementById(id); }
  function safe(fn, fallback){ try{ return fn(); }catch(e){ try{ console.warn('[Mesaha İO '+TAG+']', e); }catch(_){} return fallback; } }
  function trNum(v){
    var n = Number(v);
    if(!isFinite(n)) return String(v || '').trim();
    if(Math.abs(n - Math.round(n)) < 0.00001) return String(Math.round(n));
    return n.toLocaleString('tr-TR', {maximumFractionDigits:2}).replace(/,00$/,'');
  }
  function productName(v){
    var t = String(v || 'Tomruk').trim();
    var l = t.toLocaleLowerCase('tr-TR');
    if(l.indexOf('maden') >= 0) return 'Maden';
    if(l.indexOf('kağıt') >= 0 || l.indexOf('kagit') >= 0) return 'Kağıtlık';
    if(l.indexOf('sanayi') >= 0) return 'Sanayi';
    if(l.indexOf('tel') >= 0) return 'Tel';
    return 'Tomruk';
  }
  function formatRecordMessage(rec, action){
    rec = rec || {};
    var barcode = String(rec.barcode || '').trim() || '-';
    var cap = trNum(rec.diameter != null ? rec.diameter : rec.cap);
    var boy = trNum(rec.length != null ? rec.length : rec.boy);
    return barcode + ' ' + cap + 'Ç ' + boy + 'B ' + productName(rec.productType || rec.odunAdi) + ' ' + action;
  }
  function patchToastText(){
    safe(function(){
      if(typeof showSuccessToast !== 'function' || showSuccessToast.__v187Detailed) return;
      var old = showSuccessToast;
      showSuccessToast = function(message){
        var text = String(message || '');
        try{
          var rec = (typeof state !== 'undefined' && Array.isArray(state.records) && state.records.length) ? state.records[0] : null;
          if(rec && /\beklendi\b/i.test(text)) text = formatRecordMessage(rec, 'Eklendi');
          else if(/\bgüncellendi\b/i.test(text)){
            var edited = null;
            if(typeof state !== 'undefined' && Array.isArray(state.records)){
              edited = state.records.find(function(r){ return state.editingId && r.id === state.editingId; }) || rec;
            }
            if(edited) text = formatRecordMessage(edited, 'Güncellendi');
          }
        }catch(_){ }
        return old.call(this, text);
      };
      showSuccessToast.__v187Detailed = true;
    });
  }
  function updateKeyboardVar(){
    safe(function(){
      var vv = window.visualViewport;
      var off = 0;
      if(vv) off = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty('--keyboard-offset', Math.round(off) + 'px');
    });
  }
  function patchKeyboard(){
    updateKeyboardVar();
    if(window.visualViewport && !window.__mesahaKeyboardV187){
      window.__mesahaKeyboardV187 = true;
      window.visualViewport.addEventListener('resize', updateKeyboardVar, {passive:true});
      window.visualViewport.addEventListener('scroll', updateKeyboardVar, {passive:true});
      window.addEventListener('resize', updateKeyboardVar, {passive:true});
      document.addEventListener('focusin', function(){ setTimeout(updateKeyboardVar, 40); setTimeout(updateKeyboardVar, 220); }, true);
      document.addEventListener('focusout', function(){ setTimeout(updateKeyboardVar, 80); setTimeout(updateKeyboardVar, 260); }, true);
    }
  }
  function hideHomeLast(){
    safe(function(){
      ['homeLastDateV143','homeLastTreeV143'].forEach(function(id){
        var el = byId(id);
        var btn = el && el.closest ? el.closest('button') : null;
        if(btn){ btn.classList.add('home-last-barcode-v187-hidden'); btn.setAttribute('aria-hidden','true'); }
      });
    });
  }
  function storeLastLength(value){
    var v = String(value == null ? '' : value).trim();
    if(!v) return;
    try{ localStorage.setItem('mesaha_simple_last_length_v1', v); }catch(_){ }
    safe(function(){ if(typeof state !== 'undefined' && state.settings) state.settings.lastLength = v; });
    var main = byId('length'); if(main && main.value !== v) main.value = v;
    safe(function(){ if(typeof saveSettings === 'function') saveSettings(); });
  }
  function patchLastLength(){
    var cleanLen = byId('cleanLengthV111');
    if(cleanLen && !cleanLen.__v187LastLength){
      cleanLen.__v187LastLength = true;
      ['input','change','blur'].forEach(function(evt){ cleanLen.addEventListener(evt, function(){ storeLastLength(cleanLen.value); }, true); });
    }
    document.addEventListener('click', function(ev){
      var btn = ev.target && ev.target.closest ? ev.target.closest('[data-clean-length]') : null;
      if(btn){ setTimeout(function(){ var len = byId('cleanLengthV111'); storeLastLength((len && len.value) || btn.getAttribute('data-clean-length') || btn.textContent || ''); }, 10); }
      var save = ev.target && ev.target.closest ? ev.target.closest('#cleanSaveV111,#submitBtn') : null;
      if(save){ setTimeout(function(){ var len = byId('cleanLengthV111') || byId('length'); storeLastLength(len && len.value); }, 20); }
    }, true);
    if(document.body && !document.body.__v187LengthObserver && window.MutationObserver){
      document.body.__v187LengthObserver = true;
      var lastOpen = document.body.classList.contains('clean-simple-open-v111');
      new MutationObserver(function(){
        var open = document.body.classList.contains('clean-simple-open-v111');
        if(open && !lastOpen){
          setTimeout(function(){
            var len = byId('cleanLengthV111'); if(!len) return;
            var saved = '';
            try{ saved = localStorage.getItem('mesaha_simple_last_length_v1') || ''; }catch(_){ }
            var st = safe(function(){ return (typeof state !== 'undefined' && state.settings && state.settings.lastLength) || ''; }, '');
            var main = byId('length');
            var best = String(saved || st || (main && main.value) || '').trim();
            if(best) len.value = best;
          }, 35);
        }
        lastOpen = open;
      }).observe(document.body, {attributes:true, attributeFilter:['class']});
    }
  }
  function orderRecordsTools(){
    safe(function(){
      var tools = document.querySelector('.records-panel .tools');
      if(!tools || tools.__v187Ordered) return;
      tools.__v187Ordered = true;
      ['exportSystemXlsBtn','backupBtn','restoreBtn','cloudBackupBtn','cloudRestoreBtn','printBtn','deleteAllBtn'].forEach(function(id){
        var el = byId(id); if(el && el.parentNode === tools) tools.appendChild(el);
      });
      var hidden = byId('restoreInput'); if(hidden && hidden.parentNode === tools) tools.appendChild(hidden);
    });
  }
  async function hardUpdate(manual){
    if(!navigator.onLine){
      safe(function(){ if(typeof showErrorToast === 'function') showErrorToast('Güncelleme için internet gerekir.'); else alert('Güncelleme için internet gerekir.'); });
      return false;
    }
    safe(function(){ if(typeof showSuccessToast === 'function') showSuccessToast('Yeni sürüm kontrol ediliyor...'); });
    try{
      if(typeof window.mesahaAutoUpdateCheck === 'function'){
        var updated = await window.mesahaAutoUpdateCheck('manual-v187', true);
        if(updated) return true;
      }
    }catch(_){ }
    try{
      if('serviceWorker' in navigator){
        var regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(function(reg){
          try{ if(reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'}); }catch(_){ }
          try{ if(reg.active) reg.active.postMessage({type:'CLEAR_MESAHA_CACHE'}); }catch(_){ }
          return reg.update().catch(function(){});
        }));
      }
      if(window.caches && caches.keys){
        var keys = await caches.keys();
        await Promise.all(keys.map(function(k){ return caches.delete(k).catch(function(){ return false; }); }));
      }
      localStorage.setItem('mesaha_last_manual_update_v187', new Date().toISOString());
      var url = new URL(location.href);
      url.searchParams.set('appUpdate', Date.now().toString());
      url.searchParams.set('v', '187');
      url.hash = '';
      safe(function(){ if(typeof showSuccessToast === 'function') showSuccessToast('Güncelleme temizlendi. Uygulama yenileniyor...'); });
      setTimeout(function(){ location.replace(url.toString()); }, 450);
      return true;
    }catch(e){
      safe(function(){ if(typeof showErrorToast === 'function') showErrorToast('Güncelleme başlatılamadı. Sayfayı elle yenileyin.'); });
      setTimeout(function(){ location.reload(); }, 700);
      return false;
    }
  }
  function patchUpdateButtons(){
    if(document.__mesahaUpdateButtonsV187) return;
    document.__mesahaUpdateButtonsV187 = true;
    window.mesahaForceUpdateV187 = hardUpdate;
    ['userMenuForceUpdateBtn','guideForceUpdateBtn','startupClearCacheBtnV178'].forEach(function(id){
      document.addEventListener('click', function(ev){
        var b = ev.target && ev.target.closest ? ev.target.closest('#'+id) : null;
        if(!b) return;
        ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        hardUpdate(true);
      }, true);
    });
  }
  function boot(){
    patchToastText();
    patchKeyboard();
    hideHomeLast();
    patchLastLength();
    orderRecordsTools();
    patchUpdateButtons();
    document.body && document.body.classList.add('mesaha-v187-final');
  }
  ready(boot);
  [80,250,700,1500,3200].forEach(function(ms){ setTimeout(boot, ms); });
  window.addEventListener('pageshow', function(){ setTimeout(boot, 80); });
})();
