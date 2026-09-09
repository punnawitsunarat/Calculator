const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
for(const base of ['/', '/Calculator/'])test('offline bundle and cache isolation at '+base,async()=>{
  const events={},stored=new Map(),deleted=[];
  const origin='https://cal.example',scope=origin+base,old='cal-shell-'+base+'-old';
  const cache={addAll:async paths=>{for(const p of paths){assert.ok(p.startsWith(scope));const relative=p.slice(scope.length);const file='dist/'+(relative||'index.html');assert.ok(fs.existsSync(file),file);stored.set(p,fs.readFileSync(file));}},match:async p=>stored.get(p)};
  const context={URL,self:{location:{origin,href:scope+'sw.js'},addEventListener:(name,fn)=>events[name]=fn},caches:{open:async()=>cache,keys:async()=>[old,'cal-shell-/OtherApp/-old','unrelated-app'],delete:async k=>deleted.push(k)},fetch:async()=>{throw Error('offline');}};
  vm.runInNewContext(fs.readFileSync('dist/sw.js','utf8'),context);
  let pending;events.install({waitUntil:p=>pending=p});await pending;
  events.activate({waitUntil:p=>pending=p});await pending;assert.deepEqual(deleted,[old]);
  for(const path of ['', 'engine.js','reference.png']){events.fetch({request:{url:scope+path,method:'GET',mode:path===''?'navigate':'cors'},respondWith:p=>pending=p});assert.ok((await pending).length);}
  const manifest=JSON.parse(fs.readFileSync('dist/manifest.webmanifest'));assert.equal(manifest.display,'standalone');for(const icon of manifest.icons)assert.ok(stored.has(new URL(icon.src,scope).href));
  assert.equal(new URL(manifest.start_url,scope).href,scope);
  const html=fs.readFileSync('dist/index.html','utf8');assert.doesNotMatch(html,/(?:src|href)="\/(?!\/)/);
});
