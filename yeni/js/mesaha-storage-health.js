(function(){
  'use strict';
  if(window.MesahaStorageHealth && window.MesahaStorageHealth.__v542) return;
  var STORAGE_KEY='cam_mesaha_kayitlari_v1', SETTINGS_KEY='cam_mesaha_ayarlar_v1';
  function bytes(v){try{return new Blob([typeof v==='string'?v:JSON.stringify(v)]).size}catch(e){return 0}}
  function readJson(k,f){try{var v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}}
  function fmt(n){n=Number(n)||0; if(n>1024*1024) return (n/1024/1024).toFixed(2)+' MB'; if(n>1024) return (n/1024).toFixed(1)+' KB'; return n+' B';}
  function info(){
    var recordsRaw=localStorage.getItem(STORAGE_KEY)||'', settingsRaw=localStorage.getItem(SETTINGS_KEY)||'';
    var records=readJson(STORAGE_KEY,[]); if(!Array.isArray(records)) records=[];
    var total=0, keys=[];
    try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i), v=localStorage.getItem(k)||''; var b=bytes(v); total+=b; if(/^cam_mesaha_|^mesaha_/i.test(k)) keys.push({key:k,bytes:b});}}catch(e){}
    keys.sort(function(a,b){return b.bytes-a.bytes;});
    return {recordsCount:records.length,recordsBytes:bytes(recordsRaw),settingsBytes:bytes(settingsRaw),mesahaBytes:total,largestKeys:keys.slice(0,10),warning:bytes(recordsRaw)>2500000||total>4000000};
  }
  function message(x){return 'Kayıt: '+x.recordsCount+' adet\nKayıt verisi: '+fmt(x.recordsBytes)+'\nAyarlar: '+fmt(x.settingsBytes)+'\nMesaha toplam: '+fmt(x.mesahaBytes)+(x.warning?'\n\nUyarı: Veri büyümüş. Yedek alıp büyük temizlik/IndexedDB geçişi planlanmalı.':'\n\nDurum: Normal.');}
  function download(){var x=info(), payload=JSON.stringify({exportedAt:new Date().toISOString(),version:window.MESAHA_VERSION||{},storage:x},null,2); var blob=new Blob([payload],{type:'application/json;charset=utf-8'}); var url=URL.createObjectURL(blob); var a=document.createElement('a'); a.href=url; a.download='mesaha_depolama_durumu_'+new Date().toISOString().slice(0,10)+'.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(url);},1200);}
  function toast(t){try{if(typeof window.toast==='function')return window.toast(t)}catch(e){} alert(t)}
  var lastAutoAt=0,lastAutoCount=0,lastWarningAt=0,AUTO_MS=5*60*1000,AUTO_STEP=25,autoTimer=0;
  function check(showAlert){var x=info(); if(showAlert) alert(message(x)); if(x.warning&&(showAlert||Date.now()-lastWarningAt>30*60*1000)){lastWarningAt=Date.now();toast('Depolama büyümüş; yedek almanız önerilir.');} return x;}
  function autoCheck(detail){
    var count=Number(detail&&detail.count||0),t=Date.now();
    if(t-lastAutoAt<AUTO_MS&&Math.abs(count-lastAutoCount)<AUTO_STEP)return;
    lastAutoAt=t;lastAutoCount=count;clearTimeout(autoTimer);
    autoTimer=setTimeout(function(){if(!document.hidden)check(false);},700);
  }
  function bind(){var b=document.getElementById('storageHealthBtn'), d=document.getElementById('downloadStorageHealthBtn'); if(b&&!b.__sh){b.__sh=true;b.addEventListener('click',function(){check(true);});} if(d&&!d.__sh){d.__sh=true;d.addEventListener('click',function(){download();toast('Depolama raporu indirildi.');});}}
  window.addEventListener('mesaha:records-saved',function(ev){autoCheck(ev&&ev.detail||{});},{passive:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true}); else bind(); [700,2000].forEach(function(ms){setTimeout(bind,ms);});
  window.MesahaStorageHealth={__v542:true,__v449:true,info:info,check:check,download:download,autoCheck:autoCheck};
})();
