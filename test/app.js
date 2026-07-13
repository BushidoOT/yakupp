(() => {
  'use strict';

  const VERSION = '1.0.0';
  const BUILD = '1';
  const STORAGE = {
    profile: 'mesahaSuite.profile.v1',
    seflikler: 'mesahaSuite.seflikler.v1',
    ormancilar: 'mesahaSuite.ormancilar.v1',
    bolmeler: 'mesahaSuite.bolmeler.v1',
    lastSync: 'mesahaSuite.lastSync.v1',
    settings: 'mesahaSuite.settings.v1'
  };

  const APP_URLS = {
    mesaha: './stable/',
    istif: './istif/'
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const safeParse = (value, fallback) => {
    try { return value ? JSON.parse(value) : fallback; } catch (_) { return fallback; }
  };

  const read = (key, fallback) => safeParse(localStorage.getItem(key), fallback);
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const makeId = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const tidy = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');
  const formatDate = (date) => new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  const initials = (name) => tidy(name).split(' ').filter(Boolean).slice(0, 2).map(part => part[0]?.toLocaleUpperCase('tr-TR')).join('') || 'MS';

  const state = {
    profile: read(STORAGE.profile, null),
    seflikler: read(STORAGE.seflikler, []),
    ormancilar: read(STORAGE.ormancilar, []),
    bolmeler: read(STORAGE.bolmeler, []),
    lastSync: localStorage.getItem(STORAGE.lastSync) || ''
  };

  const modalMap = {
    login: $('#loginModal'),
    seflik: $('#seflikModal'),
    ormanci: $('#ormanciModal'),
    bolme: $('#bolmeModal'),
    info: $('#infoModal')
  };

  let activeModal = null;
  let toastTimer = null;

  function setLogoFallback() {
    const logo = $('#brandLogo');
    if (!logo) return;
    logo.addEventListener('error', () => {
      if (!logo.src.endsWith('suite-fallback-logo.svg')) logo.src = './assets/suite-fallback-logo.svg';
    }, { once: true });
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function openModal(name) {
    const modal = modalMap[name];
    if (!modal) return;
    if ((name === 'ormanci' || name === 'bolme' || name === 'login') && !state.seflikler.length) {
      if (name !== 'login') {
        showToast('Önce bir şeflik oluşturmalısınız.');
        return openModal('seflik');
      }
    }
    refreshSelects();
    if (name === 'login' && state.profile) {
      $('#loginName').value = state.profile.name || '';
      $('#loginSeflik').value = state.profile.seflikId || '';
    }
    $('#modalBackdrop').hidden = false;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    activeModal = modal;
    requestAnimationFrame(() => modal.querySelector('input,select,textarea,button')?.focus());
  }

  function closeModal() {
    if (!activeModal) return;
    activeModal.hidden = true;
    $('#modalBackdrop').hidden = true;
    document.body.classList.remove('modal-open');
    activeModal = null;
  }

  function showInfo(title, html, kicker = 'BİLGİ') {
    $('#infoModalTitle').textContent = title;
    $('#infoKicker').textContent = kicker;
    $('#infoContent').innerHTML = html;
    openModal('info');
  }

  function normalizeSeflikName(name) {
    const cleaned = tidy(name);
    return /şefliği$/i.test(cleaned) ? cleaned : `${cleaned} Şefliği`;
  }

  function refreshSelects() {
    const options = state.seflikler.length
      ? '<option value="">Şeflik seçin</option>' + state.seflikler.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')
      : '<option value="">Önce şeflik oluşturun</option>';
    ['#loginSeflik', '#ormanciSeflik', '#bolmeSeflik'].forEach(selector => {
      const select = $(selector);
      const old = select.value;
      select.innerHTML = options;
      if ([...select.options].some(option => option.value === old)) select.value = old;
      else if (state.profile?.seflikId && [...select.options].some(option => option.value === state.profile.seflikId)) select.value = state.profile.seflikId;
    });
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function renderProfile() {
    const profile = state.profile;
    const office = profile ? state.seflikler.find(item => item.id === profile.seflikId) : null;
    $('#profileName').textContent = profile?.name || 'Giriş yapılmadı';
    $('#profileOffice').lastChild.textContent = office ? ` ${office.name}` : ' Şeflik seçilmedi';
    $('#avatar').textContent = initials(profile?.name || 'Mesaha Suite');
    $('#loginButtonTitle').textContent = profile ? 'Oturumu Düzenle' : 'Giriş Yap';
    $('#welcomeLabel').textContent = profile ? 'Hoş geldiniz,' : 'Ortak kullanıcı hesabı';
  }

  function renderStatus() {
    const online = navigator.onLine;
    $('#connectionPill').classList.toggle('offline', !online);
    $('#connectionText').textContent = online ? 'Çevrimiçi' : 'Çevrimdışı';
    $('#lastSync').textContent = state.lastSync ? formatDate(new Date(state.lastSync)) : 'Henüz yapılmadı';
    $('#versionText').textContent = `${VERSION} (Build ${BUILD})`;
  }

  function persistSharedContext() {
    const office = state.seflikler.find(item => item.id === state.profile?.seflikId) || null;
    const context = {
      version: 1,
      updatedAt: new Date().toISOString(),
      profile: state.profile,
      seflik: office,
      seflikler: state.seflikler,
      ormancilar: state.ormancilar,
      bolmeler: state.bolmeler
    };
    write('mesahaSuite.sharedContext.v1', context);
    window.dispatchEvent(new CustomEvent('mesaha-suite-context-updated', { detail: context }));
  }

  function saveSeflik(event) {
    event.preventDefault();
    const name = normalizeSeflikName($('#seflikName').value);
    if (!name || name === 'Şefliği') return;
    const exists = state.seflikler.some(item => item.name.toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR'));
    if (exists) return showToast('Bu şeflik zaten kayıtlı.');
    const item = {
      id: makeId('seflik'),
      name,
      directorate: tidy($('#seflikDirectorate').value),
      code: tidy($('#seflikCode').value),
      createdAt: new Date().toISOString()
    };
    state.seflikler.push(item);
    write(STORAGE.seflikler, state.seflikler);
    event.currentTarget.reset();
    closeModal();
    refreshSelects();
    persistSharedContext();
    showToast(`${name} oluşturuldu.`);
  }

  function saveLogin(event) {
    event.preventDefault();
    const name = tidy($('#loginName').value);
    const seflikId = $('#loginSeflik').value;
    if (!name || !seflikId) return showToast('Ad soyad ve şeflik seçimi gereklidir.');
    state.profile = {
      id: state.profile?.id || makeId('user'),
      name,
      seflikId,
      remember: $('#rememberLogin').checked,
      updatedAt: new Date().toISOString()
    };
    write(STORAGE.profile, state.profile);
    persistSharedContext();
    renderProfile();
    closeModal();
    showToast('Ortak oturum açıldı.');
  }

  function saveOrmanci(event) {
    event.preventDefault();
    const name = tidy($('#ormanciName').value);
    const seflikId = $('#ormanciSeflik').value;
    if (!name || !seflikId) return;
    const exists = state.ormancilar.some(item => item.seflikId === seflikId && item.name.toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR'));
    if (exists) return showToast('Bu ormancı seçilen şeflikte zaten kayıtlı.');
    state.ormancilar.push({
      id: makeId('ormanci'),
      name,
      seflikId,
      phone: tidy($('#ormanciPhone').value),
      createdAt: new Date().toISOString()
    });
    write(STORAGE.ormancilar, state.ormancilar);
    event.currentTarget.reset();
    closeModal();
    persistSharedContext();
    showToast(`${name} eklendi.`);
  }

  function saveBolme(event) {
    event.preventDefault();
    const number = tidy($('#bolmeNo').value);
    const seflikId = $('#bolmeSeflik').value;
    if (!number || !seflikId) return;
    const exists = state.bolmeler.some(item => item.seflikId === seflikId && item.number.toLocaleLowerCase('tr-TR') === number.toLocaleLowerCase('tr-TR'));
    if (exists) return showToast('Bu bölme seçilen şeflikte zaten kayıtlı.');
    state.bolmeler.push({
      id: makeId('bolme'),
      number,
      seflikId,
      location: tidy($('#bolmeLocation').value),
      createdAt: new Date().toISOString()
    });
    write(STORAGE.bolmeler, state.bolmeler);
    event.currentTarget.reset();
    closeModal();
    persistSharedContext();
    showToast(`${number} numaralı bölme eklendi.`);
  }

  function openApp(appName) {
    if (!state.profile) {
      showToast('Uygulamayı açmadan önce giriş yapın.');
      return openModal('login');
    }
    const url = APP_URLS[appName];
    if (!url) return;
    persistSharedContext();
    const office = state.seflikler.find(item => item.id === state.profile.seflikId);
    const params = new URLSearchParams({
      suite: '1',
      user: state.profile.name,
      seflik: office?.name || ''
    });
    window.location.href = `${url}?${params.toString()}`;
  }

  async function synchronize() {
    if (!state.profile) {
      showToast('Senkronizasyon için önce giriş yapın.');
      return openModal('login');
    }
    if (!navigator.onLine) return showToast('Bağlantı yok. Yerel bilgiler korunuyor.');
    persistSharedContext();
    state.lastSync = new Date().toISOString();
    localStorage.setItem(STORAGE.lastSync, state.lastSync);
    renderStatus();
    showToast('Ortak bilgiler hazırlandı ve senkronize edildi.');
  }

  async function checkUpdates() {
    if (!navigator.onLine) return showToast('Güncelleme kontrolü için internet bağlantısı gerekli.');
    try {
      const response = await fetch(`./version.json?ts=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Sürüm bilgisi alınamadı');
      const data = await response.json();
      if (String(data.version) !== VERSION || String(data.build) !== BUILD) {
        showInfo('Yeni Güncelleme Var', `<p><strong>${escapeHtml(data.version || '')}</strong> sürümü kullanıma hazır.</p><p>Sayfayı yenileyerek yeni dosyaları alabilirsiniz.</p>`, 'GÜNCELLEME');
      } else {
        showToast('Mesaha Suite güncel.');
      }
    } catch (_) {
      showToast('Güncelleme bilgisi alınamadı.');
    }
  }

  function openTool(name) {
    const officeCount = state.seflikler.length;
    const ormanciCount = state.ormancilar.length;
    const bolmeCount = state.bolmeler.length;
    if (name === 'sync') return synchronize();
    if (name === 'updates') return checkUpdates();
    if (name === 'settings') {
      return showInfo('Ortak Ayarlar', `
        <div class="info-stat"><span>Kayıtlı şeflik</span><strong>${officeCount}</strong></div>
        <div class="info-stat"><span>Kayıtlı ormancı</span><strong>${ormanciCount}</strong></div>
        <div class="info-stat"><span>Kayıtlı bölme</span><strong>${bolmeCount}</strong></div>
        <p style="margin-top:16px">Bu bilgiler Mesaha İO ve İstif İO tarafından ortak kullanılmak üzere aynı alan adında saklanır.</p>
      `, 'AYARLAR');
    }
    return showInfo('Mesaha Suite', `
      <p>Mesaha İO ve İstif İO için ortak başlangıç ve kullanıcı yönetim ekranı.</p>
      <ul><li>Tek ortak giriş</li><li>Şeflik, ormancı ve bölme yönetimi</li><li>Çevrimiçi/çevrimdışı durum takibi</li></ul>
      <div class="info-stat"><span>Versiyon</span><strong>${VERSION}</strong></div>
      <div class="info-stat"><span>Build</span><strong>${BUILD}</strong></div>
    `, 'HAKKINDA');
  }

  function bindEvents() {
    $$('[data-modal]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.modal)));
    $$('.modal-close,.modal-cancel').forEach(button => button.addEventListener('click', closeModal));
    $('#modalBackdrop').addEventListener('click', closeModal);
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });
    $('#profileAction').addEventListener('click', () => openModal('login'));
    $('#profileCard').addEventListener('dblclick', () => openModal('login'));
    $$('.app-card').forEach(button => button.addEventListener('click', () => openApp(button.dataset.app)));
    $$('[data-tool]').forEach(button => button.addEventListener('click', () => openTool(button.dataset.tool)));
    $('#footerUpdate').addEventListener('click', checkUpdates);
    $('#notificationButton').addEventListener('click', () => {
      $('#notificationDot').hidden = true;
      showInfo('Bildirimler', '<p>Şu anda yeni bir bildiriminiz bulunmuyor.</p>', 'BİLDİRİMLER');
    });
    $('#loginForm').addEventListener('submit', saveLogin);
    $('#seflikForm').addEventListener('submit', saveSeflik);
    $('#ormanciForm').addEventListener('submit', saveOrmanci);
    $('#bolmeForm').addEventListener('submit', saveBolme);
    window.addEventListener('online', renderStatus);
    window.addEventListener('offline', renderStatus);
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    try { await navigator.serviceWorker.register('./service-worker.js'); } catch (_) {}
  }

  function bootstrap() {
    setLogoFallback();
    refreshSelects();
    renderProfile();
    renderStatus();
    persistSharedContext();
    bindEvents();
    registerServiceWorker();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  else bootstrap();
})();
