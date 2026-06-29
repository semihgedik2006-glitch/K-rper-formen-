/* StudioChat – Service Worker
   - Caching: HTML immer frisch (network-first), statische Dateien offline-fähig
   - Push: Firebase Cloud Messaging im Hintergrund
   Bei Code-Änderungen VERSION hochzählen. */
const VERSION = 'v1';
const CACHE = 'studiochat-' + VERSION;
const PRECACHE = ['./index.html', './manifest.json', './icon.svg'];

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAvYVUzTbT86jeH6bsCAS0PyK9ArNb6pRw",
  authDomain: "formenchat.firebaseapp.com",
  projectId: "formenchat",
  storageBucket: "formenchat.firebasestorage.app",
  messagingSenderId: "873830492257",
  appId: "1:873830492257:web:07fb34b80fd47c1873e220"
});
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const n = (payload && payload.notification) || {};
  self.registration.showNotification(n.title || 'StudioChat', {
    body: n.body || '', icon: 'icon.svg', badge: 'icon.svg', tag: 'kf-' + Date.now()
  });
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow('./index.html');
  }));
});

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(PRECACHE).catch(function () {}); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('message', function (e) { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const h = url.hostname;
  // Live-Verbindungen von Firebase/Google NIE cachen
  if (h.indexOf('googleapis.com') >= 0 || h.indexOf('firebaseio') >= 0 ||
      h.indexOf('identitytoolkit') >= 0 || h.indexOf('securetoken') >= 0 ||
      h.indexOf('google-analytics') >= 0 || h.indexOf('analytics.google') >= 0 ||
      h.indexOf('script.google') >= 0 || h.indexOf('script.googleusercontent') >= 0) return;

  // HTML/Navigation: immer zuerst Netz (kein „alte Version"-Problem), offline aus Cache
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function (r) {
        const cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); });
        return r;
      }).catch(function () { return caches.match(e.request).then(function (m) { return m || caches.match('./index.html'); }); })
    );
    return;
  }
  // Statische Dateien (Fonts, SDK, Icon): sofort aus Cache, im Hintergrund aktualisieren
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      const net = fetch(e.request).then(function (r) {
        if (r && r.status === 200 && r.type !== 'opaque') {
          const cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); });
        }
        return r;
      }).catch(function () { return cached; });
      return cached || net;
    })
  );
});
