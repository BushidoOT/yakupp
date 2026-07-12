/* Mesaha İO V5.64 — Google OAuth + terminal kod eşleştirme + panel üstü modal ve misafir terminal modu.
   - Google hesabı doğrulandıktan sonra kullanıcı otomatik onaylanır.
   - Kullanıcı panelinden terminal kodu üretilebilir.
   - Terminal cihaz Google hesabı açmadan kod ile kullanıcı/şeflik kimliğine eşleşir; bulut yedek özelliklerini kullanabilir. */
(function(){
  'use strict';
  var ACCESS_KEY='mesaha_google_access_v548';
  var TERMINAL_MODE_KEY='mesaha_terminal_local_mode_v556';
  var PLAIN_OAUTH_KEY='mesaha_google_plain_oauth_v553';
  var EMAIL_EXISTS_RETRY_KEY='mesaha_google_email_exists_retry_v556';
  var PANEL_KEY='mesaha_panel_user_v316';
  var SETTINGS_KEY='cam_mesaha_ayarlar_v1';
  var BUSY=false, overlay=null, currentAccess=null, statusPromise=null, bootPromise=null, lastStatusAt=0, identityBusy=false, lastTerminalCode='';
  var STATUS_TTL=30*24*60*60*1000, LONG_APPROVED_MS=30*24*60*60*1000;
  window.__mesahaGoogleAuthV548=true;
  function loginLog(event,detail,level){try{if(window.MesahaLoginLog&&typeof window.MesahaLoginLog.log==='function')window.MesahaLoginLog.log(event,detail,level)}catch(e){}}

  function clean(v){return String(v==null?'':v).trim().replace(/\s+/g,' ')}
  function esc(v){return clean(v).replace(/[&<>"']/g,function(m){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]})}
  function getJson(k,f){try{var v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}}
  function setJson(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
  function cfg(){var c=window.MESAHA_SUPABASE_CONFIG||{};return{url:clean(c.url).replace(/\/+$/,''),anonKey:clean(c.anonKey||c.anon_key)}}
  function api(){return window.mesahaSupabase||window.mesahaCloud||null}
  async function rpc(name,params){
    loginLog('google_rpc_start',{name:name,params:params},'debug');
    var c=cfg(),a=api();
    if(!a||!a.getAccessToken){loginLog('google_rpc_no_engine',{name:name},'error');throw new Error('Supabase oturum motoru hazır değil');}
    var token=await a.getAccessToken(),url=c.url+'/rest/v1/rpc/'+encodeURIComponent(name),payload=JSON.stringify(params||{}),lastError=null,res=null;
    for(var attempt=0;attempt<2;attempt++){
      var ctrl=typeof AbortController!=='undefined'?new AbortController():null,timer=ctrl?setTimeout(function(){ctrl.abort()},30000):0;
      try{
        res=await fetch(url,{method:'POST',cache:'no-store',headers:{apikey:c.anonKey,Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'application/json'},body:payload,signal:ctrl&&ctrl.signal});
        break;
      }catch(e){
        lastError=e;
        if(attempt===0&&navigator.onLine!==false){await new Promise(function(resolve){setTimeout(resolve,800)});continue}
        var raw=clean(e&&e.name||e&&e.message||e);
        loginLog('google_rpc_network_error',{name:name,attempt:attempt,error:raw},'error');throw new Error(/abort/i.test(raw)?'Google erişim kontrolü zaman aşımına uğradı.':'Supabase erişim servisine bağlanılamadı.');
      }finally{if(timer)clearTimeout(timer)}
    }
    if(!res)throw lastError||new Error('Supabase erişim servisine bağlanılamadı.');
    var rawText=await res.text(),out={};try{out=rawText?JSON.parse(rawText):{}}catch(e){out={message:rawText}}
    if(!res.ok){
      var msg=clean(out&& (out.message||out.error||out.details||out.hint) || ('RPC hata '+res.status));
      if(/could not find the function|schema cache|does not exist/i.test(msg))msg='Google erişim SQL kurulumu eksik. Supabase SQL Editor’da 20260712_v557_terminal_kod_ve_otomatik_google_onay.sql dosyasını çalıştır.';
      loginLog('google_rpc_response_error',{name:name,status:res.status,message:msg,payload:out},'error');var err=new Error(msg);err.status=res.status;err.payload=out;throw err;
    }
    loginLog('google_rpc_ok',{name:name,status:res.status,out:out},'debug');return out&&typeof out==='object'?out:{};
  }
  function friendlyTerminalSqlMessage(msg){
    msg=clean(msg);
    if(/gen_random_bytes|digest\(|function .* does not exist|schema cache|could not find the function/i.test(msg))return 'Terminal kodu SQL düzeltmesi eksik. Supabase SQL Editor’da 20260712_v562_terminal_sql_soft_ban_fix.sql dosyasını çalıştır.';
    return msg;
  }
  async function anonRpc(name,params){
    loginLog('terminal_rpc_start',{name:name},'debug');
    var c=cfg();if(!c.url||!c.anonKey)throw new Error('Supabase bağlantı ayarı eksik.');
    var res=await fetch(c.url+'/rest/v1/rpc/'+encodeURIComponent(name),{method:'POST',cache:'no-store',headers:{apikey:c.anonKey,Authorization:'Bearer '+c.anonKey,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(params||{})});
    var raw=await res.text(),out={};try{out=raw?JSON.parse(raw):{}}catch(e){out={message:raw}}
    if(!res.ok||out.ok===false){var msg=friendlyTerminalSqlMessage(out.message||out.error||out.details||out.hint||('Terminal kodu doğrulanamadı: '+res.status));loginLog('terminal_rpc_error',{name:name,status:res.status,message:msg,out:out},'error');throw new Error(msg)}
    loginLog('terminal_rpc_ok',{name:name,status:res.status,out:out},'debug');return out;
  }
  function session(){var a=api();return a&&a.getStoredSession?a.getStoredSession():null}
  function user(){var s=session()||{};return s.user||{}}
  function uid(){return clean(user().id)}
  function providers(u){u=u||user();var out=[];try{(u.identities||[]).forEach(function(x){if(x&&x.provider)out.push(String(x.provider))})}catch(e){}try{var p=u.app_metadata&&u.app_metadata.providers;if(Array.isArray(p))out=out.concat(p.map(String))}catch(e){}if(u.app_metadata&&u.app_metadata.provider)out.push(String(u.app_metadata.provider));return Array.from(new Set(out))}
  function pickGoogleNameFromUser(u){u=u||user();var names=[];function add(v){v=clean(v);if(v&&names.indexOf(v)<0)names.push(v)}try{add(u.user_metadata&&u.user_metadata.full_name);add(u.user_metadata&&u.user_metadata.name);add(u.user_metadata&&u.user_metadata.display_name)}catch(e){}try{(u.identities||[]).forEach(function(x){if(x&&x.provider==='google'){var d=x.identity_data||{};add(d.full_name);add(d.name);add(d.display_name);add(d.given_name&&d.family_name?(d.given_name+' '+d.family_name):'')}})}catch(e){}return names.find(function(n){return n.length>=2&&!/@/.test(n)&&!/^(google|user|kullanıcı|kullanici)$/i.test(n)})||''}
  function googleDisplayName(){return pickGoogleNameFromUser(user())}
  function pickGoogleAvatarFromUser(u){u=u||user();var vals=[];function add(v){v=clean(v);if(v&&/^https?:\/\//i.test(v)&&vals.indexOf(v)<0)vals.push(v)}try{add(u.user_metadata&&u.user_metadata.avatar_url);add(u.user_metadata&&u.user_metadata.picture)}catch(e){}try{(u.identities||[]).forEach(function(x){if(x&&x.provider==='google'){var d=x.identity_data||{};add(d.avatar_url);add(d.picture)}})}catch(e){}return vals[0]||''}
  function googleAvatarUrl(){return pickGoogleAvatarFromUser(user())}
  function isGoogle(){var a=api();return a&&a.isGoogle?a.isGoogle():providers().indexOf('google')>=0}
  function isAnon(){var a=api();return a&&a.isAnonymous?a.isAnonymous():user().is_anonymous===true}
  function redirectUrl(){var u=new URL(location.href);u.hash='';['code','error','error_code','error_description','sb','updated'].forEach(function(k){u.searchParams.delete(k)});var p=u.pathname.replace(/\/index\.html$/i,'/');if(!/\/$/.test(p))p=p.replace(/[^\/]*$/,'');return u.origin+p}
  function mergedAuthParams(){var p=new URLSearchParams();try{new URLSearchParams(location.search||'').forEach(function(v,k){p.set(k,v)})}catch(e){}try{var raw=location.hash&&location.hash.slice(1);if(raw)new URLSearchParams(raw).forEach(function(v,k){if(!p.has(k))p.set(k,v)})}catch(e){}return p}
  function markPlainOauth(on){try{if(on)localStorage.setItem(PLAIN_OAUTH_KEY,String(Date.now()));else localStorage.removeItem(PLAIN_OAUTH_KEY)}catch(e){}}
  function plainOauthNeeded(){try{var t=Number(localStorage.getItem(PLAIN_OAUTH_KEY)||0)||0;return !!(t&&Date.now()-t<10*60*1000)}catch(e){return false}}
  function setEmailExistsRetry(){try{localStorage.setItem(EMAIL_EXISTS_RETRY_KEY,String(Date.now()));return true}catch(e){return false}}
  function recentEmailExistsRetry(){try{var t=Number(localStorage.getItem(EMAIL_EXISTS_RETRY_KEY)||0)||0;return !!(t&&Date.now()-t<25000)}catch(e){return false}}
  function clearEmailExistsRetry(){try{localStorage.removeItem(EMAIL_EXISTS_RETRY_KEY)}catch(e){}}
  function plainOAuthUrl(reason){var redir=redirectUrl(),path='/auth/v1/authorize?provider=google&redirect_to='+encodeURIComponent(redir);var url=cfg().url+path;loginLog('oauth_plain_direct_url',{reason:reason||'',redirectUrl:redir,path:path},'debug');return url}
  function goPlainOAuth(reason){markPlainOauth(true);try{var a=api();if(a&&a.clearSession)a.clearSession()}catch(e){}var url=plainOAuthUrl(reason);loginLog('oauth_redirect_plain_google_direct',{reason:reason||'',redirectUrl:redirectUrl()},'info');location.assign(url);return true}
  function localIdentity(){
    var panel=getJson(PANEL_KEY,{}),st={};try{st=window.state&&window.state.settings||{}}catch(e){}if(!clean(st.ekipNot)||!clean(st.seflik))st=getJson(SETTINGS_KEY,{});
    var g=isGoogle()?googleDisplayName():'';
    return{name:clean(g||panel.name||st.ekipNot),seflik:clean(panel.seflik||st.seflik||'Dosya'),bolmeNo:clean(panel.bolmeNo||st.bolmeNo)}
  }
  function validIdentity(name,seflik){name=clean(name);seflik=clean(seflik);if(name.length<2||seflik.length<2)return false;var n=name.toLocaleLowerCase('tr-TR'),s=seflik.toLocaleLowerCase('tr-TR');return !/^(kullanıcı|kullanici|user|guest|misafir|boş|bos|-)$/.test(n)&&!/^(şeflik|seflik|unknown|bilinmiyor|boş|bos|-)$/.test(s)}
  function isTerminalMode(){try{var x=getJson(TERMINAL_MODE_KEY,null);return !!(x&&x.active===true)}catch(e){return false}}
  function hasAuthCallback(){try{var q=mergedAuthParams();return !!(q.get('access_token')||q.get('code')||q.get('error')||q.get('error_code')||(location.hash&&/access_token=|error=|code=/.test(location.hash)))}catch(e){return false}}
  function terminalData(){var x=getJson(TERMINAL_MODE_KEY,{}),li=localIdentity();return{name:clean(x.name||li.name),seflik:clean(x.seflik||li.seflik),bolmeNo:clean(x.bolmeNo||li.bolmeNo),active:x.active===true,createdAt:x.createdAt||''}}
  function writeTerminalIdentity(data){
    data=data||{};var name=clean(data.name),seflik=clean(data.seflik),bolme=clean(data.bolmeNo);
    if(!validIdentity(name,seflik))throw new Error('Terminal için kullanıcı adı ve şeflik gerekli.');
    var panel=getJson(PANEL_KEY,{});panel=Object.assign({},panel,{name:name,seflik:seflik,bolmeNo:bolme,terminalMode:true,googleApproved:false,terminalPairedUserId:clean(data.pairedUserId||''),terminalPairedEmail:clean(data.pairedEmail||''),updatedAt:new Date().toISOString()});setJson(PANEL_KEY,panel);
    var st=getJson(SETTINGS_KEY,{});st=Object.assign({},st,{ekipNot:name,seflik:clean(st.seflik||seflik||'')});if(bolme)st.bolmeNo=bolme;setJson(SETTINGS_KEY,st);
    try{if(window.state&&window.state.settings){window.state.settings.ekipNot=name;window.state.settings.seflik=seflik;if(bolme)window.state.settings.bolmeNo=bolme;if(typeof window.saveSettings==='function')window.saveSettings();}}catch(e){}
    var term={active:true,name:name,seflik:seflik,bolmeNo:bolme,createdAt:new Date().toISOString(),version:'v559',source:data.source||'manual',cloudEnabled:data.source==='pair_code'||!!data.pairedUserId};
    if(data.terminalCode)term.terminalCode=clean(data.terminalCode);if(data.terminalToken)term.terminalToken=clean(data.terminalToken);if(data.pairedUserId)term.pairedUserId=clean(data.pairedUserId);if(data.pairedEmail)term.pairedEmail=clean(data.pairedEmail);if(data.expiresAt)term.expiresAt=data.expiresAt;if(data.pairedAt)term.pairedAt=data.pairedAt;
    setJson(TERMINAL_MODE_KEY,term);try{localStorage.setItem('mesaha_user_confirmed_v319','1')}catch(e){}
    ['ekipNot','panelNameV316'].forEach(function(id){var el=document.getElementById(id);if(el){el.value=name;el.readOnly=false;el.removeAttribute('aria-readonly')}});['seflik','panelSeflikV316'].forEach(function(id){var el=document.getElementById(id);if(el){el.value=seflik;el.readOnly=false;el.removeAttribute('aria-readonly')}});
    var be=document.getElementById('bolmeNo'),bp=document.getElementById('panelBolmeV316');if(be&&bolme)be.value=bolme;if(bp&&bolme)bp.value=bolme;var badge=document.getElementById('userBadge');if(badge){badge.textContent='Terminal • '+name+' • '+seflik;badge.classList.remove('login-needed')}
    try{document.documentElement.setAttribute('data-mesaha-terminal-mode','1');window.dispatchEvent(new CustomEvent('mesaha:terminal-mode-enabled',{detail:{name:name,seflik:seflik,bolmeNo:bolme,source:term.source}}));window.dispatchEvent(new Event('mesaha:settings-saved'));window.dispatchEvent(new Event('mesaha:user-login'))}catch(e){}
    loginLog('terminal_mode_enabled',{name:name,seflik:seflik,bolmeNo:bolme,source:term.source,paired:!!data.terminalCode},'info');return true}
  
  function terminalForm(){var li=terminalData();show('<div class="google-auth-status-v548 pending"><b>Terminal giriş modu (Misafir modu)</b><br>Telefondan Google ile giriş yapan kullanıcı, kullanıcı panelinden terminal kodu oluşturabilir. Bu kodla terminal kimliği eşleşir; Buluta Yedekle ve Buluttan Getir bu kullanıcı adına açılır.</div><div class="google-auth-fields-v548"><label>Terminal Kodu<input id="terminalPairCodeV557" maxlength="20" inputmode="text" placeholder="Örn: A1B2-C3D4" autocomplete="one-time-code"></label></div>'+button('terminal-claim','Kod ile terminali eşleştir','green')+'<p class="google-auth-note-v548">Kod yoksa aşağıdan elle yerel terminal modu açılabilir.</p><div class="google-auth-fields-v548"><label>Kullanıcı adı<input id="terminalNameV556" maxlength="120" value="'+esc(li.name)+'" autocomplete="name"></label><label>Şeflik<input id="terminalSeflikV556" maxlength="120" value="'+esc(li.seflik)+'" autocomplete="organization"></label><label>Bölme No <input id="terminalBolmeV556" maxlength="80" value="'+esc(li.bolmeNo)+'"></label></div>'+button('terminal-save','Elle terminal modunda devam et','subtle')+button('google','Google ile giriş yap','primary')+'<p class="google-auth-note-v548">Elle terminal modunda kayıtlar cihazda kalır. Bulut için telefondan oluşturulan terminal kodu veya Google girişi gerekir.</p>')}
  async function claimTerminalCode(codeArg){
    var el=document.getElementById('terminalPairCodeV557'),el2=document.getElementById('terminalPairCodePanelV561'),fromPanel=!!codeArg,code=clean(codeArg||el&&el.value||el2&&el2.value).toUpperCase();
    if(code.length<6)throw new Error('Telefondan oluşturulan terminal kodunu girin.');
    if(!fromPanel)loading('Terminal kodu kontrol ediliyor…');
    loginLog('terminal_code_claim_start',{codeLength:code.length,source:fromPanel?'panel':'overlay'},'info');
    try{
      var out=await anonRpc('mesaha_claim_terminal_code_v557',{p_code:code,p_device_info:deviceInfo(),p_app_version:(window.MESAHA_VERSION||{}).visibleVersion||'V5.64'});
      var t=out.terminal||out;
      writeTerminalIdentity({name:t.name,seflik:t.seflik,bolmeNo:t.bolme_no||t.bolmeNo,terminalCode:code,terminalToken:t.terminal_token||t.token,pairedUserId:t.owner_user_id,pairedEmail:t.owner_email,expiresAt:t.expires_at,pairedAt:new Date().toISOString(),source:'pair_code'});
      hide();
      try{if(typeof window.mesahaFloatToastV315==='function')window.mesahaFloatToastV315('Terminal eşleşti',(t.name||'Kullanıcı')+' • '+(t.seflik||'Şeflik'),'success');else if(typeof window.toast==='function')window.toast('Terminal eşleşti',(t.name||'Kullanıcı')+' • '+(t.seflik||'Şeflik'),'success')}catch(e){}
      try{if(window.MesahaTerminalLocalV556&&typeof window.MesahaTerminalLocalV556.boot==='function')window.MesahaTerminalLocalV556.boot()}catch(e){}
      return true;
    }catch(e){
      if(fromPanel)hide();
      throw e;
    }
  }
  function saveTerminalFromForm(){var n=document.getElementById('terminalNameV556'),s=document.getElementById('terminalSeflikV556'),b=document.getElementById('terminalBolmeV556');writeTerminalIdentity({name:n&&n.value,seflik:s&&s.value,bolmeNo:b&&b.value,source:'manual'});hide();try{if(typeof window.mesahaFloatToastV315==='function')window.mesahaFloatToastV315('Terminal modu açıldı','Bulut özellikleri Google girişi isteyecek','success');else if(typeof window.toast==='function')window.toast('Terminal modu açıldı','Bulut özellikleri Google girişi isteyecek','success')}catch(e){}return true}
  
  function clearTerminalMode(){try{localStorage.removeItem(TERMINAL_MODE_KEY)}catch(e){}try{document.documentElement.removeAttribute('data-mesaha-terminal-mode');window.dispatchEvent(new Event('mesaha:terminal-mode-disabled'))}catch(e){}}

  function cached(){var x=getJson(ACCESS_KEY,null);if(!x)return null;var id=uid(),ts=Number(x.cached_at||0)||0;if(id&&clean(x.user_id)&&clean(x.user_id)!==id)return null;if(!id&&clean(x.status)==='approved'&&ts&&Date.now()-ts>LONG_APPROVED_MS)return null;return x}
  function cacheAccess(x){if(!x)return;currentAccess=x;lastStatusAt=Date.now();setJson(ACCESS_KEY,Object.assign({},x,{cached_at:lastStatusAt}))}
  function clearAccess(){currentAccess=null;try{localStorage.removeItem(ACCESS_KEY)}catch(e){}}
  function applyIdentity(x,options){
    options=options||{};
    if(identityBusy||!x||clean(x.status)!=='approved')return false;
    var name=clean(x.name||x.canonical_name||googleDisplayName()),seflik=clean(x.seflik||x.canonical_seflik||localIdentity().seflik||'Dosya'),bolme=clean(x.bolme_no||x.bolmeNo||localIdentity().bolmeNo),gName=googleDisplayName(),gAvatar=clean(x.avatar_url||x.google_avatar_url||googleAvatarUrl());
    if(!validIdentity(name,seflik))return false;
    identityBusy=true;var changed=false;
    try{
      var panel=getJson(PANEL_KEY,{});
      if(clean(panel.name)!==name||clean(panel.seflik)!==seflik||clean(panel.googleUserId)!==uid()||panel.googleApproved!==true)changed=true;
      panel=Object.assign({},panel,{name:name,seflik:seflik,bolmeNo:bolme,googleUserId:uid(),googleEmail:clean(x.email||user().email),googleFullName:clean(gName||name),googleAvatarUrl:gAvatar,avatarUrl:gAvatar,googleApproved:true});setJson(PANEL_KEY,panel);
      var st=getJson(SETTINGS_KEY,{});
      if(clean(st.ekipNot)!==name||clean(st.seflik)!==seflik||(bolme&&clean(st.bolmeNo)!==bolme))changed=true;
      st=Object.assign({},st,{ekipNot:name,seflik:clean(st.seflik||seflik||'')});if(bolme)st.bolmeNo=bolme;setJson(SETTINGS_KEY,st);
      try{
        if(window.state&&window.state.settings){
          var ws=window.state.settings;
          if(clean(ws.ekipNot)!==name||clean(ws.seflik)!==seflik||(bolme&&clean(ws.bolmeNo)!==bolme))changed=true;
          ws.ekipNot=name;if(!clean(ws.seflik))ws.seflik=seflik;if(bolme)ws.bolmeNo=bolme;
          if(changed&&typeof window.saveSettings==='function')window.saveSettings();
          else if(changed&&window.MesahaStorageV527&&typeof window.MesahaStorageV527.saveSettings==='function')Promise.resolve(window.MesahaStorageV527.saveSettings(ws,{reason:'google-canonical-v548'})).catch(function(){});
        }
      }catch(e){}
      ['ekipNot','panelNameV316'].forEach(function(id){var el=document.getElementById(id);if(el){if(clean(el.value)!==name)changed=true;el.value=name;el.readOnly=true;el.setAttribute('aria-readonly','true')}});
      ['seflik','panelSeflikV316'].forEach(function(id){var el=document.getElementById(id);if(el){if(clean(el.value)!==seflik)changed=true;el.value=seflik;el.readOnly=true;el.setAttribute('aria-readonly','true')}});
      var badge=document.getElementById('userBadge');if(badge){badge.textContent=name;badge.classList.remove('login-needed')}
      try{clearTerminalMode();ensureTerminalCodePanel()}catch(e){}
      if(changed&&!options.silent){try{window.dispatchEvent(new CustomEvent('mesaha:google-access-approved',{detail:x}));window.dispatchEvent(new Event('mesaha:settings-saved'))}catch(e){}}
      return true;
    }finally{identityBusy=false}
  }
  function enforceCanonicalSoon(){var x=currentAccess||cached();if(!x||x.status!=='approved')return;setTimeout(function(){applyIdentity(x,{silent:true})},30)}
  function style(){if(document.getElementById('mesaha-google-auth-v548-style'))return;var s=document.createElement('style');s.id='mesaha-google-auth-v548-style';s.textContent='\
#firstLoginOverlayV321{display:none!important}.google-auth-v548{position:fixed;inset:0;z-index:2147483600;background:linear-gradient(155deg,rgba(240,253,244,.98),rgba(239,246,255,.98));display:flex;align-items:center;justify-content:center;padding:18px;font-family:inherit}.google-auth-v548.hidden{display:none!important}.google-auth-card-v548{width:min(460px,100%);max-height:calc(100dvh - 36px);overflow:auto;background:#fff;border:1px solid #dbeafe;border-radius:28px;padding:24px;box-shadow:0 30px 90px rgba(15,23,42,.22);color:#0f172a}.google-auth-brand-v548{display:flex;gap:13px;align-items:center;margin-bottom:17px}.google-auth-brand-v548 img{width:58px;height:58px;object-fit:contain}.google-auth-brand-v548 h2{font-size:23px;margin:0}.google-auth-brand-v548 p{margin:4px 0 0;color:#64748b;font-weight:700;font-size:13px}.google-auth-status-v548{border-radius:18px;padding:14px;margin:12px 0;background:#f8fafc;border:1px solid #e2e8f0;line-height:1.45;font-weight:750;font-size:14px}.google-auth-status-v548.pending{background:#fffbeb;border-color:#fde68a;color:#92400e}.google-auth-status-v548.denied{background:#fef2f2;border-color:#fecaca;color:#991b1b}.google-auth-status-v548.ok{background:#f0fdf4;border-color:#bbf7d0;color:#166534}.google-auth-btn-v548{width:100%;min-height:54px;border:0;border-radius:17px;padding:12px 15px;font-size:16px;font-weight:950;margin-top:10px;cursor:pointer}.google-auth-btn-v548.primary{background:#fff;color:#1f2937;border:1px solid #cbd5e1;box-shadow:0 8px 22px rgba(15,23,42,.09)}.google-auth-btn-v548.primary:before{content:"G";display:inline-grid;place-items:center;width:27px;height:27px;margin-right:10px;border-radius:50%;font-size:18px;color:#2563eb;background:#eff6ff}.google-auth-btn-v548.green{background:#16a34a;color:#fff}.google-auth-btn-v548.subtle{background:#f1f5f9;color:#334155}.google-auth-btn-v548.danger{background:#fff1f2;color:#be123c}.google-auth-btn-v548:disabled{opacity:.55;cursor:wait}.google-auth-fields-v548{display:grid;gap:11px;margin:14px 0}.google-auth-fields-v548 label{font-weight:900;font-size:13px}.google-auth-fields-v548 input{box-sizing:border-box;width:100%;margin-top:6px;min-height:50px;border:1px solid #cbd5e1;border-radius:15px;padding:12px;font:inherit;font-weight:800}.google-auth-email-v548{overflow-wrap:anywhere;font-size:12px;color:#475569;text-align:center;margin:10px 0}.google-auth-note-v548{font-size:12px;color:#64748b;line-height:1.45;margin:13px 0 0}.terminal-code-v557{font-size:34px;font-weight:1000;letter-spacing:3px;text-align:center;border:1px dashed #93c5fd;border-radius:18px;background:#eff6ff;color:#1d4ed8;padding:18px;margin:12px 0}.terminal-code-panel-v557{border:1px solid #bfdbfe;background:#eff6ff;border-radius:18px;padding:12px;margin:12px 0;color:#1e3a8a}.terminal-code-panel-v557 b{font-size:15px}.terminal-code-panel-v557 p{font-size:12px;line-height:1.45;margin:6px 0 10px;color:#475569;font-weight:750}.google-auth-spinner-v548{width:24px;height:24px;border:3px solid #dbeafe;border-top-color:#2563eb;border-radius:50%;animation:googleSpinV548 .8s linear infinite;margin:8px auto}@keyframes googleSpinV548{to{transform:rotate(360deg)}}';document.head.appendChild(s)}
  function ensure(){
    style();if(overlay)return overlay;overlay=document.createElement('div');overlay.id='googleAuthOverlayV548';overlay.className='google-auth-v548 hidden';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.innerHTML='<div class="google-auth-card-v548"><div class="google-auth-brand-v548"><img src="./assets/mesaha_logo.png" alt=""><div><h2>Mesaha İO Güvenli Giriş</h2><p>Kimliğin Google hesabınla doğrulanır.</p></div></div><div id="googleAuthBodyV548"></div></div>';document.body.appendChild(overlay);return overlay
  }
  function show(html){ensure();var b=document.getElementById('googleAuthBodyV548');if(b)b.innerHTML=html;overlay.classList.remove('hidden');bindActions()}
  function hide(){if(overlay)overlay.classList.add('hidden')}
  function button(action,text,kind){return'<button type="button" class="google-auth-btn-v548 '+(kind||'subtle')+'" data-google-action-v548="'+esc(action)+'">'+esc(text)+'</button>'}
  function loading(text){show('<div class="google-auth-spinner-v548"></div><div class="google-auth-status-v548">'+esc(text||'Kontrol ediliyor…')+'</div>')}
  function bindActions(){document.querySelectorAll('[data-google-action-v548]').forEach(function(el){if(el.__ga548)return;el.__ga548=true;el.addEventListener('click',function(){handle(el.getAttribute('data-google-action-v548')).catch(fail)})})}
  function friendlyError(e){var msg=clean(e&&e.message||e||'İşlem başarısız');if(/email_exists|already been registered|already registered/i.test(msg))return 'Bu Google e-postası sistemde zaten kayıtlı. Eski anonim oturumu bağlamak yerine doğrudan Google hesabıyla yeniden giriş yapılacak.';if(/failed to fetch|networkerror|load failed|network request failed/i.test(msg))return 'Bağlantı kısa süreli kesildi. İnternet bağlantısını kontrol edip Tekrar dene butonuna bas.';return msg}
  function fail(e){loginLog('google_auth_fail',{error:e,message:e&&e.message,code:e&&e.code,canPlainGoogle:!!(e&&e.canPlainGoogle)},'error');BUSY=false;var msg=friendlyError(e),primary=(e&&e.canPlainGoogle)?button('google','Google ile tekrar giriş yap','primary'):button('refresh','Tekrar dene','primary');show('<div class="google-auth-status-v548 denied"><b>İşlem tamamlanamadı</b><br>'+esc(msg)+'</div>'+primary+(session()?button('logout','Bu Google oturumundan çık','subtle'):'') )}
  function decodeJwtUser(token){try{var part=String(token||'').split('.')[1];if(!part)return null;part=part.replace(/-/g,'+').replace(/_/g,'/');while(part.length%4)part+='=';var bin=atob(part),bytes=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);var payload=JSON.parse(new TextDecoder().decode(bytes));if(!payload||!payload.sub)return null;return{id:String(payload.sub),email:clean(payload.email),aud:payload.aud||'authenticated',role:payload.role||'authenticated',app_metadata:payload.app_metadata||{},user_metadata:payload.user_metadata||{},is_anonymous:payload.is_anonymous===true,identities:[]}}catch(e){return null}}
  async function getAuthUser(token){var local=decodeJwtUser(token);if(local)return local;var c=cfg(),ctrl=typeof AbortController!=='undefined'?new AbortController():null,timer=ctrl?setTimeout(function(){ctrl.abort()},10000):0;try{var r=await fetch(c.url+'/auth/v1/user',{headers:{apikey:c.anonKey,Authorization:'Bearer '+token},cache:'no-store',signal:ctrl&&ctrl.signal}),t=await r.text(),j={};try{j=t?JSON.parse(t):{}}catch(e){}if(!r.ok||!j.id)throw new Error(j.message||'Google kullanıcı bilgisi alınamadı');return j}catch(e){throw new Error(/abort/i.test(clean(e&&e.name||e))?'Google oturum doğrulaması zaman aşımına uğradı.':friendlyError(e))}finally{if(timer)clearTimeout(timer)}}
  async function consumeCallback(){
    loginLog('consume_callback_start',{url:location.href},'debug');
    var q=mergedAuthParams(),errCode=clean(q.get('error_code')||q.get('error')),errDesc=clean(q.get('error_description')||q.get('error'));
    if(errCode||errDesc){
      loginLog('consume_callback_error_url',{error_code:errCode,error_description:errDesc},'error');
      try{history.replaceState(null,document.title,redirectUrl())}catch(e){}
      if(/email_exists|already_registered|already been registered/i.test(errCode+' '+errDesc)){
        try{var a0=api();if(a0&&a0.clearSession)a0.clearSession()}catch(e){}
        clearAccess();markPlainOauth(true);loginLog('email_exists_detected_session_cleared',{error_code:errCode,error_description:errDesc},'error');
        if(!recentEmailExistsRetry()){
          setEmailExistsRetry();loginLog('email_exists_auto_plain_retry',{redirectUrl:redirectUrl()},'info');
          setTimeout(function(){goPlainOAuth('email_exists_auto_retry')},150);return true;
        }
        var ex=new Error('Bu Google e-postası sistemde zaten kayıtlı. Eski anonim oturum temizlendi; doğrudan Google hesabıyla giriş yapılacak.');
        ex.code='email_exists';ex.canPlainGoogle=true;throw ex;
      }
      var er=new Error(errDesc||errCode||'Google girişi tamamlanamadı');er.code=errCode;throw er;
    }
    var raw=location.hash&&location.hash.slice(1);if(!raw)return false;q=new URLSearchParams(raw);if(!q.get('access_token')){loginLog('consume_callback_no_access_token',{hasHash:!!raw},'debug');return false;}
    loginLog('consume_callback_token_found',{hasRefreshToken:!!q.get('refresh_token'),expiresIn:q.get('expires_in')},'info');
    var token=q.get('access_token'),refresh=q.get('refresh_token'),expiresIn=Number(q.get('expires_in')||3600),expiresAt=Number(q.get('expires_at')||0)||Math.floor(Date.now()/1000)+expiresIn,u=decodeJwtUser(token)||await getAuthUser(token);var a=api();if(!a||!a.saveExternalSession)throw new Error('Oturum motoru hazır değil');a.saveExternalSession({access_token:token,refresh_token:refresh,expires_at:expiresAt,expires_in:expiresIn,user:u});loginLog('external_session_saved',{userId:u&&u.id,email:u&&u.email,providers:providers(u)},'info');markPlainOauth(false);clearEmailExistsRetry();history.replaceState(null,document.title,redirectUrl());return true
  }
  function googleStartError(j,status){
    var raw=clean(j&& (j.message||j.msg||j.error_description||j.error) || '');
    if(/unsupported provider|provider is not enabled|provider.*disabled/i.test(raw)){
      return new Error('Google girişi Supabase projesinde henüz etkin değil. Supabase → Authentication → Providers → Google bölümünde Client ID ve Client Secret girilip Google sağlayıcısı açılmalıdır.');
    }
    if(/redirect|not allowed|unauthorized redirect/i.test(raw)){
      return new Error('Bu test adresi Supabase Redirect URLs listesinde değil: '+redirectUrl());
    }
    var e=new Error(raw||'Google hesap bağlantısı başlatılamadı.');e.status=status||0;e.payload=j||{};return e;
  }
  async function oauthStartUrl(path,token){
    // V5.56: /auth/v1/authorize uç noktası tarayıcıdan fetch edilince bazı cihazlarda CORS/Failed to fetch veriyor.
    // Bu endpoint zaten tarayıcı yönlendirmesi içindir; bu yüzden fetch yapmadan doğrudan açıyoruz.
    var c=cfg(),url=c.url+String(path||'').replace(/&?skip_http_redirect=true/g,'');
    loginLog('oauth_start_direct',{path:String(path||''),hadToken:!!token,redirectUrl:redirectUrl()},'info');
    return url;
  }
  async function beginGoogle(){
    loginLog('begin_google_click',{hasSession:!!session(),isAnon:isAnon(),plainNeeded:plainOauthNeeded(),redirectUrl:redirectUrl()},'info');
    if(BUSY)return;BUSY=true;var a=api(),redir=redirectUrl(),path,plain=plainOauthNeeded();
    if(session()&&isAnon()&&!plain){
      loginLog('anon_session_plain_google_fallback',{reason:'identity_link_fetch_removed_v556',redirectUrl:redir},'info');
      try{if(a&&a.clearSession)a.clearSession()}catch(e){}
      markPlainOauth(true);plain=true;
    }
    if(plain){try{if(a&&a.clearSession)a.clearSession()}catch(e){}}
    path='/auth/v1/authorize?provider=google&redirect_to='+encodeURIComponent(redir);
    var url2=await oauthStartUrl(path,'');loginLog('oauth_redirect_plain_google',{path:path,redirectUrl:redir,direct:true},'info');location.assign(url2);
  }
  async function rpcCompat(primary,fallback,params){try{return await rpc(primary,params)}catch(e){var msg=clean(e&&e.message||e);if(/could not find the function|schema cache|does not exist|SQL kurulumu eksik/i.test(msg)){loginLog('rpc_compat_fallback',{primary:primary,fallback:fallback,message:msg},'warning');return await rpc(fallback,params)}throw e}}
  async function accessStatus(force){
    loginLog('access_status_start',{force:!!force,hasSession:!!session(),isGoogle:isGoogle(),online:navigator.onLine!==false},'debug');
    var a=api();if(!a||!session()||!isGoogle()){loginLog('access_status_skipped',{hasApi:!!a,hasSession:!!session(),isGoogle:isGoogle()},'debug');return null;}
    var known=currentAccess||cached();
    if(!force&&known&&lastStatusAt&&Date.now()-lastStatusAt<STATUS_TTL)return known;
    if(!force&&navigator.onLine===false){if(known&&known.status==='approved')return known;throw new Error('İlk Google doğrulaması için internet gerekli.')}
    if(statusPromise)return statusPromise;
    statusPromise=(async function(){try{var out=await rpcCompat('mesaha_google_access_status_v560','mesaha_google_access_status_v557',{p_device_info:deviceInfo(),p_app_version:(window.MESAHA_VERSION||{}).visibleVersion||'V5.64',p_google_full_name:googleDisplayName()});var x=out.access||out;x.user_id=x.user_id||uid();x.email=x.email||clean(user().email);clearEmailExistsRetry();cacheAccess(x);loginLog('access_status_ok',{status:x.status,email:x.email,user_id:x.user_id},'info');return x}catch(e){loginLog('access_status_error',{error:e,message:e&&e.message},'error');var c=currentAccess||cached();if(c&&c.status==='approved')return c;throw e}finally{statusPromise=null}})();
    return statusPromise;
  }
  function deviceInfo(){var nav=navigator||{};return{deviceId:(api()&&api().getDeviceId?api().getDeviceId():''),platform:clean(nav.userAgentData&&nav.userAgentData.platform||nav.platform),userAgent:clean(nav.userAgent).slice(0,500),standalone:!!(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||nav.standalone===true}}
  function copyText(v){v=clean(v);if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(v);try{var ta=document.createElement('textarea');ta.value=v;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}catch(e){}return Promise.resolve()}
  function terminalCodeHtml(code,expiresAt){return '<div class="google-auth-status-v548 ok"><b>Terminal kodu hazır</b><br>Bu kodu terminal cihazdaki <b>Terminal giriş modu</b> ekranına girin.</div><div class="terminal-code-v557" id="terminalCodeValueV557">'+esc(code)+'</div><p class="google-auth-note-v548">Kod tek kullanımlıktır ve '+esc(expiresAt||'kısa süre')+' tarihine kadar geçerlidir. Terminal bu kodla kullanıcı/şeflik kimliğine eşleşir; Buluta Yedekle ve Buluttan Getir bu kullanıcı adına açık olur.</p>'+button('terminal-code-copy','Kodu kopyala','primary')+button('terminal-code-close','Kapat','subtle')}
  async function createTerminalCode(){var x=currentAccess||cached();if(!x||clean(x.status)!=='approved')throw new Error('Terminal kodu oluşturmak için önce Google ile giriş yapın.');loading('Terminal kodu oluşturuluyor…');loginLog('terminal_code_create_start',{userId:uid()},'info');var out=await rpc('mesaha_create_terminal_code_v557',{p_label:'terminal',p_app_version:(window.MESAHA_VERSION||{}).visibleVersion||'V5.64'});var t=out.terminal||out;lastTerminalCode=clean(t.code);loginLog('terminal_code_create_ok',{expires_at:t.expires_at},'info');show(terminalCodeHtml(lastTerminalCode,t.expires_at));return out}
  function ensureTerminalCodePanel(){try{var x=currentAccess||cached();if(!x||clean(x.status)!=='approved')return;var card=document.querySelector('#userPanelOverlayV316 .panel-card-v316');if(!card||document.getElementById('terminalCodePanelV557'))return;var before=document.getElementById('panelTelegramSectionV515'),box=document.createElement('div');box.id='terminalCodePanelV557';box.className='terminal-code-panel-v557';box.innerHTML='<b>Terminal eşleştirme</b><p>Terminal cihazda Google hesabı açmadan bu kullanıcıya bağlamak için tek kullanımlık kod oluştur.</p><button class="btn primary full" id="createTerminalCodeBtnV557" type="button">Terminal kodu oluştur</button>';if(before&&before.parentNode)before.parentNode.insertBefore(box,before);else card.appendChild(box);var btn=document.getElementById('createTerminalCodeBtnV557');if(btn&&!btn.__terminalCodeV557){btn.__terminalCodeV557=true;btn.addEventListener('click',function(ev){ev.preventDefault();createTerminalCode().catch(fail)},true)}}catch(e){}}
  function renderAccess(x){
    x=x||{};var status=clean(x.status||'unregistered');loginLog('render_access',{status:status,email:clean(x.email||user().email)},status==='approved'?'info':(status==='pending'?'info':'debug'));var email=clean(x.email||user().email);
    if(status==='approved'){
      if(applyIdentity(x)){hide();ensureTerminalCodePanel();[120,700,1800,4200,6500].forEach(function(ms){setTimeout(function(){applyIdentity(x,{silent:true})},ms)});setTimeout(function(){try{if((!window.performance||performance.now()>3000)&&window.MesahaIpV518)window.MesahaIpV518.ping('profile_saved',true)}catch(e){}},500);return}
    }
    if(status==='pending')return show('<div class="google-auth-status-v548 pending"><b>Otomatik onay bekleniyor</b><br>Bu kullanıcı eski SQL nedeniyle beklemede görünüyor. Supabase SQL Editor’da V5.59 terminal bulut SQL dosyasını çalıştırın.</div><div class="google-auth-email-v548">'+esc(email)+'</div>'+button('refresh','Tekrar kontrol et','primary')+button('request-form','Bilgilerle tekrar dene','green')+button('logout','Başka Google hesabı kullan','subtle'));
    if(status==='rejected'||status==='revoked')return show('<div class="google-auth-status-v548 denied"><b>Erişim '+(status==='revoked'?'kapatıldı':'reddedildi')+'</b><br>'+esc(x.reason||'Yönetici ile iletişime geçin.')+'</div><div class="google-auth-email-v548">'+esc(email)+'</div>'+button('request-form','Bilgileri güncelle','primary')+button('logout','Başka Google hesabı kullan','subtle'));
    var li=localIdentity();
    if(clean(li.name).length>=2){setTimeout(function(){requestAccess({name:li.name,seflik:li.seflik||'Dosya'}).catch(fail)},80);return loading('Google hesabı '+li.name+' kullanıcısına tanımlanıyor…')}
    show('<div class="google-auth-status-v548"><b>Google hesabın doğrulandı.</b><br>Google ad-soyad otomatik alınır; şeflik artık yalnız dosya adı/mesaha bilgisi için kullanılır.</div><div class="google-auth-email-v548">'+esc(email)+'</div><div class="google-auth-fields-v548"><label>Kullanıcı adı<input id="googleRequestNameV548" maxlength="120" value="'+esc(li.name)+'" autocomplete="name"></label><label>Dosya Şefliği <small style="font-weight:700;color:#64748b">(sadece dosya adı)</small><input id="googleRequestSeflikV548" maxlength="120" value="'+esc(li.seflik)+'" autocomplete="organization"></label></div>'+button('request','Google ile devam et','green')+button('logout','Başka Google hesabı kullan','subtle')+'<p class="google-auth-note-v548">İsim alanı Google profilindeki ad-soyad ile otomatik güncellenir; bulut yedek ve şeflik işlemlerinde bu isim kullanılır.</p>')
  }
  async function requestAccess(data){loginLog('request_access_click',{auto:!!data},'info');data=data||{};var n=document.getElementById('googleRequestNameV548'),s=document.getElementById('googleRequestSeflikV548'),gName=googleDisplayName(),name=clean(gName||data.name||n&&n.value),seflik=clean(data.seflik||s&&s.value||'Dosya');if(clean(name).length<2)throw new Error('Google ad-soyad alınamadı. Ad soyad girin.');loading('Google hesabı kullanıcıya tanımlanıyor…');loginLog('request_access_send',{name:name,seflik:seflik,googleFullName:gName,googleAvatarUrl:googleAvatarUrl(),auto:true},'info');var out=await rpcCompat('mesaha_google_access_request_v560','mesaha_google_access_request_v557',{p_name:name,p_seflik:seflik,p_device_info:deviceInfo(),p_app_version:(window.MESAHA_VERSION||{}).visibleVersion||'V5.64',p_google_full_name:gName});renderAccess(out.access||out)}
  
  async function logout(){loginLog('logout_start',{},'info');loading('Oturum kapatılıyor…');try{await api().signOut('global')}catch(e){try{api().clearSession()}catch(_e){}}clearAccess();location.replace(redirectUrl())}
  async function handle(action){if(action==='google'){clearTerminalMode();return beginGoogle()}if(action==='terminal')return terminalForm();if(action==='terminal-save')return saveTerminalFromForm();if(action==='terminal-claim')return claimTerminalCode();if(action==='terminal-code-copy')return copyText(lastTerminalCode).then(function(){try{if(typeof window.mesahaFloatToastV315==='function')window.mesahaFloatToastV315('Kod kopyalandı',lastTerminalCode,'success')}catch(e){}});if(action==='terminal-code-close'){hide();ensureTerminalCodePanel();return true}if(action==='refresh')return boot(true);if(action==='request')return requestAccess();if(action==='request-form')return renderAccess({status:'unregistered',email:user().email});if(action==='logout')return logout()}
    async function bootCore(force){
    loginLog('boot_core_start',{force:!!force,hasSession:!!session(),isGoogle:isGoogle(),terminalMode:isTerminalMode(),url:location.href},'info');
    if(isTerminalMode()&&!hasAuthCallback()){ensure();hide();try{var td=terminalData();writeTerminalIdentity(td)}catch(_te){}loginLog('terminal_mode_boot_skip_google',{},'info');return false}
    ensure();loading('Güvenli oturum kontrol ediliyor…');await consumeCallback();var a=api();if(!a)throw new Error('Supabase oturum motoru yüklenemedi.');await a.ready();
    if(!session()){var ca=cached(),li=localIdentity();if(ca&&clean(ca.status)==='approved'&&validIdentity(li.name,li.seflik)){currentAccess=ca;loginLog('boot_cached_approved_no_session',{cachedAt:ca.cached_at,reason:'long_session_cache'},'info');applyIdentity(ca,{silent:true});hide();ensureTerminalCodePanel();return false;}loginLog('boot_no_session',{terminalAvailable:true},'info');return show('<div class="google-auth-status-v548"><b>Google ile giriş gerekli</b><br>Bulut ve ortak şeflik özellikleri için Google hesabı gerekir.</div>'+button('google','Google ile giriş yap','primary')+button('terminal','Terminal giriş modu (Misafir modu)','subtle')+'<p class="google-auth-note-v548">Terminal koduyla kullanıcıya eşleşebilir; Buluta Yedekle ve Buluttan Getir açılır.</p>');}
    if(!isGoogle()){loginLog('boot_non_google_session',{providers:providers()},'info');return show('<div class="google-auth-status-v548 pending"><b>Eski oturumunu güvene al</b><br>Google hesabını bağladığında mevcut kullanıcı kimliğin ve bulut yedeklerin korunur.</div>'+button('google','Google hesabımı bağla','primary')+button('logout','Eski oturumu sil','subtle'));}
    var x=await accessStatus(force===true);renderAccess(x||{status:'unregistered',email:user().email})
  }
  function boot(force){if(bootPromise)return bootPromise;bootPromise=bootCore(force).finally(function(){bootPromise=null});return bootPromise}
  window.MesahaGoogleAuthV548={boot:boot,status:accessStatus,access:function(){return currentAccess||cached()},isApproved:function(){var x=currentAccess||cached();return !!(x&&x.status==='approved')},createTerminalCode:createTerminalCode,claimTerminalCode:claimTerminalCode,logout:logout};
  function start(){boot(false).catch(fail)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('mesaha:google-auth-required',function(e){try{var d=e&&e.detail||{};if(d.access)cacheAccess(d.access);boot(true).catch(fail)}catch(_e){}},{passive:true});
  window.addEventListener('online',function(){var x=currentAccess||cached();if(!x||x.status!=='approved')boot(true).catch(function(){})},{passive:true});
  ['mesaha:storage-recovered','mesaha:identity-restored','mesaha:user-login','mesaha:settings-saved'].forEach(function(name){window.addEventListener(name,enforceCanonicalSoon,{passive:true})});
  window.addEventListener('pageshow',function(){setTimeout(function(){var x=currentAccess||cached();if(!x)boot(false).catch(function(){});ensureTerminalCodePanel()},100)},{passive:true});[500,1500,3500,7000].forEach(function(ms){setTimeout(ensureTerminalCodePanel,ms)});
})();
