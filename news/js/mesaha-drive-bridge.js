/* Mesaha İO V5.70 — Drive yedek silme aktif ve güvenli köprü */
(function(){
  'use strict';
  var STORAGE_KEY = 'cam_mesaha_kayitlari_v1';
  var SETTINGS_KEY = 'cam_mesaha_ayarlar_v1';
  var PANEL_USER_KEY = 'mesaha_panel_user_v316';

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
  function volume(r){ var d=Number(String(r.diameter||r.cap||0).replace(',','.')); var l=Number(String(r.length||r.boy||0).replace(',','.')); var q=Number(r.quantity||r.adet||1); if(!d||!l) return 0; return Math.PI*Math.pow(d/100,2)/4*l*q; }
  function totalM3(list){ return (list||[]).reduce(function(a,r){ return a+volume(r); },0); }
  function toast(t,s,k){ try{ if(typeof window.mesahaFloatToastV315==='function') return window.mesahaFloatToastV315(t,s||'',k||'success'); }catch(e){} try{ if(typeof window.toast==='function') return window.toast(t,s||'',k||'success'); }catch(e){} try{ alert(t+(s?'\n'+s:'')); }catch(e){} }
  function errText(e){ var m=String(e&&e.message?e.message:e||'Hata'); if(/Failed to fetch|Network|Load failed|internet|offline/i.test(m)) return 'Drive bağlantısı kurulamadı. İnterneti ve Apps Script yayınını kontrol et.'; if(/yetkisiz/i.test(m)) return 'Drive köprü yetkisi kabul edilmedi.'; return m.slice(0,180); }
  function setBusy(on){ try{ document.body.classList.toggle('mesaha-drive-busy-v463', !!on); }catch(e){} }

  function operationKey(prefix,user,list,extra){
    list=Array.isArray(list)?list:[];var last=list.length?list[list.length-1]:{};
    return [prefix,userKey(user.name,user.seflik),list.length,clean(last.id||last.barcode||last.barkod||''),clean(last.updatedAt||last.createdAt||last.date||''),clean(extra||'')].join(':').slice(0,240);
  }
  async function post(action,data){
    var api=window.mesahaSupabaseV380||window.mesahaSupabaseV383||window.mesahaSupabase;
    if(!api||typeof api.edge!=='function') throw new Error('Güvenli sunucu bağlantısı hazır değil');
    return await api.edge('drive_'+action,data||{});
  }
  function sendStats(reason,list){try{if(window.mesahaExportStatsV323&&typeof window.mesahaExportStatsV323.send==='function')window.mesahaExportStatsV323.send(reason,{list:Array.isArray(list)?list.slice():records()});}catch(e){}}

  async function backup(){
    var user = readUser();
    if(!user.name || !user.seflik){
      toast('Önce kullanıcı girişi yap.','Kullanıcı adı ve şeflik gerekli.','warning');
      try{ if(window.mesahaPanelV316 && window.mesahaPanelV316.open) window.mesahaPanelV316.open(); }catch(e){}
      throw new Error('Kullanıcı bilgisi eksik');
    }
    var list = records();
    setBusy(true);
    try{
      var key = userKey(user.name,user.seflik);
      var payload = {type:'mesaha-drive-backup', exportedAt:new Date().toISOString(), version:versionRaw(), visibleVersion:versionText(), user:user, settings:settings(), records:list};
      var out = await post('backup',{userKey:key, username:user.name, seflik:user.seflik, bolme:user.bolmeNo, count:list.length, totalVolume:totalM3(list), version:versionText(), payload:payload,idempotencyKey:operationKey('drive-backup',user,list,user.bolmeNo)});
      try{ localStorage.setItem('mesaha_last_drive_backup_v463', JSON.stringify({id:out.id,name:out.name,at:new Date().toISOString(),count:list.length})); }catch(e){}
      toast('Drive yedeği alındı.','Kayıtlar Google Drive’a gönderildi.','success');
      sendStats('drive-backup',list);
      return out;
    } finally { setBusy(false); }
  }


  async function backupCustom(options){
    options=options||{};
    var user=readUser();
    if(!user.name||!user.seflik) throw new Error('Önce kullanıcı girişi yap');
    var list=Array.isArray(options.records)?options.records:records();
    var bolme=clean(options.bolmeNo||options.bolme||user.bolmeNo);
    if(!bolme) throw new Error('Bölme numarası seçilmedi');
    if(!list.length) throw new Error('Drive yedeği için kayıt yok');
    var payload={
      type:clean(options.type||'mesaha-drive-backup'),
      exportedAt:new Date().toISOString(),
      version:versionRaw(),
      visibleVersion:versionText(),
      user:{name:user.name,seflik:user.seflik,bolmeNo:bolme},
      settings:Object.assign({},settings(),{bolmeNo:bolme}),
      records:list,
      sharedFolder:options.sharedFolder===true||clean(options.type)==='mesaha-seflik-folder-backup'
    };
    setBusy(true);
    try{
      var out=await post('backup',{
        userKey:userKey(user.name,user.seflik),
        username:user.name,
        seflik:user.seflik,
        bolme:bolme,
        count:list.length,
        totalVolume:totalM3(list),
        version:versionText(),
        payload:payload,
        folderMode:payload.sharedFolder?'seflik':'user',
        idempotencyKey:operationKey(payload.sharedFolder?'seflik-drive-backup':'drive-backup',user,list,bolme)
      });
      try{localStorage.setItem('mesaha_last_drive_backup_v463',JSON.stringify({id:out.id,name:out.name,at:new Date().toISOString(),count:list.length,bolme:bolme,type:payload.type}));}catch(e){}
      if(!options.silent) toast('Drive yedeği alındı.','Bölme '+bolme+' kayıtları Google Drive’a gönderildi.','success');
      return out;
    }finally{setBusy(false);}
  }

  async function list(){
    var user = readUser();
    if(!user.name || !user.seflik) throw new Error('Önce kullanıcı girişi yap');
    var key = userKey(user.name,user.seflik);
    var out = await post('list',{userKey:key});
    return out.items || [];
  }

  async function read(fileId){
    var user = readUser();
    if(!user.name || !user.seflik) throw new Error('Önce kullanıcı girişi yap');
    return await post('read',{userKey:userKey(user.name,user.seflik),fileId:fileId});
  }

  async function restore(fileId){
    if(!fileId) return;
    if(!confirm('Bu Drive yedeği mevcut kayıtların yerine yüklenecek. Devam edilsin mi?')) return;
    try{
      var data = await read(fileId);
      var payload = data.payload || data;
      var recs = payload.records || ((payload.payload||{}).records);
      var st = payload.settings || ((payload.payload||{}).settings);
      if(!Array.isArray(recs)) throw new Error('Yedek kayıtları bulunamadı');
      var mergedSettings = st ? Object.assign({}, settings(), st) : settings();
      var saved = null;
      if(window.MesahaStorageV527 && typeof window.MesahaStorageV527.replaceAll === 'function'){
        saved = await window.MesahaStorageV527.replaceAll(recs, mergedSettings, {reason:'drive-restore'});
      }else{
        var recOk = jsonSet(STORAGE_KEY, recs);
        var setOk = jsonSet(SETTINGS_KEY, mergedSettings);
        saved = {ok:!!(recOk && setOk), legacy:true};
      }
      if(!saved || saved.ok === false) throw new Error((saved&&saved.error)||'Drive yedeği kalıcı depolamaya yazılamadı');
      try{
        if(window.state){ window.state.records = recs; window.state.settings = mergedSettings; }
      }catch(e){}
      toast('Drive yedeği yüklendi.','Kayıtlar ve ayarlar güvenli şekilde yenilendi.','success');
      setTimeout(function(){ location.reload(); },700);
    }catch(e){ toast('Drive yedeği yüklenemedi.', errText(e), 'error'); }
  }

  async function deleteBackup(fileId){
    fileId=clean(fileId);
    if(!fileId) return;
    if(!confirm('Bu Drive yedeği kalıcı olarak silinsin mi?\n\nBu işlem Google Drive yedeğini kaldırır.')) return;
    setBusy(true);
    try{
      var out=await post('delete',{fileId:fileId});
      var deleted=(out&&out.deleted)||[];
      if(out&&out.ok===false) throw new Error(out.error||'Drive yedeği silinemedi');
      toast('Drive yedeği silindi.', deleted.length ? 'Google Drive ve bulut kayıt referansı temizlendi.' : 'Yedek silme isteği tamamlandı.', 'success');
      try{
        var last=jsonGet('mesaha_last_drive_backup_v463',{});
        if(last&&clean(last.id)===fileId)localStorage.removeItem('mesaha_last_drive_backup_v463');
      }catch(e){}
      await openRestore();
      return out;
    }catch(e){
      toast('Drive yedeği silinemedi.', errText(e), 'error');
      throw e;
    }finally{setBusy(false);}
  }

  async function openRestore(){
    var ov=$('cloudRestoreOverlayV316'), box=$('cloudRestoreListV316'), info=$('cloudRestoreInfoV316');
    if(ov) ov.classList.remove('hidden');
    if(info) info.textContent='Drive yedekleri hazırlanıyor…';
    if(box) box.innerHTML='<div class="cloud-item-v316">Google Drive yedekleri yükleniyor…</div>';
    try{
      var arr = await list();
      if(info) info.textContent = arr.length+' Drive yedeği bulundu';
      if(!arr.length){ if(box) box.innerHTML='<div class="cloud-item-v316">Drive’da bu kullanıcıya ait yedek bulunamadı.</div>'; return; }
      if(box) box.innerHTML = arr.slice(0,60).map(function(b){
        return '<div class="cloud-item-v316 cloud-item-v463"><div><b>'+esc(b.name||'Mesaha yedeği')+'</b><small>'+esc(b.createdAt||'-')+' • '+Number(b.count||0).toLocaleString('tr-TR')+' kayıt • '+Number(b.totalVolume||0).toLocaleString('tr-TR',{minimumFractionDigits:3,maximumFractionDigits:3})+' m³</small></div><div class="cloud-actions-v570"><button class="btn primary" data-drive-restore-v463="'+esc(b.id)+'" type="button">Bu Yedeği Yükle</button><button class="btn danger drive-delete-v570" data-drive-delete-v570="'+esc(b.id)+'" type="button">Sil</button></div></div>';
      }).join('');
    }catch(e){ if(info) info.textContent='Drive yedekleri alınamadı'; if(box) box.innerHTML='<div class="cloud-item-v316">'+esc(errText(e))+'</div>'; }
  }


  function ensureDriveDeleteStyle(){
    if(document.getElementById('mesaha-drive-delete-v570-style'))return;
    var st=document.createElement('style');
    st.id='mesaha-drive-delete-v570-style';
    st.textContent='.cloud-actions-v570{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.cloud-item-v463{gap:10px}.drive-delete-v570,.btn.danger.drive-delete-v570{background:linear-gradient(180deg,#ef4444,#b91c1c)!important;color:#fff!important;border-color:#991b1b!important;box-shadow:0 10px 22px rgba(185,28,28,.22)!important}';
    document.head.appendChild(st);
  }

  function replaceButton(id,label,handler){
    var old=$(id); if(!old) return;
    var neu=old.cloneNode(true); neu.textContent=label||old.textContent; neu.removeAttribute('disabled'); neu.__driveV463=true;
    old.parentNode.replaceChild(neu,old);
    neu.addEventListener('click',function(ev){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); handler(ev); },true);
  }

  function hardenUi(){
    var adm=$('panelAdminOpenV316'); if(adm) adm.remove();
    document.querySelectorAll&&document.querySelectorAll('[data-admin-open],[data-open-admin],[href*="admin.html"],[href*="yonetim"]').forEach(function(el){el.remove();});
    var sync=$('panelSyncV316'); if(sync) sync.textContent='Drive Hazır';
    replaceButton('cloudBackupBtnV316','Drive’a Yedekle',function(){ backup().catch(function(e){ toast('Drive yedek alınamadı.', errText(e), 'error'); }); });
    replaceButton('cloudRestoreBtnV316','Drive’dan Getir',openRestore);
    replaceButton('panelBackupsV318','Drive Yedeklerim',openRestore);
    var box=$('cloudRestoreListV316');
    if(box && !box.__driveV463){
      box.__driveV463=true;
      box.addEventListener('click',function(ev){
        var d=ev.target&&ev.target.closest&&ev.target.closest('[data-drive-delete-v570]');
        if(d){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); deleteBackup(d.getAttribute('data-drive-delete-v570')); return; }
        var b=ev.target&&ev.target.closest&&ev.target.closest('[data-drive-restore-v463]');
        if(b){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); restore(b.getAttribute('data-drive-restore-v463')); }
      },true);
    }
  }

  function expose(){
    window.MESAHA_DRIVE_BRIDGE_V463 = {secure:true, backup:backup, backupCustom:backupCustom, list:list, openRestore:openRestore, restore:restore, deleteBackup:deleteBackup, post:post};
    window.mesahaDriveBridgeV463 = window.MESAHA_DRIVE_BRIDGE_V463;
    window.mesahaPanelV316 = window.mesahaPanelV316 || {};
    window.mesahaPanelV316.cloudBackup = backup;
    window.mesahaPanelV316.openCloudRestore = openRestore;
    window.mesahaPanelV316.openAdmin = function(){ return false; };
    if(window.mesahaOnlineV317){ window.mesahaOnlineV317.backup=backup; window.mesahaOnlineV317.restoreOpen=openRestore; }
    if(window.mesahaUserBackupsV318){
      window.mesahaUserBackupsV318.open=openRestore;
      window.mesahaUserBackupsV318.list=list;
      window.mesahaUserBackupsV318.deleteBackup=deleteBackup;
    }
  }

  function boot(){ ensureDriveDeleteStyle(); expose(); hardenUi(); [250,800,1600,3200].forEach(function(ms){ setTimeout(function(){ expose(); hardenUi(); },ms); }); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
