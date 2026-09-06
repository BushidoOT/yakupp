(function (root) {
  "use strict";

  if (root.OrmanOfflineStore && root.OrmanOfflineStore.schemaVersion >= 92) return;

  const DB_NAME = "orman_io_offline_v92";
  const DB_VERSION = 1;
  const DIVISION_STORE = "division_records";
  const WORKSPACE_STORE = "mesaha_workspaces";
  const META_STORE = "meta";
  const LEGACY_DIVISION_KEY = "mesaha_suite_division_records_v4";
  const LEGACY_MIGRATION_KEY = "orman_io_division_idb_migrated_v92";
  const WORKSPACE_MIGRATION_KEY = "orman_io_workspace_migrated_v92";
  const ACTIVE_KEY = "mesaha_active_seflik_folder_v564";
  const FOLDERS_KEY = "mesaha_suite_folder_cache_v4";
  const RECORDS_KEY = "cam_mesaha_kayitlari_v1";
  const SETTINGS_KEY = "cam_mesaha_ayarlar_v1";

  const clean = (value) => String(value == null ? "" : value).trim().replace(/\s+/g, " ");
  const fold = (value) => clean(value)
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const cloneRows = (rows) => Array.isArray(rows) ? rows.slice() : [];
  const readJson = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value == null ? fallback : value;
    } catch (_) { return fallback; }
  };

  let dbPromise = null;
  let readyPromise = null;
  const divisionMemory = new Map();
  const workspaceMemory = new Map();

  function folderKey(value) {
    if (value && typeof value === "object") {
      return clean(value.seflik_key || value.seflikKey) || fold(value.seflik || value.name || "");
    }
    return clean(value) || "local";
  }
  function divisionId(key, bolmeNo) { return folderKey(key) + "::" + clean(bolmeNo); }

  function requestPromise(request, label) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result == null ? null : request.result);
      request.onerror = () => reject(request.error || new Error(label || "IndexedDB isteği başarısız"));
    });
  }
  function txDone(tx, label) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error(label || "IndexedDB işlemi başarısız"));
      tx.onabort = () => reject(tx.error || new Error(label || "IndexedDB işlemi iptal edildi"));
    });
  }
  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!("indexedDB" in root)) return reject(new Error("IndexedDB kullanılamıyor"));
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(DIVISION_STORE)) {
          const store = db.createObjectStore(DIVISION_STORE, { keyPath: "id" });
          store.createIndex("folderKey", "folderKey", { unique: false });
        }
        if (!db.objectStoreNames.contains(WORKSPACE_STORE)) db.createObjectStore(WORKSPACE_STORE, { keyPath: "folderKey" });
        if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE, { keyPath: "key" });
      };
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => { try { db.close(); } catch (_) {} dbPromise = null; };
        resolve(db);
      };
      req.onerror = () => { dbPromise = null; reject(req.error || new Error("Offline veri deposu açılamadı")); };
      req.onblocked = () => { dbPromise = null; reject(new Error("Offline veri deposu başka sekme tarafından kilitli")); };
    });
    return dbPromise;
  }

  async function getAll(storeName) {
    const db = await openDb();
    const tx = db.transaction(storeName, "readonly");
    const result = await requestPromise(tx.objectStore(storeName).getAll(), "Offline kayıtlar okunamadı");
    return Array.isArray(result) ? result : [];
  }
  async function getByIndex(storeName, indexName, value) {
    const db = await openDb();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const result = await requestPromise(store.index(indexName).getAll(IDBKeyRange.only(value)), "Offline kayıtlar okunamadı");
    return Array.isArray(result) ? result : [];
  }
  async function getOne(storeName, key) {
    const db = await openDb();
    const tx = db.transaction(storeName, "readonly");
    return requestPromise(tx.objectStore(storeName).get(key), "Offline kayıt okunamadı");
  }
  async function putOne(storeName, value) {
    const db = await openDb();
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value);
    await txDone(tx, "Offline kayıt yazılamadı");
    return true;
  }
  async function deleteOne(storeName, key) {
    const db = await openDb();
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    await txDone(tx, "Offline kayıt silinemedi");
    return true;
  }

  function flattenLegacyDivisions(raw) {
    const rows = [];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return rows;
    Object.entries(raw).forEach(([key, value]) => {
      if (Array.isArray(value) && key.includes("::")) {
        const cut = key.lastIndexOf("::");
        const fk = clean(key.slice(0, cut));
        const no = clean(key.slice(cut + 2));
        if (fk && no) rows.push({ id: divisionId(fk, no), folderKey: fk, bolmeNo: no, records: cloneRows(value), updatedAt: Date.now() });
        return;
      }
      if (!value || typeof value !== "object" || Array.isArray(value)) return;
      Object.entries(value).forEach(([no, records]) => {
        if (!Array.isArray(records)) return;
        const fk = clean(key);
        const bolmeNo = clean(no);
        if (fk && bolmeNo) rows.push({ id: divisionId(fk, bolmeNo), folderKey: fk, bolmeNo, records: cloneRows(records), updatedAt: Date.now() });
      });
    });
    return rows;
  }

  function resolveFolderKeyForSeflik(seflik) {
    const label = clean(seflik);
    const foldersRaw = readJson(FOLDERS_KEY, []);
    const folders = Array.isArray(foldersRaw) ? foldersRaw : [];
    const found = folders.find((row) => fold(row && row.seflik) === fold(label));
    return found ? folderKey(found) : fold(label);
  }

  async function migrateLegacyDivisions() {
    let migrated = false;
    try { migrated = localStorage.getItem(LEGACY_MIGRATION_KEY) === "1"; } catch (_) {}
    if (migrated) return;
    const raw = readJson(LEGACY_DIVISION_KEY, null);
    const legacy = flattenLegacyDivisions(raw);
    if (legacy.length) {
      // Kullanıcı tarayıcı verilerinden yalnız migration bayrağını temizlediyse,
      // daha yeni IndexedDB kayıtlarını eski localStorage kopyasıyla ezme.
      const existingIds = new Set((await getAll(DIVISION_STORE)).map((row) => clean(row && row.id)).filter(Boolean));
      const db = await openDb();
      const tx = db.transaction([DIVISION_STORE, META_STORE], "readwrite");
      const store = tx.objectStore(DIVISION_STORE);
      let inserted = 0;
      legacy.forEach((row) => { if (!existingIds.has(row.id)) { store.put(row); inserted += 1; } });
      tx.objectStore(META_STORE).put({ key: "division-migration-v92", count: legacy.length, inserted, at: Date.now() });
      await txDone(tx, "Eski bölme kayıtları taşınamadı");
    }
    try {
      localStorage.removeItem(LEGACY_DIVISION_KEY);
      localStorage.setItem(LEGACY_MIGRATION_KEY, "1");
    } catch (_) {}
  }

  async function migrateInitialWorkspaces() {
    let migrated = false;
    try { migrated = localStorage.getItem(WORKSPACE_MIGRATION_KEY) === "1"; } catch (_) {}
    if (migrated) return;
    const records = readJson(RECORDS_KEY, []);
    const settings = readJson(SETTINGS_KEY, {});
    const active = readJson(ACTIVE_KEY, {});
    if (Array.isArray(records) && records.length) {
      const groups = new Map();
      records.forEach((record) => {
        const seflik = clean(record && (record.seflik || record.seflikAdi || record.seflik_adi)) || clean(active.seflik || settings.seflik);
        const key = resolveFolderKeyForSeflik(seflik) || folderKey(active) || "local";
        if (!groups.has(key)) groups.set(key, { seflik, records: [] });
        groups.get(key).records.push(record);
      });
      const existingKeys = new Set((await getAll(WORKSPACE_STORE)).map((row) => clean(row && row.folderKey)).filter(Boolean));
      const db = await openDb();
      const tx = db.transaction(WORKSPACE_STORE, "readwrite");
      const store = tx.objectStore(WORKSPACE_STORE);
      groups.forEach((group, key) => {
        if (!existingKeys.has(key)) store.put({ folderKey: key, seflik: group.seflik, records: cloneRows(group.records), settings: { ...(settings || {}), seflik: group.seflik || settings.seflik || "" }, updatedAt: Date.now() });
      });
      await txDone(tx, "Şeflik çalışma alanları taşınamadı");
    }
    try { localStorage.setItem(WORKSPACE_MIGRATION_KEY, "1"); } catch (_) {}
  }

  async function hydrateMemory() {
    // Tüm şefliklerin büyük bölme kayıtlarını RAM'e yükleme. Yalnız aktif şeflik
    // sıcak tutulur; diğerleri IndexedDB'den ihtiyaç oldukça okunur.
    const workspaces = await getAll(WORKSPACE_STORE);
    divisionMemory.clear();
    const active = readJson(ACTIVE_KEY, {}) || {};
    const activeKey = folderKey(active);
    if (activeKey && activeKey !== "local") {
      const divisions = await getByIndex(DIVISION_STORE, "folderKey", activeKey);
      divisions.forEach((row) => { if (row && row.id) divisionMemory.set(row.id, cloneRows(row.records)); });
    }
    workspaceMemory.clear();
    workspaces.forEach((row) => { if (row && row.folderKey) workspaceMemory.set(row.folderKey, { ...row, records: cloneRows(row.records), settings: { ...(row.settings || {}) } }); });
  }

  function ready() {
    if (!readyPromise) {
      readyPromise = (async () => {
        await openDb();
        await migrateLegacyDivisions();
        await migrateInitialWorkspaces();
        await hydrateMemory();
        try { root.dispatchEvent(new CustomEvent("orman-io:offline-store-ready", { detail: { schemaVersion: 92 } })); } catch (_) {}
        return true;
      })().catch((error) => {
        readyPromise = null;
        try { root.dispatchEvent(new CustomEvent("orman-io:offline-store-error", { detail: { message: clean(error && error.message || error) } })); } catch (_) {}
        throw error;
      });
    }
    return readyPromise;
  }

  function peekDivision(key, bolmeNo) { return cloneRows(divisionMemory.get(divisionId(key, bolmeNo))); }
  async function getDivision(key, bolmeNo) {
    await ready();
    const id = divisionId(key, bolmeNo);
    if (divisionMemory.has(id)) return cloneRows(divisionMemory.get(id));
    const row = await getOne(DIVISION_STORE, id);
    const records = cloneRows(row && row.records);
    divisionMemory.set(id, records);
    return cloneRows(records);
  }
  async function setDivision(key, bolmeNo, records, meta) {
    await ready();
    const fk = folderKey(key), no = clean(bolmeNo), list = cloneRows(records);
    const row = { id: divisionId(fk, no), folderKey: fk, bolmeNo: no, records: list, updatedAt: Date.now(), ...(meta || {}) };
    await putOne(DIVISION_STORE, row);
    divisionMemory.set(row.id, list);
    return cloneRows(list);
  }
  async function deleteDivision(key, bolmeNo) {
    await ready();
    const id = divisionId(key, bolmeNo);
    await deleteOne(DIVISION_STORE, id);
    divisionMemory.delete(id);
    return true;
  }
  function peekFolder(key) {
    const fk = folderKey(key), out = {};
    divisionMemory.forEach((records, id) => {
      const prefix = fk + "::";
      if (id.startsWith(prefix)) out[id.slice(prefix.length)] = cloneRows(records);
    });
    return out;
  }
  async function getFolder(key) {
    await ready();
    const fk = folderKey(key);
    const rows = await getByIndex(DIVISION_STORE, "folderKey", fk);
    // Bu şefliğe ait eski RAM kopyalarını temizleyip güncel IDB görünümünü yerleştir.
    Array.from(divisionMemory.keys()).forEach((id) => { if (id.startsWith(fk + "::")) divisionMemory.delete(id); });
    rows.forEach((row) => { if (row && row.id) divisionMemory.set(row.id, cloneRows(row.records)); });
    return peekFolder(fk);
  }
  async function deleteFolder(key) {
    await ready();
    const fk = folderKey(key), db = await openDb(), tx = db.transaction(DIVISION_STORE, "readwrite"), store = tx.objectStore(DIVISION_STORE), index = store.index("folderKey");
    const done = txDone(tx, "Şeflik offline kayıtları silinemedi");
    await new Promise((resolve, reject) => {
      const req = index.openCursor(IDBKeyRange.only(fk));
      req.onsuccess = () => { const cursor = req.result; if (!cursor) return resolve(); cursor.delete(); cursor.continue(); };
      req.onerror = () => reject(req.error || new Error("Şeflik offline kayıtları silinemedi"));
    });
    await done;
    Array.from(divisionMemory.keys()).forEach((id) => { if (id.startsWith(fk + "::")) divisionMemory.delete(id); });
    return true;
  }
  async function renameFolder(oldKey, newKey) {
    await ready();
    const oldFk = folderKey(oldKey), newFk = folderKey(newKey);
    if (!oldFk || !newFk || oldFk === newFk) return true;
    const moving = await getByIndex(DIVISION_STORE, "folderKey", oldFk);
    if (moving.length) {
      const db = await openDb(), tx = db.transaction(DIVISION_STORE, "readwrite"), store = tx.objectStore(DIVISION_STORE);
      moving.forEach((row) => {
        store.delete(row.id);
        store.put({ ...row, id: divisionId(newFk, row.bolmeNo), folderKey: newFk, updatedAt: Date.now() });
      });
      await txDone(tx, "Şeflik offline kayıtları taşınamadı");
    }
    moving.forEach((row) => {
      divisionMemory.delete(row.id);
      divisionMemory.set(divisionId(newFk, row.bolmeNo), cloneRows(row.records));
    });
    const ws = workspaceMemory.get(oldFk);
    if (ws) {
      await deleteOne(WORKSPACE_STORE, oldFk);
      await putOne(WORKSPACE_STORE, { ...ws, folderKey: newFk, updatedAt: Date.now() });
      workspaceMemory.delete(oldFk);
      workspaceMemory.set(newFk, { ...ws, folderKey: newFk, updatedAt: Date.now() });
    }
    return true;
  }
  async function exportDivisions() {
    await ready();
    const out = {};
    const rows = await getAll(DIVISION_STORE);
    rows.forEach((row) => {
      if (!row || !row.folderKey || !row.bolmeNo) return;
      if (!out[row.folderKey]) out[row.folderKey] = {};
      out[row.folderKey][row.bolmeNo] = cloneRows(row.records);
    });
    return out;
  }

  function peekWorkspace(key) {
    const row = workspaceMemory.get(folderKey(key));
    return row ? { ...row, records: cloneRows(row.records), settings: { ...(row.settings || {}) } } : null;
  }
  async function getWorkspace(key) {
    await ready();
    const fk = folderKey(key);
    if (workspaceMemory.has(fk)) return peekWorkspace(fk);
    const row = await getOne(WORKSPACE_STORE, fk);
    if (!row) return null;
    workspaceMemory.set(fk, row);
    return peekWorkspace(fk);
  }
  async function saveWorkspace(key, seflik, records, settings) {
    await ready();
    const fk = folderKey(key);
    if (!fk) return false;
    const row = { folderKey: fk, seflik: clean(seflik || (settings && settings.seflik)), records: cloneRows(records), settings: { ...(settings || {}) }, updatedAt: Date.now() };
    await putOne(WORKSPACE_STORE, row);
    workspaceMemory.set(fk, row);
    return true;
  }
  async function deleteWorkspace(key) {
    await ready();
    const fk = folderKey(key);
    await deleteOne(WORKSPACE_STORE, fk);
    workspaceMemory.delete(fk);
    return true;
  }

  const api = Object.freeze({
    schemaVersion: 92,
    ready,
    folderKey,
    divisionId,
    peekDivision,
    getDivision,
    setDivision,
    deleteDivision,
    peekFolder,
    getFolder,
    deleteFolder,
    renameFolder,
    exportDivisions,
    peekWorkspace,
    getWorkspace,
    saveWorkspace,
    deleteWorkspace,
  });
  root.OrmanOfflineStore = api;
  ready().catch(() => {});
})(typeof window !== "undefined" ? window : self);
