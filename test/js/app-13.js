/* Mesaha İO v169 Modüler Stabil - app-13.js */
(function(){
  'use strict';
  const VERSION_TEXT_V146 = 'Mesaha İO v1.98';
  const FILE_VERSION_V146 = 'v146';

  function readyV146(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true });
    else fn();
  }
  function safeV146(fn){ try { return fn(); } catch(err) { return undefined; } }
  function blurActiveV146(){
    safeV146(() => {
      const active = document.activeElement;
      if (active && active !== document.body && typeof active.blur === 'function') active.blur();
    });
  }
  function setOldNavActiveV146(){
    safeV146(() => {
      const entry = (typeof els !== 'undefined' && els && els.navEntry) ? els.navEntry : document.getElementById('navEntry');
      const records = (typeof els !== 'undefined' && els && els.navRecords) ? els.navRecords : document.getElementById('navRecords');
      const guide = (typeof els !== 'undefined' && els && els.navGuide) ? els.navGuide : document.getElementById('navGuide');
      const admin = (typeof els !== 'undefined' && els && els.navAdmin) ? els.navAdmin : document.getElementById('navAdmin');
      if (entry) entry.classList.add('active');
      if (records) records.classList.remove('active');
      if (guide) guide.classList.remove('active');
      if (admin) admin.classList.remove('active');
    });
  }
  function closeInlineSimpleV146(){
    // Ana Sayfa tuşu sadece ana ekrana dönsün; giriş alanlarına fokus atıp klavye açmasın.
    safeV146(() => {
      if (typeof setInlineSimpleV122 === 'function') { setInlineSimpleV122(false); return; }
      if (typeof setInlineSimpleV119 === 'function') { setInlineSimpleV119(false); return; }
      if (typeof closeInlineSimpleV119 === 'function') { closeInlineSimpleV119(); return; }
    });
    safeV146(() => {
      document.body.classList.remove('inline-simple-v119','clean-simple-open-v111','clean-keyboard-v118');
      const overlay = document.getElementById('cleanSimpleOverlayV111');
      if (overlay) {
        overlay.classList.remove('show');
        overlay.style.setProperty('display','none','important');
        overlay.style.setProperty('visibility','hidden','important');
        overlay.style.setProperty('pointer-events','none','important');
      }
    });
  }
  function goHomeNoKeyboardV146(event){
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    }
    blurActiveV146();
    closeInlineSimpleV146();
    safeV146(() => document.body.classList.remove('show-records','show-guide','show-admin'));
    setOldNavActiveV146();
    safeV146(() => { if (typeof updateFlowTabsV111 === 'function') updateFlowTabsV111(); });
    safeV146(() => { if (typeof renderMobileRecordsV111 === 'function') renderMobileRecordsV111(true); });
    safeV146(() => { if (typeof hideOldNavsV111 === 'function') hideOldNavsV111(); });
    safeV146(() => { const home = document.getElementById('mesahaHomeV143'); if (home) home.scrollIntoView({ block:'start', behavior:'smooth' }); });
    [0, 60, 180, 360].forEach(ms => setTimeout(blurActiveV146, ms));
    setTimeout(syncHomeSimpleV146, 90);
  }
  function toggleSimpleFromHomeV146(event){
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    }
    blurActiveV146();
    safeV146(() => document.body.classList.remove('show-records','show-guide','show-admin'));
    const topBtn = document.getElementById('openSimpleV112');
    if (topBtn) {
      safeV146(() => topBtn.click());
    } else {
      safeV146(() => {
        if (typeof toggleInlineSimpleV122 === 'function') toggleInlineSimpleV122();
        else if (typeof toggleInlineSimpleV119 === 'function') toggleInlineSimpleV119();
        else if (typeof openCleanSimpleV111 === 'function') openCleanSimpleV111();
      });
    }
    [0, 90, 220].forEach(ms => setTimeout(blurActiveV146, ms));
    setTimeout(syncHomeSimpleV146, 140);
  }
  function bindHomeNoKeyboardV146(){
    const tabs = document.getElementById('flowTabsV111');
    if (tabs && !tabs.__v146HomeNoKeyboard) {
      tabs.__v146HomeNoKeyboard = true;
      tabs.addEventListener('click', function(event){
        const btn = event.target && event.target.closest ? event.target.closest('[data-flow-tab="entry"]') : null;
        if (!btn) return;
        goHomeNoKeyboardV146(event);
      }, true);
    }
    const navEntry = (typeof els !== 'undefined' && els && els.navEntry) ? els.navEntry : document.getElementById('navEntry');
    if (navEntry && !navEntry.__v146HomeNoKeyboard) {
      navEntry.__v146HomeNoKeyboard = true;
      navEntry.addEventListener('click', goHomeNoKeyboardV146, true);
    }
  }
  function bindHomeSimpleV146(){
    const btn = document.querySelector('[data-home-simple-v146]');
    if (!btn || btn.__v146SimpleBound) return;
    btn.__v146SimpleBound = true;
    btn.addEventListener('click', toggleSimpleFromHomeV146, true);
    btn.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') toggleSimpleFromHomeV146(event);
    });
  }
  function syncHomeSimpleV146(){
    const btn = document.querySelector('[data-home-simple-v146]');
    if (!btn) return;
    const on = document.body.classList.contains('inline-simple-v119') || document.body.classList.contains('clean-simple-open-v111');
    btn.classList.toggle('is-active', on);
    const title = document.getElementById('homeSimpleV146');
    const hint = document.getElementById('homeSimpleHintV146');
    if (title) title.textContent = on ? 'Aktif' : 'Hızlı Kayıt';
    if (hint) hint.textContent = on ? 'Giriş modu açık' : 'Dokun ve hızlı girişe geç';
  }
  function applyVersionV146(){
    safeV146(() => { document.title = VERSION_TEXT_V146; });
    safeV146(() => { const h1 = document.querySelector('.brand h1'); if (h1) h1.textContent = VERSION_TEXT_V146; });
    safeV146(() => {
      window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, {
        fileVersion: FILE_VERSION_V146,
        visibleVersion: VERSION_TEXT_V146,
        homeTabNoKeyboard: true,
        homeSimpleButton: true
      });
    });
  }
  function bootV146(){
    bindHomeNoKeyboardV146();
    bindHomeSimpleV146();
    syncHomeSimpleV146();
    applyVersionV146();
  }
  readyV146(bootV146);
  [50, 250, 800, 1600, 2600].forEach(ms => setTimeout(bootV146, ms));
  setInterval(applyVersionV146, 2500);
  safeV146(() => {
    if (typeof render === 'function' && !render.__v146VersionWrapped) {
      const oldRenderV146 = render;
      render = function(){
        const result = oldRenderV146.apply(this, arguments);
        setTimeout(applyVersionV146, 40);
        setTimeout(syncHomeSimpleV146, 80);
        return result;
      };
      render.__v146VersionWrapped = true;
    }
  });
  document.addEventListener('click', (event) => {
    if (event.target && event.target.closest && event.target.closest('#openSimpleV112,[data-home-simple-v146],[data-flow-tab="entry"]')) {
      setTimeout(syncHomeSimpleV146, 80);
      setTimeout(blurActiveV146, 160);
    }
  }, true);
})();
