/* script block 2  */

/* Mesaha v137 active stats reset fix */
(function(){
  "use strict";
  const BUILD_VERSION_V137 = "Mesaha İO v1.99";
  const FILE_VERSION_V137 = "v137";
  const STATS_RESET_DOC_V137 = "__stats_reset_marker__";
  const EXPORT_QUEUE_KEY_V137 = "mesaha_export_stats_queue_v135";

  function esc(v){
    try { if (typeof escapeHtml === "function") return escapeHtml(v); } catch {}
    return String(v ?? "").replace(/[&<>\"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[ch]));
  }
  function toast(msg){ try { if (typeof showToast === "function") showToast(msg); else console.log(msg); } catch {} }
  function n(v){ const x = Number(String(v ?? "").replace(",", ".")); return Number.isFinite(x) ? x : 0; }
  function intText(v){ return Math.round(Number(v) || 0).toLocaleString("tr-TR"); }
  function m3Text(v){ return `${(Number(v) || 0).toFixed(3).replace(".", ",")} m³`; }
  function periodLabel(period){ return period === "today" ? "Bugün" : (period === "week" ? "Bu Hafta" : "Tüm Zamanlar"); }
  function todayISO(){ const d = new Date(); const p=x=>String(x).padStart(2,"0"); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; }
  function weekStartISO(){ const d = new Date(); const day = (d.getDay()+6)%7; d.setHours(0,0,0,0); d.setDate(d.getDate()-day); const p=x=>String(x).padStart(2,"0"); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; }
  function collName(name){
    try { if (name === "usage" && typeof FIREBASE_USAGE_COLLECTION !== "undefined") return FIREBASE_USAGE_COLLECTION; } catch {}
    try { if (name === "backups" && typeof FIREBASE_BACKUPS_COLLECTION !== "undefined") return FIREBASE_BACKUPS_COLLECTION; } catch {}
    return name === "usage" ? "usageStats" : "backups";
  }
  async function dbReady(){
    if (typeof ensureFirebaseReady === "function") {
      const ready = await ensureFirebaseReady();
      if (ready && ready.db) return ready.db;
    }
    if (window.firebaseDb) return window.firebaseDb;
    throw new Error("Firebase hazır değil");
  }
  function userKeyFrom(d){
    const name = String((d && (d.name || d.userName)) || "").trim().toLowerCase();
    const seflik = String((d && d.seflik) || "").trim().toLowerCase();
    return `${name}_${seflik}`.replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ_-]+/gi,"_").replace(/^_+|_+$/g,"") || "bilinmeyen";
  }
  function add(map, name, adet, m3){
    const key = String(name || "Bilinmiyor").trim() || "Bilinmiyor";
    const row = map.get(key) || { name:key, adet:0, m3:0 };
    row.adet += Number(adet) || 0;
    row.m3 += Number(m3) || 0;
    map.set(key, row);
  }
  function sorted(map){
    return Array.from(map.values()).sort((a,b)=>((b.m3||0)-(a.m3||0)) || ((b.adet||0)-(a.adet||0)) || String(a.name).localeCompare(String(b.name), "tr"));
  }
  function qty(r){ return Math.max(0, n(r && (r.quantity ?? r.adet ?? r.count)) || 1); }
  function recordM3(r){
    if (!r) return 0;
    const desi = n(r.desi);
    if (desi > 0) return desi / 1000;
    const hacim = n(String(r.hacim ?? r.volume ?? "").replace(/[^0-9.,-]/g, ""));
    if (hacim > 0) return hacim;
    try {
      const cap = n(r.diameter ?? r.cap ?? 0);
      const boy = n(r.length ?? r.boy ?? 0);
      const q = qty(r) || 1;
      if (typeof calculateDesi === "function") return (Number(calculateDesi(cap, boy, q)) || 0) / 1000;
    } catch {}
    return 0;
  }
  function treeName(r){
    const raw = String((r && (r.treeType || r.species || r.agacAdi || r.agac)) || "").trim();
    if (!raw) return "Bilinmiyor";
    try { return (typeof getTreeInfo === "function" ? getTreeInfo(raw).agacAdi : raw) || raw; } catch { return raw; }
  }
  function productName(r){
    const raw = String((r && (r.productType || r.odunAdi || r.odun || r.product)) || "").trim();
    if (!raw) return "Bilinmiyor";
    try { if (typeof PRODUCT_MAP !== "undefined" && PRODUCT_MAP[raw]) return PRODUCT_MAP[raw].odunAdi || raw; } catch {}
    try { if (typeof productDisplayName === "function") return productDisplayName(raw) || raw; } catch {}
    return raw;
  }
  function recordDate(r){
    const s = String((r && (r.createdAtIso || r.uretimTarihi || r.date || r.createdAt || r.savedAt)) || "").trim();
    const m = s.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (m) return `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`;
    const tr = s.match(/(\d{1,2})[./-](\d{1,2})[./-](20\d{2})/);
    if (tr) return `${tr[3]}-${String(tr[2]).padStart(2,"0")}-${String(tr[1]).padStart(2,"0")}`;
    return "";
  }
  function summarizeRecords(records, period){
    const today = todayISO();
    const week = weekStartISO();
    const treeMap = new Map(), productMap = new Map();
    let recordCount=0, adet=0, m3=0;
    (Array.isArray(records) ? records : []).forEach(r=>{
      const dt = recordDate(r);
      if (period === "today" && dt && dt !== today) return;
      if (period === "week" && dt && dt < week) return;
      const q = qty(r), vol = recordM3(r);
      recordCount += 1; adet += q; m3 += vol;
      add(treeMap, treeName(r), q, vol);
      add(productMap, productName(r), q, vol);
    });
    return { recordCount, adet, m3:Number(m3.toFixed(3)), trees:sorted(treeMap), products:sorted(productMap) };
  }
  function rows(list){
    if (!list || !list.length) return `<div class="admin-stats-empty-v132">Veri bulunamadı.</div>`;
    return list.map(row => `<div class="admin-stat-row-v132"><div class="admin-stat-name-v132">${esc(row.name)}</div><div class="admin-stat-val-v132">${intText(row.adet)} adet</div><div class="admin-stat-val-v132">${m3Text(row.m3)}</div></div>`).join("");
  }
  function panel(){
    let p = document.getElementById("adminStatsPanelV132");
    if (!p) {
      const anchor = document.querySelector(".admin-summary-grid-clean") || document.querySelector(".admin-panel-top-clean") || document.getElementById("adminPanel") || document.body;
      if (anchor) {
        p = document.createElement("div");
        p.id = "adminStatsPanelV132";
        p.className = "admin-stats-panel-v132";
        anchor.insertAdjacentElement(anchor === document.body ? "beforeend" : "afterend", p);
      }
    }
    return p;
  }
  async function readResetMarker(db){
    try {
      const doc = await db.collection(collName("usage")).doc(STATS_RESET_DOC_V137).get();
      if (!doc.exists) return { resetAtMs:0, resetAt:"" };
      const d = doc.data() || {};
      return { resetAtMs:Number(d.resetAtMs || 0), resetAt:d.resetAt || "" };
    } catch { return { resetAtMs:0, resetAt:"" }; }
  }
  function summaryGeneratedMs(d){
    // queuedAt/exportAt/createdAt is the real generation time. updatedAt can be later if an old offline queue is synced after reset.
    return Number(d && (d.queuedAtMs || d.exportAtMs || d.createdAtMs || d.updatedAtMs || 0)) || 0;
  }
  async function loadExportStats(period, db, reset){
    let snap;
    const coll = collName("usage");
    try { snap = await db.collection(coll).where("type", "==", "dailyExportSummary").get(); }
    catch { snap = await db.collection(coll).get(); }
    const resetAtMs = Number(reset && reset.resetAtMs) || 0;
    const latest = new Map();
    snap.forEach(doc=>{
      try {
        if (doc.id === STATS_RESET_DOC_V137) return;
        const d = doc.data() || {};
        if (d.type && d.type !== "dailyExportSummary") return;
        const generatedMs = summaryGeneratedMs(d);
        if (resetAtMs && generatedMs && generatedMs <= resetAtMs) return;
        const key = `${d.userKey || userKeyFrom(d)}_${d.deviceId || "cihaz"}`;
        const old = latest.get(key);
        const rankMs = Number(d.updatedAtMs || d.exportAtMs || generatedMs || 0);
        if (!old || rankMs >= old.rankMs) latest.set(key, { data:d, rankMs });
      } catch {}
    });
    const treeMap = new Map(), productMap = new Map();
    let recordCount=0, adet=0, m3=0;
    latest.forEach(item=>{
      const d = item.data || {};
      const summary = period === "today" ? d.todaySummary : (period === "week" ? d.weekSummary : d.allSummary);
      if (!summary && period !== "all") return;
      const trees = (summary && summary.trees) || (period === "all" ? d.treeTotals : []) || [];
      const products = (summary && summary.products) || (period === "all" ? d.productTotals : []) || [];
      recordCount += Number((summary && summary.recordCount) || (period === "all" ? d.recordCount : 0)) || 0;
      adet += Number((summary && summary.adet) || (period === "all" ? d.totalAdet : 0)) || 0;
      m3 += Number((summary && summary.m3) || (period === "all" ? d.totalM3 : 0)) || 0;
      trees.forEach(r=>add(treeMap, r.name, r.adet, r.m3));
      products.forEach(r=>add(productMap, r.name, r.adet, r.m3));
    });
    return { users:latest.size, recordCount, adet, m3:Number(m3.toFixed(3)), trees:sorted(treeMap), products:sorted(productMap), period, source:"downloadSummary", resetAtMs, resetAt:reset.resetAt || "", loadedAt:new Date().toLocaleString("tr-TR") };
  }
  async function loadBackupFallback(period, db){
    const snap = await db.collection(collName("backups")).get();
    const latest = new Map();
    snap.forEach(doc=>{
      try {
        const d = doc.data() || {};
        let payload = d.payload || null;
        if (!payload && d.payloadText) payload = JSON.parse(d.payloadText);
        if (!payload || !Array.isArray(payload.records) || !payload.records.length) return;
        const key = d.userKey || userKeyFrom({ name:d.name || (payload.user && payload.user.name), seflik:d.seflik || (payload.user && payload.user.seflik) }) || doc.id;
        const ms = Number(d.createdAtMs || d.backupAtMs || 0) || Date.parse(d.createdAtIso || d.createdAt || "") || 0;
        const old = latest.get(key);
        if (!old || ms >= old.ms) latest.set(key, { ms, payload });
      } catch {}
    });
    const records = [];
    latest.forEach(item => records.push(...(item.payload.records || [])));
    const s = summarizeRecords(records, period);
    return { users:latest.size, recordCount:s.recordCount, adet:s.adet, m3:s.m3, trees:s.trees, products:s.products, period, source:"backupFallback", resetAtMs:0, resetAt:"", loadedAt:new Date().toLocaleString("tr-TR") };
  }
  async function loadStats(period){
    const p = period === "today" || period === "week" ? period : "all";
    const db = await dbReady();
    const reset = await readResetMarker(db);
    const stats = await loadExportStats(p, db, reset);
    // Reset varsa eski yedeklerden tekrar doldurma. Böylece sıfırlama gerçekten sıfır gösterir.
    if (reset.resetAtMs) return stats;
    if (!stats.recordCount && !stats.trees.length && !stats.products.length) return await loadBackupFallback(p, db);
    return stats;
  }
  function renderStats(stats, message){
    const p = panel();
    if (!p) return;
    if (message) { p.innerHTML = `<div class="admin-stats-empty-v132">${esc(message)}</div>`; return; }
    const topTree = (stats.trees || [])[0] || { name:"-", adet:0, m3:0 };
    const topProduct = (stats.products || [])[0] || { name:"-", adet:0, m3:0 };
    const period = stats.period || window.adminStatsPeriodV134 || "all";
    const sourceText = stats.source === "downloadSummary" ? "Mesaha dosyası indirme özetleri" : "Firebase yedekleri";
    const resetNote = stats.resetAtMs ? `<div class="admin-stats-reset-note-v137">İstatistik ${esc(stats.resetAt || "yakın zamanda")} tarihinde sıfırlandı. Bu ekranda sadece sıfırlamadan sonra gönderilen yeni özetler sayılır.</div>` : "";
    p.innerHTML = `
      <div class="admin-stats-head-v132">
        <div>
          <b>Toplu İstatistik</b>
          <span>Dönem: ${esc(periodLabel(period))} • Kaynak: ${esc(sourceText)} • Son yenileme: ${esc(stats.loadedAt || "-")}</span>
          <div class="admin-stats-period-v134">
            <button type="button" class="${period === "today" ? "active" : ""}" onclick="adminSetStatsPeriodV134('today')">Bugün</button>
            <button type="button" class="${period === "week" ? "active" : ""}" onclick="adminSetStatsPeriodV134('week')">Bu Hafta</button>
            <button type="button" class="${period === "all" ? "active" : ""}" onclick="adminSetStatsPeriodV134('all')">Tüm Zamanlar</button>
          </div>
          <div class="admin-stats-note-v134">Kullanıcı Mesaha Dosyasını İndir dediğinde özet veri gönderilir; internet yoksa bağlantı gelince otomatik aktarılır.</div>
          ${resetNote}
        </div>
        <div class="admin-stats-actions-v137">
          <button type="button" class="secondary" onclick="adminRefreshStatsV132()">Yenile</button>
          <button type="button" class="danger" onclick="adminResetStatsV137()">İstatistiği Sıfırla</button>
        </div>
      </div>
      <div class="admin-stats-cards-v132">
        <div class="admin-stat-top-card-v132"><span>En fazla ağaç türü</span><b>${esc(topTree.name)}</b><small>${intText(topTree.adet)} adet • ${m3Text(topTree.m3)}</small></div>
        <div class="admin-stat-top-card-v132"><span>En fazla odun türü</span><b>${esc(topProduct.name)}</b><small>${intText(topProduct.adet)} adet • ${m3Text(topProduct.m3)}</small></div>
        <div class="admin-stat-top-card-v132"><span>Kapsam</span><b>${intText(stats.users)} kullanıcı</b><small>${intText(stats.recordCount)} kayıt</small></div>
        <div class="admin-stat-top-card-v132"><span>Toplam</span><b>${intText(stats.adet)} adet</b><small>${m3Text(stats.m3)}</small></div>
      </div>
      <div class="admin-stats-columns-v132">
        <div class="admin-stats-section-v132"><h4>Ağaç türleri</h4>${rows(stats.trees)}</div>
        <div class="admin-stats-section-v132"><h4>Odun türleri</h4>${rows(stats.products)}</div>
      </div>`;
  }
  async function loadAndRenderStats(force){
    window.adminStatsPeriodV134 = window.adminStatsPeriodV134 || "all";
    const p = panel();
    const btn = document.getElementById("adminStatsBtnV132");
    if (p) p.classList.add("open");
    if (btn) btn.classList.add("active");
    const period = window.adminStatsPeriodV134;
    const key = `adminStatsV137_${period}`;
    if (!force && window.state && state[key]) return renderStats(state[key]);
    try { if (typeof setCloudLoading === "function") setCloudLoading(true, "İstatistikler hazırlanıyor..."); } catch {}
    renderStats(null, "İstatistikler hazırlanıyor...");
    try {
      const stats = await loadStats(period);
      try { if (window.state) state[key] = stats; } catch {}
      renderStats(stats);
    } catch (err) {
      console.warn("v137 stats error", err);
      renderStats(null, "İstatistikler alınamadı. İnternet, Firebase bağlantısı veya Firestore Rules alanını kontrol et.");
      toast("İstatistik alınamadı.");
    } finally { try { if (typeof setCloudLoading === "function") setCloudLoading(false); } catch {} }
  }
  async function deleteUsageStatsDocs(db){
    const collection = db.collection(collName("usage"));
    let deleted = 0;
    for (let round=0; round<60; round++) {
      const snap = await collection.limit(400).get();
      const docs = [];
      snap.forEach(doc => { if (doc.id !== STATS_RESET_DOC_V137) docs.push(doc); });
      if (!docs.length) break;
      const batch = db.batch();
      docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      deleted += docs.length;
      if (docs.length < 400) break;
    }
    return deleted;
  }
  function clearLocalExportQueue(resetAtMs){
    try {
      const q = JSON.parse(localStorage.getItem(EXPORT_QUEUE_KEY_V137) || "{}");
      let changed = false;
      Object.keys(q || {}).forEach(id => {
        const item = q[id] || {};
        const gen = Number(item.queuedAtMs || item.exportAtMs || item.createdAtMs || item.updatedAtMs || 0);
        if (!gen || gen <= resetAtMs) { delete q[id]; changed = true; }
      });
      if (changed) localStorage.setItem(EXPORT_QUEUE_KEY_V137, JSON.stringify(q || {}));
      localStorage.setItem("mesaha_stats_reset_at_v137", String(resetAtMs));
    } catch {}
  }
  window.adminResetStatsV137 = async function(){
    if (!confirm("İstatistik ekranındaki deneme verileri sıfırlansın mı? Bu işlem sadece usageStats istatistiklerini temizler; normal kayıtlar, bulut yedekleri, kullanıcılar ve sorun bildirimleri silinmez.")) return;
    const word = prompt("Devam etmek için SIFIRLA yaz:");
    if (word !== "SIFIRLA") { toast("İşlem iptal edildi."); return; }
    try { if (typeof setCloudLoading === "function") setCloudLoading(true, "İstatistikler sıfırlanıyor..."); } catch {}
    try {
      const db = await dbReady();
      const deleted = await deleteUsageStatsDocs(db);
      const nowMs = Date.now();
      const nowText = (typeof firebaseDateText === "function") ? firebaseDateText() : new Date().toLocaleString("tr-TR");
      await db.collection(collName("usage")).doc(STATS_RESET_DOC_V137).set({
        type:"statsResetMarker",
        resetAt:nowText,
        resetAtMs:nowMs,
        appVersion:BUILD_VERSION_V137,
        fileVersion:FILE_VERSION_V137,
        deletedDocs:deleted,
        updatedAt:nowText,
        updatedAtMs:nowMs
      }, { merge:false });
      clearLocalExportQueue(nowMs);
      try { Object.keys(state || {}).filter(k=>/^adminStatsV13[0-9]_/.test(k)).forEach(k=>delete state[k]); } catch {}
      toast(`İstatistik sıfırlandı. ${intText(deleted)} eski özet temizlendi.`);
      await loadAndRenderStats(true);
    } catch (err) {
      console.warn("v137 reset error", err);
      toast("İstatistik sıfırlanamadı. İnternet/Firebase bağlantısını kontrol et.");
    } finally { try { if (typeof setCloudLoading === "function") setCloudLoading(false); } catch {} }
  };
  // Eski v132/v134/v135 istatistik fonksiyonlarını v137 ile değiştir.
  window.adminSetStatsPeriodV134 = function(period){ window.adminStatsPeriodV134 = (period === "today" || period === "week") ? period : "all"; return loadAndRenderStats(true); };
  window.adminRefreshStatsV132 = function(){ return loadAndRenderStats(true); };
  window.adminToggleStatsV132 = function(){
    const p = panel();
    const btn = document.getElementById("adminStatsBtnV132");
    if (!p) return;
    const willOpen = !p.classList.contains("open");
    p.classList.toggle("open", willOpen);
    if (btn) btn.classList.toggle("active", willOpen);
    if (willOpen) loadAndRenderStats(false);
  };
  // Eski HTML v136 onclick çağırırsa yine çalışsın.
  window.adminResetStatsV136 = window.adminResetStatsV137;
  // Offline kuyrukta sıfırlamadan önce hazırlanmış özet varsa sonradan gönderilmesin.
  const oldFlush = window.v135FlushExportQueue;
  if (typeof oldFlush === "function" && !oldFlush.__v137Wrapped) {
    const wrapped = async function(silent){
      const resetAtMs = Number(localStorage.getItem("mesaha_stats_reset_at_v137") || 0) || 0;
      if (resetAtMs) clearLocalExportQueue(resetAtMs);
      return oldFlush(silent);
    };
    wrapped.__v137Wrapped = true;
    window.v135FlushExportQueue = wrapped;
  }
  try {
    const style = document.createElement("style");
    style.id = "mesaha-v137-stats-reset-css";
    style.textContent = `
      .admin-stats-actions-v137{display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap;justify-content:flex-end;}
      .admin-stats-actions-v137 .danger{border:0;border-radius:14px;padding:10px 12px;font-weight:900;background:#dc2626;color:#fff;}
      .admin-stats-reset-note-v137{margin-top:8px;font-size:12px;line-height:1.35;color:#b45309;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:8px 10px;}
      body.theme-dark .admin-stats-reset-note-v137{color:#fdba74;background:rgba(251,146,60,.10);border-color:rgba(251,146,60,.28);}
      @media(max-width:720px){.admin-stats-actions-v137{width:100%;justify-content:stretch}.admin-stats-actions-v137 button{flex:1}}
    `;
    document.head.appendChild(style);
  } catch {}
  const prevDeviceInfo = typeof currentDeviceInfoPayload === "function" ? currentDeviceInfoPayload : null;
  currentDeviceInfoPayload = function(){
    const info = prevDeviceInfo ? prevDeviceInfo() : {};
    info.appVersion = BUILD_VERSION_V137;
    info.fileVersion = FILE_VERSION_V137;
    info.statsResetSupport = true;
    info.statsResetFix = true;
    info.updatedMs = Date.now();
    return info;
  };
  window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, {
    fileVersion: FILE_VERSION_V137,
    visibleVersion: BUILD_VERSION_V137,
    statsResetSupport: true,
    statsResetFix: true,
    stableBuild: true
  });
  try { document.title = "Mesaha App v138"; } catch {}
  try { const h1 = document.querySelector(".brand h1"); if (h1) h1.textContent = BUILD_VERSION_V137; } catch {}
})();


;


/* script block 3  */

/* Mesaha v138 - aktif istatistik sıfırlama kesin düzeltme */
(function(){
  "use strict";
  const BUILD_VERSION_V138 = "Mesaha İO v1.99";
  const FILE_VERSION_V138 = "v138";
  const STATS_RESET_DOC_V138 = "__stats_reset_marker__";
  const EXPORT_QUEUE_KEY_V138 = "mesaha_export_stats_queue_v135";

  function esc(value){
    try { if (typeof escapeHtml === "function") return escapeHtml(value); } catch {}
    return String(value ?? "").replace(/[&<>\"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[ch]));
  }
  function toast(msg){ try { if (typeof showToast === "function") showToast(msg); else console.log(msg); } catch {} }
  function num(v){
    const n = Number(String(v ?? "").replace(",", ".").replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  function intText(v){ return Math.round(Number(v) || 0).toLocaleString("tr-TR"); }
  function m3Text(v){ return `${(Number(v) || 0).toFixed(3).replace(".", ",")} m³`; }
  function todayISO(){ const d=new Date(), p=n=>String(n).padStart(2,"0"); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; }
  function weekStartISO(){ const d=new Date(); const day=(d.getDay()+6)%7; d.setHours(0,0,0,0); d.setDate(d.getDate()-day); const p=n=>String(n).padStart(2,"0"); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; }
  function periodLabel(period){ return period === "today" ? "Bugün" : (period === "week" ? "Bu Hafta" : "Tüm Zamanlar"); }
  function collName(which){
    if (which === "backups") { try { return FIREBASE_BACKUPS_COLLECTION || "backups"; } catch { return "backups"; } }
    try { return FIREBASE_USAGE_COLLECTION || "usageStats"; } catch { return "usageStats"; }
  }
  function userKeyFrom(d){
    const name = String((d && (d.userKey || d.name || d.userName || d.displayName)) || "").trim().toLowerCase();
    const seflik = String((d && d.seflik) || "").trim().toLowerCase();
    const raw = d && d.userKey ? String(d.userKey) : `${name}_${seflik}`;
    return raw.replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ_-]+/gi,"_").replace(/^_+|_+$/g,"") || "bilinmeyen";
  }
  function add(map, name, adet, m3){
    const key = String(name || "Bilinmiyor").trim() || "Bilinmiyor";
    const old = map.get(key) || { name:key, adet:0, m3:0 };
    old.adet += Number(adet) || 0;
    old.m3 = Number(((Number(old.m3)||0) + (Number(m3)||0)).toFixed(3));
    map.set(key, old);
  }
  function sorted(map){
    return Array.from(map.values()).sort((a,b)=>((b.adet||0)-(a.adet||0)) || ((b.m3||0)-(a.m3||0)) || String(a.name).localeCompare(String(b.name), "tr"));
  }
  function qty(r){ return Math.max(0, num(r && (r.quantity ?? r.adet ?? r.count)) || 1); }
  function recordM3(r){
    if (!r) return 0;
    const desi = num(r.desi);
    if (desi > 0) return desi / 1000;
    const hacim = num(r.hacim ?? r.volume ?? "");
    if (hacim > 0) return hacim;
    try {
      const cap = num(r.diameter ?? r.cap ?? 0), boy = num(r.length ?? r.boy ?? 0), q = qty(r) || 1;
      if (typeof calculateDesi === "function") return (Number(calculateDesi(cap, boy, q)) || 0) / 1000;
    } catch {}
    return 0;
  }
  function treeName(r){
    const raw = String((r && (r.treeType || r.species || r.agacAdi || r.agac)) || "").trim();
    if (!raw) return "Bilinmiyor";
    try { return (typeof getTreeInfo === "function" ? getTreeInfo(raw).agacAdi : raw) || raw; } catch { return raw; }
  }
  function productName(r){
    const raw = String((r && (r.productType || r.odunAdi || r.odun || r.product)) || "").trim();
    if (!raw) return "Bilinmiyor";
    try { if (typeof PRODUCT_MAP !== "undefined" && PRODUCT_MAP[raw]) return PRODUCT_MAP[raw].odunAdi || raw; } catch {}
    try { if (typeof productDisplayName === "function") return productDisplayName(raw) || raw; } catch {}
    return raw;
  }
  function recordDate(r){
    const s = String((r && (r.createdAtIso || r.uretimTarihi || r.date || r.createdAt || r.savedAt)) || "").trim();
    const iso = s.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (iso) return `${iso[1]}-${String(iso[2]).padStart(2,"0")}-${String(iso[3]).padStart(2,"0")}`;
    const tr = s.match(/(\d{1,2})[./-](\d{1,2})[./-](20\d{2})/);
    if (tr) return `${tr[3]}-${String(tr[2]).padStart(2,"0")}-${String(tr[1]).padStart(2,"0")}`;
    return "";
  }
  function summarizeRecords(records, period){
    const today = todayISO(), weekStart = weekStartISO();
    const treeMap = new Map(), productMap = new Map();
    let recordCount = 0, adet = 0, m3 = 0;
    (Array.isArray(records) ? records : []).forEach(r => {
      const dt = recordDate(r);
      if (period === "today" && dt && dt !== today) return;
      if (period === "week" && dt && dt < weekStart) return;
      const q = qty(r), vol = recordM3(r);
      recordCount += 1; adet += q; m3 += vol;
      add(treeMap, treeName(r), q, vol);
      add(productMap, productName(r), q, vol);
    });
    return { recordCount, adet, m3:Number(m3.toFixed(3)), trees:sorted(treeMap), products:sorted(productMap) };
  }
  function generatedMs(d){
    // updatedAtMs eski offline kuyruğu sıfırlamadan sonra gönderirse yeni olur; bu yüzden gerçek üretim zamanı önce gelir.
    return Number(d.exportAtMs || d.queuedAtMs || d.createdAtMs || d.generatedAtMs || d.updatedAtMs || 0) || 0;
  }
  async function readResetMarker(db){
    try {
      const doc = await db.collection(collName("usage")).doc(STATS_RESET_DOC_V138).get();
      if (!doc.exists) return { resetAtMs:0, resetAt:"" };
      const d = doc.data() || {};
      return { resetAtMs:Number(d.resetAtMs || 0), resetAt:d.resetAt || "" };
    } catch { return { resetAtMs:0, resetAt:"" }; }
  }
  async function loadExportStats(period, db, reset){
    let snap;
    try { snap = await db.collection(collName("usage")).where("type", "==", "dailyExportSummary").get(); }
    catch { snap = await db.collection(collName("usage")).get(); }
    const resetAtMs = Number(reset && reset.resetAtMs) || 0;
    const latest = new Map();
    snap.forEach(doc => {
      if (doc.id === STATS_RESET_DOC_V138) return;
      const d = doc.data() || {};
      if (d.type && d.type !== "dailyExportSummary") return;
      if (!d.allSummary && !d.treeTotals && !d.productTotals) return;
      const ms = generatedMs(d);
      if (resetAtMs && (!ms || ms <= resetAtMs)) return;
      const key = userKeyFrom(d) || doc.id;
      const old = latest.get(key);
      if (!old || ms >= old.ms) latest.set(key, { ms, data:d });
    });
    const treeMap = new Map(), productMap = new Map();
    let recordCount=0, adet=0, m3=0;
    latest.forEach(item => {
      const d = item.data || {};
      const summary = period === "today" ? d.todaySummary : (period === "week" ? d.weekSummary : d.allSummary);
      const trees = (summary && summary.trees) || (period === "all" ? d.treeTotals : []) || [];
      const products = (summary && summary.products) || (period === "all" ? d.productTotals : []) || [];
      recordCount += Number((summary && summary.recordCount) || (period === "all" ? d.recordCount : 0)) || 0;
      adet += Number((summary && summary.adet) || (period === "all" ? d.totalAdet : 0)) || 0;
      m3 += Number((summary && summary.m3) || (period === "all" ? d.totalM3 : 0)) || 0;
      trees.forEach(r => add(treeMap, r.name, r.adet, r.m3));
      products.forEach(r => add(productMap, r.name, r.adet, r.m3));
    });
    return { users:latest.size, recordCount, adet, m3:Number(m3.toFixed(3)), trees:sorted(treeMap), products:sorted(productMap), period, source:"downloadSummary", resetAtMs, resetAt:(reset && reset.resetAt) || "", loadedAt:new Date().toLocaleString("tr-TR") };
  }
  async function loadBackupFallback(period, db){
    const snap = await db.collection(collName("backups")).get();
    const latest = new Map();
    snap.forEach(doc => {
      try {
        const d = doc.data() || {};
        let payload = d.payload || null;
        if (!payload && d.payloadText) payload = JSON.parse(d.payloadText);
        if (!payload || !Array.isArray(payload.records) || !payload.records.length) return;
        const key = d.userKey || userKeyFrom({ name:d.name || (payload.user && payload.user.name), seflik:d.seflik || (payload.user && payload.user.seflik) }) || doc.id;
        const ms = Number(d.createdAtMs || d.updatedAtMs || 0) || Date.parse(d.createdAtIso || d.updatedAt || "") || 0;
        const old = latest.get(key);
        if (!old || ms >= old.ms) latest.set(key, { ms, payload });
      } catch {}
    });
    const records = [];
    latest.forEach(item => records.push(...(item.payload.records || [])));
    const s = summarizeRecords(records, period);
    return { users:latest.size, recordCount:s.recordCount, adet:s.adet, m3:s.m3, trees:s.trees, products:s.products, period, source:"backupFallback", resetAtMs:0, resetAt:"", loadedAt:new Date().toLocaleString("tr-TR") };
  }
  async function loadStats(period){
    const p = period === "today" || period === "week" ? period : "all";
    const { db } = await ensureFirebaseReady();
    const reset = await readResetMarker(db);
    const exportStats = await loadExportStats(p, db, reset);
    // Sıfırlama yapıldıysa eski yedeklerden hiçbir şekilde geri dolma olmasın.
    if (reset.resetAtMs) return exportStats;
    if (!exportStats.recordCount && !exportStats.trees.length && !exportStats.products.length) return await loadBackupFallback(p, db);
    return exportStats;
  }
  function rows(list){
    if (!list || !list.length) return `<div class="admin-stats-empty-v132">Veri bulunamadı.</div>`;
    return list.map(row => `<div class="admin-stat-row-v132"><div class="admin-stat-name-v132">${esc(row.name)}</div><div class="admin-stat-val-v132">${intText(row.adet)} adet</div><div class="admin-stat-val-v132">${m3Text(row.m3)}</div></div>`).join("");
  }
  function panel(){
    let p = document.getElementById("adminStatsPanelV132");
    if (!p) {
      const summary = document.querySelector(".admin-summary-grid-clean") || document.querySelector(".admin-panel-top-clean");
      if (summary) {
        p = document.createElement("div");
        p.id = "adminStatsPanelV132";
        p.className = "admin-stats-panel-v132";
        summary.insertAdjacentElement("afterend", p);
      }
    }
    return p;
  }
  function renderStats(stats, message){
    const p = panel();
    if (!p) return;
    if (message) { p.innerHTML = `<div class="admin-stats-empty-v132">${esc(message)}</div>`; return; }
    const topTree = (stats.trees || [])[0] || { name:"-", adet:0, m3:0 };
    const topProduct = (stats.products || [])[0] || { name:"-", adet:0, m3:0 };
    const period = stats.period || window.adminStatsPeriodV134 || "all";
    const sourceText = stats.source === "downloadSummary" ? "Mesaha dosyası indirme özetleri" : "Firebase yedekleri";
    const resetNote = stats.resetAtMs ? `<div class="admin-stats-reset-note-v138">İstatistik ${esc(stats.resetAt || "yakın zamanda")} tarihinde sıfırlandı. Bu ekranda sadece sıfırlamadan sonra Mesaha Dosyasını İndir ile gelen yeni özetler sayılır.</div>` : "";
    p.innerHTML = `
      <div class="admin-stats-head-v132">
        <div>
          <b>Toplu İstatistik</b>
          <span>Dönem: ${esc(periodLabel(period))} • Kaynak: ${esc(sourceText)} • Son yenileme: ${esc(stats.loadedAt || "-")}</span>
          <div class="admin-stats-period-v134">
            <button type="button" class="${period === "today" ? "active" : ""}" onclick="adminSetStatsPeriodV134('today')">Bugün</button>
            <button type="button" class="${period === "week" ? "active" : ""}" onclick="adminSetStatsPeriodV134('week')">Bu Hafta</button>
            <button type="button" class="${period === "all" ? "active" : ""}" onclick="adminSetStatsPeriodV134('all')">Tüm Zamanlar</button>
          </div>
          <div class="admin-stats-note-v134">Kullanıcı Mesaha Dosyasını İndir dediğinde özet veri gönderilir; internet yoksa bağlantı gelince otomatik aktarılır.</div>
          ${resetNote}
        </div>
        <div class="admin-stats-actions-v138">
          <button type="button" class="secondary" onclick="adminRefreshStatsV132()">Yenile</button>
          <button type="button" class="danger" onclick="adminResetStatsV138()">İstatistiği Sıfırla</button>
        </div>
      </div>
      <div class="admin-stats-cards-v132">
        <div class="admin-stat-top-card-v132"><span>En fazla ağaç türü</span><b>${esc(topTree.name)}</b><small>${intText(topTree.adet)} adet • ${m3Text(topTree.m3)}</small></div>
        <div class="admin-stat-top-card-v132"><span>En fazla odun türü</span><b>${esc(topProduct.name)}</b><small>${intText(topProduct.adet)} adet • ${m3Text(topProduct.m3)}</small></div>
        <div class="admin-stat-top-card-v132"><span>Kapsam</span><b>${intText(stats.users)} kullanıcı</b><small>${intText(stats.recordCount)} kayıt</small></div>
        <div class="admin-stat-top-card-v132"><span>Toplam</span><b>${intText(stats.adet)} adet</b><small>${m3Text(stats.m3)}</small></div>
      </div>
      <div class="admin-stats-columns-v132">
        <div class="admin-stats-section-v132"><h4>Ağaç türleri</h4>${rows(stats.trees)}</div>
        <div class="admin-stats-section-v132"><h4>Odun türleri</h4>${rows(stats.products)}</div>
      </div>`;
  }
  async function loadAndRender(force){
    window.adminStatsPeriodV134 = window.adminStatsPeriodV134 || "all";
    const p = panel();
    const btn = document.getElementById("adminStatsBtnV132");
    if (p) p.classList.add("open");
    if (btn) btn.classList.add("active");
    const period = window.adminStatsPeriodV134;
    const cacheKey = `adminStatsV138_${period}`;
    if (!force && window.__mesahaStatsCacheV138 && window.__mesahaStatsCacheV138[cacheKey]) return renderStats(window.__mesahaStatsCacheV138[cacheKey]);
    try { if (typeof setCloudLoading === "function") setCloudLoading(true, "İstatistikler hazırlanıyor..."); } catch {}
    renderStats(null, "İstatistikler hazırlanıyor...");
    try {
      window.__mesahaStatsCacheV138 = window.__mesahaStatsCacheV138 || {};
      window.__mesahaStatsCacheV138[cacheKey] = await loadStats(period);
      renderStats(window.__mesahaStatsCacheV138[cacheKey]);
    } catch (err) {
      console.warn("v138 stats error", err);
      renderStats(null, "İstatistikler alınamadı. İnternet, Firebase bağlantısı veya Firestore Rules alanını kontrol et.");
      toast("İstatistik alınamadı.");
    } finally { try { if (typeof setCloudLoading === "function") setCloudLoading(false); } catch {} }
  }
  async function deleteUsageDocs(db){
    const coll = collName("usage");
    let deleted = 0;
    // Query snapshot değişken gelebileceği için birkaç tur temizle. Marker hariç tüm usageStats temizlenir.
    for (let round = 0; round < 30; round++) {
      const snap = await db.collection(coll).limit(400).get();
      const docs = [];
      snap.forEach(doc => { if (doc.id !== STATS_RESET_DOC_V138) docs.push(doc); });
      if (!docs.length) break;
      const batch = db.batch();
      docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      deleted += docs.length;
      if (docs.length < 400) break;
    }
    return deleted;
  }
  function clearLocalOldQueues(resetAtMs){
    try {
      const arr = JSON.parse(localStorage.getItem(EXPORT_QUEUE_KEY_V138) || "[]");
      const next = Array.isArray(arr) ? arr.filter(item => {
        const p = item && (item.payload || item);
        const ms = generatedMs(p || {});
        return ms && ms > resetAtMs;
      }) : [];
      localStorage.setItem(EXPORT_QUEUE_KEY_V138, JSON.stringify(next));
    } catch {}
    try { localStorage.setItem("mesaha_stats_reset_at_v138", String(resetAtMs)); } catch {}
  }
  window.adminResetStatsV138 = async function(){
    if (!confirm("İstatistik ekranındaki deneme verileri sıfırlansın mı? Normal kayıtlar, yedekler, kullanıcılar ve sorun bildirimleri silinmez.")) return;
    const word = prompt("Devam etmek için SIFIRLA yaz:");
    if (word !== "SIFIRLA") { toast("İşlem iptal edildi."); return; }
    try { if (typeof setCloudLoading === "function") setCloudLoading(true, "İstatistikler sıfırlanıyor..."); } catch {}
    try {
      const { db } = await ensureFirebaseReady();
      const deleted = await deleteUsageDocs(db);
      const nowMs = Date.now();
      const nowText = (typeof firebaseDateText === "function") ? firebaseDateText() : new Date().toLocaleString("tr-TR");
      await db.collection(collName("usage")).doc(STATS_RESET_DOC_V138).set({
        type:"statsResetMarker",
        resetAt:nowText,
        resetAtMs:nowMs,
        appVersion:BUILD_VERSION_V138,
        fileVersion:FILE_VERSION_V138,
        deletedDocs:deleted,
        updatedAt:nowText,
        updatedAtMs:nowMs
      }, { merge:false });
      clearLocalOldQueues(nowMs);
      try { window.__mesahaStatsCacheV138 = {}; } catch {}
      try { Object.keys(window.state || {}).filter(k => /^adminStatsV13/.test(k)).forEach(k => delete window.state[k]); } catch {}
      toast(`İstatistik sıfırlandı. ${intText(deleted)} eski özet temizlendi.`);
      await loadAndRender(true);
    } catch (err) {
      console.warn("v138 reset error", err);
      toast("İstatistik sıfırlanamadı. İnternet/Firebase bağlantısını kontrol et.");
    } finally { try { if (typeof setCloudLoading === "function") setCloudLoading(false); } catch {} }
  };
  // Eski buton çağrıları da yeni kesin düzeltmeye gelsin.
  window.adminResetStatsV136 = window.adminResetStatsV138;
  window.adminSetStatsPeriodV134 = function(period){ window.adminStatsPeriodV134 = (period === "today" || period === "week") ? period : "all"; return loadAndRender(true); };
  window.adminRefreshStatsV132 = function(){ return loadAndRender(true); };
  window.adminToggleStatsV132 = function(){
    const p = panel();
    const btn = document.getElementById("adminStatsBtnV132");
    if (!p) return;
    const willOpen = !p.classList.contains("open");
    p.classList.toggle("open", willOpen);
    if (btn) btn.classList.toggle("active", willOpen);
    if (willOpen) loadAndRender(false);
  };
  try {
    const style = document.createElement("style");
    style.id = "mesaha-v138-stats-reset-css";
    style.textContent = `
      .admin-stats-actions-v138{display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap;justify-content:flex-end;}
      .admin-stats-actions-v138 .danger{border:0;border-radius:14px;padding:10px 12px;font-weight:900;background:#dc2626;color:#fff;}
      .admin-stats-reset-note-v138{margin-top:8px;font-size:12px;line-height:1.35;color:#b45309;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:8px 10px;}
      body.theme-dark .admin-stats-reset-note-v138{color:#fdba74;background:rgba(251,146,60,.10);border-color:rgba(251,146,60,.28);}
      @media(max-width:720px){.admin-stats-actions-v138{width:100%;justify-content:stretch}.admin-stats-actions-v138 button{flex:1}}
    `;
    document.head.appendChild(style);
  } catch {}
  const prevDeviceInfo = typeof currentDeviceInfoPayload === "function" ? currentDeviceInfoPayload : null;
  try {
    currentDeviceInfoPayload = function(){
      const info = prevDeviceInfo ? prevDeviceInfo() : {};
      info.appVersion = BUILD_VERSION_V138;
      info.fileVersion = FILE_VERSION_V138;
      info.statsResetFix = true;
      info.updatedMs = Date.now();
      return info;
    };
  } catch {}
  window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO || {}, {
    fileVersion: FILE_VERSION_V138,
    visibleVersion: BUILD_VERSION_V138,
    statsResetFix: true,
    stableBuild: true
  });
  try { document.title = "Mesaha App v138"; const h1 = document.querySelector(".brand h1"); if (h1) h1.textContent = BUILD_VERSION_V138; } catch {}
})();


;
