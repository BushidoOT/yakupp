'use strict';

const APP_VERSION = '0.1.1';
const MAX_PHOTO_BYTES = 1024 * 1024;
const DB_NAME = 'mesaha-istif-prototype';
const DB_VERSION = 1;
const TYPE_ORDER = [
  'İbreli Kabuklu Kağıtlık Odun',
  'İbreli Lif Yonga Odun',
  'İbreli Yakacak Odun',
  'İbreli Sırık',
];

const SUPABASE_URL = 'https://swrbpdpotmirnmtqnuba.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_G_ZFeUouDxg57Nne5pflfQ_cVGpdMbR';
const EDGE_URL = `${SUPABASE_URL}/functions/v1/smooth-function`;
const SHARED_SESSION_KEY = 'mesaha_supabase_v500_session';
const SHARED_SESSION_BACKUP_KEY = 'mesaha_supabase_v569_session_backup';
const SHARED_PANEL_KEY = 'mesaha_panel_user_v316';
const SHARED_ACCESS_KEY = 'mesaha_google_access_v548';
const SHARED_ACTIVE_SEFLIK_KEY = 'mesaha_active_seflik_folder_v564';
const SHARED_CACHE_SETTING_KEY = 'shared-context-v011';

const DEFAULT_SETTINGS = {
  seflik: '',
  seflikKey: '',
  ormanci: '',
  driveClientId: '',
  driveFolderId: '',
  driveCreatedFolderId: '',
  photoMaxBytes: MAX_PHOTO_BYTES,
};

const state = {
  view: 'home',
  records: [],
  settings: { ...DEFAULT_SETTINGS },
  draft: null,
  selectedPhotos: [],
  selectedRecordIds: new Set(),
  documentTab: 'documents',
  cameraStream: null,
  facingMode: 'environment',
  syncing: false,
  sharedSyncing: false,
  seflikler: [],
  ormancilar: [],
  membersBySeflik: {},
  auth: {
    status: 'checking',
    userId: '',
    email: '',
    name: '',
    avatarUrl: '',
    error: '',
    updatedAt: '',
  },
};

const app = document.getElementById('app');
const picker = document.getElementById('photoPicker');
const cameraModal = document.getElementById('cameraModal');
const cameraVideo = document.getElementById('cameraVideo');
const dialogModal = document.getElementById('dialogModal');
const dialogContent = document.getElementById('dialogContent');
let dbPromise = null;

function icon(name, size = 24, extraClass = '') {
  const paths = {
    home: '<path d="M3 10.8 12 3l9 7.8"/><path d="M5 9.8V21h14V9.8"/><path d="M9 21v-7h6v7"/>',
    logs: '<circle cx="7" cy="8" r="3"/><circle cx="7" cy="8" r="1"/><circle cx="7" cy="16" r="3"/><circle cx="7" cy="16" r="1"/><path d="M10 5h7a3 3 0 0 1 0 6h-7M10 13h7a3 3 0 0 1 0 6h-7"/>',
    doc: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.06.06-2.12 2.12-.06-.06a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1.1 1.65V21h-3v-.59a1.8 1.8 0 0 0-1.1-1.65 1.8 1.8 0 0 0-2 .36l-.06.06-2.12-2.12.06-.06a1.8 1.8 0 0 0 .36-2A1.8 1.8 0 0 0 5 13.9H4v-3h1a1.8 1.8 0 0 0 1.65-1.1 1.8 1.8 0 0 0-.36-2l-.06-.06L8.35 5.6l.06.06a1.8 1.8 0 0 0 2 .36A1.8 1.8 0 0 0 11.5 4.4V3h3v1.4a1.8 1.8 0 0 0 1.1 1.65 1.8 1.8 0 0 0 2-.36l.06-.06 2.12 2.12-.06.06a1.8 1.8 0 0 0-.36 2A1.8 1.8 0 0 0 21 10.9h1v3h-1a1.8 1.8 0 0 0-1.6 1.1Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    camera: '<path d="M4 7h3l1.4-2h7.2L17 7h3v12H4z"/><circle cx="12" cy="13" r="4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    forest: '<path d="m8 3-4 6h3l-4 6h5v6M16 3l4 6h-3l4 6h-5v6M12 7l-3 5h2l-3 5h8l-3-5h2z"/>',
    pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    cube: '<path d="m12 2 9 5-9 5-9-5zM3 7v10l9 5 9-5V7M12 12v10"/>',
    barcode: '<path d="M4 5v14M7 5v14M10 5v14M14 5v14M17 5v14M20 5v14"/>',
    cloud: '<path d="M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.3 8.2 4.5 4.5 0 0 0 7 18Z"/>',
    filter: '<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',
    sync: '<path d="M20 7h-5V2M4 17h5v5"/><path d="M18.2 11A7 7 0 0 0 6.6 5.6L4 8M5.8 13A7 7 0 0 0 17.4 18.4L20 16"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    save: '<path d="M5 3h12l2 2v16H5zM8 3v6h8V3M8 21v-8h8v8"/>',
    refresh: '<path d="M20 6v5h-5M4 18v-5h5"/><path d="M6.1 9A7 7 0 0 1 18 6l2 5M18 15a7 7 0 0 1-12 3l-2-5"/>',
    folder: '<path d="M3 6h7l2 2h9v11H3z"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/>',
    wifiOff: '<path d="m2 2 20 20M8.5 8.5A10 10 0 0 1 19 10M5 10a10 10 0 0 0-2 2M8 15a6 6 0 0 1 7.5-.8M12 20h.01"/>',
  };
  return `<svg class="svg-icon ${extraClass}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.info}</svg>`;
}

const esc = (s) => String(s ?? '').replace(/[&<>'"]/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;',
}[c]));
const clean = (v) => String(v ?? '').trim();
const today = () => new Date().toISOString().slice(0, 10);
const trDate = (s) => {
  if (!s) return '';
  const [y, m, d] = String(s).split('-');
  return `${d}.${m}.${y}`;
};
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const stableKey = (v) => clean(v).toLocaleLowerCase('tr-TR')
  .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
  .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
  .replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 160);

function jsonRead(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function jsonWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('records')) db.createObjectStore('records', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function idbGetAll(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store).objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(store, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function saveSettings() {
  await idbPut('settings', { key: 'app', value: state.settings });
}

async function saveSharedCache() {
  await idbPut('settings', {
    key: SHARED_CACHE_SETTING_KEY,
    value: {
      seflikler: state.seflikler,
      membersBySeflik: state.membersBySeflik,
      auth: state.auth,
      updatedAt: new Date().toISOString(),
    },
  });
}

async function loadData() {
  state.records = await idbGetAll('records');
  const rows = await idbGetAll('settings');
  const saved = rows.find((x) => x.key === 'app');
  if (saved) state.settings = { ...DEFAULT_SETTINGS, ...saved.value };
  const shared = rows.find((x) => x.key === SHARED_CACHE_SETTING_KEY)?.value;
  if (shared) {
    state.seflikler = Array.isArray(shared.seflikler) ? shared.seflikler : [];
    state.membersBySeflik = shared.membersBySeflik && typeof shared.membersBySeflik === 'object' ? shared.membersBySeflik : {};
    state.auth = { ...state.auth, ...(shared.auth || {}), status: 'cached' };
  }
  hydrateLocalSharedIdentity();
  if (!state.records.length) {
    for (const record of demoRecords()) await idbPut('records', record);
    state.records = await idbGetAll('records');
  }
  refreshCurrentMembers();
}

function demoRecords() {
  const base = {
    seflik: state.settings.seflik || 'Yaylacık Şefliği',
    ormanci: state.settings.ormanci || 'Mehmet Yılmaz',
    coordinates: '41.3892, 33.7834',
    mevki: 'Çamlık Mevkii',
    description: 'Örnek prototip kaydı',
    barcode: '',
    photos: [],
    createdAt: new Date().toISOString(),
  };
  return [
    { ...base, id: uid(), date: '2026-07-12', bolme: '124', istifNo: 'İ-03', type: 'İbreli Kabuklu Kağıtlık Odun', ster: '45,60', syncStatus: 'demo', photoCount: 4, isDemo: true },
    { ...base, id: uid(), date: '2026-07-12', bolme: '124', istifNo: 'İ-08', type: 'İbreli Lif Yonga Odun', ster: '78,40', syncStatus: 'demo', photoCount: 4, isDemo: true },
    { ...base, id: uid(), date: '2026-07-12', bolme: '124', istifNo: 'İ-09', type: 'İbreli Yakacak Odun', ster: '32,15', syncStatus: 'demo', photoCount: 4, isDemo: true },
    { ...base, id: uid(), date: '2026-07-10', bolme: '125', istifNo: 'İ-02', type: 'İbreli Sırık 4 Boy', ster: '60,00', coordinates: '', syncStatus: 'demo', photoCount: 2, isDemo: true },
  ];
}

function readSharedSession() {
  const primary = jsonRead(SHARED_SESSION_KEY, null);
  if (primary?.access_token) return primary;
  const backup = jsonRead(SHARED_SESSION_BACKUP_KEY, null);
  if (backup?.access_token) {
    jsonWrite(SHARED_SESSION_KEY, backup);
    return backup;
  }
  return null;
}

function storeSharedSession(session) {
  if (!session?.access_token) return null;
  const normalized = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at || (session.expires_in ? Math.floor(Date.now() / 1000) + Number(session.expires_in) : 0),
    user: session.user || readSharedSession()?.user || {},
  };
  jsonWrite(SHARED_SESSION_KEY, normalized);
  jsonWrite(SHARED_SESSION_BACKUP_KEY, { ...normalized, backup_at: Date.now() });
  return normalized;
}

async function ensureSharedSession(forceRefresh = false) {
  let session = readSharedSession();
  if (!session?.access_token) throw new Error('Google ile giriş yapılmamış.');
  const expiresMs = Number(session.expires_at || 0) * 1000;
  if (!forceRefresh && (!expiresMs || expiresMs > Date.now() + 60000)) return session;
  if (navigator.onLine === false && session.access_token) return session;
  if (!session.refresh_token) return session;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    cache: 'no-store',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 400 || response.status === 401) localStorage.removeItem(SHARED_SESSION_KEY);
    throw new Error(body.message || body.msg || 'Google oturumu yenilenemedi.');
  }
  session = storeSharedSession(body);
  return session;
}

function hydrateLocalSharedIdentity() {
  const panel = jsonRead(SHARED_PANEL_KEY, {}) || {};
  const access = jsonRead(SHARED_ACCESS_KEY, {}) || {};
  const active = jsonRead(SHARED_ACTIVE_SEFLIK_KEY, {}) || {};
  const session = readSharedSession();
  const localSeflik = clean(active.seflik || active.name || panel.activeSeflik || access.seflik || access.canonical_seflik || panel.seflik);
  const localKey = clean(active.seflik_key || active.seflikKey || stableKey(localSeflik));
  const localName = clean(panel.googleFullName || access.name || access.canonical_name || panel.name || session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name);
  const avatarUrl = clean(access.avatar_url || panel.googleAvatarUrl || session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture);
  if (session?.access_token) {
    state.auth = {
      ...state.auth,
      status: state.auth.status === 'cached' ? 'cached' : 'local',
      userId: clean(session.user?.id || state.auth.userId),
      email: clean(session.user?.email || state.auth.email),
      name: localName || state.auth.name,
      avatarUrl: avatarUrl || state.auth.avatarUrl,
      error: '',
    };
  } else if (state.auth.status !== 'cached') {
    state.auth.status = 'signed_out';
  }
  if (localSeflik) {
    if (!state.seflikler.some((item) => item.name === localSeflik)) {
      state.seflikler.unshift({ name: localSeflik, key: localKey, role: 'cached' });
    }
    state.settings.seflik = localSeflik;
    state.settings.seflikKey = localKey;
  }
  if (!state.settings.ormanci && localName) state.settings.ormanci = localName;
}

async function edgeCall(action, payload = {}, retried = false) {
  const session = await ensureSharedSession(retried);
  const response = await fetch(EDGE_URL, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, source: 'mesaha-istif-v011', ...payload }),
  });
  const body = await response.json().catch(() => ({}));
  if ((response.status === 401 || response.status === 403) && !retried && readSharedSession()?.refresh_token) {
    return edgeCall(action, payload, true);
  }
  if (!response.ok || body?.ok === false) throw new Error(body.error || body.reason || `Sunucu hatası ${response.status}`);
  return body;
}

function normalizeFolder(raw) {
  const name = clean(raw?.seflik || raw?.name || raw?.folderSeflik || raw?.title);
  if (!name) return null;
  return {
    name,
    key: clean(raw.seflik_key || raw.seflikKey || stableKey(name)),
    role: clean(raw.role || raw.member_role || 'member'),
    isCreator: raw.is_creator === true || raw.isCreator === true,
  };
}

function normalizeMember(raw) {
  const name = clean(raw?.name || raw?.canonical_name || raw?.requested_name);
  if (!name) return null;
  return {
    id: clean(raw.id || raw.user_id || name),
    userId: clean(raw.user_id),
    name,
    email: clean(raw.email),
    avatarUrl: clean(raw.avatar_url),
    role: clean(raw.role || 'member'),
    isSelf: raw.is_self === true,
  };
}

function refreshCurrentMembers() {
  const key = state.settings.seflikKey || stableKey(state.settings.seflik);
  state.ormancilar = Array.isArray(state.membersBySeflik[key]) ? state.membersBySeflik[key] : [];
  if (!state.ormancilar.length && state.auth.name) {
    state.ormancilar = [{ id: state.auth.userId || state.auth.name, name: state.auth.name, avatarUrl: state.auth.avatarUrl, role: 'owner', isSelf: true }];
  }
  if (!state.ormancilar.some((x) => x.name === state.settings.ormanci)) {
    const preferred = state.ormancilar.find((x) => x.role === 'member') || state.ormancilar.find((x) => x.isSelf) || state.ormancilar[0];
    state.settings.ormanci = preferred?.name || state.auth.name || '';
  }
}

async function syncSharedContext({ manual = false } = {}) {
  if (state.sharedSyncing) return;
  if (navigator.onLine === false) {
    state.auth.status = readSharedSession() ? 'cached' : 'signed_out';
    if (manual) toast('İnternet yok. Son şeflik ve ormancı bilgileri kullanılıyor.');
    render();
    return;
  }
  state.sharedSyncing = true;
  state.auth.status = 'syncing';
  render();
  try {
    const session = await ensureSharedSession();
    const accessResponse = await edgeCall('user_access_status');
    const access = accessResponse.access || {};
    if (clean(access.status) !== 'approved') throw new Error('Google hesabının Mesaha İO erişimi onaylı değil.');
    const canonicalSeflik = clean(access.seflik || access.canonical_seflik || state.settings.seflik);
    const foldersResponse = await edgeCall('seflik_folder_list_my_sefliks', {
      seflik: canonicalSeflik,
      folderSeflik: canonicalSeflik,
    });
    const folders = (foldersResponse.folders || []).map(normalizeFolder).filter(Boolean);
    if (!folders.length && canonicalSeflik) folders.push({ name: canonicalSeflik, key: stableKey(canonicalSeflik), role: 'owner' });
    const membersMap = { ...state.membersBySeflik };
    for (const folder of folders) {
      try {
        const memberResponse = await edgeCall('seflik_folder_list_members', {
          seflik: folder.name,
          folderSeflik: folder.name,
          seflikKey: folder.key,
        });
        membersMap[folder.key] = (memberResponse.members || []).map(normalizeMember).filter(Boolean);
      } catch {
        if (!Array.isArray(membersMap[folder.key])) membersMap[folder.key] = [];
      }
    }
    state.seflikler = folders;
    state.membersBySeflik = membersMap;
    const activeLocal = jsonRead(SHARED_ACTIVE_SEFLIK_KEY, {}) || {};
    const activeName = clean(activeLocal.seflik || activeLocal.name || state.settings.seflik || canonicalSeflik);
    const selected = folders.find((x) => x.name === activeName) || folders[0];
    if (selected) {
      state.settings.seflik = selected.name;
      state.settings.seflikKey = selected.key;
    }
    state.auth = {
      status: 'connected',
      userId: clean(access.user_id || session.user?.id),
      email: clean(access.email || session.user?.email),
      name: clean(access.name || access.canonical_name || session.user?.user_metadata?.full_name || state.auth.name),
      avatarUrl: clean(access.avatar_url || session.user?.user_metadata?.avatar_url || session.user?.user_metadata?.picture || state.auth.avatarUrl),
      error: '',
      updatedAt: new Date().toISOString(),
    };
    refreshCurrentMembers();
    await saveSettings();
    await saveSharedCache();
    if (manual) toast('Şeflikler ve ormancılar Mesaha İO ile senkronize edildi.', 'good');
  } catch (error) {
    state.auth.status = readSharedSession() ? 'cached' : 'signed_out';
    state.auth.error = clean(error?.message || error);
    hydrateLocalSharedIdentity();
    refreshCurrentMembers();
    if (manual) toast(`Şeflik senkronu tamamlanamadı: ${state.auth.error}`, 'bad');
  } finally {
    state.sharedSyncing = false;
    render();
  }
}

function logo() {
  return '<img class="brand-logo" src="../assets/icon-192.png" onerror="this.onerror=null;this.src=\'./assets/mesaha-fallback.svg\'" alt="Mesaha İO">';
}

function profileButton() {
  if (state.auth.avatarUrl) {
    return `<button class="profile-btn" data-action="account" aria-label="Hesap"><img src="${esc(state.auth.avatarUrl)}" alt=""></button>`;
  }
  return `<button class="icon-btn" data-action="account" aria-label="Hesap">${icon('user', 23)}</button>`;
}

function head(title, subtitle = '', { back = false, action = '' } = {}) {
  return `<header class="page-head ${back ? 'compact' : ''}">
    ${back ? `<button class="back-btn" data-action="back" aria-label="Geri">${icon('back', 28)}</button>` : logo()}
    <div class="title-wrap"><h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>
    ${action ? `<div class="head-action">${action}</div>` : ''}
  </header>`;
}

function nav(active) {
  const items = [
    ['home', 'home', 'Ana Sayfa'],
    ['records', 'logs', 'İstifler'],
    ['documents', 'doc', 'Evraklar'],
    ['settings', 'gear', 'Ayarlar'],
  ];
  return `<nav class="bottom-nav">${items.map(([view, iconName, label]) => `
    <button class="nav-btn ${active === view ? 'active' : ''}" data-view="${view}">
      <span class="nicon">${icon(iconName, 25)}</span><span>${label}</span>
    </button>`).join('')}</nav>`;
}

function metric(iconName, number, label) {
  return `<div class="metric card"><div class="metric-icon">${icon(iconName, 24)}</div><b>${number}</b><span>${label}</span></div>`;
}

function setView(view) {
  stopCamera();
  state.view = view;
  render();
  scrollTo({ top: 0, behavior: 'smooth' });
}

function render() {
  const views = {
    home: renderHome,
    new: renderNew,
    records: renderRecords,
    documents: renderDocuments,
    templates: renderTemplates,
    settings: renderSettings,
    photos: renderPhotos,
  };
  app.innerHTML = `<main class="view">${(views[state.view] || renderHome)()}</main>${nav(state.view === 'new' ? 'records' : state.view === 'templates' ? 'documents' : state.view)}`;
  bindDynamic();
}

function counts() {
  return {
    records: state.records.length,
    photos: state.records.reduce((sum, row) => sum + (row.photos?.length || row.photoCount || 0), 0),
    pending: state.records.filter((row) => !row.isDemo && row.syncStatus !== 'synced').length,
  };
}

function authSummary() {
  if (state.auth.status === 'connected') return `${state.auth.name || 'Google hesabı'} bağlı • Şeflik Klasörü güncel`;
  if (state.auth.status === 'syncing') return 'Hesap ve Şeflik Klasörü getiriliyor…';
  if (state.auth.status === 'cached' || state.auth.status === 'local') return 'Son şeflik bilgileri cihazdan kullanılıyor';
  return 'Google girişi gerekli';
}

function displaySeflik() {
  return state.settings.seflik || 'Şeflik seçilmedi';
}

function displayOrmanci() {
  return state.settings.ormanci || 'Ormancı seçilmedi';
}

function renderHome() {
  const c = counts();
  return `${head('İstif Alma', '', { action: profileButton() })}
    <section class="sync-banner card">
      <span class="round-icon compact-icon">${icon(state.auth.status === 'signed_out' ? 'wifiOff' : 'sync', 21)}</span>
      <div class="sync-copy"><strong>Offline kullanılabilir</strong><span>${authSummary()} • ${c.pending} kayıt bekliyor</span></div>
      <button class="btn primary small" data-action="sync">Senkronize Et</button>
    </section>
    <section class="metrics">
      ${metric('logs', c.records, 'Toplam İstif')}
      ${metric('calendar', state.records.filter((row) => row.date === today()).length, 'Bugün')}
      ${metric('camera', c.photos, 'Fotoğraf')}
      ${metric('doc', 3, 'Evrak')}
    </section>
    <section class="select-panel card">
      <button class="select-row" data-action="pick-seflik">
        <span class="round-icon">${icon('forest', 23)}</span>
        <span class="row-copy"><small>Şeflik</small><strong>${esc(displaySeflik())}</strong></span>
        <span class="chev">${icon('chevron', 23)}</span>
      </button>
      <button class="select-row" data-action="pick-ormanci">
        <span class="round-icon">${icon('user', 23)}</span>
        <span class="row-copy"><small>Ormancı</small><strong>${esc(displayOrmanci())}</strong></span>
        <span class="chev">${icon('chevron', 23)}</span>
      </button>
    </section>
    <div class="section-title"><h2>İşlemler</h2></div>
    <section class="actions-grid">
      <button class="action-card" data-view="new"><span class="aicon">${icon('plus', 31)}</span><span>Yeni İstif</span></button>
      <button class="action-card" data-view="records"><span class="aicon">${icon('logs', 31)}</span><span>İstifler</span></button>
      <button class="action-card" data-view="documents"><span class="aicon">${icon('doc', 31)}</span><span>Evrak Oluştur</span></button>
      <button class="action-card" data-view="photos"><span class="aicon">${icon('camera', 31)}</span><span>Fotoğraflar</span></button>
    </section>
    <div class="section-title"><h2>Bekleyenler</h2></div>
    <section class="pending-card card">
      <div class="pending-row"><i class="dot"></i>Yerelde kayıtlı<b>${state.records.filter((row) => !row.isDemo && row.syncStatus === 'local').length}</b></div>
      <div class="pending-row"><i class="dot wait"></i>Drive yükleme bekliyor<b>${state.records.reduce((sum, row) => sum + (!row.isDemo && row.syncStatus !== 'synced' ? (row.photos?.length || row.photoCount || 0) : 0), 0)} fotoğraf</b></div>
      <div class="pending-row"><i class="dot bad"></i>Supabase kaydı bekliyor<b>${state.records.filter((row) => !row.isDemo && row.syncStatus !== 'synced').length}</b></div>
    </section>`;
}

function freshDraft() {
  return {
    id: uid(),
    seflik: state.settings.seflik,
    seflikKey: state.settings.seflikKey,
    ormanci: state.settings.ormanci,
    date: today(),
    bolme: '',
    istifNo: '',
    type: 'İbreli Kabuklu Kağıtlık Odun',
    ster: '',
    coordinates: '',
    mevki: '',
    description: '',
    barcode: '',
    photos: [],
    createdAt: new Date().toISOString(),
    syncStatus: 'local',
  };
}

function ensureDraft() {
  if (!state.draft) state.draft = freshDraft();
  return state.draft;
}

function fieldRow(iconName, label, name, value, type = 'text', options = [], { readonly = false } = {}) {
  let control = '';
  if (type === 'select') {
    const safeOptions = options.length ? options : [value || ''];
    control = `<select name="${name}" ${readonly ? 'disabled' : ''}>${safeOptions.map((option) => `<option ${option === value ? 'selected' : ''}>${esc(option)}</option>`).join('')}</select>`;
  } else if (type === 'textarea') {
    control = `<textarea name="${name}" placeholder="İsteğe bağlı" ${readonly ? 'readonly' : ''}>${esc(value)}</textarea>`;
  } else {
    control = `<input name="${name}" value="${esc(value)}" type="${type}" ${readonly ? 'readonly' : ''} ${type === 'number' ? 'inputmode="decimal" step="0.01"' : ''}>`;
  }
  return `<div class="field-row"><span class="field-icon">${icon(iconName, 21)}</span><div class="field-main"><label>${label}</label>${control}</div><span class="chev">${type === 'select' ? icon('chevron', 21) : ''}</span></div>`;
}

function renderNew() {
  const draft = ensureDraft();
  const seflikOptions = state.seflikler.map((item) => item.name);
  const ormanciOptions = state.ormancilar.map((item) => item.name);
  return `${head('Yeni İstif', 'İstif bilgilerini girin', { back: true })}<form id="stackForm">
    <section class="form-card card">
      ${fieldRow('forest', 'Şeflik', 'seflik', draft.seflik, 'select', seflikOptions)}
      ${fieldRow('user', 'Ormancı', 'ormanci', draft.ormanci, 'select', ormanciOptions)}
      ${fieldRow('calendar', 'Tarih', 'date', draft.date, 'date')}
      ${fieldRow('layers', 'Bölme', 'bolme', draft.bolme)}
      ${fieldRow('logs', 'İstif No', 'istifNo', draft.istifNo)}
      ${fieldRow('forest', 'Odun Türü', 'type', draft.type, 'select', ['İbreli Kabuklu Kağıtlık Odun', 'İbreli Lif Yonga Odun', 'İbreli Yakacak Odun', 'İbreli Sırık 2 Boy', 'İbreli Sırık 3 Boy', 'İbreli Sırık 4 Boy', 'İbreli Sırık 5 Boy'])}
      ${fieldRow('cube', 'Ster Sayısı', 'ster', draft.ster, 'number')}
    </section>
    <div class="photo-head"><h2>Koordinat</h2></div>
    <section class="coord-grid card"><input name="coordinates" value="${esc(draft.coordinates)}" placeholder="Enlem, boylam"><button class="btn small" type="button" data-action="geo">${icon('pin', 19)} Mevcut Konumu Ekle</button></section>
    <div class="photo-head"><h2>Resim Ekle</h2><span class="photo-counter">${state.selectedPhotos.length}/4</span></div>
    <section class="photo-grid">${[0, 1, 2, 3].map((index) => photoSlot(index)).join('')}</section>
    <section class="form-card card details-card">
      ${fieldRow('pin', 'Mevki', 'mevki', draft.mevki)}
      ${fieldRow('doc', 'Açıklama', 'description', draft.description, 'textarea')}
      ${fieldRow('barcode', 'Barkod No', 'barcode', draft.barcode)}
    </section>
    <div class="info-note"><b>${icon('info', 21)}</b><span>Uygulama kamerasıyla çekilen fotoğraflar galeride görünmez. Her fotoğraf yaklaşık 1 MB altında saklanır.</span></div>
    <div class="stack-actions"><button class="btn primary wide" type="submit">${icon('save', 21)} Kaydet</button><button class="btn wide" type="button" data-action="save-draft">${icon('doc', 21)} Taslağa Ekle</button></div>
  </form>`;
}

function photoSlot(index) {
  const photo = state.selectedPhotos[index];
  if (photo) {
    const url = URL.createObjectURL(photo.blob);
    return `<div class="photo-slot"><img src="${url}" alt="Fotoğraf ${index + 1}"><button class="remove-photo" type="button" data-remove-photo="${index}" aria-label="Fotoğrafı sil">${icon('trash', 18)}</button></div>`;
  }
  return `<button class="photo-slot addable" type="button" data-add-photo><span class="photo-placeholder"><b>${icon('camera', 27)}</b>Fotoğraf ${index + 1}</span></button>`;
}

function sortedRecords(list = state.records) {
  return [...list].sort((a, b) => {
    const aIndex = TYPE_ORDER.findIndex((type) => a.type.startsWith(type));
    const bIndex = TYPE_ORDER.findIndex((type) => b.type.startsWith(type));
    return (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex) || String(a.istifNo).localeCompare(String(b.istifNo), 'tr');
  });
}

function renderRecords() {
  const bolmes = [...new Set(state.records.map((row) => row.bolme).filter(Boolean))];
  return `${head('İstifler', 'Tarih, bölme ve türe göre filtreleyin', { back: true, action: `<button class="icon-btn" aria-label="Filtre">${icon('filter', 22)}</button>` })}
    <section class="filter-grid">
      <div class="filter-box"><label>Tarih</label><input id="filterDate" type="date" value=""></div>
      <div class="filter-box"><label>Bölme</label><select id="filterBolme"><option value="">Tümü</option>${bolmes.map((value) => `<option>${esc(value)}</option>`).join('')}</select></div>
      <div class="filter-box"><label>Tür</label><select id="filterType"><option value="">Tümü</option>${TYPE_ORDER.map((value) => `<option value="${esc(value)}">${esc(value.replace('İbreli ', ''))}</option>`).join('')}</select></div>
    </section>
    <section id="recordList" class="records">${recordCards(sortedRecords())}</section>`;
}

function recordCards(rows) {
  if (!rows.length) return '<div class="empty card">Filtreye uygun istif bulunamadı.</div>';
  return rows.map((record) => `<article class="record-card card" data-record="${record.id}">
    <span class="round-icon record-log-icon">${icon('logs', 25)}</span>
    <div class="record-info">
      <span>Şeflik</span><b>${esc(String(record.seflik || '').replace(' Şefliği', ''))}</b>
      <span>Bölme</span><b>${esc(record.bolme)}</b>
      <span>İstif</span><b>${esc(record.istifNo)}</b>
      <span>Tür</span><b>${esc(record.type)}</b>
      <span>Ster</span><b>${esc(record.ster)} Ster</b>
      <span>Tarih</span><b>${trDate(record.date)}</b>
    </div>
    <div class="record-status ${record.coordinates ? '' : 'warn'}">
      <div>${icon('pin', 17)}<span>${record.coordinates ? 'Koordinat Var' : 'Koordinat Bekliyor'}</span></div>
      <div>${icon('camera', 17)}<span>${record.photos?.length || record.photoCount || 0} Fotoğraf</span></div>
      <div>${icon('cloud', 17)}<span>${record.isDemo ? 'Örnek Kayıt' : record.syncStatus === 'synced' ? 'Senkronize' : record.syncStatus === 'drive_synced' ? 'Supabase Bekliyor' : record.syncStatus === 'syncing' ? 'Yükleniyor' : 'Yerelde Kayıtlı'}</span></div>
    </div>
  </article>`).join('');
}

function renderDocuments() {
  const bolmes = [...new Set(state.records.map((row) => row.bolme).filter(Boolean))];
  const chosen = sortedRecords(state.records.filter((row) => !state.builderBolme || row.bolme === state.builderBolme));
  return `${head('Evrak Oluştur', 'İstif seçerek evrak hazırlayın', { action: profileButton() })}
    <div class="segment"><button class="${state.documentTab === 'photos' ? 'active' : ''}" data-doc-tab="photos">İstif Fotoğrafları</button><button class="${state.documentTab === 'documents' ? 'active' : ''}" data-doc-tab="documents">Belgeler</button></div>
    <div class="info-note"><b>${icon('info', 21)}</b><span>Aynı bölmedeki ve yakın tarihli istifleri seçin. Sıralama kabuklu, lif, yakacak ve sırık şeklinde otomatik yapılır.</span></div>
    <section class="builder-controls"><div class="select-panel card"><label class="select-row"><span class="round-icon">${icon('layers', 23)}</span><span class="row-copy"><small>Bölme Seç</small><select id="builderBolme" class="embedded-select"><option value="">Tüm Bölmeler</option>${bolmes.map((value) => `<option ${state.builderBolme === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select></span><span class="chev">${icon('chevron', 22)}</span></label></div></section>
    <div class="section-title"><h2>İstifler</h2><span>${state.selectedRecordIds.size} / ${chosen.length} seçildi</span></div>
    <section class="builder-list card">${chosen.map((record) => `<label class="check-row"><input type="checkbox" data-record-check="${record.id}" ${state.selectedRecordIds.has(record.id) ? 'checked' : ''}><span>${icon('logs', 22)}</span><b>${esc(record.istifNo)} • ${esc(record.type)}</b></label>`).join('')}</section>
    <div class="dual-actions"><button class="btn" data-action="select-all">${icon('check', 20)} Tümünü Seç</button><button class="btn" data-action="clear-selection">${icon('trash', 20)} Seçimi Temizle</button></div>
    <div class="dual-actions"><button class="btn" data-action="preview-doc">${icon('eye', 20)} Önizle</button><button class="btn primary" data-action="print-doc">${icon('doc', 20)} PDF Oluştur</button></div>
    <button class="btn wide template-link" data-view="templates">Örnek Şablonları Gör</button>`;
}

function renderTemplates() {
  const sample = sortedRecords(state.records).slice(0, 3);
  return `${head('Evraklar', 'Örnek şablonlar', { back: true, action: profileButton() })}
    <section class="template-card card"><div class="template-title"><span class="round-icon">${icon('pin', 23)}</span><div><h3>Koordinat Evrakı</h3><p>Örnek koordinat tablosu</p></div></div>${miniCoordTable(sample)}</section>
    <section class="template-card card"><div class="template-title"><span class="round-icon">${icon('camera', 23)}</span><div><h3>Fotoğraflı İstif Evrakı</h3><p>Örnek fotoğraf şablonu</p></div></div><div class="template-photo"><div class="mini-collage">${[1, 2, 3, 4].map(() => '<div class="ph"></div>').join('')}</div><div class="meta-list"><div><span>Şeflik</span><b>${esc(displaySeflik())}</b></div><div><span>İstif</span><b>İ-08</b></div><div><span>Tür</span><b>İbreli Kabuklu Kağıtlık Odun</b></div></div></div></section>
    <section class="template-card card"><div class="template-title"><span class="round-icon">${icon('doc', 23)}</span><div><h3>İstif Cins Listesi</h3><p>Örnek istif listesi</p></div></div>${miniTypeTable(sample)}</section>
    <div class="dual-actions"><button class="btn" data-action="preview-doc">${icon('eye', 20)} Önizle</button><button class="btn primary" data-action="print-doc">${icon('doc', 20)} PDF Oluştur</button></div>`;
}

function miniCoordTable(rows) {
  return `<table class="mini-table"><thead><tr><th>İstif No</th><th>Koordinat (Enlem, Boylam)</th></tr></thead><tbody>${rows.map((record) => `<tr><td>${esc(record.istifNo)}</td><td>${esc(record.coordinates || 'Bekleniyor')}</td></tr>`).join('')}</tbody></table>`;
}

function miniTypeTable(rows) {
  return `<table class="mini-table"><thead><tr><th>İstif No</th><th>İstif Cinsi (Tür)</th></tr></thead><tbody>${rows.map((record) => `<tr><td>${esc(record.istifNo)}</td><td>${esc(record.type)}</td></tr>`).join('')}</tbody></table>`;
}

function renderPhotos() {
  const rows = sortedRecords(state.records);
  return `${head('Fotoğraflar', 'İstif fotoğraflarını yönetin', { back: true })}<section class="records">${rows.map((record) => `<article class="photo-record card"><div class="round-icon">${icon('camera', 23)}</div><div><b>${esc(record.istifNo)} • ${esc(record.type)}</b><span>${esc(record.bolme)} Bölme • ${record.photos?.length || record.photoCount || 0}/4 fotoğraf</span></div><button class="btn small" data-view="records">Aç</button></article>`).join('')}</section>`;
}

function renderSettings() {
  const loggedIn = state.auth.status !== 'signed_out';
  return `${head('Ayarlar', 'Hesap ve senkronizasyon', { back: true })}
    <section class="account-card card">
      <div class="account-avatar">${state.auth.avatarUrl ? `<img src="${esc(state.auth.avatarUrl)}" alt="">` : icon('user', 27)}</div>
      <div class="account-copy"><small>${loggedIn ? 'Google hesabı bağlı' : 'Google girişi gerekli'}</small><strong>${esc(state.auth.name || state.auth.email || 'Mesaha İO hesabı')}</strong><span>${esc(state.auth.email || authSummary())}</span></div>
      <span class="status-dot ${state.auth.status === 'connected' ? 'online' : ''}"></span>
    </section>
    <section class="shared-card card">
      <div class="shared-card-title"><span>${icon('folder', 22)}</span><div><b>Şeflik Klasörü Bağlantısı</b><small>Şeflik adları ve ormancılar Mesaha İO’dan alınır.</small></div></div>
      <div class="shared-current"><span>Şeflik</span><b>${esc(displaySeflik())}</b></div>
      <div class="shared-current"><span>Ormancı</span><b>${esc(displayOrmanci())}</b></div>
      <button class="btn wide" data-action="refresh-shared">${icon('refresh', 20)} Şeflikleri ve Ormancıları Güncelle</button>
      ${loggedIn ? '' : '<a class="btn primary wide login-link" href="../">Mesaha İO’da Google ile Giriş Yap</a>'}
    </section>
    <section class="settings-card card">
      <label>Google Drive OAuth Client ID</label><input id="setClientId" value="${esc(state.settings.driveClientId)}" placeholder="...apps.googleusercontent.com">
      <label>Drive klasör ID <small>(boşsa uygulama oluşturur)</small></label><input id="setFolderId" value="${esc(state.settings.driveFolderId)}" placeholder="İsteğe bağlı">
      <p class="settings-hint">Fotoğraflar ücretsiz sunucuya gönderilmez. Drive’a doğrudan yüklenir; kayıt bilgileri aynı Supabase hesabında tutulur.</p>
      <button class="btn primary wide" data-action="save-settings">Ayarları Kaydet</button>
    </section>
    <div class="info-note"><b>${icon('info', 21)}</b><span>Sürüm ${APP_VERSION} • Kayıtlar IndexedDB içinde offline saklanır. Şeflik ve ormancı verisi Mesaha İO ile ortaktır.</span></div>`;
}

function bindDynamic() {
  app.querySelectorAll('[data-view]').forEach((button) => { button.onclick = () => setView(button.dataset.view); });
  app.querySelectorAll('[data-action="back"]').forEach((button) => { button.onclick = () => setView('home'); });
  app.querySelector('[data-action="sync"]')?.addEventListener('click', syncAll);
  app.querySelector('[data-action="geo"]')?.addEventListener('click', getLocation);
  app.querySelector('[data-action="account"]')?.addEventListener('click', showAccountDialog);
  app.querySelector('[data-action="pick-seflik"]')?.addEventListener('click', showSeflikPicker);
  app.querySelector('[data-action="pick-ormanci"]')?.addEventListener('click', showOrmanciPicker);
  app.querySelector('[data-action="refresh-shared"]')?.addEventListener('click', () => syncSharedContext({ manual: true }));
  app.querySelectorAll('[data-add-photo]').forEach((button) => { button.onclick = openCameraChooser; });
  app.querySelectorAll('[data-remove-photo]').forEach((button) => { button.onclick = () => removePhoto(Number(button.dataset.removePhoto)); });
  app.querySelector('#stackForm')?.addEventListener('input', (event) => {
    if (!event.target.name) return;
    const draft = ensureDraft();
    draft[event.target.name] = event.target.value;
    if (event.target.name === 'seflik') {
      const folder = state.seflikler.find((item) => item.name === event.target.value);
      draft.seflikKey = folder?.key || stableKey(event.target.value);
    }
  });
  app.querySelector('#stackForm')?.addEventListener('change', (event) => {
    if (event.target.name === 'seflik') {
      state.settings.seflik = event.target.value;
      state.settings.seflikKey = state.seflikler.find((item) => item.name === event.target.value)?.key || stableKey(event.target.value);
      refreshCurrentMembers();
      ensureDraft().ormanci = state.settings.ormanci;
      render();
    }
  });
  app.querySelector('#stackForm')?.addEventListener('submit', saveRecord);
  app.querySelector('[data-action="save-draft"]')?.addEventListener('click', (event) => saveRecord(event, true));
  ['filterDate', 'filterBolme', 'filterType'].forEach((id) => app.querySelector(`#${id}`)?.addEventListener('change', applyRecordFilters));
  app.querySelectorAll('[data-doc-tab]').forEach((button) => { button.onclick = () => { state.documentTab = button.dataset.docTab; render(); }; });
  app.querySelector('#builderBolme')?.addEventListener('change', (event) => { state.builderBolme = event.target.value; state.selectedRecordIds.clear(); render(); });
  app.querySelectorAll('[data-record-check]').forEach((checkbox) => { checkbox.onchange = () => { checkbox.checked ? state.selectedRecordIds.add(checkbox.dataset.recordCheck) : state.selectedRecordIds.delete(checkbox.dataset.recordCheck); render(); }; });
  app.querySelector('[data-action="select-all"]')?.addEventListener('click', () => { state.records.filter((row) => !state.builderBolme || row.bolme === state.builderBolme).forEach((row) => state.selectedRecordIds.add(row.id)); render(); });
  app.querySelector('[data-action="clear-selection"]')?.addEventListener('click', () => { state.selectedRecordIds.clear(); render(); });
  app.querySelectorAll('[data-action="preview-doc"]').forEach((button) => { button.onclick = previewDocuments; });
  app.querySelectorAll('[data-action="print-doc"]').forEach((button) => { button.onclick = printDocuments; });
  app.querySelector('[data-action="save-settings"]')?.addEventListener('click', saveSettingsUI);
}

function applyRecordFilters() {
  const date = app.querySelector('#filterDate')?.value || '';
  const bolme = app.querySelector('#filterBolme')?.value || '';
  const type = app.querySelector('#filterType')?.value || '';
  const rows = sortedRecords(state.records.filter((record) => (!date || record.date === date) && (!bolme || record.bolme === bolme) && (!type || record.type.startsWith(type))));
  app.querySelector('#recordList').innerHTML = recordCards(rows);
}

async function saveRecord(event, draftOnly = false) {
  event?.preventDefault?.();
  const draft = ensureDraft();
  if (!draft.seflik || !draft.ormanci) {
    toast('Şeflik ve ormancı Mesaha İO Şeflik Klasörü’nden seçilmelidir.', 'bad');
    return;
  }
  if (!draftOnly && (!draft.bolme.trim() || !draft.istifNo.trim() || !draft.ster)) {
    toast('Bölme, istif numarası ve ster sayısı zorunludur.', 'bad');
    return;
  }
  draft.photos = state.selectedPhotos.map((photo) => ({ name: photo.name, type: photo.type, size: photo.size, blob: photo.blob }));
  draft.photoCount = draft.photos.length;
  draft.seflikKey = draft.seflikKey || stableKey(draft.seflik);
  draft.syncStatus = 'local';
  draft.updatedAt = new Date().toISOString();
  const demoRows = state.records.filter((record) => record.isDemo);
  if (demoRows.length && demoRows.length === state.records.length) {
    for (const demo of demoRows) await idbDelete('records', demo.id);
    state.records = [];
  }
  await idbPut('records', structuredClone(draft));
  const index = state.records.findIndex((record) => record.id === draft.id);
  if (index >= 0) state.records[index] = structuredClone(draft);
  else state.records.push(structuredClone(draft));
  toast(draftOnly ? 'Taslak yerelde kaydedildi.' : 'İstif offline olarak kaydedildi.', 'good');
  state.draft = null;
  state.selectedPhotos = [];
  setView('records');
}

function removePhoto(index) {
  state.selectedPhotos.splice(index, 1);
  render();
}

function openCameraChooser() {
  if (state.selectedPhotos.length >= 4) {
    toast('En fazla 4 fotoğraf eklenebilir.', 'bad');
    return;
  }
  openCamera().catch(() => picker.click());
}

async function openCamera() {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Kamera desteklenmiyor');
  stopCamera();
  state.cameraStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: state.facingMode }, width: { ideal: 1600 }, height: { ideal: 1200 } },
    audio: false,
  });
  cameraVideo.srcObject = state.cameraStream;
  cameraModal.hidden = false;
}

function stopCamera() {
  state.cameraStream?.getTracks().forEach((track) => track.stop());
  state.cameraStream = null;
  cameraVideo.srcObject = null;
  cameraModal.hidden = true;
}

async function capturePhoto() {
  if (!cameraVideo.videoWidth) return;
  const canvas = document.createElement('canvas');
  canvas.width = cameraVideo.videoWidth;
  canvas.height = cameraVideo.videoHeight;
  canvas.getContext('2d').drawImage(cameraVideo, 0, 0);
  const blob = await compressCanvas(canvas, MAX_PHOTO_BYTES);
  addPhotoBlob(blob, `istif_${Date.now()}.jpg`);
  stopCamera();
  render();
  toast('Fotoğraf sıkıştırıldı ve uygulamaya eklendi.', 'good');
}

async function compressCanvas(canvas, maxBytes) {
  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(canvas.width, canvas.height));
  let work = document.createElement('canvas');
  work.width = Math.round(canvas.width * scale);
  work.height = Math.round(canvas.height * scale);
  work.getContext('2d', { alpha: false }).drawImage(canvas, 0, 0, work.width, work.height);
  let quality = 0.84;
  let blob;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    blob = await new Promise((resolve) => work.toBlob(resolve, 'image/jpeg', quality));
    if (blob && blob.size <= maxBytes) return blob;
    if (quality > 0.48) quality -= 0.08;
    else {
      const next = document.createElement('canvas');
      next.width = Math.round(work.width * 0.84);
      next.height = Math.round(work.height * 0.84);
      next.getContext('2d', { alpha: false }).drawImage(work, 0, 0, next.width, next.height);
      work = next;
      quality = 0.72;
    }
  }
  return blob;
}

async function compressFile(file) {
  const image = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext('2d').drawImage(image, 0, 0);
  image.close?.();
  return compressCanvas(canvas, MAX_PHOTO_BYTES);
}

function addPhotoBlob(blob, name) {
  if (state.selectedPhotos.length >= 4) return;
  state.selectedPhotos.push({ blob, name, type: 'image/jpeg', size: blob.size });
}

async function pickerChanged() {
  for (const file of [...picker.files]) {
    if (state.selectedPhotos.length >= 4) break;
    try {
      const blob = await compressFile(file);
      addPhotoBlob(blob, file.name.replace(/\.[^.]+$/, '.jpg'));
    } catch {
      toast('Fotoğraf işlenemedi.', 'bad');
    }
  }
  picker.value = '';
  render();
}

function getLocation() {
  if (!navigator.geolocation) {
    toast('Konum özelliği desteklenmiyor.', 'bad');
    return;
  }
  toast('Mevcut koordinat alınıyor...');
  navigator.geolocation.getCurrentPosition((position) => {
    ensureDraft().coordinates = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
    render();
    toast(`Koordinat eklendi • ±${Math.round(position.coords.accuracy)} m`, 'good');
  }, () => toast('Konum alınamadı. GPS ve izinleri kontrol edin.', 'bad'), {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 30000,
  });
}

function toast(message, type = '') {
  document.querySelector('.toast')?.remove();
  const element = document.createElement('div');
  element.className = `toast ${type}`;
  element.textContent = message;
  document.body.appendChild(element);
  setTimeout(() => element.remove(), 3100);
}

function showDialog(html) {
  dialogContent.innerHTML = html;
  dialogModal.hidden = false;
}

function closeDialog() {
  dialogModal.hidden = true;
  dialogContent.innerHTML = '';
}

function showAccountDialog() {
  const signedIn = state.auth.status !== 'signed_out';
  showDialog(`<div class="dialog-profile"><div class="account-avatar large">${state.auth.avatarUrl ? `<img src="${esc(state.auth.avatarUrl)}" alt="">` : icon('user', 30)}</div><h3>${esc(state.auth.name || 'Mesaha İO Hesabı')}</h3><p>${esc(state.auth.email || authSummary())}</p></div><div class="dialog-actions"><button class="btn" data-dialog-close>Kapat</button>${signedIn ? '<button class="btn primary" id="dialogSharedRefresh">Bilgileri Güncelle</button>' : '<a class="btn primary" href="../">Google ile Giriş Yap</a>'}</div>`);
  document.getElementById('dialogSharedRefresh')?.addEventListener('click', () => { closeDialog(); syncSharedContext({ manual: true }); });
}

function showSeflikPicker() {
  if (!state.seflikler.length) {
    showDialog(`<h3>Şeflik bulunamadı</h3><p>Mesaha İO’da Google hesabıyla giriş yapıp Şeflik Klasörü oluşturun veya üye olduğunuz şefliği senkronize edin.</p><div class="dialog-actions"><button class="btn" data-dialog-close>Kapat</button><button class="btn primary" id="refreshFoldersDialog">Güncelle</button></div>`);
    document.getElementById('refreshFoldersDialog').onclick = () => { closeDialog(); syncSharedContext({ manual: true }); };
    return;
  }
  showDialog(`<h3>Şeflik Seç</h3><p>Mesaha İO Şeflik Klasörü ile ortak liste.</p><div class="picker-list">${state.seflikler.map((folder, index) => `<button class="picker-row ${folder.name === state.settings.seflik ? 'selected' : ''}" data-folder-index="${index}"><span class="picker-icon">${icon('forest', 21)}</span><span><b>${esc(folder.name)}</b><small>${folder.role === 'owner' ? 'Kurucu' : 'Üye'}</small></span>${folder.name === state.settings.seflik ? icon('check', 21) : icon('chevron', 20)}</button>`).join('')}</div><div class="dialog-actions single"><button class="btn" data-dialog-close>Kapat</button></div>`);
  dialogContent.querySelectorAll('[data-folder-index]').forEach((button) => {
    button.onclick = async () => {
      const folder = state.seflikler[Number(button.dataset.folderIndex)];
      state.settings.seflik = folder.name;
      state.settings.seflikKey = folder.key;
      refreshCurrentMembers();
      if (state.draft) {
        state.draft.seflik = folder.name;
        state.draft.seflikKey = folder.key;
        state.draft.ormanci = state.settings.ormanci;
      }
      jsonWrite(SHARED_ACTIVE_SEFLIK_KEY, { seflik: folder.name, seflik_key: folder.key, updatedAt: new Date().toISOString() });
      await saveSettings();
      closeDialog();
      render();
    };
  });
}

function showOrmanciPicker() {
  refreshCurrentMembers();
  if (!state.ormancilar.length) {
    showDialog(`<h3>Ormancı bulunamadı</h3><p>Bu şefliğe eklenen ormancılar Mesaha İO Şeflik Klasörü’nden otomatik gelir.</p><div class="dialog-actions"><button class="btn" data-dialog-close>Kapat</button><button class="btn primary" id="refreshMembersDialog">Güncelle</button></div>`);
    document.getElementById('refreshMembersDialog').onclick = () => { closeDialog(); syncSharedContext({ manual: true }); };
    return;
  }
  showDialog(`<h3>Ormancı Seç</h3><p>${esc(displaySeflik())} ormancıları.</p><div class="picker-list">${state.ormancilar.map((member, index) => `<button class="picker-row ${member.name === state.settings.ormanci ? 'selected' : ''}" data-member-index="${index}"><span class="picker-avatar">${member.avatarUrl ? `<img src="${esc(member.avatarUrl)}" alt="">` : icon('user', 20)}</span><span><b>${esc(member.name)}</b><small>${member.role === 'owner' ? 'Şeflik kurucusu' : 'Ormancı'}</small></span>${member.name === state.settings.ormanci ? icon('check', 21) : icon('chevron', 20)}</button>`).join('')}</div><div class="dialog-actions single"><button class="btn" data-dialog-close>Kapat</button></div>`);
  dialogContent.querySelectorAll('[data-member-index]').forEach((button) => {
    button.onclick = async () => {
      const member = state.ormancilar[Number(button.dataset.memberIndex)];
      state.settings.ormanci = member.name;
      if (state.draft) state.draft.ormanci = member.name;
      await saveSettings();
      closeDialog();
      render();
    };
  });
}

async function saveSettingsUI() {
  state.settings = {
    ...state.settings,
    driveClientId: document.getElementById('setClientId').value.trim(),
    driveFolderId: document.getElementById('setFolderId').value.trim(),
  };
  await saveSettings();
  toast('Ayarlar kaydedildi.', 'good');
  setView('home');
}

async function loadGoogleIdentity() {
  if (window.google?.accounts?.oauth2) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function getDriveToken() {
  await loadGoogleIdentity();
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: state.settings.driveClientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response) => response.error ? reject(new Error(response.error)) : resolve(response.access_token),
      error_callback: reject,
    });
    client.requestAccessToken({ prompt: '' });
  });
}

async function driveJson(url, token, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Drive ${response.status}`);
  return response.json();
}

async function ensureRootFolder(token) {
  if (state.settings.driveFolderId) return state.settings.driveFolderId;
  if (state.settings.driveCreatedFolderId) return state.settings.driveCreatedFolderId;
  const folder = await driveJson('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', token, {
    name: 'Mesaha IO - İstif Alma',
    mimeType: 'application/vnd.google-apps.folder',
  });
  state.settings.driveCreatedFolderId = folder.id;
  await saveSettings();
  return folder.id;
}

async function createFolder(token, name, parent) {
  const folder = await driveJson('https://www.googleapis.com/drive/v3/files?fields=id,name', token, {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parent ? [parent] : undefined,
  });
  return folder.id;
}

async function uploadBlob(token, blob, name, parentId) {
  const meta = { name, parents: [parentId] };
  const boundary = `mesaha_${Math.random().toString(36).slice(2)}`;
  const headPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${blob.type || 'image/jpeg'}\r\n\r\n`;
  const tailPart = `\r\n--${boundary}--`;
  const body = new Blob([headPart, blob, tailPart], { type: `multipart/related; boundary=${boundary}` });
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!response.ok) throw new Error(`Fotoğraf yükleme ${response.status}`);
  return response.json();
}

async function supabaseUpsertRecord(record) {
  const session = await ensureSharedSession();
  const body = {
    id: String(record.id),
    user_id: String(session.user?.id || state.auth.userId),
    seflik_key: record.seflikKey || stableKey(record.seflik),
    seflik: record.seflik,
    ormanci: record.ormanci,
    record_date: record.date,
    bolme_no: record.bolme,
    istif_no: record.istifNo,
    wood_type: record.type,
    ster: Number(String(record.ster || 0).replace(',', '.')) || 0,
    coordinates: record.coordinates || null,
    mevki: record.mevki || null,
    description: record.description || null,
    barcode_no: record.barcode || null,
    photo_count: record.photos?.length || record.photoCount || 0,
    drive_folder_id: record.driveFolderId || null,
    drive_files: record.driveFiles || [],
    sync_status: 'synced',
    created_at: record.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (!body.user_id) throw new Error('Google kullanıcı kimliği bulunamadı.');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/mesaha_istif_records?on_conflict=id`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.hint || `Supabase kayıt hatası ${response.status}`);
  }
}

async function syncAll() {
  if (state.syncing) return;
  const pending = state.records.filter((record) => !record.isDemo && record.syncStatus !== 'synced');
  if (!pending.length) {
    toast('Tüm kayıtlar senkronize.', 'good');
    return;
  }
  if (!navigator.onLine) {
    toast('İnternet yok. Kayıtlar cihazda güvende.', 'bad');
    return;
  }
  try {
    await ensureSharedSession();
  } catch {
    showDialog('<h3>Google girişi gerekli</h3><p>İstif kayıtlarının aynı Supabase hesabına yüklenebilmesi için Mesaha İO’da Google ile giriş yapın.</p><div class="dialog-actions"><button class="btn" data-dialog-close>Kapat</button><a class="btn primary" href="../">Giriş Yap</a></div>');
    return;
  }
  if (!state.settings.driveClientId && pending.some((record) => (record.photos || []).length)) {
    showDialog('<h3>Drive bağlantısı gerekli</h3><p>Fotoğrafları doğrudan Drive’a yüklemek için Ayarlar bölümüne Google OAuth Client ID girilmelidir. Kayıtlar cihazdan silinmez.</p><div class="dialog-actions"><button class="btn" data-dialog-close>Kapat</button><button class="btn primary" id="goSettings">Ayarlara Git</button></div>');
    document.getElementById('goSettings').onclick = () => { closeDialog(); setView('settings'); };
    return;
  }
  state.syncing = true;
  showDialog('<h3>Senkronizasyon</h3><p id="syncText">Google hesabı ve Drive bağlantısı hazırlanıyor…</p><div class="progress"><span id="syncBar"></span></div><div class="dialog-actions"><button class="btn" disabled>İptal</button><button class="btn primary" disabled>Devam Ediyor</button></div>');
  try {
    const recordsWithPhotos = pending.filter((record) => (record.photos || []).length);
    const driveToken = recordsWithPhotos.length ? await getDriveToken() : '';
    const rootFolder = driveToken ? await ensureRootFolder(driveToken) : '';
    let completed = 0;
    for (const record of pending) {
      record.syncStatus = 'syncing';
      await idbPut('records', record);
      if ((record.photos || []).length && !record.driveFolderId) {
        const folder = await createFolder(driveToken, `${record.date}_${record.bolme}_${record.istifNo}`, rootFolder);
        record.driveFiles = [];
        for (let index = 0; index < record.photos.length; index += 1) {
          const photo = record.photos[index];
          const uploaded = await uploadBlob(driveToken, photo.blob, `${record.istifNo}_foto_${index + 1}.jpg`, folder);
          record.driveFiles.push(uploaded);
        }
        record.driveFolderId = folder;
      }
      record.syncStatus = 'drive_synced';
      await idbPut('records', record);
      try {
        await supabaseUpsertRecord(record);
        record.syncStatus = 'synced';
      } catch (error) {
        record.syncStatus = 'drive_synced';
        await idbPut('records', record);
        throw error;
      }
      await idbPut('records', record);
      completed += 1;
      document.getElementById('syncText').textContent = `${record.istifNo} tamamlandı • ${completed}/${pending.length}`;
      document.getElementById('syncBar').style.width = `${(completed / pending.length) * 100}%`;
    }
    state.records = await idbGetAll('records');
    document.getElementById('syncText').textContent = 'Fotoğraflar Drive’a, kayıt bilgileri Supabase’e yüklendi.';
    document.getElementById('syncBar').style.width = '100%';
    setTimeout(() => { closeDialog(); render(); toast('Senkronizasyon tamamlandı.', 'good'); }, 1100);
  } catch (error) {
    document.getElementById('syncText').textContent = `Bağlantı başarısız: ${clean(error?.message || error)}. Yerel kayıtlar silinmedi.`;
    toast('Senkronizasyon tamamlanamadı.', 'bad');
  } finally {
    state.syncing = false;
  }
}

function selectedForDocs() {
  let rows = state.records.filter((record) => state.selectedRecordIds.has(record.id));
  if (!rows.length) rows = sortedRecords(state.records).slice(0, 4);
  return sortedRecords(rows);
}

async function photoDataUrl(photo) {
  if (!photo?.blob) return '';
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(photo.blob);
  });
}

async function buildPrintHtml() {
  const rows = selectedForDocs();
  let html = '';
  if (state.documentTab === 'documents') {
    html += `<div class="print-page"><h1>İSTİF KOORDİNAT LİSTESİ</h1><h2>Bölme: ${esc(rows[0]?.bolme || '')}</h2><table class="print-table"><thead><tr><th>Sıra</th><th>İstif No</th><th>İstif Cinsi</th><th>Ster</th><th>Koordinat</th></tr></thead><tbody>${rows.map((record, index) => `<tr><td>${index + 1}</td><td>${esc(record.istifNo)}</td><td>${esc(record.type)}</td><td>${esc(record.ster)}</td><td>${esc(record.coordinates || 'Bekleniyor')}</td></tr>`).join('')}</tbody></table><div class="print-footer">İstif Alma • Örnek şablon</div></div>`;
    html += `<div class="print-page"><h1>İSTİF CİNS LİSTESİ</h1><h2>Bölme: ${esc(rows[0]?.bolme || '')}</h2><table class="print-table"><thead><tr><th>Sıra</th><th>İstif No</th><th>Cinsi</th><th>Ster</th><th>Mevki</th><th>Barkod</th></tr></thead><tbody>${rows.map((record, index) => `<tr><td>${index + 1}</td><td>${esc(record.istifNo)}</td><td>${esc(record.type)}</td><td>${esc(record.ster)}</td><td>${esc(record.mevki || '')}</td><td>${esc(record.barcode || '')}</td></tr>`).join('')}</tbody></table><div class="print-footer">İstif Alma • Örnek şablon</div></div>`;
  }
  if (state.documentTab === 'photos') {
    for (const record of rows) {
      const urls = await Promise.all((record.photos || []).slice(0, 4).map(photoDataUrl));
      html += `<div class="print-page"><h1>FOTOĞRAFLI İSTİF EVRAKI</h1><div class="print-meta"><b>Şeflik</b><span>${esc(record.seflik)}</span><b>Bölme</b><span>${esc(record.bolme)}</span><b>İstif</b><span>${esc(record.istifNo)}</span><b>Tür</b><span>${esc(record.type)}</span><b>Ster</b><span>${esc(record.ster)}</span><b>Koordinat</b><span>${esc(record.coordinates || 'Bekleniyor')}</span></div><div class="print-collage">${[0, 1, 2, 3].map((index) => urls[index] ? `<img src="${urls[index]}">` : `<div class="print-placeholder">Fotoğraf ${index + 1}</div>`).join('')}</div><div class="print-footer">İstif Alma • Örnek şablon</div></div>`;
    }
  }
  return html;
}

async function previewDocuments() {
  const rows = selectedForDocs();
  showDialog(`<h3>${state.documentTab === 'photos' ? 'İstif Fotoğrafları' : 'Belgeler'} Önizleme</h3><p>${rows.length} istif seçildi. Sıralama: kabuklu kağıtlık → lif yonga → yakacak → sırık.</p><div class="builder-list card">${rows.map((record) => `<div class="check-row"><span>${icon('logs', 22)}</span><b>${esc(record.istifNo)} • ${esc(record.type)}</b></div>`).join('')}</div><div class="dialog-actions"><button class="btn" data-dialog-close>Kapat</button><button class="btn primary" id="dialogPrint">PDF / Yazdır</button></div>`);
  document.getElementById('dialogPrint').onclick = () => { closeDialog(); printDocuments(); };
}

async function printDocuments() {
  const area = document.getElementById('printArea');
  area.innerHTML = await buildPrintHtml();
  area.setAttribute('aria-hidden', 'false');
  setTimeout(() => window.print(), 100);
}

document.querySelectorAll('[data-close-camera]').forEach((element) => { element.onclick = stopCamera; });
document.querySelectorAll('[data-dialog-close]').forEach((element) => { element.onclick = closeDialog; });
dialogModal.addEventListener('click', (event) => { if (event.target.matches('[data-dialog-close]')) closeDialog(); });
document.getElementById('captureBtn').onclick = capturePhoto;
document.getElementById('pickGalleryBtn').onclick = () => { stopCamera(); picker.click(); };
document.getElementById('switchCameraBtn').onclick = async () => {
  state.facingMode = state.facingMode === 'environment' ? 'user' : 'environment';
  try { await openCamera(); } catch { toast('Kamera değiştirilemedi.', 'bad'); }
};
picker.addEventListener('change', pickerChanged);
window.addEventListener('online', () => { toast('İnternet bağlantısı geldi.', 'good'); syncSharedContext(); });
window.addEventListener('offline', () => { state.auth.status = readSharedSession() ? 'cached' : 'signed_out'; render(); toast('Offline mod: kayıtlar cihazda tutuluyor.'); });
window.addEventListener('storage', (event) => {
  if ([SHARED_SESSION_KEY, SHARED_PANEL_KEY, SHARED_ACCESS_KEY, SHARED_ACTIVE_SEFLIK_KEY].includes(event.key)) {
    hydrateLocalSharedIdentity();
    refreshCurrentMembers();
    render();
    if (navigator.onLine) syncSharedContext();
  }
});
window.addEventListener('afterprint', () => { document.getElementById('printArea').innerHTML = ''; });

(async function init() {
  try {
    await loadData();
    render();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    if (navigator.onLine) syncSharedContext();
  } catch (error) {
    app.innerHTML = `<div class="empty"><h2>Uygulama açılamadı</h2><p>${esc(error.message)}</p></div>`;
  }
}());
