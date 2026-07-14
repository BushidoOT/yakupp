"use strict";

const APP_VERSION = "0.3.4-suite-v21";
const MAX_PHOTO_BYTES = 1024 * 1024;
const DB_NAME = "mesaha-istif-prototype";
const DB_VERSION = 1;
const TYPE_ORDER = [
  "İbreli Kabuklu Kağıtlık Odun",
  "İbreli Lif Yonga Odun",
  "İbreli Yakacak Odun",
  "İbreli Sırık",
];

const SUPABASE_URL = "https://swrbpdpotmirnmtqnuba.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_G_ZFeUouDxg57Nne5pflfQ_cVGpdMbR";
const EDGE_URL = `${SUPABASE_URL}/functions/v1/smooth-function`;
const DRIVE_BRIDGE_URL = `${SUPABASE_URL}/functions/v1/istif-drive`;
const DRIVE_REDIRECT_URI = new URL("./", location.href).href;
const SHARED_SESSION_KEY = "mesaha_supabase_v500_session";
const SHARED_SESSION_BACKUP_KEY = "mesaha_supabase_v569_session_backup";
const SHARED_PANEL_KEY = "mesaha_panel_user_v316";
const SHARED_ACCESS_KEY = "mesaha_google_access_v548";
const SHARED_ACTIVE_SEFLIK_KEY = "mesaha_active_seflik_folder_v564";
const SHARED_TERMINAL_KEY = "mesaha_terminal_local_mode_v556";
const SHARED_TERMINAL_OLD_KEY = "mesaha_terminal_local_mode_v557";
const SHARED_CACHE_SETTING_KEY = "shared-context-v034";
const SHARED_SUITE_DIVISIONS_KEY = "mesaha_suite_divisions_v4";
const SHARED_SUITE_DIVISION_READY_KEY = "mesaha_suite_division_ready_v4";
const LAST_BOLME_KEY_PREFIX = "mesaha_istif_last_bolme_v14::";
function readSuiteJson(key, fallback = {}) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
function suiteStableKey(value) {
  return clean(value)
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function currentSuiteDivisions() {
  const map = readSuiteJson(SHARED_SUITE_DIVISIONS_KEY, {});
  const ready = readSuiteJson(SHARED_SUITE_DIVISION_READY_KEY, {});
  const key =
    state?.settings?.seflikKey || suiteStableKey(state?.settings?.seflik || "");
  const aliases = [key, suiteStableKey(state?.settings?.seflik || "")].filter(
    Boolean,
  );
  let list = [];
  for (const alias of aliases)
    if (Array.isArray(map[alias])) {
      list = map[alias];
      break;
    }
  return list
    .map((d) => {
      const no = clean(d.bolme_no || d.bolmeNo || d.bolme);
      const k = clean(d.seflik_key || key);
      return {
        ...d,
        bolme_no: no,
        bolmeNo: no,
        offline_ready: !!(d.offline_ready || ready[`${k}::${no}`]),
      };
    })
    .filter((d) => d.bolme_no && !d.deleted);
}
function currentSuiteReadyBolmeler() {
  return currentSuiteDivisions()
    .filter((d) => d.offline_ready)
    .map((d) => d.bolme_no)
    .sort((a, b) => a.localeCompare(b, "tr", { numeric: true }));
}

const DEFAULT_SETTINGS = {
  seflik: "",
  seflikKey: "",
  ormanci: "",
  bolgeMudurlugu: "",
  isletmeMudurlugu: "",
  satisIstifYeri: "",
  setupComplete: false,
  driveClientId: "", // eski sürüm uyumluluğu; arayüzde kullanılmaz
  driveFolderId: "", // eski sürüm uyumluluğu
  driveCreatedFolderId: "", // eski sürüm uyumluluğu
  photoMaxBytes: MAX_PHOTO_BYTES,
};
const GENERIC_SETTINGS_MIGRATION_KEY = "mesaha-istif-generic-settings-v034";

const CONFIRM_SOUND_SRC = "../assets/mesaha_onay.wav";
let confirmSoundAudio = null;
let confirmSoundUnlocked = false;
let confirmSoundLastAt = 0;

function ensureConfirmSound() {
  if (confirmSoundAudio) return confirmSoundAudio;
  try {
    confirmSoundAudio = new Audio(CONFIRM_SOUND_SRC);
    confirmSoundAudio.preload = "auto";
    confirmSoundAudio.volume = 1;
    try {
      confirmSoundAudio.load();
    } catch {}
  } catch {
    confirmSoundAudio = null;
  }
  return confirmSoundAudio;
}

function warmConfirmSound(event) {
  if (event && event.isTrusted === false) return;
  if (confirmSoundUnlocked) return;
  const audio = ensureConfirmSound();
  if (!audio) return;
  confirmSoundUnlocked = true;
  try {
    audio.muted = true;
    const p = audio.play();
    if (p && typeof p.then === "function") {
      p.then(() => {
        try {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
        } catch {}
      }).catch(() => {
        try {
          audio.muted = false;
        } catch {}
      });
    } else {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      } catch {}
    }
  } catch {
    try {
      audio.muted = false;
    } catch {}
  }
}

function shouldPlayConfirmSound(message, type) {
  if (type === "good" || type === "success") return true;
  const text = clean(message).toLocaleLowerCase("tr-TR");
  return /kaydedildi|eklendi|tamamlandı|tamamlandi|senkronize|güncellendi|guncellendi|bağlandı|baglandi|alındı|alindi|yüklendi|yuklendi|işaretlendi|isaretlendi|geri alındı|geri alindi|seçili|secili/.test(
    text,
  );
}

function playConfirmSound(force = false) {
  const now = Date.now();
  if (!force && now - confirmSoundLastAt < 220) return;
  confirmSoundLastAt = now;
  const audio = ensureConfirmSound();
  if (!audio) return;
  try {
    audio.muted = false;
    audio.volume = 1;
    audio.pause();
    audio.currentTime = 0;
    const p = audio.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch {}
}

["touchstart", "pointerdown", "mousedown", "keydown", "click"].forEach(
  (evt) => {
    try {
      document.addEventListener(evt, warmConfirmSound, {
        capture: true,
        passive: true,
      });
    } catch {}
  },
);

const state = {
  view: "home",
  records: [],
  settings: { ...DEFAULT_SETTINGS },
  draft: null,
  selectedPhotos: [],
  selectedRecordIds: new Set(),
  documentTab: "documents",
  builderBolme: "",
  cameraStream: null,
  facingMode: "environment",
  syncing: false,
  sharedSyncing: false,
  savingRecord: false,
  seflikler: [],
  ormancilar: [],
  membersBySeflik: {},
  customForestersBySeflik: {},
  removedForestersBySeflik: {},
  foresterSearchSeq: 0,
  remotePhotoCache: {},
  remotePhotoLoading: new Set(),
  drive: {
    status: "idle",
    connected: false,
    isOwner: false,
    ownerEmail: "",
    ownerName: "",
    folderId: "",
    folderName: "",
    folderUrl: "",
    updatedAt: "",
    error: "",
  },
  auth: {
    status: "checking",
    userId: "",
    email: "",
    name: "",
    avatarUrl: "",
    error: "",
    updatedAt: "",
  },
};

const app = document.getElementById("app");
const picker = document.getElementById("photoPicker");
const cameraModal = document.getElementById("cameraModal");
const cameraVideo = document.getElementById("cameraVideo");
const dialogModal = document.getElementById("dialogModal");
const dialogContent = document.getElementById("dialogContent");
const bootOverlay = document.getElementById("bootOverlay");
const bootTitle = document.getElementById("bootTitle");
const bootText = document.getElementById("bootText");
let dbPromise = null;

function icon(name, size = 24, extraClass = "") {
  const paths = {
    home: '<path d="M3 10.8 12 3l9 7.8"/><path d="M5 9.8V21h14V9.8"/><path d="M9 21v-7h6v7"/>',
    logs: '<circle cx="7" cy="8" r="3"/><circle cx="7" cy="8" r="1"/><circle cx="7" cy="16" r="3"/><circle cx="7" cy="16" r="1"/><path d="M10 5h7a3 3 0 0 1 0 6h-7M10 13h7a3 3 0 0 1 0 6h-7"/>',
    doc: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.06.06-2.12 2.12-.06-.06a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1.1 1.65V21h-3v-.59a1.8 1.8 0 0 0-1.1-1.65 1.8 1.8 0 0 0-2 .36l-.06.06-2.12-2.12.06-.06a1.8 1.8 0 0 0 .36-2A1.8 1.8 0 0 0 5 13.9H4v-3h1a1.8 1.8 0 0 0 1.65-1.1 1.8 1.8 0 0 0-.36-2l-.06-.06L8.35 5.6l.06.06a1.8 1.8 0 0 0 2 .36A1.8 1.8 0 0 0 11.5 4.4V3h3v1.4a1.8 1.8 0 0 0 1.1 1.65 1.8 1.8 0 0 0 2-.36l.06-.06 2.12 2.12-.06.06a1.8 1.8 0 0 0-.36 2A1.8 1.8 0 0 0 21 10.9h1v3h-1a1.8 1.8 0 0 0-1.6 1.1Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    camera:
      '<path d="M4 7h3l1.4-2h7.2L17 7h3v12H4z"/><circle cx="12" cy="13" r="4"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    forest:
      '<path d="m8 3-4 6h3l-4 6h5v6M16 3l4 6h-3l4 6h-5v6M12 7l-3 5h2l-3 5h8l-3-5h2z"/>',
    pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    cube: '<path d="m12 2 9 5-9 5-9-5zM3 7v10l9 5 9-5V7M12 12v10"/>',
    barcode: '<path d="M4 5v14M7 5v14M10 5v14M14 5v14M17 5v14M20 5v14"/>',
    cloud:
      '<path d="M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.3 8.2 4.5 4.5 0 0 0 7 18Z"/>',
    filter: '<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',
    sync: '<path d="M20 7h-5V2M4 17h5v5"/><path d="M18.2 11A7 7 0 0 0 6.6 5.6L4 8M5.8 13A7 7 0 0 0 17.4 18.4L20 16"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    share:
      '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    save: '<path d="M5 3h12l2 2v16H5zM8 3v6h8V3M8 21v-8h8v8"/>',
    refresh:
      '<path d="M20 6v5h-5M4 18v-5h5"/><path d="M6.1 9A7 7 0 0 1 18 6l2 5M18 15a7 7 0 0 1-12 3l-2-5"/>',
    folder: '<path d="M3 6h7l2 2h9v11H3z"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/>',
    users:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    drive:
      '<path d="M7.7 3h8.6l4.3 7.5-4.3 7.5H7.7L3.4 10.5z"/><path d="m7.7 3 4.3 7.5h8.6M3.4 10.5H12L7.7 18"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15"/><path d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.15-1.15"/>',
    userPlus:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M16 11h6"/>',
    external:
      '<path d="M14 3h7v7M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5"/>',
    wifiOff:
      '<path d="m2 2 20 20M8.5 8.5A10 10 0 0 1 19 10M5 10a10 10 0 0 0-2 2M8 15a6 6 0 0 1 7.5-.8M12 20h.01"/>',
  };
  return `<svg class="svg-icon ${extraClass}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.info}</svg>`;
}

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>'"]/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#039;",
        '"': "&quot;",
      })[c],
  );
const clean = (v) => String(v ?? "").trim();
const today = () => new Date().toISOString().slice(0, 10);
const trDate = (s) => {
  if (!s) return "";
  const [y, m, d] = String(s).split("-");
  return `${d}.${m}.${y}`;
};
const uid = () =>
  crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const stableKey = (v) =>
  clean(v)
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 160);
const sameSeflikLabel = (a, b) =>
  stableKey(clean(a).replace(/\s*(Şefliği|Sefliği|Şeflik|Seflik)\s*$/i, "")) ===
  stableKey(clean(b).replace(/\s*(Şefliği|Sefliği|Şeflik|Seflik)\s*$/i, ""));
const recordBolme = (record) =>
  clean(record?.bolme || record?.bolmeNo || record?.bolme_no);

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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function suiteSyncApi() {
  return (
    window.MesahaSuiteSyncV14 ||
    window.MesahaSuiteSyncV13 ||
    window.MesahaSuiteSyncV12 ||
    window.MesahaSuiteSyncV11 ||
    window.MesahaSuiteSyncV10 ||
    window.MesahaSuiteSyncV9 ||
    window.MesahaSuiteSyncV8 ||
    null
  );
}

function showBoot(
  title = "Yükleniyor…",
  text = "Şeflik, istifler ve offline kayıtlar hazırlanıyor.",
) {
  if (!bootOverlay) return;
  if (bootTitle) bootTitle.textContent = title;
  if (bootText) bootText.textContent = text;
  bootOverlay.hidden = false;
  bootOverlay.classList.add("show");
}

function hideBoot() {
  if (!bootOverlay) return;
  bootOverlay.classList.remove("show");
  setTimeout(() => {
    bootOverlay.hidden = true;
  }, 180);
}

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("records"))
        db.createObjectStore("records", { keyPath: "id" });
      if (!db.objectStoreNames.contains("settings"))
        db.createObjectStore("settings", { keyPath: "key" });
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
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = () => {
      if (store === "records" && !(value && value.isDemo)) {
        try {
          window.dispatchEvent(
            new CustomEvent("mesaha-istif:changed", {
              detail: { type: "put", id: value && value.id },
            }),
          );
          suiteSyncApi()?.markDirty("istif", {
              id: value && value.id,
            });
        } catch {}
      }
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => {
      if (store === "records") {
        try {
          window.dispatchEvent(
            new CustomEvent("mesaha-istif:changed", {
              detail: { type: "delete", id: key },
            }),
          );
          suiteSyncApi()?.markDirty("istif", { id: key });
        } catch {}
      }
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

async function saveSettings() {
  await idbPut("settings", { key: "app", value: state.settings });
}

async function saveSharedCache() {
  await idbPut("settings", {
    key: SHARED_CACHE_SETTING_KEY,
    value: {
      seflikler: state.seflikler,
      membersBySeflik: state.membersBySeflik,
      customForestersBySeflik: state.customForestersBySeflik,
      removedForestersBySeflik: state.removedForestersBySeflik,
      drive: state.drive,
      auth: state.auth,
      updatedAt: new Date().toISOString(),
    },
  });
}

async function loadData() {
  state.records = await idbGetAll("records");
  const rows = await idbGetAll("settings");
  const saved = rows.find((x) => x.key === "app");
  if (saved) state.settings = { ...DEFAULT_SETTINGS, ...saved.value };
  const shared = rows.find((x) => x.key === SHARED_CACHE_SETTING_KEY)?.value;
  if (shared) {
    state.seflikler = Array.isArray(shared.seflikler) ? shared.seflikler : [];
    state.membersBySeflik =
      shared.membersBySeflik && typeof shared.membersBySeflik === "object"
        ? shared.membersBySeflik
        : {};
    state.customForestersBySeflik =
      shared.customForestersBySeflik &&
      typeof shared.customForestersBySeflik === "object"
        ? shared.customForestersBySeflik
        : {};
    state.removedForestersBySeflik =
      shared.removedForestersBySeflik &&
      typeof shared.removedForestersBySeflik === "object"
        ? shared.removedForestersBySeflik
        : {};
    state.drive = {
      ...state.drive,
      ...(shared.drive || {}),
      status: shared.drive?.connected ? "cached" : "idle",
    };
    state.auth = { ...state.auth, ...(shared.auth || {}), status: "cached" };
  }

  // Eski prototip/demo istifleri cihazdan kalıcı olarak temizle.
  const demoRows = state.records.filter(
    (record) =>
      record?.isDemo === true ||
      record?.syncStatus === "demo" ||
      clean(record?.description) === "Örnek prototip kaydı",
  );
  for (const record of demoRows) {
    try {
      await idbDelete("records", record.id);
    } catch {}
  }
  state.records = state.records.filter(
    (record) => !demoRows.some((demo) => demo.id === record.id),
  );

  // Önceki sürümlerde cihaza otomatik yazılmış kişisel kurum/şeflik örneklerini bir kez sıfırla.
  if (!localStorage.getItem(GENERIC_SETTINGS_MIGRATION_KEY)) {
    state.settings = {
      ...state.settings,
      seflik: "",
      seflikKey: "",
      ormanci: "",
      bolgeMudurlugu: "",
      isletmeMudurlugu: "",
      satisIstifYeri: "",
      setupComplete: false,
    };
    localStorage.setItem(
      GENERIC_SETTINGS_MIGRATION_KEY,
      new Date().toISOString(),
    );
    await saveSettings();
  }

  hydrateLocalSharedIdentity();
  refreshCurrentMembers();
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

function readSharedTerminal() {
  const terminal =
    jsonRead(SHARED_TERMINAL_KEY, null) ||
    jsonRead(SHARED_TERMINAL_OLD_KEY, null) ||
    {};
  return terminal?.active ? terminal : {};
}
function isPairedTerminal() {
  const terminal = readSharedTerminal();
  return !!(
    terminal.active &&
    terminal.source === "pair_code" &&
    (terminal.terminalCode || terminal.terminalToken || terminal.pairedUserId)
  );
}
function hasSharedIdentity() {
  return !!(readSharedSession()?.access_token || readSharedTerminal().active);
}
function hasSharedCloudIdentity() {
  return !!(readSharedSession()?.access_token || isPairedTerminal());
}
function terminalAuthPayload() {
  const terminal = readSharedTerminal();
  return isPairedTerminal()
    ? {
        terminalCode: clean(terminal.terminalCode),
        terminalToken: clean(terminal.terminalToken),
        terminalPairedUserId: clean(terminal.pairedUserId),
        terminalPairedEmail: clean(terminal.pairedEmail),
      }
    : {};
}

function storeSharedSession(session) {
  if (!session?.access_token) return null;
  const normalized = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at:
      session.expires_at ||
      (session.expires_in
        ? Math.floor(Date.now() / 1000) + Number(session.expires_in)
        : 0),
    user: session.user || readSharedSession()?.user || {},
  };
  jsonWrite(SHARED_SESSION_KEY, normalized);
  jsonWrite(SHARED_SESSION_BACKUP_KEY, {
    ...normalized,
    backup_at: Date.now(),
  });
  return normalized;
}

async function ensureSharedSession(forceRefresh = false) {
  let session = readSharedSession();
  if (!session?.access_token) throw new Error("Google ile giriş yapılmamış.");
  const expiresMs = Number(session.expires_at || 0) * 1000;
  if (!forceRefresh && (!expiresMs || expiresMs > Date.now() + 60000))
    return session;
  if (navigator.onLine === false && session.access_token) return session;
  if (!session.refresh_token) return session;
  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    },
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 400 || response.status === 401)
      localStorage.removeItem(SHARED_SESSION_KEY);
    throw new Error(body.message || body.msg || "Google oturumu yenilenemedi.");
  }
  session = storeSharedSession(body);
  return session;
}

function hydrateLocalSharedIdentity() {
  const panel = jsonRead(SHARED_PANEL_KEY, {}) || {};
  const access = jsonRead(SHARED_ACCESS_KEY, {}) || {};
  const active = jsonRead(SHARED_ACTIVE_SEFLIK_KEY, {}) || {};
  const session = readSharedSession();
  const terminal = readSharedTerminal();
  const localSeflik = clean(
    active.seflik ||
      active.name ||
      panel.activeSeflik ||
      access.seflik ||
      access.canonical_seflik ||
      panel.seflik ||
      terminal.seflik,
  );
  const localKey = clean(
    active.seflik_key || active.seflikKey || stableKey(localSeflik),
  );
  const localName = clean(
    panel.googleFullName ||
      access.name ||
      access.canonical_name ||
      panel.name ||
      terminal.name ||
      session?.user?.user_metadata?.full_name ||
      session?.user?.user_metadata?.name,
  );
  const avatarUrl = clean(
    access.avatar_url ||
      panel.googleAvatarUrl ||
      session?.user?.user_metadata?.avatar_url ||
      session?.user?.user_metadata?.picture ||
      terminal.avatarUrl ||
      terminal.avatar_url,
  );
  if (session?.access_token) {
    state.auth = {
      ...state.auth,
      status: state.auth.status === "cached" ? "cached" : "local",
      userId: clean(session.user?.id || state.auth.userId),
      email: clean(session.user?.email || state.auth.email),
      name: localName || state.auth.name,
      avatarUrl: avatarUrl || state.auth.avatarUrl,
      error: "",
    };
  } else if (terminal.active) {
    state.auth = {
      ...state.auth,
      status: isPairedTerminal() ? "terminal" : "guest",
      userId: clean(terminal.pairedUserId),
      email: clean(terminal.pairedEmail),
      name: localName || clean(terminal.name),
      avatarUrl: avatarUrl || "",
      error: "",
    };
  } else if (state.auth.status !== "cached") {
    state.auth.status = "signed_out";
  }
  if (
    localSeflik &&
    !state.seflikler.some((item) => item.name === localSeflik)
  ) {
    state.seflikler.unshift({
      name: localSeflik,
      key: localKey,
      role: "cached",
    });
  }
  // Suite merkezli kullanım: aktif şeflik İstif İO'nun doğrudan çalışma bağlamıdır.
  // Ayrı bir kurulum ekranı istemeden yeni istif ve offline bölme akışı açılır.
  if (localSeflik) {
    state.settings.seflik = localSeflik;
    state.settings.seflikKey = localKey;
    state.settings.setupComplete = true;
    if (!clean(state.settings.ormanci) && localName)
      state.settings.ormanci = localName;
  }
}

async function edgeCall(action, payload = {}, retried = false) {
  const session = readSharedSession();
  const terminalPayload = terminalAuthPayload();
  if (!session?.access_token && !isPairedTerminal())
    throw new Error("Google veya terminal kodu ile giriş gerekli.");
  const token = session?.access_token || SUPABASE_ANON_KEY;
  const response = await fetch(EDGE_URL, {
    method: "POST",
    cache: "no-store",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action,
      source: "mesaha-istif-v034-suite",
      ...terminalPayload,
      ...payload,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (
    (response.status === 401 || response.status === 403) &&
    session?.refresh_token &&
    !retried
  ) {
    await ensureSharedSession(true);
    return edgeCall(action, payload, true);
  }
  if (!response.ok || body?.ok === false)
    throw new Error(
      body.error || body.reason || `Sunucu hatası ${response.status}`,
    );
  return body;
}

async function bridgeCall(action, payload = {}, retried = false) {
  const session = readSharedSession();
  const terminalPayload = terminalAuthPayload();
  if (!session?.access_token && !isPairedTerminal())
    throw new Error("Google veya terminal kodu ile giriş gerekli.");
  const token = session?.access_token || SUPABASE_ANON_KEY;
  const response = await fetch(DRIVE_BRIDGE_URL, {
    method: "POST",
    cache: "no-store",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action,
      source: "mesaha-istif-v034-suite",
      ...terminalPayload,
      ...payload,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (
    (response.status === 401 || response.status === 403) &&
    session?.refresh_token &&
    !retried
  ) {
    await ensureSharedSession(true);
    return bridgeCall(action, payload, true);
  }
  if (!response.ok || body?.ok === false)
    throw new Error(
      body.error || body.reason || `İstif bağlantı hatası ${response.status}`,
    );
  return body;
}

function currentFolder() {
  return (
    state.seflikler.find(
      (item) =>
        item.key === state.settings.seflikKey ||
        item.name === state.settings.seflik,
    ) || null
  );
}

function currentFolderIsOwner() {
  const folder = currentFolder();
  return !!(
    folder &&
    (folder.isCreator ||
      ["owner", "creator", "kurucu"].includes(
        String(folder.role || "").toLocaleLowerCase("tr-TR"),
      ))
  );
}

function normalizeForester(raw) {
  const name = clean(
    raw?.name ||
      raw?.ormanci ||
      raw?.forester_name ||
      raw?.canonical_name ||
      raw?.member_name,
  );
  if (!name) return null;
  return {
    id: clean(
      raw.id ||
        raw.userId ||
        raw.user_id ||
        raw.forester_user_id ||
        `custom_${stableKey(name)}`,
    ),
    userId: clean(
      raw.userId || raw.user_id || raw.forester_user_id || raw.member_user_id,
    ),
    name,
    email: clean(raw.email || raw.user_email || raw.member_email),
    avatarUrl: clean(
      raw.avatarUrl ||
        raw.avatar_url ||
        raw.googleAvatarUrl ||
        raw.google_avatar_url ||
        raw.picture,
    ),
    role: clean(raw.role || raw.member_role || "forester"),
    isSelf: raw.is_self === true || raw.isSelf === true,
    custom: raw.custom !== false,
    pending: raw.pending === true,
  };
}

async function refreshDriveStatus({ silent = true } = {}) {
  const key = state.settings.seflikKey || stableKey(state.settings.seflik);
  if (!key || !hasSharedCloudIdentity()) {
    state.drive = {
      ...state.drive,
      status: "idle",
      connected: false,
      isOwner: currentFolderIsOwner(),
      error: "",
    };
    return state.drive;
  }
  if (navigator.onLine === false) {
    state.drive = {
      ...state.drive,
      status: state.drive.connected ? "cached" : "offline",
      isOwner: currentFolderIsOwner(),
    };
    return state.drive;
  }
  state.drive.status = "checking";
  try {
    const out = await bridgeCall("status", {
      seflikKey: key,
      seflik: state.settings.seflik,
    });
    state.drive = {
      status: "ready",
      connected: !!out.connected,
      isOwner: !!out.isOwner,
      ownerEmail: clean(out.ownerEmail),
      ownerName: clean(out.ownerName),
      folderId: clean(out.folderId),
      folderName: clean(out.folderName),
      folderUrl: clean(out.folderUrl),
      updatedAt: clean(out.updatedAt),
      error: "",
    };
  } catch (error) {
    state.drive = {
      ...state.drive,
      status: state.drive.connected ? "cached" : "error",
      isOwner: currentFolderIsOwner(),
      error: clean(error?.message || error),
    };
    if (!silent) toast(`Drive durumu alınamadı: ${state.drive.error}`, "bad");
  }
  await saveSharedCache();
  return state.drive;
}

async function syncCustomForestersForFolder(folder) {
  const local = Array.isArray(state.customForestersBySeflik[folder.key])
    ? [...state.customForestersBySeflik[folder.key]]
    : [];
  try {
    for (const item of local.filter((x) => x.pending && x.name)) {
      try {
        await bridgeCall("forester_add", {
          seflikKey: folder.key,
          seflik: folder.name,
          name: item.name,
        });
      } catch {}
    }
    const out = await bridgeCall("forester_list", {
      seflikKey: folder.key,
      seflik: folder.name,
    });
    const remote = (out.foresters || []).map(normalizeForester).filter(Boolean);
    const pending = local.filter(
      (item) =>
        item.pending &&
        !remote.some((x) => stableKey(x.name) === stableKey(item.name)),
    );
    state.customForestersBySeflik[folder.key] = [...remote, ...pending];
  } catch {
    if (!Array.isArray(state.customForestersBySeflik[folder.key]))
      state.customForestersBySeflik[folder.key] = local;
  }
}

function normalizeFolder(raw) {
  const name = clean(
    raw?.seflik || raw?.name || raw?.folderSeflik || raw?.title,
  );
  if (!name) return null;
  return {
    name,
    key: clean(raw.seflik_key || raw.seflikKey || stableKey(name)),
    role: clean(raw.role || raw.member_role || "member"),
    isCreator:
      raw.is_creator === true ||
      raw.isCreator === true ||
      ["owner", "creator", "kurucu"].includes(
        clean(raw.role || raw.member_role).toLocaleLowerCase("tr-TR"),
      ),
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
    role: clean(raw.role || "member"),
    isSelf: raw.is_self === true,
  };
}

function seflikAliasKeys(name, key = "") {
  const out = new Set();
  const add = (v) => {
    const k = stableKey(v);
    if (k) out.add(k);
  };
  add(key);
  add(name);
  add(clean(name).replace(/\s*Şefliği\s*$/i, ""));
  add(clean(name).replace(/\s*Sefliği\s*$/i, ""));
  add(clean(name).replace(/\s*Şeflik\s*$/i, ""));
  add(clean(name).replace(/\s*Seflik\s*$/i, ""));
  return [...out];
}

function currentSeflikAliasKeys() {
  const aliases = new Set(
    seflikAliasKeys(state.settings.seflik, state.settings.seflikKey),
  );
  const currentNameKey = stableKey(state.settings.seflik);
  state.seflikler.forEach((folder) => {
    const folderAliases = seflikAliasKeys(folder.name, folder.key);
    if (
      folderAliases.some((k) => aliases.has(k)) ||
      folderAliases.includes(currentNameKey)
    ) {
      folderAliases.forEach((k) => aliases.add(k));
    }
  });
  return [...aliases];
}

function valuesByAlias(map, aliases) {
  const values = [];
  aliases.forEach((key) => {
    const list = map && Array.isArray(map[key]) ? map[key] : [];
    values.push(...list);
  });
  return values;
}

function foresterKey(item) {
  return item?.userId
    ? `uid:${item.userId}`
    : item?.email
      ? `email:${clean(item.email).toLocaleLowerCase("tr-TR")}`
      : `name:${stableKey(item?.name)}`;
}

function removedForesterKeysForAliases(aliases = currentSeflikAliasKeys()) {
  const keys = new Set();
  aliases.forEach((alias) => {
    const list =
      state.removedForestersBySeflik &&
      Array.isArray(state.removedForestersBySeflik[alias])
        ? state.removedForestersBySeflik[alias]
        : [];
    list.forEach((key) => {
      if (key) keys.add(key);
    });
  });
  return keys;
}

function rememberRemovedForester(member) {
  const key = foresterKey(member);
  if (!key) return;
  currentSeflikAliasKeys().forEach((alias) => {
    const list = Array.isArray(state.removedForestersBySeflik[alias])
      ? state.removedForestersBySeflik[alias]
      : [];
    if (!list.includes(key)) list.push(key);
    state.removedForestersBySeflik[alias] = list.slice(-100);
  });
}

function forgetRemovedForester(user) {
  const key = foresterKey({
    userId: clean(user?.userId || user?.user_id),
    email: clean(user?.email),
    name: clean(user?.name),
  });
  if (!key) return;
  Object.keys(state.removedForestersBySeflik || {}).forEach((alias) => {
    const list = Array.isArray(state.removedForestersBySeflik[alias])
      ? state.removedForestersBySeflik[alias]
      : [];
    state.removedForestersBySeflik[alias] = list.filter((item) => item !== key);
  });
}

function removeForesterLocally(member) {
  const key = foresterKey(member);
  if (!key) return;
  const removeFromMap = (map) => {
    Object.keys(map || {}).forEach((alias) => {
      if (!Array.isArray(map[alias])) return;
      map[alias] = map[alias].filter(
        (item) =>
          foresterKey(
            item?.custom ? normalizeForester(item) : normalizeMember(item),
          ) !== key,
      );
    });
  };
  removeFromMap(state.membersBySeflik);
  removeFromMap(state.customForestersBySeflik);
  state.ormancilar = state.ormancilar.filter(
    (item) => foresterKey(item) !== key,
  );
}

function mirrorMembersByAliases(target, folder, list) {
  seflikAliasKeys(folder.name, folder.key).forEach((alias) => {
    if (!Array.isArray(target[alias]) || !target[alias].length)
      target[alias] = list;
  });
}

function refreshCurrentMembers() {
  if (!state.settings.setupComplete || !clean(state.settings.seflik)) {
    state.ormancilar = [];
    state.settings.ormanci = "";
    return;
  }
  const aliases = currentSeflikAliasKeys();
  const members = valuesByAlias(state.membersBySeflik, aliases);
  const custom = valuesByAlias(state.customForestersBySeflik, aliases);
  const map = new Map();
  [...members, ...custom].forEach((item) => {
    const normalized = item?.custom
      ? normalizeForester(item)
      : normalizeMember(item);
    if (!normalized?.name) return;
    const k = foresterKey(normalized);
    if (removedForesterKeysForAliases(aliases).has(k) && !normalized.isSelf)
      return;
    if (!map.has(k) || normalized.custom) map.set(k, normalized);
  });
  if (state.auth.name) {
    const selfKey = state.auth.userId
      ? `uid:${state.auth.userId}`
      : state.auth.email
        ? `email:${state.auth.email}`
        : `name:${stableKey(state.auth.name)}`;
    if (!map.has(selfKey))
      map.set(selfKey, {
        id: state.auth.userId || state.auth.name,
        userId: state.auth.userId,
        email: state.auth.email,
        name: state.auth.name,
        avatarUrl: state.auth.avatarUrl,
        role: currentFolderIsOwner() ? "owner" : "member",
        isSelf: true,
        custom: false,
      });
  }
  const mergedList = [];
  [...map.values()].forEach((item) => {
    const same = mergedList.find(
      (existing) =>
        (item.userId && existing.userId && item.userId === existing.userId) ||
        (item.email &&
          existing.email &&
          clean(item.email).toLocaleLowerCase("tr-TR") ===
            clean(existing.email).toLocaleLowerCase("tr-TR")) ||
        (item.name &&
          existing.name &&
          stableKey(item.name) === stableKey(existing.name)),
    );
    if (same) {
      Object.assign(same, {
        ...same,
        ...item,
        userId: same.userId || item.userId,
        email: same.email || item.email,
        avatarUrl: same.avatarUrl || item.avatarUrl,
        isSelf: same.isSelf || item.isSelf,
        custom: same.custom || item.custom,
        role: same.role === "owner" ? same.role : item.role || same.role,
      });
    } else {
      mergedList.push({ ...item });
    }
  });
  state.ormancilar = mergedList.sort((a, b) => {
    if (a.isSelf && !b.isSelf) return -1;
    if (!a.isSelf && b.isSelf) return 1;
    return clean(a.name).localeCompare(clean(b.name), "tr");
  });
  if (!state.ormancilar.some((x) => x.name === state.settings.ormanci)) {
    const preferred =
      state.ormancilar.find((x) => x.role === "forester") ||
      state.ormancilar.find((x) => x.role === "member") ||
      state.ormancilar.find((x) => x.isSelf) ||
      state.ormancilar[0];
    state.settings.ormanci = preferred?.name || state.auth.name || "";
  }
}

async function syncSharedContext({ manual = false } = {}) {
  if (state.sharedSyncing) return;
  if (navigator.onLine === false) {
    state.auth.status = hasSharedIdentity() ? "cached" : "signed_out";
    if (manual)
      toast("İnternet yok. Son Suite bilgileri kullanılıyor.");
    render();
    return;
  }
  if (!hasSharedCloudIdentity()) {
    hydrateLocalSharedIdentity();
    refreshCurrentMembers();
    render();
    if (manual) toast("Yerel misafir modunda bulut senkronizasyonu kapalı.");
    return;
  }
  state.sharedSyncing = true;
  state.auth.status = "syncing";
  render();
  try {
    let out,
      session = readSharedSession();
    try {
      out = await bridgeCall("shared_context", {
        seflik: state.settings.seflik,
        seflikKey: state.settings.seflikKey,
      });
    } catch (bridgeError) {
      const folderOut = await edgeCall("seflik_folder_list_my_sefliks", {
        seflik: state.settings.seflik,
        folderSeflik: state.settings.seflik,
      });
      const rawFolders = Array.isArray(folderOut.folders)
        ? folderOut.folders
        : [];
      const membersBySeflik = {};
      for (const folder of rawFolders) {
        try {
          const memberOut = await edgeCall("seflik_folder_list_members", {
            seflik: folder.seflik,
            folderSeflik: folder.seflik,
          });
          membersBySeflik[folder.seflik_key || stableKey(folder.seflik)] =
            memberOut.members || [];
        } catch {}
      }
      out = {
        folders: rawFolders,
        membersBySeflik,
        customForestersBySeflik: {},
        access: {
          user_id: readSharedTerminal().pairedUserId,
          email: readSharedTerminal().pairedEmail,
          name: readSharedTerminal().name,
        },
      };
    }
    const folders = (out.folders || []).map(normalizeFolder).filter(Boolean);
    if (!folders.length)
      throw new Error("Mesaha İO Şeflik Klasörü bulunamadı.");
    state.seflikler = folders;
    const nextMembers = {};
    Object.entries(out.membersBySeflik || {}).forEach(([key, members]) => {
      nextMembers[key] = (Array.isArray(members) ? members : [])
        .map(normalizeMember)
        .filter(Boolean);
    });
    folders.forEach((folder) => {
      const aliases = seflikAliasKeys(folder.name, folder.key);
      const source =
        aliases
          .map((alias) => nextMembers[alias])
          .find((list) => Array.isArray(list) && list.length) ||
        nextMembers[folder.key] ||
        [];
      mirrorMembersByAliases(nextMembers, folder, source);
    });
    state.membersBySeflik = nextMembers;
    if (state.settings.setupComplete && state.settings.seflik) {
      const selected = folders.find(
        (x) =>
          sameSeflikLabel(x.name, state.settings.seflik) ||
          x.key === state.settings.seflikKey,
      );
      if (selected) state.settings.seflikKey = selected.key;
    }
    const term = readSharedTerminal();
    state.auth = {
      status: isPairedTerminal() ? "terminal" : "connected",
      userId: clean(
        out.access?.user_id ||
          out.access?.userId ||
          session?.user?.id ||
          term.pairedUserId,
      ),
      email: clean(
        out.access?.email || session?.user?.email || term.pairedEmail,
      ),
      name: clean(
        out.access?.name ||
          out.access?.canonical_name ||
          session?.user?.user_metadata?.full_name ||
          term.name ||
          state.auth.name,
      ),
      avatarUrl: clean(
        out.access?.avatar_url ||
          session?.user?.user_metadata?.avatar_url ||
          term.avatarUrl ||
          state.auth.avatarUrl,
      ),
      error: "",
      updatedAt: new Date().toISOString(),
    };
    refreshCurrentMembers();
    await saveSettings();
    if (readSharedSession()) {
      await refreshDriveStatus({ silent: true });
      await loadRemoteRecords({ silent: true });
    }
    await saveSharedCache();
    if (manual) toast("Şeflikler ve kullanıcılar güncellendi.", "good");
  } catch (error) {
    state.auth.status = hasSharedIdentity() ? "cached" : "signed_out";
    state.auth.error = clean(error?.message || error);
    hydrateLocalSharedIdentity();
    refreshCurrentMembers();
    if (manual)
      toast(`Şeflik senkronu tamamlanamadı: ${state.auth.error}`, "bad");
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
  return `<button class="icon-btn" data-action="account" aria-label="Hesap">${icon("user", 23)}</button>`;
}

function head(title, subtitle = "", { back = false, action = "" } = {}) {
  return `<header class="page-head ${back ? "compact" : ""}">
    ${back ? `<button class="back-btn" data-action="back" aria-label="Geri">${icon("back", 28)}</button>` : logo()}
    <div class="title-wrap"><h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ""}</div>
    ${action ? `<div class="head-action">${action}</div>` : ""}
  </header>`;
}

function nav(active) {
  const leftItems = [
    ["home", "home", "Ana Sayfa"],
    ["records", "logs", "İstifler"],
  ];
  const rightItems = [
    ["documents", "doc", "Evraklar"],
    ["settings", "gear", "Ayarlar"],
  ];
  const normalButton = ([view, iconName, label]) => `
    <button class="nav-btn ${active === view ? "active" : ""}" data-view="${view}">
      <span class="nicon">${icon(iconName, 25)}</span><span>${label}</span>
    </button>`;
  return `<nav class="bottom-nav has-create">${leftItems.map(normalButton).join("")}
    <button class="nav-btn nav-create ${active === "new" ? "active" : ""}" data-view="new" aria-label="Yeni İstif">
      <span class="create-circle">${icon("plus", 30)}</span><span>Yeni</span>
    </button>${rightItems.map(normalButton).join("")}</nav>`;
}

function metric(iconName, number, label) {
  return `<div class="metric card"><div class="metric-icon">${icon(iconName, 24)}</div><b>${number}</b><span>${label}</span></div>`;
}

function setView(view) {
  stopCamera();
  if (view === "new" && !state.settings.setupComplete) {
    state.view = "settings";
    render();
    toast("Önce kurum, işletme, şeflik ve rampa bilgilerini kaydedin.", "bad");
    return;
  }
  state.view = view;
  render();
  if (view === "settings" && navigator.onLine && hasSharedCloudIdentity())
    refreshDriveStatus({ silent: true }).then(render);
  scrollTo({ top: 0, behavior: "smooth" });
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
  app.innerHTML = `<main class="view">${(views[state.view] || renderHome)()}</main>${nav(state.view === "templates" ? "documents" : state.view)}`;
  bindDynamic();
}

function counts() {
  return {
    records: state.records.length,
    photos: state.records.reduce(
      (sum, row) => sum + (row.photos?.length || row.photoCount || 0),
      0,
    ),
    pending: state.records.filter(
      (row) => !row.isDemo && row.syncStatus !== "synced",
    ).length,
  };
}

function authSummary() {
  if (state.auth.status === "terminal")
    return `${state.auth.name || "Terminal"} kodla bağlı • Şeflik Klasörü ortak`;
  if (state.auth.status === "guest")
    return "Yerel misafir modu • Kayıtlar cihazda";
  if (state.auth.status === "connected")
    return `${state.auth.name || "Google hesabı"} bağlı • Şeflik Klasörü güncel`;
  if (state.auth.status === "syncing")
    return "Hesap ve Şeflik Klasörü getiriliyor…";
  if (state.auth.status === "cached" || state.auth.status === "local")
    return "Son şeflik bilgileri cihazdan kullanılıyor";
  return "Google girişi gerekli";
}

function displaySeflik() {
  return state.settings.seflik || "Şeflik seçilmedi";
}

function displayOrmanci() {
  return state.settings.ormanci || "Ormancı seçilmedi";
}

function visibleForesters() {
  return state.ormancilar.slice(0, 8);
}

function foresterSummaryHtml() {
  const list = visibleForesters();
  if (!list.length)
    return '<span class="forester-empty">Henüz ormancı eklenmedi</span>';
  return `<div class="forester-chips">${list.map((item) => `<span class="forester-chip ${item.name === state.settings.ormanci ? "selected" : ""}">${item.avatarUrl ? `<img src="${esc(item.avatarUrl)}" alt="">` : icon("user", 15)}<b>${esc(item.name)}</b>${item.pending ? "<i>Bekliyor</i>" : ""}</span>`).join("")}${state.ormancilar.length > list.length ? `<span class="forester-more">+${state.ormancilar.length - list.length}</span>` : ""}</div>`;
}

function renderHome() {
  const c = counts();
  return `${head("İstif Alma", "", { action: profileButton() })}
    ${state.settings.setupComplete ? "" : `<button class="setup-warning card" data-view="settings"><span>${icon("info", 22)}</span><div><b>İşletme ve evrak bilgilerini girin</b><small>Bölge, işletme, şeflik ve rampa bilgilerini kaydedin.</small></div>${icon("chevron", 21)}</button>`}
    <section class="sync-banner card">
      <span class="round-icon compact-icon">${icon(state.auth.status === "signed_out" ? "wifiOff" : "sync", 21)}</span>
      <div class="sync-copy"><strong>Offline kullanılabilir</strong><span>${authSummary()} • ${c.pending} kayıt bekliyor</span></div>
      <button class="btn primary small" data-action="sync">Senkronize Et</button>
    </section>
    <section class="metrics">
      ${metric("logs", c.records, "Toplam İstif")}
      ${metric("calendar", state.records.filter((row) => row.date === today()).length, "Bugün")}
      ${metric("camera", c.photos, "Fotoğraf")}
      ${metric("doc", 3, "Evrak")}
    </section>
    <section class="select-panel card">
      <button class="select-row" data-action="pick-seflik">
        <span class="round-icon">${icon("forest", 23)}</span>
        <span class="row-copy"><small>Şeflik</small><strong>${esc(displaySeflik())}</strong></span>
        <span class="chev">${icon("chevron", 23)}</span>
      </button>
    </section>
    <div class="section-title"><h2>İşlemler</h2></div>
    <section class="actions-grid">
      <button class="action-card" data-view="new"><span class="aicon">${icon("plus", 31)}</span><span>Yeni İstif</span></button>
      <button class="action-card" data-view="records"><span class="aicon">${icon("logs", 31)}</span><span>İstifler</span></button>
      <button class="action-card" data-view="documents"><span class="aicon">${icon("doc", 31)}</span><span>Evrak Oluştur</span></button>
      <button class="action-card" data-view="photos"><span class="aicon">${icon("camera", 31)}</span><span>Fotoğraflar</span></button>
    </section>
    <div class="section-title"><h2>Bekleyenler</h2></div>
    <section class="pending-card card">
      <div class="pending-row"><i class="dot"></i>Yerelde kayıtlı<b>${state.records.filter((row) => !row.isDemo && row.syncStatus === "local").length}</b></div>
      <div class="pending-row"><i class="dot wait"></i>Drive yükleme bekliyor<b>${state.records.reduce((sum, row) => sum + (!row.isDemo && row.syncStatus !== "synced" ? row.photos?.length || row.photoCount || 0 : 0), 0)} fotoğraf</b></div>
      <div class="pending-row"><i class="dot bad"></i>Supabase kaydı bekliyor<b>${state.records.filter((row) => !row.isDemo && row.syncStatus !== "synced").length}</b></div>
    </section>`;
}

function freshDraft() {
  return {
    id: uid(),
    seflik: state.settings.seflik,
    seflikKey: state.settings.seflikKey,
    ormanci: state.settings.ormanci,
    date: today(),
    bolme: preferredBolme(),
    istifNo: "",
    type: "İbreli Kabuklu Kağıtlık Odun",
    ster: "",
    coordinates: "",
    mevki: "",
    description: "",
    barcode: "",
    photos: [],
    createdAt: new Date().toISOString(),
    syncStatus: "local",
  };
}

function lastBolmeStorageKey() {
  const key = clean(state.settings.seflikKey) || stableKey(state.settings.seflik);
  return `${LAST_BOLME_KEY_PREFIX}${key || "default"}`;
}

function rememberLastBolme(value) {
  const bolme = clean(value);
  if (!bolme) return;
  try {
    localStorage.setItem(lastBolmeStorageKey(), bolme);
  } catch {}
}

function preferredBolme() {
  const ready = currentSuiteReadyBolmeler();
  if (!ready.length) return "";
  let remembered = "";
  try {
    remembered = clean(localStorage.getItem(lastBolmeStorageKey()));
  } catch {}
  if (remembered && ready.includes(remembered)) return remembered;
  const recent = [...state.records]
    .filter((row) => !row.isDemo && sameSeflikLabel(row.seflik, state.settings.seflik))
    .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")))
    .map(recordBolme)
    .find((bolme) => ready.includes(bolme));
  return recent || ready[0] || "";
}

function ensureDraft() {
  if (!state.draft) state.draft = freshDraft();
  if (!clean(state.draft.bolme)) state.draft.bolme = preferredBolme();
  return state.draft;
}

function syncDraftFromForm(form) {
  const draft = ensureDraft();
  if (!(form instanceof HTMLFormElement)) return draft;
  const values = new FormData(form);
  [
    "seflik",
    "date",
    "bolme",
    "istifNo",
    "type",
    "ster",
    "coordinates",
    "mevki",
    "description",
    "barcode",
  ].forEach((name) => {
    if (values.has(name)) draft[name] = clean(values.get(name));
  });
  const folder = state.seflikler.find((item) => item.name === draft.seflik);
  draft.seflikKey = folder?.key || draft.seflikKey || stableKey(draft.seflik);
  return draft;
}

function fieldRow(
  iconName,
  label,
  name,
  value,
  type = "text",
  options = [],
  { readonly = false } = {},
) {
  let control = "";
  if (type === "select") {
    const safeOptions = [...new Set((options.length ? options : [value || ""]).map(clean).filter(Boolean))];
    const selectedValue = clean(value) || safeOptions[0] || "";
    control = `<select name="${name}" ${readonly ? "disabled" : ""}>${safeOptions.map((option) => `<option value="${esc(option)}" ${option === selectedValue ? "selected" : ""}>${esc(option)}</option>`).join("")}</select>`;
  } else if (type === "textarea") {
    control = `<textarea name="${name}" placeholder="İsteğe bağlı" ${readonly ? "readonly" : ""}>${esc(value)}</textarea>`;
  } else {
    control = `<input name="${name}" value="${esc(value)}" type="${type}" ${readonly ? "readonly" : ""} ${type === "number" ? 'inputmode="decimal" step="0.01"' : ""}>`;
  }
  return `<div class="field-row"><span class="field-icon">${icon(iconName, 21)}</span><div class="field-main"><label>${label}</label>${control}</div><span class="chev">${type === "select" ? icon("chevron", 21) : ""}</span></div>`;
}

function renderNew() {
  const draft = ensureDraft();
  const seflikOptions = state.seflikler.map((item) => item.name);
  const bolmeOptions = currentSuiteReadyBolmeler();
  if (!clean(draft.bolme) && bolmeOptions.length) draft.bolme = preferredBolme();
  return `${head(draft.createdAt && state.records.some((r) => r.id === draft.id) ? "İstif Düzenle" : "Yeni İstif", "İstif bilgilerini girin", { back: true })}<form id="stackForm">
    <section class="form-card card">
      ${fieldRow("forest", "Şeflik", "seflik", draft.seflik, "select", seflikOptions)}
      ${fieldRow("calendar", "Tarih", "date", draft.date, "date")}
      ${fieldRow("layers", "Bölme", "bolme", draft.bolme, "select", bolmeOptions)}
      ${bolmeOptions.length ? "" : '<div class="info-note"><b>' + icon("info", 21) + "</b><span>Suite ana menüsünde oluşturulan bölmeyi önce Offline İndir yapın. Bölme hazır olmadan ster kaydı eklenemez.</span></div>"}
      ${fieldRow("logs", "İstif No", "istifNo", draft.istifNo)}
      ${fieldRow("forest", "Odun Türü", "type", draft.type, "select", ["İbreli Kabuklu Kağıtlık Odun", "İbreli Lif Yonga Odun", "İbreli Yakacak Odun", "İbreli Sırık 2 Boy", "İbreli Sırık 3 Boy", "İbreli Sırık 4 Boy", "İbreli Sırık 5 Boy"])}
      ${fieldRow("cube", "Ster Sayısı", "ster", draft.ster, "number")}
    </section>
    <div class="photo-head"><h2>Koordinat</h2></div>
    <section class="coord-grid card"><input name="coordinates" value="${esc(draft.coordinates)}" placeholder="Enlem, boylam"><button class="btn small" type="button" data-action="geo">${icon("pin", 19)} Mevcut Konumu Ekle</button></section>
    <div class="photo-head"><h2>Resim Ekle</h2><span class="photo-counter">${state.selectedPhotos.length}/4</span></div>
    <section class="photo-grid">${[0, 1, 2, 3].map((index) => photoSlot(index)).join("")}</section>
    <section class="form-card card details-card">
      ${fieldRow("pin", "Mevki", "mevki", draft.mevki)}
      ${fieldRow("doc", "Açıklama", "description", draft.description, "textarea")}
      ${fieldRow("barcode", "Barkod No", "barcode", draft.barcode)}
    </section>
    <div class="info-note"><b>${icon("info", 21)}</b><span>Uygulama kamerasıyla çekilen fotoğraflar galeride görünmez. Her fotoğraf yaklaşık 1 MB altında saklanır.</span></div>
    <div class="stack-actions"><button class="btn primary wide" type="submit">${icon("save", 21)} Kaydet</button><button class="btn wide" type="button" data-action="save-draft">${icon("doc", 21)} Taslağa Ekle</button></div>
  </form>`;
}

function photoSlot(index) {
  const photo = state.selectedPhotos[index];
  if (photo) {
    const url = URL.createObjectURL(photo.blob);
    return `<div class="photo-slot"><img src="${url}" alt="Fotoğraf ${index + 1}"><button class="remove-photo" type="button" data-remove-photo="${index}" aria-label="Fotoğrafı sil">${icon("trash", 18)}</button></div>`;
  }
  return `<button class="photo-slot addable" type="button" data-add-photo><span class="photo-placeholder"><b>${icon("camera", 27)}</b>Fotoğraf ${index + 1}</span></button>`;
}

function sortedRecords(list = state.records) {
  return [...list].sort((a, b) => {
    const aIndex = TYPE_ORDER.findIndex((type) => a.type.startsWith(type));
    const bIndex = TYPE_ORDER.findIndex((type) => b.type.startsWith(type));
    return (
      (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex) ||
      String(a.istifNo).localeCompare(String(b.istifNo), "tr")
    );
  });
}

function recordTypeClass(type) {
  const value = clean(type).toLocaleLowerCase("tr-TR");
  if (value.includes("kabuklu") && value.includes("kağıtlık"))
    return "type-kabuklu";
  if (value.includes("lif") || value.includes("yonga")) return "type-lif";
  if (value.includes("yakacak")) return "type-yakacak";
  if (
    value.includes("sırık") ||
    value.includes("sirık") ||
    value.includes("sirik")
  )
    return "type-sirik";
  return "type-diger";
}

function recordSent(record) {
  return record?.isSent === true || record?.is_sent === true;
}

async function setRecordSent(recordId, sent) {
  const record = state.records.find((item) => item.id === recordId);
  if (!record) return toast("İstif bulunamadı.", "bad");
  const actionText = sent
    ? "gönderildi olarak işaretlensin"
    : "gönderildi işareti geri alınsın";
  if (!confirm(`${record.istifNo || "Bu istif"} ${actionText} mı?`)) return;
  record.isSent = !!sent;
  record.sentAt = sent ? new Date().toISOString() : "";
  record.sentBy = sent ? state.auth.name || state.auth.email || "" : "";
  if (!record.isDemo)
    record.syncStatus = record.driveFiles?.length ? "drive_synced" : "local";
  record.updatedAt = new Date().toISOString();
  await idbPut("records", structuredClone(record));
  if (navigator.onLine && hasSharedCloudIdentity()) {
    try {
      await supabaseUpsertRecord(record);
      record.syncStatus = "synced";
      await idbPut("records", structuredClone(record));
    } catch {}
  }
  toast(
    sent
      ? "İstif gönderildi olarak işaretlendi."
      : "Gönderildi işareti geri alındı.",
    "good",
  );
  render();
}

function renderRecords() {
  const bolmes = [
    ...new Set(state.records.map((row) => row.bolme).filter(Boolean)),
  ];
  return `${head("İstifler", "Tarih, bölme ve türe göre filtreleyin", { back: true, action: `<button class="icon-btn" aria-label="Filtre">${icon("filter", 22)}</button>` })}
    <section class="filter-grid">
      <div class="filter-box"><label>Tarih</label><input id="filterDate" type="date" value=""></div>
      <div class="filter-box"><label>Bölme</label><select id="filterBolme"><option value="">Tümü</option>${bolmes.map((value) => `<option>${esc(value)}</option>`).join("")}</select></div>
      <div class="filter-box"><label>Tür</label><select id="filterType"><option value="">Tümü</option>${TYPE_ORDER.map((value) => `<option value="${esc(value)}">${esc(value.replace("İbreli ", ""))}</option>`).join("")}</select></div>
    </section>
    <section id="recordList" class="records">${recordCards(sortedRecords())}</section>`;
}

function driveFileId(file) {
  if (typeof file === "string") return clean(file);
  return clean(file?.id || file?.fileId || file?.file_id);
}

function driveFileForRecord(record, index = 0) {
  const files = Array.isArray(record?.driveFiles) ? record.driveFiles : [];
  return files[index] || null;
}

function driveFileCacheKey(file) {
  const id = driveFileId(file);
  return id ? `drive:${id}` : "";
}

function recordThumbHtml(record) {
  const photo = Array.isArray(record.photos)
    ? record.photos.find((item) => item && item.blob)
    : null;
  if (photo?.blob) {
    try {
      const src = URL.createObjectURL(photo.blob);
      return `<span class="record-thumb"><img src="${src}" alt="${esc(record.istifNo || "İstif fotoğrafı")}"></span>`;
    } catch {}
  }
  const firstDrive = driveFileForRecord(record, 0);
  const cacheKey = driveFileCacheKey(firstDrive);
  const cached = cacheKey ? state.remotePhotoCache[cacheKey] : "";
  if (cached)
    return `<span class="record-thumb"><img src="${cached}" alt="${esc(record.istifNo || "İstif fotoğrafı")}"></span>`;
  if (firstDrive)
    return `<span class="record-thumb default-thumb remote-thumb" data-record-thumb="${esc(record.id)}"><img src="./assets/istif-default.svg" alt="İstif fotoğrafı yükleniyor"></span>`;
  return `<span class="record-thumb default-thumb"><img src="./assets/istif-default.svg" alt="İstif"></span>`;
}

function recordCards(rows) {
  if (!rows.length)
    return '<div class="empty card">Filtreye uygun istif bulunamadı.</div>';
  return rows
    .map((record) => {
      const sent = recordSent(record);
      const sentDate =
        sent && record.sentAt ? trDate(String(record.sentAt).slice(0, 10)) : "";
      return `<article class="record-card card ${recordTypeClass(record.type)} ${sent ? "sent-record" : ""}" data-record="${record.id}">
      ${recordThumbHtml(record)}
      <div class="record-info">
        <span>Şeflik</span><b>${esc(String(record.seflik || "").replace(" Şefliği", ""))}</b>
        <span>Bölme</span><b>${esc(record.bolme)}</b>
        <span>İstif</span><b>${esc(record.istifNo)}</b>
        <span>Tür</span><b>${esc(record.type)}</b>
        <span>Ster</span><b>${esc(record.ster)} Ster</b>
        <span>Tarih</span><b>${trDate(record.date)}</b>
      </div>
      <div class="record-status ${record.coordinates ? "" : "warn"}">
        <div>${icon("pin", 17)}<span>${record.coordinates ? "Koordinat Var" : "Koordinat Bekliyor"}</span></div>
        <div>${icon("camera", 17)}<span>${record.photos?.length || record.photoCount || 0} Fotoğraf</span></div>
        <div>${icon(sent ? "check" : "cloud", 17)}<span>${sent ? `Gönderildi${sentDate ? ` • ${sentDate}` : ""}` : record.isDemo ? "Örnek Kayıt" : record.syncStatus === "synced" ? "Senkronize" : record.syncStatus === "drive_synced" ? "Supabase Bekliyor" : record.syncStatus === "syncing" ? "Yükleniyor" : "Yerelde Kayıtlı"}</span></div>
      </div>
      ${sent ? `<div class="sent-badge">${icon("check", 15)} Gönderilen İstif</div>` : ""}
      <div class="record-actions">
        <button class="btn small" type="button" data-edit-record="${record.id}">${icon("doc", 16)} Düzenle</button>
        <button class="btn ${sent ? "undo-sent" : "mark-sent"} small" type="button" ${sent ? `data-undo-sent="${record.id}"` : `data-mark-sent="${record.id}"`}>${icon(sent ? "refresh" : "check", 16)} ${sent ? "Geri Al" : "İstifi Gönder"}</button>
        <button class="btn danger-soft small" type="button" data-delete-record="${record.id}">${icon("trash", 16)} Sil</button>
      </div>
    </article>`;
    })
    .join("");
}

function renderDocuments() {
  const bolmes = [
    ...new Set(state.records.map((row) => row.bolme).filter(Boolean)),
  ].sort((a, b) => String(a).localeCompare(String(b), "tr", { numeric: true }));
  if (state.builderBolme && !bolmes.includes(state.builderBolme)) {
    state.builderBolme = "";
    state.selectedRecordIds.clear();
  }
  const chosen = state.builderBolme
    ? sortedRecords(
        state.records.filter((row) => row.bolme === state.builderBolme),
      )
    : [];
  const selectedCount = chosen.filter((record) =>
    state.selectedRecordIds.has(record.id),
  ).length;
  return `${head("Evrak Oluştur", "Her bölme için ayrı evrak hazırlayın", { action: profileButton() })}
    <div class="segment"><button class="${state.documentTab === "photos" ? "active" : ""}" data-doc-tab="photos">İstif Fotoğrafları</button><button class="${state.documentTab === "documents" ? "active" : ""}" data-doc-tab="documents">Belgeler</button></div>
    <div class="info-note"><b>${icon("info", 21)}</b><span>Önce bölme seçin. Farklı bölmelere ait istifler aynı evraka eklenemez. Sıralama kabuklu, lif, yakacak ve sırık şeklinde otomatik yapılır.</span></div>
    <section class="builder-controls"><div class="select-panel card"><label class="select-row"><span class="round-icon">${icon("layers", 23)}</span><span class="row-copy"><small>Bölme Seç</small><select id="builderBolme" class="embedded-select"><option value="">Bölme seçin</option>${bolmes.map((value) => `<option ${state.builderBolme === value ? "selected" : ""}>${esc(value)}</option>`).join("")}</select></span><span class="chev">${icon("chevron", 22)}</span></label></div></section>
    <div class="section-title"><h2>İstifler</h2><span>${selectedCount} / ${chosen.length} seçildi</span></div>
    <section class="builder-list card">${!state.builderBolme ? '<div class="empty-inline">Evrak oluşturmak için önce bir bölme seçin.</div>' : chosen.length ? chosen.map((record) => `<label class="check-row ${recordTypeClass(record.type)}"><input type="checkbox" data-record-check="${record.id}" ${state.selectedRecordIds.has(record.id) ? "checked" : ""}><span>${icon("logs", 22)}</span><b>${esc(record.istifNo)} • ${esc(record.type)}</b></label>`).join("") : '<div class="empty-inline">Bu bölmede kayıtlı istif bulunamadı.</div>'}</section>
    <div class="dual-actions"><button class="btn" data-action="select-all" ${state.builderBolme ? "" : "disabled"}>${icon("check", 20)} Tümünü Seç</button><button class="btn" data-action="clear-selection">${icon("trash", 20)} Seçimi Temizle</button></div>
    <div class="dual-actions"><button class="btn" data-action="preview-doc" ${state.builderBolme ? "" : "disabled"}>${icon("eye", 20)} Önizle</button><button class="btn primary" data-action="print-doc" ${state.builderBolme ? "" : "disabled"}>${icon("doc", 20)} PDF Oluştur</button></div>
    <button class="btn wide template-link" data-view="templates">Evrak Şablonlarını Gör</button>`;
}

function renderTemplates() {
  const sample = sortedRecords(state.records).slice(0, 3);
  return `${head("Evraklar", "Örnek şablonlar", { back: true, action: profileButton() })}
    <section class="template-card card"><div class="template-title"><span class="round-icon">${icon("pin", 23)}</span><div><h3>Koordinat Evrakı</h3><p>Seçili istiflerden oluşturulan koordinat tablosu</p></div></div>${miniCoordTable(sample)}</section>
    <section class="template-card card"><div class="template-title"><span class="round-icon">${icon("camera", 23)}</span><div><h3>Fotoğraflı İstif Evrakı</h3><p>Her istif için dört fotoğraf tek sayfada</p></div></div><div class="template-photo"><div class="mini-collage">${[1, 2, 3, 4].map(() => '<div class="ph"></div>').join("")}</div><div class="meta-list"><div><span>Şeflik</span><b>${esc(displaySeflik())}</b></div><div><span>İstif</span><b>${esc(sample[0]?.istifNo || "Kayıt seçilmedi")}</b></div><div><span>Tür</span><b>${esc(sample[0]?.type || "Kayıt seçilmedi")}</b></div></div></div></section>
    <section class="template-card card"><div class="template-title"><span class="round-icon">${icon("doc", 23)}</span><div><h3>İstif Cins Listesi</h3><p>Seçili istiflerin cins ve miktar listesi</p></div></div>${miniTypeTable(sample)}</section>
    <div class="dual-actions"><button class="btn" data-action="preview-doc">${icon("eye", 20)} Önizle</button><button class="btn primary" data-action="print-doc">${icon("doc", 20)} PDF Oluştur</button></div>`;
}

function miniCoordTable(rows) {
  return `<table class="mini-table"><thead><tr><th>İstif No</th><th>Koordinat (Enlem, Boylam)</th></tr></thead><tbody>${rows.map((record) => `<tr><td>${esc(record.istifNo)}</td><td>${esc(record.coordinates || "Bekleniyor")}</td></tr>`).join("")}</tbody></table>`;
}

function miniTypeTable(rows) {
  return `<table class="mini-table"><thead><tr><th>İstif No</th><th>İstif Cinsi (Tür)</th></tr></thead><tbody>${rows.map((record) => `<tr><td>${esc(record.istifNo)}</td><td>${esc(record.type)}</td></tr>`).join("")}</tbody></table>`;
}

function renderPhotos() {
  const rows = sortedRecords(state.records);
  return `${head("Fotoğraflar", "İstif fotoğraflarını yönetin", { back: true })}<section class="records">${rows.map((record) => `<article class="photo-record card"><div class="round-icon">${icon("camera", 23)}</div><div><b>${esc(record.istifNo)} • ${esc(record.type)}</b><span>${esc(record.bolme)} Bölme • ${record.photos?.length || record.photoCount || 0}/4 fotoğraf</span></div><button class="btn small" data-view="records">Aç</button></article>`).join("")}</section>`;
}

function driveStatusCopy() {
  if (state.drive.status === "checking")
    return "Drive bağlantısı kontrol ediliyor…";
  if (state.drive.connected)
    return state.drive.isOwner
      ? "Şeflik Drive alanı bağlı ve yönetiminizde."
      : "Şeflik Drive alanı kurucu tarafından bağlandı.";
  if (state.drive.isOwner || currentFolderIsOwner())
    return "Bu şefliğin Drive alanını yalnızca siz bağlayabilirsiniz.";
  return "Şeflik kurucusunun Drive alanını bağlaması bekleniyor.";
}

function renderDriveCard() {
  const isOwner = state.drive.isOwner || currentFolderIsOwner();
  const connected = state.drive.connected;
  return `<section class="drive-card card">
    <div class="drive-card-title"><span>${icon("drive", 24)}</span><div><b>Şeflik Google Drive</b><small>Fotoğraflar ücretsiz sunucuya uğramadan doğrudan ortak Drive alanına yüklenir.</small></div><i class="drive-state ${connected ? "connected" : ""}"></i></div>
    <div class="drive-status-copy">${esc(driveStatusCopy())}</div>
    ${connected ? `<div class="drive-details"><div><span>Şeflik</span><b>${esc(displaySeflik())}</b></div><div><span>Bağlı hesap</span><b>${esc(state.drive.ownerEmail || state.drive.ownerName || "Kurucu hesabı")}</b></div><div><span>Klasör</span><b>${esc(state.drive.folderName || "Mesaha İO - İstif Alma")}</b></div></div>` : ""}
    <div class="drive-actions">
      ${isOwner && !connected ? `<button class="btn primary wide" data-action="connect-drive">${icon("link", 20)} Google Hesabı ile Bağla</button>` : ""}
      ${isOwner && connected ? `<button class="btn primary" data-action="connect-drive">${icon("refresh", 19)} Bağlantıyı Yenile</button><button class="btn danger-soft" data-action="disconnect-drive">Bağlantıyı Kaldır</button>` : ""}
      ${!isOwner && connected ? `<div class="managed-pill">${icon("check", 17)} Kurucu tarafından yönetiliyor</div>` : ""}
    </div>
    <p class="drive-security">Kurucunun Google erişim anahtarı üyelerin telefonlarında tutulmaz. Üyeler yalnızca kendi fotoğrafları için güvenli, tek kullanımlık Drive yükleme oturumu alır.</p>
  </section>`;
}

function renderSettings() {
  const loggedIn = state.auth.status !== "signed_out";
  return `${head("Ayarlar", "Hesap, şeflik ve Drive", { back: true })}
    <section class="account-card card">
      <div class="account-avatar">${state.auth.avatarUrl ? `<img src="${esc(state.auth.avatarUrl)}" alt="">` : icon("user", 27)}</div>
      <div class="account-copy"><small>${loggedIn ? "Google hesabı bağlı" : "Google girişi gerekli"}</small><strong>${esc(state.auth.name || state.auth.email || "Mesaha İO hesabı")}</strong><span>${esc(state.auth.email || authSummary())}</span></div>
      <span class="status-dot ${state.auth.status === "connected" ? "online" : ""}"></span>
    </section>
    <form id="institutionSettingsForm" class="settings-card card">
      <div class="shared-card-title"><span>${icon("doc", 22)}</span><div><b>Kurum ve Evrak Bilgileri</b><small>Bu bilgiler örnek olarak gelmez; kullanıcı tarafından bir kez kaydedilir.</small></div></div>
      <label>Bölge Müdürlüğü<input name="bolgeMudurlugu" value="${esc(state.settings.bolgeMudurlugu || "")}" placeholder="Bölge Müdürlüğü gir" autocomplete="organization"></label>
      <label>İşletme Müdürlüğü<input name="isletmeMudurlugu" value="${esc(state.settings.isletmeMudurlugu || "")}" placeholder="İşletme Müdürlüğü gir"></label>
      <label>Şeflik<select name="seflik">${state.seflikler.map((item) => `<option value="${esc(item.name)}" ${item.name === state.settings.seflik ? "selected" : ""}>${esc(item.name)}${item.role === "owner" ? " • kurucu" : " • üye"}</option>`).join("")}</select></label><p class="settings-hint">Şeflik, personel ve bölme düzenlemeleri yalnızca Mesaha Suite ana menüsünden yapılır.</p>
      <label>Rampa / Satış İstif Yeri<input name="satisIstifYeri" value="${esc(state.settings.satisIstifYeri || "")}" placeholder="Rampa veya depo adı gir"></label>
      <p class="settings-hint">Orijinal boş evrak şablonu esas alınır. Doldurulmuş dosya yalnızca alanların nereye yazılacağını gösteren örnektir.</p>
      <button class="btn primary wide" type="submit">${icon("save", 20)} Bilgileri Kaydet</button>
    </form>
    <section class="shared-card card">
      <div class="shared-card-title"><span>${icon("folder", 22)}</span><div><b>Suite Ortak Veri Bağlantısı</b><small>Şeflik, bölmeler ve kayıt durumu Mesaha Suite tarafından yönetilir.</small></div></div>
      <div class="shared-current"><span>Şeflik</span><b>${esc(displaySeflik())}</b></div>
      <button class="btn wide" data-action="refresh-shared">${icon("refresh", 20)} Ortak Bilgileri Güncelle</button>
      ${loggedIn ? "" : '<a class="btn primary wide login-link" href="../">Mesaha İO’da Google ile Giriş Yap</a>'}
    </section>
    ${renderDriveCard()}
    <div class="info-note"><b>${icon("info", 21)}</b><span>Sürüm ${APP_VERSION} • Kayıtlar offline saklanır. İstif, fotoğraf ve evrak verileri bu uygulamaya özeldir.</span></div>`;
}

function bindDynamic() {
  app.querySelectorAll("[data-view]").forEach((button) => {
    button.onclick = () => setView(button.dataset.view);
  });
  app
    .querySelector("#institutionSettingsForm")
    ?.addEventListener("submit", saveInstitutionSettings);
  app.querySelectorAll('[data-action="back"]').forEach((button) => {
    button.onclick = () => setView("home");
  });
  app.querySelector('[data-action="sync"]')?.addEventListener("click", syncAll);
  app
    .querySelector('[data-action="geo"]')
    ?.addEventListener("click", getLocation);
  app
    .querySelector('[data-action="account"]')
    ?.addEventListener("click", showAccountDialog);
  app
    .querySelector('[data-action="pick-seflik"]')
    ?.addEventListener("click", showSeflikPicker);
  app
    .querySelector('[data-action="pick-ormanci"]')
    ?.addEventListener("click", showOrmanciPicker);
  // Personel kimliği Suite ana menüsünden otomatik uygulanır.
  app
    .querySelector('[data-action="connect-drive"]')
    ?.addEventListener("click", beginDriveConnection);
  app
    .querySelector('[data-action="disconnect-drive"]')
    ?.addEventListener("click", disconnectDrive);
  app
    .querySelector('[data-action="refresh-shared"]')
    ?.addEventListener("click", () => syncSharedContext({ manual: true }));
  app.querySelectorAll("[data-add-photo]").forEach((button) => {
    button.onclick = openCameraChooser;
  });
  app.querySelectorAll("[data-remove-photo]").forEach((button) => {
    button.onclick = () => removePhoto(Number(button.dataset.removePhoto));
  });
  app.querySelector("#stackForm")?.addEventListener("input", (event) => {
    if (!event.target.name) return;
    const draft = ensureDraft();
    draft[event.target.name] = clean(event.target.value);
    if (event.target.name === "bolme") rememberLastBolme(draft.bolme);
    if (event.target.name === "seflik") {
      const folder = state.seflikler.find(
        (item) => item.name === event.target.value,
      );
      draft.seflikKey = folder?.key || stableKey(event.target.value);
    }
  });
  app.querySelector("#stackForm")?.addEventListener("change", (event) => {
    if (!event.target.name) return;
    const draft = ensureDraft();
    draft[event.target.name] = clean(event.target.value);
    if (event.target.name === "bolme") {
      rememberLastBolme(draft.bolme);
      return;
    }
    if (event.target.name === "seflik") {
      state.settings.seflik = event.target.value;
      state.settings.seflikKey =
        state.seflikler.find((item) => item.name === event.target.value)?.key ||
        stableKey(event.target.value);
      refreshCurrentMembers();
      draft.ormanci = state.settings.ormanci;
      draft.bolme = preferredBolme();
      render();
    }
  });
  app.querySelector("#stackForm")?.addEventListener("submit", saveRecord);
  app
    .querySelector('[data-action="save-draft"]')
    ?.addEventListener("click", (event) => saveRecord(event, true));
  ["filterDate", "filterBolme", "filterType"].forEach((id) =>
    app.querySelector(`#${id}`)?.addEventListener("change", applyRecordFilters),
  );
  app.querySelectorAll("[data-doc-tab]").forEach((button) => {
    button.onclick = () => {
      state.documentTab = button.dataset.docTab;
      render();
    };
  });
  app.querySelector("#builderBolme")?.addEventListener("change", (event) => {
    state.builderBolme = event.target.value;
    state.selectedRecordIds.clear();
    render();
  });
  app.querySelectorAll("[data-record-check]").forEach((checkbox) => {
    checkbox.onchange = () => {
      const record = state.records.find(
        (item) => item.id === checkbox.dataset.recordCheck,
      );
      if (
        !record ||
        !state.builderBolme ||
        record.bolme !== state.builderBolme
      ) {
        checkbox.checked = false;
        return toast("Farklı bölmedeki istif aynı evraka eklenemez.", "bad");
      }
      checkbox.checked
        ? state.selectedRecordIds.add(checkbox.dataset.recordCheck)
        : state.selectedRecordIds.delete(checkbox.dataset.recordCheck);
      render();
    };
  });
  app
    .querySelector('[data-action="select-all"]')
    ?.addEventListener("click", () => {
      if (!state.builderBolme) return toast("Önce bölme seçin.", "bad");
      state.records
        .filter((row) => row.bolme === state.builderBolme)
        .forEach((row) => state.selectedRecordIds.add(row.id));
      render();
    });
  app
    .querySelector('[data-action="clear-selection"]')
    ?.addEventListener("click", () => {
      state.selectedRecordIds.clear();
      render();
    });
  app.querySelectorAll('[data-action="preview-doc"]').forEach((button) => {
    button.onclick = previewDocuments;
  });
  app.querySelectorAll('[data-action="print-doc"]').forEach((button) => {
    button.onclick = printDocuments;
  });
  app.querySelectorAll("[data-edit-record]").forEach((button) => {
    button.onclick = () => editRecord(button.dataset.editRecord);
  });
  app.querySelectorAll("[data-delete-record]").forEach((button) => {
    button.onclick = () => deleteRecord(button.dataset.deleteRecord);
  });
  app.querySelectorAll("[data-mark-sent]").forEach((button) => {
    button.onclick = () => setRecordSent(button.dataset.markSent, true);
  });
  app.querySelectorAll("[data-undo-sent]").forEach((button) => {
    button.onclick = () => setRecordSent(button.dataset.undoSent, false);
  });
  loadRemoteThumbnails();
}

async function saveInstitutionSettings(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const bolgeMudurlugu = clean(data.get("bolgeMudurlugu"));
  const isletmeMudurlugu = clean(data.get("isletmeMudurlugu"));
  const seflik = clean(data.get("seflik"));
  const satisIstifYeri = clean(data.get("satisIstifYeri"));
  if (!bolgeMudurlugu || !isletmeMudurlugu || !seflik || !satisIstifYeri) {
    toast(
      "Bölge, işletme, şeflik ve rampa alanlarının tamamını doldurun.",
      "bad",
    );
    return;
  }
  const folder = state.seflikler.find((item) =>
    sameSeflikLabel(item.name, seflik),
  );
  if (!folder) {
    toast("Şeflik yalnızca Mesaha Suite listesinden seçilebilir.", "bad");
    return;
  }
  state.settings = {
    ...state.settings,
    bolgeMudurlugu,
    isletmeMudurlugu,
    seflik: folder.name,
    seflikKey: folder.key,
    satisIstifYeri,
    setupComplete: true,
  };
  if (state.draft) {
    state.draft.seflik = state.settings.seflik;
    state.draft.seflikKey = state.settings.seflikKey;
  }
  refreshCurrentMembers();
  await saveSettings();
  await saveSharedCache();
  toast("Kurum ve evrak bilgileri kaydedildi.", "good");
  if (navigator.onLine && hasSharedCloudIdentity())
    syncSharedContext({ manual: false });
  render();
}

async function editRecord(recordId) {
  const record = state.records.find((item) => item.id === recordId);
  if (!record) return toast("Düzenlenecek istif bulunamadı.", "bad");
  state.draft = structuredClone(record);
  state.draft.syncStatus = "local";
  state.draft.updatedAt = new Date().toISOString();
  state.selectedPhotos = Array.isArray(record.photos)
    ? record.photos
        .map((photo) => ({
          blob: photo.blob,
          name: photo.name || `foto_${Date.now()}.jpg`,
          type: photo.type || (photo.blob && photo.blob.type) || "image/jpeg",
          size: photo.size || (photo.blob && photo.blob.size) || 0,
        }))
        .filter((photo) => photo.blob)
    : [];
  setView("new");
  const remoteFiles = Array.isArray(record.driveFiles) ? record.driveFiles : [];
  const expectedCount = Math.min(
    4,
    Math.max(Number(record.photoCount || 0), remoteFiles.length),
  );
  if (
    expectedCount > state.selectedPhotos.length &&
    remoteFiles.length &&
    navigator.onLine !== false &&
    readSharedSession()
  ) {
    toast("Drive fotoğrafları düzenleme ekranına getiriliyor…");
    try {
      const loaded = await hydrateDrivePhotosForEdit(record);
      if (loaded) {
        if (state.draft?.id === record.id)
          state.draft.photos = state.selectedPhotos.map((photo) => ({
            ...photo,
          }));
        render();
        toast(`${loaded} fotoğraf Drive’dan getirildi.`, "good");
      }
    } catch (error) {
      toast(
        `Drive fotoğrafları getirilemedi: ${clean(error?.message || error)}`,
        "bad",
      );
    }
  }
}

function driveFileIdsFromRecord(record) {
  const ids = [];
  const add = (value) => {
    const id = clean(value);
    if (id && !ids.includes(id)) ids.push(id);
  };
  (Array.isArray(record?.driveFiles) ? record.driveFiles : []).forEach(
    (file) => {
      if (typeof file === "string") add(file);
      else add(file?.id || file?.fileId || file?.file_id);
    },
  );
  return ids;
}

function recordHasDriveAssets(record) {
  return !!(
    clean(record?.driveFolderId) || driveFileIdsFromRecord(record).length
  );
}

async function deleteDriveFilesForRecord(record) {
  const fileIds = driveFileIdsFromRecord(record);
  const driveFolderId = clean(record.driveFolderId);
  if (!fileIds.length && !driveFolderId) return { ok: true, skipped: true };
  return bridgeCall("delete_drive_files", {
    seflikKey: record.seflikKey || stableKey(record.seflik),
    seflik: record.seflik,
    recordId: record.id,
    istifNo: record.istifNo,
    bolmeNo: record.bolme,
    fileIds,
    driveFolderId,
  });
}

async function deleteRecord(recordId) {
  const record = state.records.find((item) => item.id === recordId);
  if (!record) return toast("Silinecek istif bulunamadı.", "bad");
  const hasDriveAssets = recordHasDriveAssets(record);
  const ok = confirm(`${record.istifNo || "Bu istif"} silinsin mi?

Yerel kayıt, Supabase kaydı ve varsa Drive fotoğrafları silinir.`);
  if (!ok) return;
  if (hasDriveAssets && (!navigator.onLine || !hasSharedCloudIdentity())) {
    toast(
      "Drive fotoğrafı olan istifi silmek için internet ve Google girişi gerekli. Yerel kayıt silinmedi.",
      "bad",
    );
    return;
  }
  showDialog(
    '<h3>İstif Siliniyor</h3><p>Drive fotoğrafları ve kayıt bilgileri temizleniyor. Lütfen bekleyin.</p><div class="progress"><span style="width:55%"></span></div>',
  );
  try {
    if (hasDriveAssets) await deleteDriveFilesForRecord(record);
    if (navigator.onLine && hasSharedCloudIdentity() && !record.isDemo) {
      try {
        await supabaseDeleteRecord(record);
      } catch (error) {
        console.warn("Supabase istif silme uyarısı", error);
      }
    }
    await idbDelete("records", record.id);
    state.records = state.records.filter((item) => item.id !== record.id);
    state.selectedRecordIds.delete(record.id);
    closeDialog();
    toast(
      hasDriveAssets
        ? "İstif ve Drive fotoğrafları silindi."
        : "İstif silindi.",
      "good",
    );
    render();
  } catch (error) {
    closeDialog();
    toast(
      `İstif silinemedi: ${clean(error?.message || error)}. Yerel kayıt silinmedi.`,
      "bad",
    );
  }
}

async function supabaseDeleteRecord(record) {
  const session = await ensureSharedSession();
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/mesaha_istif_records?id=eq.${encodeURIComponent(record.id)}`,
    {
      method: "DELETE",
      cache: "no-store",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
        Prefer: "return=minimal",
      },
    },
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `Supabase silme hatası ${response.status}`,
    );
  }
}

function applyRecordFilters() {
  const date = app.querySelector("#filterDate")?.value || "";
  const bolme = app.querySelector("#filterBolme")?.value || "";
  const type = app.querySelector("#filterType")?.value || "";
  const rows = sortedRecords(
    state.records.filter(
      (record) =>
        (!date || record.date === date) &&
        (!bolme || record.bolme === bolme) &&
        (!type || record.type.startsWith(type)),
    ),
  );
  app.querySelector("#recordList").innerHTML = recordCards(rows);
}

async function saveRecord(event, draftOnly = false) {
  event?.preventDefault?.();
  if (state.savingRecord) return;
  state.savingRecord = true;
  const form = event?.currentTarget instanceof HTMLFormElement
    ? event.currentTarget
    : app.querySelector("#stackForm");
  const submitButtons = form ? Array.from(form.querySelectorAll('button[type="submit"], [data-action="save-draft"]')) : [];
  submitButtons.forEach((button) => (button.disabled = true));
  const draft = syncDraftFromForm(form);
  try {
  if (!state.settings.setupComplete) {
    toast(
      "Önce Ayarlar bölümünden kurum ve evrak bilgilerini kaydedin.",
      "bad",
    );
    setView("settings");
    return;
  }
  if (!draft.seflik || !draft.ormanci) {
    toast("Şeflik ve kullanıcı kimliği Mesaha Suite ana menüsünden alınamadı.", "bad");
    return;
  }
  if (
    !draftOnly &&
    (!clean(draft.bolme) || !clean(draft.istifNo) || !clean(draft.ster))
  ) {
    toast("Bölme, istif numarası ve ster sayısı zorunludur.", "bad");
    return;
  }
  const suiteReadyBolmeler = currentSuiteReadyBolmeler();
  if (
    !draftOnly &&
    suiteReadyBolmeler.length &&
    !suiteReadyBolmeler.includes(draft.bolme)
  ) {
    toast(
      "Bu bölme Suite ana menüsünde offline indirilmeden ster kaydı eklenemez.",
      "bad",
    );
    return;
  }
  if (!draftOnly && !suiteReadyBolmeler.length) {
    toast(
      "Önce Suite ana menüsünde en az bir bölmeyi oluşturup Offline İndir yapın.",
      "bad",
    );
    return;
  }
  draft.bolme = clean(draft.bolme);
  draft.istifNo = clean(draft.istifNo);
  draft.ster = clean(draft.ster);
  rememberLastBolme(draft.bolme);
  draft.photos = state.selectedPhotos.map((photo) => ({
    name: photo.name,
    type: photo.type,
    size: photo.size,
    blob: photo.blob,
  }));
  draft.photoCount = draft.photos.length;
  draft.seflikKey =
    (state.settings.seflik && draft.seflik === state.settings.seflik
      ? state.settings.seflikKey
      : "") ||
    draft.seflikKey ||
    stableKey(draft.seflik);
  draft.syncStatus = "local";
  draft.updatedAt = new Date().toISOString();
  const demoRows = state.records.filter((record) => record.isDemo);
  if (demoRows.length && demoRows.length === state.records.length) {
    for (const demo of demoRows) await idbDelete("records", demo.id);
    state.records = [];
  }
  await idbPut("records", structuredClone(draft));
  const index = state.records.findIndex((record) => record.id === draft.id);
  if (index >= 0) state.records[index] = structuredClone(draft);
  else state.records.push(structuredClone(draft));
  toast(
    draftOnly
      ? "Taslak yerelde kaydedildi."
      : "İstif offline olarak kaydedildi.",
    "good",
  );
  state.draft = null;
  state.selectedPhotos = [];
  setView("records");
  } catch (error) {
    console.error("İstif kayıt hatası", error);
    toast(`Kayıt tamamlanamadı: ${clean(error?.message || error)}`, "bad");
  } finally {
    state.savingRecord = false;
    submitButtons.forEach((button) => (button.disabled = false));
  }
}

function removePhoto(index) {
  state.selectedPhotos.splice(index, 1);
  render();
}

function openCameraChooser() {
  if (state.selectedPhotos.length >= 4) {
    toast("En fazla 4 fotoğraf eklenebilir.", "bad");
    return;
  }
  openCamera().catch(() => picker.click());
}

async function openCamera() {
  if (!navigator.mediaDevices?.getUserMedia)
    throw new Error("Kamera desteklenmiyor");
  stopCamera();
  state.cameraStream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: state.facingMode },
      width: { ideal: 1600 },
      height: { ideal: 1200 },
    },
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
  const canvas = document.createElement("canvas");
  canvas.width = cameraVideo.videoWidth;
  canvas.height = cameraVideo.videoHeight;
  canvas.getContext("2d").drawImage(cameraVideo, 0, 0);
  const blob = await compressCanvas(canvas, MAX_PHOTO_BYTES);
  addPhotoBlob(blob, `istif_${Date.now()}.jpg`);
  stopCamera();
  render();
  toast("Fotoğraf sıkıştırıldı ve uygulamaya eklendi.", "good");
}

async function compressCanvas(canvas, maxBytes) {
  const maxDimension = 1600;
  const scale = Math.min(
    1,
    maxDimension / Math.max(canvas.width, canvas.height),
  );
  let work = document.createElement("canvas");
  work.width = Math.round(canvas.width * scale);
  work.height = Math.round(canvas.height * scale);
  work
    .getContext("2d", { alpha: false })
    .drawImage(canvas, 0, 0, work.width, work.height);
  let quality = 0.84;
  let blob;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    blob = await new Promise((resolve) =>
      work.toBlob(resolve, "image/jpeg", quality),
    );
    if (blob && blob.size <= maxBytes) return blob;
    if (quality > 0.48) quality -= 0.08;
    else {
      const next = document.createElement("canvas");
      next.width = Math.round(work.width * 0.84);
      next.height = Math.round(work.height * 0.84);
      next
        .getContext("2d", { alpha: false })
        .drawImage(work, 0, 0, next.width, next.height);
      work = next;
      quality = 0.72;
    }
  }
  return blob;
}

async function compressFile(file) {
  const image = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext("2d").drawImage(image, 0, 0);
  image.close?.();
  return compressCanvas(canvas, MAX_PHOTO_BYTES);
}

function addPhotoBlob(blob, name) {
  if (state.selectedPhotos.length >= 4) return;
  state.selectedPhotos.push({
    blob,
    name,
    type: "image/jpeg",
    size: blob.size,
  });
}

async function pickerChanged() {
  for (const file of [...picker.files]) {
    if (state.selectedPhotos.length >= 4) break;
    try {
      const blob = await compressFile(file);
      addPhotoBlob(blob, file.name.replace(/\.[^.]+$/, ".jpg"));
    } catch {
      toast("Fotoğraf işlenemedi.", "bad");
    }
  }
  picker.value = "";
  render();
}

function getLocation() {
  if (!navigator.geolocation) {
    toast("Konum özelliği desteklenmiyor.", "bad");
    return;
  }
  toast("Mevcut koordinat alınıyor...");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      ensureDraft().coordinates = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
      render();
      toast(
        `Koordinat eklendi • ±${Math.round(position.coords.accuracy)} m`,
        "good",
      );
    },
    () => toast("Konum alınamadı. GPS ve izinleri kontrol edin.", "bad"),
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    },
  );
}

function toast(message, type = "") {
  if (shouldPlayConfirmSound(message, type)) playConfirmSound(false);
  document.querySelector(".toast")?.remove();
  const element = document.createElement("div");
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
  dialogContent.innerHTML = "";
}

function showAccountDialog() {
  const signedIn = state.auth.status !== "signed_out";
  showDialog(
    `<div class="dialog-profile"><div class="account-avatar large">${state.auth.avatarUrl ? `<img src="${esc(state.auth.avatarUrl)}" alt="">` : icon("user", 30)}</div><h3>${esc(state.auth.name || "Mesaha İO Hesabı")}</h3><p>${esc(state.auth.email || authSummary())}</p></div><div class="dialog-actions"><button class="btn" data-dialog-close>Kapat</button>${signedIn ? '<button class="btn primary" id="dialogSharedRefresh">Bilgileri Güncelle</button>' : '<a class="btn primary" href="../">Google ile Giriş Yap</a>'}</div>`,
  );
  document
    .getElementById("dialogSharedRefresh")
    ?.addEventListener("click", () => {
      closeDialog();
      syncSharedContext({ manual: true });
    });
}

function showSeflikPicker() {
  if (!state.seflikler.length) {
    showDialog(
      `<h3>Şeflik bulunamadı</h3><p>Mesaha İO’da Google hesabıyla giriş yapıp Şeflik Klasörü oluşturun veya üye olduğunuz şefliği senkronize edin.</p><div class="dialog-actions"><button class="btn" data-dialog-close>Kapat</button><button class="btn primary" id="refreshFoldersDialog">Güncelle</button></div>`,
    );
    document.getElementById("refreshFoldersDialog").onclick = () => {
      closeDialog();
      syncSharedContext({ manual: true });
    };
    return;
  }
  showDialog(
    `<h3>Şeflik Seç</h3><p>Mesaha İO Şeflik Klasörü ile ortak liste.</p><div class="picker-list">${state.seflikler.map((folder, index) => `<button class="picker-row ${folder.name === state.settings.seflik ? "selected" : ""}" data-folder-index="${index}"><span class="picker-icon">${icon("forest", 21)}</span><span><b>${esc(folder.name)}</b><small>${folder.role === "owner" ? "Kurucu" : "Üye"}</small></span>${folder.name === state.settings.seflik ? icon("check", 21) : icon("chevron", 20)}</button>`).join("")}</div><div class="dialog-actions single"><button class="btn" data-dialog-close>Kapat</button></div>`,
  );
  dialogContent.querySelectorAll("[data-folder-index]").forEach((button) => {
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
      jsonWrite(SHARED_ACTIVE_SEFLIK_KEY, {
        seflik: folder.name,
        seflik_key: folder.key,
        updatedAt: new Date().toISOString(),
      });
      await saveSettings();
      await refreshDriveStatus({ silent: true });
      closeDialog();
      render();
    };
  });
}

function showOrmanciPicker() {
  refreshCurrentMembers();
  if (!state.ormancilar.length) {
    showDialog(
      `<h3>Ormancı bulunamadı</h3><p>Bu şefliğe Suite ana menüsünden eklenen ormancılar otomatik gelir.</p><div class="dialog-actions"><button class="btn" data-dialog-close>Kapat</button><button class="btn primary" id="refreshMembersDialog">Güncelle</button></div>`,
    );
    document.getElementById("refreshMembersDialog").onclick = () => {
      closeDialog();
      syncSharedContext({ manual: true });
    };
    return;
  }
  showDialog(
    `<h3>Ormancı Seç</h3><p>${esc(displaySeflik())} için kayıtlı ormancılar.</p><div class="picker-list">${state.ormancilar.map((member, index) => `<button class="picker-row ${member.name === state.settings.ormanci ? "selected" : ""}" data-member-index="${index}"><span class="picker-avatar">${member.avatarUrl ? `<img src="${esc(member.avatarUrl)}" alt="">` : icon("user", 20)}</span><span><b>${esc(member.name)}</b><small>${member.role === "owner" ? "Şeflik kurucusu" : member.custom ? (member.pending ? "Yeni ormancı • senkron bekliyor" : "Ekli ormancı") : "Şeflik üyesi"}</small></span>${member.name === state.settings.ormanci ? icon("check", 21) : icon("chevron", 20)}</button>`).join("")}</div><div class="dialog-actions single"><button class="btn" data-dialog-close>Kapat</button></div>`,
  );
  dialogContent.querySelectorAll("[data-member-index]").forEach((button) => {
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

function showAddOrmanciDialog() {
  showDialog(
    '<h3>Suite üzerinden yönetin</h3><p>Ormancı ekleme ve çıkarma işlemleri İstif İO içinden kaldırıldı. Mesaha Suite ana menüsündeki Ormancı Yönetimi bölümünü kullanın.</p><div class="dialog-actions"><button class="btn" data-dialog-close>Kapat</button><a class="btn primary" href="../">Suite Ana Menüsü</a></div>',
  );
}

function debounce(fn, ms = 250) {
  let timer = 0;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

async function searchForesterSuggestions() {
  return;
}

async function addForesterUser() {
  throw new Error("Ormancı yönetimi yalnızca Mesaha Suite üzerinden yapılır.");
}

async function removeForesterUser() {
  throw new Error("Ormancı yönetimi yalnızca Mesaha Suite üzerinden yapılır.");
}

async function beginDriveConnection() {
  if (!(state.drive.isOwner || currentFolderIsOwner())) {
    toast("Drive bağlantısını yalnızca şeflik kurucusu yapabilir.", "bad");
    return;
  }
  if (!navigator.onLine)
    return toast("Drive bağlantısı için internet gerekli.", "bad");
  try {
    const redirectUri = DRIVE_REDIRECT_URI;
    const out = await bridgeCall("oauth_start", {
      seflikKey: state.settings.seflikKey,
      seflik: state.settings.seflik,
      redirectUri,
    });
    if (!out.authorizationUrl)
      throw new Error("Google bağlantı adresi hazırlanamadı.");
    location.assign(out.authorizationUrl);
  } catch (error) {
    toast(clean(error?.message || error), "bad");
  }
}

async function handleDriveOAuthCallback() {
  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  const oauthState = params.get("state");
  const oauthError = params.get("error");
  if (!code && !oauthError) return false;
  state.view = "settings";
  const cleanUrl = DRIVE_REDIRECT_URI;
  history.replaceState({}, "", cleanUrl);
  if (oauthError) {
    toast(`Google Drive bağlantısı iptal edildi: ${oauthError}`, "bad");
    return true;
  }
  try {
    showDialog(
      '<h3>Google Drive Bağlanıyor</h3><p>Şeflik klasörü hazırlanıyor. Bu ekranı kapatmayın.</p><div class="progress"><span style="width:65%"></span></div>',
    );
    await bridgeCall("oauth_finish", {
      code,
      state: oauthState,
      redirectUri: cleanUrl,
    });
    await refreshDriveStatus({ silent: false });
    closeDialog();
    render();
    toast("Şeflik Google Drive alanı bağlandı.", "good");
  } catch (error) {
    closeDialog();
    toast(`Drive bağlanamadı: ${clean(error?.message || error)}`, "bad");
  }
  return true;
}

async function disconnectDrive() {
  if (
    !confirm(
      "Şeflik Drive bağlantısı kaldırılacak. Mevcut Drive dosyaları silinmez; yeni fotoğraf yüklemeleri durur. Devam edilsin mi?",
    )
  )
    return;
  try {
    await bridgeCall("disconnect", {
      seflikKey: state.settings.seflikKey,
      seflik: state.settings.seflik,
    });
    state.drive = {
      ...state.drive,
      connected: false,
      status: "ready",
      folderId: "",
      folderName: "",
      folderUrl: "",
      ownerEmail: "",
      error: "",
    };
    await saveSharedCache();
    render();
    toast("Drive bağlantısı kaldırıldı.", "good");
  } catch (error) {
    toast(clean(error?.message || error), "bad");
  }
}

function effectiveRecordSeflik(record) {
  const currentName = clean(state.settings.seflik);
  const currentKey = clean(state.settings.seflikKey);
  const recordName = clean(record.seflik);
  const same =
    currentName &&
    recordName &&
    stableKey(currentName.replace(/\s*Şefliği$/i, "")) ===
      stableKey(recordName.replace(/\s*Şefliği$/i, ""));
  return {
    seflik: same ? currentName : recordName || currentName,
    seflikKey: same
      ? currentKey || record.seflikKey || stableKey(currentName)
      : record.seflikKey || currentKey || stableKey(recordName || currentName),
  };
}

async function createDriveUploadSession(record, photo, index) {
  const folder = effectiveRecordSeflik(record);
  return bridgeCall("upload_session", {
    seflikKey: folder.seflikKey,
    seflik: folder.seflik,
    recordDate: record.date,
    bolmeNo: record.bolme,
    istifNo: record.istifNo,
    fileName: `${record.istifNo}_foto_${index + 1}.jpg`,
    mimeType: photo.blob.type || "image/jpeg",
    size: photo.blob.size,
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () =>
      reject(reader.error || new Error("Fotoğraf okunamadı"));
    reader.readAsDataURL(blob);
  });
}

async function uploadPhotoToDrive(record, photo, index) {
  if (!photo?.blob) throw new Error("Yüklenecek fotoğraf bulunamadı.");
  const folder = effectiveRecordSeflik(record);
  const dataUrl = await blobToDataUrl(photo.blob);
  return bridgeCall("upload_photo", {
    seflikKey: folder.seflikKey,
    seflik: folder.seflik,
    recordDate: record.date,
    bolmeNo: record.bolme,
    istifNo: record.istifNo,
    fileName: `${record.istifNo}_foto_${index + 1}.jpg`,
    mimeType: photo.blob.type || "image/jpeg",
    size: photo.blob.size,
    dataUrl,
  });
}

function normalizeRemoteRecord(row) {
  const id = clean(row.id || row.record_id);
  if (!id) return null;
  const driveFiles = Array.isArray(row.drive_files)
    ? row.drive_files
    : Array.isArray(row.driveFiles)
      ? row.driveFiles
      : [];
  return {
    id,
    userId: clean(row.user_id || row.userId),
    seflikKey: clean(row.seflik_key || row.seflikKey),
    seflik: clean(row.seflik || row.folder_seflik || state.settings.seflik),
    ormanci: clean(row.ormanci || row.forester || row.forester_name),
    date: clean(row.record_date || row.date || today()),
    bolme: clean(row.bolme_no || row.bolme || row.bolmeNo),
    istifNo: clean(row.istif_no || row.istifNo),
    type: clean(row.wood_type || row.type || "İbreli Kabuklu Kağıtlık Odun"),
    ster: clean(row.ster || row.miktar || row.quantity),
    coordinates: clean(row.coordinates || row.coordinate || row.kordinat),
    mevki: clean(row.mevki || row.location_note),
    description: clean(row.description || row.aciklama),
    barcode: clean(row.barcode_no || row.barcode),
    photos: [],
    photoCount: Number(row.photo_count || driveFiles.length || 0) || 0,
    driveFolderId: clean(row.drive_folder_id || row.driveFolderId),
    driveFiles,
    syncStatus: "synced",
    isSent: row.is_sent === true || row.isSent === true,
    sentAt: clean(row.sent_at || row.sentAt),
    sentBy: clean(row.sent_by || row.sentBy),
    createdAt: clean(
      row.created_at || row.createdAt || new Date().toISOString(),
    ),
    updatedAt: clean(row.updated_at || row.updatedAt || ""),
    remoteOnly: true,
  };
}

async function mergeRemoteRecords(remoteRows = []) {
  const remote = remoteRows.map(normalizeRemoteRecord).filter(Boolean);
  if (!remote.length) return 0;
  const local = await idbGetAll("records");
  const localById = new Map(local.map((record) => [record.id, record]));
  let changed = 0;
  for (const remoteRecord of remote) {
    const localRecord = localById.get(remoteRecord.id);
    const localPending =
      localRecord &&
      !localRecord.isDemo &&
      localRecord.syncStatus &&
      localRecord.syncStatus !== "synced";
    if (localPending) continue;
    const merged = {
      ...(localRecord || {}),
      ...remoteRecord,
      photos:
        Array.isArray(localRecord?.photos) && localRecord.photos.length
          ? localRecord.photos
          : [],
      photoCount: Math.max(
        Number(remoteRecord.photoCount || 0),
        Number(localRecord?.photoCount || 0),
        Array.isArray(localRecord?.photos) ? localRecord.photos.length : 0,
      ),
      driveFiles:
        Array.isArray(remoteRecord.driveFiles) && remoteRecord.driveFiles.length
          ? remoteRecord.driveFiles
          : localRecord?.driveFiles || [],
      syncStatus: "synced",
      remoteOnly:
        !localRecord ||
        !(Array.isArray(localRecord.photos) && localRecord.photos.length),
    };
    await idbPut("records", merged);
    localById.set(merged.id, merged);
    changed += 1;
  }
  state.records = await idbGetAll("records");
  return changed;
}

async function loadRemoteRecords({ silent = true } = {}) {
  if (
    navigator.onLine === false ||
    !hasSharedCloudIdentity() ||
    !state.settings.seflik
  )
    return 0;
  try {
    const out = await bridgeCall("record_list", {
      seflikKey: state.settings.seflikKey,
      seflik: state.settings.seflik,
    });
    const count = await mergeRemoteRecords(
      Array.isArray(out.records) ? out.records : [],
    );
    if (!silent && count)
      toast(`${count} ortak istif kaydı güncellendi.`, "good");
    return count;
  } catch (error) {
    if (!silent)
      toast(
        `Ortak istifler alınamadı: ${clean(error?.message || error)}`,
        "bad",
      );
    return 0;
  }
}

async function supabaseUpsertRecord(record) {
  const session = await ensureSharedSession();
  const body = {
    id: String(record.id),
    user_id: String(session.user?.id || state.auth.userId),
    seflik_key: effectiveRecordSeflik(record).seflikKey,
    seflik: effectiveRecordSeflik(record).seflik,
    ormanci: record.ormanci,
    record_date: record.date,
    bolme_no: record.bolme,
    istif_no: record.istifNo,
    wood_type: record.type,
    ster: Number(String(record.ster || 0).replace(",", ".")) || 0,
    coordinates: record.coordinates || null,
    mevki: record.mevki || null,
    description: record.description || null,
    barcode_no: record.barcode || null,
    photo_count: record.photos?.length || record.photoCount || 0,
    drive_folder_id: record.driveFolderId || null,
    drive_files: record.driveFiles || [],
    sync_status: "synced",
    is_sent: recordSent(record),
    sent_at: recordSent(record) && record.sentAt ? record.sentAt : null,
    created_at: record.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (!body.user_id) throw new Error("Google kullanıcı kimliği bulunamadı.");
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/mesaha_istif_records?on_conflict=id`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || error.hint || `Supabase kayıt hatası ${response.status}`,
    );
  }
}

async function syncAll() {
  const suiteApi = suiteSyncApi();
  if (suiteApi) {
    try {
      await suiteApi.syncAll({ source: "istif" });
      state.records = await idbGetAll("records");
      render();
    } catch (error) {
      toast(clean(error?.message || error), "bad");
    }
    return;
  }
  toast("Senkronizasyon Mesaha Suite ana menüsünden yönetilir.", "bad");
}

function selectedForDocs() {
  if (!state.builderBolme) return [];
  const rows = state.records.filter(
    (record) =>
      state.selectedRecordIds.has(record.id) &&
      record.bolme === state.builderBolme,
  );
  return sortedRecords(rows);
}

async function photoDataUrl(photo) {
  if (!photo?.blob) return "";
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(photo.blob);
  });
}

async function drivePhotoDataUrl(record, index = 0) {
  const localPhoto = Array.isArray(record.photos) ? record.photos[index] : null;
  if (localPhoto?.blob) return photoDataUrl(localPhoto);
  const file = driveFileForRecord(record, index);
  const fileId = driveFileId(file);
  if (!fileId) return "";
  const cacheKey = driveFileCacheKey(file);
  if (cacheKey && state.remotePhotoCache[cacheKey])
    return state.remotePhotoCache[cacheKey];
  const folder = effectiveRecordSeflik(record);
  const out = await bridgeCall("photo_data", {
    seflikKey: folder.seflikKey,
    seflik: folder.seflik,
    fileId,
    mimeType: file?.mimeType || file?.mime_type || "image/jpeg",
  });
  const dataUrl = clean(out.dataUrl || out.data_url);
  if (dataUrl && cacheKey) state.remotePhotoCache[cacheKey] = dataUrl;
  return dataUrl;
}

function dataUrlToBlob(dataUrl, fallbackType = "image/jpeg") {
  const value = clean(dataUrl);
  if (!value || !value.includes(","))
    throw new Error("Drive fotoğraf verisi okunamadı.");
  const [meta, b64] = value.split(",", 2);
  const mime = clean((meta.match(/data:([^;]+)/) || [])[1]) || fallbackType;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function hydrateDrivePhotosForEdit(record) {
  const files = Array.isArray(record?.driveFiles)
    ? record.driveFiles.slice(0, 4)
    : [];
  if (!files.length) return 0;
  let loaded = 0;
  const nextPhotos = [...state.selectedPhotos];
  for (let index = 0; index < files.length && index < 4; index += 1) {
    if (nextPhotos[index]?.blob) continue;
    try {
      const file = files[index];
      const dataUrl = await drivePhotoDataUrl(record, index);
      if (!dataUrl) continue;
      const mimeType = file?.mimeType || file?.mime_type || "image/jpeg";
      const blob = dataUrlToBlob(dataUrl, mimeType);
      nextPhotos[index] = {
        blob,
        name:
          file?.name ||
          file?.fileName ||
          `${record.istifNo || "istif"}_foto_${index + 1}.jpg`,
        type: blob.type || mimeType,
        size: blob.size,
        fromDrive: true,
        driveFileId: driveFileId(file),
      };
      loaded += 1;
    } catch (error) {
      console.warn(
        "Drive fotoğrafı düzenleme için alınamadı",
        index + 1,
        error,
      );
    }
  }
  state.selectedPhotos = nextPhotos.filter((photo) => photo?.blob).slice(0, 4);
  return loaded;
}

async function loadRemoteThumbnails() {
  const nodes = Array.from(app.querySelectorAll("[data-record-thumb]"));
  if (!nodes.length || navigator.onLine === false || !hasSharedCloudIdentity())
    return;
  for (const node of nodes.slice(0, 12)) {
    const record = state.records.find(
      (item) => item.id === node.dataset.recordThumb,
    );
    if (!record) continue;
    const file = driveFileForRecord(record, 0);
    const key = driveFileCacheKey(file);
    if (
      !key ||
      state.remotePhotoCache[key] ||
      state.remotePhotoLoading.has(key)
    )
      continue;
    state.remotePhotoLoading.add(key);
    drivePhotoDataUrl(record, 0)
      .then((dataUrl) => {
        if (dataUrl) {
          const img = node.querySelector("img");
          if (img) img.src = dataUrl;
        }
      })
      .catch(() => {})
      .finally(() => state.remotePhotoLoading.delete(key));
  }
}

function documentTypeForForm(record) {
  return clean(record?.type).replace(/\s+Odun$/i, "");
}

function selectedSterTotal(rows) {
  return rows.reduce(
    (sum, row) => sum + (Number(String(row.ster || 0).replace(",", ".")) || 0),
    0,
  );
}

function formatSterTotal(rows) {
  return selectedSterTotal(rows).toLocaleString("tr-TR", {
    maximumFractionDigits: 2,
  });
}

function repeatedDocumentValue(value, previous) {
  return previous && stableKey(value) === stableKey(previous)
    ? "&quot;"
    : esc(value);
}

function documentRowsHtml(rows, withCoordinates = false) {
  let previousBolme = "";
  let previousType = "";
  const body = rows
    .map((record, index) => {
      const bolme = recordBolme(record);
      const type = documentTypeForForm(record);
      const row = `<tr><td>${index + 1}</td><td>${repeatedDocumentValue(bolme, previousBolme)}</td><td>${esc(record.istifNo)}</td><td>${repeatedDocumentValue(type, previousType)}</td><td>${esc(record.ster)}</td>${withCoordinates ? `<td>${esc(record.coordinates || "")}</td><td>${index + 1}</td>` : `<td></td>`}</tr>`;
      previousBolme = bolme;
      previousType = type;
      return row;
    })
    .join("");
  return `${body}<tr class="total-row"><td colspan="4">GENEL TOPLAM</td><td>${esc(formatSterTotal(rows))}</td><td${withCoordinates ? ' colspan="2"' : ""}></td></tr>`;
}

async function buildPrintHtml() {
  const rows = selectedForDocs();
  let html = "";
  if (state.documentTab === "documents") {
    const bolge = esc(state.settings.bolgeMudurlugu || "");
    const isletme = esc(state.settings.isletmeMudurlugu || "");
    const seflik = esc(
      String(state.settings.seflik || "").replace(/\s*Şefliği\s*$/i, ""),
    );
    const bolme = esc(rows[0] ? recordBolme(rows[0]) : "");
    const rampa = esc(state.settings.satisIstifYeri || "");
    const todayText = new Date().toLocaleDateString("tr-TR");
    html += `<div class="print-page workbook-document"><h1>STERLİ EMVAL KONTROL TUTANAĞI</h1><div class="workbook-fields"><div><b>Şefliği :</b><span>${seflik}</span></div><div><b>Bölme No :</b><span>${bolme}</span></div><div><b>Rampa :</b><span>${rampa}</span></div></div><h2>KONTROL EDİLEN ÜRÜNLER</h2><table class="print-table workbook-table"><thead><tr><th>Sıra No</th><th>Bölme No</th><th>İstif No</th><th>Emvalin Cinsi</th><th>Miktarı (Ster)</th><th>Ürün Sahibinin Adı Soyadı</th></tr></thead><tbody>${documentRowsHtml(rows, false)}</tbody></table><p class="workbook-note">Yukarıda dökümü yapılan sterli emvallerin, yerinde standardizasyona uygun bir şekilde istifi yapıldığı tarafımızdan tespit edilerek müştereken imza altına alınmıştır.</p><div class="workbook-date">${todayText}</div><div class="workbook-signatures"><span>Or. Muh. Mem.</span><span>İşletme Şefi</span></div></div>`;
    html += `<div class="print-page workbook-document"><h1>STERLİ EMVALE AİT SATIŞ İSTİF YERİ TESPİT TUTANAĞI</h1><div class="workbook-fields"><div><b>Bölge Müdürlüğü :</b><span>${bolge}</span></div><div><b>İşletme Müdürlüğü :</b><span>${isletme}</span></div><div><b>Şefliği :</b><span>${seflik}</span></div><div><b>Bölme No :</b><span>${bolme}</span></div><div><b>Rampa :</b><span>${rampa}</span></div></div><h2>KONTROL EDİLEN ÜRÜNLER</h2><table class="print-table workbook-table coordinate-workbook-table"><thead><tr><th>Sıra No</th><th>Bölme No</th><th>İstif No</th><th>Emvalin Cinsi</th><th>Miktarı (Ster)</th><th>Koordinat</th><th>Resim No</th></tr></thead><tbody>${documentRowsHtml(rows, true)}</tbody></table><p class="workbook-note">Yukarıda dökümü yapılan sterli emvallerin, yerinde standardizasyona uygun bir şekilde istifi yapıldığı tarafımızdan tespit edilerek müştereken imza altına alınmıştır.</p><div class="workbook-date">${todayText}</div><div class="workbook-signatures"><span>Or. Muh. Mem.</span><span>İşletme Şefi</span></div></div>`;
  }
  if (state.documentTab === "photos") {
    for (const record of rows) {
      const urls = await Promise.all(
        [0, 1, 2, 3].map((index) =>
          drivePhotoDataUrl(record, index).catch(() => ""),
        ),
      );
      const seflikName = esc(
        String(record.seflik || displaySeflik()).replace(/ Şefliği$/i, ""),
      );
      html += `<div class="print-page photo-document-page"><div class="photo-print-header"><div class="photo-print-meta"><div><b>Şeflik Adı:</b> ${seflikName}</div><div><b>İstif No:</b> ${esc(record.istifNo)} ${esc(documentTypeForForm(record))}</div><div><b>Ster:</b> ${esc(record.ster)}</div></div></div><div class="photo-print-collage">${[0, 1, 2, 3].map((index) => (urls[index] ? `<figure><img src="${urls[index]}" alt="İstif fotoğrafı ${index + 1}"></figure>` : `<figure class="print-placeholder"></figure>`)).join("")}</div><div class="print-footer">İstif Alma • ${trDate(record.date)} • Bölme ${esc(recordBolme(record))}</div></div>`;
    }
  }
  return html;
}

async function previewDocuments() {
  const rows = selectedForDocs();
  showDialog(
    `<h3>${state.documentTab === "photos" ? "İstif Fotoğrafları" : "Belgeler"} Önizleme</h3><p>${rows.length} istif seçildi. Sıralama: kabuklu kağıtlık → lif yonga → yakacak → sırık.</p><div class="builder-list card">${rows.map((record) => `<div class="check-row"><span>${icon("logs", 22)}</span><b>${esc(record.istifNo)} • ${esc(record.type)}</b></div>`).join("")}</div><div class="dialog-actions"><button class="btn" data-dialog-close>Kapat</button><button class="btn primary" id="dialogPrint">PDF / Yazdır</button></div>`,
  );
  document.getElementById("dialogPrint").onclick = () => {
    closeDialog();
    printDocuments();
  };
}

function printDocumentCss() {
  return `@page{size:A4;margin:0}*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif}.print-toolbar{position:sticky;top:0;z-index:10;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 14px;background:#0f5f39;color:#fff}.print-toolbar button{border:0;border-radius:10px;background:#fff;color:#0f5f39;font-weight:800;padding:10px 14px}.print-page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;page-break-after:always;break-after:page;padding:14mm;color:#111;overflow:hidden}.print-page:last-child{page-break-after:auto;break-after:auto}.print-page h1{text-align:center;font-size:18pt;margin:0 0 5mm;color:#111}.print-page h2{font-size:14pt;margin:0 0 4mm;color:#111}.print-table{width:100%;border-collapse:collapse;font-size:10pt;color:#111}.print-table th,.print-table td{border:1px solid #333;padding:2.5mm;text-align:left;vertical-align:top}.photo-document-page{height:297mm;min-height:0;padding:9mm 12mm 9mm;display:block;position:relative;overflow:hidden}.photo-print-header{display:block;margin:0 0 4mm}.photo-print-meta{font-size:11pt;line-height:1.38;padding:0;text-align:left;color:#111}.photo-print-meta div{margin:1mm 0}.photo-print-collage{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:3mm;height:250mm}.photo-print-collage figure{margin:0;border:1px solid #111;position:relative;overflow:hidden;background:#f8f8f8;display:block}.photo-print-collage img{width:100%;height:100%;object-fit:cover;display:block}.photo-print-collage .print-placeholder{height:auto;width:auto;display:block;background:#fff}.print-placeholder{display:block;color:#666;border:1px solid #333}.workbook-document{padding:10mm 10mm;font-size:9pt}.workbook-document h1{font-size:15pt;margin-bottom:4mm}.workbook-document h2{text-align:center;font-size:12pt;margin:5mm 0 0;border:1px solid #222;border-bottom:0;padding:2.5mm}.workbook-fields{display:grid;gap:1mm;margin-bottom:3mm}.workbook-fields div{display:grid;grid-template-columns:48mm 1fr;align-items:center;min-height:6mm}.workbook-fields b{text-align:right;padding-right:4mm}.workbook-fields span{border-bottom:1px solid transparent;min-height:5mm}.workbook-table{font-size:8.6pt;table-layout:fixed}.workbook-table th,.workbook-table td{text-align:center;padding:1.5mm;height:7mm}.workbook-table th:nth-child(1){width:13mm}.workbook-table th:nth-child(2){width:18mm}.workbook-table th:nth-child(3){width:22mm}.workbook-table th:nth-child(4){width:46mm}.workbook-table th:nth-child(5){width:25mm}.coordinate-workbook-table th:nth-child(6){width:42mm}.coordinate-workbook-table th:nth-child(7){width:20mm}.workbook-note{margin:7mm 8mm 0;line-height:1.45;text-align:center}.workbook-date{text-align:right;margin:5mm 15mm 0}.workbook-signatures{display:flex;justify-content:space-around;margin-top:34mm;padding-top:8mm;font-weight:700}.print-footer{margin-top:4mm;font-size:9pt;color:#555;text-align:right}.photo-document-page .print-footer{position:absolute;right:12mm;bottom:4mm;margin:0;font-size:8pt;color:#666}.empty-print{padding:24px;font-size:16px}@media print{.print-toolbar{display:none!important}.print-page{margin:0;box-shadow:none}body{background:#fff}}`;
}

function buildPrintDocument(innerHtml) {
  const content = clean(innerHtml)
    ? innerHtml
    : '<div class="empty-print">Yazdırılacak kayıt bulunamadı.</div>';
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>İstif Alma Evrakı</title><style>${printDocumentCss()}</style></head><body><div class="print-toolbar"><strong>İstif Alma Evrakı</strong><button onclick="window.print()">PDF olarak kaydet / Yazdır</button></div>${content}<script>function waitImages(){return Promise.all(Array.from(document.images).map(function(img){if(img.complete)return Promise.resolve();return new Promise(function(resolve){img.onload=img.onerror=resolve;setTimeout(resolve,2200);});}));}window.addEventListener('load',function(){setTimeout(function(){waitImages().then(function(){setTimeout(function(){window.print();},300);});},450);});<\/script></body></html>`;
}

function waitFrame() {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );
}

async function waitForPrintAssets(root) {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
      return new Promise((resolve) => {
        const done = () => resolve();
        img.onload = done;
        img.onerror = done;
        setTimeout(done, 2200);
      });
    }),
  );
  await waitFrame();
}

async function printDocuments() {
  const rows = selectedForDocs();
  if (!rows.length) {
    toast("Yazdırılacak istif bulunamadı.", "bad");
    return;
  }
  const printWin = window.open("", "_blank");
  if (printWin) {
    printWin.document.open();
    printWin.document.write(
      '<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>İstif Alma Evrakı</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#0f5f39}b{display:block;margin-bottom:10px}</style></head><body><b>PDF hazırlanıyor…</b><span>Lütfen bekleyin.</span></body></html>',
    );
    printWin.document.close();
  }
  const html = await buildPrintHtml();
  const fullDoc = buildPrintDocument(html);
  if (printWin) {
    printWin.document.open();
    printWin.document.write(fullDoc);
    printWin.document.close();
    return;
  }
  const area = document.getElementById("printArea");
  area.innerHTML =
    html ||
    '<div class="print-page"><h1>Yazdırılacak kayıt yok</h1><p>Önce evraka eklenecek istifleri seçin.</p></div>';
  area.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-printing");
  await waitForPrintAssets(area);
  setTimeout(() => window.print(), 650);
}

document.querySelectorAll("[data-close-camera]").forEach((element) => {
  element.onclick = stopCamera;
});
document.querySelectorAll("[data-dialog-close]").forEach((element) => {
  element.onclick = closeDialog;
});
dialogModal.addEventListener("click", (event) => {
  if (event.target.matches("[data-dialog-close]")) closeDialog();
});
document.getElementById("captureBtn").onclick = capturePhoto;
document.getElementById("pickGalleryBtn").onclick = () => {
  stopCamera();
  picker.click();
};
document.getElementById("switchCameraBtn").onclick = async () => {
  state.facingMode =
    state.facingMode === "environment" ? "user" : "environment";
  try {
    await openCamera();
  } catch {
    toast("Kamera değiştirilemedi.", "bad");
  }
};
picker.addEventListener("change", pickerChanged);
window.addEventListener("online", () => {
  state.auth.status = hasSharedIdentity() ? "cached" : "signed_out";
  render();
  toast(
    "İnternet geldi. Değişiklikleri sol alttaki Senkronize Et ile gönderebilirsiniz.",
    "good",
  );
});
window.addEventListener("offline", () => {
  state.auth.status = hasSharedIdentity() ? "cached" : "signed_out";
  render();
  toast("Offline mod: kayıtlar cihazda tutuluyor.");
});
window.addEventListener("storage", (event) => {
  if (
    [
      SHARED_SESSION_KEY,
      SHARED_PANEL_KEY,
      SHARED_ACCESS_KEY,
      SHARED_ACTIVE_SEFLIK_KEY,
      SHARED_TERMINAL_KEY,
      SHARED_TERMINAL_OLD_KEY,
      SHARED_SUITE_DIVISIONS_KEY,
      SHARED_SUITE_DIVISION_READY_KEY,
    ].includes(event.key)
  ) {
    hydrateLocalSharedIdentity();
    refreshCurrentMembers();
    render();
    /* Suite V10: ağ yenilemesi yalnızca Suite veya ortak Senkronize Et tarafından yapılır. */
  }
});
window.addEventListener("afterprint", () => {
  const area = document.getElementById("printArea");
  document.body.classList.remove("is-printing");
  if (area) {
    area.innerHTML = "";
    area.setAttribute("aria-hidden", "true");
  }
});

function istifDeviceId() {
  let id = localStorage.getItem("mesaha_istif_device_v5");
  if (!id) {
    id =
      "istif_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10);
    localStorage.setItem("mesaha_istif_device_v5", id);
  }
  return id;
}
async function pingAdminProfile() {
  if (!navigator.onLine || !hasSharedCloudIdentity() || !state.settings.seflik)
    return;
  try {
    await edgeCall("profile_ping_istif", {
      name: state.auth.name || displayOrmanci(),
      seflik: state.settings.seflik,
      bolmeNo: state.draft?.bolme || "",
      appVersion: "İstif İO " + APP_VERSION,
      avatarUrl: state.auth.avatarUrl,
      deviceId: istifDeviceId(),
      deviceInfo: {
        appId: "istif",
        appName: "İstif İO",
        platform: navigator.platform || "",
        browser: navigator.userAgent || "",
        suiteVersion: "V21",
      },
    });
  } catch {}
}
(async function init() {
  try {
    if (bootOverlay) {
      bootOverlay.hidden = true;
      bootOverlay.classList.remove("show");
    }
    await loadData();
    hydrateLocalSharedIdentity();
    refreshCurrentMembers();
    if (!state.settings.setupComplete) state.view = "settings";
    render();
    /* Suite V10: profil ve sunucu kontrolleri ana menüden yürütülür. */
  } catch (error) {
    if (bootOverlay) bootOverlay.hidden = true;
    app.innerHTML = `<div class="empty"><h2>Uygulama açılamadı</h2><p>${esc(error.message)}</p></div>`;
  }
})();
