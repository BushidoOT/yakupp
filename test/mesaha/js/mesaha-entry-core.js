/* Mesaha İO V72 — dokunma, odak, ürün otomasyonu, klavye, Kaydet ve bildirim çekirdeği */

/* ===== mesaha-save-focus.js ===== */
/* Mesaha İO V5.84 — iOS/Android kayıt sonrası klavye ve ölçü alanı odak koruması. */
(function () {
  "use strict";
  if (window.__mesahaSaveFocusV583) return;
  window.__mesahaSaveFocusV583 = true;

  var INPUT_IDS = [
    "diameterInput",
    "lengthInput",
    "barcodeInput",
    "quantityInput",
  ];
  var lastInput = null;
  var lastSelection = null;
  var timers = [];
  var restoreToken = 0;

  function isMeasureInput(element) {
    return !!(element && INPUT_IDS.indexOf(element.id) >= 0);
  }

  function entryOpen() {
    var entry = document.getElementById("entryView");
    return !!(
      entry &&
      (entry.classList.contains("active") ||
        (document.body && document.body.classList.contains("entry-open")))
    );
  }

  function saveButtonFrom(target) {
    return target && target.closest
      ? target.closest("#floatingSaveBtnV531,#saveBtn")
      : null;
  }

  function isTouchLike(event) {
    if (!event) return false;
    if (event.type === "touchstart" || event.type === "touchend") return true;
    if (event.pointerType) return event.pointerType !== "mouse";
    try {
      return !!(
        window.matchMedia &&
        window.matchMedia("(hover: none) and (pointer: coarse)").matches
      );
    } catch (_error) {
      return false;
    }
  }

  function remember(input) {
    if (!isMeasureInput(input)) return;
    lastInput = input;
    try {
      lastSelection = {
        start: input.selectionStart,
        end: input.selectionEnd,
        direction: input.selectionDirection || "none",
      };
    } catch (_error) {
      lastSelection = null;
    }
  }

  function targetAfterSave() {
    var diameter = document.getElementById("diameterInput");
    if (diameter && !diameter.disabled && !diameter.readOnly) return diameter;
    if (
      lastInput &&
      document.documentElement.contains(lastInput) &&
      !lastInput.disabled &&
      !lastInput.readOnly
    )
      return lastInput;
    return null;
  }

  function focusElement(element, initialize) {
    if (!element || !entryOpen() || document.hidden) return false;
    try {
      element.focus({ preventScroll: true });
    } catch (_error) {
      try {
        element.focus();
      } catch (_innerError) {
        return false;
      }
    }
    try {
      if (initialize && element.id === "diameterInput") {
        element.setSelectionRange(0, 0);
      } else {
        var end = String(element.value || "").length;
        element.setSelectionRange(end, end);
      }
    } catch (_error) {}
    try {
      if (window.MesahaV537 && window.MesahaV537.syncFloatingSave)
        window.MesahaV537.syncFloatingSave();
    } catch (_error) {}
    return document.activeElement === element;
  }

  function clearTimers() {
    timers.forEach(function (timer) {
      clearTimeout(timer);
    });
    timers = [];
  }

  function restore(reason) {
    if (!entryOpen()) return false;
    clearTimers();
    var token = ++restoreToken;
    var element = targetAfterSave();
    if (!element) return false;

    /* Değer yalnız bir kez temizlenir. Gecikmeli iOS odak denemeleri, kullanıcı
       yazmaya başladıktan sonra yeni çapı silmez veya imleci başa taşımaz. */
    if (element.id === "diameterInput") element.value = "";
    var focusedOnce = false;

    var run = function () {
      if (token !== restoreToken || !entryOpen() || document.hidden) return;
      var active = document.activeElement;
      if (focusedOnce && active === element) return;
      if (focusedOnce && isMeasureInput(active) && active !== element) {
        clearTimers();
        return;
      }
      if (focusElement(element, !focusedOnce)) focusedOnce = true;
    };

    run();
    try {
      requestAnimationFrame(run);
    } catch (_error) {}
    [35, 90, 180, 320, 520].forEach(function (delay) {
      timers.push(setTimeout(run, delay));
    });
    try {
      window.dispatchEvent(
        new CustomEvent("mesaha:save-focus-restored", {
          detail: { reason: reason || "save", inputId: element.id },
        }),
      );
    } catch (_error) {}
    return true;
  }

  function preserveOnSavePress(event) {
    if (!saveButtonFrom(event.target) || !entryOpen()) return;
    var active = document.activeElement;
    if (!isMeasureInput(active)) active = lastInput;
    if (!isMeasureInput(active)) return;
    remember(active);

    /* Masaüstü fare tıklamasını değiştirme. Dokunmatik cihazda düğmenin odağı
       almasını engeller; mevcut pointerup/touchend kayıt işleyicisi çalışır. */
    if (!isTouchLike(event)) return;
    try {
      if (event.cancelable) event.preventDefault();
    } catch (_error) {}
    try {
      if (window.mesahaSound && window.mesahaSound.warm)
        window.mesahaSound.warm(event);
    } catch (_error) {}
  }

  document.addEventListener(
    "focusin",
    function (event) {
      if (isMeasureInput(event.target)) remember(event.target);
    },
    true,
  );
  document.addEventListener(
    "input",
    function (event) {
      if (isMeasureInput(event.target)) remember(event.target);
    },
    true,
  );
  document.addEventListener("pointerdown", preserveOnSavePress, {
    capture: true,
    passive: false,
  });
  document.addEventListener("touchstart", preserveOnSavePress, {
    capture: true,
    passive: false,
  });
  window.addEventListener(
    "mesaha:entry-save-complete",
    function () {
      restore("entry-save-complete");
    },
    { passive: true },
  );
  window.addEventListener(
    "pageshow",
    function () {
      if (entryOpen() && isMeasureInput(document.activeElement))
        remember(document.activeElement);
    },
    { passive: true },
  );
  document.addEventListener(
    "visibilitychange",
    function () {
      if (document.hidden) {
        restoreToken++;
        clearTimers();
      }
    },
    { passive: true },
  );

  window.MesahaSaveFocusV583 = {
    remember: remember,
    restore: restore,
    activeInput: function () {
      return isMeasureInput(document.activeElement)
        ? document.activeElement
        : lastInput;
    },
  };
})();

/* ===== mesaha-fast-tap-nav.js ===== */
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

/* ===== mesaha-ios-touch.js ===== */
/* Mesaha İO V5.76 — iPhone giriş ekranı tek dokunma ve odak köprüsü. */
(function(){
  'use strict';
  if(window.__mesahaIosTouchV576)return;
  window.__mesahaIosTouchV576=true;window.__mesahaIosTouchV542=true;window.__mesahaIosTouchV538=true;
  var ua=navigator.userAgent||'',isIOS=/iPad|iPhone|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);if(!isIOS)return;
  var usePointer=!!window.PointerEvent,gesture=null,lastHomeAt=0,bootTimer=0;
  function byId(id){return document.getElementById(id);}
  function now(){return Date.now();}
  function inputFrom(t){return t&&t.closest?t.closest('#diameterInput,#lengthInput,#barcodeInput,#quantityInput'):null;}
  function validInput(i){return !!(i&&!i.disabled&&!i.readOnly&&/^(diameterInput|lengthInput|barcodeInput|quantityInput)$/.test(i.id));}
  function focusInput(i){
    if(!validInput(i)||document.activeElement===i)return;
    try{i.focus({preventScroll:true});}catch(e){try{i.focus();}catch(_e){}}
    if(i.id==='barcodeInput'){try{var p=String(i.value||'').length;i.setSelectionRange(p,p);}catch(e){}}
  }
  function cleanKeyboardClasses(){var b=document.body,h=document.documentElement;['keyboard-open-v311','mesaha-entry-keyboard-open','mesaha-floating-save-open-v537','typing'].forEach(function(c){try{b&&b.classList.remove(c);h&&h.classList.remove(c);}catch(e){}});try{h.style.setProperty('--mesaha-kb-bottom-v537','0px');}catch(e){}}
  function hardHome(){try{var a=document.activeElement;if(a&&a.blur)a.blur();}catch(e){}cleanKeyboardClasses();try{if(typeof window.showView==='function')window.showView('home');else if(window.state)window.state.view='home';}catch(e){}try{window.scrollTo(0,0);}catch(e){}}
  function stop(ev){try{if(ev&&ev.cancelable)ev.preventDefault();if(ev){ev.stopPropagation();ev.stopImmediatePropagation();}}catch(e){}}
  function finish(ev,x,y,id){
    var g=gesture;gesture=null;if(!g||(id!=null&&g.id!==id)||g.moved)return;
    var end=ev.target;
    if(g.home){if(!(end&&end.closest&&end.closest('#entryHomeBtn')))return;lastHomeAt=now();stop(ev);hardHome();return;}
    var input=inputFrom(end);if(input&&input===g.input)focusInput(input);
  }
  function bind(){
    var entry=byId('entryView');if(!entry||entry.__iosTouchV576)return;entry.__iosTouchV576=true;
    if(usePointer){
      entry.addEventListener('pointerdown',function(ev){if(ev.pointerType==='mouse')return;var home=ev.target&&ev.target.closest&&ev.target.closest('#entryHomeBtn'),input=inputFrom(ev.target);gesture=home?{id:ev.pointerId,home:true,x:ev.clientX,y:ev.clientY,moved:false}:validInput(input)?{id:ev.pointerId,input:input,x:ev.clientX,y:ev.clientY,moved:false}:null;},{capture:true,passive:true});
      entry.addEventListener('pointermove',function(ev){if(gesture&&gesture.id===ev.pointerId&&(Math.abs(ev.clientX-gesture.x)>11||Math.abs(ev.clientY-gesture.y)>11))gesture.moved=true;},{capture:true,passive:true});
      entry.addEventListener('pointercancel',function(){gesture=null;},{capture:true,passive:true});
      entry.addEventListener('pointerup',function(ev){finish(ev,ev.clientX,ev.clientY,ev.pointerId);},{capture:true,passive:false});
    }else{
      entry.addEventListener('touchstart',function(ev){var t=ev.touches&&ev.touches[0],home=ev.target&&ev.target.closest&&ev.target.closest('#entryHomeBtn'),input=inputFrom(ev.target);gesture=t&&(home||validInput(input))?{home:!!home,input:input,x:t.clientX,y:t.clientY,moved:false}:null;},{capture:true,passive:true});
      entry.addEventListener('touchmove',function(ev){var t=ev.touches&&ev.touches[0];if(gesture&&t&&(Math.abs(t.clientX-gesture.x)>11||Math.abs(t.clientY-gesture.y)>11))gesture.moved=true;},{capture:true,passive:true});
      entry.addEventListener('touchcancel',function(){gesture=null;},{capture:true,passive:true});
      entry.addEventListener('touchend',function(ev){finish(ev,0,0,null);},{capture:true,passive:false});
    }
    entry.addEventListener('click',function(ev){if(ev.target&&ev.target.closest&&ev.target.closest('#entryHomeBtn')&&now()-lastHomeAt<900)stop(ev);},{capture:true,passive:false});
    ['diameterInput','lengthInput','barcodeInput','quantityInput'].forEach(function(id){var e=byId(id);if(e){e.classList.add('mesaha-ios-focus-v576');e.setAttribute('data-ios-focus-v576','1');}});
  }
  function boot(){clearTimeout(bootTimer);bind();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('pageshow',boot,{passive:true});window.addEventListener('orientationchange',function(){clearTimeout(bootTimer);bootTimer=setTimeout(boot,180);},{passive:true});
  window.MesahaIosTouchV576=window.MesahaIosTouchV542=window.MesahaIosTouchV538={home:hardHome,focus:focusInput,boot:boot,mode:usePointer?'pointer':'touch'};
})();

/* ===== mesaha-product-touch.js ===== */
/* Mesaha İO V5.77 — iPhone ürün kısayollarında klavyeyi açık tutan dokunma köprüsü. */
(function(){
  'use strict';
  if(window.__mesahaProductTouchV577)return;
  window.__mesahaProductTouchV577=true;
  window.__mesahaProductTouchV576=true;
  window.__mesahaProductTouchV542=true;
  window.__mesahaProductTouchV540=true;

  var ua=navigator.userAgent||'';
  var isIOS=/iPad|iPhone|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  var usePointer=isIOS&&!!window.PointerEvent;
  var lastHandledAt=0,lastHandledKey='',gesture=null,lastFocus=null,moveLimit=14;
  var PRODUCT={
    'Tomruk':{cls:'tomruk',rule:'Tomruk: çap 21 ve üzeri, boy en az 1,50 m olmalı.'},
    'Maden Direk':{cls:'maden',rule:'Maden: çap 20 ve altı olmalı.'},
    'Kağıtlık':{cls:'kagit',rule:'Kağıtlık: özel çap kilidi yok.'},
    'Sanayi Odunu':{cls:'sanayi',rule:'Sanayi: çap en az 12, boy 0,50 - 1,45 m olmalı.'},
    'Tel Direk':{cls:'tel',rule:'Tel: çap 12 - 40, boy 6,5 - 25 m olmalı.'}
  };

  function clean(v){return String(v==null?'':v).trim();}
  function normalize(v){
    var x=clean(v).toLocaleLowerCase('tr-TR');
    if(x==='tomruk')return'Tomruk';
    if(x==='maden'||x==='maden direk'||x==='maden direği'||x==='maden diregi')return'Maden Direk';
    if(x==='kağıtlık'||x==='kagitlik'||x==='kağıtlık odun'||x==='kagitlik odun')return'Kağıtlık';
    if(x==='sanayi'||x==='sanayi odunu')return'Sanayi Odunu';
    if(x==='tel'||x==='tel direk'||x==='tel direği'||x==='tel diregi')return'Tel Direk';
    return PRODUCT[v]?v:'Tomruk';
  }
  function buttonFrom(t){return t&&t.closest?t.closest('[data-product]'):null;}
  function appState(){return window.state&&window.state.settings?window.state:null;}
  function validEntryInput(input){
    return !!(input&&!input.disabled&&!input.readOnly&&/^(diameterInput|lengthInput|barcodeInput|quantityInput)$/.test(input.id));
  }
  function captureFocus(){
    var input=document.activeElement;
    if(!validEntryInput(input))return null;
    var snap={input:input,start:null,end:null,direction:null};
    try{snap.start=input.selectionStart;snap.end=input.selectionEnd;snap.direction=input.selectionDirection;}catch(e){}
    lastFocus=snap;
    return snap;
  }
  function restoreFocus(snap){
    snap=snap||lastFocus;
    if(!snap||!validEntryInput(snap.input)||!document.documentElement.contains(snap.input))return;
    var run=function(){
      try{snap.input.focus({preventScroll:true});}catch(e){try{snap.input.focus();}catch(_e){}}
      if(snap.start!=null){try{snap.input.setSelectionRange(snap.start,snap.end,snap.direction||'none');}catch(e){}}
    };
    run();
    requestAnimationFrame(run);
  }
  function stop(ev){
    try{
      if(ev&&ev.cancelable)ev.preventDefault();
      if(ev){ev.stopPropagation();ev.stopImmediatePropagation();}
    }catch(e){}
  }
  function updateVisual(key){
    var grid=document.getElementById('productButtons');
    if(grid)grid.querySelectorAll('[data-product]').forEach(function(btn){
      var active=normalize(btn.getAttribute('data-product'))===key;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',active?'true':'false');
      btn.setAttribute('tabindex','-1');
    });
    var hint=document.getElementById('productRuleHint');
    if(hint)hint.textContent=PRODUCT[key].rule;
    var body=document.body;
    if(body){
      ['tomruk','maden','kagit','sanayi','tel'].forEach(function(cls){body.classList.remove('product-'+cls+'-active');});
      body.classList.add('product-'+PRODUCT[key].cls+'-active');
    }
  }
  function persist(){
    try{
      if(typeof window.saveSettings==='function')window.saveSettings();
      else if(typeof window.__flushSettings==='function')window.__flushSettings('product-select');
    }catch(e){}
  }
  function applyProduct(raw,source){
    var key=normalize(raw),state=appState();
    if(!state||!PRODUCT[key])return false;
    var time=Date.now();
    if(lastHandledKey===key&&time-lastHandledAt<300)return true;
    lastHandledKey=key;
    lastHandledAt=time;
    state.settings.currentProduct=key;
    updateVisual(key);
    persist();
    try{window.dispatchEvent(new CustomEvent('mesaha:product-selected',{detail:{product:key,source:source||'tap'}}));}catch(e){}
    return true;
  }
  function finishGesture(ev,id){
    var current=gesture;
    gesture=null;
    var button=buttonFrom(ev&&ev.target);
    if(!current||(id!=null&&current.id!==id)||current.moved||button!==current.btn)return;
    if(applyProduct(button.getAttribute('data-product'),current.source)){
      stop(ev);
      restoreFocus(current.focus);
    }
  }
  function bind(){
    var grid=document.getElementById('productButtons');
    if(!grid||grid.__productTouchV577)return;
    grid.__productTouchV577=true;
    grid.querySelectorAll('[data-product]').forEach(function(btn){btn.setAttribute('tabindex','-1');});
    if(!isIOS)return;

    if(usePointer){
      grid.addEventListener('pointerdown',function(ev){
        if(ev.pointerType==='mouse')return;
        var button=buttonFrom(ev.target),focus=button?captureFocus():null;
        gesture=button?{id:ev.pointerId,btn:button,x:ev.clientX,y:ev.clientY,moved:false,focus:focus,source:'ios-pointerup'}:null;
        /* iOS'ta düğmenin odağı almasını engeller; açık klavye kapanmaz. */
        if(button&&focus&&ev.cancelable)ev.preventDefault();
      },{capture:true,passive:false});
      grid.addEventListener('pointermove',function(ev){
        if(gesture&&gesture.id===ev.pointerId&&(Math.abs(ev.clientX-gesture.x)>moveLimit||Math.abs(ev.clientY-gesture.y)>moveLimit))gesture.moved=true;
      },{capture:true,passive:true});
      grid.addEventListener('pointercancel',function(){gesture=null;},{capture:true,passive:true});
      grid.addEventListener('pointerup',function(ev){finishGesture(ev,ev.pointerId);},{capture:true,passive:false});
    }else{
      grid.addEventListener('touchstart',function(ev){
        var button=buttonFrom(ev.target),touch=ev.touches&&ev.touches[0],focus=button?captureFocus():null;
        gesture=button&&touch?{btn:button,x:touch.clientX,y:touch.clientY,moved:false,focus:focus,source:'ios-touchend'}:null;
        if(button&&focus&&ev.cancelable)ev.preventDefault();
      },{capture:true,passive:false});
      grid.addEventListener('touchmove',function(ev){
        var touch=ev.touches&&ev.touches[0];
        if(gesture&&touch&&(Math.abs(touch.clientX-gesture.x)>moveLimit||Math.abs(touch.clientY-gesture.y)>moveLimit))gesture.moved=true;
      },{capture:true,passive:true});
      grid.addEventListener('touchcancel',function(){gesture=null;},{capture:true,passive:true});
      grid.addEventListener('touchend',function(ev){finishGesture(ev,null);},{capture:true,passive:false});
    }

    grid.addEventListener('click',function(ev){
      var button=buttonFrom(ev.target);
      if(!button)return;
      var key=normalize(button.getAttribute('data-product'));
      if(lastHandledKey===key&&Date.now()-lastHandledAt<1000){
        stop(ev);
        restoreFocus(lastFocus);
      }
    },{capture:true,passive:false});
  }
  function boot(){
    bind();
    var state=appState();
    if(state)updateVisual(normalize(state.settings.currentProduct));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('pageshow',boot,{passive:true});
  window.MesahaProductTouchV577=window.MesahaProductTouchV576=window.MesahaProductTouchV542=window.MesahaProductTouchV540={
    apply:applyProduct,refresh:boot,isIOS:isIOS,mode:isIOS?(usePointer?'pointer':'touch'):'native-click',restoreFocus:restoreFocus
  };
})();


/* ===== mesaha-product-automation.js ===== */
/* Mesaha İO V72 — kullanıcı tercihini ezmeyen ölçüye göre ürün seçimi. */
(function installMesahaProductAutomation(root) {
  "use strict";
  if (!root || root.MesahaProductAutomationV72) return;

  var PRODUCTS = ["Tomruk", "Maden Direk", "Kağıtlık", "Sanayi Odunu", "Tel Direk"];
  var manualOverride = false;
  var manualBarcode = "";
  var scheduled = 0;
  var lastAutoProduct = "";
  var lastAutoAt = 0;
  var bound = false;

  function byId(id) { return document.getElementById(id); }
  function clean(value) { return String(value == null ? "" : value).trim(); }
  function numberValue(value) {
    var parsed = Number(clean(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  function normalizeProduct(value) {
    var name = clean(value).toLocaleLowerCase("tr-TR");
    if (name === "tomruk") return "Tomruk";
    if (/^maden( direk| direği| diregi)?$/.test(name)) return "Maden Direk";
    if (/^ka(ğ|g)ıtlık( odun)?$/.test(name)) return "Kağıtlık";
    if (name === "sanayi" || name === "sanayi odunu") return "Sanayi Odunu";
    if (/^tel( direk| direği| diregi)?$/.test(name)) return "Tel Direk";
    return PRODUCTS.indexOf(value) >= 0 ? value : "Tomruk";
  }
  function appState() {
    return root.state && root.state.settings ? root.state : null;
  }
  function currentBarcode() {
    var input = byId("barcodeInput");
    return clean(input ? input.value : appState() && appState().settings.barcode).toUpperCase();
  }
  function visible(settings, product) {
    var list = settings && Array.isArray(settings.visibleProducts)
      ? settings.visibleProducts.map(normalizeProduct)
      : [];
    return !list.length || list.indexOf(product) >= 0;
  }
  function exactLength(length, expected) {
    return Math.abs(Number(length || 0) - expected) < 0.0001;
  }
  function classify(diameter, length, settings) {
    var d = numberValue(diameter);
    var l = numberValue(length);
    if (!(l > 0 && l <= 50)) return "";

    /* Kullanıcının ayrı 2 / 2,50 ayarı yalnız boya bakar ve standart
       sınıflandırmadan önce gelir; çap daha sonra girilse de seçim korunur. */
    if (
      settings.autoPaperLengthEnabled === true &&
      visible(settings, "Kağıtlık") &&
      (exactLength(l, 2) || exactLength(l, 2.5))
    ) return "Kağıtlık";

    if (settings.autoProductStandardEnabled !== true) return "";
    if (!(d > 0 && d <= 200)) return "";

    /* Dar ve özel boy aralıkları önce değerlendirilir; ardından çap temelli
       Tomruk/Maden ayrımı yapılır. Gizlenen ürün türleri otomasyona katılmaz. */
    if (visible(settings, "Sanayi Odunu") && d >= 12 && l >= 0.5 && l <= 1.45)
      return "Sanayi Odunu";
    if (visible(settings, "Tel Direk") && d >= 12 && d <= 40 && l >= 6.5 && l <= 25)
      return "Tel Direk";
    if (visible(settings, "Tomruk") && d >= 21 && l >= 1.5)
      return "Tomruk";
    if (visible(settings, "Maden Direk") && d <= 20)
      return "Maden Direk";
    return "";
  }
  function resetManual(reason) {
    manualOverride = false;
    manualBarcode = currentBarcode();
    try {
      root.dispatchEvent(new CustomEvent("mesaha:product-automation-reset", {
        detail: { reason: reason || "reset", barcode: manualBarcode },
      }));
    } catch (_) {}
  }
  function markManual(reason) {
    manualOverride = true;
    manualBarcode = currentBarcode();
    try {
      root.dispatchEvent(new CustomEvent("mesaha:product-automation-manual", {
        detail: { reason: reason || "manual", barcode: manualBarcode },
      }));
    } catch (_) {}
  }
  function syncBarcodeLock() {
    var now = currentBarcode();
    if (!manualOverride) {
      manualBarcode = now;
      return;
    }
    /* Boş barkodda yapılan elle seçim, ilk barkod yazılırken korunur. Yalnız
       dolu bir barkoddan başka dolu bir barkoda geçiş yeni kayıt sayılır. */
    if (manualBarcode && now && manualBarcode !== now) resetManual("barcode-change");
  }
  function applyProduct(product, reason) {
    var state = appState();
    if (!state || !product || PRODUCTS.indexOf(product) < 0) return false;
    var current = normalizeProduct(state.settings.currentProduct);
    if (current === product) return true;
    var now = Date.now();
    if (lastAutoProduct === product && now - lastAutoAt < 180) return true;
    lastAutoProduct = product;
    lastAutoAt = now;
    var api = root.MesahaProductTouchV577 || root.MesahaProductTouchV576 || root.MesahaProductTouchV542;
    var applied = false;
    try {
      if (api && typeof api.apply === "function") applied = api.apply(product, "auto-standard") !== false;
    } catch (_) {}
    if (!applied) {
      state.settings.currentProduct = product;
      try { if (typeof root.saveSettings === "function") root.saveSettings(); } catch (_) {}
      try {
        root.dispatchEvent(new CustomEvent("mesaha:product-selected", {
          detail: { product: product, source: "auto-standard" },
        }));
      } catch (_) {}
      applied = true;
    }
    try {
      root.dispatchEvent(new CustomEvent("mesaha:product-auto-selected", {
        detail: { product: product, reason: reason || "measure-input" },
      }));
    } catch (_) {}
    return applied;
  }
  function run(reason) {
    scheduled = 0;
    var state = appState();
    if (!state || state.editingId) return false;
    syncBarcodeLock();
    if (manualOverride) return false;
    var diameterInput = byId("diameterInput");
    var lengthInput = byId("lengthInput");
    var target = classify(
      diameterInput ? diameterInput.value : state.settings.diameter,
      lengthInput ? lengthInput.value : state.settings.length,
      state.settings,
    );
    if (!target) return false;
    return applyProduct(target, reason);
  }
  function schedule(reason) {
    if (scheduled) return;
    scheduled = (root.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); })(function () {
      run(reason || "measure-input");
    });
  }
  function manualButton(event) {
    var button = event.target && event.target.closest
      ? event.target.closest("#productButtons [data-product]")
      : null;
    if (button) markManual("product-button");
  }
  function bind() {
    if (bound) return;
    bound = true;
    document.addEventListener("click", manualButton, true);
    document.addEventListener("input", function (event) {
      var id = event.target && event.target.id;
      if (id === "barcodeInput") {
        syncBarcodeLock();
        return;
      }
      if (id === "diameterInput" || id === "lengthInput") schedule("measure-input");
    }, false);
    document.addEventListener("click", function (event) {
      var target = event.target && event.target.closest
        ? event.target.closest("#clearBtn,#cancelEditBtn")
        : null;
      if (target) resetManual(target.id || "entry-reset");
    }, true);
    root.addEventListener("mesaha:product-selected", function (event) {
      var source = event && event.detail ? clean(event.detail.source) : "";
      if (source && source !== "auto-standard") markManual(source);
    }, { passive: true });
    root.addEventListener("mesaha:entry-save-complete", function () {
      resetManual("save-complete");
    }, { passive: true });
    root.addEventListener("mesaha:automation-settings-changed", function () {
      resetManual("settings-changed");
      schedule("settings-changed");
    }, { passive: true });
    root.addEventListener("mesaha:view-changed", function (event) {
      if (event && event.detail && event.detail.view === "entry") schedule("entry-open");
    }, { passive: true });
    root.addEventListener("pageshow", function () { schedule("pageshow"); }, { passive: true });
    setTimeout(function () { schedule("startup"); }, 80);
  }

  var api = Object.freeze({
    classify: classify,
    run: run,
    reset: resetManual,
    isManual: function () { return manualOverride; },
    currentBarcode: currentBarcode,
  });
  root.MesahaProductAutomationV72 = api;

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();
})(typeof window !== "undefined" ? window : null);

/* ===== mesaha-entry-runtime.js ===== */
/* Mesaha İO V72 — tek klavye, Kaydet, ürün kuralı ve yüksek kontrast bildirim motoru. */
(function installMesahaEntryRuntime(root) {
  "use strict";
  if (!root || root.MesahaEntryRuntimeV72) return;

  var INPUT_IDS = ["diameterInput", "lengthInput", "barcodeInput", "quantityInput"];
  var THEMES = {
    Tomruk: { key: "tomruk", label: "Tomruk", min: 1.5, max: 50 },
    "Maden Direk": { key: "maden", label: "Maden", min: 0.01, max: 50 },
    "Kağıtlık": { key: "kagit", label: "Kağıtlık", min: 0.01, max: 50 },
    "Sanayi Odunu": { key: "sanayi", label: "Sanayi", min: 0.5, max: 1.45 },
    "Tel Direk": { key: "tel", label: "Tel", min: 6.5, max: 25 },
  };
  var frame = 0;
  var hideTimer = 0;
  var toastTimer = 0;
  var lastFire = 0;
  var lastTouch = 0;
  var saveBusy = false;
  var warningAt = 0;
  var bound = false;

  function byId(id) { return document.getElementById(id); }
  function clean(value) { return String(value == null ? "" : value).trim(); }
  function normalizeProduct(value) {
    var name = clean(value).toLocaleLowerCase("tr-TR");
    if (name === "tomruk") return "Tomruk";
    if (/^maden( direk| direği| diregi)?$/.test(name)) return "Maden Direk";
    if (/^ka(ğ|g)ıtlık( odun)?$/.test(name)) return "Kağıtlık";
    if (name === "sanayi" || name === "sanayi odunu") return "Sanayi Odunu";
    if (/^tel( direk| direği| diregi)?$/.test(name)) return "Tel Direk";
    return THEMES[value] ? value : "Tomruk";
  }
  function currentProduct() {
    try {
      return normalizeProduct(root.state && root.state.settings && root.state.settings.currentProduct);
    } catch (_) { return "Tomruk"; }
  }
  function entryOpen() {
    var entry = byId("entryView");
    return !!(entry && entry.classList.contains("active"));
  }
  function validInput(node) { return !!(node && INPUT_IDS.indexOf(node.id) >= 0); }
  function focusedInput() { return validInput(document.activeElement); }
  function keyboardInset() {
    try {
      var vv = root.visualViewport;
      if (!vv) return 0;
      return Math.max(0, Math.round(root.innerHeight - vv.height - vv.offsetTop));
    } catch (_) { return 0; }
  }
  function saveWidth() {
    var width = Math.max(280, document.documentElement.clientWidth || root.innerWidth || 360);
    return Math.round(Math.max(112, Math.min(154, width * 0.31)));
  }
  function setVar(name, value) {
    document.documentElement.style.setProperty(name, value);
  }
  function moveFloatingToBody() {
    var button = byId("floatingSaveBtnV531");
    if (button && button.parentNode !== document.body) {
      try { document.body.appendChild(button); } catch (_) {}
    }
    return button;
  }
  function applyLengthRule() {
    var input = byId("lengthInput");
    if (!input) return;
    var product = currentProduct();
    var theme = THEMES[product] || THEMES.Tomruk;
    input.min = String(theme.min);
    input.max = String(theme.max);
    input.step = "0.01";
    input.dataset.productRule = product;
    if (product === "Tomruk") {
      input.setAttribute("aria-description", "Tomruk boyu en az 1,50 metre olmalıdır.");
    } else input.removeAttribute("aria-description");
  }
  function syncLayoutNow() {
    frame = 0;
    var original = byId("saveBtn");
    var floating = moveFloatingToBody();
    if (!original || !floating) return;
    var open = entryOpen() && focusedInput();
    var inset = open ? keyboardInset() : 0;
    var right = (document.documentElement.clientWidth || root.innerWidth || 360) <= 380 ? 8 : 10;
    var width = saveWidth();
    setVar("--mesaha-keyboard-inset-v71", inset + "px");
    setVar("--mesaha-save-right-v71", right + "px");
    setVar("--mesaha-save-width-v71", width + "px");
    document.body.classList.toggle("mesaha-entry-controls-open-v71", open);
    document.documentElement.classList.toggle("mesaha-entry-controls-open-v71", open);
    document.body.classList.toggle("mesaha-floating-save-open-v537", open);
    document.documentElement.classList.toggle("mesaha-floating-save-open-v537", open);
    floating.disabled = !!original.disabled;
    floating.setAttribute("aria-busy", original.getAttribute("aria-busy") === "true" ? "true" : "false");
    floating.textContent = clean(original.textContent) || "Kaydet";
    applyLengthRule();
    syncModalViewport();
  }
  function scheduleLayout() {
    if (frame) return;
    frame = (root.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); })(syncLayoutNow);
  }
  function fireSave(event, source) {
    if (event) {
      try {
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      } catch (_) {}
    }
    var now = Date.now();
    source = source || "click";
    if (source === "click" && now - lastTouch < 850) return false;
    if (saveBusy || now - lastFire < 230) return false;
    var original = byId("saveBtn");
    if (!original || original.disabled || original.getAttribute("aria-busy") === "true") return false;
    lastFire = now;
    if (source === "touch") lastTouch = now;
    saveBusy = true;
    try { original.click(); }
    catch (_) {
      try { if (typeof root.saveEntry === "function") root.saveEntry(); } catch (_error) {}
    }
    setTimeout(function () { saveBusy = false; scheduleLayout(); }, 180);
    return false;
  }
  function bindFloating() {
    var button = moveFloatingToBody();
    var original = byId("saveBtn");
    if (!button || !original || button.__mesahaV71Bound) return;
    button.__mesahaV71Bound = true;
    button.__v537Bound = true;
    button.__v531Bound = true;
    if (root.PointerEvent) {
      button.addEventListener("pointerdown", function (event) {
        if (event.pointerType !== "mouse") {
          try { event.preventDefault(); event.stopPropagation(); } catch (_) {}
        }
      }, { passive: false, capture: true });
      button.addEventListener("pointerup", function (event) {
        if (event.pointerType !== "mouse") return fireSave(event, "touch");
      }, { passive: false, capture: true });
      button.addEventListener("click", function (event) {
        return fireSave(event, "click");
      }, { passive: false, capture: true });
    } else {
      button.addEventListener("touchstart", function (event) {
        try { event.preventDefault(); event.stopPropagation(); } catch (_) {}
      }, { passive: false, capture: true });
      button.addEventListener("touchend", function (event) {
        return fireSave(event, "touch");
      }, { passive: false, capture: true });
      button.addEventListener("click", function (event) {
        return fireSave(event, "click");
      }, { passive: false, capture: true });
    }
    if (root.MutationObserver) {
      new MutationObserver(scheduleLayout).observe(original, {
        attributes: true,
        attributeFilter: ["disabled", "aria-busy"],
        childList: true,
        subtree: true,
      });
    }
  }
  function ensureToast() {
    var oldIds = ["saveFloatToastV310", "saveFloatToastV313", "saveFloatToastV314", "mesahaEntryToastV70"];
    oldIds.forEach(function (id) {
      var old = byId(id);
      if (old) old.remove();
    });
    var toast = byId("mesahaEntryToastV71");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "mesahaEntryToastV71";
      toast.className = "mesaha-entry-toast-v71";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      toast.innerHTML = '<span class="ico">✓</span><span class="txt"><b></b><small></small></span>';
      document.body.appendChild(toast);
    }
    return toast;
  }
  function showToast(title, detail, type, product) {
    var toast = ensureToast();
    var kind = clean(type || "warning").toLowerCase();
    var productName = product ? normalizeProduct(product) : "";
    var productTheme = productName && THEMES[productName];
    toast.className = "mesaha-entry-toast-v71 " +
      (kind === "success" ? "is-success" : kind === "error" ? "is-error" : "is-warning") +
      (productTheme ? " toast-product-" + productTheme.key : "");
    var icon = toast.querySelector(".ico");
    var heading = toast.querySelector("b");
    var small = toast.querySelector("small");
    if (icon) icon.textContent = kind === "success" ? "✓" : kind === "error" ? "!" : "⚠";
    if (heading) heading.textContent = clean(title) || (kind === "success" ? "Kayıt tamamlandı" : "Uyarı");
    if (small) small.textContent = clean(detail) || (kind === "success" ? "Eklendi" : "Kontrol et");
    scheduleLayout();
    toast.classList.remove("show");
    void toast.offsetWidth;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, kind === "success" ? 2800 : 3300);
    return toast;
  }
  function savedToast(record, wasEditing) {
    var rec = record || {};
    var product = normalizeProduct(rec.productType);
    var theme = THEMES[product] || THEMES.Tomruk;
    var title = [
      clean(rec.barcode),
      clean(rec.diameter) ? clean(rec.diameter) + "Ç" : "",
      clean(rec.length) ? clean(rec.length) + "B" : "",
      theme.label,
    ].filter(Boolean).join(" ");
    return showToast(title || "Kayıt", wasEditing ? "Güncellendi" : "Eklendi", "success", product);
  }
  function warningSound() {
    var now = Date.now();
    if (now - warningAt < 260) return false;
    warningAt = now;
    try {
      if (root.mesahaSound && typeof root.mesahaSound.warning === "function") return root.mesahaSound.warning();
      if (root.mesahaSoundFixV583 && typeof root.mesahaSoundFixV583.warning === "function") return root.mesahaSoundFixV583.warning();
    } catch (_) {}
    return false;
  }
  function destructiveTarget(target) {
    var button = target && target.closest ? target.closest("button,[role='button'],[data-del],[data-delete]") : null;
    if (!button) return false;
    var text = clean(button.textContent || button.getAttribute("aria-label"));
    return /sil|kaldır|kaldir|temizle|çıkar|cikar|oturumu kapat/i.test(text) || button.matches("[data-del],[data-delete]");
  }
  function modalOpen() {
    var overlay = byId("seflikSendOverlayV529");
    return !!(overlay && !overlay.classList.contains("hidden") && overlay.getAttribute("aria-hidden") !== "true");
  }
  function syncModalViewport() {
    var overlay = byId("seflikSendOverlayV529");
    var open = modalOpen();
    if (document.body) document.body.classList.toggle("seflik-send-open-v531", open);
    if (!overlay || !open) return;
    var vv = root.visualViewport;
    var height = Math.max(280, Math.round(vv ? vv.height : root.innerHeight));
    var top = Math.max(0, Math.round(vv ? vv.offsetTop : 0));
    setVar("--seflik-vv-height-v531", height + "px");
    setVar("--seflik-vv-top-v531", top + "px");
  }
  function applyTodayAndDraft() {
    try {
      var state = root.state && root.state.settings;
      if (state) {
        var date = new Date();
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        var today = date.toISOString().slice(0, 10);
        state.mesahaDate = today;
        var dateInput = byId("mesahaDate");
        if (dateInput && dateInput.value !== today) dateInput.value = today;
        var lengthInput = byId("lengthInput");
        if (lengthInput && state.length && !lengthInput.value) lengthInput.value = state.length;
      }
    } catch (_) {}
  }
  async function checkUpdateStatus() {
    var box = byId("updateStatusBox");
    if (!box) return;
    function set(text, cls) {
      box.classList.remove("update-available", "update-ok", "update-offline");
      if (cls) box.classList.add(cls);
      box.textContent = text;
    }
    if (root.MESAHA_SUITE_MODE) return set("Güncelleme ve offline hazırlık Orman İO tarafından yönetilir.", "update-ok");
    if (!navigator.onLine) return set("Offline: sürüm kontrolü internet gelince yapılır.", "update-offline");
    try {
      if (!root.MesahaVersion || typeof root.MesahaVersion.fetchRemote !== "function") throw new Error("Sürüm merkezi hazır değil");
      var remote = await root.MesahaVersion.fetchRemote();
      var current = root.MESAHA_VERSION || {};
      var newer = Number(remote.build || 0) > Number(current.build || 0);
      var label = remote.visibleVersion || remote.app || remote.version || "Yeni sürüm";
      set(newer ? "Yeni sürüm hazır: " + label + " — Güncelle butonuna bas." : "Uygulama güncel: " + (current.visibleVersion || label), newer ? "update-available" : "update-ok");
    } catch (_) {
      var local = root.MESAHA_VERSION || {};
      set("Uygulama yerelden doğrulandı: " + (local.visibleVersion || local.shortVersion || "Mesaha İO"), "update-ok");
    }
  }
  function ensureViewportMode() {
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    var content = meta.getAttribute("content") || "";
    if (!/interactive-widget=/i.test(content)) meta.setAttribute("content", content.replace(/\s+$/g, "") + ", interactive-widget=resizes-content");
  }
  function bind() {
    if (bound) return;
    bound = true;
    ensureViewportMode();
    bindFloating();
    ensureToast();
    applyTodayAndDraft();
    applyLengthRule();
    document.addEventListener("focusin", function (event) {
      if (!validInput(event.target)) return;
      clearTimeout(hideTimer);
      scheduleLayout();
    }, true);
    document.addEventListener("focusout", function () {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(scheduleLayout, 180);
    }, true);
    document.addEventListener("click", function (event) {
      if (event.target && event.target.closest && event.target.closest("#productButtons [data-product]")) {
        setTimeout(function () { applyLengthRule(); scheduleLayout(); }, 0);
      }
    }, true);
    document.addEventListener("pointerup", function (event) {
      if (event.isTrusted && destructiveTarget(event.target)) warningSound();
    }, true);
    root.addEventListener("mesaha:product-selected", function () {
      applyLengthRule();
      scheduleLayout();
    }, { passive: true });
    root.addEventListener("mesaha:settings-saved", applyLengthRule, { passive: true });
    root.addEventListener("mesaha:entry-save-complete", function () {
      saveBusy = false;
      scheduleLayout();
    }, { passive: true });
    root.addEventListener("online", checkUpdateStatus, { passive: true });
    root.addEventListener("offline", checkUpdateStatus, { passive: true });
    root.addEventListener("resize", scheduleLayout, { passive: true });
    root.addEventListener("orientationchange", scheduleLayout, { passive: true });
    root.addEventListener("pageshow", function () {
      applyTodayAndDraft();
      scheduleLayout();
    }, { passive: true });
    if (root.visualViewport) {
      root.visualViewport.addEventListener("resize", scheduleLayout, { passive: true });
      root.visualViewport.addEventListener("scroll", scheduleLayout, { passive: true });
    }
    try {
      if (navigator.virtualKeyboard && typeof navigator.virtualKeyboard.addEventListener === "function") {
        navigator.virtualKeyboard.addEventListener("geometrychange", scheduleLayout, { passive: true });
      }
    } catch (_) {}
    var overlay = byId("seflikSendOverlayV529");
    if (overlay && root.MesahaUiHub) root.MesahaUiHub.watchClass(overlay, syncModalViewport);
    var entry = byId("entryView");
    if (entry && root.MesahaUiHub) root.MesahaUiHub.watchClass(entry, scheduleLayout);
    setTimeout(checkUpdateStatus, 1200);
    scheduleLayout();
  }

  root.mesahaFloatToastV314 = showToast;
  root.mesahaFloatToastV315 = showToast;
  root.mesahaV310SavedToast = savedToast;
  root.MesahaProductionStabilizer = {
    positionSave: scheduleLayout,
    warning: warningSound,
  };
  root.MesahaV537 = {
    fireFloatingSave: fireSave,
    syncFloatingSave: scheduleLayout,
    syncModalViewport: syncModalViewport,
  };
  var entryRuntimeApi = Object.freeze({
    sync: scheduleLayout,
    showToast: showToast,
    savedToast: savedToast,
    applyLengthRule: applyLengthRule,
    fireSave: fireSave,
  });
  root.MesahaEntryRuntimeV72 = entryRuntimeApi;
  root.MesahaEntryRuntimeV71 = entryRuntimeApi;
  root.MesahaEntryRuntimeV70 = entryRuntimeApi;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();
})(typeof window !== "undefined" ? window : null);
