/* Mesaha İO V463 — Google Drive yedek köprüsü */
(function(){
  'use strict';
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzOYh2MyOQmwVQh-7Jm9KyjaFjmjSwgHZSw7XKAVzDS1ibmcM5bQZVYdn-NyesI-ph7/exec';
  var SECRET = 'MESAHAYEDEK_2026_YAKUP_43';
  var STORAGE_KEY = 'cam_mesaha_kayitlari_v1';
  var SETTINGS_KEY = 'cam_mesaha_ayarlar_v1';
  var PANEL_USER_KEY = 'mesaha_panel_user_v316';
  var CONFIG_KEY = 'mesaha_drive_bridge_url_v463';

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
  function bridgeUrl(){ try{ return clean(localStorage.getItem(CONFIG_KEY)||SCRIPT_URL); }catch(e){ return SCRIPT_URL; } }
  function setBusy(on){ try{ document.body.classList.toggle('mesaha-drive-busy-v463', !!on); }catch(e){} }

  async function post(action,data){
    var body = Object.assign({secret:SECRET, action:action}, data||{});
    var res = await fetch(bridgeUrl(), {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(body), redirect:'follow', cache:'no-store'});
    var txt = await res.text();
    var json = null;
    try{ json = txt ? JSON.parse(txt) : {}; }catch(e){ throw new Error('Drive köprü cevabı okunamadı'); }
    if(!res.ok || !json.ok) throw new Error((json&&json.error) || ('Drive hata '+res.status));
    return json;
  }

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
      var out = await post('backup',{userKey:key, username:user.name, seflik:user.seflik, bolme:user.bolmeNo, count:list.length, totalVolume:totalM3(list), version:versionText(), payload:payload});
      try{ localStorage.setItem('mesaha_last_drive_backup_v463', JSON.stringify({id:out.id,name:out.name,at:new Date().toISOString(),count:list.length})); }catch(e){}
      toast('Drive yedeği alındı.','Kayıtlar Google Drive’a gönderildi.','success');
      return out;
    } finally { setBusy(false); }
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
    var res = await fetch(bridgeUrl(), {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({secret:SECRET, action:'read', userKey:userKey(user.name,user.seflik), fileId:fileId}), redirect:'follow', cache:'no-store'});
    var txt = await res.text();
    var json = null;
    try{ json = JSON.parse(txt); }catch(e){ throw new Error('Yedek okunamadı'); }
    if(json && json.ok === false) throw new Error(json.error || 'Yedek okunamadı');
    return json;
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
      jsonSet(STORAGE_KEY, recs);
      if(st) jsonSet(SETTINGS_KEY, Object.assign(settings(), st));
      toast('Drive yedeği yüklendi.','Sayfa yenileniyor.','success');
      setTimeout(function(){ location.reload(); },700);
    }catch(e){ toast('Drive yedeği yüklenemedi.', errText(e), 'error'); }
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
        return '<div class="cloud-item-v316 cloud-item-v463"><div><b>'+esc(b.name||'Mesaha yedeği')+'</b><small>'+esc(b.createdAt||'-')+' • '+Number(b.count||0).toLocaleString('tr-TR')+' kayıt • '+Number(b.totalVolume||0).toLocaleString('tr-TR',{minimumFractionDigits:3,maximumFractionDigits:3})+' m³</small></div><button class="btn primary" data-drive-restore-v463="'+esc(b.id)+'" type="button">Bu Yedeği Yükle</button></div>';
      }).join('');
    }catch(e){ if(info) info.textContent='Drive yedekleri alınamadı'; if(box) box.innerHTML='<div class="cloud-item-v316">'+esc(errText(e))+'</div>'; }
  }

  function replaceButton(id,label,handler){
    var old=$(id); if(!old) return;
    var neu=old.cloneNode(true); neu.textContent=label||old.textContent; neu.removeAttribute('disabled'); neu.__driveV463=true;
    old.parentNode.replaceChild(neu,old);
    neu.addEventListener('click',function(ev){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); handler(ev); },true);
  }

  function hardenUi(){
    var adm=$('panelAdminOpenV316'); if(adm) adm.remove();
    var sync=$('panelSyncV316'); if(sync) sync.textContent='Drive Hazır';
    replaceButton('cloudBackupBtnV316','Drive’a Yedekle',function(){ backup().catch(function(e){ toast('Drive yedek alınamadı.', errText(e), 'error'); }); });
    replaceButton('cloudRestoreBtnV316','Drive’dan Getir',openRestore);
    replaceButton('panelBackupsV318','Drive Yedeklerim',openRestore);
    var box=$('cloudRestoreListV316');
    if(box && !box.__driveV463){
      box.__driveV463=true;
      box.addEventListener('click',function(ev){ var b=ev.target&&ev.target.closest&&ev.target.closest('[data-drive-restore-v463]'); if(b){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); restore(b.getAttribute('data-drive-restore-v463')); } },true);
    }
  }

  function expose(){
    window.MESAHA_DRIVE_BRIDGE_V463 = {url:bridgeUrl(), backup:backup, list:list, openRestore:openRestore, restore:restore, post:post};
    window.mesahaDriveBridgeV463 = window.MESAHA_DRIVE_BRIDGE_V463;
    window.mesahaPanelV316 = window.mesahaPanelV316 || {};
    window.mesahaPanelV316.cloudBackup = backup;
    window.mesahaPanelV316.openCloudRestore = openRestore;
    window.mesahaPanelV316.openAdmin = function(){ location.href='./yonetim/'; };
    if(window.mesahaOnlineV317){ window.mesahaOnlineV317.backup=backup; window.mesahaOnlineV317.restoreOpen=openRestore; }
    if(window.mesahaUserBackupsV318){
      window.mesahaUserBackupsV318.open=openRestore;
      window.mesahaUserBackupsV318.list=list;
      window.mesahaUserBackupsV318.deleteBackup=function(){ toast('Silme kapalı.','Yedekler Google Drive’da korunuyor.','warning'); };
    }
  }

  function boot(){ expose(); hardenUi(); [250,800,1600,3200].forEach(function(ms){ setTimeout(function(){ expose(); hardenUi(); },ms); }); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
