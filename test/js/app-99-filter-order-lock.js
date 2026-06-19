/* Mesaha İO v169: Ölçümler filtre sırasını kilitler. */
(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  function lockFilterOrder(){
    try{
      var panelBody = document.querySelector('.records-panel .panel-body');
      if(!panelBody) return;
      var tools = document.querySelector('.records-panel .tools');
      var tree = byId('treeFilterV144');
      var cutter = byId('cutterFilterV158');
      if(!tools) return;
      if(tree && tree.parentNode !== panelBody) panelBody.insertBefore(tree, tools);
      if(cutter && cutter.parentNode !== panelBody) panelBody.insertBefore(cutter, tools);
      if(tree && cutter){
        if(tree.nextSibling !== cutter) panelBody.insertBefore(cutter, tree.nextSibling);
        if(tools && cutter.nextSibling !== tools) panelBody.insertBefore(tools, cutter.nextSibling);
      } else if(tree && tools && tree.nextSibling !== tools){
        panelBody.insertBefore(tree, tools);
      } else if(cutter && tools && cutter.nextSibling !== tools){
        panelBody.insertBefore(cutter, tools);
      }
      if(tree) tree.style.order = '10';
      if(cutter) cutter.style.order = '20';
      if(tools) tools.style.order = '30';
    }catch(e){}
  }
  window.lockMesahaFilterOrderV169 = lockFilterOrder;
  document.addEventListener('click', function(){ setTimeout(lockFilterOrder, 0); setTimeout(lockFilterOrder, 80); }, true);
  window.addEventListener('load', function(){ setTimeout(lockFilterOrder, 50); setTimeout(lockFilterOrder, 300); });
  try{
    var mo = new MutationObserver(function(){ lockFilterOrder(); });
    mo.observe(document.documentElement, { childList:true, subtree:true });
  }catch(e){}
  setInterval(lockFilterOrder, 1000);
})();
