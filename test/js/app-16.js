/* Mesaha İO v169 Modüler Stabil - app-16.js */
(function(){
  'use strict';
  const VERSION_TEXT_V151 = 'Mesaha İO v1.98';
  const FILE_VERSION_V151 = 'v151';
  function safe(fn){ try { return fn(); } catch(e) { return undefined; } }
  function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true }); else fn(); }
  function isSimpleOn(){
    return document.body.classList.contains('inline-simple-v119') ||
           document.body.classList.contains('clean-simple-open-v111');
  }
  function blurActive(){
    safe(function(){
      const a = document.activeElement;
      if (a && a !== document.body && typeof a.blur === 'function') a.blur();
    });
  }
  function setNavHomeActive(){
    safe(function(){
      document.querySelectorAll('.flow-tabs-v111 button,[data-flow-tab]').forEach(function(btn){ btn.classList.remove('active'); });
      const entry = document.querySelector('[data-flow-tab="entry"]') || document.getElementById('navEntry');
      if (entry) entry.classList.add('active');
    });
    safe(function(){ if (typeof updateFlowTabsV111 === 'function') updateFlowTabsV111(); });
  }
  function syncHomeSimple(){
    const on = isSimpleOn();
    const topBtn = document.getElementById('openSimpleV112');
    if (topBtn) {
      topBtn.type = 'button';
      topBtn.textContent = on ? '🏠 Ana Sayfaya Dön' : '⚡ Giriş Modu';
      topBtn.setAttribute('aria-label', on ? 'Ana sayfaya dön' : 'Giriş modunu aç');
      topBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      topBtn.classList.toggle('active', on);
    }
    const homeBtn = document.querySelector('[data-home-simple-v146]');
    if (homeBtn) {
      homeBtn.classList.toggle('is-active', on);
      homeBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      homeBtn.setAttribute('aria-label', on ? 'Giriş modunu kapat ve ana sayfaya dön' : 'Giriş modunu aç');
    }
    const title = document.getElementById('homeSimpleV146');
    const hint = document.getElementById('homeSimpleHintV146');
    if (title) title.textContent = on ? 'Aktif' : 'Hızlı Kayıt';
    if (hint) hint.textContent = on ? 'Dokununca ana sayfaya döner' : 'Dokun ve hızlı girişe geç';
  }
  function applyVersion(){
    safe(function(){ document.title = VERSION_TEXT_V151; });
    safe(function(){ const h1 = document.querySelector('.brand h1'); if (h1) h1.textContent = VERSION_TEXT_V151; });
    safe(function(){
      window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, {
        fileVersion: FILE_VERSION_V151,
        visibleVersion: VERSION_TEXT_V151,
        stableVersionText: true,
        infoModals: true,
        loadingButtonFix: true
      });
    });
  }
  function closeSimpleAndGoHome(event){
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    }
    blurActive();
    safe(function(){ if (typeof setInlineSimpleV126 === 'function') { setInlineSimpleV126(false); return; } });
    safe(function(){ if (typeof setInlineSimpleV122 === 'function') { setInlineSimpleV122(false); return; } });
    safe(function(){ if (typeof setInlineSimpleV119 === 'function') { setInlineSimpleV119(false); return; } });
    safe(function(){ if (typeof closeInlineSimpleV119 === 'function') closeInlineSimpleV119(); });
    safe(function(){
      document.body.classList.remove('inline-simple-v119','clean-simple-open-v111','clean-keyboard-v118','show-records','show-guide','show-admin');
      const overlay = document.getElementById('cleanSimpleOverlayV111');
      if (overlay) {
        overlay.classList.remove('show');
        overlay.style.setProperty('display','none','important');
        overlay.style.setProperty('visibility','hidden','important');
        overlay.style.setProperty('pointer-events','none','important');
      }
    });
    safe(function(){ if (typeof showHomeV143 === 'function') showHomeV143(); });
    setNavHomeActive();
    safe(function(){ const home = document.getElementById('mesahaHomeV143'); if (home) home.scrollIntoView({ block:'start', behavior:'smooth' }); });
    [0,50,150,300].forEach(function(ms){ setTimeout(blurActive, ms); setTimeout(syncHomeSimple, ms); });
  }
  function bindSimpleButtons(){
    const topBtn = document.getElementById('openSimpleV112');
    if (topBtn && !topBtn.__v151HomeBound) {
      topBtn.__v151HomeBound = true;
      topBtn.addEventListener('click', function(event){
        if (isSimpleOn()) closeSimpleAndGoHome(event);
      }, true);
    }
    const homeBtn = document.querySelector('[data-home-simple-v146]');
    if (homeBtn && !homeBtn.__v151HomeCardBound) {
      homeBtn.__v151HomeCardBound = true;
      homeBtn.addEventListener('click', function(event){
        if (isSimpleOn()) closeSimpleAndGoHome(event);
      }, true);
    }
  }
  function ensureModal(){
    let modal = document.getElementById('mesahaInfoModalV151');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'mesahaInfoModalV151';
    modal.className = 'mesaha-info-modal-v151';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.innerHTML = '<div class="mesaha-info-card-v151">' +
      '<div class="mesaha-info-head-v151"><div class="mesaha-info-icon-v151" data-info-icon>ℹ️</div><div><h3 class="mesaha-info-title-v151" data-info-title></h3><p class="mesaha-info-subtitle-v151" data-info-subtitle></p></div></div>' +
      '<div class="mesaha-info-body-v151" data-info-body></div>' +
      '<div class="mesaha-info-actions-v151"><button type="button" class="mesaha-info-cancel-v151" data-info-cancel>Vazgeç</button><button type="button" class="mesaha-info-ok-v151" data-info-ok>Tamam</button></div>' +
      '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(event){
      if (event.target === modal) hideModal();
    });
    const cancel = modal.querySelector('[data-info-cancel]');
    if (cancel) cancel.addEventListener('click', hideModal);
    document.addEventListener('keydown', function(event){ if (event.key === 'Escape') hideModal(); });
    return modal;
  }
  function hideModal(){
    const modal = document.getElementById('mesahaInfoModalV151');
    if (modal) modal.classList.remove('show');
  }
  function showInfo(kind, action){
    const modal = ensureModal();
    const icon = modal.querySelector('[data-info-icon]');
    const title = modal.querySelector('[data-info-title]');
    const subtitle = modal.querySelector('[data-info-subtitle]');
    const body = modal.querySelector('[data-info-body]');
    const ok = modal.querySelector('[data-info-ok]');
    const cancel = modal.querySelector('[data-info-cancel]');
    if (kind === 'backup') {
      if (icon) icon.textContent = '🗂️';
      if (title) title.textContent = 'Yedek alınıyor';
      if (subtitle) subtitle.textContent = 'Bu dosya sadece Mesaha İO içinde kayıtları geri yüklemek içindir.';
      if (body) body.innerHTML = '<p>Yedek tek dosya <b>ZIP</b> olarak alınır. Bu dosya sadece Mesaha İO içinde kayıtları geri getirmek için kullanılır.</p><div class="mesaha-info-note-v151">Excel/ORBİS aktarımı için <b>Mesaha Dosyasını İndir</b> butonunu kullanınız.</div>';
      if (ok) ok.textContent = 'Tamam, yedek al';
      if (cancel) cancel.textContent = 'Vazgeç';
    } else {
      if (icon) icon.textContent = '📥';
      if (title) title.textContent = 'Mesaha dosyası indiriliyor';
      if (subtitle) subtitle.textContent = 'Dosyayı indirdikten sonra ORBİS’e bilgisayar üzerinden aktarınız.';
      if (body) body.innerHTML = '<p><b>ORBİS’e Aktarma</b></p><ol><li>Mesaha dosyasını indirdikten sonra dosyayı bilgisayara aktarınız.</li><li>ORBİS’e bilgisayar üzerinden giriş yapınız.</li><li><b>İşletme Pazarlama</b> modülüne giriniz.</li><li><b>Kesme Faaliyetleri Raporu</b> ekranını açınız.</li><li>Şeflik ve bölme bilgilerini giriniz.</li><li>Bölmenin üzerine çift tıklayınız.</li><li>Dosya yükleme bölümünden mesaha dosyasını seçip <b>Excel’den Aktar</b> deyiniz.</li></ol>';
      if (ok) ok.textContent = 'Tamam, indir';
      if (cancel) cancel.textContent = 'Vazgeç';
    }
    if (ok) {
      ok.onclick = function(){
        hideModal();
        setTimeout(function(){ safe(action); }, 80);
      };
    }
    modal.classList.add('show');
    setTimeout(function(){ if (ok && typeof ok.focus === 'function') ok.focus({ preventScroll:true }); }, 30);
  }
  function bindInfoButton(id, kind, fallback){
    const btn = document.getElementById(id);
    if (!btn || btn.__v151InfoBound) return;
    const source = btn;
    const clone = btn.cloneNode(true);
    clone.__v151InfoBound = true;
    if (kind === 'export') clone.__v135Bound = true;
    if (kind === 'export') clone.textContent = 'Mesaha Dosyasını İndir';
    if (kind === 'backup') clone.textContent = 'Yedek Al';
    source.parentNode.replaceChild(clone, source);
    safe(function(){ if (typeof els !== 'undefined' && els) els[id] = clone; });
    clone.addEventListener('click', function(event){
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
      showInfo(kind, function(){
        if (source && typeof source.click === 'function') source.click();
        else if (typeof fallback === 'function') fallback();
      });
    }, true);
  }
  function bindInfoButtons(){
    bindInfoButton('exportSystemXlsBtn', 'export', function(){ if (typeof exportSystemXls === 'function') exportSystemXls(); });
    bindInfoButton('backupBtn', 'backup', function(){ if (typeof backup === 'function') backup(); });
  }
  function boot(){
    applyVersion();
    bindSimpleButtons();
    syncHomeSimple();
    bindInfoButtons();
    safe(function(){
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
        navigator.serviceWorker.getRegistration().then(function(reg){ if (reg && reg.update) reg.update().catch(function(){}); }).catch(function(){});
      }
    });
  }
  ready(boot);
  [60,180,420,900,1600,2600].forEach(function(ms){ setTimeout(boot, ms); });
  setInterval(function(){ applyVersion(); syncHomeSimple(); }, 500);
  safe(function(){
    if (window.MutationObserver && !document.body.__v151SimpleObserver) {
      document.body.__v151SimpleObserver = new MutationObserver(function(){ setTimeout(syncHomeSimple, 25); });
      document.body.__v151SimpleObserver.observe(document.body, { attributes:true, attributeFilter:['class'] });
    }
  });
  document.addEventListener('click', function(event){
    if (event.target && event.target.closest && event.target.closest('#openSimpleV112,[data-home-simple-v146],#navEntry,[data-flow-tab="entry"],#clearInputsBtn')) {
      setTimeout(syncHomeSimple, 60);
      setTimeout(syncHomeSimple, 180);
      setTimeout(blurActive, 220);
    }
  }, true);
})();
