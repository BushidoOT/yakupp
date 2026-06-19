(function(root){
  'use strict';
  const info = {
    appName: 'v3.00',
    version: 'v300-clean',
    build: 'v300-clean',
    assetVersion: '300',
    visibleVersion: 'v3.00',
    shortVersion: 'v3.00',
    name: 'v3.00',
    cacheName: 'mesaha-app-v300-clean-rewrite',
    builtAt: '2026-06-20',
    notes: 'Kod tabanı temiz yeniden yazıldı; tekrar eden eski giriş/menü yamaları kaldırıldı. ORBİS XLS çekirdeği ayrı modüle alındı.'
  };
  root.MESAHA_VERSION = info;
  root.MESAHA_VERSION_TEXT = info.visibleVersion;
  root.MESAHA_VERSION_SHORT = info.shortVersion;
})(window);
