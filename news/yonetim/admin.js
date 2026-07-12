(() => {
  'use strict';

  const ADMIN_VERSION = 'V5.72 •Yakupp•';
  const EDGE_URL = 'https://swrbpdpotmirnmtqnuba.supabase.co/functions/v1/smooth-function';
  const SESSION_KEY = 'mesaha_admin_auth_v548_session';
  const LAST_ACTIVITY_KEY = 'mesaha_admin_auth_v548_activity';
  const HIDDEN_BACKUPS_KEY = 'mesaha_admin_hidden_drive_v548';
  const IDLE_MS = 20 * 60 * 1000;
  const ISTANBUL_TZ = 'Europe/Istanbul';

  const $ = (id) => document.getElementById(id);
  const state = {
    page: 'users', range: 'day', blockView: 'user_key', accessStatus: 'pending',
    profiles: [], usage: [], daily: [], events: [], logs: [], audit: [], blocks: [], backups: [], users: [], userAccess: [], userAuthEvents: [], seflikFolders: [], seflikMembers: [],
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
  function readSession(){try{return obj(JSON.parse(sessionStorage.getItem(SESSION_KEY)||'{}'))}catch{return {}}}
  function saveSession(value){try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(value||{}));sessionStorage.setItem(LAST_ACTIVITY_KEY,String(Date.now()))}catch{}}
  function clearSession(){try{sessionStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(LAST_ACTIVITY_KEY)}catch{}}
  function cfg(){const c=window.MESAHA_SUPABASE_CONFIG||{};return{url:clean(c.url).replace(/\/+$/,''),anonKey:clean(c.anonKey||c.anon_key)}}
  function hiddenSet() {
    try { return new Set(arr(JSON.parse(localStorage.getItem(HIDDEN_BACKUPS_KEY) || '[]')).map(clean).filter(Boolean)); }
    catch { return new Set(); }
  }
  function saveHiddenSet(set) { try { localStorage.setItem(HIDDEN_BACKUPS_KEY, JSON.stringify([...set])); } catch {} }
  async function refreshSession(){
    const c=cfg(), old=readSession();if(!c.url||!c.anonKey||!old.refresh_token)throw new Error('Yönetim oturumu sona erdi');
    const res=await fetch(c.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',apikey:c.anonKey},body:JSON.stringify({refresh_token:old.refresh_token})});
    const text=await res.text();let out={};try{out=text?JSON.parse(text):{}}catch{}
    if(!res.ok||!out.access_token)throw new Error(out.error_description||out.message||'Oturum yenilenemedi');
    const next={access_token:out.access_token,refresh_token:out.refresh_token||old.refresh_token,expires_at:out.expires_at||Math.floor(Date.now()/1000)+Number(out.expires_in||3600),user:out.user||old.user||{}};saveSession(next);return next;
  }
  async function validSession(){let sess=readSession();if(!sess.access_token)return null;if(Number(sess.expires_at||0)*1000<Date.now()+60000){try{sess=await refreshSession()}catch{return null}}return sess}
  async function rawEdge(action,data={},session=null){
    const c=cfg(),headers={'Content-Type':'application/json','apikey':c.anonKey};if(session&&session.access_token)headers.Authorization='Bearer '+session.access_token;
    const response=await fetch(EDGE_URL,{method:'POST',cache:'no-store',headers,body:JSON.stringify({action,...data})});
    const text=await response.text();let json;try{json=text?JSON.parse(text):{}}catch{throw new Error(`Edge cevabı okunamadı: ${text.slice(0,100)}`)}
    if(!response.ok||!json.ok){const e=new Error(json.error||json.reason||`Edge hata ${response.status}`);e.status=response.status;e.payload=json;throw e}return json;
  }
  async function edge(action,data={}){
    let sess=await validSession();if(!sess)throw new Error('Yönetim oturumu sona erdi');
    try{return await rawEdge(action,data,sess)}catch(error){if(error.status===401){sess=await refreshSession();return await rawEdge(action,data,sess)}throw error}
  }
  async function drive(){return await edge('admin_drive_list')}
  async function authLogout(scope,token){
    const c=cfg();if(!c.url||!c.anonKey||!token)return;
    try{await fetch(c.url+'/auth/v1/logout?scope='+scope,{method:'POST',cache:'no-store',headers:{apikey:c.anonKey,Authorization:'Bearer '+token}})}catch{}
  }
  function touchActivity(){try{sessionStorage.setItem(LAST_ACTIVITY_KEY,String(Date.now()))}catch{}}


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
      avatarUrl: first(raw.avatar_url, raw.google_avatar_url, raw.picture, raw.photo_url, payload.avatar_url, payload.google_avatar_url, payload.picture, obj(raw.metadata).avatar_url, obj(raw.metadata).google_avatar_url, obj(raw.metadata).picture),
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
      avatarUrl: first(raw.avatar_url, raw.google_avatar_url, raw.picture, payload.avatar_url, payload.google_avatar_url, user.avatar_url, user.picture),
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
      const old = map.get(key) || {name:user.name,seflik:user.seflik,userKey:user.userKey,id:user.id,lastSeenMs:0,ip:'-',deviceId:'-',platform:'-',browser:'-',version:'-',avatarUrl:'',raw:user.raw};
      if (user.lastSeenMs >= old.lastSeenMs) {
        ['id','userKey','name','seflik','bolme','lastSeen','lastSeenMs','avatarUrl','raw'].forEach((field) => { if (user[field] !== undefined && clean(user[field]) !== '') old[field] = user[field]; });
        ['ip','deviceId','platform','browser','version','avatarUrl'].forEach((field) => { if (clean(user[field]) && user[field] !== '-') old[field] = user[field]; });
      } else {
        ['ip','deviceId','platform','browser','version','avatarUrl'].forEach((field) => { if ((!clean(old[field]) || old[field] === '-') && clean(user[field]) && user[field] !== '-') old[field] = user[field]; });
      }
      map.set(key, old);
      if (clean(old.id)) idIndex.set(compact(old.id), key);
    };
    state.profiles.map(mapProfile).forEach(upsertReal);
    state.usage.map(mapProfile).forEach(upsertReal);
    state.daily.map(mapProfile).forEach(upsertReal);
    state.backups.forEach((backup) => upsertReal({
      id:'',userKey:backup.userKey,name:backup.name,seflik:backup.seflik,lastSeen:backup.createdAt,lastSeenMs:backup.createdAtMs,
      ip:'-',deviceId:'Drive',platform:'Drive',browser:'-',version:backup.version,avatarUrl:backup.avatarUrl,raw:backup.raw
    }));

    // Sadece IP/cihaz taşıyan event satırları ayrı boş kullanıcı oluşturmaz;
    // eşleşen gerçek kullanıcının teknik bilgilerini tamamlar.
    [...state.events, ...state.usage].map(mapProfile).forEach((technical) => {
      const byKey = compact(technical.userKey);
      const byId = compact(technical.id);
      const targetKey = (byKey && map.has(byKey) ? byKey : '') || (byId && idIndex.get(byId)) || '';
      if (!targetKey) return;
      const target = map.get(targetKey);
      ['ip','deviceId','platform','browser','version','avatarUrl'].forEach((field) => {
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
    try{const data=await drive();return arr(first(data.items,data.backups,data.files)).map(mapBackup).filter((b)=>b.driveFileId&&!state.hiddenBackupIds.has(clean(b.driveFileId)))}
    catch(error){state.errors.drive=errorText(error);return []}
  }

  async function loadAll() {
    if (state.loading) return;
    state.loading = true; $('refreshBtn').disabled = true; setStatus('Canlı veriler yükleniyor…');
    try {
      const data = await edge('admin_list_all', {limit: 5000});
      state.profiles = arr(first(data.profiles, data.users));
      state.usage = arr(data.usage);
      state.daily = arr(first(data.daily_usage, data.dailyUsage));
      state.events = arr(data.events); state.logs = arr(data.logs); state.audit = arr(first(data.admin_audit_logs,data.adminAuditLogs));
      state.userAccess = arr(first(data.user_access,data.userAccess)); state.userAuthEvents = arr(first(data.user_auth_events,data.userAuthEvents));
      state.seflikFolders = arr(first(data.seflik_folders,data.seflikFolders)); state.seflikMembers = arr(first(data.seflik_members,data.seflikMembers));
      state.blocks = [...arr(data.blocks), ...arr(data.security_blocks)].map(mapBlock).filter((b, i, all) => b.type && b.value && all.findIndex((x) => x.type === b.type && x.value === b.value) === i);
      state.summary = obj(data.summary); collectHiddenFromLogs();
      const driveBackups = await loadDriveBackups();
      const edgeBackups = arr(data.backups).map(mapBackup).filter((b) => b.driveFileId && !state.hiddenBackupIds.has(clean(b.driveFileId)));
      state.backups = (driveBackups.length ? driveBackups : edgeBackups).sort((a,b) => b.createdAtMs - a.createdAtMs);
      mergeUsers(); renderAll();
      setStatus(`Canlı veri yüklendi • ${new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}`);
    } catch (error) {
      if(error&&((error.status===401)||(error.status===403))){clearSession();setStatus('Yönetim oturumu sona erdi.');setTimeout(()=>location.reload(),300);return;}
      setStatus(`Hata: ${errorText(error)}`); toast(errorText(error));
    } finally { state.loading = false; $('refreshBtn').disabled = false; }
  }

  function relatedBackups(user) { const key = identityKey(user); return state.backups.filter((b) => identityKey(b) === key); }
  function isBlockedUser(user) {
    const id = clean(user.id);
    const accessRevoked = state.userAccess.some((x) => clean(x.user_id) === id && clean(x.status) === 'revoked');
    const idBlocked = state.blocks.some((b) => b.active && b.type === 'user_id' && clean(b.value) === id);
    const keyBlocked = state.blocks.some((b) => b.active && b.type === 'user_key' && lower(b.value) === lower(user.userKey));
    return accessRevoked || idBlocked || keyBlocked;
  }
  function googleInfoForUser(user) {
    const id = clean(user && user.id);
    const name = lower(user && user.name), seflik = lower(user && user.seflik);
    const rows = state.userAccess.map(obj);
    let row = rows.find((r) => id && clean(r.user_id) === id && ['approved','revoked'].includes(clean(r.status)));
    if (!row) row = rows.find((r) => clean(r.status) === 'approved' && lower(first(r.canonical_name, r.requested_name)) === name && lower(first(r.canonical_seflik, r.requested_seflik)) === seflik);
    const avatarFromRaw = first(user && user.avatarUrl, path(user&&user.raw||{}, 'avatar_url'), path(user&&user.raw||{}, 'google_avatar_url'), path(user&&user.raw||{}, 'picture'), path(user&&user.raw||{}, 'metadata.avatar_url'), path(user&&user.raw||{}, 'metadata.google_avatar_url'), path(user&&user.raw||{}, 'metadata.picture'), path(user&&user.raw||{}, 'payload.avatar_url'), path(user&&user.raw||{}, 'payload.google_avatar_url'));
    if (row) return {email:first(row.email, 'Google hesabı'), status:clean(row.status), avatarUrl:first(row.avatar_url, obj(row.metadata).avatar_url, obj(row.metadata).google_avatar_url, obj(row.metadata).picture, avatarFromRaw)};
    const raw = lower(JSON.stringify(user && user.raw || {}));
    if (raw.includes('google') || raw.includes('gmail.com')) return {email:first(path(user.raw||{}, 'email'), 'Google hesabı'), status:'approved', avatarUrl:avatarFromRaw};
    return null;
  }
  function avatarUrlForUser(user) {
    const google = googleInfoForUser(user) || {};
    return first(user && user.avatarUrl, google.avatarUrl, path(user&&user.raw||{}, 'avatar_url'), path(user&&user.raw||{}, 'metadata.avatar_url'), path(user&&user.raw||{}, 'payload.avatar_url'));
  }
  function avatarHtml(user, cls='avatar') {
    const url = avatarUrlForUser(user), nm = first(user && user.name, '?');
    return url ? `<img class="${escapeHtml(cls)} user-photo-avatar" src="${escapeHtml(url)}" alt="${escapeHtml(nm)}" referrerpolicy="no-referrer" loading="lazy">` : `<div class="${escapeHtml(cls)}">${escapeHtml(initials(nm))}</div>`;
  }
  function terminalInfoForUser(user) {
    const raw = lower(JSON.stringify(user && user.raw || {}));
    const key = identityKey(user);
    const fromRaw = /terminal-cloud|terminal[_-]?cloud|terminal[_-]?kod|terminal[_-]?code|pair[_-]?code|paireduserid|terminal_token|terminaltoken/.test(raw);
    const fromBackup = state.backups.some((b) => identityKey(b) === key && /terminal-cloud|terminal[_-]?cloud|pair[_-]?code|terminal/.test(lower(JSON.stringify(b.raw || {}))));
    const fromEvent = state.events.some((e) => { const p=obj(first(e.payload,e.metadata,e.detail)); return identityKey({name:first(e.name,p.name),seflik:first(e.seflik,p.seflik),userKey:first(e.user_key,p.userKey,p.user_key)})===key && /terminal/.test(lower(JSON.stringify(e))); });
    return (fromRaw || fromBackup || fromEvent) ? {status:'paired', title:'Terminal kodu ile eşleşmiş cihaz/kullanıcı'} : null;
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
      const globalIndex = state.users.indexOf(user), blocked = isBlockedUser(user), backups = relatedBackups(user).length, google = googleInfoForUser(user);
      const googleBadge = google ? `<span class="google-user-badge" title="${escapeHtml(google.email)}" aria-label="Google ile doğrulandı"><span class="google-g">G</span><b>Google</b></span>` : '';
      const terminal = terminalInfoForUser(user);
      const terminalBadge = terminal ? `<span class="terminal-user-badge" title="${escapeHtml(terminal.title)}" aria-label="Terminal kodu ile eşleşti"><span class="terminal-g">T</span><b>Terminal kodlu</b></span>` : '';
      return `<article class="user-card ${google ? 'is-google-user' : ''} ${terminal ? 'is-terminal-user' : ''}">
        <div class="user-head">${avatarHtml(user)}<div class="user-title"><h3>${escapeHtml(user.name)} ${googleBadge} ${terminalBadge}</h3><p>${escapeHtml(user.seflik)} • son giriş ${escapeHtml(fmtDate(user.lastSeen))}</p></div><span class="status-pill">${blocked ? 'Engelli' : onlineNow(user) ? 'Online' : 'Aktif'}</span></div>
        <div class="user-data">
          <div class="data-cell"><small>IP adresi</small><b class="ip">${escapeHtml(user.ip || '-')}</b></div>
          <div class="data-cell"><small>Cihaz</small><b>${escapeHtml(user.deviceId || '-')}</b></div>
          <div class="data-cell"><small>Platform</small><b>${escapeHtml(user.platform || '-')}</b></div>
          <div class="data-cell"><small>Tarayıcı</small><b>${escapeHtml(user.browser || '-')}</b></div>
          <div class="data-cell"><small>Kullandığı sürüm</small><b>${escapeHtml(user.version || 'Sürüm bekleniyor')}</b></div>
          <div class="data-cell"><small>Drive yedek</small><b>${fmtInt(backups)}</b></div><div class="data-cell"><small>Giriş tipi</small><b>${terminal ? 'Terminal kodlu' : google ? 'Google' : 'Yerel'}</b></div>
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
    $('backupList').innerHTML=rows.length?rows.map((b)=>`<article class="backup-card" data-backup-id="${escapeHtml(b.driveFileId)}"><div class="backup-main"><div class="file-badge">JSON</div><div><h3>${escapeHtml(b.fileName)}</h3><p>${escapeHtml(b.name)} • ${escapeHtml(b.seflik)}</p><p>${escapeHtml(fmtDate(b.createdAt))}${b.version&&b.version!=='-'?` • ${escapeHtml(b.version)}`:''}</p></div></div><div class="backup-stats"><div><small>Kayıt</small><b>${fmtInt(b.count)}</b></div><div><small>m³</small><b>${fmtM3(b.volume)}</b></div></div><div class="backup-actions"><a class="button info small" href="${escapeHtml(b.driveLink||'#')}" target="_blank" rel="noopener">Drive aç</a><button class="button danger small" data-action="hide-backup" data-backup-id="${escapeHtml(b.driveFileId)}" type="button">Kalıcı Sil</button></div></article>`).join(''):'<div class="empty-state">Görünen Drive yedeği yok.</div>';
  }

  function activeBlocks(type=state.blockView) { return state.blocks.filter((b)=>b.active&&(type==='user_key' ? (b.type==='user_key'||b.type==='user_id') : b.type===type)).sort((a,b)=>ms(b.createdAt)-ms(a.createdAt)); }
  function blockedDisplay(block) {
    if (block.type==='user_key') {
      const user=state.users.find((u)=>lower(u.userKey)===lower(block.value));
      return {title:user?user.name:'Kullanıcı engeli',sub:user?user.seflik:block.value};
    }
    if (block.type==='user_id') {
      const user=state.users.find((u)=>clean(u.id)===clean(block.value));
      const google=user&&googleInfoForUser(user);
      return {title:user?user.name:'Doğrulanmış kullanıcı engeli',sub:user?(user.seflik+(google?' • Google':'') ):block.value};
    }
    return {title:block.type==='ip'?'IP adresi':'Cihaz',sub:block.value};
  }
  function renderBlocks() {
    const q=lower($('blockSearch').value); let rows=activeBlocks().filter((b)=>!q||[b.value,b.reason,b.createdAt].join(' ').toLocaleLowerCase('tr-TR').includes(q));
    $('blockedUsersCount').textContent=fmtInt(activeBlocks('user_key').length);$('blockedIpsCount').textContent=fmtInt(activeBlocks('ip').length);$('blockedDevicesCount').textContent=fmtInt(activeBlocks('device_id').length);$('blockCountBadge').textContent=`${fmtInt(state.blocks.filter((b)=>b.active).length)} engel`;/* user_key sekmesi doğrulanmış user_id engellerini de gösterir */
    $('blockList').innerHTML=rows.length?rows.map((b)=>{const d=blockedDisplay(b);return `<article class="block-card"><div><h3>${escapeHtml(d.title)}</h3><span class="block-value">${escapeHtml(d.sub)}</span><p>${escapeHtml(b.reason)} • ${escapeHtml(fmtDate(b.createdAt))}</p></div><div class="block-actions"><button class="button danger small" data-action="unblock" data-block-id="${escapeHtml(b.id)}" data-block-type="${escapeHtml(b.type)}" data-block-value="${escapeHtml(b.value)}" type="button">Engeli kaldır</button></div></article>`}).join(''):'<div class="empty-state">Bu bölümde aktif engel yok.</div>';
  }

  function renderSecurityLogs(){
    const box=$('adminSecurityLogList');if(!box)return;
    const rows=state.audit.slice().sort((a,b)=>ms(b.created_at)-ms(a.created_at)).slice(0,100);
    $('adminSecurityLogCount').textContent=fmtInt(rows.length)+' kayıt';
    box.innerHTML=rows.length?rows.map((r)=>`<article class="security-log ${r.success?'ok':'fail'}"><div><b>${escapeHtml(r.event_type||'admin_event')}</b><small>${escapeHtml(r.email||'Bilinmeyen hesap')} • ${escapeHtml(r.ip_address||'-')}</small></div><div><span>${r.success?'Başarılı':'Reddedildi'}</span><small>${escapeHtml(fmtDate(r.created_at))}${r.reason?' • '+escapeHtml(r.reason):''}</small></div></article>`).join(''):'<div class="empty-state">Henüz yönetim güvenlik kaydı yok.</div>';
  }
  function accessStatusText(status){return({pending:'Onay bekliyor',approved:'Onaylı',rejected:'Reddedildi',revoked:'Erişim kapalı'})[clean(status)]||clean(status)||'Kayıtsız'}
  function renderGoogleAccess(){
    const box=$('googleAccessList');if(!box)return;
    const pending=state.userAccess.filter((r)=>clean(r.status)==='pending').length;$('googleAccessCount').textContent=fmtInt(pending)+' bekleyen';
    const rows=state.userAccess.map((r,i)=>({...obj(r),_index:i})).filter((r)=>clean(r.status)===state.accessStatus).sort((a,b)=>ms(b.updated_at||b.requested_at)-ms(a.updated_at||a.requested_at));
    box.innerHTML=rows.length?rows.map((r)=>{const status=clean(r.status),name=first(r.canonical_name,r.requested_name,'İsimsiz kullanıcı'),seflik=first(r.canonical_seflik,r.requested_seflik,'Şeflik yok'),email=first(r.email,'E-posta yok');let actions='';
      if(status==='pending')actions=`<button class="button primary small" data-action="access-approve" data-access-index="${r._index}" type="button">Onayla</button><button class="button danger small" data-action="access-reject" data-access-index="${r._index}" type="button">Reddet</button>`;
      else if(status==='approved')actions=`<button class="button danger small" data-action="access-revoke" data-access-index="${r._index}" type="button">Erişimi kapat</button>`;
      else actions=`<button class="button info small" data-action="access-reopen" data-access-index="${r._index}" type="button">Yeniden incele</button>`;
      const avatar=first(r.avatar_url,obj(r.metadata).avatar_url,obj(r.metadata).google_avatar_url,obj(r.metadata).picture);
      const avatarHtml=avatar?`<img class="google-avatar" src="${escapeHtml(avatar)}" alt="" referrerpolicy="no-referrer" loading="lazy">`:`<div class="google-avatar">G</div>`;
      return `<article class="google-access-card ${escapeHtml(status)}"><div class="google-access-main">${avatarHtml}<div><h4>${escapeHtml(name)}</h4><p>${escapeHtml(seflik)} • ${escapeHtml(email)}</p><small>${escapeHtml(accessStatusText(status))} • ${escapeHtml(fmtDate(r.updated_at||r.requested_at))}${r.reason?' • '+escapeHtml(r.reason):''}</small></div></div><div class="google-access-actions">${actions}</div></article>`}).join(''):'<div class="empty-state">Bu bölümde Google giriş kaydı yok.</div>';
  }
  async function accessApprove(row){
    const name=clean(prompt('Onaylanacak kullanıcı adı:',first(row.canonical_name,row.requested_name)));if(!name)return;
    const seflik=clean(prompt('Onaylanacak şeflik:',first(row.canonical_seflik,row.requested_seflik)));if(!seflik)return;
    if(!confirm(`${name} • ${seflik} hesabı bu Google hesabına bağlansın mı?`))return;
    await edge('admin_user_access_approve',{user_id:row.user_id,name,seflik});toast('Google hesabı kullanıcıya bağlandı');await loadAll();
  }
  async function accessDecision(row,action){
    const label=action.endsWith('reopen')?'yeniden incelemeye almak':action.endsWith('revoke')?'erişimini kapatmak':'reddetmek';
    const reason=prompt(`Bu Google hesabını ${label} için açıklama:`,action.endsWith('revoke')?'Yönetici erişimi kapattı':action.endsWith('reopen')?'Yeniden inceleme':'Yönetici talebi reddetti');if(reason===null)return;
    if(action.endsWith('revoke')&&!confirm(`${first(row.canonical_name,row.requested_name,row.email)} kullanıcısının sunucu erişimi kapatılsın mı?`))return;
    await edge(action,{user_id:row.user_id,reason:clean(reason)});toast(action.endsWith('reopen')?'Talep yeniden incelemeye alındı':action.endsWith('revoke')?'Erişim kapatıldı':'Talep reddedildi');await loadAll();
  }
  function memberAvatar(m){const url=first(m.avatar_url,obj(m.metadata).avatar_url);const nm=first(m.name,m.email,'?');return url?`<img class="seflik-admin-avatar" src="${escapeHtml(url)}" alt="" referrerpolicy="no-referrer">`:`<span class="seflik-admin-avatar fallback">${escapeHtml(initials(nm))}</span>`}
  function renderSeflikAdmin(){
    const host=$('adminSeflikList'), badge=$('adminSeflikCount'); if(!host)return;
    const folders=state.seflikFolders.map(obj).filter((f)=>clean(f.status||'active')==='active').sort((a,b)=>clean(a.seflik).localeCompare(clean(b.seflik),'tr'));
    if(badge)badge.textContent=`${fmtInt(folders.length)} şeflik`;
    if(!folders.length){host.innerHTML='<div class="empty-state">Kurulu şeflik yok.</div>';return}
    host.innerHTML=folders.map((f)=>{
      const key=clean(f.seflik_key), members=state.seflikMembers.map(obj).filter((m)=>clean(m.seflik_key)===key&&clean(m.status||'active')==='active').sort((a,b)=>clean(a.role)==='owner'?-1:clean(b.role)==='owner'?1:clean(a.name).localeCompare(clean(b.name),'tr'));
      return `<article class="seflik-admin-card"><div class="seflik-admin-head"><div><h4>${escapeHtml(f.seflik||'-')}</h4><p>Kurucu: ${escapeHtml(first(f.created_by_name,'-'))} • ${escapeHtml(fmtDate(f.created_at))}</p></div><span class="counter-badge">${fmtInt(members.length)} üye</span></div><div class="seflik-admin-members">${members.length?members.map((m)=>`<div class="seflik-admin-member">${memberAvatar(m)}<div><b>${escapeHtml(first(m.name,'-'))}</b><small>${escapeHtml((clean(m.role)==='owner'?'Kurucu':'Ormancı')+(m.email?' • '+m.email:''))}</small></div></div>`).join(''):'<div class="empty-state small">Üye yok</div>'}</div></article>`;
    }).join('');
  }
  function renderAll(){renderUsers();renderStats();renderBackups();renderBlocks();renderSecurityLogs();renderGoogleAccess();renderSeflikAdmin();renderSummary()}
  function switchPage(page){state.page=page;document.querySelectorAll('.page').forEach((el)=>el.classList.toggle('is-active',el.dataset.page===page));document.querySelectorAll('.nav-item').forEach((el)=>el.classList.toggle('is-active',el.dataset.pageTarget===page));if(page==='stats')renderStats();if(page==='backups')renderBackups();if(page==='manage'){renderBlocks();renderSecurityLogs();renderGoogleAccess();renderSeflikAdmin();}window.scrollTo({top:0,behavior:'smooth'})}
  function openModal(title,html){$('modalTitle').textContent=title;$('modalBody').innerHTML=html;$('modal').classList.add('is-open');$('modal').setAttribute('aria-hidden','false')}
  function closeModal(){$('modal').classList.remove('is-open');$('modal').setAttribute('aria-hidden','true')}

  async function blockUser(user){
    const hasId=clean(user.id)&&user.id!=='-';
    const options=[hasId?`1 - Doğrulanmış hesap (${user.name})`:`1 - Eski kullanıcı anahtarı (${user.name})`,user.ip&&user.ip!=='-'?`2 - IP (${user.ip})`:'',user.deviceId&&user.deviceId!=='-'?`3 - Cihaz (${user.deviceId})`:''].filter(Boolean).join('\n');
    const choice=prompt(`Engel türünü seç:\n${options}`,'1'); if(!choice)return;
    let type=hasId?'user_id':'user_key',value=hasId?user.id:user.userKey;if(choice==='2'){type='ip';value=user.ip}else if(choice==='3'){type='device_id';value=user.deviceId}
    if(!clean(value)||value==='-')throw new Error('Engellenecek değer bulunamadı');
    await edge('admin_add_block',{block_type:type,block_value:value,reason:'Admin panel engeli'});toast(type==='user_id'?'Doğrulanmış hesap engellendi':'Engel eklendi');await loadAll();
  }
  async function deleteUser(user){
    const typed=prompt(`${user.name} kullanıcısı, tüm Supabase yedekleri ve kullanıcının oluşturduğu Şeflik bölmeleri kalıcı olarak silinecek. İşlem geri alınamaz. Onaylamak için kullanıcı adını yazın:`,user.name);
    if(typed===null)return;
    if(clean(typed)!==clean(user.name)){toast('Kullanıcı silinmedi: ad eşleşmiyor');return}
    if(!confirm(`SON UYARI: ${user.name} kullanıcısı, bağlı yedek kayıtları ve oluşturduğu bölmeler tamamen silinsin mi?`))return;
    const ids=relatedBackups(user).map((b)=>b.driveFileId).filter(Boolean);
    const out=await edge('admin_delete_user',{user_id:user.id,user_key:user.userKey,name:user.name,seflik:user.seflik,drive_file_ids:ids,permanent:true});
    state.users=state.users.filter((u)=>identityKey(u)!==identityKey(user));state.backups=state.backups.filter((b)=>identityKey(b)!==identityKey(user));renderAll();
    const failed=Array.isArray(out&&out.drive_delete_failed)?out.drive_delete_failed:[];
    toast(failed.length?`Kullanıcı silindi; ${failed.length} Drive dosyası silinemedi`:'Kullanıcı ve bağlı kayıtlar kalıcı silindi');
  }
  async function hideBackup(id){
    const backup=state.backups.find((b)=>clean(b.driveFileId)===clean(id));if(!backup)throw new Error('Yedek bulunamadı');
    if(!confirm('Bu yedek Supabase ve Google Drive üzerinden kalıcı olarak silinsin mi? Bu işlem geri alınamaz.'))return;
    const out=await edge('admin_hide_drive_backup',{drive_file_id:id,file_id:id,user_key:backup.userKey,name:backup.name,seflik:backup.seflik,permanent:true});
    state.hiddenBackupIds.add(clean(id));saveHiddenSet(state.hiddenBackupIds);state.backups=state.backups.filter((b)=>clean(b.driveFileId)!==clean(id));renderBackups();renderSummary();
    const failed=Array.isArray(out&&out.drive_delete_failed)?out.drive_delete_failed:[];
    toast(failed.length?'Yedek Supabase’den silindi; Drive silme başarısız':'Yedek kalıcı olarak silindi');
  }
  async function unblock(button){await edge('admin_remove_block',{id:button.dataset.blockId,block_type:button.dataset.blockType,block_value:button.dataset.blockValue});toast('Engel kaldırıldı');await loadAll()}
  async function addIp(){const ip=prompt('Engellenecek IP adresi:');if(!clean(ip))return;if(!isLikelyIp(ip)&&!confirm('Girilen değer standart IP biçiminde görünmüyor. Yine de engellensin mi?'))return;await edge('admin_add_block',{block_type:'ip',block_value:clean(ip),reason:'Manuel IP engeli'});toast('IP engeli eklendi');await loadAll()}

  function userDetail(user){
    openModal('Kullanıcı detayı',`<div class="detail-grid"><div><small>Kullanıcı</small><b>${escapeHtml(user.name)}</b></div><div><small>Şeflik</small><b>${escapeHtml(user.seflik)}</b></div><div><small>IP</small><b class="ip">${escapeHtml(user.ip||'-')}</b></div><div><small>Cihaz</small><b>${escapeHtml(user.deviceId||'-')}</b></div><div><small>Platform</small><b>${escapeHtml(user.platform||'-')}</b></div><div><small>Tarayıcı</small><b>${escapeHtml(user.browser||'-')}</b></div><div><small>Kullandığı sürüm</small><b>${escapeHtml(user.version||'-')}</b></div><div><small>Giriş tipi</small><b>${terminalInfoForUser(user)?'Terminal kodlu':googleInfoForUser(user)?'Google':'Yerel'}</b></div><div><small>Son giriş</small><b>${escapeHtml(fmtDate(user.lastSeen))}</b></div></div><pre class="raw-data">${escapeHtml(JSON.stringify(user.raw||user,null,2))}</pre>`)
  }

  async function login(){
    const email=lower($('loginUser').value),password=clean($('loginPass').value);
    if(!/^\S+@\S+\.\S+$/.test(email)||password.length<12){$('loginMessage').textContent='Geçerli admin e-postası ve en az 12 karakterli parola gerekli.';return}
    $('loginMessage').textContent='Giriş doğrulanıyor…';$('loginBtn').disabled=true;
    try{const out=await rawEdge('admin_login',{email,password});saveSession(out.session);$('loginPass').value='';$('loginMessage').textContent='';showAdmin();await loadAll()}
    catch(error){clearSession();$('loginMessage').textContent=errorText(error)}
    finally{$('loginBtn').disabled=false}
  }
  function showAdmin(){$('loginView').classList.add('is-hidden');$('adminView').classList.remove('is-hidden');touchActivity()}
  async function logout(allDevices=false,silent=false){
    const sess=readSession();try{if(sess.access_token)await edge(allDevices?'admin_logout_all':'admin_logout_local')}catch{}
    await authLogout(allDevices?'global':'local',sess.access_token);clearSession();if(!silent)location.reload();else location.reload();
  }


  function bind(){
    $('versionLabel').textContent=ADMIN_VERSION;
    $('loginBtn').addEventListener('click',()=>login());$('loginPass').addEventListener('keydown',(e)=>{if(e.key==='Enter')login()});
    $('refreshBtn').addEventListener('click',()=>{touchActivity();loadAll()});$('logoutBtn').addEventListener('click',()=>logout(false));
    const all=$('logoutAllBtn');if(all)all.addEventListener('click',()=>{if(confirm('Yönetim hesabı bütün cihazlardan çıkarılsın mı?'))logout(true)});
    document.querySelectorAll('.nav-item').forEach((button)=>button.addEventListener('click',()=>switchPage(button.dataset.pageTarget)));
    document.querySelectorAll('.range-tab').forEach((button)=>button.addEventListener('click',()=>{state.range=button.dataset.range;document.querySelectorAll('.range-tab').forEach((x)=>x.classList.toggle('is-active',x===button));renderStats()}));
    document.querySelectorAll('.manage-tab').forEach((button)=>button.addEventListener('click',()=>{state.blockView=button.dataset.blockView;document.querySelectorAll('.manage-tab').forEach((x)=>x.classList.toggle('is-active',x===button));renderBlocks()}));
    document.querySelectorAll('.google-access-tab').forEach((button)=>button.addEventListener('click',()=>{state.accessStatus=button.dataset.accessStatus;document.querySelectorAll('.google-access-tab').forEach((x)=>x.classList.toggle('is-active',x===button));renderGoogleAccess()}));
    ['userSearch','userFilter'].forEach((id)=>$(id).addEventListener('input',renderUsers));['backupSearch','backupSort'].forEach((id)=>$(id).addEventListener('input',renderBackups));$('blockSearch').addEventListener('input',renderBlocks);
    $('clearUserFilter').addEventListener('click',()=>{$('userSearch').value='';$('userFilter').value='all';renderUsers()});$('clearBackupFilter').addEventListener('click',()=>{$('backupSearch').value='';$('backupSort').value='new';renderBackups()});$('addIpBtn').addEventListener('click',()=>addIp().catch((e)=>toast(errorText(e))));
    $('modalClose').addEventListener('click',closeModal);$('modal').addEventListener('click',(e)=>{if(e.target===$('modal'))closeModal()});
    document.addEventListener('click',(e)=>{touchActivity();const button=e.target.closest('[data-action]');if(!button)return;const action=button.dataset.action;const user=state.users[Number(button.dataset.userIndex)];if(action==='detail'&&user)userDetail(user);if(action==='block'&&user)blockUser(user).catch((x)=>toast(errorText(x)));if(action==='delete-user'&&user)deleteUser(user).catch((x)=>toast(errorText(x)));if(action==='hide-backup')hideBackup(button.dataset.backupId).catch((x)=>toast(errorText(x)));if(action==='unblock')unblock(button).catch((x)=>toast(errorText(x)));const access=state.userAccess[Number(button.dataset.accessIndex)];if(action==='access-approve'&&access)accessApprove(access).catch((x)=>toast(errorText(x)));if(action==='access-reject'&&access)accessDecision(access,'admin_user_access_reject').catch((x)=>toast(errorText(x)));if(action==='access-revoke'&&access)accessDecision(access,'admin_user_access_revoke').catch((x)=>toast(errorText(x)));if(action==='access-reopen'&&access)accessDecision(access,'admin_user_access_reopen').catch((x)=>toast(errorText(x))) });
    ['keydown','pointerdown','touchstart'].forEach((name)=>document.addEventListener(name,touchActivity,{passive:true}));
    setInterval(()=>{const last=Number(sessionStorage.getItem(LAST_ACTIVITY_KEY)||0);if(readSession().access_token&&last&&Date.now()-last>IDLE_MS)logout(false,true)},60000);
  }
  async function init(){bind();const sess=await validSession();if(sess){showAdmin();loadAll()}else clearSession()}
  init();
})();
