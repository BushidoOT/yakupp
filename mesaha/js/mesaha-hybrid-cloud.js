/* Mesaha İO V5.61 — Terminal kodlu bulut + Google ad-soyad + eski ban ekranı koruması
   Buluta Yedekle: Edge Function guard + güvenli Supabase V2 + Google Drive.
   Buluttan Getir: Edge Function guard + iki kaynak birlikte listelenir.
   Kullanıcı yedek silme: gerçek silme yok; kullanıcı listesinden gizlenir.
   ORBİS/XLS/hacim tarafına dokunmaz. */
(function(){
  'use strict';
  if(window.MESAHA_SUITE_MODE){
    var suiteCloudStub={version:'suite-v21',suiteManaged:true,backup:async function(){throw new Error('Yedekler Mesaha Suite üzerinden yönetilir')},list:async function(){return[]},openCloudRestore:function(){location.href='../'},restore:async function(){return false},deleteBackup:async function(){return false}};
    window.MESAHA_HYBRID_CLOUD_V501=suiteCloudStub;window.MESAHA_HYBRID_CLOUD_V505=suiteCloudStub;window.MESAHA_HYBRID_CLOUD_V506=suiteCloudStub;window.MESAHA_HYBRID_CLOUD_V508=suiteCloudStub;window.mesahaHybridCloudV501=suiteCloudStub;window.mesahaHybridCloudV505=suiteCloudStub;window.mesahaHybridCloudV506=suiteCloudStub;window.mesahaHybridCloudV508=suiteCloudStub;return;
  }
  if(window.__mesahaHybridCloudV508) return;
  window.__mesahaHybridCloudV508 = true;
  window.__mesahaHybridCloudV506 = true;
  window.__mesahaHybridCloudV505 = true;

  var STORAGE_KEY = 'cam_mesaha_kayitlari_v1';
  var SETTINGS_KEY = 'cam_mesaha_ayarlar_v1';
  var PANEL_USER_KEY = 'mesaha_panel_user_v316';
  var SLOT_KEY = 'mesaha_supabase_backup_slot_index_v501';
  var CHUNK_SIZE = 180;
  var HIDDEN_KEY = 'mesaha_hidden_cloud_backups_v505';
  var SESSION_KEY = 'mesaha_supabase_v500_session';
  var DEVICE_KEY = 'mesaha_supabase_v500_device';
  var TERMINAL_KEY = 'mesaha_terminal_local_mode_v556';

  function $(id){ return document.getElementById(id); }
  function clean(v){ return String(v == null ? '' : v).trim(); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g,function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }
  function fold(s){ return clean(s).toLocaleLowerCase('tr-TR').replace(/[ç]/g,'c').replace(/[ğ]/g,'g').replace(/[ı]/g,'i').replace(/[ö]/g,'o').replace(/[ş]/g,'s').replace(/[ü]/g,'u'); }
  function userKey(name,seflik){ return (fold(name)+'__'+fold(seflik)).replace(/[^a-z0-9_-]+/g,'_').slice(0,120) || 'bos'; }
  function jsonGet(k,f){ try{ var v=localStorage.getItem(k); return v ? JSON.parse(v) : f; }catch(e){ return f; } }
  function jsonSet(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }
  function records(){ var r=jsonGet(STORAGE_KEY, []); return Array.isArray(r) ? r : []; }
  function settings(){ return Object.assign({ekipNot:'',seflik:'',bolmeNo:''}, jsonGet(SETTINGS_KEY, {})); }
  function readUser(){ var u=jsonGet(PANEL_USER_KEY, {}), st=settings(), g=clean(u.googleApproved&&u.googleFullName); return {name:clean(g||u.name||st.ekipNot), seflik:clean(u.seflik||st.seflik), bolmeNo:clean(u.bolmeNo||st.bolmeNo), googleFullName:g, googleEmail:clean(u.googleEmail)}; }
  function validIdentity(user){
    user=user||{}; var name=clean(user.name),seflik=clean(user.seflik);
    if(window.MesahaRuntimeV527&&typeof window.MesahaRuntimeV527.validIdentity==='function')return window.MesahaRuntimeV527.validIdentity(name,seflik);
    var n=name.toLocaleLowerCase('tr-TR'),s=seflik.toLocaleLowerCase('tr-TR');
    return name.length>1&&seflik.length>1&&!/^(kullanıcı|kullanici|user|guest|misafir|boş|bos|-)$/.test(n)&&!/^(şeflik|seflik|unknown|bilinmiyor|boş|bos|-)$/.test(s);
  }
  function versionText(){ return (window.MESAHA_VERSION&&window.MESAHA_VERSION.visibleVersion) || window.APP_VERSION || 'Mesaha İO'; }
  function versionRaw(){ return (window.MESAHA_VERSION&&window.MESAHA_VERSION.version) || window.FILE_VERSION || 'local'; }
  function toast(t,s,k){ try{ if(typeof window.mesahaFloatToastV315==='function') return window.mesahaFloatToastV315(t,s||'',k||'success'); }catch(e){} try{ if(typeof window.toast==='function') return window.toast(t,s||'',k||'success'); }catch(e){} try{ alert(t+(s?'\n'+s:'')); }catch(e){} }
  function errText(e){ var m=String(e&&e.message?e.message:e||'Hata'); if(/Failed to fetch|Network|Load failed|internet|offline/i.test(m)) return 'İnternet bağlantısını kontrol et.'; if(/permission|rls|policy|yetkisiz|403|401/i.test(m)) return 'Yetki/RLS kontrolü gerekli.'; if(/payload|column_size|too large|413/i.test(m)) return 'Yedek boyutu fazla; parça sistemi kontrol edilmeli.'; return m.slice(0,180); }
  function terminalData(){try{return jsonGet(TERMINAL_KEY,{})||{}}catch(e){return {}}}
  function terminalMode(){try{var x=terminalData();return !!(x&&x.active===true)}catch(e){return false}}
  function terminalCloudAllowed(){var x=terminalData();return !!(x&&x.active===true&&x.source==='pair_code'&&x.pairedUserId&&(x.terminalToken||x.terminalCode));}
  function terminalCloudError(){var e=new Error(terminalMode()?'Bu terminal buluta bağlı değil. Telefonda Google ile giriş yapan kullanıcıdan Terminal kodu oluşturup bu cihaza girin.':'Bu özellik için Google ile giriş yap.');e.googleRequired=true;return e}
  function deviceInfo(){var nav=navigator||{};return{deviceId:getDeviceId(),platform:clean((nav.userAgentData&&nav.userAgentData.platform)||nav.platform||''),userAgent:clean(nav.userAgent||'').slice(0,500),standalone:!!(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||nav.standalone===true};}
  function cfg(){var c=window.MESAHA_SUPABASE_CONFIG||{};return{url:clean(c.url).replace(/\/+$/,''),anonKey:clean(c.anonKey||c.anon_key)}}
  async function anonRpc(name,params){var c=cfg();if(!c.url||!c.anonKey)throw new Error('Supabase bağlantı ayarı eksik.');var res=await fetch(c.url+'/rest/v1/rpc/'+encodeURIComponent(name),{method:'POST',cache:'no-store',headers:{apikey:c.anonKey,Authorization:'Bearer '+c.anonKey,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(params||{})});var txt=await res.text(),out={};try{out=txt?JSON.parse(txt):{}}catch(e){out={message:txt}}if(!res.ok||out.ok===false){throw new Error(clean(out.message||out.error||out.details||out.hint||('Terminal bulut RPC hata '+res.status)))}return out;}
  function terminalCred(){var x=terminalData();if(!terminalCloudAllowed())return null;return{code:clean(x.terminalCode),token:clean(x.terminalToken),device:deviceInfo()}}
  async function terminalRpc(name,params){var cr=terminalCred();if(!cr)throw terminalCloudError();return anonRpc(name,Object.assign({p_terminal_code:cr.code,p_terminal_token:cr.token,p_device_info:cr.device,p_app_version:versionText()},params||{}));}
  function volume(r){ var d=Number(String(r.diameter||r.cap||0).replace(',','.')); var l=Number(String(r.length||r.boy||0).replace(',','.')); var q=Number(r.quantity||r.adet||1); if(!d||!l) return 0; return Math.PI*Math.pow(d/100,2)/4*l*q; }
  function totalM3(list){ return (list||[]).reduce(function(a,r){ return a+volume(r); },0); }
  function trText(){ try{ return new Date().toLocaleString('tr-TR'); }catch(e){ return new Date().toISOString(); } }
  function setBusy(on, text){
    try{ document.body.classList.toggle('mesaha-hybrid-busy-v501', !!on); }catch(e){}
    var b=$('cloudBackupBtnV316'); if(b){ if(on){ b.__oldTextV501=b.textContent; b.disabled=true; b.textContent=text||'Buluta yükleniyor…'; } else { b.disabled=false; b.textContent=b.__oldTextV501||'Buluta Yedekle'; } }
  }
  function requireUser(){
    var user=readUser();
    if(!validIdentity(user)){
      toast('Önce kullanıcı girişi yap.','Kullanıcı adı ve şeflik gerekli.','warning');
      try{ if(window.mesahaPanelV316 && window.mesahaPanelV316.open) window.mesahaPanelV316.open(); }catch(e){}
      throw new Error('Kullanıcı bilgisi eksik');
    }
    return user;
  }
  function backupPayload(user,list){
    return {type:'mesaha-cloud-backup-v501', exportedAt:new Date().toISOString(), createdAt:trText(), createdAtMs:Date.now(), version:versionRaw(), visibleVersion:versionText(), user:Object.assign({},user,{displayName:clean(user.googleFullName||user.name)}), settings:settings(), records:list};
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
  function clearBlockedScreen(){
    try{
      var ov=document.getElementById('mesahaAccessBlockedV508');if(ov&&ov.parentNode)ov.parentNode.removeChild(ov);
      var st=document.getElementById('mesahaAccessBlockedStyleV508');if(st&&st.parentNode)st.parentNode.removeChild(st);
      document.documentElement.classList.remove('mesaha-blocked-v508');document.body&&document.body.classList.remove('mesaha-blocked-v508');
      document.querySelectorAll('[data-mesaha-blocked-tab-v550]').forEach(function(el){var old=el.getAttribute('data-mesaha-blocked-tab-v550');el.removeAttribute('data-mesaha-blocked-tab-v550');if(old==='__none__')el.removeAttribute('tabindex');else el.setAttribute('tabindex',old)});
    }catch(e){}
  }
  function staleVersionReason(reason){return /sürüm|surum|version|güncel|guncel|update|eski|cache|önbellek|onbellek/i.test(clean(reason))}
  function showBlockedScreen(reason){
    if(staleVersionReason(reason)){clearBlockedScreen();toast('Güncelleme gerekli','Eski sürüm ban ekranı temizlendi. Uygulama güncel sürüme alınacak.','warning');try{setTimeout(function(){location.replace('./temizle.html?from=stale-ban-v560')},450)}catch(e){}return}
    try{if(window.MesahaLoginLog&&typeof window.MesahaLoginLog.log==='function')window.MesahaLoginLog.log('blocked_screen_shown',{reason:reason,source:'hybrid-cloud'},'error')}catch(_log){}
    try{
      if(document.getElementById('mesahaAccessBlockedV508')) return;
      var st=document.createElement('style');
      st.id='mesahaAccessBlockedStyleV508';
      st.textContent='#mesahaAccessBlockedV508{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:linear-gradient(145deg,#111827 0%,#450a0a 100%);padding:22px;box-sizing:border-box;color:#fff;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-align:center}#mesahaAccessBlockedV508 .box{width:min(520px,100%);background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.22);box-shadow:0 24px 90px rgba(0,0,0,.35);border-radius:30px;padding:28px 22px;backdrop-filter:blur(14px)}#mesahaAccessBlockedV508 .icon{width:74px;height:74px;margin:0 auto 16px;border-radius:24px;display:grid;place-items:center;background:#dc2626;color:#fff;font-size:42px;font-weight:1000}#mesahaAccessBlockedV508 h1{margin:0 0 12px;font-size:28px;line-height:1.08;font-weight:1000;letter-spacing:-.03em}#mesahaAccessBlockedV508 p{margin:0;color:#fee2e2;font-size:16px;line-height:1.45;font-weight:800}#mesahaAccessBlockedV508 small{display:block;margin-top:14px;color:rgba(255,255,255,.62);font-size:12px;font-weight:800;word-break:break-word}html.mesaha-blocked-v508,body.mesaha-blocked-v508{overflow:hidden!important}';
      document.head.appendChild(st);
      var ov=document.createElement('div');
      ov.id='mesahaAccessBlockedV508';
      ov.innerHTML='<div class="box"><div class="icon">×</div><h1>Bu cihaz ve kullanıcı engellendi</h1><p>Uygulamayı kullanamazsınız. Lütfen yönetici ile iletişime geçin.</p>'+(reason?'<small>'+esc(reason)+'</small>':'')+'</div>';
      document.documentElement.classList.add('mesaha-blocked-v508');
      document.body.classList.add('mesaha-blocked-v508');
      document.body.appendChild(ov);
      try{ document.querySelectorAll('button,input,select,textarea,a').forEach(function(el){ if(!ov.contains(el)){el.setAttribute('data-mesaha-blocked-tab-v550',el.hasAttribute('tabindex')?el.getAttribute('tabindex'):'__none__');el.setAttribute('tabindex','-1')} }); }catch(e){}
    }catch(e){ try{ alert('Bu cihaz ve kullanıcı engellendi'); }catch(_){} }
  }
  function errorPayload(e){
    return e&&e.payload&&typeof e.payload==='object'?e.payload:{};
  }
  function isAuthGateError(e){
    var p=errorPayload(e);
    return p.google_required===true || p.access_required===true || p.auth_required===true;
  }
  function isBlockedError(e){
    var p=errorPayload(e);
    /* Yalnız sunucunun açıkça blocked:true döndürdüğü gerçek güvenlik engelleri tam ekranı açar.
       Google doğrulaması veya yönetici onayı eksikliği nedeniyle gelen 403 artık ban sayılmaz. */
    var t=clean(p.block_type||p.type||p.blockType);return (p.blocked===true&&/^(user_id|user_key|device_id|ip)$/i.test(t)) || (e&&e.blocked===true&&/^(user_id|user_key|device_id|ip)$/i.test(t));
  }
  var startupGuardDone=false;
  async function startupGuardCheck(){
    if(startupGuardDone) return;
    if(terminalMode()){ startupGuardDone=true; clearBlockedScreen(); return; }
    var user=readUser();
    /* Boş/genel profil Edge Function tarafında sahte kullanıcı oluşturmasın. Güvenlik kontrolü gerçek kimlik kaydedilince başlar. */
    if(!validIdentity(user)) return;
    startupGuardDone=true;
    try{ await guardCheck('app_open', user, {source:'startup'}); clearBlockedScreen(); }
    catch(e){
      if(isBlockedError(e)) showBlockedScreen(clean(errorPayload(e).reason)||'Erişim yönetici tarafından kapatıldı.');
      else if(isAuthGateError(e)) startupGuardDone=true;
      else startupGuardDone=false;
    }
  }
  async function guardCheck(action,user,extra){
    if(terminalMode()){if(terminalCloudAllowed())return {ok:true,terminal:true};throw terminalCloudError();}
    user=user||readUser();
    if(!validIdentity(user)) throw new Error('Geçerli kullanıcı adı ve şeflik gerekli');
    var api=window.mesahaSupabaseV380||window.mesahaSupabaseV383||window.mesahaSupabase;
    if(!api||typeof api.edge!=='function') throw new Error('Güvenli sunucu bağlantısı hazır değil');
    try{
      return await api.edge(action||'profile_ping',Object.assign({userKey:userKey(user.name,user.seflik),name:user.name,seflik:user.seflik,bolmeNo:user.bolmeNo,deviceId:getDeviceId(),appVersion:versionText(),source:'mesaha-web-v556'},extra||{}));
    }catch(e){
      if(isBlockedError(e)){
        e.blocked=true;
        showBlockedScreen(clean(errorPayload(e).reason)||'Erişim yönetici tarafından kapatıldı.');
      }
      throw e;
    }
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


  async function saveTerminalCloudSlot(slot,user,list,payload){
    var chunkCount=Math.max(1, Math.ceil(list.length/CHUNK_SIZE));
    var meta={
      id:slot,slotId:slot,userKey:userKey(user.name,user.seflik),name:user.name,seflik:user.seflik,bolmeNo:user.bolmeNo,
      fileName:'Mesaha_Terminal_Bulut_'+slot+'_'+Date.now().toString(36)+'.json',payload:Object.assign({},payload,{records:[]}),recordsChunked:true,chunkCount:chunkCount,recordCount:list.length,count:list.length,totalVolume:totalM3(list),m3:totalM3(list),createdAt:trText(),createdAtMs:Date.now(),source:'terminal-cloud-v559',fileVersion:versionRaw(),appVersion:versionText(),archived:false
    };
    await terminalRpc('mesaha_terminal_backup_slot_upsert_v559',{p_slot_id:slot,p_meta:meta});
    for(var i=0;i<chunkCount;i++){
      await terminalRpc('mesaha_terminal_backup_chunk_upsert_v559',{p_slot_id:slot,p_chunk_index:i,p_records:list.slice(i*CHUNK_SIZE,(i+1)*CHUNK_SIZE)});
    }
    return {source:'supabase',slotId:slot,chunkCount:chunkCount,count:list.length,terminal:true};
  }
  async function backupTerminalCloud(user,list,payload){
    var slot=nextSlot();
    var latest=await saveTerminalCloudSlot('latest',user,list,payload);
    var ring=null;try{ring=await saveTerminalCloudSlot(slot,user,list,payload)}catch(e){ring={error:errText(e),slotId:slot}};
    return {latest:latest,slot:ring};
  }
  async function listTerminalCloud(){
    var out=await terminalRpc('mesaha_terminal_backup_list_v559',{}),arr=out.items||[];
    return arr.map(function(b){return {source:'supabase',id:b.id||b.slotId||b.slot_id,name:b.name||'Terminal bulut yedeği',createdAt:b.createdAt||'',createdAtMs:Number(b.createdAtMs||0)||0,count:Number(b.count||0)||0,totalVolume:Number(b.totalVolume||0)||0,chunkCount:Number(b.chunkCount||1)||1,raw:b};}).filter(function(x){return !isHidden('supabase',x.id,readUser())}).sort(function(a,b){return (b.createdAtMs||0)-(a.createdAtMs||0)});
  }
  async function readTerminalCloud(slotId){
    var out=await terminalRpc('mesaha_terminal_backup_read_v559',{p_slot_id:slotId||'latest'});
    var payload=out.payload||out; if(payload.payload)payload=payload.payload; return payload;
  }
  async function deleteTerminalCloud(slotId){
    return await terminalRpc('mesaha_terminal_backup_hide_v559',{p_slot_id:slotId||'latest'});
  }

  function operationKey(prefix,user,list,extra){list=Array.isArray(list)?list:[];var last=list.length?list[list.length-1]:{};return [prefix,userKey(user.name,user.seflik),list.length,clean(last.id||last.barcode||last.barkod||''),clean(last.updatedAt||last.createdAt||last.date||''),clean(extra||'')].join(':').slice(0,240);}
  async function drivePost(action,data){
    var api=window.mesahaSupabaseV380||window.mesahaSupabaseV383||window.mesahaSupabase;
    if(!api||typeof api.edge!=='function') throw new Error('Güvenli sunucu bağlantısı hazır değil');
    return await api.edge('drive_'+action,data||{});
  }
  async function backupDrive(user,list,payload,opKey){
    var key=userKey(user.name,user.seflik);
    return await drivePost('backup',{userKey:key,username:user.name,seflik:user.seflik,bolme:user.bolmeNo,count:list.length,totalVolume:totalM3(list),version:versionText(),payload:payload,idempotencyKey:'drive:'+opKey});
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
    var json=await drivePost('read',{userKey:userKey(user.name,user.seflik),fileId:fileId});
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
      await guardCheck('hide_backup',user,{source:terminalMode()?'terminal-cloud':source,slot_id:id});
      hideBackupLocal(source,id,user);
      if(terminalMode()&&terminalCloudAllowed()) await deleteTerminalCloud(id); else if(source==='supabase') await deleteSupabase(id); else await deleteDrive(id);
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
    var opKey=operationKey('cloud-backup',user,list,user.bolmeNo);
    var gate=await guardCheck('backup_gate',user,{record_count:list.length,idempotencyKey:opKey,source:terminalMode()?'terminal-cloud':'hybrid'});
    if(gate&&gate.duplicate){toast('Yeni değişiklik yok.','Aynı kayıtlar daha önce buluta yedeklendi.','warning');return {ok:[],fail:[],duplicate:true};}
    setBusy(true,'Buluta yükleniyor…');
    var ok=[], fail=[];
    try{
      if(terminalMode()&&terminalCloudAllowed()){await backupTerminalCloud(user,list,payload);ok.push('Terminal Bulut');}
      else {try{ await backupSupabase(user,list,payload); ok.push('Supabase'); }catch(e){ fail.push('Supabase: '+errText(e)); }
      try{ await backupDrive(user,list,payload,opKey); ok.push('Drive'); }catch(e){ fail.push('Drive: '+errText(e)); }}
      if(terminalMode()&&terminalCloudAllowed()&&ok.length) toast('Terminal buluta yedeklendi.','Kullanıcıya bağlı Supabase bulut tamam.','success');
      else if(ok.length===2) toast('Buluta yedeklendi.','Supabase ve Google Drive tamam.','success');
      else if(ok.length===1) toast('Yedek kısmen alındı.',ok[0]+' tamam • '+fail.join(' • '),'warning');
      else throw new Error(fail.join(' • ')||'Yedek alınamadı');
      try{ localStorage.setItem('mesaha_last_hybrid_backup_v501', JSON.stringify({at:new Date().toISOString(),ok:ok,fail:fail,count:list.length,operationKey:opKey})); }catch(e){}
      try{if(window.mesahaExportStatsV323&&typeof window.mesahaExportStatsV323.send==='function')window.mesahaExportStatsV323.send('cloud-backup',{list:list.slice(),idempotencyKey:opKey});}catch(e){}
      return {ok:ok,fail:fail};
    } finally { setBusy(false); }
  }

  async function combinedList(){
    var user=requireUser();
    await guardCheck('list_backups',user,{source:terminalMode()?'terminal-cloud':'hybrid'});
    var sup=[], drv=[], errors=[];
    if(terminalMode()&&terminalCloudAllowed()){try{sup=await listTerminalCloud();}catch(e){errors.push('Terminal Bulut: '+errText(e));}return {items:sup,errors:errors};}
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
      var payload = (terminalMode()&&terminalCloudAllowed()) ? await readTerminalCloud(id) : (source==='drive' ? await readDrive(id) : await readSupabase(id));
      var recs=payload.records || ((payload.payload||{}).records);
      var st=payload.settings || ((payload.payload||{}).settings);
      if(!Array.isArray(recs)) throw new Error('Yedek kayıtları bulunamadı');
      var merged=st?Object.assign(settings(),st):settings();
      var saved=window.MesahaStorageV527?await window.MesahaStorageV527.replaceAll(recs,merged,{reason:'cloud-restore-'+source}):{ok:false,error:'Depolama motoru hazır değil'};
      if(!saved||saved.ok===false) throw new Error(saved&&saved.error||'Yedek kalıcı depolamaya yazılamadı');
      if(window.state){window.state.records=recs;window.state.settings=merged;}
      toast('Bulut yedeği yüklendi.','Kalıcı depolama doğrulandı; sayfa yenileniyor.','success');
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
    var api={version:'v561',backup:hybridBackup,list:combinedList,openCloudRestore:openCloud,restore:restore,deleteBackup:deleteBackup,backupSupabase:backupSupabase,backupDrive:backupDrive};
    window.MESAHA_HYBRID_CLOUD_V501=api;
    window.MESAHA_HYBRID_CLOUD_V505=api;
    window.MESAHA_HYBRID_CLOUD_V506=api;
    window.MESAHA_HYBRID_CLOUD_V508=api;
    window.mesahaHybridCloudV501=api;
    window.mesahaHybridCloudV505=api;
    window.mesahaHybridCloudV506=api;
    window.mesahaHybridCloudV508=api;
    window.mesahaShowBlockedV547=showBlockedScreen;
    window.mesahaClearBlockedV550=clearBlockedScreen;
    if(!window.__mesahaV550StaleBlockCleared){window.__mesahaV550StaleBlockCleared=true;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clearBlockedScreen,{once:true});else clearBlockedScreen();}
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
  function boot(){
    expose();
    bind();
    [250,800,1600,3200,6000].forEach(function(ms){ setTimeout(function(){ expose(); bind(); },ms); });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
