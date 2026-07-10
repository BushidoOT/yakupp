/* Mesaha İO V5.27 — Uygulama stabilite bağlayıcısı */
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
  function validateSavedUser(){
    var u=read(PANEL_KEY,{}),st=read(SETTINGS_KEY,{});
    if(valid(u.name,u.seflik)) return true;
    if(valid(st.ekipNot,st.seflik)){
      try{localStorage.removeItem(PANEL_KEY);}catch(e){}
      return true;
    }
    if(u.name||u.seflik||st.ekipNot||st.seflik){
      try{localStorage.removeItem(PANEL_KEY);}catch(e){}
      try{
        st.ekipNot='';st.seflik='';st.bolmeNo='';
        if(window.state&&window.state.settings)Object.assign(window.state.settings,st);
        if(window.MesahaStorageV527)window.MesahaStorageV527.saveSettings(st,{reason:'invalid-identity-cleanup'});else write(SETTINGS_KEY,st);
      }catch(e){}
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
    window.addEventListener('mesaha:storage-recovered',function(ev){try{if(ev.detail&&ev.detail.reason==='newer-revision')toast('Kayıtlar doğrulandı',String(ev.detail.count||0)+' kayıt güvenli depodan açıldı.','success');}catch(e){};});
    if('serviceWorker' in navigator){
      navigator.serviceWorker.addEventListener('message',function(ev){if(ev.data&&ev.data.error)log('service-worker.message',ev.data.error,ev.data);});
      navigator.serviceWorker.ready.catch(function(e){log('service-worker.ready',e);});
    }
  }
  function bindPersistence(){
    document.addEventListener('visibilitychange',function(){if(document.hidden&&window.MesahaStorageV527)window.MesahaStorageV527.flush();},{passive:true});
    window.addEventListener('pagehide',function(){if(window.MesahaStorageV527)window.MesahaStorageV527.flush();},{passive:true});
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
    try{if(window.MesahaStorageV527)window.MesahaStorageV527.recoverIntoApp();}catch(e){log('storage.recover',e);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.MesahaRuntimeV527={validIdentity:valid,installIdentity:installIdentity,persistPanelIdentity:persistPanelIdentity,selfTest:selfTest};
})();
