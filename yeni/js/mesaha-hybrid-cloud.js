/* Mesaha İO V501 — Hibrit bulut yedekleme
   Buluta Yedekle: önce güvenli Supabase V2, sonra Google Drive köprüsü.
   Buluttan Getir: Supabase ve Drive yedeklerini birlikte listeler.
   Kalıcı silme yoktur. ORBİS/XLS/hacim tarafına dokunmaz. */
(function(){
  'use strict';
  if(window.__mesahaHybridCloudV501) return;
  window.__mesahaHybridCloudV501 = true;

  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzOYh2MyOQmwVQh-7Jm9KyjaFjmjSwgHZSw7XKAVzDS1ibmcM5bQZVYdn-NyesI-ph7/exec';
  var SECRET = 'MESAHAYEDEK_2026_YAKUP_43';
  var STORAGE_KEY = 'cam_mesaha_kayitlari_v1';
  var SETTINGS_KEY = 'cam_mesaha_ayarlar_v1';
  var PANEL_USER_KEY = 'mesaha_panel_user_v316';
  var SLOT_KEY = 'mesaha_supabase_backup_slot_index_v501';
  var DRIVE_CONFIG_KEY = 'mesaha_drive_bridge_url_v463';
  var CHUNK_SIZE = 180;

  function $(id){ return document.getElementById(id); }
  function clean(v){ return String(v == null ? '' : v).trim(); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g,function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }
  function fold(s){ return clean(s).toLocaleLowerCase('tr-TR').replace(/[ç]/g,'c').replace(/[ğ]/g,'g').replace(/[ı]/g,'i').replace(/[ö]/g,'o').replace(/[ş]/g,'s').replace(/[ü]/g,'u'); }
  function userKey(name,seflik){ return (fold(name)+'__'+fold(seflik)).replace(/[^a-z0-9_-]+/g,'_').slice(0,120) || 'bos'; }
  function jsonGet(k,f){ try{ var v=localStorage.getItem(k); return v ? JSON.parse(v) : f; }catch(e){ return f; } }
  function jsonSet(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }
  function records(){ var r=jsonGet(STORAGE_KEY, []); return Array.isArray(r) ? r : []; }
  function settings(){ return Object.assign({ekipNot:'',seflik:'',bolmeNo:''}, jsonGet(SETTINGS_KEY, {})); }
  function readUser(){ var u=jsonGet(PANEL_USER_KEY, {}), st=settings(); return {name:clean(u.name||st.ekipNot), seflik:clean(u.seflik||st.seflik), bolmeNo:clean(u.bolmeNo||st.bolmeNo)}; }
  function versionText(){ return (window.MESAHA_VERSION&&window.MESAHA_VERSION.visibleVersion) || window.APP_VERSION || 'Mesaha İO'; }
  function versionRaw(){ return (window.MESAHA_VERSION&&window.MESAHA_VERSION.version) || window.FILE_VERSION || 'local'; }
  function toast(t,s,k){ try{ if(typeof window.mesahaFloatToastV315==='function') return window.mesahaFloatToastV315(t,s||'',k||'success'); }catch(e){} try{ if(typeof window.toast==='function') return window.toast(t,s||'',k||'success'); }catch(e){} try{ alert(t+(s?'\n'+s:'')); }catch(e){} }
  function errText(e){ var m=String(e&&e.message?e.message:e||'Hata'); if(/Failed to fetch|Network|Load failed|internet|offline/i.test(m)) return 'İnternet bağlantısını kontrol et.'; if(/permission|rls|policy|yetkisiz|403|401/i.test(m)) return 'Yetki/RLS kontrolü gerekli.'; if(/payload|column_size|too large|413/i.test(m)) return 'Yedek boyutu fazla; parça sistemi kontrol edilmeli.'; return m.slice(0,180); }
  function volume(r){ var d=Number(String(r.diameter||r.cap||0).replace(',','.')); var l=Number(String(r.length||r.boy||0).replace(',','.')); var q=Number(r.quantity||r.adet||1); if(!d||!l) return 0; return Math.PI*Math.pow(d/100,2)/4*l*q; }
  function totalM3(list){ return (list||[]).reduce(function(a,r){ return a+volume(r); },0); }
  function trText(){ try{ return new Date().toLocaleString('tr-TR'); }catch(e){ return new Date().toISOString(); } }
  function driveUrl(){ try{ return clean(localStorage.getItem(DRIVE_CONFIG_KEY)||SCRIPT_URL); }catch(e){ return SCRIPT_URL; } }
  function setBusy(on, text){
    try{ document.body.classList.toggle('mesaha-hybrid-busy-v501', !!on); }catch(e){}
    var b=$('cloudBackupBtnV316'); if(b){ if(on){ b.__oldTextV501=b.textContent; b.disabled=true; b.textContent=text||'Buluta yükleniyor…'; } else { b.disabled=false; b.textContent=b.__oldTextV501||'Buluta Yedekle'; } }
  }
  function requireUser(){
    var user=readUser();
    if(!user.name || !user.seflik){
      toast('Önce kullanıcı girişi yap.','Kullanıcı adı ve şeflik gerekli.','warning');
      try{ if(window.mesahaPanelV316 && window.mesahaPanelV316.open) window.mesahaPanelV316.open(); }catch(e){}
      throw new Error('Kullanıcı bilgisi eksik');
    }
    return user;
  }
  function backupPayload(user,list){
    return {type:'mesaha-cloud-backup-v501', exportedAt:new Date().toISOString(), createdAt:trText(), createdAtMs:Date.now(), version:versionRaw(), visibleVersion:versionText(), user:user, settings:settings(), records:list};
  }
  function nextSlot(){
    var n=0;
    try{ n=Number(localStorage.getItem(SLOT_KEY)||0)||0; localStorage.setItem(SLOT_KEY, String((n+1)%5)); }catch(e){}
    return 'slot_'+(n%5);
  }

  async function supabaseReady(){
    if(!window.mesahaSupabaseV380 || typeof window.mesahaSupabaseV380.ready !== 'function') throw new Error('Supabase bağlantı motoru hazır değil');
    return await window.mesahaSupabaseV380.ready();
  }
  async function saveSupabaseSlot(slot,user,list,payload){
    var r=await supabaseReady();
    var db=r.db;
    var chunkCount=Math.max(1, Math.ceil(list.length/CHUNK_SIZE));
    var meta={
      id:slot,
      slotId:slot,
      userKey:userKey(user.name,user.seflik),
      name:user.name,
      seflik:user.seflik,
      bolmeNo:user.bolmeNo,
      fileName:'Mesaha_Bulut_Yedek_'+slot+'_'+Date.now().toString(36)+'.json',
      payload:Object.assign({}, payload, {records:[]}),
      recordsChunked:true,
      chunkCount:chunkCount,
      recordCount:list.length,
      count:list.length,
      totalVolume:totalM3(list),
      m3:totalM3(list),
      createdAt:trText(),
      createdAtMs:Date.now(),
      source:'supabase-v2+drive-v501',
      fileVersion:versionRaw(),
      appVersion:versionText(),
      archived:false
    };
    await db.collection('backups').doc(slot).set(meta,{merge:false});
    var ref=db.collection('backups').doc(slot).collection('chunks');
    for(var i=0;i<chunkCount;i++){
      await ref.doc(String(i)).set({index:i,chunkIndex:i,records:list.slice(i*CHUNK_SIZE,(i+1)*CHUNK_SIZE),updatedAt:trText(),updatedAtMs:Date.now()},{merge:false});
    }
    return {source:'supabase', slotId:slot, chunkCount:chunkCount, count:list.length};
  }
  async function backupSupabase(user,list,payload){
    var slot=nextSlot();
    var latest=await saveSupabaseSlot('latest',user,list,payload);
    var ring=null;
    try{ ring=await saveSupabaseSlot(slot,user,list,payload); }catch(e){ ring={error:errText(e), slotId:slot}; }
    return {latest:latest, slot:ring};
  }
  async function listSupabase(){
    var r=await supabaseReady();
    var snap=await r.db.collection('backups').get();
    var arr=[];
    snap.forEach(function(doc){
      var d=doc.data()||{};
      arr.push({
        source:'supabase',
        id:doc.id,
        slotId:d.slotId||doc.id,
        name:d.fileName || ('Supabase yedeği '+doc.id),
        createdAt:d.createdAt || '',
        createdAtMs:Number(d.createdAtMs||d.updatedAtMs||0)||0,
        count:Number(d.recordCount||d.count||0)||0,
        totalVolume:Number(d.totalVolume||d.m3||0)||0,
        chunkCount:Number(d.chunkCount||1)||1,
        raw:d
      });
    });
    arr.sort(function(a,b){ return (b.createdAtMs||0)-(a.createdAtMs||0); });
    return arr;
  }
  async function readSupabase(slotId){
    var r=await supabaseReady();
    var db=r.db;
    var doc=await db.collection('backups').doc(slotId||'latest').get();
    if(!doc.exists) throw new Error('Supabase yedeği bulunamadı');
    var d=doc.data()||{};
    var recs=[];
    if(d.recordsChunked){
      var cs=await db.collection('backups').doc(slotId||'latest').collection('chunks').get();
      var chunks=[];
      cs.forEach(function(c){ var cd=c.data()||{}; chunks.push({index:Number(cd.index||0),records:Array.isArray(cd.records)?cd.records:[]}); });
      chunks.sort(function(a,b){ return a.index-b.index; });
      var max=Number(d.chunkCount||chunks.length)||chunks.length;
      recs=chunks.filter(function(x){ return x.index<max; }).flatMap(function(x){ return x.records; });
    } else {
      recs=(d.payload&&Array.isArray(d.payload.records))?d.payload.records:[];
    }
    var payload=d.payload||{};
    payload.records=recs;
    return payload;
  }

  async function drivePost(action,data){
    var body=Object.assign({secret:SECRET,action:action},data||{});
    var res=await fetch(driveUrl(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),redirect:'follow',cache:'no-store'});
    var txt=await res.text(); var json=null;
    try{ json=txt?JSON.parse(txt):{}; }catch(e){ throw new Error('Drive köprü cevabı okunamadı'); }
    if(!res.ok || !json.ok) throw new Error((json&&json.error)||('Drive hata '+res.status));
    return json;
  }
  async function backupDrive(user,list,payload){
    var key=userKey(user.name,user.seflik);
    return await drivePost('backup',{userKey:key,username:user.name,seflik:user.seflik,bolme:user.bolmeNo,count:list.length,totalVolume:totalM3(list),version:versionText(),payload:payload});
  }
  async function listDrive(){
    var user=requireUser();
    var out=await drivePost('list',{userKey:userKey(user.name,user.seflik)});
    return (out.items||[]).map(function(b){
      return {source:'drive', id:b.id, name:b.name||'Drive yedeği', createdAt:b.createdAt||'', createdAtMs:Date.parse(b.createdAt||'')||0, count:Number(b.count||0)||0, totalVolume:Number(b.totalVolume||0)||0, raw:b};
    }).sort(function(a,b){ return (b.createdAtMs||0)-(a.createdAtMs||0); });
  }
  async function readDrive(fileId){
    var user=requireUser();
    var res=await fetch(driveUrl(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({secret:SECRET,action:'read',userKey:userKey(user.name,user.seflik),fileId:fileId}),redirect:'follow',cache:'no-store'});
    var txt=await res.text(); var json=null;
    try{ json=JSON.parse(txt); }catch(e){ throw new Error('Drive yedeği okunamadı'); }
    if(json&&json.ok===false) throw new Error(json.error||'Drive yedeği okunamadı');
    var payload=json.payload || json;
    if(payload.payload) payload=payload.payload;
    return payload;
  }

  async function hybridBackup(){
    var user=requireUser();
    var list=records();
    var payload=backupPayload(user,list);
    setBusy(true,'Buluta yükleniyor…');
    var ok=[], fail=[];
    try{
      try{ await backupSupabase(user,list,payload); ok.push('Supabase'); }catch(e){ fail.push('Supabase: '+errText(e)); }
      try{ await backupDrive(user,list,payload); ok.push('Drive'); }catch(e){ fail.push('Drive: '+errText(e)); }
      if(ok.length===2) toast('Buluta yedeklendi.','Supabase ve Google Drive tamam.','success');
      else if(ok.length===1) toast('Yedek kısmen alındı.',ok[0]+' tamam • '+fail.join(' • '),'warning');
      else throw new Error(fail.join(' • ')||'Yedek alınamadı');
      try{ localStorage.setItem('mesaha_last_hybrid_backup_v501', JSON.stringify({at:new Date().toISOString(),ok:ok,fail:fail,count:list.length})); }catch(e){}
      return {ok:ok,fail:fail};
    } finally { setBusy(false); }
  }

  async function combinedList(){
    requireUser();
    var sup=[], drv=[], errors=[];
    try{ sup=await listSupabase(); }catch(e){ errors.push('Supabase: '+errText(e)); }
    try{ drv=await listDrive(); }catch(e){ errors.push('Drive: '+errText(e)); }
    var arr=sup.concat(drv);
    arr.sort(function(a,b){ return (b.createdAtMs||0)-(a.createdAtMs||0); });
    return {items:arr, errors:errors};
  }
  function sourceLabel(s){ return s==='drive'?'Google Drive':'Supabase'; }
  function sourceClass(s){ return s==='drive'?'green':'blue'; }
  async function openCloud(){
    var ov=$('cloudRestoreOverlayV316'), box=$('cloudRestoreListV316'), info=$('cloudRestoreInfoV316');
    if(ov) ov.classList.remove('hidden');
    if(info) info.textContent='Bulut yedekleri hazırlanıyor…';
    if(box) box.innerHTML='<div class="cloud-item-v316">Supabase ve Drive yedekleri yükleniyor…</div>';
    try{
      var data=await combinedList(), arr=data.items||[];
      if(info) info.textContent=arr.length+' yedek bulundu'+(data.errors&&data.errors.length?' • '+data.errors.join(' • '):'');
      if(!arr.length){ if(box) box.innerHTML='<div class="cloud-item-v316">Bulutta bu kullanıcıya ait yedek bulunamadı.</div>'; return; }
      if(box) box.innerHTML=arr.slice(0,80).map(function(b){
        return '<div class="cloud-item-v316 cloud-item-v501"><div><span class="pill '+sourceClass(b.source)+'">'+sourceLabel(b.source)+'</span><b>'+esc(b.name||'Mesaha yedeği')+'</b><small>'+esc(b.createdAt||'-')+' • '+Number(b.count||0).toLocaleString('tr-TR')+' kayıt • '+Number(b.totalVolume||0).toLocaleString('tr-TR',{minimumFractionDigits:3,maximumFractionDigits:3})+' m³</small></div><button class="btn primary" data-hybrid-source-v501="'+esc(b.source)+'" data-hybrid-id-v501="'+esc(b.id)+'" type="button">Bu Yedeği Yükle</button></div>';
      }).join('');
    }catch(e){ if(info) info.textContent='Yedekler alınamadı'; if(box) box.innerHTML='<div class="cloud-item-v316">'+esc(errText(e))+'</div>'; }
  }
  async function restore(source,id){
    if(!id) return;
    if(!confirm('Bu bulut yedeği mevcut kayıtların yerine yüklenecek. Devam edilsin mi?')) return;
    try{
      var payload = source==='drive' ? await readDrive(id) : await readSupabase(id);
      var recs=payload.records || ((payload.payload||{}).records);
      var st=payload.settings || ((payload.payload||{}).settings);
      if(!Array.isArray(recs)) throw new Error('Yedek kayıtları bulunamadı');
      jsonSet(STORAGE_KEY,recs);
      if(st) jsonSet(SETTINGS_KEY,Object.assign(settings(),st));
      toast('Bulut yedeği yüklendi.','Sayfa yenileniyor.','success');
      setTimeout(function(){ location.reload(); },700);
    }catch(e){ toast('Bulut yedeği yüklenemedi.',errText(e),'error'); }
  }

  function replaceButton(id,label,handler){
    var old=$(id); if(!old || old.__hybridV501) return;
    var neu=old.cloneNode(true); neu.textContent=label||old.textContent; neu.removeAttribute('disabled'); neu.__hybridV501=true;
    old.parentNode.replaceChild(neu,old);
    neu.addEventListener('click',function(ev){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); handler(ev); },true);
  }
  function bind(){
    try{
      document.querySelectorAll('#panelAdminOpenV316,[data-admin-open],[data-open-admin],[href*="admin.html"],[href*="yonetim"]').forEach(function(el){ el.remove(); });
    }catch(e){}
    var sync=$('panelSyncV316'); if(sync) sync.textContent='Supabase + Drive Hazır';
    replaceButton('cloudBackupBtnV316','Buluta Yedekle',function(){ hybridBackup().catch(function(e){ toast('Buluta yedeklenemedi.',errText(e),'error'); }); });
    replaceButton('cloudRestoreBtnV316','Buluttan Getir',openCloud);
    replaceButton('panelBackupsV318','Bulut Yedeklerim',openCloud);
    var box=$('cloudRestoreListV316');
    if(box && !box.__hybridV501){
      box.__hybridV501=true;
      box.addEventListener('click',function(ev){
        var b=ev.target&&ev.target.closest&&ev.target.closest('[data-hybrid-id-v501]');
        if(b){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); restore(b.getAttribute('data-hybrid-source-v501'), b.getAttribute('data-hybrid-id-v501')); }
      },true);
    }
  }
  function expose(){
    var api={version:'v501',backup:hybridBackup,list:combinedList,openCloudRestore:openCloud,restore:restore,backupSupabase:backupSupabase,backupDrive:backupDrive};
    window.MESAHA_HYBRID_CLOUD_V501=api;
    window.mesahaHybridCloudV501=api;
    window.mesahaPanelV316=window.mesahaPanelV316||{};
    window.mesahaPanelV316.cloudBackup=hybridBackup;
    window.mesahaPanelV316.openCloudRestore=openCloud;
    window.mesahaPanelV316.openAdmin=function(){return false;};
    if(window.mesahaOnlineV317){ window.mesahaOnlineV317.backup=hybridBackup; window.mesahaOnlineV317.restoreOpen=openCloud; }
    if(window.mesahaUserBackupsV318){
      window.mesahaUserBackupsV318.open=openCloud;
      window.mesahaUserBackupsV318.list=combinedList;
      window.mesahaUserBackupsV318.deleteBackup=function(){ toast('Silme kapalı.','Yedekler korunuyor. Drive’da silinse bile çöp kutusunda kalır.','warning'); };
    }
  }
  function boot(){ expose(); bind(); [250,800,1600,3200,6000].forEach(function(ms){ setTimeout(function(){ expose(); bind(); },ms); }); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
