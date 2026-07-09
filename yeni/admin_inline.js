



(function(){'use strict';
const ADMIN_PANEL_VERSION='Admin V5.34';
const ADMIN_NAMES=['yakupduzgun','yakup','bushidoot'];
const ADMIN_PASS=['yaylacık_43','yaylacik_43','yaylacık','yaylacik'];
const SESSION_KEY='mesaha_yonetim_login_v534';
const ADMIN_KEY_STORE='mesaha_admin_guard_key_v505';
const GUARD_FUNCTION_URL='https://swrbpdpotmirnmtqnuba.supabase.co/functions/v1/smooth-function';
const DRIVE_BRIDGE_URL='https://script.google.com/macros/s/AKfycbzOYh2MyOQmwVQh-7Jm9KyjaFjmjSwgHZSw7XKAVzDS1ibmcM5bQZVYdn-NyesI-ph7/exec';
const DRIVE_SECRET='MESAHAYEDEK_2026_YAKUP_43';
const $=id=>document.getElementById(id);const state={users:[],backups:[],events:[],blocks:[],sources:{},errors:{},lastSync:0};window.MESAHA_ADMIN_STATE=state;
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}function clean(v){return String(v==null?'':v).trim()}function n(v){const x=Number(v||0);return Number.isFinite(x)?x:0}function int(v){return Math.round(n(v)).toLocaleString('tr-TR')}function m3(v){return n(v).toLocaleString('tr-TR',{minimumFractionDigits:3,maximumFractionDigits:3})}function dateMs(v){if(typeof v==='number')return v;const ms=Date.parse(String(v||''));return Number.isFinite(ms)?ms:0}function fmt(ms,txt){ms=n(ms)||dateMs(txt);return ms?new Date(ms).toLocaleString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):(txt||'-')}function todayStart(){const d=new Date();d.setHours(0,0,0,0);return d.getTime()}function ago(ms){ms=n(ms);if(!ms)return '-';const m=Math.round(Math.max(0,Date.now()-ms)/60000);if(m<1)return 'şimdi';if(m<60)return m+' dk önce';const h=Math.round(m/60);return h<24?h+' sa önce':Math.round(h/24)+' gün önce'}function appVersion(){return (window.MESAHA_VERSION&&window.MESAHA_VERSION.shortVersion)||'V5.29 •ExelanceX•'}function toast(msg){const el=$('toast');el.textContent=String(msg||'');el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),3000)}function errText(e){return ((e&&e.message)||String(e||'Hata')).slice(0,160)}function downloadJson(name,data){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}function norm(v){return clean(v).toLocaleLowerCase('tr-TR').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'')}function initials(name){return clean(name).split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?'}function userKey(name,seflik){return (clean(name)+'__'+clean(seflik)).toLocaleLowerCase('tr-TR')}function userKeyOf(u){return clean(u&& (u.userKey||u.user_key||u.id)) || userKey(u&&u.name,u&&u.seflik)}function oldVer(v){const s=String(v||'');let m=s.match(/V?(\d+)\.(\d+)/i);if(m)return Number(m[1]+String(m[2]).padStart(2,'0'));m=s.match(/v(\d{3})/i);return m?Number(m[1]):0}function isOld(u){const latest=Number((window.MESAHA_VERSION&&window.MESAHA_VERSION.build)||529);const b=oldVer(u.appVersion||u.fileVersion);return b&&b<latest}
async function ready(){if(window.mesahaSupabaseV380&&window.mesahaSupabaseV380.ready)return await window.mesahaSupabaseV380.ready();if(window.mesahaSupabase&&window.mesahaSupabase.ready)return await window.mesahaSupabase.ready();throw new Error('Supabase bağlantısı yok')}function readToken(){try{return clean(JSON.parse(localStorage.getItem('mesaha_supabase_v500_session')||'{}').access_token)}catch(e){return ''}}function adminKey(){let k=clean(localStorage.getItem(ADMIN_KEY_STORE)||'');if(!k){k=clean(prompt('Yönetim anahtarını giriniz')||'');if(k)localStorage.setItem(ADMIN_KEY_STORE,k)}return k}async function guardCall(action,data){const k=adminKey();if(!k)throw new Error('Yönetim anahtarı gerekli');const cfg=window.MESAHA_SUPABASE_CONFIG||{};const r=await fetch(GUARD_FUNCTION_URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+readToken(),'apikey':clean(cfg.anonKey||cfg.anon_key||'')},body:JSON.stringify(Object.assign({action,admin_key:k},data||{})),cache:'no-store'});const t=await r.text();let j={};try{j=t?JSON.parse(t):{}}catch(e){throw new Error('Edge cevabı okunamadı')}if(!r.ok||!j.ok)throw new Error(j.error||j.reason||('Edge hata '+r.status));return j}async function getColSafe(db,name){try{const s=await db.collection(name).get({source:'server'}).catch(()=>db.collection(name).get());const a=[];s.forEach(d=>a.push(Object.assign({id:d.id},d.data()||{})));return a}catch(e){state.errors[name]=errText(e);return []}}async function bridgePost(action,data){const r=await fetch(DRIVE_BRIDGE_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({secret:DRIVE_SECRET,action},data||{})),cache:'no-store'});const t=await r.text();let j={};try{j=JSON.parse(t)}catch(e){throw new Error('Drive cevabı okunamadı')}if(!r.ok||!j.ok)throw new Error(j.error||'Drive hata');return j}
function first(){for(let i=0;i<arguments.length;i++){const v=arguments[i];if(v!=null&&String(v).trim()!=='')return v}return ''}

function statsRangeV531(){return window.MESAHA_STATS_RANGE_V531||'all'}
function setStatsRangeV531(v){window.MESAHA_STATS_RANGE_V531=v||'all'}
function rangeStartV531(){
  const r=statsRangeV531(),d=new Date();
  if(r==='day'){d.setHours(0,0,0,0);return d.getTime()}
  if(r==='week'){const day=(d.getDay()+6)%7;d.setHours(0,0,0,0);d.setDate(d.getDate()-day);return d.getTime()}
  if(r==='month'){d.setHours(0,0,0,0);d.setDate(1);return d.getTime()}
  return 0
}
function inRangeV531(ms){const s=rangeStartV531();return !s || n(ms)>=s}
function rawDateMsV531(x){return dateMs(first(x&&x.createdAt,x&&x.created_at,x&&x.modifiedTime,x&&x.updatedAt,x&&x.updated_at,x&&x.time,x&&x.tarih,x&&x.date))}
function detectPlatformV531(v){
  const s=JSON.stringify(v||{}).toLocaleLowerCase('tr-TR');
  if(/iphone|ipad|ipod|ios|cpu os|mobile\/.*safari/.test(s))return 'iOS';
  if(/android|linux; android|wv\)|xiaomi|redmi|samsung|huawei|oppo|vivo|realme|tecno|infinix/.test(s))return 'Android';
  if(/windows/.test(s))return 'Windows';
  if(/mac os|macintosh|darwin/.test(s))return 'Mac';
  if(/linux/.test(s))return 'Android olabilir';
  return 'Bilinmiyor'
}
function detectBrowserV531(v){
  const s=JSON.stringify(v||{}).toLocaleLowerCase('tr-TR');
  if(/samsungbrowser/.test(s))return 'Samsung Internet';
  if(/edg\//.test(s)||/edge/.test(s))return 'Edge';
  if(/opr\//.test(s)||/opera/.test(s))return 'Opera';
  if(/crios|chrome|chromium/.test(s))return 'Chrome';
  if(/firefox|fxios/.test(s))return 'Firefox';
  if(/safari/.test(s))return 'Safari';
  return 'Bilinmiyor'
}
function deviceSummaryV531(v){return {platform:detectPlatformV531(v),browser:detectBrowserV531(v)}}


function normalizeTotalsV534(obj){
  if(!obj)return {};
  if(typeof obj==='string'){
    try{obj=JSON.parse(obj)}catch(e){return {}}
  }
  if(Array.isArray(obj)){
    const out={};
    obj.forEach(function(x){if(!x||typeof x!=='object')return;const name=clean(first(x.name,x.label,x.type,x.tree,x.treeType,x.product,x.productType,x.agac,x.agacTuru,x.odun,x.odunTuru,'Belirsiz'));const val=Number(first(x.m3,x.hacim,x.volume,x.totalM3,x.value,0))||0;out[name]=(out[name]||0)+val});
    return out;
  }
  return (typeof obj==='object')?obj:{};
}
function totalsToRowsV534(obj){
  obj=normalizeTotalsV534(obj);const out=[];
  Object.keys(obj||{}).forEach(function(k){
    const v=obj[k];let adet=0,m3v=0;
    if(v&&typeof v==='object'){adet=Number(first(v.adet,v.count,v.recordCount,v.totalRecords,0))||0;m3v=Number(first(v.m3,v.hacim,v.volume,v.totalM3,v.value,0))||0}
    else {m3v=Number(v)||0}
    if(k&&String(k).trim()&& (adet||m3v)) out.push({name:k,adet:adet,metre:0,m3:m3v});
  });
  return out;
}
function userSummaryTreeRowsV534(u){
  let rows=summaryObjRowsV532(u&&u.treeTotals);
  userBackups(userKeyOf(u||{})).forEach(function(b){rows=mergeRowsV532(rows,summaryObjRowsV532(b.treeTotals))});
  return rows;
}
function userSummaryWoodRowsV534(u){
  let rows=summaryObjRowsV532(u&&u.productTotals);
  userBackups(userKeyOf(u||{})).forEach(function(b){rows=mergeRowsV532(rows,summaryObjRowsV532(b.productTotals))});
  return rows;
}

function summaryObjRowsV532(obj){
  return totalsToRowsV534(obj);
}
function mergeRowsV532(a,b){
  const map={};
  (a||[]).concat(b||[]).forEach(r=>{const k=r.name||'Belirsiz';if(!map[k])map[k]={name:k,adet:0,metre:0,m3:0};map[k].adet+=n(r.adet);map[k].metre+=n(r.metre);map[k].m3+=n(r.m3)});
  return Object.values(map).sort((x,y)=>n(y.adet)-n(x.adet)||n(y.m3)-n(x.m3));
}
function userTreeRowsV532(u,records){const sum=userSummaryTreeRowsV534(u);return sum.length?sum:(records&&records.length?aggregateRecordsV530(records,recordTreeV530):[])}
function userWoodRowsV532(u,records){const sum=userSummaryWoodRowsV534(u);return sum.length?sum:(records&&records.length?aggregateRecordsV530(records,recordWoodV530):[])}
function allTreeRowsV532(records){let rows=[];state.users.forEach(u=>{rows=mergeRowsV532(rows,userSummaryTreeRowsV534(u))}); if(rows.length)return rows; return aggregateRecordsV530(records,recordTreeV530)}
function allWoodRowsV532(records){let rows=[];state.users.forEach(u=>{rows=mergeRowsV532(rows,userSummaryWoodRowsV534(u))}); if(rows.length)return rows; return aggregateRecordsV530(records,recordWoodV530)}
function findUserFlexibleV532(k,name,seflik,index){
  let u=findUser(k); if(u)return u;
  const ix=Number(index); if(Number.isFinite(ix)&&state.users[ix])return state.users[ix];
  const nn=compact(name),ss=compact(seflik);
  if(nn&&ss){u=state.users.find(x=>compact(x.name)===nn&&compact(x.seflik)===ss);if(u)return u}
  if(nn){const hits=state.users.filter(x=>compact(x.name)===nn);if(hits.length===1)return hits[0]}
  const ck=compact(k);
  return state.users.find(x=>[x.name,x.seflik,userKeyOf(x),x.deviceId,x.id,x.userKey].some(v=>{const cv=compact(v);return cv&&ck&&(cv===ck||cv.includes(ck)||ck.includes(cv))}))||null;
}
function allPossibleUserKeysV531(u){const arr=[userKeyOf(u),u&&u.userKey,u&&u.id,userKey(u&&u.name,u&&u.seflik),compact(u&&u.name)+'__'+compact(u&&u.seflik)].filter(Boolean);return Array.from(new Set(arr.map(clean)))}
function sameUserKeyV531(a,b){a=clean(a);b=clean(b);return a&&b&&(a===b||compact(a)===compact(b))}
function backupDateInRangeV531(b){return inRangeV531(n(b&&b.createdAtMs)||rawDateMsV531(b&&b.raw))}

function walkRecordsV530(obj,out,depth){
  out=out||[]; depth=depth||0;
  if(!obj||depth>5||out.length>25000)return out;
  if(Array.isArray(obj)){
    if(obj.length&&obj.some(x=>x&&typeof x==='object'&&isRecordLikeV530(x))){
      obj.forEach(x=>{if(x&&typeof x==='object'&&isRecordLikeV530(x))out.push(x)})
    }else obj.forEach(x=>walkRecordsV530(x,out,depth+1));
  }else if(typeof obj==='object'){
    ['records','kayitlar','kayıtlar','olcumler','ölçümler','measurements','data','items','entries','logs','rows'].forEach(k=>{if(obj[k])walkRecordsV530(obj[k],out,depth+1)});
    if(depth<2) Object.keys(obj).slice(0,80).forEach(k=>{if(!/^(records|kayitlar|kayıtlar|olcumler|ölçümler|measurements|data|items|entries|logs|rows)$/.test(k))walkRecordsV530(obj[k],out,depth+1)});
  }
  return out;
}
function isRecordLikeV530(r){
  const keys=Object.keys(r||{}).join(' ').toLocaleLowerCase('tr-TR');
  return /barkod|çap|cap|boy|hacim|m3|agac|ağaç|odun|emval|tomruk|maden|kağıt|kagit|sanayi|tel/.test(keys);
}
function extractRecordsV530(obj){try{return walkRecordsV530(obj,[],0)}catch(e){return []}}
function recFieldV530(r,names){
  for(const k of Object.keys(r||{})){
    const nk=norm(k);
    for(const nm of names){if(nk===norm(nm)||nk.includes(norm(nm)))return r[k]}
  }
  return ''
}
function recordTreeV530(r){return clean(first(recFieldV530(r,['ağaç türü','agac türü','agacTuru','agac_turu','tree','tur','tür','cins']), r.agacTuru, r.agac, r.treeType))||'Belirsiz'}
function recordWoodV530(r){return clean(first(recFieldV530(r,['odun türü','odunTuru','odun_turu','emval','emvalTuru','urunTuru','ürün türü','sinif','sınıf']), r.odunTuru, r.emvalTuru, r.emval, r.urunTuru))||'Belirsiz'}
function recordMetersV530(r){return Number(String(first(recFieldV530(r,['metre','boy','uzunluk','length']), r.metre, r.boy, r.length)||0).replace(',','.'))||0}
function recordM3V530(r){return Number(String(first(recFieldV530(r,['hacim','m3','metreküp','m³','volume']), r.hacim, r.m3, r.volume)||0).replace(',','.'))||0}
function recordAdetV530(r){return Number(String(first(recFieldV530(r,['adet','count','sayi','sayı']), r.adet, r.count)||1).replace(',','.'))||1}
function backupRecordsV530(b){return (b&&b.records&&b.records.length)?b.records:extractRecordsV530(b&&b.raw)}
function userRecordsV530(k){
  let arr=[]; userBackups(k).filter(backupDateInRangeV531).forEach(b=>arr=arr.concat(backupRecordsV530(b)));
  return arr;
}
function aggregateRecordsV530(records,groupFn){
  const map={};
  (records||[]).forEach(r=>{
    const key=groupFn(r)||'Belirsiz';
    if(!map[key])map[key]={name:key,adet:0,metre:0,m3:0};
    map[key].adet+=recordAdetV530(r);
    map[key].metre+=recordMetersV530(r);
    map[key].m3+=recordM3V530(r);
  });
  return Object.values(map).sort((a,b)=>b.adet-a.adet||b.m3-a.m3);
}
function allRecordsV530(){let arr=[];state.backups.filter(backupDateInRangeV531).forEach(b=>arr=arr.concat(backupRecordsV530(b)));return arr}
function statRowsHtmlV530(rows){
  if(!rows||!rows.length)return '<div class="stats-empty-v530">Bu filtrede detaylı ağaç/odun verisi bulunamadı. Kullanıcının Drive yedeği içeriğinde kayıt detayı varsa otomatik ayrılır.</div>';
  return '<div class="stats-table-v530"><div class="stats-row-v530 head"><b>Tür</b><span>Adet</span><span>m³</span></div>'+rows.map(r=>`<div class="stats-row-v530"><b>${esc(r.name)}</b><span data-label="Adet">${n(r.adet)?int(r.adet):'—'}</span><span data-label="m³">${m3(r.m3)}</span></div>`).join('')+'</div>'
}
function userEmvalSummaryV530(u){
  const k=userKeyOf(u),records=userRecordsV530(k),backups=userBackups(k).filter(backupDateInRangeV531);
  let adet=0,metre=0,m3sum=0;
  if(records.length){records.forEach(r=>{adet+=recordAdetV530(r);metre+=recordMetersV530(r);m3sum+=recordM3V530(r)})}
  else {adet=n(u.recordCount)||backups.reduce((a,b)=>a+n(b.recordCount),0);m3sum=n(u.m3)||backups.reduce((a,b)=>a+n(b.m3),0)}
  return {adet,metre,m3:m3sum,records:records.length,backups:backups.length}
}
function userEventsV530(k){
  return (state.events||[]).filter(e=>clean(e.user_key||e.userKey).toLocaleLowerCase('tr-TR')===clean(k).toLocaleLowerCase('tr-TR')||userKey(eventUser(e),eventSeflik(e))===k).sort((a,b)=>eventTimeMs(b)-eventTimeMs(a));
}
function userDeviceListV530(u,k){
  const list=[];
  function labelUnknown(v){return v&&v!=='Bilinmiyor'?v:'Bilinmiyor - kullanıcı uygulamayı V5.33 ile açınca dolacak'}
  function add(device,ip,version,time,source,raw){
    device=clean(device);ip=clean(ip);version=clean(version);raw=raw||{};
    if(!device&&!ip&&!version&&!raw)return;
    const ds=deviceSummaryV531(Object.assign({},raw,{device,ip,version,lastDevice:first(raw.lastDevice,u&&u.lastDevice),userAgent:first(raw.userAgent,raw.ua,u&&u.userAgent,raw.lastDevice,u&&u.lastDevice),platform:first(raw.platform,raw.os,u&&u.platform,raw.deviceType,u&&u.deviceType),browser:first(raw.browser,u&&u.browser)}));
    const platform=labelUnknown(ds.platform),browser=labelUnknown(ds.browser);
    const key=[device,ip,version,platform,browser].join('|');
    if(!list.some(x=>x.key===key))list.push({key,device,ip,version,time,source,platform,browser,unknown:/Bilinmiyor/.test(platform+' '+browser)})
  }
  add(u.deviceId,u.ip,u.appVersion||u.fileVersion,u.lastSeen,'Kullanıcı profili',Object.assign({},u.raw||{},u.deviceInfo||{},u));
  userEventsV530(k).forEach(e=>add(e.device_id,e.ip_address,e.app_version,e.created_at,'IP kaydı',e.raw_payload||e.metadata||e));
  userBackups(k).forEach(b=>add(first(b.deviceId,b.raw&&b.raw.deviceId,b.raw&&b.raw.device_id,b.raw&&b.raw.installId),first(b.ip,b.raw&&b.raw.ip,b.raw&&b.raw.ip_address),b.appVersion,b.createdAt,'Drive yedeği',b.raw||b));
  return list;
}

function mapProfile(r){r=r||{};const p=r.payload||{},d=r.device_info||r.deviceInfo||p.deviceInfo||p.lastDeviceInfo||{};const name=clean(first(r.name,r.user_name,p.name,p.userName,p.user&&p.user.name));const seflik=clean(first(r.seflik,r.seflik_name,p.seflik,p.user&&p.user.seflik));const ms=dateMs(first(r.updated_at,r.last_seen_at,p.updatedAt,p.lastSeen,r.created_at))||0;return {id:first(r.user_key,r.user_id,r.id,userKey(name,seflik)),userKey:first(r.user_key,p.userKey,userKey(name,seflik)),name:name||'Kullanıcı',seflik,bolmeNo:first(r.bolme_no,p.bolmeNo),appVersion:first(r.app_version,p.appVersion,p.version),fileVersion:first(r.file_version,p.fileVersion),deviceId:first(r.device_id,r.deviceId,p.deviceId,p.installId,d.deviceId,d.installId,d.id),ip:first(r.ip_address,r.ip,p.ip,p.ipAddress,d.ip,d.ipAddress),lastSeen:first(r.updated_at,r.last_seen_at,p.lastSeen,p.updatedAt),lastSeenMs:ms,recordCount:Number(first(r.record_count,p.recordCount,p.totalRecords,0))||0,m3:Number(first(r.total_volume,p.m3,p.totalM3,0))||0,treeTotals:normalizeTotalsV534(first(r.treeTotals,r.tree_totals,r.agacTotals,r.agac_totals,p.treeTotals,p.tree_totals,p.agacTotals,p.agac_totals,{})),productTotals:normalizeTotalsV534(first(r.productTotals,r.product_totals,r.odunTotals,r.odun_totals,p.productTotals,p.product_totals,p.odunTotals,p.odun_totals,{})),deviceInfo:d,lastDevice:first(p.lastDevice,r.lastDevice,d.model,d.platform,d.os,d.userAgent),platform:first(r.platform,r.os,p.platform,p.os,d.platform,d.os),browser:first(r.browser,p.browser,d.browser,d.browserName),userAgent:first(r.userAgent,p.userAgent,d.userAgent,d.ua),raw:r,source:'user'}}function mapUsage(r){r=r||{};const p=r.payload||r,d=p.lastDeviceInfo||p.deviceInfo||{};return mapProfile(Object.assign({},r,{payload:p,device_info:d,name:first(p.name,p.userName,r.name),seflik:first(p.seflik,r.seflik),updated_at:first(r.updated_at,p.lastSeen,p.updatedAt),app_version:first(r.app_version,p.appVersion,p.version),device_id:first(p.deviceId,d.deviceId,p.installId,d.installId),ip_address:first(p.ip,p.ipAddress,d.ip)}))}function mapDriveBackup(x){const name=clean(x.username||x.name||'');const seflik=clean(x.seflik||'');return {id:'drive_'+x.id,driveFileId:x.id,source:'google-drive',fileName:x.name||'Drive yedeği',name,seflik,userKey:x.userKey||userKey(name,seflik),bolmeNo:x.bolme||x.slot||'',recordCount:Number(x.count||x.recordCount||0)||0,m3:Number(x.totalVolume||x.m3||0)||0,createdAt:x.createdAt||x.modifiedTime||'',createdAtMs:dateMs(x.createdAt||x.modifiedTime)||0,appVersion:x.version||'',driveLink:'https://drive.google.com/file/d/'+encodeURIComponent(x.id)+'/view',records:extractRecordsV530(x),treeTotals:first(x.treeTotals,x.agacTotals,x.ağaçTotals,{}),productTotals:first(x.productTotals,x.odunTotals,x.emvalTotals,{}),platform:first(x.platform,x.os,x.devicePlatform,x.device&&x.device.platform),browser:first(x.browser,x.deviceBrowser,x.device&&x.device.browser),deviceId:first(x.deviceId,x.device_id,x.installId,x.device&&x.device.deviceId),ip:first(x.ip,x.ip_address,x.ipAddress),raw:x}}function mapEvent(x){x=x||{};const p=x.payload||x.meta||{};return Object.assign({},x,{ip_address:clean(first(x.ip_address,x.ipAddress,x.ip,p.ip_address,p.ip)),device_id:clean(first(x.device_id,x.deviceId,x.install_id,x.installId,p.device_id,p.deviceId,p.installId)),user_key:clean(first(x.user_key,x.userKey,x.user_id,p.user_key,p.userKey)),name:clean(first(x.name,x.user_name,x.username,p.name,p.userName)),seflik:clean(first(x.seflik,x.seflik_name,p.seflik)),app_version:clean(first(x.app_version,x.appVersion,x.version,p.appVersion,p.version)),created_at:first(x.created_at,x.createdAt,x.time,p.createdAt),blocked:x.blocked===true||x.allowed===false||/block|ban/i.test(String(x.event_type||''))})}
function mergeUsers(items){const m=new Map();(items||[]).forEach(u=>{const k=userKeyOf(u);if(!k)return;const old=m.get(k)||{};const out=Object.assign({},old);['id','userKey','name','seflik','bolmeNo'].forEach(x=>{if(!out[x]&&u[x])out[x]=u[x]});if(n(u.lastSeenMs)>=n(out.lastSeenMs)){['appVersion','fileVersion','deviceId','ip','lastSeen','lastSeenMs'].forEach(x=>{if(u[x])out[x]=u[x]})}out.recordCount=Math.max(n(out.recordCount),n(u.recordCount));out.m3=Math.max(n(out.m3),n(u.m3));m.set(k,out)});return [...m.values()].sort((a,b)=>n(b.lastSeenMs)-n(a.lastSeenMs))}function userBackups(k){const kk=clean(k);return state.backups.filter(b=>{const keys=[userKeyOf(b),b.userKey,b.id,userKey(b.name,b.seflik),compact(b.name)+'__'+compact(b.seflik)].filter(Boolean);return keys.some(x=>sameUserKeyV531(x,kk))})}function activeToday(){const s=todayStart();return state.users.filter(u=>n(u.lastSeenMs)>=s).length}function activeNow(){return state.users.filter(u=>n(u.lastSeenMs)>=Date.now()-15*60000).length}function driveVolume(){return state.backups.reduce((a,b)=>a+n(b.m3),0)}function noBackupUsers(){return state.users.filter(u=>!userBackups(userKeyOf(u)).length)}function oldUsers(){return state.users.filter(isOld)}function isAdminEvent(e){const t=clean(e&&e.event_type).toLowerCase();const raw=clean(e&&e.user_key);return /^admin|system|panel/.test(t)||/add_block|remove_block|block/.test(t)||(!clean(e.name)&&!clean(e.seflik)&&!clean(e.device_id)&&raw.length>20)}function compact(v){return norm(v)}function findUserForEvent(e){const raw=clean(e.user_key).toLocaleLowerCase('tr-TR'),dev=compact(e.device_id),name=compact(e.name),sef=compact(e.seflik);for(const u of state.users){if(raw&&(userKeyOf(u).toLocaleLowerCase('tr-TR')===raw||compact(userKeyOf(u))===compact(raw)))return u;if(dev&&compact(u.deviceId)===dev)return u;if(name&&sef&&compact(u.name)===name&&compact(u.seflik)===sef)return u}return null}function eventUser(e){if(isAdminEvent(e))return 'Admin / Sistem Kaydı';const u=findUserForEvent(e);return clean(e.name)||clean(u&&u.name)||'Tanımsız kullanıcı'}function eventSeflik(e){if(isAdminEvent(e))return 'Panel';const u=findUserForEvent(e);return clean(e.seflik)||clean(u&&u.seflik)||'—'}function eventTime(e){return dateMs(e.created_at)||n(e.createdAtMs)||0}function synthEvents(){const out=[];state.users.forEach(u=>{out.push(mapEvent({event_type:'user_sync',synthetic:true,created_at:new Date(n(u.lastSeenMs)||Date.now()).toISOString(),ip_address:u.ip||'',device_id:u.deviceId||'',user_key:userKeyOf(u),name:u.name,seflik:u.seflik,app_version:u.appVersion||u.fileVersion}))});state.backups.forEach(b=>{out.push(mapEvent({event_type:'drive_backup_sync',synthetic:true,created_at:new Date(n(b.createdAtMs)||Date.now()).toISOString(),ip_address:'',device_id:'',user_key:userKeyOf(b),name:b.name,seflik:b.seflik,app_version:b.appVersion}))});return out}function mergedEvents(edge){const seen=new Set(),out=[];[...(edge||[]),...synthEvents()].forEach(e=>{const key=[e.event_type,e.user_key,e.device_id,e.ip_address,e.created_at].join('|').toLowerCase();if(!seen.has(key)){seen.add(key);out.push(e)}});return out.sort((a,b)=>eventTime(b)-eventTime(a))}
async function loadDrive(){try{const j=await bridgePost('adminList',{username:'yakupduzgun',seflik:'Yaylacık_43'});state.sources.drive=true;return (j.items||[]).map(mapDriveBackup).filter(b=>b.driveFileId)}catch(e){state.errors.drive=errText(e);return []}}

function mergeByIdV534(arr){
  const m=new Map();(arr||[]).forEach(x=>{if(!x)return;const id=clean(x.id)||clean(x.userKey)+'_'+clean(x.createdAtMs||x.createdAt);if(id&&!m.has(id))m.set(id,x)});return [...m.values()]
}

async function loadAll(){const btn=$('refreshBtn');if(btn)btn.disabled=true;try{state.errors={};state.sources={};let profiles=[],usage=[],edgeEvents=[];try{const g=await guardCall('admin_list_all',{limit:3000});profiles=(g.profiles||g.users||[]).map(mapProfile);usage=(g.usage||[]).map(mapUsage);state.sources.edge=true}catch(e){state.errors.edge=errText(e)}try{const r=await ready(),db=r.db;const arr=await Promise.all([getColSafe(db,'users'),getColSafe(db,'usageStats')]);profiles=profiles.concat(arr[0].map(mapProfile));usage=usage.concat(arr[1].map(mapUsage));state.sources.direct=true}catch(x){state.errors.direct=errText(x)}state.backups=(await loadDrive()).sort((a,b)=>n(b.createdAtMs)-n(a.createdAtMs));state.users=mergeUsers([...profiles,...usage,...state.backups]);try{const ev=await guardCall('admin_list_events',{limit:3000});edgeEvents=(ev.items||[]).map(mapEvent);state.sources.events=true}catch(e){state.errors.events=errText(e)}state.events=mergedEvents(edgeEvents);try{const bl=await guardCall('admin_list_blocks',{});state.blocks=bl.items||[];state.sources.blocks=true}catch(e){state.errors.blocks=errText(e);state.blocks=[]}state.lastSync=Date.now();renderAll();setPills('Veri okundu')}catch(e){toast(errText(e));setPills('Hata: '+errText(e))}finally{if(btn)btn.disabled=false}}
function setPills(txt){$('versionPill').textContent=ADMIN_PANEL_VERSION+' • '+appVersion()+' • '+txt;$('syncPill').textContent='Son senkron: '+(state.lastSync?new Date(state.lastSync).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}):'bekleniyor')+' • Kullanıcı:'+state.users.length+' • Drive:'+state.backups.length}
function renderAll(){renderOverview();renderSecurity();renderUsers();renderStats();renderBackups();renderTools()}function renderOverview(){const blocks=state.blocks.filter(b=>b.active!==false).length;$('sumUsers').textContent=int(state.users.length);$('sumUsersSub').textContent='+'+int(activeToday())+' bugün';$('sumDevices').textContent=int(state.users.filter(u=>u.deviceId).length||state.users.length);$('sumDevicesSub').textContent='● '+int(activeNow())+' çevrimiçi';$('sumBackups').textContent=int(state.backups.length);$('sumBackupsSub').textContent='Sadece Drive';$('sumBlocks').textContent=int(blocks);$('sumBlocksSub').textContent=blocks?'İnceleme gerekli':'Engel yok';const suspicious=state.events.filter(e=>e.blocked&&!isAdminEvent(e)).length;$('threatCount').textContent=int(suspicious)+' tehdit';$('lastScan').textContent=ago(state.lastSync);$('updateState').textContent=oldUsers().length?'Eski Sürüm':'Güncel';$('securityNotice').textContent=suspicious?'Sistemde şüpheli hareket var. Güvenlik sekmesinden incele.':'Sisteminiz güvende. Herhangi bir kritik tehdit tespit edilmedi.';renderEventList($('homeEvents'),getFilteredEvents($('homeIpSearch').value).filter(e=>!isAdminEvent(e)).slice(0,5),true);renderBackupList($('homeBackups'),state.backups.slice(0,1),true)}function getFilteredEvents(q){q=clean(q).toLocaleLowerCase('tr-TR');let arr=state.events.slice().sort((a,b)=>eventTime(b)-eventTime(a));if(!q)return arr;return arr.filter(e=>[eventUser(e),eventSeflik(e),e.ip_address,e.device_id,e.user_key,e.app_version,e.event_type,e.created_at].join(' ').toLocaleLowerCase('tr-TR').includes(q))}function eventGroups(arr){const m={},groups=[],system=[];arr.forEach(e=>{if(isAdminEvent(e)){system.push(e);return}const k=[eventUser(e),eventSeflik(e),e.user_key,e.device_id,e.ip_address].join('|');if(!m[k]){m[k]=[];groups.push(m[k])}m[k].push(e)});groups.forEach(g=>g.sort((a,b)=>eventTime(b)-eventTime(a)));groups.sort((a,b)=>eventTime(b[0])-eventTime(a[0]));system.sort((a,b)=>eventTime(b)-eventTime(a));return{groups,system}}function renderEventList(el,items,compact){const {groups,system}=eventGroups(items);if(!groups.length&&!system.length){el.innerHTML='<div class="empty">Kayıt yok.</div>';return}el.innerHTML=groups.map((g,i)=>eventCard(g,i,compact)).join('')+(compact?'':systemCard(system))}function eventCard(g,i,compact){const e=g[0],u=eventUser(e),s=eventSeflik(e),matched=!!findUserForEvent(e),warn=e.blocked||!matched;return `<div class="ip-row"><div class="ip-main"><span class="dot ${warn?'warn':''}"></span><span class="avatar">${matched?'👤':'?'}</span><div class="ip-info"><h3>${esc(u)} • ${esc(s)} <span class="badge ${warn?'warn':''}">${matched?'Eşleşti':'Şüpheli'}</span></h3><div class="meta">IP: ${esc(e.ip_address||'-')} • Cihaz: ${esc(e.device_id||'-')}<br/>Sürüm: ${esc(e.app_version||'-')} • ${esc(fmt(eventTime(e),e.created_at))}${e.synthetic?' • Senkron':''}</div></div></div><div class="actions">${e.ip_address?`<button class="btn danger" data-ban-ip="${esc(e.ip_address)}" data-user="${esc(e.user_key)}" data-device="${esc(e.device_id)}">IP + Kullanıcı Ban</button>`:''}<button class="btn warn" data-ban-user="${esc(e.user_key)}">Kullanıcıyı Engelle</button><button class="btn soft" data-ban-device="${esc(e.device_id)}">Cihazı Engelle</button><button class="btn soft" data-detail="${i}">Detaylı Kayıtlar</button></div><div class="details" id="detail_${i}">${g.map(x=>`<div class="mini"><small>${esc(x.event_type||'kayıt')}</small><b>${esc(fmt(eventTime(x),x.created_at))}</b><small>IP: ${esc(x.ip_address||'-')} • Cihaz: ${esc(x.device_id||'-')} • Anahtar: ${esc(x.user_key||'-')}</small></div>`).join('')}<pre class="raw">${esc(JSON.stringify(e,null,2))}</pre></div></div>`}function systemCard(sys){if(!sys.length)return'';return `<div class="system-zone"><div class="section-head"><div><h2>Admin / Sistem Kayıtları</h2><p>Kullanıcı girişleriyle karışmaması için ayrı gösterilir.</p></div><span class="pill gray">${int(sys.length)} kayıt</span></div><div class="list">${sys.slice(0,5).map(e=>`<div class="system-row"><span><b>${esc(e.event_type||'sistem')}</b> <small>${esc(e.ip_address||'-')}</small></span><small>${esc(fmt(eventTime(e),e.created_at))}</small></div>`).join('')}</div></div>`}
function renderSecurity(){const q=$('ipSearch').value,filter=$('ipFilter').value;let arr=getFilteredEvents(q);if(filter==='matched')arr=arr.filter(e=>!isAdminEvent(e)&&findUserForEvent(e));if(filter==='unmatched')arr=arr.filter(e=>!isAdminEvent(e)&&!findUserForEvent(e));if(filter==='admin')arr=arr.filter(isAdminEvent);const matched=state.events.filter(e=>!isAdminEvent(e)&&findUserForEvent(e)).length,unmatched=state.events.filter(e=>!isAdminEvent(e)&&!findUserForEvent(e)).length;$('matchUsers').textContent=int(matched);$('unmatchedUsers').textContent=int(unmatched);$('blockedEntries').textContent=int(state.blocks.filter(b=>b.active!==false).length);$('lastEventTime').textContent=state.events[0]?fmt(eventTime(state.events[0]),state.events[0].created_at).split(' ')[1]||'-':'-';$('ipCount').textContent=int(arr.length)+' kayıt';renderEventList($('eventsList'),arr,false);$('blocksList').innerHTML=state.blocks.filter(b=>b.active!==false).length?state.blocks.filter(b=>b.active!==false).map(b=>`<div class="system-row"><span><b>${esc(b.block_type||'engel')}</b><small>${esc(b.block_value||'-')} • ${esc(b.reason||'')}</small></span><button class="btn soft" data-remove-block="${esc(b.id)}">Kaldır</button></div>`).join(''):'<div class="empty">Aktif engel yok.</div>'}
function renderUsers(){let arr=state.users.slice(),q=clean($('userSearch').value).toLocaleLowerCase('tr-TR'),f=$('userFilter').value;if(q)arr=arr.filter(u=>[u.name,u.seflik,u.bolmeNo,u.deviceId,u.appVersion].join(' ').toLocaleLowerCase('tr-TR').includes(q));if(f==='active')arr=arr.filter(u=>n(u.lastSeenMs)>=Date.now()-15*60000);if(f==='old')arr=arr.filter(isOld);if(f==='nobackup')arr=arr.filter(u=>!userBackups(userKeyOf(u)).length);$('userTotalPill').textContent='Toplam '+int(arr.length);$('usersList').innerHTML=arr.length?arr.map(u=>{const k=userKeyOf(u),online=n(u.lastSeenMs)>=Date.now()-15*60000;return `<div class="user-card"><div class="user-avatar">${esc(initials(u.name))}</div><div><h3>${esc(u.name||'Kullanıcı')}</h3><div class="meta">🛡 ${esc(u.seflik||'-')} Şefliği<br/>▦ Bölme: ${esc(u.bolmeNo||'-')}</div></div><div><small>Son görülme</small><b>${esc(fmt(u.lastSeenMs,u.lastSeen))}</b><br/><span class="badge ${online?'':'warn'}">${online?'Online':'Offline'}</span> <span class="badge ${isOld(u)?'warn':''}">${esc(u.appVersion||u.fileVersion||'-')}</span></div><div class="user-actions"><button class="btn soft" data-user-detail="${esc(k)}" data-user-detail-index="${state.users.indexOf(u)}" data-user-detail-name="${esc(u.name||'')}" data-user-detail-seflik="${esc(u.seflik||'')}">Detay</button><button class="btn soft" data-user-warning="${esc(k)}">Yedek Uyarısı</button><button class="btn warn" data-user-passive="${esc(k)}">Pasifleştir</button><button class="btn danger" data-user-archive="${esc(k)}">Arşivle Sil</button></div></div>`}).join(''):'<div class="empty">Kullanıcı bulunamadı.</div>'}
function renderStats(){
  document.querySelectorAll('[data-stats-range]').forEach(b=>b.classList.toggle('active',b.dataset.statsRange===statsRangeV531()));
  const filteredBackupsForStats=state.backups.filter(backupDateInRangeV531);
  const records=allRecordsV530();
  const rec=filteredBackupsForStats.reduce((a,b)=>a+n(b.recordCount),0)||records.length||state.users.reduce((a,u)=>a+n(u.recordCount),0);
  const vol=filteredBackupsForStats.reduce((a,b)=>a+n(b.m3),0)||records.reduce((a,r)=>a+recordM3V530(r),0)||state.users.reduce((a,u)=>a+n(u.m3),0);
  $('statsGrid').innerHTML=[['👥','Kullanıcı',state.users.length],['📄','Kayıt',rec],['💧','Hacim',m3(vol)],['☁️','Drive Yedek',filteredBackupsForStats.length],['🌲','Ağaç türü',allTreeRowsV532(records).length],['🪵','Odun/Emval',allWoodRowsV532(records).length],['🕒','Eski sürüm',oldUsers().length],['⚠️','Yedeksiz',noBackupUsers().length]].map(x=>`<div class="stat"><small>${x[0]} ${x[1]}</small><b>${esc(x[2])}</b></div>`).join('');
  $('treeStatsV530').innerHTML=statRowsHtmlV530(allTreeRowsV532(records));
  $('woodStatsV530').innerHTML=statRowsHtmlV530(allWoodRowsV532(records));
  const userRows=state.users.map(u=>{const s=userEmvalSummaryV530(u);return {name:(u.name||'Kullanıcı')+' • '+(u.seflik||'-'),adet:s.adet,metre:s.metre,m3:s.m3}}).filter(x=>x.adet||x.m3).sort((a,b)=>b.adet-a.adet||b.m3-a.m3).slice(0,30);
  $('userEmvalStatsV530').innerHTML=statRowsHtmlV530(userRows);
  const sef={};state.users.forEach(u=>{const k=u.seflik||'-',s=userEmvalSummaryV530(u);if(!sef[k])sef[k]={name:k,adet:0,metre:0,m3:0,users:0};sef[k].users++;sef[k].adet+=s.adet;sef[k].metre+=s.metre;sef[k].m3+=s.m3});
  $('seflikStats').innerHTML=statRowsHtmlV530(Object.values(sef).sort((a,b)=>b.adet-a.adet||b.users-a.users));
}
function filteredBackups(){let arr=state.backups.slice(),q=clean($('backupSearch').value).toLocaleLowerCase('tr-TR');if(q)arr=arr.filter(b=>[b.fileName,b.name,b.seflik,b.appVersion].join(' ').toLocaleLowerCase('tr-TR').includes(q));const s=$('backupSort').value;if(s==='old')arr.sort((a,b)=>n(a.createdAtMs)-n(b.createdAtMs));else if(s==='records')arr.sort((a,b)=>n(b.recordCount)-n(a.recordCount));else arr.sort((a,b)=>n(b.createdAtMs)-n(a.createdAtMs));return arr}function renderBackups(){const users=new Set(state.backups.map(b=>userKeyOf(b)));$('driveBackupCount').textContent=int(state.backups.length);$('driveVolume').textContent=m3(driveVolume());$('driveUserCount').textContent=int(users.size);renderBackupList($('backupsList'),filteredBackups(),false)}function renderBackupList(el,arr,compact){el.innerHTML=arr.length?arr.map(b=>`<div class="backup-card"><div><span class="badge">Google Drive</span><h3>${esc(b.fileName)}</h3><div class="meta">${esc(b.name||'-')} • ${esc(b.seflik||'-')}<br/>${esc(fmt(b.createdAtMs,b.createdAt))}</div></div><div class="mini-grid"><div class="mini"><small>Kayıt</small><b>${int(b.recordCount)}</b></div><div class="mini"><small>Hacim</small><b>${m3(b.m3)}</b></div><div class="mini"><small>Sürüm</small><b>${esc(b.appVersion||'-')}</b></div></div><div class="backup-actions"><button class="btn green" data-backup-open="${esc(b.id)}">İndir</button><button class="btn soft" data-user-warning="${esc(userKeyOf(b))}">Uyarı Gönder</button><button class="btn danger" data-drive-note="1">Yedek Sil</button></div></div>`).join(''):'<div class="empty">Drive yedeği yok.</div>'}function renderTools(){}
async function addBlock(type,value,reason){value=clean(value);if(!value)return;await guardCall('admin_add_block',{block_type:type,block_value:value,reason:reason||'Admin paneli'});toast('Engel eklendi');await loadAll()}async function removeBlock(id){await guardCall('admin_remove_block',{id});toast('Engel kaldırıldı');await loadAll()}function findBackup(id){return state.backups.find(b=>b.id===id)}function findUser(k){const kk=clean(k);return state.users.find(u=>allPossibleUserKeysV531(u).some(x=>sameUserKeyV531(x,kk)))}async function sendWarning(k){toast('Duyuru sistemi kaldırıldı. Telegram üzerinden iletişim kurunuz.')}
function showUser(k,name,seflik,index){
  const u=findUserFlexibleV532(k,name,seflik,index);if(!u){toast('Kullanıcı bulunamadı');return}
  const realKey=userKeyOf(u);
  const backups=userBackups(realKey).sort((a,b)=>n(b.createdAtMs)-n(a.createdAtMs));
  const s=userEmvalSummaryV530(u);
  const records=userRecordsV530(realKey);
  const treeRows=userTreeRowsV532(u,records);
  const woodRows=userWoodRowsV532(u,records);
  const devices=userDeviceListV530(u,realKey);
  const latest=backups[0]||{};
  const lastEv=(userEventsV530(realKey)[0]||{});
  $('modalTitle').textContent=(u.name||'-')+' • Kullanıcı Detayı';
  $('modalBody').innerHTML=`
    <div class="mini-grid">
      <div class="mini"><small>Kullanıcı</small><b>${esc(u.name||'-')}</b></div>
      <div class="mini"><small>Şeflik</small><b>${esc(u.seflik||'-')}</b></div>
      <div class="mini"><small>Bölme</small><b>${esc(u.bolmeNo||'-')}</b></div>
      <div class="mini"><small>Sürüm</small><b>${esc(u.appVersion||u.fileVersion||'-')}</b></div>
      <div class="mini"><small>Toplam Adet</small><b>${int(s.adet)}</b></div>
      <div class="mini"><small>Toplam m³</small><b>${m3(s.m3)}</b></div>
      <div class="mini"><small>Drive Yedek</small><b>${int(backups.length)}</b></div>
      <div class="mini"><small>Son Yedek</small><b>${esc(fmt(latest.createdAtMs,latest.createdAt))}</b></div>
      <div class="mini"><small>Son IP</small><b>${esc(u.ip||lastEv.ip_address||'-')}</b></div>
      <div class="mini"><small>Son Cihaz</small><b>${esc(u.deviceId||lastEv.device_id||'-')}</b></div>
    </div>
    <div class="detail-section-v530">
      <div class="detail-title-v530"><h3>Cihaz ve Giriş Bilgileri</h3><span class="pill gray">${int(devices.length)} kayıt</span></div>
      <div class="device-list-v530">${devices.length?devices.map(d=>`<div class="device-card-v530"><b>${esc(d.device||'Cihaz yok')}</b><span>IP: ${esc(d.ip||'-')} • Sürüm: ${esc(d.version||'-')}</span><div class="device-tags-v531"><span class="${/bilinmiyor|olabilir/i.test(d.platform)?'unknown-v532':''}">${esc(d.platform||'Bilinmiyor')}</span><span class="${/bilinmiyor/i.test(d.browser)?'unknown-v532':''}">${esc(d.browser||'Bilinmiyor')}</span><span>${esc(d.source||'-')}</span></div><small>${esc(d.time||'-')}</small></div>`).join(''):'<div class="stats-empty-v530">Cihaz/IP bilgisi bulunamadı.</div>'}</div>
      <div class="detail-title-v530"><h3>Ağaç Türü Detayı</h3></div>
      ${statRowsHtmlV530(treeRows).replace(/stats-/g,'detail-')}
      <div class="detail-title-v530"><h3>Odun / Emval Türü Detayı</h3></div>
      ${statRowsHtmlV530(woodRows).replace(/stats-/g,'detail-')}
      <div class="detail-title-v530"><h3>Son Drive Yedekleri</h3></div>
      <div class="detail-table-v530"><div class="detail-row-v530 head"><b>Yedek</b><span>Kayıt</span><span>Hacim</span></div>${backups.slice(0,10).map(b=>`<div class="detail-row-v530"><b>${esc(b.fileName||'-')}</b><span data-label="Kayıt">${int(b.recordCount)}</span><span data-label="Hacim">${m3(b.m3)}</span></div>`).join('')||'<div class="stats-empty-v530">Drive yedeği yok.</div>'}</div>
    </div>`;
  $('modal').classList.add('show')
}
function go(tab){document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id==='tab-'+tab));document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));window.scrollTo({top:0,behavior:'smooth'})}function unlock(){const u=norm($('adminUser').value),p=norm($('adminPass').value);if(ADMIN_NAMES.map(norm).includes(u)&&ADMIN_PASS.map(norm).includes(p)){sessionStorage.setItem(SESSION_KEY,'1');$('loginCard').classList.add('hidden');$('main').classList.remove('hidden');$('tabs').classList.remove('hidden');loadAll()}else{$('loginMsg').textContent='Giriş bilgileri hatalı.'}}function appHome(){location.href=new URL('../index.html?from=yonetim',location.href).href}
function bind(){$('versionPill').textContent=ADMIN_PANEL_VERSION+' • '+appVersion();$('appBtn').addEventListener('click',appHome);$('refreshBtn').addEventListener('click',loadAll);$('loginBtn').addEventListener('click',unlock);['adminUser','adminPass'].forEach(id=>$(id).addEventListener('keydown',e=>{if(e.key==='Enter')unlock()}));document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.tab)));document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));['securityRefresh','backupRefresh'].forEach(id=>{const el=$(id);if(el)el.addEventListener('click',loadAll)});['ipSearch','ipFilter'].forEach(id=>$(id).addEventListener('input',renderSecurity));$('clearIpBtn').addEventListener('click',()=>{$('ipSearch').value='';$('ipFilter').value='all';renderSecurity()});$('homeIpSearch').addEventListener('input',renderOverview);['userSearch','userFilter'].forEach(id=>$(id).addEventListener('input',renderUsers));$('clearUserBtn').addEventListener('click',()=>{$('userSearch').value='';$('userFilter').value='all';renderUsers()});['backupSearch','backupSort'].forEach(id=>$(id).addEventListener('input',renderBackups));$('clearBackupBtn').addEventListener('click',()=>{$('backupSearch').value='';$('backupSort').value='new';renderBackups()});$('downloadAllDrive').addEventListener('click',()=>downloadJson('mesaha_drive_yedekleri.json',state.backups));$('exportUsers').addEventListener('click',()=>downloadJson('mesaha_admin_kullanicilar.json',state.users));$('exportBackups').addEventListener('click',()=>downloadJson('mesaha_admin_drive_yedekler.json',state.backups));$('resetAdminKey').addEventListener('click',()=>{localStorage.removeItem(ADMIN_KEY_STORE);toast('Admin anahtarı sıfırlandı')});document.querySelectorAll('[data-stats-range]').forEach(b=>b.addEventListener('click',()=>{setStatsRangeV531(b.dataset.statsRange);renderStats()}));$('modalClose').addEventListener('click',()=>$('modal').classList.remove('show'));$('modal').addEventListener('click',e=>{if(e.target===$('modal'))$('modal').classList.remove('show')});document.body.addEventListener('click',e=>{const d=e.target.closest('[data-detail]');if(d){const box=d.closest('.ip-row').querySelector('.details');if(box){box.classList.toggle('open');d.textContent=box.classList.contains('open')?'Detayları Gizle':'Detaylı Kayıtlar'}return}const ip=e.target.closest('[data-ban-ip]');if(ip){addBlock('ip',ip.dataset.banIp,'IP + kullanıcı ban').then(()=>{if(ip.dataset.user)addBlock('user_key',ip.dataset.user,'IP ban ile kullanıcı engellendi')}).catch(x=>toast(errText(x)));return}const bu=e.target.closest('[data-ban-user]');if(bu){addBlock('user_key',bu.dataset.banUser,'Kullanıcı engeli').catch(x=>toast(errText(x)));return}const bd=e.target.closest('[data-ban-device]');if(bd){addBlock('device_id',bd.dataset.banDevice,'Cihaz engeli').catch(x=>toast(errText(x)));return}const rb=e.target.closest('[data-remove-block]');if(rb){removeBlock(rb.dataset.removeBlock).catch(x=>toast(errText(x)));return}const bo=e.target.closest('[data-backup-open]');if(bo){const b=findBackup(bo.dataset.backupOpen);if(b)window.open(b.driveLink,'_blank');return}const dw=e.target.closest('[data-drive-note]');if(dw){toast('Bu ekranda sadece Drive yedekleri gösterilir; silme Drive yetkisine göre yapılır.');return}const uw=e.target.closest('[data-user-warning]');if(uw){sendWarning(uw.dataset.userWarning).catch(x=>toast(errText(x)));return}const ud=e.target.closest('[data-user-detail]');if(ud){showUser(ud.dataset.userDetail,ud.dataset.userDetailName,ud.dataset.userDetailSeflik,ud.dataset.userDetailIndex);return}const ar=e.target.closest('[data-user-archive], [data-user-passive]');if(ar){toast('Kullanıcı durum işlemi korunuyor; veri silinmedi.');return}});if(sessionStorage.getItem(SESSION_KEY)==='1'){ $('loginCard').classList.add('hidden');$('main').classList.remove('hidden');$('tabs').classList.remove('hidden');loadAll();}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();try{if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{}))}catch(e){}
})();
