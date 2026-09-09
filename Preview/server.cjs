const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const routes = {
  '/manifest.webmanifest': ['manifest.webmanifest','application/manifest+json'],
  '/sw.js': ['sw.js','text/javascript; charset=utf-8'],
  '/pwa.js': ['pwa.js','text/javascript; charset=utf-8'],
  '/apple-touch-icon.png': ['apple-touch-icon.png','image/png'],
  '/icon-192.png': ['icon-192.png','image/png'],
  '/icon-512.png': ['icon-512.png','image/png'],
  '/': ['index.html','text/html; charset=utf-8'],
  '/style.css': ['style.css','text/css; charset=utf-8'],
  '/preview.js': ['preview.js','text/javascript; charset=utf-8'],
  '/natural.js': ['natural.js','text/javascript; charset=utf-8'],
  '/device.js': ['device.js','text/javascript; charset=utf-8'],
  '/lcd.js': ['lcd.js','text/javascript; charset=utf-8'],
  '/keys.js': ['keys.js','text/javascript; charset=utf-8'],
  '/reference.png': ['reference.png','image/png'],
  '/engine.js': ['../CaLSimulator/Resources/engine.js','text/javascript; charset=utf-8']
};
const server = http.createServer((req,res)=>{
  const route = routes[new URL(req.url,'http://localhost').pathname];
  if (!route) {res.writeHead(404);res.end('Not found');return;}
  fs.readFile(path.join(__dirname,route[0]),(error,data)=>{
    if(error){res.writeHead(500);res.end('Preview file missing');return;}
    res.writeHead(200,{'Content-Type':route[1],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);
  });
});
server.listen(5800,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:5800'));
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
