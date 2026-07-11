/* Mesaha İO V5.45 — güvenli başlangıç ve eski terminal-lite temizliği. */
(function(){
  'use strict';
  if(window.__mesahaEarlyOptimizerV545)return;
  window.__mesahaEarlyOptimizerV545=true;
  try{
    document.documentElement.classList.remove('mesaha-terminal-lite','scrolling-now');
    document.documentElement.classList.add('mesaha-boot-v527');
    localStorage.removeItem('mesaha_terminal_lite');
    localStorage.removeItem('mesaha_terminal_lite_active');
  }catch(e){}
  function cleanup(){
    try{document.documentElement.classList.remove('mesaha-terminal-lite','scrolling-now');}catch(e){}
    try{if(document.body)document.body.classList.remove('mesaha-terminal-lite','scrolling-now');}catch(e){}
    try{var old=document.getElementById('mesaha-terminal-lite-style-v462');if(old)old.remove();}catch(e){}
  }
  function ready(){
    cleanup();
    try{document.documentElement.classList.remove('mesaha-boot-v527');document.documentElement.classList.add('mesaha-ready-v527');}catch(e){}
  }
  cleanup();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true,passive:true});else ready();
  window.addEventListener('pageshow',cleanup,{passive:true});
})();
