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
    bildMaxKante: 1280,

    /* ── Mehrere Firmen (Stufe 2 aus MANDANT-PLAN.md) ──────────────────
       AUS lassen, bis der Umzug der Daten gelaufen ist.

       Bei false liegen die Daten flach: studios/…, channels/…, config/…
       Bei true liegen sie unter firmen/<kennung>/…

       Der Schalter und der Umzug gehören ZUSAMMEN. Wer ihn umlegt, ohne
       dass die Daten umgezogen sind, bekommt eine leere App — die Pfade
       zeigen dann auf Sammlungen, die es noch nicht gibt. Das ist der
       harmlose Fall. Der umgekehrte, Umzug ohne Schalter, lässt die App
       weiter auf den alten Daten arbeiten, während die neuen veralten;
       auch nicht gut. Deshalb: beides in einem Schritt, und vorher der
       Probelauf (PROBELAUF-EINRICHTEN.md). */
    mandant: false,

    /* Kennung DIESER Firma. Zählt nur, wenn mandant:true ist.
       Bestehende Konten ohne Feld "firma" gelten als zu dieser Firma
       gehörig — sonst wäre nach dem Umschalten niemand mehr drin. */
    firma: 'koerperformen',

    /* ── Rechtliches ────────────────────────────────────────────────────
       ACHTUNG: Solange hier etwas fehlt, zeigt die App im Rechtliches-
       Fenster einen deutlichen Hinweis, und der Chef sieht in
       Verwaltung → System eine Warnung. Das ist Absicht: eine App, die
       ein leeres Impressum als fertiges anzeigt, ist schlimmer als eine
       ohne.

       WAS ICH NICHT LEISTEN KANN: die Texte selbst. Ein Impressum nach
       § 5 DDG und eine Datenschutzerklärung nach Art. 13 DSGVO müssen zu
       EUREM Betrieb passen und gehören vor den ersten fremden Nutzer
       einmal anwaltlich durchgesehen. Was hier steht, ist ein Gerüst,
       kein Rechtstext. Siehe RECHT.md.

       Beim Verkauf an einen Kunden wird dieser Block ausgetauscht – wie
       alles andere in dieser Datei auch. */
    recht: {
      /* Impressum – Pflichtangaben nach § 5 DDG */
      betreiber: '',          // z. B. 'Körperformen Köln GmbH'
      anschrift: '',          // Straße, PLZ, Ort – ein Postfach genügt NICHT
      vertreten: '',          // Geschäftsführer / Inhaber
      telefon: '',
      email: '',              // muss existieren und gelesen werden
      register: '',           // z. B. 'Amtsgericht Köln, HRB 12345'
      ustId: '',              // falls vorhanden

      /* Datenschutz */
      datenschutzKontakt: '', // Ansprechpartner oder Datenschutzbeauftragter
      /* Zusätzliche Absätze, die nur ihr kennt – etwa eine
         Videoüberwachung im Studio oder ein Zeiterfassungssystem.
         Jeder Eintrag wird als eigener Absatz angezeigt. */
      zusatz: []
    }
  };

  global.KONFIG = KONFIG;

})(typeof self !== 'undefined' ? self : this);
