'use strict';
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Calculation remains available even if offline storage is unavailable.
      document.getElementById('install-hint').textContent = 'เพิ่มหน้าจอโฮมได้ · ออฟไลน์ยังไม่พร้อม';
    });
  });
}
