/* script block 7  */

/* Mesaha v139 - istatistik sıfırlama admin ana liste/özet kesin düzeltme */
(function(){
  "use strict";
  const BUILD_VERSION="Mesaha İO v1.99", FILE_VERSION="v139", MARKER="__stats_reset_marker__";
  const EXPORT_QUEUE="mesaha_export_stats_queue_v135", USAGE_LOCAL="mesaha_usage_stats_v128";
  const usageColl=()=>{try{return FIREBASE_USAGE_COLLECTION||"usageStats";}catch{return"usageStats";}};
  const usersColl=()=>{try{return FIREBASE_USERS_COLLECTION||"users";}catch{return"users";}};
  const toast=t=>{try{showToast?showToast(t):console.log(t);}catch{}};
  const n=v=>{const x=Number(String(v??"").replace(",",".").replace(/[^0-9.\-]/g,""));return Number.isFinite(x)?x:0;};
  const i=v=>Math.round(Number(v)||0).toLocaleString("tr-TR");
  const m3=v=>`${(Number(v)||0).toLocaleString("tr-TR",{minimumFractionDigits:3,maximumFractionDigits:3})} m³`;
  const dur=ms=>{try{if(typeof adminDurationTextV128==="function")return adminDurationTextV128(ms);}catch{}const min=Math.round((Number(ms)||0)/60000);return min?`${min} dk`:"0 dk";};
  const esc=v=>{try{return escapeHtml(v);}catch{return String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));}};
  const today=()=>{const d=new Date(),p=x=>String(x).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;};
  const genMs=d=>Number(d&&(d.exportAtMs||d.queuedAtMs||d.createdAtMs||d.generatedAtMs||d.updatedAtMs))||0;
  const localReset=()=>Number(localStorage.getItem("mesaha_stats_reset_at_v139")||localStorage.getItem("mesaha_stats_reset_at_v138")||localStorage.getItem("mesaha_stats_reset_at_v137")||0)||0;
  const setLocalReset=(r)=>{const ms=Number(r&&r.resetAtMs)||0;if(!ms)return;window.__mesahaStatsResetMarkerV139=r;try{localStorage.setItem("mesaha_stats_reset_at_v139",String(ms));localStorage.setItem("mesaha_stats_reset_at_v138",String(ms));}catch{}};
  const resetMs=()=>Number(window.__mesahaStatsResetMarkerV139&&window.__mesahaStatsResetMarkerV139.resetAtMs)||localReset();
  const keyOf=u=>{try{return firebaseUserKey(u&&u.name,u&&u.seflik);}catch{}return String(`${(u&&u.name)||""}__${(u&&u.seflik)||""}`).toLocaleLowerCase("tr-TR").replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ_-]+/gi,"_").replace(/^_+|_+$/g,"")||"bos";};

  async function readMarker(db){
    try{const real=db||(await ensureFirebaseReady()).db;const doc=await real.collection(usageColl()).doc(MARKER).get();if(doc.exists){const d=doc.data()||{};const r={resetAtMs:Number(d.resetAtMs||0),resetAt:d.resetAt||""};setLocalReset(r);return r;}}catch{}
    const r={resetAtMs:localReset(),resetAt:""};if(r.resetAtMs)setLocalReset(r);return r;
  }
  window.mesahaReadStatsResetMarkerV139=readMarker;

  function zeroUser(u){
    const out=Object.assign({},u||{});
    out.todayActiveMs=0;out.todayInputAdet=0;out.todayInputM3=0;out.todayRecordEntryCount=0;out.weekInputAdet=0;out.weekInputM3=0;out.lastUsageAt="";out.lastUsageMs=0;
    out.todayUsage=Object.assign({},out.todayUsage||{},{date:today(),activeMs:0,activeMinutes:0,inputAdet:0,inputM3:0,recordEntryCount:0,resetByAdmin:true});
    out.__statsZeroedV139=true;return out;
  }
  function sanitizeUsers(users,marker){
    const r=Number(marker&&marker.resetAtMs)||resetMs();if(!r)return Array.isArray(users)?users:[];
    return (Array.isArray(users)?users:[]).map(u=>{const tu=(u&&u.todayUsage)||{};const sm=Number(u&&(u.lastUsageMs||tu.updatedAtMs||tu.exportAtMs||tu.createdAtMs))||0;const has=n(u&&u.todayActiveMs)||n(u&&u.todayInputAdet)||n(u&&u.todayInputM3)||n(u&&u.weekInputAdet)||n(u&&u.weekInputM3)||n(tu.activeMs)||n(tu.inputAdet)||n(tu.inputM3);return has&&(!sm||sm<=r)?zeroUser(u):u;});
  }
  window.mesahaSanitizeUsersByResetV139=sanitizeUsers;

  const oldLoadUsage=typeof firebaseLoadUsageStatsV128==="function"?firebaseLoadUsageStatsV128:null;
  if(oldLoadUsage){firebaseLoadUsageStatsV128=async function(daysBack){const {db}=await ensureFirebaseReady();const marker=await readMarker(db);const days=Math.max(1,Number(daysBack||7));const start=new Date();start.setDate(start.getDate()-(days-1));const startIso=start.toISOString().slice(0,10);const snap=await db.collection(usageColl()).where("date",">=",startIso).get();const rows=[];snap.forEach(doc=>{if(doc.id===MARKER)return;const d=Object.assign({id:doc.id},doc.data()||{});if(String(d.type||"")==="statsResetMarker")return;const ms=genMs(d);if(marker.resetAtMs&&(!ms||ms<=marker.resetAtMs))return;rows.push(d);});return rows;};}
  const oldMerge=typeof usageMergeIntoUsersV128==="function"?usageMergeIntoUsersV128:null;
  if(oldMerge){usageMergeIntoUsersV128=function(users,rows){return sanitizeUsers(oldMerge(users,rows),window.__mesahaStatsResetMarkerV139||{resetAtMs:localReset()});};}
  const oldLoadUsers=typeof loadOnlineUsers==="function"?loadOnlineUsers:null;
  if(oldLoadUsers){loadOnlineUsers=async function(adminCode){const users=await oldLoadUsers(adminCode);let marker=window.__mesahaStatsResetMarkerV139||{resetAtMs:localReset()};try{marker=await readMarker();}catch{}return sanitizeUsers(users,marker);};}

  function status(u){const r=resetMs(),lm=Number(u&&u.lastUsageMs)||0,has=(n(u&&u.todayActiveMs)||n(u&&u.todayInputAdet)||n(u&&u.todayInputM3))>0;if(has&&(!r||lm>r))return{key:"today",label:"Bugün aktif"};try{if(!r&&typeof adminIsToday==="function"&&adminIsToday(u&&u.lastLogin))return{key:"today",label:"Bugün aktif"};if(typeof adminDaysSince==="function"&&adminDaysSince(u&&u.lastLogin)<=7)return{key:"warning",label:"Bu hafta aktif"};}catch{}return{key:"old",label:"Uzun süredir girmedi"};}
  function src(u){const s=(u&&(u.sourceLabel||u.source))||"";if(String(s).toLowerCase().includes("firebase"))return"Firebase";if(String(s).toLowerCase().includes("apps")||String(s).toLowerCase().includes("eski"))return"Eski";return"";}
  function device(u){return(u&&u.lastDeviceInfo&&(u.lastDeviceInfo.platform||u.lastDeviceInfo.userAgent))||(u&&u.lastDevice)||`${i(Number(u&&u.deviceCount)||0)} cihaz`;}
  function arg(v){return String(v||"").replace(/\\/g,"\\\\").replace(/'/g,"\\'");}
  function issues(u){try{const rows=Array.isArray(state.adminSupportTicketsV134)?state.adminSupportTicketsV134:[];const k=keyOf(u);return rows.filter(r=>String(r.userKey||keyOf(r))===String(k)&&String(r.status||"new")!=="done").length;}catch{return 0;}}
  function badges(u){const st=status(u);const parts=[`<span class="admin-badge-v134 ${st.key==="today"?"active":(st.key==="warning"?"week":"inactive")}">${esc(st.label)}</span>`];const bc=Number(u&&u.backupCount||0);parts.push(bc?`<span class="admin-badge-v134 ok">Yedek var</span>`:`<span class="admin-badge-v134 backup">Yedek yok</span>`);const is=issues(u);if(is)parts.push(`<span class="admin-badge-v134 issue">${i(is)} açık sorun</span>`);return`<div class="admin-user-badges-v134">${parts.join("")}</div>`;}
  adminFilteredUsers=function(){const list=Array.isArray(state&&state.adminOnlineUsers)?state.adminOnlineUsers.slice():[];return sanitizeUsers(list,window.__mesahaStatsResetMarkerV139||{resetAtMs:localReset()}).sort((a,b)=>(Number(b.lastUsageMs||b.lastLoginMs||0)-Number(a.lastUsageMs||a.lastLoginMs||0))||String(a.name||"").localeCompare(String(b.name||""),"tr"));};
  updateAdminTopSummary=function(){const users=sanitizeUsers(Array.isArray(state&&state.adminOnlineUsers)?state.adminOnlineUsers:[],window.__mesahaStatsResetMarkerV139||{resetAtMs:localReset()});if(state)state.adminOnlineUsers=users;const backups=(state&&state.adminBackups)||[];const todayUsers=users.filter(u=>n(u.todayActiveMs)||n(u.todayInputAdet)||n(u.todayInputM3)).length;const todayAdet=users.reduce((s,u)=>s+n(u.todayInputAdet),0);const todayM3=users.reduce((s,u)=>s+n(u.todayInputM3),0);const lastBackup=backups[0]&&backups[0].createdAt?backups[0].createdAt:"-";const setLabel=(el,label)=>{try{const x=el&&el.parentElement&&el.parentElement.querySelector("span");if(x)x.textContent=label;}catch{}};try{setLabel(els.adminTotalUsers,"Kullanıcı");setLabel(els.adminTodayUsers,"Bugün Aktif");setLabel(els.adminWeekUsers,"Bugün Adet");setLabel(els.adminTotalBackups,"Bugün m³");setLabel(els.adminLastBackup,"Son Yedek");if(els.adminTotalUsers)els.adminTotalUsers.textContent=users.length.toLocaleString("tr-TR");if(els.adminTodayUsers)els.adminTodayUsers.textContent=todayUsers.toLocaleString("tr-TR");if(els.adminWeekUsers)els.adminWeekUsers.textContent=todayAdet.toLocaleString("tr-TR");if(els.adminTotalBackups)els.adminTotalBackups.textContent=m3(todayM3).replace(" m³","");if(els.adminLastBackup)els.adminLastBackup.textContent=lastBackup;}catch{}};
  renderAdminUsers=function(){if(!els||!els.registeredUsersList)return;try{updateAdminTopSummary();}catch{}const list=adminFilteredUsers();window.__adminListV139=window.__adminListV134=window.__adminListV131=list;els.registeredUsersList.classList.add("admin-list-v131");if(!list.length){els.registeredUsersList.innerHTML=`<div class="empty-user-list">Kullanıcı bulunamadı.</div>`;return;}els.registeredUsersList.innerHTML=list.map((u,idx)=>{const st=status(u),is=issues(u),source=src(u),dev=device(u);return`
    <div class="admin-user-row-v131 status-${esc(st.key||"today")} ${is?"has-open-issue-v134":""}" data-admin-row-v131="${idx}">
      <div class="admin-user-main-v131"><b>${esc(u.name||"-")}</b><span>${esc(u.seflik||"-")} ${source?`• ${esc(source)}`:""}</span>${badges(u)}</div>
      <div class="admin-user-stats-v131"><span>Süre <b>${esc(dur(u.todayActiveMs))}</b></span><span>Adet <b>${esc(i(u.todayInputAdet))}</b></span><span>m³ <b>${esc(m3(u.todayInputM3))}</b></span></div>
      <button class="admin-detail-bubble-v131" type="button" onclick="adminToggleDetailV131(${idx})">Detay</button>
      <div class="admin-user-detail-panel-v131"><div class="admin-detail-grid-v131">
        <span>Durum <b>${esc(st.label||"-")}</b></span><span>İlk kayıt <b>${esc(u.firstLogin||u.createdAt||"Bilinmiyor")}</b></span><span>Son giriş <b>${esc(u.lastLogin||"-")}</b></span><span>Son aktif <b>${esc(u.lastUsageAt||"-")}</b></span><span>Son yedek <b>${esc(u.lastBackupAt||"-")}</b></span><span>Yedek sayısı <b>${i(u.backupCount)}</b></span><span>Açık sorun <b>${i(is)}</b></span><span>7 gün adet <b>${i(u.weekInputAdet)}</b></span><span>7 gün m³ <b>${esc(m3(u.weekInputM3))}</b></span><span>Sürüm <b>${esc(u.appVersion||u.fileVersion||"-")}</b></span><span>Cihaz <b>${esc(dev||"-")}</b></span>
      </div><div class="admin-detail-actions-v131"><button class="secondary" type="button" onclick="adminOpenUserBackups('${arg(u.name)}','${arg(u.seflik)}')">Yedekleri Gör</button>${is?`<button class="issue-v134" type="button" onclick="adminOpenUserReportsV134(${idx})">Sorunları Gör</button>`:""}<button class="danger-v134" type="button" onclick="adminDeleteUserV134(${idx})">Kullanıcıyı Sil</button><button class="ghost" type="button" onclick="adminToggleDetailV131(${idx})">Kapat</button></div></div>
    </div>`;}).join("");};

  async function deleteUsageDocs(db){let deleted=0;for(let round=0;round<30;round++){const snap=await db.collection(usageColl()).limit(450).get();const docs=[];snap.forEach(doc=>{if(doc.id!==MARKER)docs.push(doc);});if(!docs.length)break;const batch=db.batch();docs.forEach(doc=>batch.delete(doc.ref));await batch.commit();deleted+=docs.length;if(docs.length<450)break;}return deleted;}
  async function resetUserDocs(db,nowText,nowMs){const snap=await db.collection(usersColl()).get();const docs=[];snap.forEach(doc=>docs.push(doc));let count=0;for(let i0=0;i0<docs.length;i0+=430){const batch=db.batch();docs.slice(i0,i0+430).forEach(doc=>{batch.set(doc.ref,{todayUsage:{date:today(),activeMs:0,activeMinutes:0,inputAdet:0,inputM3:0,recordEntryCount:0,updatedAt:nowText,updatedAtMs:nowMs,resetByAdmin:true,resetAtMs:nowMs},lastUsageAt:"",lastUsageMs:0,lastExportSummary:null,statsResetAt:nowText,statsResetAtMs:nowMs},{merge:true});count++;});await batch.commit();}return count;}
  function clearLocal(resetAt){try{const raw=JSON.parse(localStorage.getItem(EXPORT_QUEUE)||"{}");const next={};if(raw&&typeof raw==="object")Object.keys(raw).forEach(k=>{const p=raw[k]&&(raw[k].payload||raw[k]);const ms=genMs(p||{});if(ms&&ms>resetAt)next[k]=raw[k];});localStorage.setItem(EXPORT_QUEUE,JSON.stringify(next));}catch{}try{localStorage.setItem(USAGE_LOCAL,"{}");localStorage.setItem("mesaha_usage_stats_v1","{}");localStorage.setItem("mesaha_stats_reset_at_v139",String(resetAt));localStorage.setItem("mesaha_stats_reset_at_v138",String(resetAt));}catch{}}
  function zeroState(){try{if(!state||!Array.isArray(state.adminOnlineUsers))return;state.adminOnlineUsers=state.adminOnlineUsers.map(u=>zeroUser(u));localStorage.setItem("mesaha_admin_users_cache_v1",JSON.stringify({time:new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}),users:state.adminOnlineUsers}));}catch{}}
  window.adminResetStatsV139=async function(){if(!confirm("İstatistik ve admin kullanıcı listesindeki günlük deneme verileri sıfırlansın mı? Normal kayıtlar, yedekler, kullanıcılar ve sorun bildirimleri silinmez."))return;const word=prompt("Devam etmek için SIFIRLA yaz:");if(word!=="SIFIRLA"){toast("İşlem iptal edildi.");return;}try{if(typeof setCloudLoading==="function")setCloudLoading(true,"İstatistikler ve admin özetleri sıfırlanıyor...");}catch{}try{const {db}=await ensureFirebaseReady();const nowMs=Date.now();const nowText=typeof firebaseDateText==="function"?firebaseDateText():new Date().toLocaleString("tr-TR");const deleted=await deleteUsageDocs(db);const resetUsers=await resetUserDocs(db,nowText,nowMs);await db.collection(usageColl()).doc(MARKER).set({type:"statsResetMarker",resetAt:nowText,resetAtMs:nowMs,appVersion:BUILD_VERSION,fileVersion:FILE_VERSION,deletedDocs:deleted,resetUsers,updatedAt:nowText,updatedAtMs:nowMs},{merge:false});setLocalReset({resetAt:nowText,resetAtMs:nowMs});clearLocal(nowMs);zeroState();try{window.__mesahaStatsCacheV138={};window.__mesahaStatsCacheV139={};Object.keys(window.state||{}).filter(k=>/^adminStatsV13/.test(k)).forEach(k=>delete window.state[k]);}catch{}try{renderAdminUsers();updateAdminTopSummary();}catch{}toast(`İstatistik sıfırlandı. ${i(deleted)} eski özet ve ${i(resetUsers)} kullanıcı günlük özeti temizlendi.`);try{if(typeof adminRefreshStatsV132==="function")await adminRefreshStatsV132();}catch{}}catch(err){console.warn("v139 reset error",err);toast("İstatistik sıfırlanamadı. İnternet/Firebase bağlantısını kontrol et.");}finally{try{if(typeof setCloudLoading==="function")setCloudLoading(false);}catch{}}};
  window.adminResetStatsV138=window.adminResetStatsV137=window.adminResetStatsV136=window.adminResetStatsV139;
  const oldRefresh=typeof adminRefreshStatsV132==="function"?adminRefreshStatsV132:null;if(oldRefresh){adminRefreshStatsV132=async function(){try{setLocalReset(await readMarker());}catch{}return oldRefresh();};}
  const oldDevice=typeof currentDeviceInfoPayload==="function"?currentDeviceInfoPayload:null;try{currentDeviceInfoPayload=function(){const info=oldDevice?oldDevice():{};info.appVersion=BUILD_VERSION;info.fileVersion=FILE_VERSION;info.statsResetAdminListFix=true;info.updatedMs=Date.now();return info;};}catch{}
  window.MESAHA_BUILD_INFO=Object.assign({},window.MESAHA_BUILD_INFO||{},{fileVersion:FILE_VERSION,visibleVersion:BUILD_VERSION,statsResetAdminListFix:true,stableBuild:true});
  try{document.title="Mesaha App v139";const h1=document.querySelector(".brand h1");if(h1)h1.textContent=BUILD_VERSION;}catch{}
  setTimeout(()=>{readMarker().then(marker=>{if(marker&&marker.resetAtMs){try{state.adminOnlineUsers=sanitizeUsers(state.adminOnlineUsers||[],marker);renderAdminUsers();}catch{}}}).catch(()=>{});},1200);
})();



;


/* script block 8  */

/* Mesaha v141 - admin son görülen + arka plan süre senkronu */
(function(){
  "use strict";
  const BUILD_VERSION = "Mesaha İO v1.99";
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


;


/* script block 9  */

/* Mesaha v142 - admin üst özet: Son Görülen kişi yerine bugün görülen kullanıcı sayısı */
(function(){
  "use strict";
  const BUILD_VERSION = "Mesaha İO v1.99";
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


;


/* script block 10 id="mesaha-v143-mobile-ui-js" */

(function(){
  "use strict";
  const VERSION_TEXT = "Mesaha İO v1.99";
  function $(id){ return document.getElementById(id); }
  function fmt(n){ try { return Number(n || 0).toLocaleString("tr-TR"); } catch { return String(n || 0); } }
  function m3FromDesi(v){ try { if (typeof formatHacimFromDesi === "function") return formatHacimFromDesi(v); } catch {} return ((Number(v)||0)/1000).toFixed(3).replace(/0+$/,"").replace(/\.$/,"") || "0"; }
  function getRecords(){ try { if (typeof state !== "undefined" && Array.isArray(state.records)) return state.records; } catch {} try { return JSON.parse(localStorage.getItem("cam_mesaha_kayitlari_v1") || "[]") || []; } catch { return []; } }
  function qty(r){ return Number(r && (r.quantity ?? r.adet ?? r.count)) || 0; }
  function desi(r){ return Number(r && (r.desi ?? 0)) || 0; }
  function isThisWeek(rec){
    try{
      const raw = rec && rec.productionDate;
      const d = raw ? new Date(raw + "T00:00:00") : null;
      if(!d || !Number.isFinite(d.getTime())) return false;
      const now = new Date();
      const day = (now.getDay()+6)%7;
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()-day);
      start.setHours(0,0,0,0);
      return d >= start;
    }catch{ return false; }
  }
  function updateNetwork(){
    const el=$("homeNetworkV143"); if(!el) return;
    const online = !!navigator.onLine;
    el.textContent = online ? "Çevrimiçi" : "Çevrimdışı";
    el.style.color = online ? "#18753d" : "#174f83";
  }
  function updateStorage(){
    const el=$("homeStorageV143"); if(!el) return;
    if(navigator.storage && navigator.storage.estimate){
      navigator.storage.estimate().then(e=>{
        const quota = Number(e.quota || 0);
        const usage = Number(e.usage || 0);
        if(!quota) { el.textContent = "Hazır"; return; }
        const left = Math.max(0, quota-usage);
        const gb = left / (1024*1024*1024);
        const mb = left / (1024*1024);
        el.textContent = gb >= 1 ? gb.toFixed(2) + " GB" : Math.round(mb) + " MB";
      }).catch(()=>{ el.textContent="Hazır"; });
    } else el.textContent="Hazır";
  }
  function updateHome(){
    const records = getRecords();
    const totalQty = records.reduce((s,r)=>s+qty(r),0);
    const totalDesi = records.reduce((s,r)=>s+desi(r),0);
    const diameters = records.map(r=>Number(r && r.diameter)).filter(Number.isFinite);
    const avgD = diameters.length ? diameters.reduce((s,v)=>s+v,0)/diameters.length : 0;
    const week = records.filter(isThisWeek).length;
    const last = records[0] || null;
    const lastTree = last ? (last.treeType || last.species || "-") : "-";
    const lastDate = last ? (last.uretimTarihi || last.productionDate || last.createdAt || "Son kayıt") : "Henüz kayıt yok";
    const map = {
      homeRecordCountV143: fmt(records.length),
      homeAdetV143: fmt(totalQty),
      homeLastTreeV143: lastTree,
      homeLastDateV143: lastDate,
      homeWeekCountV143: fmt(week),
      homeAvgDiameterV143: (avgD ? avgD.toFixed(1).replace(".",",") : "0") + " cm",
      homeTotalM3V143: m3FromDesi(totalDesi) + " m³"
    };
    Object.keys(map).forEach(id=>{ const el=$(id); if(el) el.textContent = map[id]; });
    updateNetwork();
  }
  function beautifyTabs(){
    const tabs = document.getElementById("flowTabsV111"); if(!tabs) return;
    const labels = { entry:["🏠","Ana Sayfa"], records:["📏","Ölçümler"], guide:["▱","Kılavuz"], admin:["⚙","Admin"] };
    tabs.querySelectorAll("button[data-flow-tab]").forEach(btn=>{
      if(btn.__v143Done) return;
      const item = labels[btn.dataset.flowTab] || ["•", btn.textContent.trim()];
      btn.innerHTML = '<span class="tab-ico-v143">'+item[0]+'</span><span class="tab-label-v143">'+item[1]+'</span>';
      btn.__v143Done = true;
    });
  }
  function bindQuickActions(){
    document.querySelectorAll("[data-home-action-v143]").forEach(btn=>{
      if(btn.__homeActionV143) return; btn.__homeActionV143 = true;
      btn.addEventListener("click", function(){
        const action = this.getAttribute("data-home-action-v143");
        if(action === "records") { try { document.querySelector('[data-flow-tab="records"]')?.click(); } catch{} return; }
        if(action === "backup") { const b = document.getElementById("backupBtn"); if(b) b.click(); return; }
        if(action === "diameter") { try { document.querySelector('[data-flow-tab="entry"]')?.click(); } catch{} setTimeout(()=>{ const d=$("diameter"); if(d) { d.scrollIntoView({behavior:"smooth", block:"center"}); d.focus(); } },180); return; }
        if(action === "new") { try { document.querySelector('[data-flow-tab="entry"]')?.click(); } catch{} setTimeout(()=>{ const f=document.querySelector(".entry-panel"); if(f) f.scrollIntoView({behavior:"smooth", block:"start"}); const b=$("barcode"); if(b) b.focus(); },160); }
      });
    });
  }
  function applyVersion(){
    try { document.title = "Mesaha İO v1.99"; } catch {}
    try { const h1 = document.querySelector(".brand h1"); if(h1) h1.textContent = VERSION_TEXT; } catch {}
    try { window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, { fileVersion:"v143-ui", visibleVersion:VERSION_TEXT, uiMode:"mobile-home-logo" }); } catch {}
  }
  function init(){ beautifyTabs(); bindQuickActions(); updateHome(); updateStorage(); applyVersion(); }
  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("online", updateNetwork); window.addEventListener("offline", updateNetwork);
  setTimeout(init, 50); setTimeout(init, 800); setInterval(updateHome, 2500);
  try{
    if(typeof render === "function" && !render.__v143Wrapped){
      const oldRender = render;
      render = function(){ const out = oldRender.apply(this, arguments); try { requestAnimationFrame(updateHome); } catch{} return out; };
      render.__v143Wrapped = true;
    }
  }catch{}
})();


;
