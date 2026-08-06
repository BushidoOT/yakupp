/* Mesaha İO V5.27 — Eski snapshot geri yükleme kaldırıldı.
   Silinen kayıtların geri gelmemesi için yalnızca revision tabanlı depolama kullanılır. */
(function(){
  'use strict';
  var api={
    __stable:true,__v527:true,
    recoverIfNeeded:function(){return window.MesahaStorageV527?window.MesahaStorageV527.recoverIntoApp():Promise.resolve({ok:false});},
    snapshot:function(){return window.MesahaStorageV527?window.MesahaStorageV527.flush():Promise.resolve(false);},
    quotaInfo:function(){return window.MesahaStorageV527?window.MesahaStorageV527.info():{};},
    refresh:function(){try{if(window.MesahaRenderStorageV382&&window.MesahaRenderStorageV382.renderAllSoon)window.MesahaRenderStorageV382.renderAllSoon();else if(typeof window.renderAll==='function')window.renderAll();}catch(e){}}
  };
  window.MesahaDataGuard=api;
})();
