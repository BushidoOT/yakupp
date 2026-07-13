/* Mesaha İO V5.78 — iOS düşük gecikmeli, sıralı ve anlık görüntü güvenli kalıcı depolama motoru.
   - Tek kayıt ekleme/düzeltme IndexedDB'de yalnız ilgili kaydı yazar.
   - Kayıt ve ayar kuyrukları ayrıdır; ağaç/ürün seçimi kayıt düğmesini bekletmez.
   - Büyük localStorage kopyası dokunma anında değil, boş zamanda ve birleştirilerek alınır.
   - Eski V5.27 belge deposu ve localStorage kopyalarıyla geriye uyumludur. */
(function(){
  'use strict';
  if(window.MesahaStorageV527 && window.MesahaStorageV527.__v576) return;

  var DB_NAME='mesaha_io_storage_v527';
  var DB_VERSION=2;
  var DOC_STORE='documents';
  var RECORD_STORE='record_items';
  var META_STORE='state_meta';
  var RECORDS_KEY='cam_mesaha_kayitlari_v1';
  var SETTINGS_KEY='cam_mesaha_ayarlar_v1';
  var RECORDS_META='mesaha_v527_records_meta';
  var SETTINGS_META='mesaha_v527_settings_meta';
  var LEGACY_RECORD_KEYS=[RECORDS_KEY+'_mirror_v515',RECORDS_KEY+'_last_ok',RECORDS_KEY+'_snapshot_v385',RECORDS_KEY+'_mirror_meta_v515'];
  var LEGACY_SETTINGS_KEYS=[SETTINGS_KEY+'_mirror_v515',SETTINGS_KEY+'_mirror_meta_v515'];

  var dbPromise=null,seq=0;
  var recordChain=Promise.resolve(),settingsChain=Promise.resolve(),bulkChain=Promise.resolve();
  var bootRecords=[],bootSettings={},bootRecordMeta=null,bootSettingsMeta=null;
  var lastCommittedRecords=[],lastCommittedSettings={};
  var recoveryPromise=null;
  var snapshotJobs={records:null,settings:null};
  var snapshotTimers={records:0,settings:0};
  var isIOS=/iPad|iPhone|iPod/i.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

  function now(){return Date.now();}
  function parse(raw,f){try{return raw==null?f:JSON.parse(raw);}catch(e){return f;}}
  function readJson(k,f){try{return parse(localStorage.getItem(k),f);}catch(e){return f;}}
  function shallowRecords(v){return Array.isArray(v)?v.slice():[];}
  function shallowSettings(v){return v&&typeof v==='object'&&!Array.isArray(v)?Object.assign({},v):{};}
  function cloneRecord(r){return r&&typeof r==='object'?Object.assign({},r):r;}
  function cloneRecordsForApi(v){return Array.isArray(v)?v.map(cloneRecord):[];}
  function cleanLegacy(){try{LEGACY_RECORD_KEYS.concat(LEGACY_SETTINGS_KEYS).forEach(function(k){localStorage.removeItem(k);});}catch(e){}}
  function checksumText(s){s=String(s==null?'':s);var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16)+':'+s.length;}
  function checksum(value){var s='';try{s=JSON.stringify(value);}catch(e){}return checksumText(s);}
  function summaryChecksumRecords(list){
    list=Array.isArray(list)?list:[];var h=2166136261;
    function mix(v){v=String(v==null?'':v);for(var i=0;i<v.length;i++){h^=v.charCodeAt(i);h=Math.imul(h,16777619);}}
    mix(list.length);
    for(var i=0;i<list.length;i++){
      var r=list[i]||{};
      mix(r.id);mix(r.barcode||r.barkodNo);mix(r.updatedAt||r.createdAt);mix(r.quantity||r.adet||1);
    }
    return 'summary-v1:'+(h>>>0).toString(16)+':'+list.length;
  }
  function readMeta(key){var m=readJson(key,null);return m&&typeof m==='object'?m:null;}
  function nextRevision(meta){seq=(seq+1)%1000;return Math.max(now()*1000+seq,Number(meta&&meta.revision||0)+1);}
  function validSettings(v){return !!(v&&typeof v==='object'&&!Array.isArray(v));}
  function legacyRecords(){
    var raw=null;try{raw=localStorage.getItem(RECORDS_KEY);}catch(e){}
    if(raw!==null){var direct=parse(raw,null);if(Array.isArray(direct))return direct;}
    for(var i=0;i<LEGACY_RECORD_KEYS.length;i++){
      if(/meta/i.test(LEGACY_RECORD_KEYS[i])||/snapshot/i.test(LEGACY_RECORD_KEYS[i]))continue;
      var a=readJson(LEGACY_RECORD_KEYS[i],null);if(Array.isArray(a))return a;
    }
    var snap=readJson(RECORDS_KEY+'_snapshot_v385',null);if(snap&&snap.payload){var b=parse(snap.payload,null);if(Array.isArray(b))return b;}
    return [];
  }
  function legacySettings(){
    var raw=null;try{raw=localStorage.getItem(SETTINGS_KEY);}catch(e){}
    if(raw!==null){var direct=parse(raw,null);if(validSettings(direct))return direct;}
    var old=readJson(SETTINGS_KEY+'_mirror_v515',null);return validSettings(old)?old:{};
  }
  function notify(name,detail){try{window.dispatchEvent(new CustomEvent(name,{detail:detail||{}}));}catch(e){}}
  function notifyFailure(kind,error,extra){var d={key:kind,message:error&&error.message?error.message:String(error||'Depolama hatası'),fatal:true};try{Object.assign(d,extra||{});}catch(e){}notify('mesaha:storage-error',d);}
  function notifyWarning(kind,error,extra){var d={key:kind,message:error&&error.message?error.message:String(error||'Depolama yedeği gecikti'),fatal:false,degraded:true};try{Object.assign(d,extra||{});}catch(e){}notify('mesaha:storage-warning',d);}

  function resetDb(db){try{if(db)db.close();}catch(e){}dbPromise=null;}
  function openDb(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise(function(resolve,reject){
      if(!('indexedDB' in window)){dbPromise=null;reject(new Error('IndexedDB kullanılamıyor'));return;}
      var req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=function(){
        var db=req.result;
        if(!db.objectStoreNames.contains(DOC_STORE))db.createObjectStore(DOC_STORE,{keyPath:'key'});
        if(!db.objectStoreNames.contains(RECORD_STORE))db.createObjectStore(RECORD_STORE,{keyPath:'id'});
        if(!db.objectStoreNames.contains(META_STORE))db.createObjectStore(META_STORE,{keyPath:'key'});
      };
      req.onsuccess=function(){var db=req.result;try{db.onversionchange=function(){resetDb(db);};}catch(e){}resolve(db);};
      req.onerror=function(){var err=req.error||new Error('IndexedDB açılamadı');dbPromise=null;reject(err);};
      req.onblocked=function(){dbPromise=null;reject(new Error('IndexedDB başka sekme tarafından kilitli'));};
    });
    return dbPromise;
  }
  function requestPromise(req,label){return new Promise(function(resolve,reject){req.onsuccess=function(){resolve(req.result==null?null:req.result);};req.onerror=function(){reject(req.error||new Error(label||'IndexedDB isteği başarısız'));};});}
  function txDone(tx,label,db){return new Promise(function(resolve,reject){tx.oncomplete=function(){resolve(true);};tx.onerror=function(){var e=tx.error||new Error(label||'IndexedDB işlemi başarısız');resetDb(db);reject(e);};tx.onabort=function(){var e=tx.error||new Error(label||'IndexedDB işlemi iptal edildi');resetDb(db);reject(e);};});}
  async function idbGet(store,key){var db=await openDb(),tx=db.transaction(store,'readonly');return requestPromise(tx.objectStore(store).get(key),'IndexedDB okunamadı');}
  async function idbGetAll(store){var db=await openDb(),tx=db.transaction(store,'readonly');return requestPromise(tx.objectStore(store).getAll(),'IndexedDB listesi okunamadı').then(function(x){return Array.isArray(x)?x:[];});}
  async function idbPutDoc(env){var db=await openDb(),tx=db.transaction(DOC_STORE,'readwrite');tx.objectStore(DOC_STORE).put(env);await txDone(tx,'Belge deposu yazılamadı',db);return true;}

  function recordMetaFrom(base,list,reason){
    var rev=nextRevision(base||{}),at=now();
    return {key:'records',schema:3,engine:'delta-v576',initialized:true,revision:rev,updatedAt:at,deletedAt:Array.isArray(list)&&list.length===0?at:0,count:Array.isArray(list)?list.length:0,reason:String(reason||'save').slice(0,80)};
  }
  function settingsEnvelope(settings,base,reason){
    var value=shallowSettings(settings),text='';try{text=JSON.stringify(value);}catch(e){value={};text='{}';}
    return {key:'settings',schema:3,engine:'delta-v576',revision:nextRevision(base||{}),updatedAt:now(),count:Object.keys(value).length,checksum:checksumText(text),checksumMode:'json-v1',reason:String(reason||'save').slice(0,80),value:value};
  }
  function recordsEnvelope(list,base,reason){
    list=shallowRecords(list);
    return {key:'records',schema:3,engine:'delta-v576',revision:nextRevision(base||{}),updatedAt:now(),deletedAt:list.length===0?now():0,count:list.length,checksum:summaryChecksumRecords(list),checksumMode:'summary-v1',reason:String(reason||'save').slice(0,80),value:list};
  }
  function envelopeValid(kind,env){
    if(!env||env.key!==kind)return false;
    if(kind==='records'){
      if(!Array.isArray(env.value))return false;
      if(env.checksumMode==='summary-v1')return summaryChecksumRecords(env.value)===env.checksum;
      return !env.checksum||checksum(env.value)===env.checksum;
    }
    if(!validSettings(env.value))return false;
    return !env.checksum||checksum(env.value)===env.checksum;
  }

  function applyRecords(list,meta,detail){
    bootRecords=shallowRecords(list);lastCommittedRecords=shallowRecords(list);
    bootRecordMeta=Object.assign({},meta||{},{count:bootRecords.length});
    notify('mesaha:records-saved',Object.assign({count:bootRecords.length,revision:Number(meta&&meta.revision||0),reason:meta&&meta.reason||'save',verified:true,durable:true,degraded:false,indexedDB:true,localStorage:false,engine:'delta-v576'},detail||{}));
  }
  function applySettings(settings,env,detail){
    bootSettings=shallowSettings(settings);lastCommittedSettings=shallowSettings(settings);
    bootSettingsMeta={revision:Number(env&&env.revision||0),updatedAt:Number(env&&env.updatedAt||0),count:Object.keys(bootSettings).length,checksum:env&&env.checksum,schema:3};
    notify('mesaha:settings-saved',Object.assign({revision:Number(env&&env.revision||0),reason:env&&env.reason||'save',verified:true,durable:true,degraded:false,indexedDB:true,localStorage:false,engine:'delta-v576'},detail||{}));
  }

  function localSnapshotDelay(kind){return kind==='records'?(isIOS?9000:5000):1200;}
  function runIdle(fn,timeout){
    if(typeof requestIdleCallback==='function')return requestIdleCallback(fn,{timeout:timeout||2500});
    return setTimeout(fn,Math.min(timeout||1200,1200));
  }
  function commitLocalSnapshot(kind,job){
    if(!job)return false;
    var dataKey=kind==='records'?RECORDS_KEY:SETTINGS_KEY,metaKey=kind==='records'?RECORDS_META:SETTINGS_META;
    try{
      var text=JSON.stringify(job.value);
      localStorage.setItem(dataKey,text);
      var m=Object.assign({},job.meta||{}, {schema:3,checksum:checksumText(text),checksumMode:'json-v1',provisional:false,count:kind==='records'?job.value.length:Object.keys(job.value||{}).length});
      localStorage.setItem(metaKey,JSON.stringify(m));
      if(kind==='records')bootRecordMeta=Object.assign({},m);else bootSettingsMeta=Object.assign({},m);
      cleanLegacy();return true;
    }catch(e){notifyWarning(kind,e,{localSnapshot:true});return false;}
  }
  function scheduleLocalSnapshot(kind,value,meta,delay){
    snapshotJobs[kind]={value:kind==='records'?shallowRecords(value):shallowSettings(value),meta:Object.assign({},meta||{})};
    if(snapshotTimers[kind])clearTimeout(snapshotTimers[kind]);
    snapshotTimers[kind]=setTimeout(function(){
      snapshotTimers[kind]=0;
      var job=snapshotJobs[kind];snapshotJobs[kind]=null;
      runIdle(function(){commitLocalSnapshot(kind,job);},isIOS?3500:2200);
    },delay==null?localSnapshotDelay(kind):Math.max(0,delay));
  }

  async function replaceRecordStore(list,meta,docEnv){
    var db=await openDb(),stores=[RECORD_STORE,META_STORE];if(docEnv)stores.push(DOC_STORE);
    var tx=db.transaction(stores,'readwrite'),rs=tx.objectStore(RECORD_STORE);rs.clear();
    for(var i=0;i<list.length;i++){var r=list[i];if(r&&r.id!=null)rs.put(r);}
    tx.objectStore(META_STORE).put(meta);
    if(docEnv)tx.objectStore(DOC_STORE).put(docEnv);
    await txDone(tx,'Kayıt deposu yenilenemedi',db);return true;
  }
  async function ensureRecordStore(list,preferredMeta,markFresh){
    if(bootRecordMeta&&bootRecordMeta.initialized===true)return bootRecordMeta;
    var current=null;try{current=await idbGet(META_STORE,'records');}catch(e){}
    if(current&&current.initialized===true){bootRecordMeta=Object.assign({},current);return bootRecordMeta;}
    var meta=recordMetaFrom(preferredMeta||bootRecordMeta||{},list,'initial-migration');
    await replaceRecordStore(list,meta,null);bootRecordMeta=Object.assign({},meta);
    return markFresh?Object.assign({},meta,{__justInitialized:true}):bootRecordMeta;
  }

  function saveRecordDelta(change,list,opts){
    /* Kuyruğa giren veriyi çağrı anında sabitle. Hızlı kayıtlarda state dizisi sonraki
       kayıtla değişirse eski işin yanlış uzunluk görüp tüm veriyi yeniden yazmasını önler. */
    list=Array.isArray(list)?list.slice():[];
    change=Object.assign({},change||{});
    if(change.upsert&&typeof change.upsert==='object')change.upsert=Object.assign({},change.upsert);
    if(change.previousRecord&&typeof change.previousRecord==='object')change.previousRecord=Object.assign({},change.previousRecord);
    opts=Object.assign({},opts||{});
    recordChain=recordChain.catch(function(){return null;}).then(async function(){
      var meta=null;
      try{
        meta=await ensureRecordStore(list,bootRecordMeta||{},true);
        if(meta&&meta.__justInitialized){
          delete meta.__justInitialized;
          applyRecords(list,meta,{delta:{type:change.deleteId!=null?'delete':'upsert',record:change.upsert||null,previousRecord:change.previousRecord||null,deleteId:change.deleteId||null},migrated:true});
          scheduleLocalSnapshot('records',list,meta);
          return {ok:true,indexedDB:true,localStorage:false,localStoragePending:true,verified:true,durable:true,degraded:false,revision:meta.revision,engine:'delta-v576-initial'};
        }
        var expectedBefore=list.length;
        if(change.deleteId!=null)expectedBefore=list.length+1;
        else if(change.upsert&&!change.previousRecord)expectedBefore=Math.max(0,list.length-1);
        if(Number(meta.count||0)!==expectedBefore){
          var repaired=recordMetaFrom(meta,list,opts&&opts.reason||'record-delta-repair');
          await replaceRecordStore(list,repaired,null);
          applyRecords(list,repaired,{delta:{type:change.deleteId!=null?'delete':'upsert',record:change.upsert||null,previousRecord:change.previousRecord||null,deleteId:change.deleteId||null},repaired:true});
          scheduleLocalSnapshot('records',list,repaired);
          return {ok:true,indexedDB:true,localStorage:false,localStoragePending:true,verified:true,durable:true,degraded:false,revision:repaired.revision,engine:'delta-v576-repair'};
        }
        var next=recordMetaFrom(meta,list,opts&&opts.reason||change.type||'record-delta');
        var db=await openDb(),tx=db.transaction([RECORD_STORE,META_STORE],'readwrite'),rs=tx.objectStore(RECORD_STORE);
        if(change.deleteId!=null)rs.delete(String(change.deleteId));
        if(change.upsert&&change.upsert.id!=null)rs.put(change.upsert);
        tx.objectStore(META_STORE).put(next);
        await txDone(tx,'Tek kayıt yazılamadı',db);
        applyRecords(list,next,{delta:{type:change.deleteId!=null?'delete':'upsert',record:change.upsert||null,previousRecord:change.previousRecord||null,deleteId:change.deleteId||null}});
        scheduleLocalSnapshot('records',list,next);
        return {ok:true,indexedDB:true,localStorage:false,localStoragePending:true,verified:true,durable:true,degraded:false,revision:next.revision,engine:'delta-v576'};
      }catch(err){
        var fallbackMeta=recordMetaFrom(meta||bootRecordMeta||{},list,opts&&opts.reason||'record-delta-fallback');
        var ok=commitLocalSnapshot('records',{value:shallowRecords(list),meta:fallbackMeta});
        if(ok){applyRecords(list,fallbackMeta,{degraded:true,indexedDB:false,localStorage:true});notifyWarning('records',err,{localStorage:true,indexedDB:false,deltaFallback:true});return {ok:true,indexedDB:false,localStorage:true,verified:true,durable:true,degraded:true,revision:fallbackMeta.revision,error:String(err&&err.message||err)};}
        notifyFailure('records',err,{delta:true});return {ok:false,indexedDB:false,localStorage:false,verified:false,durable:false,error:String(err&&err.message||err)};
      }
    });
    return recordChain;
  }

  function saveRecords(list,opts){
    list=Array.isArray(list)?list.slice():[];
    opts=Object.assign({},opts||{});
    recordChain=recordChain.catch(function(){return null;}).then(async function(){
      var base=null;try{base=await idbGet(META_STORE,'records');}catch(e){}
      var meta=recordMetaFrom(base||bootRecordMeta||{},list,opts&&opts.reason||'records-save');
      var doc=recordsEnvelope(list,meta,opts&&opts.reason||'records-save');doc.revision=meta.revision;doc.updatedAt=meta.updatedAt;doc.deletedAt=meta.deletedAt;
      try{
        await replaceRecordStore(list,meta,doc);
        applyRecords(list,meta,{full:true});scheduleLocalSnapshot('records',list,meta,1000);
        return {ok:true,indexedDB:true,localStorage:false,localStoragePending:true,verified:true,durable:true,degraded:false,revision:meta.revision,engine:'bulk-v576'};
      }catch(err){
        var ok=commitLocalSnapshot('records',{value:shallowRecords(list),meta:meta});
        if(ok){applyRecords(list,meta,{full:true,degraded:true,indexedDB:false,localStorage:true});notifyWarning('records',err,{bulkFallback:true});return {ok:true,indexedDB:false,localStorage:true,verified:true,durable:true,degraded:true,revision:meta.revision};}
        notifyFailure('records',err,{full:true});return {ok:false,error:String(err&&err.message||err)};
      }
    });
    return recordChain;
  }

  function saveSettings(settings,opts){
    settings=validSettings(settings)?shallowSettings(settings):{};
    opts=Object.assign({},opts||{});
    settingsChain=settingsChain.catch(function(){return null;}).then(async function(){
      var base=bootSettingsMeta||null;
      var env=settingsEnvelope(settings,base||{},opts&&opts.reason||'settings-save');
      try{
        await idbPutDoc(env);applySettings(settings,env);scheduleLocalSnapshot('settings',settings,env);
        return {ok:true,indexedDB:true,localStorage:false,localStoragePending:true,verified:true,durable:true,degraded:false,revision:env.revision,engine:'settings-v576'};
      }catch(err){
        var ok=commitLocalSnapshot('settings',{value:shallowSettings(settings),meta:env});
        if(ok){applySettings(settings,env,{degraded:true,indexedDB:false,localStorage:true});notifyWarning('settings',err,{localStorage:true});return {ok:true,indexedDB:false,localStorage:true,verified:true,durable:true,degraded:true,revision:env.revision};}
        notifyFailure('settings',err);return {ok:false,error:String(err&&err.message||err)};
      }
    });
    return settingsChain;
  }

  function replaceAll(records,settings,opts){
    records=Array.isArray(records)?records.slice():[];
    settings=validSettings(settings)?shallowSettings(settings):{};
    opts=Object.assign({},opts||{});
    bulkChain=bulkChain.catch(function(){return null;}).then(async function(){
      await Promise.all([recordChain.catch(function(){}),settingsChain.catch(function(){})]);
      var currentMeta=null,currentSettings=null;try{var p=await Promise.all([idbGet(META_STORE,'records').catch(function(){return null;}),idbGet(DOC_STORE,'settings').catch(function(){return null;})]);currentMeta=p[0];currentSettings=p[1];}catch(e){}
      var meta=recordMetaFrom(currentMeta||bootRecordMeta||{},records,opts&&opts.reason||'replace-all');
      var recDoc=recordsEnvelope(records,meta,opts&&opts.reason||'replace-all');recDoc.revision=meta.revision;recDoc.updatedAt=meta.updatedAt;recDoc.deletedAt=meta.deletedAt;
      var setDoc=settingsEnvelope(settings,currentSettings||bootSettingsMeta||{},opts&&opts.reason||'replace-all');
      try{
        var db=await openDb(),tx=db.transaction([RECORD_STORE,META_STORE,DOC_STORE],'readwrite'),rs=tx.objectStore(RECORD_STORE);rs.clear();
        for(var i=0;i<records.length;i++){var r=records[i];if(r&&r.id!=null)rs.put(r);}
        tx.objectStore(META_STORE).put(meta);var ds=tx.objectStore(DOC_STORE);ds.put(recDoc);ds.put(setDoc);
        await txDone(tx,'Toplu veri yazılamadı',db);
        applyRecords(records,meta,{full:true,transaction:true});applySettings(settings,setDoc,{transaction:true});
        scheduleLocalSnapshot('records',records,meta,600);scheduleLocalSnapshot('settings',settings,setDoc,500);
        return {ok:true,indexedDB:true,localStorage:false,localStoragePending:true,verified:true,durable:true,degraded:false,recordsRevision:meta.revision,settingsRevision:setDoc.revision,engine:'replace-v576'};
      }catch(err){
        var a=commitLocalSnapshot('records',{value:shallowRecords(records),meta:meta}),b=commitLocalSnapshot('settings',{value:shallowSettings(settings),meta:setDoc});
        if(a&&b){applyRecords(records,meta,{full:true,transaction:true,degraded:true,indexedDB:false,localStorage:true});applySettings(settings,setDoc,{transaction:true,degraded:true,indexedDB:false,localStorage:true});notifyWarning('replace',err,{localStorage:true});return {ok:true,indexedDB:false,localStorage:true,verified:true,durable:true,degraded:true,recordsRevision:meta.revision,settingsRevision:setDoc.revision};}
        notifyFailure('replace',err);return {ok:false,error:String(err&&err.message||err)};
      }
    });
    return bulkChain;
  }

  function candidateRevision(x){return Number(x&&x.revision||0);}
  function localRecordsCandidate(){
    var list=readJson(RECORDS_KEY,null),meta=readMeta(RECORDS_META);if(!Array.isArray(list))return null;
    var valid=true;if(meta&&meta.checksum){try{valid=checksum(list)===meta.checksum;}catch(e){valid=false;}}
    return valid?{source:'local',records:list,meta:meta||{revision:0,updatedAt:0,count:list.length,provisional:true}}:null;
  }
  function localSettingsCandidate(){
    var value=readJson(SETTINGS_KEY,null),meta=readMeta(SETTINGS_META);if(!validSettings(value))return null;
    var valid=true;if(meta&&meta.checksum){try{valid=checksum(value)===meta.checksum;}catch(e){valid=false;}}
    return valid?{source:'local',settings:value,meta:meta||{revision:0,updatedAt:0,provisional:true}}:null;
  }
  function newer(a,b){
    if(!a)return b;if(!b)return a;
    if(a.meta&&a.meta.provisional===true&&!(b.meta&&b.meta.provisional===true))return b;
    if(b.meta&&b.meta.provisional===true&&!(a.meta&&a.meta.provisional===true))return a;
    return candidateRevision(b.meta)>candidateRevision(a.meta)?b:a;
  }
  function applyToApp(records,settings,reason){
    try{
      if(window.state){
        if(validSettings(settings))window.state.settings=Object.assign(window.state.settings||{},shallowSettings(settings));
        if(Array.isArray(records)){
          var fb=String(window.state.settings&&window.state.settings.bolmeNo||'').trim(),fs=String(window.state.settings&&window.state.settings.seflik||'').trim();
          window.state.records=records.map(function(r){if(!r||typeof r!=='object')return r;var o=Object.assign({},r);if(!String(o.bolmeNo||o.bolme||o.bolme_no||'').trim()&&fb)o.bolmeNo=fb;if(!String(o.seflik||o.seflikAdi||o.seflik_adi||'').trim()&&fs)o.seflik=fs;return o;});
        }
      }
      try{if(window.MesahaRenderStorageV382&&window.MesahaRenderStorageV382.renderAllSoon)window.MesahaRenderStorageV382.renderAllSoon(30);else if(typeof window.renderAll==='function')window.renderAll();}catch(e){}
      notify('mesaha:storage-recovered',{reason:reason||'recovery',count:Array.isArray(records)?records.length:0,engine:'delta-v576'});
    }catch(e){}
  }
  async function recoverIntoApp(){
    if(recoveryPromise)return recoveryPromise;
    recoveryPromise=(async function(){
      var localRec=localRecordsCandidate(),localSet=localSettingsCandidate();
      var itemMeta=null,itemList=null,docRec=null,docSet=null;
      try{
        var dbVals=await Promise.all([
          idbGet(META_STORE,'records').catch(function(){return null;}),
          idbGet(DOC_STORE,'records').catch(function(){return null;}),
          idbGet(DOC_STORE,'settings').catch(function(){return null;})
        ]);
        itemMeta=dbVals[0];docRec=dbVals[1];docSet=dbVals[2];
        if(itemMeta&&itemMeta.initialized===true)itemList=await idbGetAll(RECORD_STORE);
      }catch(e){notifyWarning('recovery',e,{startup:true});}

      var recCandidate=localRec;
      if(envelopeValid('records',docRec))recCandidate=newer(recCandidate,{source:'document',records:docRec.value,meta:docRec});
      if(itemMeta&&itemMeta.initialized===true&&Array.isArray(itemList)&&Number(itemMeta.count||0)===itemList.length){recCandidate=newer(recCandidate,{source:'items',records:itemList,meta:itemMeta});}
      if(!recCandidate)recCandidate={source:'empty',records:[],meta:{revision:0,updatedAt:0,count:0,provisional:true}};

      var setCandidate=localSet;
      if(envelopeValid('settings',docSet))setCandidate=newer(setCandidate,{source:'document',settings:docSet.value,meta:docSet});
      if(!setCandidate)setCandidate={source:'empty',settings:{},meta:{revision:0,updatedAt:0,provisional:true}};

      bootRecords=shallowRecords(recCandidate.records);lastCommittedRecords=shallowRecords(recCandidate.records);bootRecordMeta=Object.assign({},recCandidate.meta||{});
      bootSettings=shallowSettings(setCandidate.settings);lastCommittedSettings=shallowSettings(setCandidate.settings);bootSettingsMeta=Object.assign({},setCandidate.meta||{});

      if(!(itemMeta&&itemMeta.initialized===true)){
        try{var migrated=await ensureRecordStore(bootRecords,bootRecordMeta);bootRecordMeta=Object.assign({},migrated);}catch(e){notifyWarning('records-migration',e,{startup:true});}
      }else if(recCandidate.source!=='items'&&candidateRevision(recCandidate.meta)>candidateRevision(itemMeta)){
        try{var synced=recordMetaFrom(itemMeta,bootRecords,'startup-record-store-sync');synced.revision=candidateRevision(recCandidate.meta)||synced.revision;synced.updatedAt=Number(recCandidate.meta&&recCandidate.meta.updatedAt||synced.updatedAt);await replaceRecordStore(bootRecords,synced,null);bootRecordMeta=Object.assign({},synced);}catch(e){notifyWarning('records-store-sync',e,{startup:true});}
      }
      if(recCandidate.source!=='local')scheduleLocalSnapshot('records',bootRecords,bootRecordMeta,500);
      if(setCandidate.source!=='local')scheduleLocalSnapshot('settings',bootSettings,bootSettingsMeta,400);

      var currentCount=window.state&&Array.isArray(window.state.records)?window.state.records.length:-1;
      var currentRev=readMeta(RECORDS_META)||{};
      var changed=currentCount!==bootRecords.length||candidateRevision(bootRecordMeta)>candidateRevision(currentRev)||recCandidate.source==='items';
      if(window.state&&(changed||setCandidate.source!=='local'))applyToApp(bootRecords,bootSettings,'newer-or-valid-revision');
      cleanLegacy();return {ok:true,changed:changed,records:bootRecords.length,source:recCandidate.source,engine:'delta-v576'};
    })().finally(function(){recoveryPromise=null;});
    return recoveryPromise;
  }

  function checkpointKind(kind,value,reason){
    if(kind==='records'){
      var list=Array.isArray(value)?value:[];scheduleLocalSnapshot('records',list,bootRecordMeta||{},0);return {ok:true,pending:true,engine:'delta-v576'};
    }
    var st=validSettings(value)?value:{};scheduleLocalSnapshot('settings',st,bootSettingsMeta||{},0);return {ok:true,pending:true,engine:'delta-v576'};
  }
  function checkpointAll(records,settings,opts){return {ok:true,records:checkpointKind('records',records,opts&&opts.reason),settings:checkpointKind('settings',settings,opts&&opts.reason),engine:'delta-v576'};}
  async function flush(){await Promise.all([recordChain.catch(function(){}),settingsChain.catch(function(){}),bulkChain.catch(function(){})]);return true;}
  function info(){return {recordsMeta:bootRecordMeta||readMeta(RECORDS_META),settingsMeta:bootSettingsMeta||readMeta(SETTINGS_META),recordsCount:(window.state&&Array.isArray(window.state.records)?window.state.records:bootRecords).length,pending:!!(snapshotJobs.records||snapshotJobs.settings||snapshotTimers.records||snapshotTimers.settings),database:DB_NAME,engine:'delta-v576',incremental:true};}

  bootRecords=legacyRecords();bootSettings=legacySettings();bootRecordMeta=readMeta(RECORDS_META);bootSettingsMeta=readMeta(SETTINGS_META);
  if(!bootRecordMeta)bootRecordMeta={revision:1,updatedAt:0,deletedAt:0,count:bootRecords.length,checksum:checksum(bootRecords),schema:2,provisional:true};
  if(!bootSettingsMeta)bootSettingsMeta={revision:1,updatedAt:0,count:Object.keys(bootSettings).length,checksum:checksum(bootSettings),schema:2,provisional:true};
  lastCommittedRecords=shallowRecords(bootRecords);lastCommittedSettings=shallowSettings(bootSettings);cleanLegacy();

  var api={
    __v527:true,__v576:true,engine:'delta-v576',
    bootstrapRecords:function(){return cloneRecordsForApi(bootRecords);},
    bootstrapSettings:function(){return shallowSettings(bootSettings);},
    saveRecordDelta:saveRecordDelta,
    saveRecords:saveRecords,
    saveSettings:saveSettings,
    replaceAll:replaceAll,
    checkpointRecords:function(records,reason){return checkpointKind('records',records,reason||'manual-records-checkpoint');},
    checkpointSettings:function(settings,reason){return checkpointKind('settings',settings,reason||'manual-settings-checkpoint');},
    checkpointAll:checkpointAll,
    clearRecords:function(reason){return saveRecords([],{reason:reason||'clear'});},
    recoverIntoApp:recoverIntoApp,
    flush:flush,
    info:info,
    lastCommittedRecords:function(){return cloneRecordsForApi(lastCommittedRecords);},
    lastCommittedSettings:function(){return shallowSettings(lastCommittedSettings);}
  };
  window.MesahaStorageV527=api;
  window.MesahaPersistentStoreV515={__v527:true,__v576:true,saveRecordDelta:saveRecordDelta,saveRecords:saveRecords,saveSettings:saveSettings,recoverIntoApp:recoverIntoApp};

  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(function(){});}catch(e){}
  setTimeout(function(){recoverIntoApp().catch(function(){});},40);
  window.addEventListener('pagehide',function(){flush();},{passive:true});
})();
