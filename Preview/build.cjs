const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const destination = path.resolve(__dirname, '../dist');
const files = ['index.html', 'style.css', 'preview.js', 'natural.js', 'device.js', 'lcd.js', 'keys.js', 'reference.png', 'pwa.js', 'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'];
fs.mkdirSync(destination, {recursive:true});
const hash = crypto.createHash('sha256');
for (const file of files) {
  const data = fs.readFileSync(path.join(__dirname, file));
  hash.update(file).update(data);
  fs.writeFileSync(path.join(destination, file), data);
}
const engine = fs.readFileSync(path.join(__dirname, '../CaLSimulator/Resources/engine.js'));
hash.update(engine);
fs.writeFileSync(path.join(destination, 'engine.js'), engine);
const worker = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');
hash.update(worker);
fs.writeFileSync(path.join(destination, 'sw.js'), worker.replace('cal-shell-v1', 'cal-shell-'+hash.digest('hex').slice(0,16)));
console.log('Static PWA ready: '+destination+' (host at the root of an HTTPS site)');
