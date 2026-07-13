/* Mesaha İO V5.27 — Tek dokunma katmanı.
   Sentetik click/touchend/pointerup çoğaltması ve global 420ms kilit kaldırıldı. */
(function(){
  'use strict';
  if(window.__mesahaTouchV527)return;
  window.__mesahaTouchV527=true;
  var last=new WeakMap();
  function buttonOf(target){return target&&target.closest?target.closest('button,[role="button"],a.btn,[data-nav]'):null;}
  document.addEventListener('pointerdown',function(ev){var b=buttonOf(ev.target);if(!b||b.disabled)return;b.classList.add('mesaha-pressed-v527');},{passive:true,capture:true});
  document.addEventListener('pointerup',function(ev){var b=buttonOf(ev.target);if(b)b.classList.remove('mesaha-pressed-v527');},{passive:true,capture:true});
  document.addEventListener('pointercancel',function(ev){var b=buttonOf(ev.target);if(b)b.classList.remove('mesaha-pressed-v527');},{passive:true,capture:true});
  document.addEventListener('click',function(ev){
    var b=buttonOf(ev.target);if(!b||b.disabled)return;
    var t=Date.now(),prev=Number(last.get(b)||0);
    /* Yalnız aynı elemana gerçek çift tıklamayı engelle; farklı butonlar birbirini kilitlemez. */
    if(t-prev<260){ev.preventDefault();ev.stopImmediatePropagation();return;}
    last.set(b,t);
  },true);
  var style=document.createElement('style');style.id='mesaha-touch-v527-style';style.textContent='button,[role="button"],a.btn,[data-nav]{touch-action:manipulation;-webkit-tap-highlight-color:transparent}.mesaha-pressed-v527{transform:scale(.985);filter:brightness(.98)}';document.head.appendChild(style);
})();
