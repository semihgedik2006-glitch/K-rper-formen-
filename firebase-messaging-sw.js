/* Firebase Cloud Messaging – Service Worker
   Empfängt Push-Benachrichtigungen, wenn die App geschlossen oder im Hintergrund ist.
   Muss im selben Ordner wie intern.html liegen und über HTTPS erreichbar sein. */

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

const APP_ICON = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27192%27 height=%27192%27%3E%3Crect width=%27192%27 height=%27192%27 rx=%2742%27 fill=%27%230E1712%27/%3E%3Ctext x=%2750%25%27 y=%2756%25%27 font-family=%27Arial%27 font-size=%2784%27 font-weight=%27bold%27 fill=%27%2300E06E%27 text-anchor=%27middle%27 dominant-baseline=%27middle%27%3ESC%3C/text%3E%3C/svg%3E';

/* Hintergrund-Nachricht anzeigen */
messaging.onBackgroundMessage(function(payload){
  const n = (payload && payload.notification) || {};
  self.registration.showNotification(n.title || 'Körperformen', {
    body: n.body || '',
    icon: APP_ICON,
    badge: APP_ICON,
    tag: 'kf-' + Date.now()
  });
});

/* Klick auf die Benachrichtigung → App öffnen/fokussieren */
self.addEventListener('notificationclick', function(event){
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow('./intern.html');
    })
  );
});
