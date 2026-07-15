(function () {
  "use strict";
  const read = (k, f) => {
    try {
      const x = JSON.parse(localStorage.getItem(k) || "null");
      return x == null ? f : x;
    } catch {
      return f;
    }
  };
  const write = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch {
      return false;
    }
  };
  const clean = (v) => String(v == null ? "" : v).trim();
  function valid() {
    const s =
        read("mesaha_supabase_v500_session", {}) ||
        read("mesaha_supabase_v569_session_backup", {}),
      a = read("mesaha_google_access_v548", {}),
      t =
        read("mesaha_terminal_local_mode_v556", null) ||
        read("mesaha_terminal_local_mode_v557", {});
    return !!(s.access_token || a.status === "approved" || (t && t.active));
  }
  function css() {
    if (document.getElementById("suiteIstifCssV10")) return;
    const s = document.createElement("style");
    s.id = "suiteIstifCssV10";
    s.textContent = `#bootOverlay,.boot-overlay,[data-action="refresh-shared"],[data-action="connect-drive"],[data-action="disconnect-drive"],[data-action="sync"],.drive-card,.drive-security,.foresters-card,[data-action="pick-ormanci"]{display:none!important}.suite-istif-note-v10{margin:10px 0;padding:11px 13px;border-radius:13px;background:#edf7f0;color:#28543d;font:700 12px/1.45 system-ui}.suite-istif-toast-v10{position:fixed;left:50%;bottom:100px;transform:translateX(-50%);z-index:2147483600;max-width:calc(100vw - 28px);padding:10px 13px;border-radius:13px;background:#174a32;color:#fff;font:750 12px/1.35 system-ui;box-shadow:0 12px 30px #0003}.suite-istif-toast-v10.bad{background:#8e2d2d}.suite-create-division-v10{width:100%;min-height:46px;margin:8px 0 2px;border:1px solid #d6a21d;border-radius:14px;background:#fff4cf;color:#6d4b00;font:900 13px/1 system-ui;display:flex;align-items:center;justify-content:center;gap:7px}.suite-create-division-v10:active{transform:scale(.985)}`;
    document.head.appendChild(s);
  }
  const fold = (v) => clean(v).toLocaleLowerCase("tr-TR").replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ı/g,"i").replace(/ö/g,"o").replace(/ş/g,"s").replace(/ü/g,"u").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
  function notify(message,bad){let el=document.getElementById("suiteIstifToastV10");if(!el){el=document.createElement("div");el.id="suiteIstifToastV10";document.body.appendChild(el);}el.className="suite-istif-toast-v10"+(bad?" bad":"");el.textContent=message;el.hidden=false;clearTimeout(notify.t);notify.t=setTimeout(()=>{el.hidden=true;},3200);}
  function currentBolmeSelect(){return document.querySelector('#stackForm select[name="bolme"]');}
  function selectBolme(no){const sel=currentBolmeSelect();if(!sel)return;let opt=Array.from(sel.options).find((x)=>fold(x.value)===fold(no));if(!opt){opt=document.createElement("option");opt.value=no;opt.textContent=no;sel.insertBefore(opt,sel.querySelector('option[value="__suite_create_division__"]')||null);}sel.value=opt.value;sel.__suiteLastRealValue=opt.value;sel.dispatchEvent(new Event("input",{bubbles:true}));sel.dispatchEvent(new Event("change",{bubbles:true}));}
  async function createDivisionFromIstif(){
    const api=window.MesahaSuiteSyncV24||window.MesahaSuiteSyncV22||window.MesahaSuiteSyncV21||window.MesahaSuiteSyncV19||window.MesahaSuiteSyncV18||window.MesahaSuiteSyncV17||window.MesahaSuiteSyncV14||window.MesahaSuiteSyncV13||window.MesahaSuiteSyncV12||window.MesahaSuiteSyncV11||window.MesahaSuiteSyncV10||window.MesahaSuiteSyncV9||window.MesahaSuiteSyncV8;
    if(!api||typeof api.createOfflineDivision!=="function")return notify("Orman İO bölme sistemi hazır değil.",true);
    const no=clean(prompt("Yeni bölme numarasını yazın:"));if(!no)return;
    const loc=clean(prompt("Mevki / açıklama (isteğe bağlı):")||"");
    try{const out=api.createOfflineDivision(no,loc,{source:"istif-new"});patchBolmeSelector();selectBolme(out.division.bolme_no||no);notify(out.created?`Bölme ${no} offline oluşturuldu.`:`Bölme ${no} zaten vardı; aynı bölme seçildi.`);}
    catch(e){notify(clean(e&&e.message||e),true);}
  }
  function ensureCreateDivisionButton(){
    const sel=currentBolmeSelect();if(!sel)return;
    const row=sel.closest(".field-row")||sel.parentElement;
    if(!row||document.getElementById("suiteCreateDivisionBtnV10"))return;
    const btn=document.createElement("button");
    btn.id="suiteCreateDivisionBtnV10";
    btn.className="suite-create-division-v10";
    btn.type="button";
    btn.innerHTML='<span aria-hidden="true">＋</span> Offline Bölme Oluştur';
    btn.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();createDivisionFromIstif();});
    row.insertAdjacentElement("afterend",btn);
  }
  function patchBolmeSelector(){
    const sel=currentBolmeSelect();if(!sel)return;
    ensureCreateDivisionButton();
    let add=sel.querySelector('option[value="__suite_create_division__"]');
    if(!add){
      const selected=sel.value;
      add=document.createElement("option");
      add.value="__suite_create_division__";
      add.textContent="＋ Yeni bölme oluştur";
      sel.appendChild(add);
      if(selected) sel.value=selected;
    }
    if(sel.value&&sel.value!=="__suite_create_division__") sel.__suiteLastRealValue=sel.value;
    if(!sel.__suiteCreateBoundV10){
      sel.__suiteCreateBoundV10=true;
      sel.addEventListener("change",(e)=>{
        if(sel.value!=="__suite_create_division__"){
          sel.__suiteLastRealValue=sel.value;
          return;
        }
        e.preventDefault();
        e.stopImmediatePropagation();
        const fallback=sel.__suiteLastRealValue||Array.from(sel.options).find((x)=>x.value&&x.value!=="__suite_create_division__")?.value||"";
        sel.value=fallback;
        createDivisionFromIstif();
      },true);
    }
  }

  function syncLocal() {
    const f = read("mesaha_active_seflik_folder_v564", {}),
      p = read("mesaha_panel_user_v316", {}),
      s = read("cam_mesaha_ayarlar_v1", {});
    if (f && f.seflik) {
      p.seflik = f.seflik;
      p.activeSeflik = f.seflik;
      s.seflik = f.seflik;
      write("mesaha_panel_user_v316", p);
      write("cam_mesaha_ayarlar_v1", s);
    }
  }
  function hideForesterUi() {
    document.querySelectorAll(".foresters-card,[data-action='pick-ormanci']").forEach((el)=>el.remove());
    document.querySelectorAll(".field-row").forEach((row)=>{
      const control=row.querySelector("[name='ormanci']");
      const label=clean(row.querySelector("label")?.textContent).toLocaleLowerCase("tr-TR");
      if(control||label==="ormancı"||label==="ormanci") row.remove();
    });
    document.querySelectorAll(".shared-current").forEach((row)=>{
      const label=clean(row.querySelector("span")?.textContent).toLocaleLowerCase("tr-TR");
      if(label==="ormancılar"||label==="ormancilar"||label==="ormancı"||label==="ormanci") row.remove();
    });
  }
  function hide() {
    hideForesterUi();
    document
      .querySelectorAll(
        '[data-action="refresh-shared"],[data-action="connect-drive"],[data-action="disconnect-drive"],[data-action="sync"],.drive-card,.drive-security',
      )
      .forEach((x) => (x.style.display = "none"));
    document.querySelectorAll("button,a").forEach((el) => {
      if (el.id === "suiteCreateDivisionBtnV10") return;
      const t = clean(el.textContent).toLocaleLowerCase("tr-TR");
      if (
        /şeflik oluştur|şeflik sil|ormancı ekle|ormancı çıkar|bölme sil|drive bağla|bağlantıyı kaldır|şeflikleri yenile/.test(
          t,
        )
      )
        el.style.display = "none";
    });
    const settings = document.querySelector(".settings-form,.settings-card");
    if (settings && !document.getElementById("suiteIstifNoteV8")) {
      const n = document.createElement("div");
      n.id = "suiteIstifNoteV8";
      n.className = "suite-istif-note-v10";
      n.textContent =
        "Şeflik, personel, bölme, Drive, yedek ve senkronizasyon işlemleri Orman İO ana menüsünden yönetilir. İstif İO içinde yalnızca Orman İO’dan gelen şeflik ve bölme seçenekleri kullanılır; kullanıcı kimliği otomatik uygulanır.";
      settings.insertBefore(n, settings.firstChild);
    }
  }
  let timer = 0, applying = false;
  function schedule() {
    if (applying) return;
    applying = true;
    try { patchBolmeSelector(); } finally { applying = false; }
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (applying) return;
      applying = true;
      try {
        syncLocal();
        hide();
        hideForesterUi();
        patchBolmeSelector();
        ensureCreateDivisionButton();
        const api = window.MesahaSuiteSyncV24 || window.MesahaSuiteSyncV22 || window.MesahaSuiteSyncV21 || window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8;
        if (api) api.updateButton();
      } finally { applying = false; }
    }, 60);
  }
  function block(e) {
    const t =
      e.target.closest &&
      e.target.closest(
        '[data-action="refresh-shared"],[data-action="connect-drive"],[data-action="disconnect-drive"],[data-action="sync"]',
      );
    if (!t) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (t.matches('[data-action="sync"]'))
      (window.MesahaSuiteSyncV24 || window.MesahaSuiteSyncV22 || window.MesahaSuiteSyncV21 || window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8) &&
        (window.MesahaSuiteSyncV24 || window.MesahaSuiteSyncV22 || window.MesahaSuiteSyncV21 || window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8).syncAll({ source: "istif" });
    else location.href = "../";
  }
  if (!valid()) {
    location.replace("../");
    return;
  }
  window.MESAHA_SUITE_MODE = true;
  document.documentElement.dataset.suiteSubapp = "istif";
  css();
  syncLocal();
  const boot = () => {
    document.body.dataset.suiteSubapp = "istif";
    (window.MesahaSuiteSyncV24 || window.MesahaSuiteSyncV22 || window.MesahaSuiteSyncV21 || window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8) &&
      (window.MesahaSuiteSyncV24 || window.MesahaSuiteSyncV22 || window.MesahaSuiteSyncV21 || window.MesahaSuiteSyncV20 || window.MesahaSuiteSyncV19 || window.MesahaSuiteSyncV18 || window.MesahaSuiteSyncV17 || window.MesahaSuiteSyncV14 || window.MesahaSuiteSyncV13 || window.MesahaSuiteSyncV12 || window.MesahaSuiteSyncV11 || window.MesahaSuiteSyncV10 || window.MesahaSuiteSyncV9 || window.MesahaSuiteSyncV8).registerHomeButton(() => {
        location.href = "../";
      });
    schedule();
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  document.addEventListener("click", block, true);
  window.addEventListener("storage", schedule);
  window.addEventListener("mesaha-suite:shared-data-updated", schedule);
  window.addEventListener("mesaha-suite:sync-complete", schedule);
  const mo = new MutationObserver(() => { if (!applying) schedule(); });
  function observeAppV10() {
    try {
      mo.disconnect();
      mo.observe(document.getElementById("app") || document.body, {
        childList: true,
        subtree: true,
      });
    } catch (_) {}
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", observeAppV10, { once: true });
  else observeAppV10();
  document.addEventListener("click", (e) => {
    if (e.target && e.target.closest && e.target.closest('[data-view="new"]'))
      setTimeout(schedule, 0);
  }, true);
  setTimeout(schedule, 350);
  setTimeout(schedule, 1200);
})();
