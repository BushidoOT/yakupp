/* Mesaha İO V5.53 — Google sağlayıcı ön kontrolü, anlaşılır hata ve admin onay kapısı.
   - Yeni anonim kullanıcı üretmez.
   - Mevcut anonim Supabase oturumunu Google kimliğine linkleyerek user_id ve yedekleri korur.
   - Google hesabı doğrulansa dahi admin onayı olmadan sunucu işlemleri açılmaz.
   - Daha önce onaylanmış cihaz offline açılışta yerel çalışmaya devam eder. */
(function(){
  'use strict';
  var ACCESS_KEY='mesaha_google_access_v548';
  var PLAIN_OAUTH_KEY='mesaha_google_plain_oauth_v553';
  var PANEL_KEY='mesaha_panel_user_v316';
  var SETTINGS_KEY='cam_mesaha_ayarlar_v1';
  var BUSY=false, overlay=null, currentAccess=null, statusPromise=null, bootPromise=null, lastStatusAt=0, identityBusy=false;
  var STATUS_TTL=30000;
  window.__mesahaGoogleAuthV548=true;

  function clean(v){return String(v==null?'':v).trim().replace(/\s+/g,' ')}
  function esc(v){return clean(v).replace(/[&<>"']/g,function(m){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]})}
  function getJson(k,f){try{var v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}}
  function setJson(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
  function cfg(){var c=window.MESAHA_SUPABASE_CONFIG||{};return{url:clean(c.url).replace(/\/+$/,''),anonKey:clean(c.anonKey||c.anon_key)}}
  function api(){return window.mesahaSupabase||window.mesahaCloud||null}
  async function rpc(name,params){
    var c=cfg(),a=api();
    if(!a||!a.getAccessToken)throw new Error('Supabase oturum motoru hazır değil');
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
        throw new Error(/abort/i.test(raw)?'Google erişim kontrolü zaman aşımına uğradı.':'Supabase erişim servisine bağlanılamadı.');
      }finally{if(timer)clearTimeout(timer)}
    }
    if(!res)throw lastError||new Error('Supabase erişim servisine bağlanılamadı.');
    var rawText=await res.text(),out={};try{out=rawText?JSON.parse(rawText):{}}catch(e){out={message:rawText}}
    if(!res.ok){
      var msg=clean(out&& (out.message||out.error||out.details||out.hint) || ('RPC hata '+res.status));
      if(/could not find the function|schema cache|does not exist/i.test(msg))msg='Google erişim SQL kurulumu eksik. Supabase SQL Editor’da 20260712_v552_google_access_rpc.sql dosyasını çalıştır.';
      var err=new Error(msg);err.status=res.status;err.payload=out;throw err;
    }
    return out&&typeof out==='object'?out:{};
  }
  function session(){var a=api();return a&&a.getStoredSession?a.getStoredSession():null}
  function user(){var s=session()||{};return s.user||{}}
  function uid(){return clean(user().id)}
  function providers(u){u=u||user();var out=[];try{(u.identities||[]).forEach(function(x){if(x&&x.provider)out.push(String(x.provider))})}catch(e){}try{var p=u.app_metadata&&u.app_metadata.providers;if(Array.isArray(p))out=out.concat(p.map(String))}catch(e){}if(u.app_metadata&&u.app_metadata.provider)out.push(String(u.app_metadata.provider));return Array.from(new Set(out))}
  function isGoogle(){var a=api();return a&&a.isGoogle?a.isGoogle():providers().indexOf('google')>=0}
  function isAnon(){var a=api();return a&&a.isAnonymous?a.isAnonymous():user().is_anonymous===true}
  function redirectUrl(){var u=new URL(location.href);u.hash='';['code','error','error_code','error_description','sb'].forEach(function(k){u.searchParams.delete(k)});return u.origin+u.pathname}
  function mergedAuthParams(){var p=new URLSearchParams();try{new URLSearchParams(location.search||'').forEach(function(v,k){p.set(k,v)})}catch(e){}try{var raw=location.hash&&location.hash.slice(1);if(raw)new URLSearchParams(raw).forEach(function(v,k){if(!p.has(k))p.set(k,v)})}catch(e){}return p}
  function markPlainOauth(on){try{if(on)localStorage.setItem(PLAIN_OAUTH_KEY,String(Date.now()));else localStorage.removeItem(PLAIN_OAUTH_KEY)}catch(e){}}
  function plainOauthNeeded(){try{var t=Number(localStorage.getItem(PLAIN_OAUTH_KEY)||0)||0;return !!(t&&Date.now()-t<10*60*1000)}catch(e){return false}}
  function localIdentity(){
    var panel=getJson(PANEL_KEY,{}),st={};try{st=window.state&&window.state.settings||{}}catch(e){}if(!clean(st.ekipNot)||!clean(st.seflik))st=getJson(SETTINGS_KEY,{});
    return{name:clean(panel.name||st.ekipNot),seflik:clean(panel.seflik||st.seflik),bolmeNo:clean(panel.bolmeNo||st.bolmeNo)}
  }
  function validIdentity(name,seflik){name=clean(name);seflik=clean(seflik);if(name.length<2||seflik.length<2)return false;var n=name.toLocaleLowerCase('tr-TR'),s=seflik.toLocaleLowerCase('tr-TR');return !/^(kullanıcı|kullanici|user|guest|misafir|boş|bos|-)$/.test(n)&&!/^(şeflik|seflik|unknown|bilinmiyor|boş|bos|-)$/.test(s)}
  function cached(){var x=getJson(ACCESS_KEY,null);if(!x||clean(x.user_id)!==uid())return null;return x}
  function cacheAccess(x){if(!x)return;currentAccess=x;lastStatusAt=Date.now();setJson(ACCESS_KEY,Object.assign({},x,{cached_at:lastStatusAt}))}
  function clearAccess(){currentAccess=null;try{localStorage.removeItem(ACCESS_KEY)}catch(e){}}
  function applyIdentity(x,options){
    options=options||{};
    if(identityBusy||!x||clean(x.status)!=='approved')return false;
    var name=clean(x.name||x.canonical_name),seflik=clean(x.seflik||x.canonical_seflik),bolme=clean(x.bolme_no||x.bolmeNo||localIdentity().bolmeNo);
    if(!validIdentity(name,seflik))return false;
    identityBusy=true;var changed=false;
    try{
      var panel=getJson(PANEL_KEY,{});
      if(clean(panel.name)!==name||clean(panel.seflik)!==seflik||clean(panel.googleUserId)!==uid()||panel.googleApproved!==true)changed=true;
      panel=Object.assign({},panel,{name:name,seflik:seflik,bolmeNo:bolme,googleUserId:uid(),googleEmail:clean(x.email||user().email),googleApproved:true});setJson(PANEL_KEY,panel);
      var st=getJson(SETTINGS_KEY,{});
      if(clean(st.ekipNot)!==name||clean(st.seflik)!==seflik||(bolme&&clean(st.bolmeNo)!==bolme))changed=true;
      st=Object.assign({},st,{ekipNot:name,seflik:seflik});if(bolme)st.bolmeNo=bolme;setJson(SETTINGS_KEY,st);
      try{
        if(window.state&&window.state.settings){
          var ws=window.state.settings;
          if(clean(ws.ekipNot)!==name||clean(ws.seflik)!==seflik||(bolme&&clean(ws.bolmeNo)!==bolme))changed=true;
          ws.ekipNot=name;ws.seflik=seflik;if(bolme)ws.bolmeNo=bolme;
          if(changed&&typeof window.saveSettings==='function')window.saveSettings();
          else if(changed&&window.MesahaStorageV527&&typeof window.MesahaStorageV527.saveSettings==='function')Promise.resolve(window.MesahaStorageV527.saveSettings(ws,{reason:'google-canonical-v548'})).catch(function(){});
        }
      }catch(e){}
      ['ekipNot','panelNameV316'].forEach(function(id){var el=document.getElementById(id);if(el){if(clean(el.value)!==name)changed=true;el.value=name;el.readOnly=true;el.setAttribute('aria-readonly','true')}});
      ['seflik','panelSeflikV316'].forEach(function(id){var el=document.getElementById(id);if(el){if(clean(el.value)!==seflik)changed=true;el.value=seflik;el.readOnly=true;el.setAttribute('aria-readonly','true')}});
      var badge=document.getElementById('userBadge');if(badge){badge.textContent=name+' • '+seflik;badge.classList.remove('login-needed')}
      if(changed&&!options.silent){try{window.dispatchEvent(new CustomEvent('mesaha:google-access-approved',{detail:x}));window.dispatchEvent(new Event('mesaha:settings-saved'))}catch(e){}}
      return true;
    }finally{identityBusy=false}
  }
  function enforceCanonicalSoon(){var x=currentAccess||cached();if(!x||x.status!=='approved')return;setTimeout(function(){applyIdentity(x,{silent:true})},30)}
  function style(){if(document.getElementById('mesaha-google-auth-v548-style'))return;var s=document.createElement('style');s.id='mesaha-google-auth-v548-style';s.textContent='\
#firstLoginOverlayV321{display:none!important}.google-auth-v548{position:fixed;inset:0;z-index:100500;background:linear-gradient(155deg,rgba(240,253,244,.98),rgba(239,246,255,.98));display:flex;align-items:center;justify-content:center;padding:18px;font-family:inherit}.google-auth-v548.hidden{display:none!important}.google-auth-card-v548{width:min(460px,100%);max-height:calc(100dvh - 36px);overflow:auto;background:#fff;border:1px solid #dbeafe;border-radius:28px;padding:24px;box-shadow:0 30px 90px rgba(15,23,42,.22);color:#0f172a}.google-auth-brand-v548{display:flex;gap:13px;align-items:center;margin-bottom:17px}.google-auth-brand-v548 img{width:58px;height:58px;object-fit:contain}.google-auth-brand-v548 h2{font-size:23px;margin:0}.google-auth-brand-v548 p{margin:4px 0 0;color:#64748b;font-weight:700;font-size:13px}.google-auth-status-v548{border-radius:18px;padding:14px;margin:12px 0;background:#f8fafc;border:1px solid #e2e8f0;line-height:1.45;font-weight:750;font-size:14px}.google-auth-status-v548.pending{background:#fffbeb;border-color:#fde68a;color:#92400e}.google-auth-status-v548.denied{background:#fef2f2;border-color:#fecaca;color:#991b1b}.google-auth-status-v548.ok{background:#f0fdf4;border-color:#bbf7d0;color:#166534}.google-auth-btn-v548{width:100%;min-height:54px;border:0;border-radius:17px;padding:12px 15px;font-size:16px;font-weight:950;margin-top:10px;cursor:pointer}.google-auth-btn-v548.primary{background:#fff;color:#1f2937;border:1px solid #cbd5e1;box-shadow:0 8px 22px rgba(15,23,42,.09)}.google-auth-btn-v548.primary:before{content:"G";display:inline-grid;place-items:center;width:27px;height:27px;margin-right:10px;border-radius:50%;font-size:18px;color:#2563eb;background:#eff6ff}.google-auth-btn-v548.green{background:#16a34a;color:#fff}.google-auth-btn-v548.subtle{background:#f1f5f9;color:#334155}.google-auth-btn-v548.danger{background:#fff1f2;color:#be123c}.google-auth-btn-v548:disabled{opacity:.55;cursor:wait}.google-auth-fields-v548{display:grid;gap:11px;margin:14px 0}.google-auth-fields-v548 label{font-weight:900;font-size:13px}.google-auth-fields-v548 input{box-sizing:border-box;width:100%;margin-top:6px;min-height:50px;border:1px solid #cbd5e1;border-radius:15px;padding:12px;font:inherit;font-weight:800}.google-auth-email-v548{overflow-wrap:anywhere;font-size:12px;color:#475569;text-align:center;margin:10px 0}.google-auth-note-v548{font-size:12px;color:#64748b;line-height:1.45;margin:13px 0 0}.google-auth-spinner-v548{width:24px;height:24px;border:3px solid #dbeafe;border-top-color:#2563eb;border-radius:50%;animation:googleSpinV548 .8s linear infinite;margin:8px auto}@keyframes googleSpinV548{to{transform:rotate(360deg)}}';document.head.appendChild(s)}
  function ensure(){
    style();if(overlay)return overlay;overlay=document.createElement('div');overlay.id='googleAuthOverlayV548';overlay.className='google-auth-v548 hidden';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.innerHTML='<div class="google-auth-card-v548"><div class="google-auth-brand-v548"><img src="./assets/mesaha_logo.png" alt=""><div><h2>Mesaha İO Güvenli Giriş</h2><p>Kimliğin Google hesabınla doğrulanır.</p></div></div><div id="googleAuthBodyV548"></div></div>';document.body.appendChild(overlay);return overlay
  }
  function show(html){ensure();var b=document.getElementById('googleAuthBodyV548');if(b)b.innerHTML=html;overlay.classList.remove('hidden');bindActions()}
  function hide(){if(overlay)overlay.classList.add('hidden')}
  function button(action,text,kind){return'<button type="button" class="google-auth-btn-v548 '+(kind||'subtle')+'" data-google-action-v548="'+esc(action)+'">'+esc(text)+'</button>'}
  function loading(text){show('<div class="google-auth-spinner-v548"></div><div class="google-auth-status-v548">'+esc(text||'Kontrol ediliyor…')+'</div>')}
  function bindActions(){document.querySelectorAll('[data-google-action-v548]').forEach(function(el){if(el.__ga548)return;el.__ga548=true;el.addEventListener('click',function(){handle(el.getAttribute('data-google-action-v548')).catch(fail)})})}
  function friendlyError(e){var msg=clean(e&&e.message||e||'İşlem başarısız');if(/email_exists|already been registered|already registered/i.test(msg))return 'Bu Google e-postası sistemde zaten kayıtlı. Eski anonim oturumu bağlamak yerine doğrudan Google hesabıyla yeniden giriş yapılacak.';if(/failed to fetch|networkerror|load failed|network request failed/i.test(msg))return 'Bağlantı kısa süreli kesildi. İnternet bağlantısını kontrol edip Tekrar dene butonuna bas.';return msg}
  function fail(e){BUSY=false;var msg=friendlyError(e),primary=(e&&e.canPlainGoogle)?button('google','Google ile tekrar giriş yap','primary'):button('refresh','Tekrar dene','primary');show('<div class="google-auth-status-v548 denied"><b>İşlem tamamlanamadı</b><br>'+esc(msg)+'</div>'+primary+(session()?button('logout','Bu Google oturumundan çık','subtle'):'') )}
  function decodeJwtUser(token){try{var part=String(token||'').split('.')[1];if(!part)return null;part=part.replace(/-/g,'+').replace(/_/g,'/');while(part.length%4)part+='=';var bin=atob(part),bytes=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);var payload=JSON.parse(new TextDecoder().decode(bytes));if(!payload||!payload.sub)return null;return{id:String(payload.sub),email:clean(payload.email),aud:payload.aud||'authenticated',role:payload.role||'authenticated',app_metadata:payload.app_metadata||{},user_metadata:payload.user_metadata||{},is_anonymous:payload.is_anonymous===true,identities:[]}}catch(e){return null}}
  async function getAuthUser(token){var local=decodeJwtUser(token);if(local)return local;var c=cfg(),ctrl=typeof AbortController!=='undefined'?new AbortController():null,timer=ctrl?setTimeout(function(){ctrl.abort()},10000):0;try{var r=await fetch(c.url+'/auth/v1/user',{headers:{apikey:c.anonKey,Authorization:'Bearer '+token},cache:'no-store',signal:ctrl&&ctrl.signal}),t=await r.text(),j={};try{j=t?JSON.parse(t):{}}catch(e){}if(!r.ok||!j.id)throw new Error(j.message||'Google kullanıcı bilgisi alınamadı');return j}catch(e){throw new Error(/abort/i.test(clean(e&&e.name||e))?'Google oturum doğrulaması zaman aşımına uğradı.':friendlyError(e))}finally{if(timer)clearTimeout(timer)}}
  async function consumeCallback(){
    var q=mergedAuthParams(),errCode=clean(q.get('error_code')||q.get('error')),errDesc=clean(q.get('error_description')||q.get('error'));
    if(errCode||errDesc){
      try{history.replaceState(null,document.title,redirectUrl())}catch(e){}
      if(/email_exists|already_registered|already been registered/i.test(errCode+' '+errDesc)){
        try{var a0=api();if(a0&&a0.clearSession)a0.clearSession()}catch(e){}
        clearAccess();markPlainOauth(true);
        var ex=new Error('Bu Google e-postası sistemde zaten kayıtlı. Eski anonim oturum Google hesabına bağlanamadı; şimdi eski oturum temizlendi. Google ile tekrar giriş yap.');
        ex.code='email_exists';ex.canPlainGoogle=true;throw ex;
      }
      var er=new Error(errDesc||errCode||'Google girişi tamamlanamadı');er.code=errCode;throw er;
    }
    var raw=location.hash&&location.hash.slice(1);if(!raw)return false;q=new URLSearchParams(raw);if(!q.get('access_token'))return false;
    var token=q.get('access_token'),refresh=q.get('refresh_token'),expiresIn=Number(q.get('expires_in')||3600),expiresAt=Number(q.get('expires_at')||0)||Math.floor(Date.now()/1000)+expiresIn,u=decodeJwtUser(token)||await getAuthUser(token);var a=api();if(!a||!a.saveExternalSession)throw new Error('Oturum motoru hazır değil');a.saveExternalSession({access_token:token,refresh_token:refresh,expires_at:expiresAt,expires_in:expiresIn,user:u});markPlainOauth(false);history.replaceState(null,document.title,redirectUrl());return true
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
    var c=cfg(),headers={apikey:c.anonKey};if(token)headers.Authorization='Bearer '+token;
    var r=await fetch(c.url+path,{method:'GET',cache:'no-store',headers:headers}),t=await r.text(),j={};try{j=t?JSON.parse(t):{}}catch(e){j={message:t}}
    if(!r.ok||!j.url)throw googleStartError(j,r.status);
    return j.url;
  }
  async function beginGoogle(){
    if(BUSY)return;BUSY=true;var a=api(),redir=redirectUrl(),path,plain=plainOauthNeeded();
    if(session()&&isAnon()&&!plain){
      var token=await a.getAccessToken();
      path='/auth/v1/user/identities/authorize?provider=google&redirect_to='+encodeURIComponent(redir)+'&skip_http_redirect=true';
      location.assign(await oauthStartUrl(path,token));return
    }
    if(plain){try{if(a&&a.clearSession)a.clearSession()}catch(e){}}
    path='/auth/v1/authorize?provider=google&redirect_to='+encodeURIComponent(redir)+'&skip_http_redirect=true';
    location.assign(await oauthStartUrl(path,''));
  }
  async function accessStatus(force){
    var a=api();if(!a||!session()||!isGoogle())return null;
    var known=currentAccess||cached();
    if(!force&&known&&lastStatusAt&&Date.now()-lastStatusAt<STATUS_TTL)return known;
    if(!force&&navigator.onLine===false){if(known&&known.status==='approved')return known;throw new Error('İlk Google doğrulaması için internet gerekli.')}
    if(statusPromise)return statusPromise;
    statusPromise=(async function(){try{var out=await rpc('mesaha_google_access_status_v552',{p_device_info:deviceInfo(),p_app_version:(window.MESAHA_VERSION||{}).visibleVersion||'V5.53'});var x=out.access||out;x.user_id=x.user_id||uid();x.email=x.email||clean(user().email);cacheAccess(x);return x}catch(e){var c=currentAccess||cached();if(c&&c.status==='approved')return c;throw e}finally{statusPromise=null}})();
    return statusPromise;
  }
  function deviceInfo(){var nav=navigator||{};return{deviceId:(api()&&api().getDeviceId?api().getDeviceId():''),platform:clean(nav.userAgentData&&nav.userAgentData.platform||nav.platform),userAgent:clean(nav.userAgent).slice(0,500),standalone:!!(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||nav.standalone===true}}
  function renderAccess(x){
    x=x||{};var status=clean(x.status||'unregistered');var email=clean(x.email||user().email);
    if(status==='approved'){
      if(applyIdentity(x)){hide();[120,700,1800,4200,6500].forEach(function(ms){setTimeout(function(){applyIdentity(x,{silent:true})},ms)});setTimeout(function(){try{if((!window.performance||performance.now()>3000)&&window.MesahaIpV518)window.MesahaIpV518.ping('profile_saved',true)}catch(e){}},500);return}
    }
    if(status==='pending')return show('<div class="google-auth-status-v548 pending"><b>Yönetici onayı bekleniyor</b><br>Talebin gönderildi. Onaylandığında bu ekrandan devam edebilirsin.</div><div class="google-auth-email-v548">'+esc(email)+'</div>'+button('refresh','Onayı kontrol et','primary')+button('logout','Başka Google hesabı kullan','subtle'));
    if(status==='rejected'||status==='revoked')return show('<div class="google-auth-status-v548 denied"><b>Erişim '+(status==='revoked'?'kapatıldı':'reddedildi')+'</b><br>'+esc(x.reason||'Yönetici ile iletişime geçin.')+'</div><div class="google-auth-email-v548">'+esc(email)+'</div>'+button('request-form','Yeniden erişim talep et','primary')+button('logout','Başka Google hesabı kullan','subtle'));
    var li=localIdentity();show('<div class="google-auth-status-v548"><b>Google hesabın doğrulandı.</b><br>Mevcut kullanıcı adı ve şefliğin için yönetici onayı iste.</div><div class="google-auth-email-v548">'+esc(email)+'</div><div class="google-auth-fields-v548"><label>Kullanıcı adı<input id="googleRequestNameV548" maxlength="120" value="'+esc(li.name)+'" autocomplete="name"></label><label>Şeflik<input id="googleRequestSeflikV548" maxlength="120" value="'+esc(li.seflik)+'" autocomplete="organization"></label></div>'+button('request','Yönetici onayı iste','green')+button('logout','Başka Google hesabı kullan','subtle')+'<p class="google-auth-note-v548">Kullanıcı adı ve şeflik artık tek başına giriş sağlamaz. Bu bilgiler yalnız doğrulanmış Google hesabına bağlanır.</p>')
  }
  async function requestAccess(){var n=document.getElementById('googleRequestNameV548'),s=document.getElementById('googleRequestSeflikV548'),name=clean(n&&n.value),seflik=clean(s&&s.value);if(!validIdentity(name,seflik))throw new Error('Geçerli kullanıcı adı ve şeflik girin.');loading('Erişim talebi gönderiliyor…');var out=await rpc('mesaha_google_access_request_v552',{p_name:name,p_seflik:seflik,p_device_info:deviceInfo(),p_app_version:(window.MESAHA_VERSION||{}).visibleVersion||'V5.53'});renderAccess(out.access||out)}
  async function logout(){loading('Oturum kapatılıyor…');try{await api().signOut('global')}catch(e){try{api().clearSession()}catch(_e){}}clearAccess();location.replace(redirectUrl())}
  async function handle(action){if(action==='google')return beginGoogle();if(action==='refresh')return boot(true);if(action==='request')return requestAccess();if(action==='request-form')return renderAccess({status:'unregistered',email:user().email});if(action==='logout')return logout()}
  async function bootCore(force){
    ensure();loading('Güvenli oturum kontrol ediliyor…');await consumeCallback();var a=api();if(!a)throw new Error('Supabase oturum motoru yüklenemedi.');await a.ready();
    if(!session())return show('<div class="google-auth-status-v548"><b>Google ile giriş gerekli</b><br>Kullanıcı adı ve şeflik artık giriş anahtarı değildir.</div>'+button('google','Google ile giriş yap','primary')+'<p class="google-auth-note-v548">İlk girişte yöneticinin hesabını mevcut kullanıcı/şeflik kaydınla eşleştirmesi gerekir.</p>');
    if(!isGoogle())return show('<div class="google-auth-status-v548 pending"><b>Eski oturumunu güvene al</b><br>Google hesabını bağladığında mevcut kullanıcı kimliğin ve bulut yedeklerin korunur.</div>'+button('google','Google hesabımı bağla','primary')+button('logout','Eski oturumu sil','subtle'));
    var x=await accessStatus(force===true);renderAccess(x||{status:'unregistered',email:user().email})
  }
  function boot(force){if(bootPromise)return bootPromise;bootPromise=bootCore(force).finally(function(){bootPromise=null});return bootPromise}
  window.MesahaGoogleAuthV548={boot:boot,status:accessStatus,access:function(){return currentAccess||cached()},isApproved:function(){var x=currentAccess||cached();return !!(x&&x.status==='approved')},logout:logout};
  function start(){boot(false).catch(fail)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('mesaha:google-auth-required',function(e){try{var d=e&&e.detail||{};if(d.access)cacheAccess(d.access);boot(true).catch(fail)}catch(_e){}},{passive:true});
  window.addEventListener('online',function(){var x=currentAccess||cached();if(!x||x.status!=='approved')boot(true).catch(function(){})},{passive:true});
  ['mesaha:storage-recovered','mesaha:identity-restored','mesaha:user-login','mesaha:settings-saved'].forEach(function(name){window.addEventListener(name,enforceCanonicalSoon,{passive:true})});
  window.addEventListener('pageshow',function(){setTimeout(function(){var x=currentAccess||cached();if(!x)boot(false).catch(function(){})},100)},{passive:true});
})();
