/* StudioChat – Service Worker
   - Caching: HTML immer frisch (network-first), statische Dateien offline-fähig
   - Push: Firebase Cloud Messaging im Hintergrund
   Bei Code-Änderungen VERSION hochzählen. */
const VERSION = 'v5';
const CACHE = 'studiochat-' + VERSION;
const PRECACHE = ['./index.html', './konfig.js', './icon.svg'];

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Zugangsdaten aus konfig.js – dieselbe Datei, die auch die App lädt. Sie
// dürfen hier kein zweites Mal stehen, sonst pflegt man beim nächsten Kunden
// nur eine der beiden Stellen.
importScripts('./konfig.js');
firebase.initializeApp(KONFIG.firebase);
const messaging = firebase.messaging();

/* Aus DATEN bauen, nicht aus notification.

   Trug die Nachricht ein notification-Feld, zeigte der Browser sie im
   Hintergrund selbst an UND rief diese Funktion auf — zwei Meldungen
   fuer eine Nachricht. Aus dem Betrieb gemeldet als „kommen meistens
   sogar doppelt". Der Server schickt seit dem 19.8. reine Daten.

   Der Rueckfall auf payload.notification bleibt: waehrend des Ausrollens
   liegen noch Nachrichten alter Form unterwegs, und eine PWA aktualisiert
   ihren Service Worker nicht in derselben Sekunde. */
messaging.onBackgroundMessage(function (payload) {
  const d = (payload && payload.data) || {};
  const n = (payload && payload.notification) || {};
  const titel = d.title || n.title || 'StudioChat';
  const text = d.body || n.body || '';
  self.registration.showNotification(titel, {
    body: text, icon: 'icon.svg', badge: 'icon.svg',
    /* Die Marke haengt am INHALT, nicht an der Uhrzeit.

       Vorher stand hier Date.now() — damit war jede Marke einmalig und
       zwei gleiche Meldungen legten sich nebeneinander statt
       uebereinander. Mit dem Inhalt als Marke ersetzt eine identische
       Meldung die vorige, egal woher die zweite kam. Verschiedene
       Nachrichten stossen sich dabei nicht: sie haben andere Marken. */
    tag: 'kf-' + marke(titel + '|' + text)
  });
});
/* Kurze, stabile Zahl aus einer Zeichenkette. Kein Sicherheitszweck —
   sie muss nur fuer denselben Text immer gleich herauskommen. */
function marke(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
  return Math.abs(h).toString(36);
}
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
  // Manifest NIE cachen, damit start_url immer aktuell ist
  if (url.pathname.indexOf('manifest.json') >= 0) return;
  // Live-Verbindungen von Firebase/Google NIE cachen
  if (h.indexOf('googleapis.com') >= 0 || h.indexOf('firebaseio') >= 0 ||
      h.indexOf('identitytoolkit') >= 0 || h.indexOf('securetoken') >= 0 ||
      h.indexOf('google-analytics') >= 0 || h.indexOf('analytics.google') >= 0) return;

  // HTML/Navigation: erst Netz, offline aus dem Cache.
  // cache:'no-store' ist Pflicht — sonst liefert der Browser trotz „Netz
  // zuerst" bis zu zehn Minuten lang seine eigene Kopie (max-age aus der
  // Antwort des Hosters).
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then(function (r) {
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
