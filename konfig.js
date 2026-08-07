/* =====================================================================
 * StudioChat – KONFIGURATION
 * =====================================================================
 * Alles, was sich von Kunde zu Kunde unterscheidet, steht in DIESER Datei
 * und sonst nirgends. Für einen neuen Kunden: Datei kopieren, die Werte
 * unten austauschen, fertig.
 *
 * Vorher standen dieselben Firebase-Zugangsdaten in index.html UND in
 * sw.js. Beim zweiten Kunden wird eine der beiden Stellen garantiert
 * vergessen – und der Fehler fällt erst auf, wenn Push-Nachrichten beim
 * falschen Projekt landen.
 *
 * Die Datei wird von index.html per <script src> geladen und von sw.js
 * per importScripts – deshalb funktioniert sie in beiden Welten und darf
 * KEINE Browser-Objekte (document, window) benutzen.
 * ===================================================================== */
(function (global) {
  'use strict';

  var KONFIG = {

    /* ── Firma ──────────────────────────────────────────────────────── */
    firma: 'Körperformen',
    appName: 'StudioChat',

    /* ── Studios ────────────────────────────────────────────────────────
       ACHTUNG: nur HINTEN anhängen, nie umsortieren und nie löschen.
       Die Kennung in der Datenbank ist der Listenplatz ("studio-6").
       Wer die Reihenfolge ändert, ordnet allen bestehenden Daten ein
       anderes Studio zu. */
    studios: [
      'Longerich', 'Nippes', 'Ebertplatz', 'Rath', 'Porz', 'Rondorf',
      'Hürth', 'Brühl', 'Niederkassel Mondorf', 'Refrath', 'Overath',
      'Marialinden', 'Rösrath', 'Seelscheid'
    ],

    /* ── Firebase ───────────────────────────────────────────────────────
       Firebase-Konsole → Projekteinstellungen → Meine Apps → Web-App.
       Diese Werte sind öffentlich; geschützt wird über die
       Sicherheitsregeln, nicht über Geheimhaltung. */
    firebase: {
      apiKey: 'AIzaSyAvYVUzTbT86jeH6bsCAS0PyK9ArNb6pRw',
      authDomain: 'formenchat.firebaseapp.com',
      databaseURL: 'https://formenchat-default-rtdb.europe-west1.firebasedatabase.app',
      projectId: 'formenchat',
      storageBucket: 'formenchat.firebasestorage.app',
      messagingSenderId: '873830492257',
      appId: '1:873830492257:web:07fb34b80fd47c1873e220',
      measurementId: 'G-H0WMHW25QT'
    },

    /* Region der Cloud Functions – muss zur Firestore-Region passen */
    region: 'europe-west1',

    /* ── Push ───────────────────────────────────────────────────────────
       Firebase-Konsole → Projekteinstellungen → Cloud Messaging →
       Web Push-Zertifikate → Schlüsselpaar erzeugen.
       Leer lassen heißt: Fotos und Hinweise in der App funktionieren,
       aber keine Meldungen bei geschlossener App. */
    vapidKey: 'BG-Ibkh7PLobYuR7_q2HC63kh7krkKYDi7zUzIAjoiCddfGr1vwq0Kaq1yDNvP27twUprl4H8o8y-9TC58hn_yI',

    /* ── Google-Tabelle ─────────────────────────────────────────────────
       Adresse der Apps-Script-Web-App, siehe MATERIAL-SHEETS.gs.
       Leer lassen heißt: Material und Putzplan laufen normal, nur ohne
       automatische Tabelle. */
    sheetsWebhook: 'https://script.google.com/macros/s/AKfycbygK9l443-M3GBhVDYTZQ0tNkGRvSRWYMgeOn6ksNdBDLMb6uc21Vm_20XfyUeibXu_aw/exec',

    /* ── Verhalten ──────────────────────────────────────────────────────
       Erledigte einmalige Aufgaben verschwinden nach so vielen Stunden
       aus der aktiven Liste ins Archiv. Wiederkehrende bleiben davon
       unberührt. */
    archivNachStunden: 3,

    /* Erledigte einmalige PUTZaufgaben verschwinden nach so vielen
       Stunden ganz – auch aus der Google-Tabelle. */
    putzWegNachStunden: 24,

    /* Größte Kantenlänge für Fotos, die in der Datenbank landen. */
    bildMaxKante: 1280
  };

  global.KONFIG = KONFIG;

})(typeof self !== 'undefined' ? self : this);
