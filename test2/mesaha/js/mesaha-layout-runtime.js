/* source: mesaha-v600-layout-script */
(function(){
        "use strict";
        function $(id){return document.getElementById(id)}
        function qs(sel,root){return (root||document).querySelector(sel)}
        function qsa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
        var icons={
          home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.8 12 3.8l8.5 7v8.4a1.8 1.8 0 0 1-1.8 1.8H5.3a1.8 1.8 0 0 1-1.8-1.8Z"/><path d="M9.2 21v-6.3h5.6V21"/></svg>',
          records:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h14v15H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
          beyan:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h7l3 3V12"/><path d="M14 3.5V7h3.5"/><path d="M7 3.5a2 2 0 0 0-2 2v13A2 2 0 0 0 7 20.5h4"/><path d="M16 13v7M13.5 17.5 16 20l2.5-2.5"/></svg>',
          seflikFolder:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5h6l1.8 2h9.2v8.7a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z"/><path d="M3.5 7.5v-1.7a2 2 0 0 1 2-2h4l1.8 2h7.2a2 2 0 0 1 2 2v1.7"/></svg>',
          settings:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M19.3 13.2a7.8 7.8 0 0 0 0-2.4l2-1.5-2-3.4-2.5 1a8.5 8.5 0 0 0-2.1-1.2L14.4 3h-4.1L10 5.7A8.5 8.5 0 0 0 7.9 7L5.4 6 3.3 9.3l2 1.5a7.8 7.8 0 0 0 0 2.4l-2 1.5 2.1 3.4 2.5-1a8.5 8.5 0 0 0 2.1 1.2l.3 2.7h4.1l.3-2.7a8.5 8.5 0 0 0 2.1-1.2l2.5 1 2-3.4Z"/></svg>'
        };
        var labels={home:"Ana Menü",records:"Ölçümler",beyan:"Beyan",seflikFolder:"Şeflik",settings:"Ayarlar"};
        function paintNav(){
          var nav=$("bottomNav");
          if(!nav) return;
          nav.classList.add("mesaha-nav-v600");
          ["home","records","beyan","seflikFolder","settings"].forEach(function(key){
            var btn=qs('[data-nav="'+key+'"]',nav);
            if(!btn) return;
            if(btn.dataset.iconVersion!=="600" || !qs("svg",btn)){
              btn.innerHTML='<span class="nav-icon-v600">'+icons[key]+'</span><b>'+labels[key]+'</b>';
              btn.dataset.iconVersion="600";
            }
          });
        }
        function watchNav(){
          var nav=$("bottomNav");
          if(!nav||nav.__v600Observer) return;
          nav.__v600Observer=new MutationObserver(function(){setTimeout(paintNav,0)});
          nav.__v600Observer.observe(nav,{childList:true,subtree:true,characterData:true});
          setTimeout(function(){try{nav.__v600Observer&&nav.__v600Observer.disconnect()}catch(e){}},8000);
        }
        window.addEventListener("mesaha:view-changed",paintNav,{passive:true});
        function closeGuideModal(){
          var modal=$("modernModal");
          if(!modal) return;
          modal.classList.add("hidden");
          modal.classList.remove("mesaha-guide-open-v600");
        }
        function openGuideModal(){
          var modal=$("modernModal"), title=$("modalTitle"), body=$("modalBody"), actions=$("modalActions");
          if(!modal||!title||!body||!actions) return;
          var guide=qs("#guideView .guide-card");
          title.textContent="Kılavuz";
          body.innerHTML=guide?guide.innerHTML:"<p>Kılavuz yüklenemedi.</p>";
          actions.innerHTML='<button class="btn green" id="guideModalCloseBtnV600" type="button">Kapat</button>';
          var footerBtn=$("guideModalCloseBtnV600");
          if(footerBtn) footerBtn.addEventListener("click",closeGuideModal,{once:true});
          modal.classList.remove("hidden");
          modal.classList.add("mesaha-guide-open-v600");
        }
        function ensureGuideCard(){
          var settingsView=$("settingsView");
          if(!settingsView) return;
          var maintenance=qs(".maintenance-card",settingsView);
          var card=$("guideLaunchCardV600");
          if(!card){
            card=document.createElement("section");
            card.id="guideLaunchCardV600";
            card.className="card settings-card guide-launch-card-v600";
            card.innerHTML='<div class="section-head"><h2>Kılavuz</h2><span>Yardım</span></div><p class="guide-launch-copy">Uygulama kullanım adımlarını ayrı bir pencerede görüntüleyin.</p><button class="btn soft" id="openGuideModalV600" type="button">Kılavuzu Aç</button>';
            if(maintenance&&maintenance.parentNode===settingsView) settingsView.insertBefore(card,maintenance); else settingsView.appendChild(card);
          }
          var btn=$("openGuideModalV600");
          if(btn&&!btn.__v600Bound){btn.__v600Bound=true;btn.addEventListener("click",openGuideModal)}
          var close=$("modalCloseBtn");
          if(close&&!close.__v600Bound){close.__v600Bound=true;close.addEventListener("click",closeGuideModal)}
          var modal=$("modernModal");
          if(modal&&!modal.__v600Backdrop){modal.__v600Backdrop=true;modal.addEventListener("click",function(ev){if(ev.target===modal)closeGuideModal()})}
        }
        function directChildrenByClass(parent,className){
          return parent?Array.prototype.filter.call(parent.children,function(el){return el.classList&&el.classList.contains(className)}):[];
        }
        function ensureBeyanView(){
          var recordsView=$("recordsView"), recordsCard=recordsView&&qs(".records-card",recordsView);
          if(!recordsCard) return;
          var beyanView=$("beyanView");
          if(!beyanView){
            beyanView=document.createElement("section");
            beyanView.id="beyanView";
            beyanView.className="view";
            recordsView.parentNode.insertBefore(beyanView,$("seflikFolderView")||$("guideView")||recordsView.nextSibling);
          }
          var beyanCard=qs(".beyan-card-v600",beyanView);
          if(!beyanCard){
            beyanCard=document.createElement("section");
            beyanCard.className="card beyan-card-v600";
            beyanView.appendChild(beyanCard);
          }
          var count=$("recordCountPill");
          var summaryHead=count&&count.closest?count.closest(".section-head"):null;
          if(summaryHead){
            summaryHead.id="beyanSummaryHeadV600";
            if(summaryHead.parentNode!==beyanCard) beyanCard.insertBefore(summaryHead,beyanCard.firstChild);
            var title=qs("h2",summaryHead); if(title) title.textContent="Beyan";
          }
          var summary=qs(".summary-grid.small",recordsCard)||qs(".summary-grid.small",beyanCard);
          var totals=$("productTotals");
          var actions=qs(".action-grid.records-action-grid-v530",recordsCard)||qs(".action-grid.records-action-grid-v530",beyanCard);
          [summary,totals,actions].forEach(function(node){if(node&&node.parentNode!==beyanCard)beyanCard.appendChild(node)});

          var filters=$("beyanFiltersV600");
          if(!filters){
            filters=document.createElement("section");
            filters.id="beyanFiltersV600";
            filters.setAttribute("aria-label","Beyan kayıt filtreleri");
            filters.innerHTML='<div class="beyan-filters-head-v600"><h3>Kayıt Filtreleri</h3><span>Ağaç ve kesimci</span></div>';
          }
          var treeChips=$("treeFilters"), cutterChips=$("cutterFilters");
          var treeBox=treeChips&&treeChips.closest?treeChips.closest(".filter-box"):null;
          var cutterBox=cutterChips&&cutterChips.closest?cutterChips.closest(".filter-box"):null;
          if(treeBox&&treeBox.parentNode!==filters)filters.appendChild(treeBox);
          if(cutterBox&&cutterBox.parentNode!==filters)filters.appendChild(cutterBox);
          if(filters.parentNode!==beyanCard)beyanCard.appendChild(filters); else beyanCard.appendChild(filters);

          directChildrenByClass(beyanCard,"section-head").forEach(function(head){if(head!==summaryHead)head.remove()});
          var headers=directChildrenByClass(recordsCard,"section-head");
          var recordsHead=$("recordsListHeaderV600");
          headers.forEach(function(head){if(head!==recordsHead)head.remove()});
          if(!recordsHead){
            recordsHead=document.createElement("div");
            recordsHead.id="recordsListHeaderV600";
            recordsHead.className="section-head";
            recordsHead.innerHTML='<h2>Ölçümler</h2><span>Kayıt listesi</span>';
          }
          if(recordsHead.parentNode!==recordsCard)recordsCard.insertBefore(recordsHead,recordsCard.firstChild);
          else if(recordsCard.firstChild!==recordsHead)recordsCard.insertBefore(recordsHead,recordsCard.firstChild);
        }
        function filterIcon(key){
          if(key==="tree") return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 7.5 9h2.8L6.5 14h4v6h3v-6h4L13.7 9h2.8Z"/></svg>';
          return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6"/></svg>';
        }
        function readFilterState(key){
          try{var x=JSON.parse(localStorage.getItem("mesaha_filter_open_v600")||localStorage.getItem("mesaha_filter_open_v570")||"{}");return x[key]===true}catch(_){return false}
        }
        function saveFilterState(key,open){
          try{var x=JSON.parse(localStorage.getItem("mesaha_filter_open_v600")||localStorage.getItem("mesaha_filter_open_v570")||"{}");x[key]=!!open;localStorage.setItem("mesaha_filter_open_v600",JSON.stringify(x))}catch(_){ }
        }
        function setFilterOpen(box,btn,chips,key,open){
          box.dataset.open=open?"1":"0";
          btn.setAttribute("aria-expanded",open?"true":"false");
          chips.setAttribute("aria-hidden",open?"false":"true");
          saveFilterState(key,open);
        }
        function enhanceFilters(){
          [["treeFilters","tree"],["cutterFilters","cutter"]].forEach(function(pair){
            var chips=$(pair[0]), key=pair[1];
            if(!chips) return;
            var box=chips.closest(".filter-box");
            if(!box) return;
            box.classList.add("filter-box-v600");
            var btn=qs(".filter-toggle-v600",box);
            if(!btn){
              var head=qs(".filter-head",box);
              if(!head) return;
              var title=qs("b",head), status=qs("span",head);
              btn=document.createElement("button");
              btn.type="button";
              btn.className="filter-toggle-v600";
              btn.innerHTML='<span class="filter-toggle-icon-v600">'+filterIcon(key)+'</span><span class="filter-toggle-copy-v600"><b>'+(title?title.textContent:(key==="tree"?"Ağaç filtresi":"Kesimci filtresi"))+'</b><span class="filter-status-v600" id="'+(key==="tree"?"treeFilterText":"cutterFilterText")+'">'+(status?status.textContent:"Seçili: Tümü")+'</span></span><span class="filter-toggle-chevron-v600"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.5 9 5.5 5.5L17.5 9"/></svg></span>';
              head.replaceWith(btn);
              var open=readFilterState(key);
              setFilterOpen(box,btn,chips,key,open);
              btn.addEventListener("click",function(ev){
                ev.preventDefault();
                ev.stopPropagation();
                setFilterOpen(box,btn,chips,key,box.dataset.open!=="1");
              },true);
            }
            var liveStatus=key==="tree"?$("treeFilterText"):$("cutterFilterText");
            var statusTarget=qs(".filter-status-v600",btn);
            if(liveStatus&&statusTarget&&statusTarget.textContent!==liveStatus.textContent)statusTarget.textContent=liveStatus.textContent;
          });
        }
        function boot(){
          document.documentElement.setAttribute("data-mesaha-v600-ready","1");
          paintNav();watchNav();ensureBeyanView();enhanceFilters();ensureGuideCard();
        }
        if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
        window.addEventListener("mesaha:view-changed",function(ev){
          var view=ev&&ev.detail?ev.detail.view:"";
          if(view==="records"||view==="beyan")setTimeout(enhanceFilters,70);
          if(view==="settings")setTimeout(ensureGuideCard,70);
          setTimeout(function(){ensureBeyanView();paintNav()},150);
        });
        [200,700,1500,3000].forEach(function(ms){setTimeout(boot,ms)});
      })();
;
