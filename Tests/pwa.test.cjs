const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
test('deployable bundle contains every offline resource and installs atomically',async()=>{
  const events={},stored=new Map(),deleted=[];
  const cache={addAll:async paths=>{for(const p of paths){const file='dist/'+(p==='/'?'index.html':p.slice(1));assert.ok(fs.existsSync(file),file);stored.set(p,fs.readFileSync(file));}},match:async p=>stored.get(p)};
  const context={URL,self:{location:{origin:'https://cal.example'},addEventListener:(name,fn)=>events[name]=fn},caches:{open:async()=>cache,keys:async()=>['cal-shell-old','unrelated-app'],delete:async k=>deleted.push(k)},fetch:async()=>{throw Error('offline');}};
  vm.runInNewContext(fs.readFileSync('dist/sw.js','utf8'),context);
  let pending;events.install({waitUntil:p=>pending=p});await pending;
  events.activate({waitUntil:p=>pending=p});await pending;assert.deepEqual(deleted,['cal-shell-old']);
  for(const path of ['/','/engine.js','/reference.png']){events.fetch({request:{url:'https://cal.example'+path,method:'GET',mode:path==='/'?'navigate':'cors'},respondWith:p=>pending=p});assert.ok((await pending).length);}
  const manifest=JSON.parse(fs.readFileSync('dist/manifest.webmanifest'));assert.equal(manifest.display,'standalone');for(const icon of manifest.icons)assert.ok(stored.has(icon.src));
});
