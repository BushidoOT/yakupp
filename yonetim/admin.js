(() => {
  'use strict';

  const ADMIN_USER = 'yakupduzgun';
  const ADMIN_VERSION = 'V5.26 •LightX•';
  const EDGE_URL = 'https://swrbpdpotmirnmtqnuba.supabase.co/functions/v1/smooth-function';
  const DRIVE_URL = 'https://script.google.com/macros/s/AKfycbzOYh2MyOQmwVQh-7Jm9KyjaFjmjSwgHZSw7XKAVzDS1ibmcM5bQZVYdn-NyesI-ph7/exec';
  const DRIVE_SECRET = 'MESAHAYEDEK_2026_YAKUP_43';
  const SESSION_LOGIN = 'mesaha_admin_light_v526_login';
  const SESSION_KEY = 'mesaha_admin_light_v526_key';
  const HIDDEN_BACKUPS_KEY = 'mesaha_admin_hidden_drive_v526';
  const ISTANBUL_TZ = 'Europe/Istanbul';

  const $ = (id) => document.getElementById(id);
  const state = {
    page: 'users', range: 'day', blockView: 'user_key',
    profiles: [], usage: [], daily: [], events: [], logs: [], blocks: [], backups: [], users: [],
    summary: {}, hiddenBackupIds: new Set(), loading: false, errors: {}
  };
  window.MESAHA_ADMIN_LIGHT_STATE = state;

  const clean = (v) => String(v ?? '').trim();
  const lower = (v) => clean(v).toLocaleLowerCase('tr-TR');
  const num = (v) => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const x = Number(String(v ?? '').replace(',', '.'));
    return Number.isFinite(x) ? x : 0;
  };
  const arr = (v) => Array.isArray(v) ? v : [];
  const parse = (v) => {
    if (typeof v !== 'string') return v;
    try { return JSON.parse(v); } catch { return v; }
  };
  const obj = (v) => {
    const p = parse(v);
    return p && typeof p === 'object' && !Array.isArray(p) ? p : {};
  };
  const first = (...values) => {
    for (const value of values) if (value !== null && value !== undefined && clean(value) !== '') return value;
    return '';
  };
  const path = (source, pathName) => pathName.split('.').reduce((value, key) => value && typeof value === 'object' ? value[key] : undefined, source);
  const pick = (source, paths) => {
    for (const key of paths) {
      const value = path(source, key);
      if (value !== null && value !== undefined && clean(value) !== '') return value;
    }
    return '';
  };
  const pickNum = (source, paths) => {
    for (const key of paths) {
      const value = path(source, key);
      if (value !== null && value !== undefined && clean(value) !== '') return num(value);
    }
    return 0;
  };
  const escapeHtml = (v) => clean(v).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const ms = (v) => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const t = Date.parse(clean(v));
    return Number.isFinite(t) ? t : 0;
  };
  const fmtInt = (v) => Math.round(num(v)).toLocaleString('tr-TR');
  const fmtM3 = (v) => num(v).toLocaleString('tr-TR', {minimumFractionDigits: 3, maximumFractionDigits: 3});
  const fmtDate = (v) => ms(v) ? new Date(ms(v)).toLocaleString('tr-TR', {timeZone: ISTANBUL_TZ, day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '-';
  const dateKey = (v) => {
    if (ms(v)) return new Date(ms(v)).toLocaleDateString('en-CA', {timeZone: ISTANBUL_TZ});
    const match = clean(v).match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : '';
  };
  const todayKey = () => new Date().toLocaleDateString('en-CA', {timeZone: ISTANBUL_TZ});
  const monthKey = (v) => dateKey(v).slice(0, 7);
  const weekKey = (v) => {
    const key = dateKey(v);
    if (!key) return '';
    const d = new Date(key + 'T12:00:00Z');
    const firstDay = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const days = Math.floor((d - firstDay) / 86400000);
    return `${d.getUTCFullYear()}-W${String(Math.ceil((days + firstDay.getUTCDay() + 1) / 7)).padStart(2, '0')}`;
  };
  const compact = (v) => lower(v).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
  const userKeyFrom = (name, seflik) => `${compact(name)}__${compact(seflik)}`.slice(0, 120);
  const initials = (v) => clean(v).split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase() || '?';

  const BAD_IDENTITIES = new Set(['', '-', 'unknown', 'null', 'undefined', 'user', 'kullanıcı', 'kullanici', 'şeflik', 'seflik', 'admin', 'test']);
  const isRealText = (v) => !BAD_IDENTITIES.has(lower(v)) && clean(v).length >= 2;
  const hasRealIdentity = (name, seflik) => isRealText(name) && isRealText(seflik);
  const isLikelyIp = (v) => /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(clean(v)) || /^[0-9a-f:]{3,}$/i.test(clean(v));

  function toast(message) {
    const el = $('toast');
    el.textContent = clean(message) || 'İşlem tamamlandı';
    el.classList.add('is-visible');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('is-visible'), 3000);
  }
  function errorText(error) { return clean(error?.message || error || 'Bilinmeyen hata').slice(0, 300); }
  function setStatus(message) { $('statusLine').textContent = clean(message); }
  function readAdminKey() { return sessionStorage.getItem(SESSION_KEY) || ''; }
  function hiddenSet() {
    try { return new Set(arr(JSON.parse(localStorage.getItem(HIDDEN_BACKUPS_KEY) || '[]')).map(clean).filter(Boolean)); }
    catch { return new Set(); }
  }
  function saveHiddenSet(set) { try { localStorage.setItem(HIDDEN_BACKUPS_KEY, JSON.stringify([...set])); } catch {} }

  async function edge(action, data = {}) {
    const cfg = window.MESAHA_SUPABASE_CONFIG || {};
    const response = await fetch(EDGE_URL, {
      method: 'POST', cache: 'no-store',
      headers: {'Content-Type':'application/json','apikey':clean(cfg.anonKey || cfg.anon_key || '')},
      body: JSON.stringify({action, admin_key: readAdminKey(), ...data})
    });
    const text = await response.text();
    let json;
    try { json = text ? JSON.parse(text) : {}; } catch { throw new Error(`Edge cevabı okunamadı: ${text.slice(0, 100)}`); }
    if (!response.ok || !json.ok) throw new Error(json.error || json.reason || `Edge hata ${response.status}`);
    return json;
  }
  async function drive(action, data = {}) {
    const response = await fetch(DRIVE_URL, {
      method: 'POST', cache: 'no-store', headers: {'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify({secret: DRIVE_SECRET, action, ...data})
    });
    const text = await response.text();
    let json;
    try { json = text ? JSON.parse(text) : {}; } catch { throw new Error('Drive cevabı okunamadı'); }
    if (!response.ok || !json.ok) throw new Error(json.error || `Drive hata ${response.status}`);
    return json;
  }

  function deviceInfo(raw) {
    raw = obj(raw);
    const payload = obj(raw.payload), meta = obj(raw.metadata);
    const device = {...obj(raw.device_info), ...obj(raw.deviceInfo), ...obj(payload.deviceInfo), ...obj(payload.lastDeviceInfo), ...obj(meta.deviceInfo)};
    const all = {...payload, ...meta, ...raw, ...device};
    const ua = lower(first(all.userAgent, all.user_agent, all.ua));
    let platform = first(all.platform, all.os, all.operatingSystem, all.deviceType);
    if (!platform) platform = /iphone|ipad|ios/.test(ua) ? 'iOS' : /android/.test(ua) ? 'Android' : /windows/.test(ua) ? 'Windows' : /mac/.test(ua) ? 'macOS' : '-';
    let browser = first(all.browser, all.browserName, all.tarayici);
    if (!browser) browser = /samsungbrowser/.test(ua) ? 'Samsung Internet' : /edg\//.test(ua) ? 'Edge' : /crios|chrome/.test(ua) ? 'Chrome' : /safari/.test(ua) ? 'Safari' : /firefox/.test(ua) ? 'Firefox' : '-';
    const browserVersion = first(all.browserVersion, all.browser_version);
    if (browserVersion && browser !== '-' && !clean(browser).includes(clean(browserVersion))) browser = `${browser} ${browserVersion}`;
    const edgeIp = obj(first(payload.edgeIp, meta.edgeIp));
    return {
      id: first(all.deviceId, all.device_id, all.installId, all.clientId, '-'),
      ip: first(raw.last_ip, raw.ip_address, all.lastIp, all.last_ip, all.ip, all.ipAddress, all.ip_address, edgeIp.ip, '-'),
      platform: clean(platform) || '-', browser: clean(browser) || '-',
      version: first(raw.app_version, all.appVersion, all.app_version, all.visibleVersion, all.fileVersion, all.version, '-'),
      raw: all
    };
  }

  function normalizeTotals(value) {
    value = parse(value);
    const rows = [];
    if (Array.isArray(value)) {
      value.forEach((item) => {
        item = obj(item);
        const name = first(item.name, item.label, item.type, item.tur, item.tür, 'Belirsiz');
        const count = pickNum(item, ['adet','count','recordCount','record_count']);
        const volume = pickNum(item, ['m3','volume','hacim','totalM3','total_volume']);
        if (count || volume) rows.push({name: clean(name), count, volume});
      });
    } else if (value && typeof value === 'object') {
      Object.entries(value).forEach(([name, item]) => {
        if (item && typeof item === 'object') {
          const o = obj(item);
          const count = pickNum(o, ['adet','count','recordCount','record_count']);
          const volume = pickNum(o, ['m3','volume','hacim','totalM3','total_volume']);
          if (count || volume) rows.push({name, count, volume});
        } else if (num(item)) rows.push({name, count: 0, volume: num(item)});
      });
    }
    return rows;
  }
  function readTotals(raw, keys) {
    raw = obj(raw); const payload = obj(raw.payload); const combined = {...payload, ...raw};
    const out = [];
    keys.forEach((key) => out.push(...normalizeTotals(combined[key])));
    return aggregateCategoryRows(out);
  }
  function aggregateCategoryRows(rows) {
    const map = new Map();
    rows.forEach((row) => {
      if (!clean(row.name)) return;
      const key = lower(row.name);
      const old = map.get(key) || {name: clean(row.name), count: 0, volume: 0};
      old.count += num(row.count); old.volume += num(row.volume); map.set(key, old);
    });
    return [...map.values()].filter((x) => x.count || x.volume).sort((a,b) => b.volume - a.volume || b.count - a.count);
  }

  function mapStatRow(raw, source = 'daily') {
    raw = obj(raw); const payload = obj(raw.payload), user = obj(payload.user), info = deviceInfo(raw);
    const name = first(raw.name, payload.name, user.name, '-');
    const seflik = first(raw.seflik, payload.seflik, user.seflik, '-');
    const date = first(raw.date, payload.date, payload.day, raw.last_seen_at, raw.updated_at, raw.created_at);
    return {
      id: first(raw.user_id, raw.id, payload.user_id),
      userKey: first(raw.user_key, payload.user_key, payload.userKey, userKeyFrom(name, seflik)),
      name, seflik, date, dateMs: ms(date), source,
      count: pickNum(raw, ['record_count','payload.record_count','payload.recordCount','payload.totalRecords','payload.adet','payload.todayRecords']),
      volume: pickNum(raw, ['total_volume','payload.total_volume','payload.totalM3','payload.m3','payload.todayM3']),
      tree: readTotals(raw, ['tree_totals','treeTotals','agacTotals','agac_totals','ağaçTotals']),
      wood: readTotals(raw, ['product_totals','productTotals','woodTotals','wood_totals','odunTotals','odun_totals','emvalTotals']),
      version: info.version, raw
    };
  }
  function mapProfile(raw) {
    raw = obj(raw); const payload = obj(raw.payload), user = obj(payload.user), info = deviceInfo(raw);
    const name = first(raw.name, payload.name, user.name, '-');
    const seflik = first(raw.seflik, payload.seflik, user.seflik, '-');
    const lastSeen = first(raw.last_seen_at, raw.updated_at, payload.lastSeenAt, payload.lastSeen, raw.created_at);
    return {
      id: first(raw.user_id, raw.id, payload.user_id),
      userKey: first(raw.user_key, payload.user_key, payload.userKey, userKeyFrom(name, seflik)),
      name, seflik, bolme: first(raw.bolme_no, payload.bolmeNo, payload.bolme),
      ip: info.ip, deviceId: info.id, platform: info.platform, browser: info.browser, version: info.version,
      lastSeen, lastSeenMs: ms(lastSeen), raw
    };
  }
  function mapBackup(raw) {
    raw = obj(raw); const payload = obj(raw.payload), user = obj(first(raw.user, payload.user));
    const name = first(raw.userName, raw.username, raw.name, payload.userName, payload.name, user.name, '-');
    const seflik = first(raw.seflik, payload.seflik, user.seflik, '-');
    const driveFileId = first(raw.driveFileId, raw.drive_file_id, raw.fileId, raw.file_id, raw.googleDriveFileId, raw.google_drive_file_id, payload.driveFileId, payload.drive_file_id, raw.id);
    const createdAt = first(raw.createdAt, raw.created_at, raw.modifiedTime, raw.modified_time, raw.updatedAt, raw.updated_at, payload.createdAt, payload.created_at);
    const fileName = first(raw.fileName, raw.filename, raw.backupName, raw.backup_name, payload.fileName, payload.backupName, raw.name, 'Drive yedeği');
    return {
      id: first(raw.row_id, raw.slot_id, raw.uuid, raw.id, driveFileId), driveFileId, fileName,
      userKey: first(raw.userKey, raw.user_key, user.userKey, user.user_key, payload.userKey, payload.user_key, userKeyFrom(name, seflik)),
      name, seflik, createdAt, createdAtMs: ms(createdAt),
      count: pickNum(raw, ['count','recordCount','record_count','payload.recordCount','payload.count','payload.totalRecords']),
      volume: pickNum(raw, ['totalVolume','total_volume','m3','payload.totalM3','payload.total_volume','payload.m3']),
      version: first(raw.version, raw.appVersion, raw.app_version, payload.visibleVersion, payload.version, payload.appVersion, '-'),
      tree: readTotals(raw, ['tree_totals','treeTotals','agacTotals','agac_totals']),
      wood: readTotals(raw, ['product_totals','productTotals','woodTotals','wood_totals','odunTotals','odun_totals']),
      driveLink: first(raw.webViewLink, raw.web_view_link, raw.alternateLink, raw.url, payload.webViewLink, driveFileId ? `https://drive.google.com/file/d/${encodeURIComponent(driveFileId)}/view` : ''),
      raw
    };
  }
  function mapBlock(raw) {
    raw = obj(raw);
    return {
      id: first(raw.id, raw.uuid), type: clean(first(raw.block_type, raw.type)), value: clean(first(raw.block_value, raw.value)),
      reason: first(raw.reason, obj(raw.metadata).reason, 'Admin engeli'), active: !(raw.active === false || clean(raw.active) === 'false' || clean(raw.active) === '0'),
      createdAt: first(raw.created_at, raw.updated_at), raw
    };
  }

  function identityKey(user) { return compact(user.userKey) || compact(`${user.name}_${user.seflik}`) || (clean(user.id) ? `id_${compact(user.id)}` : ''); }
  function validUser(user) {
    if (!hasRealIdentity(user.name, user.seflik)) return false;
    const key = lower(user.userKey);
    if (/^(user|kullanici|kullanıcı|device|dev|cihaz)[_\-]/.test(key) || ['user','kullanici','kullanıcı'].includes(key)) return false;
    return true;
  }
  function mergeUsers() {
    const map = new Map();
    const idIndex = new Map();
    const upsertReal = (raw) => {
      const user = raw.name ? raw : mapProfile(raw);
      if (!validUser(user)) return;
      const key = identityKey(user); if (!key) return;
      const old = map.get(key) || {name:user.name,seflik:user.seflik,userKey:user.userKey,id:user.id,lastSeenMs:0,ip:'-',deviceId:'-',platform:'-',browser:'-',version:'-',raw:user.raw};
      if (user.lastSeenMs >= old.lastSeenMs) {
        ['id','userKey','name','seflik','bolme','lastSeen','lastSeenMs','raw'].forEach((field) => { if (user[field] !== undefined && clean(user[field]) !== '') old[field] = user[field]; });
        ['ip','deviceId','platform','browser','version'].forEach((field) => { if (clean(user[field]) && user[field] !== '-') old[field] = user[field]; });
      } else {
        ['ip','deviceId','platform','browser','version'].forEach((field) => { if ((!clean(old[field]) || old[field] === '-') && clean(user[field]) && user[field] !== '-') old[field] = user[field]; });
      }
      map.set(key, old);
      if (clean(old.id)) idIndex.set(compact(old.id), key);
    };
    state.profiles.map(mapProfile).forEach(upsertReal);
    state.usage.map(mapProfile).forEach(upsertReal);
    state.daily.map(mapProfile).forEach(upsertReal);
    state.backups.forEach((backup) => upsertReal({
      id:'',userKey:backup.userKey,name:backup.name,seflik:backup.seflik,lastSeen:backup.createdAt,lastSeenMs:backup.createdAtMs,
      ip:'-',deviceId:'Drive',platform:'Drive',browser:'-',version:backup.version,raw:backup.raw
    }));

    // Sadece IP/cihaz taşıyan event satırları ayrı boş kullanıcı oluşturmaz;
    // eşleşen gerçek kullanıcının teknik bilgilerini tamamlar.
    [...state.events, ...state.usage].map(mapProfile).forEach((technical) => {
      const byKey = compact(technical.userKey);
      const byId = compact(technical.id);
      const targetKey = (byKey && map.has(byKey) ? byKey : '') || (byId && idIndex.get(byId)) || '';
      if (!targetKey) return;
      const target = map.get(targetKey);
      ['ip','deviceId','platform','browser','version'].forEach((field) => {
        if (clean(technical[field]) && technical[field] !== '-' && ((!clean(target[field]) || target[field] === '-') || technical.lastSeenMs >= target.lastSeenMs)) target[field] = technical[field];
      });
      if (technical.lastSeenMs > target.lastSeenMs) { target.lastSeen = technical.lastSeen; target.lastSeenMs = technical.lastSeenMs; }
      map.set(targetKey, target);
    });
    state.users = [...map.values()].filter(validUser).sort((a,b) => b.lastSeenMs - a.lastSeenMs);
  }

  function collectHiddenFromLogs() {
    const set = hiddenSet();
    [...state.logs, ...state.events].forEach((raw) => {
      raw = obj(raw); const payload = obj(first(raw.payload, raw.metadata));
      const type = lower(first(raw.level, raw.message, raw.event_type, payload.action));
      if (!type.includes('hidden_drive') && first(payload.action) !== 'admin_hide_drive_backup') return;
      const id = first(payload.drive_file_id, payload.driveFileId, payload.file_id, payload.fileId, payload.id);
      if (id) set.add(clean(id));
    });
    state.hiddenBackupIds = set; saveHiddenSet(set);
  }

  async function loadDriveBackups() {
    let lastError = '';
    for (const action of ['adminList','listAll']) {
      try {
        const json = await drive(action, {username: ADMIN_USER, seflik: readAdminKey()});
        return arr(first(json.items, json.backups, json.files)).map(mapBackup).filter((b) => b.driveFileId && !state.hiddenBackupIds.has(clean(b.driveFileId)));
      } catch (error) { lastError = errorText(error); }
    }
    state.errors.drive = lastError;
    return [];
  }

  async function loadAll() {
    if (state.loading) return;
    state.loading = true; $('refreshBtn').disabled = true; setStatus('Canlı veriler yükleniyor…');
    try {
      const data = await edge('admin_list_all', {limit: 5000});
      state.profiles = arr(first(data.profiles, data.users));
      state.usage = arr(data.usage);
      state.daily = arr(first(data.daily_usage, data.dailyUsage));
      state.events = arr(data.events); state.logs = arr(data.logs);
      state.blocks = [...arr(data.blocks), ...arr(data.security_blocks)].map(mapBlock).filter((b, i, all) => b.type && b.value && all.findIndex((x) => x.type === b.type && x.value === b.value) === i);
      state.summary = obj(data.summary); collectHiddenFromLogs();
      const driveBackups = await loadDriveBackups();
      const edgeBackups = arr(data.backups).map(mapBackup).filter((b) => b.driveFileId && !state.hiddenBackupIds.has(clean(b.driveFileId)));
      state.backups = (driveBackups.length ? driveBackups : edgeBackups).sort((a,b) => b.createdAtMs - a.createdAtMs);
      mergeUsers(); renderAll();
      setStatus(`Canlı veri yüklendi • ${new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}`);
    } catch (error) {
      setStatus(`Hata: ${errorText(error)}`); toast(errorText(error));
    } finally { state.loading = false; $('refreshBtn').disabled = false; }
  }

  function relatedBackups(user) { const key = identityKey(user); return state.backups.filter((b) => identityKey(b) === key); }
  function isBlockedUser(user) {
    const key = lower(user.userKey), ip = clean(user.ip), device = clean(user.deviceId);
    return state.blocks.some((b) => b.active && ((b.type === 'user_key' && lower(b.value) === key) || (b.type === 'ip' && b.value === ip) || (b.type === 'device_id' && b.value === device)));
  }
  function onlineNow(user) { return user.lastSeenMs && Date.now() - user.lastSeenMs <= 15 * 60 * 1000; }
  function seenToday(user) { return dateKey(user.lastSeen) === todayKey(); }

  function latestSnapshotPerUser(rows) {
    const map = new Map();
    rows.forEach((row) => {
      if (!hasRealIdentity(row.name, row.seflik)) return;
      const key = identityKey(row); if (!key) return;
      const old = map.get(key); if (!old || row.dateMs > old.dateMs) map.set(key, row);
    });
    return [...map.values()];
  }
  function inRange(date, range) {
    const key = dateKey(date), today = todayKey();
    if (!key) return range === 'all';
    if (range === 'day') return key === today;
    if (range === 'week') return weekKey(key) === weekKey(today);
    if (range === 'month') return monthKey(key) === monthKey(today);
    return true;
  }
  function statisticsRecords() {
    const dailyRows = state.daily.map((x) => mapStatRow(x, 'Günlük tablo')).filter((x) => hasRealIdentity(x.name, x.seflik) && (x.count || x.volume) && inRange(x.date, state.range));
    const dailyKeys = new Set(dailyRows.map(identityKey));
    const backupRows = latestSnapshotPerUser(state.backups.map((b) => ({...b, date:b.createdAt, dateMs:b.createdAtMs, source:'Drive yedeği'})).filter((x) => (x.count || x.volume) && inRange(x.date, state.range)))
      .filter((x) => !dailyKeys.has(identityKey(x)));
    if (dailyRows.length || backupRows.length) return [...dailyRows, ...backupRows];
    const usageRows = latestSnapshotPerUser(state.usage.map((x) => mapStatRow(x, 'Son kullanım')).filter((x) => hasRealIdentity(x.name, x.seflik) && (x.count || x.volume) && inRange(x.date, state.range)));
    return usageRows;
  }
  function aggregateByUser(records) {
    const map = new Map();
    records.forEach((row) => {
      const key = identityKey(row); if (!key) return;
      const old = map.get(key) || {name:row.name,seflik:row.seflik,count:0,volume:0,tree:[],wood:[],source:new Set(),dates:[]};
      old.count += num(row.count); old.volume += num(row.volume); old.tree.push(...arr(row.tree)); old.wood.push(...arr(row.wood)); old.source.add(row.source); old.dates.push(row.date); map.set(key, old);
    });
    return [...map.values()].map((x) => ({...x, tree:aggregateCategoryRows(x.tree), wood:aggregateCategoryRows(x.wood), source:[...x.source].join(' + ')})).sort((a,b) => b.volume - a.volume || b.count - a.count);
  }
  function categoryFromUsers(users, field) { return aggregateCategoryRows(users.flatMap((x) => arr(x[field]))); }

  function summarySnapshotRecords() {
    const backupRows = latestSnapshotPerUser(state.backups.map((b) => ({...b, date:b.createdAt, dateMs:b.createdAtMs, source:'Drive yedeği'})).filter((x) => x.count || x.volume));
    const backupKeys = new Set(backupRows.map(identityKey));
    const fallback = latestSnapshotPerUser([...state.daily, ...state.usage].map((x) => mapStatRow(x, 'Son veri')).filter((x) => (x.count || x.volume) && !backupKeys.has(identityKey(x))));
    return [...backupRows, ...fallback];
  }
  function renderSummary() {
    const stats = aggregateByUser(summarySnapshotRecords());
    const totalCount = stats.reduce((s,x) => s + x.count, 0), totalVolume = stats.reduce((s,x) => s + x.volume, 0);
    $('metricUsers').textContent = fmtInt(state.users.length);
    $('metricToday').textContent = fmtInt(state.users.filter(seenToday).length);
    $('metricBackups').textContent = fmtInt(state.backups.length);
    $('metricCount').textContent = fmtInt(totalCount);
    $('metricVolume').textContent = fmtM3(totalVolume);
    $('userCountBadge').textContent = `${fmtInt(state.users.length)} kullanıcı`;
  }

  function filteredUsers() {
    const q = lower($('userSearch').value), filter = $('userFilter').value;
    return state.users.filter((user) => {
      if (filter === 'today' && !seenToday(user)) return false;
      if (filter === 'online' && !onlineNow(user)) return false;
      if (filter === 'blocked' && !isBlockedUser(user)) return false;
      return !q || [user.name,user.seflik,user.ip,user.deviceId,user.platform,user.browser,user.version].join(' ').toLocaleLowerCase('tr-TR').includes(q);
    });
  }
  function renderUsers() {
    const users = filteredUsers(); $('userFilterInfo').textContent = `${fmtInt(users.length)} sonuç`;
    $('userList').innerHTML = users.length ? users.map((user, index) => {
      const globalIndex = state.users.indexOf(user), blocked = isBlockedUser(user), backups = relatedBackups(user).length;
      return `<article class="user-card">
        <div class="user-head"><div class="avatar">${escapeHtml(initials(user.name))}</div><div class="user-title"><h3>${escapeHtml(user.name)}</h3><p>${escapeHtml(user.seflik)} • son giriş ${escapeHtml(fmtDate(user.lastSeen))}</p></div><span class="status-pill">${blocked ? 'Engelli' : onlineNow(user) ? 'Online' : 'Aktif'}</span></div>
        <div class="user-data">
          <div class="data-cell"><small>IP adresi</small><b class="ip">${escapeHtml(user.ip || '-')}</b></div>
          <div class="data-cell"><small>Cihaz</small><b>${escapeHtml(user.deviceId || '-')}</b></div>
          <div class="data-cell"><small>Platform</small><b>${escapeHtml(user.platform || '-')}</b></div>
          <div class="data-cell"><small>Tarayıcı</small><b>${escapeHtml(user.browser || '-')}</b></div>
          <div class="data-cell"><small>Kullandığı sürüm</small><b>${escapeHtml(user.version || 'Sürüm bekleniyor')}</b></div>
          <div class="data-cell"><small>Drive yedek</small><b>${fmtInt(backups)}</b></div>
        </div>
        <div class="user-actions"><button class="button info" data-action="detail" data-user-index="${globalIndex}" type="button">Detay</button><button class="button warning" data-action="block" data-user-index="${globalIndex}" type="button">Engelle</button><button class="button danger" data-action="delete-user" data-user-index="${globalIndex}" type="button">Kullanıcıyı sil</button></div>
      </article>`;
    }).join('') : '<div class="empty-state">Filtreye uygun gerçek kullanıcı bulunamadı.</div>';
  }

  function renderStats() {
    const records = statisticsRecords(), users = aggregateByUser(records);
    const count = users.reduce((s,x) => s+x.count, 0), volume = users.reduce((s,x) => s+x.volume, 0);
    const sources = [...new Set(users.flatMap((x) => x.source.split(' + ')).filter(Boolean))];
    $('statsCount').textContent = fmtInt(count); $('statsVolume').textContent = fmtM3(volume);
    $('statsSourceBadge').textContent = sources.length ? sources.join(' + ') : 'Veri yok';
    $('statsCountNote').textContent = `${users.length} kullanıcı • tekrarsız`;
    $('statsVolumeNote').textContent = `${rangeLabel(state.range)} toplamı`;
    $('chartTitle').textContent = `${rangeLabel(state.range)} hareket`;
    renderChart(records);
    renderRanking($('userRanking'), users.map((x) => ({name:x.name,sub:x.seflik,count:x.count,volume:x.volume})), 'Kullanıcı verisi yok');
    const trees = categoryFromUsers(users, 'tree'), woods = categoryFromUsers(users, 'wood');
    renderRanking($('treeBreakdown'), trees, 'Bu dönemde ağaç türü detayı gönderilmemiş.');
    renderRanking($('woodBreakdown'), woods, 'Bu dönemde odun / emval türü detayı gönderilmemiş.');
    $('statsNotice').textContent = records.length
      ? 'Hesaplama kuralı: Günlük tabloda kayıt bulunan kullanıcı için yalnızca günlük tablo kullanılır. Günlük kaydı olmayan kullanıcı için seçili dönemdeki en yeni Drive yedeği alınır; aynı kullanıcının birden fazla yedeği toplanmaz.'
      : 'Seçili dönemde veri yok. Kullanıcı Mesaha dosyasını indir, Yedek al veya Buluta yedekle işlemi yaptığında istatistik kaydı oluşur.';
    renderSummary();
  }
  function rangeLabel(range) { return ({day:'Günlük',week:'Haftalık',month:'Aylık',all:'Tüm zaman'})[range] || 'Dönem'; }
  function renderRanking(container, rows, emptyText) {
    const max = Math.max(0, ...rows.map((x) => num(x.volume) || num(x.count)));
    container.innerHTML = rows.length ? rows.slice(0, 30).map((row) => {
      const value = num(row.volume) || num(row.count), width = max ? Math.max(4, (value/max)*100) : 0;
      return `<div class="rank-row"><div class="rank-name"><b>${escapeHtml(row.name)}</b><small>${escapeHtml(row.sub || (row.count ? `${fmtInt(row.count)} adet` : ''))}</small></div><div class="progress"><i style="width:${width.toFixed(1)}%"></i></div><b class="rank-value">${row.volume ? `${fmtM3(row.volume)} m³` : fmtInt(row.count)}</b></div>`;
    }).join('') : `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
  }
  function renderChart(records) {
    const grouped = new Map();
    records.forEach((row) => {
      const key = dateKey(row.date) || 'Bilinmeyen'; const old = grouped.get(key) || {count:0,volume:0};
      old.count += num(row.count); old.volume += num(row.volume); grouped.set(key, old);
    });
    let points = [...grouped.entries()].sort((a,b) => a[0].localeCompare(b[0]));
    if (!points.length) { $('statsChart').innerHTML = '<div class="empty-state" style="margin:18px">Grafik için veri yok.</div>'; return; }
    if (state.range === 'day' && points.length === 1) {
      const v = points[0][1]; points = [['00:00',{count:0,volume:0}],['12:00',v],['23:59',{count:0,volume:0}]];
    }
    const width=760,height=230,padL=46,padR=28,padT=24,padB=38,innerW=width-padL-padR,innerH=height-padT-padB;
    const maxCount=Math.max(1,...points.map(([,v])=>v.count)),maxVolume=Math.max(.001,...points.map(([,v])=>v.volume));
    const step=innerW/Math.max(1,points.length),barW=Math.min(34,step*.45);
    const coords=[]; let bars='', labels='';
    points.forEach(([label,v],i)=>{const x=padL+step*i+step/2;const bh=(v.count/maxCount)*innerH;const y=padT+innerH-(v.volume/maxVolume)*innerH;bars+=`<rect x="${(x-barW/2).toFixed(1)}" y="${(padT+innerH-bh).toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="5" fill="#b7d5b1"/>`;coords.push([x,y]);labels+=`<text x="${x.toFixed(1)}" y="${height-14}" text-anchor="middle" fill="#6f7e75" font-size="10">${escapeHtml(label.slice(5) || label)}</text>`});
    const line=coords.map((c,i)=>`${i?'L':'M'} ${c[0].toFixed(1)} ${c[1].toFixed(1)}`).join(' ');
    const circles=coords.map(c=>`<circle cx="${c[0]}" cy="${c[1]}" r="4" fill="#fff" stroke="#355e47" stroke-width="3"/>`).join('');
    const grid=[0,.25,.5,.75,1].map((ratio)=>{const y=padT+innerH-innerH*ratio;return `<line x1="${padL}" y1="${y}" x2="${width-padR}" y2="${y}" stroke="#e3ebe0"/><text x="${padL-8}" y="${y+4}" text-anchor="end" fill="#87948c" font-size="9">${fmtInt(maxCount*ratio)}</text>`}).join('');
    $('statsChart').innerHTML=`<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img">${grid}${bars}<path d="${line}" fill="none" stroke="#355e47" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${circles}${labels}</svg>`;
  }

  function filteredBackups() {
    const q=lower($('backupSearch').value),sort=$('backupSort').value;
    return state.backups.filter((b)=>!q||[b.fileName,b.name,b.seflik,b.createdAt,b.driveFileId].join(' ').toLocaleLowerCase('tr-TR').includes(q)).sort((a,b)=>sort==='old'?a.createdAtMs-b.createdAtMs:b.createdAtMs-a.createdAtMs);
  }
  function renderBackups() {
    const rows=filteredBackups(); $('backupCountBadge').textContent=`${fmtInt(rows.length)} yedek`;
    $('backupList').innerHTML=rows.length?rows.map((b)=>`<article class="backup-card" data-backup-id="${escapeHtml(b.driveFileId)}"><div class="backup-main"><div class="file-badge">JSON</div><div><h3>${escapeHtml(b.fileName)}</h3><p>${escapeHtml(b.name)} • ${escapeHtml(b.seflik)}</p><p>${escapeHtml(fmtDate(b.createdAt))}${b.version&&b.version!=='-'?` • ${escapeHtml(b.version)}`:''}</p></div></div><div class="backup-stats"><div><small>Kayıt</small><b>${fmtInt(b.count)}</b></div><div><small>m³</small><b>${fmtM3(b.volume)}</b></div></div><div class="backup-actions"><a class="button info small" href="${escapeHtml(b.driveLink||'#')}" target="_blank" rel="noopener">Drive aç</a><button class="button danger small" data-action="hide-backup" data-backup-id="${escapeHtml(b.driveFileId)}" type="button">Sil / Gizle</button></div></article>`).join(''):'<div class="empty-state">Görünen Drive yedeği yok.</div>';
  }

  function activeBlocks(type=state.blockView) { return state.blocks.filter((b)=>b.active&&b.type===type).sort((a,b)=>ms(b.createdAt)-ms(a.createdAt)); }
  function blockedDisplay(block) {
    if (block.type==='user_key') {
      const user=state.users.find((u)=>lower(u.userKey)===lower(block.value));
      return {title:user?user.name:'Kullanıcı engeli',sub:user?user.seflik:block.value};
    }
    return {title:block.type==='ip'?'IP adresi':'Cihaz',sub:block.value};
  }
  function renderBlocks() {
    const q=lower($('blockSearch').value); let rows=activeBlocks().filter((b)=>!q||[b.value,b.reason,b.createdAt].join(' ').toLocaleLowerCase('tr-TR').includes(q));
    $('blockedUsersCount').textContent=fmtInt(activeBlocks('user_key').length);$('blockedIpsCount').textContent=fmtInt(activeBlocks('ip').length);$('blockedDevicesCount').textContent=fmtInt(activeBlocks('device_id').length);$('blockCountBadge').textContent=`${fmtInt(state.blocks.filter((b)=>b.active).length)} engel`;
    $('blockList').innerHTML=rows.length?rows.map((b)=>{const d=blockedDisplay(b);return `<article class="block-card"><div><h3>${escapeHtml(d.title)}</h3><span class="block-value">${escapeHtml(d.sub)}</span><p>${escapeHtml(b.reason)} • ${escapeHtml(fmtDate(b.createdAt))}</p></div><div class="block-actions"><button class="button danger small" data-action="unblock" data-block-id="${escapeHtml(b.id)}" data-block-type="${escapeHtml(b.type)}" data-block-value="${escapeHtml(b.value)}" type="button">Engeli kaldır</button></div></article>`}).join(''):'<div class="empty-state">Bu bölümde aktif engel yok.</div>';
  }

  function renderAll(){renderUsers();renderStats();renderBackups();renderBlocks();renderSummary()}
  function switchPage(page){state.page=page;document.querySelectorAll('.page').forEach((el)=>el.classList.toggle('is-active',el.dataset.page===page));document.querySelectorAll('.nav-item').forEach((el)=>el.classList.toggle('is-active',el.dataset.pageTarget===page));if(page==='stats')renderStats();if(page==='backups')renderBackups();if(page==='manage')renderBlocks();window.scrollTo({top:0,behavior:'smooth'})}
  function openModal(title,html){$('modalTitle').textContent=title;$('modalBody').innerHTML=html;$('modal').classList.add('is-open');$('modal').setAttribute('aria-hidden','false')}
  function closeModal(){$('modal').classList.remove('is-open');$('modal').setAttribute('aria-hidden','true')}

  async function blockUser(user){
    const options=[`1 - Kullanıcı (${user.name})`,user.ip&&user.ip!=='-'?`2 - IP (${user.ip})`:'',user.deviceId&&user.deviceId!=='-'?`3 - Cihaz (${user.deviceId})`:''].filter(Boolean).join('\n');
    const choice=prompt(`Engel türünü seç:\n${options}`,'1'); if(!choice)return;
    let type='user_key',value=user.userKey;if(choice==='2'){type='ip';value=user.ip}else if(choice==='3'){type='device_id';value=user.deviceId}
    if(!clean(value)||value==='-')throw new Error('Engellenecek değer bulunamadı');
    await edge('admin_add_block',{block_type:type,block_value:value,reason:'Admin panel engeli'});toast('Engel eklendi');await loadAll();
  }
  async function deleteUser(user){
    if(!confirm(`${user.name} kullanıcısı ve Supabase kayıtları silinsin mi? Drive dosyaları fiziksel olarak korunur.`))return;
    const ids=relatedBackups(user).map((b)=>b.driveFileId).filter(Boolean);
    await edge('admin_delete_user',{user_id:user.id,user_key:user.userKey,name:user.name,seflik:user.seflik,drive_file_ids:ids});
    state.users=state.users.filter((u)=>identityKey(u)!==identityKey(user));state.backups=state.backups.filter((b)=>identityKey(b)!==identityKey(user));renderAll();toast('Kullanıcı silindi');
  }
  async function hideBackup(id){
    const backup=state.backups.find((b)=>clean(b.driveFileId)===clean(id));if(!backup)throw new Error('Yedek bulunamadı');
    if(!confirm('Bu yedek admin panelinden kaldırılsın mı? Google Drive dosyası fiziksel olarak silinmez.'))return;
    state.hiddenBackupIds.add(clean(id));saveHiddenSet(state.hiddenBackupIds);state.backups=state.backups.filter((b)=>clean(b.driveFileId)!==clean(id));renderBackups();renderSummary();
    try{await edge('admin_hide_drive_backup',{drive_file_id:id,file_id:id,user_key:backup.userKey,name:backup.name,seflik:backup.seflik});toast('Yedek panelden kaldırıldı')}catch(error){toast(`Panelden kaldırıldı; Edge uyarısı: ${errorText(error)}`)}
  }
  async function unblock(button){await edge('admin_remove_block',{id:button.dataset.blockId,block_type:button.dataset.blockType,block_value:button.dataset.blockValue});toast('Engel kaldırıldı');await loadAll()}
  async function addIp(){const ip=prompt('Engellenecek IP adresi:');if(!clean(ip))return;if(!isLikelyIp(ip)&&!confirm('Girilen değer standart IP biçiminde görünmüyor. Yine de engellensin mi?'))return;await edge('admin_add_block',{block_type:'ip',block_value:clean(ip),reason:'Manuel IP engeli'});toast('IP engeli eklendi');await loadAll()}

  function userDetail(user){
    openModal('Kullanıcı detayı',`<div class="detail-grid"><div><small>Kullanıcı</small><b>${escapeHtml(user.name)}</b></div><div><small>Şeflik</small><b>${escapeHtml(user.seflik)}</b></div><div><small>IP</small><b class="ip">${escapeHtml(user.ip||'-')}</b></div><div><small>Cihaz</small><b>${escapeHtml(user.deviceId||'-')}</b></div><div><small>Platform</small><b>${escapeHtml(user.platform||'-')}</b></div><div><small>Tarayıcı</small><b>${escapeHtml(user.browser||'-')}</b></div><div><small>Kullandığı sürüm</small><b>${escapeHtml(user.version||'-')}</b></div><div><small>Son giriş</small><b>${escapeHtml(fmtDate(user.lastSeen))}</b></div></div><pre class="raw-data">${escapeHtml(JSON.stringify(user.raw||user,null,2))}</pre>`)
  }

  async function login(){
    const username=lower($('loginUser').value),password=clean($('loginPass').value);
    if(username!==ADMIN_USER||!password){$('loginMessage').textContent='Kullanıcı adı veya şifre hatalı.';return}
    $('loginMessage').textContent='Giriş doğrulanıyor…';$('loginBtn').disabled=true;
    sessionStorage.setItem(SESSION_KEY,password);
    try{
      await edge('admin_list_blocks');
      sessionStorage.setItem(SESSION_LOGIN,'1');$('loginMessage').textContent='';showAdmin();loadAll();
    }catch(error){sessionStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(SESSION_LOGIN);$('loginMessage').textContent=errorText(error)}
    finally{$('loginBtn').disabled=false}
  }
  function showAdmin(){$('loginView').classList.add('is-hidden');$('adminView').classList.remove('is-hidden')}
  function logout(){sessionStorage.removeItem(SESSION_LOGIN);sessionStorage.removeItem(SESSION_KEY);location.reload()}

  function bind(){
    $('versionLabel').textContent=ADMIN_VERSION;$('loginBtn').addEventListener('click',()=>login());$('loginPass').addEventListener('keydown',(e)=>{if(e.key==='Enter')login()});$('refreshBtn').addEventListener('click',loadAll);$('logoutBtn').addEventListener('click',logout);
    document.querySelectorAll('.nav-item').forEach((button)=>button.addEventListener('click',()=>switchPage(button.dataset.pageTarget)));
    document.querySelectorAll('.range-tab').forEach((button)=>button.addEventListener('click',()=>{state.range=button.dataset.range;document.querySelectorAll('.range-tab').forEach((x)=>x.classList.toggle('is-active',x===button));renderStats()}));
    document.querySelectorAll('.manage-tab').forEach((button)=>button.addEventListener('click',()=>{state.blockView=button.dataset.blockView;document.querySelectorAll('.manage-tab').forEach((x)=>x.classList.toggle('is-active',x===button));renderBlocks()}));
    ['userSearch','userFilter'].forEach((id)=>$(id).addEventListener('input',renderUsers));['backupSearch','backupSort'].forEach((id)=>$(id).addEventListener('input',renderBackups));$('blockSearch').addEventListener('input',renderBlocks);
    $('clearUserFilter').addEventListener('click',()=>{$('userSearch').value='';$('userFilter').value='all';renderUsers()});$('clearBackupFilter').addEventListener('click',()=>{$('backupSearch').value='';$('backupSort').value='new';renderBackups()});$('addIpBtn').addEventListener('click',()=>addIp().catch((e)=>toast(errorText(e))));
    $('modalClose').addEventListener('click',closeModal);$('modal').addEventListener('click',(e)=>{if(e.target===$('modal'))closeModal()});
    document.addEventListener('click',(e)=>{const button=e.target.closest('[data-action]');if(!button)return;const action=button.dataset.action;const user=state.users[Number(button.dataset.userIndex)];if(action==='detail'&&user)userDetail(user);if(action==='block'&&user)blockUser(user).catch((x)=>toast(errorText(x)));if(action==='delete-user'&&user)deleteUser(user).catch((x)=>toast(errorText(x)));if(action==='hide-backup')hideBackup(button.dataset.backupId).catch((x)=>toast(errorText(x)));if(action==='unblock')unblock(button).catch((x)=>toast(errorText(x))) });
  }

  function init(){bind();if(sessionStorage.getItem(SESSION_LOGIN)==='1'){showAdmin();loadAll()}}
  init();
})();
