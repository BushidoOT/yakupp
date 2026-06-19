/* Mesaha İO v169 Modüler Stabil - app-14.js */
(function(){
  'use strict';
  const VERSION_TEXT_V147 = 'Mesaha İO v1.98';
  const FILE_VERSION_V147 = 'v147';
  function safe(fn){ try { return fn(); } catch(e) { return undefined; } }
  function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function blurActive(){
    safe(() => {
      const a = document.activeElement;
      if (a && a !== document.body && typeof a.blur === 'function') a.blur();
    });
  }
  function goHomeNoKeyboard(){
    blurActive();
    safe(() => { if (typeof showHomeV143 === 'function') showHomeV143(); });
    safe(() => { document.body.classList.remove('inline-simple-v119','show-records','show-guide','show-admin'); });
    blurActive();
  }
  function boot(){
    safe(() => { document.title = VERSION_TEXT_V147; });
    safe(() => { const h1 = document.querySelector('.brand h1'); if (h1) h1.textContent = VERSION_TEXT_V147; });
    safe(() => { window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, { fileVersion: FILE_VERSION_V147, visibleVersion: VERSION_TEXT_V147, packageFix:true }); });
    document.querySelectorAll('#homeBtn,[data-tab="home"],.bottom-tab.home,[data-flow-tab="home"]').forEach(btn => {
      if (btn.__v147HomeBound) return;
      btn.__v147HomeBound = true;
      btn.addEventListener('click', function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        if (typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
        goHomeNoKeyboard();
      }, true);
    });
  }
  ready(boot);
  [80,300,900,1800].forEach(ms => setTimeout(boot, ms));
})();
