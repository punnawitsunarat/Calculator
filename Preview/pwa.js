'use strict';
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Calculation remains available even if offline storage is unavailable.
      console.warn('Offline cache unavailable; calculator remains usable online.');
    });
  });
}
