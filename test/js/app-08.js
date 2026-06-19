/* Mesaha İO v169 Modüler Stabil - app-08.js */
/* Mesaha v141 - admin son görülen + arka plan süre senkronu */
(function(){
  "use strict";
  const BUILD_VERSION = "Mesaha İO v1.98";
  const FILE_VERSION = "v141";
  const LIVE_QUEUE_KEY = "mesaha_live_usage_queue_v141";
  const LIVE_LAST_SYNC_KEY = "mesaha_live_usage_last_sync_v141";
  const LIVE_MIN_SYNC_MS = 60 * 1000;
  let liveTimer = null;
  let liveSyncing = false;

  const n = (v) => { const x = Number(String(v ?? "").replace(",", ".").replace(/[^0-9.\-]/g, "")); return Number.isFinite(x) ? x : 0; };
  const esc = (v) => { try { return escapeHtml(v); } catch { return String(v ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c])); } };
  const fmtInt = (v) => Math.round(Number(v) || 0).toLocaleString("tr-TR");
  const fmtM3 = (v) => `${(Number(v) || 0).toLocaleString("tr-TR", { minimumFractionDigits:3, maximumFractionDigits:3 })} m³`;
  const dur = (ms) => { try { if (typeof adminDurationTextV128 === "function") return adminDurationTextV128(ms); } catch {} const m = Math.round((Number(ms)||0)/60000); return m ? `${m} dk` : "0 dk"; };
  const trNow = () => { try { return firebaseDateText(); } catch { return new Date().toLocaleString("tr-TR"); } };
  const todayIso = () => { try { return usageTodayISOv128(); } catch { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; } };
  const collUsage = () => { try { return FIREBASE_USAGE_COLLECTION || "usageStats"; } catch { return "usageStats"; } };
  const collUsers = () => { try { return FIREBASE_USERS_COLLECTION || "users"; } catch { return "users"; } };
  const toast = (t) => { try { if (typeof showToast === "function") showToast(t); } catch {} };

  function parseTrDateMs(v){
    if(!v) return 0;
    if(typeof v === "number") return Number.isFinite(v) ? v : 0;
    const s = String(v || "").trim();
    if(!s || s === "-" || s.toLocaleLowerCase("tr-TR") === "bilinmiyor") return 0;
    let m = s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if(m){ const d = new Date(Number(m[3]), Number(m[2])-1, Number(m[1]), Number(m[4]||0), Number(m[5]||0), Number(m[6]||0)); const ms = d.getTime(); return Number.isFinite(ms) ? ms : 0; }
    const t = Date.parse(s); return Number.isFinite(t) ? t : 0;
  }
  function loginMs(u){
    if(!u) return 0;
    return Math.max(
      n(u.lastLoginMs), n(u.lastLoginAtMs), n(u.loginAtMs),
      parseTrDateMs(u.lastLogin), parseTrDateMs(u.loginAt), parseTrDateMs(u.firstLogin)
    );
  }
  function loginDate(u){ const ms = loginMs(u); return ms ? new Date(ms) : null; }
  function sameDay(a,b){ return a && b && a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
  function timeText(d){ return d ? d.toLocaleTimeString("tr-TR", { hour:"2-digit", minute:"2-digit" }) : "-"; }
  function seenLabel(u){
    const d = loginDate(u); if(!d) return "Son görülen bilinmiyor";
    const now = new Date(); const one = 24*60*60*1000;
    const diffDays = Math.floor((new Date(now.getFullYear(),now.getMonth(),now.getDate()) - new Date(d.getFullYear(),d.getMonth(),d.getDate()))/one);
    if(sameDay(d, now)) return `Son görülen ${timeText(d)}`;
    if(diffDays === 1) return "Son görülen dün";
    if(diffDays > 1 && diffDays <= 7) return `Son görülen ${diffDays} gün önce`;
    return "Son görülen eski";
  }
  function statusFromLogin(u){
    const d = loginDate(u); if(!d) return { key:"old", label:"Son görülen bilinmiyor" };
    const now = new Date(); const one = 24*60*60*1000;
    const diffDays = Math.floor((new Date(now.getFullYear(),now.getMonth(),now.getDate()) - new Date(d.getFullYear(),d.getMonth(),d.getDate()))/one);
    if(diffDays <= 0) return { key:"today", label: seenLabel(u) };
    if(diffDays <= 7) return { key:"warning", label: seenLabel(u) };
    return { key:"old", label: seenLabel(u) };
  }
  function sourceText(u){ const s = (u && (u.sourceLabel || u.source)) || ""; if(String(s).toLowerCase().includes("firebase")) return "Firebase"; if(String(s).toLowerCase().includes("apps") || String(s).toLowerCase().includes("eski")) return "Eski"; return ""; }
  function deviceText(u){ return (u && u.lastDeviceInfo && (u.lastDeviceInfo.platform || u.lastDeviceInfo.userAgent)) || (u && u.lastDevice) || `${fmtInt(Number(u && u.deviceCount) || 0)} cihaz`; }
  function arg(v){ return String(v||"").replace(/\\/g,"\\\\").replace(/'/g,"\\'"); }
  function keyOf(u){ try { return firebaseUserKey(u && u.name, u && u.seflik); } catch {} return String(`${(u&&u.name)||""}__${(u&&u.seflik)||""}`).toLocaleLowerCase("tr-TR").replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ_-]+/gi,"_").replace(/^_+|_+$/g,"") || "bos"; }
  function issueCount(u){ try { const rows = Array.isArray(state.adminSupportTicketsV134) ? state.adminSupportTicketsV134 : []; const k = keyOf(u); return rows.filter(r => String(r.userKey || keyOf(r)) === String(k) && String(r.status || "new") !== "done").length; } catch { return 0; } }
  function sanitizedUsers(list){ try { if(typeof mesahaSanitizeUsersByResetV139 === "function") return mesahaSanitizeUsersByResetV139(list || [], window.__mesahaStatsResetMarkerV139 || {}); } catch {} return Array.isArray(list) ? list : []; }
  function badges(u){
    const st = statusFromLogin(u);
    const parts = [`<span class="admin-badge-v134 ${st.key === "today" ? "active" : (st.key === "warning" ? "week" : "inactive")}">${esc(st.label)}</span>`];
    const bc = Number(u && u.backupCount || 0);
    parts.push(bc ? `<span class="admin-badge-v134 ok">Yedek var</span>` : `<span class="admin-badge-v134 backup">Yedek yok</span>`);
    const is = issueCount(u); if(is) parts.push(`<span class="admin-badge-v134 issue">${fmtInt(is)} açık sorun</span>`);
    return `<div class="admin-user-badges-v134">${parts.join("")}</div>`;
  }

  // Admin listesi: artık son aktif/süre değil, son giriş/son görülen sırasına göre.
  try{
    adminFilteredUsers = function(){
      const list = sanitizedUsers(Array.isArray(state && state.adminOnlineUsers) ? state.adminOnlineUsers.slice() : []);
      return list.sort((a,b) => {
        const diff = loginMs(b) - loginMs(a);
        if(diff) return diff;
        return String((a&&a.name)||"").localeCompare(String((b&&b.name)||""), "tr");
      });
    };
  }catch{}

  try{
    updateAdminTopSummary = function(){
      const users = adminFilteredUsers();
      if(state) state.adminOnlineUsers = users;
      const backups = (state && state.adminBackups) || [];
      const latest = users[0] || null;
      const todayAdet = users.reduce((s,u)=>s+n(u.todayInputAdet),0);
      const todayM3 = users.reduce((s,u)=>s+n(u.todayInputM3),0);
      const lastBackup = backups[0] && backups[0].createdAt ? backups[0].createdAt : "-";
      const setLabel = (el,label) => { try { const x = el && el.parentElement && el.parentElement.querySelector("span"); if(x) x.textContent = label; } catch {} };
      setLabel(els.adminTotalUsers,"Kullanıcı");
      setLabel(els.adminTodayUsers,"Son Görülen");
      setLabel(els.adminWeekUsers,"Bugün Adet");
      setLabel(els.adminTotalBackups,"Bugün m³");
      setLabel(els.adminLastBackup,"Son Yedek");
      if(els.adminTotalUsers) els.adminTotalUsers.textContent = users.length.toLocaleString("tr-TR");
      if(els.adminTodayUsers) els.adminTodayUsers.textContent = latest ? `${latest.name || "-"} • ${timeText(loginDate(latest))}` : "-";
      if(els.adminWeekUsers) els.adminWeekUsers.textContent = todayAdet.toLocaleString("tr-TR");
      if(els.adminTotalBackups) els.adminTotalBackups.textContent = fmtM3(todayM3).replace(" m³", "");
      if(els.adminLastBackup) els.adminLastBackup.textContent = lastBackup;
    };
  }catch{}

  try{
    renderAdminUsers = function(){
      if(!els || !els.registeredUsersList) return;
      try { updateAdminTopSummary(); } catch {}
      const list = adminFilteredUsers();
      window.__adminListV141 = window.__adminListV139 = window.__adminListV134 = window.__adminListV131 = list;
      els.registeredUsersList.classList.add("admin-list-v131");
      if(!list.length){ els.registeredUsersList.innerHTML = `<div class="empty-user-list">Kullanıcı bulunamadı.</div>`; return; }
      els.registeredUsersList.innerHTML = list.map((u,idx)=>{
        const st = statusFromLogin(u), is = issueCount(u), source = sourceText(u), dev = deviceText(u);
        return `
        <div class="admin-user-row-v131 status-${esc(st.key || "today")} ${is ? "has-open-issue-v134" : ""}" data-admin-row-v131="${idx}">
          <div class="admin-user-main-v131"><b>${esc(u.name || "-")}</b><span>${esc(u.seflik || "-")} ${source ? `• ${esc(source)}` : ""}</span>${badges(u)}</div>
          <div class="admin-user-stats-v131"><span>Süre <b>${esc(dur(u.todayActiveMs))}</b></span><span>Adet <b>${esc(fmtInt(u.todayInputAdet))}</b></span><span>m³ <b>${esc(fmtM3(u.todayInputM3))}</b></span></div>
          <button class="admin-detail-bubble-v131" type="button" onclick="adminToggleDetailV131(${idx})">Detay</button>
          <div class="admin-user-detail-panel-v131"><div class="admin-detail-grid-v131">
            <span>Durum <b>${esc(st.label || "-")}</b></span><span>İlk kayıt <b>${esc(u.firstLogin || u.createdAt || "Bilinmiyor")}</b></span><span>Son görülen <b>${esc(u.lastLogin || "-")}</b></span><span>Süre güncelleme <b>${esc(u.lastUsageAt || "-")}</b></span><span>Son yedek <b>${esc(u.lastBackupAt || "-")}</b></span><span>Yedek sayısı <b>${fmtInt(u.backupCount)}</b></span><span>Açık sorun <b>${fmtInt(is)}</b></span><span>7 gün adet <b>${fmtInt(u.weekInputAdet)}</b></span><span>7 gün m³ <b>${esc(fmtM3(u.weekInputM3))}</b></span><span>Sürüm <b>${esc(u.appVersion || u.fileVersion || "-")}</b></span><span>Cihaz <b>${esc(dev || "-")}</b></span>
          </div><div class="admin-detail-actions-v131"><button class="secondary" type="button" onclick="adminOpenUserBackups('${arg(u.name)}','${arg(u.seflik)}')">Yedekleri Gör</button>${is ? `<button class="issue-v134" type="button" onclick="adminOpenUserReportsV134(${idx})">Sorunları Gör</button>` : ""}<button class="danger-v134" type="button" onclick="adminDeleteUserV134(${idx})">Kullanıcıyı Sil</button><button class="ghost" type="button" onclick="adminToggleDetailV131(${idx})">Kapat</button></div></div>
        </div>`;
      }).join("");
    };
  }catch{}

  // Kullanım süresi artık Mesaha Dosyasını İndir beklemeden, arka planda güvenli kuyrukla gönderilir.
  function qRead(){ try { const q = JSON.parse(localStorage.getItem(LIVE_QUEUE_KEY) || "{}"); return q && typeof q === "object" ? q : {}; } catch { return {}; } }
  function qWrite(q){ try { localStorage.setItem(LIVE_QUEUE_KEY, JSON.stringify(q || {})); } catch {} }
  function withTimeout(p, ms){ return Promise.race([p, new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")), ms || 7000))]); }
  function queueCurrentUsage(){
    try{
      if(typeof forceUsageTickV140 === "function") forceUsageTickV140();
      if(typeof usageGetDailyV128 !== "function") return false;
      const user = (typeof usageActiveUserV128 === "function") ? usageActiveUserV128() : ((state && state.activeUser) || null);
      if(!user || !String(user.name||"").trim() || !String(user.seflik||"").trim()) return false;
      const got = usageGetDailyV128(todayIso(), user);
      const stat = got && got.stat ? got.stat : null;
      if(!stat) return false;
      const userKey = stat.userKey || got.key || keyOf(user);
      const deviceId = stat.deviceId || (typeof getOrCreateDeviceId === "function" ? getOrCreateDeviceId() : "cihaz");
      const nowMs = Date.now(), nowText = trNow();
      const id = `live_usage_${String(stat.date || todayIso()).replace(/[^0-9-]/g,"")}_${String(userKey||"bos").replace(/[^a-zA-Z0-9_-]/g,"_")}_${String(deviceId||"cihaz").replace(/[^a-zA-Z0-9_-]/g,"_")}`.slice(0,180);
      const payload = {
        id, type:"liveUsageSummary", source:"liveUsage", date:stat.date || todayIso(), userKey,
        name:String(stat.name || user.name || "").trim(), seflik:String(stat.seflik || user.seflik || "").trim(), deviceId,
        activeMs:Math.round(n(stat.activeMs)), activeMinutes:Math.round(n(stat.activeMs)/60000),
        inputAdet:Math.round(n(stat.inputAdet)), inputM3:Number(n(stat.inputM3).toFixed(3)),
        recordEntryCount:Math.round(n(stat.recordEntryCount)), recordCount:Array.isArray(state && state.records) ? state.records.length : Math.round(n(stat.recordCount)),
        appVersion:BUILD_VERSION, fileVersion:FILE_VERSION,
        createdAt:stat.createdAt || nowText, createdAtMs:Number(stat.createdAtMs || nowMs),
        updatedAt:nowText, updatedAtMs:nowMs, queuedAtMs:nowMs
      };
      if(!payload.name || !payload.seflik) return false;
      const q = qRead(); q[id] = payload; qWrite(q); return true;
    }catch(err){ return false; }
  }
  async function flushLiveUsage(force){
    if(liveSyncing) return false;
    if(!navigator.onLine) { queueCurrentUsage(); return false; }
    const last = Number(localStorage.getItem(LIVE_LAST_SYNC_KEY) || 0) || 0;
    if(!force && Date.now() - last < LIVE_MIN_SYNC_MS) return false;
    queueCurrentUsage();
    const q = qRead(); const ids = Object.keys(q);
    if(!ids.length) return false;
    liveSyncing = true;
    try{
      const ready = await withTimeout(ensureFirebaseReady(), 6500);
      const db = ready && ready.db;
      if(!db) throw new Error("firebase yok");
      let sent = 0;
      for(const id of ids){
        const p = q[id]; if(!p || !p.userKey) { delete q[id]; continue; }
        p.updatedAt = trNow(); p.updatedAtMs = Date.now(); p.appVersion = BUILD_VERSION; p.fileVersion = FILE_VERSION;
        await withTimeout(db.collection(collUsage()).doc(id).set(p, { merge:true }), 6500);
        await withTimeout(db.collection(collUsers()).doc(p.userKey).set({
          userKey:p.userKey, name:p.name, seflik:p.seflik, appVersion:BUILD_VERSION, fileVersion:FILE_VERSION,
          todayUsage:{ date:p.date, activeMs:p.activeMs, activeMinutes:p.activeMinutes, inputAdet:p.inputAdet, inputM3:p.inputM3, recordEntryCount:p.recordEntryCount, updatedAt:p.updatedAt, updatedAtMs:p.updatedAtMs, liveSync:true },
          lastUsageAt:p.updatedAt, lastUsageMs:p.updatedAtMs, liveUsageAt:p.updatedAt, liveUsageMs:p.updatedAtMs
        }, { merge:true }), 6500);
        delete q[id]; sent++;
      }
      qWrite(q); localStorage.setItem(LIVE_LAST_SYNC_KEY, String(Date.now())); return sent > 0;
    }catch(err){
      return false;
    }finally{ liveSyncing = false; }
  }
  window.mesahaFlushLiveUsageV141 = flushLiveUsage;
  function scheduleLive(delay){ clearTimeout(liveTimer); liveTimer = setTimeout(()=>flushLiveUsage(false).catch(()=>{}), Math.max(1000, Number(delay)||60000)); }

  try{
    const oldAdd = typeof usageAddActiveMsV128 === "function" ? usageAddActiveMsV128 : null;
    if(oldAdd){ usageAddActiveMsV128 = function(ms){ const r = oldAdd(ms); scheduleLive(65000); return r; }; }
    const oldRecord = typeof usageRecordEntryV128 === "function" ? usageRecordEntryV128 : null;
    if(oldRecord){ usageRecordEntryV128 = function(record){ const r = oldRecord(record); scheduleLive(8000); return r; }; }
    const oldSync = typeof usageSyncNowV128 === "function" ? usageSyncNowV128 : null;
    usageSyncNowV128 = async function(){ try { queueCurrentUsage(); await flushLiveUsage(true); } catch {} try { if(typeof v135FlushExportQueue === "function") return await v135FlushExportQueue(true); } catch {} try { return oldSync ? await oldSync() : false; } catch { return false; } };
  }catch{}

  document.addEventListener("visibilitychange", function(){ try { queueCurrentUsage(); if(document.visibilityState === "hidden") flushLiveUsage(true).catch(()=>{}); else scheduleLive(12000); } catch {} }, {capture:true});
  window.addEventListener("online", function(){ setTimeout(()=>flushLiveUsage(true).catch(()=>{}), 1200); });
  window.addEventListener("pagehide", function(){ try { queueCurrentUsage(); flushLiveUsage(true).catch(()=>{}); } catch {} });
  setInterval(function(){ try { flushLiveUsage(false).catch(()=>{}); } catch {} }, 90000);
  setTimeout(function(){ try { flushLiveUsage(false).catch(()=>{}); } catch {} }, 10000);

  const oldDevice = typeof currentDeviceInfoPayload === "function" ? currentDeviceInfoPayload : null;
  try{ currentDeviceInfoPayload = function(){ const info = oldDevice ? oldDevice() : {}; info.appVersion = BUILD_VERSION; info.fileVersion = FILE_VERSION; info.adminSortMode = "lastLoginOnlyDesc"; info.activeTimeMode = "backgroundQueueLiveSync"; info.updatedMs = Date.now(); return info; }; }catch{}
  window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, { fileVersion:FILE_VERSION, visibleVersion:BUILD_VERSION, adminSortMode:"lastLoginOnlyDesc", activeTimeMode:"backgroundQueueLiveSync" });
  try { document.title = "Mesaha App v141"; const h1 = document.querySelector(".brand h1"); if(h1) h1.textContent = BUILD_VERSION; } catch {}
  try { setTimeout(()=>{ if(typeof renderAdminUsers === "function") renderAdminUsers(); }, 1200); } catch {}
})();
