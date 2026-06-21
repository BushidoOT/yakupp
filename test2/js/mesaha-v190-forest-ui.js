(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function readActiveUser(){
    try{
      var raw = localStorage.getItem('mesaha_kullanicilar_v1');
      if(!raw) return null;
      var store = JSON.parse(raw);
      var users = Array.isArray(store.users) ? store.users : [];
      return users.find(function(u){ return u && u.id === store.activeUserId; }) || users[0] || null;
    }catch(_){ return null; }
  }
  function firstName(name){
    return String(name || '').trim().split(/\s+/)[0] || '';
  }
  function applyUserTexts(){
    var user = readActiveUser();
    var h = document.querySelector('.home-hero-copy-v143 h2');
    if(h){
      var n = user && user.name ? firstName(user.name) : '';
      h.textContent = n ? ('Merhaba, ' + n + '!') : 'Merhaba!';
    }
    var p = document.querySelector('.home-hero-copy-v143 p');
    if(p) p.textContent = 'Bugün ormanda harika işlere imza atıyoruz.';
    var badge = $('activeUserBadge');
    if(badge && user && user.name){
      badge.textContent = firstName(user.name) + (user.seflik ? ' • ' + user.seflik : '');
      badge.style.display = 'inline-flex';
    }
  }
  function polishTexts(){
    var newTitle = document.querySelector('.entry-panel .panel-header h2');
    if(newTitle) newTitle.textContent = 'Yeni Kayıt';
    var recordsTitle = document.querySelector('.records-panel .panel-header h2');
    if(recordsTitle) recordsTitle.textContent = 'Beyan / Özet';
    var btn = $('submitBtn');
    if(btn && !btn.dataset.v190Text){ btn.textContent = 'Kayıt Oluştur'; btn.dataset.v190Text = '1'; }
    var productBtn = $('woodTypeSelectBtn');
    if(productBtn) productBtn.textContent = 'Odun Türü Seçenekleri';
    var rule = $('productRuleHint');
    if(rule) rule.textContent = 'Odun türleri resimsiz seçenek olarak gösterilir.';
    var guide = $('navGuide');
    if(guide) guide.textContent = 'Kılavuz';
  }
  function preventProductImages(){
    document.querySelectorAll('.product-box, .clean-product-v111').forEach(function(el){
      el.removeAttribute('style');
      el.querySelectorAll('img,svg,picture').forEach(function(x){ x.remove(); });
    });
  }
  function run(){
    document.body.classList.add('forest-ui-v190');
    applyUserTexts();
    polishTexts();
    preventProductImages();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, {once:true});
  else run();
  window.addEventListener('storage', applyUserTexts);
  setTimeout(run, 300);
  setTimeout(run, 1200);
  setTimeout(run, 2600);
  setInterval(function(){ applyUserTexts(); preventProductImages(); }, 3500);
})();
