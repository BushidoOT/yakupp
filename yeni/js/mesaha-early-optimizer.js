/* Mesaha İO V5.27 — Güvenli başlangıç optimizasyonu.
   Tarayıcının setInterval/addEventListener API'leri artık değiştirilmez. */
(function(){
  'use strict';
  if(window.__mesahaEarlyOptimizerV527) return;
  window.__mesahaEarlyOptimizerV527=true;
  try{document.documentElement.classList.add('mesaha-boot-v527');}catch(e){}
  function ready(){try{document.documentElement.classList.remove('mesaha-boot-v527');document.documentElement.classList.add('mesaha-ready-v527');}catch(e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true,passive:true});else ready();
})();
