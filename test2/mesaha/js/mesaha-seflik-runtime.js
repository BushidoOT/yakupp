/* module: mesaha-terminal-local.js */
/* Mesaha İO V5.78 — Kalıcı terminal oturumu, güvenli çıkış ve hafif arayüz yenileme
   Elle terminal modunda uygulama cihaz içi çalışır; kodla eşleşmiş terminalde Bulut ve Şeflik Klasörü açıktır. */
(function(){
  'use strict';
  if(window.__mesahaTerminalLocalV556) return;
  window.__mesahaTerminalLocalV556 = true;
  var TERMINAL_KEY='mesaha_terminal_local_mode_v556';
  var OLD_TERMINAL_KEY='mesaha_terminal_local_mode_v557';
  var SETTINGS_KEY='cam_mesaha_ayarlar_v1';
  var PANEL_KEY='mesaha_panel_user_v316';
  var CLOUD_SELECTORS=['#cloudBackupBtnV316','#cloudRestoreBtnV316','[data-hybrid-id-v501]','[data-hybrid-delete-id-v506]'].join(',');
  var SEFLIK_SELECTORS=[
    '#seflikSendFromRecordsV529','#seflikFolderHomeShortcutV528','#seflikFolderCreateV529','#seflikFolderSendV528','#seflikFolderSyncV528',
    '[data-nav="seflikFolder"]','[data-seflik-continue]','[data-seflik-delete]'
  ].join(',');
  var GOOGLE_ONLY_SELECTORS=['[data-drive-restore-v463]'].join(',');
  var BLOCK_SELECTORS=[CLOUD_SELECTORS,SEFLIK_SELECTORS,GOOGLE_ONLY_SELECTORS].join(',');

  function $(id){return document.getElementById(id)}
  function clean(v){return String(v==null?'':v).trim().replace(/\s+/g,' ')}
  function esc(v){return clean(v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
  function jsonGet(k,f){try{var v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}}
  function jsonSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
  function terminalData(){var x=jsonGet(TERMINAL_KEY,null);if(!(x&&x.active===true)){var old=jsonGet(OLD_TERMINAL_KEY,null);if(old&&old.active===true){x=old;jsonSet(TERMINAL_KEY,old);try{localStorage.removeItem(OLD_TERMINAL_KEY)}catch(e){}}}return x||{}}
  function terminal(){var x=terminalData();return !!(x&&x.active===true)}
  function terminalCloudAllowed(){var x=terminalData();return !!(x&&x.active===true&&x.source==='pair_code'&&x.pairedUserId&&(x.terminalToken||x.terminalCode));}
  function user(){var u=jsonGet(PANEL_KEY,{}),s=jsonGet(SETTINGS_KEY,{}),t=terminalData();return{name:clean(t.name||u.name||s.ekipNot),seflik:clean(t.seflik||u.seflik||s.seflik),bolmeNo:clean(t.bolmeNo||u.bolmeNo||s.bolmeNo)}}
  function toast(title,sub,kind){try{if(typeof window.mesahaFloatToastV315==='function')return window.mesahaFloatToastV315(title,sub||'',kind||'warning')}catch(e){}try{if(typeof window.toast==='function')return window.toast(title,sub||'',kind||'warning')}catch(e){}try{alert(title+(sub?'\n'+sub:''))}catch(e){}}
  function log(event,detail,level){try{if(window.MesahaLoginLog&&typeof window.MesahaLoginLog.log==='function')window.MesahaLoginLog.log(event,detail||{},level||'info')}catch(e){}}
  function clearTerminal(){try{localStorage.removeItem(TERMINAL_KEY);localStorage.removeItem(OLD_TERMINAL_KEY)}catch(e){}try{document.documentElement.removeAttribute('data-mesaha-terminal-mode');document.documentElement.removeAttribute('data-mesaha-terminal-cloud');['terminalLocalHomeV556','terminalLocalPanelV556','terminalPairPanelV561'].forEach(function(id){var el=$(id);if(el&&el.parentNode)el.parentNode.removeChild(el)})}catch(e){}log('terminal_mode_disabled_for_google',{},'info')}
  function goGoogle(){clearTerminal();try{if(window.mesahaSupabase&&window.mesahaSupabase.clearSession)window.mesahaSupabase.clearSession()}catch(e){}try{window.dispatchEvent(new CustomEvent('mesaha:google-auth-required',{detail:{reason:'terminal_cloud_feature'}}))}catch(e){}setTimeout(function(){try{if(window.MesahaGoogleAuthV548&&typeof window.MesahaGoogleAuthV548.boot==='function')window.MesahaGoogleAuthV548.boot(true)}catch(e){}},80)}
  function askGoogle(){
    log('terminal_cloud_feature_blocked',{url:location.href},'warning');
    toast('Google ile giriş yap','Bu özellik terminal modunda kapalıdır. Kod ile eşleşmiş terminalde Bulut ve Şeflik Klasörü açılır; Drive için Google gerekir.','warning');
    setTimeout(function(){
      try{if(confirm('Bu özellik için Google ile giriş yapmanız gerekiyor. Google giriş ekranını açalım mı?'))goGoogle()}catch(e){}
    },80);
  }
  function style(){
    if($('mesaha-terminal-local-v557-style')) return;
    var st=document.createElement('style');st.id='mesaha-terminal-local-v557-style';st.textContent=[
      'html[data-mesaha-terminal-mode="1"] #userBadge{background:#eef2ff!important;color:#3730a3!important;border-color:#c7d2fe!important}',
      '.terminal-card-v557{border:1px solid #c7d2fe;background:linear-gradient(180deg,#eef2ff,#f8fafc);color:#1e1b4b;border-radius:20px;padding:13px 14px;margin:10px 0;font-weight:850;box-shadow:0 8px 20px rgba(79,70,229,.08)}',
      '.terminal-card-v557 b{display:block;font-size:15px;margin-bottom:4px}.terminal-card-v557 small{display:block;color:#475569;line-height:1.35;font-weight:750}',
      '.terminal-card-v557 button{margin-top:10px;width:100%;min-height:42px;border:0;border-radius:14px;background:#fff;color:#1d4ed8;font-weight:950;box-shadow:inset 0 0 0 1px #bfdbfe}',
      '.terminal-card-v557 input{box-sizing:border-box;width:100%;min-height:44px;border:1px solid #bfdbfe;border-radius:14px;margin-top:10px;padding:10px 12px;font:inherit;font-weight:900;background:#fff;color:#1e1b4b;text-transform:uppercase}',
      'html[data-mesaha-terminal-mode="1"] #cloudBackupBtnV316,html[data-mesaha-terminal-mode="1"] #cloudRestoreBtnV316,html[data-mesaha-terminal-mode="1"] #seflikSendFromRecordsV529,html[data-mesaha-terminal-mode="1"] #seflikFolderSendV528,html[data-mesaha-terminal-mode="1"] #seflikFolderSyncV528,html[data-mesaha-terminal-mode="1"] #seflikFolderCreateV529{background:#f1f5f9!important;color:#64748b!important;border-color:#cbd5e1!important;box-shadow:none!important}',
      'html[data-mesaha-terminal-mode="1"] [data-nav="seflikFolder"]{opacity:.55!important}',
      'html[data-mesaha-terminal-mode="1"] #seflikFolderHomeShortcutV528{opacity:.72!important;filter:grayscale(.25)!important}',
      'html[data-mesaha-terminal-cloud="1"] #seflikSendFromRecordsV529,html[data-mesaha-terminal-cloud="1"] #seflikFolderSendV528,html[data-mesaha-terminal-cloud="1"] #seflikFolderSyncV528,html[data-mesaha-terminal-cloud="1"] #seflikFolderCreateV529{background:revert!important;color:revert!important;border-color:revert!important;box-shadow:revert!important}',
      'html[data-mesaha-terminal-cloud="1"] [data-nav="seflikFolder"],html[data-mesaha-terminal-cloud="1"] #seflikFolderHomeShortcutV528{opacity:1!important;filter:none!important}'
    ].join('');document.head.appendChild(st);
  }
  function terminalCardHtml(){var u=user(),ok=terminalCloudAllowed();return '<div class="terminal-card-v557"><b>🖥 Terminal modu aktif</b><small>'+esc(u.name||'Kullanıcı')+' • '+esc(u.seflik||'Şeflik')+'<br>'+(ok?'Terminal kodu eşleşti. Bulut ve Şeflik Klasörü açık. Çıkış için kullanıcı panelindeki Çıkış Yap düğmesini kullanın.':'Bu cihaz yerel çalışır. Bulut ve Şeflik Klasörü için terminal kodu veya Google gerekir.')+'</small>'+(ok?'':'<button type="button" data-terminal-google-v578>Google ile giriş yap</button>')+'</div>'}
  function terminalPairPanelHtml(){return '<div class="terminal-card-v557" id="terminalPairPanelV561"><b>Terminal kodu gir</b><small>Telefondan kullanıcı panelinde oluşturulan terminal kodunu sonradan buradan eşleştirebilirsin. Kod eşleşince Bulut ve Şeflik Klasörü açılır.</small><input id="terminalPairCodePanelV561" maxlength="20" inputmode="text" autocomplete="one-time-code" placeholder="Örn: A1B2-C3D4"><button type="button" id="terminalPairApplyPanelV561">Terminal kodunu eşleştir</button></div>'}
  function bindTerminalPairPanel(){var b=$('terminalPairApplyPanelV561');if(!b||b.__terminalPairV561)return;b.__terminalPairV561=true;b.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();var inp=$('terminalPairCodePanelV561'),code=clean(inp&&inp.value).toUpperCase();if(code.length<6){toast('Terminal kodu gerekli','Telefondan oluşturulan kodu girin.','warning');return}if(window.MesahaGoogleAuthV548&&typeof window.MesahaGoogleAuthV548.claimTerminalCode==='function'){var oldText=b.textContent;b.disabled=true;b.textContent='Kod kontrol ediliyor…';window.MesahaGoogleAuthV548.claimTerminalCode(code).then(function(){boot();}).catch(function(e){toast('Kod eşleşmedi',clean(e&&e.message||e),'error')}).finally(function(){b.disabled=false;b.textContent=oldText||'Terminal kodunu eşleştir'});return}toast('Giriş modülü hazır değil','Sayfayı yenileyip tekrar deneyin.','warning')},true)}
  function ensureCards(){
    if(!terminal())return;
    var cardHtml=terminalCardHtml(),cardState=terminalCloudAllowed()?'paired':'local';
    var status=document.querySelector('.status-card'),home=$('terminalLocalHomeV556');
    if(status&&!home){home=document.createElement('section');home.id='terminalLocalHomeV556';home.dataset.terminalStateV578=cardState;home.innerHTML=cardHtml;status.parentNode.insertBefore(home,status.nextSibling)}else if(home&&home.dataset.terminalStateV578!==cardState){home.dataset.terminalStateV578=cardState;home.innerHTML=cardHtml}
    var panel=document.querySelector('#userPanelOverlayV316 .panel-stats-v316'),panelCard=$('terminalLocalPanelV556');
    if(panel&&!panelCard){panelCard=document.createElement('div');panelCard.id='terminalLocalPanelV556';panelCard.dataset.terminalStateV578=cardState;panelCard.innerHTML=cardHtml;panel.parentNode.insertBefore(panelCard,panel)}else if(panelCard&&panelCard.dataset.terminalStateV578!==cardState){panelCard.dataset.terminalStateV578=cardState;panelCard.innerHTML=cardHtml}
    var card=document.querySelector('#userPanelOverlayV316 .panel-card-v316'), before=$('panelTelegramSectionV515'), pair=$('terminalPairPanelV561');
    if(card&&terminalCloudAllowed()&&pair){try{pair.remove()}catch(e){}}
    if(card&&!terminalCloudAllowed()&&!pair){var q=document.createElement('div');q.innerHTML=terminalPairPanelHtml();if(before&&before.parentNode)before.parentNode.insertBefore(q.firstChild,before);else card.appendChild(q.firstChild)}
    bindTerminalPairPanel();
    document.querySelectorAll('[data-terminal-google-v578]').forEach(function(btn){if(!btn.__terminalGoogleV556){btn.__terminalGoogleV556=true;btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();goGoogle()},true)}});
  }
  function applyBadge(){
    if(!terminal())return;
    document.documentElement.setAttribute('data-mesaha-terminal-mode','1');
    if(terminalCloudAllowed())document.documentElement.setAttribute('data-mesaha-terminal-cloud','1');else document.documentElement.removeAttribute('data-mesaha-terminal-cloud');
    var u=user(),badge=$('userBadge');
    if(badge&&u.name&&u.seflik){badge.textContent='Terminal • '+u.name+' • '+u.seflik;badge.classList.remove('login-needed')}
    var sync=$('panelSyncTextV316');if(sync)sync.textContent=terminalCloudAllowed()?'Terminal modu: kod eşleşti • Bulut ve Şeflik Klasörü açık':'Terminal modu: yerel kullanım • bulut kapalı';
  }
  function labelBlockedButtons(){
    if(!terminal())return;
    var ok=terminalCloudAllowed();
    [['cloudBackupBtnV316',ok?'Buluta Yedekle':'Google ile giriş yap'],['cloudRestoreBtnV316',ok?'Buluttan Getir':'Google ile giriş yap'],['seflikSendFromRecordsV529',ok?'Şefliğe Gönder':'Google ile giriş yap'],['seflikFolderCreateV529',ok?'Bölme Oluştur':'Google gerekli'],['seflikFolderSendV528',ok?'Şefliğe Gönder':'Google gerekli'],['seflikFolderSyncV528',ok?'Kayıtları Senkronize Et':'Google ile giriş yap']].forEach(function(x){var b=$(x[0]);if(b){b.textContent=x[1];b.title=ok?'Terminal kodu eşleşti. Bulut ve Şeflik Klasörü açıktır.':'Terminal modunda bulut kapalı. Kullanmak için Google ile giriş yapın.'}});
    var st=$('seflikFolderStatusV528');if(st)st.textContent=ok?'Terminal kodu eşleşti. Şeflik Klasörü ve bulut işlemleri açık.':'Terminal modunda Şeflik Klasörü kapalı. Kullanmak için Google ile giriş yapın.';
    var identity=$('seflikFolderIdentityV528');if(identity)identity.textContent=ok?'Terminal kodu eşleşti • '+user().seflik:'Google girişi gerekli';
  }
  function gatePromise(){askGoogle();return Promise.reject(new Error('Bu özellik için Google veya kodla eşleşmiş terminal gerekir.'))}
  function patchObject(obj){if(!obj||obj.__terminalPatchedV556)return;['backup','backupCustom','openCloudRestore','openRestore','restore','list','deleteBackup','backupSupabase','backupDrive','post'].forEach(function(k){if(typeof obj[k]==='function'){obj[k]=gatePromise}});obj.__terminalPatchedV556=true}
  function patchGlobals(){
    if(!terminal()||terminalCloudAllowed())return;
    ['MESAHA_HYBRID_CLOUD_V501','MESAHA_HYBRID_CLOUD_V505','MESAHA_HYBRID_CLOUD_V506','MESAHA_HYBRID_CLOUD_V508','mesahaHybridCloudV501','mesahaHybridCloudV505','mesahaHybridCloudV506','mesahaHybridCloudV508','MESAHA_DRIVE_BRIDGE_V463','mesahaDriveBridgeV463','mesahaOnlineV317','mesahaUserBackupsV318'].forEach(function(n){try{patchObject(window[n])}catch(e){}});
    try{window.mesahaPanelV316=window.mesahaPanelV316||{};window.mesahaPanelV316.cloudBackup=gatePromise;window.mesahaPanelV316.openCloudRestore=function(){askGoogle();return false}}catch(e){}
    try{if(window.MesahaIpV518&&typeof window.MesahaIpV518.ping==='function'&&!window.MesahaIpV518.__terminalPatchedV556){window.MesahaIpV518.ping=function(){return Promise.resolve(false)};window.MesahaIpV518.__terminalPatchedV556=true}}catch(e){}
  }
  function bindGate(){
    if(window.__mesahaTerminalGateClickV556)return;window.__mesahaTerminalGateClickV556=true;
    document.addEventListener('click',function(ev){
      if(!terminal())return;
      var target=ev.target&&ev.target.closest&&ev.target.closest(BLOCK_SELECTORS);
      if(!target)return;
      var isCloud=!!(target.matches&&target.matches(CLOUD_SELECTORS))||!!(target.closest&&target.closest(CLOUD_SELECTORS));
      var isSeflik=!!(target.matches&&target.matches(SEFLIK_SELECTORS))||!!(target.closest&&target.closest(SEFLIK_SELECTORS));
      if((isCloud||isSeflik)&&terminalCloudAllowed())return;
      ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();askGoogle();return false;
    },true);
    document.addEventListener('keydown',function(ev){
      if(!terminal()||!(ev.key==='Enter'||ev.key===' '))return;
      var target=ev.target&&ev.target.closest&&ev.target.closest(BLOCK_SELECTORS);
      if(!target)return;
      var isCloud=!!(target.matches&&target.matches(CLOUD_SELECTORS))||!!(target.closest&&target.closest(CLOUD_SELECTORS));
      var isSeflik=!!(target.matches&&target.matches(SEFLIK_SELECTORS))||!!(target.closest&&target.closest(SEFLIK_SELECTORS));
      if((isCloud||isSeflik)&&terminalCloudAllowed())return;
      ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();askGoogle();return false;
    },true);
  }
  function boot(){style();if(terminal()){applyBadge();ensureCards();labelBlockedButtons();patchGlobals()}bindGate()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  [120,700,1800].forEach(function(ms){setTimeout(boot,ms)});
  window.addEventListener('mesaha:terminal-mode-enabled',boot);
  window.addEventListener('mesaha:terminal-session-revoked',function(){clearTerminal();toast('Terminal oturumu kapatıldı','Bu cihazın kodlu erişimi ana cihazdan kapatıldı. Yeniden giriş için yeni terminal kodu kullanın.','warning')});
  window.addEventListener('mesaha:settings-saved',boot);
  window.MesahaTerminalLocalV556={isActive:terminal,canUseCloud:terminalCloudAllowed,data:terminalData,disable:clearTerminal,google:goGoogle,boot:boot};
})();
;

/* module: mesaha-runtime.js */
/* Mesaha İO V5.78 — Yaşam döngüsü ve kalıcı depolama stabilite bağlayıcısı */
(function(){
  'use strict';
  if(window.__mesahaRuntimeV527)return;
  window.__mesahaRuntimeV527=true;
  var PANEL_KEY='mesaha_panel_user_v316';
  var SETTINGS_KEY='cam_mesaha_ayarlar_v1';
  var INSTALL_KEY='mesaha_install_identity_v527';
  var lastStorageToastAt=0;
  function clean(v){return String(v==null?'':v).trim().replace(/\s+/g,' ');}
  function read(k,f){try{var v=localStorage.getItem(k);return v?JSON.parse(v):f;}catch(e){return f;}}
  function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}
  function valid(name,seflik){
    name=clean(name);seflik=clean(seflik);
    if(name.length<2||seflik.length<2)return false;
    var n=name.toLocaleLowerCase('tr-TR'),s=seflik.toLocaleLowerCase('tr-TR');
    if(/^(kullanıcı|kullanici|user|guest|misafir|boş|bos|-)$/.test(n))return false;
    if(/^(şeflik|seflik|unknown|bilinmiyor|boş|bos|-)$/.test(s))return false;
    return true;
  }
  function installIdentity(){
    var x=read(INSTALL_KEY,null);
    if(x&&x.id)return x;
    x={id:'install_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,12),createdAt:new Date().toISOString()};
    write(INSTALL_KEY,x);return x;
  }
  function toast(t,s,k){try{if(typeof window.mesahaFloatToastV315==='function')return window.mesahaFloatToastV315(t,s||'',k||'warning');if(typeof window.toast==='function')return window.toast(t);}catch(e){}}
  function log(kind,err,extra){try{if(window.MesahaErrorLog)window.MesahaErrorLog.error(kind,err,extra||{});}catch(e){}}
  function cleanLegacy(){
    try{[
      'cam_mesaha_kayitlari_v1_mirror_v515','cam_mesaha_kayitlari_v1_mirror_meta_v515','cam_mesaha_kayitlari_v1_last_ok','cam_mesaha_kayitlari_v1_snapshot_v385',
      'cam_mesaha_ayarlar_v1_mirror_v515','cam_mesaha_ayarlar_v1_mirror_meta_v515'
    ].forEach(function(k){localStorage.removeItem(k);});}catch(e){}
  }
  function settingsCandidates(){
    var out=[];
    try{if(window.state&&window.state.settings)out.push(window.state.settings);}catch(e){}
    try{if(window.MesahaStorageV527&&typeof window.MesahaStorageV527.lastCommittedSettings==='function')out.push(window.MesahaStorageV527.lastCommittedSettings());}catch(e){}
    out.push(read(SETTINGS_KEY,{}));
    return out;
  }
  function bestSettings(){
    var list=settingsCandidates(),fallback={};
    for(var i=0;i<list.length;i++){
      var st=list[i];if(!st||typeof st!=='object'||Array.isArray(st))continue;
      if(!Object.keys(fallback).length)fallback=st;
      if(valid(st.ekipNot,st.seflik))return st;
    }
    return fallback;
  }
  function panelFromSettings(st){
    st=st||bestSettings();
    if(!valid(st&&st.ekipNot,st&&st.seflik))return false;
    var u=read(PANEL_KEY,{});
    if(!valid(u.name,u.seflik)||clean(u.name)!==clean(st.ekipNot)||clean(u.seflik)!==clean(st.seflik)||clean(u.bolmeNo)!==clean(st.bolmeNo)){
      write(PANEL_KEY,{name:clean(st.ekipNot),seflik:clean(st.seflik),bolmeNo:clean(st.bolmeNo),updatedAt:new Date().toISOString(),installId:installIdentity().id,recovered:true});
    }
    return true;
  }
  function validateSavedUser(){
    var u=read(PANEL_KEY,{});
    if(valid(u.name,u.seflik))return true;
    if(u.name||u.seflik){try{localStorage.removeItem(PANEL_KEY);}catch(e){}}
    return panelFromSettings(bestSettings());
  }
  async function reconcileIdentityAfterRecovery(){
    var st=bestSettings(),u=read(PANEL_KEY,{});
    if(valid(st&&st.ekipNot,st&&st.seflik)){
      panelFromSettings(st);
      try{window.dispatchEvent(new CustomEvent('mesaha:identity-restored',{detail:{name:clean(st.ekipNot),seflik:clean(st.seflik),bolmeNo:clean(st.bolmeNo)}}));}catch(e){}
      return true;
    }
    /* Panel doğruysa ama ayar kopyası eksikse, yalnız kurtarma tamamlandıktan sonra
       kimlik alanlarını mevcut ayarlara ekle; diğer kullanıcı tercihlerini silme. */
    if(valid(u.name,u.seflik)){
      var next=Object.assign({},st||{},{ekipNot:clean(u.name),seflik:clean(u.seflik),bolmeNo:clean(u.bolmeNo)});
      try{if(window.state&&window.state.settings)Object.assign(window.state.settings,next);}catch(e){}
      try{if(window.MesahaStorageV527)await window.MesahaStorageV527.saveSettings(next,{reason:'identity-recovery'});else write(SETTINGS_KEY,next);}catch(e){log('identity.recovery-save',e);}
      return true;
    }
    return false;
  }
  async function persistPanelIdentity(button){
    var name=clean((document.getElementById('panelNameV316')||{}).value),seflik=clean((document.getElementById('panelSeflikV316')||{}).value),bolmeNo=clean((document.getElementById('panelBolmeV316')||{}).value);
    if(!valid(name,seflik)){toast('Geçerli kullanıcı adı ve şeflik girin.','Boş veya genel adlarla kullanıcı oluşturulmaz.','warning');return false;}
    var oldSettings=read(SETTINGS_KEY,{}),next=Object.assign({},oldSettings,{ekipNot:name,seflik:seflik,bolmeNo:bolmeNo});
    var oldState=null;
    try{if(window.state&&window.state.settings){oldState=JSON.parse(JSON.stringify(window.state.settings));Object.assign(window.state.settings,next);next=window.state.settings;}}catch(e){}
    try{
      if(button){button.disabled=true;button.setAttribute('aria-busy','true');}
      var result=window.MesahaStorageV527?await window.MesahaStorageV527.saveSettings(next,{reason:'user-panel-save'}):(write(SETTINGS_KEY,next)?{ok:true}:{ok:false});
      if(!result||result.ok===false)throw new Error(result&&result.error||'Kullanıcı bilgisi kalıcı depolamaya yazılamadı');
      write(PANEL_KEY,{name:name,seflik:seflik,bolmeNo:bolmeNo,updatedAt:new Date().toISOString(),installId:installIdentity().id});
      try{localStorage.setItem('mesaha_user_confirmed_v319','1');localStorage.setItem('mesaha_install_id_v527',installIdentity().id);}catch(e){}
      ['ekipNot','seflik','bolmeNo'].forEach(function(id){var el=document.getElementById(id);if(el){el.value=next[id]||'';try{el.dispatchEvent(new Event('input',{bubbles:true}));}catch(e){}}});
      var badge=document.getElementById('userBadge');if(badge){badge.textContent=name+' • '+seflik;badge.classList.remove('login-needed');}
      try{if(typeof window.renderUser==='function')window.renderUser();}catch(e){}
      toast('Kullanıcı bilgileri kaydedildi.','Mesaha adet ve m³ verisi yalnız Mesaha/Yedek işlemlerinde gönderilir.','success');
      try{if(window.MesahaIpV518)window.MesahaIpV518.ping('profile_ping_panel_save');}catch(e){}
      return true;
    }catch(err){
      try{if(window.state&&oldState)window.state.settings=oldState;}catch(e){}
      log('identity.save',err,{name:name,seflik:seflik});
      toast('Kullanıcı bilgisi kaydedilemedi.','Telefon depolamasını kontrol edin.','error');
      return false;
    }finally{if(button){button.disabled=false;button.removeAttribute('aria-busy');}}
  }
  function bindIdentityGate(){
    document.addEventListener('click',function(ev){
      var b=ev.target&&ev.target.closest&&ev.target.closest('#panelSaveV316');
      if(!b)return;
      ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
      persistPanelIdentity(b);
    },true);
  }
  function bindErrors(){
    window.addEventListener('mesaha:storage-warning',function(ev){
      var d=ev.detail||{};log('storage.replica-warning',d.message||'İkinci depolama kopyası gecikti',d);
    });
    window.addEventListener('mesaha:storage-error',function(ev){
      var d=ev.detail||{};log('storage.failure',d.message||'Depolama hatası',d);
      if(d.fatal!==true)return;
      var t=Date.now();if(t-lastStorageToastAt<5000)return;lastStorageToastAt=t;
      toast('Kayıt kaydedilemedi','Uygulamayı açık tutup tekrar deneyin. Sorun sürerse önce yedek alın.','error');
    });
    window.addEventListener('mesaha:storage-recovered',function(ev){
      try{reconcileIdentityAfterRecovery();}catch(e){}
      try{if(ev.detail&&String(ev.detail.reason||'').indexOf('newer')===0)toast('Kayıtlar doğrulandı',String(ev.detail.count||0)+' kayıt güvenli depodan açıldı.','success');}catch(e){}
    });
    window.addEventListener('mesaha:settings-saved',function(){try{panelFromSettings(bestSettings());}catch(e){};},{passive:true});
    if('serviceWorker' in navigator){
      navigator.serviceWorker.addEventListener('message',function(ev){if(ev.data&&ev.data.error)log('service-worker.message',ev.data.error,ev.data);});
      navigator.serviceWorker.ready.catch(function(e){log('service-worker.ready',e);});
    }
  }
  function flushPersistence(reason){
    try{if(typeof window.__flushSettings==='function')Promise.resolve(window.__flushSettings(reason||'lifecycle')).catch(function(){});}catch(e){}
    try{if(window.MesahaStorageV527&&typeof window.MesahaStorageV527.flush==='function')Promise.resolve(window.MesahaStorageV527.flush()).catch(function(){});}catch(e){}
  }
  function bindPersistence(){
    document.addEventListener('visibilitychange',function(){if(document.hidden)flushPersistence('runtime-hidden');},{passive:true});
    window.addEventListener('pagehide',function(){flushPersistence('runtime-pagehide');},{passive:true});
  }
  async function selfTest(){
    var out={version:(window.MESAHA_VERSION&&window.MESAHA_VERSION.visibleVersion)||'',storage:false,serviceWorker:false,identity:false};
    try{out.storage=!!(window.MesahaStorageV527&&window.MesahaStorageV527.info().database);}catch(e){out.storageError=String(e);}
    try{out.serviceWorker=!('serviceWorker' in navigator)||!!(await navigator.serviceWorker.getRegistration('./'));}catch(e){out.serviceWorkerError=String(e);}
    try{var u=read(PANEL_KEY,{});out.identity=!u.name&&!u.seflik||valid(u.name,u.seflik);}catch(e){}
    return out;
  }
  function boot(){
    cleanLegacy();installIdentity();validateSavedUser();bindIdentityGate();bindErrors();bindPersistence();
    try{
      if(window.MesahaStorageV527){
        Promise.resolve(window.MesahaStorageV527.recoverIntoApp()).then(reconcileIdentityAfterRecovery).catch(function(e){log('storage.recover',e);});
      }
    }catch(e){log('storage.recover',e);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.MesahaRuntimeV527={validIdentity:valid,installIdentity:installIdentity,persistPanelIdentity:persistPanelIdentity,reconcileIdentity:reconcileIdentityAfterRecovery,selfTest:selfTest};
})();
;

/* module: mesaha-seflik-folder.js */
/* Mesaha İO V5.84 — Misafir modunda Şeflik Klasörü takılma önleyici güvenli çıkış */
(function(){
  'use strict';
  if(window.MESAHA_SUITE_MODE){
    var suiteFolderStub={suiteManaged:true,sync:async function(){return{ok:true,suiteManaged:true}},autoSync:async function(){return{ok:true,suiteManaged:true}}};
    window.MesahaSeflikFolderV529=suiteFolderStub;window.MesahaSeflikFolderV530=suiteFolderStub;return;
  }
  if(window.MesahaSeflikFolderV529) return;

  var SETTINGS_KEY='cam_mesaha_ayarlar_v1';
  var RECORDS_KEY='cam_mesaha_kayitlari_v1';
  var PANEL_KEY='mesaha_panel_user_v316';
  var SESSION_KEY='mesaha_supabase_v500_session';
  var CACHE_KEY='mesaha_seflik_folder_cache_v529';
  var LAST_BOLME_KEY='mesaha_seflik_folder_last_bolme_v529';
  var PENDING_DIVISIONS_KEY='mesaha_seflik_folder_pending_divisions_v530';
  var ACTIVE_SEFLIK_KEY='mesaha_active_seflik_folder_v564';
  var OFFLINE_REFRESH_KEY='mesaha_seflik_folder_needs_online_refresh_v569';
  var SERVER_DELETED_MESAHA_KEY='mesaha_suite_server_deleted_v28';
  var ACCESS_KEY='mesaha_google_access_v548';
  var TERMINAL_KEY='mesaha_terminal_local_mode_v556';
  var CHUNK_SIZE=180;
  var divisions=[];
  var busy=false;
  var modalBusy=false;
  var openBusy=false;
  var syncPromise=null;
  var syncToastRequested=false;
  var lastSyncAt=0;
  var previewDirty=true;
  var previewTimer=0;
  var previewCache={list:null,count:-1,totalVolume:0};

  function $(id){return document.getElementById(id)}
  function clean(v){return String(v==null?'':v).trim()}
  function fold(v){return clean(v).toLocaleLowerCase('tr-TR').replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ş/g,'s').replace(/ü/g,'u')}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
  function readJson(k,f){try{var v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}}
  function writeJson(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
  function settings(){var base=(window.state&&window.state.settings)||readJson(SETTINGS_KEY,{});return Object.assign({ekipNot:'',seflik:'',bolmeNo:''},base||{})}
  function records(){var r=(window.state&&Array.isArray(window.state.records))?window.state.records:readJson(RECORDS_KEY,[]);return Array.isArray(r)?r:[]}
  function activeSeflikFolder(){return readJson(ACTIVE_SEFLIK_KEY,{})||{}}
  function terminal(){var x=readJson(TERMINAL_KEY,{})||{};return x&&x.active?x:{}}
  function terminalAuth(){var t=terminal();if(t.active&&clean(t.source)==='pair_code'&&(t.terminalCode||t.terminalToken))return{terminalCode:clean(t.terminalCode),terminalToken:clean(t.terminalToken),terminalPairedUserId:clean(t.pairedUserId),terminalPairedEmail:clean(t.pairedEmail)};return {}}
  function user(){var p=readJson(PANEL_KEY,{}),s=settings(),f=activeSeflikFolder();return{name:clean(p.googleFullName||p.name||s.ekipNot),seflik:clean(f.seflik||p.activeSeflik||p.seflik||s.seflik),bolmeNo:clean(p.bolmeNo||s.bolmeNo),seflikKey:clean(f.seflik_key||f.seflikKey),folder:f}}
  function validIdentity(u){return clean(u&&u.name).length>1&&clean(u&&u.seflik).length>1}
  function token(){var s=readJson(SESSION_KEY,null);return clean(s&&s.access_token)}
  function access(){return readJson(ACCESS_KEY,{})||{}}
  function hasApprovedIdentity(){var u=user(),a=access(),p=readJson(PANEL_KEY,{}),t=terminal();return clean(u.name).length>1&&clean(u.seflik).length>1&&(clean(a.status)==='approved'||p.googleApproved===true||p.terminalPairedUserId||(t.active&&clean(t.source)==='pair_code'&&(t.pairedUserId||t.terminalToken)))}
  function pairedTerminal(){var t=terminal();return !!(t.active&&clean(t.source)==='pair_code'&&(t.pairedUserId||t.terminalToken||t.terminalCode))}
  function guestBlockedMessageV582(){var t=terminal();return t.active&&!pairedTerminal()?'Misafir modunda Şeflik Klasörü buluta bağlanmaz. Terminal kodu eşleştirin veya Google ile giriş yapın. En son mevcut bilgiler gösteriliyor.':'Şeflik Klasörü için Google girişi veya kodla eşleşmiş terminal gerekir. En son mevcut bilgiler gösteriliyor.'}
  function renderGuestBlockedV582(silent){
    markNeedsOnlineRefresh(true);
    try{hideTransferOverlay();setProgress(0)}catch(e){}
    var cached=readJson(CACHE_KEY,null), msg=guestBlockedMessageV582();
    if(cached&&Array.isArray(cached.divisions)){divisions=mergeRemoteDivisions(cached.divisions)}else{divisions=mergeRemoteDivisions(divisions)}
    renderList();updatePreview(true);setStatus(msg,'error');
    var meta=$('seflikFolderRemoteMetaV528');if(meta)meta.textContent=msg;
    var box=$('seflikFolderListV528');if(box&&!openDivisions().length)box.innerHTML='<div class="seflik-folder-empty">Şeflik Klasörü kapalı<br><small>'+esc(msg)+'</small></div>';
    if(!silent)notify('Şeflik Klasörü kapalı',msg,'warning');
    return false;
  }
  function markNeedsOnlineRefresh(on){try{if(on)localStorage.setItem(OFFLINE_REFRESH_KEY,JSON.stringify({at:new Date().toISOString(),seflik:user().seflik}));else localStorage.removeItem(OFFLINE_REFRESH_KEY)}catch(e){}}
  function needsOnlineRefresh(){try{return !!localStorage.getItem(OFFLINE_REFRESH_KEY)}catch(e){return false}}
  async function recoverAuthForFolder(){try{var api=window.mesahaSupabaseV380||window.mesahaSupabaseV383||window.mesahaSupabase;if(api&&typeof api.ready==='function')await api.ready();if(window.MesahaGoogleAuthV548&&typeof window.MesahaGoogleAuthV548.boot==='function'){await window.MesahaGoogleAuthV548.boot(true)}}catch(e){}return !!token()||hasApprovedIdentity()}
  function anonKey(){var c=window.MESAHA_SUPABASE_CONFIG||{};return clean(c.anonKey||c.anon_key)}
  function uuid(){try{return crypto.randomUUID()}catch(e){return 'sync_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2)}}
  function num(v){var n=Number(String(v==null?'':v).replace(',','.'));return Number.isFinite(n)?n:0}
  function volume(r){try{if(typeof window.volume==='function')return Number(window.volume(r)||0)}catch(e){}var d=num(r.diameter||r.cap),l=num(r.length||r.boy),q=num(r.quantity||r.adet||1);return d&&l?Math.PI*Math.pow(d/100,2)/4*l*q:0}
  function fmt(v,d){return num(v).toLocaleString('tr-TR',{minimumFractionDigits:d||0,maximumFractionDigits:d||0})}
  function dateText(v){var d=new Date(v||0);return Number.isNaN(d.getTime())?'-':d.toLocaleString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
  function notify(title,sub,kind){try{var f=window.mesahaFloatToastV315||window.mesahaFloatToastV314;if(typeof f==='function')return f(title,sub||'',kind||'success')}catch(e){}try{if(typeof window.toast==='function')return window.toast(title+(sub?' — '+sub:''))}catch(e){}alert(title+(sub?'\n'+sub:''))}
  function setStatus(text,kind){var el=$('seflikFolderStatusV528');if(!el)return;el.textContent=text;el.dataset.kind=kind||''}
  function setProgress(value){var box=$('seflikFolderProgressV528'),bar=box&&box.querySelector('span');if(!box||!bar)return;var n=Math.max(0,Math.min(100,Number(value)||0));box.classList.toggle('show',n>0&&n<100);bar.style.width=n+'%';if(n>=100)setTimeout(function(){box.classList.remove('show');bar.style.width='0'},500)}
  function ensureTransferOverlay(){
    var ov=$('seflikTransferOverlayV534');if(ov)return ov;
    ov=document.createElement('div');ov.id='seflikTransferOverlayV534';ov.className='seflik-transfer-overlay-v534 hidden';ov.setAttribute('role','status');ov.setAttribute('aria-live','polite');ov.setAttribute('aria-busy','true');
    ov.innerHTML='<div class="seflik-transfer-card-v534"><span class="seflik-transfer-spinner-v534" aria-hidden="true"></span><h3 id="seflikTransferTitleV534">Veriler yükleniyor…</h3><p id="seflikTransferTextV534">Lütfen bekleyin.</p><div class="seflik-transfer-progress-v534"><span id="seflikTransferBarV534"></span></div><small>Bu işlem tamamlanana kadar uygulamayı kapatmayın.</small></div>';
    document.body.appendChild(ov);return ov;
  }
  function showTransferOverlay(title,text,percent){var ov=ensureTransferOverlay(),t=$('seflikTransferTitleV534'),p=$('seflikTransferTextV534'),bar=$('seflikTransferBarV534');if(t)t.textContent=title||'Veriler yükleniyor…';if(p)p.textContent=text||'Lütfen bekleyin.';if(bar)bar.style.width=Math.max(4,Math.min(100,Number(percent)||4))+'%';ov.classList.remove('hidden');document.body.classList.add('seflik-transfer-busy-v534')}
  function updateTransferOverlay(title,text,percent){var ov=$('seflikTransferOverlayV534');if(!ov||ov.classList.contains('hidden'))return;var t=$('seflikTransferTitleV534'),p=$('seflikTransferTextV534'),bar=$('seflikTransferBarV534');if(title&&t)t.textContent=title;if(text&&p)p.textContent=text;if(bar&&percent!=null)bar.style.width=Math.max(4,Math.min(100,Number(percent)||4))+'%'}
  function hideTransferOverlay(){var ov=$('seflikTransferOverlayV534');if(ov)ov.classList.add('hidden');document.body.classList.remove('seflik-transfer-busy-v534')}
  function deviceInfo(){var ua=navigator.userAgent||'',os=/Android/i.test(ua)?'Android':/iPhone|iPad|iPod/i.test(ua)?'iOS':/Windows/i.test(ua)?'Windows':/Mac OS/i.test(ua)?'macOS':'Diğer';return{deviceId:clean(localStorage.getItem('mesaha_cihaz_kodu_v1')||localStorage.getItem('mesaha_supabase_v500_device')),os:os,platform:navigator.platform||os,userAgent:ua,appVersion:(window.MESAHA_VERSION&&window.MESAHA_VERSION.visibleVersion)||'Mesaha İO',fileVersion:(window.MESAHA_VERSION&&window.MESAHA_VERSION.version)||'local'}}

  async function ensureToken(){
    var t=token();if(t)return t;
    try{if(window.mesahaSupabaseV380&&window.mesahaSupabaseV380.ready)await window.mesahaSupabaseV380.ready()}catch(e){}
    t=token();if(!t)throw new Error('Supabase oturumu hazırlanamadı. İnterneti kontrol edip tekrar deneyin.');return t;
  }
  function withTimeout(promise,ms,message){
    var timer=0;
    return Promise.race([Promise.resolve(promise),new Promise(function(_,reject){timer=setTimeout(function(){reject(new Error(message||'Sunucu isteği zaman aşımı'))},ms)})]).finally(function(){if(timer)clearTimeout(timer)});
  }
  async function edge(action,payload){
    var u=user(),info=deviceInfo();
    var body=Object.assign({name:u.name,seflik:u.seflik,seflikKey:u.seflikKey,folderSeflik:u.seflik,bolmeNo:u.bolmeNo,deviceId:info.deviceId,deviceInfo:info,appVersion:info.appVersion,fileVersion:info.fileVersion,source:'mesaha-seflik-folder-v582'},terminalAuth(),payload||{});
    var api=window.mesahaSupabaseV380||window.mesahaSupabaseV383||window.mesahaSupabase;
    if(!api||typeof api.edge!=='function')throw new Error('Güvenli sunucu bağlantısı hazır değil');
    return await withTimeout(api.edge(action,body),35000,'Sunucu isteği zaman aşımı');
  }

  function divisionId(x){return fold(x&&x.bolme_no).replace(/[^a-z0-9_-]+/g,'_')}
  function normalizeDivision(x,fallbackBolme){x=Object.assign({},x||{});x.bolme_no=clean(x.bolme_no||fallbackBolme);x.status=fold(x.status||'open')==='open'?'open':clean(x.status||'open');x.record_count=num(x.record_count);x.total_volume=num(x.total_volume);x.contributors=Array.isArray(x.contributors)?x.contributors.filter(Boolean):[];return x}
  function pendingDivisions(){var u=user(),p=readJson(PENDING_DIVISIONS_KEY,{}),list=p&&p.seflik===u.seflik&&Array.isArray(p.divisions)?p.divisions:[];return list.map(function(x){return normalizeDivision(x)}).filter(function(x){return !!x.bolme_no})}
  function savePending(list){writeJson(PENDING_DIVISIONS_KEY,{seflik:user().seflik,updatedAt:new Date().toISOString(),divisions:(list||[]).map(function(x){return normalizeDivision(x)})})}
  function authoritativeFolderListV68(out){return !!(out&&out.sync_contract==='orman-io-sync-v68'&&out.complete===true&&out.partial!==true&&out.truncated!==true)}
  function mergeRemoteDivisions(remote,authoritative){var remoteList=(Array.isArray(remote)?remote:[]).map(function(x){return normalizeDivision(x)}),map=new Map();remoteList.forEach(function(x){if(x.bolme_no)map.set(divisionId(x),x)});if(!authoritative)(Array.isArray(divisions)?divisions:[]).forEach(function(x){x=normalizeDivision(x);var k=divisionId(x);if(k&&!map.has(k))map.set(k,x)});var unresolved=[];pendingDivisions().forEach(function(x){var k=divisionId(x);if(!map.has(k)){x.local_pending=true;map.set(k,x);unresolved.push(x)}});savePending(unresolved);return Array.from(map.values())}
  function cacheAndRender(){var u=user();writeJson(CACHE_KEY,{at:new Date().toISOString(),seflik:u.seflik,divisions:divisions});renderList()}
  function upsertLocalDivision(row,asPending){var x=normalizeDivision(row),k=divisionId(x),found=false;divisions=divisions.map(function(d){if(divisionId(d)===k){found=true;return Object.assign({},d,x)}return d});if(!found)divisions.unshift(x);if(asPending){var p=pendingDivisions(),pf=false;p=p.map(function(d){if(divisionId(d)===k){pf=true;return Object.assign({},d,x,{local_pending:true})}return d});if(!pf)p.unshift(Object.assign({},x,{local_pending:true}));savePending(p)}cacheAndRender();return x}
  function openDivisions(){return divisions.filter(function(x){return fold(x.status||'open')==='open'})}
  function selectedBolme(){return clean(($('seflikFolderBolmeV528')||{}).value)}
  function currentLocalList(){return records().slice()}
  function previewVisible(){
    var view=$('seflikFolderView'),modal=$('seflikSendOverlayV529');
    return !!((view&&view.classList.contains('active'))||(modal&&!modal.classList.contains('hidden')));
  }
  function localSummary(force){
    var list=records();
    if(force||previewDirty||previewCache.list!==list||previewCache.count!==list.length){
      previewCache={list:list,count:list.length,totalVolume:list.reduce(function(a,r){return a+volume(r)},0)};
      previewDirty=false;
    }
    return previewCache;
  }
  function updatePreview(force){
    if(!force&&!previewVisible()){previewDirty=true;return}
    var bolme=selectedBolme(),summary=localSummary(!!force);
    var el=$('seflikFolderLocalPreviewV528');
    if(el)el.textContent=bolme?(summary.count.toLocaleString('tr-TR')+' kayıt • '+fmt(summary.totalVolume,3)+' m³ • Bölme '+bolme):(!user().seflik?'Önce Şeflik Klasöründen şeflik seçin/oluşturun':'Önce açık bir bölme seçin');
    var btn=$('seflikFolderSendV528');if(btn)btn.disabled=busy||!bolme||!summary.count||!openDivisions().some(function(x){return clean(x.bolme_no)===bolme});
  }
  function schedulePreview(){
    previewDirty=true;
    if(!previewVisible())return;
    clearTimeout(previewTimer);previewTimer=setTimeout(function(){updatePreview(true)},60);
  }
  function fillIdentity(){
    var u=user(),name=$('seflikFolderIdentityV528');if(name)name.textContent=u.seflik?('Aktif Şeflik: '+u.seflik):'Önce Orman İO ana menüsünden şeflik seçin';
    var select=$('seflikFolderBolmeV528');
    if(select){
      var previous=clean(select.value||localStorage.getItem(LAST_BOLME_KEY)||u.bolmeNo);
      var opts=openDivisions().slice().sort(function(a,b){return clean(a.bolme_no).localeCompare(clean(b.bolme_no),'tr',{numeric:true})});
      select.innerHTML='<option value="">Açık bölme seçin</option>'+opts.map(function(x){return '<option value="'+esc(x.bolme_no)+'">Bölme '+esc(x.bolme_no)+' • '+num(x.record_count).toLocaleString('tr-TR')+' kayıt • '+fmt(x.total_volume,3)+' m³</option>'}).join('');
      if(opts.some(function(x){return clean(x.bolme_no)===previous}))select.value=previous;
    }
    updatePreview();
  }
  function renderSummaryHeader(){
    var list=openDivisions(),count=list.reduce(function(a,x){return a+num(x.record_count)},0),m3=list.reduce(function(a,x){return a+num(x.total_volume)},0),users=new Set();
    list.forEach(function(x){(x.contributors||[]).forEach(function(n){users.add(n)})});
    var a=$('seflikFolderMetricBolmeV528'),b=$('seflikFolderMetricCountV528'),c=$('seflikFolderMetricM3V528');if(a)a.textContent=list.length;if(b)b.textContent=count.toLocaleString('tr-TR');if(c)c.textContent=fmt(m3,3)+' m³';
    var meta=$('seflikFolderRemoteMetaV528');if(meta)meta.textContent=(users.size?users.size+' kullanıcı • ':'')+(list.length?list.length+' açık bölme':'Henüz açık bölme yok');
  }
  function renderList(){
    renderSummaryHeader();fillIdentity();var box=$('seflikFolderListV528');if(!box)return;
    var list=openDivisions();
    if(!list.length){box.innerHTML='<div class="seflik-folder-empty">Henüz Orman İO üzerinden oluşturulmuş açık bölme yok.<br><small>Bölme yönetimi Orman İO ana menüsündedir.</small></div>';return}
    box.innerHTML=list.map(function(x){var contributors=(x.contributors||[]).filter(Boolean),drive=!!x.drive_backed_up,empty=num(x.record_count)===0;return '<article class="seflik-division-card">'+
      '<div class="seflik-division-top"><div class="seflik-division-title"><span class="seflik-division-icon">📁</span><div><b>Bölme '+esc(x.bolme_no||'-')+(x.local_pending?' <span class="seflik-local-pending-v530">Sunucu doğrulanıyor</span>':'')+'</b><small>'+esc(contributors.length?contributors.join(', '):(x.created_by_name?('Oluşturan: '+x.created_by_name):'Henüz mesaha gönderilmedi'))+'</small></div></div><span class="seflik-open-pill">Açık</span></div>'+
      '<div class="seflik-division-stats"><div class="seflik-division-stat"><small>MESaha ADEDİ</small><b>'+num(x.record_count).toLocaleString('tr-TR')+'</b></div><div class="seflik-division-stat"><small>TOPLAM m³</small><b>'+fmt(x.total_volume,3)+'</b></div><div class="seflik-division-stat"><small>KULLANICI</small><b>'+contributors.length+'</b></div></div>'+
      '<div class="seflik-division-meta"><span>Son işlem: '+esc(dateText(x.updated_at||x.created_at))+'</span><span>'+(drive?'✓ Drive yedekli':'Drive yedeği bekleniyor')+'</span></div>'+
      '<div class="seflik-division-actions seflik-division-actions-v529'+(!empty?' has-delete-v28':'')+'"><button class="btn primary" type="button" data-seflik-continue="'+esc(x.bolme_no)+'">'+(empty?'Mesahaya Başla':'Mesahaya Devam Et')+'</button>'+(!empty?'<button class="btn seflik-delete-btn-v533" type="button" data-seflik-delete-records="'+esc(x.bolme_no)+'">Sunucudaki Mesahayı Sil</button>':'')+'</div></article>'}).join('');
  }

  function syncFolder(showToast,options){
    options=options||{};
    syncToastRequested=syncToastRequested||!!showToast;
    if(syncPromise)return syncPromise;
    syncPromise=(async function(){
      var u=user();
      if(!clean(u.name)){
        setStatus('Kullanıcı bilgisi eksik. Google veya terminal kodu ile giriş yapın.','error');
        if(!options.silent)notify('Önce Google veya terminal kodu ile giriş yapın','Şeflik Klasörü için kullanıcı ad-soyad gerekli.','warning');
        return false;
      }
      if(!clean(u.seflik)){
        setStatus('Önce şeflik oluşturun veya seçin.','error');
        if(!options.silent)notify('Önce şeflik oluşturun veya seçin','Şeflik Klasörü içinde bir şeflik seçmeden bölme listesi alınamaz.','warning');
        return false;
      }
      if(!hasApprovedIdentity()){
        return renderGuestBlockedV582(!!options.silent);
      }
      if(!navigator.onLine){
        markNeedsOnlineRefresh(true);var cached=readJson(CACHE_KEY,null);
        if(cached&&Array.isArray(cached.divisions)){divisions=cached.divisions;renderList();setStatus('Çevrimdışı: son senkronize edilen klasör gösteriliyor. İnternet gelince otomatik güncellenecek.','');return true}
        throw new Error('Bağlantı yok. Daha sonra tekrar deneyiniz.');
      }
      setStatus('Şeflik klasörü senkronize ediliyor…','busy');
      try{
        var out=await edge('seflik_folder_list',{}),remote=Array.isArray(out.divisions)?out.divisions:(Array.isArray(out.summaries)?out.summaries:[]),authoritative=authoritativeFolderListV68(out);
        divisions=mergeRemoteDivisions(remote,authoritative);cacheAndRender();markNeedsOnlineRefresh(!authoritative);lastSyncAt=Date.now();
        setStatus((authoritative?'Senkronizasyon tamamlandı':'Eksik sunucu cevabı: cihazdaki bölmeler korundu')+' • '+new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}),authoritative?'success':'busy');
        if(syncToastRequested)notify('Şeflik klasörü güncellendi',openDivisions().length+' açık bölme bulundu.','success');
        return true;
      }catch(e){
        var msg=String(e&&e.message?e.message:e);
        if(/oluşturulmamış|sadece içindeki kullanıcılar|şeflik klasörü bulunamadı|404|403/i.test(msg)){
          try{
            setStatus('Şeflik yetkisi onarılıyor…','busy');
            await edge('seflik_folder_ensure_active',{});
            var outFix=await edge('seflik_folder_list',{}),remoteFix=Array.isArray(outFix.divisions)?outFix.divisions:(Array.isArray(outFix.summaries)?outFix.summaries:[]),authoritativeFix=authoritativeFolderListV68(outFix);
            divisions=mergeRemoteDivisions(remoteFix,authoritativeFix);cacheAndRender();markNeedsOnlineRefresh(!authoritativeFix);lastSyncAt=Date.now();
            setStatus((authoritativeFix?'Senkronizasyon tamamlandı':'Eksik sunucu cevabı: cihazdaki bölmeler korundu')+' • '+new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}),authoritativeFix?'success':'busy');
            if(syncToastRequested)notify('Şeflik klasörü güncellendi',openDivisions().length+' açık bölme bulundu.','success');
            return true;
          }catch(_fixError){}
        }
        if(/Google ile giriş|oturum|jwt|token|auth|401|403/i.test(msg)&&hasApprovedIdentity()){
          setStatus('Oturum yenileniyor…','busy');await recoverAuthForFolder();
          var out2=await edge('seflik_folder_list',{}),remote2=Array.isArray(out2.divisions)?out2.divisions:(Array.isArray(out2.summaries)?out2.summaries:[]),authoritative2=authoritativeFolderListV68(out2);
          divisions=mergeRemoteDivisions(remote2,authoritative2);cacheAndRender();markNeedsOnlineRefresh(!authoritative2);lastSyncAt=Date.now();
          setStatus((authoritative2?'Senkronizasyon tamamlandı':'Eksik sunucu cevabı: cihazdaki bölmeler korundu')+' • '+new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}),authoritative2?'success':'busy');
          if(syncToastRequested)notify('Şeflik klasörü güncellendi',openDivisions().length+' açık bölme bulundu.','success');
          return true;
        }
        throw e;
      }
    })().finally(function(){syncPromise=null;syncToastRequested=false});
    return syncPromise;
  }

  async function createDivision(){
    if(busy)return;
    var u=user(),input=$('seflikFolderNewBolmeV529'),bolme=clean(input&&input.value);
    if(!clean(u.name)){notify('Kullanıcı bilgisi eksik','Önce Google ile giriş yapın.','warning');return}if(!clean(u.seflik)){notify('Şeflik seçilmedi','Önce Şeflik Klasöründe şeflik oluşturun veya seçin.','warning');return}
    if(!bolme){notify('Bölme numarası gerekli','Oluşturulacak bölme numarasını yazın.','warning');if(input)input.focus();return}
    if(!navigator.onLine){notify('İnternet bağlantısı yok','Bölme oluşturmak için çevrimiçi olun.','warning');return}
    busy=true;var btn=$('seflikFolderCreateV529');if(btn)btn.disabled=true;setStatus('Bölme oluşturuluyor…','busy');
    try{
      var out=await edge('seflik_folder_create_division',{bolmeNo:bolme});
      if(input)input.value='';
      var created=normalizeDivision(out&&out.division?out.division:{bolme_no:bolme,status:'open',created_by_name:u.name,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),record_count:0,total_volume:0,contributors:[]},bolme);
      upsertLocalDivision(Object.assign({},created,{local_pending:true}),true);
      var confirmed=false;
      for(var attempt=0;attempt<3&&!confirmed;attempt++){
        if(attempt)await new Promise(function(resolve){setTimeout(resolve,attempt*450)});
        try{await syncFolder(false);confirmed=openDivisions().some(function(x){return divisionId(x)===divisionId({bolme_no:bolme})&&!x.local_pending})}catch(syncError){}
      }
      var select=$('seflikFolderBolmeV528');if(select){select.value=bolme;localStorage.setItem(LAST_BOLME_KEY,bolme)}
      updatePreview();
      setStatus(confirmed?('Bölme '+bolme+' ortak klasörde açıldı.'):('Bölme '+bolme+' oluşturuldu; sunucu listesi doğrulanıyor.'),confirmed?'success':'busy');
      notify(out.duplicate?'Bölme zaten açıktı':'Bölme oluşturuldu','Bölme '+bolme+' artık listede ve senkronizasyona açık.','success');
    }catch(e){setStatus('Bölme oluşturulamadı: '+String(e&&e.message?e.message:e),'error');notify('Bölme oluşturulamadı',String(e&&e.message?e.message:e),'error')}
    finally{busy=false;if(btn)btn.disabled=false;updatePreview()}
  }

  async function driveBackupCustom(list,bolme){
    var suite=window.MesahaSuiteSync||window.MesahaSuiteSyncV31||window.MesahaSuiteSyncV28||window.MesahaSuiteSyncV27;
    if(window.MESAHA_SUITE_MODE&&suite&&typeof suite.createMesahaBackup==='function'){
      var out=await suite.createMesahaBackup({records:Array.isArray(list)?list.slice():[],bolmeNo:bolme,source:'seflik-folder-send',silent:true});
      return {id:clean(out&&out.fileId||out&&out.id),name:clean(out&&out.fileName||out&&out.name),raw:out};
    }
    var bridge=window.mesahaDriveBridgeV463||window.MESAHA_DRIVE_BRIDGE_V463;
    if(!bridge||typeof bridge.backupCustom!=='function')throw new Error('Güvenli Drive köprüsü hazır değil');
    return bridge.backupCustom({records:list,bolmeNo:bolme,type:'mesaha-seflik-folder-backup',silent:true,sharedFolder:true});
  }

  async function persistActiveBolme(bolme){
    var currentSettings=Object.assign({},settings(),{bolmeNo:bolme,seflik:user().seflik});
    try{
      if(window.state)window.state.settings=Object.assign(window.state.settings||{},currentSettings);
      if(window.MesahaStorageV527&&window.MesahaStorageV527.saveSettings){var r=await window.MesahaStorageV527.saveSettings(currentSettings,{reason:'seflik-active-division'});if(r&&r.ok===false)throw new Error(r.error||'Bölme ayarı kaydedilemedi')}
      else localStorage.setItem(SETTINGS_KEY,JSON.stringify(currentSettings));
      var p=readJson(PANEL_KEY,{});p.bolmeNo=bolme;p.seflik=user().seflik;writeJson(PANEL_KEY,p);
      var b=$('bolmeNo');if(b)b.value=bolme;var sf=$('seflik');if(sf&&!clean(sf.value))sf.value=user().seflik;
      return true;
    }catch(e){return false}
  }

  async function sendToDivision(bolme,list,origin){
    if(busy)return false;
    var u=user();bolme=clean(bolme);list=Array.isArray(list)?list.slice():[];
    if(!validIdentity(u)){notify('Kullanıcı bilgisi eksik','Önce kullanıcı panelinden ad ve şeflik kaydedin.','warning');return false}
    if(!bolme){notify('Bölme seçilmedi','Açık bir bölme seçin.','warning');return false}
    if(!openDivisions().some(function(x){return clean(x.bolme_no)===bolme})){notify('Bölme açık değil','Önce Orman İO ana menüsünden bölmeyi oluşturup Offline İndir yapın.','warning');return false}
    if(!navigator.onLine){notify('İnternet bağlantısı yok','Sunucu ve Drive yedeği için çevrimiçi olun.','warning');return false}
    if(!list.length){notify('Gönderilecek kayıt yok','Ölçümler sayfasında kayıt bulunamadı.','warning');return false}
    var suiteStatsApi=window.MesahaSuiteSync||window.MesahaSuiteSyncV31||window.MesahaSuiteSyncV28||window.MesahaSuiteSyncV27;
    var exactStats=suiteStatsApi&&typeof suiteStatsApi.canonicalMesahaStats==='function'
      ? suiteStatsApi.canonicalMesahaStats(list)
      : {rowCount:list.length,itemCount:list.reduce(function(a,r){return a+Math.max(1,Math.round(num(r&&((r.quantity!=null?r.quantity:r.adet!=null?r.adet:1)))||1))},0),totalVolume:Number(list.reduce(function(a,r){return a+Number(volume(r).toFixed(3))},0).toFixed(3))};
    var rowCount=Number(exactStats.rowCount||list.length),itemCount=Number(exactStats.itemCount||rowCount),total=Number(exactStats.totalVolume||0);
    if(!confirm('Bölme '+bolme+' için '+itemCount+' adet ('+rowCount+' kayıt satırı • '+fmt(total,3)+' m³) Şeflik Klasörüne gönderilecek ve Drive yedeği alınacak. Devam edilsin mi?'))return false;
    busy=true;showTransferOverlay('Veriler gönderiliyor…','Sunucu yüklemesi hazırlanıyor.',6);updatePreview();setStatus('Sunucu yüklemesi hazırlanıyor…','busy');setProgress(1);var syncToken=uuid(),drive=null,driveError='';
    try{
      for(var i=0;i<list.length;i+=CHUNK_SIZE){
        var chunk=list.slice(i,i+CHUNK_SIZE).map(function(r){return Object.assign({},r,{bolmeNo:bolme,seflik:u.seflik})});
        await edge('seflik_folder_push',{bolmeNo:bolme,syncToken:syncToken,records:chunk,chunkIndex:Math.floor(i/CHUNK_SIZE),chunkCount:Math.ceil(list.length/CHUNK_SIZE)});
        var sent=Math.min(i+chunk.length,list.length),pct=Math.min(78,Math.round((sent/list.length)*78));setProgress(pct);setStatus('Sunucuya gönderiliyor… '+sent+' / '+list.length,'busy');updateTransferOverlay('Veriler gönderiliyor…',sent+' / '+list.length+' kayıt sunucuya aktarılıyor.',Math.max(8,pct));
      }
      setStatus('Google Drive yedeği alınıyor…','busy');setProgress(82);updateTransferOverlay('Drive yedeği alınıyor…','Sunucu gönderimi tamamlandı, yedek hazırlanıyor.',84);
      try{drive=await driveBackupCustom(list.map(function(r){return Object.assign({},r,{bolmeNo:bolme,seflik:u.seflik})}),bolme)}catch(e){driveError=String(e&&e.message?e.message:e)}
      setProgress(92);updateTransferOverlay('Gönderim tamamlanıyor…','Bölme bilgileri kaydediliyor.',94);
      await edge('seflik_folder_finish',{bolmeNo:bolme,syncToken:syncToken,rowCount:rowCount,itemCount:itemCount,recordCount:itemCount,totalVolume:Number(total.toFixed(3)),driveFileId:clean(drive&&drive.id),driveFileName:clean(drive&&drive.name),driveStatus:driveError?'failed':'ok',driveError:driveError});
      localStorage.setItem(LAST_BOLME_KEY,bolme);await persistActiveBolme(bolme);setProgress(100);updateTransferOverlay('Gönderim tamamlandı','Şeflik Klasörü yenileniyor.',100);await syncFolder(false);
      closeSendModal();
      if(driveError){
        var retrySuite=window.MesahaSuiteSync||window.MesahaSuiteSyncV31||window.MesahaSuiteSyncV28||window.MesahaSuiteSyncV27;
        if(retrySuite&&typeof retrySuite.markDirty==='function')retrySuite.markDirty('mesaha',{manual:true,manualSend:true,sefligeGonder:true,source:'seflige-gonder',bolmeNo:bolme,backupFailed:1,backupError:driveError});
        setStatus('Sunucu tamamlandı; Drive yedeği bekliyor: '+driveError,'error');
        notify('Sunucuya gönderildi','Drive yedeği tamamlanamadı ve yeniden deneme kuyruğuna alındı.','warning');
      }
      else{setStatus('Sunucu ve Drive yedeği tamamlandı.','success');notify('Şeflik Klasörüne gönderildi','Bölme '+bolme+' • '+itemCount+' adet • '+rowCount+' kayıt satırı • Drive yedekli','success')}
      return true;
    }catch(e){setStatus('Gönderim başarısız: '+String(e&&e.message?e.message:e),'error');notify('Şeflik Klasörüne gönderilemedi',String(e&&e.message?e.message:e),'error');return false}
    finally{busy=false;modalBusy=false;hideTransferOverlay();updatePreview();setProgress(0);var confirmBtn=$('seflikSendConfirmV529');if(confirmBtn)confirmBtn.disabled=false}
  }
  function sendFolder(){return sendToDivision(selectedBolme(),currentLocalList(),'folder')}

  function normalizeRemoteRecord(row,bolme,index){
    var d=Object.assign({},row&&row.record_data?row.record_data:row||{});
    var id=clean(d.id||d.barcode||row.record_key||('seflik_'+bolme+'_'+index));
    d.id=id;d.bolmeNo=bolme;d.seflik=user().seflik;d.sharedFolderSource=true;d.sharedFolderLoadedAt=new Date().toISOString();d.sharedUploadedByName=clean(row&&row.uploaded_by_name)||clean(d.sharedUploadedByName);
    return d;
  }
  function mergeByBarcodeV17(base,incoming){
    var map=new Map();
    function key(r,i){r=r||{};var b=clean(r.barcode||r.barkodNo||r.barkod_no);if(b)return 'b::'+b.toLocaleUpperCase('tr-TR');var id=clean(r.id);return id?'i::'+id:'r::'+i}
    (Array.isArray(base)?base:[]).forEach(function(r,i){map.set(key(r,'b'+i),r)});
    (Array.isArray(incoming)?incoming:[]).forEach(function(r,i){map.set(key(r,'i'+i),r)});
    return Array.from(map.values())
  }
  async function continueDivision(bolme){
    bolme=clean(bolme);if(!bolme)return;
    var localRecords=records(),localCount=localRecords.length;
    if(!navigator.onLine){notify('İnternet bağlantısı yok','Mesahaya devam etmek için bölme kayıtları sunucudan alınmalı.','warning');return}
    setStatus('Bölme '+bolme+' kayıtları indiriliyor…','busy');
    try{
      var out=await edge('seflik_folder_read',{bolmeNo:bolme});
      if(!Array.isArray(out.records))throw new Error('Sunucu geçerli bölme kayıtları döndürmedi');
      if(!authoritativeFolderListV68(out))throw new Error('Bölme verisi V68 tam liste sözleşmesiyle doğrulanamadı; cihazdaki kayıtlar değiştirilmedi');
      var rows=out.records;
      var remoteRecords=rows.map(function(r,i){return normalizeRemoteRecord(r,bolme,i)}),nextRecords=mergeByBarcodeV17(remoteRecords,localRecords);
      var duplicateCount=Math.max(0,remoteRecords.length+localRecords.length-nextRecords.length);
      if(!confirm('Bölme '+bolme+' içindeki '+remoteRecords.length+' ortak kayıt, cihazdaki '+localCount+' kayıtla barkoda göre birleştirilsin mi?'+(duplicateCount?' '+duplicateCount+' aynı barkod tek kayıt tutulacak.':'')))return;
      var nextSettings=Object.assign({},settings(),{bolmeNo:bolme,seflik:user().seflik});
      var result;
      window.__suiteRemoteHydrating=true;
      if(window.MesahaStorageV527&&window.MesahaStorageV527.replaceAll)result=await window.MesahaStorageV527.replaceAll(nextRecords,nextSettings,{reason:'seflik-continue-merge-v17-'+bolme});
      else{localStorage.setItem(RECORDS_KEY,JSON.stringify(nextRecords));localStorage.setItem(SETTINGS_KEY,JSON.stringify(nextSettings));result={ok:true}}
      if(result&&result.ok===false)throw new Error(result.error||'Kayıtlar cihaza yazılamadı');
      if(window.state){window.state.records=nextRecords;window.state.settings=Object.assign(window.state.settings||{},nextSettings)}
      var p=readJson(PANEL_KEY,{});p.bolmeNo=bolme;p.seflik=user().seflik;writeJson(PANEL_KEY,p);localStorage.setItem(LAST_BOLME_KEY,bolme);
      var b=$('bolmeNo');if(b)b.value=bolme;var sf=$('seflik');if(sf)sf.value=user().seflik;
      try{if(typeof window.renderAll==='function')window.renderAll();else if(window.MesahaRenderStorageV382&&window.MesahaRenderStorageV382.renderAllSoon)window.MesahaRenderStorageV382.renderAllSoon()}catch(e){}
      setStatus('Bölme '+bolme+' barkoda göre birleştirildi. Mesahaya devam edebilirsiniz.','success');
      notify('Mesahaya devam ediliyor','Bölme '+bolme+' • toplam '+nextRecords.length+' benzersiz kayıt hazır.','success');
      if(typeof window.showView==='function')window.showView('entry');else{var open=$('openEntryBtn');if(open)open.click()}
      setTimeout(function(){window.__suiteRemoteHydrating=false;var input=$('barcodeInput');if(input)input.focus()},250);
    }catch(e){window.__suiteRemoteHydrating=false;setStatus('Bölme yüklenemedi: '+String(e&&e.message?e.message:e),'error');notify('Mesahaya devam edilemedi',String(e&&e.message?e.message:e),'error')}
  }


  async function deleteServerRecords(bolme){
    bolme=clean(bolme);if(!bolme||busy)return false;
    if(!navigator.onLine){notify('İnternet bağlantısı yok','Sunucudaki mesahayı silmek için internet gerekli.','warning');return false}
    var row=divisions.find(function(x){return clean(x.bolme_no)===bolme})||{},count=num(row.record_count);
    var typed=prompt('Bölme '+bolme+' içindeki sunucu mesahası silinecek. Bölme, İstifler ve cihazdaki ölçümler korunur. Onaylamak için bölme numarasını yazın:',bolme);
    if(typed===null)return false;if(clean(typed)!==bolme){notify('Mesaha silinmedi','Girilen bölme numarası eşleşmiyor.','warning');return false}
    if(!confirm('SON UYARI: Bölme '+bolme+' içindeki '+count+' sunucu mesaha kaydı silinecek. Devam edilsin mi?'))return false;
    busy=true;setStatus('Bölme '+bolme+' sunucu mesahası siliniyor…','busy');renderList();
    try{var out=await edge('seflik_folder_delete_records',{bolmeNo:bolme,confirmBolme:bolme});var deleted=readJson(SERVER_DELETED_MESAHA_KEY,{}),u=user(),folderKey=clean(u.seflikKey)||fold(u.seflik).replace(/[^a-z0-9]+/g,'-');deleted[folderKey+'::'+bolme]={at:new Date().toISOString(),seflik:u.seflik,bolmeNo:bolme};writeJson(SERVER_DELETED_MESAHA_KEY,deleted);divisions=divisions.map(function(x){return clean(x.bolme_no)===bolme?Object.assign({},x,{record_count:0,total_volume:0,contributors:[],drive_backed_up:false,updated_at:new Date().toISOString()}):x});cacheAndRender();notify('Sunucu mesahası silindi','Bölme '+bolme+' • '+num(out.records_deleted)+' kayıt kaldırıldı. Bölme ve İstifler korundu.','success');return true}catch(e){notify('Mesaha silinemedi',String(e&&e.message?e.message:e),'error');return false}finally{busy=false;renderList()}
  }

  async function deleteDivision(bolme){
    bolme=clean(bolme);if(!bolme||busy)return false;
    var row=divisions.find(function(x){return clean(x.bolme_no)===bolme})||{};
    var count=num(row.record_count),m3=num(row.total_volume);
    var typed=prompt('Bölme '+bolme+' kalıcı olarak silinecek. Bu bölmedeki ortak kayıtlar, senkronizasyonlar ve bağlı yedek kayıtları silinir. İşlemi onaylamak için bölme numarasını yazın:',bolme);
    if(typed===null)return false;
    if(clean(typed)!==bolme){notify('Bölme silinmedi','Girilen bölme numarası eşleşmiyor.','warning');return false}
    if(!confirm('SON UYARI: Bölme '+bolme+' ve '+count+' kayıt ('+fmt(m3,3)+' m³) tamamen silinecek. Bu işlem geri alınamaz. Devam edilsin mi?'))return false;
    busy=true;setStatus('Bölme '+bolme+' kalıcı olarak siliniyor…','busy');renderList();
    try{
      var out=await edge('seflik_folder_delete_division',{bolmeNo:bolme,confirmBolme:bolme,permanent:true});
      divisions=divisions.filter(function(x){return clean(x.bolme_no)!==bolme});
      var pending=pendingDivisions().filter(function(x){return clean(x.bolme_no)!==bolme});savePending(pending);
      try{if(clean(localStorage.getItem(LAST_BOLME_KEY))===bolme)localStorage.removeItem(LAST_BOLME_KEY)}catch(e){}
      cacheAndRender();
      setStatus('Bölme '+bolme+' kalıcı olarak silindi.','success');
      var driveWarn=Array.isArray(out&&out.drive_delete_failed)&&out.drive_delete_failed.length?(' • '+out.drive_delete_failed.length+' Drive dosyası silinemedi'):' ';
      notify('Bölme silindi','Bölme '+bolme+' ve bağlı sunucu kayıtları tamamen kaldırıldı.'+driveWarn,driveWarn.trim()?'warning':'success');
      try{await syncFolder(false)}catch(e){}
      return true;
    }catch(e){setStatus(String(e&&e.message?e.message:e),'error');notify('Bölme silinemedi',String(e&&e.message?e.message:e),'error');return false}
    finally{busy=false;renderList()}
  }

  function fillSendModal(){
    var select=$('seflikSendSelectV529'),list=openDivisions().slice().sort(function(a,b){return clean(a.bolme_no).localeCompare(clean(b.bolme_no),'tr',{numeric:true})});
    if(select)select.innerHTML='<option value="">Bölme seçin</option>'+list.map(function(x){return '<option value="'+esc(x.bolme_no)+'">Bölme '+esc(x.bolme_no)+' • '+num(x.record_count).toLocaleString('tr-TR')+' kayıt • '+fmt(x.total_volume,3)+' m³</option>'}).join('');
    var meta=$('seflikSendMetaV529'),summary=localSummary(true);if(meta)meta.textContent=summary.count.toLocaleString('tr-TR')+' yerel kayıt • '+fmt(summary.totalVolume,3)+' m³ gönderilecek';
  }
  function syncSendModalViewportV531(){
    var vv=window.visualViewport,ov=$('seflikSendOverlayV529');if(!ov)return;
    var h=Math.max(280,Math.round(vv?vv.height:window.innerHeight)),top=Math.max(0,Math.round(vv?vv.offsetTop:0));
    document.documentElement.style.setProperty('--seflik-vv-height-v531',h+'px');
    document.documentElement.style.setProperty('--seflik-vv-top-v531',top+'px');
  }
  function openSendModal(){var ov=$('seflikSendOverlayV529');if(ov){fillSendModal();syncSendModalViewportV531();document.body.classList.add('seflik-send-open-v531');ov.classList.remove('hidden');ov.setAttribute('aria-hidden','false');setTimeout(syncSendModalViewportV531,60)}}
  function closeSendModal(){var ov=$('seflikSendOverlayV529');if(ov){ov.classList.add('hidden');ov.setAttribute('aria-hidden','true')}document.body.classList.remove('seflik-send-open-v531')}
  async function recordsSendClick(){
    if(openBusy||busy||modalBusy)return;
    var u=user(),btn=$('seflikSendFromRecordsV529');if(!clean(u.name)){notify('Kullanıcı bilgisi eksik','Önce Google ile giriş yapın.','warning');return}if(!clean(u.seflik)){notify('Şeflik seçilmedi','Önce Şeflik Klasöründe şeflik oluşturun veya seçin.','warning');return}
    if(!records().length){notify('Gönderilecek kayıt yok','Ölçümler sayfasında kayıt bulunmuyor.','warning');return}
    openBusy=true;if(btn)btn.disabled=true;showTransferOverlay('Veriler yükleniyor…','Açık bölmeler ve şeflik bilgileri kontrol ediliyor.',18);
    try{
      await syncFolder(false);updateTransferOverlay('Veriler yükleniyor…','Gönderme ekranı hazırlanıyor.',75);
      if(!openDivisions().length){hideTransferOverlay();notify('Orman İO bölmesi gerekli','Şefliğe göndermek için Orman İO ana menüsünde bölmeyi oluşturup Offline İndir yapın.','warning');return}
      updateTransferOverlay('Hazır','Açık bölmeler getirildi.',100);await new Promise(function(resolve){setTimeout(resolve,120)});hideTransferOverlay();openSendModal();
    }catch(e){hideTransferOverlay();notify('Bölmeler alınamadı',String(e&&e.message?e.message:e),'error')}
    finally{openBusy=false;if(btn)btn.disabled=false}
  }

  var lastEntryWarnV577=0, entrySyncSeqV577=0;
  function showEntryConnectionWarningV577(msg){msg=clean(msg)||'Bağlantı yok. Daha sonra tekrar deneyiniz.';setStatus(msg,'error');if(Date.now()-lastEntryWarnV577>9000){lastEntryWarnV577=Date.now();notify('Senkronizasyon yapılamadı',msg,'warning')}}
  function loadCachedForEntryV577(){fillIdentity();var cache=readJson(CACHE_KEY,null);if(cache&&cache.seflik===user().seflik&&Array.isArray(cache.divisions)){divisions=cache.divisions;renderList()}}
  function showEntryLoadingV580(){fillIdentity();var meta=$('seflikFolderRemoteMetaV528');if(meta)meta.textContent='Şeflik yükleniyor…';var box=$('seflikFolderListV528');if(box&&!openDivisions().length)box.innerHTML='<div class="seflik-folder-empty">Şeflik yükleniyor…<br><small>Bölmeler, üyeler ve senkron kayıtları kontrol ediliyor.</small></div>';setStatus('Şeflik yükleniyor…','busy')}
  async function autoSyncOnEntryV577(){
    loadCachedForEntryV577();updatePreview(true);
    if(!hasApprovedIdentity())return renderGuestBlockedV582(true);
    showEntryLoadingV580();
    if(!navigator.onLine){markNeedsOnlineRefresh(true);showEntryConnectionWarningV577('Bağlantı yok. Daha sonra tekrar deneyiniz.');return false}
    if(lastSyncAt&&Date.now()-lastSyncAt<4000)return true;
    var seq=++entrySyncSeqV577;
    try{
      var ok=await withTimeout(syncFolder(false,{silent:true}),10000,'Şeflik klasörü 10 saniyede senkronize olmadı. Bağlantı yok, daha sonra tekrar deneyiniz.');
      if(ok!==true){if(seq===entrySyncSeqV577)showEntryConnectionWarningV577('Şeflik klasörü senkronize edilemedi. Daha sonra tekrar deneyiniz.');return false}
      return true;
    }catch(e){
      if(seq===entrySyncSeqV577){markNeedsOnlineRefresh(true);var msg=String(e&&e.message?e.message:e);if(/10 saniye|zaman aşımı|timeout|fetch|network|bağlanılamadı|bağlantı/i.test(msg))msg='Bağlantı yok veya sunucu 10 saniye içinde cevap vermedi. Daha sonra tekrar deneyiniz.';showEntryConnectionWarningV577(msg)}
      return false;
    }
  }

  function bind(){
    var select=$('seflikFolderBolmeV528');if(select)select.addEventListener('change',function(){localStorage.setItem(LAST_BOLME_KEY,clean(select.value));updatePreview()});
    /* Bölme oluşturma Orman İO ana menüsünde yönetilir. */
    var send=$('seflikFolderSendV528');if(send)send.addEventListener('click',sendFolder);
    var sync=$('seflikFolderSyncV528');if(sync)sync.addEventListener('click',function(){syncFolder(true).catch(function(e){setStatus(String(e&&e.message?e.message:e),'error');notify('Senkronizasyon başarısız',String(e&&e.message?e.message:e),'error')})});
    var list=$('seflikFolderListV528');if(list)list.addEventListener('click',function(ev){var del=ev.target.closest('[data-seflik-delete-records]');if(del){deleteServerRecords(del.getAttribute('data-seflik-delete-records'));return}var cont=ev.target.closest('[data-seflik-continue]');if(cont)continueDivision(cont.getAttribute('data-seflik-continue'))});
    var shortcut=$('seflikFolderHomeShortcutV528');if(shortcut){var openShortcut=function(){try{if(typeof window.showView==='function')window.showView('seflikFolder');else{var n=document.querySelector('[data-nav="seflikFolder"]');if(n)n.click()}}catch(e){var n=document.querySelector('[data-nav="seflikFolder"]');if(n)n.click()}};shortcut.addEventListener('click',openShortcut);shortcut.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();openShortcut()}})}
    var recordsBtn=$('seflikSendFromRecordsV529');if(recordsBtn)recordsBtn.addEventListener('click',recordsSendClick);
    var modalClose=$('seflikSendCloseV529');if(modalClose)modalClose.addEventListener('click',closeSendModal);
    var modalCancel=$('seflikSendCancelV529');if(modalCancel)modalCancel.addEventListener('click',closeSendModal);
    var modalConfirm=$('seflikSendConfirmV529');if(modalConfirm)modalConfirm.addEventListener('click',function(){if(modalBusy||busy)return;var b=clean(($('seflikSendSelectV529')||{}).value);if(!b){notify('Bölme seçin','Gönderilecek açık bölmeyi seçin.','warning');return}modalBusy=true;modalConfirm.disabled=true;Promise.resolve(sendToDivision(b,records(),'records')).finally(function(){if(!busy){modalBusy=false;modalConfirm.disabled=false}})});
    var overlay=$('seflikSendOverlayV529');if(overlay)overlay.addEventListener('click',function(e){if(e.target===overlay&&!busy)closeSendModal()});
    if(window.visualViewport&&!window.__seflikModalViewportV531){window.__seflikModalViewportV531=true;window.visualViewport.addEventListener('resize',syncSendModalViewportV531,{passive:true});window.visualViewport.addEventListener('scroll',syncSendModalViewportV531,{passive:true})}
    document.addEventListener('click',function(ev){var n=ev.target.closest&&ev.target.closest('[data-nav="seflikFolder"]');if(n){if(!hasApprovedIdentity()){ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();renderGuestBlockedV582(false);return false}showEntryLoadingV580();setTimeout(function(){autoSyncOnEntryV577().catch(function(){})},50)}},true);
    window.addEventListener('mesaha:records-saved',schedulePreview,{passive:true});window.addEventListener('online',function(){setTimeout(function(){if(needsOnlineRefresh()||(document.getElementById('seflikFolderView')&&document.getElementById('seflikFolderView').classList.contains('active')))syncFolder(false,{silent:true}).catch(function(e){setStatus(String(e&&e.message?e.message:e),'error')})},900)});window.addEventListener('mesaha:auth-session-restored',function(){if(needsOnlineRefresh())setTimeout(function(){syncFolder(false,{silent:true}).catch(function(){})},400)},{passive:true});window.addEventListener('mesaha:seflik-folder-active-changed',function(){fillIdentity();setTimeout(function(){autoSyncOnEntryV577().catch(function(){})},80)},{passive:true});
    fillIdentity();var cache=readJson(CACHE_KEY,null);if(cache&&cache.seflik===user().seflik&&Array.isArray(cache.divisions))divisions=cache.divisions;divisions=mergeRemoteDivisions(divisions);renderList();setTimeout(function(){var v=document.getElementById('seflikFolderView');if(v&&v.classList.contains('active'))autoSyncOnEntryV577().catch(function(){})},180);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
  window.MesahaSeflikFolderV529={sync:syncFolder,autoSync:autoSyncOnEntryV577,refreshPreview:function(){updatePreview(true)},send:sendFolder,sendToDivision:sendToDivision,continueDivision:continueDivision,getDivisions:function(){return divisions.slice()},managedBySuite:true};
})();
;
