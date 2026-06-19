/* script block 16 id="mesaha-v151-loading-button-fix-js" */

(function(){
  'use strict';
  const VERSION_TEXT_V151 = 'Mesaha İO v1.99';
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


;


/* script block 17  */

/* v152: Stabilite paketi - ZIP yedek, parçalı geri yükleme, sayfalı kayıt listesi, yükleme göstergesi */
(function(){
  'use strict';
  const BUILD_VERSION_V152 = 'Mesaha İO v1.99';
  const FILE_VERSION_V152 = 'v157';
  const CACHE_TAG_V152 = 'mesaha-app-v157-tarih-yedek-yukle-fix';
  const PAGE_SIZE_V152 = 20;
  const CHUNK_SIZE_V152 = 500;
  const IDB_NAME_V152 = 'mesaha_io_stabil_v152';
  const IDB_STORE_V152 = 'kv';
  const IDB_RECORDS_KEY_V152 = 'records';
  const IDB_SETTINGS_KEY_V152 = 'settings';
  const IDB_MARKER_KEY_V152 = 'mesaha_records_indexeddb_marker_v152';

  function safeV152(fn, fallback){ try { return fn(); } catch(e) { console.warn('v152', e); return fallback; } }
  function $v152(id){ return document.getElementById(id); }
  function escapeV152(value){
    return String(value ?? '')
      .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
      .replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }
  function nextTickV152(){ return new Promise(resolve => setTimeout(resolve, 0)); }
  function delayV152(ms){ return new Promise(resolve => setTimeout(resolve, ms || 0)); }
  function dateFileNameV152(){
    try { if (typeof dateFileName === 'function') return dateFileName(); } catch {}
    const d = new Date(), p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
  }
  function formatDateTimeV152(){
    try { if (typeof formatDateTime === 'function') return formatDateTime(); } catch {}
    return new Date().toLocaleString('tr-TR');
  }
  function toastV152(msg){
    try { if (typeof showSuccessToast === 'function') return showSuccessToast(msg); } catch {}
    try { if (typeof showToast === 'function') return showToast(msg); } catch {}
    console.log(msg);
  }
  function errorToastV152(msg){
    try { if (typeof showErrorToast === 'function') return showErrorToast(msg); } catch {}
    return toastV152(msg);
  }

  function injectCssV152(){
    if (document.getElementById('v152StableCss')) return;
    const style = document.createElement('style');
    style.id = 'v152StableCss';
    style.textContent = `
      .records-pager-v152{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:12px 0 4px;padding:10px;border:1px solid rgba(15,23,42,.08);border-radius:18px;background:rgba(248,250,252,.92);box-shadow:0 8px 20px rgba(15,23,42,.06)}
      .records-pager-v152 .pager-info-v152{font-weight:900;color:#1f3b2e;font-size:13px;line-height:1.35}.records-pager-v152 .pager-actions-v152{display:flex;gap:8px;flex-wrap:wrap}
      .records-pager-v152 button{border:0;border-radius:14px;padding:10px 13px;font-weight:950;background:#18753d;color:#fff;box-shadow:0 10px 18px rgba(24,117,61,.18)}
      .records-pager-v152 button.ghost{background:#fff;color:#18753d;border:1px solid rgba(24,117,61,.18);box-shadow:none}.records-pager-v152 button:disabled{opacity:.42;box-shadow:none}
      .work-overlay-v152{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.38);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .work-overlay-v152.show{display:flex}.work-card-v152{width:min(460px,92vw);border-radius:26px;padding:22px;background:#fff;box-shadow:0 28px 80px rgba(15,23,42,.28);border:1px solid rgba(15,23,42,.08)}
      .work-card-v152 h3{margin:0 0 8px;color:#154d2b;font-size:20px}.work-card-v152 p{margin:0 0 14px;color:#475569;font-weight:750;line-height:1.45}.work-bar-v152{height:12px;border-radius:999px;background:#e2e8f0;overflow:hidden}.work-bar-v152 span{display:block;height:100%;width:0%;background:#18753d;border-radius:999px;transition:width .18s ease}.work-count-v152{margin-top:10px;color:#64748b;font-size:12px;font-weight:850}
      .info-modal-v152{position:fixed;inset:0;z-index:100001;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.42);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}.info-modal-v152.show{display:flex}
      .info-card-v152{width:min(560px,94vw);max-height:86vh;overflow:auto;border-radius:28px;background:#fff;border:1px solid rgba(15,23,42,.10);box-shadow:0 30px 90px rgba(15,23,42,.32);padding:20px}.info-head-v152{display:flex;gap:12px;align-items:flex-start;margin-bottom:12px}.info-icon-v152{width:48px;height:48px;border-radius:18px;display:grid;place-items:center;background:#e9f8ef;color:#18753d;font-size:24px;flex:0 0 auto}.info-head-v152 h3{margin:0;color:#154d2b;font-size:20px;font-weight:950}.info-head-v152 p{margin:4px 0 0;color:#64748b;font-weight:780;line-height:1.35}.info-body-v152{color:#334155;font-size:14px;line-height:1.55}.info-body-v152 ol{padding-left:20px;margin:8px 0}.info-note-v152{margin-top:10px;padding:12px 13px;border-radius:18px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;font-weight:850}.info-actions-v152{display:flex;gap:10px;justify-content:flex-end;margin-top:16px}.info-actions-v152 button{border:0;border-radius:16px;padding:12px 15px;font-weight:950}.info-cancel-v152{background:#f1f5f9;color:#334155}.info-ok-v152{background:#18753d;color:#fff;box-shadow:0 12px 24px rgba(24,117,61,.22)}
      body.theme-dark .records-pager-v152, body.theme-dark .work-card-v152, body.theme-dark .info-card-v152{background:#18221b;color:#f8fafc;border-color:rgba(255,255,255,.12)}body.theme-dark .records-pager-v152 .pager-info-v152,body.theme-dark .work-card-v152 h3,body.theme-dark .info-head-v152 h3{color:#f8fafc}body.theme-dark .work-card-v152 p,body.theme-dark .work-count-v152,body.theme-dark .info-head-v152 p,body.theme-dark .info-body-v152{color:#cbd5e1}body.theme-dark .records-pager-v152 button.ghost,body.theme-dark .info-cancel-v152{background:#243026;color:#dcfce7;border-color:rgba(255,255,255,.10)}
      @media(max-width:620px){.records-pager-v152{align-items:stretch}.records-pager-v152 .pager-actions-v152{display:grid;grid-template-columns:1fr 1fr;width:100%}.records-pager-v152 button{width:100%}.info-actions-v152{display:grid;grid-template-columns:1fr 1fr}.info-actions-v152 button{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function applyVersionV152(){
    safeV152(function(){ document.title = BUILD_VERSION_V152; });
    safeV152(function(){ document.querySelectorAll('.brand h1,.brand-title-v143 h1,.app-title,[data-version-title]').forEach(el => { if (el) el.textContent = BUILD_VERSION_V152; }); });
    safeV152(function(){
      const h1 = document.querySelector('.brand h1');
      if (h1) h1.textContent = BUILD_VERSION_V152;
      const versionSmall = document.querySelector('.brand small');
      if (versionSmall && /v\d+|Mesaha|sürüm/i.test(versionSmall.textContent || '')) versionSmall.textContent = FILE_VERSION_V152;
      localStorage.setItem('mesaha_version_info_v151', JSON.stringify({ fileVersion:FILE_VERSION_V152, visibleVersion:BUILD_VERSION_V152, cache:CACHE_TAG_V152, fixedAt:new Date().toLocaleString('tr-TR') }));
    });
  }

  function showWorkV152(title, detail, percent, countText){
    injectCssV152();
    let overlay = $v152('workOverlayV152');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'workOverlayV152';
      overlay.className = 'work-overlay-v152';
      overlay.innerHTML = '<div class="work-card-v152"><h3 data-work-title></h3><p data-work-detail></p><div class="work-bar-v152"><span data-work-bar></span></div><div class="work-count-v152" data-work-count></div></div>';
      document.body.appendChild(overlay);
    }
    const pct = Math.max(0, Math.min(100, Number(percent) || 0));
    const t = overlay.querySelector('[data-work-title]');
    const d = overlay.querySelector('[data-work-detail]');
    const b = overlay.querySelector('[data-work-bar]');
    const c = overlay.querySelector('[data-work-count]');
    if (t) t.textContent = title || 'İşlem yapılıyor';
    if (d) d.textContent = detail || 'Lütfen bekleyiniz.';
    if (b) b.style.width = pct + '%';
    if (c) c.textContent = countText || (pct ? `%${Math.round(pct)}` : 'Hazırlanıyor...');
    overlay.classList.add('show');
  }
  function hideWorkV152(){ const overlay = $v152('workOverlayV152'); if (overlay) overlay.classList.remove('show'); }

  function showInfoV152(kind, action){
    injectCssV152();
    let modal = $v152('infoModalV152');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'infoModalV152';
      modal.className = 'info-modal-v152';
      modal.setAttribute('role','dialog');
      modal.setAttribute('aria-modal','true');
      modal.innerHTML = '<div class="info-card-v152"><div class="info-head-v152"><div class="info-icon-v152" data-info-icon></div><div><h3 data-info-title></h3><p data-info-subtitle></p></div></div><div class="info-body-v152" data-info-body></div><div class="info-actions-v152"><button type="button" class="info-cancel-v152" data-info-cancel>Vazgeç</button><button type="button" class="info-ok-v152" data-info-ok>Tamam</button></div></div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', function(event){ if (event.target === modal) modal.classList.remove('show'); });
      const cancel = modal.querySelector('[data-info-cancel]');
      if (cancel) cancel.addEventListener('click', function(){ modal.classList.remove('show'); });
    }
    const icon = modal.querySelector('[data-info-icon]');
    const title = modal.querySelector('[data-info-title]');
    const subtitle = modal.querySelector('[data-info-subtitle]');
    const body = modal.querySelector('[data-info-body]');
    const ok = modal.querySelector('[data-info-ok]');
    if (kind === 'backup') {
      if (icon) icon.textContent = '🗂️';
      if (title) title.textContent = 'ZIP yedek hazırlanıyor';
      if (subtitle) subtitle.textContent = 'Tek dosya iner; program içinde parça parça geri yüklenir.';
      if (body) body.innerHTML = '<p>Yedek tek dosya <b>ZIP</b> olarak alınır.</p><div class="info-note-v152">Bu dosya sadece Mesaha İO içinde kayıtları geri getirmek için kullanılır. Excel/ORBİS aktarımı için <b>Mesaha Dosyasını İndir</b> butonunu kullanınız.</div>';
      if (ok) ok.textContent = 'Tamam, ZIP yedek al';
    } else if (kind === 'restore') {
      if (icon) icon.textContent = '♻️';
      if (title) title.textContent = 'Yedek geri yükleme';
      if (subtitle) subtitle.textContent = 'Tek ZIP dosyası seçmeniz yeterlidir.';
      if (body) body.innerHTML = '<p><b>Yedek Yükle</b> butonuna basın, daha önce aldığınız ZIP yedek dosyasını seçin.</p><ol><li>Program yedeği otomatik okur.</li><li>Kayıtlarınız geri yüklenir.</li><li>Mevcut kayıtlar seçtiğiniz yedekle değiştirilir.</li></ol><div class="info-note-v152">Yükleme için sadece Mesaha İO’dan alınan ZIP yedeğini seçiniz.</div>';
      if (ok) ok.textContent = 'Tamam, dosya seç';
    } else {
      if (icon) icon.textContent = '📥';
      if (title) title.textContent = 'Mesaha dosyası indiriliyor';
      if (subtitle) subtitle.textContent = 'Dosyayı indirdikten sonra ORBİS’e bilgisayar üzerinden aktarınız.';
      if (body) body.innerHTML = '<p><b>ORBİS’e Aktarma</b></p><ol><li>Mesaha dosyasını indirdikten sonra dosyayı bilgisayara aktarınız.</li><li>ORBİS’e bilgisayar üzerinden giriş yapınız.</li><li><b>İşletme Pazarlama</b> modülüne giriniz.</li><li><b>Kesme Faaliyetleri Raporu</b> ekranını açınız.</li><li>Şeflik ve bölme bilgilerini giriniz.</li><li>Bölmenin üzerine çift tıklayınız.</li><li>Dosya yükleme bölümünden mesaha dosyasını seçip <b>Excel’den Aktar</b> deyiniz.</li></ol>';
      if (ok) ok.textContent = 'Tamam, indir';
    }
    if (ok) ok.onclick = function(){ modal.classList.remove('show'); setTimeout(function(){ safeV152(action); }, 80); };
    modal.classList.add('show');
  }

  function crcTableV152(){
    if (crcTableV152.table) return crcTableV152.table;
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c >>> 0;
    }
    crcTableV152.table = table;
    return table;
  }
  function crc32V152(bytes){
    const table = crcTableV152();
    let c = 0 ^ (-1);
    for (let i = 0; i < bytes.length; i++) c = (c >>> 8) ^ table[(c ^ bytes[i]) & 0xFF];
    return (c ^ (-1)) >>> 0;
  }
  function zipDateTimeV152(date){
    const d = date || new Date();
    const time = ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((Math.floor(d.getSeconds()/2)) & 31);
    const dosYear = Math.max(1980, d.getFullYear()) - 1980;
    const day = d.getDate() || 1;
    const month = (d.getMonth() + 1) || 1;
    const dateVal = ((dosYear & 127) << 9) | ((month & 15) << 5) | (day & 31);
    return { time, date: dateVal };
  }
  function writeU16V152(arr, offset, value){ arr[offset] = value & 255; arr[offset+1] = (value >>> 8) & 255; }
  function writeU32V152(arr, offset, value){ arr[offset] = value & 255; arr[offset+1] = (value >>> 8) & 255; arr[offset+2] = (value >>> 16) & 255; arr[offset+3] = (value >>> 24) & 255; }
  function concatBytesV152(parts){
    const len = parts.reduce((sum, p) => sum + p.length, 0);
    const out = new Uint8Array(len);
    let off = 0;
    for (const p of parts) { out.set(p, off); off += p.length; }
    return out;
  }
  function makeZipV152(entries){
    const enc = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const dt = zipDateTimeV152(new Date());
    for (const entry of entries) {
      const nameBytes = enc.encode(entry.name);
      const dataBytes = entry.bytes || enc.encode(String(entry.text ?? ''));
      const crc = crc32V152(dataBytes);
      const local = new Uint8Array(30 + nameBytes.length);
      writeU32V152(local, 0, 0x04034b50); writeU16V152(local, 4, 20); writeU16V152(local, 6, 0x0800); writeU16V152(local, 8, 0);
      writeU16V152(local, 10, dt.time); writeU16V152(local, 12, dt.date); writeU32V152(local, 14, crc); writeU32V152(local, 18, dataBytes.length); writeU32V152(local, 22, dataBytes.length);
      writeU16V152(local, 26, nameBytes.length); writeU16V152(local, 28, 0); local.set(nameBytes, 30);
      localParts.push(local, dataBytes);
      const central = new Uint8Array(46 + nameBytes.length);
      writeU32V152(central, 0, 0x02014b50); writeU16V152(central, 4, 20); writeU16V152(central, 6, 20); writeU16V152(central, 8, 0x0800); writeU16V152(central, 10, 0);
      writeU16V152(central, 12, dt.time); writeU16V152(central, 14, dt.date); writeU32V152(central, 16, crc); writeU32V152(central, 20, dataBytes.length); writeU32V152(central, 24, dataBytes.length);
      writeU16V152(central, 28, nameBytes.length); writeU16V152(central, 30, 0); writeU16V152(central, 32, 0); writeU16V152(central, 34, 0); writeU16V152(central, 36, 0); writeU32V152(central, 38, 0); writeU32V152(central, 42, offset);
      central.set(nameBytes, 46);
      centralParts.push(central);
      offset += local.length + dataBytes.length;
    }
    const centralStart = offset;
    const centralBytes = concatBytesV152(centralParts);
    const eocd = new Uint8Array(22);
    writeU32V152(eocd, 0, 0x06054b50); writeU16V152(eocd, 4, 0); writeU16V152(eocd, 6, 0); writeU16V152(eocd, 8, entries.length); writeU16V152(eocd, 10, entries.length);
    writeU32V152(eocd, 12, centralBytes.length); writeU32V152(eocd, 16, centralStart); writeU16V152(eocd, 20, 0);
    return concatBytesV152([...localParts, centralBytes, eocd]);
  }
  function downloadBytesV152(bytes, filename, type){
    const blob = new Blob([bytes], { type: type || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1200);
  }

  async function backupZipV152(){
    const records = safeV152(() => Array.isArray(state.records) ? state.records : [], []);
    if (!records.length) return toastV152('Yedek alınacak kayıt yok.');
    showWorkV152('ZIP yedek hazırlanıyor', 'Kayıtlar parça parça hazırlanıyor.', 3, 'Başlatılıyor...');
    await delayV152(50);
    const chunks = [];
    for (let i = 0; i < records.length; i += CHUNK_SIZE_V152) {
      chunks.push(records.slice(i, i + CHUNK_SIZE_V152));
      const pct = Math.min(45, 5 + Math.round((i / Math.max(records.length, 1)) * 40));
      showWorkV152('ZIP yedek hazırlanıyor', 'Kayıtlar parçalara ayrılıyor.', pct, `${Math.min(i + CHUNK_SIZE_V152, records.length).toLocaleString('tr-TR')} / ${records.length.toLocaleString('tr-TR')} kayıt`);
      if (chunks.length % 2 === 0) await nextTickV152();
    }
    const chunkFiles = chunks.map((_, idx) => `kayitlar_${String(idx + 1).padStart(3, '0')}.json`);
    const settings = safeV152(() => state.settings || {}, {});
    const totals = safeV152(function(){
      const adet = records.reduce((s,r) => s + (Number(r.quantity) || Number(r.adet) || 0), 0);
      const desi = records.reduce((s,r) => s + (Number(r.desi) || 0), 0);
      return { toplamKayit: records.length, toplamAdet: adet, toplamM3: Number((desi / 1000).toFixed(3)), toplamDesi: desi };
    }, { toplamKayit: records.length });
    const manifest = {
      app: 'Mesaha İO', backupType: 'mesaha-zip', fileVersion: FILE_VERSION_V152, visibleVersion: BUILD_VERSION_V152,
      createdAt: formatDateTimeV152(), totalRecords: records.length, chunkSize: CHUNK_SIZE_V152, chunks: chunkFiles, systemHeaders: safeV152(() => HEADERS, [])
    };
    const entries = [
      { name:'manifest.json', text: JSON.stringify(manifest, null, 2) },
      { name:'ayarlar.json', text: JSON.stringify(settings, null, 2) },
      { name:'ozet.json', text: JSON.stringify(totals, null, 2) }
    ];
    for (let i = 0; i < chunks.length; i++) {
      entries.push({ name: chunkFiles[i], text: JSON.stringify({ index:i + 1, count:chunks[i].length, records:chunks[i] }, null, 2) });
      showWorkV152('ZIP yedek hazırlanıyor', 'Kayıt parçaları ZIP içine ekleniyor.', 45 + Math.round(((i+1) / chunks.length) * 35), `${i+1} / ${chunks.length} parça`);
      if (i % 2 === 0) await nextTickV152();
    }
    showWorkV152('ZIP yedek hazırlanıyor', 'Tek ZIP dosyası oluşturuluyor.', 88, 'Sıkıştırmadan güvenli paketleme...');
    await delayV152(40);
    const zipBytes = makeZipV152(entries);
    showWorkV152('ZIP yedek hazırlanıyor', 'Dosya indiriliyor.', 98, `${records.length.toLocaleString('tr-TR')} kayıt hazır`);
    downloadBytesV152(zipBytes, `mesaha_yedek_${dateFileNameV152()}.zip`, 'application/zip');
    setTimeout(hideWorkV152, 350);
    toastV152('ZIP yedek indirildi.');
  }

  function readU16V152(b, o){ return b[o] | (b[o+1] << 8); }
  function readU32V152(b, o){ return (b[o] | (b[o+1] << 8) | (b[o+2] << 16) | (b[o+3] << 24)) >>> 0; }
  function findEocdV152(bytes){
    const min = Math.max(0, bytes.length - 66000);
    for (let i = bytes.length - 22; i >= min; i--) if (readU32V152(bytes, i) === 0x06054b50) return i;
    return -1;
  }
  function parseZipV152(bytes){
    const dec = new TextDecoder('utf-8');
    const eocd = findEocdV152(bytes);
    if (eocd < 0) throw new Error('ZIP son bilgisi bulunamadı.');
    const count = readU16V152(bytes, eocd + 10);
    const cdOffset = readU32V152(bytes, eocd + 16);
    let pos = cdOffset;
    const files = {};
    for (let i = 0; i < count; i++) {
      if (readU32V152(bytes, pos) !== 0x02014b50) throw new Error('ZIP merkez dizini okunamadı.');
      const method = readU16V152(bytes, pos + 10);
      const compSize = readU32V152(bytes, pos + 20);
      const nameLen = readU16V152(bytes, pos + 28);
      const extraLen = readU16V152(bytes, pos + 30);
      const commentLen = readU16V152(bytes, pos + 32);
      const localOffset = readU32V152(bytes, pos + 42);
      const name = dec.decode(bytes.slice(pos + 46, pos + 46 + nameLen));
      if (readU32V152(bytes, localOffset) !== 0x04034b50) throw new Error('ZIP dosya başlığı okunamadı.');
      if (method !== 0) throw new Error('Bu ZIP yedeği desteklenmeyen sıkıştırma kullanıyor. Mesaha İO ile alınan ZIP yedeğini seçiniz.');
      const localNameLen = readU16V152(bytes, localOffset + 26);
      const localExtraLen = readU16V152(bytes, localOffset + 28);
      const dataStart = localOffset + 30 + localNameLen + localExtraLen;
      files[name] = dec.decode(bytes.slice(dataStart, dataStart + compSize));
      pos += 46 + nameLen + extraLen + commentLen;
    }
    return files;
  }

  function openDbV152(){
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB yok'));
      const req = indexedDB.open(IDB_NAME_V152, 1);
      req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains(IDB_STORE_V152)) db.createObjectStore(IDB_STORE_V152); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IndexedDB açılamadı'));
    });
  }
  async function idbSetV152(key, value){
    const db = await openDbV152();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_V152, 'readwrite');
      tx.objectStore(IDB_STORE_V152).put(value, key);
      tx.oncomplete = () => { db.close(); resolve(true); };
      tx.onerror = () => { db.close(); reject(tx.error || new Error('IndexedDB kayıt hatası')); };
    });
  }
  async function idbGetV152(key){
    const db = await openDbV152();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_V152, 'readonly');
      const req = tx.objectStore(IDB_STORE_V152).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IndexedDB okuma hatası'));
      tx.oncomplete = () => db.close();
    });
  }
  const originalSaveRecordsV152 = safeV152(() => saveRecords, null);
  safeV152(function(){
    saveRecords = function(){
      const records = safeV152(() => Array.isArray(state.records) ? state.records : [], []);
      try {
        if (typeof STORAGE_KEY !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        localStorage.removeItem(IDB_MARKER_KEY_V152);
      } catch(e) {
        try { if (typeof STORAGE_KEY !== 'undefined') localStorage.removeItem(STORAGE_KEY); localStorage.setItem(IDB_MARKER_KEY_V152, '1'); } catch {}
      }
      idbSetV152(IDB_RECORDS_KEY_V152, records).catch(function(){});
    };
  });
  function saveSettingsV152(){
    safeV152(function(){ if (typeof SETTINGS_KEY !== 'undefined') localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings || {})); });
    idbSetV152(IDB_SETTINGS_KEY_V152, safeV152(() => state.settings || {}, {})).catch(function(){});
  }
  async function hydrateFromIndexedDbV152(){
    try {
      const marker = localStorage.getItem(IDB_MARKER_KEY_V152);
      const localRecords = safeV152(() => (typeof STORAGE_KEY !== 'undefined' ? JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') : []), []);
      if (!marker && Array.isArray(localRecords) && localRecords.length) {
        idbSetV152(IDB_RECORDS_KEY_V152, localRecords).catch(function(){});
        return;
      }
      const records = await idbGetV152(IDB_RECORDS_KEY_V152);
      if (Array.isArray(records) && records.length) {
        state.records = records;
        const settings = await idbGetV152(IDB_SETTINGS_KEY_V152).catch(() => null);
        if (settings && typeof settings === 'object') state.settings = { ...state.settings, ...settings };
        if (typeof render === 'function') render();
        if (typeof forceRefreshSummaryCards === 'function') forceRefreshSummaryCards();
        toastV152('Kayıtlar güvenli depodan yüklendi.');
      }
    } catch(e) {}
  }

  async function restoreJsonBackupV152(text){
    const data = JSON.parse(text);
    if (!Array.isArray(data.records)) throw new Error('Geçersiz yedek dosyası.');
    if (!confirm(`${data.records.length.toLocaleString('tr-TR')} kayıt yüklensin mi? Mevcut kayıtlar değişir.`)) return;
    showWorkV152('Yedek yükleniyor', 'Yedek dosyası okunuyor.', 10, 'Başlatılıyor...');
    const incoming = data.records;
    const records = [];
    for (let i = 0; i < incoming.length; i += CHUNK_SIZE_V152) {
      records.push(...incoming.slice(i, i + CHUNK_SIZE_V152));
      showWorkV152('Yedek yükleniyor', 'Kayıtlar parça parça hazırlanıyor.', 10 + Math.round((Math.min(i + CHUNK_SIZE_V152, incoming.length) / incoming.length) * 70), `${Math.min(i + CHUNK_SIZE_V152, incoming.length).toLocaleString('tr-TR')} / ${incoming.length.toLocaleString('tr-TR')} kayıt`);
      await nextTickV152();
    }
    state.records = records;
    state.settings = { ...state.settings, ...(data.settings || {}) };
    saveRecords(); saveSettingsV152();
    showWorkV152('Yedek yükleniyor', 'Ekran güncelleniyor.', 95, 'Son adım...');
    await delayV152(30);
    if (typeof render === 'function') render();
    if (typeof forceRefreshSummaryCards === 'function') forceRefreshSummaryCards();
    hideWorkV152(); toastV152('Yedek yüklendi.');
  }
  async function restoreZipBackupV152(file){
    showWorkV152('ZIP yedek okunuyor', 'Yedek dosyası açılıyor.', 5, 'Dosya kontrol ediliyor...');
    await delayV152(50);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const files = parseZipV152(bytes);
    const manifest = JSON.parse(files['manifest.json'] || '{}');
    if (manifest.backupType !== 'mesaha-zip' || !Array.isArray(manifest.chunks)) throw new Error('Bu ZIP, Mesaha İO ZIP yedeği değil.');
    const total = Number(manifest.totalRecords) || 0;
    if (!confirm(`${total.toLocaleString('tr-TR')} kayıt ZIP yedeğinden yüklensin mi? Mevcut kayıtlar değişir.`)) { hideWorkV152(); return; }
    const records = [];
    for (let i = 0; i < manifest.chunks.length; i++) {
      const name = manifest.chunks[i];
      if (!files[name]) throw new Error(`${name} ZIP içinde bulunamadı.`);
      const part = JSON.parse(files[name]);
      if (!Array.isArray(part.records)) throw new Error(`${name} geçersiz.`);
      records.push(...part.records);
      const pct = 10 + Math.round(((i + 1) / manifest.chunks.length) * 70);
      showWorkV152('ZIP yedek yükleniyor', 'Yedek parçaları sırayla okunuyor.', pct, `${records.length.toLocaleString('tr-TR')} / ${total.toLocaleString('tr-TR')} kayıt`);
      await nextTickV152();
    }
    const settings = safeV152(() => files['ayarlar.json'] ? JSON.parse(files['ayarlar.json']) : {}, {});
    state.records = records;
    state.settings = { ...state.settings, ...(settings || {}) };
    showWorkV152('ZIP yedek yükleniyor', 'Kayıtlar güvenli depoya yazılıyor.', 86, 'Kaydediliyor...');
    saveRecords(); saveSettingsV152();
    await idbSetV152(IDB_RECORDS_KEY_V152, records).catch(function(){});
    await idbSetV152(IDB_SETTINGS_KEY_V152, safeV152(() => state.settings || {}, {})).catch(function(){});
    showWorkV152('ZIP yedek yükleniyor', 'Ekran güncelleniyor.', 96, 'Son adım...');
    await delayV152(40);
    if (typeof render === 'function') render();
    if (typeof forceRefreshSummaryCards === 'function') forceRefreshSummaryCards();
    hideWorkV152(); toastV152('ZIP yedek başarıyla yüklendi.');
  }
  safeV152(function(){
    restoreFromFile = async function(file){
      try {
        const name = String(file && file.name || '').toLowerCase();
        if (name.endsWith('.zip')) return await restoreZipBackupV152(file);
        const text = await (file.text ? file.text() : new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(r.error); r.readAsText(file); }));
        return await restoreJsonBackupV152(text);
      } catch(err) {
        console.error(err);
        hideWorkV152();
        errorToastV152(err && err.message ? err.message : 'Yedek dosyası okunamadı.');
      }
    };
  });

  function fmtM3V152(desi){
    try { if (typeof formatHacimFromDesi === 'function') return formatHacimFromDesi(Number(desi) || 0); } catch {}
    return ((Number(desi) || 0) / 1000).toFixed(3).replace('.', ',');
  }
  function treeInfoV152(value){
    try { if (typeof treeInfoV144 === 'function') return treeInfoV144(value); } catch {}
    try { if (typeof getTreeInfo === 'function') return getTreeInfo(value); } catch {}
    return { agacAdi: value || 'Karaçam' };
  }
  function treeKeyV152(r){
    try { if (typeof treeOfRecordV144 === 'function') return treeOfRecordV144(r); } catch {}
    return r.treeType || r.species || r.agacAdi || 'Karaçam';
  }
  function activeTreeFilterV152(){
    try { if (typeof activeTreeFilterV144 === 'function') return activeTreeFilterV144(); } catch {}
    return 'all';
  }
  function activeTreeLabelV152(key){ return key === 'all' ? 'Tümü' : (treeInfoV152(key).agacAdi || key); }
  const searchCacheV152 = new WeakMap();
  function searchTextV152(r){
    const sig = `${r.id || ''}|${r.barcode || ''}|${r.treeType || r.species || ''}|${r.productType || ''}|${r.length || ''}|${r.diameter || ''}|${r.quantity || ''}|${r.desi || ''}|${r.uretimTarihi || ''}|${r.createdAt || ''}`;
    const cached = searchCacheV152.get(r);
    if (cached && cached.sig === sig) return cached.text;
    const tree = treeInfoV152(r.treeType || r.species || 'Karaçam');
    let sys = {};
    try { if (typeof recordToSystemRow === 'function') sys = recordToSystemRow(r) || {}; } catch {}
    const text = [r.barcode, tree.agacAdi, r.treeType, r.species, r.productType, sys.odunAdi, r.qualityClass, r.length, r.diameter, r.quantity, r.desi, r.uretimTarihi, r.createdAt].join(' ').toLocaleLowerCase('tr-TR');
    searchCacheV152.set(r, { sig, text });
    return text;
  }
  function filteredRecordsV152(){
    const records = safeV152(() => Array.isArray(state.records) ? state.records : [], []);
    const treeFilter = activeTreeFilterV152();
    const query = safeV152(() => (els && els.searchInput ? els.searchInput.value.trim().toLocaleLowerCase('tr-TR') : ''), '');
    let list = records;
    if (treeFilter !== 'all') list = list.filter(r => treeKeyV152(r) === treeFilter);
    if (query) list = list.filter(r => searchTextV152(r).includes(query));
    return list;
  }
  safeV152(function(){ getFilteredRecords = filteredRecordsV152; });

  function ensurePagerV152(){
    let pager = $v152('recordsPagerV152');
    if (!pager) {
      pager = document.createElement('div');
      pager.id = 'recordsPagerV152';
      pager.className = 'records-pager-v152';
      const tableWrap = document.querySelector('.records-panel .table-wrap');
      if (tableWrap && tableWrap.parentNode) tableWrap.parentNode.insertBefore(pager, tableWrap.nextSibling);
    }
    if (!pager.__boundV152) {
      pager.__boundV152 = true;
      pager.addEventListener('click', function(event){
        const btn = event.target.closest('[data-page-v152]');
        if (!btn) return;
        const action = btn.getAttribute('data-page-v152');
        const totalPages = Number(state.__v152TotalPages || 1);
        let page = Number(state.__v152Page || 1);
        if (action === 'prev') page -= 1;
        if (action === 'next') page += 1;
        if (action === 'first') page = 1;
        if (action === 'last') page = totalPages;
        state.__v152Page = Math.max(1, Math.min(totalPages, page));
        if (typeof render === 'function') render();
        safeV152(() => pager.scrollIntoView({ block:'center', behavior:'smooth' }));
      });
    }
    return pager;
  }
  function renderPagerV152(filteredLength, page, totalPages, start, end){
    const pager = ensurePagerV152();
    if (!pager) return;
    if (filteredLength <= PAGE_SIZE_V152) { pager.style.display = filteredLength ? 'flex' : 'none'; }
    else { pager.style.display = 'flex'; }
    pager.innerHTML = `<div class="pager-info-v152">${filteredLength.toLocaleString('tr-TR')} kayıt içinde ${start.toLocaleString('tr-TR')}-${end.toLocaleString('tr-TR')} gösteriliyor<br><small>Sayfa ${page.toLocaleString('tr-TR')} / ${totalPages.toLocaleString('tr-TR')} • Ekrana aynı anda ${PAGE_SIZE_V152} kayıt basılır.</small></div><div class="pager-actions-v152"><button type="button" class="ghost" data-page-v152="first" ${page<=1?'disabled':''}>İlk</button><button type="button" class="ghost" data-page-v152="prev" ${page<=1?'disabled':''}>Önceki</button><button type="button" data-page-v152="next" ${page>=totalPages?'disabled':''}>Sonraki</button><button type="button" class="ghost" data-page-v152="last" ${page>=totalPages?'disabled':''}>Son</button></div>`;
  }
  function totalsFromListV152(list){
    const totals = { all:0, adet:0, Tomruk:0, TomrukAdet:0, 'Maden Direk':0, MadenAdet:0, 'Kağıtlık':0, KagitAdet:0, 'Sanayi Odunu':0, SanayiAdet:0, 'Tel Direk':0, TelAdet:0 };
    for (const r of (Array.isArray(list) ? list : [])) {
      const qty = Number(r.quantity) || Number(r.adet) || 0;
      const val = Number(r.desi) || 0;
      let key = r.productType || 'Tomruk';
      try { if (typeof normalizeProductType === 'function') key = normalizeProductType(key); } catch {}
      totals.all += val; totals.adet += qty;
      if (Object.prototype.hasOwnProperty.call(totals, key)) totals[key] += val;
      if (key === 'Tomruk') totals.TomrukAdet += qty;
      if (key === 'Maden Direk') totals.MadenAdet += qty;
      if (key === 'Kağıtlık') totals.KagitAdet += qty;
      if (key === 'Sanayi Odunu') totals.SanayiAdet += qty;
      if (key === 'Tel Direk') totals.TelAdet += qty;
    }
    return totals;
  }
  function renderRowsV152(pageRecords){
    return pageRecords.map((r) => {
      let sys = {}; try { if (typeof recordToSystemRow === 'function') sys = recordToSystemRow(r) || {}; } catch {}
      const tree = treeInfoV152(r.treeType || r.species || 'Karaçam');
      const treeClass = safeV152(() => typeof normalizeTreeClass === 'function' ? normalizeTreeClass(r.treeType || r.species || 'Karaçam') : '', '');
      const productClass = safeV152(() => typeof normalizeProductClass === 'function' ? normalizeProductClass(r.productType || 'Tomruk') : '', '');
      const id = escapeV152(r.id || '');
      const sysOdun = sys.odunAdi || r.productType || 'Tomruk';
      const orderNo = (state.records || []).length - (state.records || []).indexOf(r);
      return `<tr class="clickable-row" onclick="editRecord('${id}')"><td class="select-col"><input class="record-select" type="checkbox" ${state.selectedRecordIds && state.selectedRecordIds.has(r.id) ? 'checked' : ''} onclick="event.stopPropagation()" onchange="toggleRecordSelection('${id}', this.checked)" /></td><td>${orderNo}</td><td><b>${escapeV152(r.barcode)}</b></td><td><span class="tag tree-tag ${treeClass}">${escapeV152(tree.agacAdi)}</span></td><td><span class="tag ${productClass}">${escapeV152(sysOdun)}</span></td><td class="num">${escapeV152(sys.boy || r.length || '')}</td><td class="num">${escapeV152(sys.cap || r.diameter || '')}</td><td class="num">${escapeV152(sys.adet || r.quantity || '')}</td><td class="num">${fmtM3V152(Number(r.desi || 0))} m³</td><td>${escapeV152(sys.uretimTarihi || r.uretimTarihi || '')}</td><td><button class="mini-btn edit-mini" onclick="event.stopPropagation(); editRecord('${id}')">Düzelt</button><button class="mini-btn delete-mini" onclick="event.stopPropagation(); deleteRecord('${id}')">Sil</button></td></tr>`;
    }).join('');
  }

  function renderV152(){
    const filtered = filteredRecordsV152();
    if (typeof cleanSelectedRecordIds === 'function') cleanSelectedRecordIds();
    if (!state.selectedRecordIds) state.selectedRecordIds = new Set();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE_V152));
    let page = Math.max(1, Math.min(totalPages, Number(state.__v152Page || 1)));
    state.__v152Page = page; state.__v152TotalPages = totalPages;
    const startIndex = filtered.length ? (page - 1) * PAGE_SIZE_V152 : 0;
    const pageRecords = filtered.slice(startIndex, startIndex + PAGE_SIZE_V152);
    state.__v152PageRecords = pageRecords; state.__v152FilteredRecords = filtered;
    const endIndex = filtered.length ? startIndex + pageRecords.length : 0;
    if (els && els.recordsBody) els.recordsBody.innerHTML = renderRowsV152(pageRecords);
    if (els && els.emptyState) els.emptyState.style.display = filtered.length ? 'none' : 'block';
    if (typeof updateBulkActions === 'function') updateBulkActions(pageRecords);
    const active = activeTreeFilterV152();
    if (els && els.recordCount) {
      const allCount = (state.records || []).length;
      const label = active === 'all' ? '' : ` • ${activeTreeLabelV152(active)}`;
      els.recordCount.textContent = active === 'all'
        ? `${allCount.toLocaleString('tr-TR')} kayıt`
        : `${filtered.length.toLocaleString('tr-TR')}/${allCount.toLocaleString('tr-TR')} kayıt${label}`;
    }
    if (typeof renderRecentBarcodes === 'function') renderRecentBarcodes();
    if (typeof renderDailyWorkSummary === 'function') renderDailyWorkSummary();
    const totals = totalsFromListV152(filtered);
    safeV152(function(){
      if (els.totalDesi) els.totalDesi.textContent = fmtM3V152(totals.all);
      if (els.totalAdet) els.totalAdet.textContent = totals.adet.toLocaleString('tr-TR');
      if (els.totalTomruk) els.totalTomruk.textContent = fmtM3V152(totals.Tomruk) + ' m³';
      if (els.totalTomrukAdet) els.totalTomrukAdet.textContent = totals.TomrukAdet.toLocaleString('tr-TR') + ' adet';
      if (els.totalMaden) els.totalMaden.textContent = fmtM3V152(totals['Maden Direk']) + ' m³';
      if (els.totalMadenAdet) els.totalMadenAdet.textContent = totals.MadenAdet.toLocaleString('tr-TR') + ' adet';
      if (els.totalKagit) els.totalKagit.textContent = fmtM3V152(totals['Kağıtlık']) + ' m³';
      if (els.totalKagitAdet) els.totalKagitAdet.textContent = totals.KagitAdet.toLocaleString('tr-TR') + ' adet';
      if (els.totalSanayi) els.totalSanayi.textContent = fmtM3V152(totals['Sanayi Odunu']) + ' m³';
      if (els.totalSanayiAdet) els.totalSanayiAdet.textContent = totals.SanayiAdet.toLocaleString('tr-TR') + ' adet';
      if (els.totalTel) els.totalTel.textContent = fmtM3V152(totals['Tel Direk']) + ' m³';
      if (els.totalTelAdet) els.totalTelAdet.textContent = totals.TelAdet.toLocaleString('tr-TR') + ' adet';
    });
    safeV152(function(){
      const setPrintZero = (el, adet, hacim) => { const card = el ? el.closest('.stat') : null; if (card) card.classList.toggle('print-zero', !(Number(adet) || Number(hacim))); };
      setPrintZero(els.totalTomruk, totals.TomrukAdet, totals.Tomruk); setPrintZero(els.totalMaden, totals.MadenAdet, totals['Maden Direk']); setPrintZero(els.totalKagit, totals.KagitAdet, totals['Kağıtlık']); setPrintZero(els.totalSanayi, totals.SanayiAdet, totals['Sanayi Odunu']); setPrintZero(els.totalTel, totals.TelAdet, totals['Tel Direk']);
    });
    if (els && els.recordsFoot) {
      els.recordsFoot.innerHTML = filtered.length ? `<tr class="table-total-row"><td colspan="7">Seçili filtre toplamı</td><td class="num">${totals.adet.toLocaleString('tr-TR')} adet</td><td class="num">${fmtM3V152(totals.all)} m³</td><td colspan="2"></td></tr>` : '';
    }
    renderPagerV152(filtered.length, page, totalPages, startIndex + 1, endIndex);
    safeV152(function(){ if (typeof renderTreeFilterV144 === 'function') renderTreeFilterV144(); });
    safeV152(function(){ if (typeof renderMobileRecordsV111 === 'function') renderMobileRecordsV111(true); });
    safeV152(function(){ if (typeof updateFlowTabsV111 === 'function') updateFlowTabsV111(); });
    safeV152(function(){ if (typeof hideOldNavsV111 === 'function') hideOldNavsV111(); });
  }
  safeV152(function(){ render = renderV152; });
  safeV152(function(){
    getBeyanTotals = function(){
      const t = totalsFromListV152(filteredRecordsV152());
      return { all:t.all, adet:t.adet, products:{
        'Tomruk':{label:'Tomruk',className:'tomruk',volume:t.Tomruk,adet:t.TomrukAdet},
        'Maden Direk':{label:'Maden Direği',className:'maden',volume:t['Maden Direk'],adet:t.MadenAdet},
        'Kağıtlık':{label:'Kağıtlık',className:'kagit',volume:t['Kağıtlık'],adet:t.KagitAdet},
        'Sanayi Odunu':{label:'Sanayi Odunu',className:'sanayi',volume:t['Sanayi Odunu'],adet:t.SanayiAdet},
        'Tel Direk':{label:'Tel Direği',className:'tel',volume:t['Tel Direk'],adet:t.TelAdet}
      }};
    };
  });
  safeV152(function(){
    renderMobileRecordsV111 = function(){
      const wrap = $v152('mobileRecordsV111'); if (!wrap) return;
      const list = state.__v152PageRecords || [];
      if (!state.selectedRecordIds) state.selectedRecordIds = new Set();
      if (!list.length) { wrap.innerHTML = '<div class="empty">Kayıt yok.</div>'; return; }
      wrap.innerHTML = list.map((r) => {
        let product = r.productType || r.woodType || r.odunAdi || 'Tomruk';
        try { if (typeof normalizeProductType === 'function') product = normalizeProductType(product); } catch {}
        const cls = safeV152(() => typeof productClassV111 === 'function' ? productClassV111(product) : '', '');
        const tree = r.treeType || r.agacAdi || 'Karaçam';
        const id = String(r.id || '');
        const checked = state.selectedRecordIds.has(id);
        const barcode = r.barcode || r.barkodNo || '-';
        const length = r.length || r.boy || '-';
        const diameter = r.diameter || r.cap || '-';
        const quantity = r.quantity || r.adet || 1;
        const pShort = safeV152(() => typeof productShortV111 === 'function' ? productShortV111(product) : product, product);
        const tShort = safeV152(() => typeof treeShortV111 === 'function' ? treeShortV111(tree) : tree, tree);
        return `<div class="record-row-v111 ${cls} ${checked ? 'selected' : ''}" data-v111-row="${escapeV152(id)}"><label class="record-select-v111" title="Seç"><input type="checkbox" data-v111-select="${escapeV152(id)}" ${checked ? 'checked' : ''} /></label><div class="record-main-v111"><b>${escapeV152(barcode)}</b><div class="record-tags-v111"><span class="mini-tag-v111 ${cls}" title="${escapeV152(product)}">${escapeV152(pShort)}</span><span class="mini-tag-v111 tree" title="${escapeV152(tree)}">${escapeV152(tShort)}</span></div></div><div class="record-values-v111"><div class="record-val-v111"><small>B</small><strong>${escapeV152(String(length))}</strong></div><div class="record-val-v111"><small>Ç</small><strong>${escapeV152(String(diameter))}</strong></div><div class="record-val-v111"><small>A</small><strong>${escapeV152(String(quantity))}</strong></div></div><div class="record-actions-v111"><button type="button" class="record-edit-v111" data-v111-edit="${escapeV152(id)}">Düz</button><button type="button" class="record-delete-v111" data-v111-delete="${escapeV152(id)}">Sil</button></div></div>`;
      }).join('');
    };
  });

  const originalExportSystemXlsV152 = safeV152(() => exportSystemXls, null);
  async function exportSystemXlsWithLoadingV152(){
    const count = safeV152(() => (state.records || []).length, 0);
    if (!count) return toastV152('Çıktı için kayıt yok.');
    showWorkV152('Mesaha dosyası hazırlanıyor', 'ORBİS uyumlu Excel dosyası oluşturuluyor. Format korunuyor.', 12, `${count.toLocaleString('tr-TR')} kayıt`);
    await delayV152(70);
    try {
      if (typeof originalExportSystemXlsV152 === 'function') originalExportSystemXlsV152();
      else errorToastV152('Mesaha dosyası oluşturma fonksiyonu bulunamadı.');
      showWorkV152('Mesaha dosyası hazırlanıyor', 'İndirme başlatıldı.', 100, 'Hazır');
      setTimeout(hideWorkV152, 450);
    } catch(e) {
      console.error(e); hideWorkV152(); errorToastV152('Mesaha dosyası hazırlanamadı.');
    }
  }
  safeV152(function(){ exportSystemXls = exportSystemXlsWithLoadingV152; backup = backupZipV152; });

  function bindMainButtonsV152(){
    const restoreInput = $v152('restoreInput');
    if (restoreInput) restoreInput.setAttribute('accept', '.zip,application/zip');
    const btnDefs = [
      ['exportSystemXlsBtn', 'Mesaha Dosyasını İndir', 'export', exportSystemXlsWithLoadingV152],
      ['backupBtn', 'Yedek Al', 'backup', backupZipV152],
      ['restoreBtn', 'Yedek Yükle', 'restore', function(){ const input = $v152('restoreInput'); if (input) input.click(); }]
    ];
    btnDefs.forEach(([id, text, kind, action]) => {
      const old = $v152(id); if (!old || old.__v152Bound) return;
      const clone = old.cloneNode(true); clone.textContent = text; clone.__v152Bound = true; clone.__v151InfoBound = true; if (kind === 'export') clone.__v135Bound = true;
      old.parentNode.replaceChild(clone, old);
      safeV152(function(){ if (els) els[id] = clone; });
      clone.addEventListener('click', function(event){
        event.preventDefault(); event.stopPropagation(); if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        showInfoV152(kind, action);
      }, true);
    });
  }
  function bindSearchV152(){
    const old = $v152('searchInput');
    if (!old || old.__v152Bound) return;
    const clone = old.cloneNode(true);
    clone.value = old.value || '';
    clone.__v152Bound = true;
    old.parentNode.replaceChild(clone, old);
    safeV152(function(){ if (els) els.searchInput = clone; });
    let timer = null;
    clone.addEventListener('input', function(){
      state.__v152Page = 1;
      clearTimeout(timer);
      timer = setTimeout(function(){ if (typeof render === 'function') render(); }, 90);
    });
  }
  function bindTreePageResetV152(){
    if (document.body.__treePageResetV152) return;
    document.body.__treePageResetV152 = true;
    document.addEventListener('click', function(event){
      if (event.target && event.target.closest && event.target.closest('[data-tree-filter-v144]')) state.__v152Page = 1;
    }, true);
  }

  function bootV152(){
    injectCssV152(); applyVersionV152(); bindMainButtonsV152(); bindSearchV152(); bindTreePageResetV152();
    safeV152(function(){ if (typeof render === 'function') render(); });
    safeV152(function(){
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) navigator.serviceWorker.getRegistration().then(reg => { if (reg && reg.update) reg.update().catch(function(){}); }).catch(function(){});
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootV152); else bootV152();
  setTimeout(hydrateFromIndexedDbV152, 300);
  [120, 500, 1200, 2600].forEach(ms => setTimeout(bootV152, ms));
  setInterval(applyVersionV152, 1200);
})();


;
