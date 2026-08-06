/* source: mesaha-profile-avatar-stable-script */
(function(){
        "use strict";
        function read(k){try{return JSON.parse(localStorage.getItem(k)||"{}")||{}}catch(e){return {}}}
        function clean(v){return String(v==null?"":v).trim()}
        function profile(){var p=read("mesaha_panel_user_v316"),a=read("mesaha_google_access_v548"),t=read("mesaha_terminal_local_mode_v556"),s=read("mesaha_supabase_v500_session"),u=s.user||{},m=u.user_metadata||{};return{name:clean(p.googleFullName||p.name||a.canonical_name||a.name||t.name||m.full_name||m.name||u.email||"Kullanıcı"),avatar:clean(p.googleAvatarUrl||p.avatarUrl||a.avatar_url||a.google_avatar_url||t.avatarUrl||t.avatar_url||m.avatar_url||m.picture)}}
        function updateOnline(btn){if(!btn)return;var online=navigator.onLine!==false;btn.classList.toggle("is-online",online);btn.classList.toggle("is-offline",!online);btn.setAttribute("data-network",online?"online":"offline")}
        function paint(){var actions=document.querySelector(".top-actions-v316");if(!actions)return;var old=document.getElementById("userPanelBtnV316");if(old)old.hidden=true;var btn=document.getElementById("mesahaAccountAvatar");if(!btn){btn=document.createElement("button");btn.id="mesahaAccountAvatar";btn.type="button";btn.setAttribute("aria-label","Orman İO hesap bilgileri");actions.appendChild(btn);btn.addEventListener("click",function(){location.href="../?open=account"},true)}var x=profile();var media=x.avatar?'<img src="'+x.avatar.replace(/"/g,"&quot;")+'" alt="" referrerpolicy="no-referrer">':clean(x.name).split(/\s+/).slice(0,2).map(function(v){return v.charAt(0)}).join("").toUpperCase();btn.innerHTML='<span class="mesaha-avatar-media">'+media+'</span><span class="mesaha-online-dot" aria-hidden="true"></span>';updateOnline(btn)}
        function boot(){paint();setTimeout(paint,350);setTimeout(paint,1400)}
        if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
        window.addEventListener("storage",paint);window.addEventListener("online",function(){updateOnline(document.getElementById("mesahaAccountAvatar"))},{passive:true});window.addEventListener("offline",function(){updateOnline(document.getElementById("mesahaAccountAvatar"))},{passive:true});["mesaha:user-login","mesaha:terminal-mode-enabled","mesaha:google-access-approved","pageshow"].forEach(function(n){window.addEventListener(n,function(){setTimeout(paint,50)},{passive:true})});
      })();
;
