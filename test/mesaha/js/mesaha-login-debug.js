/* Mesaha İO V5.73 — üretim giriş teşhis/log tutucu.
   Amaç: Google/Supabase giriş akışındaki gerçek kırılma noktasını güvenli şekilde kaydetmek. */
(function(){
  'use strict';
  if(window.MesahaLoginLog&&window.MesahaLoginLog.version==='production-v573')return;
  var VERSION='production-v573', KEY='mesaha_login_debug_current', QKEY='mesaha_login_debug_queue_current', SID_KEY='mesaha_login_debug_session_current';
  var VERBOSE_KEY='mesaha_login_debug_verbose', MAX_LOCAL=180, MAX_QUEUE=80, installedFetch=false, flushing=false, remoteDisabledUntil=0, flushTimer=0, retryDelay=15000;
  function now(){return Date.now()}
  function clean(v){return String(v==null?'':v).trim()}
  function trunc(v,n){v=String(v==null?'':v);n=n||1200;return v.length>n?v.slice(0,n)+'…':v}
  function parseJson(v,f){try{return JSON.parse(v)}catch(e){return f}}
  function get(k,f){try{var v=localStorage.getItem(k);return v?parseJson(v,f):f}catch(e){return f}}
  function set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
  function sessionId(){
    try{var s=localStorage.getItem(SID_KEY);if(s)return s;s='lg_'+now().toString(36)+'_'+Math.random().toString(36).slice(2,10);localStorage.setItem(SID_KEY,s);return s}catch(e){return 'lg_'+now().toString(36)}
  }
  function cfg(){var c=window.MESAHA_SUPABASE_CONFIG||{};return{url:clean(c.url).replace(/\/+$/,''),anonKey:clean(c.anonKey||c.anon_key)}}
  function safeUrl(u){
    try{var x=new URL(u||location.href,location.href);['code','access_token','refresh_token','id_token','token','provider_token','provider_refresh_token'].forEach(function(k){if(x.searchParams.has(k))x.searchParams.set(k,'[gizlendi]')});if(x.hash){var raw=x.hash.slice(1);try{var hp=new URLSearchParams(raw);['access_token','refresh_token','id_token','token','provider_token','provider_refresh_token'].forEach(function(k){if(hp.has(k))hp.set(k,'[gizlendi]')});x.hash=hp.toString()?('#'+hp.toString()):''}catch(e){x.hash='#[gizlendi]'}}return x.href}catch(e){return trunc(u||'',300)}
  }
  function redactText(s){
    s=String(s==null?'':s);
    s=s.replace(/(access_token|refresh_token|id_token|provider_token|provider_refresh_token|authorization)(["'\s:=]+)([^,"'\s}&]+)/ig,'$1$2[gizlendi]');
    s=s.replace(/Bearer\s+[A-Za-z0-9._\-]+/g,'Bearer [gizlendi]');
    s=s.replace(/eyJ[A-Za-z0-9._\-]{40,}/g,'[jwt-gizlendi]');
    return trunc(s,1600);
  }
  function sanitize(x,depth){
    depth=depth||0;if(depth>4)return '[derinlik-kesildi]';
    if(x==null||typeof x==='number'||typeof x==='boolean')return x;
    if(typeof x==='string')return redactText(x);
    if(x instanceof Error)return {name:x.name,message:redactText(x.message||''),status:x.status||0,code:x.code||'',stack:redactText((x.stack||'').split('\n').slice(0,5).join('\n'))};
    if(Array.isArray(x))return x.slice(0,30).map(function(v){return sanitize(v,depth+1)});
    var out={};Object.keys(x||{}).slice(0,80).forEach(function(k){
      var lk=String(k).toLowerCase();
      if(/token|authorization|secret|password|refresh|id_token|access_token/.test(lk))out[k]='[gizlendi]';
      else out[k]=sanitize(x[k],depth+1);
    });return out;
  }
  function readSession(){try{return parseJson(localStorage.getItem('mesaha_supabase_v500_session')||'',{})||{}}catch(e){return {}}}
  function localUser(){var p=get('mesaha_panel_user_v316',{})||{}, st=get('cam_mesaha_ayarlar_v1',{})||{};return{name:clean(p.name||st.ekipNot),seflik:clean(p.seflik||st.seflik),bolmeNo:clean(p.bolmeNo||st.bolmeNo)}}
  function deviceId(){try{return clean(localStorage.getItem('mesaha_supabase_v500_device')||localStorage.getItem('mesaha_cihaz_kodu_v1')||'')}catch(e){return ''}}
  function osName(){var ua=navigator.userAgent||'';if(/Android/i.test(ua))return'Android';if(/iPhone|iPad|iPod/i.test(ua))return'iOS';if(/Windows/i.test(ua))return'Windows';if(/Mac OS/i.test(ua))return'macOS';if(/Linux/i.test(ua))return'Linux';return'Bilinmiyor'}
  function browser(){var ua=navigator.userAgent||'',m;if((m=ua.match(/SamsungBrowser\/([\d.]+)/i)))return'Samsung '+m[1];if((m=ua.match(/Edg\/([\d.]+)/i)))return'Edge '+m[1];if((m=ua.match(/CriOS\/([\d.]+)/i)))return'Chrome iOS '+m[1];if((m=ua.match(/Chrome\/([\d.]+)/i)))return'Chrome '+m[1];if((m=ua.match(/Version\/([\d.]+).*Safari/i)))return'Safari '+m[1];return clean(navigator.appName||'Tarayıcı')}
  function base(){var v=window.MESAHA_VERSION||{}, ss=readSession(), u=(ss.user||{}), lu=localUser();return{version:clean(v.version||VERSION),sessionId:sessionId(),ts:now(),iso:new Date().toISOString(),appVersion:v.visibleVersion||v.shortVersion||'',build:Number(v.build||0)||0,page:safeUrl(location.href),path:location.pathname,online:navigator.onLine!==false,visibility:document.visibilityState||'',deviceId:deviceId(),os:osName(),browser:browser(),screen:((screen&&screen.width)||'')+'x'+((screen&&screen.height)||''),viewport:(innerWidth||'')+'x'+(innerHeight||''),standalone:!!(matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true,userId:clean(u.id),email:clean(u.email),name:lu.name,seflik:lu.seflik}}
  function save(row){var a=get(KEY,[])||[];a.push(row);if(a.length>MAX_LOCAL)a=a.slice(-MAX_LOCAL);set(KEY,a);try{var b=sessionStorage.getItem(KEY+'_mirror');b=b?JSON.parse(b):[];b.push(row);if(b.length>60)b=b.slice(-60);sessionStorage.setItem(KEY+'_mirror',JSON.stringify(b))}catch(e){}}
  function verbose(){try{return localStorage.getItem(VERBOSE_KEY)==='1'}catch(e){return false}}
  function remoteEligible(r){return verbose()||/^(error|warning)$/i.test(clean(r&&r.level))||/error|fail|blocked|denied|email_exists|timeout|rejection/i.test(clean(r&&r.event))}
  function queue(row){if(!remoteEligible(row))return;var a=get(QKEY,[])||[];a.push(row);if(a.length>MAX_QUEUE)a=a.slice(-MAX_QUEUE);set(QKEY,a)}
  function scheduleFlush(delay){clearTimeout(flushTimer);if(navigator.onLine===false||!(get(QKEY,[])||[]).length)return;flushTimer=setTimeout(function(){flush()},Math.max(120,Number(delay||1200)))}
  function row(event,detail,level){var b=base();b.id='log_'+b.ts.toString(36)+'_'+Math.random().toString(36).slice(2,8);b.event=clean(event||'event');b.level=level||(/error|fail|blocked|denied/i.test(b.event)?'error':'info');b.detail=sanitize(detail||{});return b}
  function log(event,detail,level){
    var r=row(event,detail,level);save(r);queue(r);try{if(verbose()&&window.console&&console.debug)console.debug('[Mesaha giriş log]',r.event,r.detail)}catch(e){}
    if(remoteEligible(r))scheduleFlush(r.level==='error'?180:1200);return r;
  }
  function tablePayload(r){
    var uid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(r.userId||'')?r.userId:null;
    return {session_id:r.sessionId,event_name:r.event,level:r.level,app_version:r.appVersion,build:r.build,page_url:r.page,device_id:r.deviceId||null,user_id:uid,email:r.email||null,user_name:r.name||null,seflik:r.seflik||null,user_agent:trunc(navigator.userAgent||'',900),detail:r};
  }
  async function sendOne(r){
    var c=cfg();if(!c.url||!c.anonKey||navigator.onLine===false)return false;
    if(now()<remoteDisabledUntil)return false;
    var res=await fetch(c.url+'/rest/v1/mesaha_login_debug_logs',{method:'POST',cache:'no-store',headers:{apikey:c.anonKey,Authorization:'Bearer '+c.anonKey,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(tablePayload(r)),keepalive:true});
    if(!res.ok){var t='';try{t=await res.text()}catch(e){}if(res.status===404||/relation .* does not exist|schema cache/i.test(t)){remoteDisabledUntil=now()+10*60*1000}throw new Error('login log remote '+res.status+' '+t.slice(0,120));}
    return true;
  }
  async function flush(){
    if(flushing)return false;var q=get(QKEY,[])||[];if(!q.length)return true;if(navigator.onLine===false||now()<remoteDisabledUntil)return false;flushing=true;
    var sent=0,keep=q;
    try{
      keep=[];
      for(var i=0;i<q.length;i++){
        try{await sendOne(q[i]);sent++;}
        catch(e){keep=q.slice(i);retryDelay=Math.min(5*60*1000,Math.max(15000,retryDelay*2));break;}
        if(sent>=12){keep=q.slice(i+1);break;}
      }
      if(sent>0)retryDelay=15000;
      if(keep.length>MAX_QUEUE)keep=keep.slice(-MAX_QUEUE);set(QKEY,keep);
      if(keep.length)scheduleFlush(retryDelay);
      return sent>0;
    }finally{flushing=false;}
  }
  function urlKind(u){try{var x=new URL(u,location.href), p=x.pathname; if(p.indexOf('/auth/v1/')>=0)return'auth'; if(p.indexOf('/rest/v1/rpc/mesaha_google')>=0)return'google_rpc'; if(p.indexOf('/functions/v1/smooth-function')>=0)return'edge'; if(p.endsWith('/release.js'))return'release'; return''}catch(e){return''}}
  function installFetch(){
    if(installedFetch||!window.fetch)return;installedFetch=true;var orig=window.fetch;
    window.fetch=function(input,init){
      var url='';try{url=typeof input==='string'?input:(input&&input.url)||''}catch(e){}
      var kind=urlKind(url), method=clean((init&&init.method)||(input&&input.method)||'GET').toUpperCase();
      var t0=now();if(kind)log('fetch_start',{kind:kind,method:method,url:safeUrl(url)},'debug');
      return orig.apply(this,arguments).then(function(res){
        if(kind){
          var info={kind:kind,method:method,url:safeUrl(url),status:res.status,ok:res.ok,durationMs:now()-t0};
          if(!res.ok||kind==='google_rpc'||kind==='auth'){
            try{res.clone().text().then(function(txt){info.response=redactText(txt);log('fetch_done',info,res.ok?'debug':'error')}).catch(function(){log('fetch_done',info,res.ok?'debug':'error')})}catch(e){log('fetch_done',info,res.ok?'debug':'error')}
          }else log('fetch_done',info,'debug');
        }
        return res;
      }).catch(function(e){if(kind)log('fetch_error',{kind:kind,method:method,url:safeUrl(url),durationMs:now()-t0,error:sanitize(e)},'error');throw e;});
    };
  }
  function mergedAuthParams(){var p=new URLSearchParams();try{new URLSearchParams(location.search||'').forEach(function(v,k){p.set(k,v)})}catch(e){}try{var raw=location.hash&&location.hash.slice(1);if(raw)new URLSearchParams(raw).forEach(function(v,k){if(!p.has(k))p.set(k,v)})}catch(e){}return p}
  function bootUrlCheck(){var q=mergedAuthParams(), has=q.get('error')||q.get('error_code')||q.get('error_description')||q.get('access_token')||q.get('code');if(has)log('url_auth_callback',{error:q.get('error'),error_code:q.get('error_code'),error_description:q.get('error_description'),has_code:!!q.get('code'),has_access_token:!!q.get('access_token'),url:safeUrl(location.href)},q.get('error')||q.get('error_code')?'error':'info')}
  function copy(){var a=get(KEY,[])||[];var text=JSON.stringify(a,null,2);if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text).then(function(){return text});try{var ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}catch(e){}return Promise.resolve(text)}
  function text(){return JSON.stringify(get(KEY,[])||[],null,2)}
  function clear(){try{localStorage.removeItem(KEY);localStorage.removeItem(QKEY)}catch(e){}log('logs_cleared',{},'info')}
  function summary(){var a=get(KEY,[])||[];return{count:a.length,queued:(get(QKEY,[])||[]).length,last:a.slice(-15)}}
  window.MesahaLoginLog={version:VERSION,log:log,flush:flush,copy:copy,text:text,clear:clear,summary:summary,all:function(){return get(KEY,[])||[]}};
  installFetch();bootUrlCheck();log('page_load',{referrer:safeUrl(document.referrer||''),startedAt:new Date().toISOString()},'info');
  window.addEventListener('online',function(){log('browser_online',{},'info');flush()},{passive:true});
  window.addEventListener('offline',function(){log('browser_offline',{},'info')},{passive:true});
  window.addEventListener('error',function(e){log('window_error',{message:e.message,filename:e.filename,lineno:e.lineno,colno:e.colno,error:e.error},'error')});
  window.addEventListener('unhandledrejection',function(e){log('promise_rejection',{reason:e.reason},'error')});
  window.addEventListener('mesaha:google-access-approved',function(e){log('google_access_approved',{access:e&&e.detail||{}},'info')});
  document.addEventListener('click',function(e){try{var el=e.target&&e.target.closest?e.target.closest('[data-google-action-v548]'):null;if(el)log('ui_google_action_click_capture',{action:el.getAttribute('data-google-action-v548'),text:(el.textContent||'').trim().slice(0,80)},'info')}catch(_e){}},true);
  window.addEventListener('mesaha:google-auth-required',function(e){log('google_auth_required_event',{detail:e&&e.detail||{}},'error')});
  document.addEventListener('visibilitychange',function(){if(document.hidden)flush();else scheduleFlush(800)},{passive:true});
  window.addEventListener('pagehide',function(){flush()},{passive:true});
  scheduleFlush(1800);
})();
