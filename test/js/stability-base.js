
(function(){
  'use strict';
  var INFO = window.MESAHA_VERSION || {};
  var VISIBLE_VERSION = INFO.visibleVersion || (window.MESAHA_VERSION_TEXT || 'Mesaha İO');
  var FILE_VERSION = INFO.version || 'v178';
  function safe(fn){ try { return fn(); } catch(e){ try { console.warn('[v171]', e); } catch(_){} } }
  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];}); }
  function setVersion(){
    safe(function(){ document.title = VISIBLE_VERSION; });
    safe(function(){ document.querySelectorAll('.brand h1,.brand-copy-v143 h1,[data-version-title]').forEach(function(el){ el.textContent = VISIBLE_VERSION; }); });
    safe(function(){ window.MESAHA_BUILD_INFO = Object.assign({}, window.MESAHA_BUILD_INFO||{}, {fileVersion:FILE_VERSION, visibleVersion:VISIBLE_VERSION, modularOptimized:true}); });
  }
  function homeClean(){
    safe(function(){ document.querySelectorAll('.home-card-v143.quick-v143,.home-card-v143.records-v143').forEach(function(el){ el.remove(); }); });
    safe(function(){
      var summary=document.querySelector('.home-card-v143.summary-v143');
      var grid=document.querySelector('.app > main.grid, main.grid');
      if(summary && grid && grid.parentNode && summary.previousElementSibling!==grid){ grid.parentNode.insertBefore(summary, grid.nextSibling); }
    });
  }
  function todayDate(){
    safe(function(){
      var el=document.getElementById('productionDate');
      if(el && !el.value){
        var d=new Date(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
        el.value=d.getFullYear()+'-'+m+'-'+day;
        try { if(window.state && window.state.settings) window.state.settings.productionDate=el.value; } catch(_){ }
      }
    });
  }
  function orderFilters(){
    safe(function(){
      var body=document.querySelector('.records-panel .panel-body') || document.querySelector('.records-panel') || document.body;
      var tree=document.getElementById('treeFilterV144');
      var cutter=document.getElementById('cutterFilterV158') || document.getElementById('cutterFilterV163');
      var exportBtn=document.getElementById('exportSystemXlsBtn');
      var totals=document.querySelector('.records-panel .totals');
      if(tree && body && tree.parentNode!==body){
        if(totals && totals.parentNode===body) body.insertBefore(tree, totals.nextSibling); else if(exportBtn && exportBtn.parentNode===body) body.insertBefore(tree, exportBtn); else body.insertBefore(tree, body.firstChild);
      } else if(tree && exportBtn && exportBtn.parentNode===body && tree.compareDocumentPosition(exportBtn)&Node.DOCUMENT_POSITION_PRECEDING){
        body.insertBefore(tree, exportBtn);
      }
      if(cutter && body){
        if(cutter.parentNode!==body || (tree && tree.nextSibling!==cutter)){
          if(tree && tree.parentNode===body) body.insertBefore(cutter, tree.nextSibling);
          else if(exportBtn && exportBtn.parentNode===body) body.insertBefore(cutter, exportBtn);
        }
      }
    });
  }
  function forceButtonsClickable(){
    safe(function(){ document.querySelectorAll('button').forEach(function(btn){ btn.type = btn.getAttribute('type') || 'button'; }); });
  }
  function focusDiameterSoon(){
    safe(function(){
      if(typeof window.focusDiameterKeepKeyboard === 'function') return;
      window.focusDiameterKeepKeyboard = function(){
        setTimeout(function(){
          var el = document.getElementById('diameter') || document.getElementById('cleanDiameterV111');
          if(el && document.activeElement !== el){ try{ el.focus({preventScroll:true}); } catch(e){ el.focus(); } }
        }, 60);
      };
    });
  }
  function boot(){ setVersion(); homeClean(); todayDate(); orderFilters(); forceButtonsClickable(); focusDiameterSoon(); }
  ready(function(){ boot(); setTimeout(boot,150); setTimeout(boot,600); setTimeout(boot,1500); });
  window.addEventListener('load', function(){ boot(); }, {once:true});
  setInterval(function(){ setVersion(); orderFilters(); homeClean(); }, 1800);
})();
