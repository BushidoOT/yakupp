/* Mesaha İO v442 — Supabase uyumluluk motoru
   Eski kodların bozulmaması için Supabase tablo benzeri küçük bir uyumluluk katmanı sağlar.
   Veriler Supabase REST tablolarına yazılır/okunur. */
(function(){
  'use strict';
  var VERSION='v450_urun_secim_tik';
  var readyPromise=null;
  var lastOkMs=0;
  var lastError='';
  var supabaseApi=null;

  function cfg(){
    var c=window.MESAHA_SUPABASE_CONFIG||{};
    var url=String(c.url||localStorage.getItem('mesaha_supabase_url')||'').trim().replace(/\/+$/,'');
    var anonKey=String(c.anonKey||c.anon_key||localStorage.getItem('mesaha_supabase_anon_key')||'').trim();
    if(!url || !anonKey || url.indexOf('https://')!==0){
      throw new Error('Supabase ayarı eksik: js/mesaha-supabase-config.js içine url ve anonKey gir.');
    }
    return {url:url, anonKey:anonKey};
  }
  function nowUid(){return 'anon_'+Math.random().toString(36).slice(2)+'_'+Date.now().toString(36)}
  function enc(v){return encodeURIComponent(String(v==null?'':v))}
  function colTable(name){
    var map={
      users:'users', usageStats:'usage_stats', backups:'backups', supportTickets:'support_tickets',
      exportLogs:'export_logs', adminSettings:'admin_settings', adminBroadcasts:'admin_broadcasts',
      healthChecks:'health_checks', adminPermissions:'admin_permissions', archivedItems:'archived_items', adminActionLogs:'admin_action_logs', chunks:'backup_chunks'
    };
    return map[name]||String(name||'').replace(/[A-Z]/g,function(m){return '_'+m.toLowerCase();});
  }
  function fieldColumn(field){
    var map={id:'id', userKey:'user_key', user_key:'user_key', name:'name', seflik:'seflik', bolmeNo:'bolme_no',
      createdAtMs:'created_at_ms', updatedAtMs:'updated_at_ms', lastSeenMs:'updated_at_ms', status:'status', backupId:'backup_id', index:'chunk_index'};
    return map[field]||null;
  }
  function deepClone(x){try{return JSON.parse(JSON.stringify(x||{}));}catch(e){return Object.assign({},x||{});}}
  function isIncrement(v){return v && typeof v==='object' && v.__mesahaIncrement===true;}
  function mergeData(oldData,newData){
    var out=deepClone(oldData||{}), data=newData||{};
    Object.keys(data).forEach(function(k){
      var v=data[k];
      if(isIncrement(v)) out[k]=Number(out[k]||0)+Number(v.n||0);
      else if(v && typeof v==='object' && !Array.isArray(v) && out[k] && typeof out[k]==='object' && !Array.isArray(out[k])) out[k]=Object.assign({},out[k],v);
      else out[k]=v;
    });
    return out;
  }
  function rowFromData(table,id,data,parent){
    data=deepClone(data||{}); if(!data.id)data.id=id;
    var row={id:String(id), payload:data};
    var userKey=data.userKey||data.user_key||(data.user&&data.user.userKey)||'';
    if(userKey) row.user_key=String(userKey);
    if(data.name || (data.user&&data.user.name)) row.name=String(data.name||(data.user&&data.user.name)||'');
    if(data.seflik || (data.user&&data.user.seflik)) row.seflik=String(data.seflik||(data.user&&data.user.seflik)||'');
    if(data.bolmeNo || (data.user&&data.user.bolmeNo)) row.bolme_no=String(data.bolmeNo||(data.user&&data.user.bolmeNo)||'');
    if(data.status) row.status=String(data.status);
    if(data.createdAtMs||data.atMs) row.created_at_ms=Number(data.createdAtMs||data.atMs||0)||null;
    if(data.updatedAtMs||data.lastSeenMs||data.lastLoginMs) row.updated_at_ms=Number(data.updatedAtMs||data.lastSeenMs||data.lastLoginMs||0)||null;
    if(table==='backup_chunks'){
      row.backup_id=String(parent&&parent.id||data.backupId||'');
      row.chunk_index=Number(data.index||data.chunkIndex||0)||0;
      row.records=Array.isArray(data.records)?data.records:[];
    }
    return row;
  }
  function dataFromRow(row){
    row=row||{};
    var d=deepClone(row.payload||{});
    if(row.id && !d.id)d.id=row.id;
    if(row.user_key && !d.userKey)d.userKey=row.user_key;
    if(row.name && !d.name)d.name=row.name;
    if(row.seflik && !d.seflik)d.seflik=row.seflik;
    if(row.bolme_no && !d.bolmeNo)d.bolmeNo=row.bolme_no;
    if(row.status && !d.status)d.status=row.status;
    if(row.created_at_ms && !d.createdAtMs)d.createdAtMs=row.created_at_ms;
    if(row.updated_at_ms && !d.updatedAtMs)d.updatedAtMs=row.updated_at_ms;
    if(Array.isArray(row.records) && !Array.isArray(d.records)) d.records=row.records;
    if(row.chunk_index!=null && d.index==null)d.index=row.chunk_index;
    return d;
  }
  function DocSnap(id,row){this.id=String(id);this.exists=!!row;this._row=row||null;}
  DocSnap.prototype.data=function(){return dataFromRow(this._row||{});};
  function QuerySnap(rows){this.docs=(rows||[]).map(function(r){return new DocSnap(r.id,r);});}
  QuerySnap.prototype.forEach=function(fn){this.docs.forEach(fn);};
  Object.defineProperty(QuerySnap.prototype,'empty',{get:function(){return !this.docs.length;}});
  Object.defineProperty(QuerySnap.prototype,'size',{get:function(){return this.docs.length;}});

  function request(table,qs,opts){
    var c=cfg();
    var url=c.url+'/rest/v1/'+table+(qs?('?'+qs):'');
    var headers=Object.assign({apikey:c.anonKey,Authorization:'Bearer '+c.anonKey,Accept:'application/json'},(opts&&opts.headers)||{});
    if(opts&&opts.body!=null) headers['Content-Type']='application/json';
    return fetch(url,Object.assign({},opts||{},{headers:headers})).then(async function(r){
      var text=await r.text(); var json=null; try{json=text?JSON.parse(text):null;}catch(e){json=text;}
      if(!r.ok){var msg=(json&&json.message)||String(json||r.statusText||'Supabase hata');throw new Error(msg);}
      return json;
    });
  }
  function upsert(table,row){
    return request(table,'on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(row)}).then(function(r){return Array.isArray(r)?r[0]:r;});
  }
  function getById(table,id){return request(table,'id=eq.'+enc(id)+'&select=*&limit=1',{method:'GET'}).then(function(arr){return (arr||[])[0]||null;});}
  function deleteById(table,id){return request(table,'id=eq.'+enc(id),{method:'DELETE',headers:{Prefer:'return=minimal'}});}

  function DocumentRef(table,id,parent){this.table=table;this.id=String(id);this.parent=parent||null;}
  DocumentRef.prototype.get=function(){var self=this;return getById(this.table,this._rowId()).then(function(r){return new DocSnap(self.id,r);});};
  DocumentRef.prototype._rowId=function(){return this.table==='backup_chunks'&&this.parent ? String(this.parent.id)+'_'+String(this.id) : String(this.id);};
  DocumentRef.prototype.set=async function(data,opt){
    var rowId=this._rowId(), finalData=deepClone(data||{});
    if(opt&&opt.merge){try{var old=await getById(this.table,rowId);finalData=mergeData(dataFromRow(old||{}),finalData);}catch(e){}}
    var row=rowFromData(this.table,rowId,finalData,this.parent);
    await upsert(this.table,row);
  };
  DocumentRef.prototype.delete=function(){return deleteById(this.table,this._rowId());};
  DocumentRef.prototype.collection=function(name){return new CollectionRef(name,this);};

  function CollectionRef(name,parent){this.name=name;this.table=parent&&name==='chunks'?'backup_chunks':colTable(name);this.parent=parent||null;this._filters=[];this._order=null;this._limit=0;}
  CollectionRef.prototype.doc=function(id){return new DocumentRef(this.table,id||('doc_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)),this.parent);};
  CollectionRef.prototype.add=function(data){var id='auto_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);var ref=this.doc(id);return ref.set(data||{}).then(function(){return ref;});};
  CollectionRef.prototype.where=function(field,op,value){var q=new CollectionRef(this.name,this.parent);q.table=this.table;q._filters=(this._filters||[]).concat([{field:field,op:op,value:value}]);q._order=this._order;q._limit=this._limit;return q;};
  CollectionRef.prototype.orderBy=function(field,dir){var q=new CollectionRef(this.name,this.parent);q.table=this.table;q._filters=(this._filters||[]).slice();q._order={field:field,dir:dir||'asc'};q._limit=this._limit;return q;};
  CollectionRef.prototype.limit=function(n){var q=new CollectionRef(this.name,this.parent);q.table=this.table;q._filters=(this._filters||[]).slice();q._order=this._order;q._limit=Number(n||0);return q;};
  CollectionRef.prototype.get=async function(){
    var qs=['select=*'];
    if(this.parent&&this.table==='backup_chunks') qs.push('backup_id=eq.'+enc(this.parent.id));
    var localFilters=[];
    (this._filters||[]).forEach(function(f){var col=fieldColumn(f.field); if(f.op==='==' && col){qs.push(col+'=eq.'+enc(f.value));} else localFilters.push(f);});
    if(this._order){var col=fieldColumn(this._order.field); if(col) qs.push('order='+col+'.'+(String(this._order.dir).toLowerCase()==='desc'?'desc':'asc'));}
    if(this._limit) qs.push('limit='+this._limit);
    var rows=await request(this.table,qs.join('&'),{method:'GET'}); rows=rows||[];
    if(localFilters.length){rows=rows.filter(function(r){var d=dataFromRow(r);return localFilters.every(function(f){return f.op==='=='?String(d[f.field])===String(f.value):true;});});}
    if(this._order && !fieldColumn(this._order.field)){var field=this._order.field,dir=String(this._order.dir).toLowerCase()==='desc'?-1:1;rows.sort(function(a,b){var da=dataFromRow(a),db=dataFromRow(b);return (Number(da[field]||0)-Number(db[field]||0))*dir;});}
    if(this._limit && rows.length>this._limit) rows=rows.slice(0,this._limit);
    return new QuerySnap(rows);
  };

  function Db(){}
  Db.prototype.collection=function(name){return new CollectionRef(name,null);};
  Db.prototype.batch=function(){var ops=[];return{set:function(ref,data,opt){ops.push(function(){return ref.set(data,opt);});},delete:function(ref){ops.push(function(){return ref.delete();});},commit:function(){return Promise.all(ops.map(function(fn){return fn();}));}};};
  Db.prototype.settings=function(){};
  Db.prototype.enableNetwork=function(){return Promise.resolve();};
  Db.prototype.disableNetwork=function(){return Promise.resolve();};

  function installSupabaseCompat(db){
    if(!window.firebase){window.firebase={apps:[{}]};}
    window.firebase.apps=window.firebase.apps&&window.firebase.apps.length?window.firebase.apps:[{}];
    window.firebase.initializeApp=function(){if(!window.firebase.apps.length)window.firebase.apps.push({});return window.firebase.apps[0];};
    window.firebase.auth=function(){return{currentUser:{uid:'supabase-anon'},signInAnonymously:function(){return Promise.resolve({user:{uid:'supabase-anon'}});}};};
    var fs=function(){return db;};
    fs.FieldValue={increment:function(n){return {__mesahaIncrement:true,n:Number(n||0)};}};
    window.firebase.firestore=fs;
  }

  async function ready(){
    if(!readyPromise){readyPromise=(async function(){
      var c=cfg();
      supabaseApi={url:c.url, anonKey:c.anonKey};
      var db=new Db();
      installSupabaseCompat(db);
      lastOkMs=Date.now(); lastError='';
      return {db:db, auth:{currentUser:{uid:'supabase-anon'}}, supabase:supabaseApi};
    })();}
    try{return await readyPromise;}catch(e){readyPromise=null;lastError=e&&e.message?e.message:String(e||'Supabase hata');throw e;}
  }
  async function health(){var r=await ready();await r.db.collection('healthChecks').doc('client').set({ok:true,atMs:Date.now(),appVersion:(window.APP_VERSION||'V4.12'),source:'supabase'},{merge:true});lastOkMs=Date.now();lastError='';return r;}
  function reset(){readyPromise=null;lastError='';}
  function status(){return{ok:!!lastOkMs,lastOkMs:lastOkMs,lastError:lastError,online:navigator.onLine!==false,provider:'supabase',version:VERSION};}

  var api={provider:'supabase',version:VERSION,ready:ready,health:health,reset:reset,status:status,withTimeout:function(p,ms,label){return Promise.race([p,new Promise(function(_,rej){setTimeout(function(){rej(new Error((label||'İşlem')+' zaman aşımı'));},ms||15000);})]);}};
  window.mesahaSupabase=api; window.mesahaSupabaseV383=api; window.mesahaSupabaseV380=api; window.mesahaCloud=api; window.mesahaSupabase=api;
})();
