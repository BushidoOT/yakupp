(function(){
  'use strict';
  var PERF_TAG = 'v184';
  var IDB_NAME = 'mesaha_io_stabil_v152';
  var IDB_STORE = 'kv';
  var IDB_RECORDS_KEY = 'records';
  var IDB_SETTINGS_KEY = 'settings';
  var IDB_MARKER_KEY = 'mesaha_records_indexeddb_marker_v152';
  var BIG_RECORD_LIMIT = 5;
  var idbTimer = null;
  var summaryTimer = null;
  var renderTimer = null;
  var settingsTimer = null;
  var duplicateTimer = null;
  function log(){ try{ if(window.MESAHA_DEBUG) console.log.apply(console, arguments); }catch(_){} }
  function byId(id){ return document.getElementById(id); }
  function safe(fn, fallback){ try{ return fn(); }catch(e){ try{ console.warn('Mesaha iOS perf', e); }catch(_){} return fallback; } }
  function raf(fn){ try{ return requestAnimationFrame(fn); }catch(_){ return setTimeout(fn, 16); } }
  function openDb(){
    return new Promise(function(resolve, reject){
      try{
        var req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = function(){ try{ req.result.createObjectStore(IDB_STORE); }catch(_){} };
        req.onsuccess = function(){ resolve(req.result); };
        req.onerror = function(){ reject(req.error || new Error('IndexedDB açılamadı')); };
      }catch(e){ reject(e); }
    });
  }
  function idbPut(key, value){
    return openDb().then(function(db){
      return new Promise(function(resolve, reject){
        var tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(value, key);
        tx.oncomplete = function(){ try{ db.close(); }catch(_){} resolve(true); };
        tx.onerror = function(){ try{ db.close(); }catch(_){} reject(tx.error || new Error('IndexedDB yazma hatası')); };
      });
    });
  }
  function scheduleIdbSave(records){
    clearTimeout(idbTimer);
    idbTimer = setTimeout(function(){
      var snapshot = safe(function(){ return Array.isArray(records) ? records.slice() : []; }, []);
      idbPut(IDB_RECORDS_KEY, snapshot).catch(function(){});
      safe(function(){ if(typeof state !== 'undefined' && state.settings) idbPut(IDB_SETTINGS_KEY, state.settings).catch(function(){}); });
    }, 30);
  }
  function patchSaveRecords(){
    safe(function(){
      if(typeof saveRecords !== 'function' || saveRecords.__v184Patched) return;
      var oldSave = saveRecords;
      saveRecords = function(){
        var records = safe(function(){ return Array.isArray(state.records) ? state.records : []; }, []);
        scheduleIdbSave(records);
        // Büyük kayıtta iOS Safari localStorage'a tüm listeyi her kayıtta yazınca klavye ve butonlar ağırlaşıyor.
        // Bu yüzden büyük listede IndexedDB ana depodur; localStorage sadece küçük listede ve güvenli olduğunda kullanılır.
        try{
          if(records.length <= BIG_RECORD_LIMIT && typeof STORAGE_KEY !== 'undefined'){
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
            localStorage.removeItem(IDB_MARKER_KEY);
          }else{
            localStorage.setItem(IDB_MARKER_KEY, '1');
            // Eski büyük snapshot varsa her kayıtta parse/yazma yükü yapmasın diye temizlenir.
            if(typeof STORAGE_KEY !== 'undefined') localStorage.removeItem(STORAGE_KEY);
          }
        }catch(e){
          try{ if(typeof STORAGE_KEY !== 'undefined') localStorage.removeItem(STORAGE_KEY); localStorage.setItem(IDB_MARKER_KEY, '1'); }catch(_){}
        }
      };
      saveRecords.__v184Patched = true;
      saveRecords.__v184Old = oldSave;
      log(PERF_TAG, 'saveRecords optimize edildi');
    });
  }
  function patchRender(){
    safe(function(){
      if(typeof render === 'function' && !render.__v184Patched){
        var oldRender = render;
        render = function(){
          var args = arguments;
          var active = document.activeElement;
          var id = active && active.id ? active.id : '';
          var isFastInput = /^(diameter|length|quantity|cleanDiameterV111|cleanLengthV111)$/.test(id) || document.body.classList.contains('clean-simple-open-v111');
          if(isFastInput){
            clearTimeout(renderTimer);
            renderTimer = setTimeout(function(){ safe(function(){ oldRender.apply(null, args); }); }, 180);
            return;
          }
          return oldRender.apply(null, args);
        };
        render.__v184Patched = true;
      }
      if(typeof forceRefreshSummaryCards === 'function' && !forceRefreshSummaryCards.__v184Patched){
        var oldSummary = forceRefreshSummaryCards;
        forceRefreshSummaryCards = function(){
          clearTimeout(summaryTimer);
          summaryTimer = setTimeout(function(){ safe(function(){ oldSummary(); }); }, 120);
        };
        forceRefreshSummaryCards.__v184Patched = true;
      }
    });
  }
  function patchCleanChips(){
    safe(function(){
      if(typeof renderCleanChipsV111 !== 'function' || renderCleanChipsV111.__v184Patched) return;
      renderCleanChipsV111 = function(){
        var c = (typeof cleanElsV111 === 'function') ? cleanElsV111() : {};
        var esc = (typeof escapeHtml === 'function') ? escapeHtml : function(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]; }); };
        function uniq(list){
          var out = [];
          (list || []).forEach(function(v){ v = String(v || '').trim(); if(v && out.indexOf(v) < 0) out.push(v); });
          return out.slice(0, 6);
        }
        var lengths = safe(function(){ return state.settings && Array.isArray(state.settings.recentLengths) ? state.settings.recentLengths : []; }, []);
        var dias = safe(function(){ return state.settings && Array.isArray(state.settings.recentDiameters) ? state.settings.recentDiameters : []; }, []);
        var currentLen = (c.len && c.len.value) || (byId('length') && byId('length').value) || localStorage.getItem('mesaha_simple_last_length_v1') || '';
        var currentDia = (c.dia && c.dia.value) || (byId('diameter') && byId('diameter').value) || '';
        var lenVals = uniq([currentLen].concat(lengths, ['4','3','2.5','2','1.5','1']));
        var diaVals = uniq([currentDia].concat(dias, ['32','28','26','24','22','21']));
        if(c.lenChips) c.lenChips.innerHTML = lenVals.map(function(v){ return '<button type="button" class="clean-chip-v111 boy" data-clean-length="'+esc(v)+'">'+esc(v)+'</button>'; }).join('');
        if(c.diaChips) c.diaChips.innerHTML = diaVals.map(function(v){ return '<button type="button" class="clean-chip-v111 cap" data-clean-diameter="'+esc(v)+'">'+esc(v)+'</button>'; }).join('');
      };
      renderCleanChipsV111.__v184Patched = true;
    });
  }
  function patchInputLag(){
    safe(function(){
      if(document.__mesahaInputLagV183) return;
      document.__mesahaInputLagV183 = true;
      function debouncedSettings(){
        clearTimeout(settingsTimer);
        settingsTimer = setTimeout(function(){ safe(function(){ if(typeof saveSettings === 'function') saveSettings(); }); }, 220);
      }
      function debouncedDuplicate(){
        clearTimeout(duplicateTimer);
        duplicateTimer = setTimeout(function(){ safe(function(){ if(typeof updateDuplicateWarning === 'function') updateDuplicateWarning(); }); }, 260);
      }
      function intercept(id, mode){
        var el = byId(id); if(!el) return;
        ['input','change'].forEach(function(evt){
          el.addEventListener(evt, function(ev){
            if(ev && ev.isTrusted){
              ev.stopImmediatePropagation();
              if(mode === 'diameter') safe(function(){ if(typeof limitDiameterToTwoDigits === 'function') limitDiameterToTwoDigits(); if(typeof updateLiveDesi === 'function') updateLiveDesi(); });
              if(mode === 'light') { safe(function(){ if(typeof updateLiveDesi === 'function') updateLiveDesi(); }); debouncedSettings(); }
              if(mode === 'barcode') { debouncedSettings(); debouncedDuplicate(); }
              if(mode === 'settings') debouncedSettings();
            }
          }, true);
        });
      }
      intercept('length', 'light');
      intercept('quantity', 'light');
      intercept('barcode', 'barcode');
      intercept('bolmeNo', 'settings');
      intercept('seflik', 'settings');
      intercept('ekipNot', 'settings');
      // Çap alanı zaten hafif; sadece fazla dinleyicilerden dolayı lag olursa yakalansın.
      intercept('diameter', 'diameter');
    });
  }
  function removeTopNetworkBadge(){
    safe(function(){
      var topBadge = byId('mesahaNetBadgeV178');
      if(topBadge){
        topBadge.setAttribute('data-removed-v184','1');
        topBadge.style.display = 'none';
        topBadge.setAttribute('aria-hidden','true');
      }
      // Kullanıcı panelinin yanında eski sürümlerde üretilmiş olabilecek bağlantı rozetlerini de gizle.
      document.querySelectorAll('.topbar .mesaha-net-badge-v178, header .mesaha-net-badge-v178').forEach(function(el){ el.style.display='none'; el.setAttribute('aria-hidden','true'); });
    });
  }
  function boot(){
    patchSaveRecords();
    patchRender();
    patchCleanChips();
    patchInputLag();
    patchMobileRecordRender();
    removeTopNetworkBadge();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  [120, 450, 1200, 2500].forEach(function(ms){ setTimeout(boot, ms); });
  window.addEventListener('pageshow', function(){ setTimeout(boot, 60); });
})();
