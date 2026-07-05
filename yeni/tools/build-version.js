#!/usr/bin/env node
/* Mesaha İO küçük sürüm aracı. Kullanım: node tools/build-version.js V4.34 449 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const APP = process.argv[2] || 'V4.33';
const BUILD = Number(process.argv[3] || 448);
const VERSION = `v${BUILD}_manual_build`;
const CACHE_NAME = `mesaha-app-v${BUILD}-manual-build`;
const meta = {
  app: APP,
  version: VERSION,
  build: BUILD,
  visibleVersion: `${APP} •ExelanceX•`,
  shortVersion: `${APP} •ExelanceX•`,
  name: `Mesaha İO ${APP} •ExelanceX•`,
  cacheName: CACHE_NAME,
  builtAt: new Date().toISOString(),
  notes: 'Build script ile güncellendi.',
  assetVersion: String(BUILD)
};
function rw(rel, fn){
  const p=path.join(root,rel); if(!fs.existsSync(p)) return;
  fs.writeFileSync(p, fn(fs.readFileSync(p,'utf8')), 'utf8');
}
fs.writeFileSync(path.join(root,'version.json'), JSON.stringify(meta,null,2), 'utf8');
fs.writeFileSync(path.join(root,'js/version.js'), 'window.MESAHA_VERSION='+JSON.stringify(meta)+';\n', 'utf8');
rw('manifest.json', s=>{ const m=JSON.parse(s); m.name=meta.name; m.short_name=APP; m.start_url=`./index.html?v=${BUILD}`; return JSON.stringify(m,null,2); });
['index.html','admin.html','temizle.html','service-worker.js'].forEach(rel=>rw(rel, s=>s.replace(/\?v=\d+/g,`?v=${BUILD}`).replace(/V4\.\d+(?:\s*•ExelanceX•)?/g,`${APP} •ExelanceX•`).replace(/mesaha-app-v\d+-[a-z0-9-]+/g,CACHE_NAME)));
console.log(`Mesaha sürüm güncellendi: ${APP} / build ${BUILD}`);
