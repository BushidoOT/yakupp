/* Mesaha İO V5.82 — Misafir modunda Şeflik Klasörü yüklenme kilidi önleme. */
(function(){
  'use strict';
  if(window.__mesahaSeflikEntryRepairV582) return;
  window.__mesahaSeflikEntryRepairV582 = true;

  var ACTIVE_KEY='mesaha_active_seflik_folder_v564';
  var PANEL_KEY='mesaha_panel_user_v316';
  var SETTINGS_KEY='cam_mesaha_ayarlar_v1';
  var ACCESS_KEY='mesaha_google_access_v548';
  var SESSION_KEY='mesaha_supabase_v500_session';
  var TERMINAL_KEY='mesaha_terminal_local_mode_v556';
  var TERMINAL_OLD='mesaha_terminal_local_mode_v557';
  var refreshPromise=null;
  var lastWarnAt=0;
  var lastStartedAt=0;

  function $(id){return document.getElementById(id)}
  function clean(v){return String(v==null?'':v).trim().replace(/\s+/g,' ')}
  function esc(v){return clean(v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
  function getJson(k,f){try{var v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}}
  function setJson(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
  function active(){return getJson(ACTIVE_KEY,{})||{}}
  function panel(){return getJson(PANEL_KEY,{})||{}}
  function settings(){return getJson(SETTINGS_KEY,{})||{}}
  function access(){return getJson(ACCESS_KEY,{})||{}}
  function session(){return getJson(SESSION_KEY,{})||{}}
  function terminal(){var x=getJson(TERMINAL_KEY,null)||getJson(TERMINAL_OLD,null)||{};return x&&x.active?x:{}}
  function activeSeflik(){var a=active(),p=panel(),s=settings(),t=terminal();return clean(a.seflik||p.activeSeflik||p.seflik||t.seflik||s.seflik)}
  function activeKey(){var a=active();return clean(a.seflik_key||a.seflikKey)}
  function userName(){var p=panel(),a=access(),s=session(),u=s.user||{},m=u.user_metadata||{},t=terminal();return clean(p.googleFullName||p.name||a.canonical_name||a.requested_name||t.name||m.full_name||m.name||u.email||'Kullanıcı')}
  function userEmail(){var p=panel(),a=access(),s=session(),u=s.user||{},t=terminal();return clean(a.email||p.googleEmail||t.pairedEmail||u.email)}
  function avatar(){var p=panel(),a=access(),s=session(),u=s.user||{},m=u.user_metadata||{},t=terminal();var vals=[p.googleAvatarUrl,p.avatarUrl,a.avatar_url,a.google_avatar_url,t.avatarUrl,t.avatar_url,m.avatar_url,m.picture];for(var i=0;i<vals.length;i++){var v=clean(vals[i]);if(/^https?:\/\//i.test(v))return v}return ''}
  function api(){return window.mesahaSupabaseV380||window.mesahaSupabaseV383||window.mesahaSupabase||null}
  function terminalAuth(){var t=terminal();if(t.active&&clean(t.source)==='pair_code'&&(t.terminalCode||t.terminalToken))return{terminalCode:clean(t.terminalCode),terminalToken:clean(t.terminalToken),terminalPairedUserId:clean(t.pairedUserId),terminalPairedEmail:clean(t.pairedEmail)};return {}}
  function pairedTerminal(){var t=terminal();return !!(t.active&&clean(t.source)==='pair_code'&&(t.pairedUserId||t.terminalToken||t.terminalCode))}
  function cloudAccess(){var p=panel(),a=access(),s=session();return !!(s.access_token||clean(a.status)==='approved'||p.googleApproved===true||p.terminalPairedUserId||pairedTerminal())}
  function blockedMessage(){var t=terminal();return t.active&&!pairedTerminal()?'Misafir modunda Şeflik Klasörü buluta bağlanmaz. Terminal kodu eşleştirin veya Google ile giriş yapın.':'Şeflik Klasörü için Google girişi veya kodla eşleşmiş terminal gerekir.'}
  function edge(action,data){var a=api();if(!a||typeof a.edge!=='function')return Promise.reject(new Error('Güvenli sunucu bağlantısı hazır değil.'));return a.edge(action,Object.assign({source:'seflik-entry-repair-v582',seflik:activeSeflik(),folderSeflik:activeSeflik()},terminalAuth(),data||{}))}
  function withTimeout(promise,ms,msg){var timer=0;return Promise.race([Promise.resolve(promise),new Promise(function(_,reject){timer=setTimeout(function(){reject(new Error(msg||'10 saniyede cevap gelmedi.'))},ms||10000)})]).finally(function(){if(timer)clearTimeout(timer)})}
  function toast(t,s,k){try{var f=window.mesahaFloatToastV315||window.mesahaFloatToastV314;if(typeof f==='function')return f(t,s||'',k||'success')}catch(e){}try{if(window.toast)return window.toast(t+(s?' — '+s:''))}catch(e){} }
  function setStatus(text,kind){var st=$('seflikFolderStatusV528');if(st){st.textContent=text;st.dataset.kind=kind||''}var meta=$('seflikFolderRemoteMetaV528');if(meta)meta.textContent=text}

  function ensureOverlay(){
    var ov=$('seflikTransferOverlayV534');
    if(ov) return ov;
    ov=document.createElement('div');
    ov.id='seflikTransferOverlayV534';
    ov.className='seflik-transfer-overlay-v534 hidden';
    ov.setAttribute('role','status');
    ov.setAttribute('aria-live','polite');
    ov.setAttribute('aria-busy','true');
    ov.innerHTML='<div class="seflik-transfer-card-v534"><span class="seflik-transfer-spinner-v534" aria-hidden="true"></span><h3 id="seflikTransferTitleV534">Şeflik klasörü getiriliyor…</h3><p id="seflikTransferTextV534">Lütfen bekleyin.</p><div class="seflik-transfer-progress-v534"><span id="seflikTransferBarV534"></span></div><small>İnternet zayıfsa en son mevcut bilgiler gösterilir.</small></div>';
    document.body.appendChild(ov);
    return ov;
  }
  function show(title,text,percent){var ov=ensureOverlay(),t=$('seflikTransferTitleV534'),p=$('seflikTransferTextV534'),bar=$('seflikTransferBarV534');if(t)t.textContent=title||'Şeflik klasörü getiriliyor…';if(p)p.textContent=text||'Lütfen bekleyin.';if(bar)bar.style.width=Math.max(4,Math.min(100,Number(percent)||4))+'%';ov.classList.remove('hidden');document.body.classList.add('seflik-transfer-busy-v534')}
  function update(title,text,percent){var ov=$('seflikTransferOverlayV534');if(!ov||ov.classList.contains('hidden')){show(title,text,percent);return}var t=$('seflikTransferTitleV534'),p=$('seflikTransferTextV534'),bar=$('seflikTransferBarV534');if(title&&t)t.textContent=title;if(text&&p)p.textContent=text;if(bar&&percent!=null)bar.style.width=Math.max(4,Math.min(100,Number(percent)||4))+'%'}
  function hide(delay){setTimeout(function(){var ov=$('seflikTransferOverlayV534');if(ov)ov.classList.add('hidden');document.body.classList.remove('seflik-transfer-busy-v534')},Math.max(0,Number(delay)||0))}

  function applyEnsured(out){
    out=out||{};var f=out.folder||{};if(!clean(f.seflik))return;
    setJson(ACTIVE_KEY,{seflik:clean(f.seflik),seflik_key:clean(f.seflik_key||out.seflik_key),role:clean(f.role||'owner'),creator:!!(f.is_creator||out.is_creator),created_by_user_id:clean(f.created_by_user_id),updatedAt:new Date().toISOString()});
    try{var p=panel();p.activeSeflik=clean(f.seflik);p.seflik=p.seflik||clean(f.seflik);setJson(PANEL_KEY,p)}catch(e){}
    try{window.dispatchEvent(new Event('mesaha:seflik-folder-active-changed'))}catch(e){}
  }

  function avatarHtml(){var av=avatar(),n=userName();if(av)return '<img src="'+esc(av)+'" alt="" onerror="this.style.display=\'none\'">';return '<span class="avatar-fallback">'+esc((n||'K').charAt(0).toLocaleUpperCase('tr-TR'))+'</span>'}
  function showLocalMemberFallback(msg){
    var box=$('seflikMemberListV566'),sf=activeSeflik();if(!box||!sf)return;
    if(box.querySelector&&box.querySelector('.seflik-v564-user')&&!/yükleniyor|henüz|yerel|bağlantı/i.test(box.textContent||''))return;
    var a=active(),creator=a.creator===true||clean(a.role)==='owner',role=creator?'Kurucu':'Bu cihazdaki kullanıcı';
    box.innerHTML='<div class="seflik-v566-member-title"><b>Ekli Ormancılar</b><small>'+esc(sf)+'</small></div>'+
      '<div class="seflik-v564-note">'+esc(msg||'Sunucu üyelikleri kontrol ediliyor. Bağlantı zayıfsa yerel kullanıcı bilgisi gösterilir.')+'</div>'+
      '<div class="seflik-v566-member-list"><div class="seflik-v564-user '+(creator?'role-owner':'role-member')+'">'+avatarHtml()+'<div><b>'+esc(userName())+'</b><small>'+esc(role+(userEmail()?' • '+userEmail():''))+'</small></div></div></div>';
  }

  function renderInitialLoading(){
    setStatus('Şeflik klasörü getiriliyor…','busy');
    var box=$('seflikFolderListV528');
    if(box&&!box.querySelector('.seflik-division-card'))box.innerHTML='<div class="seflik-folder-empty">Şeflik klasörü getiriliyor…<br><small>Şeflikler, üyeler, bölmeler ve senkron kayıtları kontrol ediliyor.</small></div>';
    showLocalMemberFallback('Üyeler yükleniyor…');
  }
  function renderAccessBlocked(){
    var msg=blockedMessage();
    setStatus(msg,'error');
    var box=$('seflikFolderListV528');
    if(box&&!box.querySelector('.seflik-division-card'))box.innerHTML='<div class="seflik-folder-empty">Şeflik Klasörü kapalı<br><small>'+esc(msg)+' En son mevcut bilgiler gösteriliyor.</small></div>';
    var members=$('seflikMemberListV566');if(members)members.innerHTML='<div class="seflik-v564-note">'+esc(msg)+'</div>';
    update('Şeflik Klasörü kapalı',msg,100);hide(700);
    if(Date.now()-lastWarnAt>6000){lastWarnAt=Date.now();toast('Şeflik Klasörü kapalı',msg,'warning')}
    return false;
  }

  async function ensureServerFolder(){
    var sf=activeSeflik();
    if(!sf)return null;
    var out=await edge('seflik_folder_ensure_active',{seflik:sf,folderSeflik:sf,seflikKey:activeKey()});
    if(out&&out.ok)applyEnsured(out);
    return out;
  }

  async function refresh(source){
    if(refreshPromise)return refreshPromise;
    var sf=activeSeflik();
    lastStartedAt=Date.now();
    if(!cloudAccess())return Promise.resolve(renderAccessBlocked());
    show('Şeflik klasörü getiriliyor…','Cihazdaki son bilgiler hazırlanıyor.',8);
    renderInitialLoading();
    refreshPromise=(async function(){
      if(!sf){setStatus('Önce şeflik oluşturun veya seçin.','error');update('Şeflik seçilmedi','Önce şeflik oluşturun veya seçin.',100);hide(900);return false}
      if(!navigator.onLine){
        try{if(window.MesahaSeflikFolderV529&&window.MesahaSeflikFolderV529.autoSync)await window.MesahaSeflikFolderV529.autoSync()}catch(e){}
        setStatus('Bağlantı başarısız. En son mevcut bilgiler gösteriliyor.','error');
        update('Bağlantı başarısız','İnternet yok. En son mevcut bilgiler gösteriliyor.',100);
        showLocalMemberFallback('Bağlantı yok. Sunucu üyelikleri güncellenemedi; yerel kullanıcı bilgisi gösteriliyor.');
        hide(1200);return false;
      }
      try{
        await withTimeout((async function(){
          update('Şeflik klasörü getiriliyor…','Şeflik yetkisi kontrol ediliyor.',18);
          await ensureServerFolder();
          update('Şeflik klasörü getiriliyor…','Şeflik listesi güncelleniyor.',36);
          if(window.MesahaSeflikGovernanceApi&&window.MesahaSeflikGovernanceApi.loadFolders)await window.MesahaSeflikGovernanceApi.loadFolders(true,true);
          update('Şeflik klasörü getiriliyor…','Üyeler getiriliyor.',56);
          showLocalMemberFallback('Üyeler getiriliyor…');
          if(window.MesahaSeflikGovernanceApi&&window.MesahaSeflikGovernanceApi.loadMembers)await window.MesahaSeflikGovernanceApi.loadMembers(true,true);
          update('Şeflik klasörü getiriliyor…','Bölmeler ve ortak kayıtlar senkronize ediliyor.',76);
          if(window.MesahaSeflikFolderV529&&window.MesahaSeflikFolderV529.autoSync)await window.MesahaSeflikFolderV529.autoSync();
        })(),10000,'Bağlantı başarısız. Sunucu 10 saniye içinde cevap vermedi.');
        update('Şeflik klasörü hazır','Şeflikler, üyeler, bölmeler ve senkron kayıtları güncellendi.',100);
        setStatus('Şeflik klasörü güncellendi.','success');
        hide(450);return true;
      }catch(e){
        var msg=String(e&&e.message?e.message:e);
        setStatus('Bağlantı başarısız. En son mevcut bilgiler gösteriliyor.','error');
        update('Bağlantı başarısız','Sunucu cevap vermedi. En son mevcut bilgiler gösteriliyor.',100);
        showLocalMemberFallback('Bağlantı başarısız. Sunucu üyelikleri güncellenemedi; yerel kullanıcı bilgisi gösteriliyor.');
        try{if(window.MesahaSeflikFolderV529&&window.MesahaSeflikFolderV529.autoSync)await window.MesahaSeflikFolderV529.autoSync()}catch(_e){}
        if(Date.now()-lastWarnAt>9000){lastWarnAt=Date.now();toast('Bağlantı başarısız','Şeflik bilgileri güncellenemedi. En son mevcut bilgiler gösteriliyor.','warning')}
        hide(1400);return false;
      }
    })().finally(function(){refreshPromise=null});
    return refreshPromise;
  }

  function onSeflikEntry(){setTimeout(function(){refresh('entry').catch(function(){})},20)}
  function wrapShowView(){
    if(typeof window.showView==='function'&&!window.showView.__seflikEntryRepairV582){
      var original=window.showView;
      var wrapped=function(view){var r=original.apply(this,arguments);try{if(clean(view)==='seflikFolder')onSeflikEntry()}catch(e){}return r};
      wrapped.__seflikEntryRepairV582=true;
      window.showView=wrapped;
    }
  }
  function boot(){wrapShowView();if($('seflikFolderView')&&$('seflikFolderView').classList.contains('active')&&Date.now()-lastStartedAt>2500)onSeflikEntry()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  [200,800,1600,3000].forEach(function(ms){setTimeout(boot,ms)});
  document.addEventListener('click',function(ev){var n=ev.target&&ev.target.closest&&ev.target.closest('[data-nav="seflikFolder"]');if(n){if(!cloudAccess()){ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();renderAccessBlocked();return false}show('Şeflik klasörü getiriliyor…','Şeflikler, üyeler, bölmeler ve senkron kayıtları kontrol ediliyor.',7);renderInitialLoading();onSeflikEntry()}},true);
  window.addEventListener('online',function(){var v=$('seflikFolderView');if(v&&v.classList.contains('active'))setTimeout(function(){refresh('online').catch(function(){})},600)});
  window.MesahaSeflikEntryRepairV581={refresh:refresh,showLoading:show,updateLoading:update,hideLoading:hide,showLocalMemberFallback:showLocalMemberFallback};window.MesahaSeflikEntryRepairV582=window.MesahaSeflikEntryRepairV581;
})();
