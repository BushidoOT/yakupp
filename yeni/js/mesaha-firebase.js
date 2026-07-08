/* Mesaha İO V504 — Güvenli Supabase v2 uyumluluk motoru
   Amaç: Eski Firebase/Supabase çağrılarını bozmadan yeni RLS güvenli tablolara yönlendirmek.
   - Anonymous Auth ile gerçek kullanıcı oturumu açar.
   - REST isteklerinde anon key değil access_token kullanır.
   - Eski spam koleksiyonlarını sabit tek satırlı güvenli yapılara map eder.
   - İstemciden kalıcı DELETE yoktur. */
(function(){
  'use strict';
  var VERSION=(window.MESAHA_VERSION&&window.MESAHA_VERSION.version)||'local';
  var readyPromise=null, lastOkMs=0, lastError='', authSession=null, supabaseApi=null;
  var SESSION_KEY='mesaha_supabase_v500_session';
  var DEVICE_KEY='mesaha_supabase_v500_device';
  var ALLOWED_SLOTS={latest:1,slot_0:1,slot_1:1,slot_2:1,slot_3:1,slot_4:1};

  function cfg(){
    var c=window.MESAHA_SUPABASE_CONFIG||{};
    var url=String(c.url||localStorage.getItem('mesaha_supabase_url')||'').trim().replace(/\/+$/,'');
    var anonKey=String(c.anonKey||c.anon_key||localStorage.getItem('mesaha_supabase_anon_key')||'').trim();
    if(!url || !anonKey || url.indexOf('https://')!==0) throw new Error('Supabase ayarı eksik.');
    return {url:url, anonKey:anonKey};
  }
  function getDeviceId(){
    try{var x=localStorage.getItem(DEVICE_KEY); if(x) return x; x='dev_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10); localStorage.setItem(DEVICE_KEY,x); return x;}catch(e){return 'dev_'+Date.now().toString(36);}
  }
  function enc(v){return encodeURIComponent(String(v==null?'':v));}
  function clean(v){return String(v==null?'':v).trim();}
  function safeJson(x,f){try{return JSON.parse(x);}catch(e){return f;}}
  function deepClone(x){try{return JSON.parse(JSON.stringify(x||{}));}catch(e){return Object.assign({},x||{});}}
  function msFromIso(s){var n=Date.parse(s||''); return isFinite(n)?n:Date.now();}
  function trNow(){try{return new Date().toLocaleString('tr-TR');}catch(e){return new Date().toISOString();}}
  function isIncrement(v){return v && typeof v==='object' && v.__mesahaIncrement===true;}
  function mergeData(oldData,newData){
    var out=deepClone(oldData||{}), data=newData||{};
    Object.keys(data).forEach(function(k){var v=data[k]; if(isIncrement(v)) out[k]=Number(out[k]||0)+Number(v.n||0); else if(v&&typeof v==='object'&&!Array.isArray(v)&&out[k]&&typeof out[k]==='object'&&!Array.isArray(out[k])) out[k]=Object.assign({},out[k],v); else out[k]=v;});
    return out;
  }
  function blockedPayload(d){
    d=d||{}; var id=String(d.id||''), key=String(d.userKey||d.user_key||''), name=String(d.name||''), sef=String(d.seflik||'');
    return /^spam_/i.test(id) || /stress[_\s-]*test/i.test(key) || /stress tester/i.test(name) || /^simulasyon$/i.test(sef);
  }
  function activeSession(){
    if(authSession && authSession.access_token && Number(authSession.expires_at||0)*1000 > Date.now()+60000) return authSession;
    try{var s=safeJson(localStorage.getItem(SESSION_KEY)||'',null); if(s&&s.access_token&&Number(s.expires_at||0)*1000>Date.now()+60000){authSession=s;return s;}}catch(e){}
    return null;
  }
  async function authFetch(path,options){
    var c=cfg();
    var headers=Object.assign({apikey:c.anonKey,'Content-Type':'application/json'},(options&&options.headers)||{});
    var res=await fetch(c.url+path,Object.assign({},options||{},{headers:headers,cache:'no-store'}));
    var txt=await res.text(); var json=safeJson(txt,txt);
    if(!res.ok){throw new Error((json&&json.msg)||(json&&json.message)||String(json||res.statusText||'Auth hata'));}
    return json;
  }
  async function refreshSession(s){
    if(!s || !s.refresh_token) throw new Error('Oturum yenileme bilgisi yok');
    var j=await authFetch('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:s.refresh_token})});
    saveSession(j); return j;
  }
  function saveSession(j){
    var s={access_token:j.access_token,refresh_token:j.refresh_token,expires_at:j.expires_at,user:j.user||{}};
    if(!s.expires_at && j.expires_in) s.expires_at=Math.floor(Date.now()/1000)+Number(j.expires_in||3600);
    authSession=s; try{localStorage.setItem(SESSION_KEY,JSON.stringify(s));}catch(e){} return s;
  }
  async function signInAnon(){
    var old=safeJson((function(){try{return localStorage.getItem(SESSION_KEY)||'';}catch(e){return ''}})(),null);
    if(old && old.refresh_token){try{return await refreshSession(old);}catch(e){}}
    var j=await authFetch('/auth/v1/signup',{method:'POST',body:JSON.stringify({data:{app:'Mesaha İO',deviceId:getDeviceId(),source:'v500-anonymous'}})});
    return saveSession(j);
  }
  async function session(){var s=activeSession(); if(s) return s; return await signInAnon();}
  function uid(){var s=authSession||activeSession()||{}; return (s.user&&s.user.id)||'';}

  async function request(table,qs,opts){
    var c=cfg(), s=await session();
    var url=c.url+'/rest/v1/'+table+(qs?('?'+qs):'');
    var headers=Object.assign({apikey:c.anonKey,Authorization:'Bearer '+s.access_token,Accept:'application/json'},(opts&&opts.headers)||{});
    if(opts&&opts.body!=null) headers['Content-Type']='application/json';
    var res=await fetch(url,Object.assign({},opts||{},{headers:headers,cache:'no-store'}));
    var text=await res.text(); var json=safeJson(text,text);
    if(!res.ok){var msg=(json&&json.message)||(json&&json.msg)||String(json||res.statusText||'Supabase hata'); throw new Error(msg);}
    return json;
  }
  async function upsert(table,row,conflict){
    var qs='on_conflict='+enc(conflict||'user_id');
    return request(table,qs,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(row)}).then(function(r){return Array.isArray(r)?r[0]:r;});
  }
  function safeSlot(id){id=String(id||'latest'); return ALLOWED_SLOTS[id]?id:'latest';}
  function tableFor(name,parent){
    if(parent && parent.table==='mesaha_backup_slots' && name==='chunks') return 'mesaha_backup_chunks';
    var n=String(name||'');
    if(n==='users') return 'mesaha_user_profiles';
    if(n==='usageStats') return 'mesaha_usage_current';
    if(n==='backups') return 'mesaha_backup_slots';
    if(n==='supportTickets' || n==='exportLogs' || n==='healthChecks' || n==='debugLogs' || n==='adminLogs') return 'mesaha_log_current';
    return 'mesaha_log_current';
  }
  function rowFromData(table,id,data,parent){
    data=deepClone(data||{}); var userId=uid();
    if(table==='mesaha_user_profiles'){
      return {user_id:userId,user_key:clean(data.userKey||data.user_key||id||userId).slice(0,80)||userId,name:clean(data.name||'Kullanıcı').slice(0,120)||'Kullanıcı',seflik:clean(data.seflik||'Şeflik').slice(0,120)||'Şeflik',bolme_no:clean(data.bolmeNo||data.bolme_no||'').slice(0,80)||null,app_version:clean(data.appVersion||data.fileVersion||VERSION).slice(0,120),device_info:data.lastDeviceInfo||data.deviceInfo||data.device||{}};
    }
    if(table==='mesaha_usage_current'){
      return {user_id:userId,record_count:Number(data.recordCount||data.totalRecords||data.adet||0)||0,total_volume:Number(data.totalM3||data.m3||0)||0,last_seen_at:new Date().toISOString(),app_version:clean(data.appVersion||data.fileVersion||VERSION).slice(0,120),payload:data};
    }
    if(table==='mesaha_backup_slots'){
      var slot=safeSlot(id); var p=data.payload || (data.payloadText?safeJson(data.payloadText,{}):data) || data;
      var name=clean(data.fileName||data.backupName||data.backup_name||('Mesaha_Bulut_Yedek_'+slot+'.json')).slice(0,180);
      return {user_id:userId,slot_id:slot,backup_name:name,record_count:Number(data.recordCount||data.count||0)||0,total_volume:Number(data.totalVolume||data.m3||0)||0,payload:p,archived:data.archived===true};
    }
    if(table==='mesaha_backup_chunks'){
      var slotId=safeSlot(parent&&parent.id||'latest');
      return {user_id:userId,slot_id:slotId,chunk_index:Number(data.index||data.chunkIndex||id||0)||0,records:Array.isArray(data.records)?data.records:[],updated_at:new Date().toISOString()};
    }
    return {user_id:userId,level:clean(data.level||data.type||'info').slice(0,40),message:clean(data.message||data.detail||data.id||'Mesaha işlem').slice(0,500),payload:data};
  }
  function dataFromRow(table,row){
    row=row||{};
    if(table==='mesaha_user_profiles') return {id:row.user_key||row.user_id,userKey:row.user_key,name:row.name,seflik:row.seflik,bolmeNo:row.bolme_no,appVersion:row.app_version,lastDeviceInfo:row.device_info,updatedAt:trNow(),updatedAtMs:msFromIso(row.updated_at||row.created_at)};
    if(table==='mesaha_usage_current') {var p=deepClone(row.payload||{}); p.recordCount=row.record_count||p.recordCount||0; p.totalM3=row.total_volume||p.totalM3||0; p.updatedAtMs=msFromIso(row.updated_at||row.last_seen_at); return p;}
    if(table==='mesaha_backup_slots') {var p=deepClone(row.payload||{}); p.id=row.slot_id; p.slotId=row.slot_id; p.userKey=p.userKey||''; p.fileName=p.fileName||row.backup_name||('Mesaha yedeği '+row.slot_id); p.recordCount=row.record_count||p.recordCount||0; p.m3=row.total_volume||p.m3||0; p.createdAt=p.createdAt||row.created_at||''; p.createdAtMs=p.createdAtMs||msFromIso(row.created_at); p.updatedAtMs=msFromIso(row.updated_at||row.created_at); return p;}
    if(table==='mesaha_backup_chunks') return {index:row.chunk_index,records:Array.isArray(row.records)?row.records:[]};
    var lp=deepClone(row.payload||{}); lp.message=lp.message||row.message; lp.level=lp.level||row.level; lp.updatedAtMs=msFromIso(row.updated_at); return lp;
  }
  function DocSnap(id,row,table){this.id=String(id);this.exists=!!row;this._row=row||null;this._table=table;}
  DocSnap.prototype.data=function(){return dataFromRow(this._table,this._row||{});};
  function QuerySnap(rows,table){this.docs=(rows||[]).map(function(r){var id=r.slot_id!=null?r.slot_id:(r.user_key||r.user_id||r.id||'current'); if(table==='mesaha_backup_chunks') id=String(r.chunk_index||0).padStart(4,'0'); return new DocSnap(id,r,table);});}
  QuerySnap.prototype.forEach=function(fn){this.docs.forEach(fn);};
  Object.defineProperty(QuerySnap.prototype,'empty',{get:function(){return !this.docs.length;}});
  Object.defineProperty(QuerySnap.prototype,'size',{get:function(){return this.docs.length;}});

  async function getCurrent(table,id,parent){
    await session(); var userId=uid();
    if(table==='mesaha_backup_slots') return request(table,'user_id=eq.'+enc(userId)+'&slot_id=eq.'+enc(safeSlot(id))+'&select=*&limit=1',{method:'GET'}).then(function(a){return (a||[])[0]||null;});
    if(table==='mesaha_backup_chunks') return request(table,'user_id=eq.'+enc(userId)+'&slot_id=eq.'+enc(safeSlot(parent&&parent.id||'latest'))+'&chunk_index=eq.'+enc(Number(id||0)||0)+'&select=*&limit=1',{method:'GET'}).then(function(a){return (a||[])[0]||null;});
    return request(table,'user_id=eq.'+enc(userId)+'&select=*&limit=1',{method:'GET'}).then(function(a){return (a||[])[0]||null;});
  }

  function DocumentRef(table,id,parent){this.table=table;this.id=String(id||'current');this.parent=parent||null; if(table==='mesaha_backup_slots') this.id=safeSlot(this.id);}
  DocumentRef.prototype.get=function(){var self=this;return getCurrent(this.table,this.id,this.parent).then(function(r){return new DocSnap(self.id,r,self.table);});};
  DocumentRef.prototype.set=async function(data,opt){
    await session(); data=deepClone(data||{}); if(blockedPayload(data)) throw new Error('Güvenlik: test/spam kayıt engellendi.');
    if(opt&&opt.merge){try{var old=await getCurrent(this.table,this.id,this.parent); data=mergeData(dataFromRow(this.table,old||{}),data);}catch(e){}}
    var row=rowFromData(this.table,this.id,data,this.parent);
    if(this.table==='mesaha_backup_slots') return upsert(this.table,row,'user_id,slot_id');
    if(this.table==='mesaha_backup_chunks') return upsert(this.table,row,'user_id,slot_id,chunk_index');
    return upsert(this.table,row,'user_id');
  };
  DocumentRef.prototype.delete=function(){return Promise.reject(new Error('Kalıcı silme güvenlik için kapalı.'));};
  DocumentRef.prototype.collection=function(name){return new CollectionRef(name,this);};

  function CollectionRef(name,parent){this.name=name;this.parent=parent||null;this.table=tableFor(name,parent);this._filters=[];this._order=null;this._limit=0;}
  CollectionRef.prototype.doc=function(id){return new DocumentRef(this.table,id||(this.table==='mesaha_backup_slots'?'latest':'current'),this.parent);};
  CollectionRef.prototype.add=function(data){var ref=this.doc(this.table==='mesaha_backup_slots'?'latest':'current');return ref.set(data||{}, {merge:true}).then(function(){return ref;});};
  CollectionRef.prototype.where=function(field,op,value){var q=new CollectionRef(this.name,this.parent);q._filters=(this._filters||[]).concat([{field:field,op:op,value:value}]);q._order=this._order;q._limit=this._limit;return q;};
  CollectionRef.prototype.orderBy=function(field,dir){var q=new CollectionRef(this.name,this.parent);q._filters=(this._filters||[]).slice();q._order={field:field,dir:dir||'asc'};q._limit=this._limit;return q;};
  CollectionRef.prototype.limit=function(n){var q=new CollectionRef(this.name,this.parent);q._filters=(this._filters||[]).slice();q._order=this._order;q._limit=Number(n||0);return q;};
  CollectionRef.prototype.get=async function(){
    await session(); var userId=uid(), table=this.table, qs='user_id=eq.'+enc(userId)+'&select=*';
    if(table==='mesaha_backup_slots') qs+='&archived=eq.false';
    if(table==='mesaha_backup_chunks') qs+='&slot_id=eq.'+enc(safeSlot(this.parent&&this.parent.id||'latest'))+'&order=chunk_index.asc';
    if(this._limit) qs+='&limit='+Number(this._limit);
    var rows=[]; try{rows=await request(table,qs,{method:'GET'});}catch(e){rows=[];}
    rows=rows||[];
    var localFilters=this._filters||[];
    if(localFilters.length){rows=rows.filter(function(r){var d=dataFromRow(table,r);return localFilters.every(function(f){return f.op==='=='?String(d[f.field]||'')===String(f.value||''):true;});});}
    if(this._order){var fld=this._order.field, dir=String(this._order.dir).toLowerCase()==='desc'?-1:1; rows.sort(function(a,b){var da=dataFromRow(table,a),db=dataFromRow(table,b);return (Number(da[fld]||0)-Number(db[fld]||0))*dir;});}
    if(this._limit && rows.length>this._limit) rows=rows.slice(0,this._limit);
    return new QuerySnap(rows,table);
  };

  function Db(){}
  Db.prototype.collection=function(name){return new CollectionRef(name,null);};
  Db.prototype.batch=function(){var ops=[];return{set:function(ref,data,opt){ops.push(function(){return ref.set(data,opt);});},delete:function(ref){ops.push(function(){return ref.delete();});},commit:function(){return Promise.all(ops.map(function(fn){return fn();}));}};};
  Db.prototype.settings=function(){}; Db.prototype.enableNetwork=function(){return Promise.resolve();}; Db.prototype.disableNetwork=function(){return Promise.resolve();};

  function installCompat(db){
    if(!window.firebase) window.firebase={apps:[{}]};
    window.firebase.apps=window.firebase.apps&&window.firebase.apps.length?window.firebase.apps:[{}];
    window.firebase.initializeApp=function(){return window.firebase.apps[0];};
    window.firebase.auth=function(){return{currentUser:{uid:uid()||'supabase-anon'},signInAnonymously:function(){return session().then(function(s){return{user:{uid:(s.user&&s.user.id)||'supabase-anon'}};});}};};
    var fs=function(){return db;}; fs.FieldValue={increment:function(n){return {__mesahaIncrement:true,n:Number(n||0)};}}; window.firebase.firestore=fs;
  }
  async function ready(){
    if(!readyPromise){readyPromise=(async function(){var c=cfg(); supabaseApi={url:c.url, anonKey:c.anonKey}; await session(); var db=new Db(); installCompat(db); lastOkMs=Date.now(); lastError=''; return {db:db,auth:{currentUser:{uid:uid()}},supabase:supabaseApi};})();}
    try{return await readyPromise;}catch(e){readyPromise=null;lastError=e&&e.message?e.message:String(e||'Supabase hata');throw e;}
  }
  async function health(){var r=await ready(); await r.db.collection('healthChecks').doc('current').set({level:'info',message:'health-ok',atMs:Date.now(),appVersion:((window.MESAHA_VERSION&&window.MESAHA_VERSION.visibleVersion)||window.APP_VERSION||'Mesaha İO')},{merge:true}).catch(function(){}); lastOkMs=Date.now();lastError='';return r;}
  function reset(){readyPromise=null;authSession=null;lastError='';try{localStorage.removeItem(SESSION_KEY);}catch(e){}}
  function status(){return{ok:!!lastOkMs,lastOkMs:lastOkMs,lastError:lastError,online:navigator.onLine!==false,provider:'supabase-v2-secure',uid:uid(),version:VERSION};}
  var api={provider:'supabase-v2-secure',version:VERSION,ready:ready,health:health,reset:reset,status:status,withTimeout:function(p,ms,label){return Promise.race([p,new Promise(function(_,rej){setTimeout(function(){rej(new Error((label||'İşlem')+' zaman aşımı'));},ms||15000);})]);}};
  window.mesahaSupabase=api; window.mesahaSupabaseV383=api; window.mesahaSupabaseV380=api; window.mesahaCloud=api;
})();
