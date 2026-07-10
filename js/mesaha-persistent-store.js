/* Mesaha İO V5.27 — Revision tabanlı kalıcı depolama motoru
   IndexedDB ana güvenli kopyadır. localStorage yalnızca hızlı başlangıç uyumluluğu için
   tek kayıt/ayar kopyası ve küçük metadata taşır. Eski mirror/snapshot kopyaları temizlenir. */
(function(){
  'use strict';
  if(window.MesahaStorageV527) return;

  var DB_NAME='mesaha_io_storage_v527';
  var DB_VERSION=1;
  var STORE='documents';
  var RECORDS_KEY='cam_mesaha_kayitlari_v1';
  var SETTINGS_KEY='cam_mesaha_ayarlar_v1';
  var RECORDS_META='mesaha_v527_records_meta';
  var SETTINGS_META='mesaha_v527_settings_meta';
  var LEGACY_RECORD_KEYS=[RECORDS_KEY+'_mirror_v515',RECORDS_KEY+'_last_ok',RECORDS_KEY+'_snapshot_v385',RECORDS_KEY+'_mirror_meta_v515'];
  var LEGACY_SETTINGS_KEYS=[SETTINGS_KEY+'_mirror_v515',SETTINGS_KEY+'_mirror_meta_v515'];
  var dbPromise=null;
  var writeChain=Promise.resolve();
  var seq=0;
  var bootRecords=[];
  var bootSettings={};
  var bootRecordMeta=null;
  var bootSettingsMeta=null;
  var lastCommittedRecords=[];
  var lastCommittedSettings={};
  var pendingReplicas=Object.create(null);
  var replicaRetryTimer=0;

  function now(){return Date.now();}
  function clone(v,f){try{return JSON.parse(JSON.stringify(v));}catch(e){return f;}}
  function parse(raw,f){try{return raw==null?f:JSON.parse(raw);}catch(e){return f;}}
  function readJson(k,f){try{return parse(localStorage.getItem(k),f);}catch(e){return f;}}
  function writeJson(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}
  function cleanLegacy(){
    try{LEGACY_RECORD_KEYS.concat(LEGACY_SETTINGS_KEYS).forEach(function(k){localStorage.removeItem(k);});}catch(e){}
  }
  function checksum(value){
    var s=''; try{s=JSON.stringify(value);}catch(e){s='';}
    var h=2166136261;
    for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
    return (h>>>0).toString(16)+':'+s.length;
  }
  function readMeta(key){var m=readJson(key,null);return m&&typeof m==='object'?m:null;}
  function nextRevision(meta){
    seq=(seq+1)%1000;
    var candidate=now()*1000+seq;
    return Math.max(candidate,Number(meta&&meta.revision||0)+1);
  }
  function legacyRecords(){
    var raw=null;
    try{raw=localStorage.getItem(RECORDS_KEY);}catch(e){}
    if(raw!==null){
      var direct=parse(raw,null);
      if(Array.isArray(direct)) return direct;
    }
    /* Ana anahtar yok/bozuksa ancak o zaman eski sağlam kopyaya bak. [] geçerli silme durumudur. */
    for(var i=0;i<LEGACY_RECORD_KEYS.length;i++){
      if(/meta/i.test(LEGACY_RECORD_KEYS[i])||/snapshot/i.test(LEGACY_RECORD_KEYS[i])) continue;
      var a=readJson(LEGACY_RECORD_KEYS[i],null);
      if(Array.isArray(a)) return a;
    }
    var snap=readJson(RECORDS_KEY+'_snapshot_v385',null);
    if(snap&&snap.payload){var b=parse(snap.payload,null);if(Array.isArray(b))return b;}
    return [];
  }
  function legacySettings(){
    var raw=null; try{raw=localStorage.getItem(SETTINGS_KEY);}catch(e){}
    if(raw!==null){var direct=parse(raw,null);if(direct&&typeof direct==='object'&&!Array.isArray(direct))return direct;}
    var old=readJson(SETTINGS_KEY+'_mirror_v515',null);
    return old&&typeof old==='object'&&!Array.isArray(old)?old:{};
  }
  function makeEnvelope(kind,value,meta,reason){
    var at=now();
    var val=clone(value,kind==='records'?[]:{});
    var rev=nextRevision(meta);
    return {
      key:kind,
      schema:2,
      revision:rev,
      updatedAt:at,
      deletedAt:kind==='records'&&Array.isArray(val)&&val.length===0?at:0,
      count:kind==='records'&&Array.isArray(val)?val.length:Object.keys(val||{}).length,
      checksum:checksum(val),
      reason:String(reason||'save').slice(0,80),
      value:val
    };
  }
  function resetDb(db){
    try{if(db)db.close();}catch(e){}
    dbPromise=null;
  }
  function openDb(){
    if(dbPromise) return dbPromise;
    dbPromise=new Promise(function(resolve,reject){
      if(!('indexedDB' in window)){dbPromise=null;reject(new Error('IndexedDB kullanılamıyor'));return;}
      var req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=function(){var db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'key'});};
      req.onsuccess=function(){
        var db=req.result;
        try{db.onversionchange=function(){resetDb(db);};}catch(e){}
        resolve(db);
      };
      req.onerror=function(){var err=req.error||new Error('IndexedDB açılamadı');dbPromise=null;reject(err);};
      req.onblocked=function(){dbPromise=null;reject(new Error('IndexedDB başka sekme tarafından kilitli'));};
    });
    return dbPromise;
  }
  function idbGet(key){
    return openDb().then(function(db){return new Promise(function(resolve,reject){
      var tx=db.transaction(STORE,'readonly');var req=tx.objectStore(STORE).get(key);
      req.onsuccess=function(){resolve(req.result||null);};
      req.onerror=function(){reject(req.error||new Error('IndexedDB okunamadı'));};
    });});
  }
  function idbPut(envelope){
    return openDb().then(function(db){return new Promise(function(resolve,reject){
      var tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put(envelope);
      tx.oncomplete=function(){resolve(true);};
      tx.onerror=function(){var err=tx.error||new Error('IndexedDB yazılamadı');resetDb(db);reject(err);};
      tx.onabort=function(){var err=tx.error||new Error('IndexedDB işlemi iptal oldu');resetDb(db);reject(err);};
    });});
  }
  function idbPutPair(rec,set){
    return openDb().then(function(db){return new Promise(function(resolve,reject){
      var tx=db.transaction(STORE,'readwrite');var st=tx.objectStore(STORE);st.put(rec);st.put(set);
      tx.oncomplete=function(){resolve(true);};
      tx.onerror=function(){var err=tx.error||new Error('IndexedDB toplu yazma başarısız');resetDb(db);reject(err);};
      tx.onabort=function(){var err=tx.error||new Error('IndexedDB toplu işlem iptal');resetDb(db);reject(err);};
    });});
  }
  function notifyFailure(kind,error,extra){
    var detail={key:kind,message:error&&error.message?error.message:String(error||'Depolama hatası'),fatal:true};
    try{Object.assign(detail,extra||{});}catch(e){}
    try{window.dispatchEvent(new CustomEvent('mesaha:storage-error',{detail:detail}));}catch(e){}
  }
  function notifyWarning(kind,error,extra){
    var detail={key:kind,message:error&&error.message?error.message:String(error||'Depolama yedeği gecikti'),fatal:false,degraded:true};
    try{Object.assign(detail,extra||{});}catch(e){}
    try{window.dispatchEvent(new CustomEvent('mesaha:storage-warning',{detail:detail}));}catch(e){}
  }
  function withDeadline(promise,ms,label){
    var timer=0;
    return Promise.race([promise,new Promise(function(_,reject){timer=setTimeout(function(){reject(new Error(label||'Depolama zaman aşımı'));},ms||4500);})]).finally(function(){if(timer)clearTimeout(timer);});
  }
  async function verifyIdbEnvelope(kind,envelope){
    await withDeadline(idbPut(envelope),4500,'IndexedDB yazma zaman aşımı');
    var check=await withDeadline(idbGet(kind),3000,'IndexedDB doğrulama zaman aşımı');
    if(!check||Number(check.revision)!==Number(envelope.revision)||check.checksum!==envelope.checksum||checksum(check.value)!==envelope.checksum) throw new Error('IndexedDB doğrulaması başarısız');
    return true;
  }
  function scheduleReplicaRetry(kind,envelope,needsLocal,needsIdb){
    pendingReplicas[kind]={envelope:clone(envelope,null),needsLocal:!!needsLocal,needsIdb:!!needsIdb,attempts:0};
    if(replicaRetryTimer)return;
    replicaRetryTimer=setTimeout(retryReplicas,1200);
  }
  async function retryReplicas(){
    replicaRetryTimer=0;
    var keys=Object.keys(pendingReplicas);
    var remain=false;
    for(var i=0;i<keys.length;i++){
      var kind=keys[i],job=pendingReplicas[kind];
      if(!job||!job.envelope){delete pendingReplicas[kind];continue;}
      job.attempts++;
      if(job.needsLocal){
        try{job.needsLocal=!(commitCompat(kind,job.envelope)&&verifyCompat(kind,job.envelope));}catch(e){job.needsLocal=true;}
      }
      if(job.needsIdb){
        try{await verifyIdbEnvelope(kind,job.envelope);job.needsIdb=false;}catch(e){job.needsIdb=true;}
      }
      if(!job.needsLocal&&!job.needsIdb){delete pendingReplicas[kind];}
      else if(job.attempts<8){remain=true;}
      else{notifyWarning(kind,new Error('İkinci depolama kopyası daha sonra yeniden denenecek'),{replicaRetryExhausted:true,localPending:job.needsLocal,indexedDBPending:job.needsIdb});delete pendingReplicas[kind];}
    }
    if(remain&&!replicaRetryTimer)replicaRetryTimer=setTimeout(retryReplicas,Math.min(15000,1200+keys.length*900));
  }
  function commitCompat(kind,envelope){
    var dataKey=kind==='records'?RECORDS_KEY:SETTINGS_KEY;
    var metaKey=kind==='records'?RECORDS_META:SETTINGS_META;
    var okData=writeJson(dataKey,envelope.value);
    var okMeta=writeJson(metaKey,{revision:envelope.revision,updatedAt:envelope.updatedAt,deletedAt:envelope.deletedAt||0,count:envelope.count,checksum:envelope.checksum,schema:2});
    cleanLegacy();
    return okData&&okMeta;
  }
  function captureCompat(kind){
    var dataKey=kind==='records'?RECORDS_KEY:SETTINGS_KEY;
    var metaKey=kind==='records'?RECORDS_META:SETTINGS_META;
    var out={data:null,meta:null,hasData:false,hasMeta:false};
    try{out.data=localStorage.getItem(dataKey);out.hasData=out.data!==null;}catch(e){}
    try{out.meta=localStorage.getItem(metaKey);out.hasMeta=out.meta!==null;}catch(e){}
    return out;
  }
  function restoreCompat(kind,snap){
    var dataKey=kind==='records'?RECORDS_KEY:SETTINGS_KEY;
    var metaKey=kind==='records'?RECORDS_META:SETTINGS_META;
    try{if(snap&&snap.hasData)localStorage.setItem(dataKey,snap.data);else localStorage.removeItem(dataKey);}catch(e){}
    try{if(snap&&snap.hasMeta)localStorage.setItem(metaKey,snap.meta);else localStorage.removeItem(metaKey);}catch(e){}
  }
  function verifyCompat(kind,envelope){
    var dataKey=kind==='records'?RECORDS_KEY:SETTINGS_KEY;
    var metaKey=kind==='records'?RECORDS_META:SETTINGS_META;
    var val=readJson(dataKey,null),meta=readMeta(metaKey);
    var typeOk=kind==='records'?Array.isArray(val):!!(val&&typeof val==='object'&&!Array.isArray(val));
    return !!(typeOk&&meta&&Number(meta.revision||0)===Number(envelope.revision||0)&&meta.checksum===envelope.checksum&&checksum(val)===envelope.checksum);
  }
  function applyCommitted(kind,envelope,localOk,idbOk){
    if(kind==='records'){
      bootRecords=clone(envelope.value,[]);
      bootRecordMeta={revision:envelope.revision,updatedAt:envelope.updatedAt,deletedAt:envelope.deletedAt,count:envelope.count,checksum:envelope.checksum};
      lastCommittedRecords=clone(envelope.value,[]);
      try{window.dispatchEvent(new CustomEvent('mesaha:records-saved',{detail:{count:envelope.count,revision:envelope.revision,verified:true,durable:true,degraded:!(localOk&&idbOk),localStorage:localOk,indexedDB:idbOk}}));}catch(e){}
    }else{
      bootSettings=clone(envelope.value,{});
      bootSettingsMeta={revision:envelope.revision,updatedAt:envelope.updatedAt,count:envelope.count,checksum:envelope.checksum};
      lastCommittedSettings=clone(envelope.value,{});
      try{window.dispatchEvent(new CustomEvent('mesaha:settings-saved',{detail:{revision:envelope.revision,verified:true,durable:true,degraded:!(localOk&&idbOk),localStorage:localOk,indexedDB:idbOk}}));}catch(e){}
    }
  }
  function queuePut(kind,envelope){
    writeChain=writeChain.catch(function(){return null;}).then(async function(){
      var snap=captureCompat(kind);
      var oldBoot=kind==='records'?clone(bootRecords,[]):clone(bootSettings,{});
      var oldMeta=kind==='records'?clone(bootRecordMeta,null):clone(bootSettingsMeta,null);
      var localOk=false,idbOk=false,localErr=null,idbErr=null;
      try{localOk=!!(commitCompat(kind,envelope)&&verifyCompat(kind,envelope));if(!localOk)localErr=new Error('Yerel depolama doğrulaması başarısız');}catch(e){localErr=e;localOk=false;}
      try{await verifyIdbEnvelope(kind,envelope);idbOk=true;}catch(e){idbErr=e;idbOk=false;}
      if(!localOk&&!idbOk){
        restoreCompat(kind,snap);
        if(kind==='records'){bootRecords=oldBoot;bootRecordMeta=oldMeta;}else{bootSettings=oldBoot;bootSettingsMeta=oldMeta;}
        var fatalErr=idbErr||localErr||new Error('Kayıt hiçbir kalıcı depoya yazılamadı');
        notifyFailure(kind,fatalErr,{localStorage:false,indexedDB:false});
        return {ok:false,localStorage:false,indexedDB:false,verified:false,durable:false,revision:envelope.revision,error:String(fatalErr&&fatalErr.message||fatalErr)};
      }
      if(!localOk)restoreCompat(kind,snap);
      applyCommitted(kind,envelope,localOk,idbOk);
      if(!localOk||!idbOk){
        scheduleReplicaRetry(kind,envelope,!localOk,!idbOk);
        notifyWarning(kind,idbErr||localErr||new Error('İkinci depolama kopyası gecikti'),{localStorage:localOk,indexedDB:idbOk,revision:envelope.revision});
      }
      return {ok:true,localStorage:localOk,indexedDB:idbOk,verified:true,durable:true,degraded:!(localOk&&idbOk),revision:envelope.revision};
    });
    return writeChain;
  }
  function saveRecords(list,opts){
    list=Array.isArray(list)?list:[];
    var current=readMeta(RECORDS_META)||bootRecordMeta||{};
    var env=makeEnvelope('records',list,current,opts&&opts.reason);
    return queuePut('records',env);
  }
  function saveSettings(settings,opts){
    settings=settings&&typeof settings==='object'&&!Array.isArray(settings)?settings:{};
    var current=readMeta(SETTINGS_META)||bootSettingsMeta||{};
    var env=makeEnvelope('settings',settings,current,opts&&opts.reason);
    return queuePut('settings',env);
  }
  function replaceAll(records,settings,opts){
    records=Array.isArray(records)?records:[];
    settings=settings&&typeof settings==='object'&&!Array.isArray(settings)?settings:{};
    var rec=makeEnvelope('records',records,readMeta(RECORDS_META)||bootRecordMeta||{},opts&&opts.reason||'replace');
    var set=makeEnvelope('settings',settings,readMeta(SETTINGS_META)||bootSettingsMeta||{},opts&&opts.reason||'replace');
    writeChain=writeChain.catch(function(){return null;}).then(async function(){
      var recSnap=captureCompat('records'),setSnap=captureCompat('settings');
      var oldRecords=clone(bootRecords,[]),oldSettings=clone(bootSettings,{}),oldRecMeta=clone(bootRecordMeta,null),oldSetMeta=clone(bootSettingsMeta,null);
      var localRecOk=false,localSetOk=false,idbOk=false,localErr=null,idbErr=null;
      try{localRecOk=!!(commitCompat('records',rec)&&verifyCompat('records',rec));if(!localRecOk)localErr=new Error('Yerel kayıt doğrulaması başarısız');}catch(e){localErr=e;}
      try{localSetOk=!!(commitCompat('settings',set)&&verifyCompat('settings',set));if(!localSetOk&&!localErr)localErr=new Error('Yerel ayar doğrulaması başarısız');}catch(e){if(!localErr)localErr=e;}
      try{
        await withDeadline(idbPutPair(rec,set),5000,'IndexedDB toplu yazma zaman aşımı');
        var pair=await withDeadline(Promise.all([idbGet('records'),idbGet('settings')]),3500,'IndexedDB toplu doğrulama zaman aşımı');
        idbOk=!!(pair[0]&&pair[1]&&Number(pair[0].revision)===Number(rec.revision)&&Number(pair[1].revision)===Number(set.revision)&&pair[0].checksum===rec.checksum&&pair[1].checksum===set.checksum&&checksum(pair[0].value)===rec.checksum&&checksum(pair[1].value)===set.checksum);
        if(!idbOk)throw new Error('IndexedDB toplu doğrulaması başarısız');
      }catch(e){idbErr=e;idbOk=false;}
      var recordsSafe=localRecOk||idbOk,settingsSafe=localSetOk||idbOk;
      if(!recordsSafe||!settingsSafe){
        restoreCompat('records',recSnap);restoreCompat('settings',setSnap);
        bootRecords=oldRecords;bootSettings=oldSettings;bootRecordMeta=oldRecMeta;bootSettingsMeta=oldSetMeta;
        var fatalErr=idbErr||localErr||new Error('Toplu veri hiçbir kalıcı depoya yazılamadı');
        notifyFailure('replace',fatalErr,{localRecords:localRecOk,localSettings:localSetOk,indexedDB:idbOk});
        return {ok:false,localStorage:false,indexedDB:false,verified:false,durable:false,error:String(fatalErr&&fatalErr.message||fatalErr)};
      }
      if(!localRecOk)restoreCompat('records',recSnap);
      if(!localSetOk)restoreCompat('settings',setSnap);
      applyCommitted('records',rec,localRecOk,idbOk);
      applyCommitted('settings',set,localSetOk,idbOk);
      if(!localRecOk||!idbOk)scheduleReplicaRetry('records',rec,!localRecOk,!idbOk);
      if(!localSetOk||!idbOk)scheduleReplicaRetry('settings',set,!localSetOk,!idbOk);
      if(!localRecOk||!localSetOk||!idbOk)notifyWarning('replace',idbErr||localErr||new Error('İkinci depolama kopyası gecikti'),{localRecords:localRecOk,localSettings:localSetOk,indexedDB:idbOk});
      return {ok:true,localStorage:localRecOk&&localSetOk,indexedDB:idbOk,verified:true,durable:true,degraded:!(localRecOk&&localSetOk&&idbOk),recordsRevision:rec.revision,settingsRevision:set.revision};
    });
    return writeChain;
  }
  function applyToApp(records,settings,reason){
    try{
      if(window.state){
        if(Array.isArray(records)) window.state.records=clone(records,[]);
        if(settings&&typeof settings==='object') window.state.settings=Object.assign(window.state.settings||{},clone(settings,{}));
      }
      try{if(typeof window.renderAll==='function')window.renderAll();else if(window.MesahaRenderStorageV382&&window.MesahaRenderStorageV382.renderAllSoon)window.MesahaRenderStorageV382.renderAllSoon();}catch(e){}
      try{window.dispatchEvent(new CustomEvent('mesaha:storage-recovered',{detail:{reason:reason||'recovery',count:Array.isArray(records)?records.length:0}}));}catch(e){}
    }catch(e){}
  }
  async function recoverIntoApp(){
    var localRecMeta=readMeta(RECORDS_META)||bootRecordMeta||{};
    var localSetMeta=readMeta(SETTINGS_META)||bootSettingsMeta||{};
    var localRecRaw=readJson(RECORDS_KEY,null);
    var localSetRaw=readJson(SETTINGS_KEY,null);
    var localRecValid=Array.isArray(localRecRaw)&&(!localRecMeta.checksum||checksum(localRecRaw)===localRecMeta.checksum);
    var localSetValid=!!(localSetRaw&&typeof localSetRaw==='object'&&!Array.isArray(localSetRaw))&&(!localSetMeta.checksum||checksum(localSetRaw)===localSetMeta.checksum);
    var dbRec=null,dbSet=null;
    try{var pair=await Promise.all([idbGet('records').catch(function(){return null;}),idbGet('settings').catch(function(){return null;})]);dbRec=pair[0];dbSet=pair[1];}catch(e){}
    var dbRecValid=!!(dbRec&&Array.isArray(dbRec.value)&&(!dbRec.checksum||checksum(dbRec.value)===dbRec.checksum));
    var dbSetValid=!!(dbSet&&dbSet.value&&typeof dbSet.value==='object'&&!Array.isArray(dbSet.value)&&(!dbSet.checksum||checksum(dbSet.value)===dbSet.checksum));
    var changed=false;

    if(dbRecValid&&(!localRecValid||Number(dbRec.revision||0)>Number(localRecMeta.revision||0))){
      commitCompat('records',dbRec);bootRecords=clone(dbRec.value,[]);bootRecordMeta=dbRec;
      if(window.state)window.state.records=clone(dbRec.value,[]);changed=true;
    }else if(localRecValid&&(!dbRecValid||Number(localRecMeta.revision||0)>Number(dbRec&&dbRec.revision||0))){
      bootRecords=clone(localRecRaw,[]);
      var recEnv=makeEnvelope('records',bootRecords,localRecMeta,'bootstrap-sync');
      recEnv.revision=Number(localRecMeta.revision||recEnv.revision);recEnv.updatedAt=Number(localRecMeta.updatedAt||recEnv.updatedAt);recEnv.deletedAt=Number(localRecMeta.deletedAt||recEnv.deletedAt);recEnv.checksum=localRecMeta.checksum||checksum(bootRecords);recEnv.count=bootRecords.length;
      try{await idbPut(recEnv);dbRec=recEnv;dbRecValid=true;}catch(e){notifyWarning('records-bootstrap',e,{recovery:true});}
    }else if(!localRecValid&&!dbRecValid){
      notifyFailure('records-recovery',new Error('Kayıt kopyalarının doğrulaması başarısız'));
    }

    if(dbSetValid&&(!localSetValid||Number(dbSet.revision||0)>Number(localSetMeta.revision||0))){
      commitCompat('settings',dbSet);bootSettings=clone(dbSet.value,{});bootSettingsMeta=dbSet;
      if(window.state)window.state.settings=Object.assign(window.state.settings||{},clone(dbSet.value,{}));changed=true;
    }else if(localSetValid&&(!dbSetValid||Number(localSetMeta.revision||0)>Number(dbSet&&dbSet.revision||0))){
      bootSettings=clone(localSetRaw,{});
      var setEnv=makeEnvelope('settings',bootSettings,localSetMeta,'bootstrap-sync');
      setEnv.revision=Number(localSetMeta.revision||setEnv.revision);setEnv.updatedAt=Number(localSetMeta.updatedAt||setEnv.updatedAt);setEnv.checksum=localSetMeta.checksum||checksum(bootSettings);setEnv.count=Object.keys(bootSettings||{}).length;
      try{await idbPut(setEnv);dbSet=setEnv;dbSetValid=true;}catch(e){notifyWarning('settings-bootstrap',e,{recovery:true});}
    }else if(!localSetValid&&!dbSetValid){
      notifyFailure('settings-recovery',new Error('Ayar kopyalarının doğrulaması başarısız'));
    }

    lastCommittedRecords=clone(dbRecValid&&Number(dbRec.revision||0)>=Number((readMeta(RECORDS_META)||{}).revision||0)?dbRec.value:bootRecords,[]);
    lastCommittedSettings=clone(dbSetValid&&Number(dbSet.revision||0)>=Number((readMeta(SETTINGS_META)||{}).revision||0)?dbSet.value:bootSettings,{});
    if(changed)applyToApp(window.state&&window.state.records,window.state&&window.state.settings,'newer-or-valid-revision');
    cleanLegacy();
    return {ok:true,changed:changed,records:Array.isArray(window.state&&window.state.records)?window.state.records.length:bootRecords.length};
  }
  function flush(){return writeChain.catch(function(){return null;});}
  function info(){
    return {
      recordsMeta:readMeta(RECORDS_META)||bootRecordMeta,
      settingsMeta:readMeta(SETTINGS_META)||bootSettingsMeta,
      recordsCount:(window.state&&Array.isArray(window.state.records)?window.state.records:bootRecords).length,
      pending:false,
      database:DB_NAME
    };
  }

  /* Senkron başlangıç migrasyonu: ana [] kaydı kesin silme olarak kabul edilir. */
  bootRecords=legacyRecords();
  bootSettings=legacySettings();
  bootRecordMeta=readMeta(RECORDS_META);
  bootSettingsMeta=readMeta(SETTINGS_META);
  if(!bootRecordMeta){
    bootRecordMeta={revision:nextRevision(null),updatedAt:now(),deletedAt:bootRecords.length===0?now():0,count:bootRecords.length,checksum:checksum(bootRecords),schema:2};
    writeJson(RECORDS_META,bootRecordMeta);writeJson(RECORDS_KEY,bootRecords);
  }
  if(!bootSettingsMeta){
    bootSettingsMeta={revision:nextRevision(null),updatedAt:now(),count:Object.keys(bootSettings||{}).length,checksum:checksum(bootSettings),schema:2};
    writeJson(SETTINGS_META,bootSettingsMeta);writeJson(SETTINGS_KEY,bootSettings);
  }
  cleanLegacy();

  var api={
    __v527:true,
    bootstrapRecords:function(){return clone(bootRecords,[]);},
    bootstrapSettings:function(){return clone(bootSettings,{});},
    saveRecords:saveRecords,
    saveSettings:saveSettings,
    replaceAll:replaceAll,
    clearRecords:function(reason){return saveRecords([],{reason:reason||'clear'});},
    recoverIntoApp:recoverIntoApp,
    flush:flush,
    info:info,
    lastCommittedRecords:function(){return clone(lastCommittedRecords,[]);},
    lastCommittedSettings:function(){return clone(lastCommittedSettings,{});}
  };
  window.MesahaStorageV527=api;
  /* Eski çağrı adları yalnızca uyumluluk için aynı güvenli motora yönlenir. */
  window.MesahaPersistentStoreV515={__v527:true,saveRecords:saveRecords,saveSettings:saveSettings,recoverIntoApp:recoverIntoApp};

  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(function(){});}catch(e){}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(recoverIntoApp,80);},{once:true});else setTimeout(recoverIntoApp,80);
  window.addEventListener('pagehide',function(){flush();},{passive:true});
})();
