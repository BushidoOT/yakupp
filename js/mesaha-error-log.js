(function(){
  'use strict';
  if(window.MesahaErrorLog && window.MesahaErrorLog.__current) return;
  var KEY='mesaha_error_log_v446';
  var MAX=50;
  function now(){try{return new Date().toISOString();}catch(e){return String(Date.now());}}
  function meta(extra){
    var v=window.MESAHA_VERSION||{};
    return Object.assign({at:now(),url:location.href,app:v.app||'',build:v.build||'',online:navigator.onLine,userAgent:navigator.userAgent},extra||{});
  }
  function cleanItem(x){
    if(!x || typeof x!=='object') return null;
    var out={};
    Object.keys(x).forEach(function(k){ if(!/^\d+$/.test(k)) out[k]=x[k]; });
    if(!out.at) out.at=now();
    if(!out.level) out.level=out.kind==='offline-entry-guard-ready'?'info':(out.level||'info');
    if(out.message==null) out.message='';
    return out;
  }
  function compact(arr){
    arr=Array.isArray(arr)?arr:[];
    var out=[], lastGuard=null;
    arr.forEach(function(raw){
      var x=cleanItem(raw); if(!x) return;
      if(x.kind==='offline-entry-guard-ready'){ lastGuard=x; return; }
      out.push(x);
    });
    if(lastGuard) out.push(lastGuard);
    return out.slice(-MAX);
  }
  function read(){try{var arr=JSON.parse(localStorage.getItem(KEY)||'[]');return compact(arr);}catch(e){return [];}}
  function write(arr){try{localStorage.setItem(KEY,JSON.stringify(compact(arr)));}catch(e){}}
  function textOf(x){try{if(!x)return ''; if(x.stack)return String(x.stack); if(x.message)return String(x.message); return String(x);}catch(e){return 'unknown';}}
  function skipInfo(kind,extra){
    try{
      if(kind==='offline-entry-guard-ready'){
        var v=window.MESAHA_VERSION||{};
        var k='mesaha_log_seen_'+kind+'_'+String(v.build||'')+'_'+String(navigator.onLine!==false);
        if(sessionStorage.getItem(k)) return true;
        sessionStorage.setItem(k,'1');
      }
    }catch(e){}
    return false;
  }
  function add(kind,err,extra){try{
    kind=kind||'error'; extra=extra||{};
    if(skipInfo(kind,extra)) return;
    var arr=read();
    arr.push(Object.assign(meta(extra),{kind:kind,message:textOf(err).slice(0,1600)}));
    write(arr);
    window.dispatchEvent(new CustomEvent('mesaha:error-log-updated',{detail:{count:read().length}}));
  }catch(e){}}
  function info(kind,extra){add(kind||'info',(extra&&extra.message)||'',Object.assign({level:'info'},extra||{}));}
  function error(kind,err,extra){add(kind||'error',err,extra||{});}
  function clear(){try{localStorage.removeItem(KEY);}catch(e){} }
  function download(){
    var arr=read(); write(arr);
    var payload=JSON.stringify({exportedAt:now(),version:window.MESAHA_VERSION||{},count:arr.length,items:arr},null,2);
    var blob=new Blob([payload],{type:'application/json;charset=utf-8'});
    var url=URL.createObjectURL(blob); var a=document.createElement('a');
    a.href=url; a.download='mesaha_hata_gunlugu_'+now().slice(0,10)+'.json'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},1200);
  }
  function toast(msg){try{if(typeof window.toast==='function')return window.toast(msg); alert(msg);}catch(e){}}
  window.addEventListener('error',function(ev){add('window.error',ev.error||ev.message,{source:ev.filename,line:ev.lineno,column:ev.colno,level:'error'});},true);
  window.addEventListener('unhandledrejection',function(ev){add('promise.rejection',ev.reason||'Unhandled promise rejection',{level:'error'});},true);
  window.addEventListener('mesaha:storage-error',function(ev){add('storage.error',(ev.detail&&ev.detail.message)||'storage error',Object.assign({level:'error'},ev.detail||{}));},true);
  function bind(){
    var d=document.getElementById('downloadErrorLogBtn'), c=document.getElementById('clearErrorLogBtn');
    if(d && !d.__errLog){d.__errLog=true; d.addEventListener('click',function(){download(); toast('Hata günlüğü indirildi.');});}
    if(c && !c.__errLog){c.__errLog=true; c.addEventListener('click',function(){clear(); toast('Hata günlüğü temizlendi.');});}
  }
  try{ write(read()); }catch(e){}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true}); else bind();
  [500,1500,3500].forEach(function(ms){setTimeout(bind,ms);});
  var api={__current:true,__v446:true,__v459:true,add:add,info:info,error:error,list:read,clear:clear,download:download};
  window.MesahaErrorLog=api;
  window.MesahaErrorLogV446=api;
  window.MesahaErrorLogV455=api;
  window.MesahaErrorLogV459=api;
})();
