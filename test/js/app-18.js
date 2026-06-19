/* Mesaha İO v169 Modüler Stabil - app-18.js */
/* v154: Kaydetten sonra çap klavyesi açık kalsın + ölçümler 20 kayıt/sayfa */
(function(){
  'use strict';
  const VERSION_TEXT_V153 = 'Mesaha İO v1.98';
  const FILE_VERSION_V153 = 'v154';
  function safe(fn){ try { return fn(); } catch(e) { return undefined; } }
  function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true }); else fn(); }
  function keepDiameterFocus(){
    safe(function(){
      const d = document.getElementById('diameter');
      if (!d) return;
      d.focus({ preventScroll:true });
      const len = String(d.value || '').length;
      try { d.setSelectionRange(len, len); } catch(e) {}
    });
  }
  function applyVersion(){
    safe(function(){ document.title = VERSION_TEXT_V153; });
    safe(function(){ const h1 = document.querySelector('.brand h1'); if (h1) h1.textContent = VERSION_TEXT_V153; });
    safe(function(){
      window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, {
        fileVersion: FILE_VERSION_V153,
        visibleVersion: VERSION_TEXT_V153,
        keyboardStayOpenAfterSave: true
      });
    });
  }
  function bind(){
    const form = document.getElementById('measureForm');
    const submit = document.getElementById('submitBtn');
    if (submit && !submit.__v153KeyboardBound) {
      submit.__v153KeyboardBound = true;
      submit.addEventListener('pointerdown', function(){
        keepDiameterFocus();
        setTimeout(keepDiameterFocus, 30);
        setTimeout(keepDiameterFocus, 120);
        setTimeout(keepDiameterFocus, 260);
      }, true);
      submit.addEventListener('click', function(){
        setTimeout(keepDiameterFocus, 30);
        setTimeout(keepDiameterFocus, 160);
        setTimeout(keepDiameterFocus, 320);
      }, true);
    }
    if (form && !form.__v153KeyboardBound) {
      form.__v153KeyboardBound = true;
      form.addEventListener('submit', function(){
        keepDiameterFocus();
        setTimeout(keepDiameterFocus, 40);
        setTimeout(keepDiameterFocus, 160);
        setTimeout(keepDiameterFocus, 320);
      }, false);
    }
  }
  ready(function(){ bind(); applyVersion(); });
  [80,240,700,1400,2600].forEach(function(ms){ setTimeout(function(){ bind(); applyVersion(); }, ms); });
  setInterval(applyVersion, 1200);
})();
