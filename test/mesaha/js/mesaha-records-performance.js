(function(){
  'use strict';
  if(window.MesahaRecordsPerformance && window.MesahaRecordsPerformance.__v447) return;
  function state(){try{return window.state||null}catch(e){return null}}
  function info(){var s=state(), r=s&&Array.isArray(s.records)?s.records:[]; return {records:r.length, pageSize:20, recordsViewActive:!!(document.getElementById('recordsView')&&document.getElementById('recordsView').classList.contains('active'))};}
  window.MesahaRecordsPerformance={__v447:true,info:info,refresh:function(){try{if(window.mesahaInvalidateRecordStatsV447)window.mesahaInvalidateRecordStatsV447(); if(window.mesahaV303&&window.mesahaV303.records)window.mesahaV303.records();}catch(e){}}};
})();
