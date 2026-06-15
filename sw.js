/* Körperformen PWA - Service Worker
   Version bei Code-Aenderungen hochzaehlen, damit alte Caches geloescht werden. */
const VERSION = 'v3';
const CACHE_NAME = `kf-portal-${VERSION}`;

/* Dateien, die beim Install vorgeladen werden (schneller App-Start) */
const PRECACHE = [
  './intern.html',
  './manifest.json',
  './icon.svg',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Barlow:wght@300;400;500;600;700&display=swap',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(PRECACHE).catch(() => {})) // Einzelne Fehler ignorieren
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  /* Firebase-Live-Verbindungen (Auth, Firestore, Realtime DB) NIE cachen.
     Sonst sieht man veraltete Daten oder Login klappt nicht. */
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('identitytoolkit') ||
      url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('firebaseapp.com') ||
      url.hostname.includes('firebase.googleapis') ||
      url.hostname.includes('google-analytics.com') ||
      url.hostname.includes('gstatic.com/firebasejs') === false &&
        url.hostname.includes('google.com')) {
    return;
  }

  if (e.request.method !== 'GET') return;

  /* Stale-While-Revalidate: erst aus Cache (sofort!), parallel im Hintergrund aktualisieren */
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return response;
      }).catch(() => cached);

      return cached || networkFetch;
    })
  );
});
