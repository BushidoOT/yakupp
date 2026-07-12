/* Mesaha İO V5.59 — Terminal kodlu bulut destekli giriş modu
   Elle terminal modunda uygulama cihaz içi çalışır; kodla eşleşmiş terminalde Buluta Yedekle/Buluttan Getir açıktır. */
(function(){
  'use strict';
  if(window.__mesahaTerminalLocalV556) return;
  window.__mesahaTerminalLocalV556 = true;
  var TERMINAL_KEY='mesaha_terminal_local_mode_v557';
  var SETTINGS_KEY='cam_mesaha_ayarlar_v1';
  var PANEL_KEY='mesaha_panel_user_v316';
  var CLOUD_SELECTORS=['#cloudBackupBtnV316','#cloudRestoreBtnV316','[data-hybrid-id-v501]','[data-hybrid-delete-id-v506]'].join(',');
  var GOOGLE_ONLY_SELECTORS=[
    '#seflikSendFromRecordsV529','#seflikFolderHomeShortcutV528','#seflikFolderCreateV529','#seflikFolderSendV528','#seflikFolderSyncV528',
    '[data-nav="seflikFolder"]','[data-drive-restore-v463]','[data-seflik-continue]','[data-seflik-delete]'
  ].join(',');
  var BLOCK_SELECTORS=[CLOUD_SELECTORS,GOOGLE_ONLY_SELECTORS].join(',');

  function $(id){return document.getElementById(id)}
  function clean(v){return String(v==null?'':v).trim().replace(/\s+/g,' ')}
  function esc(v){return clean(v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
  function jsonGet(k,f){try{var v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}}
  function jsonSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
  function terminal(){var x=jsonGet(TERMINAL_KEY,null);return !!(x&&x.active===true)}
  function terminalData(){return jsonGet(TERMINAL_KEY,{})||{}}
  function terminalCloudAllowed(){var x=terminalData();return !!(x&&x.active===true&&x.source==='pair_code'&&x.pairedUserId&&(x.terminalToken||x.terminalCode));}
  function user(){var u=jsonGet(PANEL_KEY,{}),s=jsonGet(SETTINGS_KEY,{}),t=jsonGet(TERMINAL_KEY,{});return{name:clean(t.name||u.name||s.ekipNot),seflik:clean(t.seflik||u.seflik||s.seflik),bolmeNo:clean(t.bolmeNo||u.bolmeNo||s.bolmeNo)}}
  function toast(title,sub,kind){try{if(typeof window.mesahaFloatToastV315==='function')return window.mesahaFloatToastV315(title,sub||'',kind||'warning')}catch(e){}try{if(typeof window.toast==='function')return window.toast(title,sub||'',kind||'warning')}catch(e){}try{alert(title+(sub?'\n'+sub:''))}catch(e){}}
  function log(event,detail,level){try{if(window.MesahaLoginLog&&typeof window.MesahaLoginLog.log==='function')window.MesahaLoginLog.log(event,detail||{},level||'info')}catch(e){}}
  function clearTerminal(){try{localStorage.removeItem(TERMINAL_KEY)}catch(e){}try{document.documentElement.removeAttribute('data-mesaha-terminal-mode')}catch(e){}log('terminal_mode_disabled_for_google',{},'info')}
  function goGoogle(){clearTerminal();try{if(window.mesahaSupabase&&window.mesahaSupabase.clearSession)window.mesahaSupabase.clearSession()}catch(e){}try{window.dispatchEvent(new CustomEvent('mesaha:google-auth-required',{detail:{reason:'terminal_cloud_feature'}}))}catch(e){}setTimeout(function(){try{if(window.MesahaGoogleAuthV548&&typeof window.MesahaGoogleAuthV548.boot==='function')window.MesahaGoogleAuthV548.boot(true)}catch(e){}},80)}
  function askGoogle(){
    log('terminal_cloud_feature_blocked',{url:location.href},'warning');
    toast('Google ile giriş yap','Bu özellik terminal modunda kapalıdır. Bulut, Drive ve Şeflik Klasörü için Google gerekir.','warning');
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
      'html[data-mesaha-terminal-mode="1"] #cloudBackupBtnV316,html[data-mesaha-terminal-mode="1"] #cloudRestoreBtnV316,html[data-mesaha-terminal-mode="1"] #seflikSendFromRecordsV529,html[data-mesaha-terminal-mode="1"] #seflikFolderSendV528,html[data-mesaha-terminal-mode="1"] #seflikFolderSyncV528,html[data-mesaha-terminal-mode="1"] #seflikFolderCreateV529{background:#f1f5f9!important;color:#64748b!important;border-color:#cbd5e1!important;box-shadow:none!important}',
      'html[data-mesaha-terminal-mode="1"] [data-nav="seflikFolder"]{opacity:.55!important}',
      'html[data-mesaha-terminal-mode="1"] #seflikFolderHomeShortcutV528{opacity:.72!important;filter:grayscale(.25)!important}'
    ].join('');document.head.appendChild(st);
  }
  function terminalCardHtml(){var u=user(),ok=terminalCloudAllowed();return '<div class="terminal-card-v557" id="terminalLocalCardV556"><b>🖥 Terminal modu aktif</b><small>'+esc(u.name||'Kullanıcı')+' • '+esc(u.seflik||'Şeflik')+'<br>'+(ok?'Terminal kodu eşleşti. Buluta Yedekle ve Buluttan Getir açık.':'Bu cihaz yerel çalışır. Bulut için terminal kodu veya Google gerekir.')+'</small><button type="button" id="terminalGoogleBtnV556">Google ile giriş yap</button></div>'}
  function ensureCards(){
    if(!terminal())return;
    var status=document.querySelector('.status-card');
    if(status&&!$('terminalLocalHomeV556')){var div=document.createElement('section');div.id='terminalLocalHomeV556';div.innerHTML=terminalCardHtml();status.parentNode.insertBefore(div,status.nextSibling)}
    var panel=document.querySelector('#userPanelOverlayV316 .panel-stats-v316');
    if(panel&&!$('terminalLocalPanelV556')){var p=document.createElement('div');p.id='terminalLocalPanelV556';p.innerHTML=terminalCardHtml();panel.parentNode.insertBefore(p,panel)}
    document.querySelectorAll('#terminalGoogleBtnV556,#terminalLocalPanelV556 button').forEach(function(btn){if(!btn.__terminalGoogleV556){btn.__terminalGoogleV556=true;btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();goGoogle()},true)}});
  }
  function applyBadge(){
    if(!terminal())return;
    document.documentElement.setAttribute('data-mesaha-terminal-mode','1');
    var u=user(),badge=$('userBadge');
    if(badge&&u.name&&u.seflik){badge.textContent='Terminal • '+u.name+' • '+u.seflik;badge.classList.remove('login-needed')}
    var sync=$('panelSyncTextV316');if(sync)sync.textContent=terminalCloudAllowed()?'Terminal modu: kod eşleşti • bulut yedek açık':'Terminal modu: yerel kullanım • bulut kapalı';
  }
  function labelBlockedButtons(){
    if(!terminal())return;
    var ok=terminalCloudAllowed();
    [['cloudBackupBtnV316',ok?'Buluta Yedekle':'Google ile giriş yap'],['cloudRestoreBtnV316',ok?'Buluttan Getir':'Google ile giriş yap'],['seflikSendFromRecordsV529','Google ile giriş yap'],['seflikFolderCreateV529','Google gerekli'],['seflikFolderSendV528','Google gerekli'],['seflikFolderSyncV528','Google gerekli']].forEach(function(x){var b=$(x[0]);if(b){b.textContent=x[1];b.title=ok?'Terminal kodu eşleşti. Bulut yedek açıktır.':'Terminal modunda bulut kapalı. Kullanmak için Google ile giriş yapın.'}});
    var st=$('seflikFolderStatusV528');if(st)st.textContent=ok?'Terminal kodu eşleşti. Buluta Yedekle/Buluttan Getir açık; Şeflik Klasörü için Google gerekir.':'Terminal modunda Şeflik Klasörü kapalı. Kullanmak için Google ile giriş yapın.';
    var identity=$('seflikFolderIdentityV528');if(identity)identity.textContent=ok?'Terminal kodu eşleşti':'Google girişi gerekli';
  }
  function gatePromise(){askGoogle();return Promise.reject(new Error('Bu özellik için Google ile giriş yap. Terminal modunda bulut kapalıdır.'))}
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
      if(isCloud&&terminalCloudAllowed())return;
      ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();askGoogle();return false;
    },true);
    document.addEventListener('keydown',function(ev){
      if(!terminal()||!(ev.key==='Enter'||ev.key===' '))return;
      var target=ev.target&&ev.target.closest&&ev.target.closest(BLOCK_SELECTORS);
      if(!target)return;
      var isCloud=!!(target.matches&&target.matches(CLOUD_SELECTORS))||!!(target.closest&&target.closest(CLOUD_SELECTORS));
      if(isCloud&&terminalCloudAllowed())return;
      ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();askGoogle();return false;
    },true);
  }
  function boot(){style();if(terminal()){applyBadge();ensureCards();labelBlockedButtons();patchGlobals()}bindGate()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  [100,350,800,1600,3200,6500].forEach(function(ms){setTimeout(boot,ms)});
  window.addEventListener('mesaha:terminal-mode-enabled',boot);
  window.addEventListener('mesaha:settings-saved',boot);
  window.MesahaTerminalLocalV556={isActive:terminal,canUseCloud:terminalCloudAllowed,data:terminalData,disable:clearTerminal,google:goGoogle,boot:boot};
})();
