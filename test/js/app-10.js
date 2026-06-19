/* Mesaha İO v169 Modüler Stabil - app-10.js */
(function(){
  "use strict";
  const VERSION_TEXT = "Mesaha İO v1.98";
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
    try { document.title = "Mesaha İO v1.98"; } catch {}
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
