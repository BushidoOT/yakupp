(function(){
  'use strict';
  if (window.MesahaUtils && window.MesahaUtils.__v384) return;
  var bound = Object.create(null);
  function safe(fn, fallback){ try { return typeof fn === 'function' ? fn() : fallback; } catch(e){ return fallback; } }
  function clean(v){ return String(v == null ? '' : v).trim(); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]; }); }
  function qs(sel, root){ return (root || document).querySelector(sel); }
  function qsa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function byId(id){ return document.getElementById(id); }
  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function jsonGet(key, fallback){ try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; } }
  function jsonSet(key, value){
    try {
      localStorage.setItem(key, JSON.stringify(value));
      try { window.dispatchEvent(new CustomEvent('mesaha:json-set', {detail:{key:key}})); } catch(e) {}
      return true;
    } catch(e) {
      try { window.dispatchEvent(new CustomEvent('mesaha:storage-error', {detail:{key:key, message:e && e.message ? e.message : String(e)}})); } catch(_) {}
      return false;
    }
  }
  function debounce(key, fn, delay){
    clearTimeout(bound[key]);
    bound[key] = setTimeout(function(){ safe(fn); }, delay || 120);
  }
  function throttle(key, fn, delay){
    var now = Date.now(), item = bound[key] || {last:0, timer:0};
    var wait = Math.max(0, (delay || 300) - (now - item.last));
    clearTimeout(item.timer);
    if(wait === 0){ item.last = now; safe(fn); }
    else { item.timer = setTimeout(function(){ item.last = Date.now(); safe(fn); }, wait); }
    bound[key] = item;
  }
  function withTimeout(promise, ms, label){
    var t;
    return Promise.race([
      promise,
      new Promise(function(_, reject){ t = setTimeout(function(){ reject(new Error((label || 'İşlem') + ' zaman aşımı')); }, ms || 10000); })
    ]).finally(function(){ clearTimeout(t); });
  }
  function loadScript(src){
    var existing = document.querySelector('script[src="'+src+'"]');
    if(existing) return Promise.resolve(existing);
    return new Promise(function(resolve, reject){
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function(){ resolve(s); };
      s.onerror = function(){ reject(new Error('Script yüklenemedi: '+src)); };
      document.head.appendChild(s);
    });
  }
  function onceEvent(el, type, key, fn, opts){
    if(!el) return false;
    var prop = '__mesaha_' + (key || type);
    if(el[prop]) return false;
    el[prop] = true;
    el.addEventListener(type, fn, opts || false);
    return true;
  }
  window.MesahaUtils = {
    __v384:true,
    safe:safe, clean:clean, esc:esc, qs:qs, qsa:qsa, byId:byId, ready:ready,
    jsonGet:jsonGet, jsonSet:jsonSet, debounce:debounce, throttle:throttle,
    withTimeout:withTimeout, loadScript:loadScript, onceEvent:onceEvent
  };
})();
