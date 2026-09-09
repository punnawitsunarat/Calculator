'use strict';
// Bump when any bundled resource changes. The build script generates a content hash.
const CACHE = 'cal-shell-v1';
const ASSETS = ['/', '/style.css', '/preview.js', '/engine.js', '/natural.js', '/device.js', '/lcd.js', '/keys.js', '/reference.png', '/pwa.js', '/manifest.webmanifest', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('cal-shell-') && key !== CACHE).map(key => caches.delete(key)))));
});
// An existing session keeps its complete version until all its windows close.
// Do not force an update that could discard an unfinished calculation.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const path = event.request.mode === 'navigate' && url.pathname === '/' ? '/' : url.pathname;
  if (!ASSETS.includes(path)) return;
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(path)) || fetch(event.request)));
});
