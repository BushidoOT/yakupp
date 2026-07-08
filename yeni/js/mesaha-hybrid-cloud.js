/* Mesaha İO V506 — Yedek ekranı sığma + kullanıcı yedek gizleme düzeltmesi
   Buluta Yedekle: Edge Function guard + güvenli Supabase V2 + Google Drive.
   Buluttan Getir: Edge Function guard + iki kaynak birlikte listelenir.
   Kullanıcı yedek silme: gerçek silme yok; kullanıcı listesinden gizlenir.
   ORBİS/XLS/hacim tarafına dokunmaz. */
(function(){
  'use strict';
  if(window.__mesahaHybridCloudV506) return;
  window.__mesahaHybridCloudV506 = true;
  window.__mesahaHybridCloudV505 = true;

  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzOYh2MyOQmwVQh-7Jm9KyjaFjmjSwgHZSw7XKAVzDS1ibmcM5bQZVYdn-NyesI-ph7/exec';
  var SECRET = 'MESAHAYEDEK_2026_YAKUP_43';
  var STORAGE_KEY = 'cam_mesaha_kayitlari_v1';
  var SETTINGS_KEY = 'cam_mesaha_ayarlar_v1';
  var PANEL_USER_KEY = 'mesaha_panel_user_v316';
  var SLOT_KEY = 'mesaha_supabase_backup_slot_index_v501';
  var DRIVE_CONFIG_KEY = 'mesaha_drive_bridge_url_v463';
  var CHUNK_SIZE = 180;
  var GUARD_URL = 'https://swrbpdpotmirnmtqnuba.supabase.co/functions/v1/smooth-function';
  var HIDDEN_KEY = 'mesaha_hidden_cloud_backups_v505';
  var SESSION_KEY = 'mesaha_supabase_v500_session';
  var DEVICE_KEY = 'mesaha_supabase_v500_device';

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

  function hiddenList(){ var a=jsonGet(HIDDEN_KEY,[]); return Array.isArray(a)?a:[]; }
  function hiddenKey(source,id,user){ return [source||'cloud', userKey((user||{}).name,(user||{}).seflik), clean(id)].join('::'); }
  function isHidden(source,id,user){ var k=hiddenKey(source,id,user||readUser()); return hiddenList().indexOf(k)>=0; }
  function hideBackupLocal(source,id,user){ var arr=hiddenList(), k=hiddenKey(source,id,user||readUser()); if(arr.indexOf(k)<0){ arr.push(k); jsonSet(HIDDEN_KEY,arr.slice(-600)); } }
  function getSessionToken(){ try{ var s=jsonGet(SESSION_KEY,null); return clean(s&&s.access_token); }catch(e){ return ''; } }
  function getDeviceId(){ try{ return clean(localStorage.getItem(DEVICE_KEY)||''); }catch(e){ return ''; } }
  async function guardCheck(action,user,extra){
    user=user||readUser();
    try{ await supabaseReady(); }catch(e){ throw e; }
    var token=getSessionToken();
    var cfg=window.MESAHA_SUPABASE_CONFIG||{};
    if(!token) throw new Error('Güvenlik oturumu alınamadı');
    var body=Object.assign({
      action:action||'check',
      userKey:userKey(user.name,user.seflik),
      name:user.name,
      seflik:user.seflik,
      deviceId:getDeviceId(),
      appVersion:versionText(),
      source:'mesaha-web-v505'
    }, extra||{});
    var res=await fetch(GUARD_URL,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,apikey:clean(cfg.anonKey||cfg.anon_key||'')},body:JSON.stringify(body),cache:'no-store'});
    var txt=await res.text(), json=null;
    try{ json=txt?JSON.parse(txt):{}; }catch(e){ json={ok:false,error:'Güvenlik cevabı okunamadı'}; }
    if(!res.ok || !json.ok || json.blocked){
      var reason=(json&&json.reason)||(json&&json.error)||('Güvenlik kontrolü reddetti '+res.status);
      throw new Error('Güvenlik engeli: '+reason);
    }
    return json;
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
      source:'supabase-v2+drive-v505',
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
    arr=arr.filter(function(x){
      var raw=x.raw||{};
      return raw.archived!==true && raw.hidden!==true && !isHidden('supabase', x.id, readUser());
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
    }).filter(function(x){ return !isHidden('drive', x.id, user); }).sort(function(a,b){ return (b.createdAtMs||0)-(a.createdAtMs||0); });
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

  async function deleteSupabase(slotId){
    if(!slotId) throw new Error('Yedek kimliği eksik');
    var r=await supabaseReady();
    await r.db.collection('backups').doc(slotId).set({archived:true,archivedAt:trText(),archivedAtMs:Date.now()},{merge:true});
    return {ok:true,source:'supabase',id:slotId};
  }
  async function deleteDrive(fileId){
    var user=requireUser();
    hideBackupLocal('drive',fileId,user);
    return {ok:true,source:'drive',id:fileId,hidden:true};
  }
  async function deleteBackup(source,id){
    if(!id) return;
    if(!confirm('Yedek silinsin mi?')) return;
    try{
      var user=readUser();
      await guardCheck('hide_backup',user,{source:source,slot_id:id});
      hideBackupLocal(source,id,user);
      if(source==='supabase') await deleteSupabase(id); else await deleteDrive(id);
      toast('Yedek silindi.','','success');
      setTimeout(openCloud,250);
    }catch(e){
      toast('Yedek silinemedi.', errText(e),'error');
    }
  }

  async function hybridBackup(){
    var user=requireUser();
    var list=records();
    var payload=backupPayload(user,list);
    await guardCheck('backup',user,{record_count:list.length,source:'hybrid'});
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
    var user=requireUser();
    await guardCheck('list_backups',user,{source:'hybrid'});
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
    if(box) box.innerHTML='<div class="cloud-item-v316 cloud-item-v506">Supabase ve Drive yedekleri yükleniyor…</div>';
    try{
      var data=await combinedList(), arr=data.items||[];
      if(info) info.textContent=arr.length+' yedek bulundu'+(data.errors&&data.errors.length?' • '+data.errors.join(' • '):'');
      if(!arr.length){ if(box) box.innerHTML='<div class="cloud-item-v316 cloud-item-v506">Bulutta bu kullanıcıya ait yedek bulunamadı.</div>'; return; }
      if(box) box.innerHTML=arr.slice(0,80).map(function(b){
        var count=Number(b.count||0).toLocaleString('tr-TR');
        var m3=Number(b.totalVolume||0).toLocaleString('tr-TR',{minimumFractionDigits:3,maximumFractionDigits:3});
        return '<div class="cloud-item-v316 cloud-item-v506" data-cloud-card-source="'+esc(b.source)+'">'
          + '<div class="cloud-head-v506"><span class="cloud-badge-v506 '+sourceClass(b.source)+'">'+sourceLabel(b.source)+'</span><div class="cloud-title-wrap-v506"><b class="cloud-title-v506">'+esc(b.name||'Mesaha yedeği')+'</b><small>'+esc(b.createdAt||'-')+' • '+count+' kayıt • '+m3+' m³</small></div></div>'
          + '<div class="cloud-actions-v506"><button class="btn primary" data-hybrid-source-v501="'+esc(b.source)+'" data-hybrid-id-v501="'+esc(b.id)+'" type="button">Yükle</button><button class="btn danger cloud-delete-btn-v506" data-hybrid-delete-source-v506="'+esc(b.source)+'" data-hybrid-delete-id-v506="'+esc(b.id)+'" type="button">Sil</button></div>'
          + '</div>';
      }).join('');
    }catch(e){ if(info) info.textContent='Yedekler alınamadı'; if(box) box.innerHTML='<div class="cloud-item-v316 cloud-item-v506">'+esc(errText(e))+'</div>'; }
  }
  async function restore(source,id){
    if(!id) return;
    if(!confirm('Bu bulut yedeği mevcut kayıtların yerine yüklenecek. Devam edilsin mi?')) return;
    try{
      await guardCheck('restore_backup',readUser(),{source:source,slot_id:id});
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
    var sync=$('panelSyncV316'); if(sync){ sync.textContent=''; sync.style.display='none'; sync.setAttribute('hidden','hidden'); }
    replaceButton('cloudBackupBtnV316','Buluta Yedekle',function(){ hybridBackup().catch(function(e){ toast('Buluta yedeklenemedi.',errText(e),'error'); }); });
    replaceButton('cloudRestoreBtnV316','Buluttan Getir',openCloud);
    replaceButton('panelBackupsV318','Bulut Yedeklerim',openCloud);
    var box=$('cloudRestoreListV316');
    if(box && !box.__hybridV501){
      box.__hybridV501=true;
      box.addEventListener('click',function(ev){
        var d=ev.target&&ev.target.closest&&ev.target.closest('[data-hybrid-delete-id-v506],[data-hybrid-delete-id-v504]');
        if(d){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); deleteBackup(d.getAttribute('data-hybrid-delete-source-v506')||d.getAttribute('data-hybrid-delete-source-v504'), d.getAttribute('data-hybrid-delete-id-v506')||d.getAttribute('data-hybrid-delete-id-v504')); return; }
        var b=ev.target&&ev.target.closest&&ev.target.closest('[data-hybrid-id-v501]');
        if(b){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); restore(b.getAttribute('data-hybrid-source-v501'), b.getAttribute('data-hybrid-id-v501')); }
      },true);
    }
  }
  function ensureV505Style(){
    if(document.getElementById('mesaha-v506-cloud-fit-style')) return;
    var st=document.createElement('style');
    st.id='mesaha-v506-cloud-fit-style';
    st.textContent=[
      '#panelSyncV316,#userPanelCloseV316,#panelCloseInlineV393{display:none!important;visibility:hidden!important;pointer-events:none!important}',
      '#cloudRestoreOverlayV316{align-items:center!important;justify-content:center!important;padding:10px!important;box-sizing:border-box!important;}',
      '#cloudRestoreOverlayV316 .panel-card-v316{width:min(640px,calc(100vw - 18px))!important;max-width:calc(100vw - 18px)!important;max-height:calc(100dvh - 18px)!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;padding:18px!important;box-sizing:border-box!important;}',
      '#cloudRestoreOverlayV316 .panel-title-v316{flex:0 0 auto!important;display:flex!important;align-items:center!important;gap:10px!important;min-width:0!important;padding-right:52px!important;}',
      '#cloudRestoreOverlayV316 .panel-title-v316 h2{font-size:22px!important;line-height:1.05!important;margin:0!important;white-space:normal!important;}',
      '#cloudRestoreOverlayV316 .panel-title-v316 small{font-size:13px!important;line-height:1.2!important;}',
      '#cloudRestoreCloseV316{position:absolute!important;right:14px!important;top:14px!important;width:46px!important;height:46px!important;min-width:46px!important;border-radius:18px!important;z-index:3!important;}',
      '#cloudRestoreListV316{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;padding:8px 2px 4px!important;display:grid!important;gap:10px!important;}',
      '#cloudRestoreListV316 .cloud-item-v316.cloud-item-v506{width:100%!important;max-width:100%!important;box-sizing:border-box!important;display:block!important;overflow:visible!important;padding:12px!important;border-radius:18px!important;}',
      '.cloud-head-v506{display:flex!important;align-items:flex-start!important;gap:9px!important;min-width:0!important;width:100%!important;}',
      '.cloud-badge-v506{flex:0 0 auto!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:54px!important;max-width:58px!important;padding:5px 7px!important;border-radius:13px!important;font-size:11px!important;font-weight:950!important;text-align:center!important;line-height:1.08!important;white-space:normal!important;word-break:break-word!important;}',
      '.cloud-badge-v506.green{background:#e9f9ef!important;color:#0d5f3b!important;border:1px solid #c9eed7!important}.cloud-badge-v506.blue{background:#e9f1ff!important;color:#1d4ed8!important;border:1px solid #c9dafe!important}',
      '.cloud-title-wrap-v506{min-width:0!important;flex:1 1 auto!important;display:block!important;}',
      '.cloud-title-v506{display:block!important;max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;font-size:16px!important;line-height:1.16!important;margin:1px 0 5px!important;}',
      '.cloud-title-wrap-v506 small{display:block!important;max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important;font-size:13px!important;line-height:1.2!important;}',
      '.cloud-actions-v506{display:grid!important;grid-template-columns:minmax(0,1fr) 82px!important;gap:8px!important;margin-top:10px!important;width:100%!important;}',
      '.cloud-actions-v506 .btn{width:100%!important;min-width:0!important;min-height:42px!important;border-radius:14px!important;font-size:14px!important;font-weight:950!important;padding:8px 10px!important;}',
      '.cloud-delete-btn-v506{display:inline-flex!important;visibility:visible!important;opacity:1!important;background:#dc2626!important;color:#fff!important;border-color:#dc2626!important;}',
      '@media(max-width:390px){#cloudRestoreOverlayV316 .panel-card-v316{padding:14px!important;width:calc(100vw - 12px)!important;max-width:calc(100vw - 12px)!important;}.cloud-badge-v506{min-width:46px!important;max-width:50px!important;font-size:10px!important;padding:5px!important}.cloud-title-v506{font-size:15px!important}.cloud-actions-v506{grid-template-columns:minmax(0,1fr) 72px!important;gap:7px!important}.cloud-actions-v506 .btn{font-size:13px!important;padding:7px 8px!important}}'
    ].join('');
    document.head.appendChild(st);
  }
  function expose(){
    ensureV505Style();
    var api={version:'v506',backup:hybridBackup,list:combinedList,openCloudRestore:openCloud,restore:restore,deleteBackup:deleteBackup,backupSupabase:backupSupabase,backupDrive:backupDrive};
    window.MESAHA_HYBRID_CLOUD_V501=api;
    window.MESAHA_HYBRID_CLOUD_V505=api;
    window.MESAHA_HYBRID_CLOUD_V506=api;
    window.mesahaHybridCloudV501=api;
    window.mesahaHybridCloudV505=api;
    window.mesahaHybridCloudV506=api;
    window.mesahaPanelV316=window.mesahaPanelV316||{};
    window.mesahaPanelV316.cloudBackup=hybridBackup;
    window.mesahaPanelV316.openCloudRestore=openCloud;
    window.mesahaPanelV316.openAdmin=function(){return false;};
    if(window.mesahaOnlineV317){ window.mesahaOnlineV317.backup=hybridBackup; window.mesahaOnlineV317.restoreOpen=openCloud; }
    if(window.mesahaUserBackupsV318){
      window.mesahaUserBackupsV318.open=openCloud;
      window.mesahaUserBackupsV318.list=combinedList;
      window.mesahaUserBackupsV318.deleteBackup=deleteBackup;
    }
  }
  function boot(){ expose(); bind(); [250,800,1600,3200,6000].forEach(function(ms){ setTimeout(function(){ expose(); bind(); },ms); }); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
