(function (root) {
  "use strict";

  var loaded = Object.create(null);
  var loading = Object.create(null);

  function loadScript(key, src) {
    if (loaded[key]) return Promise.resolve(true);
    if (loading[key]) return loading[key];
    loading[key] = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.mesahaLazyFeature = key;
      script.onload = function () {
        loaded[key] = true;
        delete loading[key];
        resolve(true);
      };
      script.onerror = function () {
        delete loading[key];
        reject(new Error(key + " özelliği yüklenemedi."));
      };
      document.head.appendChild(script);
    });
    return loading[key];
  }

  function loadXlsConverter() {
    return loadScript("xls-backup-converter", "./js/mesaha-xls-backup-converter.js?v=83.0.0");
  }

  document.addEventListener("click", function (event) {
    var target = event.target && event.target.closest && event.target.closest("#xlsToBackupBtnV590");
    if (target) loadXlsConverter().catch(function () {});
  }, true);

  root.MesahaLazyFeatures = Object.freeze({ loadXlsConverter: loadXlsConverter });
})(window);
