/* Mesaha İO v169 Modüler Stabil - app-09.js */
/* Mesaha v142 - admin üst özet: Son Görülen kişi yerine bugün görülen kullanıcı sayısı */
(function(){
  "use strict";
  const BUILD_VERSION = "Mesaha İO v1.98";
  const FILE_VERSION = "v142";
  const esc = (v) => { try { return escapeHtml(v); } catch { return String(v ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c])); } };
  const n = (v) => { const x = Number(String(v ?? "").replace(",", ".").replace(/[^0-9.\-]/g, "")); return Number.isFinite(x) ? x : 0; };
  const fmtM3 = (v) => `${(Number(v) || 0).toLocaleString("tr-TR", { minimumFractionDigits:3, maximumFractionDigits:3 })} m³`;
  function toMs(v){
    try{
      if(!v) return 0;
      if(typeof v === "number") return Number.isFinite(v) ? v : 0;
      if(v instanceof Date) return Number.isFinite(v.getTime()) ? v.getTime() : 0;
      if(typeof v.toDate === "function") { const d = v.toDate(); return d && Number.isFinite(d.getTime()) ? d.getTime() : 0; }
      if(typeof v === "object" && Number.isFinite(Number(v.seconds))) return Number(v.seconds) * 1000;
      const s = String(v || "").trim();
      if(!s || s === "-" || s.toLocaleLowerCase("tr-TR") === "bilinmiyor") return 0;
      const m = s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
      if(m){ const d = new Date(Number(m[3]), Number(m[2])-1, Number(m[1]), Number(m[4]||0), Number(m[5]||0), Number(m[6]||0)); return Number.isFinite(d.getTime()) ? d.getTime() : 0; }
      const t = Date.parse(s); return Number.isFinite(t) ? t : 0;
    }catch{ return 0; }
  }
  function loginMs(u){
    if(!u) return 0;
    return Math.max(
      toMs(u.lastLoginMs), toMs(u.lastLoginAtMs), toMs(u.loginAtMs), toMs(u.lastSeenMs), toMs(u.lastSeenAtMs),
      toMs(u.lastLogin), toMs(u.loginAt), toMs(u.lastSeen), toMs(u.firstLogin)
    );
  }
  function isToday(ms){
    if(!ms) return false;
    const d = new Date(ms), now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }
  function sanitizedUsers(list){
    try { if(typeof mesahaSanitizeUsersByResetV139 === "function") return mesahaSanitizeUsersByResetV139(list || [], window.__mesahaStatsResetMarkerV139 || {}); } catch {}
    return Array.isArray(list) ? list : [];
  }
  function setLabel(el, label){
    try { const x = el && el.parentElement && el.parentElement.querySelector("span"); if(x) x.textContent = label; } catch {}
  }
  try{
    updateAdminTopSummary = function(){
      const users = sanitizedUsers(Array.isArray(state && state.adminOnlineUsers) ? state.adminOnlineUsers : []);
      if(state) state.adminOnlineUsers = users;
      const backups = (state && state.adminBackups) || [];
      const todaySeen = users.filter(u => isToday(loginMs(u))).length;
      const todayAdet = users.reduce((s,u)=>s+n(u && u.todayInputAdet),0);
      const todayM3 = users.reduce((s,u)=>s+n(u && u.todayInputM3),0);
      const lastBackup = backups[0] && backups[0].createdAt ? backups[0].createdAt : "-";
      setLabel(els.adminTotalUsers, "Kullanıcı");
      setLabel(els.adminTodayUsers, "Bugün Görülen");
      setLabel(els.adminWeekUsers, "Bugün Adet");
      setLabel(els.adminTotalBackups, "Bugün m³");
      setLabel(els.adminLastBackup, "Son Yedek");
      if(els.adminTotalUsers) els.adminTotalUsers.textContent = users.length.toLocaleString("tr-TR");
      if(els.adminTodayUsers) els.adminTodayUsers.textContent = `${todaySeen.toLocaleString("tr-TR")} kullanıcı`;
      if(els.adminWeekUsers) els.adminWeekUsers.textContent = Math.round(todayAdet).toLocaleString("tr-TR");
      if(els.adminTotalBackups) els.adminTotalBackups.textContent = fmtM3(todayM3).replace(" m³", "");
      if(els.adminLastBackup) els.adminLastBackup.textContent = lastBackup;
    };
  }catch{}
  const oldDevice = typeof currentDeviceInfoPayload === "function" ? currentDeviceInfoPayload : null;
  try { currentDeviceInfoPayload = function(){ const info = oldDevice ? oldDevice() : {}; info.appVersion = BUILD_VERSION; info.fileVersion = FILE_VERSION; info.adminTopSummaryMode = "todaySeenUserCount"; info.updatedMs = Date.now(); return info; }; } catch {}
  window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, { fileVersion:FILE_VERSION, visibleVersion:BUILD_VERSION, adminTopSummaryMode:"todaySeenUserCount" });
  try { document.title = "Mesaha App v142"; const h1 = document.querySelector(".brand h1"); if(h1) h1.textContent = BUILD_VERSION; } catch {}
  try { setTimeout(()=>{ updateAdminTopSummary(); if(typeof renderAdminUsers === "function") renderAdminUsers(); }, 500); setTimeout(()=>{ updateAdminTopSummary(); }, 1800); } catch {}
})();
