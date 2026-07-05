(function(){
  'use strict';
  if(window.MesahaErrorLog && window.MesahaErrorLog.__v446) return;
  var KEY='mesaha_error_log_v446';
  var MAX=50;
  function now(){try{return new Date().toISOString();}catch(e){return String(Date.now());}}
  function meta(extra){
    var v=window.MESAHA_VERSION||{};
    return Object.assign({at:now(),url:location.href,app:v.app||'',build:v.build||'',online:navigator.onLine,userAgent:navigator.userAgent},extra||{});
  }
  function read(){try{var arr=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(arr)?arr:[];}catch(e){return [];}}
  function write(arr){try{localStorage.setItem(KEY,JSON.stringify(arr.slice(-MAX)));}catch(e){}}
  function textOf(x){try{if(!x)return ''; if(x.stack)return String(x.stack); if(x.message)return String(x.message); return String(x);}catch(e){return 'unknown';}}
  function add(kind,err,extra){try{var arr=read();arr.push(Object.assign(meta(extra),{kind:kind||'error',message:textOf(err).slice(0,1600)}));write(arr);window.dispatchEvent(new CustomEvent('mesaha:error-log-updated',{detail:{count:arr.length}}));}catch(e){}}
  function clear(){try{localStorage.removeItem(KEY);}catch(e){} }
  function download(){
    var arr=read();
    var payload=JSON.stringify({exportedAt:now(),version:window.MESAHA_VERSION||{},count:arr.length,items:arr},null,2);
    var blob=new Blob([payload],{type:'application/json;charset=utf-8'});
    var url=URL.createObjectURL(blob); var a=document.createElement('a');
    a.href=url; a.download='mesaha_hata_gunlugu_'+now().slice(0,10)+'.json'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},1200);
  }
  function toast(msg){try{if(typeof window.toast==='function')return window.toast(msg); alert(msg);}catch(e){}}
  window.addEventListener('error',function(ev){add('window.error',ev.error||ev.message,{source:ev.filename,line:ev.lineno,column:ev.colno});},true);
  window.addEventListener('unhandledrejection',function(ev){add('promise.rejection',ev.reason||'Unhandled promise rejection');},true);
  window.addEventListener('mesaha:storage-error',function(ev){add('storage.error',(ev.detail&&ev.detail.message)||'storage error',ev.detail||{});},true);
  function bind(){
    var d=document.getElementById('downloadErrorLogBtn'), c=document.getElementById('clearErrorLogBtn');
    if(d && !d.__errLog){d.__errLog=true; d.addEventListener('click',function(){download(); toast('Hata günlüğü indirildi.');});}
    if(c && !c.__errLog){c.__errLog=true; c.addEventListener('click',function(){clear(); toast('Hata günlüğü temizlendi.');});}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true}); else bind();
  [500,1500,3500].forEach(function(ms){setTimeout(bind,ms);});
  window.MesahaErrorLog={__v446:true,add:add,list:read,clear:clear,download:download};
})();
