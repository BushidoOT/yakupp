(function(){
  'use strict';
  var LABEL='V3.39 •ExelanceX•';
  function qsa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
  function $(id){return document.getElementById(id);}
  function setText(el,t){if(el) el.textContent=t;}
  function applyVersion(){
    document.title='Mesaha İO '+LABEL;
    setText($('versionText'), LABEL);
    qsa('.version-card b').forEach(function(b){b.textContent=LABEL;});
    qsa('.version-card small').forEach(function(s){s.textContent='';s.style.display='none';});
    var startup=document.querySelector('#startup strong'); if(startup) startup.textContent=LABEL;
  }
  function applyThemeButton(){
    var btn=$('themeBtn'); if(!btn) return;
    btn.style.display='grid'; btn.style.visibility='visible'; btn.style.opacity='1';
    function paint(){btn.textContent=document.body.classList.contains('dark')?'☀️':'🌙';}
    if(localStorage.getItem('mesaha_theme')==='dark'||localStorage.getItem('mesaha_theme_v342')==='dark'||localStorage.getItem('mesaha_theme_v341')==='dark') document.body.classList.add('dark');
    paint();
    if(!btn.__v345Theme){
      btn.__v345Theme=true;
      btn.addEventListener('click',function(ev){
        ev.preventDefault(); ev.stopPropagation();
        document.body.classList.toggle('dark');
        var mode=document.body.classList.contains('dark')?'dark':'light';
        localStorage.setItem('mesaha_theme',mode);
        localStorage.setItem('mesaha_theme_v342',mode);
        localStorage.setItem('mesaha_theme_v341',mode);
        paint();
      },true);
    }
  }
  function moveUserBadge(){
    var badge=$('userBadge'); var top=document.querySelector('.topbar');
    if(!badge||!top) return;
    badge.style.display='inline-flex';
    badge.style.alignItems='center';
    badge.style.justifyContent='center';
    badge.style.cursor='pointer';
  }
  function hideRecordProductFilters(){
    var root=$('recordsView'); if(!root) return;
    qsa('.filter-chips,.chip-wrap',root).forEach(function(row){
      var txt=(row.textContent||'').toLocaleLowerCase('tr-TR');
      var hits=['tomruk','maden','kağıt','kagit','sanayi','tel'].filter(function(x){return txt.indexOf(x)>-1;}).length;
      if(hits>=2){ row.classList.add('mesaha-product-filter-row-v339'); row.style.display='none'; }
    });
    qsa('button,.chip,.filter-chip',root).forEach(function(el){
      var t=(el.textContent||'').trim().toLocaleLowerCase('tr-TR');
      if(['tomruk','maden','kağıtlık','kagitlik','sanayi','tel'].indexOf(t)>-1){ el.style.display='none'; }
    });
  }
  function run(){applyVersion();applyThemeButton();moveUserBadge();hideRecordProductFilters();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();
  [200,700,1500,3000].forEach(function(ms){setTimeout(run,ms);});
  setInterval(run,5000);
})();
